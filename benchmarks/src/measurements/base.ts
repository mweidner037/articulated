import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";

/**
 * @returns Individual data points, keyed by name. Each name should include its
 * units in parentheses.
 */
export type Measurement = <E extends TraceEdit | TraceProseMirrorEdit>(
  Alg: TextAlgorithmConstructor<E>,
  edits: E[],
  finalText: string,
) => Promise<Record<string, unknown>>;
