import { assert } from "chai";
import type { TraceEdit } from "../internal/trace";
import type { TextAlgorithm } from "./base";

/**
 * A simple array of characters, edited with Array.splice.
 */
export class CharArrayAlgorithm implements TextAlgorithm<TraceEdit, string> {
  static readonly isProseMirror = false;
  static readonly isSavedStateString = true;
  static readonly isWasm = false;

  chars: string[] = [];

  constructor() {}

  apply(edit: TraceEdit): void {
    switch (edit.type) {
      case "insert": {
        this.chars.splice(edit.index, 0, edit.char);
        break;
      }
      case "delete": {
        this.chars.splice(edit.index, 1);
        break;
      }
    }
  }

  iterate(): void {
    for (const char of this.chars) {
      void char;
    }
  }

  save(): string {
    return this.chars.join("");
  }

  load(savedState: string): void {
    this.chars = [...savedState];
  }

  check(finalText: string) {
    assert.strictEqual(this.save(), finalText);
  }

  free(): void {}
}
