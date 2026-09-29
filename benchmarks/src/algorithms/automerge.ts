import * as Automerge from "@automerge/automerge";
import { assert } from "chai";
import type { TraceEdit } from "../internal/trace";
import type { TextAlgorithm } from "./base";

/**
 * The Automerge CRDT library's string type.
 *
 * Note: Automerge is a WASM library, so our memory benchmark does not measure it accurately.
 */
export class AutomergeAlgorithm implements TextAlgorithm<
  TraceEdit,
  Uint8Array
> {
  static readonly isProseMirror = false;
  static readonly isSavedStateString = false;

  // The doc needs to be a JSON object. Put the text string at key "text".
  doc: { text: string };

  constructor() {
    this.doc = Automerge.from({ text: "" });
  }

  apply(edit: TraceEdit): void {
    this.doc = Automerge.change(this.doc, (d) => {
      switch (edit.type) {
        case "insert": {
          Automerge.splice(d, ["text"], edit.index, 0, edit.char);
          break;
        }
        case "delete": {
          Automerge.splice(d, ["text"], edit.index, 1);
          break;
        }
      }
    });
  }

  iterate(): void {
    void this.doc["text"];
  }

  save(): Uint8Array {
    return Automerge.save(this.doc);
  }

  load(savedState: Uint8Array): void {
    Automerge.free(this.doc);
    this.doc = Automerge.load(savedState);
  }

  check(finalText: string) {
    assert.strictEqual(this.doc["text"], finalText);
  }

  free(): void {
    Automerge.free(this.doc);
  }
}
