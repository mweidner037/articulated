import { IdList, type SavedIdList } from "articulated";
import { Binary, deserialize, serialize } from "bson";
import assert from "node:assert/strict";
import { test } from "node:test";
import { FlatSavedIdListMessage } from "../generated/id_list_saved_state";
import { directStorageExample } from "./direct-storage-formats";
import type { FlatColumns } from "./flat-f64-formats";
import {
  decodeFlatProto,
  encodeFlatProto,
  flatProtoFormat,
  flatVarintFormat,
  packSintVarints,
  packUintVarints,
  readSintVarints,
  readUintVarints,
} from "./flat-varint-formats";
import { storageSweepFormats } from "./storage-sweep-formats";

const signed = [
  0,
  1,
  -1,
  63,
  -64,
  64,
  -65,
  2 ** 31,
  -(2 ** 31) - 1,
  2 ** 32 + 17,
  -(2 ** 40 + 13),
  Number.MAX_SAFE_INTEGER,
  -Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
];
const unsigned = signed.filter((n) => n >= 0);

test("Varints roundtrip the full safe-integer range and match protobuf uint64/sint64 bytes", () => {
  assert.deepEqual(readUintVarints(packUintVarints(unsigned)), unsigned);
  assert.deepEqual(readSintVarints(packSintVarints(signed)), signed);
  const msg = {
    bunchIds: "",
    startCounterIndexes: unsigned,
    startCounters: [],
    counts: signed,
  };
  assert.deepEqual(
    [...encodeFlatProto(msg)],
    [...FlatSavedIdListMessage.encode(msg).finish()],
  );
  // Small values cost one byte; this is the whole point versus Float64.
  assert.equal(packSintVarints([3, -2, 1, 63, -64]).length, 5);
  assert.equal(packSintVarints([64]).length, 2);
  for (const n of [NaN, Infinity, 1.5, 2 ** 53])
    assert.throws(() => packSintVarints([n]));
  assert.throws(() => packUintVarints([-1]));
  assert.throws(() => readUintVarints(new Uint8Array([128])));
  assert.throws(() => readUintVarints(new Uint8Array(9).fill(255)));
});

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

for (const format of [flatVarintFormat, flatProtoFormat])
  test(`${format.id}: exact roundtrips through BSON bytes and IdList.load`, () => {
    for (const saved of [[], directStorageExample, large, many]) {
      const state = deserialize(serialize({ state: format.encode(saved) }))
        .state as unknown;
      assert.deepEqual(format.decode(state), saved);
      assert.deepEqual(
        IdList.load(format.decode(state)).save(),
        IdList.load(saved).save(),
      );
    }
  });

test("Flat-Proto bytes are a valid FlatSavedIdListMessage for protobufjs and vice versa", () => {
  const flat = storageSweepFormats.find((f) => f.id === "Sflat-joined")!;
  for (const saved of [directStorageExample, large, many]) {
    const json = flat.encode(saved) as FlatColumns & {
      startCounterIndexes: number[];
      startCounters: number[];
      counts: number[];
    };
    const ours = encodeFlatProto(json);
    assert.deepEqual(
      [...ours],
      [...FlatSavedIdListMessage.encode(json).finish()],
    );
    const decoded = FlatSavedIdListMessage.decode(ours);
    // protobufjs decodes 64-bit fields as Long objects.
    const toNumbers = (xs: unknown[] | undefined) =>
      (xs ?? []).map((x) =>
        typeof x === "number" ? x : (x as { toNumber(): number }).toNumber(),
      );
    assert.equal(decoded.bunchIds, json.bunchIds);
    assert.deepEqual(toNumbers(decoded.startCounterIndexes), [
      ...json.startCounterIndexes,
    ]);
    assert.deepEqual(toNumbers(decoded.startCounters), [...json.startCounters]);
    assert.deepEqual(toNumbers(decoded.counts), [...json.counts]);
    assert.deepEqual(decodeFlatProto(ours), {
      ...json,
      startCounterIndexes: [...json.startCounterIndexes],
      startCounters: [...json.startCounters],
      counts: [...json.counts],
    });
  }
});

test("Flat-Proto rejects truncated fields; Flat-Varint rejects non-default Binary subtypes", () => {
  const bytes = (
    flatProtoFormat.encode(directStorageExample) as Binary
  ).value();
  assert.throws(() =>
    flatProtoFormat.decode(new Binary(bytes.subarray(0, bytes.length - 1))),
  );
  const state = flatVarintFormat.encode(directStorageExample) as {
    counts: Binary;
  };
  assert.throws(() =>
    flatVarintFormat.decode({
      ...state,
      counts: new Binary(state.counts.value(), Binary.SUBTYPE_BYTE_ARRAY),
    }),
  );
});
