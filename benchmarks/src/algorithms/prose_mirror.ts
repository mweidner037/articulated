import { assert } from "chai";
import { EditorState } from "prosemirror-state";
import type seedrandom from "seedrandom";
import { proseMirrorSchema } from "../internal/prose_mirror";
import type { TraceProseMirrorEdit } from "../internal/traces";
import type { TextAlgorithm } from "../text_algorithm";

/**
 * A ProseMirror EditorState, with schema `"paragraph+"`.
 *
 * Newlines in the editing trace are converted to paragraph breaks.
 * Otherwise, we'd have one big text node, which is not realistic
 * and an unfair performance comparison.
 */
export class ProseMirrorAlgorithm implements TextAlgorithm<TraceProseMirrorEdit> {
  state: EditorState;

  constructor(_prng: seedrandom.PRNG) {
    this.state = EditorState.create({
      schema: proseMirrorSchema,
      doc: proseMirrorSchema.topNodeType.create(),
    });
  }

  readonly isProseMirror = true;

  apply(edit: TraceProseMirrorEdit): void {
    const tr = this.state.tr;

    switch (edit.type) {
      case "insert": {
        tr.insertText(edit.char, edit.pos);
        break;
      }
      case "delete": {
        tr.delete(edit.pos, edit.pos + 1);
        break;
      }
      case "split": {
        tr.split(edit.pos);
        break;
      }
      case "join": {
        tr.join(edit.pos);
        break;
      }
    }

    this.state = this.state.apply(tr);
  }

  iterate(): void {
    for (const child of this.state.doc.children) {
      void child.textContent;
    }
  }

  save(): string {
    return JSON.stringify(this.state.doc.toJSON());
  }

  load(savedState: string): void {
    const doc = proseMirrorSchema.nodeFromJSON(JSON.parse(savedState));
    this.state = EditorState.create({ schema: proseMirrorSchema, doc });
  }

  check(finalText: string): void {
    const pmText = this.state.doc.children
      .map((child) => child.textContent)
      .join("\n");
    assert.strictEqual(pmText, finalText);
  }
}
