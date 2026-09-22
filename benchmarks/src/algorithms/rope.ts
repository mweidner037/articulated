import { assert } from "chai";
import RopeSequence from "rope-sequence";
import type { TraceEdit } from "../internal/traces";
import type { TextAlgorithm } from "./base";

/**
 * A loosely-balanced rope implementation by Marijn Haverbeke,
 * https://code.haverbeke.berlin/marijn/rope-sequence.
 *
 * The implementation only supports generic elements, so we store
 * the text as a sequence of chars. This is less memory-efficient
 * than a dedicated text rope that stores strings in the leaves.
 */
export class RopeAlgorithm implements TextAlgorithm<TraceEdit> {
  rope = RopeSequence.empty;

  constructor() {}

  readonly isProseMirror = false;

  apply(edit: TraceEdit): void {
    switch (edit.type) {
      case "insert": {
        this.rope = this.rope
          .slice(0, edit.index)
          .append([edit.char])
          .append(this.rope.slice(edit.index));
        break;
      }
      case "delete": {
        this.rope = this.rope
          .slice(0, edit.index)
          .append(this.rope.slice(edit.index + 1));
        break;
      }
    }
  }

  iterate(): void {
    this.rope.forEach((char) => {
      void char;
    });
  }

  save(): string {
    // @ts-expect-error flatten type is missing
    const chars: string[] = this.rope.flatten();
    return chars.join("");
  }

  load(savedState: string): void {
    this.rope = RopeSequence.from([...savedState]);
  }

  check(finalText: string): void {
    assert.strictEqual(this.save(), finalText);
  }
}
