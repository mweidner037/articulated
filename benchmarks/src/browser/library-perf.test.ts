import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { libraryCases, libraryLoad } from "./library-perf-candidates";

const saved: SavedIdList = Array.from({ length: 700 }, (_, i) => ({
  bunchId: `id${String(i % 31).padStart(6, "0")}`,
  startCounter: i * 7,
  count: 3,
  isDeleted: i % 4 === 0,
}));
for (const id of libraryCases) {
  test(`library runtime ${id}: same input, remote edits and old versions`, () => {
    const input = structuredClone(saved);
    let list = libraryLoad(id, input),
      reference = IdList.load(input);
    const original = list;
    for (let i = 0; i < 180; i++) {
      const index = (i * 7919) % reference.length;
      const anchor = reference.at(index);
      assert.deepEqual(list.at(index), anchor);
      assert.equal(list.indexOf(anchor), index);
      if (i % 3) {
        list = list.delete(anchor);
        reference = reference.delete(anchor);
      } else {
        const added = { bunchId: "added001", counter: i };
        list = list.insertAfter(anchor, added);
        reference = reference.insertAfter(anchor, added);
      }
    }
    assert.deepEqual(list.save(), reference.save());
    assert.deepEqual(original.save(), IdList.load(saved).save());
    assert.deepEqual(input, saved);
  });
}
