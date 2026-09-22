import { allAlgorithms } from "./algorithms";
import { loadTraces } from "./internal/traces";
import { allMeasurements } from "./measurements";

(async function () {
  await loadTraces();

  const args = process.argv.slice(2);
  if (args.length !== 2) failWithUsage("Wrong number of arguments");

  const measurement = allMeasurements[args[0]];
  if (!measurement) failWithUsage("Unknown measurement: " + args[0]);
  const algorithm = allAlgorithms[args[1]];
  if (!algorithm) failWithUsage("Unknown algorithm: " + args[1]);
})();

function failWithUsage(message: string): never {
  console.error(message);
  console.error("\nUsage: pnpm worker <measurement> <algorithm>");
  process.exit(1);
}
