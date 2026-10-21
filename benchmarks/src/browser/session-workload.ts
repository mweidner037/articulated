import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { nativeFirstEdit } from "./edit-workload";
import type { SessionEdit } from "./page-runtime";

/** Deterministic editing trajectories, constructed by the reference OUTSIDE timers.
 * Never delete paragraph separators: every edit is a real single-character PM
 * insertion/deletion, so the browser can apply identical incremental edits. */
export function sessionWorkload(
  saved: SavedIdList,
  initialText: string,
  kind: "local" | "distributed" | "new-bunches",
  operations = 2000,
  idModel: "structured" | "opaque8" = "structured",
) {
  const names = new Map<string, string>();
  const used = new Set(saved.map((row) => row.bunchId));
  used.add(nativeFirstEdit);
  const name = (structured: string) => {
    if (idModel === "structured") return structured;
    let id = names.get(structured);
    if (id === undefined) {
      id = createHash("sha256")
        .update(JSON.stringify(["opaque8-session", structured]))
        .digest("base64url")
        .slice(0, 8);
      assert(!used.has(id), "Opaque session ID collision");
      used.add(id);
      names.set(structured, id);
    }
    return id;
  };
  let list = IdList.load(saved).insertAfter(null, {
    bunchId: nativeFirstEdit,
    counter: 0,
  });
  let text = "x" + initialText,
    cursor = Math.floor(text.length / 2),
    seed = 813;
  const random = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const checkpoints: {
    completed: number;
    edits: SessionEdit[];
    expected: SavedIdList;
    text: string;
  }[] = [];
  let edits: SessionEdit[] = [];
  for (let i = 0; i < operations; i++) {
    const insert = kind === "local" ? i % 50 < 40 : i % 2 === 0;
    let index =
      kind === "local"
        ? insert
          ? cursor
          : cursor - 1
        : random(text.length + (insert ? 1 : 0));
    if (!insert) {
      while (text[index] === "\n") index = (index + 1) % text.length;
      const id = list.at(index);
      list = list.delete(id);
      edits.push({ type: "delete", index, id });
      text = text.slice(0, index) + text.slice(index + 1);
      if (kind === "local") cursor = index;
    } else {
      const before = index ? list.at(index - 1) : null;
      const id =
        kind === "new-bunches"
          ? {
              bunchId: name(`session-new-bunches_${i.toString(36)}`),
              counter: 0,
            }
          : { bunchId: name(`session-${kind}_0`), counter: i };
      list = list.insertAfter(before, id);
      edits.push({ type: "insert", index, before, id });
      text = text.slice(0, index) + "x" + text.slice(index);
      if (kind === "local") cursor = index + 1;
    }
    if ([200, 1000, operations].includes(i + 1)) {
      checkpoints.push({
        completed: i + 1,
        edits,
        expected: list.save(),
        text,
      });
      edits = [];
    }
  }
  return checkpoints;
}
