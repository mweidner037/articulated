import { assert } from "chai";
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { realTextTraceEdits } from "../internal/util";
import { TextAlgorithm } from "../text_algorithm";

export class ProseMirrorAlgorithm implements TextAlgorithm {
  apply(start: number, deleteCount: number, char?: string): void {
    throw new Error("Method not implemented.");
  }

  iterate(): void {
    throw new Error("Method not implemented.");
  }

  save(): string | Uint8Array {
    throw new Error("Method not implemented.");
  }

  load(savedState: string | Uint8Array): void {
    throw new Error("Method not implemented.");
  }
}

const pmSchema = new Schema({
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

/**
 * Variant of the edit trace that works with ProseMirror positions
 * instead of string indexes, in which the document starts as an
 * empty paragraph and each newline becomes a paragraph break.
 * So, the document starts with an extra position (the first paragraph's
 * enter step), and each "\n" counts as two positions (a paragraph exit and enter).
 */
function realTextTraceEditsProseMirror(): {
  finalText: string;
  edits: Array<[number, number, string | undefined]>;
} {
  const { edits, finalText } = realTextTraceEdits();

  const pmEdits: Array<[number, number, string | undefined]> = [];
  let pmState = EditorState.create({
    schema: pmSchema,
    doc: pmSchema.topNodeType.create(),
  });
  for (const edit of edits) {
    // Find the ProseMirror position corresponding to index edit[0].
    const doc = pmState.doc;
    let remaining = edit[0];
    let extra = 1;
    for (const child of doc.children) {
      if (remaining <= child.content.size) break;

      remaining -= child.content.size;
      extra += 2;
    }
    const pos = edit[0] + extra;

    const tr = pmState.tr;
    if (edit[1] === 0) {
      // Insert
      pmEdits.push([pos, 0, edit[2]]);

      if (edit[2]! === "\n") {
        // Paragraph break.
        tr.split(pos);
      } else {
        // Normal character.
        tr.insertText(edit[2]!, pos);
      }
    } else {
      // Delete
      pmEdits.push([pos, 1, undefined]);

      const $pos = pmState.doc.resolve(pos);
      if ($pos.parentOffset === $pos.parent.content.size) {
        // Pointing at the position after the last char,
        // corresponding to a new line in the original trace =>
        // a paragraph break in ProseMirror.
        tr.join(pos + 1);
      } else {
        // Normal character.
        tr.delete(pos, pos + 1);
      }
    }

    pmState = pmState.apply(tr);
  }

  const pmText = pmState.doc.children
    .map((child) => child.textContent)
    .join("\n");
  assert.strictEqual(pmText, finalText);

  return { finalText, edits: pmEdits };
}
