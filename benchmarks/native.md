# Same F08 JSON: IdList.load() versus native F08 columns

Draft experiment, not a production migration. **The native implementation is now indexed and copy-on-write: edits rebuild only affected chunks, not every run.** Index construction is included in loading and retained memory. This is F08-backed storage plus indexes—not a claim that fast editing needs no additional internal state.

This compares exactly **two paths: F08 → SavedIdList → IdList.load(), versus native F08 columns**. Every row receives byte-identical **F08 — Columnar store: deduplicate clients + reconstruct counters**, encoded as ordinary JSON. Binary and network transfer are excluded. I1/I2 identify internal designs; F08 identifies the unchanged interchange format.

The old label ‘current tree’ meant Matthew’s existing IdList implementation. ‘Direct construction’ was an additional experimental loader that skipped temporary SavedIdList objects while building the same internals. It is not one of the two requested choices, so it has been removed from this report’s charts and tables. Its historical samples remain untouched in the [unindexed archive](results/native/previous-unindexed/browser.json). This rerun selects only the two requested paths.

## Four-document result

| Internal format / loading path                                | Ready p95 (ms) | Conversion p95 (ms) | Retained JS (MB) | 200 edits, median (ms) |
| ------------------------------------------------------------- | -------------: | ------------------: | ---------------: | ---------------------: |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   |           42.1 |                 8.2 |              4.1 |                    4.0 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList |           58.7 |                24.0 |              6.5 |                    2.2 |

Compared with the normal tree loader, native columns reduced ready p95 by **16.6 ms (28.3%)** and retained JS by **2.4 MB (37.0%)**. The conversion/validation interval fell from 24.0 to 8.2 ms. These are differences between empirical percentiles, not a decomposition of a single load.

**Optimization versus the archived prototype:** 200 edits fell from 119.9 to 4.0 ms median (30.0× faster); 256 lookups fell from 34.4 to 0.6 ms. Retained memory changed from 2.4 to 4.1 MB because the optimized version retains indexes. These before/after measurements are separate runs, not a simultaneous randomized comparison. [Original samples and traces](results/native/previous-unindexed) remain intact.

## What I recommend

1. **Editing performance first:** keep I1, F08 → SavedIdList → IdList.load(). The optimized native implementation's edit batch took 1.8× as long; the lookup batch took 0.8× as long. This describes the tested implementation, not an inherent cost of storing columns.

2. **Opening many documents / retained memory first:** evaluate indexed native F08 against representative documents. Its eager indexes trade some of the unindexed prototype’s memory savings for much faster operations. Use the new load and memory results together; the old 63% retained-memory reduction is not the result for this optimized implementation.

3. **Mongo storage first:** the internal choice changes nothing about the initial F08 snapshot stored in Mongo. Choose the interchange shape separately. This native implementation still needs full API parity, representative editing/undo traces, and long-session memory tests before production use.

## Exactly what is stored and loaded

Both paths store the same Mongo fields and parse the same JSON. Example: three live IDs from alice_0, one from bob_0, two from alice_1, then two deleted IDs from alice_0:

```json
{
  "clientIds": ["alice", "bob"],
  "clientIndices": [0, 1, 0, 0],
  "seqNums": [0, 0, 1, 0],
  "startCounterIndexes": [],
  "startCounters": [],
  "counts": [3, 1, 2, -2]
}
```

Each position in clientIndices, seqNums and counts is a run. Negative counts mean deleted. The start counter defaults to zero for the first run of a whole ID, then the end of its preceding run. Exceptions go into startCounters; startCounterIndexes stores delta-encoded run positions. Here the last run starts at 3, so there is no exception. If it started at 8, those arrays would be [3] and [8].

**ID limitation:** this is Matthew's structured client_sequence design, where the sequence suffix is base 36. It is NOT a proposed conversion of independent opaque 8-character nanoids. F07 deduplicates whole IDs without that requirement; it is a different format and is not the native implementation tested here.

| Case                     | What happens after JSON.parse                                              | What the library uses for lookup/editing                             |
| ------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| I1 / F08 → IdList.load() | Reconstruct IDs/counters into SavedIdList run objects, then build the tree | Matthew’s existing IdList implementation                             |
| I2 / Native F08 columns  | Adopt arrays; validate and build counter, chunk and lookup indexes         | Shared F08 column views; small replacement columns for edited chunks |

The actual native implementation is [NativeF08](src/browser/native.ts), not another adapter that eventually invokes IdList.load:

```ts
const decoded = JSON.parse(json);
const list = NativeF08.load(decoded); // adopts arrays AND builds indexes
list.wireState === decoded; // true: no tree or second snapshot
list.wireState.counts === decoded.counts; // true
const id = list.at(2); // uses chunk lengths and cached counters
const edited = list.delete(id); // copies affected chunks; shares the rest
const snapshot = edited.wireState; // flattens chunks back to F08; measured below
```

Zero-copy adoption does **not** mean zero-cost loading. The original F08 arrays are retained directly, while loading eagerly validates and builds a Float64 start-counter index, chunk-length prefix sums and chunk-local ID → row indexes. Derived whole-ID strings are interned during index construction. Float64 preserves safe integer counters; it is a JS index, not a new binary wire format. All index allocations and build time are measured. Callers transfer ownership of decoded arrays; wireState is read-only by contract, not deeply frozen.

Chunks contain at most 128 runs. at binary-searches chunk lengths, then scans at most one chunk. ID lookup checks chunk-local maps, then only candidate runs. Single-entry edits copy the affected chunk, split it into balanced chunks when needed, and share all untouched columns/indexes. Bulk deletion copies each affected chunk. The outer chunk directory/prefix sums are copied per edit: this is not a logarithmic persistent tree, and very large/long-lived documents need further scaling tests. No IdList tree is constructed.

Implemented API subset: length, at, indexOf (including deleted-entry bias), insertAfter, delete, and save for correctness checks. No insertBefore, undelete, uninsert, or complete iterator/API parity. The prototype lives in the benchmark package; the public library default has not changed.

## Load speed, conversion and GC

![Four-document load speed, fastest p95 first](results/native/speed-4.svg)

Complete-ready covers decoding → internal list → ProseMirror creation → layout → a rendering opportunity. Conversion is timed directly around the loader and is already part of total. Common editor/layout work is not presented as a separate competitive metric. GC is measured in separate traced runs; do not add that bar to the timed total.

For **one document**, ready p95 was 16.8 ms with F08 → IdList.load() and 16.8 ms with native columns. Native conversion still fell from 6.2 to 2.6 ms, but the rendering-opportunity threshold masked that gain in this workload. Do not promise a visible single-document speedup from these results.

## JS memory

![Four-document retained memory and allocation](results/native/memory-4.svg)

Retained = JS heap + backing storage after forced GC, relative to the empty harness, with editors loaded and the first edit completed. It includes editor/model state, not just IDs. Observed high-water is the largest sampled phase boundary, not an exact peak. Sampled allocations include subsequently collected objects; they are not retained memory. These three values are different measures and must not be added. These runs do not measure memory after the sustained edit batch or total renderer RSS.

## Lookup and edit cost

![Lookups, edits and one final render](results/native/editing-4.svg)

Each fresh-context trial retains one or four documents but operates on **one**: 128 distributed at calls + 128 indexOf calls, followed by 100 inserts and 100 deletes at deterministic distributed positions. Both designs perform real immutable mutations; the final saved IDs are checked against the reference tree. The document's final text is rendered once after the batch and verified. ID anchors and expected text are prepared outside the timing interval.

This is **not** 200 simulated keystrokes or 200 incremental ProseMirror renders. Operation timing isolates library work; batch + render adds one final document replacement/layout/rendering opportunity. Ten trials support medians and ranges, not a robust p95 editing claim. It does not cover a representative production distribution of local typing, remote merges, undo, or long edit sessions.

In one separately traced four-document edit batch, F08 → IdList.load() / native columns spent **0.3 / 0.3 ms** in main-thread GC, with **1 / 1** events. GC during snapshot export is outside this edit/paint trace interval. This single trace per case is diagnostic, not an estimate of tail GC.

### Edit-only audit after optimization

The edit-only rerun removes ProseMirror, rendering, frame waits and lookups. Loading and full-state correctness checks remain outside the timer. Each implementation gets three fresh contexts, then three warmups and ten measured batches per context. See [diagnostic samples and work counts](results/native/edit-audit.json) and the [reproduction script](src/browser/edit-audit.mjs). These diagnostic samples supplement the matched editor run; they do not replace it.

| Path                     | First 200-edit batch range (ms, 3 contexts) | Warmed 200-edit batch median (ms, 30 samples) |
| ------------------------ | ------------------------------------------: | --------------------------------------------: |
| I1 — F08 → IdList.load() |                                     2.4–2.4 |                                           0.8 |
| I2 — Native F08 columns  |                                     3.8–4.1 |                                           2.3 |

The original implementation visited roughly 2.46 million runs and allocated 2.46 million temporary tuples per 200 edits. The new implementation has no per-run pending tuples and only copies affected chunks. Counts below exclude validation/export; the separate CPU profile includes final correctness checks and is diagnostic only. All edit times are whole-batch totals, not individual edit latency.

**Interpretation correction:** the ~120 ms result described the original inefficient implementation, not a necessary cost of native F08. The new implementation replaces full rewrites with chunk sharing. It is still experimental, and the extra indexes mean it is not literally only the decoded JSON object.

In the instrumented 200-edit batch: **17,134 copied existing runs**, **17,719 rows indexed in replacement chunks**, and **28,760 prefix entries rebuilt**. These are different work counts, not timings or bytes; they must not be added to the original run-visit count.

## Snapshot export after edits

Editing no longer rebuilds the complete F08 snapshot. Export therefore has an explicit cost: native F08 flattens chunks and regenerates counter exceptions; the existing IdList uses save() followed by toClientIndexOmit(). Both return the same F08 format, although dictionary order may differ. The following timings are taken after the same 200 edits, after the edit/render timer ends, and before correctness checks.

| Path                     | Export F08 median (ms) | JSON.stringify median (ms) |
| ------------------------ | ---------------------: | -------------------------: |
| I2 — Native F08 columns  |                    1.0 |                        0.2 |
| I1 — F08 → IdList.load() |                    3.2 |                        0.2 |

This is CPU work only, not wire size or network timing. Export revalidates via a round trip outside the timer. The unedited native list returns its original object; this measurement deliberately uses edited state. Repeated edited exports flatten again; no hidden snapshot cache is retained. The old full-rewrite implementation needed no export-time flattening, so the new saving cost is not claimed to be free.

## Mongo storage: unchanged by this internal-format choice

| Internal representation  | Mongo Snappy KB/document | Mongo Zstd KB/document |
| ------------------------ | -----------------------: | ---------------------: |
| I1 — F08 → IdList.load() |                    188.7 |                   74.0 |
| I2 — Native F08 columns  |                    188.7 |                   74.0 |

Both persist the same initial F08 fields. These are the existing **measured Mongo 8.3.3 collection-file results**, not estimates from JSON/BSON size: 100 documents per layout, independent client dictionaries, compact/checkpoint and locked filesystem sync. Collection indexes/shared server overhead excluded. Mongo was not rerun because the stored payload is unchanged. The measurement is for the initial snapshot, not the post-edit batch. [Storage procedure and raw data](browser.md#physical-mongo-storage-all-measurements).

## Complete measurements (collapsed)

<details><summary>1 document(s): load, memory, edits, GC and per-round p95</summary>

| Internal / loader                                             | Decode p95 ms | Conversion p50 / p95 ms | Ready p50 / p95 / max ms | First edit + render p95 ms | Load GC mean ms |
| ------------------------------------------------------------- | ------------: | ----------------------: | -----------------------: | -------------------------: | --------------: |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   |           0.3 |               1.9 / 2.6 |       16.6 / 16.8 / 16.9 |                       17.7 |             0.6 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList |           0.3 |               5.3 / 6.2 |       16.6 / 16.8 / 21.3 |                       17.5 |             0.8 |

| Internal / loader                                             | Retained median MB | High-water maximum MB | Allocations median MB | Ready p95 by round (ms)          |
| ------------------------------------------------------------- | -----------------: | --------------------: | --------------------: | -------------------------------- |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   |                1.0 |                   2.6 |                   4.4 | 16.8 / 16.8 / 16.7 / 16.7 / 16.7 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList |                1.6 |                   3.7 |                  14.7 | 16.7 / 16.7 / 16.8 / 16.8 / 16.8 |

| Path                     | Export F08 median ms | Stringify median ms |
| ------------------------ | -------------------: | ------------------: |
| I2 — Native F08 columns  |                  1.1 |                 0.2 |
| I1 — F08 → IdList.load() |                  3.3 |                 0.1 |

Operation batches: median [minimum–maximum], ms. GC: one separate traced batch.

| Internal / loader                                             |   256 lookups |     200 edits | Both batches + final render | GC ms / events / longest ms |
| ------------------------------------------------------------- | ------------: | ------------: | --------------------------: | --------------------------: |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   | 0.7 [0.6–0.8] | 4.4 [4.1–4.7] |            13.2 [11.4–17.4] |               0.2 / 1 / 0.2 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList | 0.8 [0.7–0.9] | 2.2 [2.0–2.4] |             14.1 [9.2–16.8] |               0.4 / 1 / 0.4 |

![One-document load speed](results/native/speed-1.svg)

![One-document JS memory](results/native/memory-1.svg)

![One-document editing](results/native/editing-1.svg)

</details>

<details><summary>4 document(s): load, memory, edits, GC and per-round p95</summary>

| Internal / loader                                             | Decode p95 ms | Conversion p50 / p95 ms | Ready p50 / p95 / max ms | First edit + render p95 ms | Load GC mean ms |
| ------------------------------------------------------------- | ------------: | ----------------------: | -----------------------: | -------------------------: | --------------: |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   |           0.9 |               6.1 / 8.2 |       34.7 / 42.1 / 43.4 |                       17.1 |             1.3 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList |           0.9 |             20.0 / 24.0 |       50.0 / 58.7 / 77.8 |                       17.7 |             2.5 |

| Internal / loader                                             | Retained median MB | High-water maximum MB | Allocations median MB | Ready p95 by round (ms)          |
| ------------------------------------------------------------- | -----------------: | --------------------: | --------------------: | -------------------------------- |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   |                4.1 |                   7.8 |                  17.0 | 42.6 / 41.7 / 41.7 / 41.8 / 41.8 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList |                6.5 |                  14.7 |                  57.5 | 58.4 / 58.3 / 60.3 / 58.3 / 58.4 |

| Path                     | Export F08 median ms | Stringify median ms |
| ------------------------ | -------------------: | ------------------: |
| I2 — Native F08 columns  |                  1.0 |                 0.2 |
| I1 — F08 → IdList.load() |                  3.2 |                 0.2 |

Operation batches: median [minimum–maximum], ms. GC: one separate traced batch.

| Internal / loader                                             |   256 lookups |     200 edits | Both batches + final render | GC ms / events / longest ms |
| ------------------------------------------------------------- | ------------: | ------------: | --------------------------: | --------------------------: |
| I2 — Native F08 columns — Adopt arrays; build chunk indexes   | 0.6 [0.6–0.8] | 4.0 [3.9–4.5] |            16.6 [14.3–18.7] |               0.3 / 1 / 0.3 |
| I1 — F08 → IdList.load() — Convert to SavedIdList; use IdList | 0.8 [0.7–0.9] | 2.2 [2.1–2.8] |             12.3 [8.9–17.9] |               0.3 / 1 / 0.3 |

</details>

## Reproduce and interpret

Run started 2026-10-21T02:37:44.706Z. Chromium 151.0.7922.34, Apple M5 Pro, CPU rate 1×. Same 104,852-character, 1,173-paragraph, 12,091-run Kleppmann trace used by the interchange benchmark, with Matthew's structured IDs. Four documents are four copies of this trace, not a corpus of independent production documents.

Two paths × two document counts × 5 fresh-context rounds × 20 measured replacement loads = **400 warm timed loads**, with shuffled case order and no filtered samples. First load in each context is retained separately as cold data, not mixed into the p95. Separate passes: **32 traced loads**, **12 memory runs**, **40 edit/lookup batches**, and **4 traced operation batches**. Both compared paths were measured together; this report does not compare new native timings against the older interchange run.

Ready is a two-animation-frame proxy, not physical display scan-out. The controlled minimal ProseMirror harness is not the production integration. Server/network transfer and ID generation are excluded. The first edit is measured separately after readiness. GC uses matched main-thread trace windows with paint checks and an outside-window GC canary; timing runs are untraced. Memory measurements are intrusive and separate from primary timing. Cold samples, first edits and raw phases remain available.

Correctness checks cover full loaded/edited SavedIdList equality, visible length, actual rendered text, paint events and backing-memory calibration. Unit tests verify identical encoders/decoders across cases, exact array identity, no hidden tree fallback, 250 exhaustive small-list mutations plus 1,200 randomized multi-chunk mutations against the reference tree, branching from prior versions, shared untouched chunks, all visible lookups in boundary/bulk tests, tombstone bias, large counters, snapshot export and malformed input. This is not complete public-API parity or security hardening.

From the benchmark package, using the repository's pinned dependencies:

```sh
npm run native:run
npm run native:audit
npm run native:report
npm test
```

[Raw measurements](results/native/browser.json) · [Completion record](results/native/complete.json) · [Exact edit workload](results/native/edit-workload.json) · [GC traces](results/native/traces) · [Native implementation](src/browser/native.ts) · [Matched candidates](src/browser/native-candidates.ts) · [Shared rendering/timing harness](src/browser/page-runtime.ts) · [Broader interchange-format comparison and examples F01–F09](browser.md)
