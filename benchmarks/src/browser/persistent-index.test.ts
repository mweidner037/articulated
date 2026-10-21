import assert from "node:assert/strict";
import { test } from "node:test";
import { PersistentIndex } from "./persistent-index";

test("persistent index agrees with sorted Map under inserts, replacements, removals and old versions", () => {
  const compare = (a: number, b: number) => a - b;
  let tree = PersistentIndex.sorted(compare, [
    [0, 9],
    [2, 3],
    [4, 5],
  ]);
  const map = new Map([
    [0, 9],
    [2, 3],
    [4, 5],
  ]);
  let seed = 72;
  for (let i = 0; i < 3000; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const key = seed % 101,
      old = tree,
      before = [...tree.entries()];
    if (i % 3) {
      tree = tree.set(key, i);
      map.set(key, i);
    } else {
      tree = tree.delete(key);
      map.delete(key);
    }
    const sorted = [...map].sort((a, b) => a[0] - b[0]);
    assert.deepEqual([...tree.entries()], sorted);
    assert.deepEqual([...old.entries()], before);
    assert.equal(tree.get(key), map.get(key));
    assert.deepEqual(tree.floor(key), sorted.filter(([k]) => k <= key).at(-1));
    assert.deepEqual(
      tree.ceiling(key),
      sorted.find(([k]) => k >= key),
    );
  }
});
