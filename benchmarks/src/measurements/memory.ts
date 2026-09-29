import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import {
  BenchmarkMemoryHolder,
  measureRetainedSize,
} from "../internal/heap_snapshot";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { applyEdits } from "../internal/util";
import type { Measurement } from "./base";

/**
 * Measures the memory retained by the alg after applying all edits,
 * using a V8 heap snapshot.
 */
export const measureMemory: Measurement = {
  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    refreshInterval: number,
    edits: E[],
    finalText: string,
    isMeasured: boolean,
  ) {
    const holder = new BenchmarkMemoryHolder(
      applyEdits(Alg, prng, refreshInterval, edits),
    );

    // Skip the (slow) snapshot during warmup trials.
    if (!isMeasured) return {};
    const retainedSize = measureRetainedSize();

    // Also keeps holder alive until after the snapshot.
    (holder.value as InstanceType<typeof Alg>).check(finalText);

    return {
      "Memory (kB)": retainedSize / 1_000,
    };
  },
};
