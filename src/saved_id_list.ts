/**
 * JSON saved state for an IdList, returned by `IdList.save()`.
 *
 * It describes all of the list's known ElementIds in list order, with basic compression:
 * if sequential ElementIds have the same bunchId, the same isDeleted status,
 * and sequential counters, then they are combined into a single object.
 *
 * You may also create or modify SavedIdLists manually, subject to the following rules:
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
