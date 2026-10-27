import { IdList, type ElementId, type SavedIdList } from "articulated";

export const nativeFirstEdit = "browser-first-edit_0";
export interface EditWorkload {
  lookups: { index: number; id: ElementId }[];
  edits: (
    | { type: "insert"; index: number; before: ElementId | null; id: ElementId }
    | { type: "delete"; index: number; id: ElementId }
  )[];
  expected: SavedIdList;
  expectedText: string;
}
/** Reference generation is outside all browser timers. Deterministic distributed edits. */
export function makeEditWorkload(
  saved: SavedIdList,
  text: string,
): EditWorkload {
  let tree = IdList.load(saved).insertAfter(null, {
    bunchId: nativeFirstEdit,
    counter: 0,
  });
  text = "x" + text;
  let seed = 72;
  const random = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const lookups = Array.from({ length: 128 }, () => {
    const index = random(tree.length);
    return { index, id: tree.at(index) };
  });
  const edits: EditWorkload["edits"] = [];
  for (let i = 0; i < 200; i++) {
    if (i % 2 === 0) {
      const index = random(tree.length + 1),
        before = index ? tree.at(index - 1) : null;
      const id = { bunchId: "bench-native_0", counter: i };
      tree = tree.insertAfter(before, id);
      edits.push({ type: "insert", index, before, id });
      text = text.slice(0, index) + "x" + text.slice(index);
    } else {
      const index = random(tree.length),
        id = tree.at(index);
      tree = tree.delete(id);
      edits.push({ type: "delete", index, id });
      text = text.slice(0, index) + text.slice(index + 1);
    }
  }
  return { lookups, edits, expected: tree.save(), expectedText: text };
}
