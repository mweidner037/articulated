import { IdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  directStorageExample,
  directStorageFormats,
  fromIdentitySpans,
  toIdentitySpans,
} from "./direct-storage-formats";

test("independent visibility merges identity spans across tombstones without dropping counter exceptions", () => {
  const s = toIdentitySpans(directStorageExample);
  assert.deepEqual(s, {
    bunchIds: ["aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
    startCounters: [0, 20, 8],
    identityCounts: [5, 1, 2],
    visibilityCounts: [3, -2, 3],
  });
  assert.deepEqual(fromIdentitySpans(s), directStorageExample);
});
test("every proposed stored shape round-trips arbitrary counters, tombstones and page boundaries", () => {
  let list = IdList.load(directStorageExample),
    seed = 42;
  const random = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  for (let i = 0; i < 600; i++) {
    if (i % 3) {
      const index = random(list.length + 1),
        before = index ? list.at(index - 1) : null;
      list = list.insertAfter(
        before,
        { bunchId: i % 7 ? "aB3dE5fG" : "__proto__", counter: 2 ** 40 + i * 8 },
        1 + random(4),
      );
    } else list = list.delete(list.at(random(list.length)), 1 + random(3));
  }
  for (const saved of [[], directStorageExample, list.save()])
    for (const format of directStorageFormats) {
      const state = JSON.parse(JSON.stringify(format.encode(saved)));
      assert.deepEqual(format.decode(state), saved, format.id);
      format.assertSnapshot?.(state);
      assert.deepEqual(
        IdList.load(format.decode(state)).save(),
        saved,
        format.id,
      );
    }
});
test("identity visibility decoder rejects truncated or surplus partitions", () => {
  const s = toIdentitySpans(directStorageExample);
  assert.throws(() => fromIdentitySpans({ ...s, visibilityCounts: [3] }));
  assert.throws(() =>
    fromIdentitySpans({ ...s, visibilityCounts: [...s.visibilityCounts, 1] }),
  );
  assert.throws(() =>
    fromIdentitySpans({ ...s, visibilityCounts: [0, ...s.visibilityCounts] }),
  );
});
