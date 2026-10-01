import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import {
  BenchmarkMemoryHolder,
  measureRetainedSize,
} from "../internal/heap_snapshot";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { applyEdits } from "../internal/util";
import type { Experiment } from "./base";

/**
 * Measures the memory retained by the alg after applying all edits,
 * using a V8 heap snapshot.
 */
export const memoryExperiment: Experiment = {
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
    if (Alg.isWasm) {
      // Our heap snapshot technique doesn't measure WASM memory usage.
      return {};
    }

    const holder = new BenchmarkMemoryHolder(
      applyEdits(Alg, prng, refreshInterval, edits, true),
    );

    // Skip the (slow) snapshot during warmup trials.
    if (!isMeasured) return {};
    const retainedSize = measureRetainedSize();

    // Also keeps holder alive until after the snapshot.
    const algFromHolder = holder.value as InstanceType<typeof Alg>;
    algFromHolder.check(finalText);
    algFromHolder.free();

    return {
      "Memory (kB)": retainedSize / 1_000,
    };
  },
};
