import type { SavedIdList } from "articulated";
import { deserialize, serialize } from "bson";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { flatFloat64Candidates } from "./flat-f64-candidates";
import { flatFloat64Format, type FlatBinary } from "./flat-f64-formats";
import type { BrowserSample } from "./page-runtime";

interface MongoRow {
  id: string;
  compressor: string;
  storageBytesPerDocument: number;
  sourceHashDocument0: string;
  compact: { ok: number };
  compactAfterCheckpoint: { ok: number };
  checkedDocuments: number[];
  gate: { passesMeasuredStorageCeiling: boolean };
}
interface MongoResult {
  complete: boolean;
  documents: number;
  sourceSavedSha256: string;
  document0SavedSha256: string;
  rows: MongoRow[];
}
interface BrowserRow {
  id: string;
  documents: number;
  samples: BrowserSample[];
  cold: BrowserSample[];
  gc: { gcMs: number }[];
  memory: { retainedDelta: number; observedHighWaterDelta: number }[];
}
interface BrowserResult {
  complete: boolean;
  sourceSavedSha256: string;
  bundleSha256: string;
  rows: BrowserRow[];
}
const root = path.resolve(__dirname, "../..");
const read = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const hash = (bytes: string | Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const mongo: MongoResult[] = [1, 2].map((i) =>
  read(`results/flat-f64-mongo-${i}/mongo.json`),
);
const browser: BrowserResult[] = [1, 2].map((i) =>
  read(`results/flat-f64-browser-${i}/browser.json`),
);
const saved: SavedIdList = read(
  "results/storage-sweep-browser/canonical-input.json",
);
const sourceHash = hash(JSON.stringify(saved));
for (const [i, run] of browser.entries()) {
  assert(run.complete);
  assert.equal(run.rows.length, 5);
  assert.equal(run.sourceSavedSha256, sourceHash);
  assert.equal(run.bundleSha256, browser[0].bundleSha256);
  assert.equal(
    hash(
      fs.readFileSync(
        path.join(root, `results/flat-f64-browser-${i + 1}/measured-bundle.js`),
      ),
    ),
    run.bundleSha256,
  );
  assert.deepEqual(
    run.rows.map((r) => r.id).sort(),
    flatFloat64Candidates.map((c) => c.id).sort(),
  );
  for (const row of run.rows) {
    assert.equal(row.documents, 4);
    assert.equal(row.samples.length, 100);
    assert.equal(row.cold.length, 5);
    assert.equal(row.gc.length, 8);
    assert.equal(row.memory.length, 3);
  }
}
for (const run of mongo) {
  assert(run.complete);
  assert.equal(run.documents, 100);
  assert.equal(run.rows.length, 8);
  assert.equal(new Set(run.rows.map((r) => `${r.id}/${r.compressor}`)).size, 8);
  assert.equal(run.sourceSavedSha256, sourceHash);
  assert.equal(run.document0SavedSha256, mongo[0].document0SavedSha256);
  for (const row of run.rows) {
    assert.equal(row.sourceHashDocument0, run.document0SavedSha256);
    assert.equal(row.compact.ok, 1);
    assert.equal(row.compactAfterCheckpoint.ok, 1);
    assert.deepEqual(row.checkedDocuments, [0, 99]);
  }
}
const percentile = (values: number[], p: number) => {
  assert(values.length && values.every(Number.isFinite));
  return [...values].sort((a, b) => a - b)[Math.ceil(values.length * p) - 1];
};
const range = (values: number[], digits = 1) => {
  const lo = Math.min(...values).toFixed(digits),
    hi = Math.max(...values).toFixed(digits);
  return lo === hi ? lo : `${lo}–${hi}`;
};
const labels: Record<string, string> = {
  F01: "Original objects → existing IdList",
  F05: "Flat columns, ID array → existing IdList",
  "Sflat-joined": "Flat JSON, concatenated IDs; previous decoder",
  "Flat-JSON-direct": "Same flat JSON; direct decoder",
  "Flat-F64": "Same flat shape; Float64 binary fields + direct decoder",
};
const rows = flatFloat64Candidates.map((c) => {
  const storageId = c.id === "Flat-JSON-direct" ? "Sflat-joined" : c.id;
  const storage = (compressor: string) =>
    mongo.map(
      (r) =>
        r.rows.find((x) => x.id === storageId && x.compressor === compressor)!
          .storageBytesPerDocument / 1000,
    );
  const timings = browser.map((run) => {
    const b = run.rows.find((r) => r.id === c.id)!;
    return {
      parseAndLoadP95: percentile(
        b.samples.map((s) => s.decode + s.hydrate),
        0.95,
      ),
      readyP95: percentile(
        b.samples.map((s) => s.total),
        0.95,
      ),
      decodeMedian: percentile(
        b.samples.map((s) => s.decode),
        0.5,
      ),
      hydrateMedian: percentile(
        b.samples.map((s) => s.hydrate),
        0.5,
      ),
      retainedMB: percentile(
        b.memory.map((m) => m.retainedDelta / 1e6),
        0.5,
      ),
      highWaterMB: percentile(
        b.memory.map((m) => m.observedHighWaterDelta / 1e6),
        0.5,
      ),
      gcMedian: percentile(
        b.gc.map((g) => g.gcMs),
        0.5,
      ),
      coldMedian: percentile(
        b.cold.map((s) => s.total),
        0.5,
      ),
    };
  });
  return {
    id: c.id,
    label: labels[c.id],
    storageId,
    snappyKB: storage("snappy"),
    zstdKB: storage("zstd"),
    timings,
    passesF01: mongo.every((r) =>
      r.rows
        .filter((x) => x.id === storageId)
        .every((x) => x.gate.passesMeasuredStorageCeiling),
    ),
  };
});
const timing = (
  r: (typeof rows)[number],
  key: keyof (typeof rows)[number]["timings"][number],
  digits = 1,
) =>
  range(
    r.timings.map((x) => x[key]),
    digits,
  );
const table = [
  "| Format / decoder | Mongo KB/doc: Snappy / zstd | Parse + load p95 ms | Ready p95 ms | Retained JS MB |",
  "|---|---:|---:|---:|---:|",
  ...[...rows]
    .sort(
      (a, b) =>
        Math.max(...a.timings.map((x) => x.parseAndLoadP95)) -
        Math.max(...b.timings.map((x) => x.parseAndLoadP95)),
    )
    .map(
      (r) =>
        `| ${r.id}: ${r.label} | ${range(r.snappyKB)} / ${range(r.zstdKB)} | ${timing(r, "parseAndLoadP95")} | ${timing(r, "readyP95")} | ${timing(r, "retainedMB", 3)} |`,
    ),
].join("\n");
const encoded = flatFloat64Format.encode(saved);
const persisted = deserialize(new Uint8Array(serialize({ state: encoded })))
  .state as FlatBinary;
assert.deepEqual(flatFloat64Format.decode(persisted), saved);
const alignmentAudit = (
  ["startCounterIndexes", "startCounters", "counts"] as const
).map((field) => {
  const bytes = persisted[field].value();
  return {
    field,
    bytes: bytes.byteLength,
    offsetModulo8: bytes.byteOffset % 8,
    needsAlignmentCopy: bytes.byteOffset % 8 !== 0,
  };
});
const baseline = rows.find((r) => r.id === "F01")!;
const json = rows.find((r) => r.id === "Flat-JSON-direct")!;
const binary = rows.find((r) => r.id === "Flat-F64")!;
const saving = (reference: typeof binary) =>
  (
    100 *
    (1 - Math.max(...binary.zstdKB) / Math.max(...reference.zstdKB))
  ).toFixed(1);
const report = `# Flat Float64 binary columns — no pages, same IdList

## Measured result

The tested format retains the concatenated eight-character IDs and replaces only the three numeric arrays with **ordinary BSON Binary fields containing consecutive IEEE754 Float64 values, little endian**. There are no custom headers, variable-width integers, bit-packing, per-column type declarations or pages. This encoding preserves the full JavaScript safe-integer range, including signed counts.

Mongo Float64 storage measured **${range(binary.snappyKB)} / ${range(binary.zstdKB)} KB per document (Snappy / zstd)**: **${saving(json)}% less zstd storage than the same flat JSON shape**, and **${saving(baseline)}% less than original objects**. All candidates pass the paired F01 storage ceiling under both compressors in both fresh builds.

**Conclusion:** this is a promising storage choice under the requested simplicity constraint: one flat object, an eight-character ID string, and fixed eight-byte numeric fields. It is not an editing-runtime optimization. The browser results below show no large load-time penalty versus the prior flat JSON decoder, but do not establish a universal speed win. Compared with original objects, measured ready p95 is slightly higher. Retained memory is effectively unchanged.

**Corpus limit:** this canonical snapshot has **${persisted.startCounters.length() / 8} counter exceptions**. Its two counter-exception columns are empty, so the measured numeric-field saving comes principally from counts. Nonempty exception columns and values beyond 32 bits—including safe-integer limits—are correctness-tested, but their performance/storage behavior is not represented by this canonical timing corpus. A multi-client/reordered production snapshot remains a necessary generalization check.

${table}

Browser values cover **four editors**, each loading the same canonical 104,852-character snapshot. Ranges are the two independently measured batch results, not confidence intervals. Parse + load is the p95 of each sample's decode + conversion/IdList.load time, not a sum of phase percentiles. Ready additionally includes common editor construction and frame waits. No network-transfer metric is included. All rows use the **unchanged existing IdList**, not native F05 or another editable container.

The two flat JSON rows have **identical saved bytes**. The direct decoder avoids expanding the concatenated IDs into a temporary string array and avoids copying typed numeric fields into ordinary number arrays. It still creates the ordinary run objects required by IdList.load. The Float64 row uses that exact same direct decoder, so improvements from the decoder must not be incorrectly attributed to binary encoding. In fact, the direct JSON decoder had worse parse/load p95 than the previous JSON decoder in both batches; fewer temporary arrays did not by itself establish a speed improvement. The table is sorted by the slower observed parse/load p95 across the two batches, not a claim of statistically established ranking.

## Exactly what is stored

The logical JSON stays:

\`\`\`javascript
{
  bunchIds: "aB3dE5fGaB3dE5fGhJ7kL9mNaB3dE5fG",
  startCounterIndexes: [2, 1],
  startCounters: [20, 8],
  counts: [3, -2, 1, 2]
}
\`\`\`

Mongo stores the same fields, replacing numeric arrays with Binary:

\`\`\`javascript
import { Binary } from "bson";

function binaryNumbers(values) {
  const bytes = new Uint8Array(values.length * 8);
  const view = new DataView(bytes.buffer);
  values.forEach((value, i) => {
    if (!Number.isSafeInteger(value)) throw new Error("Invalid integer");
    view.setFloat64(i * 8, value, true); // Fixed little-endian bytes.
  });
  return new Binary(bytes);
}

const state = {
  bunchIds: "aB3dE5fGaB3dE5fGhJ7kL9mNaB3dE5fG",
  startCounterIndexes: binaryNumbers([2, 1]),
  startCounters: binaryNumbers([20, 8]),
  counts: binaryNumbers([3, -2, 1, 2])
};
await collection.insertOne({ _id: documentId, state });
\`\`\`

Reading each numeric field is a Float64Array view when alignment and native byte order permit. Unaligned fields are copied once into an aligned buffer; a DataView fallback handles other byte orders. All of this is included in browser measurements. The loader releases these temporary buffers after creating the existing IdList. It does **not** make editing itself zero-copy or retain a new typed-array internal model.

An audit of the serialized BSON payload using a zero-offset Uint8Array reports:

| Field | Numeric buffer bytes | Byte offset modulo 8 | Alignment copy needed |
|---|---:|---:|---|
${alignmentAudit.map((r) => `| ${r.field} | ${r.bytes} | ${r.offsetModulo8} | ${r.needsAlignmentCopy ? "Yes" : "No"} |`).join("\n")}

These offsets describe this BSON payload layout, not a guarantee that a different driver/buffer arrangement is aligned. The tested decoder handles both cases. Unit tests exercise all safe-integer extremes, unaligned buffers, portable endian conversion, empty columns, sparse counter exceptions, malformed byte lengths, non-integer values, invalid exception indexes, and exact Mongo roundtrips.

<details><summary>Loading phases, temporary memory and GC</summary>

| Format | Decode median ms | Conversion + IdList.load median ms | Fresh-context ready median ms | Observed high-water MB | Traced GC median ms |
|---|---:|---:|---:|---:|---:|
${rows.map((r) => `| ${r.id} | ${timing(r, "decodeMedian")} | ${timing(r, "hydrateMedian")} | ${timing(r, "coldMedian")} | ${timing(r, "highWaterMB", 3)} | ${timing(r, "gcMedian", 3)} |`).join("\n")}

High-water is sampled at stage boundaries in intrusive memory runs, not an exact peak or RSS. GC is traced separately from primary timings and must not be added to ready time. Five fresh-context first loads per batch do not establish cold p95. Phase medians are not additive percentile estimates.

</details>

## Verification and limits

- Two fresh isolated Mongo databases, each with 4 layouts × 2 compressors × 100 independently renamed documents: **16 physical collection measurements**. Each collection compacted twice around a checkpoint. Actual .wt file sizes matched storageSize under fsync lock. Files include collection allocation/free space; indexes and shared database files are excluded. Temporary databases were preserved; production/Atlas was untouched.
- Documents 0 and 99 in every collection were read back and checked against the exact saved state, then validated through existing IdList.load. Mongo renaming preserves every whole-ID equivalence and counter; it does not impose client/sequence structure.
- Two fresh browser processes, each 5 candidates × 5 fresh contexts × 20 warm trials: **1,000 warm loads**, plus 3 post-GC memory trials and 8 traced windows per candidate per batch. Cases are deterministically shuffled; CPU throttling is explicitly 1×. One heavy benchmark ran at a time, with temporary Mongo stopped before browser runs.
- All browser inputs and Mongo source snapshots match SHA256 **${sourceHash}**. Independently renamed Mongo document 0 matches **${mongo[0].document0SavedSha256}**. Both browser processes executed identical bundles, SHA256 **${browser[0].bundleSha256}**, preserved with results. Smoke measurements are excluded.
- Original objects, F05 and the prior flat JSON decoder are fresh same-run controls; older results have not been replaced. Small changes from earlier Mongo results can reflect physical allocation. This is one canonical corpus, not production workload coverage.
- Numeric binary tests use BSON as the browser payload, not JSON base64. Decoding cost is included; fetching and initial benchmark-bundle startup are outside clocks. The harness bundles BSON support for all cases, so incremental production dependency/download/startup cost is not established. If the server instead converts Mongo binary back into JSON numbers, the browser follows the JSON path rather than the binary row here.
- Editing throughput is not a new variable: every candidate reconstructs identical ordered runs and uses the same IdList.load. Correctness includes rendered document text and the first edit. There is no internal data-structure redesign or production migration.

## Evidence and reproduction

[Mongo build 1](results/flat-f64-mongo-1/mongo.json) · [Mongo build 2](results/flat-f64-mongo-2/mongo.json) · [Browser batch 1](results/flat-f64-browser-1/browser.json) · [Browser batch 2](results/flat-f64-browser-2/browser.json) · [Summary](results/flat-f64-browser-1/summary.json) · [Canonical snapshot](results/storage-sweep-browser/canonical-input.json) · [Codec](src/browser/flat-f64-formats.ts) · [Tests](src/browser/flat-f64.test.ts)

From benchmarks/ with Node 24, use TSX_TSCONFIG_PATH=tsconfig.dev.json and DIRECT_STORAGE_F64=1. Set DIRECT_STORAGE_FIXTURE to the absolute canonical-input.json path linked above. For each Mongo build, start a fresh localhost:27186 instance in a new /private/tmp/articulated-direct-storage-* directory, set DIRECT_STORAGE_DBPATH and a fresh DIRECT_STORAGE_OUTPUT, then run node --import tsx src/browser/direct-storage-probe.ts. Stop that verified temporary server before browser measurements. For each browser batch, set a new EXPLORATION_OUTPUT, BROWSER_ID_MODEL=opaque8, BROWSER_DOCUMENTS=4, BROWSER_ROUNDS=5, BROWSER_TRIALS=20, BROWSER_SWITCHES=8, BROWSER_MEMORY_TRIALS=3, BROWSER_CPU_RATE=1 and run node --import tsx src/browser/storage-sweep-run.ts. Generate this report using flat-f64-report.ts. Never overwrite existing evidence.
`;
fs.writeFileSync(path.join(root, "flat-f64.md"), report);
fs.writeFileSync(
  path.join(root, "results/flat-f64-browser-1/summary.json"),
  JSON.stringify({ sourceHash, rows, alignmentAudit }, null, 2) + "\n",
);
console.log(table);
