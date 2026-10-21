import assert from "node:assert/strict";
import { test } from "node:test";
import { NumericPages, toggleRows, type ProbeF05 } from "./direct-array-model";

const fixture: ProbeF05 = {
  bunchIds: ["aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
  counts: [3, -1, 2],
  startCounterIndexes: [],
  startCounters: [],
};
for (const storage of ["ordinary", "typed32", "dense-only"] as const) {
  test(`${storage}: persistent toggles, prefixes, indexes and history match`, () => {
    for (const pageSize of [0, 1, 2, 128]) {
      let state = NumericPages.load(fixture, { storage, pageSize });
      const versions = [state],
        edits = toggleRows(3, 200);
      for (const row of edits) {
        state = state.toggle(row);
        versions.push(state);
      }
      for (let i = 0; i < versions.length; i++)
        versions[i].verify(fixture, edits.slice(0, i));
      const same = NumericPages.load(fixture, {
        storage: storage === "ordinary" ? "typed32" : "ordinary",
        pageSize,
      });
      assert.equal(versions[0].checksum(), same.checksum());
      assert.deepEqual(
        versions[0].stats().numericElements,
        same.stats().numericElements,
      );
      assert.equal(state.stats().typedBackingBytes > 0, storage !== "ordinary");
    }
  });
  test(`${storage}: width validation rejects truncation and duplicate intervals`, () => {
    const load = (changes: Partial<ProbeF05>) =>
      NumericPages.load({ ...fixture, ...changes }, { storage, pageSize: 128 });
    for (const value of [0, 0x80000000, -0x80000000, NaN, Infinity, 1.5])
      assert.throws(() => load({ counts: [value, -1, 2] }));
    for (const value of [
      -1,
      0x100000000,
      Number.MAX_SAFE_INTEGER,
      NaN,
      Infinity,
      1.5,
    ])
      assert.throws(() =>
        load({ startCounterIndexes: [0], startCounters: [value] }),
      );
    assert.throws(
      () => load({ startCounterIndexes: [0], startCounters: [0xffffffff - 1] }),
      /wider/,
    );
    assert.throws(
      () => load({ startCounterIndexes: [2], startCounters: [1] }),
      /Duplicate/,
    );
    assert.throws(() =>
      load({ bunchIds: ["not-eight-characters", "hJ7kL9mN", "aB3dE5fG"] }),
    );
    const edge: ProbeF05 = {
      bunchIds: ["aB3dE5fG"],
      counts: [1],
      startCounterIndexes: [0],
      startCounters: [0xfffffffe],
    };
    assert.equal(
      NumericPages.load(edge, { storage, pageSize: 128 }).visibleLength,
      1,
    );
    assert.throws(() => load({ counts: [0x7fffffff, 0x7fffffff, 2] }), /wider/);
  });
}
