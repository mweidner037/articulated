import { expect } from "chai";
import { ElementId, IdList } from "../src";

describe("IdList Persistence", () => {
  // Helper to create ElementIds
  const createId = (bunchId: string, counter: number): ElementId => ({
    bunchId,
    counter,
  });

  describe("insertAfter", () => {
    it("returns a new data structure without modifying the original", () => {
      // Create an initial list with some IDs
      const initialId = createId("bunch1", 0);
      const initialList = IdList.fromIds([initialId]);

      // Perform insertAfter
      const newId = createId("bunch2", 0);
      const newList = initialList.insertAfter(initialId, newId);

      // Assert the new list has the newly inserted ID
      expect(newList.has(newId)).to.be.true;

      // Assert the original list is unchanged
      expect(initialList.has(newId)).to.be.false;
      expect(initialList.length).to.equal(1);
      expect(newList.length).to.equal(2);

      // Verify iterating over the lists produces the expected elements
      expect([...initialList]).to.deep.equal([initialId]);
      expect([...newList]).to.deep.equal([initialId, newId]);
    });

    it("handles bulk insertion without modifying the original", () => {
      // Create an initial list with some IDs
      const initialId = createId("bunch1", 0);
      const initialList = IdList.fromIds([initialId]);

      // Perform bulk insertAfter
      const newId = createId("bunch2", 0);
      const count = 3;
      const newList = initialList.insertAfter(initialId, newId, count);

      // Assert the new list has all the newly inserted IDs
      for (let i = 0; i < count; i++) {
        expect(newList.has(createId(newId.bunchId, newId.counter + i))).to.be
          .true;
      }

      // Assert the original list is unchanged
      expect(initialList.length).to.equal(1);
      expect(newList.length).to.equal(4); // 1 original + 3 new
    });
  });

  describe("insertBefore", () => {
    it("returns a new data structure without modifying the original", () => {
      // Create an initial list with some IDs
      const initialId = createId("bunch1", 0);
      const initialList = IdList.fromIds([initialId]);

      // Perform insertBefore
      const newId = createId("bunch2", 0);
      const newList = initialList.insertBefore(initialId, newId);

      // Assert the new list has the newly inserted ID
      expect(newList.has(newId)).to.be.true;

      // Assert the original list is unchanged
      expect(initialList.has(newId)).to.be.false;
      expect(initialList.length).to.equal(1);
      expect(newList.length).to.equal(2);

      // Verify iterating over the lists produces the expected elements
      expect([...initialList]).to.deep.equal([initialId]);
      expect([...newList]).to.deep.equal([newId, initialId]);
    });

    it("handles bulk insertion without modifying the original", () => {
      // Create an initial list with some IDs
      const initialId = createId("bunch1", 0);
      const initialList = IdList.fromIds([initialId]);

      // Perform bulk insertBefore
      const newId = createId("bunch2", 0);
      const count = 3;
      const newList = initialList.insertBefore(initialId, newId, count);

      // Assert the new list has all the newly inserted IDs
      for (let i = 0; i < count; i++) {
        expect(newList.has(createId(newId.bunchId, newId.counter + i))).to.be
          .true;
      }

      // Assert the original list is unchanged
      expect(initialList.length).to.equal(1);
      expect(newList.length).to.equal(4); // 1 original + 3 new
    });
  });

  describe("delete", () => {
    it("returns a new data structure without modifying the original", () => {
      // Create an initial list with multiple IDs
      const id1 = createId("bunch1", 0);
      const id2 = createId("bunch1", 1);
      const initialList = IdList.fromIds([id1, id2]);

      // Delete one element
      const newList = initialList.delete(id1);

      // Assert the new list has the item marked as deleted
      expect(newList.has(id1)).to.be.false;
      expect(newList.isKnown(id1)).to.be.true; // Still known, just marked deleted

      // Assert the original list is unchanged
      expect(initialList.has(id1)).to.be.true;
      expect(initialList.length).to.equal(2);
      expect(newList.length).to.equal(1);

      // Verify iterating over the lists produces the expected elements
      expect([...initialList]).to.deep.equal([id1, id2]);
      expect([...newList]).to.deep.equal([id2]);
    });

    it("can delete multiple items without modifying originals", () => {
      // Create an initial list with multiple IDs
      const id1 = createId("bunch1", 0);
      const id2 = createId("bunch1", 1);
      const id3 = createId("bunch1", 2);
      const initialList = IdList.fromIds([id1, id2, id3]);

      // Delete in sequence to test persistence across multiple operations
      const list1 = initialList.delete(id1);
      const list2 = list1.delete(id2);

      // Each list should have the correct state
      expect(initialList.length).to.equal(3);
      expect(list1.length).to.equal(2);
      expect(list2.length).to.equal(1);

      expect([...initialList]).to.deep.equal([id1, id2, id3]);
      expect([...list1]).to.deep.equal([id2, id3]);
      expect([...list2]).to.deep.equal([id3]);
    });

    it("creates a proper persistent data structure with memory sharing", () => {
      // This test verifies the persistent aspect by checking that the same deletion
      // on two different branches results in equivalent but separate objects
      const id1 = createId("bunch1", 0);
      const id2 = createId("bunch1", 1);
      const initialList = IdList.fromIds([id1, id2]);

      // Branch 1: Delete id1
      const branch1 = initialList.delete(id1);

      // Branch 2: Delete id1 (same operation as branch1)
      const branch2 = initialList.delete(id1);

      // The two branches should be equivalent but not the same object
      expect(branch1).not.to.equal(branch2); // Different objects
      expect(branch1.length).to.equal(branch2.length);
      expect([...branch1]).to.deep.equal([...branch2]);

      // The original list is still untouched
      expect(initialList.has(id1)).to.be.true;
    });
  });

  describe("undelete", () => {
    it("returns a new data structure without modifying the original", () => {
      // Create a list with a deleted item
      const id1 = createId("bunch1", 0);
      const id2 = createId("bunch1", 1);
      let list = IdList.fromIds([id1, id2]);
      list = list.delete(id1); // Now id1 is deleted

      // Undelete the item
      const restoredList = list.undelete(id1);

      // Assert the new list has restored the item
      expect(restoredList.has(id1)).to.be.true;

      // Assert the original list is unchanged
      expect(list.has(id1)).to.be.false;
      expect(list.isKnown(id1)).to.be.true;
      expect(list.length).to.equal(1);
      expect(restoredList.length).to.equal(2);

      // Verify iterating over the lists produces the expected elements
      expect([...list]).to.deep.equal([id2]);
      expect([...restoredList]).to.deep.equal([id1, id2]);
    });
  });

  describe("complex operations", () => {
    it("maintains independence through a series of transformations", () => {
      // Start with an empty list
      const emptyList = IdList.new();

      // Insert at the beginning
      const id1 = createId("bunch1", 0);
      const list1 = emptyList.insertAfter(null, id1);

      // Insert after id1
      const id2 = createId("bunch2", 0);
      const list2 = list1.insertAfter(id1, id2);

      // Insert before id2
      const id3 = createId("bunch3", 0);
      const list3 = list2.insertBefore(id2, id3);

      // Delete id1
      const list4 = list3.delete(id1);

      // Undelete id1
      const list5 = list4.undelete(id1);

      // Verify each list has its correct state
      expect(emptyList.length).to.equal(0);
      expect([...emptyList]).to.deep.equal([]);

      expect(list1.length).to.equal(1);
      expect([...list1]).to.deep.equal([id1]);

      expect(list2.length).to.equal(2);
      expect([...list2]).to.deep.equal([id1, id2]);

      expect(list3.length).to.equal(3);
      expect([...list3]).to.deep.equal([id1, id3, id2]);

      expect(list4.length).to.equal(2);
      expect([...list4]).to.deep.equal([id3, id2]);

      expect(list5.length).to.equal(3);
      expect([...list5]).to.deep.equal([id1, id3, id2]);
    });

    it("allows multiple independent branches of operations", () => {
      // Start with a common ancestor
      const id1 = createId("bunch1", 0);
      const ancestor = IdList.fromIds([id1]);

      // Branch A: Insert new id after id1
      const idA = createId("branchA", 0);
      const branchA = ancestor.insertAfter(id1, idA);

      // Branch B: Insert new id after id1
      const idB = createId("branchB", 0);
      const branchB = ancestor.insertAfter(id1, idB);

      // Branch C: Delete id1
      const branchC = ancestor.delete(id1);

      // Verify each branch has its correct state
      expect(ancestor.length).to.equal(1);
      expect([...ancestor]).to.deep.equal([id1]);

      expect(branchA.length).to.equal(2);
      expect([...branchA]).to.deep.equal([id1, idA]);

      expect(branchB.length).to.equal(2);
      expect([...branchB]).to.deep.equal([id1, idB]);

      expect(branchC.length).to.equal(0);
      expect([...branchC]).to.deep.equal([]);

      // Combining operations from different branches
      // A -> C: Insert in A, then delete id1
      const branchAC = branchA.delete(id1);
      expect(branchAC.length).to.equal(1);
      expect([...branchAC]).to.deep.equal([idA]);

      // B -> A: Insert in B, then insert id from A
      const branchBA = branchB.insertAfter(id1, idA);
      expect(branchBA.length).to.equal(3);
      expect([...branchBA]).to.deep.equal([id1, idA, idB]);

      // Verify original branches are still intact
      expect(branchA.length).to.equal(2);
      expect([...branchA]).to.deep.equal([id1, idA]);

      expect(branchB.length).to.equal(2);
      expect([...branchB]).to.deep.equal([id1, idB]);
    });
  });

  describe("save and load", () => {
    it("preserves persistent semantics when saving and loading", () => {
      // Create a list with some operations
      const id1 = createId("bunch1", 0);
      const id2 = createId("bunch2", 0);
      const originalList = IdList.new()
        .insertAfter(null, id1)
        .insertAfter(id1, id2);

      // Save the list
      const savedState = originalList.save();

      // Load the list
      const loadedList = IdList.load(savedState);

      // Verify the loaded list matches the original
      expect(loadedList.length).to.equal(originalList.length);
      expect([...loadedList]).to.deep.equal([...originalList]);

      // Make changes to the original list
      const id3 = createId("bunch3", 0);
      const modifiedOriginal = originalList.insertAfter(id2, id3);

      // Make changes to the loaded list
      const id4 = createId("bunch4", 0);
      const modifiedLoaded = loadedList.insertAfter(id2, id4);

      // Verify each list has maintained its own state
      expect(originalList.length).to.equal(2);
      expect([...originalList]).to.deep.equal([id1, id2]);

      expect(modifiedOriginal.length).to.equal(3);
      expect([...modifiedOriginal]).to.deep.equal([id1, id2, id3]);

      expect(loadedList.length).to.equal(2);
      expect([...loadedList]).to.deep.equal([id1, id2]);

      expect(modifiedLoaded.length).to.equal(3);
      expect([...modifiedLoaded]).to.deep.equal([id1, id2, id4]);
    });
  });
});
