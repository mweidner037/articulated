# Full picture: saved-state format AND translation cost

Draft experiment on top of [Matthew’s PR #30](https://github.com/mweidner037/articulated/pull/30). Not a production format or API proposal.

The question is not only ‘how small is the output?’ It is also ‘what must be allocated and computed to get from that output to an editable IdList—and back?’

## First: what is actually stored?

Every example below represents these same runs. Negative counts replace the deletion boolean in the alternative formats; the final run continues alice_0 at counter 3.

```json
[
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
```

### Original objects / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Signed objects / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Signed tuples / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Matthew ordinary columns / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

```json
{
  "state": {
    "bunchIds": ["alice_0", "bob_0", "alice_1", "alice_0"],
    "startCounters": [0, 0, 0, 3],
    "counts": [3, 1, 2, -2]
  }
}
```

### Matthew columns + omit / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Matthew split + omit / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Dictionary + omit / JSON

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Matthew dictionary + omit / protobuf

Decoded contents before protobuf encoding:

```json
{
  "bunchIds": ["alice_0", "bob_0", "alice_1"],
  "bunchIndices": [0, 1, 2, 0],
  "startCounterIndexes": [],
  "startCounters": [],
  "counts": [3, 1, 2, -2]
}
```

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Matthew split + omit / protobuf

Decoded contents before protobuf encoding:

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

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

### Binary columns / adapter

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

Each numeric field is its own little-endian binary: unsigned 32-bit indexes/starts, signed 32-bit counts. JS uses Uint32Array/Int32Array views where alignment allows; otherwise it copies into an aligned buffer. Both paths retain the same snapshot layout.

### Bit-packed columns / adapter

Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):

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

Each numeric field is its own packed binary: 13-bit dictionary indexes, 11-bit starts, 12-bit zigzag signed counts. JS retains the bytes and reads fields with bit extraction. No per-run object array is required. Limits: 8,192 dictionary entries; starts ≤ 2,047; positive counts ≤ 2,047; deleted magnitudes ≤ 2,048. Overflow throws; no automatic widening.

Binary-direct, bit-direct, and split-proto-direct have **exactly the same saved bytes** as their adapter counterparts. Only the traversal/conversion path changes. Unit tests verify byte equality, and direct-path tests fail if they invoke the object-based save/load adapters.

For the gzip storage choice, the whole serialized value is gzipped (mtime: 0 for reproducibility) and stored as one BSON Binary. This is a separate physical Mongo layout, not an assumption about WiredTiger compression.

## One table: storage, retained memory, working memory, and time

Measured 2026-10-20 on Apple M5 Pro, Node v24.19.0, V8 13.6.233.17-node.51, MongoDB 8.3.3. Decimal KB/MB. 12,091 runs, 5,793 distinct bunch IDs, 241 distinct clients.

S = Snappy; Z = Zstd. Timing cells show mean ± 95% t interval across 10 warmed trials within an isolated process per format. Snapshot and editor memory are different retention choices, **not additive**. Observed working-memory columns are sampled high-water increases, **not exact peaks**.

| Format / path                        | Mongo S KB | Mongo Z KB | Gzip Mongo S KB | Gzip Mongo Z KB | Snapshot JS KB | Editor JS KB | Open snapshot ms |     Save ms | Mongo save ms | Load editor ms | Mongo load ms | Observed save MB | Observed load MB | Observed Mongo load MB | Serialized KB | Gzip KB | Gzip save ms | Gzip load ms |
| ------------------------------------ | ---------: | ---------: | --------------: | --------------: | -------------: | -----------: | ---------------: | ----------: | ------------: | -------------: | ------------: | ---------------: | ---------------: | ---------------------: | ------------: | ------: | -----------: | -----------: |
| Original objects / JSON              |      180.5 |       86.3 |            74.5 |            74.0 |         1160.9 |       2598.1 |      1.18 ± 0.02 | 1.40 ± 0.07 |   4.15 ± 0.80 |    6.06 ± 0.17 |  10.39 ± 0.62 |              4.4 |             22.7 |                   36.8 |         875.9 |    71.9 | 15.90 ± 1.11 | 13.04 ± 1.59 |
| Signed objects / JSON                |      169.7 |       91.3 |            69.9 |            70.4 |         1064.2 |       2598.4 |      0.93 ± 0.01 | 1.40 ± 0.02 |   3.45 ± 0.62 |    5.77 ± 0.06 |   7.84 ± 0.09 |              5.1 |             23.4 |                   34.7 |         671.3 |    67.2 | 13.28 ± 1.35 | 11.52 ± 1.02 |
| Signed tuples / JSON                 |      160.0 |       86.3 |            61.7 |            62.7 |         1354.4 |       2598.5 |      0.60 ± 0.02 | 1.26 ± 0.02 |   2.86 ± 0.49 |    5.31 ± 0.06 |   6.63 ± 0.04 |              5.0 |             25.3 |                   30.1 |         272.3 |    59.7 | 10.20 ± 0.17 |  9.67 ± 0.12 |
| Matthew ordinary columns / JSON      |      221.5 |      115.0 |            51.5 |            51.1 |          677.4 |       2598.1 |      0.32 ± 0.01 | 0.87 ± 0.09 |   1.67 ± 0.28 |    4.86 ± 0.06 |   5.98 ± 0.15 |              4.1 |             22.7 |                   25.7 |         248.2 |    50.1 |  9.92 ± 0.19 |  8.71 ± 0.19 |
| Matthew columns + omit / JSON        |      155.9 |       82.2 |            41.2 |            41.2 |          581.1 |       2598.1 |      0.24 ± 0.01 | 1.19 ± 0.13 |   2.04 ± 0.10 |    5.84 ± 0.17 |   6.17 ± 0.08 |              4.5 |             23.4 |                   26.2 |         217.9 |    40.2 |  8.84 ± 0.13 |  8.40 ± 0.25 |
| Matthew split + omit / JSON          |      196.9 |       95.2 |            33.1 |            31.2 |          678.0 |       2637.2 |      0.28 ± 0.01 | 1.76 ± 0.24 |   2.76 ± 0.22 |    6.19 ± 0.08 |   6.60 ± 0.06 |              5.0 |             24.5 |                   27.5 |         223.3 |    31.8 |  9.35 ± 0.05 |  8.22 ± 0.33 |
| Dictionary + omit / JSON             |      176.4 |       94.5 |            51.5 |            51.0 |          425.6 |       2450.5 |      0.21 ± 0.00 | 1.12 ± 0.13 |   1.76 ± 0.31 |    4.70 ± 0.04 |   5.29 ± 0.06 |              4.8 |             22.8 |                   24.7 |         181.0 |    49.6 |  9.30 ± 0.06 |  7.73 ± 0.16 |
| Matthew dictionary + omit / protobuf |       70.4 |       49.7 |            47.4 |            47.3 |          506.9 |       2473.1 |      1.11 ± 0.52 | 1.85 ± 0.13 |   1.80 ± 0.03 |    6.36 ± 0.17 |   6.28 ± 0.13 |              5.3 |             24.2 |                   24.2 |         118.6 |    45.9 |  6.96 ± 0.03 |  8.20 ± 0.24 |
| Matthew split + omit / protobuf      |       35.4 |       14.6 |            27.7 |            27.0 |          372.8 |       2637.2 |      0.67 ± 0.30 | 2.12 ± 0.23 |   2.01 ± 0.04 |    6.62 ± 0.13 |   6.72 ± 0.11 |              5.2 |             24.9 |                   24.9 |          44.5 |    25.8 |  4.34 ± 0.80 |  7.59 ± 0.12 |
| Same split protobuf / direct         |       35.4 |       14.6 |            27.7 |            27.0 |          372.8 |       2616.4 |      0.64 ± 0.32 | 3.13 ± 0.12 |   2.96 ± 0.05 |    6.66 ± 0.08 |   7.11 ± 0.25 |              6.3 |             23.4 |                   23.4 |          44.5 |    25.8 |  5.80 ± 1.00 |  7.50 ± 0.34 |
| Binary columns / adapter             |      123.2 |       69.9 |            78.1 |            78.1 |          566.5 |       2450.5 |      0.01 ± 0.00 | 2.79 ± 0.03 |   3.38 ± 0.08 |    4.88 ± 0.12 |   5.07 ± 0.13 |              8.2 |             23.5 |                   24.0 |         278.2 |    75.8 | 12.78 ± 0.19 |  9.15 ± 0.10 |
| Binary columns / direct              |      123.2 |       69.9 |            78.1 |            78.1 |          566.5 |       2450.7 |      0.00 ± 0.00 | 3.47 ± 0.12 |   3.89 ± 0.14 |    3.56 ± 0.06 |   3.81 ± 0.08 |             12.9 |             21.7 |                   22.4 |         278.2 |    75.8 | 13.43 ± 0.19 |  8.50 ± 0.23 |
| Bit-packed columns / adapter         |       98.6 |       69.9 |            78.1 |            78.1 |          427.4 |       2450.5 |      0.00 ± 0.00 | 2.39 ± 0.05 |   2.73 ± 0.10 |    4.74 ± 0.05 |   4.96 ± 0.07 |              6.0 |             23.0 |                   23.5 |         187.5 |    77.3 |  9.53 ± 0.11 |  8.14 ± 0.22 |
| Bit-packed columns / direct          |       98.6 |       69.9 |            78.1 |            78.1 |          427.4 |       2450.7 |      0.00 ± 0.00 | 3.07 ± 0.13 |   3.52 ± 0.16 |    3.68 ± 0.03 |   4.51 ± 0.51 |              9.2 |             21.5 |                   22.1 |         187.5 |    77.3 | 10.42 ± 0.22 |  7.34 ± 0.05 |

### Isolating the translation layer

These pairs have identical persistence formats. The table below compares measured mean times; a negative change means faster. It is descriptive, not a between-process significance test.

| Same bytes         | Adapter save ms | Direct save ms | Change | Adapter load ms | Direct load ms | Change |
| ------------------ | --------------: | -------------: | -----: | --------------: | -------------: | -----: |
| binary-direct      |            2.79 |           3.47 |  24.3% |            4.88 |           3.56 | -27.0% |
| bit-direct         |            2.39 |           3.07 |  28.6% |            4.74 |           3.68 | -22.2% |
| split-proto-direct |            2.12 |           3.13 |  47.9% |            6.62 |           6.66 |   0.7% |

## Main findings on this fixture

- Matthew’s split/omitted-counter protobuf occupies **35.4 KB with Snappy and 14.6 KB with Zstd**, versus 180.5/86.3 KB for ordinary objects. These are the native Mongo layouts, before any application-level gzip.
- Keeping the binary-column bytes identical, direct loading changes **4.88 → 3.56 ms**. Saving changes **2.79 → 3.47 ms**. Removing the intermediate array is not automatically a win in both directions.
- The split-protobuf pair loads in **6.62 vs 6.66 ms**. Protobuf decoding and counter/ID reconstruction remain even without the SavedIdList array; this is not a zero-copy typed-array path.
- Loaded editors retain **2.45–2.64 MB** across the matrix. Compact snapshot storage is a separate benefit; it does not remove the existing editing tree’s cost.

## How to read the result

- **Compact persistence is not a compact editing tree.** Every load ends with the same existing IdList data structure. The retained editor is much larger than its saved payload, and its actual heap footprint can vary with string sharing and runtime representation. This experiment does not replace the tree with packed columns.
- **Direct does not mean free.** Binary/bit writers make two tree walks (size/dictionary, then fill exact-size buffers). Direct protobuf grows column arrays and still encodes/decodes protobuf; it only removes SavedIdList materialization. Faster loads do not guarantee faster saves.
- **Typed-array views are conditional zero-copy.** Unaligned BSON offsets require aligned copies; these are included in Mongo-load time. Bit-packed fields need extraction. Omitted starts require sequential reconstruction with a Map. These costs are measured, not assumed away.
- **Do not infer Mongo size from serialized size.** The ordinary-column and gzip-as-binary layouts are measured separately under both compressors. No logical BSON-size column is used as a storage proxy.
- **Identical format means identical storage choice.** The main table reuses each adapter’s measured disk rows for its direct counterpart. Both were actually measured independently; their allocated file sizes differ because of allocation/checkpoint/free-space effects. Those differences are not compression gains. All 56 raw collection measurements are retained.
- **This fixture favors structured-ID sharing.** It uses Matthew’s client/sequence generation and refresh-every-1000-operations setup. These numbers must not be applied to independent opaque IDs or to a production corpus without remeasurement.

## Definitions and method

### CPU and input equivalence

The fixture replays kleppmannReal with seed 42 and a refresh every 1,000 operations using Matthew’s IdListAlgorithm. All rows receive the same canonical final state, loaded into the same tree before timed saves. This deliberately controls final-tree shape; it is not an exact reproduction of his final unrefreshed save experiment. His existing transform functions and generated protobuf encoders are reused. The delta-index protobuf variant named in his comment is absent from the pinned source; this report uses the implemented split-client-index variant, not an invented delta codec.

- **Open snapshot:** parse/decode the saved value to its retained snapshot representation, without building an editing tree. Binary columns open views or make alignment copies; packed columns already are the view.
- **Save:** tree to each codec’s saved value, as in Matthew’s API. JSON returns a string; protobuf returns bytes; separate binary columns return a dictionary and byte fields. The latter has no extra whole-document envelope at this step.
- **Mongo save:** tree to natural BSON document bytes, including BSON serialization. JSON formats directly produce objects/columns here, avoiding an artificial stringify/parse round trip. This excludes database I/O.
- **Load editor:** saved value to usable IdList, including parsing/decoding, translation, validation in the shared tree builder, and tree construction.
- **Mongo load:** BSON bytes to usable IdList, including driver-compatible BSON deserialization. JSON layouts consume the deserialized fields directly rather than re-stringifying them. Excludes network, database query time, and WiredTiger decompression.
- **Serialized/Gzip KB:** Matthew’s output-size metrics, included for completeness, not as Mongo storage estimates. JSON is UTF-8; protobuf uses its bytes; separate binary columns use a BSON document as the serialization container. Gzip save/load includes conversion to/from that container and compression/decompression.
- Five warmups then ten measured operations, explicit GC before each timed trial, verification outside the timer. Format order is deterministically shuffled. Each format’s timings run in a fresh child process, but its ten samples share that process/JIT. Confidence intervals do not capture between-process, machine, browser or workload variation.

### Memory

Snapshot JS KB and Editor JS KB use Matthew’s V8 heap-snapshot dominator calculation. Each result is the median of three fresh processes after warmup. Temporary fixture, input and conversion references are released before capture; the unique holder owns the retained result. ArrayBuffer backing storage is counted by the heap snapshot; it is not added a second time. A 1 MiB typed-array calibration verifies that native backing bytes are present. Raw samples are in js.json.

Observed save/load MB uses heapUsed + arrayBuffers above a pre-operation baseline, sampled at conversion boundaries, operation end, and every 1,024 runs in direct/custom paths. The table takes the largest of five observations. Input and pre-existing tree are excluded by the baseline, while outputs and not-yet-collected garbage are included. There is no forced GC inside the operation. Sampling can miss peaks and itself adds overhead; it runs separately from timings. This is neither allocation volume nor a precise live-memory peak. GC scheduling can dominate differences. No claim of zero transient memory follows from a low value.

These are Node/V8 measurements, not actual Chrome heap measurements. No browser rendering, application state, concurrent editors, workers, or WASM memory is included.

### Mongo

A dedicated loopback MongoDB 8.3.3 server with a fresh temporary dbPath, port 27184, and 0.25 GB WiredTiger cache. 100 documents per collection, each with a distinct deterministic 10-character client dictionary while preserving sequence numbers, sharing, and edit structure. Same numeric trace repeats: this is not a production corpus.

All collections are checked for document count. Documents 0 and 99 are read back through the actual Mongo driver and fully decoded/checked, including gzip layouts. Every collection runs compact with freeSpaceTargetMB: 1; after all writes are checkpointed with fsync, every collection is compacted again. A final locked fsync precedes measurement. Allocated .wt file sizes must exactly match $collStats.storageStats.storageSize, and creationString must identify the requested compressor. Reported KB is collection-file bytes divided by document count; integer _ids are included, indexes/journals/replicas/shared server overhead are not. Raw free and index bytes and both compact responses are preserved. Compact does not guarantee minimum file size or remove all free space.

### Scope and correctness

The library change is an explicitly experimental scalar visitor/consumer interface. save() remains unchanged; load() delegates to the same builder used by the direct consumer. All rows use this refactored builder, so reported times are not claimed to match the unmodified PR’s timings. No stable API, migration, editor-tree redesign or production rollout is proposed.

The matrix validates complete saved runs after every measured load and after BSON/gzip round trips—not only list length. Focused tests cover sparse exceptions (including first/nonzero starts and backward counters), empty/zero-count/merged runs, edits after reload, scalar traversal through random edits, direct-vs-adapter byte equality, bypassing the object adapters, aligned/unaligned buffers, packed range limits and truncated fields, and duplicate-ID rejection. Fixed-width binary here is a new uint32/int32 experiment, not a rerun of the earlier Float64-based safe-integer codec. It rejects overflow. Protobuf inherits Matthew’s uint32/sint32 limits and non-hardened decoding; arbitrary IDs and out-of-range input need separate production validation. Packed inputs are not hardened against hostile input either.

## Reproduce

Use Node 24 and pnpm 11. Run CPU benchmarks without Mongo or other heavy jobs running.

```sh
pnpm install --frozen-lockfile
pnpm --filter articulated build
pnpm test
pnpm --filter benchmarks full-picture:js
```

Start a separate isolated server (foreground works on macOS):

```sh
benchmark_dbpath=$(mktemp -d /private/tmp/articulated-full-picture.XXXXXX)
mongod --dbpath "$benchmark_dbpath" --port 27184 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25
```

In another terminal, use that exact printed/selected path:

```sh
ARTICULATED_BENCH_DBPATH=/absolute/path/from/mktemp pnpm --filter benchmarks full-picture:mongo
pnpm --filter benchmarks full-picture:report
```

The runner refuses a server with another path/port/binding and refuses a nonempty benchmark database. It never drops data. Stop the dedicated server after measurement. The generated fixture stays local; the measured results and report are committed.

Raw results: [JS timings and memory](results/full-picture/js.json), [Mongo collection measurements](results/full-picture/mongo.json), [examples](results/full-picture/examples.json). Benchmark source: [full_picture](src/full_picture).
