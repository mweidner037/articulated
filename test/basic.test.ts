import { assert, expect } from "chai";
import { ElementId, equalsId, expandIds, IdList } from "../src";

describe("ElementId utilities", () => {
  describe("equalsId", () => {
    it("should return true for identical IDs", () => {
      const id1: ElementId = { bunchId: "abc123", counter: 5 };
      const id2: ElementId = { bunchId: "abc123", counter: 5 };
      expect(equalsId(id1, id2)).to.be.true;
    });

    it("should return false for different bunchIds", () => {
      const id1: ElementId = { bunchId: "abc123", counter: 5 };
      const id2: ElementId = { bunchId: "def456", counter: 5 };
      expect(equalsId(id1, id2)).to.be.false;
    });

    it("should return false for different counters", () => {
      const id1: ElementId = { bunchId: "abc123", counter: 5 };
      const id2: ElementId = { bunchId: "abc123", counter: 6 };
      expect(equalsId(id1, id2)).to.be.false;
    });
  });

  describe("expandIds", () => {
    it("should expand a single ID to a list of sequential IDs", () => {
      const startId: ElementId = { bunchId: "abc123", counter: 5 };
      const expanded = expandIds(startId, 3);

      expect(expanded).to.have.length(3);
      expect(equalsId(expanded[0], { bunchId: "abc123", counter: 5 })).to.be
        .true;
      expect(equalsId(expanded[1], { bunchId: "abc123", counter: 6 })).to.be
        .true;
      expect(equalsId(expanded[2], { bunchId: "abc123", counter: 7 })).to.be
        .true;
    });

    it("should handle count = 0", () => {
      const startId: ElementId = { bunchId: "abc123", counter: 5 };
      const expanded = expandIds(startId, 0);
      expect(expanded).to.have.length(0);
    });

    it("should throw for negative count", () => {
      const startId: ElementId = { bunchId: "abc123", counter: 5 };
      expect(() => expandIds(startId, -1)).to.throw();
    });
  });
});

describe("IdList", () => {
  describe("constructor and static factory methods", () => {
    it("should create an empty list with default constructor", () => {
      const list = new IdList();
      expect(list.length).to.equal(0);
    });

    it("should create a list with present elements using fromIds", () => {
      const ids: ElementId[] = [
        { bunchId: "abc", counter: 1 },
        { bunchId: "abc", counter: 2 },
        { bunchId: "def", counter: 1 },
      ];

      const list = IdList.fromIds(ids);
      expect(list.length).to.equal(3);
      expect([...list].map((id) => id.counter)).to.deep.equal([1, 2, 1]);
      expect([...list].map((id) => id.bunchId)).to.deep.equal([
        "abc",
        "abc",
        "def",
      ]);
    });

    it("should create a list with deleted elements using from", () => {
      const elements = [
        { id: { bunchId: "abc", counter: 1 }, isDeleted: false },
        { id: { bunchId: "abc", counter: 2 }, isDeleted: true },
        { id: { bunchId: "def", counter: 1 }, isDeleted: false },
      ];

      const list = IdList.from(elements);
      expect(list.length).to.equal(2); // Only non-deleted elements count toward length

      // First one should be present
      expect(list.has({ bunchId: "abc", counter: 1 })).to.be.true;

      // Second one should be known but deleted
      expect(list.has({ bunchId: "abc", counter: 2 })).to.be.false;
      expect(list.isKnown({ bunchId: "abc", counter: 2 })).to.be.true;

      // Third one should be present
      expect(list.has({ bunchId: "def", counter: 1 })).to.be.true;
    });
  });

  describe("insert operations", () => {
    it("should insert at the beginning with insertAfter(null)", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      expect(list.length).to.equal(1);
      expect(equalsId(list.at(0), id)).to.be.true;
    });

    it("should insert after a specific element", () => {
      const list = new IdList();
      const id1: ElementId = { bunchId: "abc", counter: 1 };
      const id2: ElementId = { bunchId: "def", counter: 1 };

      list.insertAfter(null, id1);
      list.insertAfter(id1, id2);

      expect(list.length).to.equal(2);
      expect(equalsId(list.at(0), id1)).to.be.true;
      expect(equalsId(list.at(1), id2)).to.be.true;
    });

    it("should insert at the end with insertBefore(null)", () => {
      const list = new IdList();
      const id1: ElementId = { bunchId: "abc", counter: 1 };
      const id2: ElementId = { bunchId: "def", counter: 1 };

      list.insertAfter(null, id1);
      list.insertBefore(null, id2);

      expect(list.length).to.equal(2);
      expect(equalsId(list.at(0), id1)).to.be.true;
      expect(equalsId(list.at(1), id2)).to.be.true;
    });

    it("should insert before a specific element", () => {
      const list = new IdList();
      const id1: ElementId = { bunchId: "abc", counter: 1 };
      const id2: ElementId = { bunchId: "def", counter: 1 };

      list.insertAfter(null, id1);
      list.insertBefore(id1, id2);

      expect(list.length).to.equal(2);
      expect(equalsId(list.at(0), id2)).to.be.true;
      expect(equalsId(list.at(1), id1)).to.be.true;
    });

    it("should bulk insert multiple elements", () => {
      const list = new IdList();
      const startId: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, startId, 3);

      expect(list.length).to.equal(3);
      expect(equalsId(list.at(0), { bunchId: "abc", counter: 1 })).to.be.true;
      expect(equalsId(list.at(1), { bunchId: "abc", counter: 2 })).to.be.true;
      expect(equalsId(list.at(2), { bunchId: "abc", counter: 3 })).to.be.true;
    });

    it("should throw when inserting an ID that is already known", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      expect(() => list.insertAfter(null, id)).to.throw();
    });

    it("should throw when inserting after an ID that is not known", () => {
      const list = new IdList();
      const id1: ElementId = { bunchId: "abc", counter: 1 };
      const id2: ElementId = { bunchId: "def", counter: 1 };

      expect(() => list.insertAfter(id1, id2)).to.throw();
    });
  });

  describe("delete operations", () => {
    it("should mark an element as deleted", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      expect(list.length).to.equal(1);

      list.delete(id);
      expect(list.length).to.equal(0);
      expect(list.has(id)).to.be.false;
      expect(list.isKnown(id)).to.be.true;
    });

    it("should do nothing when deleting an unknown ID", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.delete(id);
      expect(list.length).to.equal(0);
      expect(list.isKnown(id)).to.be.false;
    });

    it("should do nothing when deleting an already deleted ID", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      list.delete(id);
      list.delete(id); // Second delete should do nothing

      expect(list.length).to.equal(0);
      expect(list.isKnown(id)).to.be.true;
    });
  });

  describe("undelete operations", () => {
    it("should restore a deleted element", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      list.delete(id);
      list.undelete(id);

      expect(list.length).to.equal(1);
      expect(list.has(id)).to.be.true;
    });

    it("should throw when undeleting an unknown ID", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      expect(() => list.undelete(id)).to.throw();
    });

    it("should do nothing when undeleting an already present ID", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      list.undelete(id); // Should do nothing

      expect(list.length).to.equal(1);
      expect(list.has(id)).to.be.true;
    });
  });

  describe("uninsert operations", () => {
    it("should completely remove an element", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.insertAfter(null, id);
      list.uninsert(id);

      expect(list.length).to.equal(0);
      expect(list.isKnown(id)).to.be.false;
      expect(() =>
        list.insertAfter(id, { bunchId: "abc", counter: 2 })
      ).to.throw();
    });

    it("should do nothing when uninserting an unknown ID", () => {
      const list = new IdList();
      const id: ElementId = { bunchId: "abc", counter: 1 };

      list.uninsert(id);
      expect(list.length).to.equal(0);
      expect(list.isKnown(id)).to.be.false;
    });
  });

  describe("accessor operations", () => {
    let list: IdList;
    const id1: ElementId = { bunchId: "abc", counter: 1 };
    const id2: ElementId = { bunchId: "def", counter: 1 };
    const id3: ElementId = { bunchId: "ghi", counter: 1 };

    beforeEach(() => {
      list = new IdList();
      list.insertAfter(null, id1);
      list.insertAfter(id1, id2);
      list.insertAfter(id2, id3);
      list.delete(id2); // Delete the middle element
    });

    it("should get an element by index", () => {
      expect(equalsId(list.at(0), id1)).to.be.true;
      expect(equalsId(list.at(1), id3)).to.be.true;
    });

    it("should throw when accessing an out-of-bounds index", () => {
      expect(() => list.at(-1)).to.throw();
      expect(() => list.at(2)).to.throw();
    });

    it("should find index of an element", () => {
      expect(list.indexOf(id1)).to.equal(0);
      expect(list.indexOf(id3)).to.equal(1);
    });

    it('should return -1 for index of a deleted element with bias "none"', () => {
      expect(list.indexOf(id2, "none")).to.equal(-1);
    });

    it('should return left index for deleted element with bias "left"', () => {
      expect(list.indexOf(id2, "left")).to.equal(0);
    });

    it('should return right index for deleted element with bias "right"', () => {
      expect(list.indexOf(id2, "right")).to.equal(1);
    });

    it("should throw when finding index of an unknown element", () => {
      const unknownId: ElementId = { bunchId: "xyz", counter: 1 };
      expect(() => list.indexOf(unknownId)).to.throw();
    });
  });

  describe("iteration", () => {
    let list: IdList;
    const id1: ElementId = { bunchId: "abc", counter: 1 };
    const id2: ElementId = { bunchId: "def", counter: 1 };
    const id3: ElementId = { bunchId: "ghi", counter: 1 };

    beforeEach(() => {
      list = new IdList();
      list.insertAfter(null, id1);
      list.insertAfter(id1, id2);
      list.insertAfter(id2, id3);
      list.delete(id2); // Delete the middle element
    });

    it("should iterate over present elements", () => {
      const ids = [...list];
      expect(ids).to.have.length(2);
      expect(equalsId(ids[0], id1)).to.be.true;
      expect(equalsId(ids[1], id3)).to.be.true;
    });

    it("should iterate over all known elements with valuesWithDeleted", () => {
      const elements = [...list.valuesWithDeleted()];
      expect(elements).to.have.length(3);

      expect(equalsId(elements[0].id, id1)).to.be.true;
      expect(elements[0].isDeleted).to.be.false;

      expect(equalsId(elements[1].id, id2)).to.be.true;
      expect(elements[1].isDeleted).to.be.true;

      expect(equalsId(elements[2].id, id3)).to.be.true;
      expect(elements[2].isDeleted).to.be.false;
    });
  });

  describe("KnownIdView", () => {
    let list: IdList;
    const id1: ElementId = { bunchId: "abc", counter: 1 };
    const id2: ElementId = { bunchId: "def", counter: 1 };
    const id3: ElementId = { bunchId: "ghi", counter: 1 };

    beforeEach(() => {
      list = new IdList();
      list.insertAfter(null, id1);
      list.insertAfter(id1, id2);
      list.insertAfter(id2, id3);
      list.delete(id2); // Delete the middle element
    });

    it("should include deleted elements in its view", () => {
      const knownIds = list.knownIds;
      expect(knownIds.length).to.equal(3);

      expect(equalsId(knownIds.at(0), id1)).to.be.true;
      expect(equalsId(knownIds.at(1), id2)).to.be.true;
      expect(equalsId(knownIds.at(2), id3)).to.be.true;
    });

    it("should find index of any known element", () => {
      const knownIds = list.knownIds;
      expect(knownIds.indexOf(id1)).to.equal(0);
      expect(knownIds.indexOf(id2)).to.equal(1);
      expect(knownIds.indexOf(id3)).to.equal(2);
    });

    it("should iterate over all known elements", () => {
      const knownIds = [...list.knownIds];
      expect(knownIds).to.have.length(3);
      expect(equalsId(knownIds[0], id1)).to.be.true;
      expect(equalsId(knownIds[1], id2)).to.be.true;
      expect(equalsId(knownIds[2], id3)).to.be.true;
    });
  });

  describe("cloning", () => {
    it("should create an independent copy", () => {
      const list = new IdList();
      const id1: ElementId = { bunchId: "abc", counter: 1 };
      const id2: ElementId = { bunchId: "def", counter: 1 };

      list.insertAfter(null, id1);
      list.insertAfter(id1, id2);

      const clone = list.clone();
      expect(clone.length).to.equal(2);

      // Modifying original should not affect clone
      list.delete(id1);
      expect(list.length).to.equal(1);
      expect(clone.length).to.equal(2);
    });
  });

  describe("persistence", () => {
    it("should save and load a list state", () => {
      const list = new IdList();

      // Insert a sequential bunch
      const startId: ElementId = { bunchId: "abc", counter: 1 };
      list.insertAfter(null, startId, 5);

      // Delete one of them
      list.delete({ bunchId: "abc", counter: 3 });

      // Insert another element
      list.insertAfter(
        { bunchId: "abc", counter: 5 },
        { bunchId: "def", counter: 1 }
      );

      // Save the state
      const savedState = list.save();

      // Create a new list and load the state
      const newList = new IdList();
      newList.load(savedState);

      // Check that the new list has the same state
      expect(newList.length).to.equal(5);
      expect(newList.has({ bunchId: "abc", counter: 1 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 2 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 3 })).to.be.false; // Deleted
      expect(newList.isKnown({ bunchId: "abc", counter: 3 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 4 })).to.be.true;
      expect(newList.has({ bunchId: "abc", counter: 5 })).to.be.true;
      expect(newList.has({ bunchId: "def", counter: 1 })).to.be.true;
    });

    it("should handle compression of sequential IDs", () => {
      const list = new IdList();

      // Insert a large sequential bunch
      const startId: ElementId = { bunchId: "abc", counter: 1 };
      list.insertAfter(null, startId, 100);

      // Save the state - this should be highly compressed
      const savedState = list.save();

      // The saved state should be compact (just one entry if bunching worked)
      expect(savedState.length).to.equal(1);
      assert.deepStrictEqual(savedState[0], {
        bunchId: "abc",
        startCounter: 1,
        count: 100,
        isDeleted: false,
      });

      // Create a new list and load the state
      const newList = new IdList();
      newList.load(savedState);

      // Check that the new list has all 100 elements
      expect(newList.length).to.equal(100);
    });
  });
});
