import { allAlgorithms } from "../algorithms";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { createSavedStateInProcess } from "../internal/util";
import type { Measurement } from "./base";

let savedState: Uint8Array | string | null = null;

/**
 * Measures load time (raw string/Uint8Array).
 *
 * The saved state is generated once in a separate process, to isolate
 * its compile caches etc. from the load call.
 */
export const measureLoad: Measurement = {
  async setup(traceName, algorithmName) {
    const bytes = await createSavedStateInProcess(
      traceName,
      algorithmName,
      "plain",
    );
    savedState = allAlgorithms[algorithmName].isSavedStateString
      ? new TextDecoder().decode(bytes)
      : bytes;
  },

  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(Alg: TextAlgorithmConstructor<E, S>, _edits: E[], finalText: string) {
    const alg = new Alg();

    const startTime = process.hrtime.bigint();
    alg.load(savedState as S);
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    alg.check(finalText);

    return {
      "Load time (μs)": time / 1_000,
    };
  },
};
