import type { SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

/** Same mapping as the storage experiment's document 0, without inventing
 * client/sequence structure for arbitrary whole IDs. */
export function opaqueFixture(saved: SavedIdList): SavedIdList {
  const ids = new Map<string, string>(),
    used = new Set<string>();
  return saved.map((run) => {
    let bunchId = ids.get(run.bunchId);
    if (bunchId === undefined) {
      bunchId = createHash("sha256")
        .update(JSON.stringify(["opaque8", 0, run.bunchId]))
        .digest("base64url")
        .slice(0, 8);
      assert(!used.has(bunchId), "Opaque-ID collision");
      used.add(bunchId);
      ids.set(run.bunchId, bunchId);
    }
    return { ...run, bunchId };
  });
}
