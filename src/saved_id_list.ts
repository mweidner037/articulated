/**
 * JSON saved state for an IdList.
 *
 * It describes all of the list's known ElementIds in list order, with basic compression:
 * if sequential ElementIds have the same bunchId, the same isDeleted status,
 * and sequential counters, then they are combined into a single object.
 */
export type SavedIdList = Array<{
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
  readonly isDeleted: boolean;
}>;
