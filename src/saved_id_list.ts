/**
 * JSON saved state for an IdList, returned by `IdList.save()`.
 *
 * It describes all of the list's known ElementIds in list order, with basic compression:
 * if sequential ElementIds have the same bunchId, the same isDeleted status,
 * and sequential counters, then they are combined into a single object.
 * This format is simple and compresses well with GZIP.
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
