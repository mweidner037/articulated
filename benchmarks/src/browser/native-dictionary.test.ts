import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toBunchIndexOmit } from "../algorithms/id_list_saved_states";
import {
  NativeDictionary,
  type F07,
  type F09,
  type NativeDictionaryOptions,
} from "./native-dictionary";

function full(saved: SavedIdList): F09 {
  const { bunchIds, bunchIndices, counts } = toBunchIndexOmit(saved);
  return {
    bunchIds,
    bunchIndices,
    counts,
    startCounters: saved.map((r) => r.startCounter),
  };
}
const cases = [
  {
    format: "F07",
    encode: toBunchIndexOmit,
    load: (wire: F07 | F09, options?: NativeDictionaryOptions) =>
      NativeDictionary.loadF07(wire as F07, options),
  },
  {
    format: "F09",
    encode: full,
    load: (wire: F07 | F09, options?: NativeDictionaryOptions) =>
      NativeDictionary.loadF09(wire as F09, options),
  },
];
const options: NativeDictionaryOptions[] = ["shared", "owned"].flatMap(
  (ownership) =>
    [64, 128, 256].map((pageSize) => ({
      ownership: ownership as "shared" | "owned",
      pageSize,
    })),
);
const example: SavedIdList = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 2 ** 40, count: 2, isDeleted: true },
  { bunchId: "aB3dE5fG", startCounter: 8, count: 2, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
type Internals = {
  original?: F07 | F09;
  dictionary: string[];
  pages: {
    columns: { bunchIndices: number[]; counts: number[] };
    starts: number[] | Float64Array;
    byId: Map<number, number | number[]>;
    from: number;
    to: number;
  }[];
};
const internals = (list: NativeDictionary) => list as unknown as Internals;

test("native F07/F09 support opaque IDs, counter gaps/reorders and tombstone anchors", () => {
  for (const c of cases)
    for (const config of options) {
      const wire = c.encode(example),
        native = c.load(wire, config),
        tree = IdList.load(example);
      assert.equal(native.format, c.format);
      assert.deepEqual(native.save(), tree.save());
      assert.deepEqual(
        c.load(structuredClone(native.wireState), config).save(),
        tree.save(),
      );
      const before = { bunchId: "hJ7kL9mN", counter: 2 ** 40 },
        id = { bunchId: "ABCxyz12", counter: 2 ** 45 };
      const edited = native.insertAfter(before, id, 3).delete(id);
      assert.deepEqual(
        edited.save(),
        tree.insertAfter(before, id, 3).delete(id).save(),
      );
      assert.deepEqual(native.save(), example);
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
    }
});

test("F07/F09 pages contain dictionary indices rather than expanded whole-ID strings", () => {
  const saved = Array.from({ length: 1024 }, (_, i) => ({
    bunchId: `opaque0${i % 7}`,
    startCounter: Math.floor(i / 7) * 3,
    count: 2,
    isDeleted: false,
  }));
  for (const c of cases)
    for (const config of options) {
      const wire = c.encode(saved),
        native = c.load(wire, config),
        state = internals(native);
      assert.equal(state.dictionary.length, 7);
      assert(
        state.pages.every(
          (p) =>
            p.columns.bunchIndices.every((id) => typeof id === "number") &&
            [...p.byId.keys()].every((id) => typeof id === "number"),
        ),
      );
      if (config.ownership === "shared") {
        assert.equal(native.wireState, wire);
        assert(
          state.pages.every(
            (p) => p.columns.bunchIndices === wire.bunchIndices,
          ),
        );
        if (c.format === "F09")
          assert(
            state.pages.every((p) => p.starts === wire.startCounters),
            "F09 must not duplicate its all-counters column",
          );
      } else {
        assert.equal(state.original, undefined);
        assert.notEqual(state.dictionary, wire.bunchIds);
        assert(
          state.pages.every(
            (p) =>
              p.from === 0 &&
              p.columns.bunchIndices.length <= config.pageSize! &&
              p.starts.length <= config.pageSize!,
          ),
        );
        assert(
          state.pages.every(
            (p) =>
              p.columns.bunchIndices !== wire.bunchIndices &&
              p.columns.counts !== wire.counts &&
              p.starts !== wire.startCounters,
          ),
        );
        wire.bunchIds.fill("mutated!");
        wire.bunchIndices.fill(0);
        wire.counts.fill(1);
        wire.startCounters.fill(0);
        assert.deepEqual(native.save(), saved);
      }
      const edited = native.insertAfter(native.at(500), {
        bunchId: "editor12",
        counter: 2 ** 40,
      });
      assert.equal(
        state.pages.filter((p) => internals(edited).pages.includes(p)).length,
        state.pages.length - 1,
      );
      assert.deepEqual(
        c.load(structuredClone(edited.wireState), config).save(),
        edited.save(),
      );
      assert.deepEqual(native.save(), saved);
    }
});

test("F07/F09 do not call a hidden IdList loader", () => {
  const original = IdList.load,
    direct = IdList.experimentalLoadFrom;
  try {
    IdList.load = IdList.experimentalLoadFrom = () => {
      throw new Error("Hidden loader");
    };
    for (const c of cases)
      for (const config of options)
        assert.equal(
          c
            .load(c.encode(example), config)
            .insertAfter(null, { bunchId: "abcd1234", counter: 0 }).length,
          6,
        );
  } finally {
    IdList.load = original;
    IdList.experimentalLoadFrom = direct;
  }
});

test("F07/F09 validate dictionaries, columns, intervals and empty states", () => {
  for (const c of cases) {
    const wire = c.encode(example);
    for (const patch of [
      { bunchIds: ["a", "a"] },
      { bunchIndices: [99, 1, 0, 0] },
      { bunchIndices: [0, -1, 0, 0] },
      { counts: [0, -2, 2, -2] },
      { counts: [1] },
      { startCounters: [-1] },
      { startCounters: [] },
    ])
      assert.throws(() => c.load({ ...wire, ...patch }));
    const native = c.load(wire);
    assert.throws(() =>
      native.insertAfter(null, { bunchId: "aB3dE5fG", counter: 3 }),
    );
    assert.throws(() => native.at(native.length));
    assert.throws(() => native.indexOf({ bunchId: "unknown!", counter: 0 }));
    assert.equal(native.delete({ bunchId: "unknown!", counter: 0 }), native);
    assert.equal(
      native.insertAfter(null, { bunchId: "newnew12", counter: 0 }, 0),
      native,
    );
    const empty = c.load(c.encode([]));
    assert.equal(empty.length, 0);
    assert.deepEqual(
      empty.insertAfter(null, { bunchId: "newnew12", counter: 0 }, 2).save(),
      [{ bunchId: "newnew12", startCounter: 0, count: 2, isDeleted: false }],
    );
  }
  const wire = toBunchIndexOmit(example);
  assert.throws(() =>
    NativeDictionary.loadF07({ ...wire, bunchIds: new Array(2) }),
  );
  assert.throws(() =>
    NativeDictionary.loadF07({
      ...wire,
      startCounterIndexes: new Array(1),
      startCounters: [0],
    }),
  );
  for (const patch of [
    { startCounterIndexes: [0, 0], startCounters: [0, 1] },
    { startCounterIndexes: [4], startCounters: [0] },
    { startCounterIndexes: [1, 1, 1], startCounters: [2 ** 40, 1, 3] },
  ])
    assert.throws(() => NativeDictionary.loadF07({ ...wire, ...patch }));
  assert.throws(() =>
    NativeDictionary.loadF09({
      ...full(example),
      startCounters: [0, 2 ** 40, 1, 3],
    }),
  );
});

test("native F07/F09 randomized multi-page editing and version branching match IdList", () => {
  const saved = Array.from({ length: 600 }, (_, i) => ({
    bunchId: `opaque0${i % 7}`,
    startCounter: Math.floor(i / 7) * 4,
    count: 4,
    isDeleted: i % 5 === 0,
  }));
  for (const c of cases)
    for (const config of options) {
      let native = c.load(c.encode(saved), config),
        tree = IdList.load(saved),
        seed = 42;
      const versions: [NativeDictionary, SavedIdList][] = [];
      const random = (n: number) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed % n;
      };
      for (let i = 0; i < 300; i++) {
        if (i % 25 === 0) versions.push([native, native.save()]);
        if (i % 3 !== 0) {
          const runs = tree.save(),
            run = runs[random(runs.length)],
            before =
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
            c.load(structuredClone(native.wireState), config).save(),
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
      assert.deepEqual(
        versions[3][0].delete({ bunchId: "opaque00", counter: 0 }, 1000).save(),
        IdList.load(versions[3][1])
          .delete({ bunchId: "opaque00", counter: 0 }, 1000)
          .save(),
      );
    }
});
