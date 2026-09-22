import RopeSequence from "rope-sequence";
import type seedrandom from "seedrandom";
import type { TextAlgorithm } from "../text_algorithm";

/**
 * A loosely-balanced rope implementation by Marijn Haverbeke,
 * https://code.haverbeke.berlin/marijn/rope-sequence.
 *
 * The implementation only supports generic elements, so we store
 * the text as a sequence of chars. This is less memory-efficient
 * than a dedicated text rope that stores strings in the leaves.
 */
export class RopeAlgorithm implements TextAlgorithm {
  rope = RopeSequence.empty;

  constructor(_prng: seedrandom.PRNG) {}

  apply(start: number, deleteCount: number, char?: string): void {
    const original = this.rope;
    if (deleteCount === 0) {
      // Insert
      this.rope = original
        .slice(0, start)
        .append([char!])
        .append(original.slice(start));
    } else {
      // Delete
      this.rope = original.slice(0, start).append(original.slice(start + 1));
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
}
