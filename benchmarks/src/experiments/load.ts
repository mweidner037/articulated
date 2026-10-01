import type seedrandom from "seedrandom";
import { allAlgorithms } from "../algorithms";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { createSavedStateInProcess, sleep } from "../internal/util";
import type { Experiment } from "./base";

let savedState: Uint8Array | string | null = null;

/**
 * Measures load time (raw string/Uint8Array).
 *
 * The saved state is generated once in a separate process, to isolate
 * its compile caches etc. from the load call.
 */
export const loadExperiment: Experiment = {
  async setup(traceName, algorithmName, refreshInterval) {
    const bytes = await createSavedStateInProcess(
      traceName,
      algorithmName,
      refreshInterval,
      "plain",
    );
    savedState = allAlgorithms[algorithmName].isSavedStateString
      ? new TextDecoder().decode(bytes)
      : bytes;
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
    alg.load(savedState as S);
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    alg.check(finalText);
    alg.free();

    return {
      "Load time (ms)": time / 1_000_000,
    };
  },
};
