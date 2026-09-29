import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import type { Measurement } from "./base";

/**
 * Measures save time & size (raw string/Uint8Array).
 */
export const measureSave: Measurement = {
  async runTrial<E extends TraceEdit | TraceProseMirrorEdit>(
    Alg: TextAlgorithmConstructor<E>,
    edits: E[],
    _finalText: string,
  ) {
    const alg = new Alg();
    for (const edit of edits) {
      alg.apply(edit);
    }

    const startTime = process.hrtime.bigint();
    const savedState = alg.save();
    const endTime = process.hrtime.bigint();
    const time = new Number(endTime - startTime).valueOf();

    return {
      "Save time (μs)": time / 1_000,
      "Save size (kB)": savedState.length / 1_000,
    };
  },
};
