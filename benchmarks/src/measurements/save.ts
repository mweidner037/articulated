import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { applyEdits } from "../internal/util";
import type { Measurement } from "./base";

/**
 * Measures save time & size (raw string/Uint8Array).
 */
export const measureSave: Measurement = {
  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    refreshInterval: number,
    edits: E[],
    _finalText: string,
  ) {
    const alg = applyEdits(Alg, prng, refreshInterval, edits);

    const startTime = process.hrtime.bigint();
    const savedState = alg.save();
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    alg.free();

    return {
      "Save time (μs)": time / 1_000,
      "Save size (kB)": savedState.length / 1_000,
    };
  },
};
