# Choose the logical format first: browser speed, Mongo storage, and JS memory

Draft experiment. Start with the nine logical JSON formats through the same object loader. Compare browser speed, physical Mongo storage, and JS memory separately. Direct loading and binary encodings are secondary optimizations below, not competing logical formats.

Measured 2026-10-20 in Chromium 151.0.7922.34 on Apple M5 Pro, CPU rate 1×. Each document has 104,852 characters, 1,173 paragraphs, and the same 12,091 ID runs. This is a **real, controlled ProseMirror editor in Chromium**, not the production application. The four-document case mounts four copies of that same document; it is a scaling test, not a production corpus.

## Three recommendations, depending on what matters most

**My default: pursue ordinary columns with omitted counters, then validate them on our actual documents and IDs.** This is a logical-format choice, with ordinary Mongo arrays and JSON in the browser. Binary is optional follow-up work, not part of this recommendation. These are recommendations for what to pursue next, not approval to migrate production from a single synthetic workload.

1. **Mongo storage and a balanced improvement → Columns + omit.** It has the smallest Snappy collection among the nine ordinary-field formats: 155.8 versus 180.5 KB/doc for original objects (about 14% less). Four-document retained JS memory also falls from 7.3 to 6.5 MB (about 12% less). Ready P95 is 56.2 versus 58.0 ms; do not count that small difference as a proven speedup. Tradeoff: a translation step and omitted-counter reconstruction. This recommendation targets your current Snappy setup; Zstd has a different storage ranking.

2. **Temporary browser memory pressure → Client dictionary + omit, with a direct JSON loader, only if IDs actually have shared client/sequence structure.** Observed four-document high-water memory is 9.1 MB versus 16.9 MB for original objects. Retained memory is 6.5 MB—essentially the same as Columns + omit, not a further steady-state saving. Tradeoffs: a custom direct loader and 188.7 KB/doc in Snappy, more than original objects. The high-water measurement is sampled, not an exact peak or proof of fewer GC stalls. **For independent opaque 8-character nanoids, do not adopt this split-ID format based on this fixture; use recommendation 1 instead.** If retained memory alone is the priority, recommendation 1 is also the simpler choice.

3. **Browser loading speed, accepting a Mongo storage penalty → Investigate dictionary columns through the existing object loader.** It has the lowest observed four-document JSON/object ready P95: 51.1 versus 58.0 ms, with ID-loading P95 19.9 versus 25.4 ms. Tradeoff: 245.9 versus 180.5 KB/doc in Snappy (about 36% more). Do not ship on this timing ranking yet: the single-document winner differs, and P95 here is the maximum of only 18 samples. Run a larger, representative timing study first. This is not a recommendation for binary or for the direct loader.

**If the goal is a large reduction in retained editor memory, none of these formats establishes that.** Every loader still builds the existing mutable IdList tree. A native column-backed editing representation needs its own implementation and benchmark. The measured percentages above come from Matthew’s structured-ID trace; opaque nanoid workloads need their own run before a migration decision.

## Evidence and limits behind those recommendations

- **Tail ranking is fragile here.** There are only 18 primary samples per row. With nearest-rank P95, 18 samples means P95 is the maximum. 3 samples exceed three times their row median (282.5, 266.8, 273.3 ms); none were removed. A single unexplained stall can change the ranking. More repetitions and a representative corpus are needed before selecting on tail latency.

## What happened to Build IDs and Layout?

**Layout does the same logical work in every row:** identical editor content, DOM, and forced-layout calls. Across the nine JSON/object formats in the four-document case, median layout ranges from 14.1–14.6 ms. Its elapsed time is not mathematically constant: scheduling, GC, and runtime noise can affect it. It is no longer a colored segment or a claimed format benefit. It remains inside the measured complete-ready total; subtracting it would no longer answer how long the document takes to render.

**Build IDs was a misleading label.** That interval includes format-specific translation plus construction of the shared final editing tree. Its four-document medians range from 15.3–18.6 ms across the JSON/object options. We did not independently time translation and common tree building, so we cannot honestly subtract a constant tree-construction cost. The ID-loading column measures decode + translation + tree construction, excluding editor creation, layout, and frame waiting. Its P95 is calculated from each sample’s sum—not by adding stage percentiles.

## 1. Logical JSON formats

Hold the loader path fixed: ordinary JSON inputs, object adapter, same final editor. Each speed chart is sorted by complete-ready P95 ascending. ID-loading P95 is a diagnostic alongside that total, not added to it. GC comes from a separate trace pass. Storage and memory have their own charts, sorted smallest first; metric scales are independent.

Each row has 18 warm timing samples across 3 fresh browser contexts, 8 traced document replacements without forced GC between them, and 3 separately profiled memory runs. P95 is an empirical sample percentile, not a reliable population-tail estimate from this small run. Raw cold-start samples and per-round results are retained.

### Mongo storage: logical formats

Ordinary BSON objects and arrays, not JSON strings. Same compact/checkpoint protocol for Snappy and Zstd. The physical-storage table and exact stored examples are below.

![Physical Mongo storage, smallest Snappy first](results/browser/storage.svg)

### 4 document(s): logical JSON formats

![Browser speed sorted by complete-ready P95](results/browser/browser-4.svg)

![JS memory sorted by retained bytes](results/browser/memory-4.svg)

<details><summary>Show numeric results (9 rows)</summary>

| Logical format           | Encoding / path | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | --------------- | ------------: | -----------: | -----------: | -------------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Dictionary columns       | JSON / objects  |          44.5 |         41.8 |         51.1 |           19.9 |         56.7 |              2.3 / 1.5 |             16.1 |     6.9 |                   55.4 |              20.1 |
| Client dictionary + omit | JSON / objects  |          49.2 |         49.9 |         56.0 |           22.4 |         57.5 |              2.2 / 1.4 |             10.5 |     6.5 |                   57.0 |              20.1 |
| Columns + omit           | JSON / objects  |          48.6 |         49.8 |         56.2 |           21.1 |         59.0 |              2.2 / 1.5 |             15.5 |     6.5 |                   55.9 |              18.8 |
| Split + omit             | JSON / objects  |          49.7 |         49.6 |         57.6 |           23.4 |         58.1 |              2.2 / 1.5 |             15.9 |     6.5 |                   58.4 |              20.0 |
| Dictionary + omit        | JSON / objects  |          45.8 |         41.7 |         58.0 |           23.0 |         57.6 |              2.2 / 1.5 |             13.5 |     6.9 |                   54.9 |              19.0 |
| Original objects         | JSON / objects  |          49.2 |         49.2 |         58.0 |           25.4 |         58.3 |              2.2 / 1.7 |             16.9 |     7.3 |                   54.4 |              19.1 |
| Ordinary columns         | JSON / objects  |          45.9 |         41.7 |         58.3 |           23.5 |         58.1 |              2.1 / 1.4 |             16.7 |     7.3 |                   54.5 |              20.0 |
| Signed tuples            | JSON / objects  |          47.1 |         42.9 |         58.6 |           23.9 |         59.0 |              2.3 / 1.5 |             17.2 |     7.3 |                   57.3 |              18.7 |
| Signed objects           | JSON / objects  |          63.7 |         49.8 |        282.5 |          240.3 |         58.1 |              3.4 / 3.3 |             21.6 |     7.3 |                   55.2 |              18.7 |

</details>

### 1 document(s): logical JSON formats

![Browser speed sorted by complete-ready P95](results/browser/browser-1.svg)

![JS memory sorted by retained bytes](results/browser/memory-1.svg)

<details><summary>Show numeric results (9 rows)</summary>

| Logical format           | Encoding / path | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | --------------- | ------------: | -----------: | -----------: | -------------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Ordinary columns         | JSON / objects  |          16.0 |         16.2 |         16.8 |            6.2 |         24.0 |              0.8 / 1.0 |              4.1 |     1.7 |                   13.9 |              19.7 |
| Dictionary + omit        | JSON / objects  |          15.9 |         16.0 |         18.4 |            7.6 |         24.9 |              0.9 / 1.2 |              5.4 |     1.6 |                   14.2 |              20.7 |
| Dictionary columns       | JSON / objects  |          16.4 |         16.6 |         20.6 |            6.7 |         23.7 |              0.9 / 1.1 |              5.6 |     1.6 |                   13.8 |              19.7 |
| Columns + omit           | JSON / objects  |          16.5 |         16.4 |         20.6 |            7.5 |         24.8 |              0.7 / 0.6 |              5.5 |     1.6 |                   14.6 |              19.5 |
| Signed tuples            | JSON / objects  |          16.2 |         16.3 |         20.8 |            6.9 |         24.7 |              0.9 / 1.0 |              5.5 |     1.7 |                   15.5 |              20.1 |
| Signed objects           | JSON / objects  |          16.4 |         16.6 |         21.9 |            7.3 |         23.8 |              0.9 / 1.1 |              7.2 |     1.7 |                   14.7 |              19.0 |
| Split + omit             | JSON / objects  |          17.0 |         16.6 |         22.1 |            7.0 |         27.5 |              0.8 / 1.1 |              4.8 |     1.6 |                   15.0 |              18.7 |
| Client dictionary + omit | JSON / objects  |          17.6 |         16.7 |         24.2 |            7.8 |         23.5 |              0.7 / 0.5 |              3.7 |     1.6 |                   14.4 |              18.7 |
| Original objects         | JSON / objects  |          17.0 |         16.6 |         24.4 |            9.6 |         25.4 |              0.9 / 1.2 |              6.8 |     1.7 |                   13.7 |             225.3 |

</details>

## 2. Secondary optimization: direct JSON loading

Same JSON structures, with and without an intermediate object-run array. This isolates the loader change from encoding. Mongo storage is unchanged. Direct loading still builds the same final editing tree.

### 4 document(s): direct JSON loading

![Browser speed sorted by complete-ready P95](results/browser/browser-4-direct.svg)

![JS memory sorted by retained bytes](results/browser/memory-4-direct.svg)

<details><summary>Show numeric results (4 rows)</summary>

| Logical format           | Encoding / path | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | --------------- | ------------: | -----------: | -----------: | -------------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Client dictionary + omit | JSON / direct   |          46.3 |         47.8 |         51.1 |           21.1 |         57.4 |              2.0 / 1.3 |              9.1 |     6.5 |                   54.4 |              19.7 |
| Dictionary columns       | JSON / objects  |          44.5 |         41.8 |         51.1 |           19.9 |         56.7 |              2.3 / 1.5 |             16.1 |     6.9 |                   55.4 |              20.1 |
| Client dictionary + omit | JSON / objects  |          49.2 |         49.9 |         56.0 |           22.4 |         57.5 |              2.2 / 1.4 |             10.5 |     6.5 |                   57.0 |              20.1 |
| Dictionary columns       | JSON / direct   |          56.9 |         41.8 |        266.8 |           18.2 |         55.0 |              2.1 / 1.4 |             11.2 |     6.9 |                   51.3 |              20.0 |

</details>

### 1 document(s): direct JSON loading

![Browser speed sorted by complete-ready P95](results/browser/browser-1-direct.svg)

![JS memory sorted by retained bytes](results/browser/memory-1-direct.svg)

<details><summary>Show numeric results (4 rows)</summary>

| Logical format           | Encoding / path | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | --------------- | ------------: | -----------: | -----------: | -------------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Dictionary columns       | JSON / direct   |          15.8 |         16.6 |         16.7 |            5.9 |         24.5 |              0.8 / 0.6 |              5.6 |     1.6 |                   13.5 |              20.3 |
| Client dictionary + omit | JSON / direct   |          16.4 |         16.6 |         20.6 |            6.7 |         24.4 |              0.9 / 1.2 |              4.9 |     1.6 |                   14.0 |              20.1 |
| Dictionary columns       | JSON / objects  |          16.4 |         16.6 |         20.6 |            6.7 |         23.7 |              0.9 / 1.1 |              5.6 |     1.6 |                   13.8 |              19.7 |
| Client dictionary + omit | JSON / objects  |          17.6 |         16.7 |         24.2 |            7.8 |         23.5 |              0.7 / 0.5 |              3.7 |     1.6 |                   14.4 |              18.7 |

</details>

## 3. Secondary optimization: binary encoding

Only after choosing a logical structure: compare its JSON row against its binary encoding with the same loader path. JSON baselines are repeated here for reference; this is not a new logical-format contest. No network-size comparison is used.

![Mongo encodings and ordinary-field baselines](results/browser/storage-encodings.svg)

### 4 document(s): encodings and JSON baselines

![Browser speed sorted by complete-ready P95](results/browser/browser-4-encodings.svg)

![JS memory sorted by retained bytes](results/browser/memory-4-encodings.svg)

<details><summary>Show numeric results (24 rows)</summary>

| Logical format           | Encoding / path        | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | ---------------------- | ------------: | -----------: | -----------: | -------------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Dictionary columns       | uint32/int32 / direct  |          43.1 |         41.7 |         50.1 |           16.4 |         57.7 |              1.9 / 1.1 |             14.4 |     6.9 |                   52.4 |              20.1 |
| Dictionary columns       | bit-packed / direct    |          43.4 |         41.6 |         50.4 |           16.7 |         58.2 |              2.0 / 1.2 |             14.0 |     6.9 |                   52.7 |              18.5 |
| Client dictionary + omit | protobuf / direct      |          46.7 |         49.3 |         50.4 |           23.5 |         57.8 |              2.1 / 1.2 |             11.0 |     6.5 |                   57.2 |              18.8 |
| Client dictionary + omit | JSON / direct          |          46.3 |         47.8 |         51.1 |           21.1 |         57.4 |              2.0 / 1.3 |              9.1 |     6.5 |                   54.4 |              19.7 |
| Dictionary columns       | JSON / objects         |          44.5 |         41.8 |         51.1 |           19.9 |         56.7 |              2.3 / 1.5 |             16.1 |     6.9 |                   55.4 |              20.1 |
| Client dictionary + omit | JSON / objects         |          49.2 |         49.9 |         56.0 |           22.4 |         57.5 |              2.2 / 1.4 |             10.5 |     6.5 |                   57.0 |              20.1 |
| Dictionary columns       | uint32/int32 / objects |          44.5 |         41.5 |         56.2 |           20.4 |         57.8 |              2.2 / 1.4 |             10.7 |     6.9 |                   56.4 |              19.7 |
| Columns + omit           | JSON / objects         |          48.6 |         49.8 |         56.2 |           21.1 |         59.0 |              2.2 / 1.5 |             15.5 |     6.5 |                   55.9 |              18.8 |
| Split + omit             | JSON / objects         |          49.7 |         49.6 |         57.6 |           23.4 |         58.1 |              2.2 / 1.5 |             15.9 |     6.5 |                   58.4 |              20.0 |
| Dictionary + omit        | JSON / objects         |          45.8 |         41.7 |         58.0 |           23.0 |         57.6 |              2.2 / 1.5 |             13.5 |     6.9 |                   54.9 |              19.0 |
| Original objects         | JSON / objects         |          49.2 |         49.2 |         58.0 |           25.4 |         58.3 |              2.2 / 1.7 |             16.9 |     7.3 |                   54.4 |              19.1 |
| Client dictionary + omit | protobuf / objects     |          50.1 |         49.9 |         58.3 |           23.9 |         58.2 |              2.3 / 1.3 |             13.9 |     6.5 |                   58.1 |              19.8 |
| Ordinary columns         | JSON / objects         |          45.9 |         41.7 |         58.3 |           23.5 |         58.1 |              2.1 / 1.4 |             16.7 |     7.3 |                   54.5 |              20.0 |
| Signed tuples            | JSON / objects         |          47.1 |         42.9 |         58.6 |           23.9 |         59.0 |              2.3 / 1.5 |             17.2 |     7.3 |                   57.3 |              18.7 |
| Dictionary + omit        | protobuf / objects     |          45.9 |         41.7 |         58.6 |           24.8 |         58.0 |              2.7 / 1.5 |             10.9 |     6.9 |                   56.2 |              19.8 |
| Split + omit             | protobuf / objects     |          52.6 |         50.0 |         59.4 |           27.4 |         60.6 |              2.1 / 1.5 |             13.9 |     6.5 |                   62.0 |              20.2 |
| Signed tuples            | BSON / objects         |          52.5 |         49.9 |         66.9 |           35.6 |         62.3 |              3.9 / 3.0 |             17.7 |     7.3 |                   70.3 |              20.0 |
| Columns + omit           | protobuf / objects     |          51.7 |         49.8 |         67.8 |           29.6 |         58.1 |              2.2 / 1.5 |             12.8 |     6.5 |                   61.3 |              19.8 |
| Signed objects           | BSON / objects         |          54.7 |         50.0 |         68.1 |           33.5 |         66.2 |              2.9 / 1.6 |             21.2 |     7.3 |                   80.2 |              19.9 |
| Original objects         | BSON / objects         |          58.0 |         57.3 |         73.9 |           38.1 |         67.8 |              3.0 / 1.7 |             17.2 |     7.3 |                   84.6 |              18.9 |
| Ordinary columns         | protobuf / objects     |          50.1 |         49.3 |         75.0 |           30.6 |         57.7 |              2.3 / 1.5 |             14.5 |     7.4 |                   62.8 |              19.9 |
| Dictionary columns       | JSON / direct          |          56.9 |         41.8 |        266.8 |           18.2 |         55.0 |              2.1 / 1.4 |             11.2 |     6.9 |                   51.3 |              20.0 |
| Dictionary columns       | bit-packed / objects   |          58.4 |         42.2 |        273.3 |           20.5 |         60.5 |              2.7 / 2.4 |             10.6 |     6.9 |                   58.0 |              19.7 |
| Signed objects           | JSON / objects         |          63.7 |         49.8 |        282.5 |          240.3 |         58.1 |              3.4 / 3.3 |             21.6 |     7.3 |                   55.2 |              18.7 |

</details>

### 1 document(s): encodings and JSON baselines

![Browser speed sorted by complete-ready P95](results/browser/browser-1-encodings.svg)

![JS memory sorted by retained bytes](results/browser/memory-1-encodings.svg)

<details><summary>Show numeric results (24 rows)</summary>

| Logical format           | Encoding / path        | Ready mean ms | Ready P50 ms | Ready P95 ms | ID-load P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | ---------------------- | ------------: | -----------: | -----------: | -------------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Dictionary columns       | JSON / direct          |          15.8 |         16.6 |         16.7 |            5.9 |         24.5 |              0.8 / 0.6 |              5.6 |     1.6 |                   13.5 |              20.3 |
| Ordinary columns         | JSON / objects         |          16.0 |         16.2 |         16.8 |            6.2 |         24.0 |              0.8 / 1.0 |              4.1 |     1.7 |                   13.9 |              19.7 |
| Dictionary columns       | uint32/int32 / objects |          16.2 |         16.5 |         16.9 |            6.5 |         24.8 |              0.9 / 1.0 |              3.7 |     1.6 |                   14.2 |              18.7 |
| Dictionary + omit        | JSON / objects         |          15.9 |         16.0 |         18.4 |            7.6 |         24.9 |              0.9 / 1.2 |              5.4 |     1.6 |                   14.2 |              20.7 |
| Dictionary + omit        | protobuf / objects     |          16.5 |         16.6 |         20.5 |            7.6 |         25.6 |              0.9 / 1.0 |              5.5 |     1.6 |                   14.1 |              18.6 |
| Client dictionary + omit | JSON / direct          |          16.4 |         16.6 |         20.6 |            6.7 |         24.4 |              0.9 / 1.2 |              4.9 |     1.6 |                   14.0 |              20.1 |
| Dictionary columns       | JSON / objects         |          16.4 |         16.6 |         20.6 |            6.7 |         23.7 |              0.9 / 1.1 |              5.6 |     1.6 |                   13.8 |              19.7 |
| Columns + omit           | JSON / objects         |          16.5 |         16.4 |         20.6 |            7.5 |         24.8 |              0.7 / 0.6 |              5.5 |     1.6 |                   14.6 |              19.5 |
| Dictionary columns       | bit-packed / direct    |          16.7 |         16.6 |         20.8 |            6.1 |         24.8 |              0.9 / 1.2 |              5.5 |     1.6 |                   13.3 |              18.9 |
| Signed tuples            | JSON / objects         |          16.2 |         16.3 |         20.8 |            6.9 |         24.7 |              0.9 / 1.0 |              5.5 |     1.7 |                   15.5 |              20.1 |
| Dictionary columns       | uint32/int32 / direct  |          16.3 |         16.2 |         20.9 |            5.9 |         25.0 |              1.0 / 1.1 |              5.6 |     1.6 |                   13.6 |              20.0 |
| Dictionary columns       | bit-packed / objects   |          16.8 |         16.6 |         21.8 |            7.0 |         24.2 |              0.9 / 1.0 |              3.6 |     1.6 |                   14.8 |              19.2 |
| Signed objects           | JSON / objects         |          16.4 |         16.6 |         21.9 |            7.3 |         23.8 |              0.9 / 1.1 |              7.2 |     1.7 |                   14.7 |              19.0 |
| Split + omit             | JSON / objects         |          17.0 |         16.6 |         22.1 |            7.0 |         27.5 |              0.8 / 1.1 |              4.8 |     1.6 |                   15.0 |              18.7 |
| Client dictionary + omit | protobuf / objects     |          16.4 |         16.2 |         22.6 |            7.5 |         93.3 |              1.0 / 0.9 |              3.6 |     1.6 |                   15.0 |              19.6 |
| Columns + omit           | protobuf / objects     |          17.0 |         16.6 |         22.6 |            7.9 |         27.5 |              0.9 / 0.9 |              4.5 |     1.6 |                   16.3 |              18.7 |
| Split + omit             | protobuf / objects     |          16.9 |         16.5 |         23.0 |            7.8 |         25.4 |              0.9 / 1.1 |              5.4 |     1.6 |                   15.9 |              20.1 |
| Signed tuples            | BSON / objects         |          17.6 |         16.7 |         23.0 |            9.9 |         24.1 |              1.0 / 1.8 |              7.3 |     1.7 |                   17.5 |              19.0 |
| Client dictionary + omit | JSON / objects         |          17.6 |         16.7 |         24.2 |            7.8 |         23.5 |              0.7 / 0.5 |              3.7 |     1.6 |                   14.4 |              18.7 |
| Original objects         | JSON / objects         |          17.0 |         16.6 |         24.4 |            9.6 |         25.4 |              0.9 / 1.2 |              6.8 |     1.7 |                   13.7 |             225.3 |
| Original objects         | BSON / objects         |          18.2 |         16.6 |         25.0 |           12.6 |         27.3 |              1.1 / 1.0 |              5.5 |     1.7 |                   21.8 |              18.8 |
| Signed objects           | BSON / objects         |          18.4 |         16.6 |         25.0 |           11.5 |         27.6 |              1.1 / 0.9 |              4.7 |     1.7 |                   20.4 |              19.4 |
| Client dictionary + omit | protobuf / direct      |          16.9 |         16.5 |         25.2 |            8.7 |         24.5 |              0.8 / 1.0 |              3.8 |     1.6 |                   14.6 |              19.1 |
| Ordinary columns         | protobuf / objects     |          17.8 |         16.7 |         28.7 |           14.3 |         25.1 |              0.9 / 1.0 |              5.4 |     1.7 |                   15.3 |              19.6 |

</details>

### Matched encoding and loader comparisons

These are changes in measured means, not significance claims. The three round deltas show how reproducible the direction was across fresh contexts. Negative means faster.

<details><summary>Show numeric results (14 rows)</summary>

| Documents | Same logical structure   | Comparison                                 | Ready change ms | Per-round changes ms | Kept change MB |
| --------: | ------------------------ | ------------------------------------------ | --------------: | -------------------- | -------------: |
|         1 | Client dictionary + omit | JSON/objects → protobuf/objects            |            -1.2 | -2.6, -1.0, 0.2      |            0.0 |
|         1 | Client dictionary + omit | JSON/direct → protobuf/direct              |             0.5 | 0.6, 0.8, 0.0        |            0.0 |
|         1 | Dictionary columns       | JSON/objects → uint32/int32/objects        |            -0.3 | -1.1, -0.2, 0.5      |            0.0 |
|         1 | Dictionary columns       | JSON/direct → uint32/int32/direct          |             0.5 | 1.1, 0.3, 0.1        |           -0.0 |
|         1 | Dictionary columns       | JSON/direct → bit-packed/direct            |             0.9 | 1.0, 1.5, 0.2        |           -0.0 |
|         1 | Dictionary columns       | uint32/int32/objects → uint32/int32/direct |             0.1 | 0.9, -0.2, -0.3      |           -0.0 |
|         1 | Dictionary columns       | bit-packed/objects → bit-packed/direct     |            -0.1 | -0.4, 0.4, -0.3      |           -0.0 |
|         4 | Client dictionary + omit | JSON/objects → protobuf/objects            |             0.8 | -0.5, 2.8, 0.1       |            0.0 |
|         4 | Client dictionary + omit | JSON/direct → protobuf/direct              |             0.5 | 1.3, -1.2, 1.3       |            0.0 |
|         4 | Dictionary columns       | JSON/objects → uint32/int32/objects        |            -0.1 | 0.9, -0.2, -1.0      |            0.0 |
|         4 | Dictionary columns       | JSON/direct → uint32/int32/direct          |           -13.9 | -1.9, -37.8, -1.9    |            0.0 |
|         4 | Dictionary columns       | JSON/direct → bit-packed/direct            |           -13.5 | -1.8, -37.6, -1.2    |            0.0 |
|         4 | Dictionary columns       | uint32/int32/objects → uint32/int32/direct |            -1.4 | -2.1, -0.3, -1.7     |           -0.0 |
|         4 | Dictionary columns       | bit-packed/objects → bit-packed/direct     |           -14.9 | -41.3, -1.3, -2.2    |           -0.0 |

</details>

## Physical Mongo storage: all measurements

MongoDB 8.3.3; 100 documents per layout/compressor, with distinct client dictionaries. Actual allocated collection-file bytes after compact, checkpoint, another compact, and locked fsync. Indexes and shared server overhead excluded; allocated free pages may remain. No logical-BSON or wire-size proxy.

JSON rows mean ordinary BSON objects/arrays in Mongo, **not JSON strings**. Protobuf rows mean one BSON Binary. Numeric-column encodings mean a dictionary plus separate BSON Binary fields. The BSON browser-response variant for objects/tuples uses the same ordinary Mongo layout; it does not imply storing a second blob. Direct/object loader paths also share storage.

<details><summary>Show numeric results (16 rows)</summary>

| Logical structure        | Mongo representation | Snappy KB/doc | Zstd KB/doc |
| ------------------------ | -------------------- | ------------: | ----------: |
| Original objects         | Ordinary BSON        |         180.5 |        86.2 |
| Signed objects           | Ordinary BSON        |         168.2 |        86.2 |
| Signed tuples            | Ordinary BSON        |         160.0 |        86.3 |
| Ordinary columns         | Ordinary BSON        |         223.4 |       115.0 |
| Ordinary columns         | protobuf             |          73.9 |        41.1 |
| Columns + omit           | Ordinary BSON        |         155.8 |        82.2 |
| Columns + omit           | protobuf             |          61.7 |        32.9 |
| Split + omit             | Ordinary BSON        |         196.9 |        95.2 |
| Split + omit             | protobuf             |          45.3 |        29.0 |
| Dictionary + omit        | Ordinary BSON        |         176.4 |        94.5 |
| Dictionary + omit        | protobuf             |          69.9 |        49.4 |
| Client dictionary + omit | Ordinary BSON        |         188.7 |        74.0 |
| Client dictionary + omit | protobuf             |          35.4 |        14.6 |
| Dictionary columns       | Ordinary BSON        |         245.9 |       127.3 |
| Dictionary columns       | uint32/int32         |         123.2 |        69.9 |
| Dictionary columns       | bit-packed           |          98.6 |        69.9 |

</details>

## Exact logical structures and Mongo examples

Every encoding in a group round-trips to the **same** logical JSON. This is asserted for empty and example inputs in unit tests, and for the full fixture before browser measurement. The browser additionally checks all saved runs, visible paragraph text, and a successful first edit.

<details><summary>Original objects: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": [
    {
      "bunchId": "alice_0",
      "startCounter": 0,
      "count": 3,
      "isDeleted": false
    },
    {
      "bunchId": "bob_0",
      "startCounter": 0,
      "count": 1,
      "isDeleted": false
    },
    {
      "bunchId": "alice_1",
      "startCounter": 0,
      "count": 2,
      "isDeleted": false
    },
    {
      "bunchId": "alice_0",
      "startCounter": 3,
      "count": 2,
      "isDeleted": true
    }
  ]
}
```

</details>

<details><summary>Signed objects: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": [
    {
      "bunchId": "alice_0",
      "startCounter": 0,
      "count": 3
    },
    {
      "bunchId": "bob_0",
      "startCounter": 0,
      "count": 1
    },
    {
      "bunchId": "alice_1",
      "startCounter": 0,
      "count": 2
    },
    {
      "bunchId": "alice_0",
      "startCounter": 3,
      "count": -2
    }
  ]
}
```

</details>

<details><summary>Signed tuples: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": [
    ["alice_0", 0, 3],
    ["bob_0", 0, 1],
    ["alice_1", 0, 2],
    ["alice_0", 3, -2]
  ]
}
```

</details>

<details><summary>Ordinary columns: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1", "alice_0"],
    "startCounters": [0, 0, 0, 3],
    "counts": [3, 1, 2, -2]
  }
}
```

### protobuf

```json
{
  "state": {
    "$binary": {
      "base64": "CgdhbGljZV8wCgVib2JfMAoHYWxpY2VfMQoHYWxpY2VfMBIEAAAAAxoEBgIEAw==",
      "subType": "00"
    }
  }
}
```

</details>

<details><summary>Columns + omit: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1", "alice_0"],
    "startCounterIndexes": [],
    "startCounters": [],
    "counts": [3, 1, 2, -2]
  }
}
```

### protobuf

```json
{
  "state": {
    "$binary": {
      "base64": "CgdhbGljZV8wCgVib2JfMAoHYWxpY2VfMQoHYWxpY2VfMCIEBgIEAw==",
      "subType": "00"
    }
  }
}
```

</details>

<details><summary>Split + omit: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": {
    "clientIds": ["alice", "bob", "alice", "alice"],
    "seqNums": [0, 0, 1, 0],
    "startCounterIndexes": [],
    "startCounters": [],
    "counts": [3, 1, 2, -2]
  }
}
```

### protobuf

```json
{
  "state": {
    "$binary": {
      "base64": "CgVhbGljZQoDYm9iCgVhbGljZQoFYWxpY2USBAAAAQAqBAYCBAM=",
      "subType": "00"
    }
  }
}
```

</details>

<details><summary>Dictionary + omit: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1"],
    "bunchIndices": [0, 1, 2, 0],
    "startCounterIndexes": [],
    "startCounters": [],
    "counts": [3, 1, 2, -2]
  }
}
```

### protobuf

```json
{
  "state": {
    "$binary": {
      "base64": "CgdhbGljZV8wCgVib2JfMAoHYWxpY2VfMRIEAAECACoEBgIEAw==",
      "subType": "00"
    }
  }
}
```

</details>

<details><summary>Client dictionary + omit: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": {
    "clientIds": ["alice", "bob"],
    "clientIndices": [0, 1, 0, 0],
    "seqNums": [0, 0, 1, 0],
    "startCounterIndexes": [],
    "startCounters": [],
    "counts": [3, 1, 2, -2]
  }
}
```

### protobuf

```json
{
  "state": {
    "$binary": {
      "base64": "CgVhbGljZQoDYm9iEgQAAQAAGgQAAAEAMgQGAgQD",
      "subType": "00"
    }
  }
}
```

</details>

<details><summary>Dictionary columns: JSON and actual Mongo representations</summary>

### Ordinary Mongo fields

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1"],
    "bunchIndices": [0, 1, 2, 0],
    "startCounters": [0, 0, 0, 3],
    "counts": [3, 1, 2, -2]
  }
}
```

### uint32/int32

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1"],
    "bunchIndices": {
      "$binary": {
        "base64": "AAAAAAEAAAACAAAAAAAAAA==",
        "subType": "00"
      }
    },
    "startCounters": {
      "$binary": {
        "base64": "AAAAAAAAAAAAAAAAAwAAAA==",
        "subType": "00"
      }
    },
    "counts": {
      "$binary": {
        "base64": "AwAAAAEAAAACAAAA/v///w==",
        "subType": "00"
      }
    }
  }
}
```

### bit-packed

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1"],
    "bunchIndices": {
      "$binary": {
        "base64": "ACAACAAAAA==",
        "subType": "00"
      }
    },
    "startCounters": {
      "$binary": {
        "base64": "AAAAAAYA",
        "subType": "00"
      }
    },
    "counts": {
      "$binary": {
        "base64": "BiAABDAA",
        "subType": "00"
      }
    }
  }
}
```

</details>

## What is included—and what is not

- **Start:** response bytes and document JSON have arrived; fetch/network/transport gzip and server work are excluded. JSON UTF-8 decoding and parsing, protobuf/BSON decoding, typed-array alignment copies, ID translation/tree building, document-JSON parsing, ProseMirror model/view creation, prior editor destruction, DOM creation and forced layout are inside the timer.
- **End:** two requestAnimationFrame callbacks after synchronous work. A rendering opportunity passes between them; this is a paint-ready proxy, not physical display scan-out. The separate Chrome trace must show at least one Paint event inside every measured load window or the run fails. Frame scheduling can hide sub-frame CPU improvements. The frame-wait segment includes asynchronous browser work and idle scheduling, not only paint CPU.
- **First edit:** inserts a character into both the IdList and ProseMirror document, focuses the editor, then waits through the same frame boundary. It is measured separately after load; it is not added to ready time. This minimal editor has no production plugins, decorations, media, network, React integration, or application-specific initialization.
- **GC:** union of renderer-main-thread MinorGC/MajorGC intervals intersecting each load window, without double-counting nested spans. A forced-GC canary outside the windows verifies that this browser emits the expected events. No forced GC occurs between the traced replacement loads. Concurrent/background GC work is not counted as a main-thread pause. Tracing adds overhead, so trace-pass GC is diagnostic, not a component subtracted from the untraced totals.
- **Memory:** Runtime.getHeapUsage usedSize + backingStorageSize, relative to the same warmed page with editors cleared and garbage collected. An 8 MiB ArrayBuffer calibration verifies backing-byte inclusion and guards against double counting. Inputs are released after load; the final editor and first edit remain. Kept is the median of post-GC increments. It includes JS wrappers and backing stores, not total renderer RSS, GPU memory, or all native DOM/layout allocations. Raw embedder heap and DOM-node counts are retained separately.
- **Observed high-water is NOT an exact peak.** A separate intrusive pass samples before decode and after decode, hydration, editor creation, layout and readiness. It can miss intra-stage peaks; samples also include profiler/probe overhead and garbage awaiting collection. The chart reports the largest observed increment across the memory runs. Do not rank close differences as precise transient-memory savings.
- **Allocation pressure:** a separate HeapProfiler sampling pass at 16 KiB, including objects collected by minor and major GC. It estimates JS allocations over load plus first edit, including instrumentation overhead; it is not exact allocation volume or a measurement of all ArrayBuffer/native allocations. It is not added to retained/high-water bytes. Timing runs have neither heap sampling nor memory probes.
- **Fairness:** same fixture, same editor, same viewport, same browser and CPU setting; format/workload order deterministically shuffled each round. Each timing block has a fresh context, one recorded cold load, two warmups, a GC before the block, then uninterrupted replacement loads. The result is a controlled case study on one machine/browser/structured-ID trace, not a device-independent ranking or production latency promise. All variants still create the existing editing tree; a native column-backed mutable library would require a different implementation and benchmark.
- **Format limits:** the fixture uses Matthew’s structured client/sequence IDs, not independent opaque 8-character nanoids. Split-ID results depend on that sharing. Packed columns use 13-bit dictionary indexes, 11-bit starts, and 12-bit zigzag counts: at most 8,192 dictionary entries, starts ≤ 2,047, live counts ≤ 2,047, and deleted magnitudes ≤ 2,048; overflow throws rather than widening. Fixed binary uses uint32/int32; protobuf inherits its schema’s 32-bit limits. These are experimental codecs, not hardened production input decoders.

Protocol references: [Runtime heap accounting](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/#method-getHeapUsage), [heap allocation sampling](https://chromedevtools.github.io/devtools-protocol/tot/HeapProfiler/#method-startSampling), [Chrome tracing](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/).

## Reproduce

Use Node 24 and pnpm 11. Run browser measurements without concurrent builds, Mongo, or other heavy workloads. The output is marked incomplete until every check passes; the report refuses partial runs.

```sh
pnpm install --frozen-lockfile
pnpm --filter benchmarks exec playwright install chromium
pnpm --filter articulated build
pnpm --filter benchmarks test
BROWSER_ROUNDS=3 BROWSER_TRIALS=6 pnpm --filter benchmarks browser:run
```

The runner binds only loopback on a random port and shuts down its browser/server. Optional BROWSER_CPU_RATE controls emulated CPU slowdown (not equivalent to a specific device); BROWSER_DOCUMENTS, BROWSER_ROUNDS, BROWSER_TRIALS, BROWSER_SWITCHES, BROWSER_MEMORY_TRIALS, BROWSER_CASES and BROWSER_EXECUTABLE control reruns. Partial-case smoke runs are useful for development but cannot generate the full report.

After the browser finishes, run Mongo separately:

```sh
benchmark_dbpath=$(mktemp -d /private/tmp/articulated-browser-mongo.XXXXXX)
mongod --dbpath "$benchmark_dbpath" --port 27185 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25
# In another terminal, use that exact dbPath:
ARTICULATED_BROWSER_DBPATH=/absolute/path pnpm --filter benchmarks browser:mongo
pnpm --filter benchmarks browser:report
```

The Mongo runner refuses any other port/path/binding or a nonempty database and never drops data. Stop the dedicated Mongo process afterward. Results: [browser samples](results/browser/browser.json), [Mongo measurements](results/browser/mongo.json), [GC traces](results/browser/traces), [rendered editor screenshot](results/browser/rendered-editor.png). Previous Node-only measurements remain [archived separately](full_picture.md).
