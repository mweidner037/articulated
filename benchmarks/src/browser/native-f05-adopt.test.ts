import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { NativeF05 } from "./native-f05";

type Page = {
  columns: { bunchIds: string[]; counts: number[] };
  starts: Float64Array;
  from: number;
  to: number;
};
const pages = (list: NativeF05) => (list as unknown as { pages: Page[] }).pages;
const fixture = (rows: number): SavedIdList =>
  Array.from({ length: rows }, (_, i) => ({
    bunchId: `id${i.toString(36).padStart(6, "0")}`,
    startCounter: 2 ** 40,
    count: 4,
    isDeleted: false,
  }));

function sliceCounts(edit: () => NativeF05) {
  let arrays = 0,
    counters = 0;
  const arraySlice = Array.prototype.slice;
  const counterSlice = Float64Array.prototype.slice;
  try {
    Array.prototype.slice = function (start, end) {
      arrays++;
      return arraySlice.call(this, start, end);
    };
    Float64Array.prototype.slice = function (start, end) {
      counters++;
      return counterSlice.call(this, start, end);
    };
    const list = edit();
    return { arrays, counters, list };
  } finally {
    Array.prototype.slice = arraySlice;
    Float64Array.prototype.slice = counterSlice;
  }
}

test("single-page edit adoption removes exactly the redundant column and counter slices", () => {
  const saved = fixture(8),
    wire = toTransposedOmit(saved);
  const baseline = NativeF05.load(wire, { ownership: "owned", pageSize: 16 });
  const adopted = NativeF05.load(wire, {
    ownership: "owned",
    pageSize: 16,
    adoptEdits: true,
  });
  const id = { bunchId: "inserted", counter: 2 ** 42 };
  for (const operation of [
    (list: NativeF05) => list.insertAfter(list.at(5), id),
    (list: NativeF05) => list.delete(list.at(5)),
  ]) {
    const original = sliceCounts(() => operation(baseline));
    const optimized = sliceCounts(() => operation(adopted));
    assert.equal(original.arrays - optimized.arrays, 2);
    assert.equal(original.counters - optimized.counters, 1);
    assert.deepEqual(optimized.list.save(), original.list.save());
    assert.notEqual(
      pages(optimized.list)[0].columns,
      pages(adopted)[0].columns,
    );
    assert.notEqual(
      pages(optimized.list)[0].starts.buffer,
      pages(adopted)[0].starts.buffer,
    );
  }
  assert.deepEqual(adopted.save(), saved);
  // Owned load still copies original input, including when it fits one page.
  wire.counts.fill(99);
  wire.bunchIds.fill("mutated!");
  assert.deepEqual(adopted.save(), saved);
  assert.deepEqual(baseline.save(), saved);
});

test("split edits retain independently owned bounded backing arrays", () => {
  const saved = fixture(8);
  const options = { ownership: "owned" as const, pageSize: 8 };
  const baseline = NativeF05.load(toTransposedOmit(saved), options);
  const adopted = NativeF05.load(toTransposedOmit(saved), {
    ...options,
    adoptEdits: true,
  });
  const edit = (list: NativeF05) =>
    list.insertAfter(list.at(5), { bunchId: "inserted", counter: 0 });
  const original = sliceCounts(() => edit(baseline));
  const optimized = sliceCounts(() => edit(adopted));
  assert.equal(optimized.arrays, original.arrays);
  assert.equal(optimized.counters, original.counters);
  const split = pages(optimized.list);
  assert.equal(split.length, 2);
  assert.equal(new Set(split.map((p) => p.columns.counts)).size, 2);
  assert.equal(new Set(split.map((p) => p.columns.bunchIds)).size, 2);
  assert.equal(new Set(split.map((p) => p.starts.buffer)).size, 2);
  for (const page of split) {
    assert.equal(page.from, 0);
    assert.equal(page.columns.counts.length, page.to);
    assert.equal(page.starts.length, page.to);
    assert.equal(page.starts.buffer.byteLength, page.to * 8);
    assert(page.to <= 8);
  }
  assert.deepEqual(optimized.list.save(), original.list.save());
});

test("adopted edit pages preserve branching history, exact lookup and filters", () => {
  for (const ownership of ["owned", "shared"] as const)
    for (const pageIdFilter of [false, true]) {
      const saved = fixture(40);
      let list = NativeF05.load(toTransposedOmit(saved), {
        ownership,
        pageSize: 8,
        pageIdFilter,
        adoptEdits: true,
      });
      let reference = IdList.load(saved);
      const history: [NativeF05, SavedIdList][] = [];
      for (let step = 0; step < 80; step++) {
        history.push([list, list.save()]);
        const at = reference.at((step * 19) % reference.length);
        if (step % 2) {
          const id = {
            bunchId: `new${step.toString(36).padStart(5, "0")}`,
            counter: 2 ** 44,
          };
          list = list.insertAfter(at, id, 2);
          reference = reference.insertAfter(at, id, 2);
        } else {
          list = list.delete(at, 2);
          reference = reference.delete(at, 2);
        }
        assert.deepEqual(list.save(), reference.save());
        for (const run of reference.save())
          for (const bias of ["none", "left", "right"] as const) {
            const id = { bunchId: run.bunchId, counter: run.startCounter };
            assert.equal(list.indexOf(id, bias), reference.indexOf(id, bias));
          }
      }
      for (const [old, expected] of history) {
        assert.deepEqual(old.save(), expected);
        assert.deepEqual(
          old.insertAfter(null, { bunchId: "branched", counter: 0 }).save(),
          IdList.load(expected)
            .insertAfter(null, { bunchId: "branched", counter: 0 })
            .save(),
        );
        assert.deepEqual(old.save(), expected);
      }
    }
});

test("adoptEdits validates option and leaves empty/no-op semantics unchanged", () => {
  const wire = toTransposedOmit([]);
  assert.throws(() =>
    NativeF05.load(wire, { adoptEdits: 1 as unknown as boolean }),
  );
  const list = NativeF05.load(wire, { ownership: "owned", adoptEdits: true });
  const id = { bunchId: "abcdefgh", counter: 0 };
  assert.equal(list.insertAfter(null, id, 0), list);
  assert.equal(list.delete(id, 0), list);
  assert.deepEqual(list.insertAfter(null, id, 3).save(), [
    { bunchId: id.bunchId, startCounter: 0, count: 3, isDeleted: false },
  ]);
});
