import { expect } from "chai";
import {
  ColumnarIdList,
  IdList,
  SavedColumnarIdList,
  SavedIdList,
} from "../src";

const example: SavedColumnarIdList = {
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
};

describe("ColumnarIdList (JSON + typed JS columns)", () => {
  it("reads typed columns and serializes back to readable JSON", () => {
    const snapshot = ColumnarIdList.load(example);
    expect(snapshot.runCount).to.equal(3);
    expect(snapshot.bunchCount).to.equal(2);
    expect(snapshot.numericByteLength).to.equal(9);
    expect(snapshot.at(2)).to.deep.equal({
      bunchId: "aB3dE5fG",
      startCounter: 3,
      count: 2,
      isDeleted: true,
    });
    expect(snapshot.toJSON()).to.deep.equal(example);
    expect(JSON.parse(JSON.stringify(snapshot))).to.deep.equal(example);
    expect(ColumnarIdList.fromSaved(snapshot.toSaved()).toJSON()).to.deep.equal(
      example
    );
  });

  it("copies input/output arrays and preserves arbitrary strings", () => {
    const input = {
      version: 1 as const,
      bunchIds: ["\ud800😀\ufeff"],
      bunchIndexes: [0],
      startCounters: [0],
      signedCounts: [-1],
    };
    const snapshot = ColumnarIdList.load(input);
    input.bunchIds[0] = "changed";
    input.startCounters[0] = 100;
    expect(snapshot.bunchIdAt(0)).to.equal("\ud800😀\ufeff");
    expect(snapshot.startCounterAt(0)).to.equal(0);
    const output = snapshot.toJSON();
    (output.bunchIds as string[])[0] = "changed";
    (output.signedCounts as number[])[0] = 3;
    expect(snapshot.isDeletedAt(0)).to.equal(true);
    expect(snapshot.bunchIdAt(0)).to.equal("\ud800😀\ufeff");
  });

  it("selects unsigned and signed widths without truncation", () => {
    for (const [start, width] of [
      [255, 1],
      [256, 2],
      [65535, 2],
      [65536, 4],
      [2 ** 32 - 1, 4],
      [2 ** 32, 8],
      [Number.MAX_SAFE_INTEGER, 8],
    ]) {
      const snapshot = ColumnarIdList.load({
        version: 1,
        bunchIds: ["id"],
        bunchIndexes: [0],
        startCounters: [start],
        signedCounts: [1],
      });
      expect(snapshot.startCounterAt(0)).to.equal(start);
      expect(snapshot.numericByteLength).to.equal(width + 2);
    }
    for (const [count, width] of [
      [-128, 1],
      [127, 1],
      [-129, 2],
      [128, 2],
      [-32768, 2],
      [32767, 2],
      [-32769, 4],
      [32768, 4],
      [-2147483648, 4],
      [2147483647, 4],
      [-2147483649, 8],
      [2147483648, 8],
      [Number.MAX_SAFE_INTEGER, 8],
      [-Number.MAX_SAFE_INTEGER, 8],
    ]) {
      const input = {
        version: 1 as const,
        bunchIds: ["id"],
        bunchIndexes: [0],
        startCounters: [0],
        signedCounts: [count],
      };
      const snapshot = ColumnarIdList.load(input);
      expect(snapshot.countAt(0)).to.equal(Math.abs(count));
      expect(snapshot.isDeletedAt(0)).to.equal(count < 0);
      expect(snapshot.numericByteLength).to.equal(width + 2);
      expect(
        ColumnarIdList.load(
          JSON.parse(JSON.stringify(snapshot)) as SavedColumnarIdList
        ).toJSON()
      ).to.deep.equal(input);
    }
    const manyIds = Array.from({ length: 65537 }, (_, i) => `id${i}`);
    const largeIndex = ColumnarIdList.load({
      version: 1,
      bunchIds: manyIds,
      bunchIndexes: [65536],
      startCounters: [0],
      signedCounts: [1],
    });
    expect(largeIndex.bunchIdAt(0)).to.equal("id65536");
    expect(largeIndex.numericByteLength).to.equal(6);
  });

  it("rejects invalid JSON before typed conversion can coerce it", () => {
    const invalid: unknown[] = [
      null,
      {},
      { ...example, version: 2 },
      { ...example, bunchIds: [1] },
      { ...example, bunchIds: new Array<string>(2) },
      { ...example, bunchIndexes: [0] },
      { ...example, startCounters: new Uint8Array([0, 0, 3]) },
    ];
    for (const field of [
      "bunchIndexes",
      "startCounters",
      "signedCounts",
    ] as const) {
      for (const value of [
        NaN,
        Infinity,
        0.5,
        Number.MAX_SAFE_INTEGER + 1,
        "1",
        null,
        undefined,
      ]) {
        invalid.push({ ...example, [field]: [value, 0, 1] });
      }
    }
    invalid.push(
      { ...example, bunchIndexes: [0, 2, 0] },
      { ...example, startCounters: [-1, 0, 3] },
      { ...example, signedCounts: [0, 1, -2] },
      { ...example, signedCounts: [-0, 1, -2] },
      { ...example, startCounters: [Number.MAX_SAFE_INTEGER, 0, 3] }
    );
    for (const value of invalid)
      expect(() =>
        ColumnarIdList.load(value as SavedColumnarIdList)
      ).to.throw();
    for (const index of [-1, 0.5, 3, NaN])
      expect(() => ColumnarIdList.load(example).at(index)).to.throw(RangeError);
  });

  it("ignores empty runs and supports empty snapshots", () => {
    const runs: SavedIdList = [
      { bunchId: "id", startCounter: 0, count: 0, isDeleted: true },
    ];
    expect(ColumnarIdList.fromSaved(runs).runCount).to.equal(0);
    expect(
      IdList.loadColumnar(IdList.new().saveColumnar()).save()
    ).to.deep.equal([]);
    expect(() =>
      ColumnarIdList.fromSaved([{ ...runs[0], count: -1 }])
    ).to.throw();
  });

  it("preserves tombstones and continued immutable editing through JSON round trips", () => {
    let list = IdList.new();
    for (let i = 0; i < 100; i++)
      list = list.insertAfter(i === 0 ? null : list.at(list.length - 1), {
        bunchId: "aB3dE5fG",
        counter: i,
      });
    for (let i = 0; i < 100; i += 3)
      list = list.delete({ bunchId: "aB3dE5fG", counter: i });
    const saved = list.saveColumnar();
    const loaded = IdList.loadColumnar(
      JSON.parse(JSON.stringify(saved)) as SavedColumnarIdList
    );
    expect(loaded.save()).to.deep.equal(list.save());
    const deleted = { bunchId: "aB3dE5fG", counter: 3 };
    expect(loaded.isKnown(deleted)).to.equal(true);
    expect(loaded.has(deleted)).to.equal(false);
    expect(loaded.cursorIndex(deleted)).to.equal(list.cursorIndex(deleted));
    const next = loaded
      .undelete(deleted)
      .insertAfter(deleted, { bunchId: "hJ7kL9mN", counter: 0 });
    expect(next.save()).to.deep.equal(
      list
        .undelete(deleted)
        .insertAfter(deleted, { bunchId: "hJ7kL9mN", counter: 0 })
        .save()
    );
    expect(loaded.save()).to.deep.equal(list.save());
  });
});
