import type seedrandom from "seedrandom";
import type { TraceEdit, TraceProseMirrorEdit } from "./internal/traces";

export interface TextAlgorithm<E extends TraceEdit | TraceProseMirrorEdit> {
  readonly isProseMirror: E extends TraceProseMirrorEdit ? true : false;

  /**
   * Applies the given edit.
   */
  apply(edit: E): void;

  /**
   * Consumes the algorithm's public iterator.
   *
   * No return value or effect - used for timing only.
   */
  iterate(): void;

  save(): string | Uint8Array;

  load(savedState: string | Uint8Array): void;

  /**
   * Asserts that the internal state matches the given text (if applicable).
   */
  check(finalText: string): void;
}

export type TextAlgorithmConstructor = new (
  prng: seedrandom.PRNG,
) => TextAlgorithm<TraceEdit | TraceProseMirrorEdit>;
