import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { NativeF05 } from "./native-f05";

type PageView = {
  idFilter?: Uint32Array;
  byId: Map<string, number | number[]>;
};
const pages = (list: NativeF05) =>
  (list as unknown as { pages: PageView[] }).pages;
const fixture = (): SavedIdList =>
  Array.from({ length: 160 }, (_, i) => ({
    bunchId: `id${i.toString(36).padStart(6, "0")}`,
    startCounter: 2 ** 40,
    count: 4,
    isDeleted: i % 9 === 0,
  }));

test("optional page filters preserve opaque IDs, large counters, splits and retained versions", () => {
  for (const ownership of ["shared", "owned"] as const) {
    const saved = fixture();
    let filtered = NativeF05.load(toTransposedOmit(saved), {
      ownership,
      pageSize: 8,
      pageIdFilter: true,
    });
    let baseline = NativeF05.load(toTransposedOmit(saved), {
      ownership,
      pageSize: 8,
    });
    let reference = IdList.load(saved);
    assert(pages(baseline).every((page) => page.idFilter === undefined));
    assert(pages(filtered).every((page) => page.idFilter?.byteLength === 64));
    const versions: [NativeF05, SavedIdList][] = [];
    for (let edit = 0; edit < 120; edit++) {
      if (edit % 10 === 0) versions.push([filtered, filtered.save()]);
      if (edit % 3) {
        const runs = reference.save(),
          run = runs[(edit * 31) % runs.length];
        const before =
          edit % 11
            ? { bunchId: run.bunchId, counter: run.startCounter }
            : null;
        const id = {
          bunchId: `new${edit.toString(36).padStart(5, "0")}`,
          counter: 2 ** 42,
        };
        filtered = filtered.insertAfter(before, id, 3);
        baseline = baseline.insertAfter(before, id, 3);
        reference = reference.insertAfter(before, id, 3);
      } else {
        const id = reference.at((edit * 17) % reference.length);
        filtered = filtered.delete(id, 3);
        baseline = baseline.delete(id, 3);
        reference = reference.delete(id, 3);
      }
      assert.deepEqual(filtered.save(), reference.save());
      assert.deepEqual(filtered.save(), baseline.save());
      assert.deepEqual(filtered.wireState, baseline.wireState);
      for (const run of reference.save()) {
        const id = { bunchId: run.bunchId, counter: run.startCounter };
        for (const bias of ["none", "left", "right"] as const)
          assert.equal(filtered.indexOf(id, bias), reference.indexOf(id, bias));
      }
    }
    for (const [version, expected] of versions)
      assert.deepEqual(version.save(), expected);
    const old = versions[0][0],
      oldPages = pages(old);
    const changed = old.insertAfter(old.at(15), {
      bunchId: "othernew",
      counter: 0,
    });
    assert.equal(
      oldPages.filter((page) => pages(changed).includes(page)).length,
      oldPages.length - 1,
    );
    assert.deepEqual(old.save(), saved);
    assert.deepEqual(
      NativeF05.load(structuredClone(filtered.wireState), {
        pageIdFilter: true,
      }).save(),
      reference.save(),
    );
  }
});

test("saturated filters and false positives still require exact ID and counter checks", () => {
  const saved = fixture();
  const native = NativeF05.load(toTransposedOmit(saved), {
    pageSize: 8,
    pageIdFilter: true,
  });
  // Force the maximum possible collision rate: every queried string passes.
  // This only adds false positives; it cannot invalidate a membership filter.
  for (const page of pages(native)) page.idFilter!.fill(0xffffffff);
  const id = { bunchId: saved[1].bunchId, counter: 2 ** 40 };
  assert.equal(native.indexOf(id), 0);
  assert.throws(
    () => native.indexOf({ bunchId: "missing!", counter: 0 }),
    /Unknown ID/,
  );
  assert.throws(() => native.indexOf({ ...id, counter: 0 }), /Unknown ID/);
  assert.throws(() => native.insertAfter(null, id), /Duplicate IDs/);
  assert.equal(native.delete({ bunchId: "missing!", counter: 0 }), native);
  const next = native.insertAfter(id, { bunchId: "missing!", counter: 0 }, 2);
  assert.deepEqual(
    next.save(),
    IdList.load(saved)
      .insertAfter(id, { bunchId: "missing!", counter: 0 }, 2)
      .save(),
  );
  assert.deepEqual(native.save(), saved);
});

test("filters skip Map probes without altering unknown-ID, empty and no-op semantics", () => {
  const native = NativeF05.load(toTransposedOmit(fixture()), {
    pageSize: 8,
    pageIdFilter: true,
  });
  let probes = 0;
  for (const page of pages(native)) {
    const get = page.byId.get.bind(page.byId);
    page.byId.get = (key) => {
      probes++;
      return get(key);
    };
  }
  const id = { bunchId: "unknown!", counter: 0 };
  assert.throws(() => native.indexOf(id), /Unknown ID/);
  assert(probes < pages(native).length);
  assert.equal(native.delete(id, 0), native);
  assert.equal(native.insertAfter(null, id, 0), native);
  assert.equal(native.delete(id), native);
  assert.throws(() =>
    NativeF05.load(toTransposedOmit([]), {
      pageIdFilter: 1 as unknown as boolean,
    }),
  );
  const empty = NativeF05.load(toTransposedOmit([]), { pageIdFilter: true });
  assert.equal(empty.length, 0);
  assert.deepEqual(empty.insertAfter(null, id, 3).save(), [
    { bunchId: id.bunchId, startCounter: 0, count: 3, isDeleted: false },
  ]);
});
