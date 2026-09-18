# Signed-count SavedIdList: representation comparison

**Draft exploration only. One fixed logical format; multiple physical encodings.**
Every row in this PR describes the same three-field signed-count SavedIdList, with the same run boundaries, ID order, counters and deletion information.
There are no rows from the other concept and no loaded editing-tree memory rows.

The other concept is deliberately a separate [draft PR #24](https://github.com/mweidner037/articulated/pull/24).
Compare PR to PR if you want to compare concepts; this table compares representations only.

## 1. Objects: the baseline for this entire PR

```js
[
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3 },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1 },
  { bunchId: "aB3dE5fG", startCounter: 3, count: -2 },
];
```

The sign of `count` carries deletion: positive means present; negative means deleted; `Math.abs(count)` is run length. There is no separate `isDeleted` field anywhere in this family's persisted layouts.

This branch provides `list.saveSignedCounts()` and `IdList.loadSignedCounts(...)`. The original `save()`/`load()` contract is not changed.
We are not introducing another CRDT or changing the live editing tree.

## 2. Three-tuples

```js
[
  ["aB3dE5fG", 0, 3],
  ["hJ7kL9mN", 0, 1],
  ["aB3dE5fG", 3, -2],
];
```

Each tuple is `[bunchId, startCounter, signedCount]`.
The outer array and each tuple are ordinary JS/BSON arrays, not typed arrays.
Strings remain repeated by run. Smaller BSON does not guarantee smaller JS
memory: this trace retains more memory as nested tuples than as objects.

## 3. Dictionary + ordinary columns

```js
const columns = {
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
};
```

Each distinct ID appears once. Mongo stores ordinary BSON arrays. The browser
can keep ordinary arrays or convert each numeric column to a compact typed
array; those are separate JS rows with identical Mongo storage.

For this tiny example, the typed JS form is:

```js
({
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: new Uint8Array([0, 1, 0]),
  startCounters: new Uint8Array([0, 0, 3]),
  signedCounts: new Int8Array([3, 1, -2]),
});
```

In the full trace the three numeric columns require 16-bit elements.

## 4. Dictionary + separate BSON Binary columns

The object has the same named fields, but each numeric column is a separate
generic BSON Binary value. No whole-snapshot binary envelope or column-type
metadata is stored. The schema fixes byte interpretation: indexes are little-endian
Uint32; starts and signed counts are little-endian Float64.
Float64 preserves safe-integer values exactly. Loaded JS arrays are narrowed to
the smallest integer widths that fit; stored widths do not dictate retained widths.

Here is the actual numbers → bytes → Mongo step:

```js
import { Binary } from "mongodb";

function littleEndian(values, width) {
  const bytes = new Uint8Array(values.length * width);
  const view = new DataView(bytes.buffer);
  values.forEach((value, i) => {
    if (width === 1) view.setUint8(i, value);
    else if (width === 4) view.setUint32(i * 4, value, true);
    else view.setFloat64(i * 8, value, true);
  });
  return bytes;
}

await collection.insertOne({
  state: {
    version: 1,
    bunchIds: columns.bunchIds,
    bunchIndexes: new Binary(littleEndian(columns.bunchIndexes, 4)),
    startCounters: new Binary(littleEndian(columns.startCounters, 8)),
    signedCounts: new Binary(littleEndian(columns.signedCounts, 8)),
  },
});
```

Our code creates bytes; `new Binary(...)` merely selects BSON Binary storage.
It does not compress or pack values. To load, obtain each field's bytes with
`document.state.field.value()`, read the fixed-width values with DataView, and
construct compact typed arrays. The benchmark implements and tests this path.

## 5. Dictionary + flat runs

```js
{
  version: 1,
  bunchIds: ["aB3dE5fG","hJ7kL9mN"],
  runs: [0,0,3,1,0,1,0,3,-2],
}
```

The `runs` array repeats three numeric fields: index, start, signed count.
It can be stored as an ordinary BSON array and retained as ordinary/typed JS,
or stored as one little-endian Float64 Binary field and narrowed on load.
These alternatives each have their own table row.

## 6. Packed record per run: eight bytes or five bytes

Pack the fields into one exact integer (36 used bits):

```js
const code = signedCount < 0 ? -2 * signedCount - 1 : 2 * signedCount;
const packed = (bunchIndex * 2048 + startCounter) * 4096 + code;
// Example packed values: [6, 8388610, 12291]
```

The eight-byte option stores each integer as a little-endian Float64.
The five-byte option stores its unsigned integer bytes low-byte-first:

```js
({
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  runs: new Uint8Array([6, 0, 0, 0, 0, 2, 0, 128, 0, 0, 3, 48, 0, 0, 0]),
});
```

Mongo receives `runs: new Binary(bytes)`; JS retains those bytes. Scalar
decoders read one record without expanding the complete snapshot. Neither
option stores an array of per-run JS objects after loading.

## 7. Separate bit-packed columns

```js
({
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: new Uint8Array([0, 32, 0, 0, 0]),
  startCounters: new Uint8Array([0, 0, 192, 0, 0]),
  signedCounts: new Uint8Array([6, 32, 0, 3, 0]),
});
```

Widths: 13-bit dictionary index, 11-bit start, 12-bit zigzag signed count. Counts [3, 1, -2] become codes [6, 2, 3].
Only the end of each column is padded. Mongo stores each displayed byte array
with its own `new Binary(bytes)`; JS retains the packed arrays and uses scalar
bit extraction. No column-type metadata or stored run count is needed here:
`floor(bunchIndexes.byteLength * 8 / 13)` determines the run count.

Packed options are bounded experiments: at most 8,192 dictionary entries,
starts 0–2,047, present counts 1–2,047 and deleted magnitudes 1–2,048.
Overflow throws; there is no automatic fallback or widening.
Ordinary and full-width Binary forms have no such bit-width restrictions.
These local benchmark schemas use `version: 1` only as a fixed example field;
it does not identify the representation. A production schema/version decision
is explicitly out of scope.

## Results: only this concept, all representations

All rows were freshly measured on September 18, 2026. **Decimal KB**.
11,757 runs / 5,382 eight-character IDs, from the same 259,778-edit trace.
Every number includes IDs/dictionary. No wire/gzip metrics.

| Mongo representation  | Retained JS representation | Mongo Snappy KB | Mongo Zstd KB | Retained JS KB |
| --------------------- | -------------------------- | --------------: | ------------: | -------------: |
| Objects               | Objects                    |           180.5 |         110.9 |          664.9 |
| Tuples                | Ordinary nested arrays     |           176.4 |         106.8 |          947.1 |
| Ordinary columns      | Ordinary arrays            |           266.5 |         147.6 |          332.0 |
| Ordinary columns      | Adaptive typed arrays      |           266.5 |         147.6 |          120.8 |
| Binary columns        | Adaptive typed arrays      |           151.8 |          98.6 |          120.8 |
| Flat numeric runs     | Ordinary flat array        |           274.7 |         172.3 |          331.9 |
| Flat numeric runs     | Typed flat array           |           274.7 |         172.3 |          120.4 |
| Binary flat runs      | Typed flat array           |           156.3 |          98.6 |          120.4 |
| Packed 8-byte records | Bytes + scalar decoder     |           149.0 |          90.4 |          143.9 |
| Packed 5-byte records | Bytes + scalar decoder     |           131.4 |          97.0 |          108.6 |
| Bit-packed columns    | Bytes + scalar decoder     |           123.2 |          95.2 |          103.1 |

Mongo is actual allocated collection-file bytes / 100 documents, after
`compact` and a locked flush. It includes the integer document IDs but excludes
indexes, journals, replicas and shared server overhead. JS is retained snapshot
heap + ArrayBuffers, not an editor tree or peak allocation.

Within this concept, bit-packed columns used **31.8% less Snappy disk**
and **84.5% less retained JS memory** than objects.
This is a size result, not a recommendation to accept packed range limits.
Ordinary columns can improve JS memory while worsening Mongo storage because
BSON arrays include per-element index keys; Mongo compression must be measured,
not inferred from JS layout or logical BSON.

## Method and limitations

- One fixed run sequence per family. SHA-256-derived, eight-character base64url
  ID fixtures, not calls to NanoID. Each of 100 Mongo documents has its own
  dictionary; the numerical edit trace repeats. This is not a production corpus.
- MongoDB Community 8.3.3 on isolated localhost, macOS arm64, 0.25 GB WiredTiger
  cache. Nine persisted layouts × none/Snappy/Zstd = **27 collections for this PR**.
  Two extra JS rows reuse ordinary-column/flat Mongo layouts.
- Compressor explicitly configured and checked. Every collection received
  `compact` with `freeSpaceTargetMB: 1`: all returned `ok: 1, bytesFreed: 0`.
  Allocated `.wt` file sizes matched `$collStats.storageStats.storageSize`
  after locked `fsync`. Raw results include reusable free bytes and index sizes.
  Fresh insertion/checkpoints can leave reusable space; compact's 1 MB threshold
  is not a guarantee of minimum file size. Small differences can be allocation
  granularity rather than meaningful compression improvements.
- JS: Node 22.22.2 / V8 12.4.254.21-node.39, macOS arm64; a new child per row;
  three warmups; five samples × twenty retained copies; four GCs before/after.
  Reported total is median heapUsed + arrayBuffers, counted once. Full samples
  and ranges are in the raw JSON. Ordinary forms are JSON-parsed; binary inputs
  are copied/decoded. Setup inputs are kept alive and excluded. Short parsed
  strings may be shared. This is a Node/V8 proxy, not an actual browser heap.
- Typed conversions may temporarily materialize runs. Retained memory excludes
  those intermediates, not their peak allocation cost. Packed scalar reads avoid
  whole-snapshot unpacking; decoding a run object still allocates that object.
- CPU cost, latency, browser heaps, migration, production Atlas storage/billing
  and save/load peaks are not measured. Public save/load behavior and editing
  data structures are not changed by the benchmark codecs.
- Every full-trace encoding and BSON round trip is checked, along with reconstruction
  through the existing loader. Mongo verifies documents 0 and 99 per layout.
  Tests cover empty snapshots, byte alignment, range overflow, retained ownership,
  exact ordinary column fields, and accessor bounds.
- `benchmarks/format_matrix.ts` holds **benchmark-only codecs**, not production
  formats or hardened arbitrary-input parsers. The table measures these codecs
  rather than assuming existing public snapshot wrappers have identical overhead.

## Reproduce

Use Node 22.22.2:

```sh
npm ci
npm test
npm run benchmarks:storage
```

That command selects only this PR's family via `benchmarks/format_family.ts`
and produces JSON with examples, logical BSON bytes and all memory samples.
No other PR checkout is needed.

For Mongo, start a dedicated temporary server:

```sh
benchmark_dbpath=$(mktemp -d /private/tmp/articulated-format-mongo.XXXXXX)
mongod --dbpath "$benchmark_dbpath" --port 27184 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25
```

In another terminal, from this checkout, set the exact same temporary path:

```sh
ARTICULATED_BENCH_DBPATH=/absolute/temp/dbpath mongosh --quiet mongodb://127.0.0.1:27184/admin --file benchmarks/format_mongo.mongosh
```

The script refuses another server path/port/binding and partial fixtures; it never
drops data. Stop that dedicated server afterward. No production database is used.

Raw evidence: [JS/BSON and examples](benchmarks/results/format-js.json),
[actual Mongo sizes, compaction and file checks](benchmarks/results/format-mongo.json).

The signed-count object API remains an optional prototype. Its current save/load adapter materializes ordinary runs; release unused input snapshots after loading. A mixed-format deployment would need a format discriminator; passing these objects to the old loader is not supported.
