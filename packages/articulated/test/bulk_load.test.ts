import assert from "node:assert/strict";
import { IdList, type SavedIdList } from "../src";

function equivalent(actual: IdList, expected: IdList) {
  assert.deepEqual(actual.save(), expected.save());
  assert.equal(actual.length, expected.length);
  assert.deepEqual([...actual], [...expected]);
  assert.deepEqual(
    [...actual.valuesWithIsDeleted()],
    [...expected.valuesWithIsDeleted()],
  );
  assert.deepEqual([...actual.knownIds], [...expected.knownIds]);
  assert.equal(actual.knownIds.length, expected.knownIds.length);
  for (let i = 0; i < expected.length; i++) {
    assert.deepEqual(actual.at(i), expected.at(i));
  }
  for (let i = 0; i < expected.knownIds.length; i++) {
    const id = expected.knownIds.at(i);
    assert.deepEqual(actual.knownIds.at(i), id);
    assert.equal(actual.knownIds.indexOf(id), i);
    assert.equal(actual.has(id), expected.has(id));
    assert.equal(actual.isKnown(id), true);
    assert.equal(
      actual.maxCounter(id.bunchId),
      expected.maxCounter(id.bunchId),
    );
    for (const bias of ["none", "left", "right"] as const)
      assert.equal(actual.indexOf(id, bias), expected.indexOf(id, bias));
  }
  for (const bind of ["left", "right"] as const) {
    for (let i = 0; i <= expected.length; i++) {
      const cursor = expected.cursorAt(i, bind);
      assert.deepEqual(actual.cursorAt(i, bind), cursor);
      assert.equal(
        actual.cursorIndex(cursor, bind),
        expected.cursorIndex(cursor, bind),
      );
    }
  }
  const missing = { bunchId: "missing", counter: 77 };
  assert.equal(actual.has(missing), false);
  assert.equal(actual.isKnown(missing), false);
  assert.throws(() => actual.indexOf(missing), /id is not known/);
  assert.throws(() => expected.indexOf(missing), /id is not known/);
  assert.equal(actual.maxCounter("missing"), undefined);
}

function outcome(load: () => IdList) {
  try {
    return { saved: load().save() };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

describe("experimental bulk-index IdList loader", () => {
  it("matches the original at sequence-tree boundaries, gaps and wide counters", () => {
    for (const size of [0, 1, 2, 7, 8, 9, 63, 64, 65, 511, 512, 513]) {
      const saved: SavedIdList = Array.from({ length: size }, (_, i) => ({
        bunchId: `opaque-${(i * 23) % 37}`,
        startCounter: 2 ** 40 + i * 5,
        count: 2,
        isDeleted: i % 3 === 0,
      }));
      const copy = structuredClone(saved);
      equivalent(IdList.experimentalLoadBulk(saved), IdList.load(saved));
      assert.deepEqual(saved, copy, "loading must not mutate caller state");
    }
  });

  it("preserves original validation, duplicate detection and zero-run behavior", () => {
    const base = {
      bunchId: "aB3dE5fG",
      startCounter: 0,
      count: 3,
      isDeleted: false,
    };
    const cases: unknown[] = [
      [],
      [base],
      [{ ...base, count: 0 }],
      [base, { ...base, startCounter: 3, isDeleted: true }],
      [base, base],
      [base, { ...base, startCounter: 2 }],
      [{ ...base, startCounter: 2 }, base],
      [{ ...base, count: -1 }],
      [{ ...base, count: 1.5 }],
      [{ ...base, count: NaN }],
      [{ ...base, count: Infinity }],
      [{ ...base, count: Number.MAX_SAFE_INTEGER + 1 }],
      [{ ...base, startCounter: -1 }],
      [{ ...base, startCounter: 0.5 }],
      [{ ...base, startCounter: NaN }],
      [{ ...base, startCounter: Infinity }],
      [{ ...base, startCounter: Number.MAX_SAFE_INTEGER + 1 }],
      [{ ...base, count: 0, startCounter: -1 }],
      [{ ...base, count: "3" }],
      [{ ...base, startCounter: "0" }],
      [null],
      [undefined],
      null,
      undefined,
    ];
    for (const saved of cases)
      assert.deepEqual(
        outcome(() => IdList.experimentalLoadBulk(saved as SavedIdList)),
        outcome(() => IdList.load(saved as SavedIdList)),
      );
  });

  it("retains the full API and old versions after mixed mutations and branches", () => {
    const saved: SavedIdList = Array.from({ length: 80 }, (_, i) => ({
      bunchId: `seed-${i % 9}`,
      startCounter: i * 7,
      count: 3,
      isDeleted: i % 4 === 0,
    }));
    let original = IdList.load(saved),
      bulk = IdList.experimentalLoadBulk(saved);
    const versions: [IdList, IdList][] = [[bulk, original]];
    let seed = 42;
    const random = (n: number) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed % n;
    };
    for (let step = 0; step < 360; step++) {
      const id = original.knownIds.length
        ? original.knownIds.at(random(original.knownIds.length))
        : null;
      const fresh = { bunchId: `edit-${step}`, counter: 2 ** 33 };
      const op = random(6);
      const from = original.length ? random(original.length) : 0;
      const apply = (list: IdList) => {
        if (op === 0) return list.insertAfter(id, fresh, 3);
        if (op === 1) return list.insertBefore(id, fresh, 2);
        if (op === 2 && id) return list.delete(id);
        if (op === 3 && id) return list.undelete(id);
        if (op === 4 && id) return list.uninsert(id);
        return list.deleteRange(from, Math.min(from + 2, list.length));
      };
      original = apply(original);
      bulk = apply(bulk);
      assert.deepEqual(bulk.save(), original.save());
      if (step % 40 === 0) {
        equivalent(bulk, original);
        versions.push([bulk, original]);
      }
    }
    equivalent(bulk, original);
    for (const [oldBulk, oldOriginal] of versions) {
      equivalent(oldBulk, oldOriginal);
      const id = { bunchId: "independent-branch", counter: 0 };
      equivalent(
        oldBulk.insertAfter(null, id, 4),
        oldOriginal.insertAfter(null, id, 4),
      );
    }
  });
});
