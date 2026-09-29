import { assert } from "chai";
import * as Y from "yjs";
import type { TraceEdit } from "../internal/trace";
import type { TextAlgorithm } from "./base";

/**
 * The Yjs library's `Y.Text` rich-text CRDT.
 */
export class YjsTextAlgorithm implements TextAlgorithm<TraceEdit, Uint8Array> {
  static readonly isProseMirror = false;
  static readonly isSavedStateString = false;

  readonly ydoc: Y.Doc;
  readonly ytext: Y.Text;

  constructor() {
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText();
  }

  apply(edit: TraceEdit): void {
    // Each Yjs op is wrapped in its own transaction.
    switch (edit.type) {
      case "insert": {
        this.ytext.insert(edit.index, edit.char);
        break;
      }
      case "delete": {
        this.ytext.delete(edit.index, 1);
        break;
      }
    }
  }

  iterate(): void {
    void this.ytext.toString();
  }

  save(): Uint8Array {
    return Y.encodeStateAsUpdate(this.ydoc);
  }

  load(savedState: Uint8Array): void {
    Y.applyUpdate(this.ydoc, savedState);
  }

  check(finalText: string) {
    assert.strictEqual(this.ytext.toString(), finalText);
  }
}
