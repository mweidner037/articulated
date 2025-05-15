import { AssertionError } from "chai";
import seedrandom from "seedrandom";
import { ElementId } from "../src";
import { M } from "../src/persistent_id_list";
import { Fuzzer } from "./fuzzer";

describe("IdList B+Tree Specific Fuzz Tests", () => {
  let prng!: seedrandom.PRNG;

  beforeEach(() => {
    prng = seedrandom("42");
  });

  // Helper to create ElementIds
  const createId = (bunchId: string, counter: number): ElementId => ({
    bunchId,
    counter,
  });

  describe("Node Splitting and Merging", () => {
    it("should correctly handle splits at various tree levels", function () {
      this.timeout(10000);

      const fuzzer = Fuzzer.new();

      // Start with M elements
      for (let i = 0; i < M; i++) {
        const id = createId(`id${i}`, 0);
        if (i === 0) fuzzer.insertAfter(null, id);
        else fuzzer.insertAfter(createId(`id${i - 1}`, 0), id);
      }

      fuzzer.checkAll();

      // Force a split by adding one more element
      fuzzer.insertAfter(createId(`id${M - 1}`, 0), createId(`id${M}`, 0));
      fuzzer.checkAll();

      // Now add enough elements to force multiple levels in the tree
      // First level split typically happens at M elements
      // Second level split approximately at M² elements
      const secondLevelSplitTarget = M * M;

      for (let i = M + 1; i < secondLevelSplitTarget + 10; i++) {
        const id = createId(`id${i}`, 0);
        fuzzer.insertAfter(createId(`id${i - 1}`, 0), id);

        // Check more frequently near expected split points
        if (
          i % M === 0 ||
          (i >= secondLevelSplitTarget - 5 && i <= secondLevelSplitTarget + 5)
        ) {
          fuzzer.checkAll();
        }
      }

      fuzzer.checkAll();
    });

    it("should maintain tree integrity during interleaved insert/delete at boundaries", function () {
      this.timeout(5000);

      const fuzzer = Fuzzer.new();

      // Create initial structure with M-1 elements
      for (let i = 0; i < M - 1; i++) {
        const id = createId(`id${i}`, 0);
        if (i === 0) fuzzer.insertAfter(null, id);
        else fuzzer.insertAfter(createId(`id${i - 1}`, 0), id);
      }

      fuzzer.checkAll();

      // Repeatedly push the structure to M elements (threshold for split),
      // then delete and reinsert at node boundaries
      for (let cycle = 0; cycle < 10; cycle++) {
        // Add element to trigger potential split
        const triggerSplitId = createId(`trigger${cycle}`, 0);
        fuzzer.insertAfter(createId(`id${M - 2}`, 0), triggerSplitId);
        fuzzer.checkAll();

        // Delete from potential boundary points
        const boundaryIndex = cycle % 3;

        if (boundaryIndex === 0) {
          // Delete from beginning
          fuzzer.delete(createId(`id0`, 0));
        } else if (boundaryIndex === 1) {
          // Delete from middle
          fuzzer.delete(createId(`id${Math.floor(M / 2)}`, 0));
        } else {
          // Delete from end
          fuzzer.delete(triggerSplitId);
        }

        fuzzer.checkAll();

        // Insert at a different boundary
        const insertIndex = (cycle + 1) % 3;
        const newId = createId(`insert${cycle}`, 0);

        if (insertIndex === 0) {
          // Insert at beginning
          fuzzer.insertBefore(createId(`id1`, 0), newId);
        } else if (insertIndex === 1) {
          // Insert in middle
          const midId = createId(`id${Math.floor(M / 2) + 1}`, 0);
          fuzzer.insertBefore(midId, newId);
        } else {
          // Insert at end
          fuzzer.insertAfter(createId(`id${M - 2}`, 0), newId);
        }

        fuzzer.checkAll();
      }
    });

    it("should handle bulk insertions that cause complex splits", function () {
      this.timeout(5000);

      const fuzzer = Fuzzer.new();

      // Create initial structure with half M elements
      for (let i = 0; i < M / 2; i++) {
        const id = createId(`base${i}`, 0);
        if (i === 0) fuzzer.insertAfter(null, id);
        else fuzzer.insertAfter(createId(`base${i - 1}`, 0), id);
      }

      fuzzer.checkAll();

      // Insert bulk batches at various positions that will cause splits
      for (let batch = 0; batch < 5; batch++) {
        const batchSize = M - 2; // Large enough to cause splits
        const referenceIdx = Math.floor(prng() * (M / 2));
        const referenceId = createId(`base${referenceIdx}`, 0);
        const batchId = createId(`batch${batch}`, 0);

        if (batch % 2 === 0) {
          fuzzer.insertAfter(referenceId, batchId, batchSize);
        } else {
          fuzzer.insertBefore(referenceId, batchId, batchSize);
        }

        fuzzer.checkAll();
      }
    });
  });

  describe("Complex Tree Operations", () => {
    it("should handle deep tree restructuring with mixed operations", function () {
      this.timeout(10000);

      const operationCount = 500; // Parameter to adjust test intensity
      const fuzzer = Fuzzer.new();
      const ids: ElementId[] = [];

      // First create a tree large enough to have multiple levels
      for (let i = 0; i < 50; i++) {
        const id = createId(`base${i}`, 0);
        if (i === 0) {
          fuzzer.insertAfter(null, id);
        } else {
          fuzzer.insertAfter(ids[i - 1], id);
        }
        ids.push(id);

        if (i % 10 === 0) {
          fuzzer.checkAll();
        }
      }

      fuzzer.checkAll();

      // Now perform random operations targeting different tree levels
      for (let op = 0; op < operationCount; op++) {
        const operation = Math.floor(prng() * 5);

        if (op % 10 === 0) {
          fuzzer.checkAll();
        }

        switch (operation) {
          case 0: // Insert at start/middle/end
            {
              const position = Math.floor(prng() * 3); // 0=start, 1=middle, 2=end
              const id = createId(`op${op}`, 0);

              try {
                if (position === 0) {
                  // Insert at start
                  fuzzer.insertBefore(ids[0], id);
                } else if (position === 1) {
                  // Insert in middle
                  const midIdx =
                    Math.floor(ids.length / 2) + Math.floor(prng() * 10) - 5;
                  const refIdx = Math.max(0, Math.min(ids.length - 1, midIdx));
                  fuzzer.insertAfter(ids[refIdx], id);
                } else {
                  // Insert at end
                  fuzzer.insertAfter(ids[ids.length - 1], id);
                }
                ids.push(id);
              } catch (e) {
                if (e instanceof AssertionError) {
                  throw e;
                }
                // Handle ID collisions
              }
            }
            break;

          case 1: // Insert multiple elements
            {
              const count = 1 + Math.floor(prng() * 10); // 1-10 elements
              const refIdx = Math.floor(prng() * ids.length);
              const id = createId(`bulk${op}`, 0);

              try {
                if (prng() > 0.5) {
                  fuzzer.insertAfter(ids[refIdx], id, count);
                } else {
                  fuzzer.insertBefore(ids[refIdx], id, count);
                }

                // Add new IDs to known list
                for (let i = 0; i < count; i++) {
                  ids.push({ bunchId: id.bunchId, counter: id.counter + i });
                }
              } catch (e) {
                if (e instanceof AssertionError) {
                  throw e;
                }
                // Handle ID collisions
              }
            }
            break;

          case 2: // Uninsert in patterns
            {
              const pattern = Math.floor(prng() * 3); // 0=start, 1=every-nth, 2=range

              if (pattern === 0 && ids.length > 10) {
                // Uninsert first few elements
                const count = 1 + Math.floor(prng() * 3); // 1-3 elements
                for (let i = 0; i < count; i++) {
                  fuzzer.uninsert(ids[i]);
                }
              } else if (pattern === 1 && ids.length > 10) {
                // Uninsert every nth element
                const nth = 2 + Math.floor(prng() * 5); // Every 2nd to 6th
                for (let i = 0; i < ids.length; i += nth) {
                  fuzzer.uninsert(ids[i]);
                }
              } else if (ids.length > 10) {
                // Uninsert a range
                const start = Math.floor(prng() * (ids.length / 2));
                const count = 1 + Math.floor(prng() * 5); // 1-5 elements
                for (let i = 0; i < count && start + i < ids.length; i++) {
                  fuzzer.uninsert(ids[start + i]);
                }
              }
            }
            break;

          case 3: // Delete in patterns
            {
              const pattern = Math.floor(prng() * 3); // 0=start, 1=every-nth, 2=range

              if (pattern === 0 && ids.length > 10) {
                // Delete first few elements
                const count = 1 + Math.floor(prng() * 3); // 1-3 elements
                for (let i = 0; i < count; i++) {
                  fuzzer.delete(ids[i]);
                }
              } else if (pattern === 1 && ids.length > 10) {
                // Delete every nth element
                const nth = 2 + Math.floor(prng() * 5); // Every 2nd to 6th
                for (let i = 0; i < ids.length; i += nth) {
                  fuzzer.delete(ids[i]);
                }
              } else if (ids.length > 10) {
                // Delete a range
                const start = Math.floor(prng() * (ids.length / 2));
                const count = 1 + Math.floor(prng() * 5); // 1-5 elements
                for (let i = 0; i < count && start + i < ids.length; i++) {
                  fuzzer.delete(ids[start + i]);
                }
              }
            }
            break;

          case 4: // Undelete
            {
              // Undelete a few random elements
              const count = 1 + Math.floor(prng() * 3); // 1-3 elements
              for (let i = 0; i < count; i++) {
                const idx = Math.floor(prng() * ids.length);
                try {
                  fuzzer.undelete(ids[idx]);
                } catch (e) {
                  if (e instanceof AssertionError) {
                    throw e;
                  }
                  // Element might not be deleted
                }
              }
            }
            break;
        }
      }

      fuzzer.checkAll();
    });

    it("should maintain tree integrity with sequential run operations", function () {
      this.timeout(5000);

      const fuzzer = Fuzzer.new();

      // Create sequential runs with same bunchId but varying patterns
      // This tests the compression and run handling logic

      // First create a base run
      fuzzer.insertAfter(null, createId("run", 0), 20);
      fuzzer.checkAll();

      // Delete elements to create gaps in the run
      const deletePatterns = [
        [1, 5, 9, 13, 17], // Every 4th element
        [3, 4], // Small contiguous range
        [10, 11, 12, 13, 14, 15], // Large contiguous range
      ];

      for (const pattern of deletePatterns) {
        for (const idx of pattern) {
          fuzzer.delete(createId("run", idx));
        }
        fuzzer.checkAll();
      }

      // Insert elements that extend the run
      fuzzer.insertAfter(createId("run", 19), createId("run", 20), 10);
      fuzzer.checkAll();

      // Insert elements that create a gap, then fill it
      fuzzer.insertAfter(createId("run", 29), createId("run", 40), 10);
      fuzzer.checkAll();

      // Fill the gap
      fuzzer.insertAfter(createId("run", 29), createId("run", 30), 10);
      fuzzer.checkAll();

      // Delete elements at the boundaries
      fuzzer.delete(createId("run", 0));
      fuzzer.delete(createId("run", 19));
      fuzzer.delete(createId("run", 20));
      fuzzer.delete(createId("run", 29));
      fuzzer.delete(createId("run", 30));
      fuzzer.delete(createId("run", 49));
      fuzzer.checkAll();

      // Undelete some elements
      fuzzer.undelete(createId("run", 0));
      fuzzer.undelete(createId("run", 29));
      fuzzer.undelete(createId("run", 49));
      fuzzer.checkAll();
    });
  });

  describe("Edge Cases and Tree Balancing", () => {
    it("should handle interleaved sequences that affect leaf structure", function () {
      this.timeout(5000);

      const fuzzer = Fuzzer.new();
      const ids: ElementId[] = [];

      // Create an interleaved sequence of different bunchIds
      // This creates a more complex leaf structure
      for (let i = 0; i < 30; i++) {
        const bunchId = `bunch${i % 5}`; // Use 5 different bunchIds
        const counter = Math.floor(i / 5);
        const id = createId(bunchId, counter);

        if (i === 0) {
          fuzzer.insertAfter(null, id);
        } else {
          fuzzer.insertAfter(ids[ids.length - 1], id);
        }

        ids.push(id);
      }

      fuzzer.checkAll();

      // Delete elements in a pattern that affects multiple bunches
      for (let i = 0; i < 30; i += 6) {
        fuzzer.delete(ids[i]);
      }

      fuzzer.checkAll();

      // Insert elements between existing ones
      for (let i = 0; i < 10; i++) {
        const insertIdx = 2 * i + 1;
        if (insertIdx < ids.length) {
          const id = createId(`insert${i}`, 0);
          fuzzer.insertAfter(ids[insertIdx], id);
          ids.push(id);
        }
      }

      fuzzer.checkAll();

      // Merge sequences by inserting elements with matching bunchIds
      const inserted: { id: ElementId; count: number }[] = [];
      for (let i = 0; i < 5; i++) {
        // Find the last element with this bunchId
        let lastIdx = -1;
        let lastCounter = -1;
        for (let j = ids.length - 1; j >= 0; j--) {
          if (ids[j].bunchId === `bunch${i}`) {
            lastIdx = j;
            lastCounter = ids[j].counter;
            break;
          }
        }

        if (lastIdx >= 0) {
          // Insert elements that continue the sequence
          const id = createId(`bunch${i}`, lastCounter + 1);
          fuzzer.insertAfter(ids[lastIdx], id, 3);
          inserted.push({ id, count: 3 });

          for (let j = 0; j < 3; j++) {
            ids.push({ bunchId: id.bunchId, counter: id.counter + j });
          }
        }
      }

      fuzzer.checkAll();

      // Undo the latest inserts in reverse order.
      for (let i = inserted.length - 1; i >= 0; i--) {
        const { id, count } = inserted[i];
        fuzzer.uninsert(id, count);
      }

      fuzzer.checkAll();
    });

    it("should test the impact of bulk operations on tree balance", function () {
      this.timeout(10000);

      // Parameter to control test intensity
      const batchCount = 50;
      const batchSize = 20;

      const fuzzer = Fuzzer.new();
      const ids: ElementId[] = [];

      // Add batches of elements that will force the tree to grow
      for (let batch = 0; batch < batchCount; batch++) {
        const batchId = createId(`batch${batch}`, 0);

        // Choose where to insert the batch
        if (batch === 0 || ids.length === 0) {
          // First batch at the beginning
          fuzzer.insertAfter(null, batchId, batchSize);
        } else if (batch === 1) {
          // Second batch at the end
          fuzzer.insertAfter(ids[ids.length - 1], batchId, batchSize);
        } else {
          // Other batches at random positions
          const position = Math.floor(prng() * ids.length);
          if (prng() > 0.5) {
            fuzzer.insertAfter(ids[position], batchId, batchSize);
          } else {
            fuzzer.insertBefore(ids[position], batchId, batchSize);
          }
        }

        // Add the batch IDs to our tracking
        for (let i = 0; i < batchSize; i++) {
          ids.push({ bunchId: batchId.bunchId, counter: batchId.counter + i });
        }

        fuzzer.checkAll();

        // Now delete a fraction of elements from previous batches
        if (batch > 0) {
          const deleteCount = Math.floor(batchSize / 4); // Delete 25% of a batch
          const targetBatch = Math.floor(prng() * batch); // Choose a previous batch

          // Delete elements from the target batch
          for (let i = 0; i < deleteCount; i++) {
            const deletePosition = targetBatch * batchSize + i * 2; // Delete every other element
            if (deletePosition < ids.length) {
              fuzzer.delete(ids[deletePosition]);
            }
          }

          fuzzer.checkAll();
        }
      }

      // Now perform targeted operations that might affect balance

      // 1. Delete elements at potential node boundaries
      const boundaryCandidates = [0, 8, 16, 24, 32, 40, 48, 56];
      for (const boundary of boundaryCandidates) {
        if (boundary < ids.length) {
          fuzzer.delete(ids[boundary]);
        }
      }

      fuzzer.checkAll();

      // 2. Insert elements at those same boundaries
      for (const boundary of boundaryCandidates) {
        if (boundary < ids.length) {
          const id = createId(`boundary${boundary}`, 0);
          try {
            fuzzer.insertBefore(ids[boundary], id);
            ids.push(id);
          } catch (e) {
            if (e instanceof AssertionError) {
              throw e;
            }
            // Handle case where ID is already deleted
          }
        }
      }

      fuzzer.checkAll();

      // 3. Bulk operation to insert a large batch in the middle
      if (ids.length > 20) {
        const midpoint = Math.floor(ids.length / 2);
        const id = createId("middle", 0);
        fuzzer.insertAfter(ids[midpoint], id, 30);

        fuzzer.checkAll();
      }
    });

    it("should handle interleaved operations on a deep tree", () => {
      const fuzzer = Fuzzer.new();

      // Create a deep tree with many elements
      fuzzer.insertAfter(null, createId("base", 0), 100);

      // Insert elements with varying patterns in the middle
      for (let i = 0; i < 20; i++) {
        const baseIndex = 10 + i * 4;
        fuzzer.insertAfter(
          createId("base", baseIndex),
          createId(`interleaved${i}`, 0),
          (i % 3) + 1 // Insert 1, 2, or 3 elements
        );
      }
      fuzzer.checkAll();

      // Delete some elements to create fragmentation in leaves' presence
      for (let i = 0; i < 30; i++) {
        if (i % 7 === 0) {
          fuzzer.delete(createId("base", i));
        }
      }
      fuzzer.checkAll();
    });
  });
});
