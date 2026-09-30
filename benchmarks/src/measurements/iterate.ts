import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { applyEdits, sleep } from "../internal/util";
import type { Measurement } from "./base";

/**
 * Measures the time to iterate the text or IDs after applying all edits.
 */
export const measureIterate: Measurement = {
  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    refreshInterval: number,
    edits: E[],
    finalText: string,
  ) {
    const alg = applyEdits(Alg, prng, refreshInterval, edits, true);
    // Pause to allow background work to finish (e.g. GC).
    await sleep(100);

    const startTime = process.hrtime.bigint();
    alg.iterate();
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    alg.check(finalText);
    alg.free();

    return {
      "Iteration time (μs)": time / 1_000,
    };
  },
};
