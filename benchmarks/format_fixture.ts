import { createHash } from "crypto";
import { ElementIdGenerator, IdList, SavedIdList } from "../src";
import { realTextTraceEdits } from "./internal/util";
export function id(seed: string) {
  return createHash("sha256")
    .update(seed)
    .digest()
    .toString("base64url")
    .slice(0, 8);
}
export function fixture(): SavedIdList {
  let next = 0,
    list = IdList.new();
  const generator = new ElementIdGenerator(() => id(`bunch-${next++}`));
  for (const edit of realTextTraceEdits().edits) {
    if (edit[2] !== undefined) {
      const before = edit[0] === 0 ? null : list.at(edit[0] - 1);
      list = list.insertAfter(before, generator.generateAfter(before));
    } else list = list.delete(list.at(edit[0]));
  }
  return list.save();
}
export function forDocument(saved: SavedIdList, doc: number): SavedIdList {
  const bunches = [...new Set(saved.map((run) => run.bunchId))];
  const replacement = new Map(
    bunches.map((bunch, i) => [bunch, id(`doc-${doc}-bunch-${i}`)])
  );
  return saved.map((run) => ({
    ...run,
    bunchId: replacement.get(run.bunchId)!,
  }));
}
