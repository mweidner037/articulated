import { IdList, type SavedIdList } from "articulated";
import { gunzipSync, gzipSync } from "fflate";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alignedView,
  bsonDocument,
  codecs,
  getCodec,
  loadBson,
  loadWire,
  readBits,
  wireBytes,
  writeBits,
  type BinaryState,
} from "./codecs";
import { example, forDocument } from "./fixture";

const cases: SavedIdList[] = [
  [],
  example,
  [
    { bunchId: "alice_0", startCounter: 4, count: 2, isDeleted: true },
    { bunchId: "bob_0", startCounter: 8, count: 3, isDeleted: false },
    { bunchId: "alice_0", startCounter: 0, count: 3, isDeleted: false },
    { bunchId: "alice_0", startCounter: 7, count: 2, isDeleted: false },
    { bunchId: "bob_0", startCounter: 11, count: 2, isDeleted: true },
  ],
  [
    { bunchId: "alice_z", startCounter: 0, count: 0, isDeleted: false },
    { bunchId: "alice_z", startCounter: 0, count: 1, isDeleted: true },
    { bunchId: "alice_z", startCounter: 1, count: 2, isDeleted: true },
  ],
];
test("chunked bit IO matches independent bit-by-bit encoding at every alignment", () => {
  for (let width = 1; width <= 32; width++)
    for (let offset = 0; offset < 8; offset++) {
      for (const value of [
        0,
        1,
        2 ** width - 1,
        Math.floor((2 ** width - 1) / 3),
      ]) {
        const actual = new Uint8Array(Math.ceil((offset + width) / 8));
        const expected = new Uint8Array(actual.length);
        for (let bit = 0; bit < width; bit++)
          if (Math.floor(value / 2 ** bit) % 2)
            expected[(offset + bit) >>> 3] |= 1 << ((offset + bit) % 8);
        writeBits(actual, offset, width, value);
        assert.deepEqual(actual, expected);
        assert.equal(readBits(actual, offset, width), value);
      }
    }
});
for (const codec of codecs)
  test(`${codec.name}: canonical runs, sparse exceptions, BSON, gzip, edit after load`, () => {
    for (const input of cases) {
      const original = IdList.load(input),
        expected = original.save(),
        payload = codec.save(original);
      for (const loaded of [
        codec.load(payload),
        loadBson(codec, bsonDocument(codec, payload)),
        loadWire(codec, gunzipSync(gzipSync(wireBytes(codec, payload)))),
      ]) {
        assert.deepEqual(loaded.save(), expected);
        assert.deepEqual([...loaded], [...original]);
        assert.deepEqual([...loaded.knownIds], [...original.knownIds]);
        const id = { bunchId: "new_0", counter: 0 };
        const changed = loaded.insertAfter(null, id);
        assert.equal(changed.length, loaded.length + 1);
        assert.deepEqual(changed.at(0), id);
        assert.equal(changed.delete(id).length, loaded.length);
      }
    }
  });
test("scalar traversal canonicalizes fragments and matches save after random edits", () => {
  let list = IdList.new();
  for (const counter of [0, 2, 1])
    list = list.insertAfter(
      counter === 0 ? null : { bunchId: "a_0", counter: counter === 1 ? 0 : 0 },
      { bunchId: "a_0", counter },
    );
  let seed = 1;
  for (let i = 0; i < 500; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    if (list.length && i % 3 === 0)
      list = list.delete(list.at(seed % list.length));
    else {
      const at = seed % (list.length + 1);
      list = list.insertAfter(at ? list.at(at - 1) : null, {
        bunchId: `random_${i.toString(36)}`,
        counter: 0,
      });
    }
    const runs: SavedIdList = [];
    list.experimentalSaveTo((bunchId, startCounter, count, isDeleted) =>
      runs.push({ bunchId, startCounter, count, isDeleted }),
    );
    assert.deepEqual(runs, list.save());
    assert.deepEqual(
      IdList.experimentalLoadFrom((emit) =>
        list.experimentalSaveTo(emit),
      ).save(),
      list.save(),
    );
  }
});
test("direct and adapter produce byte-identical persisted data", () => {
  for (const input of cases)
    for (const [a, b] of [
      ["binary-adapter", "binary-direct"],
      ["bit-adapter", "bit-direct"],
      ["split-proto", "split-proto-direct"],
    ]) {
      const list = IdList.load(input),
        ca = getCodec(a),
        cb = getCodec(b);
      assert.deepEqual(
        bsonDocument(ca, ca.save(list)),
        bsonDocument(cb, cb.save(list)),
      );
    }
});
test("direct paths do not call save() or load() adapters", () => {
  for (const name of ["binary-direct", "bit-direct", "split-proto-direct"]) {
    const codec = getCodec(name),
      list = IdList.load(example);
    list.save = () => {
      throw new Error("Materialized SavedIdList on save");
    };
    const payload = codec.save(list),
      oldLoad = IdList.load;
    try {
      IdList.load = () => {
        throw new Error("Materialized SavedIdList on load");
      };
      assert.deepEqual(codec.load(payload).save(), example);
    } finally {
      IdList.load = oldLoad;
    }
  }
});
test("typed views: aligned zero-copy, unaligned safe copy", () => {
  const bytes = new Uint8Array(12);
  new DataView(bytes.buffer).setInt32(4, -123, true);
  const aligned = alignedView(bytes.subarray(4, 8), true);
  assert.equal(aligned[0], -123);
  assert.equal(aligned.buffer, bytes.buffer);
  const unaligned = new Uint8Array(5);
  new DataView(unaligned.buffer).setInt32(1, -123, true);
  const copied = alignedView(unaligned.subarray(1), true);
  assert.equal(copied[0], -123);
  assert.notEqual(copied.buffer, unaligned.buffer);
  assert.throws(() => alignedView(new Uint8Array(3), false));
});
test("packed boundaries, overflow and truncated fields are checked", () => {
  const codec = getCodec("bit-direct");
  for (const deleted of [false, true]) {
    const saved = [
      {
        bunchId: "a_0",
        startCounter: 2047,
        count: deleted ? 2048 : 2047,
        isDeleted: deleted,
      },
    ];
    assert.deepEqual(codec.load(codec.save(IdList.load(saved))).save(), saved);
  }
  for (const saved of [
    [{ bunchId: "a_0", startCounter: 2048, count: 1, isDeleted: false }],
    [{ bunchId: "a_0", startCounter: 0, count: 2048, isDeleted: false }],
    Array.from({ length: 8193 }, (_, i) => ({
      bunchId: `a_${i}`,
      startCounter: 0,
      count: 1,
      isDeleted: false,
    })),
  ])
    assert.throws(() => codec.save(IdList.load(saved)));
  const encoded = codec.save(IdList.load(example)) as BinaryState;
  assert.throws(() =>
    codec.load({ ...encoded, counts: encoded.counts.slice(1) }),
  );
  const binary = getCodec("binary-direct");
  assert.throws(() =>
    binary.save(
      IdList.load([
        { bunchId: "a_0", startCounter: 2 ** 32, count: 1, isDeleted: false },
      ]),
    ),
  );
});
test("direct loader preserves input validation", () => {
  assert.throws(() =>
    IdList.experimentalLoadFrom((emit) => emit("x", -1, 1, false)),
  );
  assert.throws(() =>
    IdList.experimentalLoadFrom((emit) => emit("x", 0, 0.5, false)),
  );
  assert.throws(() =>
    IdList.experimentalLoadFrom((emit) => {
      emit("x", 0, 2, false);
      emit("x", 1, 1, true);
    }),
  );
});
test("Mongo document IDs differ while preserving client/sequence sharing", () => {
  const a = forDocument(example, 1),
    b = forDocument(example, 2);
  assert.notEqual(a[0].bunchId, b[0].bunchId);
  assert.equal(a[0].bunchId, a[3].bunchId);
  assert.equal(a[0].bunchId.slice(0, -2), a[2].bunchId.slice(0, -2));
});
