# Library performance first; storage second

**Study context:** these runtime measurements remain valid; the later [consolidated recommendation](recommendation.md) supersedes the DS08 storage recommendation below with a simpler flat format. Historical validation counts describe this study, not the final published test suite.

## Conclusion

**The data structure matters, but the existing tree has the lowest observed median for the complete canonical edit stream.** Optimizing the alternative paged container halved its edit time, while preserving its lower memory and faster loading. It still does not beat the tree on that edit stream. There is no universal winner.

We first profiled and changed the runtime, with the same plain-object input for every candidate. Only afterward did we retest the selected runtimes with the smaller stored format. All changes are opt-in experiments; the default public loader/deletion algorithms remain controls, and no production storage migration was made.

### The browser outcome

Four real ProseMirror editors, same canonical snapshot, opaque eight-character IDs. **100 warm replacement loads per row**, p95 sorted fastest first. Retained JS is median of three post-GC measurements after loading and the first edit, including editor/model JS plus backing buffers. Mongo is physical KB **per document**, not four documents. Lower is better.

| Stored format → internal runtime                   | Ready p95, ms | Retained JS, MB | Mongo KB/doc: Snappy / zstd |
| -------------------------------------------------- | ------------: | --------------: | --------------------------: |
| **DS08 page-local columns → optimized paged runs** |      **41.8** |       **3.790** |            **159.9 / 86.3** |
| F01 plain objects → original paged runs            |          42.3 |           3.781 |               196.9 / 110.9 |
| F01 plain objects → optimized paged runs           |          42.4 |           3.781 |               196.9 / 110.9 |
| F01 plain objects → bulk-built existing tree       |          50.0 |           6.259 |               196.9 / 110.9 |
| DS08 page-local columns → existing tree            |          50.0 |           6.263 |                159.9 / 86.3 |
| DS08 page-local columns → bulk-built existing tree |          50.0 |           6.259 |                159.9 / 86.3 |
| F01 plain objects → existing tree                  |          50.1 |           6.264 |               196.9 / 110.9 |

The three paged-runtime results near 42 ms are one practical group, not evidence that DS08 is precisely 0.6 ms faster. **The adapter does not erase the paged runtime's loading/memory advantage.** DS08 + optimized paged runs retains 39.5% less JS than F01 + existing tree here; zstd storage is 22.2% smaller. Both compressors satisfy the measured F01 ceiling.

Bulk construction reduces work inside the loader, but does **not** produce a material ready-p95 improvement in this experiment. That distinction matters: optimizing a phase is not automatically optimizing the visible outcome.

## What changed inside the library?

| Experiment                   | Actual implementation change                                                                                                                           | Finding                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Bulk-built tree indexes      | Keep the B+tree, sparse visibility lists and existing public operations; sort index entries once and build their persistent red-black indexes directly | Less loading work, but almost unchanged full ready p95; not a memory redesign              |
| Fresh edit-buffer adoption   | Paged run container adopts newly created, bounded arrays instead of immediately copying them again                                                     | Modest edit improvement; can retain spare JS-array capacity                                |
| **Reuse unchanged columns**  | A continuation insertion copies the count column, while sharing immutable ID/counter columns and their page lookup index                               | **Cuts canonical edit time by 50.8% versus original paged-128**                            |
| Page membership filter       | Add a small per-page negative filter before exact ID-map lookup                                                                                        | Rejected as a general optimization here: hashing/rebuilding costs outweighed saved probes  |
| 64 / 128 / 256 runs per page | Change bounded-copy size versus number of page-directory entries                                                                                       | Optimized 128-run pages won the canonical stream among these sizes; other workloads differ |
| Interval-aware deletion      | Use ordered identity ranges to skip unknown counter gaps; avoid copying entirely unchanged tombstones                                                  | Strong targeted improvement, not an overall editing win                                    |

The optimized paged container is the previous **native F05** prototype with `ownership: "owned"`, `pageSize: 128`, `adoptEdits: true`, and `reuseUnchangedColumns: true`. The filter is **off**. No new saved fields or binary format are required by these optimizations.

For example, continuing the first run changes:

```javascript
// Before: A has counters 0..2; B has counter 0.
bunchIds = ["aB3dE5fG", "hJ7kL9mN"];
starts = new Float64Array([0, 0]);
counts = [3, 1];

// Insert A's counter 3 after counter 2:
nextCounts = [4, 1];
// Reuse bunchIds, starts, and the page's ID→row lookup index.
// The old counts remain unchanged for retained document versions.
```

The fast path runs only after the normal duplicate/range validation. Middle insertion, tombstone anchors and incompatible identities use the general reconstruction path. The page directory and visible-prefix array are still copied/rebuilt on edits: this remaining cost was **not** eliminated.

## Library-only performance

These timings exclude editor/rendering work. The canonical column replays **all 259,778 recorded operations from empty**, uninterrupted, with no retained versions. Values are median [min–max] of three fresh-context runs. Construction is median over 60 warm replacement samples, **excluding JSON parsing but including conversion from the same decoded F01 objects**. MB is decimal.

| Runtime                  |    Canonical replay, ms | Construction median, ms | Loaded library/runtime MB | Canonical MB with 100 old versions |
| ------------------------ | ----------------------: | ----------------------: | ------------------------: | ---------------------------------: |
| Existing tree            | **300.0 [298.2–308.3]** |                     3.5 |                     1.286 |                              1.821 |
| Bulk-built existing tree |     302.1 [300.0–318.0] |                     2.7 |                     1.309 |                              1.865 |
| **Optimized paged-128**  | **436.8 [415.1–444.7]** |                 **1.2** |                 **0.628** |                          **1.275** |
| Original paged-128       |     888.4 [839.3–925.1] |                     1.3 |                     0.629 |                              1.376 |

The optimized paged runtime remains **45.6% slower than the existing tree on this stream**, despite being much faster than its own original implementation. With 100 versions, replay medians are 368.4 ms for the existing tree and 521.5 ms for optimized paged-128.

**Absolute cost also matters:** 300.0 versus 436.8 ms across 259,778 operations averages roughly 1.15 versus 1.68 microseconds per operation. This is not per-keystroke p95, and it does not prove an observable editing-latency regression. The whole-editor 200-edit batch measurements do not establish a dependable editing winner. Memory and opening time remain legitimate reasons to consider the paged design.

The bulk-loader canonical rows intentionally start empty, so they exercise the same existing edit implementation as the baseline—not the bulk loading of a populated snapshot. Their small replay difference is not an effect to credit to bulk loading. The populated-snapshot tests below are the relevant check for its changed index shape.

### Editing and lookup workloads are not interchangeable

Medians of three batches, no retained versions. Every editing batch contains 2,000 operations on the loaded canonical snapshot. Remote batches use supplied IDs directly; local/distributed batches first resolve the document position and validate the anchor. Random lookup batches are 20,000 `at` + `indexOf` pairs.

| Runtime                  | Local edits, ms | Distributed edits, ms | Remote distributed edits, ms | Random lookup pairs, ms |
| ------------------------ | --------------: | --------------------: | ---------------------------: | ----------------------: |
| Existing tree            |             6.8 |              **13.6** |                     **12.8** |                    14.4 |
| Bulk-built existing tree |             7.6 |                  15.1 |                         14.1 |                    14.1 |
| Original paged-128       |            12.2 |                  21.8 |                         20.3 |                     8.8 |
| Optimized paged-128      |         **7.0** |                  21.1 |                         21.3 |                 **8.7** |

The continuation fast path helps cursor-local typing, not arbitrary distributed edits. Paged lookup pairs are faster here, but that does not make paged mutations faster. Bulk loading also changes the red-black index shape: its somewhat slower loaded-edit batches must not be hidden behind the construction improvement. Three trials establish observed ranges, not production significance.

### Profiling, not guesses

Separate Chromium CPU profiles corroborate the chosen changes:

- Existing loading spends substantial samples in persistent red-black `set`, supporting direct index construction as a specific target.
- Original paged editing spends substantial samples in `pagesFor`, copying and rebuilding page-local indexes. In the diagnostic profile, `pagesFor` sampled self-time falls from about **322 to 67 ms** with reuse. Those are sampled diagnostic estimates, not an exact subtraction from unprofiled elapsed time.
- After reuse, rebuilding the outer directory/prefix in the native constructor is a leading remaining cost. A persistent, wide page directory or incremental prefix structure is the next structural hypothesis worth testing—not more wire-format matching. It is **not implemented or proven by this report**.

The existing tree coalesces adjacent identity counters even across visibility changes, keeping visibility in a linked sparse-run representation. Paged runs split rows by signed visibility and copy bounded pages. This difference explains why one long, highly fragmented identity stresses the existing tree: changing its visibility representation may matter more than changing its sequence tree. The 2,048-alternating-run stress case is included in the raw results; it is intentionally adversarial, not a claim about typical production documents.

## Returning to storage and interchange

The runtime optimizations leave the logical saved ID list unchanged. DS08 stores ordinary BSON arrays in independently encoded pages, without the runtime's navigation indexes:

```javascript
{
  _id: 0,
  state: {
    pages: [{
      bunchIds: ["aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
      counts: [3, 1, -2],
      startCounterIndexes: [],
      startCounters: []
    }]
  }
}
```

The starts here reconstruct to `[0, 0, 3]`; negative count means deleted. Counters restart their inference per ID on each page, with explicit exceptions when necessary. The small example has no exceptions. This is a storage/interchange choice, not a dump of the editable container.

The frontend experiment charges JSON parsing, the actual DS08-to-run adapter, native conversion if needed, validation, ownership copies and index creation. Median time from parsed input to editable lists across four documents was:

| Runtime              | F01 input, ms | DS08 input, ms |
| -------------------- | ------------: | -------------: |
| Existing tree        |          12.9 |           14.8 |
| Bulk-built tree      |          10.6 |           12.9 |
| Optimized paged runs |           4.0 |            6.5 |

Those phase medians are not additive/subtractable estimates of the ready-p95 difference. DS08 also reduces JSON parsing work. The directly measured ready results at the top show the net outcome: **about 50 ms for tree variants and about 42 ms for paged variants, with either input shape**.

Mongo figures are reused from the completed physical Snappy/zstd experiment on the **same canonical source snapshot and unchanged encoders**; Mongo was not rerun for runtime-only changes. It used 100 independently renamed eight-character-ID documents per collection, two compactions, checkpointing and physical collection-file measurement. Source hash matches both new browser runs. The stored documents are independently renamed, not byte-identical to the browser fixture. These are collection bytes, excluding indexes/shared database files, not logical BSON or an Atlas bill. The F01 ceiling is verified for this corpus, not guaranteed across every production document distribution.

Network transfer/gzip/binary size is not part of the decision. Binary remains an optional encoding optimization to evaluate later if needed.

## Recommendations

1. **Low implementation risk / editing throughput:** keep the existing tree and use DS08 storage. The storage saving does not require a library rewrite. Bulk index construction is a narrow candidate, not an established visible-speed win; assess its loaded-edit tradeoff before adoption.
2. **Memory and opening documents:** continue the optimized paged runtime with DS08. It is the leading measured loading/memory/storage combination here, but complete the missing library API and production-scale workload checks before replacing the existing library. Do not claim it is the fastest editor on every workload.
3. **Next runtime optimization:** target directory/prefix rebuilding and fragmented visibility, based on the profiles. Keep interval-aware deletion for further targeted evaluation: it addresses large sparse gaps and redundant deletions but slightly worsens ordinary canonical throughput here. Do not enable the page membership filter on this evidence.

<details>
<summary>All runtime variants and targeted regressions</summary>

Sorted by canonical median. Construction p95 is from 60 warm samples; canonical p95 is intentionally not presented from only three trials.

| Runtime                             | Canonical median, ms | Construction p95, ms | Canonical MB, 100 versions |
| ----------------------------------- | -------------------: | -------------------: | -------------------------: |
| Existing tree                       |                300.0 |                  5.8 |                      1.821 |
| Bulk-built tree                     |                302.1 |                  5.6 |                      1.865 |
| Bulk tree + interval-aware deletion |                310.8 |                  5.7 |                      1.884 |
| Paged adoption + reuse, 128         |                436.8 |                  1.9 |                      1.275 |
| Paged adoption + reuse, 64          |                500.2 |                  2.0 |                      1.342 |
| Paged adoption + reuse, 256         |                518.6 |                  1.8 |                      1.512 |
| Original paged, 64                  |                782.7 |                  1.7 |                      1.376 |
| Paged adoption only, 128            |                802.2 |                  2.4 |                      1.437 |
| Original paged, 128                 |                888.4 |                  2.0 |                      1.376 |
| Paged membership filter, 128        |               1070.3 |                  2.2 |                      1.435 |
| Original paged, 256                 |               1259.9 |                  1.7 |                      1.644 |

Adoption alone reduces copies but can leave spare capacity in push-built arrays, and retained-history memory rises here. Reuse avoids more reconstruction and lowers canonical history memory, but is not a universal memory reduction: no-history canonical memory is 0.776 MB versus 0.748 MB for original paged-128, a small difference within observed measurement variability. A separate new-identity workload with 100 versions retained 1.631 MB with reuse versus 1.552 MB without it. Do not choose on a single retention pattern.

Interval-aware deletion cuts the 2,000 repeated-tombstone diagnostic from **18.1 to 0.6 ms**, and deletion over a 100,000-counter sparse range from **6.5 to 0.3 ms**. It traverses known intervals rather than every absent counter, but adds lookup/visibility work on ordinary changed deletes. Native gap-deletion timings rounded to zero are below timer resolution—not zero-cost operations.

</details>

<details>
<summary>Browser diagnostics, scope and measurement limitations</summary>

- Ready includes teardown/replacement, parsing, construction, editor setup, layout and two animation frames. It is a rendering-opportunity proxy, not physical display scan-out or production startup. Shared editor/layout work is included in totals, not credited as a container improvement.
- Five fresh-context first loads per row give median 58.2 ms for F01/existing, 58.3 ms for F01/bulk, and 49.9 ms for both F01/optimized-paged and DS08/optimized-paged. Five samples do not support a reliable cold p95.
- Separate traced GC windows (eight per row) report median 1.946 ms for F01/existing, 1.396 ms for F01/bulk, 0.905 ms for F01/optimized-paged and 1.096 ms for DS08/optimized-paged. These are diagnostic windows, not production GC tails or quantities to add to readiness.
- Complete 200-edit editor batch medians: F01/existing 13.5 ms, F01/bulk 12.1 ms, F01/optimized-paged 14.7 ms, DS08/optimized-paged 13.4 ms. Their observed ranges overlap; these do not establish a dependable full-editor editing winner.
- Library-only memory includes post-warmup runtime/JIT growth, not exclusively container bytes. Repeated collections with no history released changed some results by up to 91,620 bytes. Treat small differences cautiously. Browser memory includes JS/backing buffers, not native DOM allocations or renderer RSS. Retained versions are ID-list versions, not full editor undo history.
- Three rounds rotate cases but do not completely counterbalance eleven candidates. CPU profiles run separately and are never mixed into unprofiled samples. Load profiles include parsing while construction timings exclude it; canonical profiles include final correctness checking outside the reported replay clock.
- Native prototypes remain an API subset; the existing-tree variants retain the complete IdList API. Current-state checks and three sampled historical branches pass, but not every retained version is exhaustively checked during each benchmark. Unit tests additionally exercise immutability, branching, tombstones, counter gaps, duplicate rejection, wide counters and full existing-tree operations.
- The existing baseline includes inherited experimental hooks from this branch, not an untouched upstream release. Controls and variants share this run's source/bundle; old timing anomalies and the pilot remain preserved separately rather than replaced.

</details>

## Evidence, implementation and reproduction

Completed evidence:

- [Library runtime results](results/library-perf-full/results.json): **429 rows**, 11 variants × 3 rounds; **66 uninterrupted full canonical replays**, 330 loaded 2,000-edit session replays, 60 construction samples per variant, lookup/stress tests and **14 separate CPU profiles**. Original measured bundle is preserved alongside raw results.
- [Frontend results](results/library-frontend/browser.json): **700 warm loads**, seven storage/runtime combinations; each also has five fresh-context loads, eight traced load windows, three memory trials, ten untraced 200-edit batches and one traced edit batch. All correctness checks passed.
- [Preserved pilot](results/library-perf-pilot/results.json): not pooled with the full comparison; its controls predate the common tree wrapper and final runtime variants.
- [Physical Mongo evidence](results/direct-storage-probe/mongo.json) and [earlier storage report with every stored example](browser-storage-findings.md).

All use canonical source SHA-256 `b3cc04d6e0a3261d25b13f139d4fdde5c9bd44f956eb6797b79f74fc7583299b`. The trace is the full 259,778-operation Martin Kleppmann paper-editing trace; provenance, upstream verification and CC-BY-4.0 attribution are recorded in the raw canonical metadata. Environment: Apple M5 Pro, Node 24.19.0, Chromium 151.0.7922.34. Library runtime contexts explicitly set 1× CPU; no competing performance jobs, builds or Mongo server were started during these measurements. Quantiles use nearest rank; KB/MB are decimal.

Validation at the time of this study: **171 benchmark tests and 186 library tests passed**. Changes remain experimental; no deployment is claimed by this report.

Implementation: [runtime candidates](src/browser/library-perf-candidates.ts), [page-side timing boundaries](src/browser/library-perf-page.ts), [serialized runner and CPU profiles](src/browser/library-perf-run.ts), [existing-tree experiments](../packages/articulated/src/id_list.ts), [paged-runtime experiments](src/browser/native-f05.ts), [storage/runtime pairing](src/browser/library-frontend-run-candidates.ts).

Run serially from the repository root with Node 24 and fresh output names:

```sh
TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json \
LIBRARY_TRIALS=3 LIBRARY_OUTPUT=library-perf-new \
node --import tsx benchmarks/src/browser/library-perf-run.ts

TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json \
EXPLORATION_OUTPUT=library-frontend-new \
BROWSER_ID_MODEL=opaque8 BROWSER_DOCUMENTS=4 \
BROWSER_ROUNDS=5 BROWSER_TRIALS=20 BROWSER_SWITCHES=8 BROWSER_MEMORY_TRIALS=3 \
node --import tsx benchmarks/src/browser/library-frontend-run.ts
```
