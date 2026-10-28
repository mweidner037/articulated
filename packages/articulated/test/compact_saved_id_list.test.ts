/* eslint-disable @typescript-eslint/no-unused-expressions */

import { assert, expect } from "chai";
import seedrandom from "seedrandom";
import type { CompactSavedIdList, ElementId, SavedIdList } from "../src";
import { IdList, compactSavedIdList, uncompactSavedIdList } from "../src";

describe("CompactSavedIdList", () => {
  // Helper to create ElementIds
  const createId = (bunchId: string, counter: number): ElementId => ({
    bunchId,
    counter,
  });

  /**
   * Checks that list's compact saved state round-trips (including through JSON)
   * and agrees with its ordinary saved state. Returns the compact saved state.
   */
  function checkCompact(list: IdList): CompactSavedIdList {
    const saved = list.save();
    const compact = list.saveCompact();

    expect(compact).to.deep.equal(compactSavedIdList(saved));
    expect(uncompactSavedIdList(compact)).to.deep.equal(saved);
    expect(
      uncompactSavedIdList(JSON.parse(JSON.stringify(compact))),
    ).to.deep.equal(saved);

    const loaded = IdList.loadCompact(compact);
    expect([...loaded.valuesWithIsDeleted()]).to.deep.equal([
      ...list.valuesWithIsDeleted(),
    ]);
    expect(loaded.save()).to.deep.equal(saved);

    return compact;
  }

  describe("saveCompact and loadCompact", () => {
    it("should save and load a list state", () => {
      let list = IdList.new();

      // Insert a sequential bunch
      const startId: ElementId = { bunchId: "abc", counter: 1 };
      list = list.insertAfter(null, startId, 5);

      // Delete one of them
      list = list.delete({ bunchId: "abc", counter: 3 });

      // Insert another element
      list = list.insertAfter(
        { bunchId: "abc", counter: 5 },
        { bunchId: "def", counter: 1 },
      );

      // Save the state
      const compact = list.saveCompact();

      // Create a new list and load the state
      const newList = IdList.loadCompact(compact);

      // Check that the new list has the same state
      expect(newList.length).to.equal(5);
      expect(newList.has({ bunchId: "abc", counter: 1 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 2 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 3 })).to.be.false; // Deleted
      expect(newList.isKnown({ bunchId: "abc", counter: 3 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 4 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 5 })).to.be.true;
      expect(newList.has({ bunchId: "def", counter: 1 })).to.be.true;

      checkCompact(list);
    });

    it("should handle compression of sequential IDs", () => {
      let list = IdList.new();

      // Insert a large sequential bunch starting at counter 0
      list = list.insertAfter(null, createId("abc", 0), 100);

      // Typical case: startCounter is inferred
      const compact = checkCompact(list);
      assert.deepStrictEqual(compact, {
        bunchIds: ["abc"],
        signedCounts: [100],
        startCounterDeltas: [],
        startCounterValues: [],
      });

      expect(IdList.loadCompact(compact).length).to.equal(100);
    });

    it("should record a nonzero first startCounter", () => {
      const list = IdList.new().insertAfter(null, createId("abc", 1), 100);

      const compact = checkCompact(list);
      assert.deepStrictEqual(compact, {
        bunchIds: ["abc"],
        signedCounts: [100],
        startCounterDeltas: [0],
        startCounterValues: [1],
      });
    });

    it("should encode isDeleted as negative counts", () => {
      let list = IdList.new().insertAfter(null, createId("seq", 0), 10);
      list = list.delete(createId("seq", 7));
      list = list.delete(createId("seq", 8));
      list = list.delete(createId("seq", 9));

      const compact = checkCompact(list);
      assert.deepStrictEqual(compact, {
        bunchIds: ["seq", "seq"],
        signedCounts: [7, -3],
        startCounterDeltas: [],
        startCounterValues: [],
      });

      const loaded = IdList.loadCompact(compact);
      for (let i = 7; i < 10; i++) {
        expect(loaded.has(createId("seq", i))).to.be.false;
        expect(loaded.isKnown(createId("seq", i))).to.be.true;
      }
      expect(loaded.length).to.equal(7);
      expect(loaded.knownIds.length).to.equal(10);
    });

    it("should infer startCounters per bunch across interleaved bunches", () => {
      // a0-2, then b0-2 in the middle of a, then a3-5 at the end, then b3-4 at the end.
      let list = IdList.new().insertAfter(null, createId("a", 0), 3);
      list = list.insertAfter(createId("a", 1), createId("b", 0), 3);
      list = list.insertAfter(createId("a", 2), createId("a", 3), 3);
      list = list.insertAfter(createId("a", 5), createId("b", 3), 2);

      const compact = checkCompact(list);
      assert.deepStrictEqual(compact, {
        bunchIds: ["a", "b", "a", "b"],
        signedCounts: [2, 3, 4, 2],
        startCounterDeltas: [],
        startCounterValues: [],
      });
    });

    it("should record startCounters after bunch holes", () => {
      // Uninsert creates a hole in the bunch's counters.
      let list = IdList.new().insertAfter(null, createId("a", 0), 10);
      list = list.uninsert(createId("a", 3), 3);

      const compact = checkCompact(list);
      assert.deepStrictEqual(compact, {
        bunchIds: ["a", "a"],
        signedCounts: [3, 4],
        startCounterDeltas: [1],
        startCounterValues: [6],
      });
    });

    it("should record startCounters for out-of-order bunches", () => {
      // Later counters to the left of earlier ones.
      let list = IdList.new().insertAfter(null, createId("a", 0), 5);
      list = list.insertBefore(createId("a", 0), createId("a", 5), 2);

      const compact = checkCompact(list);
      assert.deepStrictEqual(compact, {
        bunchIds: ["a", "a"],
        signedCounts: [2, 5],
        startCounterDeltas: [0, 1],
        startCounterValues: [5, 0],
      });
    });

    it("should delta-encode multiple exceptional startCounters", () => {
      // Exceptions at indexes 0, 2, 3, 6 (non-uniform gaps, including consecutive).
      const saved: SavedIdList = [
        { bunchId: "a", startCounter: 4, count: 2, isDeleted: false }, // exc
        { bunchId: "b", startCounter: 0, count: 3, isDeleted: true },
        { bunchId: "a", startCounter: 10, count: 1, isDeleted: false }, // exc
        { bunchId: "b", startCounter: 7, count: 1, isDeleted: false }, // exc
        { bunchId: "a", startCounter: 11, count: 2, isDeleted: true },
        { bunchId: "c", startCounter: 0, count: 1, isDeleted: false },
        { bunchId: "a", startCounter: 0, count: 4, isDeleted: false }, // exc
        { bunchId: "b", startCounter: 8, count: 2, isDeleted: false },
      ];

      const compact = compactSavedIdList(saved);
      assert.deepStrictEqual(compact, {
        bunchIds: ["a", "b", "a", "b", "a", "c", "a", "b"],
        signedCounts: [2, -3, 1, 1, -2, 1, 4, 2],
        startCounterDeltas: [0, 2, 1, 3],
        startCounterValues: [4, 10, 7, 0],
      });
      expect(uncompactSavedIdList(compact)).to.deep.equal(saved);

      const list = IdList.loadCompact(compact);
      expect(list.save()).to.deep.equal(saved);
      checkCompact(list);
    });

    it("should handle an exceptional startCounter only at the last index", () => {
      const saved: SavedIdList = [
        { bunchId: "a", startCounter: 0, count: 2, isDeleted: false },
        { bunchId: "b", startCounter: 0, count: 2, isDeleted: false },
        { bunchId: "a", startCounter: 5, count: 2, isDeleted: false },
      ];

      const compact = compactSavedIdList(saved);
      assert.deepStrictEqual(compact.startCounterDeltas, [2]);
      assert.deepStrictEqual(compact.startCounterValues, [5]);
      expect(uncompactSavedIdList(compact)).to.deep.equal(saved);
    });

    it("should handle bunch holes and reordering from list operations", () => {
      let list = IdList.new().insertAfter(null, createId("a", 0), 20);
      // Hole in the middle
      list = list.uninsert(createId("a", 5), 3);
      // Reinsert part of the hole elsewhere, out of order
      list = list.insertBefore(createId("a", 0), createId("a", 6), 1);
      // New bunch splitting a
      list = list.insertAfter(createId("a", 12), createId("b", 0), 4);
      // Higher counters of a before b
      list = list.insertAfter(createId("b", 1), createId("a", 20), 3);
      // Delete across leaf boundaries
      list = list.delete(createId("a", 4));
      list = list.delete(createId("a", 8));
      list = list.delete(createId("a", 21));

      const compact = checkCompact(list);
      expect(compact.startCounterDeltas.length).to.be.greaterThan(1);
    });

    it("should preserve persistent semantics when saving and loading", () => {
      const id1 = createId("bunch1", 0);
      const id2 = createId("bunch2", 0);
      const originalList = IdList.new()
        .insertAfter(null, id1)
        .insertAfter(id1, id2);

      const loadedList = IdList.loadCompact(originalList.saveCompact());
      expect([...loadedList]).to.deep.equal([...originalList]);

      const id3 = createId("bunch3", 0);
      const modifiedOriginal = originalList.insertAfter(id2, id3);
      const id4 = createId("bunch4", 0);
      const modifiedLoaded = loadedList.insertAfter(id2, id4);

      expect([...originalList]).to.deep.equal([id1, id2]);
      expect([...modifiedOriginal]).to.deep.equal([id1, id2, id3]);
      expect([...loadedList]).to.deep.equal([id1, id2]);
      expect([...modifiedLoaded]).to.deep.equal([id1, id2, id4]);
    });
  });

  describe("loadCompact function", () => {
    it("should correctly handle empty CompactSavedIdList", () => {
      const compact = IdList.new().saveCompact();
      assert.deepStrictEqual(compact, {
        bunchIds: [],
        signedCounts: [],
        startCounterDeltas: [],
        startCounterValues: [],
      });
      expect(IdList.loadCompact(compact).length).to.equal(0);
    });

    it("should skip entries with count = 0", () => {
      const saved: SavedIdList = [
        { bunchId: "bunch", startCounter: 0, count: 0, isDeleted: false },
        { bunchId: "bunch", startCounter: 1, count: 5, isDeleted: false },
      ];

      const compact = compactSavedIdList(saved);
      assert.deepStrictEqual(compact, {
        bunchIds: ["bunch", "bunch"],
        signedCounts: [0, 5],
        startCounterDeltas: [1],
        startCounterValues: [1],
      });
      expect(uncompactSavedIdList(compact)).to.deep.equal(saved);

      const list = IdList.loadCompact(compact);
      expect(list.length).to.equal(5);
      expect(list.has(createId("bunch", 0))).to.be.false;
      expect(list.has(createId("bunch", 1))).to.be.true;
    });

    it("should throw on invalid count or startCounter", () => {
      const test = (saved: SavedIdList) => {
        expect(() => IdList.loadCompact(compactSavedIdList(saved))).to.throw(
          /Invalid/,
        );
      };

      // Non-integer count
      test([
        { bunchId: "bunch", startCounter: 0, count: 1.5, isDeleted: false },
      ]);
      // Negative startCounter
      test([
        { bunchId: "bunch", startCounter: -1, count: 5, isDeleted: false },
      ]);
      // Non-integer startCounter
      test([
        { bunchId: "bunch", startCounter: 0.5, count: 5, isDeleted: false },
      ]);
    });

    it("should throw when loading duplicate ids", () => {
      const test = (saved: SavedIdList) => {
        expect(() => IdList.loadCompact(compactSavedIdList(saved))).to.throw(
          /duplicate ids/,
        );
      };

      // Overlapping leaves.
      test([
        { bunchId: "abc", startCounter: 0, count: 5, isDeleted: false },
        { bunchId: "abc", startCounter: 4, count: 5, isDeleted: true },
      ]);

      // Leaf that overwrites another.
      test([
        { bunchId: "abc", startCounter: 3, count: 5, isDeleted: false },
        { bunchId: "abc", startCounter: 3, count: 7, isDeleted: false },
      ]);

      // Overlapping leaves that are not adjacent in the list.
      test([
        { bunchId: "abc", startCounter: 0, count: 5, isDeleted: false },
        { bunchId: "def", startCounter: 0, count: 10, isDeleted: true },
        { bunchId: "abc", startCounter: 3, count: 5, isDeleted: false },
      ]);

      // Overlapping leaves that are out of order.
      test([
        { bunchId: "abc", startCounter: 3, count: 5, isDeleted: true },
        { bunchId: "abc", startCounter: 0, count: 5, isDeleted: false },
      ]);
    });

    it("should throw when given the wrong saved state format", () => {
      const list = IdList.new().insertAfter(null, createId("abc", 0), 3);

      expect(() =>
        IdList.load(list.saveCompact() as unknown as SavedIdList),
      ).to.throw(/Not a SavedIdList/);
      expect(() =>
        compactSavedIdList(list.saveCompact() as unknown as SavedIdList),
      ).to.throw(/Not a SavedIdList/);
      expect(() =>
        IdList.loadCompact(list.save() as unknown as CompactSavedIdList),
      ).to.throw(/Not a CompactSavedIdList/);
    });
  });

  describe("round-trip fuzzing", () => {
    it("should round-trip random SavedIdLists", () => {
      const prng = seedrandom("42");
      const bunchIds = ["a", "b", "c", "d"];

      for (let trial = 0; trial < 200; trial++) {
        const nextCounters = new Map<string, number>();
        const saved: SavedIdList = [];
        const length = Math.floor(prng() * 20);
        for (let i = 0; i < length; i++) {
          const bunchId = bunchIds[Math.floor(prng() * bunchIds.length)];
          const r = prng();
          // Usually the inferred counter; sometimes a jump forward or back.
          let startCounter = nextCounters.get(bunchId) ?? 0;
          if (r < 0.2) startCounter += 1 + Math.floor(prng() * 10);
          else if (r < 0.3) startCounter = Math.floor(prng() * 10);
          const count = 1 + Math.floor(prng() * 5);
          saved.push({
            bunchId,
            startCounter,
            count,
            isDeleted: prng() < 0.5,
          });
          nextCounters.set(bunchId, startCounter + count);
        }

        const compact = compactSavedIdList(saved);
        expect(compact.startCounterDeltas.length).to.equal(
          compact.startCounterValues.length,
        );
        expect(uncompactSavedIdList(compact)).to.deep.equal(saved);
        expect(
          uncompactSavedIdList(JSON.parse(JSON.stringify(compact))),
        ).to.deep.equal(saved);
      }
    });
  });
});
