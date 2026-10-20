import type { SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import seedrandom from "seedrandom";
import { IdListAlgorithm } from "../algorithms/id_list";
import { loadTrace } from "../internal/trace";
import { applyEdits } from "../internal/util";

export async function fixture(): Promise<SavedIdList> {
  const trace = await loadTrace("kleppmannReal", false);
  // Match Matthew's seed, structured IDs, refresh interval, and final trace.
  const algorithm = applyEdits(
    IdListAlgorithm,
    seedrandom("42"),
    1000,
    trace.edits,
  );
  algorithm.check(trace.finalText);
  return JSON.parse(algorithm.save()) as SavedIdList;
}

export function forDocument(saved: SavedIdList, document: number): SavedIdList {
  const clients = new Map<string, string>();
  return saved.map((r) => {
    const split = r.bunchId.lastIndexOf("_");
    assert(split > 0);
    const old = r.bunchId.slice(0, split);
    let client = clients.get(old);
    if (client === undefined) {
      client = createHash("sha256")
        .update(`document-${document}-client-${old}`)
        .digest("base64url")
        .slice(0, 10);
      assert(![...clients.values()].includes(client));
      clients.set(old, client);
    }
    return { ...r, bunchId: client + r.bunchId.slice(split) };
  });
}

export const example: SavedIdList = [
  { bunchId: "alice_0", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "bob_0", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "alice_1", startCounter: 0, count: 2, isDeleted: false },
  { bunchId: "alice_0", startCounter: 3, count: 2, isDeleted: true },
];
