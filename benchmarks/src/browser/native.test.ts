import { IdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toClientIndexOmit } from "../algorithms/id_list_saved_states";
import { example } from "../full_picture/fixture";
import { NativeF08 } from "./native";
import { nativeCandidates } from "./native-candidates";

test("all internal-format cases receive byte-identical F08 JSON", () => {
  const baseline = nativeCandidates[0];
  for (const c of nativeCandidates) {
    assert.equal(c.encode, baseline.encode);
    assert.equal(c.decode, baseline.decode);
    assert.deepEqual(c.encode(example), baseline.encode(example));
    assert.deepEqual(c.hydrate(c.decode(c.encode(example))).save(), example);
  }
});

test("F08 adopts wire arrays, with no IdList.load or tree construction", () => {
  const wire = toClientIndexOmit(example);
  const originalLoad = IdList.load,
    originalDirect = IdList.experimentalLoadFrom;
  try {
    IdList.load = () => {
      throw new Error("Tree adapter called");
    };
    IdList.experimentalLoadFrom = () => {
      throw new Error("Tree builder called");
    };
    const list = NativeF08.load(wire);
    assert.equal(list.wireState, wire);
    assert.equal(list.wireState.counts, wire.counts);
    const edited = list
      .insertAfter(
        { bunchId: "alice_0", counter: 3 },
        { bunchId: "new_0", counter: 0 },
        2,
      )
      .delete({ bunchId: "new_0", counter: 0 });
    assert.equal(edited.length, list.length + 1);
    assert.deepEqual(list.save(), example);
  } finally {
    IdList.load = originalLoad;
    IdList.experimentalLoadFrom = originalDirect;
  }
});

test("native F08 matches immutable tree edits, tombstones, bulk operations and counter exceptions", () => {
  let tree = IdList.load(example),
    native = NativeF08.load(toClientIndexOmit(example));
  let seed = 42;
  const random = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 250; i++) {
    const old = native,
      oldSaved = old.save();
    if (i % 3 !== 0 || tree.length === 0) {
      const saved = tree.save(),
        r = saved[random(saved.length)];
      const before =
        i % 11 === 0
          ? null
          : { bunchId: r.bunchId, counter: r.startCounter + random(r.count) };
      const id = { bunchId: `editor_${(i % 5).toString(36)}`, counter: i * 8 },
        count = random(4) + 1;
      tree = tree.insertAfter(before, id, count);
      native = native.insertAfter(before, id, count);
    } else {
      const id = tree.at(random(tree.length)),
        count = random(4) + 1;
      tree = tree.delete(id, count);
      native = native.delete(id, count);
    }
    assert.deepEqual(old.save(), oldSaved, "Earlier version changed");
    assert.deepEqual(native.save(), tree.save());
    assert.equal(native.length, tree.length);
    assert.deepEqual(
      NativeF08.load(structuredClone(native.wireState)).save(),
      tree.save(),
    );
    for (let j = 0; j < tree.length; j++)
      assert.deepEqual(native.at(j), tree.at(j));
    for (const r of tree.save())
      for (const bias of ["none", "left", "right"] as const) {
        const id = { bunchId: r.bunchId, counter: r.startCounter };
        assert.equal(native.indexOf(id, bias), tree.indexOf(id, bias));
      }
  }
});

test("native F08 rejects malformed columns, duplicate IDs and unsupported IDs", () => {
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
    assert.throws(() => NativeF08.load({ ...wire, ...change }));
  const native = NativeF08.load(wire);
  assert.throws(() =>
    native.insertAfter(null, { bunchId: "opaqueID", counter: 0 }),
  );
  assert.throws(() =>
    native.insertAfter(null, { bunchId: "alice_0", counter: 2 }, 2),
  );
  assert.throws(() => native.at(-1));
  assert.throws(() => native.at(native.length));
  assert.throws(() => native.indexOf({ bunchId: "unknown_0", counter: 0 }));
  assert.equal(native.delete({ bunchId: "unknown_0", counter: 0 }), native);
  assert.equal(
    native.insertAfter(null, { bunchId: "new_0", counter: 0 }, 0),
    native,
  );
  assert.equal(NativeF08.load(toClientIndexOmit([])).length, 0);
});

test("chunk edits share untouched columns, round-trip exports, and keep old versions", () => {
  const saved = Array.from({ length: 1024 }, (_, i) => ({
    bunchId: i % 2 ? "writer_0" : "reader_0",
    startCounter: Math.floor(i / 2) * 3,
    count: 3,
    isDeleted: false,
  }));
  const wire = toClientIndexOmit(saved),
    native = NativeF08.load(wire);
  const chunks = (list: NativeF08) =>
    (
      list as unknown as {
        chunks: {
          columns: { counts: number[] };
          starts: Float64Array;
          from: number;
          to: number;
        }[];
      }
    ).chunks;
  const initial = chunks(native);
  assert(initial.length > 1);
  assert(initial.every((c) => c.columns.counts === wire.counts));
  let edited = native.insertAfter(
    native.at(1500),
    { bunchId: "new_0", counter: 2 ** 40 },
    3,
  );
  let tree = IdList.load(saved).insertAfter(
    native.at(1500),
    { bunchId: "new_0", counter: 2 ** 40 },
    3,
  );
  assert.equal(
    initial.filter((c) => chunks(edited).includes(c)).length,
    initial.length - 1,
  );
  assert.deepEqual(native.save(), saved);
  edited = edited.delete({ bunchId: "writer_0", counter: 100 }, 1200);
  tree = tree.delete({ bunchId: "writer_0", counter: 100 }, 1200);
  assert.deepEqual(edited.save(), tree.save());
  assert.deepEqual(
    NativeF08.load(structuredClone(edited.wireState)).save(),
    tree.save(),
  );
  for (let i = 0; i < tree.length; i++)
    assert.deepEqual(edited.at(i), tree.at(i));
  for (const run of tree.save())
    for (const bias of ["none", "left", "right"] as const)
      assert.equal(
        edited.indexOf(
          { bunchId: run.bunchId, counter: run.startCounter },
          bias,
        ),
        tree.indexOf({ bunchId: run.bunchId, counter: run.startCounter }, bias),
      );
  // Branching from an older version must not leak later edits or index updates.
  const branch = native.delete(native.at(0), 2);
  assert.deepEqual(
    branch.save(),
    IdList.load(saved).delete(native.at(0), 2).save(),
  );
  assert.deepEqual(native.save(), saved);
});

test("random edits across many chunks preserve indexes, tombstones and branching", () => {
  const saved = Array.from({ length: 600 }, (_, i) => ({
    bunchId: `client_${(i % 7).toString(36)}`,
    startCounter: Math.floor(i / 7) * 4,
    count: 4,
    isDeleted: i % 5 === 0,
  }));
  for (let seed of [17, 42, 91]) {
    const random = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    let tree = IdList.load(saved),
      native = NativeF08.load(toClientIndexOmit(saved));
    for (let i = 0; i < 400; i++) {
      const old = native,
        oldSaved = old.save();
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
        const id = {
            bunchId: `edits_${(i % 11).toString(36)}`,
            counter: i * 8,
          },
          count = 1 + random(4);
        native = native.insertAfter(before, id, count);
        tree = tree.insertAfter(before, id, count);
      } else {
        const runs = tree.save(),
          run = runs[random(runs.length)];
        const id = { bunchId: run.bunchId, counter: run.startCounter },
          count = 1 + random(12);
        native = native.delete(id, count);
        tree = tree.delete(id, count);
      }
      assert.deepEqual(native.save(), tree.save());
      assert.deepEqual(old.save(), oldSaved);
      for (let j = 0; j < 8; j++) {
        const index = random(tree.length),
          id = tree.at(index);
        assert.deepEqual(native.at(index), id);
        assert.equal(native.indexOf(id), index);
      }
      if (i % 20 === 0) {
        assert.deepEqual(
          NativeF08.load(structuredClone(native.wireState)).save(),
          tree.save(),
        );
        const branchId = { bunchId: "branch_0", counter: 0 };
        assert.deepEqual(
          old.insertAfter(null, branchId).save(),
          IdList.load(oldSaved).insertAfter(null, branchId).save(),
        );
      }
    }
  }
});
