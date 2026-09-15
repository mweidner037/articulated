# Binary snapshots: less MongoDB storage and less JS snapshot memory

The target is retained snapshot memory and MongoDB document size. Network transfer
and gzip are not part of this comparison. The existing JSON format remains supported.

## A concrete example

Today a saved list might contain:

```js
[
  { bunchId: "alice", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "bob", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "alice", startCounter: 3, count: 2, isDeleted: true },
];
```

This means Alice's IDs 0–2 are present, Bob's ID 0 is present, and Alice's IDs 3–4
are deleted but still known. Four-tuples remove repeated JSON field names:

```js
[
  ["alice", 0, 3, false],
  ["bob", 0, 1, false],
  ["alice", 3, 2, true],
];
```

However, each tuple is still a separate JS array, and BSON arrays still encode
element names such as `"0"`, `"1"`, etc. The packed format instead has one ID
dictionary and columns whose positions correspond to runs:

```js
// Conceptual layout; these numeric columns are bytes in the actual format.
{
  bunches: ["alice", "bob"],
  bunch:   [0, 1, 0],
  start:   [0, 0, 3],
  count:   [3, 1, 2],
  deleted: [0, 0, 1]
}
```

At position 2, dictionary index 0 means `"alice"`, start 3 and count 2 describe IDs
3–4, and the deletion flag is set. The actual numeric bytes are:

```text
bunch indexes:   00 01 00
start counters:  00 00 03
counts:          03 01 02
deletion bits:   04          (00000100: third run deleted)
```

The entire example is **52 bytes**: a 20-byte header, a 12-byte dictionary offset
table, 10 bytes of tagged ID text, and the 10 numeric/flag bytes above. This complete
byte sequence is pinned by a unit test; header overhead matters for tiny snapshots.

## Using it in JS

```ts
import { IdList, PackedIdList } from "articulated";

const list = IdList.load([
  { bunchId: "alice", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "bob", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "alice", startCounter: 3, count: 2, isDeleted: true },
]);
const bytes = list.saveBinary();
const snapshot = PackedIdList.load(bytes);

snapshot.bunchIdAt(2); // "alice"
snapshot.startCounterAt(2); // 3
snapshot.countAt(2); // 2
snapshot.isDeletedAt(2); // true

// Explicitly expand into the old representation, if needed:
snapshot.at(2); // Allocates one named run object.
snapshot.toSaved(); // Allocates all run objects.

// Or resume editing directly, without an intermediate saved-run array:
const editable = IdList.loadBinary(bytes);
```

The scalar numeric accessors use a `DataView` over the same buffer; they allocate
no per-run objects. Strings are decoded once on first access and cached in a lazy
array indexed by dictionary entry. Validation checks all ID encodings up front,
temporarily decoding text, without retaining the strings. This is why benchmarks
report both a cold snapshot and one whose IDs have all been read.

`PackedIdList.load(bytes)` copies into an owned, exactly-sized buffer by default.
`PackedIdList.load(bytes, { copy: false })` borrows the input without copying; the
caller must keep those bytes immutable, and a small slice retains its entire
backing buffer. `toBytes()` returns a copy. Avoid retaining duplicate input/output
buffers unnecessarily. A `PackedIdList` has no mutating methods.

## Using it in MongoDB

```ts
import { Binary } from "bson"; // Also exported by the MongoDB Node driver.

await collection.updateOne(
  { _id: documentId },
  { $set: { snapshot: new Binary(list.saveBinary()) } }
);
```

Read the stored BSON Binary payload as a `Uint8Array` and pass it to
`PackedIdList.load()` or `IdList.loadBinary()`. Store it as **Binary**, not as an
array of JS numbers or a JSON-serialized Buffer. BSON Binary keeps the byte block
without adding type markers and array-index strings around each column element.

Other document fields can still be queried normally. The packed payload is an
opaque snapshot; Mongo cannot query individual runs inside it. No migration of
existing JSON snapshots is required to adopt the optional API. Applications can
distinguish the stored BSON Binary type from their existing JSON representation.

The BSON sizes in [the benchmark](./benchmark_storage_results.md) are logical
document bytes, not physical disk usage. WiredTiger compression, allocation,
indexes and replicas affect actual storage. The binary field still counts toward
MongoDB's 16 MiB document limit.

## IDs do not have to be UUIDs

Each distinct ID is stored once. Nanoids and other strings are retained exactly,
using UTF-8 when lossless. An 8-character ASCII nanoid uses 8 payload bytes plus
one encoding tag. Lowercase hyphenated UUID-shaped strings can use 16 payload
bytes plus a tag. Uppercase UUIDs remain text to preserve exact identity. Lone
UTF-16 surrogates use a lossless UTF-16 fallback. No IDs are shortened, regenerated,
hashed or normalized by the codec.

The benchmarks include the original shared-prefix ID style, independent UUIDs,
and 8-character nanoid-shaped IDs. The latter two are deterministic fixtures
derived from hashes; they are not benchmarks of the UUID/nanoid generators.

## Binary v1 layout

All multi-byte numbers use little-endian byte order. `DataView` avoids alignment
requirements and native-endian assumptions. The full buffer has these sections:

```text
[header][dictionary offsets][tagged IDs][bunch indexes][starts][counts][deletion bits]
```

| Offset    | Size                | Meaning                                           |
| --------- | ------------------- | ------------------------------------------------- |
| 0         | 4 bytes             | ASCII `AIDL`                                      |
| 4         | 1 byte              | Version `1`                                       |
| 5         | 1 byte              | Bunch-index column width                          |
| 6         | 1 byte              | Start-counter column width                        |
| 7         | 1 byte              | Count column width                                |
| 8         | 4 bytes             | Run count `R`, uint32                             |
| 12        | 4 bytes             | Dictionary entry count `B`, uint32                |
| 16        | 4 bytes             | Total tagged dictionary payload size `D`, uint32  |
| 20        | `4 × (B + 1)` bytes | ID offsets relative to dictionary payload, uint32 |
| following | `D` bytes           | Tagged dictionary entries                         |
| following | `R × indexWidth`    | Dictionary indexes                                |
| following | `R × startWidth`    | Starting counters                                 |
| following | `R × countWidth`    | Counts                                            |
| following | `ceil(R / 8)`       | Deletion bits, low bit first                      |

Each numeric column independently selects 1, 2, 4, or 8 bytes from its largest
value. Widths 1/2/4 use unsigned integers; width 8 uses float64, restricted to
nonnegative safe integers. Thus counters are not silently truncated to 32 bits.
Zero-count input runs are preserved by `PackedIdList`; as with JSON, `IdList.loadBinary`
ignores them. Positive runs must have a last counter within the safe integer range.

Dictionary offsets start at zero and end at `D`. Every entry has one tag byte:

- `0`: UTF-8 text, decoded without stripping a leading BOM.
- `1`: Exactly 16 bytes of UUID data, rendered as lowercase hyphenated text.
- `2`: UTF-16 little-endian code units, preserving arbitrary JS strings.

The decoder rejects unknown versions/widths/tags, invalid text, bad offsets,
truncated or trailing data, invalid dictionary indexes, unsafe counters, and
nonzero unused deletion bits. The format is not an authentication mechanism.

## Why fixed-width columns rather than varints in this PR?

Variable-length integers can store small values in fewer bytes, but finding run
`k` requires scanning or building an offset index. These columns use arithmetic
offsets, so snapshot access requires neither per-run objects nor a decoded numeric
array. Adaptive widths also help: the benchmark needs only 2/2/2 bytes per run's
three numbers. A future format version could add varints for storage while keeping
this layout for JS; v1 implements one format that works directly in both places.

## What changes about live editing memory?

This PR packs **snapshots**, not the live persistent B+Tree. `IdList.loadBinary()`
feeds runs one at a time into the existing tree builder. It does not retain a
second array containing every saved run. The reconstructed tree keeps its current
nodes, maps and deletion structures. Interning decoded IDs may reduce repeated
string allocations, but this is not a rewrite of the editing structure.

`saveBinary()` currently uses `save()` temporarily and copies the encoded output.
The memory benchmarks measure retained memory after GC, not encoding/loading
peaks. Reducing those peaks or packing the live tree requires separate work.
