import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { directStorageExample } from "./direct-storage-formats";
import type { BrowserSample } from "./page-runtime";
import { storageSweepFormats } from "./storage-sweep-formats";

interface MongoRow {
  id: string;
  compressor: string;
  storageBytesPerDocument: number;
  sourceHashDocument0: string;
  checkedDocuments: number[];
  compact: { ok: number };
  compactAfterCheckpoint: { ok: number };
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
const read = (relative: string) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const mongo: MongoResult[] = [1, 2].map((i) =>
  read(`results/storage-sweep-mongo-${i}/mongo.json`),
);
const browser: BrowserResult = read(
  "results/storage-sweep-browser/browser.json",
);
const repeat: BrowserResult = read(
  "results/storage-sweep-browser-confirm/browser.json",
);
assert(repeat.complete);
assert.equal(repeat.rows.length, 5);
assert.equal(repeat.sourceSavedSha256, browser.sourceSavedSha256);
assert.equal(repeat.bundleSha256, browser.bundleSha256);
assert(browser.complete);
assert.equal(browser.rows.length, storageSweepFormats.length);
assert.equal(
  createHash("sha256")
    .update(
      fs.readFileSync(
        path.join(root, "results/storage-sweep-browser/measured-bundle.js"),
      ),
    )
    .digest("hex"),
  browser.bundleSha256,
);
for (const run of mongo) {
  assert(run.complete);
  assert.equal(run.documents, 100);
  assert.equal(run.rows.length, storageSweepFormats.length * 2);
  assert.equal(run.sourceSavedSha256, browser.sourceSavedSha256);
  assert.equal(run.document0SavedSha256, mongo[0].document0SavedSha256);
  assert.equal(
    new Set(run.rows.map((r) => `${r.id}/${r.compressor}`)).size,
    run.rows.length,
  );
  for (const row of run.rows) {
    assert.equal(row.sourceHashDocument0, run.document0SavedSha256);
    assert.deepEqual(row.checkedDocuments, [0, 99]);
    assert.equal(row.compact.ok, 1);
    assert.equal(row.compactAfterCheckpoint.ok, 1);
  }
}
const percentile = (values: number[], fraction: number) => {
  assert(values.length && values.every(Number.isFinite));
  return [...values].sort((a, b) => a - b)[
    Math.ceil(values.length * fraction) - 1
  ];
};
const confirmation = repeat.rows.map((row) => {
  assert.equal(row.samples.length, 100);
  assert.equal(row.cold.length, 5);
  assert.equal(row.memory.length, 3);
  assert.equal(row.gc.length, 8);
  assert.equal(row.documents, 4);
  return {
    id: row.id,
    parseAndLoadP95: percentile(
      row.samples.map((s) => s.decode + s.hydrate),
      0.95,
    ),
    readyP95: percentile(
      row.samples.map((s) => s.total),
      0.95,
    ),
    retainedMB: percentile(
      row.memory.map((m) => m.retainedDelta / 1e6),
      0.5,
    ),
  };
});
const rows = storageSweepFormats.map((format) => {
  const b = browser.rows.find((r) => r.id === format.id)!;
  assert(b);
  assert.equal(b.documents, 4);
  assert.equal(b.samples.length, 100);
  assert.equal(b.cold.length, 5);
  assert.equal(b.memory.length, 3);
  assert.equal(b.gc.length, 8);
  const storage = (compressor: string) =>
    mongo.map(
      (run) =>
        run.rows.find((r) => r.id === format.id && r.compressor === compressor)!
          .storageBytesPerDocument / 1000,
    );
  return {
    id: format.id,
    label:
      format.id === "F01"
        ? "Original saved objects"
        : `${format.pageSize ? `${format.pageSize}-run pages` : "Whole-document columns"}; ${format.idEncoding === "joined" ? "IDs concatenated into one string" : format.idEncoding === "dictionary" ? "ID dictionary + numeric references" : "ordinary ID arrays"}${format.binary ? "; binary numeric columns" : ""}`,
    binary: format.binary,
    pageSize: format.pageSize,
    idEncoding: format.idEncoding,
    snappyKB: storage("snappy"),
    zstdKB: storage("zstd"),
    passesF01: mongo.every((run) =>
      run.rows
        .filter((r) => r.id === format.id)
        .every((r) => r.gate.passesMeasuredStorageCeiling),
    ),
    decodeMedian: percentile(
      b.samples.map((s) => s.decode),
      0.5,
    ),
    hydrateMedian: percentile(
      b.samples.map((s) => s.hydrate),
      0.5,
    ),
    parseAndLoadP95: percentile(
      b.samples.map((s) => s.decode + s.hydrate),
      0.95,
    ),
    readyP95: percentile(
      b.samples.map((s) => s.total),
      0.95,
    ),
    coldMedian: percentile(
      b.cold.map((s) => s.total),
      0.5,
    ),
    gcMedianMs: percentile(
      b.gc.map((g) => g.gcMs),
      0.5,
    ),
    retainedMB: percentile(
      b.memory.map((m) => m.retainedDelta / 1e6),
      0.5,
    ),
    observedHighWaterMB: percentile(
      b.memory.map((m) => m.observedHighWaterDelta / 1e6),
      0.5,
    ),
  };
});
const worst = (values: number[]) => Math.max(...values);
const ordered = [...rows].sort(
  (a, b) =>
    worst(a.zstdKB) - worst(b.zstdKB) || worst(a.snappyKB) - worst(b.snappyKB),
);
const jsonWinner = ordered.find((r) => !r.binary && r.passesF01)!;
const binaryWinner = ordered.find((r) => r.binary && r.passesF01)!;
const range = (values: number[]) => {
  const min = Math.min(...values).toFixed(1),
    max = Math.max(...values).toFixed(1);
  return min === max ? min : `${min}–${max}`;
};
const table = (selected: typeof rows) =>
  [
    "| Format | Mongo KB/doc: Snappy / zstd | Parse + load p95, ms | Ready p95, ms | Retained JS, MB | Below F01 in both? |",
    "|---|---:|---:|---:|---:|---|",
    ...selected.map(
      (r) =>
        `| ${r.id}: ${r.label} | ${range(r.snappyKB)} / ${range(r.zstdKB)} | ${r.parseAndLoadP95.toFixed(1)} | ${r.readyP95.toFixed(1)} | ${r.retainedMB.toFixed(3)} | ${r.passesF01 ? "Yes" : "No"} |`,
    ),
  ].join("\n");
const summaryIDs = new Set([
  "F01",
  "F05",
  "DS08",
  jsonWinner.id,
  binaryWinner.id,
  "S128-array-binary",
]);
const summary = ordered.filter((r) => summaryIDs.has(r.id));
const example = (id: string) => {
  const format = storageSweepFormats.find((f) => f.id === id)!;
  return `### ${id}: ${rows.find((r) => r.id === id)!.label}\n\n\`\`\`json\n${JSON.stringify(format.encode(directStorageExample), null, 2)}\n\`\`\`\n`;
};
const baseline = rows.find((r) => r.id === "F01")!;
const timingRange = (id: string, key: "parseAndLoadP95" | "readyP95") => {
  const first = rows.find((r) => r.id === id)!;
  const second = confirmation.find((r) => r.id === id);
  return range(second ? [first[key], second[key]] : [first[key]]);
};
const report = `# Storage-format sweep — existing IdList unchanged

## Conclusions

1. **Lowest measured JSON storage: 128-run pages with concatenated eight-character IDs (S128-joined).** This preserves your exact IDs and ordinary JSON, using ${range(jsonWinner.snappyKB)} / ${range(jsonWinner.zstdKB)} KB per document under Snappy / zstd. Compared with original objects, the zstd saving is ${(100 * (1 - worst(jsonWinner.zstdKB) / worst(baseline.zstdKB))).toFixed(1)}%. It is not free on loading: across the full sweep and fresh-process repeat, parse + load p95 was ${timingRange(jsonWinner.id, "parseAndLoadP95")} ms versus ${timingRange("F01", "parseAndLoadP95")} ms for F01; full readiness was ${timingRange(jsonWinner.id, "readyP95")} ms versus ${timingRange("F01", "readyP95")} ms. These times cover four editors, not one. They are observed p95 ranges across two batches, not confidence intervals.
2. **Keep ordinary ID arrays if simpler decoding is the priority.** 64-run pages measured 151.7 / 86.3 KB per document, versus DS08's 159.9 / 86.3. That keeps the DS08 logical fields and improves Snappy without concatenation. It has only the full-sweep browser measurement, not the focused repeat. F05 remains a whole-document alternative with near-baseline loading in both browser batches, but costs 172.3 / 102.7 KB. Page-local dictionaries did not beat concatenated IDs on storage in this corpus.
3. **Lowest measured bytes, as a separate binary optimization: ${binaryWinner.id}.** ${range(binaryWinner.snappyKB)} / ${range(binaryWinner.zstdKB)} KB per document, with parse + load p95 ${timingRange(binaryWinner.id, "parseAndLoadP95")} ms. It uses the same JSON shape with numeric fields encoded as binary, not a different internal library. The checked int32 range restriction below must be addressed before treating it as a general production codec.

**Browser editing and retained memory are not improved by these saved formats.** All load into the same existing IdList; retained memory is about 6.26–6.29 MB across four editors. The new measurements do not support calling the smaller encodings a browser-performance win. DS08's ready p95 itself varied from 58.4 ms in the full sweep to 51.0 ms in the repeat; both results are retained. Compare decoding/loading cost as well as frame-quantized readiness, rather than selecting whichever batch looks best.

## Scope

These are storage/interchange changes, **not new editable containers**. Every candidate decodes to exactly the same ordered SavedIdList, then calls the same existing IdList.load. No bulk-build or native-container experiment is enabled. Subsequent editing uses the same implementation and construction path. Retained-memory differences are observations, not a claimed new data-structure advantage.

22 candidates: original objects; whole-document/32/64/128/256/512-run columns with repeated IDs, concatenated fixed-eight-character IDs, or page-local dictionaries; then the same 128-run shapes with binary numeric fields. Binary is a secondary encoding experiment.

## Measured comparison

Mongo cells show the range across **two fresh isolated database builds**, 100 independently renamed opaque-ID documents per collection. Browser cells cover **four editors**. Parse + load is the p95 of each sample's measured decoding plus conversion/IdList.load time—not a sum of separately computed percentiles. Ready includes editor creation and the two-frame readiness proxy; it is not physical screen-scanout timing. Network transfer is excluded.

${table(summary)}

The smallest eligible JSON result in this sweep is **${jsonWinner.id}**; the smallest eligible binary result is **${binaryWinner.id}**. Ranking uses the larger observed zstd size across the two builds, then Snappy as a tie-break. This is a corpus-specific ranking, not a guarantee for other documents. Small timing differences must be interpreted in context of frame quantization and host variability.

<details><summary>Independent browser repeat: baseline and leading candidates, 500 additional warm loads</summary>

A new browser process, the exact same measured bundle and source snapshot, five fresh contexts × 20 trials per case. This repeat does not replace or pool away the original sweep. Sorted by parse + load p95; all values cover four editors.

| Format | Parse + load p95 ms | Ready p95 ms | Retained JS MB |
|---|---:|---:|---:|
${[...confirmation]
  .sort((a, b) => a.parseAndLoadP95 - b.parseAndLoadP95)
  .map(
    (r) =>
      `| ${r.id} | ${r.parseAndLoadP95.toFixed(1)} | ${r.readyP95.toFixed(1)} | ${r.retainedMB.toFixed(3)} |`,
  )
  .join("\n")}

</details>

## What is stored?

All examples below encode the same four runs: ID aB3dE5fG at counter 0, visible 3; the same ID at counter 3, deleted 2; ID hJ7kL9mN at counter 20, visible 1; the first ID at counter 8, visible 2. Mongo adds the common {_id, state} wrapper. Signed counts and counter-exception semantics are unchanged across this sweep.

${example("DS08")}
${jsonWinner.id === "DS08" ? "" : example(jsonWinner.id)}

Binary variants retain the identical field structure but replace numeric arrays with generic BSON Binary values. Each value is a sequence of little-endian signed int32s; types are fixed by schema, not stored alongside each column. For example counts [3, -2, 1, 2] becomes bytes 03 00 00 00 FE FF FF FF 01 00 00 00 02 00 00 00. IDs remain strings/an array of strings. This prototype **rejects values outside signed int32 range**; it is not a drop-in codec for all safe-integer counters. A production choice must preserve the library's supported range or define a safe fallback. BSON is decoded in-browser before conversion into the unchanged IdList; all that work is included. There is no base64 wire workaround in the benchmark.

<details><summary>All 22 results, sorted by zstd physical storage</summary>

${table(ordered)}

</details>

<details><summary>Loading phase details, sorted by parse + load p95</summary>

| Format | Decode median ms | Conversion + IdList.load median ms | Parse + load p95 ms | Fresh-context ready median ms | Observed loading high-water MB | Traced GC median ms |
|---|---:|---:|---:|---:|---:|---:|
${[...rows]
  .sort((a, b) => a.parseAndLoadP95 - b.parseAndLoadP95)
  .map(
    (r) =>
      `| ${r.id} | ${r.decodeMedian.toFixed(1)} | ${r.hydrateMedian.toFixed(1)} | ${r.parseAndLoadP95.toFixed(1)} | ${r.coldMedian.toFixed(1)} | ${r.observedHighWaterMB.toFixed(3)} | ${r.gcMedianMs.toFixed(3)} |`,
  )
  .join("\n")}

Phase medians are diagnostic, not additive p95 estimates. Loading high-water is sampled at phase boundaries under intrusive memory probes, not an exact peak or RSS. Five fresh-context loads do not support a reliable cold p95. GC medians come from eight separate traced windows; they are not production pause tails and must not be added to untraced readiness timings.

</details>

## Verification and limits

- **88 physical Mongo measurements**: 22 formats × 2 compressors × 2 fresh databases; each collection compacted twice, with a checkpoint between. Actual .wt file length matched collection storageSize while fsync-locked. Sizes include collection allocation/free space but exclude indexes/shared database files. These are fresh inserted snapshots, not an update-fragmentation workload.
- Every collection's documents 0 and 99 were read back, decoded, checked for exact saved-state equality, then validated by the existing library. No production/Atlas data was touched; temporary databases and all prior results were preserved.
- **2,200 warm browser loads**: 5 fresh contexts × 20 trials × 22 candidates, shuffled case order; 3 memory trials and 8 separately traced GC windows per candidate. The same Chromium process is used with fresh contexts and explicit 1× CPU throttling. Natural GC is included in timed replacement loads; memory is post-GC heap plus backing storage after the first edit.
- **500 additional confirmation loads**: a new browser process and the same settings for F01, F05, DS08, S128-joined, and S128-joined-binary. Both complete batches are retained; timings are not selectively replaced by the faster run.
- Four editors each load the same 104,852-character, 11,757-run canonical snapshot. ID values are harness-assigned opaque eight-character identities, not recorded collaborator IDs. This is one workload, not a representative production corpus.
- Mongo and browser source snapshot SHA256: ${browser.sourceSavedSha256}. Mongo additionally independently renames whole IDs per stored document; document 0 SHA256: ${mongo[0].document0SavedSha256}. Exact source topology matches; renamed Mongo document bytes intentionally differ from browser IDs.
- Browser measured bundle SHA256: ${browser.bundleSha256}. The executed bundle is preserved alongside raw results. Smoke-test output is excluded from all reported measurements.
- Editing throughput is not reranked here: all formats construct the same IdList from identical ordered runs. The harness checks the rendered document and first edit for every load. Earlier runtime-replacement editing benchmarks answer a different question.
- These candidate formats are experiments; migration/versioning and representative multi-client production data remain follow-up work. The F01 ceiling is enforced per compressor and repeat on this corpus, not claimed universally.

## Evidence and reproduction

[First Mongo build](results/storage-sweep-mongo-1/mongo.json) · [Second Mongo build](results/storage-sweep-mongo-2/mongo.json) · [Browser results](results/storage-sweep-browser/browser.json) · [Browser repeat](results/storage-sweep-browser-confirm/browser.json) · [Canonical input snapshot](results/storage-sweep-browser/canonical-input.json) · [Summary JSON](results/storage-sweep-browser/summary.json) · [Encoders/decoders](src/browser/storage-sweep-formats.ts) · [Round-trip tests](src/browser/storage-sweep.test.ts)

Use Node 24 with TSX_TSCONFIG_PATH=tsconfig.dev.json from benchmarks/. For Mongo, run direct-storage-probe.ts with DIRECT_STORAGE_SWEEP=1, DIRECT_STORAGE_FIXTURE pointing to the canonical SavedIdList JSON, DIRECT_STORAGE_DBPATH pointing to a fresh /private/tmp/articulated-direct-storage-* directory on localhost:27186, and a new DIRECT_STORAGE_OUTPUT. Stop the isolated server before running storage-sweep-run.ts with the same fixture, BROWSER_ID_MODEL=opaque8, BROWSER_DOCUMENTS=4, BROWSER_CPU_RATE=1, BROWSER_ROUNDS=5, BROWSER_TRIALS=20, BROWSER_SWITCHES=8, BROWSER_MEMORY_TRIALS=3, EXPLORATION_OUTPUT=storage-sweep-browser. Never overwrite existing evidence. Generate this report with storage-sweep-report.ts.
`;
fs.writeFileSync(path.join(root, "storage-sweep.md"), report);
fs.writeFileSync(
  path.join(root, "results/storage-sweep-browser/summary.json"),
  JSON.stringify(
    {
      sourceSavedSha256: browser.sourceSavedSha256,
      jsonWinner: jsonWinner.id,
      binaryWinner: binaryWinner.id,
      confirmation,
      rows: ordered,
    },
    null,
    2,
  ) + "\n",
);
console.log(table(summary));
