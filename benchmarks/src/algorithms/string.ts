import { assert } from "chai";
import type seedrandom from "seedrandom";
import type { TraceEdit } from "../internal/traces";
import type { TextAlgorithm } from "../text_algorithm";

/**
 * A simple string, edited with slice and string concatenation.
 */
export class StringAlgorithm implements TextAlgorithm<TraceEdit> {
  text = "";

  constructor(_prng: seedrandom.PRNG) {}

  readonly isProseMirror = false;

  apply(edit: TraceEdit): void {
    switch (edit.type) {
      case "insert": {
        this.text =
          this.text.slice(0, edit.index) +
          edit.char +
          this.text.slice(edit.index);
        break;
      }
      case "delete": {
        this.text =
          this.text.slice(0, edit.index) + this.text.slice(edit.index + 1);
        break;
      }
    }
  }

  iterate(): void {
    void this.text;
  }

  save(): string {
    return this.text;
  }

  load(savedState: string): void {
    this.text = savedState;
  }

  check(finalText: string) {
    assert.strictEqual(this.text, finalText);
  }
}
