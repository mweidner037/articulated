import { AssertionError } from "chai";
import seedrandom from "seedrandom";
import { ElementId, equalsId } from "../src";
import { M } from "../src/id_list";
import { Fuzzer } from "./fuzzer";

describe("IdList Fuzzer Tests", () => {
  let prng!: seedrandom.PRNG;

  beforeEach(() => {
    prng = seedrandom("42");
  });

  // Helper to create random ElementIds
  const createRandomId = (): ElementId => {
    const bunchId = `bunch-${Math.floor(prng() * 1000)}`;
    const counter = Math.floor(prng() * 100);
    return { bunchId, counter };
  };

  // Helper to create sequential ElementIds
  const createSequentialIds = (
    count: number,
    bunchId = "sequential",
    startCounter = 0
  ): ElementId[] => {
    const ids: ElementId[] = [];
    for (let i = 0; i < count; i++) {
      ids.push({ bunchId, counter: startCounter + i });
    }
    return ids;
  };

  describe("Random Operation Sequences", () => {
    it("should handle a random sequence of operations", function () {
      this.timeout(6000);

      const fuzzer = Fuzzer.new();
      const knownIds: ElementId[] = [];

      // Perform a sequence of random operations
      const operationCount = 1000;
      for (let i = 0; i < operationCount; i++) {
        // Every 10 operations, check all accessors
        if (i % 10 === 0) {
          fuzzer.checkAll();
        }

        const operation = Math.floor(prng() * 5); // 0-4 for different operations

        switch (operation) {
          case 0: // insertAfter
            {
              const newId = createRandomId();
              const beforeIndex =
                knownIds.length > 0 ? Math.floor(prng() * knownIds.length) : -1;
              const before = beforeIndex >= 0 ? knownIds[beforeIndex] : null;
              const count = Math.floor(prng() * 3) + 1; // 1-3 elements

              try {
                fuzzer.insertAfter(before, newId, count);
                // Add the new IDs to our known list
                for (let j = 0; j < count; j++) {
                  knownIds.push({
                    bunchId: newId.bunchId,
                    counter: newId.counter + j,
                  });
                }
              } catch (e) {
                if (e instanceof AssertionError) {
                  throw e;
                }
                // This might fail legitimately if the ID already exists
                // Just continue with the next operation
              }
            }
            break;

          case 1: // insertBefore
            {
              const newId = createRandomId();
              const afterIndex =
                knownIds.length > 0 ? Math.floor(prng() * knownIds.length) : -1;
              const after = afterIndex >= 0 ? knownIds[afterIndex] : null;
              const count = Math.floor(prng() * 3) + 1; // 1-3 elements

              try {
                fuzzer.insertBefore(after, newId, count);
                // Add the new IDs to our known list
                for (let j = 0; j < count; j++) {
                  knownIds.push({
                    bunchId: newId.bunchId,
                    counter: newId.counter + j,
                  });
                }
              } catch (e) {
                if (e instanceof AssertionError) {
                  throw e;
                }
                // This might fail legitimately if the ID already exists
                // Just continue with the next operation
              }
            }
            break;

          case 2: // uninsert
            if (knownIds.length > 0) {
              const count = Math.floor(prng() * 3) + 1; // 1-3 elements
              const index = Math.floor(prng() * knownIds.length);
              const id = knownIds[index];
              fuzzer.uninsert(id, count);

              // Delete the uninserted IDs from our known list
              for (let j = 0; j < count; j++) {
                const jId: ElementId = {
                  bunchId: id.bunchId,
                  counter: id.counter + j,
                };
                const jIndex = knownIds.findIndex((otherId) =>
                  equalsId(otherId, jId)
                );
                if (jIndex !== -1) knownIds.splice(jIndex, 1);
              }
            }
            break;

          case 3: // delete
            if (knownIds.length > 0) {
              const index = Math.floor(prng() * knownIds.length);
              const id = knownIds[index];
              fuzzer.delete(id);
              // We keep the ID in knownIds since it's still known, just deleted
            }
            break;

          case 4: // undelete
            if (knownIds.length > 0) {
              const index = Math.floor(prng() * knownIds.length);
              const id = knownIds[index];
              try {
                fuzzer.undelete(id);
              } catch (e) {
                if (e instanceof AssertionError) {
                  throw e;
                }
                // This might fail if the ID wasn't deleted
                // Just continue with the next operation
              }
            }
            break;
        }
      }

      // Final check of all accessors
      fuzzer.checkAll();
    });

    it("should handle multiple random sequences with different seeds", function () {
      this.timeout(5000); // Increase timeout for this test

      const seeds = ["42", "1337", "2468", "9876"];
      const operationCount = 500;

      for (const seed of seeds) {
        prng = seedrandom(seed);
        const fuzzer = Fuzzer.new();
        const knownIds: ElementId[] = [];

        for (let i = 0; i < operationCount; i++) {
          const operation = Math.floor(prng() * 5);

          if (i % 10 === 0) {
            fuzzer.checkAll();
          }

          try {
            switch (operation) {
              case 0: // insertAfter
                {
                  const newId = createRandomId();
                  const beforeIndex =
                    knownIds.length > 0
                      ? Math.floor(prng() * knownIds.length)
                      : -1;
                  const before =
                    beforeIndex >= 0 ? knownIds[beforeIndex] : null;
                  const count = Math.floor(prng() * 3) + 1;

                  fuzzer.insertAfter(before, newId, count);
                  for (let j = 0; j < count; j++) {
                    knownIds.push({
                      bunchId: newId.bunchId,
                      counter: newId.counter + j,
                    });
                  }
                }
                break;

              case 1: // insertBefore
                {
                  const newId = createRandomId();
                  const afterIndex =
                    knownIds.length > 0
                      ? Math.floor(prng() * knownIds.length)
                      : -1;
                  const after = afterIndex >= 0 ? knownIds[afterIndex] : null;
                  const count = Math.floor(prng() * 3) + 1;

                  fuzzer.insertBefore(after, newId, count);
                  for (let j = 0; j < count; j++) {
                    knownIds.push({
                      bunchId: newId.bunchId,
                      counter: newId.counter + j,
                    });
                  }
                }
                break;

              case 2: // uninsert
                if (knownIds.length > 0) {
                  const count = Math.floor(prng() * 3) + 1; // 1-3 elements
                  const index = Math.floor(prng() * knownIds.length);
                  const id = knownIds[index];
                  fuzzer.uninsert(id, count);

                  // Delete the uninserted IDs from our known list
                  for (let j = 0; j < count; j++) {
                    const jId: ElementId = {
                      bunchId: id.bunchId,
                      counter: id.counter + j,
                    };
                    const jIndex = knownIds.findIndex((otherId) =>
                      equalsId(otherId, jId)
                    );
                    if (jIndex !== -1) knownIds.splice(jIndex, 1);
                  }
                }
                break;

              case 3: // delete
                if (knownIds.length > 0) {
                  const index = Math.floor(prng() * knownIds.length);
                  fuzzer.delete(knownIds[index]);
                }
                break;

              case 4: // undelete
                if (knownIds.length > 0) {
                  const index = Math.floor(prng() * knownIds.length);
                  fuzzer.undelete(knownIds[index]);
                }
                break;
            }
          } catch (e) {
            if (e instanceof AssertionError) {
              throw e;
            }
            // Expected exceptions might occur, continue
          }
        }

        fuzzer.checkAll();
      }
    });
  });

  describe("B+Tree Specific Fuzzing", () => {
    it("should handle large sequential insertions to force tree growth", function () {
      this.timeout(5000); // This test may take longer

      const fuzzer = Fuzzer.new();
      const batchSize = 10; // Number of elements to insert in each batch
      const batchCount = 100; // Number of batches to insert

      // This should create enough elements to force multiple tree levels
      for (let batch = 0; batch < batchCount; batch++) {
        // Check all accessors periodically
        if (batch % 3 === 0) {
          fuzzer.checkAll();
        }

        const batchId = createRandomId();
        try {
          fuzzer.insertAfter(null, batchId, batchSize);
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          // If this insertion fails, try with a different ID
          const alternateBatchId = createRandomId();
          fuzzer.insertAfter(null, alternateBatchId, batchSize);
        }
      }

      fuzzer.checkAll();
    });

    it("should handle interleaved insertions that cause leaf splits", () => {
      const fuzzer = Fuzzer.new();

      // First create a sequential list of elements
      const baseId = { bunchId: "base", counter: 0 };
      fuzzer.insertAfter(null, baseId, 20);
      fuzzer.checkAll();

      // Now interleave new elements between existing ones to force leaf splits
      for (let i = 0; i < 15; i += 2) {
        const targetId = { bunchId: "base", counter: i };
        const newId = { bunchId: `interleave-${i}`, counter: 0 };

        fuzzer.insertAfter(targetId, newId);

        // Check occasionally
        if (i % 6 === 0) {
          fuzzer.checkAll();
        }
      }

      fuzzer.checkAll();
    });

    it("should handle operations near B+Tree node boundaries", function () {
      // Create a list with exactly M elements
      const ids = createSequentialIds(M);
      const fuzzer = Fuzzer.fromIds(ids);
      fuzzer.checkAll();

      // Insert at the boundary to force a split
      fuzzer.insertAfter(ids[M - 1], {
        bunchId: "boundary",
        counter: 0,
      });
      fuzzer.checkAll();

      // Insert at the middle of a leaf
      fuzzer.insertAfter(ids[Math.floor(M / 2)], {
        bunchId: "middle",
        counter: 0,
      });
      fuzzer.checkAll();

      // Delete elements at potential boundaries
      fuzzer.delete(ids[M - 1]);
      fuzzer.delete(ids[0]);
      fuzzer.checkAll();

      // Reinsert at those boundaries
      fuzzer.insertBefore(ids[1], {
        bunchId: "reinsertion",
        counter: 0,
      });
      fuzzer.insertAfter(ids[M - 2], {
        bunchId: "reinsertion",
        counter: 1,
      });
      fuzzer.checkAll();
    });

    it("should handle bulk insertions at different tree positions", () => {
      // Create a base tree with some elements
      const baseIds = createSequentialIds(15);
      const fuzzer = Fuzzer.fromIds(baseIds);
      fuzzer.checkAll();

      // Insert bulk elements at the beginning, middle, and end
      fuzzer.insertBefore(baseIds[0], { bunchId: "start", counter: 0 }, 5);
      fuzzer.checkAll();

      fuzzer.insertAfter(baseIds[7], { bunchId: "middle", counter: 0 }, 5);
      fuzzer.checkAll();

      fuzzer.insertAfter(baseIds[14], { bunchId: "end", counter: 0 }, 5);
      fuzzer.checkAll();

      // Insert small batches at various positions
      for (let i = 0; i < 100; i++) {
        const targetIndex = Math.floor(prng() * baseIds.length);
        const targetId = baseIds[targetIndex];
        const newId = { bunchId: `batch-${i}`, counter: 0 };
        const count = 1 + Math.floor(prng() * 3); // 1-3 elements

        if (prng() > 0.5) {
          fuzzer.insertAfter(targetId, newId, count);
        } else {
          fuzzer.insertBefore(targetId, newId, count);
        }
      }

      fuzzer.checkAll();
    });
  });

  describe("Edge Case Fuzzing", () => {
    it("should handle operations on empty and near-empty lists", () => {
      const fuzzer = Fuzzer.new();
      fuzzer.checkAll();

      // Insert and delete to empty
      const id1 = createRandomId();
      fuzzer.insertAfter(null, id1);
      fuzzer.checkAll();

      fuzzer.delete(id1);
      fuzzer.checkAll();

      // Insert, delete, then undelete
      const id2 = createRandomId();
      fuzzer.insertAfter(null, id2);
      fuzzer.delete(id2);
      fuzzer.undelete(id2);
      fuzzer.checkAll();

      // Insert after a deleted ID
      const id3 = createRandomId();
      fuzzer.insertAfter(id2, id3);
      fuzzer.checkAll();

      // Insert before a deleted ID
      const id4 = createRandomId();
      fuzzer.delete(id2);
      fuzzer.insertBefore(id2, id4);
      fuzzer.checkAll();
    });

    it("should handle extensive deletion and reinsertion", function () {
      // Create a list with sequential elements
      const ids = createSequentialIds(30);
      const fuzzer = Fuzzer.fromIds(ids);
      fuzzer.checkAll();

      // Delete elements in a pattern
      for (let i = 0; i < 30; i += 3) {
        fuzzer.delete(ids[i]);

        if (i % 9 === 0) {
          fuzzer.checkAll();
        }
      }

      fuzzer.checkAll();

      // Reinsert elements at deleted positions
      for (let i = 0; i < 30; i += 3) {
        const newId = { bunchId: "reinsert", counter: i };

        if (i % 2 === 0) {
          fuzzer.insertAfter(ids[i], newId);
        } else {
          fuzzer.insertBefore(ids[i], newId);
        }

        if (i % 9 === 0) {
          fuzzer.checkAll();
        }
      }

      fuzzer.checkAll();

      // Undelete some of the original deleted elements
      for (let i = 0; i < 30; i += 6) {
        fuzzer.undelete(ids[i]);
      }

      fuzzer.checkAll();
    });

    it("should handle sequential ID compression edge cases", () => {
      const fuzzer = Fuzzer.new();

      // Insert sequences with the same bunchId but gaps in counters
      fuzzer.insertAfter(null, { bunchId: "sequence", counter: 0 }, 5);
      fuzzer.checkAll();

      // Insert a gap
      fuzzer.insertAfter(
        { bunchId: "sequence", counter: 4 },
        { bunchId: "sequence", counter: 10 },
        5
      );
      fuzzer.checkAll();

      // Fill some of the gap
      fuzzer.insertAfter(
        { bunchId: "sequence", counter: 4 },
        { bunchId: "sequence", counter: 5 },
        2
      );
      fuzzer.checkAll();

      // Delete alternating elements
      for (let i = 0; i < 15; i += 2) {
        if (i !== 6 && i !== 8) {
          // Skip the gap
          fuzzer.delete({ bunchId: "sequence", counter: i });
        }
      }
      fuzzer.checkAll();

      // Reinsert some elements with the same bunchId
      fuzzer.insertAfter(
        { bunchId: "sequence", counter: 3 },
        { bunchId: "sequence", counter: 20 },
        3
      );
      fuzzer.checkAll();
    });

    it("should handle a parameterized complex sequence of operations", function () {
      this.timeout(10000); // Adjust timeout based on iterationCount

      const iterationCount = 50; // Parameter to adjust test intensity
      const fuzzer = Fuzzer.new();
      const knownIds: ElementId[] = [];

      for (let iteration = 0; iteration < iterationCount; iteration++) {
        // Perform a mix of operations in each iteration

        // Operation 1: Insert a batch of sequential IDs
        const batchId = { bunchId: `batch-${iteration}`, counter: 0 };
        const batchSize = 5 + Math.floor(prng() * 10); // 5-14 elements

        try {
          fuzzer.insertAfter(null, batchId, batchSize);
          for (let i = 0; i < batchSize; i++) {
            knownIds.push({ bunchId: batchId.bunchId, counter: i });
          }
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          // Handle case where ID already exists
        }

        if (iteration % 5 === 0) {
          fuzzer.checkAll();
        }

        // Operation 2: Delete some elements if we have enough
        if (knownIds.length > 10) {
          const deleteCount = 2 + Math.floor(prng() * 5); // 2-6 elements
          for (let i = 0; i < deleteCount; i++) {
            const idx = Math.floor(prng() * knownIds.length);
            fuzzer.delete(knownIds[idx]);
          }
        }

        // Operation 3: Interleave some insertions
        if (knownIds.length > 0) {
          const insertCount = 1 + Math.floor(prng() * 3); // 1-3 elements
          for (let i = 0; i < insertCount; i++) {
            const idx = Math.floor(prng() * knownIds.length);
            const referenceId = knownIds[idx];
            const newId = {
              bunchId: `interleave-${iteration}-${i}`,
              counter: 0,
            };

            try {
              if (prng() > 0.5) {
                fuzzer.insertAfter(referenceId, newId);
              } else {
                fuzzer.insertBefore(referenceId, newId);
              }
              knownIds.push(newId);
            } catch (e) {
              if (e instanceof AssertionError) {
                throw e;
              }
              // Handle possible exceptions
            }
          }
        }

        // Operation 4: Undelete some elements
        if (knownIds.length > 0) {
          const undeleteCount = Math.floor(prng() * 3); // 0-2 elements
          for (let i = 0; i < undeleteCount; i++) {
            const idx = Math.floor(prng() * knownIds.length);
            try {
              fuzzer.undelete(knownIds[idx]);
            } catch (e) {
              if (e instanceof AssertionError) {
                throw e;
              }
              // Handle case where element wasn't deleted
            }
          }
        }

        if (iteration % 5 === 0 || iteration === iterationCount - 1) {
          fuzzer.checkAll();
        }
      }

      // Final verification
      fuzzer.checkAll();
    });
  });

  describe("Save and Load Fuzzing", () => {
    it("should maintain integrity through multiple save/load cycles", function () {
      this.timeout(5000);

      // Create an initial list with random operations
      const fuzzer = Fuzzer.new();
      const ids: ElementId[] = [];

      // Perform some initial operations
      for (let i = 0; i < 20; i++) {
        const id = createRandomId();
        try {
          fuzzer.insertAfter(ids.length > 0 ? ids[ids.length - 1] : null, id);
          ids.push(id);
        } catch (e) {
          if (e instanceof AssertionError) {
            throw e;
          }
          // Handle ID collision
        }
      }

      // Delete some elements
      for (let i = 0; i < 5; i++) {
        const idx = Math.floor(prng() * ids.length);
        fuzzer.delete(ids[idx]);
      }

      fuzzer.checkAll();

      // Now perform save/load cycles with operations in between
      for (let cycle = 0; cycle < 5; cycle++) {
        // Get saved state from the current fuzzer
        const savedState = fuzzer.list.save();

        // Reload the fuzzer from the saved state
        fuzzer.load(savedState);

        fuzzer.checkAll();

        // Perform more operations
        for (let i = 0; i < 5; i++) {
          const operation = Math.floor(prng() * 5);

          switch (operation) {
            case 0: // insertAfter
              {
                const id = createRandomId();
                const idx = Math.floor(prng() * ids.length);
                try {
                  fuzzer.insertAfter(ids[idx], id);
                  ids.push(id);
                } catch (e) {
                  if (e instanceof AssertionError) {
                    throw e;
                  }
                  // Handle exceptions
                }
              }
              break;

            case 1: // insertBefore
              {
                const id = createRandomId();
                const idx = Math.floor(prng() * ids.length);
                try {
                  fuzzer.insertBefore(ids[idx], id);
                  ids.push(id);
                } catch (e) {
                  if (e instanceof AssertionError) {
                    throw e;
                  }
                  // Handle exceptions
                }
              }
              break;

            case 2: // uninsert
              if (ids.length > 0) {
                const count = Math.floor(prng() * 3) + 1; // 1-3 elements
                const index = Math.floor(prng() * ids.length);
                const id = ids[index];
                fuzzer.uninsert(id, count);

                // Delete the uninserted IDs from our known list
                for (let j = 0; j < count; j++) {
                  const jId: ElementId = {
                    bunchId: id.bunchId,
                    counter: id.counter + j,
                  };
                  const jIndex = ids.findIndex((otherId) =>
                    equalsId(otherId, jId)
                  );
                  if (jIndex !== -1) ids.splice(jIndex, 1);
                }
              }
              break;

            case 3: // delete
              if (ids.length > 0) {
                const idx = Math.floor(prng() * ids.length);
                fuzzer.delete(ids[idx]);
              }
              break;

            case 4: // undelete
              if (ids.length > 0) {
                const idx = Math.floor(prng() * ids.length);
                try {
                  fuzzer.undelete(ids[idx]);
                } catch (e) {
                  if (e instanceof AssertionError) {
                    throw e;
                  }
                  // Handle exceptions
                }
              }
              break;
          }
          fuzzer.checkAll();
        }

        fuzzer.checkAll();
      }
    });
  });
});
