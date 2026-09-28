import fs from "fs";
import path from "path";
import { allAlgorithms } from "./algorithms";
import type { TextTrace } from "./internal/trace";
import { loadTrace } from "./internal/trace";
import { allMeasurements } from "./measurements";

(async function () {
  // Process args

  const args = process.argv.slice(2);
  if (args.length !== 3) failWithUsage("Wrong number of arguments");

  let trace: TextTrace;
  try {
    trace = await loadTrace(args[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    let optionsStr = "";
    try {
      const traceNames = fs
        .readdirSync(path.join(__dirname, "traces"))
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.slice(0, -5));
      optionsStr = `\nOptions: ${traceNames.join(", ")}`;
    } catch (_err) {
      // Don't error again.
    }

    failWithUsage(
      "Error loading trace " + args[0] + ": " + message + optionsStr,
    );
  }

  const measurement = allMeasurements[args[1]];
  if (!measurement)
    failWithUsage(
      `Unknown measurement: ${args[1]}\nOptions: ${Object.keys(allMeasurements).join(", ")}`,
    );

  const algorithm = allAlgorithms[args[2]];
  if (!algorithm)
    failWithUsage(
      `Unknown algorithm: ${args[2]}\nOptions: ${Object.keys(allAlgorithms).join(", ")}`,
    );

  // Run benchmark

  const edits = algorithm.isProseMirror ? trace.proseMirrorEdits : trace.edits;
  const data = await measurement(algorithm, edits, trace.finalText);
  console.log(data);
})();

function failWithUsage(message: string): never {
  console.error(message);
  console.error("\nUsage: pnpm worker <trace> <measurement> <algorithm>");
  process.exit(1);
}
