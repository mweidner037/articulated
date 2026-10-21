import { IdList, type SavedIdList } from "articulated";
import { Binary, deserialize, serialize } from "bson";
import assert from "node:assert/strict";
import { test } from "node:test";
import { directStorageExample } from "./direct-storage-formats";
import { flatFloat64Candidates } from "./flat-f64-candidates";
import {
  decodeFlatColumns,
  flatFloat64Format,
  packFloat64,
  readFloat64,
  type FlatBinary,
  type FlatColumns,
} from "./flat-f64-formats";
import { storageSweepFormats } from "./storage-sweep-formats";

test("Float64 preserves safe integers including signed values above 32 bits, with little-endian bytes", () => {
  const values = [
    0,
    1,
    -2,
    2 ** 32 + 17,
    -(2 ** 40 + 13),
    Number.MAX_SAFE_INTEGER,
    -Number.MAX_SAFE_INTEGER,
  ];
  assert.deepEqual([...readFloat64(packFloat64(values))], values);
  assert.deepEqual([...readFloat64(packFloat64(values), false)], values);
  assert.deepEqual([...packFloat64([1]).value()], [0, 0, 0, 0, 0, 0, 240, 63]);
  for (const n of [NaN, Infinity, 1.5, 2 ** 53])
    assert.throws(() => packFloat64([n]));
});
test("Float64 aligned views share bytes; unaligned and portable paths copy safely", () => {
  const aligned = packFloat64([1, -2, Number.MAX_SAFE_INTEGER]);
  assert.equal(readFloat64(aligned).buffer, aligned.value().buffer);
  const storage = new Uint8Array(aligned.length() + 1);
  storage.set(aligned.value(), 1);
  const unaligned = new Binary(storage.subarray(1));
  const copy = readFloat64(unaligned);
  assert.notEqual(copy.buffer, storage.buffer);
  assert.deepEqual([...copy], [1, -2, Number.MAX_SAFE_INTEGER]);
  assert.deepEqual([...readFloat64(unaligned, false)], [...copy]);
  assert.throws(() => readFloat64(new Binary(new Uint8Array(7))));
  assert.throws(() =>
    readFloat64(new Binary(new Uint8Array(8), Binary.SUBTYPE_BYTE_ARRAY)),
  );
});
for (const c of flatFloat64Candidates) {
  test(`${c.id}: exact canonical-style and large-counter roundtrips through bytes and IdList.load`, () => {
    const large: SavedIdList = [
      {
        bunchId: "aB3dE5fG",
        startCounter: 2 ** 40 + 7,
        count: 3,
        isDeleted: false,
      },
      {
        bunchId: "hJ7kL9mN",
        startCounter: Number.MAX_SAFE_INTEGER - 5,
        count: 2,
        isDeleted: true,
      },
      {
        bunchId: "aB3dE5fG",
        startCounter: 2 ** 40 + 10,
        count: 2,
        isDeleted: true,
      },
    ];
    const many: SavedIdList = Array.from({ length: 1100 }, (_, i) => ({
      bunchId: ["aB3dE5fG", "hJ7kL9mN"][i % 2],
      startCounter: i * 7,
      count: 3,
      isDeleted: i % 3 === 0,
    }));
    for (const saved of [[], directStorageExample, large, many]) {
      const state = c.decode(c.encode(saved));
      assert.deepEqual(c.logical(state), saved);
      assert.deepEqual(c.hydrate(state).save(), IdList.load(saved).save());
    }
  });
}
test("BSON binary fields match JSON columns with no schema metadata; no 32-bit count truncation", () => {
  const saved: SavedIdList = [
    {
      bunchId: "aB3dE5fG",
      startCounter: 0,
      count: 2 ** 40 + 9,
      isDeleted: true,
    },
  ];
  const state = deserialize(
    serialize({ state: flatFloat64Format.encode(saved) }),
  ).state as FlatBinary;
  assert.deepEqual(Object.keys(state), [
    "bunchIds",
    "startCounterIndexes",
    "startCounters",
    "counts",
  ]);
  assert.deepEqual(flatFloat64Format.decode(state), saved);
  assert.deepEqual(IdList.load(flatFloat64Format.decode(state)).save(), saved);
});
test("Direct reader rejects invalid exception indices, mismatched columns and invalid numeric values", () => {
  const f = storageSweepFormats.find((f) => f.id === "Sflat-joined")!;
  const valid = f.encode(directStorageExample) as FlatColumns;
  assert.deepEqual(decodeFlatColumns(valid), directStorageExample);
  for (const bad of [
    { ...valid, bunchIds: "bad" },
    { ...valid, startCounterIndexes: [4, 1] },
    { ...valid, startCounterIndexes: [2, 0] },
    { ...valid, startCounters: [20] },
    { ...valid, counts: [3, NaN, 1, 2] },
    { ...valid, startCounters: [-1, 8] },
  ])
    assert.throws(() => decodeFlatColumns(bad));
  const badBinary = flatFloat64Format.encode(
    directStorageExample,
  ) as FlatBinary;
  new DataView(badBinary.counts.value().buffer).setFloat64(0, Infinity, true);
  assert.throws(() => flatFloat64Format.decode(badBinary));
});
