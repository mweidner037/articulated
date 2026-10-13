import tQuantile from "@stdlib/stats-base-dists-t-quantile";
import fs from "fs";
import path from "path";
import { allAlgorithms } from "./algorithms";
import { parseCsv, RESULTS_FILE } from "./internal/results";
import { loadTrace } from "./internal/trace";

const OUTPUT_FILE = path.join(__dirname, "../results.md");

/**
 * Table columns (after "Algorithm"), named by Measurement.
 * Each Measurement belongs to a unique Experiment, so we don't need to further distinguish them.
 */
const COLUMNS = [
  "Mean (μs)",
  "P50 (μs)",
  "P90 (μs)",
  "P99 (μs)",
  "P100 (μs)",
  "Iteration time (μs)",
  "Memory (kB)",
  "Save time (ms)",
  "Load time (ms)",
  "Save size (kB)",
  "Save time GZIP (ms)",
  "Load time GZIP (ms)",
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

  // trace -> refreshInterval -> algorithm -> measurement -> values (one per trial)
  const data = new Map<
    string,
    Map<number, Map<string, Map<string, number[]>>>
  >();
  for (const [
    trace,
    refreshInterval,
    ,
    algorithm,
    measurement,
    value,
  ] of rows) {
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
      measurement,
      () => [],
    );
    values.push(Number(value));
  }

  let minTrials = Infinity;
  let maxTrials = 0;
  for (const byRefresh of data.values()) {
    for (const byAlgorithm of byRefresh.values()) {
      for (const byMeasurement of byAlgorithm.values()) {
        for (const values of byMeasurement.values()) {
          minTrials = Math.min(minTrials, values.length);
          maxTrials = Math.max(maxTrials, values.length);
        }
      }
    }
  }
  const trials =
    minTrials === maxTrials
      ? `${maxTrials} trial${maxTrials === 1 ? "" : "s"}`
      : `${minTrials} - ${maxTrials} trials`;

  const lines: string[] = [
    "# Benchmark results",
    "",
    `Each cell is the 95% confidence interval from ${trials}.`,
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
        const byMeasurement = byAlgorithm.get(algorithm)!;
        lines.push(
          tableRow([
            algorithm,
            ...COLUMNS.map((measurement) =>
              formatCell(byMeasurement.get(measurement)),
            ),
          ]),
        );
      }
    }
  }

  lines.push("", "# LaTeX Tables", "", 'For "Refresh every 1000 ops" data.');
  for (const trace of [...data.keys()].sort()) {
    const byAlgorithm = data.get(trace)!.get(1000);
    if (byAlgorithm === undefined) continue;
    lines.push("", `## Trace: ${trace}`);
    for (const table of latexTables(byAlgorithm)) {
      lines.push("", "```latex", table, "```");
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
 * Returns the LaTeX tables' source, filled in with data from byAlgorithm
 * (algorithm -> measurement -> values).
 */
function latexTables(
  byAlgorithm: Map<string, Map<string, number[]>>,
): string[] {
  const cell = (algorithm: string, measurement: string) => {
    const ci = confidenceInterval(byAlgorithm.get(algorithm)?.get(measurement));
    if (ci === undefined) return "";
    const { mean, halfWidth, decimals } = ci;
    return halfWidth === undefined
      ? `$${mean.toFixed(decimals)}$`
      : `$${mean.toFixed(decimals)} \\pm ${halfWidth.toFixed(decimals)}$`;
  };
  const throughput = (algorithm: string) => {
    const ci = confidenceInterval(byAlgorithm.get(algorithm)?.get("Mean (μs)"));
    if (ci === undefined) return "";
    const { mean, halfWidth = 0 } = ci;
    // Op times are in μs, so 1e6 / time is in ops/sec.
    const low = formatThroughput(1e6 / (mean + halfWidth));
    const high =
      mean - halfWidth > 0
        ? formatThroughput(1e6 / (mean - halfWidth))
        : "\\infty";
    return halfWidth === 0 ? `$${low}$` : `$[${low}, ${high}]$`;
  };
  const row = (prefix: string, cells: string[]) =>
    `    ${prefix} & ${cells.join(" & ")} \\\\`;
  const traditional =
    "\\multirow{2}{*}{\\shortstack[l]{Traditional text-editor \\\\ data structure}}";

  const memory = (algorithm: string) => [cell(algorithm, "Memory (kB)")];
  const storage = (algorithm: string, gzip: boolean) => {
    const suffix = gzip ? " GZIP" : "";
    return [
      cell(algorithm, `Save size${suffix} (kB)`),
      cell(algorithm, `Save time${suffix} (ms)`),
      cell(algorithm, `Load time${suffix} (ms)`),
    ];
  };
  const opTimes = (algorithm: string) => [
    throughput(algorithm),
    cell(algorithm, "P90 (μs)"),
    cell(algorithm, "P99 (μs)"),
    cell(algorithm, "P100 (μs)"),
  ];

  return [
    [
      "\\begin{table}",
      "  \\caption{Memory Usage for the Final Document State}",
      "  \\label{tab:memory}",
      "  \\begin{tabular}{llc}",
      "    \\toprule",
      "    Category & Implementation & Memory Usage (kB) \\\\",
      "    \\midrule",
      row(`${traditional} & String`, memory("string")),
      row("& Array of Characters", memory("charArray")),
      row("& Rope", memory("rope")),
      row("& ProseMirror", memory("proseMirror")),
      row("List of IDs & Articulated", memory("idList")),
      row("CRDT & Yjs", memory("yjsText")),
      "  \\bottomrule",
      "\\end{tabular}",
      "\\end{table}",
    ],
    [
      "\\begin{table}",
      "  \\caption{Storage Metrics for the Final Document State}",
      "  \\label{tab:storage}",
      "  \\begin{tabular}{llccc}",
      "    \\toprule",
      "    Category & Implementation & Saved State Size (kB) & Save Time (ms) & Load Time (ms) \\\\",
      "    \\midrule",
      row("Actual Text & String", storage("string", false)),
      row("& String w/ GZIP", storage("string", true)),
      row("List of IDs & Articulated", storage("idList", false)),
      row("& Articulated w/ GZIP", storage("idList", true)),
      row("CRDT & Automerge", storage("automerge", false)),
      row("& Yjs", storage("yjsText", false)),
      "  \\bottomrule",
      "\\end{tabular}",
      "\\end{table}",
    ],
    [
      "\\begin{table}",
      "  \\caption{Throughput and Distribution of Operation Times}",
      "  \\label{tab:op_times}",
      "  \\begin{tabular}{llcccc}",
      "    \\toprule",
      "    Category & Implementation & \\shortstack{Throughput \\\\(ops/sec)} & P90 ($\\mu$s) & P99 ($\\mu$s) & Max ($\\mu$s) \\\\",
      "    \\midrule",
      row(`${traditional} & String`, opTimes("string")),
      row("& Array of Characters", opTimes("charArray")),
      row("& Rope", opTimes("rope")),
      row("& ProseMirror", opTimes("proseMirror")),
      row("List of IDs & Articulated", opTimes("idList")),
      row("CRDT & Automerge", opTimes("automerge")),
      row("& Yjs", opTimes("yjsText")),
      "  \\bottomrule",
      "\\end{tabular}",
      "\\end{table}",
    ],
  ].map((tableLines) => tableLines.join("\n"));
}

/**
 * Formats a throughput (ops/sec) to 3 significant figures, with a k or M suffix.
 */
function formatThroughput(value: number): string {
  const [scaled, suffix] =
    value >= 1e6
      ? [value / 1e6, "M"]
      : value >= 1e3
        ? [value / 1e3, "k"]
        : [value, ""];
  const decimals = Math.max(0, 2 - Math.floor(Math.log10(scaled)));
  return `${scaled.toFixed(decimals)}${suffix}`;
}

/**
 * Formats values as "mean ± half-width of 95% confidence interval for the mean",
 * using 3 significant figures for the mean.
 *
 * The confidence interval uses Student's t distribution in the usual way for
 * normally distributed samples.
 */
function formatCell(values: number[] | undefined): string {
  const ci = confidenceInterval(values);
  if (ci === undefined) return "";
  const { mean, halfWidth, decimals } = ci;
  return halfWidth === undefined
    ? mean.toFixed(decimals)
    : `${mean.toFixed(decimals)} ± ${halfWidth.toFixed(decimals)}`;
}

/**
 * Returns the mean, the half-width of the 95% confidence interval for the mean
 * (undefined if there is only one value), and the number of decimals that
 * gives the mean 3 significant figures.
 */
function confidenceInterval(
  values: number[] | undefined,
):
  | { mean: number; halfWidth: number | undefined; decimals: number }
  | undefined {
  if (values === undefined || values.length === 0) return undefined;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const decimals =
    mean === 0 ? 0 : Math.max(0, 2 - Math.floor(Math.log10(Math.abs(mean))));
  if (values.length === 1) return { mean, halfWidth: undefined, decimals };

  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / (values.length - 1);
  const halfWidth =
    tQuantile(0.975, values.length - 1) * Math.sqrt(variance / values.length);
  return { mean, halfWidth, decimals };
}
