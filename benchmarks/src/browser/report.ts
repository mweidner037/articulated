import { EJSON } from "bson";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { example } from "../full_picture/fixture";
import { candidates } from "./candidates";
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
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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
function chart(rows: Row[]) {
  const w = 1510,
    top = 160,
    step = 43,
    h = top + rows.length * step + 90;
  const left = 440,
    plot = 390;
  const domain =
    Math.ceil(Math.max(...rows.map((r) => metric(r, "total"))) / 10) * 10;
  const series = [
    "decode",
    "hydrate",
    "editor",
    "layout",
    "frameWait",
  ] as const;
  const colors = ["#3266a6", "#b45b21", "#3c8077", "#8571ac", "#bdc6ce"];
  const text = (x: number, y: number, s: string, extra = "") =>
    `<text x="${x}" y="${y}" ${extra}>${escape(s)}</text>`;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">`,
    `<title id="title">Browser load, GC, and memory: ${rows[0].documents} document(s)</title>`,
    `<desc id="desc">Each row combines the complete measured readiness time and its constituent stages with GC and memory diagnostics. GC is already inside elapsed time, not added to it. High-water memory is sampled, not an exact peak. Numeric equivalents appear in the report table.</desc>`,
    `<style>text{font:18px Arial,Helvetica,sans-serif;fill:#243248} .small{font-size:16px} .title{font-size:26px;font-weight:500}</style><rect width="${w}" height="${h}" fill="white"/>`,
    text(
      24,
      35,
      `${rows[0].documents} document(s): the whole browser load, with GC and memory on the same row`,
      'class="title"',
    ),
    text(
      24,
      65,
      "Same logical format → JSON / binary encoding → object adapter / direct loader. Lower is better.",
    ),
  ];
  [
    "Decode",
    "Build IDs",
    "Editor + teardown",
    "Layout",
    "Frame wait / paint",
  ].forEach((name, i) => {
    const x = 24 + i * 250;
    svg.push(
      `<rect x="${x}" y="84" width="16" height="16" fill="${colors[i]}"/>`,
      text(x + 24, 98, name),
    );
  });
  svg.push(
    text(24, 133, "Logical format"),
    text(260, 133, "Encoding / path"),
    text(left, 133, "Complete ready time (ms)"),
  );
  const cols = [890, 970, 1055, 1140, 1230, 1320, 1420];
  ["Mean / P50", "P95", "GC¹", "High²", "Kept³", "Alloc⁴", "Edit P95"].forEach(
    (name, i) =>
      svg.push(
        text(cols[i], 123, name, 'text-anchor="middle"'),
        text(
          cols[i],
          145,
          i < 3 || i === 6 ? "ms" : "MB",
          'text-anchor="middle" class="small"',
        ),
      ),
  );
  for (let i = 0; i <= 4; i++) {
    const x = left + (plot * i) / 4;
    svg.push(
      `<line x1="${x}" x2="${x}" y1="${top}" y2="${h - 70}" stroke="#e2e6eb"/>`,
      text(x, h - 44, fmt((domain * i) / 4), 'text-anchor="middle"'),
    );
  }
  rows.forEach((r, i) => {
    const y = top + i * step;
    if (i === 0 || r.shape !== rows[i - 1].shape)
      svg.push(
        `<line x1="24" x2="${w - 24}" y1="${y}" y2="${y}" stroke="#cbd3dc"/>`,
      );
    svg.push(
      text(24, y + 28, r.shape, 'class="small"'),
      text(260, y + 28, `${r.encoding} / ${r.path}`, 'class="small"'),
    );
    let x = left;
    series.forEach((key, j) => {
      const width = (metric(r, key) / domain) * plot;
      assert(width >= 0);
      svg.push(
        `<rect x="${x}" y="${y + 13}" width="${width}" height="22" fill="${colors[j]}"/>`,
      );
      x += width;
    });
    const values = [
      metric(r, "total"),
      quantile(
        r.samples.map((s) => s.total),
        0.95,
      ),
      mean(r.gc.map((g) => g.gcMs)),
      Math.max(...r.memory.map((m) => m.observedHighWaterDelta)) / 1e6,
      mem(r, "retainedDelta"),
      mem(r, "sampledAllocation"),
      quantile(
        r.samples.map((s) => s.edit),
        0.95,
      ),
    ];
    values.forEach((v, j) =>
      svg.push(
        text(
          cols[j],
          y + 29,
          j === 0
            ? `${fmt(v)} / ${fmt(
                quantile(
                  r.samples.map((s) => s.total),
                  0.5,
                ),
              )}`
            : fmt(v),
          'text-anchor="middle" class="small"',
        ),
      ),
    );
  });
  svg.push(
    text(
      24,
      h - 15,
      "¹Separate trace pass; GC is not extra time. ²Observed high-water, not exact peak. ³Post-GC retained increment. ⁴Sampled JS allocations, separate pass.",
      'class="small"',
    ),
    "</svg>",
  );
  return svg.join("\n") + "\n";
}
const largest = Math.max(...workloads);
const rowFor = (id: string) =>
  data.rows.find((r) => r.id === id && r.documents === largest)!;
const typical = (id: string) =>
  fmt(
    quantile(
      rowFor(id).samples.map((s) => s.total),
      0.5,
    ),
  );
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
  "# Two decisions: Mongo storage and complete browser loading",
  "",
  "Draft experiment. Mongo disk usage is separate from browser behavior. Binary is an encoding of a logical JSON structure, never an unrelated alternative structure.",
  "",
  `Measured ${data.generatedAt.slice(0, 10)} in Chromium ${data.browser} on ${data.cpu}, CPU rate ${data.cpuRate}×. Each document has ${data.documentCharacters.toLocaleString("en-US")} characters, ${data.paragraphs.toLocaleString("en-US")} paragraphs, and the same 12,091 ID runs. This is a **real, controlled ProseMirror editor in Chromium**, not the production application. The four-document case mounts four copies of that same document; it is a scaling test, not a production corpus.`,
  "",
  "## Conclusions supported by this run",
  "",
  `- **Binary has a clear storage benefit, but not an automatic browser benefit.** Holding client-dictionary + omitted-counter structure constant, ordinary Mongo fields use ${disk("client")} KB/doc with Snappy versus ${disk("client-proto")} KB/doc as protobuf. Yet the ${largest}-document browser median is ${typical("client")} ms for JSON and ${typical("client-proto")} ms for protobuf; retained JS/backing memory is ${fmt(mem(rowFor("client"), "retainedDelta"))} vs ${fmt(mem(rowFor("client-proto"), "retainedDelta"))} MB. This does not prove identical population performance; it does rule out claiming the storage ratio as a browser-speed ratio.`,
  `- **Packing the same dictionary columns saves Mongo bytes without a comparable retained-browser-memory saving.** Ordinary fields / uint32-int32 / packed columns occupy ${disk("full")} / ${disk("binary-adapter")} / ${disk("bit-adapter")} KB/doc with Snappy. Through the object loader, their ${largest}-document median readiness times are ${typical("full")} / ${typical("binary-adapter")} / ${typical("bit-adapter")} ms. Retained memory is ${fmt(mem(rowFor("full"), "retainedDelta"))} / ${fmt(mem(rowFor("binary-adapter"), "retainedDelta"))} / ${fmt(mem(rowFor("bit-adapter"), "retainedDelta"))} MB. The compact input is discarded and all paths end in the same library tree.`,
  `- **Do not choose a browser winner from the mean alone.** ${outliers.length} samples exceed three times their row median${outliers.length ? ` (${outliers.map(fmt).join(", ")} ms)` : ""}. All samples remain in the results. The causes of these stalls were not established, and the separate GC diagnostic pass cannot explain a specific untraced outlier. Use the median, per-round comparisons, and raw distributions together. On the single-document workload, frame scheduling largely masks these small codec differences.`,
  "- **Decision:** select the logical representation and Mongo encoding for storage savings and acceptable complexity; these measurements do not justify a claim that binary encoding alone substantially reduces retained editing memory or typical browser readiness time. A native compact mutable editing structure is a different project; none of these loaders implements it.",
  "",
  "## How to read the integrated comparison",
  "",
  "Read across one row: complete readiness time first, then its tail latency, GC pauses, temporary memory, and retained memory. Compare encodings **within a logical-format group**, and compare object/direct loaders while holding the encoding fixed. A smaller Mongo file is not evidence of a faster browser.",
  "",
  "The stacked bar is one directly timed operation, partitioned into non-overlapping stages—not a sum of unrelated microbenchmarks. GC happens inside those stages. Its diagnostic column must not be added to the total. Memory profiling and GC tracing run separately from the primary timing pass.",
  "",
  "## Browser: all dimensions together",
  "",
  `Each row has ${data.rounds * data.trials} warm timing samples across ${data.rounds} fresh browser contexts, ${data.switches} traced document replacements without forced GC between them, and ${data.memoryTrials} separately profiled memory runs. P95 is an empirical sample percentile, not a reliable population-tail estimate from this small run. Raw cold-start samples and per-round results are retained.`,
  "",
];
for (const n of workloads) {
  const rows = data.rows.filter((r) => r.documents === n);
  fs.writeFileSync(path.join(dir, `browser-${n}.svg`), chart(rows));
  lines.push(
    `### ${n} document(s)`,
    "",
    `![Integrated browser load, GC and memory comparison](results/browser/browser-${n}.svg)`,
    "",
    "| Logical format | Encoding / path | Ready mean ms | Ready P50 ms | Ready P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |",
    "|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  );
  for (const r of rows)
    lines.push(
      `| ${r.shape} | ${r.encoding} / ${r.path} | ${fmt(metric(r, "total"))} | ${fmt(
        quantile(
          r.samples.map((s) => s.total),
          0.5,
        ),
      )} | ${fmt(
        quantile(
          r.samples.map((s) => s.total),
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
lines.push(
  "## Matched comparisons, not cross-format winners",
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
  "## Mongo: separate physical-storage comparison",
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
fs.writeFileSync(path.resolve(__dirname, "../../browser.md"), lines.join("\n"));
