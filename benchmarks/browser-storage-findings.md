# Browser performance and Mongo storage: measured findings

**Historical study:** the subsequent [runtime optimization study](library-performance.md) tests the hypotheses below. Use the [consolidated recommendation](recommendation.md) for the final storage/runtime decision; the observations here are preserved, not updated with later batches.

The objective is **good browser performance within the F01 Mongo storage ceiling**, not identical storage and runtime layouts. Translation is worth optimizing only when its measured cost matters. These experiments separate the adapter from initialization of the editable container, and measure the complete browser loading path too.

## The two outcomes

All browser rows below load **four documents**, each with 104,852 characters and 11,757 saved runs, using opaque eight-character IDs. Ready p95 is from 100 warm replacement loads per row; memory is median retained JS after loading and the first edit, including the editor, relative to the empty harness. Mongo is physical collection storage **per document**, with 100 independently renamed copies. KB/MB are decimal. Lower is better. Sorted by ready p95.

| Stored format → browser container                    | Browser ready p95, ms | Browser retained MB | Mongo KB/doc: Snappy / zstd | Within F01 for both? |
| ---------------------------------------------------- | --------------------: | ------------------: | --------------------------: | -------------------- |
| F05 whole-document columns → native F05 owned pages  |                  41.7 |               3.783 |               172.3 / 102.7 | Yes                  |
| **DS08 page-local columns → native F05 owned pages** |              **42.5** |           **3.798** |            **159.9 / 86.3** | **Yes**              |
| F05 whole-document columns → existing IdList         |                  50.0 |               6.264 |               172.3 / 102.7 | Yes                  |
| F01 plain objects → existing IdList                  |                  51.2 |               6.263 |               196.9 / 110.9 | Baseline             |
| DS08 page-local columns → existing IdList            |                  51.2 |               6.264 |                159.9 / 86.3 | Yes                  |

**DS08 + native F05 is the leading measured loading/memory/storage combination here:** versus F01 + existing IdList, ready p95 is 17.0% lower, retained JS is 39.4% lower, and Mongo storage is 18.8% lower with Snappy / 22.2% lower with zstd. The 0.8 ms p95 difference between the two native-F05 storage paths is not evidence of a dependable performance ranking. Their memory is effectively the same.

These are experimental containers, not production-complete replacements. In particular, faster loading does **not** establish faster sustained editing. The existing library baseline also includes the experimental loader hooks inherited by this branch; it is not an untouched upstream release.

## What is actually expensive in the frontend?

Instrumented medians, in milliseconds **across all four documents**:

| Stored format → container | Parse JSON | Translate format | Build editable container | Editor setup/residual | Layout |
| ------------------------- | ---------: | ---------------: | -----------------------: | --------------------: | -----: |
| F01 → existing IdList     |        4.3 |              0.0 |                     13.1 |                   7.0 |   14.0 |
| F05 → existing IdList     |        1.5 |              1.0 |                     13.1 |                   6.9 |   13.8 |
| F05 → native F05          |        1.4 |              0.0 |                      3.1 |                   7.0 |   14.1 |
| DS08 → existing IdList    |        1.5 |              1.6 |                     13.4 |                   7.4 |   14.1 |
| DS08 → native F05         |        1.5 |              3.3 |                      3.1 |                   7.1 |   14.0 |

**The actionable container cost is initialization, not merely translation.** Existing IdList construction takes about 13 ms here, versus about 3 ms for native F05. DS08's current native adapter even goes through run objects and back to flat F05 columns; all that work is charged. It still preserves most of the observed loading benefit. Eliminating that adapter is not a prerequisite for choosing the smaller stored format.

Zero in the translation column means no separately instrumented run-object adapter. It does **not** mean free initialization: validation, counter reconstruction, ownership copies and index building are in the build column. Phase medians and p95 values describe different distributions and must not be added/subtracted to derive a total. The ready measurements above are taken directly around each complete load.

Layout and editor setup are material remaining frontend costs, but are similar across these containers. They remain included in ready time; they are **not claimed as benefits of changing ID storage**. Editor setup/residual includes harness teardown/control work and is not a pure ProseMirror constructor measurement. Ready also includes waiting for two animation frames: a rendering-opportunity proxy, not physical screen scan-out. Network/server time is excluded.

### What to optimize next, based on this evidence

1. **Loading and memory:** pursue the native F05 container with DS08 storage, while completing its API and verifying sustained editing. Alternatively, investigate bulk construction of the existing IdList identity index: the current loader builds its balanced sequence tree linearly but inserts leaves into a persistent ordered identity index individually. That is a source-backed optimization hypothesis, **not a measured improvement yet**.
2. **Editing throughput and GC:** reduce directory/prefix copying and identity lookup costs in the native container; measure those changes with the complete canonical editor replay and retained versions. Native F05's loading advantage does not erase its slower ID-operation stream. Wide paged navigation and numeric node references remain candidate designs, not proven replacements.
3. **Translation:** retain the measured adapter for now. Optimize it if larger documents or cold-opening results show it materially affecting readiness. Do not spend extra Mongo bytes persisting indexes just to eliminate a small adapter.

## What DS08 actually stores in Mongo

DS08 is F05's signed-count/counter-reconstruction idea applied independently to pages of at most 128 saved runs. These are **ordinary BSON objects and arrays**, not a custom binary container. The example has only four runs so it fits in one page:

```javascript
{
  _id: 0,
  state: {
    pages: [{
      bunchIds: ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
      startCounterIndexes: [2, 1],
      startCounters: [20, 8],
      counts: [3, -2, 1, 2]
    }]
  }
}
```

This represents `(ID, start, signed count)` values `(aB3dE5fG, 0, 3)`, `(aB3dE5fG, 3, -2)`, `(hJ7kL9mN, 20, 1)`, `(aB3dE5fG, 8, 2)`. Negative counts mean deleted. `startCounterIndexes` contains delta-encoded row indexes: exceptions are at row 2 and then row 3. Without an exception, the next counter for that ID is inferred from its previous run's end. Inference restarts at zero for each ID on each page; nonzero first counters are explicit.

The browser rebuilds runtime navigation separately. Storage pages and runtime pages do not have to retain identical boundaries after editing. This example does not deduplicate whole IDs or invent structure inside them.

DS08 is 16.0% smaller than flat F05 with zstd and 7.2% smaller with Snappy in this experiment. DS07 identity-span pages tie DS08 on zstd, but use more Snappy storage. Page-local BSON keys/locality are possible reasons for the saving, **not an isolated causal finding**. Only page size 128 was measured for Mongo; it is not claimed optimal.

## Typed arrays: no material win in the controlled test

This separate browser probe held the semantic data/index topology fixed and varied numeric array storage. It performed 2,000 whole-run visibility toggles, not editor insertions/splits. Three fresh-browser trials per case; 42 total jobs. Values below use 128-run pages.

| Numeric storage                                  | Loaded MB | MB after toggles, 100 retained versions | 2,000 toggles, ms |
| ------------------------------------------------ | --------: | --------------------------------------: | ----------------: |
| Ordinary numeric arrays                          |     1.032 |                                   1.189 |               1.1 |
| Typed dense columns; ordinary small index arrays |     1.049 |                                   1.224 |               1.6 |
| All numeric arrays typed                         |     1.263 |                                   1.441 |   See raw results |

Dense typing used about 17 KB more loaded memory here: no memory saving, and small compared with paging's multi-megabyte history reduction. Thousands of small typed-array wrappers were more costly. Ordinary flat arrays retained 5.678 MB with history versus 1.189 MB with pages: bounded copying mattered much more than numeric width **in this probe**.

This does not establish that typed arrays are generally bad. The test includes conversion/validation and heap plus backing storage, with an 8 MiB calibration to reject double counting. Numeric narrowing rejects out-of-range input; a production design needs a safe-integer/Float64 fallback, not silent 32-bit truncation. This probe does not implement that fallback or the complete IdList API. [Probe details](results/direct-array-probe/README.md).

## Three recommendations

1. **Lowest storage without rewriting the editable container:** DS08 → existing IdList. Both compressors are below F01, while warm ready p95 and retained memory are essentially unchanged from F01. A storage migration is still required.
2. **Best measured loading/memory/storage balance:** DS08 → native F05. Keep the inexpensive translation, complete API coverage, then confirm editing and retention behavior before production adoption.
3. **Editing throughput / lowest implementation risk:** keep existing IdList and optimize its initialization separately if needed. The prior full 259,778-operation ID-only replay was **398.0 ms** for existing IdList versus **1,017.2 ms** for native F05. That times ID navigation/mutations, not rendered editing; the full editor replay did not establish a dependable winner. Keeping F01 storage too avoids migration, but forfeits the demonstrated storage saving.

<details>
<summary>All new Mongo layouts, including those rejected by the storage ceiling</summary>

| ID   | Stored layout                                                          | Snappy KB/doc | zstd KB/doc | Passes ceiling |
| ---- | ---------------------------------------------------------------------- | ------------: | ----------: | -------------- |
| F01  | Plain objects                                                          |         196.9 |       110.9 | Baseline       |
| F05  | Whole-document reconstructed-counter columns                           |         172.3 |       102.7 | Both           |
| DS01 | Identity spans + separate visibility                                   |         229.7 |       115.0 | Neither        |
| DS02 | Explicit-counter pages                                                 |         204.8 |        98.6 | zstd only      |
| DS03 | Explicit-counter pages + position prefixes                             |         205.1 |        99.3 | zstd only      |
| DS04 | Explicit-counter pages + complete navigation indexes                   |         335.9 |       147.7 | Neither        |
| DS05 | Identity-span pages + complete navigation indexes                      |         311.6 |       131.4 | Neither        |
| DS06 | Page-local reconstructed-counter columns + complete navigation indexes |         291.1 |       139.5 | Neither        |
| DS07 | Identity-span pages + separate visibility                              |         192.7 |        86.3 | Both           |
| DS08 | Page-local reconstructed-counter columns                               |         159.9 |        86.3 | Both           |

All three **complete dual-navigation-index** proposals fail the cap. Position-prefix-only DS03 passes with zstd but not Snappy; it lacks the identity index. Indexed shapes have lossless encoders/decoders, not implemented/measured editing runtimes. The cap is applied per compressor, never to an average across compressors.

</details>

<details>
<summary>Frontend diagnostics, editing, GC, cold loads and limitations</summary>

The sixth measured case, F03 tuples → native owned row pages, reached 41.7 ms warm ready p95 and retained 4.841 MB. Its storage was not measured in this new ten-layout Mongo pass; do not fabricate a same-run storage pairing. It used more loaded memory than native F05 without a clear ready-time advantage.

| Path              | Fresh-context first-load median, ms (5 samples) | Traced load GC median, ms (8 samples) | 200-edit complete batch median [min–max], ms (10 samples) |
| ----------------- | ----------------------------------------------: | ------------------------------------: | --------------------------------------------------------: |
| F01 → existing    |                                            58.4 |                                 1.698 |                                           13.9 [9.4–17.0] |
| F05 → existing    |                                            58.3 |                                 1.275 |                                           13.4 [9.3–16.8] |
| F05 → native F05  |                                            41.6 |                                 0.851 |                                           13.9 [9.7–16.3] |
| F03 → native rows |                                            41.6 |                                 0.941 |                                           12.0 [8.9–15.8] |
| DS08 → existing   |                                            58.3 |                                 1.959 |                                           13.0 [9.5–15.8] |
| DS08 → native F05 |                                            49.8 |                                 1.067 |                                          12.1 [10.6–18.3] |

Five first loads are insufficient for a reliable cold p95. The DS08-native first-load median is higher than flat-F05-native in this small sample: do not hide that observation behind the similar warm p95. GC timings come from separate traced windows, not the untraced warm timing samples; eight windows do not establish production GC tails. The 200-edit batches include editor work/rendering and have overlapping ranges, so are not proof of an editing winner. First-edit timing also waits for frames and cannot resolve small mutation-CPU differences.

Loaded memory above is not sustained editing memory or full undo history. Retained JS includes heap and backing buffers, but not native DOM allocations or total process memory. The [prior full exploration](exploration.md) separately reports canonical complete replays and 2,000-edit retained-version workloads, including timing anomalies. Those results remain intact. This new profile does not rerun or replace the 144 full replays.

Native prototypes do not yet cover the whole library API, including all cursor/bias and undelete/uninsert semantics. Canonical parity and these tests do not establish complete production compatibility. Layout behavior in an actual application may differ from the ProseMirror harness.

</details>

## Evidence and reproducibility

Final checks: **149 tests passed**, benchmark TypeScript checking and scoped ESLint passed, formatting and whitespace checks passed. The three source hashes, all sample counts and every paired Mongo storage-cap decision were independently checked. Source/report changes and raw measurements are local; this follow-up has not been pushed to a PR.

- [Exact-source frontend profile](results/frontend-profile-canonical/browser.json): complete, 6 × 100 warm loads, 6 × 5 fresh-context loads, 6 × 8 traced loads, 6 × 3 memory trials, 6 × 10 untraced 200-edit batches and one traced edit batch per case. Five rotated rounds; Node 24.19.0, Chromium 151.0.7922.34, Apple M5 Pro, no CPU throttling. Quantiles use nearest rank; memory medians use three trials. Tests verify all loaded documents and edited results.
- [Mongo physical measurements and every stored example](results/direct-storage-probe/mongo.json): complete, Mongo 8.3.3, 20 fresh collections, verified Snappy/zstd creation settings, 100 independently renamed documents each, two successful compactions per collection with checkpointing and locked physical collection-file measurement. Both documents 0 and 99 round-trip for every collection. Values are collection `.wt` file length per document, including allocation/free space; not logical BSON, filesystem allocated blocks, indexes, shared database files or an Atlas bill. One build per layout/compressor, not a confidence interval. The isolated server was stopped; no production database was changed.
- [Numeric-array measurements](results/direct-array-probe/browser.json): complete, 42 jobs, all current-state and sampled retained-history checks pass.
- [Earlier attribution diagnostic](results/frontend-profile/browser.json): complete, 500 warm loads using the older periodically refreshed fixture. Preserved separately; **not pooled** with the exact-source 600-load profile.

The new frontend, numeric probe and Mongo source share canonical saved-state SHA-256 `b3cc04d6e0a3261d25b13f139d4fdde5c9bd44f956eb6797b79f74fc7583299b`. Mongo deliberately renames whole IDs independently for each document, including document 0, whose SHA is `03b8a65280ab9ff04a8b6b6f9975d10a8ff1b8d4370b9ecb967ef91ce78d1006`. Thus they share the **exact source and run/counter topology**, not byte-identical inserted IDs. IDs remain opaque eight-character strings. The source is the final uninterrupted Martin Kleppmann paper-editing trace snapshot; provenance, licensing and upstream hashes are recorded in the Mongo result.

The F01 cap is demonstrated on this corpus and compressor configuration, not guaranteed for every document distribution. Deployment acceptance should repeat the paired cap check across representative production snapshots. No wire compression or transfer-size metric influences these recommendations.

Run the focused frontend benchmark serially, with no competing browser/build/Mongo benchmark. Choose a fresh output directory; the runner refuses to overwrite existing evidence:

```sh
TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json \
FRONTEND_CANONICAL=1 EXPLORATION_OUTPUT=frontend-profile-canonical-new \
BROWSER_ID_MODEL=opaque8 BROWSER_DOCUMENTS=4 \
BROWSER_ROUNDS=5 BROWSER_TRIALS=20 BROWSER_SWITCHES=8 BROWSER_MEMORY_TRIALS=3 \
node --import tsx benchmarks/src/browser/frontend-profile-run.ts
```

Implementation: [phase instrumentation](src/browser/frontend-profile-page.ts), [storage/runtime combinations](src/browser/frontend-profile-candidates.ts), [stored shapes](src/browser/direct-storage-formats.ts), [Mongo measurement procedure](src/browser/direct-storage-probe.ts), [numeric container experiment](src/browser/direct-array-model.ts).
