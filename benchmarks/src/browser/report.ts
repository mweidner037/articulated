import { EJSON } from "bson";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { example } from "../full_picture/fixture";
import { candidates } from "./candidates";
import { comparisonChart } from "./charts";
import { mongoState, storageCandidates } from "./mongo";
import type { BrowserSample } from "./page";
import type { analyzeTrace } from "./trace";

interface Row {
  id: string;
  shape: string;
  encoding: string;
  path: string;
  documents: number;
  samples: (BrowserSample & { round: number })[];
  cold: BrowserSample[];
  gc: ReturnType<typeof analyzeTrace>;
  memory: {
    observedHighWaterDelta: number;
    retainedDelta: number;
    sampledAllocation: number;
    domNodes: number;
  }[];
}
const dir = path.resolve(__dirname, "../../results/browser");
const data = JSON.parse(
  fs.readFileSync(path.join(dir, "browser.json"), "utf8"),
) as {
  complete: boolean;
  generatedAt: string;
  browser: string;
  cpu: string;
  cpuRate: number;
  rounds: number;
  trials: number;
  switches: number;
  memoryTrials: number;
  documentCharacters: number;
  paragraphs: number;
  rows: Row[];
};
assert(data.complete, "Do not publish a partial benchmark");
const mongo = JSON.parse(
  fs.readFileSync(path.join(dir, "mongo.json"), "utf8"),
) as {
  version: string;
  documents: number;
  rows: {
    id: string;
    compressor: string;
    storageBytes: number;
    freeBytes: number;
  }[];
};
const mean = (values: number[]) =>
  values.reduce((a, b) => a + b, 0) / values.length;
const quantile = (values: number[], q: number) =>
  [...values].sort((a, b) => a - b)[
    Math.max(0, Math.ceil(values.length * q) - 1)
  ];
const metric = (r: Row, key: keyof BrowserSample) =>
  mean(r.samples.map((s) => s[key]));
const mem = (r: Row, key: keyof Row["memory"][number]) =>
  quantile(
    r.memory.map((s) => s[key]),
    0.5,
  ) / 1e6;
const fmt = (n: number) => n.toFixed(1);
const workloads = [...new Set(data.rows.map((r) => r.documents))];
for (const count of workloads) {
  const rows = data.rows.filter((r) => r.documents === count);
  assert.deepEqual(
    rows.map((r) => r.id),
    candidates.map((c) => c.id),
  );
  for (const r of rows) {
    assert.equal(r.samples.length, data.rounds * data.trials);
    assert.equal(r.gc.length, data.switches);
    assert.equal(r.memory.length, data.memoryTrials);
    assert(r.gc.every((g) => g.paintEvents > 0));
    for (const s of r.samples)
      assert(
        Math.abs(
          s.total - s.decode - s.hydrate - s.editor - s.layout - s.frameWait,
        ) < 0.001,
      );
  }
}
const p95 = (r: Row) =>
  quantile(
    r.samples.map((s) => s.total),
    0.95,
  );
const byP95 = (rows: Row[]) =>
  [...rows].sort((a, b) => p95(a) - p95(b) || a.id.localeCompare(b.id));
const logicalRows = (n: number) =>
  data.rows.filter(
    (r) => r.documents === n && r.encoding === "JSON" && r.path === "objects",
  );
function chart(rows: Row[], scope: string) {
  return comparisonChart(
    `${rows[0].documents} documents: ${scope} — browser speed`,
    "Sorted by complete-ready P95, fastest first. ID loading is part of total, not additional time.",
    ["Complete-ready P95 (ms)", "ID-loading P95 (ms)", "GC pause mean (ms)"],
    byP95(rows).map((r) => ({
      label: r.shape,
      detail: `${r.encoding} / ${r.path}`,
      values: [
        p95(r),
        quantile(
          r.samples.map((s) => s.decode + s.hydrate),
          0.95,
        ),
        mean(r.gc.map((g) => g.gcMs)),
      ],
    })),
    `ID loading = decode + translate + build tree. GC: separate pass. P95 from ${data.rounds * data.trials} samples${data.rounds * data.trials < 20 ? " is the maximum" : "; empirical estimate"}.`,
  );
}
function memoryChart(rows: Row[], scope: string) {
  return comparisonChart(
    `${rows[0].documents} documents: ${scope} — JS memory`,
    "Sorted by retained memory, smallest first. Includes JS heap and ArrayBuffer backing stores.",
    [
      "Retained median (MB)",
      "Observed high-water (MB)",
      "Sampled allocations (MB)",
    ],
    [...rows]
      .sort(
        (a, b) =>
          mem(a, "retainedDelta") - mem(b, "retainedDelta") ||
          a.id.localeCompare(b.id),
      )
      .map((r) => ({
        label: r.shape,
        detail: `${r.encoding} / ${r.path}`,
        values: [
          mem(r, "retainedDelta"),
          Math.max(...r.memory.map((m) => m.observedHighWaterDelta)) / 1e6,
          mem(r, "sampledAllocation"),
        ],
      })),
    "Separate scales; do not add these values. High-water is sampled, not an exact peak. Small differences may be noise.",
  );
}
function storageChart(binary: boolean) {
  const rows = storageCandidates
    .filter((c) => binary || c.encoding === "JSON")
    .map((c) => ({
      label: c.shape,
      detail: c.encoding === "JSON" ? "Ordinary BSON fields" : c.encoding,
      values: ["snappy", "zstd"].map((compressor) => {
        const row = mongo.rows.find(
          (r) => r.id === c.id && r.compressor === compressor,
        );
        assert(row);
        return row.storageBytes / mongo.documents / 1000;
      }),
    }))
    .sort((a, b) => a.values[0] - b.values[0]);
  return comparisonChart(
    binary
      ? "Secondary optimization: Mongo encodings"
      : "Logical formats: Mongo storage",
    "Sorted by Snappy collection bytes per document, smallest first. Zstd shown separately.",
    ["Snappy (KB / document)", "Zstd (KB / document)"],
    rows,
    "Actual collection files after compact + checkpoint. Indexes and shared server overhead excluded.",
  );
}
const largest = Math.max(...workloads);
const rowFor = (id: string) =>
  data.rows.find((r) => r.id === id && r.documents === largest)!;
const disk = (id: string) => {
  const r = mongo.rows.find((r) => r.id === id && r.compressor === "snappy");
  assert(r);
  return fmt(r.storageBytes / mongo.documents / 1000);
};
const outliers = data.rows.flatMap((r) =>
  r.samples
    .filter(
      (s) =>
        s.total >
        3 *
          quantile(
            r.samples.map((s) => s.total),
            0.5,
          ),
    )
    .map((s) => s.total),
);
const lines = [
  "# Choose the logical format first: browser speed, Mongo storage, and JS memory",
  "",
  "Draft experiment. Start with the nine logical JSON formats through the same object loader. Compare browser speed, physical Mongo storage, and JS memory separately. Direct loading and binary encodings are secondary optimizations below, not competing logical formats.",
  "",
  `Measured ${data.generatedAt.slice(0, 10)} in Chromium ${data.browser} on ${data.cpu}, CPU rate ${data.cpuRate}×. Each document has ${data.documentCharacters.toLocaleString("en-US")} characters, ${data.paragraphs.toLocaleString("en-US")} paragraphs, and the same 12,091 ID runs. This is a **real, controlled ProseMirror editor in Chromium**, not the production application. The four-document case mounts four copies of that same document; it is a scaling test, not a production corpus.`,
  "",
  "## Three recommendations, depending on what matters most",
  "",
  "**My default: pursue ordinary columns with omitted counters, then validate them on our actual documents and IDs.** This is a logical-format choice, with ordinary Mongo arrays and JSON in the browser. Binary is optional follow-up work, not part of this recommendation. These are recommendations for what to pursue next, not approval to migrate production from a single synthetic workload.",
  "",
  `1. **Mongo storage and a balanced improvement → Columns + omit.** It has the smallest Snappy collection among the nine ordinary-field formats: ${disk("omit")} versus ${disk("objects")} KB/doc for original objects (about 14% less). Four-document retained JS memory also falls from ${fmt(mem(rowFor("objects"), "retainedDelta"))} to ${fmt(mem(rowFor("omit"), "retainedDelta"))} MB (about 12% less). Ready P95 is ${fmt(p95(rowFor("omit")))} versus ${fmt(p95(rowFor("objects")))} ms; do not count that small difference as a proven speedup. Tradeoff: a translation step and omitted-counter reconstruction. This recommendation targets your current Snappy setup; Zstd has a different storage ranking.`,
  "",
  `2. **Temporary browser memory pressure → Client dictionary + omit, with a direct JSON loader, only if IDs actually have shared client/sequence structure.** Observed four-document high-water memory is ${fmt(Math.max(...rowFor("client-direct").memory.map((m) => m.observedHighWaterDelta)) / 1e6)} MB versus ${fmt(Math.max(...rowFor("objects").memory.map((m) => m.observedHighWaterDelta)) / 1e6)} MB for original objects. Retained memory is ${fmt(mem(rowFor("client-direct"), "retainedDelta"))} MB—essentially the same as Columns + omit, not a further steady-state saving. Tradeoffs: a custom direct loader and ${disk("client")} KB/doc in Snappy, more than original objects. The high-water measurement is sampled, not an exact peak or proof of fewer GC stalls. **For independent opaque 8-character nanoids, do not adopt this split-ID format based on this fixture; use recommendation 1 instead.** If retained memory alone is the priority, recommendation 1 is also the simpler choice.`,
  "",
  `3. **Browser loading speed, accepting a Mongo storage penalty → Investigate dictionary columns through the existing object loader.** It has the lowest observed four-document JSON/object ready P95: ${fmt(p95(rowFor("full")))} versus ${fmt(p95(rowFor("objects")))} ms, with ID-loading P95 19.9 versus 25.4 ms. Tradeoff: ${disk("full")} versus ${disk("objects")} KB/doc in Snappy (about 36% more). Do not ship on this timing ranking yet: the single-document winner differs, and P95 here is the maximum of only 18 samples. Run a larger, representative timing study first. This is not a recommendation for binary or for the direct loader.`,
  "",
  "**If the goal is a large reduction in retained editor memory, none of these formats establishes that.** Every loader still builds the existing mutable IdList tree. A native column-backed editing representation needs its own implementation and benchmark. The measured percentages above come from Matthew’s structured-ID trace; opaque nanoid workloads need their own run before a migration decision.",
  "",
  "## Evidence and limits behind those recommendations",
  "",
  `- **Tail ranking is fragile here.** There are only ${data.rounds * data.trials} primary samples per row. With nearest-rank P95, 18 samples means P95 is the maximum. ${outliers.length} samples exceed three times their row median (${outliers.map(fmt).join(", ")} ms); none were removed. A single unexplained stall can change the ranking. More repetitions and a representative corpus are needed before selecting on tail latency.`,
  "",
  "## What happened to Build IDs and Layout?",
  "",
  "**Layout does the same logical work in every row:** identical editor content, DOM, and forced-layout calls. Across the nine JSON/object formats in the four-document case, median layout ranges from 14.1–14.6 ms. Its elapsed time is not mathematically constant: scheduling, GC, and runtime noise can affect it. It is no longer a colored segment or a claimed format benefit. It remains inside the measured complete-ready total; subtracting it would no longer answer how long the document takes to render.",
  "",
  "**Build IDs was a misleading label.** That interval includes format-specific translation plus construction of the shared final editing tree. Its four-document medians range from 15.3–18.6 ms across the JSON/object options. We did not independently time translation and common tree building, so we cannot honestly subtract a constant tree-construction cost. The ID-loading column measures decode + translation + tree construction, excluding editor creation, layout, and frame waiting. Its P95 is calculated from each sample’s sum—not by adding stage percentiles.",
  "",
  "## 1. Logical JSON formats",
  "",
  "Hold the loader path fixed: ordinary JSON inputs, object adapter, same final editor. Each speed chart is sorted by complete-ready P95 ascending. ID-loading P95 is a diagnostic alongside that total, not added to it. GC comes from a separate trace pass. Storage and memory have their own charts, sorted smallest first; metric scales are independent.",
  "",
  `Each row has ${data.rounds * data.trials} warm timing samples across ${data.rounds} fresh browser contexts, ${data.switches} traced document replacements without forced GC between them, and ${data.memoryTrials} separately profiled memory runs. P95 is an empirical sample percentile, not a reliable population-tail estimate from this small run. Raw cold-start samples and per-round results are retained.`,
  "",
];
function browserSection(n: number, rows: Row[], suffix: string, scope: string) {
  rows = byP95(rows);
  fs.writeFileSync(
    path.join(dir, `browser-${n}${suffix}.svg`),
    chart(rows, scope),
  );
  fs.writeFileSync(
    path.join(dir, `memory-${n}${suffix}.svg`),
    memoryChart(rows, scope),
  );
  lines.push(
    `### ${n} document(s): ${scope}`,
    "",
    `![Browser speed sorted by complete-ready P95](results/browser/browser-${n}${suffix}.svg)`,
    "",
    `![JS memory sorted by retained bytes](results/browser/memory-${n}${suffix}.svg)`,
    "",
    "| Logical format | Encoding / path | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const r of rows)
    lines.push(
      `| ${r.shape} | ${r.encoding} / ${r.path} | ${fmt(metric(r, "total"))} | ${fmt(
        quantile(
          r.samples.map((s) => s.total),
          0.5,
        ),
      )} | ${fmt(p95(r))} | ${fmt(
        quantile(
          r.samples.map((s) => s.decode + s.hydrate),
          0.95,
        ),
      )} | ${fmt(mean(r.cold.map((s) => s.total)))} | ${fmt(mean(r.gc.map((g) => g.gcMs)))} / ${fmt(Math.max(...r.gc.map((g) => g.longestGC)))} | ${fmt(Math.max(...r.memory.map((m) => m.observedHighWaterDelta)) / 1e6)} | ${fmt(mem(r, "retainedDelta"))} | ${fmt(mem(r, "sampledAllocation"))} | ${fmt(
        quantile(
          r.samples.map((s) => s.edit),
          0.95,
        ),
      )} |`,
    );
  lines.push("");
}
fs.writeFileSync(path.join(dir, "storage.svg"), storageChart(false));
lines.push(
  "### Mongo storage: logical formats",
  "",
  "Ordinary BSON objects and arrays, not JSON strings. Same compact/checkpoint protocol for Snappy and Zstd. The physical-storage table and exact stored examples are below.",
  "",
  "![Physical Mongo storage, smallest Snappy first](results/browser/storage.svg)",
  "",
);
for (const n of [...workloads].sort((a, b) => b - a))
  browserSection(n, logicalRows(n), "", "logical JSON formats");
lines.push(
  "## 2. Secondary optimization: direct JSON loading",
  "",
  "Same JSON structures, with and without an intermediate object-run array. This isolates the loader change from encoding. Mongo storage is unchanged. Direct loading still builds the same final editing tree.",
  "",
);
for (const n of [...workloads].sort((a, b) => b - a))
  browserSection(
    n,
    data.rows.filter(
      (r) =>
        r.documents === n &&
        ["client", "client-direct", "full", "full-direct"].includes(r.id),
    ),
    "-direct",
    "direct JSON loading",
  );
lines.push(
  "## 3. Secondary optimization: binary encoding",
  "",
  "Only after choosing a logical structure: compare its JSON row against its binary encoding with the same loader path. JSON baselines are repeated here for reference; this is not a new logical-format contest. No network-size comparison is used.",
  "",
);
fs.writeFileSync(path.join(dir, "storage-encodings.svg"), storageChart(true));
lines.push(
  "![Mongo encodings and ordinary-field baselines](results/browser/storage-encodings.svg)",
  "",
);
for (const n of [...workloads].sort((a, b) => b - a))
  browserSection(
    n,
    data.rows.filter((r) => r.documents === n),
    "-encodings",
    "encodings and JSON baselines",
  );
lines.push(
  "### Matched encoding and loader comparisons",
  "",
  "These are changes in measured means, not significance claims. The three round deltas show how reproducible the direction was across fresh contexts. Negative means faster.",
  "",
  "| Documents | Same logical structure | Comparison | Ready change ms | Per-round changes ms | Kept change MB |",
  "|---:|---|---|---:|---|---:|",
);
for (const n of workloads)
  for (const [a, b] of [
    ["client", "client-proto"],
    ["client-direct", "client-proto-direct"],
    ["full", "binary-adapter"],
    ["full-direct", "binary-direct"],
    ["full-direct", "bit-direct"],
    ["binary-adapter", "binary-direct"],
    ["bit-adapter", "bit-direct"],
  ]) {
    const x = data.rows.find((r) => r.documents === n && r.id === a)!,
      y = data.rows.find((r) => r.documents === n && r.id === b)!;
    const roundDiff = Array.from({ length: data.rounds }, (_, i) =>
      fmt(
        mean(y.samples.filter((s) => s.round === i).map((s) => s.total)) -
          mean(x.samples.filter((s) => s.round === i).map((s) => s.total)),
      ),
    );
    lines.push(
      `| ${n} | ${x.shape} | ${x.encoding}/${x.path} → ${y.encoding}/${y.path} | ${fmt(metric(y, "total") - metric(x, "total"))} | ${roundDiff.join(", ")} | ${fmt(mem(y, "retainedDelta") - mem(x, "retainedDelta"))} |`,
    );
  }
lines.push(
  "",
  "## Physical Mongo storage: all measurements",
  "",
  `MongoDB ${mongo.version}; ${mongo.documents} documents per layout/compressor, with distinct client dictionaries. Actual allocated collection-file bytes after compact, checkpoint, another compact, and locked fsync. Indexes and shared server overhead excluded; allocated free pages may remain. No logical-BSON or wire-size proxy.`,
  "",
  "JSON rows mean ordinary BSON objects/arrays in Mongo, **not JSON strings**. Protobuf rows mean one BSON Binary. Numeric-column encodings mean a dictionary plus separate BSON Binary fields. The BSON browser-response variant for objects/tuples uses the same ordinary Mongo layout; it does not imply storing a second blob. Direct/object loader paths also share storage.",
  "",
  "| Logical structure | Mongo representation | Snappy KB/doc | Zstd KB/doc |",
  "|---|---|---:|---:|",
);
for (const c of storageCandidates) {
  const size = (compressor: string) => {
    const r = mongo.rows.find(
      (r) => r.id === c.id && r.compressor === compressor,
    );
    assert(r);
    return fmt(r.storageBytes / mongo.documents / 1000);
  };
  lines.push(
    `| ${c.shape} | ${c.encoding === "JSON" ? "Ordinary BSON" : c.encoding} | ${size("snappy")} | ${size("zstd")} |`,
  );
}
lines.push(
  "",
  "## Exact logical structures and Mongo examples",
  "",
  "Every encoding in a group round-trips to the **same** logical JSON. This is asserted for empty and example inputs in unit tests, and for the full fixture before browser measurement. The browser additionally checks all saved runs, visible paragraph text, and a successful first edit.",
  "",
);
for (const shape of [...new Set(candidates.map((c) => c.shape))]) {
  const group = storageCandidates.filter((c) => c.shape === shape);
  lines.push(
    `<details><summary>${shape}: JSON and actual Mongo representations</summary>`,
    "",
  );
  for (const c of group)
    lines.push(
      `### ${c.encoding === "JSON" ? "Ordinary Mongo fields" : c.encoding}`,
      "",
      "```json",
      EJSON.stringify({ state: mongoState(c, example) }, null, 2, {
        relaxed: true,
      }),
      "```",
      "",
    );
  lines.push("</details>", "");
}
lines.push(
  "## What is included—and what is not",
  "",
  "- **Start:** response bytes and document JSON have arrived; fetch/network/transport gzip and server work are excluded. JSON UTF-8 decoding and parsing, protobuf/BSON decoding, typed-array alignment copies, ID translation/tree building, document-JSON parsing, ProseMirror model/view creation, prior editor destruction, DOM creation and forced layout are inside the timer.",
  "- **End:** two requestAnimationFrame callbacks after synchronous work. A rendering opportunity passes between them; this is a paint-ready proxy, not physical display scan-out. The separate Chrome trace must show at least one Paint event inside every measured load window or the run fails. Frame scheduling can hide sub-frame CPU improvements. The frame-wait segment includes asynchronous browser work and idle scheduling, not only paint CPU.",
  "- **First edit:** inserts a character into both the IdList and ProseMirror document, focuses the editor, then waits through the same frame boundary. It is measured separately after load; it is not added to ready time. This minimal editor has no production plugins, decorations, media, network, React integration, or application-specific initialization.",
  "- **GC:** union of renderer-main-thread MinorGC/MajorGC intervals intersecting each load window, without double-counting nested spans. A forced-GC canary outside the windows verifies that this browser emits the expected events. No forced GC occurs between the traced replacement loads. Concurrent/background GC work is not counted as a main-thread pause. Tracing adds overhead, so trace-pass GC is diagnostic, not a component subtracted from the untraced totals.",
  "- **Memory:** Runtime.getHeapUsage usedSize + backingStorageSize, relative to the same warmed page with editors cleared and garbage collected. An 8 MiB ArrayBuffer calibration verifies backing-byte inclusion and guards against double counting. Inputs are released after load; the final editor and first edit remain. Kept is the median of post-GC increments. It includes JS wrappers and backing stores, not total renderer RSS, GPU memory, or all native DOM/layout allocations. Raw embedder heap and DOM-node counts are retained separately.",
  "- **Observed high-water is NOT an exact peak.** A separate intrusive pass samples before decode and after decode, hydration, editor creation, layout and readiness. It can miss intra-stage peaks; samples also include profiler/probe overhead and garbage awaiting collection. The chart reports the largest observed increment across the memory runs. Do not rank close differences as precise transient-memory savings.",
  "- **Allocation pressure:** a separate HeapProfiler sampling pass at 16 KiB, including objects collected by minor and major GC. It estimates JS allocations over load plus first edit, including instrumentation overhead; it is not exact allocation volume or a measurement of all ArrayBuffer/native allocations. It is not added to retained/high-water bytes. Timing runs have neither heap sampling nor memory probes.",
  "- **Fairness:** same fixture, same editor, same viewport, same browser and CPU setting; format/workload order deterministically shuffled each round. Each timing block has a fresh context, one recorded cold load, two warmups, a GC before the block, then uninterrupted replacement loads. The result is a controlled case study on one machine/browser/structured-ID trace, not a device-independent ranking or production latency promise. All variants still create the existing editing tree; a native column-backed mutable library would require a different implementation and benchmark.",
  "- **Format limits:** the fixture uses Matthew’s structured client/sequence IDs, not independent opaque 8-character nanoids. Split-ID results depend on that sharing. Packed columns use 13-bit dictionary indexes, 11-bit starts, and 12-bit zigzag counts: at most 8,192 dictionary entries, starts ≤ 2,047, live counts ≤ 2,047, and deleted magnitudes ≤ 2,048; overflow throws rather than widening. Fixed binary uses uint32/int32; protobuf inherits its schema’s 32-bit limits. These are experimental codecs, not hardened production input decoders.",
  "",
  "Protocol references: [Runtime heap accounting](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage), [heap allocation sampling](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/#method-startSampling), [Chrome tracing](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/).",
  "",
  "## Reproduce",
  "",
  "Use Node 24 and pnpm 11. Run browser measurements without concurrent builds, Mongo, or other heavy workloads. The output is marked incomplete until every check passes; the report refuses partial runs.",
  "",
  "```sh",
  "pnpm install --frozen-lockfile",
  "pnpm --filter benchmarks exec playwright install chromium",
  "pnpm --filter articulated build",
  "pnpm --filter benchmarks test",
  "BROWSER_ROUNDS=3 BROWSER_TRIALS=6 pnpm --filter benchmarks browser:run",
  "```",
  "",
  "The runner binds only loopback on a random port and shuts down its browser/server. Optional BROWSER_CPU_RATE controls emulated CPU slowdown (not equivalent to a specific device); BROWSER_DOCUMENTS, BROWSER_ROUNDS, BROWSER_TRIALS, BROWSER_SWITCHES, BROWSER_MEMORY_TRIALS, BROWSER_CASES and BROWSER_EXECUTABLE control reruns. Partial-case smoke runs are useful for development but cannot generate the full report.",
  "",
  "After the browser finishes, run Mongo separately:",
  "",
  "```sh",
  "benchmark_dbpath=$(mktemp -d /private/tmp/articulated-browser-mongo.XXXXXX)",
  'mongod --dbpath "$benchmark_dbpath" --port 27185 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25',
  "# In another terminal, use that exact dbPath:",
  "ARTICULATED_BROWSER_DBPATH=/absolute/path pnpm --filter benchmarks browser:mongo",
  "pnpm --filter benchmarks browser:report",
  "```",
  "",
  "The Mongo runner refuses any other port/path/binding or a nonempty database and never drops data. Stop the dedicated Mongo process afterward. Results: [browser samples](results/browser/browser.json), [Mongo measurements](results/browser/mongo.json), [GC traces](results/browser/traces), [rendered editor screenshot](results/browser/rendered-editor.png). Previous Node-only measurements remain [archived separately](full_picture.md).",
  "",
);
// Preserve exact numbers without forcing readers through large tables.
const report = lines.join("\n").replace(/^(?:\|[^\n]*(?:\n|$))+/gm, (table) => {
  const rows = table.trim().split("\n").length - 2;
  return `<details><summary>Show numeric results (${rows} rows)</summary>\n\n${table.trimEnd()}\n\n</details>\n`;
});
fs.writeFileSync(path.resolve(__dirname, "../../browser.md"), report);
