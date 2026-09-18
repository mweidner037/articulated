import { expect } from "chai";
import { deserialize, serialize } from "bson";
import { SavedIdList } from "../src";
import {
  at,
  decode,
  encode,
  fromMongo,
  mongo,
  retain,
  storageVariant,
  variants,
  Encoded,
} from "../benchmarks/format_matrix";

describe("Benchmark-only encoding matrix", () => {
  for (const family of ["four-field", "signed-count"] as const) {
    for (const variant of variants)
      it(`${family}: ${variant} round trips and owns retained inputs`, () => {
        for (const length of [0, 1, 2, 3, 7, 8, 9, 31, 100]) {
          const saved: SavedIdList = Array.from({ length }, (_, i) => ({
            bunchId: `bunch-${i % 7}`,
            startCounter: (i * 19) % 2048,
            count: i % 2 ? 2047 : 1,
            isDeleted: i % 3 === 0,
          }));
          const input = encode(saved, family, storageVariant(variant));
          expect(decode(input, family, storageVariant(variant))).to.deep.equal(
            saved
          );
          const roundTrip = fromMongo(
            deserialize(serialize({ state: mongo(input) })).state as Encoded
          );
          expect(
            decode(roundTrip, family, storageVariant(variant))
          ).to.deep.equal(saved);
          const retained = retain(roundTrip, family, variant);
          const retainedVariant =
            variant === "binary-columns"
              ? "typed-columns"
              : variant === "binary-flat"
              ? "typed-flat"
              : variant;
          expect(decode(retained, family, retainedVariant)).to.deep.equal(
            saved
          );
          if (Array.isArray(roundTrip)) roundTrip.length = 0;
          else {
            roundTrip.bunchIds.fill("changed");
            for (const value of Object.values(roundTrip)) {
              if (ArrayBuffer.isView(value)) (value as Uint8Array).fill(0);
              else if (Array.isArray(value)) value.length = 0;
            }
          }
          expect(decode(retained, family, retainedVariant)).to.deep.equal(
            saved
          );
          expect(() => at(retained, family, retainedVariant, -1)).to.throw();
          expect(() =>
            at(retained, family, retainedVariant, length)
          ).to.throw();
        }
      });
  }
  it("preserves separate deletion columns versus signed counts", () => {
    const saved = [
      { bunchId: "a", startCounter: 3, count: 2, isDeleted: true },
    ];
    expect(encode(saved, "four-field", "columns")).to.deep.equal({
      version: 1,
      bunchIds: ["a"],
      bunchIndexes: [0],
      startCounters: [3],
      counts: [2],
      isDeleted: [true],
    });
    expect(encode(saved, "signed-count", "columns")).to.deep.equal({
      version: 1,
      bunchIds: ["a"],
      bunchIndexes: [0],
      startCounters: [3],
      signedCounts: [-2],
    });
  });
  it("rejects packed overflow rather than truncating", () => {
    for (const family of ["four-field", "signed-count"] as const) {
      for (const variant of [
        "packed-eight",
        "packed-five",
        "bit-columns",
      ] as const) {
        for (const patch of [
          { startCounter: 2048 },
          { count: 2049 },
          { count: 0 },
        ]) {
          expect(() =>
            encode(
              [
                {
                  bunchId: "a",
                  startCounter: 0,
                  count: 1,
                  isDeleted: true,
                  ...patch,
                },
              ],
              family,
              variant
            )
          ).to.throw();
        }
        expect(() =>
          encode(
            Array.from({ length: 8193 }, (_, i) => ({
              bunchId: `${i}`,
              startCounter: 0,
              count: 1,
              isDeleted: false,
            })),
            family,
            variant
          )
        ).to.throw();
      }
    }
  });
});
