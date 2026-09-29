import type seedrandom from "seedrandom";
import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { mean, percentiles } from "../internal/util";
import type { Measurement } from "./base";

/**
 * Measures time per operation.
 */
export const measureOpTimes: Measurement = {
  async runTrial<
    E extends TraceEdit | TraceProseMirrorEdit,
    S extends Uint8Array | string,
  >(
    Alg: TextAlgorithmConstructor<E, S>,
    prng: seedrandom.PRNG,
    edits: E[],
    finalText: string,
  ) {
    /** Individual operation times in ns. */
    const opTimes = new Array(edits.length).fill(0);

    const alg = new Alg(prng);
    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];

      const startTime = process.hrtime.bigint();
      alg.apply(edit);
      const endTime = process.hrtime.bigint();

      opTimes[i] = new Number(endTime - startTime).valueOf();
    }

    alg.check(finalText);

    const [p25, p50, p75, p90, p95, p99, p100] = percentiles(
      opTimes,
      [25, 50, 75, 90, 95, 99, 100],
    );
    return {
      "Mean (μs)": mean(opTimes) / 1_000,
      "P25 (μs)": p25 / 1_000,
      "P50 (μs)": p50 / 1_000,
      "P75 (μs)": p75 / 1_000,
      "P90 (μs)": p90 / 1_000,
      "P95 (μs)": p95 / 1_000,
      "P99 (μs)": p99 / 1_000,
      "P100 (μs)": p100 / 1_000,
    };
  },
};
