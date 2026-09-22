import type seedrandom from "seedrandom";

export interface TextAlgorithm {
  /**
   * Apply an operation from real_text_trace_edits.json,
   * which is in the form of arguments to Array.splice.
   *
   * deleteCount is always 0 or 1, and char is defined iff deleteCount is 0.
   */
  apply(start: number, deleteCount: number, char?: string): void;

  /**
   * Consume the algorithm's public iterator.
   *
   * No effect - used for timing only.
   */
  iterate(): void;

  save(): string | Uint8Array;

  load(savedState: string | Uint8Array): void;
}

export type TextAlgorithmConstructor = new (
  prng: seedrandom.PRNG,
) => TextAlgorithm;
