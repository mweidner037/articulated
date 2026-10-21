import type { ElementId, SavedIdList } from "articulated";

/** Operations exercised by the benchmark, not a claim of full API parity. */
export interface BenchmarkList {
  readonly length: number;
  at(index: number): ElementId;
  indexOf(id: ElementId, bias?: "none" | "left" | "right"): number;
  insertAfter(
    before: ElementId | null,
    id: ElementId,
    count?: number,
  ): BenchmarkList;
  delete(id: ElementId, count?: number): BenchmarkList;
  save(): SavedIdList;
}
