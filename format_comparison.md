# Four-field run format: representation comparison

**Draft exploration only. One fixed logical format; multiple physical encodings.**
Every row in this PR describes the same four-field runs, with the same run boundaries, ID order, counters and deletion information.
There are no rows from the other concept and no loaded editing-tree memory rows.

The other concept is deliberately a separate [draft PR #26](https://github.com/mweidner037/articulated/pull/26).
Compare PR to PR if you want to compare concepts; this table compares representations only.

## 1. Objects: the baseline for this entire PR

```js
[
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
```

`count` is the nonnegative run length and `isDeleted` is a separate boolean. All representations preserve those separate logical fields; numeric layouts encode the boolean as 0/1 or one bit.

This baseline is returned by the built-in `list.save()` and accepted by `IdList.load(...)`.
We are not introducing another CRDT or changing the live editing tree.

## 2. Four-tuples

```js
[
  ["aB3dE5fG", 0, 3, false],
  ["hJ7kL9mN", 0, 1, false],
  ["aB3dE5fG", 3, 2, true],
];
```

Each tuple is `[bunchId, startCounter, count, isDeleted]`.
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
  counts: [3, 1, 2],
  isDeleted: [false, false, true],
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
  counts: new Uint8Array([3, 1, 2]),
  isDeleted: new Uint8Array([0, 0, 1]),
});
```

In the full trace the index, start and count columns require 16-bit elements, while the deletion column uses Uint8.

## 4. Dictionary + separate BSON Binary columns

The object has the same named fields, but each numeric column is a separate
generic BSON Binary value. No whole-snapshot binary envelope or column-type
metadata is stored. The schema fixes byte interpretation: indexes are little-endian
Uint32; starts/counts are little-endian Float64; deletion values are one byte each.
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
    counts: new Binary(littleEndian(columns.counts, 8)),
    isDeleted: new Binary(littleEndian(columns.isDeleted.map(Number), 1)),
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
  runs: [0,0,3,0,1,0,1,0,0,3,2,1],
}
```

The `runs` array repeats four numeric fields: index, start, count, deleted-as-0/1.
It can be stored as an ordinary BSON array and retained as ordinary/typed JS,
or stored as one little-endian Float64 Binary field and narrowed on load.
These alternatives each have their own table row.

## 6. Packed record per run: eight bytes or five bytes

Pack the fields into one exact integer (36 used bits):

```js
const packed =
  (bunchIndex * 2048 + startCounter) * 4096 + count * 2 + Number(isDeleted);
// Example packed values: [6, 8388610, 12293]
```

The eight-byte option stores each integer as a little-endian Float64.
The five-byte option stores its unsigned integer bytes low-byte-first:

```js
({
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  runs: new Uint8Array([6, 0, 0, 0, 0, 2, 0, 128, 0, 0, 5, 48, 0, 0, 0]),
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
  counts: new Uint8Array([3, 8, 128, 0, 0]),
  isDeleted: new Uint8Array([4]),
});
```

Widths: 13-bit dictionary index, 11-bit start, 11-bit count, and a separate 1-bit deletion column. The deletion flags [false, false, true] become byte [4], low-bit-first.
Only the end of each column is padded. Mongo stores each displayed byte array
with its own `new Binary(bytes)`; JS retains the packed arrays and uses scalar
bit extraction. No column-type metadata or stored run count is needed here:
`floor(bunchIndexes.byteLength * 8 / 13)` determines the run count.

Packed options are bounded experiments: at most 8,192 dictionary entries,
starts 0–2,047, counts 1–2,047.
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
| Objects               | Objects                    |           196.9 |         110.8 |          759.0 |
| Tuples                | Ordinary nested arrays     |           186.2 |         106.8 |         1041.1 |
| Ordinary columns      | Ordinary arrays            |           311.6 |         147.7 |          426.1 |
| Ordinary columns      | Adaptive typed arrays      |           311.6 |         147.7 |          132.8 |
| Binary columns        | Adaptive typed arrays      |           151.8 |         104.4 |          132.8 |
| Flat numeric runs     | Ordinary flat array        |           323.9 |         188.7 |          425.9 |
| Flat numeric runs     | Typed flat array           |           323.9 |         188.7 |          143.9 |
| Binary flat runs      | Typed flat array           |           172.2 |         101.8 |          143.9 |
| Packed 8-byte records | Bytes + scalar decoder     |           147.7 |          90.4 |          143.9 |
| Packed 5-byte records | Bytes + scalar decoder     |           131.4 |          99.3 |          108.6 |
| Bit-packed columns    | Bytes + scalar decoder     |           123.2 |          94.4 |          103.3 |

Mongo is actual allocated collection-file bytes / 100 documents, after
`compact` and a locked flush. It includes the integer document IDs but excludes
indexes, journals, replicas and shared server overhead. JS is retained snapshot
heap + ArrayBuffers, not an editor tree or peak allocation.

Within this concept, bit-packed columns used **37.4% less Snappy disk**
and **86.4% less retained JS memory** than objects.
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

Earlier public column/binary prototypes in this branch predate the corrected separation. Their signed-count schemas are not the four-field column codecs measured here. This report supersedes the earlier mixed comparison tables; it does not silently change those public APIs.
