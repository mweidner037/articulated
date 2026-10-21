import { IdList, type SavedIdList } from "articulated";
import { deserialize, serialize } from "bson";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  directStorageExample,
  directStorageFormats,
} from "./direct-storage-formats";
import { storageSweepFormats } from "./storage-sweep-formats";

for (const format of storageSweepFormats) {
  test(`${format.id}: exact BSON and JSON/binary roundtrip, page boundaries, editor validation`, () => {
    const rows: SavedIdList = Array.from({ length: 1100 }, (_, i) => ({
      bunchId: ["aB3dE5fG", "hJ7kL9mN"][i % 2],
      startCounter: i * 4,
      count: (i % 3) + 1,
      isDeleted: i % 4 === 0,
    }));
    for (const saved of [[], directStorageExample, rows] as SavedIdList[]) {
      const encoded = format.encode(saved);
      const bson = deserialize(serialize({ state: encoded })).state;
      const decoded = format.decode(bson);
      assert.deepEqual(decoded, saved);
      assert.deepEqual(IdList.load(decoded).save(), IdList.load(saved).save());
      if (!format.binary)
        assert.deepEqual(
          format.decode(JSON.parse(JSON.stringify(encoded))),
          saved,
        );
    }
  });
}
for (const id of ["F01", "F05", "DS08"]) {
  test(`${id}: exact existing encoding control`, () => {
    const current = storageSweepFormats.find((f) => f.id === id)!;
    const previous = directStorageFormats.find((f) => f.id === id)!;
    assert.deepEqual(
      current.encode(directStorageExample),
      previous.encode(directStorageExample),
    );
  });
}
test("Binary rejects out-of-range counts and counters; joined IDs reject wrong widths", () => {
  for (const format of storageSweepFormats.filter((f) => f.binary)) {
    assert.throws(() =>
      format.encode([
        {
          bunchId: "aB3dE5fG",
          startCounter: 2 ** 32,
          count: 1,
          isDeleted: false,
        },
      ]),
    );
    assert.throws(() =>
      format.encode([
        {
          bunchId: "aB3dE5fG",
          startCounter: 0,
          count: 2 ** 32,
          isDeleted: false,
        },
      ]),
    );
  }
  for (const format of storageSweepFormats.filter(
    (f) => f.idEncoding === "joined",
  ))
    assert.throws(() =>
      format.encode([
        { bunchId: "bad", startCounter: 0, count: 1, isDeleted: false },
      ]),
    );
});
