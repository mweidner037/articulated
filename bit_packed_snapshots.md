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

## Current representation comparison

The earlier mixed-format tables have been superseded by
[the four-field-only comparison](format_comparison.md).
That report contains examples for objects, tuples, ordinary/typed/Binary columns,
flat runs and packed encodings, with fresh Mongo and JS measurements.
This file documents the earlier public bit-packed API; that API uses signed counts
and is not the separate-deletion-column codec in the current four-field table.

## Implementation and tests

- [Bit packing, byte validation and snapshot accessors](./src/bit_packed_id_list.ts)
- [IdList save/load integration](./src/id_list.ts)
- [Golden bytes, BSON, boundary, ownership and editing tests](./test/bit_packed_id_list.test.ts)
- [Reproducible BSON and JS benchmarks](./benchmarks/storage.ts)
