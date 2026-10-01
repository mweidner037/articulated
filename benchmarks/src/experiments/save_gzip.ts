import { gzipSync } from "fflate";
import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { applyEdits, gzipString, sleep } from "../internal/util";
import type { Experiment } from "./base";

/**
 * Measures save time & size (raw string/Uint8Array).
 */
export const saveGzipExperiment: Experiment = {
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
    // Pause to allow background work to finish (e.g. GC).
    await sleep(100);

    const startTime = process.hrtime.bigint();
    const savedState = alg.save();
    const gzipped =
      typeof savedState === "string"
        ? gzipString(savedState)
        : gzipSync(savedState);
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    alg.free();

    return {
      "Save time GZIP (ms)": time / 1_000_000,
      "Save size GZIP (kB)": gzipped.length / 1_000,
    };
  },
};
