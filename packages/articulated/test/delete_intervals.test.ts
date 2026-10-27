import assert from "node:assert/strict";
import { IdList, type ElementId, type SavedIdList } from "../src";

function equivalent(actual: IdList, expected: IdList) {
  assert.deepEqual(actual.save(), expected.save());
  assert.deepEqual([...actual], [...expected]);
  assert.deepEqual([...actual.knownIds], [...expected.knownIds]);
  assert.equal(actual.length, expected.length);
  for (const id of expected.knownIds) {
    assert.equal(actual.has(id), expected.has(id));
    for (const bias of ["none", "left", "right"] as const)
      assert.equal(actual.indexOf(id, bias), expected.indexOf(id, bias));
  }
}

function outcome(fn: () => IdList) {
  try {
    return { saved: fn().save() };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

describe("experimental interval deletion", () => {
  const saved: SavedIdList = [
    { bunchId: "aB3dE5fG", startCounter: 20, count: 3, isDeleted: false },
    { bunchId: "hJ7kL9mN", startCounter: 0, count: 4, isDeleted: false },
    { bunchId: "aB3dE5fG", startCounter: 0, count: 2, isDeleted: false },
    { bunchId: "aB3dE5fG", startCounter: 2, count: 3, isDeleted: true },
    { bunchId: "aB3dE5fG", startCounter: 5, count: 2, isDeleted: false },
    { bunchId: "aB3dE5fG", startCounter: 10, count: 3, isDeleted: false },
  ];
  for (const load of [IdList.load, IdList.experimentalLoadBulk]) {
    it(`${load.name}: skips unknown gaps, handles partial visibility and reordered intervals`, () => {
      const list = load(saved);
      for (const bunchId of ["", "aB3dE5fG", "hJ7kL9mN", "zzzzzzzz"]) {
        for (let counter = 0; counter < 26; counter++) {
          for (const count of [0, 1, 2, 5, 13, 30]) {
            const id = { bunchId, counter };
            equivalent(
              list.experimentalDeleteIntervals(id, count),
              list.delete(id, count),
            );
          }
        }
      }
      assert.deepEqual(list.save(), saved);
    });

    it(`${load.name}: preserves versions and allows subsequent full-API mutations`, () => {
      const list = load(saved);
      const deleted = list.experimentalDeleteIntervals(
        { bunchId: "aB3dE5fG", counter: 1 },
        21,
      );
      const expected = list.delete({ bunchId: "aB3dE5fG", counter: 1 }, 21);
      const mutate = (value: IdList) =>
        value
          .undelete({ bunchId: "aB3dE5fG", counter: 2 }, 3)
          .insertAfter(
            { bunchId: "aB3dE5fG", counter: 20 },
            { bunchId: "inserted", counter: 0 },
            2,
          )
          .uninsert({ bunchId: "aB3dE5fG", counter: 11 })
          .deleteRange(0, 2);
      equivalent(mutate(deleted), mutate(expected));
      equivalent(deleted, expected);
      assert.deepEqual(list.save(), saved);
      assert.strictEqual(
        deleted.experimentalDeleteIntervals(
          { bunchId: "aB3dE5fG", counter: 1 },
          21,
        ),
        deleted,
      );
      // The leaf still has present IDs, but this subrange is already deleted.
      assert.strictEqual(
        list.experimentalDeleteIntervals(
          { bunchId: "aB3dE5fG", counter: 2 },
          3,
        ),
        list,
      );
    });
  }

  it("deletes across trillion-counter gaps without walking unknown IDs", () => {
    const far = 2 ** 40;
    const state: SavedIdList = [
      { bunchId: "aB3dE5fG", startCounter: far, count: 3, isDeleted: false },
      { bunchId: "aB3dE5fG", startCounter: 0, count: 2, isDeleted: false },
      {
        bunchId: "aB3dE5fG",
        startCounter: far + 100,
        count: 2,
        isDeleted: false,
      },
    ];
    const list = IdList.experimentalLoadBulk(state);
    const result = list.experimentalDeleteIntervals(
      { bunchId: "aB3dE5fG", counter: 1 },
      far + 101,
    );
    const expected = list
      .delete({ bunchId: "aB3dE5fG", counter: 1 })
      .delete({ bunchId: "aB3dE5fG", counter: far }, 3)
      .delete({ bunchId: "aB3dE5fG", counter: far + 100 }, 2);
    equivalent(result, expected);
    assert.strictEqual(
      list.experimentalDeleteIntervals({ bunchId: "missing", counter: 0 }, far),
      list,
    );
    assert.deepEqual(list.save(), state);
  });

  it("keeps baseline validation precedence and fallback behavior", () => {
    const list = IdList.load(saved);
    for (const count of [
      -1,
      0.1,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
      "1",
      0,
      1,
      3,
    ]) {
      for (const id of [
        { bunchId: "aB3dE5fG", counter: 1 },
        { bunchId: "aB3dE5fG", counter: -1 },
        { bunchId: "aB3dE5fG", counter: 0.5 },
        { bunchId: "aB3dE5fG", counter: NaN },
        { bunchId: "aB3dE5fG", counter: Infinity },
        { bunchId: "aB3dE5fG", counter: "0" },
        { bunchId: 123, counter: 0 },
        null,
      ]) {
        assert.deepEqual(
          outcome(() =>
            list.experimentalDeleteIntervals(id as ElementId, count as number),
          ),
          outcome(() => list.delete(id as ElementId, count as number)),
        );
      }
    }
  });

  it("matches counter-based deletion after varied range updates", () => {
    const state: SavedIdList = Array.from({ length: 90 }, (_, i) => ({
      bunchId: `bunch-${i % 5}`,
      startCounter: ((i * 37) % 97) * 5,
      count: 2,
      isDeleted: i % 7 === 0,
    }));
    let actual = IdList.experimentalLoadBulk(state),
      expected = IdList.load(state);
    let seed = 42;
    const next = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    const versions = [[actual, expected]];
    for (let i = 0; i < 120; i++) {
      const id = { bunchId: `bunch-${next(6)}`, counter: next(500) },
        count = next(70);
      actual = actual.experimentalDeleteIntervals(id, count);
      expected = expected.delete(id, count);
      assert.deepEqual(actual.save(), expected.save());
      if (i % 30 === 0) versions.push([actual, expected]);
    }
    for (const [a, b] of versions) equivalent(a, b);
  });
});
