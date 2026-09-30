import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import seedrandom from "seedrandom";
import { allAlgorithms } from "./algorithms";
import {
  ensureResultsFile,
  formatCsvRow,
  parseCsv,
  RESULTS_FILE,
} from "./internal/results";
import { allTraceNames } from "./internal/trace";
import { sleep } from "./internal/util";
import { allMeasurements } from "./measurements";

const ALL_REFRESH_INTERVALS = ["0", "1000"];
const MAX_ATTEMPTS = 3;

(async function () {
  // Process args

  const args = process.argv.slice(2);
  if (args.length !== 5) failWithUsage("Wrong number of arguments");

  const numTrials = Number(args[0]);
  if (!Number.isInteger(numTrials) || numTrials < 1) {
    failWithUsage(`Invalid numTrials: ${args[0]}`);
  }

  const traces = parseOptions(args[1], "trace", allTraceNames());
  const refreshIntervals = parseOptions(
    args[2],
    "refreshInterval",
    ALL_REFRESH_INTERVALS,
    (option) => {
      const refreshInterval = Number(option);
      return Number.isInteger(refreshInterval) && refreshInterval >= 0;
    },
  ).map((option) => String(Number(option)));
  const measurements = parseOptions(
    args[3],
    "measurement",
    Object.keys(allMeasurements),
  );
  const algorithms = parseOptions(
    args[4],
    "algorithm",
    Object.keys(allAlgorithms),
  );

  // Erase existing rows matched by the args

  if (fs.existsSync(RESULTS_FILE)) {
    const [header, ...rows] = parseCsv(
      fs.readFileSync(RESULTS_FILE, { encoding: "utf8" }),
    );
    const keptRows = rows.filter(
      ([trace, refreshInterval, measurement, algorithm]) =>
        !(
          traces.includes(trace) &&
          refreshIntervals.includes(refreshInterval) &&
          measurements.includes(measurement) &&
          algorithms.includes(algorithm)
        ),
    );
    fs.writeFileSync(
      RESULTS_FILE,
      [header, ...keptRows].map(formatCsvRow).join(""),
    );
    console.log(
      `Erased ${rows.length - keptRows.length} existing rows from ${RESULTS_FILE}`,
    );
  } else ensureResultsFile();

  // Run workers

  const runs: string[][] = [];
  for (let trial = 0; trial < numTrials; trial++) {
    for (const trace of traces) {
      for (const refreshInterval of refreshIntervals) {
        for (const measurement of measurements) {
          for (const algorithm of algorithms) {
            runs.push([trace, refreshInterval, measurement, algorithm]);
          }
        }
      }
    }
  }
  shuffle(runs, seedrandom("37"));

  const failures: string[][] = [];
  for (let i = 0; i < runs.length; i++) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      console.log(
        `\n[${i + 1}/${runs.length}] ${runs[i].join(" ")}` +
          (attempt === 0 ? "" : ` (retry ${attempt}/${MAX_ATTEMPTS - 1})`),
      );
      await sleep(1000);

      const exitCode = await runWorker(runs[i]);
      if (exitCode === 0) break;

      console.error(`Worker failed with exit code ${exitCode}`);
      if (attempt === MAX_ATTEMPTS - 1) failures.push(runs[i]);
    }
  }

  if (failures.length !== 0) {
    console.error(
      `\n${failures.length} runs failed after ${MAX_ATTEMPTS} attempts:`,
    );
    for (const run of failures) console.error("  " + run.join(" "));
    process.exit(1);
  }
})();

/**
 * Parses a ","-separated list of options, or "ALL" for allOptions.
 */
function parseOptions(
  arg: string,
  name: string,
  allOptions: string[],
  isValid = (option: string) => allOptions.includes(option),
): string[] {
  if (arg === "ALL") return allOptions;
  const options = arg.split(",");
  for (const option of options) {
    if (!isValid(option))
      failWithUsage(
        `Unknown ${name}: ${option}\nOptions: ${allOptions.join(", ")}`,
      );
  }
  return options;
}

/** Fisher-Yates shuffle, in place. */
function shuffle<T>(arr: T[], prng: seedrandom.PRNG) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function runWorker(workerArgs: string[]): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", path.join(__dirname, "worker.ts"), ...workerArgs],
      { stdio: "inherit" },
    );
    child.on("error", reject);
    child.on("exit", (code) => resolve(code));
  });
}

function failWithUsage(message: string): never {
  console.error(message);
  console.error(
    '\nUsage: pnpm start <numTrials> <traces> <refreshIntervals> <measurements> <algorithms>\nEach of the last 4 args is a ","-separated list of options, or "ALL".',
  );
  process.exit(1);
}
