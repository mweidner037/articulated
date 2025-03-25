/**
 * A unique and immutable id for a list element.
 *
 * ElementIds are conceptually the same as UUIDs (or nanoids, etc.).
 * However, when a single thread generates a series of ElementIds, you are
 * allowed to optimize by generating a single UUID/nanoid/etc. and using that as the "bunchId"
 * for a "bunch" of elements, with varying `counter`.
 * The resulting ElementIds compress better than a set of UUIDs, but they are
 * still globally unique, even if another thread/user/device generates ElementIds concurrently.
 *
 * For example, if a user types a sentence from left to right, you may generate a
 * single `bunchId` and assign their characters the sequential ElementIds
 * `{ bunchId, counter: 0 }, { bunchId, counter: 1 }, { bunchId, counter: 2 }, ...`.
 * An IdList will store all of these as a single object instead of
 * one object per ElementId.
 */
export interface ElementId {
  /**
   * A UUID or similar globally unique ID.
   *
   * You must choose this so that the resulting ElementId is globally unique,
   * even if another part of your application creates
   * ElementIds concurrently (possibly on a different device).
   */
  readonly bunchId: string;
  /**
   * An integer used to distinguish ElementIds in the same bunch.
   *
   * Typically, you will assign sequential counters 0, 1, 2, ... to list elements
   * that are initially inserted in a left-to-right order.
   * IdList is optimized for this case, but it is not mandatory.
   * In particular, it is okay if future edits cause the sequential ids to be
   * separated, partially deleted, or even reordered.
   */
  readonly counter: number;
}

/**
 * Equals function for ElementIds.
 */
export function equalsId(a: ElementId, b: ElementId) {
  return a.counter === b.counter && a.bunchId === b.bunchId;
}

/**
 * Expands a "compressed" sequence of ElementIds that have the same bunchId but
 * sequentially increasing counters, starting at `startId.counter`.
 *
 * For example,
 * ```ts
 * expandIds({ bunchId: "foo", counter: 7 }, 3)
 * ```
 * returns
 * ```ts
 * [
 *   { bunchId: "foo", counter: 7 },
 *   { bunchId: "foo", counter: 8 },
 *   { bunchId: "foo", counter: 9 }
 * ]
 * ```
 */
export function expandIds(startId: ElementId, count: number): ElementId[] {
  if (!(Number.isSafeInteger(count) && count >= 0)) {
    throw new Error(`Invalid count: ${count}`);
  }

  const ans: ElementId[] = [];
  for (let i = 0; i < count; i++) {
    ans.push({ bunchId: startId.bunchId, counter: startId.counter + i });
  }
  return ans;
}
