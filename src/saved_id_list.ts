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

/**
 * Experimental alternative to SavedIdList: negative counts denote deleted runs.
 * Positive counts denote present runs. Zero-length runs are ignored on load.
 * Use IdList.saveSignedCounts / IdList.loadSignedCounts, not the original loader.
 * There is no dictionary, binary encoding, or reduced numeric range.
 */
export type SavedSignedCountIdList = Array<{
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
}>;
