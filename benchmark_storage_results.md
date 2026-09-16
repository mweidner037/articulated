# Snapshot benchmarks: dictionary + separate BSON Binary arrays

The proposal keeps a normal string dictionary and stores each numeric array in
its own BSON Binary field. **No whole-snapshot blob and no column-type metadata.**
The earlier packed-container implementation and its tests have been removed;
these are fresh measurements of the replacement, not the old packed results.

Measured with Node 22.22.2 / V8 on macOS arm64. Run `npm ci` and
`npm run benchmarks:storage` to reproduce. This measures identifier state only,
not document text, metadata, network transfer or gzip.

## First: examples of exactly what is being compared

All examples describe the same three runs, using two eight-character NanoIDs:
IDs 0–2 of `aB3dE5fG` and ID 0 of `hJ7kL9mN` are present; IDs 3–4 of
`aB3dE5fG` are deleted but still known.

### A. Current named objects

```js
const objects = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
```

One JS object per run; BSON repeats the field names and ID strings.

### B. Four-tuples

```js
const tuples = [
  ["aB3dE5fG", 0, 3, false],
  ["hJ7kL9mN", 0, 1, false],
  ["aB3dE5fG", 3, 2, true],
];
```

Still one JS array per run. TypeScript's tuple type does not make it a packed struct.

### C. Dictionary + ordinary Mongo arrays

```js
const columns = {
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2], // Negative means deleted.
};
await collection.insertOne({ state: columns });
```

The dictionary stores each distinct ID once. Position 2 means dictionary entry
0, starting counter 3, and two deleted IDs. All numeric elements in this trace
are stored automatically as BSON Int32 by the tested Node driver. The benchmark
verifies the decoded BSON types; explicit `new Int32(value)` gives identical bytes.
Forcing the numeric columns to `new Double(value)` is also measured as a sensitivity
check, not as the recommended representation.

### D. Same ordinary Mongo arrays; adaptive typed arrays in JS

```js
const snapshot = ColumnarIdList.load(columns);
// Conceptual private JS arrays for this tiny example:
// bunchIndexes: Uint8Array([0, 1, 0])
// startCounters: Uint8Array([0, 0, 3])
// signedCounts:  Int8Array([3, 1, -2])
```

Mongo still stores example C. Only the browser-facing representation changes.
Each in-memory column selects an 8/16/32-bit integer array, or Float64 for larger
safe integers. No type metadata is persisted. This tiny example needs nine numeric
backing bytes; the full benchmark chooses three 16-bit arrays (70,542 bytes).
Discard the parsed number arrays after conversion. `snapshot.toJSON()` returns
ordinary copied arrays for persistence.

### E. The requested layout: one Binary per numeric array

```js
import { ColumnarIdList, IdList } from "articulated";
import { Binary } from "mongodb";

const saved = ColumnarIdList.load(columns).toBinary();
await collection.insertOne({
  state: {
    version: 1,
    bunchIds: saved.bunchIds, // Still ["aB3dE5fG", "hJ7kL9mN"].
    bunchIndexes: new Binary(saved.bunchIndexes),
    startCounters: new Binary(saved.startCounters),
    signedCounts: new Binary(saved.signedCounts),
  },
});
```

Each field contains **only the numeric bytes of that array**. No `columnTypes`
field, binary header, dictionary offset table, string codec or deletion bitset.
After decoding, `loadBinary()` compacts those values. The retained JS representation
for this example is:

```js
{
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: new Uint8Array([0, 1, 0]),
  startCounters: new Uint8Array([0, 0, 3]),
  signedCounts: new Int8Array([3, 1, -2])
}
```

The storage schema fixes Uint32 indexes, Float64 starts/counts and little-endian
byte order. Float64 storage is intentional:
it exactly preserves the library's safe-integer counters, including values beyond
32 bits. It is **not Float32**. Without per-document type metadata, the fixed
numeric cost is 4 + 8 + 8 = **20 bytes per run**. The small example has 60 numeric
stored bytes, excluding its dictionary and document framing. JS retains only
**nine numeric bytes** after compaction. These choices are complementary, not
alternatives: BSON Binary reduces storage overhead, and adaptive typed arrays
reduce retained JS memory. Wider decoding arrays are temporary and discarded.

Read each Binary's bytes and pass the document to the snapshot or editing-tree API:

```js
const document = await collection.findOne({ _id });
if (!document) throw new Error("Snapshot not found");
const input = {
  ...document.state,
  bunchIndexes: document.state.bunchIndexes.value(),
  startCounters: document.state.startCounters.value(),
  signedCounts: document.state.signedCounts.value(),
};
const snapshot = ColumnarIdList.loadBinary(input);
snapshot.bunchIdAt(2); // "aB3dE5fG"
snapshot.countAt(2); // 2
snapshot.isDeletedAt(2); // true
const editable = IdList.loadBinary(input);
// IdList.saveBinary() produces the same saved dictionary/buffer document.
```

The library returns Uint8Array byte buffers and does not depend on MongoDB at
runtime. BSON wrapping happens at the persistence boundary. `loadBinary()` owns
copies of its inputs; `toBinary()` copies outputs. Release source buffers after
loading to avoid duplicates. Counts, lengths and indexes are validated before use.

## Then: results for eight-character NanoIDs

Same 259,778 edits, 11,757 runs and 5,382 distinct IDs. BSON uses the same
`{ state: ... }` document wrapper throughout. JS memory includes heap + ArrayBuffers;
KB is decimal (1,000 bytes).

| Stored representation / retained JS representation       | Logical BSON bytes | Retained JS KB |
| -------------------------------------------------------- | -----------------: | -------------: |
| Current objects / objects                                |            870,682 |          759.0 |
| Four-tuples / ordinary arrays                            |            529,729 |        1,041.2 |
| Ordinary Mongo columns / ordinary JS arrays              |            455,902 |          332.0 |
| Ordinary Mongo columns / adaptive typed JS arrays        |            455,902 |          120.8 |
| **Three BSON Binary columns / adaptive typed JS arrays** |        **336,391** |      **120.8** |

The separate-binary layout saves **61.4% logical BSON** and **84.1% retained JS
snapshot memory** versus current objects. It uses **26.2% less BSON** than ordinary
Mongo columns. Both JSON and binary loading now retain adaptive typed arrays:
only six numeric bytes per run in this trace, regardless of the stored 20-byte
binary row. Storage and JS savings are combined; the wider decode arrays are
temporary. Conversion peaks are not measured.

### Where the BSON bytes go

| Component                                            | Ordinary Int32 arrays | Separate Binary arrays |
| ---------------------------------------------------- | --------------------: | ---------------------: |
| Numeric payload                                      |               141,084 |                235,140 |
| Numeric element type tags and index-string keys      |               213,567 |                      0 |
| Dictionary, document fields and array/binary framing |               101,251 |                101,251 |
| **Total bytes**                                      |           **455,902** |            **336,391** |

Binary saves the per-number BSON array overhead even though starts and counts
use wider values. Explicit Int32 arrays give the same 455,902 bytes as automatic
encoding. Forced Double numeric arrays use 596,986 bytes. The Binary row includes
all BSON framing and dictionary costs, not merely raw numeric payloads.

### Why four-tuples use more JS memory

V8 can keep same-shaped objects' values inline and share property metadata.
Ordinary arrays have separate elements storage. Here the difference is
1,041,152 − 758,984 = 282,168 bytes, exactly 24 extra bytes per run. This is a
measurement on this V8 version, not a universal JS guarantee. See
[V8's explanation of in-object properties and array elements](https://v8.dev/blog/fast-properties).

### Loaded editing trees: no memory saving claimed

| Input; snapshot discarded | Retained JS KB |
| ------------------------- | -------------: |
| Named-object JSON         |        2,190.9 |
| Ordinary column JSON      |        2,190.9 |
| Separate binary columns   |        2,190.5 |

The editing-tree structure is unchanged, and all three input paths are effectively
equal here. Small differences fall within sample variation. These results do not
support a claim of less memory while editing; snapshot and loaded-tree memory
are measured separately.

## Scope, method, and validation

- Storage is actual `bson@7.3.2` serialized document length, cross-checked with
  `calculateObjectSize`. BSON round trips and reconstructed runs are checked.
- No Mongo server was populated: these are logical BSON bytes, **not measured
  WiredTiger disk usage, cache size, replication cost or billing**.
- Memory is fresh-process Node/V8, median of five samples of 20 retained copies
  after GC. `heapUsed + arrayBuffers` avoids double-counting external memory.
- Sources are excluded and kept alive across both measurements; JSON and binary
  cases parse dictionaries equivalently. Short strings may be shared between
  copies. This is incremental per-copy memory, not independent-document first-load
  memory. Min/max sample ranges are recorded below.
- Real browser heaps, transient encoding/loading peaks and speed are not measured.
- Eight-character NanoIDs and independent UUIDs are deterministic hash-derived
  fixtures. No ID generator speed or uniqueness claim is made.
- Fixed binary columns preserve safe-integer counters; three fields use generic
  Binary subtype 0, not compressed-column subtype 7 or vector subtype 9.
- Tests cover BSON subtype/bytes, little-endian fixtures, unaligned Buffer slices,
  input/output ownership, invalid lengths/indexes/numbers, wide counters, empty
  snapshots, tombstones, cursor behavior and continued immutable editing.

See [the Mongo mapping and API details](./binary_snapshots.md) and the
[BSON specification](https://bsonspec.org/spec.html). Existing published JSON
`save()` / `load()` remain unchanged. The earlier custom packed snapshot is not
part of this implementation.

## Raw output from this run

# Dictionary and per-array BSON Binary benchmarks

Runtime: Node v22.22.2, V8 12.4.254.21-node.39, darwin/arm64.

Reproduce: `npm ci && npm run benchmarks:storage`. No compression or network metrics.

Each ID variant replays the same 259,778 edits: 182,315 inserted IDs, 104,852 live IDs. UUID/8-character nanoid values are deterministic SHA-256-derived fixtures, not calls to the ID libraries.

Memory: fresh child process per case, median of 5 samples of 20 retained copies after GC. Total = heapUsed + arrayBuffers, not external + arrayBuffers. Min/max show sample variation. Node/V8 proxy, not a browser measurement or peak allocation measurement.

BSON sizes are actual serialized byte lengths for `{state: value}`, checked against calculateObjectSize. Ordinary numeric arrays are verified to contain BSON Int32 elements for this trace; explicit Int32 encoding is byte-identical. Binary values are explicitly wrapped in Binary. These are logical document bytes, not measured WiredTiger disk or cache bytes.

## shared-prefix

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format                                               | BSON bytes |
| ---------------------------------------------------- | ---------: |
| Objects                                              |    1244366 |
| Four-tuples                                          |     903413 |
| Dictionary + ordinary Mongo arrays (automatic Int32) |     627016 |
| Dictionary + ordinary Mongo arrays (explicit Int32)  |     627016 |
| Dictionary + ordinary Mongo arrays (forced Double)   |     768100 |
| Dictionary + three BSON Binary arrays                |     507505 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 272365 dictionary/document/array framing bytes = 627016 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 272365 dictionary/document/binary framing bytes = 507505 bytes.

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |    1410918 |            0 |     1410918 | 1410906–1410942 |
| tuples            |    1693086 |            0 |     1693086 | 1693074–1693110 |
| columns           |     626890 |            0 |      626890 |   626890–626947 |
| typed-columns     |     345142 |        70542 |      415684 |   408438–416027 |
| binary-columns    |     345142 |        70542 |      415684 |   408742–415696 |
| json-tree         |    2747096 |            0 |     2747096 | 2739794–2747202 |
| columnar-tree     |    2485834 |            0 |     2485834 | 2478592–2486125 |
| binary-tree       |    2485430 |            0 |     2485430 | 2478680–2486086 |

## uuid

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format                                               | BSON bytes |
| ---------------------------------------------------- | ---------: |
| Objects                                              |    1199878 |
| Four-tuples                                          |     858925 |
| Dictionary + ordinary Mongo arrays (automatic Int32) |     606598 |
| Dictionary + ordinary Mongo arrays (explicit Int32)  |     606598 |
| Dictionary + ordinary Mongo arrays (forced Double)   |     747682 |
| Dictionary + three BSON Binary arrays                |     487087 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 251947 dictionary/document/array framing bytes = 606598 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 251947 dictionary/document/binary framing bytes = 487087 bytes.

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |    1410918 |            0 |     1410918 | 1410906–1410942 |
| tuples            |    1693086 |            0 |     1693086 | 1693074–1693110 |
| columns           |     626890 |            0 |      626890 |   626890–626947 |
| typed-columns     |     345142 |        70542 |      415684 |   415684–416027 |
| binary-columns    |     345142 |        70542 |      415684 |   415684–416456 |
| json-tree         |    2746445 |            0 |     2746445 | 2739775–2747356 |
| columnar-tree     |    2485366 |            0 |     2485366 | 2478472–2486246 |
| binary-tree       |    2485728 |            0 |     2485728 | 2478679–2486067 |

## nanoid

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format                                               | BSON bytes |
| ---------------------------------------------------- | ---------: |
| Objects                                              |     870682 |
| Four-tuples                                          |     529729 |
| Dictionary + ordinary Mongo arrays (automatic Int32) |     455902 |
| Dictionary + ordinary Mongo arrays (explicit Int32)  |     455902 |
| Dictionary + ordinary Mongo arrays (forced Double)   |     596986 |
| Dictionary + three BSON Binary arrays                |     336391 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 101251 dictionary/document/array framing bytes = 455902 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 101251 dictionary/document/binary framing bytes = 336391 bytes.

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |     758984 |            0 |      758984 |   758972–759008 |
| tuples            |    1041152 |            0 |     1041152 | 1041140–1041176 |
| columns           |     331956 |            0 |      331956 |   331956–332013 |
| typed-columns     |      50209 |        70542 |      120751 |   120751–121094 |
| binary-columns    |      50209 |        70542 |      120751 |   120751–121499 |
| json-tree         |    2190908 |            0 |     2190908 | 2184619–2191186 |
| columnar-tree     |    2190908 |            0 |     2190908 | 2183549–2191112 |
| binary-tree       |    2190544 |            0 |     2190544 | 2184976–2191176 |

`typed-columns` and `binary-columns` retain the same adaptive typed JS arrays. The first loads ordinary JSON columns; the second decodes the three separate fixed-schema BSON binary fields, compacts them, and discards the wider temporary arrays. Both parse the dictionary from JSON for comparable string allocation. Storage widths do not dictate retained JS widths. The tree rows retain only the loaded editing tree; snapshot inputs are excluded.

The editing tree is not packed by this change. Differences between tree rows can include ID string sharing and allocation effects; they are not evidence of a different tree layout. Save/load allocation peaks, real browser heaps, Mongo compression, indexes, replicas and billing are not measured.

Exact binary, columnar JSON, and editing-tree round trips passed for all three trace variants.
