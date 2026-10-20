# Two decisions: Mongo storage and complete browser loading

Draft experiment. Mongo disk usage is separate from browser behavior. Binary is an encoding of a logical JSON structure, never an unrelated alternative structure.

Measured 2026-10-20 in Chromium 151.0.7922.34 on Apple M5 Pro, CPU rate 1×. Each document has 104,852 characters, 1,173 paragraphs, and the same 12,091 ID runs. This is a **real, controlled ProseMirror editor in Chromium**, not the production application. The four-document case mounts four copies of that same document; it is a scaling test, not a production corpus.

## Conclusions supported by this run

- **Binary has a clear storage benefit, but not an automatic browser benefit.** Holding client-dictionary + omitted-counter structure constant, ordinary Mongo fields use 188.7 KB/doc with Snappy versus 35.4 KB/doc as protobuf. Yet the 4-document browser median is 49.9 ms for JSON and 49.9 ms for protobuf; retained JS/backing memory is 6.5 vs 6.5 MB. This does not prove identical population performance; it does rule out claiming the storage ratio as a browser-speed ratio.
- **Packing the same dictionary columns saves Mongo bytes without a comparable retained-browser-memory saving.** Ordinary fields / uint32-int32 / packed columns occupy 245.9 / 123.2 / 98.6 KB/doc with Snappy. Through the object loader, their 4-document median readiness times are 41.8 / 41.5 / 42.2 ms. Retained memory is 6.9 / 6.9 / 6.9 MB. The compact input is discarded and all paths end in the same library tree.
- **Do not choose a browser winner from the mean alone.** 3 samples exceed three times their row median (282.5, 266.8, 273.3 ms). All samples remain in the results. The causes of these stalls were not established, and the separate GC diagnostic pass cannot explain a specific untraced outlier. Use the median, per-round comparisons, and raw distributions together. On the single-document workload, frame scheduling largely masks these small codec differences.
- **Decision:** select the logical representation and Mongo encoding for storage savings and acceptable complexity; these measurements do not justify a claim that binary encoding alone substantially reduces retained editing memory or typical browser readiness time. A native compact mutable editing structure is a different project; none of these loaders implements it.

## How to read the integrated comparison

Read across one row: complete readiness time first, then its tail latency, GC pauses, temporary memory, and retained memory. Compare encodings **within a logical-format group**, and compare object/direct loaders while holding the encoding fixed. A smaller Mongo file is not evidence of a faster browser.

The stacked bar is one directly timed operation, partitioned into non-overlapping stages—not a sum of unrelated microbenchmarks. GC happens inside those stages. Its diagnostic column must not be added to the total. Memory profiling and GC tracing run separately from the primary timing pass.

## Browser: all dimensions together

Each row has 18 warm timing samples across 3 fresh browser contexts, 8 traced document replacements without forced GC between them, and 3 separately profiled memory runs. P95 is an empirical sample percentile, not a reliable population-tail estimate from this small run. Raw cold-start samples and per-round results are retained.

### 1 document(s)

![Integrated browser load, GC and memory comparison](results/browser/browser-1.svg)

| Logical format           | Encoding / path        | Ready mean ms | Ready P50 ms | Ready P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | ---------------------- | ------------: | -----------: | -----------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Original objects         | JSON / objects         |          17.0 |         16.6 |         24.4 |         25.4 |              0.9 / 1.2 |              6.8 |     1.7 |                   13.7 |             225.3 |
| Original objects         | BSON / objects         |          18.2 |         16.6 |         25.0 |         27.3 |              1.1 / 1.0 |              5.5 |     1.7 |                   21.8 |              18.8 |
| Signed objects           | JSON / objects         |          16.4 |         16.6 |         21.9 |         23.8 |              0.9 / 1.1 |              7.2 |     1.7 |                   14.7 |              19.0 |
| Signed objects           | BSON / objects         |          18.4 |         16.6 |         25.0 |         27.6 |              1.1 / 0.9 |              4.7 |     1.7 |                   20.4 |              19.4 |
| Signed tuples            | JSON / objects         |          16.2 |         16.3 |         20.8 |         24.7 |              0.9 / 1.0 |              5.5 |     1.7 |                   15.5 |              20.1 |
| Signed tuples            | BSON / objects         |          17.6 |         16.7 |         23.0 |         24.1 |              1.0 / 1.8 |              7.3 |     1.7 |                   17.5 |              19.0 |
| Ordinary columns         | JSON / objects         |          16.0 |         16.2 |         16.8 |         24.0 |              0.8 / 1.0 |              4.1 |     1.7 |                   13.9 |              19.7 |
| Ordinary columns         | protobuf / objects     |          17.8 |         16.7 |         28.7 |         25.1 |              0.9 / 1.0 |              5.4 |     1.7 |                   15.3 |              19.6 |
| Columns + omit           | JSON / objects         |          16.5 |         16.4 |         20.6 |         24.8 |              0.7 / 0.6 |              5.5 |     1.6 |                   14.6 |              19.5 |
| Columns + omit           | protobuf / objects     |          17.0 |         16.6 |         22.6 |         27.5 |              0.9 / 0.9 |              4.5 |     1.6 |                   16.3 |              18.7 |
| Split + omit             | JSON / objects         |          17.0 |         16.6 |         22.1 |         27.5 |              0.8 / 1.1 |              4.8 |     1.6 |                   15.0 |              18.7 |
| Split + omit             | protobuf / objects     |          16.9 |         16.5 |         23.0 |         25.4 |              0.9 / 1.1 |              5.4 |     1.6 |                   15.9 |              20.1 |
| Dictionary + omit        | JSON / objects         |          15.9 |         16.0 |         18.4 |         24.9 |              0.9 / 1.2 |              5.4 |     1.6 |                   14.2 |              20.7 |
| Dictionary + omit        | protobuf / objects     |          16.5 |         16.6 |         20.5 |         25.6 |              0.9 / 1.0 |              5.5 |     1.6 |                   14.1 |              18.6 |
| Client dictionary + omit | JSON / objects         |          17.6 |         16.7 |         24.2 |         23.5 |              0.7 / 0.5 |              3.7 |     1.6 |                   14.4 |              18.7 |
| Client dictionary + omit | protobuf / objects     |          16.4 |         16.2 |         22.6 |         93.3 |              1.0 / 0.9 |              3.6 |     1.6 |                   15.0 |              19.6 |
| Client dictionary + omit | JSON / direct          |          16.4 |         16.6 |         20.6 |         24.4 |              0.9 / 1.2 |              4.9 |     1.6 |                   14.0 |              20.1 |
| Client dictionary + omit | protobuf / direct      |          16.9 |         16.5 |         25.2 |         24.5 |              0.8 / 1.0 |              3.8 |     1.6 |                   14.6 |              19.1 |
| Dictionary columns       | JSON / objects         |          16.4 |         16.6 |         20.6 |         23.7 |              0.9 / 1.1 |              5.6 |     1.6 |                   13.8 |              19.7 |
| Dictionary columns       | JSON / direct          |          15.8 |         16.6 |         16.7 |         24.5 |              0.8 / 0.6 |              5.6 |     1.6 |                   13.5 |              20.3 |
| Dictionary columns       | uint32/int32 / objects |          16.2 |         16.5 |         16.9 |         24.8 |              0.9 / 1.0 |              3.7 |     1.6 |                   14.2 |              18.7 |
| Dictionary columns       | uint32/int32 / direct  |          16.3 |         16.2 |         20.9 |         25.0 |              1.0 / 1.1 |              5.6 |     1.6 |                   13.6 |              20.0 |
| Dictionary columns       | bit-packed / objects   |          16.8 |         16.6 |         21.8 |         24.2 |              0.9 / 1.0 |              3.6 |     1.6 |                   14.8 |              19.2 |
| Dictionary columns       | bit-packed / direct    |          16.7 |         16.6 |         20.8 |         24.8 |              0.9 / 1.2 |              5.5 |     1.6 |                   13.3 |              18.9 |

### 4 document(s)

![Integrated browser load, GC and memory comparison](results/browser/browser-4.svg)

| Logical format           | Encoding / path        | Ready mean ms | Ready P50 ms | Ready P95 ms | Cold mean ms | GC mean / max pause ms | Observed high MB | Kept MB | Sampled allocations MB | First-edit P95 ms |
| ------------------------ | ---------------------- | ------------: | -----------: | -----------: | -----------: | ---------------------: | ---------------: | ------: | ---------------------: | ----------------: |
| Original objects         | JSON / objects         |          49.2 |         49.2 |         58.0 |         58.3 |              2.2 / 1.7 |             16.9 |     7.3 |                   54.4 |              19.1 |
| Original objects         | BSON / objects         |          58.0 |         57.3 |         73.9 |         67.8 |              3.0 / 1.7 |             17.2 |     7.3 |                   84.6 |              18.9 |
| Signed objects           | JSON / objects         |          63.7 |         49.8 |        282.5 |         58.1 |              3.4 / 3.3 |             21.6 |     7.3 |                   55.2 |              18.7 |
| Signed objects           | BSON / objects         |          54.7 |         50.0 |         68.1 |         66.2 |              2.9 / 1.6 |             21.2 |     7.3 |                   80.2 |              19.9 |
| Signed tuples            | JSON / objects         |          47.1 |         42.9 |         58.6 |         59.0 |              2.3 / 1.5 |             17.2 |     7.3 |                   57.3 |              18.7 |
| Signed tuples            | BSON / objects         |          52.5 |         49.9 |         66.9 |         62.3 |              3.9 / 3.0 |             17.7 |     7.3 |                   70.3 |              20.0 |
| Ordinary columns         | JSON / objects         |          45.9 |         41.7 |         58.3 |         58.1 |              2.1 / 1.4 |             16.7 |     7.3 |                   54.5 |              20.0 |
| Ordinary columns         | protobuf / objects     |          50.1 |         49.3 |         75.0 |         57.7 |              2.3 / 1.5 |             14.5 |     7.4 |                   62.8 |              19.9 |
| Columns + omit           | JSON / objects         |          48.6 |         49.8 |         56.2 |         59.0 |              2.2 / 1.5 |             15.5 |     6.5 |                   55.9 |              18.8 |
| Columns + omit           | protobuf / objects     |          51.7 |         49.8 |         67.8 |         58.1 |              2.2 / 1.5 |             12.8 |     6.5 |                   61.3 |              19.8 |
| Split + omit             | JSON / objects         |          49.7 |         49.6 |         57.6 |         58.1 |              2.2 / 1.5 |             15.9 |     6.5 |                   58.4 |              20.0 |
| Split + omit             | protobuf / objects     |          52.6 |         50.0 |         59.4 |         60.6 |              2.1 / 1.5 |             13.9 |     6.5 |                   62.0 |              20.2 |
| Dictionary + omit        | JSON / objects         |          45.8 |         41.7 |         58.0 |         57.6 |              2.2 / 1.5 |             13.5 |     6.9 |                   54.9 |              19.0 |
| Dictionary + omit        | protobuf / objects     |          45.9 |         41.7 |         58.6 |         58.0 |              2.7 / 1.5 |             10.9 |     6.9 |                   56.2 |              19.8 |
| Client dictionary + omit | JSON / objects         |          49.2 |         49.9 |         56.0 |         57.5 |              2.2 / 1.4 |             10.5 |     6.5 |                   57.0 |              20.1 |
| Client dictionary + omit | protobuf / objects     |          50.1 |         49.9 |         58.3 |         58.2 |              2.3 / 1.3 |             13.9 |     6.5 |                   58.1 |              19.8 |
| Client dictionary + omit | JSON / direct          |          46.3 |         47.8 |         51.1 |         57.4 |              2.0 / 1.3 |              9.1 |     6.5 |                   54.4 |              19.7 |
| Client dictionary + omit | protobuf / direct      |          46.7 |         49.3 |         50.4 |         57.8 |              2.1 / 1.2 |             11.0 |     6.5 |                   57.2 |              18.8 |
| Dictionary columns       | JSON / objects         |          44.5 |         41.8 |         51.1 |         56.7 |              2.3 / 1.5 |             16.1 |     6.9 |                   55.4 |              20.1 |
| Dictionary columns       | JSON / direct          |          56.9 |         41.8 |        266.8 |         55.0 |              2.1 / 1.4 |             11.2 |     6.9 |                   51.3 |              20.0 |
| Dictionary columns       | uint32/int32 / objects |          44.5 |         41.5 |         56.2 |         57.8 |              2.2 / 1.4 |             10.7 |     6.9 |                   56.4 |              19.7 |
| Dictionary columns       | uint32/int32 / direct  |          43.1 |         41.7 |         50.1 |         57.7 |              1.9 / 1.1 |             14.4 |     6.9 |                   52.4 |              20.1 |
| Dictionary columns       | bit-packed / objects   |          58.4 |         42.2 |        273.3 |         60.5 |              2.7 / 2.4 |             10.6 |     6.9 |                   58.0 |              19.7 |
| Dictionary columns       | bit-packed / direct    |          43.4 |         41.6 |         50.4 |         58.2 |              2.0 / 1.2 |             14.0 |     6.9 |                   52.7 |              18.5 |

## Matched comparisons, not cross-format winners

These are changes in measured means, not significance claims. The three round deltas show how reproducible the direction was across fresh contexts. Negative means faster.

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

## Mongo: separate physical-storage comparison

MongoDB 8.3.3; 100 documents per layout/compressor, with distinct client dictionaries. Actual allocated collection-file bytes after compact, checkpoint, another compact, and locked fsync. Indexes and shared server overhead excluded; allocated free pages may remain. No logical-BSON or wire-size proxy.

JSON rows mean ordinary BSON objects/arrays in Mongo, **not JSON strings**. Protobuf rows mean one BSON Binary. Numeric-column encodings mean a dictionary plus separate BSON Binary fields. The BSON browser-response variant for objects/tuples uses the same ordinary Mongo layout; it does not imply storing a second blob. Direct/object loader paths also share storage.

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
