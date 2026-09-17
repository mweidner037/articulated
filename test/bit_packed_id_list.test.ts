import { expect } from "chai";
import { Binary, deserialize, serialize } from "bson";
import {
  BitPackedIdList,
  ColumnarIdList,
  IdList,
  SavedBitPackedColumnarIdList,
  SavedBinaryColumnarIdList,
  SavedColumnarIdList,
} from "../src";

const example: SavedColumnarIdList = {
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
};
const keys = ["bunchIndexes", "startCounters", "signedCounts"] as const;
function binary() {
  return BitPackedIdList.load(example).toBinary();
}

describe("BitPackedIdList (experimental version 2)", () => {
  it("stores the exact measured bytes, without type metadata or a binary envelope", () => {
    const saved = binary();
    expect(Object.keys(saved)).to.deep.equal(["version", "bunchIds", ...keys]);
    expect(saved.version).to.equal(2);
    expect([...saved.bunchIndexes]).to.deep.equal([0, 32, 0, 0, 0]);
    expect([...saved.startCounters]).to.deep.equal([0, 0, 192, 0, 0]);
    expect([...saved.signedCounts]).to.deep.equal([6, 32, 0, 3, 0]);
    const snapshot = BitPackedIdList.loadBinary(saved);
    expect(snapshot.numericByteLength).to.equal(15);
    expect(snapshot.runCount).to.equal(3);
    expect(snapshot.bunchCount).to.equal(2);
    expect(snapshot.bunchIdAt(2)).to.equal("aB3dE5fG");
    expect(snapshot.startCounterAt(2)).to.equal(3);
    expect(snapshot.countAt(2)).to.equal(2);
    expect(snapshot.isDeletedAt(2)).to.equal(true);
    expect(snapshot.at(2)).to.deep.equal({
      bunchId: "aB3dE5fG",
      startCounter: 3,
      count: 2,
      isDeleted: true,
    });
    expect(snapshot.toJSON()).to.deep.equal(example);
    expect(JSON.parse(JSON.stringify(snapshot))).to.deep.equal(example);
    expect([...snapshot]).to.deep.equal(ColumnarIdList.load(example).toSaved());
    expect(
      BitPackedIdList.fromSaved(snapshot.toSaved()).toBinary()
    ).to.deep.equal(saved);
  });

  it("round trips separate BSON Binary subtype-0 fields", () => {
    const input = binary();
    const document = {
      ...input,
      bunchIndexes: new Binary(input.bunchIndexes),
      startCounters: new Binary(input.startCounters),
      signedCounts: new Binary(input.signedCounts),
    };
    const bytes = serialize({ state: document });
    const native = deserialize(bytes).state as typeof document;
    for (const key of keys) {
      expect(native[key].sub_type).to.equal(0);
      expect([...native[key].value()]).to.deep.equal([...input[key]]);
    }
    const decoded = deserialize(bytes, { promoteBuffers: true })
      .state as SavedBitPackedColumnarIdList;
    expect(BitPackedIdList.loadBinary(decoded).toJSON()).to.deep.equal(example);
    expect(IdList.loadBitPacked(decoded).save()).to.deep.equal(
      ColumnarIdList.load(example).toSaved()
    );
  });

  it("owns JSON inputs, packed Buffer slices, and every exported array", () => {
    const json = JSON.parse(JSON.stringify(example)) as SavedColumnarIdList;
    const fromJson = BitPackedIdList.load(json);
    (json.bunchIds as string[])[0] = "changed";
    (json.startCounters as number[])[0] = 99;
    expect(fromJson.toJSON()).to.deep.equal(example);
    const input = binary();
    for (const key of keys) {
      const buffer = Buffer.alloc(input[key].length + 4, 255);
      buffer.set(input[key], 1);
      (input as { [K in (typeof keys)[number]]: Uint8Array })[key] =
        buffer.subarray(1, -3);
    }
    const snapshot = BitPackedIdList.loadBinary(input);
    for (const key of keys) input[key].fill(255);
    (input.bunchIds as string[])[0] = "changed";
    const output = snapshot.toBinary();
    for (const key of keys) output[key].fill(255);
    (output.bunchIds as string[])[0] = "changed again";
    const plain = snapshot.toJSON();
    (plain.bunchIds as string[])[0] = "changed";
    for (const key of keys) (plain[key] as number[]).fill(99);
    expect(snapshot.toJSON()).to.deep.equal(example);
  });

  it("handles empty snapshots, unused dictionary entries, and empty saved runs", () => {
    const empty = BitPackedIdList.fromSaved([]);
    expect(empty.numericByteLength).to.equal(0);
    expect(BitPackedIdList.loadBinary(empty.toBinary()).runCount).to.equal(0);
    expect(
      IdList.loadBitPacked(IdList.new().saveBitPacked()).save()
    ).to.deep.equal([]);
    expect(
      BitPackedIdList.fromSaved([
        { bunchId: "id", startCounter: 0, count: 0, isDeleted: true },
      ]).runCount
    ).to.equal(0);
    const unused: SavedColumnarIdList = {
      version: 1,
      bunchIds: ["\ud800😀\ufeff"],
      bunchIndexes: [],
      startCounters: [],
      signedCounts: [],
    };
    expect(
      BitPackedIdList.loadBinary(
        BitPackedIdList.load(unused).toBinary()
      ).toJSON()
    ).to.deep.equal(unused);
  });

  it("round trips both range endpoints and every byte-boundary alignment", () => {
    const ids = Array.from({ length: 8192 }, (_, i) => `id${i}`);
    for (let length = 0; length <= 100; length++) {
      const input: SavedColumnarIdList = {
        version: 1,
        bunchIds: ids,
        bunchIndexes: Array.from({ length }, (_, i) => (i % 2 ? 8191 : 0)),
        startCounters: Array.from({ length }, (_, i) =>
          i % 3 ? (i * 733) % 2048 : 2047
        ),
        signedCounts: Array.from(
          { length },
          (_, i) => [-2048, 2047, -1, 1, -2, 2][i % 6]
        ),
      };
      const snapshot = BitPackedIdList.load(input);
      expect(snapshot.numericByteLength).to.equal(
        Math.ceil((length * 13) / 8) +
          Math.ceil((length * 11) / 8) +
          Math.ceil((length * 12) / 8)
      );
      expect(
        BitPackedIdList.loadBinary(snapshot.toBinary()).toJSON()
      ).to.deep.equal(input);
    }
  });

  it("round trips deterministic varied values in all three columns", () => {
    let state = 42;
    const random = () =>
      (state = (Math.imul(state, 1664525) + 1013904223) >>> 0);
    const input: SavedColumnarIdList = {
      version: 1,
      bunchIds: Array.from({ length: 8192 }, (_, i) => `id${i}`),
      bunchIndexes: Array.from({ length: 3000 }, () => random() % 8192),
      startCounters: Array.from({ length: 3000 }, () => random() % 2048),
      signedCounts: Array.from(
        { length: 3000 },
        () => (random() % 4096) - 2048 || 1
      ),
    };
    expect(
      BitPackedIdList.loadBinary(
        BitPackedIdList.load(input).toBinary()
      ).toJSON()
    ).to.deep.equal(input);
  });

  it("throws on range overflow rather than truncating or changing the schema", () => {
    for (const input of [
      {
        ...example,
        bunchIds: Array.from({ length: 8193 }, (_, i) => `id${i}`),
      },
      { ...example, startCounters: [2048, 0, 3] },
      { ...example, signedCounts: [2048, 1, -2] },
      { ...example, signedCounts: [-2049, 1, -2] },
    ])
      expect(() => BitPackedIdList.load(input)).to.throw(RangeError);
    const large = IdList.load([
      { bunchId: "id", startCounter: 2048, count: 1, isDeleted: false },
    ]);
    expect(() => large.saveBitPacked()).to.throw(RangeError);
    expect(IdList.loadBinary(large.saveBinary()).save()).to.deep.equal(
      large.save()
    );
  });

  it("rejects invalid JSON before numeric coercion", () => {
    for (const field of keys)
      for (const value of [NaN, Infinity, 0.5, "1", null, undefined]) {
        expect(() =>
          BitPackedIdList.load({
            ...example,
            [field]: [value, 1, 1],
          } as SavedColumnarIdList)
        ).to.throw();
      }
    for (const value of [
      null,
      {},
      { ...example, signedCounts: [0, 1, -2] },
      { ...example, startCounters: [-1, 0, 3] },
      { ...example, bunchIndexes: [2, 1, 0] },
    ])
      expect(() =>
        BitPackedIdList.load(value as SavedColumnarIdList)
      ).to.throw();
  });

  it("rejects invalid versions, dictionaries, byte types and lengths", () => {
    const invalid: unknown[] = [
      null,
      {},
      { ...binary(), version: 1 },
      { ...binary(), bunchIds: [1] },
      { ...binary(), bunchIds: new Array<string>(2) },
      { ...binary(), bunchIds: Array.from({ length: 8193 }, () => "id") },
    ];
    for (const key of keys)
      for (const value of [
        null,
        [],
        new Uint16Array(5),
        new Uint8Array(0),
        new Uint8Array(1),
        new Uint8Array(4),
        new Uint8Array(6),
      ])
        invalid.push({ ...binary(), [key]: value });
    for (const value of invalid)
      expect(() =>
        BitPackedIdList.loadBinary(value as SavedBitPackedColumnarIdList)
      ).to.throw();
    expect(() =>
      ColumnarIdList.loadBinary(
        binary() as unknown as SavedBinaryColumnarIdList
      )
    ).to.throw();
    expect(() =>
      BitPackedIdList.loadBinary(
        ColumnarIdList.load(
          example
        ).toBinary() as unknown as SavedBitPackedColumnarIdList
      )
    ).to.throw();
  });

  it("rejects nonzero end padding, zero counts and missing dictionary references", () => {
    for (const key of keys) {
      const input = binary();
      input[key][input[key].length - 1] |= 128;
      expect(() => BitPackedIdList.loadBinary(input)).to.throw("padding");
    }
    const zero = binary();
    zero.signedCounts[0] = 0;
    zero.signedCounts[1] &= 240;
    expect(() => BitPackedIdList.loadBinary(zero)).to.throw("zero count");
    const missing = binary();
    missing.bunchIndexes[0] = 2;
    expect(() => BitPackedIdList.loadBinary(missing)).to.throw(
      "missing dictionary"
    );
  });

  it("checks bounds for scalar and object accessors", () => {
    const snapshot = BitPackedIdList.load(example);
    for (const index of [-1, 3, 0.5, NaN, Infinity]) {
      for (const method of [
        "at",
        "bunchIdAt",
        "startCounterAt",
        "countAt",
        "isDeletedAt",
      ] as const)
        expect(() => snapshot[method](index)).to.throw(RangeError);
    }
  });

  it("preserves tombstones, cursor positions and continued immutable editing", () => {
    let list = IdList.new();
    for (let i = 0; i < 100; i++)
      list = list.insertAfter(i ? list.at(list.length - 1) : null, {
        bunchId: "aB3dE5fG",
        counter: i,
      });
    for (let i = 0; i < 100; i += 3)
      list = list.delete({ bunchId: "aB3dE5fG", counter: i });
    const loaded = IdList.loadBitPacked(list.saveBitPacked());
    expect(loaded.save()).to.deep.equal(list.save());
    const deleted = { bunchId: "aB3dE5fG", counter: 3 };
    expect(loaded.isKnown(deleted)).to.equal(true);
    expect(loaded.has(deleted)).to.equal(false);
    expect(loaded.cursorIndex(deleted)).to.equal(list.cursorIndex(deleted));
    expect(
      loaded
        .undelete(deleted)
        .insertAfter(deleted, { bunchId: "hJ7kL9mN", counter: 0 })
        .save()
    ).to.deep.equal(
      list
        .undelete(deleted)
        .insertAfter(deleted, { bunchId: "hJ7kL9mN", counter: 0 })
        .save()
    );
    expect(loaded.save()).to.deep.equal(list.save());
  });
});
