import { gunzipSync } from "fflate";
import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import {
  createSavedStateInProcess,
  gunzipString,
  sleep,
} from "../internal/util";
import type { Experiment } from "./base";

let gzipped: Uint8Array | null = null;

/**
 * Measures load time (GZIP'd string/Uint8Array), including decompression.
 *
 * The saved state is generated once in a separate process, to isolate
 * its compile caches etc. from the load call.
 */
export const loadGzipExperiment: Experiment = {
  async setup(traceName, algorithmName, refreshInterval) {
    gzipped = await createSavedStateInProcess(
      traceName,
      algorithmName,
      refreshInterval,
      "gzip",
    );
  },

  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    _refreshInterval: number,
    _edits: E[],
    finalText: string,
  ) {
    const alg = new Alg(prng);
    // Pause to allow background work to finish (e.g. GC).
    await sleep(100);

    const startTime = process.hrtime.bigint();
    const savedState = (
      Alg.isSavedStateString ? gunzipString(gzipped!) : gunzipSync(gzipped!)
    ) as S;
    alg.load(savedState);
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    alg.check(finalText);
    alg.free();

    return {
      "Load time GZIP (ms)": time / 1_000_000,
    };
  },
};
