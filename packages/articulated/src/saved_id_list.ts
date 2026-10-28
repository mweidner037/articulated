/**
 * JSON saved state for an IdList, returned by `IdList.save()`.
 *
 * It describes all of the list's known ElementIds in list order, with basic compression:
 * if sequential ElementIds have the same bunchId, the same isDeleted status,
 * and sequential counters, then they are combined into a single object.
 * This format is simple and compresses well with GZIP, but somewhat verbose as raw JSON.
 * However, you may wish to design a custom compression scheme
 * (e.g., protobuf with packed ints) to speed up compression and decompression.
 *
 * Besides obtaining SavedIdLists from `IdList.save()`, you may
 * create or modify them manually, subject to the following rules:
 *
 * - Each `startCounter` and `count` must be a non-negative integer.
 * - Duplicate ElementIds are not allowed.
 * - It is okay to have trivial objects (`count` is 0) or neighbors that are not fully combined.
 */
export type SavedIdList = Array<{
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
  readonly isDeleted: boolean;
}>;

/**
 * Compact JSON saved state for an IdList, returned by `IdList.saveCompact()`.
 *
 * A CompactSavedIdList is equivalent to a {@link SavedIdList},
 * but with several tricks to make it more compact (both before and after GZIP compression)
 * at the expense of simplicity and legibility.
 *
 * In [one benchmark with a large IdList](https://github.com/mweidner037/articulated/blob/master/benchmarks/results.md#refresh-every-1000-ops),
 * SavedIdList and CompactSavedIdList compare as follows:
 * - Size as JSON (kB): 876 vs 218
 * - Size after GZIP (kB): 71.9 vs 40.3
 * - Save time including GZIP (ms): 21.5 +- 1.3 vs 10.4 +- 0.9
 * - Load time including GZIP (ms): 20.9 +- 0.8 vs 16.8 +- 1.2
 */
export type CompactSavedIdList = {
  /** The bunchIds from each object in SavedIdList, as a single array. */
  readonly bunchIds: string[];
  /** For each object in SavedIdList, its count, multiplied by -1 iff isDeleted. */
  readonly signedCounts: number[];
  /**
   * In typical usage, a bunch's known ElementIds have counter values 0, 1, ...,
   * increasing contiguously from left to right.
   * The corresponding startCounters in SavedIdList can all be inferred from previous counts.
   *
   * This array records the SavedIdList array indexes of startCounters that **can't** be inferred, delta-encoded.
   * The actual startCounters appear in startCounterValues.
   *
   * Note that this array may be shorter than bunchIds and signedCounts.
   * In typical usage, it is always empty.
   */
  readonly startCounterDeltas: number[];
  /**
   * The startCounter values corresponding to startCounterDeltas.
   */
  readonly startCounterValues: number[];
};

/**
 * Converts a {@link SavedIdList} to a {@link CompactSavedIdList}.
 *
 * Invert with {@link uncompactSavedIdList}.
 */
export function compactSavedIdList(
  savedState: SavedIdList,
): CompactSavedIdList {
  // Check that it's not a CompactSavedIdList cast to SavedIdList.
  if (!Array.isArray(savedState)) {
    throw new Error("Not a SavedIdList");
  }

  const bunchIds: string[] = [];
  const signedCounts: number[] = [];
  const startCounterDeltas: number[] = [];
  const startCounterValues: number[] = [];

  let lastExcStartCounterIndex = 0;
  /** The next counter for each bunchId. */
  const inferredStartCounters = new Map<string, number>();

  for (let i = 0; i < savedState.length; i++) {
    const { bunchId, startCounter, count, isDeleted } = savedState[i];

    bunchIds.push(bunchId);
    signedCounts.push(isDeleted ? -count : count);

    const inferredStartCounter = inferredStartCounters.get(bunchId) ?? 0;
    if (inferredStartCounter !== startCounter) {
      startCounterDeltas.push(i - lastExcStartCounterIndex);
      lastExcStartCounterIndex = i;
      startCounterValues.push(startCounter);
    }
    inferredStartCounters.set(bunchId, startCounter + count);
  }

  return { bunchIds, signedCounts, startCounterDeltas, startCounterValues };
}

/**
 * Converts a {@link CompactSavedIdList} to a {@link SavedIdList}.
 *
 * Inverse of {@link compactSavedIdList}.
 */
export function uncompactSavedIdList(
  compactSavedState: CompactSavedIdList,
): SavedIdList {
  // Check that it's not a SavedIdList cast to CompactSavedIdList.
  if (!compactSavedState.bunchIds) {
    throw new Error("Not a CompactSavedIdList");
  }

  const { bunchIds, signedCounts, startCounterDeltas, startCounterValues } =
    compactSavedState;

  const result: SavedIdList = [];

  /** The next exceptional startCounter, as an index into startCounterDeltas & startCounterValues. */
  let excStartCounterI = 0;
  /** The next exceptional startCounter's index in result. */
  let nextExcStartCounterIndex =
    startCounterDeltas.length === 0 ? -1 : startCounterDeltas[0];
  const inferredStartCounters = new Map<string, number>();

  for (let i = 0; i < bunchIds.length; i++) {
    const bunchId = bunchIds[i];
    const count = Math.abs(signedCounts[i]);

    let startCounter: number;
    if (i === nextExcStartCounterIndex) {
      startCounter = startCounterValues[excStartCounterI];

      excStartCounterI++;
      if (excStartCounterI === startCounterDeltas.length) {
        // Done with exceptions.
        nextExcStartCounterIndex = -1;
      } else {
        nextExcStartCounterIndex += startCounterDeltas[excStartCounterI];
      }
    } else {
      startCounter = inferredStartCounters.get(bunchId) ?? 0;
    }
    inferredStartCounters.set(bunchId, startCounter + count);

    result.push({
      bunchId,
      startCounter,
      count,
      isDeleted: signedCounts[i] < 0,
    });
  }

  return result;
}
