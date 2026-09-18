# Dictionary with independent binary arrays

Keep a normal MongoDB document and a normal string dictionary. Only the three
numeric arrays become generic BSON Binary fields (subtype 0). There is no combined
snapshot blob, embedded header, offset table, encoded dictionary, deletion bitset,
or per-document column-type metadata. The earlier `PackedIdList` experiment has
been removed from this PR.

## Concrete example

These three runs describe IDs 0–2 in `aB3dE5fG` and ID 0 in `hJ7kL9mN` as present,
and IDs 3–4 in `aB3dE5fG` as deleted but still known:

```js
const columns = {
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
};
```

The MongoDB shape is still a document with those same fields:

```js
{
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: Binary(/* bytes of Uint32Array([0, 1, 0]) */),
  startCounters: Binary(/* bytes of Float64Array([0, 0, 3]) */),
  signedCounts: Binary(/* bytes of Float64Array([3, 1, -2]) */)
}
```

The comments explain the bytes; the numeric type names are **not stored** in the
document. BSON Binary stores bytes, not a self-describing JS typed array, so the
schema fixes their interpretation:

| Field           | Storage interpretation | Stored bytes per run |
| --------------- | ---------------------- | -------------------: |
| `bunchIndexes`  | Uint32Array            |                    4 |
| `startCounters` | Float64Array           |                    8 |
| `signedCounts`  | Float64Array           |                    8 |

All multi-byte values are little-endian. Float64 is deliberate: it represents
every existing safe-integer counter exactly, unlike Float32 or 32-bit integer
counters. The loader rejects fractions, NaN, infinities, unsafe integers, negative
starts, zero counts, invalid indexes, and ranges whose last counter is unsafe.
Fixed widths cost **20 numeric bytes per run** (60 for the small example), excluding
the dictionary and BSON field overhead. This avoids storing width/type metadata;
it is not a claim to have the smallest possible numerical encoding.

**Storage and retained JS memory are optimized independently.** `loadBinary()`
decodes these fields, validates the values, then converts each column to its
narrowest safe typed array. For the small example, JS retains Uint8 indexes,
Uint8 starts and Int8 counts: **nine numeric bytes**, not 60. The full benchmark
retains three 16-bit arrays. Wider temporary decoding arrays are discarded;
conversion peaks are not included in the retained-memory benchmark.

## Save and load with MongoDB

```ts
import { ColumnarIdList, IdList } from "articulated";
import { Binary } from "mongodb";

const snapshot = ColumnarIdList.load(columns);
const saved = snapshot.toBinary();
// Or: const saved = list.saveBinary();

await collection.insertOne({
  state: {
    ...saved,
    bunchIndexes: new Binary(saved.bunchIndexes),
    startCounters: new Binary(saved.startCounters),
    signedCounts: new Binary(saved.signedCounts),
  },
});

const document = await collection.findOne({ _id });
if (!document) throw new Error("Snapshot not found");
const input = {
  ...document.state,
  bunchIndexes: document.state.bunchIndexes.value(),
  startCounters: document.state.startCounters.value(),
  signedCounts: document.state.signedCounts.value(),
};
const restored = ColumnarIdList.loadBinary(input);
restored.bunchIdAt(2); // "aB3dE5fG"
restored.startCounterAt(2); // 3
restored.countAt(2); // 2
restored.isDeletedAt(2); // true

const editable = IdList.loadBinary(input);
```

Use `Binary` from your MongoDB driver. The library itself has no BSON runtime
dependency: `SavedBinaryColumnarIdList` exposes plain strings and three Uint8Array
byte buffers. Wrap/unwrap each field at the persistence boundary. Do not store
`JSON.stringify(buffer)` or a plain numeric array in place of BSON Binary.

Mongo can query the dictionary and other document fields normally. The individual
numbers inside each Binary field are not ordinary Mongo array elements; normal
array indexing, matching and positional updates do not apply to them.

## Ownership and validation

`loadBinary()` copies each input into an aligned buffer, validates all runs, and
compacts the columns into owned adaptive typed arrays. Node Buffer slices and
unaligned offsets are supported. `toBinary()`
copies all outputs. Mutating inputs or outputs cannot mutate the snapshot. Release
source buffers after loading to avoid retaining duplicates. The loader supports
big-endian hosts by converting each numeric array; byte order never depends on
the machine that wrote it.

IDs remain strings, including eight-character NanoIDs. There is no UUID-specific
optimization. In-memory APIs preserve arbitrary JS strings; MongoDB's normal
UTF-8 string limitations still apply (notably lone UTF-16 surrogates).

Zero-count runs are skipped by `fromSaved()`, consistent with `IdList.load()`.
All three columns must have equal element counts and valid byte lengths. Empty
snapshots use three empty binaries.

## Ordinary Mongo arrays remain an alternative

`snapshot.toJSON()` returns ordinary number arrays; storing that object directly
uses ordinary BSON arrays. `ColumnarIdList.load(json)` can convert them to adaptive
typed arrays in JS (8/16/32-bit, or Float64 for wider safe integers). This JSON
route chooses widths only in memory, so it also needs no persisted type metadata.
Both loading routes produce the same compact JS representation; the binary route
also saves BSON array-element overhead. `IdList.saveColumnar()` / `loadColumnar()`
integrate it with the existing editing tree.

## Benchmarks and scope

Read the [single-file examples and measured tables](./benchmark_storage_results.md).
Storage is actual serialized BSON length, not compressed WiredTiger disk usage.
JS memory includes heap plus ArrayBuffers after GC; it is a Node/V8 proxy, not a
browser heap or peak allocation measurement. Gzip/wire costs are excluded.

All snapshot loaders reconstruct the existing persistent editing tree. That tree
has not been optimized here. Save/load transient allocations are also outside
the retained-memory measurement. The earlier whole-snapshot binary format was
experimental and is no longer supported by this PR; existing published JSON
`save()` / `load()` behavior remains available.

See the [BSON specification](https://bsonspec.org/spec.html) for the distinction
between generic Binary (subtype 0), compressed columns (7), and vectors (9). This
implementation uses **generic Binary**, not compressed columns or vectors.
