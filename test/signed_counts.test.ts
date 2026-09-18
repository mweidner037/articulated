import { expect } from "chai";
import { deserialize, serialize } from "bson";
import { IdList, SavedIdList, SavedSignedCountIdList } from "../src";

const original: SavedIdList = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
const signed: SavedSignedCountIdList = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3 },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1 },
  { bunchId: "aB3dE5fG", startCounter: 3, count: -2 },
];

describe("Experimental signed-count saved objects", () => {
  it("removes only isDeleted and encodes its value in the count sign", () => {
    const list = IdList.load(original);
    expect(list.saveSignedCounts()).to.deep.equal(signed);
    expect(list.save()).to.deep.equal(original);
    expect(IdList.loadSignedCounts(signed).save()).to.deep.equal(original);
    expect(IdList.loadSignedCounts(signed).saveSignedCounts()).to.deep.equal(
      signed
    );
  });

  it("round trips through ordinary JSON and BSON, with no Binary fields", () => {
    for (const input of [
      JSON.parse(JSON.stringify(signed)) as SavedSignedCountIdList,
      deserialize(serialize({ state: signed })).state as SavedSignedCountIdList,
    ])
      expect(IdList.loadSignedCounts(input).save()).to.deep.equal(original);
  });

  it("supports empty and zero-length runs consistently with the original loader", () => {
    expect(IdList.new().saveSignedCounts()).to.deep.equal([]);
    for (const count of [0, -0]) {
      expect(
        IdList.loadSignedCounts([
          { bunchId: "zero", startCounter: 0, count },
        ]).save()
      ).to.deep.equal([]);
    }
  });

  it("preserves tombstones, ID order, and continued immutable editing", () => {
    const before = IdList.load(original);
    const after = IdList.loadSignedCounts(signed);
    expect([...after]).to.deep.equal([...before]);
    const deleted = { bunchId: "aB3dE5fG", counter: 3 };
    expect(after.has(deleted)).to.equal(false);
    expect([...after.knownIds]).to.deep.equal([...before.knownIds]);
    const extra = { bunchId: "new-id", counter: 0 };
    expect(after.insertAfter(deleted, extra).save()).to.deep.equal(
      before.insertAfter(deleted, extra).save()
    );
    expect(after.delete(after.at(0)).save()).to.deep.equal(
      before.delete(before.at(0)).save()
    );
    expect(after.saveSignedCounts()).to.deep.equal(signed);
  });

  it("does not mutate or retain aliases to input and output objects", () => {
    const input = JSON.parse(JSON.stringify(signed)) as SavedSignedCountIdList;
    const list = IdList.loadSignedCounts(input);
    input[0] = { bunchId: "changed", startCounter: 0, count: 1 };
    const output = list.saveSignedCounts();
    output[0] = input[0];
    expect(list.saveSignedCounts()).to.deep.equal(signed);
  });

  it("keeps safe-integer counts and starts beyond the bit-packed limits", () => {
    for (const count of [Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER]) {
      const input = [
        { bunchId: "arbitrary length ID", startCounter: 0, count },
      ];
      expect(IdList.loadSignedCounts(input).saveSignedCounts()).to.deep.equal(
        input
      );
    }
    const input = [
      { bunchId: "a", startCounter: Number.MAX_SAFE_INTEGER - 1, count: -1 },
    ];
    expect(IdList.loadSignedCounts(input).saveSignedCounts()).to.deep.equal(
      input
    );
  });

  it("rejects noninteger and unsafe counts and invalid starting counters", () => {
    for (const count of [
      NaN,
      Infinity,
      -Infinity,
      1.5,
      -1.5,
      Number.MAX_SAFE_INTEGER + 1,
      -Number.MAX_SAFE_INTEGER - 1,
    ]) {
      expect(() =>
        IdList.loadSignedCounts([{ bunchId: "a", startCounter: 0, count }])
      ).to.throw("Invalid signed count");
    }
    for (const startCounter of [
      -1,
      1.5,
      NaN,
      Infinity,
      Number.MAX_SAFE_INTEGER + 1,
    ]) {
      expect(() =>
        IdList.loadSignedCounts([{ bunchId: "a", startCounter, count: -1 }])
      ).to.throw("Invalid startCounter");
    }
  });

  it("does not silently change the original save/load contract", () => {
    expect(() =>
      IdList.load([
        { bunchId: "a", startCounter: 0, count: -2, isDeleted: false },
      ])
    ).to.throw("Invalid count");
    expect(IdList.load(original).save()).to.deep.equal(original);
  });
});
