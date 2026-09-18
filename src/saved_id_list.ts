/**
 * JSON saved state for an IdList.
 *
 * It describes all of the list's known ElementIds in list order, with basic compression:
 * if sequential ElementIds have the same bunchId, the same isDeleted status,
 * and sequential counters, then they are combined into a single object.
 *
 * You may create or modify SavedIdLists manually. Duplicate ElementIds
 * are not allowed, but it is okay to have objects with `count == 0`
 * or neighbors that are not fully combined.
 */
export type SavedIdList = Array<{
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
  readonly isDeleted: boolean;
}>;
