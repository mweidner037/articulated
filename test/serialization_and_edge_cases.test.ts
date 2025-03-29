import { expect } from "chai";
import { ElementId, IdList, SavedIdList } from "../src";
import { InnerNode, InnerNodeInner, LeafNode, M } from "../src/id_list";

describe("IdList Serialization and Edge Cases", () => {
  // Helper to create ElementIds
  const createId = (bunchId: string, counter: number): ElementId => ({
    bunchId,
    counter,
  });

  function checkIterators(loaded: IdList, list: IdList) {
    expect([...loaded.values()]).to.deep.equal([...list.values()]);
    expect([...loaded.knownIds.values()]).to.deep.equal([
      ...list.knownIds.values(),
    ]);
    expect([...loaded.valuesWithIsDeleted()]).to.deep.equal([
      ...list.valuesWithIsDeleted(),
    ]);
  }

  describe("saveNode function", () => {
    it("should properly serialize deleted elements at the end of leaves", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Delete the last few elements
      list = list.delete(createId("bunch", 7));
      list = list.delete(createId("bunch", 8));
      list = list.delete(createId("bunch", 9));

      // Save the state
      const saved = list.save();

      // Check that the saved state includes the deleted elements
      let hasDeletedEntries = false;
      for (const entry of saved) {
        if (entry.bunchId === "bunch" && entry.isDeleted) {
          hasDeletedEntries = true;
          expect(entry.startCounter).to.equal(7);
          expect(entry.count).to.equal(3);
        }
      }

      expect(hasDeletedEntries).to.be.true;

      // Load and verify
      const loaded = IdList.load(saved);

      // Verify deleted elements are still known
      for (let i = 7; i < 10; i++) {
        expect(loaded.isKnown(createId("bunch", i))).to.be.true;
        expect(loaded.has(createId("bunch", i))).to.be.false;
      }

      checkIterators(loaded, list);
    });

    it("should handle complex patterns of present and deleted elements", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 20);

      // Create a complex pattern of deletions (alternating present/deleted)
      for (let i = 1; i < 20; i += 2) {
        list = list.delete(createId("bunch", i));
      }

      // Save the state
      const saved = list.save();

      // There should be multiple entries in the saved state
      // Each entry represents either all present or all deleted elements
      expect(saved.length).to.be.greaterThan(1);

      // The entries should alternate between present and deleted
      for (let i = 0; i < saved.length - 1; i++) {
        expect(saved[i].isDeleted).to.not.equal(saved[i + 1].isDeleted);
      }

      // Load and verify
      const loaded = IdList.load(saved);

      // Check all elements
      for (let i = 0; i < 20; i++) {
        expect(loaded.isKnown(createId("bunch", i))).to.be.true;

        if (i % 2 === 0) {
          expect(loaded.has(createId("bunch", i))).to.be.true;
        } else {
          expect(loaded.has(createId("bunch", i))).to.be.false;
        }
      }

      checkIterators(loaded, list);
    });

    it("should handle interleaving bunchIds correctly", () => {
      let list = IdList.new();

      // Create an interleaved pattern of bunchIds
      for (let i = 0; i < 10; i++) {
        if (i === 0) {
          list = list.insertAfter(null, createId("a", 0));
        } else {
          const prevId = list.at(i - 1);
          if (i % 2 === 0) {
            list = list.insertAfter(prevId, createId("a", i / 2));
          } else {
            list = list.insertAfter(prevId, createId("b", Math.floor(i / 2)));
          }
        }
      }

      // Save and load
      const saved = list.save();
      const loaded = IdList.load(saved);

      // Verify the pattern is preserved
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          expect(loaded.at(i)).to.deep.equal(createId("a", i / 2));
        } else {
          expect(loaded.at(i)).to.deep.equal(createId("b", Math.floor(i / 2)));
        }
      }

      checkIterators(loaded, list);
    });

    it("should handle non-merged leaves correctly", () => {
      // See typedoc for pushSaveItem.

      let list = IdList.new();

      // Create un-merged leaves.
      list = list.insertAfter(null, createId("a", 0));
      list = list.insertAfter(createId("a", 0), createId("a", 2));
      list = list.insertAfter(createId("a", 0), createId("a", 1));

      // Verify that the leaves are not fully merged.
      expect(list["root"].children.length).to.be.greaterThan(1);

      // Verify that the resulting save item is merged.
      const saved = list.save();
      expect(saved.length).to.equal(1);

      // Verify the loading "fixes" the un-merged leaves.
      const loaded = IdList.load(saved);
      expect(loaded["root"].children.length).to.equal(1);

      checkIterators(loaded, list);
    });
  });

  describe("load function", () => {
    it("should correctly handle empty SavedIdList", () => {
      const saved: SavedIdList = [];
      const list = IdList.load(saved);

      expect(list.length).to.equal(0);
    });

    it("should skip entries with count = 0", () => {
      const saved = [
        {
          bunchId: "bunch",
          startCounter: 0,
          count: 0,
          isDeleted: false,
        },
        {
          bunchId: "bunch",
          startCounter: 1,
          count: 5,
          isDeleted: false,
        },
      ];

      const list = IdList.load(saved);

      // Should only have the second entry
      expect(list.length).to.equal(5);
      expect(list.has(createId("bunch", 0))).to.be.false;
      expect(list.has(createId("bunch", 1))).to.be.true;
    });

    it("should throw on invalid count or startCounter", () => {
      // Negative count
      const saved1 = [
        {
          bunchId: "bunch",
          startCounter: 0,
          count: -1,
          isDeleted: false,
        },
      ];
      expect(() => IdList.load(saved1)).to.throw();

      // Non-integer count
      const saved2 = [
        {
          bunchId: "bunch",
          startCounter: 0,
          count: 1.5,
          isDeleted: false,
        },
      ];
      expect(() => IdList.load(saved2)).to.throw();

      // Negative startCounter
      const saved3 = [
        {
          bunchId: "bunch",
          startCounter: -1,
          count: 5,
          isDeleted: false,
        },
      ];
      expect(() => IdList.load(saved3)).to.throw();

      // Non-integer startCounter
      const saved4 = [
        {
          bunchId: "bunch",
          startCounter: 0.5,
          count: 5,
          isDeleted: false,
        },
      ];
      expect(() => IdList.load(saved4)).to.throw();
    });

    it("should merge adjacent entries with the same bunchId", () => {
      const saved = [
        {
          bunchId: "bunch",
          startCounter: 0,
          count: 5,
          isDeleted: false,
        },
        {
          bunchId: "bunch",
          startCounter: 5, // Continues right after the previous entry
          count: 5,
          isDeleted: false,
        },
      ];

      const list = IdList.load(saved);

      // Should be merged into a single saved item
      expect(list.length).to.equal(10);

      // Save again to check if it's compressed
      const resaved = list.save();
      expect(resaved.length).to.equal(1);
      expect(resaved[0].count).to.equal(10);
    });

    it("should not merge adjacent leaves with the same bunchId and opposite presence", () => {
      const saved = [
        {
          bunchId: "bunch",
          startCounter: 0,
          count: 5,
          isDeleted: false,
        },
        {
          bunchId: "bunch",
          startCounter: 5, // Continues right after the previous entry
          count: 5,
          isDeleted: true,
        },
      ];

      const list = IdList.load(saved);

      // Should not be merged into a single leaf
      expect(list["root"].children.length).to.equal(2);

      // Save again to check if it's split into two items
      const resaved = list.save();
      expect(resaved.length).to.equal(2);
      expect(resaved[0].count).to.equal(5);
      expect(resaved[0].isDeleted).to.be.false;
      expect(resaved[1].isDeleted).to.be.true;
    });

    it("should not merge entries with different bunchIds or non-sequential counters", () => {
      const saved = [
        {
          bunchId: "bunch1",
          startCounter: 0,
          count: 5,
          isDeleted: false,
        },
        {
          bunchId: "bunch1",
          startCounter: 10, // Gap in counter sequence
          count: 5,
          isDeleted: false,
        },
        {
          bunchId: "bunch2", // Different bunchId
          startCounter: 0,
          count: 5,
          isDeleted: false,
        },
      ];

      const list = IdList.load(saved);

      expect(list.length).to.equal(15);

      // Save again to check compression
      const resaved = list.save();
      expect(resaved.length).to.equal(3);
    });
  });

  describe("building balanced trees", () => {
    it("should create appropriately balanced trees based on input size", () => {
      function testTreeBalance(numElements: number) {
        const saved: SavedIdList = [];

        // Create SavedIdList with numElements entries
        for (let i = 0; i < numElements; i++) {
          saved.push({
            bunchId: `id${i}`,
            startCounter: 0,
            count: 1,
            isDeleted: false,
          });
        }

        const list = IdList.load(saved);

        const root = list["root"];

        // Helper to calculate tree height
        function getTreeHeight(node: InnerNode | LeafNode): number {
          if ("children" in node && "children" in node.children[0]) {
            // Inner node with inner node children
            return 1 + getTreeHeight(node.children[0]);
          } else if ("children" in node) {
            // Inner node with leaf children
            return 1;
          } else {
            // Leaf node
            return 0;
          }
        }

        const height = getTreeHeight(root);

        // Loading produces a balanced M-ary tree. Height should be exaclty ceil(log_M(n)).
        // Note: That is not true for a tree produced by insertions, since nodes may have
        // only M/2 children after splitting.
        const expectedHeight = Math.ceil(Math.log(numElements) / Math.log(M));
        expect(height).to.equal(expectedHeight);

        // Check if the tree is balanced
        function checkNodeBalance(node: InnerNode) {
          if (node.children && "children" in node.children[0]) {
            // All children should have the same height
            const childHeights = node.children.map(getTreeHeight);
            const firstHeight = childHeights[0];

            for (const h of childHeights) {
              expect(h).to.equal(firstHeight);
            }

            // Recurse into children
            for (const child of (node as InnerNodeInner).children) {
              checkNodeBalance(child);
            }
          }
        }

        checkNodeBalance(root);

        // Verify all elements are accessible
        for (let i = 0; i < numElements; i++) {
          expect(list.has(createId(`id${i}`, 0))).to.be.true;
        }
      }

      // Test various tree sizes
      testTreeBalance(5); // Small tree
      testTreeBalance(10); // Just over M
      testTreeBalance(70); // Medium tree (multiple levels)
      testTreeBalance(100); // Larger tree
      testTreeBalance(1000); // Large tree
    });
  });

  describe("splitPresent function edge cases", () => {
    it("should handle splitting with sparse present values", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Delete some elements to create gaps
      for (let i = 0; i < 10; i += 2) {
        list = list.delete(createId("bunch", i));
      }

      // Insert in the middle to force a split
      list = list.insertAfter(createId("bunch", 5), createId("split", 0));

      // Verify the structure after the split
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          expect(list.has(createId("bunch", i))).to.be.false;
        } else {
          expect(list.has(createId("bunch", i))).to.be.true;
        }
      }

      expect(list.has(createId("split", 0))).to.be.true;

      // The order should be preserved
      const presentIds = [...list];

      // Should have the odd-indexed "bunch" IDs and the "split" ID
      expect(presentIds.length).to.equal(6);

      // Check positions after the split
      expect(list.indexOf(createId("bunch", 1))).to.equal(0);
      expect(list.indexOf(createId("bunch", 3))).to.equal(1);
      expect(list.indexOf(createId("bunch", 5))).to.equal(2);
      expect(list.indexOf(createId("split", 0))).to.equal(3);
      expect(list.indexOf(createId("bunch", 7))).to.equal(4);
      expect(list.indexOf(createId("bunch", 9))).to.equal(5);
    });
  });

  describe("iterateNode functions", () => {
    it("should correctly iterate through nodes with mixed present/deleted values", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Delete some elements
      list = list.delete(createId("bunch", 2));
      list = list.delete(createId("bunch", 5));
      list = list.delete(createId("bunch", 8));

      // Test standard iteration (present values only)
      const presentIds = [...list];
      expect(presentIds.length).to.equal(7);

      // Test valuesWithIsDeleted (all known values)
      const allValues = [...list.valuesWithIsDeleted()];
      expect(allValues.length).to.equal(10);

      // Check the deleted status for each value
      for (let i = 0; i < 10; i++) {
        const item = allValues[i];
        expect(item.id.bunchId).to.equal("bunch");
        expect(item.id.counter).to.equal(i);

        if (i === 2 || i === 5 || i === 8) {
          expect(item.isDeleted).to.be.true;
        } else {
          expect(item.isDeleted).to.be.false;
        }
      }

      // Test knownIds iterator
      const knownIds = [...list.knownIds];
      expect(knownIds.length).to.equal(10);
      for (let i = 0; i < 10; i++) {
        expect(knownIds[i].bunchId).to.equal("bunch");
        expect(knownIds[i].counter).to.equal(i);
      }
    });

    it("should handle iteration after complex operations and tree restructuring", () => {
      let list = IdList.new();

      // Insert elements that will force tree restructuring
      for (let i = 0; i < 50; i++) {
        if (i === 0) {
          list = list.insertAfter(null, createId(`id${i}`, 0));
        } else {
          list = list.insertAfter(
            createId(`id${i - 1}`, 0),
            createId(`id${i}`, 0)
          );
        }
      }

      // Delete some elements in a pattern
      for (let i = 0; i < 50; i += 5) {
        list = list.delete(createId(`id${i}`, 0));
      }

      // Insert new elements in between
      let lastIndex = 0;
      for (let i = 0; i < 10; i++) {
        const insertAfter = `id${lastIndex + 2}`;
        list = list.insertAfter(
          createId(insertAfter, 0),
          createId(`new${i}`, 0)
        );
        lastIndex += 3;
      }

      // Check iteration after all operations
      const presentIds = [...list];

      // Expected count: 50 original - 10 deleted + 10 new = 50
      expect(presentIds.length).to.equal(50);

      // Check for deleted elements using valuesWithIsDeleted
      const allValues = [...list.valuesWithIsDeleted()];
      expect(allValues.length).to.equal(60); // 50 original + 10 new

      // Verify all new elements are present
      for (let i = 0; i < 10; i++) {
        expect(list.has(createId(`new${i}`, 0))).to.be.true;
      }

      // Verify deletion pattern
      for (let i = 0; i < 50; i++) {
        if (i % 5 === 0) {
          expect(list.has(createId(`id${i}`, 0))).to.be.false;
          expect(list.isKnown(createId(`id${i}`, 0))).to.be.true;
        } else {
          expect(list.has(createId(`id${i}`, 0))).to.be.true;
        }
      }
    });
  });

  describe("compression during save", () => {
    it("should optimally compress sequential runs during save", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 100);

      // Save and check compression
      const saved = list.save();

      // Should be a single entry
      expect(saved.length).to.equal(1);
      expect(saved[0].bunchId).to.equal("bunch");
      expect(saved[0].startCounter).to.equal(0);
      expect(saved[0].count).to.equal(100);
      expect(saved[0].isDeleted).to.be.false;

      // Add more sequential elements
      list = list.insertAfter(
        createId("bunch", 99),
        createId("bunch", 100),
        50
      );

      // Save and check compression
      const saved2 = list.save();

      // Should still be a single entry
      expect(saved2.length).to.equal(1);
      expect(saved2[0].bunchId).to.equal("bunch");
      expect(saved2[0].startCounter).to.equal(0);
      expect(saved2[0].count).to.equal(150);
      expect(saved2[0].isDeleted).to.be.false;
    });
  });
});
