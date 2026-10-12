import { assert } from "chai";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import type { TraceEdit, TraceProseMirrorEdit } from "./trace";

export const proseMirrorSchema = new Schema({
  nodes: {
    doc: {
      content: "paragraph+",
    },
    paragraph: {
      content: "inline*",
    },
    text: {
      group: "inline",
    },
  },
});

export function newProseMirrorState(): EditorState {
  return EditorState.create({
    schema: proseMirrorSchema,
    doc: proseMirrorSchema.topNodeType.create(
      null,
      proseMirrorSchema.nodes["paragraph"].create(),
    ),
  });
}

/**
 * Convert TraceEdits into edits that work with ProseMirrorAlgorithm.
 *
 * - Treat line breaks as paragraph boundaries.
 * - Convert indexes to positions, accounting for paragraph start/end positions.
 */
export function proseMirrorEdits(
  edits: TraceEdit[],
  finalText: string,
): TraceProseMirrorEdit[] {
  const pmEdits: TraceProseMirrorEdit[] = [];

  let pmState = newProseMirrorState();
  for (const edit of edits) {
    // Find the ProseMirror position corresponding to edit.index.
    // Each paragraph after the first is preceded by a "\n" in the trace
    // (1 index) but a close+open token pair in ProseMirror (2 positions).
    const doc = pmState.doc;
    let remaining = edit.index;
    let extra = 1;
    for (const child of doc.children) {
      if (remaining <= child.content.size) break;

      // Skip the paragraph's content plus its trailing "\n".
      remaining -= child.content.size + 1;
      extra++;
    }
    const pos = edit.index + extra;

    const tr = pmState.tr;
    switch (edit.type) {
      case "insert": {
        if (edit.char === "\n") {
          // Paragraph break.
          pmEdits.push({ type: "split", pos });
          tr.split(pos);
        } else {
          // Normal character.
          pmEdits.push({ type: "insert", pos, char: edit.char });
          tr.insertText(edit.char, pos);
        }
        break;
      }
      case "delete": {
        // Delete
        const $pos = pmState.doc.resolve(pos);
        if ($pos.parentOffset === $pos.parent.content.size) {
          // Pointing at the position after the last char,
          // corresponding to a new line in the original trace =>
          // a paragraph break in ProseMirror.
          pmEdits.push({ type: "join", pos: pos + 1 });
          tr.join(pos + 1);
        } else {
          // Normal character.
          pmEdits.push({ type: "delete", pos });
          tr.delete(pos, pos + 1);
        }
        break;
      }
    }

    pmState = pmState.apply(tr);
  }

  const pmText = pmState.doc.children
    .map((child) => child.textContent)
    .join("\n");
  assert.strictEqual(pmText, finalText);

  return pmEdits;
}
