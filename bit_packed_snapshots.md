# Experimental bit-packed column snapshots

**Exploration only — not a production-ready format or an approved migration.**
This draft compares alternatives and makes the trade-offs concrete. The bit
widths, range limits, CPU cost, and production migration strategy remain open.

`BitPackedIdList` keeps the dictionary and three named columns, but packs each
column into bits instead of retaining whole numeric typed-array elements.
The same bytes are retained in JavaScript and stored as separate BSON Binary
fields in MongoDB. This is an optional experiment, not a replacement for the
existing `ColumnarIdList` or `IdList.saveBinary()` formats.

## Start with readable columns

```ts
import { BitPackedIdList, IdList } from "articulated";

const snapshot = BitPackedIdList.load({
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
});

snapshot.bunchIdAt(2); // "aB3dE5fG"
snapshot.startCounterAt(2); // 3
snapshot.countAt(2); // 2
snapshot.isDeletedAt(2); // true
```

These scalar accessors read directly from the packed bytes: they don't allocate
a run object or unpack a complete column. `snapshot.at(2)` optionally returns
`{ bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true }`.
Iteration and `toSaved()` are also available for compatibility with saved runs.

## What is actually stored

```ts
const saved = snapshot.toBinary();
// {
//   version: 2,
//   bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
//   bunchIndexes: Uint8Array([0, 32, 0, 0, 0]),
//   startCounters: Uint8Array([0, 0, 192, 0, 0]),
//   signedCounts: Uint8Array([6, 32, 0, 3, 0])
// }

const restored = BitPackedIdList.loadBinary(saved);
restored.startCounterAt(2); // 3: reads the packed bits, not an unpacked array
restored.toJSON(); // The original readable version-1 columns above.
```

Version **2** distinguishes this binary schema from the existing version-1
Uint32/Float64 Binary columns. There is no column-type metadata, run-count field,
offset table, or single combined binary container.

Each column stores values low-bit-first with these fixed widths:

- `bunchIndexes`: 13 bits per value.
- `startCounters`: 11 bits per value.
- `signedCounts`: 12 bits per value, using zigzag coding:
  `count < 0 ? -2 * count - 1 : 2 * count`.

Only the end of each column is padded to a byte boundary. Padding must be zero.
Because every width is greater than seven bits, padding cannot be mistaken for
another value: `floor(signedCounts.byteLength * 8 / 12)` gives the run count.
Numeric payload size is `ceil(runs * 13 / 8) + ceil(runs * 11 / 8) +
ceil(runs * 12 / 8)`, approaching 4.5 bytes/run.

## The whole conversion: numbers, packed bytes, then MongoDB

There are two different operations here. **Our code packs the numbers into
bytes. `new Binary(...)` does not pack or compress anything**: it tells the Mongo
driver to store the already-packed bytes as BSON Binary instead of an ordinary
numeric array. Mongo's Snappy/Zstd disk compression is a separate, later step.

```ts
import { BitPackedIdList } from "articulated";
import { Binary } from "mongodb";

// 1. Ordinary numeric columns.
const columns = {
  version: 1 as const,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
};

// 2. Our code packs the numbers into three byte arrays.
const packed = BitPackedIdList.load(columns).toBinary();
// bunchIndexes: Uint8Array([0, 32, 0, 0, 0])
// startCounters: Uint8Array([0, 0, 192, 0, 0])
// signedCounts: Uint8Array([6, 32, 0, 3, 0])

// 3. The driver stores each byte array as a separate binary field.
await collection.insertOne({
  state: {
    ...packed,
    bunchIndexes: new Binary(packed.bunchIndexes),
    startCounters: new Binary(packed.startCounters),
    signedCounts: new Binary(packed.signedCounts),
  },
});
```

For `bunchIndexes: [0, 1, 0]`, each entry gets 13 consecutive bits. The first
entry occupies bits 0–12, the second 13–25, and the third 26–38. Only bit 13 is
set, since the second entry is 1 and both others are 0. Bit 13 falls in byte 1,
at offset 5: that byte has value `2 ** 5 = 32`. Thus the byte array is
`[0, 32, 0, 0, 0]`. The other columns follow the same procedure with 11-bit starts
and 12-bit encoded counts. Counts `[3, 1, -2]` first become codes `[6, 2, 3]`.

Starting from an existing `IdList`, **`list.saveBitPacked()` performs steps 1–2
for you**. No Mongo stored function, custom server codec or special collection
type is needed. Mongo cannot directly query individual packed values; it can
still query the ordinary string dictionary.

## MongoDB save and load

Use the normal MongoDB driver's `Binary` wrapper for each column:

```ts
import { Binary } from "mongodb";

const { insertedId } = await collection.insertOne({
  state: {
    ...saved,
    bunchIndexes: new Binary(saved.bunchIndexes),
    startCounters: new Binary(saved.startCounters),
    signedCounts: new Binary(saved.signedCounts),
  },
});

// Read the same document; each field is a generic BSON Binary (subtype 0).
const document = await collection.findOne({ _id: insertedId });
if (!document) throw new Error("Snapshot not found");
const state = document.state;
const loaded = BitPackedIdList.loadBinary({
  ...state,
  bunchIndexes: state.bunchIndexes.value(),
  startCounters: state.startCounters.value(),
  signedCounts: state.signedCounts.value(),
});
```

The three-run example appears in Mongo as:

```js
{
  _id: ObjectId("..."), // Mongo-generated document ID, not a bunch ID.
  state: {
    version: 2,
    bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
    bunchIndexes: BinData(0, "ACAAAAA="),
    startCounters: BinData(0, "AADAAAA="),
    signedCounts: BinData(0, "BiAAAwA=")
  }
}
```

The Base64 strings are only a textual display of BSON Binary bytes; we do not
store Base64 strings. Each numeric field in this example holds five raw bytes.

`loadBinary()` also accepts Node Buffer slices, including nonzero byte offsets.
All input and exported arrays are copied, so later mutations cannot change a
loaded snapshot. Release the original document/bytes after loading to avoid
retaining both copies. The library adds no MongoDB runtime dependency.

`toJSON()` and `JSON.stringify(snapshot)` deliberately **unpack** to ordinary
version-1 numeric arrays for readability. Use `toBinary()` plus BSON Binary
wrappers for packed persistence; JSON-stringifying byte arrays is not equivalent.

## Saving and continuing to edit an IdList

```ts
const packed = list.saveBitPacked();
const retainedSnapshot = BitPackedIdList.loadBinary(packed);

// Only when editing is needed:
const editable = IdList.loadBitPacked(packed);
```

`saveBitPacked()` currently materializes ordinary saved runs before packing.
`loadBitPacked()` iterates decoded runs into the existing editing tree. The tree
is unchanged: this improves retained snapshot memory, not live editing memory.
Saving/loading peak allocations and accessor throughput have not been benchmarked.

## Explicit limits and validation

This experiment uses the widths from the measured proposal:

- At most **8,192 dictionary entries**; indexes 0 through 8,191.
- Starting counters **0 through 2,047**.
- Signed counts **-2,048 through +2,047**, excluding zero. Deleted runs can have
  length 2,048; present runs can have length 2,047.

These widths limit starting counters, not the final counter reached by a run.
IDs remain ordinary strings; eight-character NanoIDs are the benchmark fixture,
not a required ID format.

Packing throws on overflow. It does not truncate, split runs, silently widen, or
automatically fall back to another version. Use the existing `saveBinary()` /
`ColumnarIdList` path when full safe-integer counters or larger dictionaries are
required. A production rollout needs a decision about these limits first.

Loading checks the version, dictionary strings, byte-array types, canonical
lengths, zero end padding, valid dictionary references and nonzero counts. This
is structural validation, not a checksum: corruption that produces another
valid sequence is not detectable from the format alone.

Fixed-width bit packing is not always smaller: in the tiny example above the
numeric payload is 15 bytes, while adaptive typed columns need only 9. The real
trace has wider values and does benefit.

## Signed-count objects: the independent alternative

The author's simpler proposal keeps the current run objects and replaces
`isDeleted` with the sign of `count`:

```js
// Current
({ bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true });
// Signed-count alternative
({ bunchId: "aB3dE5fG", startCounter: 3, count: -2 });
```

This is explored independently in [draft PR #26](https://github.com/mweidner037/articulated/pull/26), with no columnar dependency.
[Read its complete implementation and analysis](https://github.com/scottmessinger/articulated/blob/codex/signed-count-snapshots/signed_count_snapshots.md).
This PR adds it only as a benchmark comparison; it does not add that format's
save/load API. It reduced Snappy collection disk by **8.3%** and retained JS
snapshot memory by **12.4%** versus current objects, with no allocated-file
saving under Zstd on this fixture. Logical BSON fell from 870,682 to 729,598
bytes, saving exactly 12 bytes per run. It does not reduce live editing-tree memory.

## Measurements

Same 259,778-edit trace: 11,757 runs and 5,382 eight-character IDs. KB is decimal.
Both Mongo storage and total retained JS memory include all IDs/dictionaries.

| Mongo representation        | Retained JS representation    | Mongo Snappy KB | Mongo Zstd KB | Retained JS KB |
| --------------------------- | ----------------------------- | --------------: | ------------: | -------------: |
| Current objects             | Objects                       |           196.8 |         110.9 |          759.0 |
| **Signed-count objects**    | **Objects without isDeleted** |       **180.4** |     **110.9** |      **664.9** |
| Four-tuples †               | Ordinary arrays               |           186.2 |         107.6 |        1,041.2 |
| Columnar / BSON arrays †    | Ordinary arrays               |           268.9 |         147.6 |          332.0 |
| Columnar / BSON arrays †    | Adaptive typed columns        |           268.9 |         147.6 |          120.8 |
| Columnar / Binary arrays    | Adaptive typed columns        |           151.8 |          98.6 |          120.8 |
| Flat triples / BSON array † | Ordinary array                |           277.2 |         172.2 |          331.9 |
| Flat triples / BSON array † | Typed flat array              |           277.2 |         172.2 |          120.4 |
| Flat triples / Binary †     | Typed flat array              |           156.2 |          98.5 |          120.4 |
| Packed eight-byte numbers † | Float64 array + accessor      |           147.6 |          90.3 |          143.9 |
| Packed five-byte records †  | Bytes + accessor              |           131.2 |          96.3 |          108.6 |
| Bit-packed columns          | Three byte arrays + accessors |           123.2 |          94.4 |          103.2 |

The flat and per-run packed rows are comparison experiments, not additional
public implementations in this PR. Bit-packed column JS memory is from the new
repository implementation; its earlier standalone prototype measured 103.1 KB.
Other comparison figures come from the earlier experiment or the rerun of the
repository benchmark, with the same trace and memory method.

Current objects, signed-count objects, Binary columns, and bit-packed columns
were remeasured together on September 18, 2026 using local MongoDB 8.3.3.
These fresh rows use the actual version-2 bit-packed implementation.
Rows marked † retain the earlier Mongo experiment's numbers; they were not
remeasured for this addition. Small differences from the prior table reflect
allocation/checkpoint granularity, not a different workload.

The fresh run used 12 collections: four layouts times three compressors
(none, Snappy, Zstd), 100 documents per collection, each with a distinct ID
dictionary and the same numeric trace. Every collection was compacted with
`freeSpaceTargetMB: 1`; all returned `ok: 1, bytesFreed: 0`. After a locked
flush, collection `storageSize` matched the actual allocated `.wt` files.
Freshly inserted data had no deletion fragmentation; compaction does not imply
an absolute minimum file size or change the compressor. Integer document IDs
are included; indexes, journals, replication and shared overhead are excluded.
These are not Atlas measurements or production-wide savings estimates.
The isolated local Mongo server was stopped after measurement.

The comparison JS rerun measured 758,984 bytes for current objects, 664,928
for signed-count objects, 120,783 for typed columns, and 103,200 for bit-packed
columns. The independent signed-count PR also measures 664.9 KB and confirms
the loaded editing tree is unchanged. Node/V8 proxy, not a browser measurement.

Fresh evidence:
[Mongo raw results](benchmarks/results/signed-counts-mongo.json),
[cross-proposal JS/BSON rerun](benchmarks/results/cross-proposal-js.md), and
[standalone signed-count implementation run](benchmarks/results/signed-counts-memory.md).
The new `benchmarks/mongo-signed-counts.mongosh` reproduces the four-format
comparison from this branch against an isolated local Mongo server.
The signed-count PR has its own standalone script and benchmark.

The original implementation run used Node 22.22.2 / V8 12.4.254.21-node.39,
macOS arm64. The eight-character-ID case measured **154,159 logical BSON bytes**
and **103,158 retained JS bytes** (50,250 heap + 52,908 numeric buffers; total
sample range 103,128–103,817). The existing Binary columns measured 120,783 JS
bytes in the same run. Full trace BSON and editing-tree round trips passed for
all three ID styles. The repository benchmark reproduces these checks:

```sh
npm run benchmarks:storage
```

JS uses Node/V8 as a browser proxy: fresh child process per representation,
median of five samples holding twenty snapshots after GC, counting
`heapUsed + arrayBuffers`. Source fixtures are excluded; dictionary arrays are
owned, but parsed short strings can be shared across copies. This is retained
memory, not peak allocation or an actual browser heap measurement.

The [raw Mongo and prototype memory measurements](./benchmarks/results/packed-options-experiment.json)
include all post-compaction file sizes and per-sample JS memory values. The
[implementation benchmark output](./benchmarks/results/bit-packed-implementation.md)
records the new version-2 implementation, not the earlier standalone prototype.

## Implementation and tests

- [Bit packing, byte validation and snapshot accessors](./src/bit_packed_id_list.ts)
- [IdList save/load integration](./src/id_list.ts)
- [Golden bytes, BSON, boundary, ownership and editing tests](./test/bit_packed_id_list.test.ts)
- [Reproducible BSON and JS benchmarks](./benchmarks/storage.ts)
