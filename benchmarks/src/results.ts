import fs from "fs";
import path from "path";
import { allAlgorithms } from "./algorithms";
import { parseCsv, RESULTS_FILE } from "./internal/results";
import { loadTrace } from "./internal/trace";

const OUTPUT_FILE = path.join(__dirname, "../results.md");

/**
 * Table columns (after "Algorithm"), named by Datum.
 * Each Datum belongs to a unique Measurement, so we don't need to further distinguish them.
 */
const COLUMNS = [
  "Mean (μs)",
  "P50 (μs)",
  "P90 (μs)",
  "P100 (μs)",
  "Memory (kB)",
  "Save time (μs)",
  "Load time (μs)",
  "Save size (kB)",
  "Save time GZIP (μs)",
  "Load time GZIP (μs)",
  "Save size GZIP (kB)",
];

(async function () {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error(`${RESULTS_FILE} does not exist`);
    process.exit(1);
  }
  const [, ...rows] = parseCsv(
    fs.readFileSync(RESULTS_FILE, { encoding: "utf8" }),
  );
  if (rows.length === 0) {
    console.error(`${RESULTS_FILE} has no data rows`);
    process.exit(1);
  }

  // trace -> refreshInterval -> algorithm -> datum -> values (one per trial)
  const data = new Map<
    string,
    Map<number, Map<string, Map<string, number[]>>>
  >();
  for (const [trace, refreshInterval, , algorithm, datum, value] of rows) {
    const values = getOrCreate(
      getOrCreate(
        getOrCreate(
          getOrCreate(data, trace, () => new Map()),
          Number(refreshInterval),
          () => new Map(),
        ),
        algorithm,
        () => new Map(),
      ),
      datum,
      () => [],
    );
    values.push(Number(value));
  }

  const lines: string[] = [
    "# Benchmark results",
    "",
    "Each cell is the mean ± sample standard deviation across trials.",
  ];
  for (const trace of [...data.keys()].sort()) {
    lines.push("", `## Trace: ${trace}`);
    const description = await traceDescription(trace);
    if (description !== undefined) lines.push("", description);

    const byRefresh = data.get(trace)!;
    for (const refreshInterval of [...byRefresh.keys()].sort((a, b) => a - b)) {
      lines.push(
        "",
        refreshInterval === 0
          ? "### No refreshes"
          : `### Refresh every ${refreshInterval} ops`,
        "",
        tableRow(["Algorithm", ...COLUMNS]),
        tableRow(["Algorithm", ...COLUMNS].map(() => "---")),
      );

      const byAlgorithm = byRefresh.get(refreshInterval)!;
      for (const algorithm of sortAlgorithms([...byAlgorithm.keys()])) {
        const byDatum = byAlgorithm.get(algorithm)!;
        lines.push(
          tableRow([
            algorithm,
            ...COLUMNS.map((datum) => formatCell(byDatum.get(datum))),
          ]),
        );
      }
    }
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join("\n") + "\n");
  console.log(`Wrote ${OUTPUT_FILE}`);
})();

function getOrCreate<K, V>(map: Map<K, V>, key: K, create: () => V): V {
  let value = map.get(key);
  if (value === undefined) {
    value = create();
    map.set(key, value);
  }
  return value;
}

async function traceDescription(trace: string): Promise<string | undefined> {
  try {
    return (await loadTrace(trace, false)).description;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Could not load description for trace ${trace}: ${message}`);
    return undefined;
  }
}

/**
 * Sorts algorithms in allAlgorithms order, followed by unknown algorithms
 * alphabetically.
 */
function sortAlgorithms(algorithms: string[]): string[] {
  const order = Object.keys(allAlgorithms);
  const rank = (algorithm: string) => {
    const index = order.indexOf(algorithm);
    return index === -1 ? order.length : index;
  };
  return algorithms.sort(
    (a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0),
  );
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

/**
 * Formats values as "mean ± sample std dev", using 3 significant figures
 * for the mean.
 */
function formatCell(values: number[] | undefined): string {
  if (values === undefined || values.length === 0) return "";

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const decimals =
    mean === 0 ? 0 : Math.max(0, 2 - Math.floor(Math.log10(Math.abs(mean))));
  if (values.length === 1) return mean.toFixed(decimals);

  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  return `${mean.toFixed(decimals)} ± ${Math.sqrt(variance).toFixed(decimals)}`;
}
