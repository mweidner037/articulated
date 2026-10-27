import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { NativeF05, type NativeF05Options } from "./native-f05";

const example: SavedIdList = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 2 ** 40, count: 2, isDeleted: true },
  { bunchId: "aB3dE5fG", startCounter: 8, count: 2, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
const options: NativeF05Options[] = ["shared", "owned"].flatMap((ownership) =>
  [64, 128, 256].map((pageSize) => ({
    ownership: ownership as "shared" | "owned",
    pageSize,
  })),
);

test("native F05 supports opaque IDs, gaps, counter reordering and safe integers", () => {
  for (const config of options) {
    const wire = toTransposedOmit(example),
      native = NativeF05.load(wire, config),
      tree = IdList.load(example);
    assert.deepEqual(native.save(), tree.save());
    assert.deepEqual(
      NativeF05.load(structuredClone(native.wireState), config).save(),
      tree.save(),
    );
    for (const run of example)
      for (const bias of ["none", "left", "right"] as const)
        assert.equal(
          native.indexOf(
            { bunchId: run.bunchId, counter: run.startCounter },
            bias,
          ),
          tree.indexOf(
            { bunchId: run.bunchId, counter: run.startCounter },
            bias,
          ),
        );
    const id = { bunchId: "XYZabc12", counter: 2 ** 45 };
    const before = { bunchId: "hJ7kL9mN", counter: 2 ** 40 };
    assert.deepEqual(
      native.insertAfter(before, id, 3).save(),
      tree.insertAfter(before, id, 3).save(),
    );
  }
});

test("F05 does not load an IdList or expand into run objects", () => {
  const original = IdList.load,
    direct = IdList.experimentalLoadFrom;
  try {
    IdList.load = IdList.experimentalLoadFrom = () => {
      throw new Error("Hidden tree loader");
    };
    for (const config of options) {
      const native = NativeF05.load(toTransposedOmit(example), config);
      assert.equal(
        native.insertAfter(null, { bunchId: "abcdefgh", counter: 0 }).length,
        6,
      );
    }
  } finally {
    IdList.load = original;
    IdList.experimentalLoadFrom = direct;
  }
});

test("F05 rejects malformed columns, duplicates and invalid options", () => {
  const wire = toTransposedOmit(example);
  assert.throws(() =>
    NativeF05.load({
      ...wire,
      startCounterIndexes: new Array(1),
      startCounters: [0],
    }),
  );
  for (const patch of [
    { counts: [1] },
    { counts: [0, -2, 2, -2] },
    { counts: [NaN, -2, 2, -2] },
    { counts: [Number.MAX_SAFE_INTEGER, -2, 2, -2] },
    { bunchIds: [123, "hJ7kL9mN", "aB3dE5fG", "aB3dE5fG"] },
    { startCounterIndexes: [0, 0], startCounters: [0, 1] },
    { startCounterIndexes: [4], startCounters: [9] },
    { startCounterIndexes: [0], startCounters: [-1] },
    { startCounterIndexes: [0], startCounters: [0, 1] },
    { startCounterIndexes: [1, 1, 1], startCounters: [2 ** 40, 1, 3] },
  ])
    assert.throws(() => NativeF05.load({ ...wire, ...patch } as typeof wire));
  for (const pageSize of [0, -1, NaN, 1.5])
    assert.throws(() => NativeF05.load(wire, { pageSize }));
  const native = NativeF05.load(wire);
  assert.throws(() =>
    native.insertAfter(null, { bunchId: "aB3dE5fG", counter: 1 }, 2),
  );
  assert.throws(() =>
    native.insertAfter(null, { bunchId: "aB3dE5fG", counter: 3 }),
  );
  assert.throws(() => native.indexOf({ bunchId: "missing!", counter: 0 }));
  assert.throws(() => native.at(-1));
  assert.throws(() => native.at(native.length));
  assert.equal(native.delete({ bunchId: "missing!", counter: 0 }), native);
  assert.equal(
    native.insertAfter(null, { bunchId: "newnew12", counter: 0 }, 0),
    native,
  );
  assert.equal(NativeF05.load(toTransposedOmit([])).length, 0);
  assert.deepEqual(
    NativeF05.load(toTransposedOmit([]))
      .insertAfter(null, { bunchId: "newnew12", counter: 0 }, 2)
      .save(),
    [{ bunchId: "newnew12", startCounter: 0, count: 2, isDeleted: false }],
  );
});

type PageView = {
  columns: { bunchIds: string[]; counts: number[] };
  starts: Float64Array;
  from: number;
  to: number;
};
const pages = (list: NativeF05) =>
  (list as unknown as { pages: PageView[] }).pages;
test("F05 ownership modes share or independently own backing arrays explicitly", () => {
  const saved = Array.from({ length: 1024 }, (_, i) => ({
    bunchId: "abcdefgh",
    startCounter: i * 3,
    count: 2,
    isDeleted: false,
  }));
  for (const config of options) {
    const wire = toTransposedOmit(saved),
      native = NativeF05.load(wire, config),
      originalPages = pages(native);
    assert(originalPages.length > 1);
    assert(originalPages.every((p) => p.to - p.from <= config.pageSize!));
    if (config.ownership === "shared") {
      assert.equal(native.wireState, wire);
      assert(originalPages.every((p) => p.columns.counts === wire.counts));
    } else {
      assert.equal(
        (native as unknown as { original?: unknown }).original,
        undefined,
      );
      assert(
        originalPages.every(
          (p) =>
            p.columns.counts !== wire.counts &&
            p.columns.bunchIds !== wire.bunchIds &&
            p.from === 0,
        ),
      );
      assert.equal(
        new Set(originalPages.map((p) => p.starts.buffer)).size,
        originalPages.length,
      );
      wire.bunchIds.fill("mutated!");
      wire.counts.fill(1);
      assert.deepEqual(native.save(), saved);
    }
    const edited = native.insertAfter(
      native.at(500),
      { bunchId: "inserted", counter: 2 ** 40 },
      2,
    );
    assert.equal(
      originalPages.filter((p) => pages(edited).includes(p)).length,
      originalPages.length - 1,
    );
    if (config.ownership === "owned") {
      assert(
        pages(edited).every(
          (p) =>
            p.columns.counts.length <= config.pageSize! &&
            p.starts.length <= config.pageSize!,
        ),
      );
    }
    assert.deepEqual(native.save(), saved);
    assert.deepEqual(
      NativeF05.load(structuredClone(edited.wireState), config).save(),
      edited.save(),
    );
  }
});

test("F05 randomized multi-page edits, bulk deletion, tombstone anchors and retained versions match IdList", () => {
  const saved = Array.from({ length: 600 }, (_, i) => ({
    bunchId: `opaque0${i % 7}`,
    startCounter: Math.floor(i / 7) * 4,
    count: 4,
    isDeleted: i % 5 === 0,
  }));
  for (const config of options) {
    let tree = IdList.load(saved),
      native = NativeF05.load(toTransposedOmit(saved), config),
      seed = 42;
    const versions: [NativeF05, SavedIdList][] = [];
    const random = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    for (let i = 0; i < 300; i++) {
      if (i % 25 === 0) versions.push([native, native.save()]);
      if (i % 3 !== 0) {
        const runs = tree.save(),
          run = runs[random(runs.length)];
        const before =
          i % 13
            ? {
                bunchId: run.bunchId,
                counter: run.startCounter + random(run.count),
              }
            : null;
        const id = { bunchId: `editor0${i % 9}`, counter: i * 8 },
          count = random(4) + 1;
        native = native.insertAfter(before, id, count);
        tree = tree.insertAfter(before, id, count);
      } else {
        const id = tree.at(random(tree.length)),
          count = i % 9 === 0 ? 1000 : random(4) + 1;
        native = native.delete(id, count);
        tree = tree.delete(id, count);
      }
      assert.equal(native.length, tree.length);
      assert.deepEqual(native.save(), tree.save());
      if (i % 10 === 0) {
        assert.deepEqual(
          NativeF05.load(structuredClone(native.wireState), config).save(),
          tree.save(),
        );
        for (let j = 0; j < tree.length; j += 17)
          assert.deepEqual(native.at(j), tree.at(j));
        for (const run of tree.save())
          for (const bias of ["none", "left", "right"] as const)
            assert.equal(
              native.indexOf(
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
    for (const [version, state] of versions)
      assert.deepEqual(version.save(), state);
    const branch = versions[3][0].delete(
      { bunchId: "opaque00", counter: 0 },
      1000,
    );
    assert.deepEqual(
      branch.save(),
      IdList.load(versions[3][1])
        .delete({ bunchId: "opaque00", counter: 0 }, 1000)
        .save(),
    );
  }
});
