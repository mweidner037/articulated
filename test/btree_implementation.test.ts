import { expect } from "chai";
import { ElementId, IdList } from "../src";
import { InnerNode, InnerNodeInner, InnerNodeLeaf, M } from "../src/id_list";

describe("IdList B+Tree Implementation", () => {
  // Helper to create ElementIds
  const createId = (bunchId: string, counter: number): ElementId => ({
    bunchId,
    counter,
  });

  describe("Tree Structure and Balancing", () => {
    it("should maintain balanced structure after many insertions", () => {
      let list = IdList.new();

      // Insert enough elements to force multiple levels in the B+Tree
      // M = 8, so we'll insert more than enough to cause splits
      for (let i = 0; i < 100; i++) {
        list = list.insertBefore(null, createId(`id${i}`, 0));
      }

      // Access the root to examine the tree structure
      const root = list["root"];

      // Helper to check node properties recursively
      function checkNodeProperties(node: InnerNode): {
        height: number;
        maxChildren: number;
      } {
        // No node should exceed the branching factor M (8)
        expect(node.children.length).to.be.at.most(M);

        // If this is an inner node (has children that have children)
        if (node.children.length > 0 && "children" in node.children[0]) {
          // Check all children and get their heights
          const childStats = (node as InnerNodeInner).children.map((child) =>
            checkNodeProperties(child)
          );

          // All children should have the same height (balanced tree property)
          const heights = childStats.map((s) => s.height);
          const firstHeight = heights[0];
          expect(
            heights.every((h) => h === firstHeight),
            "Children heights should be equal"
          ).to.be.true;

          // Return this node's height and max children count
          return {
            height: 1 + firstHeight,
            maxChildren: Math.max(
              node.children.length,
              ...childStats.map((s) => s.maxChildren)
            ),
          };
        } else {
          // Leaf level or level just above leaves
          return { height: 1, maxChildren: node.children.length };
        }
      }

      const treeStats = checkNodeProperties(root);

      // For 100 elements with M=8, expected height (excluding root) is 3.
      expect(treeStats.height).to.equal(3);

      // Verify all elements are accessible
      for (let i = 0; i < 100; i++) {
        expect(list.has(createId(`id${i}`, 0))).to.be.true;
        expect(list.indexOf(createId(`id${i}`, 0))).to.equal(i);
        expect(list.knownIds.indexOf(createId(`id${i}`, 0))).to.equal(i);
      }

      // To test knownIds.indexOf, delete some elements and check again.
      for (let i = 0; i < 100; i += 5) {
        list = list.delete(createId(`id${i}`, 0));
      }
      for (let i = 0; i < 100; i++) {
        expect(list.has(createId(`id${i}`, 0))).to.equal(i % 5 !== 0);
        expect(list.isKnown(createId(`id${i}`, 0))).to.be.true;
        expect(list.knownIds.indexOf(createId(`id${i}`, 0))).to.equal(i);
      }
    });

    it("should force a node split when exceeding the branching factor", () => {
      let list = IdList.new();

      // Insert exactly M elements (where M=8 is the branching factor)
      for (let i = 0; i < M; i++) {
        list = list.insertBefore(null, createId(`id${i}`, 0));
      }

      const beforeSplit = list["root"];
      expect(beforeSplit.children).to.have.length(M);
      expect(beforeSplit).to.be.instanceOf(InnerNodeLeaf);

      // Insert one more element to force a split
      list = list.insertBefore(null, createId("split", 0));

      const afterSplit = list["root"];

      expect(afterSplit.children).to.have.length(2);
      expect(afterSplit).to.be.instanceOf(InnerNodeInner);

      const [newLeft, newRight] = afterSplit.children as InnerNodeLeaf[];
      expect(newLeft).to.be.instanceOf(InnerNodeLeaf);
      expect(newRight).to.be.instanceOf(InnerNodeLeaf);
      expect(newLeft.children).to.have.length(M / 2);
      expect(newRight.children).to.have.length(M / 2 + 1);

      // Verify all elements are still accessible and in the correct order
      for (let i = 0; i < M; i++) {
        expect(list.has(createId(`id${i}`, 0))).to.be.true;
        expect(list.indexOf(createId(`id${i}`, 0))).to.equal(i);
      }
      expect(list.has(createId("split", 0))).to.be.true;
    });
  });

  describe("Leaf Node Splitting", () => {
    it("should correctly split a leaf when inserting after in the middle", () => {
      let list = IdList.new();

      // Insert sequential elements in a single bunch (single leaf)
      list = list.insertAfter(null, createId("bunch", 0), 6);

      // Insert in the middle of the leaf to force a split
      list = list.insertAfter(createId("bunch", 2), createId("middle", 0));

      // Verify the order is correct after split
      expect(list.at(0)).to.deep.equal(createId("bunch", 0));
      expect(list.at(1)).to.deep.equal(createId("bunch", 1));
      expect(list.at(2)).to.deep.equal(createId("bunch", 2));
      expect(list.at(3)).to.deep.equal(createId("middle", 0));
      expect(list.at(4)).to.deep.equal(createId("bunch", 3));
      expect(list.at(5)).to.deep.equal(createId("bunch", 4));
      expect(list.at(6)).to.deep.equal(createId("bunch", 5));

      // Verify we can still locate all elements
      for (let i = 0; i < 6; i++) {
        if (i < 3) {
          expect(list.indexOf(createId("bunch", i))).to.equal(i);
        } else {
          expect(list.indexOf(createId("bunch", i))).to.equal(i + 1);
        }
      }
      expect(list.indexOf(createId("middle", 0))).to.equal(3);
    });

    it("should correctly split a leaf when inserting before in the middle", () => {
      let list = IdList.new();

      // Insert sequential elements in a single bunch (single leaf)
      list = list.insertAfter(null, createId("bunch", 0), 6);

      // Insert in the middle of the leaf to force a split
      list = list.insertBefore(createId("bunch", 3), createId("middle", 0));

      // Verify the order is correct after split
      expect(list.at(0)).to.deep.equal(createId("bunch", 0));
      expect(list.at(1)).to.deep.equal(createId("bunch", 1));
      expect(list.at(2)).to.deep.equal(createId("bunch", 2));
      expect(list.at(3)).to.deep.equal(createId("middle", 0));
      expect(list.at(4)).to.deep.equal(createId("bunch", 3));
      expect(list.at(5)).to.deep.equal(createId("bunch", 4));
      expect(list.at(6)).to.deep.equal(createId("bunch", 5));

      // Verify we can still locate all elements
      for (let i = 0; i < 6; i++) {
        if (i < 3) {
          expect(list.indexOf(createId("bunch", i))).to.equal(i);
        } else {
          expect(list.indexOf(createId("bunch", i))).to.equal(i + 1);
        }
      }
      expect(list.indexOf(createId("middle", 0))).to.equal(3);
    });

    it("should handle multiple splits in a complex insertion pattern", () => {
      let list = IdList.new();

      // Insert a bunch of sequential IDs
      list = list.insertAfter(null, createId("seq", 0), 15);

      // Now cause splits by inserting elements between every other element
      for (let i = 0; i < 7; i++) {
        list = list.insertAfter(createId("seq", i * 2), createId("insert", i));
      }

      // Verify all elements are in the correct order
      for (let i = 0; i < 15; i++) {
        const expectedPosition = i + Math.ceil(i / 2);
        expect(list.indexOf(createId("seq", i))).to.equal(expectedPosition);

        if (i % 2 === 0 && i < 14) {
          expect(list.indexOf(createId("insert", i / 2))).to.equal(
            i + Math.floor(i / 2) + 1
          );
        }
      }

      // Verify total length
      expect(list.length).to.equal(15 + 7);
    });

    it("should handle insertion at leaf boundaries", () => {
      let list = IdList.new();

      // Create a list where elements are likely to be distributed across multiple leaves
      // Using different bunchIds to prevent run compression
      for (let i = 0; i < 20; i++) {
        list = list.insertAfter(
          i === 0 ? null : createId(`id${i - 1}`, 0),
          createId(`id${i}`, 0)
        );
      }

      // Now insert at likely leaf boundaries (around multiples of M=8)
      list = list.insertBefore(createId("id8", 0), createId("boundary1", 0));
      list = list.insertBefore(createId("id16", 0), createId("boundary2", 0));

      // Verify the insertions worked correctly
      expect(list.indexOf(createId("boundary1", 0))).to.equal(8);
      expect(list.indexOf(createId("id8", 0))).to.equal(9);
      expect(list.indexOf(createId("boundary2", 0))).to.equal(17);
      expect(list.indexOf(createId("id16", 0))).to.equal(18);
    });
  });

  describe("Sequential ID Compression and Storage", () => {
    it("should compress sequential IDs in the same bunch", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Save state and check compression
      const saved = list.save();

      // Should be compressed into a single entry
      expect(saved.length).to.equal(1);
      expect(saved[0]).to.deep.equal({
        bunchId: "bunch",
        startCounter: 0,
        count: 10,
        isDeleted: false,
      });

      // Load and verify
      const loaded = IdList.load(saved);
      expect(loaded.length).to.equal(10);

      for (let i = 0; i < 10; i++) {
        expect(loaded.has(createId("bunch", i))).to.be.true;
      }
    });

    it("should preserve compression after complex operations", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Delete elements in the middle
      list = list.delete(createId("bunch", 3));
      list = list.delete(createId("bunch", 5));
      list = list.delete(createId("bunch", 4));

      // Insert different IDs
      list = list.insertAfter(createId("bunch", 2), createId("other", 0));

      // Save and check compression
      const saved = list.save();

      // Check how many entries exist for the "bunch" ID
      const bunchEntries = saved.filter((e) => e.bunchId === "bunch");

      // We should have efficient compression (at most 3 entries for "bunch")
      expect(bunchEntries.length).to.be.lessThanOrEqual(3);

      // Verify all elements are preserved after load
      const loaded = IdList.load(saved);

      expect(loaded.has(createId("bunch", 0))).to.be.true;
      expect(loaded.has(createId("bunch", 1))).to.be.true;
      expect(loaded.has(createId("bunch", 2))).to.be.true;
      expect(loaded.has(createId("other", 0))).to.be.true;
      expect(loaded.has(createId("bunch", 3))).to.be.false;
      expect(loaded.has(createId("bunch", 4))).to.be.false;
      expect(loaded.has(createId("bunch", 5))).to.be.false;
      expect(loaded.has(createId("bunch", 6))).to.be.true;
      expect(loaded.has(createId("bunch", 7))).to.be.true;
      expect(loaded.has(createId("bunch", 8))).to.be.true;
      expect(loaded.has(createId("bunch", 9))).to.be.true;
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle extending runs with insertions at boundaries", () => {
      let list = IdList.new();

      // Create a run
      list = list.insertAfter(null, createId("bunch", 5), 5); // IDs 5-9

      // Extend backward (should merge with existing)
      list = list.insertBefore(createId("bunch", 5), createId("bunch", 3), 2); // IDs 3-4

      // Extend forward (should merge with existing)
      list = list.insertAfter(createId("bunch", 9), createId("bunch", 10), 2); // IDs 10-11

      // Verify all elements are present in the right order
      for (let i = 3; i <= 11; i++) {
        expect(list.has(createId("bunch", i))).to.be.true;
        expect(list.indexOf(createId("bunch", i))).to.equal(i - 3);
      }

      // Save and check compression
      const saved = list.save();

      // Should be a single entry due to run merging
      const bunchEntries = saved.filter((e) => e.bunchId === "bunch");
      expect(bunchEntries.length).to.equal(1);
      expect(bunchEntries[0].startCounter).to.equal(3);
      expect(bunchEntries[0].count).to.equal(9); // IDs 3-11 (9 elements)
    });

    it("should correctly handle the locate function with deleted elements", () => {
      let list = IdList.new();

      // Insert sequential IDs
      list = list.insertAfter(null, createId("bunch", 0), 10);

      // Delete some elements
      list = list.delete(createId("bunch", 3));
      list = list.delete(createId("bunch", 6));

      // Elements should still be locatable
      expect(list.isKnown(createId("bunch", 3))).to.be.true;
      expect(list.isKnown(createId("bunch", 6))).to.be.true;

      // indexOf with different bias values
      expect(list.indexOf(createId("bunch", 3), "none")).to.equal(-1);
      expect(list.indexOf(createId("bunch", 3), "left")).to.equal(2);
      expect(list.indexOf(createId("bunch", 3), "right")).to.equal(3);

      expect(list.indexOf(createId("bunch", 6), "none")).to.equal(-1);
      expect(list.indexOf(createId("bunch", 6), "left")).to.equal(4);
      expect(list.indexOf(createId("bunch", 6), "right")).to.equal(5);

      // Undelete and check again
      list = list.undelete(createId("bunch", 3));
      expect(list.has(createId("bunch", 3))).to.be.true;
      expect(list.indexOf(createId("bunch", 3))).to.equal(3);
    });

    it("should handle insertions in empty lists", () => {
      // Empty list insertAfter with null
      const list1 = IdList.new().insertAfter(null, createId("first", 0));
      expect(list1.length).to.equal(1);
      expect(list1.at(0)).to.deep.equal(createId("first", 0));

      // Empty list insertBefore with null
      const list2 = IdList.new().insertBefore(null, createId("first", 0));
      expect(list2.length).to.equal(1);
      expect(list2.at(0)).to.deep.equal(createId("first", 0));
    });

    it("should handle very large bulk insertions", () => {
      let list = IdList.new();

      // Insert a large number of sequential IDs as one bulk op
      const largeCount = 1000;
      list = list.insertAfter(null, createId("bulk", 0), largeCount);

      // Verify all elements are accessible
      expect(list.length).to.equal(largeCount);

      // Check some elements at various indices
      expect(list.at(0)).to.deep.equal(createId("bulk", 0));
      expect(list.at(largeCount - 1)).to.deep.equal(
        createId("bulk", largeCount - 1)
      );
      expect(list.at(largeCount / 2)).to.deep.equal(
        createId("bulk", largeCount / 2)
      );

      // Check that the operation was efficient by examining the save format
      const saved = list.save();
      expect(saved.length).to.equal(1); // Should be compressed to a single entry
    });

    it("should handle very large sequential insertions", () => {
      let list = IdList.new();

      // Insert a large number of sequential IDs as sequential ops
      const largeCount = 1000;
      for (let i = 0; i < largeCount; i++) {
        list = list.insertAfter(
          i === 0 ? null : createId("bulk", i - 1),
          createId("bulk", i)
        );
      }

      // Verify all elements are accessible
      expect(list.length).to.equal(largeCount);

      // Check some elements at various indices
      expect(list.at(0)).to.deep.equal(createId("bulk", 0));
      expect(list.at(largeCount - 1)).to.deep.equal(
        createId("bulk", largeCount - 1)
      );
      expect(list.at(largeCount / 2)).to.deep.equal(
        createId("bulk", largeCount / 2)
      );

      // Check that the operation was efficient by examining the save format
      const saved = list.save();
      expect(saved.length).to.equal(1); // Should be compressed to a single entry
    });

    // TODO: If you insert separated counters in a bunch (e.g. 0, 2, 1), it won't merge the leaves.
    // Could be okay (perf penalty for doing silly things) but it may mess up the saved states.
  });

  describe("Advanced Operations and Combined Cases", () => {
    it("should maintain tree integrity with complex insertion/deletion patterns", () => {
      let list = IdList.new();

      // Create a pattern of IDs with differing bunchIds to test tree integrity
      for (let i = 0; i < 50; i++) {
        // Use alternating bunch IDs
        const bunchId = i % 2 === 0 ? "even" : "odd";
        const id = createId(bunchId, Math.floor(i / 2));

        if (i === 0) {
          list = list.insertAfter(null, id);
        } else {
          const prevId = list.at(i - 1);
          list = list.insertAfter(prevId, id);
        }
      }

      // Delete every third element to create fragmentation in leaves' presence
      for (let i = 0; i < 50; i += 3) {
        list = list.delete(list.knownIds.at(i));
      }

      // Insert new elements in the middle
      const middleId = list.at(Math.floor(list.length / 2));
      list = list.insertAfter(middleId, createId("middle", 0), 5);

      // Check the length is correct
      const expectedLength = 50 - Math.ceil(50 / 3) + 5;
      expect(list.length).to.equal(expectedLength);

      // Check that all middle elements were inserted together
      const middleIndices: number[] = [];
      for (let i = 0; i < 5; i++) {
        middleIndices.push(list.indexOf(createId("middle", i)));
      }

      // The middle indices should be consecutive
      for (let i = 1; i < middleIndices.length; i++) {
        expect(middleIndices[i]).to.equal(middleIndices[i - 1] + 1);
      }
    });

    // TODO: Convert to fuzz test.
    it.skip("should handle interleaved operations on a deep tree", () => {
      let list = IdList.new();

      // Create a deep tree with many elements
      list = list.insertAfter(null, createId("base", 0), 100);

      // Insert elements with varying patterns in the middle
      for (let i = 0; i < 20; i++) {
        const baseIndex = 10 + i * 4;
        list = list.insertAfter(
          createId("base", baseIndex),
          createId(`interleaved${i}`, 0),
          (i % 3) + 1 // Insert 1, 2, or 3 elements
        );
      }

      // Delete some elements to create fragmentation in leaves' presence
      for (let i = 0; i < 30; i++) {
        if (i % 7 === 0) {
          list = list.delete(createId("base", i));
        }
      }

      // Verify elements are still accessible in the correct order
      const expectedIndex = 0;
      for (let i = 0; i < 100; i++) {
        if (i % 7 === 0 && i < 30) {
          // This element is deleted
          expect(list.has(createId("base", i))).to.be.false;
        } else {
          expect(list.has(createId("base", i))).to.be.true;

          // Check position - need to account for interleaved insertions
          const basePos = list.indexOf(createId("base", i));
          if (i >= 10 && i < 90 && (i - 10) % 4 === 0) {
            // An insertion point - check the interleaved elements
            const interleaveIndex = Math.floor((i - 10) / 4);
            for (let j = 0; j < (interleaveIndex % 3) + 1; j++) {
              expect(list.has(createId(`interleaved${interleaveIndex}`, j))).to
                .be.true;
            }
          }
        }
      }
    });
  });
});
