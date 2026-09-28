import { allAlgorithms } from "./algorithms";
import type { TextTrace } from "./internal/trace";
import { loadTrace } from "./internal/trace";
import { allMeasurements } from "./measurements";

(async function () {
  // Process args

  const args = process.argv.slice(2);
  if (args.length !== 2) failWithUsage("Wrong number of arguments");

  const measurement = allMeasurements[args[0]];
  if (!measurement) failWithUsage("Unknown measurement: " + args[0]);

  const algorithm = allAlgorithms[args[1]];
  if (!algorithm) failWithUsage("Unknown algorithm: " + args[1]);

  let trace: TextTrace;
  try {
    trace = await loadTrace(args[2]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    failWithUsage("Error loading trace " + args[2] + ": " + message);
  }

  // Run benchmark

  const edits = algorithm.isProseMirror ? trace.proseMirrorEdits : trace.edits;
  await measurement(algorithm, edits, trace.finalText);
})();

function failWithUsage(message: string): never {
  console.error(message);
  console.error("\nUsage: pnpm worker <trace> <measurement> <algorithm>");
  process.exit(1);
}
