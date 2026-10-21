import { IdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toClientIndexOmit } from "../algorithms/id_list_saved_states";
import { example } from "../full_picture/fixture";
import { PagedF08 } from "./paged-f08";

for (const ownership of ["shared", "owned"] as const) {
  test(`paged F08 ${ownership}: randomized parity, routing after splits, versions, exports`, () => {
    let list = PagedF08.load(toClientIndexOmit(example), {
      ownership,
      pageSize: 8,
    });
    let tree = IdList.load(example),
      seed = 123;
    const random = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    const retained: { list: PagedF08; saved: ReturnType<IdList["save"]> }[] =
      [];
    for (let i = 0; i < 350; i++) {
      if (i % 30 === 0) retained.push({ list, saved: list.save() });
      if (i % 3 || !tree.length) {
        const saved = tree.save(),
          run = saved[random(saved.length)];
        const before =
          i % 13 === 0
            ? null
            : {
                bunchId: run.bunchId,
                counter: run.startCounter + random(run.count),
              };
        const id = {
            bunchId: `editor_${(i % 5).toString(36)}`,
            counter: i * 8,
          },
          count = random(4) + 1;
        list = list.insertAfter(before, id, count);
        tree = tree.insertAfter(before, id, count);
      } else {
        const id = tree.at(random(tree.length)),
          count = random(9) + 1;
        list = list.delete(id, count);
        tree = tree.delete(id, count);
      }
      assert.deepEqual(list.save(), tree.save());
      assert.equal(list.length, tree.length);
      if (i % 10 === 0) {
        assert.deepEqual(
          PagedF08.load(list.wireState, { ownership, pageSize: 8 }).save(),
          tree.save(),
        );
        for (let j = 0; j < tree.length; j++)
          assert.deepEqual(list.at(j), tree.at(j));
        for (const run of tree.save())
          for (const bias of ["none", "left", "right"] as const)
            assert.equal(
              list.indexOf(
                { bunchId: run.bunchId, counter: run.startCounter },
                bias,
              ),
              tree.indexOf(
                { bunchId: run.bunchId, counter: run.startCounter },
                bias,
              ),
            );
      }
    }
    for (const old of retained) {
      assert.deepEqual(old.list.save(), old.saved);
      const reference = IdList.load(old.saved);
      for (let i = 0; i < reference.length; i++) {
        assert.deepEqual(old.list.at(i), reference.at(i));
        assert.equal(old.list.indexOf(reference.at(i)), i);
      }
    }
  });
}

test("paged F08 deletion preserves identity index when ownership is unchanged", () => {
  const list = PagedF08.load(
    toClientIndexOmit([
      { bunchId: "writer_0", startCounter: 0, count: 100, isDeleted: false },
    ]),
  );
  const deleted = list.delete({ bunchId: "writer_0", counter: 20 }, 10);
  const identities = (l: PagedF08) =>
    (l as unknown as { identities: unknown }).identities;
  const ranges = (l: PagedF08) =>
    (l as unknown as { root: { page: { ranges: unknown[] } } }).root.page
      .ranges;
  const originalRanges = structuredClone(ranges(list)),
    originalSaved = list.save();
  assert.equal(identities(list), identities(deleted));
  assert.equal(ranges(list), ranges(deleted));
  assert.equal(ranges(list)[0], ranges(deleted)[0]);
  const deletedAgain = deleted.delete({ bunchId: "writer_0", counter: 50 }, 10);
  assert.equal(ranges(list), ranges(deletedAgain));
  assert.equal(identities(list), identities(deletedAgain));
  assert.deepEqual(ranges(list), originalRanges);
  assert.deepEqual(list.save(), originalSaved);
  assert.equal(deleted.indexOf({ bunchId: "writer_0", counter: 25 }), -1);
  assert.equal(
    deleted.indexOf({ bunchId: "writer_0", counter: 25 }, "left"),
    19,
  );
  assert.equal(
    deleted.indexOf({ bunchId: "writer_0", counter: 25 }, "right"),
    20,
  );
  assert.equal(
    deleted.delete({ bunchId: "writer_0", counter: 20 }, 10),
    deleted,
  );
});

test("paged F08 deletion rebuilds ownership ranges when its page splits", () => {
  const saved = Array.from({ length: 4 }, (_, i) => ({
    bunchId: `writer_${i}`,
    startCounter: 0,
    count: 10,
    isDeleted: false,
  }));
  const list = PagedF08.load(toClientIndexOmit(saved), { pageSize: 4 });
  const id = { bunchId: "writer_0", counter: 3 };
  const deleted = list.delete(id, 2),
    expected = IdList.load(saved).delete(id, 2);
  type Internals = {
    identities: unknown;
    root: { size: number; page: { ranges: unknown[] } };
  };
  const before = list as unknown as Internals,
    after = deleted as unknown as Internals;
  assert.equal(before.root.size, 1);
  assert.equal(after.root.size, 2);
  assert.notEqual(before.identities, after.identities);
  assert.notEqual(before.root.page.ranges, after.root.page.ranges);
  assert.deepEqual(list.save(), saved);
  assert.deepEqual(deleted.save(), expected.save());
  for (let i = 0; i < expected.length; i++) {
    assert.deepEqual(deleted.at(i), expected.at(i));
    assert.equal(deleted.indexOf(expected.at(i)), i);
  }
});

test("paged F08 bulk deletion crosses fragmented identity ranges and page splits", () => {
  const saved = Array.from({ length: 100 }, (_, i) => ({
    bunchId: i % 2 ? "writer_0" : "other_0",
    startCounter: Math.floor(i / 2) * 3,
    count: 3,
    isDeleted: false,
  }));
  let list = PagedF08.load(toClientIndexOmit(saved), { pageSize: 4 }),
    tree = IdList.load(saved);
  for (let i = 0; i < 50; i++) {
    const id = { bunchId: "writer_0", counter: i * 3 + 1 };
    list = list.delete(id);
    tree = tree.delete(id);
  }
  const id = { bunchId: "writer_0", counter: 0 };
  list = list.delete(id, 200);
  tree = tree.delete(id, 200);
  assert.deepEqual(list.save(), tree.save());
  for (let i = 0; i < tree.length; i++)
    assert.equal(list.indexOf(tree.at(i)), i);
});

test("paged F08 accepts large safe counters and validates malformed columns", () => {
  const large = 2 ** 40;
  const saved = [
    { bunchId: "writer_0", startCounter: large, count: 10, isDeleted: false },
  ];
  let list = PagedF08.load(toClientIndexOmit(saved));
  list = list.insertAfter(
    { bunchId: "writer_0", counter: large + 3 },
    { bunchId: "new_0", counter: large },
    2,
  );
  const expected = IdList.load(saved).insertAfter(
    { bunchId: "writer_0", counter: large + 3 },
    { bunchId: "new_0", counter: large },
    2,
  );
  assert.deepEqual(list.save(), expected.save());
  const wire = toClientIndexOmit(example);
  for (const change of [
    { counts: [1] },
    { clientIndices: [99, 0, 0, 0] },
    { counts: [0, 1, 2, -2] },
    { seqNums: [NaN, 0, 1, 0] },
    { startCounterIndexes: [3], startCounters: [1] },
    { startCounterIndexes: [4], startCounters: [9] },
    { startCounterIndexes: [0, 0], startCounters: [0, 1] },
  ])
    assert.throws(() => PagedF08.load({ ...wire, ...change }));
  assert.throws(() => PagedF08.load(wire, { pageSize: 0 }));
  assert.throws(() =>
    list.insertAfter(null, { bunchId: "opaqueID", counter: 0 }),
  );
  assert.throws(() =>
    list.insertAfter(null, { bunchId: "writer_0", counter: large + 1 }, 2),
  );
  assert.throws(() =>
    list.insertAfter(null, { bunchId: "writer_0", counter: large - 2 }, 4),
  );
  assert.throws(() => list.at(-1));
  assert.throws(() => list.at(list.length));
  assert.throws(() => list.indexOf({ bunchId: "missing_0", counter: 0 }));
  assert.equal(list.delete({ bunchId: "missing_0", counter: 0 }), list);
  assert.equal(
    list.insertAfter(null, { bunchId: "new_1", counter: 0 }, 0),
    list,
  );
  const empty = PagedF08.load(toClientIndexOmit([]));
  assert.equal(empty.length, 0);
  assert.equal(
    empty.insertAfter(null, { bunchId: "first_0", counter: 0 }, 3).length,
    3,
  );
});

test("owned F08 pages do not retain source arrays or mutate input", () => {
  const wire = toClientIndexOmit(example),
    original = structuredClone(wire);
  const list = PagedF08.load(wire, { ownership: "owned" });
  wire.counts[0] = 999;
  assert.deepEqual(list.save(), IdList.load(example).save());
  assert.deepEqual(list.wireState, original);
  const exported = list.wireState;
  exported.counts[0] = 888;
  exported.clientIds[0] = "changed";
  assert.deepEqual(list.save(), example);
});
