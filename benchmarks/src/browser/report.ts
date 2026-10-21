import { EJSON } from "bson";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { example } from "../full_picture/fixture";
import { candidates } from "./candidates";
import { comparisonChart } from "./charts";
import { formatLabel, formats, internalFormat, loaderName } from "./formats";
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
const measuredDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date(data.generatedAt));
const workloads = [...new Set(data.rows.map((r) => r.documents))];
for (const count of workloads) {
  const rows = data.rows.filter((r) => r.documents === count);
  assert.deepEqual(
    rows.map((r) => r.id),
    candidates.map((c) => c.id),
  );
  for (const r of rows) {
    assert.equal(r.shape, candidates.find((c) => c.id === r.id)!.shape);
    assert.equal(r.samples.length, data.rounds * data.trials);
    assert.equal(r.gc.length, data.switches);
    assert.equal(r.memory.length, data.memoryTrials);
    assert(r.gc.every((g) => g.paintEvents > 0));
    for (const s of r.samples) {
      assert(
        [s.decode, s.hydrate, s.total].every(
          (value) => Number.isFinite(value) && value >= 0,
        ),
      );
      assert(
        Math.abs(
          s.total - s.decode - s.hydrate - s.editor - s.layout - s.frameWait,
        ) < 0.001,
      );
    }
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
    `Internal format: ${internalFormat}. Sorted by complete-ready P95, fastest first.`,
    [
      "Complete-ready P95 (ms)",
      "To internal tree P95 (ms)",
      "GC pause mean (ms)",
    ],
    byP95(rows).map((r) => ({
      label: formatLabel(r.shape),
      detail: `${r.encoding} · ${loaderName(r.path)}`,
      values: [
        p95(r),
        quantile(
          r.samples.map((s) => s.hydrate),
          0.95,
        ),
        mean(r.gc.map((g) => g.gcMs)),
      ],
    })),
    `To internal tree = conversion + tree construction, excluding decode/render. GC: separate pass. P95 from ${data.rounds * data.trials} samples${data.rounds * data.trials < 20 ? " is the maximum" : "; empirical estimate"}.`,
  );
}
function memoryChart(rows: Row[], scope: string) {
  return comparisonChart(
    `${rows[0].documents} documents: ${scope} — JS memory`,
    `Internal format: ${internalFormat}. Sorted by retained JS + backing bytes, smallest first.`,
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
        label: formatLabel(r.shape),
        detail: `${r.encoding} · ${loaderName(r.path)}`,
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
      label: formatLabel(c.shape),
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
      : "Interchange formats: Mongo storage",
    "Sorted by Snappy collection bytes per document, smallest first. Zstd shown separately.",
    ["Snappy (KB / document)", "Zstd (KB / document)"],
    rows,
    "Actual collection files after compact + checkpoint. Indexes and shared server overhead excluded.",
  );
}
const largest = Math.max(...workloads);
const rowFor = (id: string) =>
  data.rows.find((r) => r.id === id && r.documents === largest)!;
const fastestJSON = byP95(logicalRows(largest))[0];
const namingExample = [
  { bunchId: "writer_0", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "writer_0", startCounter: 3, count: 2, isDeleted: true },
];
function namingExamples() {
  return [
    "### F05 versus F09: two different things to save",
    "",
    "Both are columnar stores. **F05 saves predictable start counters, but repeats the ID for every run. F09 saves repeated ID strings, but stores every start counter.** Neither changes the internal IdList tree. These are independent choices: F07 combines deduplicated IDs with reconstructed counters.",
    "",
    "For two runs of writer_0—three live entries starting at 0, then two deleted entries starting at 3—the same data looks like this. These tiny examples illustrate the layouts; they are not the measured workload.",
    "",
    ...["omit", "full"].flatMap((id) => {
      const c = candidates.find((c) => c.id === id)!;
      return [
        `**${formatLabel(c.shape)}**`,
        "",
        "```json",
        JSON.stringify(c.logical(c.decode(c.encode(namingExample))), null, 2),
        "```",
        "",
      ];
    }),
  ];
}
function formatExpansions() {
  return [
    "### Expand each format: the same data in nine layouts",
    "",
    "All nine examples below contain the same four runs: alice_0 has three live entries, bob_0 has one live entry, alice_1 has two live entries, then alice_0 has two deleted entries starting at counter 3. Structured IDs here make F06/F08 meaningful; they do not imply changing opaque nanoids. These JSON objects/arrays are also the ordinary Mongo field values, not JSON strings.",
    "",
    ...Object.entries(formats).flatMap(([key, f]) => {
      const c = candidates.find((c) => c.id === key)!;
      const decoded = c.decode(c.encode(example));
      assert.deepEqual(c.hydrate(decoded).save(), example);
      return [
        `<a id="${f.id.toLowerCase()}"></a>`,
        `<details><summary>${formatLabel(f.name)} — expand JSON</summary>`,
        "",
        f.explanation,
        "",
        "Interchange format shown below; internal format after load: **existing IdList tree**.",
        "",
        "\x60\x60\x60json",
        JSON.stringify(c.logical(decoded), null, 2),
        "\x60\x60\x60",
        "",
        ...(key === "omit"
          ? [
              "Here startCounters and startCounterIndexes are empty because every start is predictable. If alice_0 resumed at counter 8 instead of 3, this example would store startCounterIndexes: [3] and startCounters: [8]; the 3 locates the fourth run (zero-based). The other starts are still reconstructed.",
              "",
            ]
          : []),
        "</details>",
        "",
      ];
    }),
  ];
}

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
function rerunNotes(): string[] {
  const previousPath = path.join(dir, "previous/browser.json");
  if (!fs.existsSync(previousPath)) return [];
  const previous = JSON.parse(
    fs.readFileSync(previousPath, "utf8"),
  ) as typeof data;
  const prior = previous.rows.find(
    (r) => r.id === "signed" && r.documents === largest,
  )!;
  const current = rowFor("signed");
  const stats = (r: Row) => ({
    p50: fmt(
      quantile(
        r.samples.map((s) => s.total),
        0.5,
      ),
    ),
    p95: fmt(p95(r)),
    max: fmt(Math.max(...r.samples.map((s) => s.total))),
    conversion: fmt(
      quantile(
        r.samples.map((s) => s.hydrate),
        0.95,
      ),
    ),
    stalls: r.samples.filter((s) => s.total > 200).length,
  });
  const a = stats(prior),
    b = stats(current);
  return [
    "## Rerun of the suspect object-record result",
    "",
    `All 24 options were rerun, not just the suspicious row: ${data.rounds} fresh-context rounds × ${data.trials} loads = ${current.samples.length} samples per option/workload (previously ${prior.samples.length}). The loading implementation and timer boundaries are unchanged; only labels, metadata and sample count changed. Previous samples and all traces are [preserved](results/browser/previous/browser.json). No samples were filtered from either run. Mongo was not rerun: its unchanged measurements are separate from browser timing.`,
    "",
    `**${formatLabel(formats.signed.name)}, ${largest} documents:** previous complete-ready P50 / P95 / maximum: **${a.p50} / ${a.p95} / ${a.max} ms**. Rerun: **${b.p50} / ${b.p95} / ${b.max} ms**. Conversion-to-tree P95: **${a.conversion} → ${b.conversion} ms**. Loads over 200 ms: **${a.stalls}/${prior.samples.length} → ${b.stalls}/${current.samples.length}**.`,
    "",
    `The original P95 was the maximum of 18 samples; the new P95 is observation ${Math.ceil(current.samples.length * 0.95)} of ${current.samples.length}. These are different tail estimators in practice; a lower new P95 does not prove the original stall was invalid. Its cause remains unknown. The old result is superseded for comparison, not erased. The rerun retains ${outliers.length} loads exceeding three times their row median. Fresh-context round results and all raw samples remain available; none of this establishes a stable production ranking.`,
  ];
}

const lines = [
  "# Interchange formats → the existing internal IdList tree",
  "",
  "Draft exploration. **Interchange format** means the saved objects, tuples, or columnar store. **Internal format** means the live structure used for lookup and editing. Every row in this interchange-format matrix ends in the existing IdList tree. JSON versus binary is only an encoding choice, covered separately.",
  "",
  "**New: [same F08 JSON, current IdList tree versus native columnar internals](native.md).** That matched experiment implements native lookup/editing and measures loading, conversion, memory, GC and mutation costs. It keeps the wire format fixed so we can isolate the internal design. This report below keeps the internal tree fixed so we can compare interchange formats.",
  "",
  `Measured ${measuredDate} (America/New_York) in Chromium ${data.browser} on ${data.cpu}, CPU rate ${data.cpuRate}×. Each document has ${data.documentCharacters.toLocaleString("en-US")} characters, ${data.paragraphs.toLocaleString("en-US")} paragraphs, and the same 12,091 ID runs. This is a controlled ProseMirror editor, not the production application. Four documents means four copies of this trace, not four production documents.`,
  "",
  "## Read the names",
  "",
  "These names describe the **interchange** representation. A columnar store is one object containing arrays, not a different Mongo storage engine. All non-baseline options encode deletion as a negative count: -2 means two deleted IDs. That is what the old word ‘signed’ meant.",
  "",
  "Format IDs F01–F09 are stable identifiers, not ranks. The same ID is used across charts, recommendations, JSON/binary encodings, and loader paths. Expand a format below the recommendations to see its complete JSON.",
  "",
  ...Object.values(formats).map(
    (f) => `- [${formatLabel(f.name)}](#${f.id.toLowerCase()}).`,
  ),
  "",
  "**Conversion paths:** ‘Via IdList.load()’ means wire format → the run objects that IdList.load expects → the internal tree. For F01 those run objects are already the decoded shape. ‘Direct tree construction’ feeds decoded fields straight into the same tree, skipping that intermediate array. Neither changes the internal format.",
  "",
  "## Three recommendations",
  "",
  `1. **Mongo storage first: ${formatLabel(formats.omit.name)}.** This is the smallest ordinary-field option with Snappy: ${disk("omit")} versus ${disk("objects")} KB/document for the baseline. Its start counters are reconstructed from previous runs; exceptions are stored, so this is lossless. It is my default candidate for the current Snappy setup, subject to validation on actual documents.`,
  "",
  `2. **Retained browser memory first: do not choose an interchange format as a substitute for an internal redesign.** ${formatLabel(formats.omit.name)} retains ${fmt(mem(rowFor("omit"), "retainedDelta"))} MB versus ${fmt(mem(rowFor("objects"), "retainedDelta"))} MB for the baseline in this four-document run, but every option here still constructs the same editing-tree design. The [native F08 experiment](native.md) now measures indexed, chunked native editing, including the index build time, memory cost and snapshot export. It supersedes the initial slow full-rewrite prototype. Direct loaders only remove temporary conversion allocations.`,
  "",
  `3. **Browser speed first: investigate ${formatLabel(fastestJSON.shape)}, through the existing loader.** It has the lowest observed ${largest}-document complete-ready P95 among JSON interchange options: ${fmt(p95(fastestJSON))} versus ${fmt(p95(rowFor("objects")))} ms for the baseline. Conversion-to-tree P95 is ${fmt(
    quantile(
      fastestJSON.samples.map((s) => s.hydrate),
      0.95,
    ),
  )} versus ${fmt(
    quantile(
      rowFor("objects").samples.map((s) => s.hydrate),
      0.95,
    ),
  )} ms. Its Snappy storage is ${disk(fastestJSON.id)} versus ${disk("objects")} KB/document. Treat it as a candidate for a representative-corpus test, not a stable production winner. A lower interchange parse time alone is not enough; see the [separate internal-format experiment](native.md) for native columnar editing.`,
  "",
  "None of these results justifies changing independent opaque 8-character nanoids into structured IDs. The split-ID/client-sharing options require Matthew’s client/sequence structure; those measurements are not evidence for opaque nanoids. Binary stays an optional later optimization.",
  "",
  ...namingExamples(),
  "",
  ...formatExpansions(),
  "",
  "## Time spent converting to the internal format",
  "",
  "**Decode:** response bytes → decoded interchange objects/arrays. **To internal tree:** decoded interchange state → a usable IdList, including counter reconstruction, ID reconstruction, intermediate run objects when used, validation, tree nodes and indexes. This second interval is timed directly around the loader—not calculated by subtracting other measurements. It excludes decode, ProseMirror creation, layout, and frame waiting. The raw field is named `hydrate` for compatibility with the original data.",
  "",
  "The speed chart shows conversion-to-tree P95 alongside complete-ready P95. Expanded tables include decode P95 and conversion mean, P50 and P95. Each percentile comes from that interval’s actual samples; percentiles are not additive. This does not split tree construction from preprocessing, and it does not measure a native columnar internal library.",
  "",
  "**Layout:** same document and DOM work in every row, with variable elapsed time. It stays inside complete-ready timing but is not a separate format-cost bar.",
  "",
  ...rerunNotes(),
  "",
  "## 1. JSON interchange formats",
  "",
  "Hold the loader path fixed: ordinary JSON inputs, object adapter, same final editor. Each speed chart is sorted by complete-ready P95 ascending. Conversion-to-tree P95 excludes decoding and is already inside that total, not added to it. GC comes from a separate trace pass. Storage and memory have their own charts, sorted smallest first; metric scales are independent.",
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
    "| Interchange format | Internal format | Encoding | Conversion path | Ready mean ms | Ready P50 ms | Ready P95 ms | Ready maximum ms | Decode P95 ms | To tree mean ms | To tree P50 ms | To tree P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |",
    "|---|---|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const r of rows)
    lines.push(
      `| ${formatLabel(r.shape)} | ${internalFormat} | ${r.encoding} | ${loaderName(r.path)} | ${fmt(metric(r, "total"))} | ${fmt(
        quantile(
          r.samples.map((s) => s.total),
          0.5,
        ),
      )} | ${fmt(p95(r))} | ${fmt(Math.max(...r.samples.map((s) => s.total)))} | ${fmt(
        quantile(
          r.samples.map((s) => s.decode),
          0.95,
        ),
      )} | ${fmt(metric(r, "hydrate"))} | ${fmt(
        quantile(
          r.samples.map((s) => s.hydrate),
          0.5,
        ),
      )} | ${fmt(
        quantile(
          r.samples.map((s) => s.hydrate),
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
  "### Mongo storage: interchange formats",
  "",
  "Ordinary BSON objects and arrays, not JSON strings. Same compact/checkpoint protocol for Snappy and Zstd. The physical-storage table and exact stored examples are below.",
  "",
  "![Physical Mongo storage, smallest Snappy first](results/browser/storage.svg)",
  "",
);
for (const n of [...workloads].sort((a, b) => b - a))
  browserSection(n, logicalRows(n), "", "JSON interchange formats");
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
  "These are changes in measured means, not significance claims. The per-round deltas show how reproducible the direction was across fresh contexts. Negative means faster.",
  "",
  "| Documents | Same interchange format | Encoding and conversion path | Ready change ms | Per-round changes ms | Kept change MB |",
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
      `| ${n} | ${formatLabel(x.shape)} | ${x.encoding}, ${loaderName(x.path)} → ${y.encoding}, ${loaderName(y.path)} | ${fmt(metric(y, "total") - metric(x, "total"))} | ${roundDiff.join(", ")} | ${fmt(mem(y, "retainedDelta") - mem(x, "retainedDelta"))} |`,
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
  "| Interchange format | Mongo representation | Snappy KB/doc | Zstd KB/doc |",
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
    `| ${formatLabel(c.shape)} | ${c.encoding === "JSON" ? "Ordinary BSON" : c.encoding} | ${size("snappy")} | ${size("zstd")} |`,
  );
}
lines.push(
  "",
  "## Exact interchange structures and Mongo examples",
  "",
  "Every encoding in a group round-trips to the **same** logical JSON. This is asserted for empty and example inputs in unit tests, and for the full fixture before browser measurement. The browser additionally checks all saved runs, visible paragraph text, and a successful first edit.",
  "",
);
for (const shape of [...new Set(candidates.map((c) => c.shape))]) {
  const group = storageCandidates.filter((c) => c.shape === shape);
  lines.push(
    `<a id="format-${group[0].id}"></a>`,
    `<details><summary>${formatLabel(shape)}: JSON and actual Mongo representations</summary>`,
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
  "BROWSER_ROUNDS=5 BROWSER_TRIALS=20 pnpm --filter benchmarks browser:run",
  "```",
  "",
  "The runner binds only loopback on a random port and shuts down its browser/server. Optional BROWSER_CPU_RATE controls emulated CPU slowdown (not equivalent to a specific device); BROWSER_DOCUMENTS, BROWSER_ROUNDS, BROWSER_TRIALS, BROWSER_SWITCHES, BROWSER_MEMORY_TRIALS, BROWSER_CASES and BROWSER_EXECUTABLE control reruns. Partial-case smoke runs are useful for development but cannot generate the full report. This rerun used BROWSER_ARCHIVE_PREVIOUS=1 to preserve the original browser samples, GC traces, completion record and screenshot under results/browser/previous; that option refuses to overwrite an existing archive.",
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
