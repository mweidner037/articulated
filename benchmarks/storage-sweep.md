# Storage-format sweep — existing IdList unchanged

**Historical sweep:** the later [flat Float64 study](flat-f64.md) tests a no-pages, full-safe-integer binary alternative. Use the [consolidated recommendation](recommendation.md) for the final decision; rankings below apply only to this sweep's candidates.

## Conclusions

1. **Lowest measured JSON storage: 128-run pages with concatenated eight-character IDs (S128-joined).** This preserves your exact IDs and ordinary JSON, using 118.9 / 74.0 KB per document under Snappy / zstd. Compared with original objects, the zstd saving is 33.3%. It is not free on loading: across the full sweep and fresh-process repeat, parse + load p95 was 20.8–21.4 ms versus 19.0–19.1 ms for F01; full readiness was 58.3 ms versus 50.1–50.8 ms. These times cover four editors, not one. They are observed p95 ranges across two batches, not confidence intervals.
2. **Keep ordinary ID arrays if simpler decoding is the priority.** 64-run pages measured 151.7 / 86.3 KB per document, versus DS08's 159.9 / 86.3. That keeps the DS08 logical fields and improves Snappy without concatenation. It has only the full-sweep browser measurement, not the focused repeat. F05 remains a whole-document alternative with near-baseline loading in both browser batches, but costs 172.3 / 102.7 KB. Page-local dictionaries did not beat concatenated IDs on storage in this corpus.
3. **Lowest measured bytes, as a separate binary optimization: S128-joined-binary.** 90.3 / 61.6 KB per document, with parse + load p95 22.3–23.4 ms. It uses the same JSON shape with numeric fields encoded as binary, not a different internal library. The checked int32 range restriction below must be addressed before treating it as a general production codec.

**Browser editing and retained memory are not improved by these saved formats.** All load into the same existing IdList; retained memory is about 6.26–6.29 MB across four editors. The new measurements do not support calling the smaller encodings a browser-performance win. DS08's ready p95 itself varied from 58.4 ms in the full sweep to 51.0 ms in the repeat; both results are retained. Compare decoding/loading cost as well as frame-quantized readiness, rather than selecting whichever batch looks best.

## Scope

These are storage/interchange changes, **not new editable containers**. Every candidate decodes to exactly the same ordered SavedIdList, then calls the same existing IdList.load. No bulk-build or native-container experiment is enabled. Subsequent editing uses the same implementation and construction path. Retained-memory differences are observations, not a claimed new data-structure advantage.

22 candidates: original objects; whole-document/32/64/128/256/512-run columns with repeated IDs, concatenated fixed-eight-character IDs, or page-local dictionaries; then the same 128-run shapes with binary numeric fields. Binary is a secondary encoding experiment.

## Measured comparison

Mongo cells show the range across **two fresh isolated database builds**, 100 independently renamed opaque-ID documents per collection. Browser cells cover **four editors**. Parse + load is the p95 of each sample's measured decoding plus conversion/IdList.load time—not a sum of separately computed percentiles. Ready includes editor creation and the two-frame readiness proxy; it is not physical screen-scanout timing. Network transfer is excluded.

| Format                                                                                      | Mongo KB/doc: Snappy / zstd | Parse + load p95, ms | Ready p95, ms | Retained JS, MB | Below F01 in both? |
| ------------------------------------------------------------------------------------------- | --------------------------: | -------------------: | ------------: | --------------: | ------------------ |
| S128-joined-binary: 128-run pages; IDs concatenated into one string; binary numeric columns |                 90.3 / 61.6 |                 23.4 |          59.4 |           6.271 | Yes                |
| S128-array-binary: 128-run pages; ordinary ID arrays; binary numeric columns                |                131.2 / 73.9 |                 23.4 |          58.4 |           6.291 | Yes                |
| S128-joined: 128-run pages; IDs concatenated into one string                                |                118.9 / 74.0 |                 21.4 |          58.3 |           6.268 | Yes                |
| DS08: 128-run pages; ordinary ID arrays                                                     |                159.9 / 86.3 |                 20.7 |          58.4 |           6.269 | Yes                |
| F05: Whole-document columns; ordinary ID arrays                                             |               172.3 / 102.7 |                 19.6 |          50.5 |           6.266 | Yes                |
| F01: Original saved objects                                                                 |               196.8 / 110.9 |                 19.1 |          50.8 |           6.262 | Yes                |

The smallest eligible JSON result in this sweep is **S128-joined**; the smallest eligible binary result is **S128-joined-binary**. Ranking uses the larger observed zstd size across the two builds, then Snappy as a tie-break. This is a corpus-specific ranking, not a guarantee for other documents. Small timing differences must be interpreted in context of frame quantization and host variability.

<details><summary>Independent browser repeat: baseline and leading candidates, 500 additional warm loads</summary>

A new browser process, the exact same measured bundle and source snapshot, five fresh contexts × 20 trials per case. This repeat does not replace or pool away the original sweep. Sorted by parse + load p95; all values cover four editors.

| Format             | Parse + load p95 ms | Ready p95 ms | Retained JS MB |
| ------------------ | ------------------: | -----------: | -------------: |
| F01                |                19.0 |         50.1 |          6.263 |
| F05                |                19.5 |         50.1 |          6.265 |
| DS08               |                19.7 |         51.0 |          6.269 |
| S128-joined        |                20.8 |         58.3 |          6.268 |
| S128-joined-binary |                22.3 |         58.3 |          6.271 |

</details>

## What is stored?

All examples below encode the same four runs: ID aB3dE5fG at counter 0, visible 3; the same ID at counter 3, deleted 2; ID hJ7kL9mN at counter 20, visible 1; the first ID at counter 8, visible 2. Mongo adds the common {_id, state} wrapper. Signed counts and counter-exception semantics are unchanged across this sweep.

### DS08: 128-run pages; ordinary ID arrays

```json
{
  "pages": [
    {
      "bunchIds": ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
      "startCounterIndexes": [2, 1],
      "startCounters": [20, 8],
      "counts": [3, -2, 1, 2]
    }
  ]
}
```

### S128-joined: 128-run pages; IDs concatenated into one string

```json
{
  "pages": [
    {
      "bunchIds": "aB3dE5fGaB3dE5fGhJ7kL9mNaB3dE5fG",
      "startCounterIndexes": [2, 1],
      "startCounters": [20, 8],
      "counts": [3, -2, 1, 2]
    }
  ]
}
```

Binary variants retain the identical field structure but replace numeric arrays with generic BSON Binary values. Each value is a sequence of little-endian signed int32s; types are fixed by schema, not stored alongside each column. For example counts [3, -2, 1, 2] becomes bytes 03 00 00 00 FE FF FF FF 01 00 00 00 02 00 00 00. IDs remain strings/an array of strings. This prototype **rejects values outside signed int32 range**; it is not a drop-in codec for all safe-integer counters. A production choice must preserve the library's supported range or define a safe fallback. BSON is decoded in-browser before conversion into the unchanged IdList; all that work is included. There is no base64 wire workaround in the benchmark.

<details><summary>All 22 results, sorted by zstd physical storage</summary>

| Format                                                                                            | Mongo KB/doc: Snappy / zstd | Parse + load p95, ms | Ready p95, ms | Retained JS, MB | Below F01 in both? |
| ------------------------------------------------------------------------------------------------- | --------------------------: | -------------------: | ------------: | --------------: | ------------------ |
| S128-joined-binary: 128-run pages; IDs concatenated into one string; binary numeric columns       |                 90.3 / 61.6 |                 23.4 |          59.4 |           6.271 | Yes                |
| S128-dictionary-binary: 128-run pages; ID dictionary + numeric references; binary numeric columns |                127.1 / 73.9 |                 23.2 |          58.3 |           6.265 | Yes                |
| S128-array-binary: 128-run pages; ordinary ID arrays; binary numeric columns                      |                131.2 / 73.9 |                 23.4 |          58.4 |           6.291 | Yes                |
| S128-joined: 128-run pages; IDs concatenated into one string                                      |                118.9 / 74.0 |                 21.4 |          58.3 |           6.268 | Yes                |
| S512-joined: 512-run pages; IDs concatenated into one string                                      |                122.5 / 78.0 |                 24.1 |          58.4 |           6.264 | Yes                |
| S64-joined: 64-run pages; IDs concatenated into one string                                        |                118.8 / 78.1 |                 24.9 |          58.3 |           6.263 | Yes                |
| S32-joined: 32-run pages; IDs concatenated into one string                                        |                118.9 / 78.1 |                 22.2 |          58.2 |           6.263 | Yes                |
| S256-joined: 256-run pages; IDs concatenated into one string                                      |                123.0 / 78.1 |                 24.8 |          58.4 |           6.264 | Yes                |
| Sflat-joined: Whole-document columns; IDs concatenated into one string                            |                127.3 / 82.2 |                 22.4 |          58.3 |           6.265 | Yes                |
| S32-array: 32-run pages; ordinary ID arrays                                                       |                151.7 / 86.3 |                 22.8 |          52.4 |           6.263 | Yes                |
| S64-array: 64-run pages; ordinary ID arrays                                                       |                151.7 / 86.3 |                 20.0 |          50.8 |           6.265 | Yes                |
| DS08: 128-run pages; ordinary ID arrays                                                           |                159.9 / 86.3 |                 20.7 |          58.4 |           6.269 | Yes                |
| S256-array: 256-run pages; ordinary ID arrays                                                     |                164.0 / 86.3 |                 20.4 |          51.0 |           6.265 | Yes                |
| S32-dictionary: 32-run pages; ID dictionary + numeric references                                  |                163.7 / 90.4 |                 20.1 |          50.4 |           6.263 | Yes                |
| S512-array: 512-run pages; ordinary ID arrays                                                     |           164.0 / 90.3–90.4 |                 21.4 |          58.2 |           6.263 | Yes                |
| S64-dictionary: 64-run pages; ID dictionary + numeric references                                  |                168.1 / 90.4 |                 21.0 |          58.4 |           6.265 | Yes                |
| S128-dictionary: 128-run pages; ID dictionary + numeric references                                |                180.4 / 90.4 |                 21.4 |          58.3 |           6.265 | Yes                |
| S256-dictionary: 256-run pages; ID dictionary + numeric references                                |                189.8 / 94.1 |                 20.2 |          50.2 |           6.266 | Yes                |
| S512-dictionary: 512-run pages; ID dictionary + numeric references                                |                196.3 / 98.5 |                 21.8 |          50.4 |           6.263 | Yes                |
| F05: Whole-document columns; ordinary ID arrays                                                   |               172.3 / 102.7 |                 19.6 |          50.5 |           6.266 | Yes                |
| F01: Original saved objects                                                                       |               196.8 / 110.9 |                 19.1 |          50.8 |           6.262 | Yes                |
| Sflat-dictionary: Whole-document columns; ID dictionary + numeric references                      |         200.9–201.0 / 119.1 |                 21.2 |          51.4 |           6.266 | No                 |

</details>

<details><summary>Loading phase details, sorted by parse + load p95</summary>

| Format                 | Decode median ms | Conversion + IdList.load median ms | Parse + load p95 ms | Fresh-context ready median ms | Observed loading high-water MB | Traced GC median ms |
| ---------------------- | ---------------: | ---------------------------------: | ------------------: | ----------------------------: | -----------------------------: | ------------------: |
| F01                    |              4.3 |                               13.1 |                19.1 |                          58.3 |                         10.938 |               1.689 |
| F05                    |              1.5 |                               14.5 |                19.6 |                          57.9 |                         11.696 |               1.401 |
| S64-array              |              1.6 |                               14.5 |                20.0 |                          58.2 |                         13.963 |               2.145 |
| S32-dictionary         |              1.5 |                               14.9 |                20.1 |                          58.3 |                         11.141 |               2.274 |
| S256-dictionary        |              1.2 |                               14.7 |                20.2 |                          58.1 |                         13.938 |               2.141 |
| S256-array             |              1.5 |                               14.4 |                20.4 |                          58.3 |                         12.475 |               2.232 |
| DS08                   |              1.6 |                               14.7 |                20.7 |                          58.3 |                         13.830 |               1.365 |
| S64-dictionary         |              1.4 |                               14.9 |                21.0 |                          58.9 |                         14.076 |               1.831 |
| Sflat-dictionary       |              1.1 |                               14.8 |                21.2 |                          58.1 |                         14.544 |               1.438 |
| S128-dictionary        |              1.2 |                               14.7 |                21.4 |                          58.4 |                         14.044 |               2.254 |
| S512-array             |              1.5 |                               14.5 |                21.4 |                          58.1 |                         14.317 |               1.399 |
| S128-joined            |              0.4 |                               18.9 |                21.4 |                          58.9 |                         14.821 |               2.170 |
| S512-dictionary        |              1.1 |                               14.8 |                21.8 |                          58.3 |                         14.518 |               2.280 |
| S32-joined             |              0.6 |                               19.1 |                22.2 |                          58.3 |                         12.463 |               2.327 |
| Sflat-joined           |              0.4 |                               18.7 |                22.4 |                          59.0 |                         14.171 |               2.037 |
| S32-array              |              1.8 |                               14.7 |                22.8 |                          58.2 |                         14.169 |               2.024 |
| S128-dictionary-binary |              1.0 |                               19.9 |                23.2 |                          66.2 |                         10.078 |               2.001 |
| S128-joined-binary     |              0.3 |                               20.1 |                23.4 |                          65.8 |                         10.019 |               1.942 |
| S128-array-binary      |              1.7 |                               19.5 |                23.4 |                          66.5 |                         13.868 |               2.187 |
| S512-joined            |              0.4 |                               18.8 |                24.1 |                          58.5 |                         14.076 |               2.038 |
| S256-joined            |              0.4 |                               18.9 |                24.8 |                          66.6 |                         14.244 |               2.132 |
| S64-joined             |              0.5 |                               19.3 |                24.9 |                          59.1 |                         14.300 |               2.083 |

Phase medians are diagnostic, not additive p95 estimates. Loading high-water is sampled at phase boundaries under intrusive memory probes, not an exact peak or RSS. Five fresh-context loads do not support a reliable cold p95. GC medians come from eight separate traced windows; they are not production pause tails and must not be added to untraced readiness timings.

</details>

## Verification and limits

- **88 physical Mongo measurements**: 22 formats × 2 compressors × 2 fresh databases; each collection compacted twice, with a checkpoint between. Actual .wt file length matched collection storageSize while fsync-locked. Sizes include collection allocation/free space but exclude indexes/shared database files. These are fresh inserted snapshots, not an update-fragmentation workload.
- Every collection's documents 0 and 99 were read back, decoded, checked for exact saved-state equality, then validated by the existing library. No production/Atlas data was touched; temporary databases and all prior results were preserved.
- **2,200 warm browser loads**: 5 fresh contexts × 20 trials × 22 candidates, shuffled case order; 3 memory trials and 8 separately traced GC windows per candidate. The same Chromium process is used with fresh contexts and explicit 1× CPU throttling. Natural GC is included in timed replacement loads; memory is post-GC heap plus backing storage after the first edit.
- **500 additional confirmation loads**: a new browser process and the same settings for F01, F05, DS08, S128-joined, and S128-joined-binary. Both complete batches are retained; timings are not selectively replaced by the faster run.
- Four editors each load the same 104,852-character, 11,757-run canonical snapshot. ID values are harness-assigned opaque eight-character identities, not recorded collaborator IDs. This is one workload, not a representative production corpus.
- Mongo and browser source snapshot SHA256: b3cc04d6e0a3261d25b13f139d4fdde5c9bd44f956eb6797b79f74fc7583299b. Mongo additionally independently renames whole IDs per stored document; document 0 SHA256: 03b8a65280ab9ff04a8b6b6f9975d10a8ff1b8d4370b9ecb967ef91ce78d1006. Exact source topology matches; renamed Mongo document bytes intentionally differ from browser IDs.
- Browser measured bundle SHA256: 32b46e5d1100b999831e1b971f89a682467482946680f15f57aeecc569f19dc0. The executed bundle is preserved alongside raw results. Smoke-test output is excluded from all reported measurements.
- Editing throughput is not reranked here: all formats construct the same IdList from identical ordered runs. The harness checks the rendered document and first edit for every load. Earlier runtime-replacement editing benchmarks answer a different question.
- These candidate formats are experiments; migration/versioning and representative multi-client production data remain follow-up work. The F01 ceiling is enforced per compressor and repeat on this corpus, not claimed universally.

## Evidence and reproduction

[First Mongo build](results/storage-sweep-mongo-1/mongo.json) · [Second Mongo build](results/storage-sweep-mongo-2/mongo.json) · [Browser results](results/storage-sweep-browser/browser.json) · [Browser repeat](results/storage-sweep-browser-confirm/browser.json) · [Canonical input snapshot](results/storage-sweep-browser/canonical-input.json) · [Summary JSON](results/storage-sweep-browser/summary.json) · [Encoders/decoders](src/browser/storage-sweep-formats.ts) · [Round-trip tests](src/browser/storage-sweep.test.ts)

Use Node 24 with TSX_TSCONFIG_PATH=tsconfig.dev.json from benchmarks/. For Mongo, run direct-storage-probe.ts with DIRECT_STORAGE_SWEEP=1, DIRECT_STORAGE_FIXTURE pointing to the canonical SavedIdList JSON, DIRECT_STORAGE_DBPATH pointing to a fresh /private/tmp/articulated-direct-storage-* directory on localhost:27186, and a new DIRECT_STORAGE_OUTPUT. Stop the isolated server before running storage-sweep-run.ts with the same fixture, BROWSER_ID_MODEL=opaque8, BROWSER_DOCUMENTS=4, BROWSER_CPU_RATE=1, BROWSER_ROUNDS=5, BROWSER_TRIALS=20, BROWSER_SWITCHES=8, BROWSER_MEMORY_TRIALS=3, EXPLORATION_OUTPUT=storage-sweep-browser. Never overwrite existing evidence. Generate this report with storage-sweep-report.ts.
