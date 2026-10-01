import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";

export interface Experiment {
  /**
   * One-time setup for all trials (within a single worker). Optional.
   */
  setup?: (
    traceName: string,
    algorithmName: string,
    refreshInterval: number,
  ) => Promise<void>;

  /**
   * @param prng Freshly seeded for each trial. Pass to the Alg constructor.
   * @param refreshInterval If nonzero, "refresh" the alg (save and load into
   * a new instance) every refreshInterval edits. See applyEdits.
   * @param isMeasured Whether this is a measured trial (vs a warmup trial).
   * Warmup trials may skip expensive data processing.
   * @returns Individual data points, keyed by name. Each name should include its
   * units in parentheses.
   */
  runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    refreshInterval: number,
    edits: E[],
    finalText: string,
    isMeasured: boolean,
  ): Promise<Record<string, unknown>>;
}
