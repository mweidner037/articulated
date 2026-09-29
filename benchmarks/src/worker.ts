import seedrandom from "seedrandom";
import { allAlgorithms } from "./algorithms";
import { appendResultRows } from "./internal/results";
import type { TextTrace } from "./internal/trace";
import { allTraceNames, loadTrace } from "./internal/trace";
import { sleep } from "./internal/util";
import { allMeasurements } from "./measurements";

const WARMUP_TRIALS = 5;
/**
 * main.ts runs a new worker (including warmup) for each measured trial,
 * so we only do one measured trial.
 * This lets main.ts randomize algorithm order at the trial level.
 */
const MEASURED_TRIALS = 1;

(async function () {
  // Process args

  const args = process.argv.slice(2);
  if (args.length !== 4) failWithUsage("Wrong number of arguments");

  let trace: TextTrace;
  try {
    trace = await loadTrace(args[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    let optionsStr = "";
    try {
      optionsStr = `\nOptions: ${allTraceNames().join(", ")}`;
    } catch (_err) {
      // Don't error again.
    }

    failWithUsage(
      "Error loading trace " + args[0] + ": " + message + optionsStr,
    );
  }

  const refreshInterval = Number(args[1]);
  if (!Number.isInteger(refreshInterval) || refreshInterval < 0)
    failWithUsage(`Invalid refreshInterval: ${args[1]}`);

  const measurement = allMeasurements[args[2]];
  if (!measurement)
    failWithUsage(
      `Unknown measurement: ${args[2]}\nOptions: ${Object.keys(allMeasurements).join(", ")}`,
    );

  const algorithm = allAlgorithms[args[3]];
  if (!algorithm)
    failWithUsage(
      `Unknown algorithm: ${args[3]}\nOptions: ${Object.keys(allAlgorithms).join(", ")}`,
    );

  // Run benchmark

  const edits = algorithm.isProseMirror ? trace.proseMirrorEdits : trace.edits;
  await measurement.setup?.(args[0], args[3], refreshInterval);
  for (let trial = 0; trial < WARMUP_TRIALS + MEASURED_TRIALS; trial++) {
    // Pause to allow background work to finish (e.g. GC).
    await sleep(100);

    const isMeasured = trial >= WARMUP_TRIALS;
    if (!isMeasured) console.log("Warmup ", trial + 1);
    // Fresh PRNG with the same seed each trial, so all trials are identical.
    const prng = seedrandom("42");
    const data = await measurement.runTrial(
      algorithm,
      prng,
      refreshInterval,
      edits,
      trace.finalText,
      isMeasured,
    );
    if (isMeasured) {
      console.log(data);
      appendResultRows(
        Object.entries(data).map(([datum, value]) => [
          args[0],
          String(refreshInterval),
          args[2],
          args[3],
          datum,
          String(value),
        ]),
      );
    }
  }
})();

function failWithUsage(message: string): never {
  console.error(message);
  console.error(
    "\nUsage: pnpm worker <trace> <refreshInterval> <measurement> <algorithm>",
  );
  process.exit(1);
}
