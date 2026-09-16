# Snapshot benchmarks: JSON, typed JS columns, and binary

Measured on 2026-09-15 with Node 22.22.2 on macOS arm64. Reproduce with `npm run benchmarks:storage` after `npm ci`. This measures identifier state only, excluding document text and application metadata.

## First: the same three runs in each format

The examples use two **8-character nanoids**. They describe the same state:

- `aB3dE5fG`, IDs 0–2: present.
- `hJ7kL9mN`, ID 0: present.
- `aB3dE5fG`, IDs 3–4: deleted, but still known.

### A. Current named objects

```js
const objects = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
```

One JS object per run. BSON repeats the property names in each run. In JS,
same-shaped objects can share the property-name metadata and hold their values
directly inside each object.

### B. Four-tuples

```js
const tuples = [
  ["aB3dE5fG", 0, 3, false],
  ["hJ7kL9mN", 0, 1, false],
  ["aB3dE5fG", 3, 2, true],
];
```

The fields are positional: `[bunchId, startCounter, count, isDeleted]`. BSON saves
space because numeric element names replace the longer property names. But every
run is now a separate **ordinary JS array**, not a packed four-field struct.
TypeScript's tuple type does not change this runtime representation.

### C. Dictionary + ordinary MongoDB arrays

```js
const columns = {
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"], // Each distinct ID appears once.
  bunchIndexes: [0, 1, 0], // Dictionary index for each run.
  startCounters: [0, 0, 3], // Starting counter for each run.
  signedCounts: [3, 1, -2], // Count; negative means deleted.
};
```

Read position 2 down the columns: `bunchIds[bunchIndexes[2]]` is `"aB3dE5fG"`,
`startCounters[2]` is 3, and `signedCounts[2]` is -2, meaning two deleted IDs.
There are a handful of arrays rather than one object/array for every run.

On the server, persist this object directly as a MongoDB subdocument:

```js
await collection.insertOne({ state: columns });
const document = await collection.findOne({ _id });
const snapshot = ColumnarIdList.load(document.state);
```

No `Binary`, custom encoder, or special MongoDB collection is involved. These are
ordinary BSON arrays. In this trace the Node BSON driver stores every numeric
column element as **BSON Int32**, not as an eight-byte double. The benchmark now
serializes actual documents, decodes them with numeric promotion disabled to
check the element types, and verifies lossless loading after the BSON round trip.

Explicitly requesting Int32 produces **identical bytes** for this trace:

```js
import { Int32, Double } from "mongodb";

const automatic = [0, 1, 0]; // Already BSON Int32 with the tested Node driver.
const explicit = [new Int32(0), new Int32(1), new Int32(0)];
const doubles = [new Double(0), new Double(1), new Double(0)];
```

The forced-Double benchmark is a storage sensitivity check, not the recommended
representation. It changes only the three numeric columns, not `version` or the
ID dictionary. All benchmark sizes include the same `{ state: ... } wrapper`.
Larger values outside Int32 range need a wider representation; the trace's
Int32 result is not a claim that all JavaScript integers fit in Int32.

### D. The hybrid: JSON in Mongo, typed columns in JS

Persist **the exact readable JSON above**. After loading it, replace the ordinary
numeric arrays with typed arrays. For this small example, the JS representation is
conceptually:

```js
{
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: new Uint8Array([0, 1, 0]),
  startCounters: new Uint8Array([0, 0, 3]),
  signedCounts: new Int8Array([3, 1, -2])
}
```

The numeric columns now need **9 backing bytes** in total, plus the string
dictionary and a few array/view objects. There is no binary header or custom ID
encoding. Counts use a signed array so negative values can represent deletion;
indexes and starting counters use unsigned arrays. Wider values select 16/32-bit
arrays automatically, then Float64 for safe integers outside those ranges. The
benchmark needs three 16-bit columns, or **70,542 numeric backing bytes**.

The implementation keeps those arrays private so callers cannot corrupt a
snapshot accidentally:

```ts
import { ColumnarIdList, IdList } from "articulated";

const snapshot = ColumnarIdList.load(columns);
snapshot.bunchIdAt(2); // "aB3dE5fG"
snapshot.startCounterAt(2); // 3
snapshot.countAt(2); // 2
snapshot.isDeletedAt(2); // true

const plainJSON = snapshot.toJSON(); // Descriptive keys and ordinary number arrays.
JSON.stringify(snapshot); // Uses toJSON(), never serializes typed arrays directly.

// Alternatively, use the editing-list conveniences:
const savedJSON = list.saveColumnar();
const editable = IdList.loadColumnar(savedJSON);
```

Store `snapshot.toJSON()` as an ordinary MongoDB subdocument. Release the parsed
JSON numeric arrays after conversion; retaining both forms gives up some memory
savings. Conversion temporarily holds both forms, so these retained-memory
figures do not describe peak loading memory. This hybrid has the **same BSON size**
as ordinary JSON columns; only the representation held by JS differs. Descriptive
keys occur once per snapshot and add just 47 BSON bytes compared with one-letter keys.

### E. Packed binary (earlier experimental comparison, not the simple-Mongo proposal)

The same idea is encoded into one byte buffer. Counts remain unsigned and deletion
uses a separate bit per run. The small example needs only one byte per number:

```text
ID dictionary:   ["aB3dE5fG", "hJ7kL9mN"]    encoded once in the buffer

Numeric column   Actual bytes (hex)
bunch indexes    00 01 00
start counters   00 00 03
counts           03 01 02
deletion flags   04                           binary 00000100: run 2 is deleted

Complete buffer:
[header][dictionary offsets][ID text][bunch indexes][starts][counts][deletion bits]
```

The complete three-run example is **60 bytes**: 20 header bytes, 12 dictionary
offset bytes, 18 tagged ID bytes, and 10 column/flag bytes. Larger values select
wider numeric columns automatically.

Mongo stores that buffer as `new Binary(bytes)`, rather than an array of numbers.
JS reads the numeric columns through a `DataView` over the buffer. No per-run
object is allocated unless explicitly requested:

```ts
import { PackedIdList } from "articulated";

const snapshot = PackedIdList.fromSaved(objects);
snapshot.bunchIdAt(2); // "aB3dE5fG"; ID text is decoded and cached on first access.
snapshot.startCounterAt(2); // 3
snapshot.countAt(2); // 2
snapshot.isDeletedAt(2); // true

snapshot.at(2); // Explicitly allocates one ordinary run object.
snapshot.toSaved(); // Explicitly expands all runs back into named objects.
```

The two binary rows below are the **same encoding**: one before IDs are accessed,
one after every run has been read and all decoded ID strings are cached. They have
identical Mongo storage but different retained JS memory.

### Other BSON types: what is and is not covered

- **Int32:** a standard scalar type, usable inside ordinary arrays. This is
  already what the ordinary-array benchmark stores for all three numeric columns.
- **Compressed BSON column (binary subtype 7):** a real standard subtype I omitted
  from the earlier comparison. It uses delta/delta-of-delta compression and run
  length encoding. MongoDB's server source has a C++ encoder/decoder, but the
  installed Node `bson@7.3.2` exposes only the subtype constant, not a column
  compression/decompression API. Labeling bytes with subtype 7 does not encode
  them. **Not benchmarked**: doing so would require an additional codec or a
  separate server-managed storage experiment, not merely inserting an array.
- **Vector (binary subtype 9):** standard packed Int8, Float32, or bit vectors;
  not a standard Uint16/Uint32 vector. Also not measured in this report.

References: [BSON specification](https://bsonspec.org/spec.html),
[Node Binary API](https://mongodb.github.io/node-mongodb-native/7.3/classes/BSON.Binary.html),
and [MongoDB BSONColumn implementation](https://github.com/mongodb/mongo/blob/master/src/mongo/bson/column/README.md).

## Then: benchmark results with 8-character nanoids

Same 259,778-edit trace, 11,757 saved runs and 5,382 distinct IDs. JS measurements below include both heap and ArrayBuffer backing storage, in decimal KB (1 KB = 1,000 bytes).

| Snapshot format                              | Logical BSON | Retained JS memory |
| -------------------------------------------- | -----------: | -----------------: |
| Current named objects                        |     870.7 KB |           759.0 KB |
| Four-tuples                                  |     529.7 KB |         1,041.1 KB |
| Dictionary + ordinary Mongo arrays           |     455.9 KB |           332.0 KB |
| **Ordinary Mongo arrays + typed JS columns** | **455.9 KB** |       **120.8 KB** |
| Packed binary, before accessing IDs          |     142.0 KB |           142.5 KB |
| Packed binary, after reading all runs/IDs    |     142.0 KB |           314.8 KB |

For clarity, the ordinary Mongo representation uses **455,902 bytes** whether
numeric values are passed as plain JS numbers or explicit BSON `Int32` objects.
Forcing all three numeric columns to BSON `Double` instead uses **596,986 bytes**.
The JS-memory rows above use JSON-parsed browser-facing values, not retained BSON
wrapper objects; adding Int32 wrappers in server code is not a JS-memory optimization.

The ordinary-array BSON size breaks down as follows:

| Component                                         |       Bytes |
| ------------------------------------------------- | ----------: |
| Three Int32 numeric payloads (3 × 11,757 × 4)     |     141,084 |
| Numeric element type tags and index-string keys   |     213,567 |
| ID dictionary, document fields, and array framing |     101,251 |
| **Total**                                         | **455,902** |

These overheads are why an ordinary BSON array is not a packed integer buffer,
even when every value is stored as Int32.

The hybrid reduces retained JS snapshot memory by **84.1%** and logical BSON by
**47.6%** compared with objects. It keeps readable JSON with descriptive names
and needs no custom binary envelope or ID codec. Compared with ordinary JSON
columns, converting only the JS numeric arrays to typed arrays reduces retained
memory by **63.6%**, with identical Mongo storage.

Full binary still gives the largest logical BSON reduction (**83.7%**), but the
hybrid uses less retained JS memory in this 8-character-ID benchmark, even with all
IDs already available as strings. Different layouts/string sharing and binary
string-cache costs matter; smaller persisted bytes do not guarantee smaller JS
memory. The full binary snapshot after reading all IDs saves **58.5%** versus objects.

### Why do four-tuples use more JS memory?

V8 can store named properties inline in an object while sharing their names via a
common object shape. Array elements live in separate backing storage, so an array
can have more allocation overhead than a small fixed-shape object. This follows
V8's distinction between [in-object properties and array elements](https://v8.dev/blog/fast-properties).

In this run, the difference is exactly `1,041,140 - 758,972 = 282,168` bytes, or
**24 extra bytes per tuple × 11,757 runs**. This is an observed result on this V8
version, not a universal JS size guarantee. It is why smaller JSON/BSON does not
automatically mean smaller JS objects. The packed format eliminates per-run
containers instead of replacing each object with an array.

### What happens when the snapshot is loaded into the editing tree?

| Loaded editing tree (snapshot discarded) | Retained JS memory |
| ---------------------------------------- | -----------------: |
| From named-object JSON                   |         2,190.5 KB |
| From columnar JSON                       |         2,190.8 KB |
| From binary                              |         2,313.3 KB |

The editing tree structure is unchanged. Columnar JSON loading is effectively
the same as existing JSON loading here; binary loading uses **5.6% more**.
Runtime ID-string sharing/interning can affect the measurements, especially for
short strings across 20 copies of the same snapshot. These are incremental per-copy
measurements, not the first-load cost of independent documents. Do not infer a
live-tree memory improvement from the snapshot results.

Logical BSON is not compressed WiredTiger disk usage or a MongoDB cache measurement. JS values are a Node/V8 proxy, not measured browser heaps. Encoding/loading allocation peaks are not measured. Raw sample ranges and methodology follow.

---

# Binary snapshot storage and JS memory benchmarks

Runtime: Node v22.22.2, V8 12.4.254.21-node.39, darwin/arm64.

Reproduce: `npm ci && npm run benchmarks:storage`. No compression or network metrics.

Each ID variant replays the same 259,778 edits: 182,315 inserted IDs, 104,852 live IDs. UUID/8-character nanoid values are deterministic SHA-256-derived fixtures, not calls to the ID libraries.

Memory: fresh child process per case, median of 5 samples of 20 retained copies after GC. Total = heapUsed + arrayBuffers, not external + arrayBuffers. Min/max show sample variation. Node/V8 proxy, not a browser measurement or peak allocation measurement.

BSON sizes are actual serialized byte lengths for `{state: value}`, checked against calculateObjectSize. Ordinary numeric arrays are verified to contain BSON Int32 elements for this trace; explicit Int32 encoding is byte-identical. Binary values are explicitly wrapped in Binary. These are logical document bytes, not measured WiredTiger disk or cache bytes.

## shared-prefix

11757 runs, 5382 distinct IDs; binary column widths (index/start/count): 2/2/2 bytes.

| Format                                               | BSON bytes |
| ---------------------------------------------------- | ---------: |
| Objects                                              |    1244366 |
| Four-tuples                                          |     903413 |
| Dictionary + ordinary Mongo arrays (automatic Int32) |     627016 |
| Dictionary + ordinary Mongo arrays (explicit Int32)  |     627016 |
| Dictionary + ordinary Mongo arrays (forced Double)   |     768100 |
| Packed binary v1                                     |     313133 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 272365 dictionary/document/array framing bytes = 627016 bytes.

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |    1410906 |            0 |     1410906 | 1395186–1411210 |
| tuples            |    1693074 |            0 |     1693074 | 1677354–1693378 |
| columns           |     626890 |            0 |      626890 |   611170–627194 |
| typed-columns     |     345142 |        70542 |      415684 |   392886–415696 |
| packed-cold       |        515 |       313116 |      313631 |   291008–313637 |
| packed-read       |     345063 |       313116 |      658173 |   642638–658276 |
| json-tree         |    2746637 |            0 |     2746637 | 2724071–2747472 |
| columnar-tree     |    2485500 |            0 |     2485500 | 2462909–2486249 |
| binary-tree       |    2485605 |            0 |     2485605 | 2462762–2486154 |

## uuid

11757 runs, 5382 distinct IDs; binary column widths (index/start/count): 2/2/2 bytes.

| Format                                               | BSON bytes |
| ---------------------------------------------------- | ---------: |
| Objects                                              |    1199878 |
| Four-tuples                                          |     858925 |
| Dictionary + ordinary Mongo arrays (automatic Int32) |     606598 |
| Dictionary + ordinary Mongo arrays (explicit Int32)  |     606598 |
| Dictionary + ordinary Mongo arrays (forced Double)   |     747682 |
| Packed binary v1                                     |     185075 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 251947 dictionary/document/array framing bytes = 606598 bytes.

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |    1410906 |            0 |     1410906 | 1401589–1410936 |
| tuples            |    1693074 |            0 |     1693074 | 1683757–1693104 |
| columns           |     626890 |            0 |      626890 |   617573–626920 |
| typed-columns     |     345142 |        70542 |      415684 |   398988–415696 |
| packed-cold       |        513 |       185058 |      185571 |   176265–185579 |
| packed-read       |     345076 |       185058 |      530134 |   520782–530219 |
| json-tree         |    2747106 |            0 |     2747106 | 2737262–2747399 |
| columnar-tree     |    2485696 |            0 |     2485696 | 2469298–2486072 |
| binary-tree       |    2484924 |            0 |     2484924 | 2470382–2486990 |

## nanoid

11757 runs, 5382 distinct IDs; binary column widths (index/start/count): 2/2/2 bytes.

| Format                                               | BSON bytes |
| ---------------------------------------------------- | ---------: |
| Objects                                              |     870682 |
| Four-tuples                                          |     529729 |
| Dictionary + ordinary Mongo arrays (automatic Int32) |     455902 |
| Dictionary + ordinary Mongo arrays (explicit Int32)  |     455902 |
| Dictionary + ordinary Mongo arrays (forced Double)   |     596986 |
| Packed binary v1                                     |     142019 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 101251 dictionary/document/array framing bytes = 455902 bytes.

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |     758972 |            0 |      758972 |   751808–759254 |
| tuples            |    1041140 |            0 |     1041140 | 1033976–1041444 |
| columns           |     331956 |            0 |      331956 |   324792–332260 |
| typed-columns     |      50209 |        70542 |      120751 |   106454–120763 |
| packed-cold       |        506 |       142002 |      142508 |   128424–142523 |
| packed-read       |     172837 |       142002 |      314838 |   307849–314934 |
| json-tree         |    2190532 |            0 |     2190532 | 2176412–2191393 |
| columnar-tree     |    2190764 |            0 |     2190764 | 2176207–2191903 |
| binary-tree       |    2313277 |            0 |     2313277 | 2300176–2313634 |

`typed-columns` retains a string dictionary and adaptive typed arrays after discarding parsed JSON numeric arrays. It uses the same persisted JSON/BSON as `columns`. `packed-cold` retains a validated owned buffer with no cached IDs. `packed-read` additionally caches every decoded ID after accessing every run. The tree rows retain only the loaded editing tree; their snapshot input is excluded.

The editing tree is not packed by this change. Differences between tree rows can include ID string sharing and allocation effects; they are not evidence of a different tree layout. Save/load allocation peaks, real browser heaps, Mongo compression, indexes, replicas and billing are not measured.

Exact binary, columnar JSON, and editing-tree round trips passed for all three trace variants.
