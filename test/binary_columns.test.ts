import { expect } from "chai";
import { Binary, deserialize, serialize } from "bson";
import {
  ColumnarIdList,
  IdList,
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
function saved() {
  return ColumnarIdList.load(example).toBinary();
}

describe("Dictionary + independent binary arrays", () => {
  it("uses only a dictionary, version and three raw binary arrays", () => {
    const input = saved();
    expect(Object.keys(input)).to.deep.equal(["version", "bunchIds", ...keys]);
    expect([...input.bunchIndexes]).to.deep.equal([
      0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect([...input.startCounters]).to.deep.equal([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 64,
    ]);
    expect([...input.signedCounts]).to.deep.equal([
      0, 0, 0, 0, 0, 0, 8, 64, 0, 0, 0, 0, 0, 0, 240, 63, 0, 0, 0, 0, 0, 0, 0,
      192,
    ]);
    const snapshot = ColumnarIdList.loadBinary(input);
    // Mongo bytes use the fixed schema; retained JS uses the narrowest safe types.
    expect(
      input.bunchIndexes.byteLength +
        input.startCounters.byteLength +
        input.signedCounts.byteLength
    ).to.equal(60);
    expect(snapshot.numericByteLength).to.equal(9);
    expect(snapshot.toJSON()).to.deep.equal(example);
    expect(snapshot.toBinary()).to.deep.equal(input);
  });

  it("round trips standard BSON Binary fields without a combined container", () => {
    const input = saved();
    const document = {
      ...input,
      bunchIndexes: new Binary(input.bunchIndexes),
      startCounters: new Binary(input.startCounters),
      signedCounts: new Binary(input.signedCounts),
    };
    const bytes = serialize({ state: document });
    const native = deserialize(bytes).state as typeof document;
    for (const key of keys) {
      expect(native[key]).to.be.instanceOf(Binary);
      expect(native[key].sub_type).to.equal(0);
      expect([...native[key].value()]).to.deep.equal([...input[key]]);
    }
    const decoded = deserialize(bytes, { promoteBuffers: true })
      .state as SavedBinaryColumnarIdList;
    expect(ColumnarIdList.loadBinary(decoded).toJSON()).to.deep.equal(example);
  });

  it("owns its inputs and outputs, including unaligned Buffer slices", () => {
    const input = saved();
    for (const key of keys) {
      const buffer = Buffer.alloc(input[key].length + 3, 255);
      buffer.set(input[key], 1);
      (input as { [K in (typeof keys)[number]]: Uint8Array })[key] =
        buffer.subarray(1, -2);
    }
    const snapshot = ColumnarIdList.loadBinary(input);
    for (const key of keys) input[key].fill(255);
    (input.bunchIds as string[])[0] = "changed";
    expect(snapshot.toJSON()).to.deep.equal(example);
    const output = snapshot.toBinary();
    for (const key of keys) output[key].fill(255);
    (output.bunchIds as string[])[0] = "changed again";
    expect(snapshot.toJSON()).to.deep.equal(example);
  });

  it("preserves safe integers beyond 32 bits without Float32 rounding", () => {
    for (const [start, count] of [
      [255, -128],
      [256, 128],
      [65535, -32768],
      [65536, 32768],
      [2 ** 24 + 1, 1],
      [2 ** 32 + 1, -1],
      [Number.MAX_SAFE_INTEGER, 1],
      [0, Number.MAX_SAFE_INTEGER],
      [0, -Number.MAX_SAFE_INTEGER],
    ]) {
      const json: SavedColumnarIdList = {
        version: 1,
        bunchIds: ["id"],
        bunchIndexes: [0],
        startCounters: [start],
        signedCounts: [count],
      };
      const original = ColumnarIdList.load(json);
      const restored = ColumnarIdList.loadBinary(original.toBinary());
      expect(restored.toJSON()).to.deep.equal(json);
      expect(restored.numericByteLength).to.equal(original.numericByteLength);
    }
    const ids = Array.from({ length: 65537 }, (_, i) => `id${i}`);
    const snapshot = ColumnarIdList.load({
      version: 1,
      bunchIds: ids,
      bunchIndexes: [65536],
      startCounters: [0],
      signedCounts: [1],
    });
    expect(
      ColumnarIdList.loadBinary(snapshot.toBinary()).bunchIdAt(0)
    ).to.equal("id65536");
  });

  it("rejects malformed fields, misaligned lengths and mismatched run counts", () => {
    const invalid: unknown[] = [
      null,
      {},
      { ...saved(), version: 2 },
      { ...saved(), bunchIds: [1] },
      { ...saved(), bunchIds: new Array<string>(2) },
    ];
    for (const key of keys) {
      for (const value of [null, [], new Uint8Array(1), new Uint8Array(0)])
        invalid.push({ ...saved(), [key]: value });
    }
    for (const input of invalid)
      expect(() =>
        ColumnarIdList.loadBinary(input as SavedBinaryColumnarIdList)
      ).to.throw();
  });

  it("validates decoded indexes, safe integers, signs and counter ranges", () => {
    for (const key of ["startCounters", "signedCounts"] as const) {
      for (const value of [
        NaN,
        Infinity,
        0.5,
        Number.MAX_SAFE_INTEGER + 1,
        ...(key === "startCounters" ? [-1, Number.MAX_SAFE_INTEGER] : [0, -0]),
      ]) {
        const input = saved();
        new DataView(input[key].buffer).setFloat64(0, value, true);
        expect(() => ColumnarIdList.loadBinary(input)).to.throw();
      }
    }
    for (const index of [2, 0xffffffff]) {
      const input = saved();
      new DataView(input.bunchIndexes.buffer).setUint32(0, index, true);
      expect(() => ColumnarIdList.loadBinary(input)).to.throw();
    }
  });

  it("supports empty snapshots and keeps dictionary strings as strings", () => {
    expect(IdList.loadBinary(IdList.new().saveBinary()).save()).to.deep.equal(
      []
    );
    const snapshot = ColumnarIdList.load({
      version: 1,
      bunchIds: ["\ud800😀\ufeff"],
      bunchIndexes: [0],
      startCounters: [0],
      signedCounts: [1],
    });
    expect(
      ColumnarIdList.loadBinary(snapshot.toBinary()).toJSON()
    ).to.deep.equal(snapshot.toJSON());
    // As with existing JSON storage, BSON's UTF-8 string limitations are separate
    // from the numeric binary columns (lone surrogates are not BSON-round-tripped).
  });

  it("preserves tombstones, cursors and continued editing", () => {
    let list = IdList.new();
    for (let i = 0; i < 100; i++)
      list = list.insertAfter(i ? list.at(list.length - 1) : null, {
        bunchId: "aB3dE5fG",
        counter: i,
      });
    for (let i = 0; i < 100; i += 3)
      list = list.delete({ bunchId: "aB3dE5fG", counter: i });
    const loaded = IdList.loadBinary(list.saveBinary());
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
