import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";

export interface Measurement {
  /**
   * One-time setup for all trials (within a single worker). Optional.
   */
  setup?: (traceName: string, algorithmName: string) => Promise<void>;

  /**
   * @param prng Freshly seeded for each trial. Pass to the Alg constructor.
   * @returns Individual data points, keyed by name. Each name should include its
   * units in parentheses.
   */
  runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    edits: E[],
    finalText: string,
  ): Promise<Record<string, unknown>>;
}
