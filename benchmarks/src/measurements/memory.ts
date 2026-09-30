import type seedrandom from "seedrandom";
import type {
  TextAlgorithm,
  TextAlgorithmConstructor,
} from "../algorithms/base";
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
    if (Alg.isWasm) {
      // Our heap snapshot technique doesn't measure WASM memory usage.
      return {};
    }

    const holder = new BenchmarkMemoryHolder(
      buildAlgInstance(Alg, prng, refreshInterval, edits),
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

function buildAlgInstance<
  E extends TraceEdit | TraceProseMirrorEdit,
  S extends Uint8Array | string,
>(
  Alg: TextAlgorithmConstructor<E, S>,
  prng: seedrandom.PRNG,
  refreshInterval: number,
  edits: E[],
): TextAlgorithm<E, S> {
  const alg = applyEdits(Alg, prng, refreshInterval, edits);

  // Refresh the alg instance at the end.
  // That way, we are measuring the typical memory usage of a document with a long history,
  // independent of the fragmentation that results from applying that whole history at once.
  const refreshedAlg = new Alg(prng);
  refreshedAlg.load(alg.save());
  return refreshedAlg;
}
