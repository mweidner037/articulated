import { expect } from "chai";
import { ElementId, IdList, SavedIdList } from "../src";
import {
  InnerNode,
  InnerNodeInner,
  InnerNodeLeaf,
  LeafNode,
  locate,
} from "../src/id_list";

describe("IdList Internal Structure", () => {
  // Helper to create ElementIds
  const createId = (bunchId: string, counter: number): ElementId => ({
    bunchId,
    counter,
  });

  describe("locate function and traversal", () => {
    it("should correctly locate elements after tree restructuring", () => {
      let list = IdList.new();

      // Insert enough elements to force multiple levels in the B+Tree
      const ids: ElementId[] = [];
      for (let i = 0; i < 50; i++) {
        const id = createId(`id${i}`, 0);
        ids.push(id);
        list = list.insertAfter(i === 0 ? null : ids[i - 1], id);
      }

      // Access internal locate function
      const root = list["root"];

      // Verify locate works for all elements
      for (let i = 0; i < 50; i++) {
        const path = locate(ids[i], root);
        expect(path).to.not.be.null;
        expect(path?.length).to.be.greaterThan(0);

        // First item in path should be the leaf containing our id
        expect(path?.[0].node.bunchId).to.equal(`id${i}`);
        expect(path?.[0].node.startCounter).to.equal(0);
      }

      // Test locate on an unknown element
      const unknownId = createId("unknown", 0);
      const unknownPath = locate(unknownId, root);
      expect(unknownPath).to.be.null;
    });

    it("should correctly update paths after insertions and splits", () => {
      let list = IdList.new();

      // Insert elements to create a specific structure
      for (let i = 0; i < 20; i++) {
        list = list.insertAfter(null, createId(`id${i}`, 0));
      }

      // Find the path to an element in the middle
      const middleId = createId("id10", 0);
      let root = list["root"];
      let path = locate(middleId, root);

      // Remember the leaf node that contains middleId
      const originalLeaf = path?.[0].node;

      // Insert many elements after middleId to force a split
      for (let i = 0; i < 10; i++) {
        list = list.insertAfter(middleId, createId(`split${i}`, 0));

        // After each insertion, re-check the path
        root = list["root"];
        path = locate(middleId, root);

        // The element should still be locatable
        expect(path).to.not.be.null;
      }

      // The leaf node containing middleId might have changed due to splits
      const newLeaf = path?.[0].node;

      // Either we have the same leaf (if it wasn't split) or a different one
      if (originalLeaf === newLeaf) {
        // If the same leaf, it should contain middleId in the same position
        expect(originalLeaf?.bunchId).to.equal("id10");
        expect(originalLeaf?.startCounter).to.equal(0);
      } else {
        // If a new leaf, it should still contain middleId
        expect(newLeaf?.bunchId).to.equal("id10");
        expect(newLeaf?.startCounter).to.equal(0);
      }
    });
  });

  describe("replaceLeaf function", () => {
    it("should properly replace a leaf node with multiple nodes", () => {
      let list = IdList.new();

      // Create a list with sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 5);

      // Get the initial root
      const initialRoot = list["root"];

      // Insert a value that should cause a leaf split
      list = list.insertAfter(createId("bunch", 2), createId("split", 0));

      // Get the new root
      const newRoot = list["root"];

      // The new root might be different if the tree height increased
      // Test that the insertion and leaf replacement worked
      expect(list.indexOf(createId("bunch", 0))).to.equal(0);
      expect(list.indexOf(createId("bunch", 1))).to.equal(1);
      expect(list.indexOf(createId("bunch", 2))).to.equal(2);
      expect(list.indexOf(createId("split", 0))).to.equal(3);
      expect(list.indexOf(createId("bunch", 3))).to.equal(4);
      expect(list.indexOf(createId("bunch", 4))).to.equal(5);
    });

    it("should maintain correct sizes when replacing leaves", () => {
      let list = IdList.new();

      // Create a list with sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Insert more elements that will cause leaf splits
      for (let i = 0; i < 5; i++) {
        list = list.insertAfter(
          createId("bunch", i * 2),
          createId(`split${i}`, 0)
        );
      }

      const root = list["root"];

      // Helper to verify node sizes are consistent
      function verifyNodeSizes(node: InnerNode | LeafNode) {
        if ("children" in node && "children" in node.children[0]) {
          // Inner node with inner node children
          const nodeTyped = node as InnerNodeInner;
          let calculatedSize = 0;
          let calculatedKnownSize = 0;

          for (const child of nodeTyped.children) {
            verifyNodeSizes(child);
            calculatedSize += child.size;
            calculatedKnownSize += child.knownSize;
          }

          // The node's size should equal the sum of its children's sizes
          expect(nodeTyped.size).to.equal(calculatedSize);
          expect(nodeTyped.knownSize).to.equal(calculatedKnownSize);
        } else if ("children" in node) {
          // Inner node with leaf children
          const nodeTyped = node as InnerNodeLeaf;
          let calculatedSize = 0;
          let calculatedKnownSize = 0;

          for (const child of nodeTyped.children) {
            calculatedSize += child.present.count();
            calculatedKnownSize += child.count;
          }

          // The node's size should equal the sum of its children's sizes
          expect(nodeTyped.size).to.equal(calculatedSize);
          expect(nodeTyped.knownSize).to.equal(calculatedKnownSize);
        }
      }

      verifyNodeSizes(root);

      // The root size should match the list length
      expect(root.size).to.equal(list.length);
      expect(root.knownSize).to.equal(list.knownIds.length);
    });
  });

  describe("splitPresent function", () => {
    it("should correctly split present values", () => {
      let list = IdList.new();

      // Create a list with sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Delete some elements to create gaps in present values
      list = list.delete(createId("bunch", 3));
      list = list.delete(createId("bunch", 4));
      list = list.delete(createId("bunch", 7));

      // Now cause a split by inserting in the middle
      list = list.insertAfter(createId("bunch", 5), createId("split", 0));

      // Verify the structure after split
      for (let i = 0; i < 10; i++) {
        if (i === 3 || i === 4 || i === 7) {
          expect(list.has(createId("bunch", i))).to.be.false;
          expect(list.isKnown(createId("bunch", i))).to.be.true;
        } else {
          expect(list.has(createId("bunch", i))).to.be.true;
        }
      }

      expect(list.has(createId("split", 0))).to.be.true;

      // The order should be preserved with the split element in the middle
      expect(list.indexOf(createId("bunch", 2))).to.equal(2);
      expect(list.indexOf(createId("bunch", 5))).to.equal(3);
      expect(list.indexOf(createId("split", 0))).to.equal(4);
      expect(list.indexOf(createId("bunch", 6))).to.equal(5);
    });
  });

  describe("save and load with edge cases", () => {
    it("should correctly serialize and deserialize complex tree structures", () => {
      let list = IdList.new();

      // Create a list with elements that force a multi-level tree
      for (let i = 0; i < 50; i++) {
        // Alternate between sequential and non-sequential IDs
        if (i % 10 === 0) {
          // Start a new sequence
          list = list.insertAfter(
            i === 0
              ? null
              : createId(`seq${Math.floor((i - 1) / 10)}`, (i % 10) - 1),
            createId(`seq${Math.floor(i / 10)}`, 0)
          );
        } else {
          // Continue the sequence
          list = list.insertAfter(
            createId(`seq${Math.floor(i / 10)}`, (i % 10) - 1),
            createId(`seq${Math.floor(i / 10)}`, i % 10)
          );
        }
      }

      // Delete some elements to create gaps
      for (let i = 0; i < 5; i++) {
        list = list.delete(createId(`seq${i}`, 5));
      }

      // Save the state
      const saved = list.save();

      // Load the saved state
      const loadedList = IdList.load(saved);

      // Verify the loaded list matches the original
      expect(loadedList.length).to.equal(list.length);

      // Check a few elements from each sequence
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 10; j++) {
          if (j === 5) {
            // This element was deleted
            expect(loadedList.has(createId(`seq${i}`, j))).to.be.false;
            expect(loadedList.isKnown(createId(`seq${i}`, j))).to.be.true;
          } else {
            expect(loadedList.has(createId(`seq${i}`, j))).to.be.true;
          }
        }
      }
    });

    it("should correct handle serializing deleted items at end of leaf nodes", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("seq", 0), 10);

      // Delete the last few elements
      list = list.delete(createId("seq", 7));
      list = list.delete(createId("seq", 8));
      list = list.delete(createId("seq", 9));

      // Save and load
      const saved = list.save();
      const loadedList = IdList.load(saved);

      // Verify all deleted elements are still known
      for (let i = 7; i < 10; i++) {
        expect(loadedList.has(createId("seq", i))).to.be.false;
        expect(loadedList.isKnown(createId("seq", i))).to.be.true;
      }

      // Verify the correct number of elements are present
      expect(loadedList.length).to.equal(7);
      expect(loadedList.knownIds.length).to.equal(10);
    });
  });

  describe("buildTree function", () => {
    it("should create a balanced tree from leaves", () => {
      // Create a SavedIdList with enough entries to require multiple levels
      const savedState: SavedIdList = [];
      for (let i = 0; i < 100; i++) {
        savedState.push({
          bunchId: `bunch${i}`,
          startCounter: 0,
          count: 1,
          isDeleted: i % 5 === 0, // Make some deleted
        });
      }

      // Load into a new IdList
      const list = IdList.load(savedState);

      const root = list["root"];

      // Helper to check tree height and balance
      function getTreeHeight(node: InnerNode): number {
        if (node.children && "children" in node.children[0]) {
          // Inner node with inner node children
          const nodeTyped = node as InnerNodeInner;
          const childHeights = nodeTyped.children.map(getTreeHeight);

          // All children should have the same height (balanced)
          const firstHeight = childHeights[0];
          expect(childHeights.every((h) => h === firstHeight)).to.be.true;

          return 1 + firstHeight;
        } else {
          // Inner node with leaf children
          return 1;
        }
      }

      const height = getTreeHeight(root);

      // For 100 elements with M=8, height should be around 3
      expect(height).to.be.greaterThanOrEqual(2);
      expect(height).to.be.lessThanOrEqual(4);

      // Check that all elements are accessible
      let presentCount = 0;
      let knownCount = 0;

      for (let i = 0; i < 100; i++) {
        const id = createId(`bunch${i}`, 0);
        expect(list.isKnown(id)).to.be.true;
        knownCount++;

        if (i % 5 !== 0) {
          expect(list.has(id)).to.be.true;
          presentCount++;
        } else {
          expect(list.has(id)).to.be.false;
        }
      }

      expect(list.length).to.equal(presentCount);
      expect(list.knownIds.length).to.equal(knownCount);
    });
  });

  describe("KnownIdView", () => {
    it("should correctly handle at() and indexOf() with deleted elements", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("seq", 0), 10);

      // Delete some elements
      list = list.delete(createId("seq", 3));
      list = list.delete(createId("seq", 7));

      const knownIds = list.knownIds;

      // Check at() returns deleted elements at their position
      expect(knownIds.at(3)).to.deep.equal(createId("seq", 3));
      expect(knownIds.at(7)).to.deep.equal(createId("seq", 7));

      // Check indexOf() works for both present and deleted
      for (let i = 0; i < 10; i++) {
        expect(knownIds.indexOf(createId("seq", i))).to.equal(i);
      }
    });

    it("should maintain knownIds view across complex operations", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("seq", 0), 10);

      // Get initial knownIds view
      const knownIds1 = list.knownIds;

      // Perform some operations
      list = list.delete(createId("seq", 3));
      list = list.insertAfter(createId("seq", 5), createId("new", 0));

      // Get updated knownIds view
      const knownIds2 = list.knownIds;

      // Verify the knownIds views are correct
      expect(knownIds1.length).to.equal(10);
      expect(knownIds2.length).to.equal(11);

      // Check the first view hasn't changed
      for (let i = 0; i < 10; i++) {
        expect(knownIds1.at(i)).to.deep.equal(createId("seq", i));
      }

      // Check the second view has the new element and maintains its order
      for (let i = 0; i < 6; i++) {
        expect(knownIds2.at(i)).to.deep.equal(createId("seq", i));
      }
      expect(knownIds2.at(6)).to.deep.equal(createId("new", 0));
      for (let i = 6; i < 10; i++) {
        expect(knownIds2.at(i + 1)).to.deep.equal(createId("seq", i));
      }
    });
  });
});
