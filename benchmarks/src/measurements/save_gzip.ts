import { gzipSync } from "fflate";
import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { gzipString } from "../internal/util";
import type { Measurement } from "./base";

/**
 * Measures save time & size (raw string/Uint8Array).
 */
export const measureSaveGzip: Measurement = {
  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    edits: E[],
    _finalText: string,
  ) {
    const alg = new Alg(prng);
    for (const edit of edits) {
      alg.apply(edit);
    }

    const startTime = process.hrtime.bigint();
    const savedState = alg.save();
    const gzipped =
      typeof savedState === "string"
        ? gzipString(savedState)
        : gzipSync(savedState);
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    return {
      "Save time GZIP (μs)": time / 1_000,
      "Save size GZIP (kB)": gzipped.length / 1_000,
    };
  },
};
