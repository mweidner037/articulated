import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { canonicalReport } from "./canonical-report";
import { comparisonChart } from "./charts";
import { explorationCandidates } from "./exploration-candidates";
import { formats } from "./formats";
import type { BrowserSample, EditSample } from "./page-runtime";

interface BrowserRow {
  id: string;
  documents: number;
  samples: (BrowserSample & { round: number })[];
  cold: BrowserSample[];
  gc: { gcMs: number; gcEvents: number; paintEvents: number }[];
  gcSamples: BrowserSample[];
  editSamples: EditSample[];
  editGC: { gcMs: number; gcEvents: number; paintEvents: number }[];
  memory: {
    retainedDelta: number;
    observedHighWaterDelta: number;
    sampledAllocation: number;
  }[];
}
interface BrowserResults {
  complete: boolean;
  calibration: {
    before: { backingStorageSize: number };
    after: { backingStorageSize: number };
  };
  generatedAt: string;
  browser: string;
  playwright: string;
  cpu: string;
  platform: string;
  cpuRate: number;
  rounds: number;
  trials: number;
  switches: number;
  memoryTrials: number;
  documentCharacters: number;
  paragraphs: number;
  runs: number;
  rows: BrowserRow[];
  idModel?: string;
}
interface Checkpoint {
  completed: number;
  segmentOperations: number;
  listMs: number;
  totalMs: number;
  retainedVersions: number;
  retainedBytes: number;
  beforeGCBytes: number;
}
type Workload = "local" | "distributed" | "new-bunches";
interface SessionRow {
  id: string;
  workload: Workload;
  historyLimit: number;
  repetition: number;
  loadedBytes: number;
  checkpoints: Checkpoint[];
  releasedHistoryBytes: number;
}
interface Sessions {
  complete: boolean;
  generatedAt: string;
  browser: string;
  cpu: string;
  documents: number;
  operations: number;
  repetitions: number;
  rows: SessionRow[];
  idModel?: string;
}
interface MongoRow {
  id: string;
  formatId: string;
  snapshot: string;
  compressor: string;
  storageBytes: number;
  storageBytesPerDocument: number;
  checkedDocuments: number[];
  compact: { ok: number };
  compactAfterCheckpoint: { ok: number };
  compressorCreationString: string;
}
interface MongoResults {
  complete: boolean;
  dataset?: "structured" | "opaque8";
  generatedAt: string;
  version: string;
  documents: number;
  examples: { id: string; formatId: string; storedDocument: unknown }[];
  rows: MongoRow[];
}
interface ScaleResults {
  complete: boolean;
  browserIsolation?: "context" | "process";
  cpuRate?: number | null;
  diagnosticOnly: boolean;
  repetitions: number;
  scales: number[];
  historyLimits: number[];
  candidates: { id: string }[];
  rows: {
    id: string;
    scale: number;
    runs: number;
    historyLimit: number;
    loadMs: number;
    lookupMs: number;
    editMs: number;
    loadedBytes: number;
    editedBytes: number;
    checks: { lookup: boolean; fullSave: boolean };
  }[];
}

const dir = path.resolve(__dirname, "../../results/exploration");
const read = <T>(file: string): T =>
  JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")) as T;
const browser = read<BrowserResults>("browser.json");
const sessions = read<Sessions>("sessions.json");
const structured = read<MongoResults>("mongo.json");
const opaque = read<MongoResults>("mongo-opaque8.json");
const canonicalOpaque = read<MongoResults>("canonical-mongo-opaque8.json");
const completion = read<{ rows: number; samples: number }>("complete.json");
const opaqueBrowserPath = path.resolve(
  dir,
  "../exploration-opaque8/browser.json",
);
const opaqueBrowser = fs.existsSync(opaqueBrowserPath)
  ? (JSON.parse(fs.readFileSync(opaqueBrowserPath, "utf8")) as BrowserResults)
  : undefined;
const opaqueSessionsPath = path.resolve(
  dir,
  "../exploration-opaque8/sessions.json",
);
const opaqueSessions = fs.existsSync(opaqueSessionsPath)
  ? (JSON.parse(fs.readFileSync(opaqueSessionsPath, "utf8")) as Sessions)
  : undefined;
const scale = fs.existsSync(path.join(dir, "scale.json"))
  ? read<ScaleResults>("scale.json")
  : undefined;
const scaleRecheckPath = path.resolve(
  dir,
  "../exploration-scale-recheck/scale.json",
);
const scaleRecheck = fs.existsSync(scaleRecheckPath)
  ? (JSON.parse(fs.readFileSync(scaleRecheckPath, "utf8")) as ScaleResults)
  : undefined;
const scaleProcessPath = path.resolve(
  dir,
  "../exploration-scale-process/scale.json",
);
const scaleProcess = fs.existsSync(scaleProcessPath)
  ? (JSON.parse(fs.readFileSync(scaleProcessPath, "utf8")) as ScaleResults)
  : undefined;
const scaleCPUPath = path.resolve(dir, "../exploration-scale-cpu1/scale.json");
const scaleCPU = fs.existsSync(scaleCPUPath)
  ? (JSON.parse(fs.readFileSync(scaleCPUPath, "utf8")) as ScaleResults)
  : undefined;
const candidates = explorationCandidates;
const ids = candidates.map((c) => c.id);
const workloads: Workload[] = ["local", "distributed", "new-bunches"];
const formatEntries = Object.entries(formats);
const format = (id: string) => {
  const c = candidates.find((c) => c.id === id);
  assert(c, `Unknown candidate ${id}`);
  const f = Object.values(formats).find((f) => f.name === c.shape);
  assert(f);
  return f;
};
const shortNames: Record<string, string> = {
  F01: "Plain SavedIdList objects",
  F02: "Objects; signed counts",
  F03: "Tuples; signed counts",
  F04: "Columns; all counters",
  F05: "Columns; infer counters",
  F06: "Split IDs; infer counters",
  F07: "Deduplicate IDs; infer counters",
  F08: "Deduplicate clients; infer counters",
  F09: "Deduplicate IDs; all counters",
};
function label(id: string) {
  const candidate = candidates.find((c) => c.id === id);
  assert(candidate);
  const f = format(id).id;
  if (candidate.path !== "native") return `${f} → existing IdList`;
  const [, kind, ownership, pageSize] = id.split("-");
  return `${f} · ${kind === "tree" ? "page tree" : kind === "rows" ? "native rows" : "flat columns"} · ${ownership} ${pageSize}`;
}
function detail(id: string) {
  const f = format(id);
  return shortNames[f.id];
}
const q = (values: number[], percentile = 0.5) => {
  assert(values.length && values.every(Number.isFinite));
  return [...values].sort((a, b) => a - b)[
    Math.max(0, Math.ceil(values.length * percentile) - 1)
  ];
};
const f = (n: number) => n.toFixed(1);
const range = (values: number[]) =>
  `${f(q(values))} [${f(Math.min(...values))}–${f(Math.max(...values))}]`;
const pct = (value: number, base: number) => f((1 - value / base) * 100);
const loaded = (id: string, docs = 4) => {
  const r = browser.rows.find((r) => r.id === id && r.documents === docs);
  assert(r);
  return r;
};
const ready = (id: string, docs = 4) =>
  q(
    loaded(id, docs).samples.map((s) => s.total),
    0.95,
  );
const convert = (id: string, docs = 4) =>
  q(
    loaded(id, docs).samples.map((s) => s.hydrate),
    0.95,
  );
const sessionRows = (
  id: string,
  workload: Workload = "distributed",
  history = 0,
  source = sessions,
) =>
  source.rows.filter(
    (r) => r.id === id && r.workload === workload && r.historyLimit === history,
  );
const last = (r: SessionRow) => r.checkpoints[r.checkpoints.length - 1];
const sessionMemory = (
  id: string,
  history = 0,
  workload: Workload = "distributed",
  source = sessions,
) =>
  q(
    sessionRows(id, workload, history, source).map(
      (r) => last(r).retainedBytes,
    ),
  ) / 1e6;
const sessionLoaded = (id: string, source = sessions) =>
  q(sessionRows(id, "distributed", 0, source).map((r) => r.loadedBytes)) / 1e6;
const sessionTime = (
  id: string,
  workload: Workload,
  history = 0,
  metric: "listMs" | "totalMs" = "listMs",
  source = sessions,
) =>
  sessionRows(id, workload, history, source).map((r) =>
    r.checkpoints.reduce((n, p) => n + p[metric], 0),
  );
const disk = (
  formatId: string,
  compressor = "snappy",
  dataset = structured,
  snapshot = "initial",
) => {
  const r = dataset.rows.find(
    (r) =>
      r.formatId === formatId &&
      r.compressor === compressor &&
      r.snapshot === snapshot,
  );
  assert(
    r,
    `Missing physical Mongo row: ${dataset.dataset}/${formatId}/${compressor}/${snapshot}`,
  );
  return r.storageBytesPerDocument / 1000;
};
const exportMs = (id: string) =>
  q(loaded(id).editSamples.map((s) => s.snapshotMs));
const sorted = (selected: string[]) =>
  [...selected].sort((a, b) => ready(a) - ready(b) || a.localeCompare(b));
const primaryIds = [
  "objects",
  "f01-rows-owned-128",
  "f02-rows-owned-128",
  "tuples",
  "f03-rows-owned-128",
  "omit",
  "f05-flat-owned-128",
  "f07-flat-owned-128",
  "client",
  "f08-flat-shared-128",
  "f08-flat-owned-128",
  "f08-tree-owned-128",
  "f09-flat-owned-128",
];
const opaqueSessionIds = [
  "objects",
  "f01-rows-owned-128",
  "f02-rows-owned-128",
  "f03-rows-owned-128",
  "f05-flat-owned-128",
  "f07-flat-owned-128",
  "f09-flat-owned-128",
];

// Validate every source before writing a chart or report. A partial overnight
// run must never produce a plausible-looking completed recommendation.
assert(
  browser.complete &&
    sessions.complete &&
    structured.complete &&
    opaque.complete,
  "Refuse incomplete measurements",
);
assert.equal(ids.length, 31);
assert.equal(new Set(ids).size, 31);
assert.equal(browser.rows.length, 62);
assert.equal(completion.rows, browser.rows.length);
assert.equal(
  completion.samples,
  browser.rows.reduce((n, r) => n + r.samples.length, 0),
);
assert.equal(browser.rounds, 5);
assert.equal(browser.trials, 20);
assert.equal(browser.memoryTrials, 3);
assert.equal(sessions.documents, 4);
assert.equal(sessions.operations, 2000);
assert.equal(sessions.repetitions, 3);
assert.equal(sessions.browser, browser.browser);
assert(
  browser.calibration.after.backingStorageSize -
    browser.calibration.before.backingStorageSize >=
    8 * 1024 * 1024,
);
for (const docs of [1, 4]) {
  assert.deepEqual(
    browser.rows
      .filter((r) => r.documents === docs)
      .map((r) => r.id)
      .sort(),
    [...ids].sort(),
  );
  for (const id of ids) {
    const r = loaded(id, docs);
    assert.equal(r.samples.length, 100);
    assert.equal(r.cold.length, 5);
    assert.equal(r.gc.length, browser.switches);
    assert.equal(r.gcSamples.length, browser.switches);
    assert.equal(r.memory.length, 3);
    assert.equal(r.editSamples.length, 10);
    assert.equal(r.editGC.length, 1);
    assert([...r.gc, ...r.editGC].every((g) => g.paintEvents > 0));
    for (const sample of r.samples) {
      assert(Object.values(sample).every((n) => Number.isFinite(n) && n >= 0));
      assert(
        Math.abs(
          sample.total -
            sample.decode -
            sample.hydrate -
            sample.editor -
            sample.layout -
            sample.frameWait,
        ) < 0.001,
      );
    }
    for (const edit of r.editSamples) {
      assert(Object.values(edit).every((n) => Number.isFinite(n) && n >= 0));
      assert(edit.totalMs + 0.001 >= edit.lookupMs + edit.editMs);
    }
  }
}
assert.equal(sessions.rows.length, 31 * 3 * 2 * 3);
for (const id of ids)
  for (const workload of workloads)
    for (const history of [0, 100]) {
      const rows = sessionRows(id, workload, history);
      assert.equal(rows.length, 3);
      assert.deepEqual(rows.map((r) => r.repetition).sort(), [0, 1, 2]);
      for (const r of rows) {
        assert.deepEqual(
          r.checkpoints.map((p) => p.completed),
          [200, 1000, 2000],
        );
        assert.deepEqual(
          r.checkpoints.map((p) => p.segmentOperations),
          [200, 800, 1000],
        );
        for (const p of r.checkpoints) {
          assert.equal(p.retainedVersions, history);
          assert(p.listMs >= 0 && p.totalMs >= p.listMs && p.retainedBytes > 0);
        }
        assert(r.loadedBytes > 0 && r.releasedHistoryBytes > 0);
      }
    }
for (const mongo of [structured, opaque]) {
  const expected = mongo === structured ? 9 : 7;
  // The completed structured run predates the dataset-label metadata addition;
  // preserve that raw file, and identify it by its explicit input filename.
  assert.equal(
    mongo.dataset ?? (mongo === structured ? "structured" : undefined),
    mongo === structured ? "structured" : "opaque8",
  );
  assert.equal(mongo.documents, 100);
  assert.equal(mongo.rows.length, expected * 4);
  assert.equal(mongo.examples.length, expected);
  assert.equal(
    new Set(
      mongo.rows.map((r) => `${r.formatId}/${r.compressor}/${r.snapshot}`),
    ).size,
    mongo.rows.length,
  );
  for (const row of mongo.rows) {
    assert.equal(row.compact.ok, 1);
    assert.equal(row.compactAfterCheckpoint.ok, 1);
    assert.deepEqual(row.checkedDocuments, [0, 99]);
    assert.equal(row.storageBytes / 100, row.storageBytesPerDocument);
    assert(
      row.compressorCreationString.includes(
        `block_compressor=${row.compressor}`,
      ),
    );
  }
}
if (opaqueBrowser) {
  assert(
    opaqueBrowser.complete,
    "Refuse incomplete opaque-ID browser comparison",
  );
  const compatible = ids.filter(
    (id) => !["F06", "F08"].includes(format(id).id),
  );
  assert.equal(compatible.length, 21);
  assert.equal(opaqueBrowser.rows.length, 21);
  assert.equal(opaqueBrowser.browser, browser.browser);
  assert.deepEqual(
    opaqueBrowser.rows.map((r) => r.id).sort(),
    [...compatible].sort(),
  );
  for (const r of opaqueBrowser.rows) {
    assert.equal(r.documents, 4);
    assert.equal(r.samples.length, 100);
    assert.equal(r.cold.length, 5);
    assert.equal(r.memory.length, 3);
    assert.equal(r.gc.length, opaqueBrowser.switches);
    assert.equal(r.editSamples.length, 10);
    assert([...r.gc, ...r.editGC].every((g) => g.paintEvents > 0));
  }
}
if (opaqueSessions) {
  assert(opaqueSessions.complete, "Refuse incomplete opaque-ID sessions");
  assert.equal(opaqueSessions.idModel, "opaque8");
  assert.equal(opaqueSessions.rows.length, 126);
  assert.equal(opaqueSessions.documents, 4);
  assert.equal(opaqueSessions.operations, 2000);
  assert.equal(opaqueSessions.repetitions, 3);
  assert.equal(opaqueSessions.browser, browser.browser);
  assert.deepEqual(
    [...new Set(opaqueSessions.rows.map((r) => r.id))].sort(),
    [...opaqueSessionIds].sort(),
  );
  for (const id of opaqueSessionIds)
    for (const workload of workloads)
      for (const history of [0, 100]) {
        const rows = sessionRows(id, workload, history, opaqueSessions);
        assert.equal(rows.length, 3);
        assert.deepEqual(rows.map((r) => r.repetition).sort(), [0, 1, 2]);
        for (const r of rows) {
          assert.deepEqual(
            r.checkpoints.map((p) => p.completed),
            [200, 1000, 2000],
          );
          assert.deepEqual(
            r.checkpoints.map((p) => p.segmentOperations),
            [200, 800, 1000],
          );
          assert(
            r.checkpoints.every(
              (p) =>
                p.retainedVersions === history &&
                p.retainedBytes > 0 &&
                p.listMs >= 0 &&
                p.totalMs >= p.listMs,
            ),
          );
        }
      }
}
for (const measurement of [scale, scaleRecheck, scaleProcess, scaleCPU])
  if (measurement) {
    assert(
      measurement.complete && measurement.diagnosticOnly,
      "Refuse incomplete scale diagnostic",
    );
    assert.equal(
      measurement.rows.length,
      measurement.scales.length *
        measurement.historyLimits.length *
        measurement.candidates.length *
        measurement.repetitions,
    );
    assert(measurement.rows.every((r) => r.checks.lookup && r.checks.fullSave));
  }
if (scaleRecheck) {
  assert(scale, "Recheck requires the preserved original run");
  assert.deepEqual(scaleRecheck.scales, scale.scales);
  assert.deepEqual(scaleRecheck.historyLimits, scale.historyLimits);
  assert.deepEqual(scaleRecheck.candidates, scale.candidates);
  assert.equal(scaleRecheck.repetitions, scale.repetitions);
}
for (const control of [scaleProcess, scaleCPU])
  if (control) {
    assert(scale);
    assert.equal(control.browserIsolation, "process");
    assert.deepEqual(control.scales, scale.scales);
    assert.deepEqual(control.historyLimits, scale.historyLimits);
    assert.deepEqual(control.candidates, scale.candidates);
    assert.equal(control.repetitions, scale.repetitions);
  }
if (scaleCPU) assert.equal(scaleCPU.cpuRate, 1);

const canonicalSection = canonicalReport(dir);
const primary = sorted(primaryIds),
  all = sorted(ids);
function chart(
  file: string,
  title: string,
  subtitle: string,
  headings: string[],
  selected: string[],
  values: (id: string) => number[],
  note: string,
) {
  fs.writeFileSync(
    path.join(dir, file + ".svg"),
    comparisonChart(
      title,
      subtitle,
      headings,
      selected.map((id) => ({
        label: label(id),
        detail: detail(id),
        values: values(id),
      })),
      note,
      "Interchange → internal representation",
    ),
  );
}
for (const [suffix, selected] of [
  ["primary", primary],
  ["all", all],
] as const) {
  chart(
    `load-${suffix}`,
    "Four documents: complete load → render",
    "Warm replacement loads; sorted by ready p95, fastest first. Lower is better.",
    ["Ready p95 (ms)", "To internal list p95 (ms)"],
    selected,
    (id) => [ready(id), convert(id)],
    "100 loads/case. Conversion is included in readiness; percentiles are not additive.",
  );
  chart(
    `memory-${suffix}`,
    "Editing memory: four open documents",
    "Only one document edited. Sorted by memory after 2,000 distributed operations.",
    [
      "Loaded + first edit (MB)",
      "After 2,000 edits (MB)",
      "+ 100 ID versions (MB)",
    ],
    [...selected].sort((a, b) => sessionMemory(a) - sessionMemory(b)),
    (id) => [sessionLoaded(id), sessionMemory(id), sessionMemory(id, 100)],
    "Median of 3 trials after GC. Heap + backing storage; not RSS. Third panel is total, not extra memory.",
  );
  chart(
    `history-memory-${suffix}`,
    "Editing memory with 100 prior ID versions retained",
    "After 2,000 operations on one of four editors. Sorted by distributed-workload memory.",
    ["Local typing (MB)", "Distributed (MB)", "New bunch IDs (MB)"],
    [...selected].sort((a, b) => sessionMemory(a, 100) - sessionMemory(b, 100)),
    (id) => workloads.map((w) => sessionMemory(id, 100, w)),
    "Different editing trajectories, each retaining 100 versions. New bunches are sequences under one client.",
  );
  chart(
    `editing-${suffix}`,
    "2,000 edits: ID navigation + mutation",
    "Cumulative batch medians; no retained history. Lower is better.",
    ["Local typing (ms)", "Distributed (ms)", "New bunch IDs (ms)"],
    [...selected].sort(
      (a, b) =>
        q(sessionTime(a, "distributed")) - q(sessionTime(b, "distributed")),
    ),
    (id) => workloads.map((w) => q(sessionTime(id, w))),
    "Timed at() + mutations only; excludes history maintenance and reference checks. Full totals reported below.",
  );
}
for (const mongo of [structured, opaque]) {
  const names = mongo.examples
    .map((e) => e.formatId)
    .sort((a, b) => disk(a, "snappy", mongo) - disk(b, "snappy", mongo));
  fs.writeFileSync(
    path.join(
      dir,
      `mongo-${mongo === structured ? "structured" : "opaque8"}.svg`,
    ),
    comparisonChart(
      mongo === structured
        ? "Mongo storage: structured client_sequence IDs"
        : "Mongo storage: opaque 8-character IDs",
      "Physical collection file KB/document; sorted by Snappy, smallest first.",
      ["Snappy (KB/doc)", "Zstd (KB/doc)"],
      names.map((id) => ({
        label: `${id} · ${shortNames[id]}`,
        values: [disk(id, "snappy", mongo), disk(id, "zstd", mongo)],
      })),
      "100 documents/collection. Fresh snapshots; compacted twice. Collection indexes and shared files excluded.",
      "Stored JSON format",
    ),
  );
}

const fastest = all[0];
const nearReady = all.filter((id) => ready(id) - ready(fastest) <= 1);
const memoryEvidence = opaqueSessions ?? sessions;
const loadEvidence = opaqueBrowser ?? browser;
const loadP95 = (id: string, phase: "total" | "hydrate") => {
  const row = loadEvidence.rows.find((r) => r.id === id && r.documents === 4);
  assert(row);
  return q(
    row.samples.map((sample) => sample[phase]),
    0.95,
  );
};
const newBunchHistory = (id: string) => sessionMemory(id, 100, "new-bunches");
const dictionaryHistoryPenalty =
  Math.max(
    newBunchHistory("f07-flat-owned-128"),
    newBunchHistory("f09-flat-owned-128"),
  ) >
  newBunchHistory("f05-flat-owned-128") * 1.1;
const dictionaryHistoryFinding = `${dictionaryHistoryPenalty ? "**Counterexample to choosing on distributed edits alone:**" : "**Whole-ID dictionary history check:**"} with new bunches and 100 retained ID versions, F07 owned-128 used **${f(newBunchHistory("f07-flat-owned-128"))} MB** and F09 owned-128 **${f(newBunchHistory("f09-flat-owned-128"))} MB**, versus **${f(newBunchHistory("f05-flat-owned-128"))} MB** for F05 owned-128 and ${f(newBunchHistory("objects"))} MB for plain SavedIdList → IdList. F07/F09 copy the whole-ID dictionary and lookup map when adding an identity; retaining old versions also retains earlier copies. ${dictionaryHistoryPenalty ? "That retained-version cost materially changes the memory tradeoff in this workload." : "Check the workload ranges rather than assuming dictionary deduplication always lowers editing memory."}`;
const canonicalDisk = (id: string) =>
  disk(id, "snappy", canonicalOpaque, "canonical-final");
const smallestOpaque = [...canonicalOpaque.examples].sort(
  (a, b) => canonicalDisk(a.formatId) - canonicalDisk(b.formatId),
)[0];
const summary = (selected: string[]) => [
  "| Interchange → internal container | Ready p95 ms | After 2,000 edits MB | With 100 ID versions MB | 2,000 distributed ID ops ms | Mongo Snappy KB/doc |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...selected.map(
    (id) =>
      `| ${label(id)} | ${f(ready(id))} | ${f(sessionMemory(id))} | ${f(sessionMemory(id, 100))} | ${f(q(sessionTime(id, "distributed")))} | ${f(disk(format(id).id))} |`,
  ),
];
function storedExamples(): string[] {
  const result = [
    "## Exact stored JSON, F01–F09",
    "",
    "Expand a format before reading its results. These are the actual Mongo document shapes, including the _id/state wrapper. Readable structured names illustrate the encoding; they are not proposed replacements for your opaque IDs.",
    "",
    "F05 repeats **whole IDs** and reconstructs counters. F07 deduplicates **whole IDs**. F08 deduplicates **clients**, keeping sequence numbers separately. Counters default to zero for the first run of an ID, then the end of its preceding run; sparse exceptions preserve other starts. Negative counts mean deletion in F02–F09.",
    "",
  ];
  for (const [key, info] of formatEntries) {
    const e = structured.examples.find((e) => e.id === key);
    assert(e);
    result.push(
      `<details><summary>${info.id} — ${shortNames[info.id]}${info.id === "F01" ? " (unchanged library baseline)" : ""}</summary>`,
      "",
      info.explanation,
      "",
      "```json",
      JSON.stringify(e.storedDocument, null, 2),
      "```",
      "",
      "</details>",
      "",
    );
  }
  result.push(
    "<details><summary>Opaque-ID examples: F05 and F07 preserve the eight-character IDs</summary>",
    "",
  );
  for (const id of ["F05", "F07"]) {
    const e = opaque.examples.find((e) => e.formatId === id);
    assert(e);
    result.push(
      `### ${id}`,
      "",
      "```json",
      JSON.stringify(e.storedDocument, null, 2),
      "```",
      "",
    );
  }
  result.push(
    "F08 has no lossless client/sequence split for arbitrary opaque IDs.",
    "",
    "</details>",
    "",
  );
  return result;
}
const lines = [
  "# Storage and editable ID containers: the full comparison",
  "",
  "Draft exploration, not a production migration. This report separates **what is stored in Mongo** from **what the browser edits**, then measures both. F01 is the library’s unchanged plain-object SavedIdList baseline. All formats are ordinary JSON/BSON objects or arrays. Binary encoding, network transfer and logical BSON size are deliberately excluded.",
  "",
  "**Baseline provenance:** existing IdList means the existing tree and plain SavedIdList on this benchmark branch, starting at commit `84e1cef`. This branch inherits the experimentalLoadFrom/experimentalSaveTo hooks from [PR #32](https://github.com/mweidner037/articulated/pull/32); IdList.load delegates through that hook. This is not a separate measurement of the pristine saved-state-alts loader. The native containers and hooks are exploratory, not a stable API or production migration.",
  "",
  `**${ids.length} runtime configurations, all nine interchange formats, two Mongo compressors, and two ID models.** Start with the format examples and canonical replay for your eight-character IDs, then the four-document opaque-ID load tests. The broader structured-ID sweep uses 13 fixed representative choices; all ${ids.length} cases, losing experiments, page-size choices and raw measurements remain in the collapsed detail.`,
  "",
  "## Three recommendations, depending on your priority",
  "",
  `1. **Mongo storage first: investigate ${smallestOpaque.formatId} (${shortNames[smallestOpaque.formatId]}).** With your eight-character IDs and Snappy, the canonical snapshot used **${f(canonicalDisk(smallestOpaque.formatId))} KB/document**, versus ${f(canonicalDisk("F01"))} KB for plain SavedIdList—**${pct(canonicalDisk(smallestOpaque.formatId), canonicalDisk("F01"))}% less**. Changing the stored format does not require replacing the editable IdList, but does require a migration and conversion on load.`,
  "",
  `2. **Browser memory first: investigate native F05 columns with owned pages.** In the four-document ${opaqueSessions ? "eight-character-ID" : "structured-ID"} test after 2,000 distributed edits, this used **${f(sessionMemory("f05-flat-owned-128", 0, "distributed", memoryEvidence))} MB**, versus ${f(sessionMemory("objects", 0, "distributed", memoryEvidence))} MB for existing IdList. The canonical one-document replay below separately tests the whole recorded history. These are incomplete API prototypes; the memory saving is not a claim of faster editing or zero initialization.`,
  "",
  `3. **Avoiding a library rewrite: keep the existing IdList.** Its 2,000 distributed ID-call batch was **${f(q(sessionTime("objects", "distributed", 0, "listMs", memoryEvidence)))} ms**, versus ${f(q(sessionTime("f05-flat-owned-128", "distributed", 0, "listMs", memoryEvidence)))} ms for native F05. Native loading can still be faster; editing and loading are different tradeoffs. Use the full canonical editor totals below to judge whether an ID-call difference matters to the whole editor. Keeping F01 storage as well avoids a format migration.`,
  "",
  `**Loading and editing are different:** in the separate four-document ${opaqueBrowser ? "opaque-ID" : "structured-ID"} warm-load test, native F05 ready p95 was **${f(loadP95("f05-flat-owned-128", "total"))} ms**, versus **${f(loadP95("objects", "total"))} ms** for existing IdList; conversion p95 was ${f(loadP95("f05-flat-owned-128", "hydrate"))} versus ${f(loadP95("objects", "hydrate"))} ms. Ready time includes the editor work and two animation frames, not network/server time. The canonical full-edit replay does **not** establish a dependable editor-speed winner; its variable timings and all four diagnostic runs remain visible below.`,
  "",
  "**ID-model warning:** F06/F08 require structured `client_sequence` IDs. They cannot losslessly split arbitrary opaque 8-character nanoids. Opaque-ID Mongo measurements therefore exclude F06/F08. The primary browser comparison uses the original structured trace so every candidate can receive identical logical IDs; it must not be presented as measured opaque-ID browser performance. A separate opaque-ID browser section is included when its complete run is available.",
  "",
  ...storedExamples(),
  ...canonicalSection,
  "<details><summary>Broader structured-ID sweep: all formats, page sizes, ownership and indexing</summary>",
  "",
  "## Broader comparison: structured IDs, four open editors",
  "",
  "The charts below are the primary view. Names identify two independent choices: **F01–F09 is the stored/interchange shape**; the rest describes the editable browser container.",
  "",
  "| Chart label | Plain-language meaning |",
  "| --- | --- |",
  "| existing IdList | Convert the stored shape if needed, then use Matthew’s existing library container. |",
  "| native rows / flat columns | Edit objects, tuples or columns directly in small pages; a flat page directory provides navigation. |",
  "| page tree | Edit column pages with a persistent order tree and global numeric identity index. |",
  "| shared / owned | Shared pages retain views into input arrays; owned pages have independent page arrays, not universally deep-copied input. See the ownership contract below. |",
  "| 64 / 128 / 256 | Maximum runs per page—not IDs, characters, bytes or document count. |",
  "",
  "### What ‘native’ means—and what still has to be translated",
  "",
  "**Native F05/F08 keeps the chosen columns as the editable run storage; it does not reconstruct SavedIdList objects and then call IdList.load(). But it is not the literal interchange object with zero work.** Loading validates data, reconstructs an explicit start counter for every run into a sidecar array, and builds navigation indexes. Owned variants also copy the run columns into independently allocated pages. After editing, exporting F05/F08 flattens those pages and recomputes sparse counter exceptions. These load and export costs are measured, not treated as free.",
  "",
  "| Native container | Editable data retained | Additional in-memory state |",
  "| --- | --- | --- |",
  "| F01 objects (also F02 signed objects / F03 tuples) | Original row shape, including each explicit start counter | Per-page ID → row maps, visible lengths and a flat prefix index; no reconstructed counter sidecar. |",
  "| F05 columns | Whole-ID bunchIds and signed counts columns | Float64 start counter per run, per-page whole-ID → row maps, visible lengths and flat prefixes. |",
  "| F07 / F09 dictionary columns | Whole-ID dictionary, numeric bunchIndices, signed counts; F09 also retains its explicit startCounters column | Dictionary lookup map, per-page numeric-ID → row maps, visible lengths and flat prefixes. F07 reconstructs a Float64 counter sidecar; F09 uses its existing counter column. |",
  "| F08 flat columns | Client dictionary, numeric clientIndices, seqNums and signed counts | Float64 counter sidecar, derived whole-ID strings in per-page ID → row maps, visible lengths and flat prefixes. |",
  "| F08 page tree | The same F08 run columns in pages | Float64 counter sidecar, client lookup, numeric identity-range index, order tree with visible lengths, and persistent page/parent directories. |",
  "",
  "Thus the question measured here is **column-/row-native storage plus its required indexes versus translation into the existing IdList container**—not ‘JSON with no initialization’ versus a tree. Snapshot JSON and editable memory share the run representation, but are not byte-for-byte identical layouts. The production IdList internals are not secretly present in native cases.",
  "",
  "<details><summary>Exact primary results: 13 fixed cases, sorted by ready p95</summary>",
  "",
  ...summary(primary),
  "",
  "Fastest ready p95 is first. Editing columns are medians after 2,000 distributed operations on one editor; three other editors stay open. Mongo is the **initial structured-ID snapshot**, per document, and is identical for different internal implementations of the same F-format. MB and KB are decimal. Memory includes the editor/model, not only IDs. No single score combines unlike units.",
  "",
  "</details>",
  "",
  "## Load → editable list → rendered document: structured IDs",
  "",
  "![Complete load speed, sorted by p95](results/exploration/load-primary.svg)",
  "",
  "The primary chart is **100 warm replacement loads per case**, not cold first opening: replacing an existing editor includes its teardown. Ready includes decoding, conversion, validation, ownership copies, indexing, editor construction, layout and a rendering opportunity. The internal-list interval is measured around the actual loader and is already included in readiness. There is no separate constant-layout bar and no hidden prebuilt ID list. Five first-load samples from fresh browser contexts and the separate first-edit p95 are exposed in the collapsed full metrics below. Ready is a two-animation-frame proxy, not physical display scan-out or a production application startup measurement.",
  "",
  `**Read the groups, not tiny rank changes:** ${nearReady.length} configurations fall between ${f(ready(fastest))} and ${f(Math.max(...nearReady.map((id) => ready(id))))} ms ready p95. The sorted chart is the requested ranking, not evidence that every adjacent row is meaningfully faster. Compare conversion cost alongside readiness, then editing/memory/storage; percentiles from different phases cannot be added or subtracted as if they came from one load.`,
  "",
  "## JS memory during editing: structured IDs",
  "",
  "![Loaded and sustained-edit JS memory](results/exploration/memory-primary.svg)",
  "",
  "All three panels come from the session harness: loaded after the first edit, after 2,000 distributed operations without history, and after the same trajectory with 100 prior **ID-list versions** retained. The third panel is a total—not memory to add to the second. Heap plus ArrayBuffer backing storage is measured after forced GC, relative to an empty warmed harness. Workload/reference data are not retained between browser calls. This is not total renderer RSS, exact peak usage, or full ProseMirror undo history.",
  "",
  "**Checkpoint GC changes the experiment:** the document state persists through all 2,000 operations, but forced collection occurs at load and the 200/1,000/2,000 checkpoints, outside timed segments. This measures sustained editing state and retained memory—not one uninterrupted session with only naturally scheduled GC. Natural collections within each timed segment still count toward its duration.",
  "",
  "Independent pages address lifetime retention, not just load allocation: shared pages may keep document-sized source arrays alive after many rows have been replaced. Owned column pages copy bounded numeric/string-reference arrays during load and let obsolete pages be collected. Both kinds still build indexes; ‘native’ does not mean no derived state or zero work.",
  "",
  "**Ownership contract:** decoded input is read-only/transferred to the container; these prototypes do not universally promise isolation from later caller mutation. Native object/tuple pages own the page arrays but reuse immutable row objects/tuples. Owned flat F08 pages copy numeric columns but still share the input clientIds dictionary. Owned F05 pages copy their primitive columns; owned F07/F09 pages also copy their whole-ID dictionary. The F08 page tree copies its client dictionary in both modes. ‘Owned’ is therefore a page-storage strategy, not a blanket deep-clone or deep-freeze guarantee.",
  "",
  "### Retained history changes the answer when new IDs keep arriving",
  "",
  "![Editing memory across workloads, with 100 prior ID versions](results/exploration/history-memory-primary.svg)",
  "",
  dictionaryHistoryFinding,
  "",
  "Each panel is a different 2,000-operation trajectory with 100 previous ID-list versions retained; values are total retained JS across four editors. New bunches means many sequences under one client, not many distinct F08 clients. Local/distributed workloads reuse one new whole ID, whereas new-bunches keeps extending the whole-ID dictionary. Keeping only the latest version can release earlier copies; retaining versions cannot. This chart therefore tests a different allocation/retention pressure, not just a new random edit position.",
  "",
  "## Editing speed, including navigation: structured IDs",
  "",
  "![Navigation and editing workloads](results/exploration/editing-primary.svg)",
  "",
  "Each real operation derives its anchor/target using the current list’s at() and applies an immutable mutation; the reference ID is checked. Every operation also dispatches an incremental ProseMirror insertion/deletion. The chart isolates ID navigation + mutation; the table below includes the whole editor loop and rendering opportunities. No paragraph separators are deleted. Local typing performs bursts of 40 inserts and 10 backspaces. Distributed edits alternate inserts/deletes across the document. New-bunches uses distributed positions but introduces a new bunch identity on each insertion, exposing dictionary-growth costs.",
  "",
  "**New bunches are not new clients:** that workload creates sequence numbers under one client, such as session-new-bunches_0, session-new-bunches_2 and session-new-bunches_4. F07/F09 therefore grow their whole-ID dictionaries, whereas F08 adds only one client entry and varies its numeric sequence column. It does not test sustained growth in the number of distinct F08 clients.",
  "",
  "**Timing boundaries:** listMs sums only the timed at() + insertAfter/delete calls. It excludes retaining/evicting history versions, reference-ID validation, ProseMirror transactions, text-offset mapping and forced checkpoint GC. A natural collection that runs inside one of those timed calls is included, but GC occurring elsewhere in the editor loop is not. totalMs includes the entire segment loop—including history maintenance, reference checks, PM/common mapping, naturally occurring GC and checkpoint rendering—but still excludes forced collection performed between segments. The ID-only chart is not all work induced by a container or its allocations; read it alongside total time and retained memory.",
  "",
  "Checkpoints occur after 200, 1,000 and 2,000 operations; their segment lengths are 200, 800 and 1,000. Reported session time **sums those segments**. Two animation frames occur per checkpoint, not per keystroke. Three trials support medians and ranges—not editing p95 or statistical-significance claims. The common paragraph-offset mapping and editor work can dominate total time; the ID-only columns show whether changing the container matters within that cost.",
  "",
  "**Same implementation is not a new algorithm:** all F01–F09 → existing IdList rows use the same editing container. Small timing differences among those rows can reflect string representation, JIT history and noise; they are not evidence that an F06 adapter invented a faster editor. F01 → IdList is the unchanged editing control below.",
  "",
  "| Structured-ID container | 2,000 distributed ID calls ms | Batch / 2,000, µs per operation | Editor-inclusive 2,000-op total ms |",
  "| --- | ---: | ---: | ---: |",
  ...[
    "objects",
    "f05-flat-owned-128",
    "f08-flat-owned-128",
    "f08-tree-owned-128",
  ].map(
    (id) =>
      `| ${label(id)} | ${f(q(sessionTime(id, "distributed")))} | ${f((q(sessionTime(id, "distributed")) * 1000) / 2000)} | ${f(q(sessionTime(id, "distributed", 0, "totalMs")))} |`,
  ),
  "",
  `For example, F05 owned-128’s ID-call batch differed from the existing IdList control by **${f(q(sessionTime("f05-flat-owned-128", "distributed")) - q(sessionTime("objects", "distributed")))} ms across 2,000 operations**, or **${f(((q(sessionTime("f05-flat-owned-128", "distributed")) - q(sessionTime("objects", "distributed"))) * 1000) / 2000)} µs per operation when averaged over the batch**. This is not measured individual-event latency, a per-keystroke percentile or a claim that responsiveness changes by that amount. Editor-inclusive totals are separately measured, not inferred by adding phase medians.`,
  "",
  "<details><summary>Primary cases: cumulative editor-inclusive session time (median [min–max] ms)</summary>",
  "",
  "| Container | Local typing, total ms | Distributed, total ms | New bunches, total ms |",
  "| --- | ---: | ---: | ---: |",
  ...primary.map(
    (id) =>
      `| ${label(id)} | ${workloads.map((w) => range(sessionTime(id, w, 0, "totalMs"))).join(" | ")} |`,
  ),
  "",
  "These totals include ID navigation/mutation, history maintenance, reference-ID validation, incremental PM transactions, common text-offset mapping, natural GC within the segment and checkpoint rendering. Forced collection between segments is excluded. They are not per-keystroke response times.",
  "",
  "</details>",
  "",
  "## Mongo storage is a separate decision",
  "",
  "![Physical Mongo size for structured IDs](results/exploration/mongo-structured.svg)",
  "",
  "![Physical Mongo size for opaque eight-character IDs](results/exploration/mongo-opaque8.svg)",
  "",
  `Measured Mongo ${structured.version} collection files, not JSON estimates. Each layout/compressor/snapshot uses 100 freshly inserted documents with independently renamed IDs. Collections were compacted, checkpointed, compacted again, then measured during locked filesystem sync; actual .wt file length matched storageSize and the configured compressor was checked. Collection allocation/free space is included; _id indexes and shared database files are excluded. This is one physical build per choice, not repeated statistical samples.`,
  "",
  "The structured corpus renames client dictionaries while preserving client_sequence structure. The opaque corpus remaps whole IDs to independent collision-checked 8-character base64url hash strings; it preserves run/counter shape but is not a production nanoid corpus. Both the initial and post-200-edit snapshots are freshly inserted into separate collections. Post-edit numbers measure snapshot shape, **not** in-place update fragmentation or compaction savings on Atlas. No production database was accessed or changed.",
  "",
  "<details><summary>Exact physical Mongo sizes: initial and post-200-edit snapshots</summary>",
  "",
];
for (const mongo of [structured, opaque]) {
  lines.push(
    `### ${mongo === structured ? "Structured IDs" : "Opaque 8-character IDs"}`,
    "",
    "| Stored format | Initial Snappy KB/doc | After edits Snappy KB/doc | Initial Zstd KB/doc | After edits Zstd KB/doc |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...mongo.examples.map(
      (e) =>
        `| ${e.formatId} · ${shortNames[e.formatId]} | ${[disk(e.formatId, "snappy", mongo), disk(e.formatId, "snappy", mongo, "after-200-edits"), disk(e.formatId, "zstd", mongo), disk(e.formatId, "zstd", mongo, "after-200-edits")].map(f).join(" | ")} |`,
    ),
    "",
  );
}
lines.push(
  "</details>",
  "",
  "## What the first-principles alternatives actually bought us",
  "",
  "The hypotheses were tested as implementations, not inferred from the interchange shape. The page-tree design keeps native F08 columns but separates identity, order, visibility and immutable versions. A numeric interval index locates a stable page; an order tree stores visible lengths; versioned page/parent maps preserve prior versions. A deletion without a page split reuses its identity ranges and global identity index because visibility changed but ownership did not. That removes global chunk scans/prefix rebuilds, but adds persistent-index overhead.",
  "",
  "<details><summary>Ownership, page size and global-index experiments: exact numbers</summary>",
  "",
  "| Experiment | Ready p95 ms | Distributed ID ops ms | Edited MB | With 100 ID versions MB |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...[
    "f05-flat-shared-128",
    "f05-flat-owned-64",
    "f05-flat-owned-128",
    "f05-flat-owned-256",
    "f08-flat-shared-128",
    "f08-flat-owned-64",
    "f08-flat-owned-128",
    "f08-flat-owned-256",
    "f08-tree-shared-128",
    "f08-tree-owned-64",
    "f08-tree-owned-128",
    "f08-tree-owned-256",
  ].map(
    (id) =>
      `| ${label(id)} | ${f(ready(id))} | ${f(q(sessionTime(id, "distributed")))} | ${f(sessionMemory(id))} | ${f(sessionMemory(id, 100))} |`,
  ),
  "",
  "</details>",
  "",
  `**Owned versus shared:** F08 owned-128 retained ${f(sessionMemory("f08-flat-owned-128"))} MB after distributed editing, versus ${f(sessionMemory("f08-flat-shared-128"))} MB shared. Load p95 was ${f(ready("f08-flat-owned-128"))} versus ${f(ready("f08-flat-shared-128"))} ms. F05 owned/shared measured ${f(sessionMemory("f05-flat-owned-128"))}/${f(sessionMemory("f05-flat-shared-128"))} MB. Initial zero-copy adoption is therefore not treated as an automatic lifetime-memory win.`,
  "",
  `**Global identity index and page tree:** F08 page-tree owned-128 took ${f(q(sessionTime("f08-tree-owned-128", "distributed")))} ms for 2,000 distributed ID operations, versus ${f(q(sessionTime("f08-flat-owned-128", "distributed")))} ms for flat owned-128; retained memory was ${f(sessionMemory("f08-tree-owned-128"))} versus ${f(sessionMemory("f08-flat-owned-128"))} MB. ${q(sessionTime("f08-tree-owned-128", "distributed")) >= q(sessionTime("f08-flat-owned-128", "distributed")) ? "The more sophisticated structure did not win this edit workload; asymptotic improvements alone are not enough to recommend it." : "The indexed structure improved this edit workload; its memory/load tradeoff still matters."}`,
  "",
  "**Page size:** 64/128/256 runs are measured for owned F05/F08 and the F08 page tree. Smaller pages reduce copied data but increase directory/index overhead. No single page size is assumed best for load, editing and retained undo versions simultaneously. Flat directories still copy their outer page list/prefix per edit; the page tree avoids that but its persistent map navigation/update paths cost O(log² pages).",
  "",
  `**Why not blindly pick the memory minimum?** In the structured-ID sweep, F05 owned-256 retained ${f(sessionMemory("f05-flat-owned-256"))} MB after distributed editing versus ${f(sessionMemory("f05-flat-owned-128"))} MB for owned-128, while its 2,000-operation ID-call time was ${f(q(sessionTime("f05-flat-owned-256", "distributed")))} versus ${f(q(sessionTime("f05-flat-owned-128", "distributed")))} ms. That is a memory/editing tradeoff, not a reason to declare a larger page better because its memory bar is slightly shorter. The opaque sustained-session follow-up fixes page size at 128; it does not establish an opaque-ID 64/256 optimum.`,
  "",
  `**F05 versus F08 is also practical, not just numeric:** structured-session F05 owned-128 retained ${f(sessionMemory("f05-flat-owned-128"))} MB and took ${f(q(sessionTime("f05-flat-owned-128", "distributed")))} ms for the ID-call batch; F08 flat owned-128 retained ${f(sessionMemory("f08-flat-owned-128"))} MB and took ${f(q(sessionTime("f08-flat-owned-128", "distributed")))} ms. F05 preserves arbitrary whole IDs; F08 requires changing the ID model if current IDs are opaque. A near-tied memory footprint alone does not justify that extra constraint.`,
  "",
  "**Rows are not dismissed:** native plain objects, signed-count objects and tuples use the same flat-page navigation concept as columns. Unchanged row objects can be shared across versions, whereas editing a column page copies its scalar arrays. Their results are measured alongside columns rather than declaring columns the answer in advance.",
  "",
  "These are benchmark API subsets: length, at, indexOf with deleted-entry bias, insertAfter, delete and save/snapshot. They do not implement full insertBefore/undelete/uninsert/iterator semantics or a production editor integration. New native loaders include validation; no hidden IdList.load fallback is used. Owned input copying and eager index construction are charged to load. This is a set of possible designs, not a proposal to ship 31 containers.",
  "",
  "These measurements are not lower bounds for each representation. One concrete remaining inefficiency: the common F07/F09 loader still allocates and writes per-ID next-counter scratch for F09 even though F09 already stores every start counter. That temporary reconstruction scratch is avoidable; it is included in the measured loader, is not an additional retained dense counter column, and was left unchanged during the frozen comparison. Other prototypes likewise may admit further optimization.",
  "",
  "## All configurations and measurements",
  "",
  "<details><summary>All 31 configurations: complete charts and primary comparison, ready p95 sorted</summary>",
  "",
  "![All configurations, complete load speed](results/exploration/load-all.svg)",
  "",
  "![All configurations, sustained-edit memory](results/exploration/memory-all.svg)",
  "",
  "![All configurations, retained-history memory across workloads](results/exploration/history-memory-all.svg)",
  "",
  "![All configurations, navigation and editing](results/exploration/editing-all.svg)",
  "",
  ...summary(all),
  "",
  "</details>",
  "",
  "<details><summary>All 31: load/conversion, separate load memory pass, GC and edited-snapshot export</summary>",
  "",
  "| Container | Ready p95, 1 / 4 docs ms | Convert p95, 1 / 4 docs ms | Load-pass retained, 4 docs MB | Load GC mean ms | Export after 200 edits ms |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...all.map((id) => {
    const r = loaded(id);
    return `| ${label(id)} | ${f(ready(id, 1))} / ${f(ready(id))} | ${f(convert(id, 1))} / ${f(convert(id))} | ${f(q(r.memory.map((m) => m.retainedDelta)) / 1e6)} | ${f(r.gc.reduce((n, g) => n + g.gcMs, 0) / r.gc.length)} | ${f(exportMs(id))} |`;
  }),
  "",
  "GC is measured in separate traced loads, not added to untraced readiness. Export is CPU time to produce the candidate’s own F-format after the same 200-edit batch, not network time or the 2,000-operation session. Exports are round-trip checked outside timers. Flat shared formats can return their original state before editing; this measurement deliberately exports edited state. No snapshot cache is hidden in retained memory.",
  "",
  "</details>",
  "",
  "<details><summary>All 31: cold first load (5-context median/range) and first edit (100-sample p95)</summary>",
  "",
  "| Container | Cold ready, 1 doc ms | Cold ready, 4 docs ms | First edit + render p95, 1 doc ms | First edit + render p95, 4 docs ms |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...all.map(
    (id) =>
      `| ${label(id)} | ${range(loaded(id, 1).cold.map((s) => s.total))} | ${range(loaded(id).cold.map((s) => s.total))} | ${f(
        q(
          loaded(id, 1).samples.map((s) => s.edit),
          0.95,
        ),
      )} | ${f(
        q(
          loaded(id).samples.map((s) => s.edit),
          0.95,
        ),
      )} |`,
  ),
  "",
  "Cold means the first measured load in each of five fresh browser contexts: median [min–max], not p95. The browser process and operating-system caches are not reset, and fetching/preparing input remains outside the clock. First edit is the separate insertion + incremental PM update + rendering opportunity after each warm ready sample; it is not included in ready p95. It is a different workload from the 2,000-operation sessions.",
  "",
  "</details>",
  "",
  "<details><summary>All 31: session memory checkpoints and releasing retained versions</summary>",
  "",
  "| Container | Loaded + first edit MB | After 200 / 1,000 / 2,000 edits MB | After 2,000 + 100 versions MB | After releasing history MB | Freed by release MB |",
  "| --- | ---: | ---: | ---: | ---: | ---: |",
  ...all.map((id) => {
    const checkpoints = [0, 1, 2].map((i) =>
      f(q(sessionRows(id).map((r) => r.checkpoints[i].retainedBytes)) / 1e6),
    );
    const history = sessionRows(id, "distributed", 100);
    return `| ${label(id)} | ${f(sessionLoaded(id))} | ${checkpoints.join(" / ")} | ${f(sessionMemory(id, 100))} | ${f(q(history.map((r) => r.releasedHistoryBytes)) / 1e6)} | ${f(q(history.map((r) => last(r).retainedBytes - r.releasedHistoryBytes)) / 1e6)} |`;
  }),
  "",
  "After-release bytes mean total memory still retained; freed bytes are the paired before/after difference. Negative tiny release differences can reflect measurement/JIT noise and are not clamped. These histories retain ID-list versions only, not application undo state. Raw before-GC boundary readings remain available but are not exact memory peaks.",
  "",
  "</details>",
  "",
  "<details><summary>All 31: 2,000-operation ID navigation + mutation, median [min–max] ms</summary>",
  "",
);
for (const history of [0, 100])
  lines.push(
    `### ${history} retained prior ID versions`,
    "",
    "| Container | Local typing ms | Distributed ms | New bunch identities ms |",
    "| --- | ---: | ---: | ---: |",
    ...all.map(
      (id) =>
        `| ${label(id)} | ${workloads.map((w) => range(sessionTime(id, w, history))).join(" | ")} |`,
    ),
    "",
  );
lines.push("</details>", "");
lines.push(
  "<details><summary>All 31: retained memory after 2,000 operations by workload, median [min–max] MB</summary>",
  "",
);
for (const history of [0, 100])
  lines.push(
    `### ${history} retained prior ID versions`,
    "",
    "| Container | Local typing MB | Distributed MB | New bunch identities MB |",
    "| --- | ---: | ---: | ---: |",
    ...all.map(
      (id) =>
        `| ${label(id)} | ${workloads.map((w) => range(sessionRows(id, w, history).map((r) => last(r).retainedBytes / 1e6))).join(" | ")} |`,
    ),
    "",
  );
lines.push(
  "Values are after forced checkpoint GC and include four actual editors. These are three-trial medians/ranges, not memory peaks or confidence intervals. New-bunches introduces many sequences under one client; distinct-client churn remains unmeasured.",
  "",
  "</details>",
  "",
);
lines.push("</details>", "");

if (opaqueBrowser) {
  const rows = [...opaqueBrowser.rows].sort(
    (a, b) =>
      q(
        a.samples.map((s) => s.total),
        0.95,
      ) -
      q(
        b.samples.map((s) => s.total),
        0.95,
      ),
  );
  const selected = rows.filter((r) => primaryIds.includes(r.id));
  const opaqueReady = (r: BrowserRow) =>
    q(
      r.samples.map((s) => s.total),
      0.95,
    );
  const opaqueMemory = (r: BrowserRow) =>
    q(r.memory.map((m) => m.retainedDelta)) / 1e6;
  fs.writeFileSync(
    path.join(dir, "opaque-load.svg"),
    comparisonChart(
      "Opaque 8-character IDs: four-document load → render",
      "Warm replacement loads; fastest ready p95 first. Fixed primary selection, compatible cases only.",
      ["Ready p95 (ms)", "To internal list p95 (ms)"],
      selected.map((r) => ({
        label: label(r.id),
        detail: detail(r.id),
        values: [
          opaqueReady(r),
          q(
            r.samples.map((s) => s.hydrate),
            0.95,
          ),
        ],
      })),
      "100 loads/case. Initial whole IDs are 8 characters; the harness first edit adds a benchmark-named ID.",
      "Interchange → internal representation",
    ),
  );
  fs.writeFileSync(
    path.join(dir, "opaque-memory.svg"),
    comparisonChart(
      "Opaque 8-character IDs: loaded JS memory",
      "Separate measured pass; four open editors, first edit completed. Lower is better.",
      ["Retained JS median (MB)"],
      [...selected]
        .sort((a, b) => opaqueMemory(a) - opaqueMemory(b))
        .map((r) => ({
          label: label(r.id),
          detail: detail(r.id),
          values: [opaqueMemory(r)],
        })),
      "Three memory trials. After-GC heap + backing storage, not RSS or sustained-session memory.",
      "Interchange → internal representation",
    ),
  );
  lines.push(
    "## Separate browser check: actual opaque 8-character input IDs",
    "",
    `This pass loaded the same logical trace with each distinct whole ID remapped to an opaque 8-character string, matching the Mongo corpus’s document-zero mapping. All **21 compatible configurations** were measured (${opaqueBrowser.rows.reduce((n, r) => n + r.samples.length, 0).toLocaleString("en-US")} timed loads, four editors). F06/F08 are excluded. The fastest ready p95 here was **${label(rows[0].id)}: ${f(opaqueReady(rows[0]))} ms**.`,
    "",
    "![Opaque-ID browser load](results/exploration/opaque-load.svg)",
    "",
    "![Opaque-ID loaded memory](results/exploration/opaque-memory.svg)",
    "",
    "The charts use the compatible portion of the fixed primary-case selection. This is real browser loading with opaque input IDs, not an inference from structured strings. However, the first edit and the short edit/export batch introduce benchmark-named IDs; it is not a guarantee that every ID remains eight characters after editing. The 31-case sustained sessions above use the structured corpus; a distinct seven-case opaque sustained-session pass follows when available. Do not splice separate passes into one end-to-end sample.",
    "",
    "<details><summary>All 21 opaque-ID browser configurations, ready p95 sorted</summary>",
    "",
    "| Container | Ready p95 ms | Conversion p95 ms | Loaded + first edit MB | Opaque Mongo Snappy KB/doc | Opaque Mongo Zstd KB/doc |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (r) =>
        `| ${label(r.id)} | ${f(opaqueReady(r))} | ${f(
          q(
            r.samples.map((s) => s.hydrate),
            0.95,
          ),
        )} | ${f(opaqueMemory(r))} | ${f(disk(format(r.id).id, "snappy", opaque))} | ${f(disk(format(r.id).id, "zstd", opaque))} |`,
    ),
    "",
    "| Container | Cold ready, 5-context median [min–max] ms | First edit + render p95 ms |",
    "| --- | ---: | ---: |",
    ...rows.map(
      (r) =>
        `| ${label(r.id)} | ${range(r.cold.map((s) => s.total))} | ${f(
          q(
            r.samples.map((s) => s.edit),
            0.95,
          ),
        )} |`,
    ),
    "",
    "[Opaque-ID browser raw data](results/exploration-opaque8/browser.json)",
    "",
    "</details>",
    "",
  );
}
if (opaqueSessions) {
  const memory = (
    id: string,
    history = 0,
    workload: Workload = "distributed",
  ) => sessionMemory(id, history, workload, opaqueSessions);
  const selected = [...opaqueSessionIds].sort((a, b) => memory(a) - memory(b));
  const render = (
    file: string,
    title: string,
    subtitle: string,
    headings: string[],
    order: string[],
    values: (id: string) => number[],
    note: string,
  ) =>
    fs.writeFileSync(
      path.join(dir, file + ".svg"),
      comparisonChart(
        title,
        subtitle,
        headings,
        order.map((id) => ({
          label: label(id),
          detail: detail(id),
          values: values(id),
        })),
        note,
        "Interchange → internal representation",
      ),
    );
  render(
    "opaque-session-memory",
    "Opaque IDs: sustained-editing memory",
    "Four editors; one edited for 2,000 operations. Sorted by distributed-workload memory.",
    [
      "Loaded + first edit (MB)",
      "After 2,000 edits (MB)",
      "+ 100 ID versions (MB)",
    ],
    selected,
    (id) => [sessionLoaded(id, opaqueSessions), memory(id), memory(id, 100)],
    "Median of 3 after-GC measurements. Initial and session IDs are 8 characters; first setup ID is not.",
  );
  render(
    "opaque-session-history",
    "Opaque IDs: 100 prior ID versions retained",
    "Memory after 2,000 operations; three different trajectories. Lower is better.",
    ["Local typing (MB)", "Distributed (MB)", "New bunch IDs (MB)"],
    [...selected].sort((a, b) => memory(a, 100) - memory(b, 100)),
    (id) => workloads.map((w) => memory(id, 100, w)),
    "Whole IDs stay opaque; new-bunches tests growth in distinct IDs, with no client decomposition.",
  );
  lines.push(
    "## Actual opaque-ID sustained sessions: seven fixed compatible containers",
    "",
    "This separate 126-trajectory pass uses opaque 8-character input IDs and collision-checked 8-character IDs for every session insertion. Only the existing harness’s first setup insertion retains its benchmark name. Four actual PM editors remain open; one receives 2,000 incremental operations. Each of the seven fixed containers has three trials for each workload/history combination, with exactly the same checkpoint GC and timing boundaries as the structured sessions.",
    "",
    "![Actual opaque-ID sustained-edit memory](results/exploration/opaque-session-memory.svg)",
    "",
    "![Actual opaque-ID retained-history memory](results/exploration/opaque-session-history.svg)",
    "",
    `With new whole IDs and 100 prior versions retained, F07/F09 owned-128 measured **${f(memory("f07-flat-owned-128", 100, "new-bunches"))}/${f(memory("f09-flat-owned-128", 100, "new-bunches"))} MB**, versus **${f(memory("f05-flat-owned-128", 100, "new-bunches"))} MB** for F05 owned-128 and ${f(memory("objects", 100, "new-bunches"))} MB for the unchanged IdList baseline. Those numbers directly test opaque identities rather than transferring conclusions from structured sequences.`,
    "",
    "| Actual opaque-ID container | 2,000 distributed ID calls ms | Batch / 2,000, µs per operation | Editor-inclusive total ms |",
    "| --- | ---: | ---: | ---: |",
    ...[
      "objects",
      "f05-flat-owned-128",
      "f07-flat-owned-128",
      "f09-flat-owned-128",
    ].map(
      (id) =>
        `| ${label(id)} | ${f(q(sessionTime(id, "distributed", 0, "listMs", opaqueSessions)))} | ${f((q(sessionTime(id, "distributed", 0, "listMs", opaqueSessions)) * 1000) / 2000)} | ${f(q(sessionTime(id, "distributed", 0, "totalMs", opaqueSessions)))} |`,
    ),
    "",
    "The per-operation column is a batch average, not measured keystroke latency. The total includes the actual editor loop and checkpoint renders, not just ID calls.",
    "",
    "<details><summary>Seven opaque-ID containers: exact session memory and timing, median [min–max]</summary>",
    "",
  );
  for (const history of [0, 100]) {
    lines.push(
      `### ${history} retained prior ID versions`,
      "",
      "| Container | Local memory MB | Distributed memory MB | New-bunch memory MB |",
      "| --- | ---: | ---: | ---: |",
      ...selected.map(
        (id) =>
          `| ${label(id)} | ${workloads.map((w) => range(sessionRows(id, w, history, opaqueSessions).map((r) => last(r).retainedBytes / 1e6))).join(" | ")} |`,
      ),
      "",
      "| Container | Local ID calls ms | Distributed ID calls ms | New-bunch ID calls ms |",
      "| --- | ---: | ---: | ---: |",
      ...selected.map(
        (id) =>
          `| ${label(id)} | ${workloads.map((w) => range(sessionTime(id, w, history, "listMs", opaqueSessions))).join(" | ")} |`,
      ),
      "",
      "| Container | Local total ms | Distributed total ms | New-bunch total ms |",
      "| --- | ---: | ---: | ---: |",
      ...selected.map(
        (id) =>
          `| ${label(id)} | ${workloads.map((w) => range(sessionTime(id, w, history, "totalMs", opaqueSessions))).join(" | ")} |`,
      ),
      "",
    );
  }
  lines.push(
    "ID-call time excludes history bookkeeping and reference checks; total time includes them plus PM/common mapping/natural GC/rendering. Both exclude forced collection between timed segments. Values sum 200/800/1,000-operation segments, not individual keystroke latency. This pass does not measure F06/F08, which cannot represent these IDs.",
    "",
    "[Opaque-ID session raw data](results/exploration-opaque8/sessions.json)",
    "",
    "</details>",
    "",
  );
}
if (scale) {
  lines.push(
    "## Scaling diagnostic: no editor or rendering",
    "",
    `A separate ${scale.repetitions}-trial diagnostic repeats the trace with disjoint client identities at ${scale.scales.join("×, ")}× scale. It measures cold JSON parse+hydrate, 256 lookups, 200 precomputed mutations and post-GC ID-list memory. This is not a load/render benchmark, production corpus, warm throughput test or p95 estimate. It cannot replace the browser/editor results above.`,
    "",
    "<details><summary>Scaling medians, with every measured case retained</summary>",
    "",
    "| Scale / runs | Container | History | Load ms | 256 lookups ms | 200 edits ms | Loaded / edited MB |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const multiplier of scale.scales)
    for (const history of scale.historyLimits)
      for (const c of scale.candidates) {
        const rows: ScaleResults["rows"] = scale.rows.filter(
          (r) =>
            r.scale === multiplier &&
            r.historyLimit === history &&
            r.id === c.id,
        );
        assert.equal(rows.length, scale.repetitions);
        lines.push(
          `| ${multiplier}× / ${rows[0].runs.toLocaleString("en-US")} | ${label(c.id)} | ${history} | ${range(rows.map((r) => r.loadMs))} | ${range(rows.map((r) => r.lookupMs))} | ${range(rows.map((r) => r.editMs))} | ${f(q(rows.map((r) => r.loadedBytes)) / 1e6)} / ${f(q(rows.map((r) => r.editedBytes)) / 1e6)} |`,
        );
      }
  lines.push(
    "",
    "Times are median [minimum–maximum], including every outlier. Some first-run trials slowed by roughly 5–6× across load, lookup and mutation together. The cause was not established; memory remained much more stable. Treat timing as a noisy scaling diagnostic, not a reliable production speed ranking.",
    "",
  );
  if (scaleRecheck) {
    lines.push(
      "### Identical full rerun: no samples discarded",
      "",
      "The entire matrix was repeated unchanged to check the suspicious timing swings. Both complete raw runs are retained; the second run does not replace the first. Each cell is a five-trial median [minimum–maximum] in milliseconds.",
      "",
      "| Scale | Container | Load: original | Load: rerun | 200 edits: original | 200 edits: rerun |",
      "| --- | --- | ---: | ---: | ---: | ---: |",
    );
    for (const multiplier of scale.scales)
      for (const history of scale.historyLimits)
        for (const c of scale.candidates) {
          const original: ScaleResults["rows"] = scale.rows.filter(
            (r) =>
              r.scale === multiplier &&
              r.historyLimit === history &&
              r.id === c.id,
          );
          const repeated: ScaleResults["rows"] = scaleRecheck.rows.filter(
            (r) =>
              r.scale === multiplier &&
              r.historyLimit === history &&
              r.id === c.id,
          );
          assert.equal(repeated.length, scaleRecheck.repetitions);
          lines.push(
            `| ${multiplier}×, history ${history} | ${label(c.id)} | ${range(original.map((r) => r.loadMs))} | ${range(repeated.map((r) => r.loadMs))} | ${range(original.map((r) => r.editMs))} | ${range(repeated.map((r) => r.editMs))} |`,
          );
        }
    lines.push(
      "",
      "[Original scale raw data](results/exploration/scale.json) · [Complete rerun raw data](results/exploration-scale-recheck/scale.json)",
      "",
    );
  }
  for (const control of [scaleProcess, scaleCPU])
    if (control) {
      const explicitCPU = control === scaleCPU;
      lines.push(
        explicitCPU
          ? "### Explicit CPU-rate control"
          : "### Browser-process isolation control",
        "",
        explicitCPU
          ? "A fourth full matrix repeats the fresh-process control with one additional setting: CDP CPU throttling is explicitly set to 1× before each sample's baseline. All inputs, implementations, order and launch flags are unchanged. Several-fold variation remained, this time with slower early samples and faster later ones: explicitly setting 1× did not eliminate the instability. Every sample is retained. The cause is unresolved; these diagnostics cannot support a dependable speed ranking."
          : "A third full matrix keeps the implementations, workloads, order and launch flags unchanged, but launches a new browser process for every sample. Launch/close remain outside clocks. Several-fold slowing still occurred: new processes alone did not resolve it. The underlying OS/browser cause is not established. Keep this cold-process diagnostic separate from the warm load/render results.",
        "",
        "| Scale | Container | Load ms [range] | 256 lookups ms [range] | 200 edits ms [range] | Loaded / edited MB |",
        "| --- | --- | ---: | ---: | ---: | ---: |",
      );
      for (const multiplier of control.scales)
        for (const history of control.historyLimits)
          for (const c of control.candidates) {
            const rows: ScaleResults["rows"] = control.rows.filter(
              (r) =>
                r.scale === multiplier &&
                r.historyLimit === history &&
                r.id === c.id,
            );
            assert.equal(rows.length, control.repetitions);
            lines.push(
              `| ${multiplier}×, history ${history} | ${label(c.id)} | ${range(rows.map((r) => r.loadMs))} | ${range(rows.map((r) => r.lookupMs))} | ${range(rows.map((r) => r.editMs))} | ${f(q(rows.map((r) => r.loadedBytes)) / 1e6)} / ${f(q(rows.map((r) => r.editedBytes)) / 1e6)} |`,
            );
          }
      lines.push(
        "",
        explicitCPU
          ? "[Explicit CPU-rate control raw data](results/exploration-scale-cpu1/scale.json)"
          : "[Fresh-process control raw data](results/exploration-scale-process/scale.json)",
        "",
      );
    }
  lines.push("", "</details>", "");
}
lines.push(
  "## Method, limits and reproduction",
  "",
  `Primary browser run started ${browser.generatedAt}: Chromium ${browser.browser}, Playwright ${browser.playwright}, ${browser.cpu}, ${browser.platform}, CPU rate ${browser.cpuRate}×. Fixture: ${browser.documentCharacters.toLocaleString("en-US")} visible characters, ${browser.paragraphs.toLocaleString("en-US")} paragraphs, ${browser.runs.toLocaleString("en-US")} runs. Four documents are four copies of one Kleppmann trace, not four independently sampled production documents.`,
  "",
  `Load comparison: ${ids.length} cases × 2 document counts × 5 fresh-context rounds × 20 timed replacement loads = **${completion.samples.toLocaleString("en-US")} warm samples**, shuffled case order and no discarded outliers. Cold loads are stored separately. ${browser.rows.reduce((n, r) => n + r.gc.length, 0)} separately traced loads, ${browser.rows.reduce((n, r) => n + r.memory.length, 0)} separate memory measurements, ${browser.rows.reduce((n, r) => n + r.editSamples.length, 0)} short edit/export batches. Backing-storage calibration and traced paint checks passed. Session comparison: ${sessions.rows.length} fresh-context trajectories, three workloads × two history limits × three repetitions per candidate, four actual editors each.`,
  "",
  "Loaded and edited ID snapshots are checked against the reference IdList; session checkpoints verify visible state and actual rendered paragraphs. Source JSON, generated IDs, reference lists and expected text are prepared outside timed loading/operation intervals. Session calls receive edit instructions, but no reference list remains retained when after-GC memory is read. Primary load timings are untraced; load memory/GC passes are separate. Sessions instead combine untraced timed segments with forced-GC memory checkpoints between them. Session individual operations include timing probes, so very small per-operation differences should not be overinterpreted.",
  "",
  "The report does not establish full API parity, real production document distributions, remote merges, full editor undo behavior, exact peak memory, low-end-device performance, concurrent tabs, or Atlas storage savings after migration. The structured/opaque Mongo comparison is controlled representation testing. Choosing a compressor on a local standalone does not establish whether or how your Atlas deployment can change it.",
  "",
  "The commands below record every published run from the repository root, including output names and sample counts. Use Node 24 and the repository’s installed dependencies; run sequentially on an otherwise idle machine. **Do not execute them over the published results.** Preserve those files and use fresh output names for a new experiment (updating the report’s input paths for that rerun), or reproduce in a separate disposable checkout with empty result targets. Do not run diagnostics concurrently with primary timing:",
  "",
  "```sh",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json node --import tsx --test benchmarks/src/browser/*.test.ts benchmarks/src/full_picture/codecs.test.ts",
  "",
  "# Primary structured-ID browser comparison: all 31 configurations.",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration BROWSER_ID_MODEL=structured BROWSER_DOCUMENTS=1,4 BROWSER_ROUNDS=5 BROWSER_TRIALS=20 BROWSER_SWITCHES=8 BROWSER_MEMORY_TRIALS=3 BROWSER_CPU_RATE=1 node --import tsx benchmarks/src/browser/exploration-run.ts",
  "",
  "# Actual opaque 8-character input IDs: all 21 compatible configurations.",
  `TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration-opaque8 BROWSER_ID_MODEL=opaque8 BROWSER_DOCUMENTS=4 BROWSER_ROUNDS=5 BROWSER_TRIALS=20 BROWSER_SWITCHES=8 BROWSER_MEMORY_TRIALS=3 BROWSER_CPU_RATE=1 BROWSER_CASES=${ids.filter((id) => !["F06", "F08"].includes(format(id).id)).join(",")} node --import tsx benchmarks/src/browser/exploration-run.ts`,
  "",
  "# Sustained editing: four editors, all three workloads, both history limits.",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration SESSION_DOCUMENTS=4 SESSION_TRIALS=3 SESSION_OPERATIONS=2000 SESSION_WORKLOADS=local,distributed,new-bunches node --import tsx benchmarks/src/browser/session-run.ts",
  "",
  "# Actual opaque-ID sustained sessions: the seven fixed compatible containers.",
  `TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration-opaque8 BROWSER_ID_MODEL=opaque8 SESSION_DOCUMENTS=4 SESSION_TRIALS=3 SESSION_OPERATIONS=2000 SESSION_WORKLOADS=local,distributed,new-bunches SESSION_CASES=${opaqueSessionIds.join(",")} node --import tsx benchmarks/src/browser/session-run.ts`,
  "",
  "# Synthetic scaling, no editor/rendering; selected cases and sample counts.",
  `TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration SCALE_MULTIPLIERS=${(scale?.scales ?? [1, 4, 16]).join(",")} SCALE_HISTORY_LIMITS=${(scale?.historyLimits ?? [0]).join(",")} SCALE_TRIALS=${scale?.repetitions ?? 5} SCALE_CASES=${(scale?.candidates.map((c) => c.id) ?? ["objects", "omit", "client", "f05-flat-owned-128", "f08-flat-owned-128", "f08-tree-owned-128", "f01-rows-owned-128", "f07-flat-owned-128"]).join(",")} node --import tsx benchmarks/src/browser/exploration-scale.ts`,
  "",
  "# Identical full scaling recheck; original results remain untouched.",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration-scale-recheck node --import tsx benchmarks/src/browser/exploration-scale.ts",
  "",
  "# Isolation control: new browser process per sample, outside all clocks.",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration-scale-process SCALE_BROWSER_ISOLATION=process node --import tsx benchmarks/src/browser/exploration-scale.ts",
  "",
  "# Same fresh-process control, with CPU throttling explicitly disabled.",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json EXPLORATION_OUTPUT=exploration-scale-cpu1 SCALE_BROWSER_ISOLATION=process SCALE_CPU_RATE=1 node --import tsx benchmarks/src/browser/exploration-scale.ts",
  "",
  "# Generate only after both Mongo datasets and all browser/session runs complete.",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json node --import tsx benchmarks/src/browser/exploration-report.ts",
  "```",
  "",
  "Preserve existing raw results before a new run; use a fresh EXPLORATION_OUTPUT directory for browser/session/scaling reruns. This report intentionally reads the fixed published exploration directory and refuses incomplete or mismatched input. The Mongo script additionally refuses an existing result file and any nonempty target database. Mongo reproduction requires a **new local standalone for each dataset** on loopback port 27186, with a freshly created directory matching /private/tmp/articulated-exploration-mongo-*. It verifies dbPath, port and bind address before any writes. Do not point it at Atlas, a production URI or an existing data directory.",
  "",
  "```sh",
  "# After starting an isolated local server on the verified fresh STRUCTURED path:",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json ARTICULATED_EXPLORATION_DBPATH=/private/tmp/articulated-exploration-mongo-STRUCTURED_UNIQUE ARTICULATED_EXPLORATION_DATASET=structured node --import tsx benchmarks/src/browser/exploration-mongo.ts",
  "# Stop that isolated server, preserve its files, and start a NEW empty server",
  "# on port 27186 with a different fresh OPAQUE path before this command:",
  "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json ARTICULATED_EXPLORATION_DBPATH=/private/tmp/articulated-exploration-mongo-OPAQUE_UNIQUE ARTICULATED_EXPLORATION_DATASET=opaque8 node --import tsx benchmarks/src/browser/exploration-mongo.ts",
  "```",
  "",
  "There are no destructive cleanup commands here. Preserve the isolated database files for audit or remove them deliberately after verifying their exact paths. The saved Mongo raw files contain the actual temporary paths and command outcomes.",
  "",
  "[Browser raw data](results/exploration/browser.json) · [Completion record](results/exploration/complete.json) · [Session raw data](results/exploration/sessions.json) · [Structured Mongo measurements](results/exploration/mongo.json) · [Opaque-ID Mongo measurements](results/exploration/mongo-opaque8.json) · [All candidate definitions](src/browser/exploration-candidates.ts) · [Session workload](src/browser/session-workload.ts) · [Browser harness](src/browser/page-runtime.ts) · [F08 page tree](src/browser/paged-f08.ts) · [F05 native columns](src/browser/native-f05.ts) · [Report generator](src/browser/exploration-report.ts)",
  "",
);
fs.writeFileSync(
  path.resolve(__dirname, "../../exploration.md"),
  lines.join("\n"),
);
