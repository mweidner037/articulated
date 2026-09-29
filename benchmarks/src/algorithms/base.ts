import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";

export interface TextAlgorithm<
  E extends TraceEdit | TraceProseMirrorEdit,
  S extends Uint8Array | string,
> {
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

  save(): S;

  load(savedState: S): void;

  /**
   * Asserts that the internal state matches the given text (if applicable).
   */
  check(finalText: string): void;
}

export type TextAlgorithmConstructor<
  E extends TraceEdit | TraceProseMirrorEdit,
  S extends Uint8Array | string,
> = (new () => TextAlgorithm<E, S>) & {
  readonly isProseMirror: E extends TraceProseMirrorEdit ? true : false;
  readonly isSavedStateString: S extends string ? true : false;
};

/**
 * Union of all valid TextAlgorithmConstructor instantiations.
 *
 * Unlike TextAlgorithmConstructor<TraceEdit | TraceProseMirrorEdit, Uint8Array | string>,
 * this enforces that each constructor's static booleans match its generic types.
 */
export type AnyTextAlgorithmConstructor =
  | TextAlgorithmConstructor<TraceEdit, string>
  | TextAlgorithmConstructor<TraceEdit, Uint8Array>
  | TextAlgorithmConstructor<TraceProseMirrorEdit, string>
  | TextAlgorithmConstructor<TraceProseMirrorEdit, Uint8Array>;
