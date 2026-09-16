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

### C. Dictionary + ordinary JS columns

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

### E. Packed binary (also implemented in this PR)

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

## Then: benchmark results with 8-character nanoids

Same 259,778-edit trace, 11,757 saved runs and 5,382 distinct IDs. JS measurements below include both heap and ArrayBuffer backing storage, in decimal KB (1 KB = 1,000 bytes).

| Snapshot format                           | Logical BSON | Retained JS memory |
| ----------------------------------------- | -----------: | -----------------: |
| Current named objects                     |     870.7 KB |           759.0 KB |
| Four-tuples                               |     529.7 KB |         1,041.1 KB |
| Dictionary + ordinary JS columns          |     455.9 KB |           332.0 KB |
| **JSON + typed JS columns (hybrid)**      | **455.9 KB** |       **120.8 KB** |
| Packed binary, before accessing IDs       |     142.0 KB |           142.5 KB |
| Packed binary, after reading all runs/IDs |     142.0 KB |           314.9 KB |

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
| From named-object JSON                   |         2,190.9 KB |
| From columnar JSON                       |         2,190.4 KB |
| From binary                              |         2,313.4 KB |

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

BSON sizes use the official serializer for `{state: value}`, with binary values explicitly wrapped in `Binary`. They are logical document bytes, not measured WiredTiger disk or cache bytes.

## shared-prefix

11757 runs, 5382 distinct IDs; binary column widths (index/start/count): 2/2/2 bytes.

| Format                    | BSON bytes |
| ------------------------- | ---------: |
| Objects                   |    1244366 |
| Four-tuples               |     903413 |
| Dictionary + JSON columns |     627016 |
| Packed binary v1          |     313133 |

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |    1410906 |            0 |     1410906 | 1395186–1411188 |
| tuples            |    1693074 |            0 |     1693074 | 1677354–1693378 |
| columns           |     626890 |            0 |      626890 |   611170–627194 |
| typed-columns     |     345142 |        70542 |      415684 |   392886–415696 |
| packed-cold       |        516 |       313116 |      313632 |   291008–313664 |
| packed-read       |     345076 |       313116 |      658192 |   642639–658290 |
| json-tree         |    2746842 |            0 |     2746842 | 2724119–2747466 |
| columnar-tree     |    2485352 |            0 |     2485352 | 2462909–2486356 |
| binary-tree       |    2485464 |            0 |     2485464 | 2462700–2486305 |

## uuid

11757 runs, 5382 distinct IDs; binary column widths (index/start/count): 2/2/2 bytes.

| Format                    | BSON bytes |
| ------------------------- | ---------: |
| Objects                   |    1199878 |
| Four-tuples               |     858925 |
| Dictionary + JSON columns |     606598 |
| Packed binary v1          |     185075 |

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |    1410906 |            0 |     1410906 | 1401589–1410936 |
| tuples            |    1693074 |            0 |     1693074 | 1683757–1693104 |
| columns           |     626890 |            0 |      626890 |   617573–626920 |
| typed-columns     |     345142 |        70542 |      415684 |   398988–415696 |
| packed-cold       |        512 |       185058 |      185570 |   176265–185579 |
| packed-read       |     345105 |       185058 |      530163 |   520782–530216 |
| json-tree         |    2746730 |            0 |     2746730 | 2731580–2747264 |
| columnar-tree     |    2485357 |            0 |     2485357 | 2470236–2486451 |
| binary-tree       |    2485402 |            0 |     2485402 | 2470351–2486505 |

## nanoid

11757 runs, 5382 distinct IDs; binary column widths (index/start/count): 2/2/2 bytes.

| Format                    | BSON bytes |
| ------------------------- | ---------: |
| Objects                   |     870682 |
| Four-tuples               |     529729 |
| Dictionary + JSON columns |     455902 |
| Packed binary v1          |     142019 |

| JS representation | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| ----------------- | ---------: | -----------: | ----------: | --------------: |
| objects           |     758972 |            0 |      758972 |   751808–759276 |
| tuples            |    1041140 |            0 |     1041140 | 1033976–1041444 |
| columns           |     331956 |            0 |      331956 |   324792–332238 |
| typed-columns     |      50209 |        70542 |      120751 |   106497–120763 |
| packed-cold       |        522 |       142002 |      142524 |   128424–142547 |
| packed-read       |     172923 |       142002 |      314880 |   307848–314944 |
| json-tree         |    2190858 |            0 |     2190858 | 2177476–2190945 |
| columnar-tree     |    2190387 |            0 |     2190387 | 2177698–2191277 |
| binary-tree       |    2313365 |            0 |     2313365 | 2300258–2313555 |

`typed-columns` retains a string dictionary and adaptive typed arrays after discarding parsed JSON numeric arrays. It uses the same persisted JSON/BSON as `columns`. `packed-cold` retains a validated owned buffer with no cached IDs. `packed-read` additionally caches every decoded ID after accessing every run. The tree rows retain only the loaded editing tree; their snapshot input is excluded.

The editing tree is not packed by this change. Differences between tree rows can include ID string sharing and allocation effects; they are not evidence of a different tree layout. Save/load allocation peaks, real browser heaps, Mongo compression, indexes, replicas and billing are not measured.

Exact binary, columnar JSON, and editing-tree round trips passed for all three trace variants.
