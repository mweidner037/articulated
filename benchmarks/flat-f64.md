# Flat Float64 binary columns — no pages, same IdList

## Measured result

The tested format retains the concatenated eight-character IDs and replaces only the three numeric arrays with **ordinary BSON Binary fields containing consecutive IEEE754 Float64 values, little endian**. There are no custom headers, variable-width integers, bit-packing, per-column type declarations or pages. This encoding preserves the full JavaScript safe-integer range, including signed counts.

Mongo Float64 storage measured **86.2 / 57.5 KB per document (Snappy / zstd)**: **29.9% less zstd storage than the same flat JSON shape**, and **48.1% less than original objects**. All candidates pass the paired F01 storage ceiling under both compressors in both fresh builds.

**Conclusion:** this is a promising storage choice under the requested simplicity constraint: one flat object, an eight-character ID string, and fixed eight-byte numeric fields. It is not an editing-runtime optimization. The browser results below show no large load-time penalty versus the prior flat JSON decoder, but do not establish a universal speed win. Compared with original objects, measured ready p95 is slightly higher. Retained memory is effectively unchanged.

**Corpus limit:** this canonical snapshot has **0 counter exceptions**. Its two counter-exception columns are empty, so the measured numeric-field saving comes principally from counts. Nonempty exception columns and values beyond 32 bits—including safe-integer limits—are correctness-tested, but their performance/storage behavior is not represented by this canonical timing corpus. A multi-client/reordered production snapshot remains a necessary generalization check.

| Format / decoder                                                  | Mongo KB/doc: Snappy / zstd | Parse + load p95 ms | Ready p95 ms | Retained JS MB |
| ----------------------------------------------------------------- | --------------------------: | ------------------: | -----------: | -------------: |
| F05: Flat columns, ID array → existing IdList                     |               172.2 / 102.6 |                19.4 |    50.8–51.6 |    6.265–6.266 |
| Flat-F64: Same flat shape; Float64 binary fields + direct decoder |                 86.2 / 57.5 |           20.3–20.6 |    51.5–54.8 |    6.264–6.265 |
| F01: Original objects → existing IdList                           |               196.8 / 110.8 |           18.9–21.0 |    50.1–50.5 |    6.262–6.263 |
| Sflat-joined: Flat JSON, concatenated IDs; previous decoder       |                127.1 / 82.1 |           21.1–21.3 |    50.5–55.8 |    6.264–6.265 |
| Flat-JSON-direct: Same flat JSON; direct decoder                  |                127.1 / 82.1 |           22.3–23.1 |    57.0–58.0 |          6.263 |

Browser values cover **four editors**, each loading the same canonical 104,852-character snapshot. Ranges are the two independently measured batch results, not confidence intervals. Parse + load is the p95 of each sample's decode + conversion/IdList.load time, not a sum of phase percentiles. Ready additionally includes common editor construction and frame waits. No network-transfer metric is included. All rows use the **unchanged existing IdList**, not native F05 or another editable container.

The two flat JSON rows have **identical saved bytes**. The direct decoder avoids expanding the concatenated IDs into a temporary string array and avoids copying typed numeric fields into ordinary number arrays. It still creates the ordinary run objects required by IdList.load. The Float64 row uses that exact same direct decoder, so improvements from the decoder must not be incorrectly attributed to binary encoding. In fact, the direct JSON decoder had worse parse/load p95 than the previous JSON decoder in both batches; fewer temporary arrays did not by itself establish a speed improvement. The table is sorted by the slower observed parse/load p95 across the two batches, not a claim of statistically established ranking.

## Exactly what is stored

The logical JSON stays:

```javascript
{
  bunchIds: "aB3dE5fGaB3dE5fGhJ7kL9mNaB3dE5fG",
  startCounterIndexes: [2, 1],
  startCounters: [20, 8],
  counts: [3, -2, 1, 2]
}
```

Mongo stores the same fields, replacing numeric arrays with Binary:

```javascript
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
  counts: binaryNumbers([3, -2, 1, 2]),
};
await collection.insertOne({ _id: documentId, state });
```

Reading each numeric field is a Float64Array view when alignment and native byte order permit. Unaligned fields are copied once into an aligned buffer; a DataView fallback handles other byte orders. All of this is included in browser measurements. The loader releases these temporary buffers after creating the existing IdList. It does **not** make editing itself zero-copy or retain a new typed-array internal model.

An audit of the serialized BSON payload using a zero-offset Uint8Array reports:

| Field               | Numeric buffer bytes | Byte offset modulo 8 | Alignment copy needed |
| ------------------- | -------------------: | -------------------: | --------------------- |
| startCounterIndexes |                    0 |                    0 | No                    |
| startCounters       |                    0 |                    4 | Yes                   |
| counts              |                94056 |                    1 | Yes                   |

These offsets describe this BSON payload layout, not a guarantee that a different driver/buffer arrangement is aligned. The tested decoder handles both cases. Unit tests exercise all safe-integer extremes, unaligned buffers, portable endian conversion, empty columns, sparse counter exceptions, malformed byte lengths, non-integer values, invalid exception indexes, and exact Mongo roundtrips.

<details><summary>Loading phases, temporary memory and GC</summary>

| Format           | Decode median ms | Conversion + IdList.load median ms | Fresh-context ready median ms | Observed high-water MB | Traced GC median ms |
| ---------------- | ---------------: | ---------------------------------: | ----------------------------: | ---------------------: | ------------------: |
| F01              |              4.3 |                          13.0–13.2 |                     58.0–58.2 |          15.979–15.998 |         1.922–1.933 |
| F05              |              1.5 |                               14.2 |                     57.4–58.4 |          11.681–13.765 |         1.565–1.920 |
| Sflat-joined     |              0.4 |                          18.3–18.4 |                     58.3–59.4 |          14.092–14.607 |         2.276–2.307 |
| Flat-JSON-direct |              0.4 |                          17.4–17.6 |                     57.8–58.3 |          10.294–13.924 |         1.753–1.795 |
| Flat-F64         |              0.1 |                          17.7–17.8 |                     58.1–59.1 |          14.881–14.897 |         1.373–1.518 |

High-water is sampled at stage boundaries in intrusive memory runs, not an exact peak or RSS. GC is traced separately from primary timings and must not be added to ready time. Five fresh-context first loads per batch do not establish cold p95. Phase medians are not additive percentile estimates.

</details>

## Verification and limits

- Two fresh isolated Mongo databases, each with 4 layouts × 2 compressors × 100 independently renamed documents: **16 physical collection measurements**. Each collection compacted twice around a checkpoint. Actual .wt file sizes matched storageSize under fsync lock. Files include collection allocation/free space; indexes and shared database files are excluded. Temporary databases were preserved; production/Atlas was untouched.
- Documents 0 and 99 in every collection were read back and checked against the exact saved state, then validated through existing IdList.load. Mongo renaming preserves every whole-ID equivalence and counter; it does not impose client/sequence structure.
- Two fresh browser processes, each 5 candidates × 5 fresh contexts × 20 warm trials: **1,000 warm loads**, plus 3 post-GC memory trials and 8 traced windows per candidate per batch. Cases are deterministically shuffled; CPU throttling is explicitly 1×. One heavy benchmark ran at a time, with temporary Mongo stopped before browser runs.
- All browser inputs and Mongo source snapshots match SHA256 **b3cc04d6e0a3261d25b13f139d4fdde5c9bd44f956eb6797b79f74fc7583299b**. Independently renamed Mongo document 0 matches **03b8a65280ab9ff04a8b6b6f9975d10a8ff1b8d4370b9ecb967ef91ce78d1006**. Both browser processes executed identical bundles, SHA256 **6d6108009706e24c5d0afac821ffea4e648491e62ec5277f80bd7891d8aad635**, preserved with results. Smoke measurements are excluded.
- Original objects, F05 and the prior flat JSON decoder are fresh same-run controls; older results have not been replaced. Small changes from earlier Mongo results can reflect physical allocation. This is one canonical corpus, not production workload coverage.
- Numeric binary tests use BSON as the browser payload, not JSON base64. Decoding cost is included; fetching and initial benchmark-bundle startup are outside clocks. The harness bundles BSON support for all cases, so incremental production dependency/download/startup cost is not established. If the server instead converts Mongo binary back into JSON numbers, the browser follows the JSON path rather than the binary row here.
- Editing throughput is not a new variable: every candidate reconstructs identical ordered runs and uses the same IdList.load. Correctness includes rendered document text and the first edit. There is no internal data-structure redesign or production migration.

## Evidence and reproduction

[Mongo build 1](results/flat-f64-mongo-1/mongo.json) · [Mongo build 2](results/flat-f64-mongo-2/mongo.json) · [Browser batch 1](results/flat-f64-browser-1/browser.json) · [Browser batch 2](results/flat-f64-browser-2/browser.json) · [Summary](results/flat-f64-browser-1/summary.json) · [Canonical snapshot](results/storage-sweep-browser/canonical-input.json) · [Codec](src/browser/flat-f64-formats.ts) · [Tests](src/browser/flat-f64.test.ts)

From benchmarks/ with Node 24, use TSX_TSCONFIG_PATH=tsconfig.dev.json and DIRECT_STORAGE_F64=1. Set DIRECT_STORAGE_FIXTURE to the absolute canonical-input.json path linked above. For each Mongo build, start a fresh localhost:27186 instance in a new /private/tmp/articulated-direct-storage-* directory, set DIRECT_STORAGE_DBPATH and a fresh DIRECT_STORAGE_OUTPUT, then run node --import tsx src/browser/direct-storage-probe.ts. Stop that verified temporary server before browser measurements. For each browser batch, set a new EXPLORATION_OUTPUT, BROWSER_ID_MODEL=opaque8, BROWSER_DOCUMENTS=4, BROWSER_ROUNDS=5, BROWSER_TRIALS=20, BROWSER_SWITCHES=8, BROWSER_MEMORY_TRIALS=3, BROWSER_CPU_RATE=1 and run node --import tsx src/browser/storage-sweep-run.ts. Generate this report using flat-f64-report.ts. Never overwrite existing evidence.
