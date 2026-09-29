import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";

export interface Measurement {
  /**
   * One-time setup for all trials (within a single worker). Optional.
   */
  setup?: () => Promise<void>;

  /**
   * @returns Individual data points, keyed by name. Each name should include its
   * units in parentheses.
   */
  runTrial<E extends TraceEdit | TraceProseMirrorEdit>(
    Alg: TextAlgorithmConstructor<E>,
    edits: E[],
    finalText: string,
  ): Promise<Record<string, unknown>>;
}
