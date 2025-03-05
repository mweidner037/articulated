/**
 * Saved state for an IdList.
 *
 * It describes all of the list's known ElementIds in list order, with basic compression:
 * if sequential ElementIds have the same bunch id, the same is-deleted status,
 * and sequential counters, then they are combined into a single object.
 */
export type SavedIdList = Array<{
  bunchId: string;
  startCounter: number;
  count: number;
  isDeleted: boolean;
}>;
