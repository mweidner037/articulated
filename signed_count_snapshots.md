# Exploration: SavedIdList objects with signed counts

**Draft experiment, not an approved format change or migration.**
This proposal is independent of [the columnar/binary exploration in PR #24](https://github.com/mweidner037/articulated/pull/24).
It changes only the saved objects: the sign of `count` replaces `isDeleted`.
Existing `save()`, `load()`, and the editing tree are unchanged.

## Before and after

Current `SavedIdList`:

```js
[
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
```

Proposed `SavedSignedCountIdList`:

```js
[
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3 },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1 },
  { bunchId: "aB3dE5fG", startCounter: 3, count: -2 },
];
```

Positive means present; negative means deleted; `Math.abs(count)` is the run
length. Same run order and repeated IDs, with no dictionary, columns, typed
arrays, custom binary, or shortened keys.

For comparison, the columnar proposal represents those same runs as:

```js
({
  version: 1,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: [0, 1, 0],
  startCounters: [0, 0, 3],
  signedCounts: [3, 1, -2],
});
```

That proposal can retain typed JS columns and store each numeric column as BSON
Binary. Its separate bit-packed variant stores:

```js
({
  version: 2,
  bunchIds: ["aB3dE5fG", "hJ7kL9mN"],
  bunchIndexes: new Uint8Array([0, 32, 0, 0, 0]),
  startCounters: new Uint8Array([0, 0, 192, 0, 0]),
  signedCounts: new Uint8Array([6, 32, 0, 3, 0]),
});
```

Neither columnar implementation is included in this PR; they are comparison cases.

## Save, store in Mongo, load

```ts
import { IdList, SavedSignedCountIdList } from "articulated";

const state: SavedSignedCountIdList = list.saveSignedCounts();
const { insertedId } = await collection.insertOne({ state });

// Ordinary Mongo array of ordinary BSON objects. No Binary wrapper required.
const document = await collection.findOne({ _id: insertedId });
if (!document) throw new Error("Snapshot not found");

// The application chooses this loader for a signed-count-format document.
const restored = IdList.loadSignedCounts(document.state);
```

The `state` in Mongo looks exactly like the proposed three-object array above.
This is also ordinary JSON; a browser can retain that array directly.

The implementation is deliberately small:

```ts
// Save:
saved.map(({ bunchId, startCounter, count, isDeleted }) => ({
  bunchId,
  startCounter,
  count: isDeleted ? -count : count,
}));

// Decode back to the current save format:
signed.map(({ bunchId, startCounter, count }) => ({
  bunchId,
  startCounter,
  count: Math.abs(count),
  isDeleted: count < 0,
}));
```

The new loader validates signed counts and delegates ordinary start-counter
validation to the existing loader. Counts keep the existing safe-integer
magnitude range. Zero-length runs, including negative zero, are ignored just as
in the old loader. Saving emits no zero-length runs. IDs remain arbitrary strings.

Do not pass signed snapshots to the old loader. This experiment does not
auto-detect document formats or add a discriminator to the measured document.
A mixed-format deployment needs an application-level format/version decision
before migration. The old public type and save/load contract are preserved.

## One comparison table

Eight-character NanoID-like IDs, 11,757 runs, 5,382 distinct IDs per snapshot.
**Decimal KB per document/snapshot**, including all IDs/dictionaries.
Mongo columns are allocated collection-file bytes divided by 100 documents,
excluding indexes; JS is retained heap plus backing buffers, not live editor
memory. This is storage compression, not network/gzip measurement.

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

Unmarked Mongo rows were measured together on September 18, 2026, using the
actual version-2 bit-packed implementation from PR #24. Rows marked † retain
the earlier experiment's measurements; they were not rerun against Mongo for
this addition. The trace, dictionary generation, collection size and measurement
method match, but allocation/checkpoint granularity causes small run-to-run
differences. They are not all results of one fresh run.

The signed-count implementation's independent JS benchmark measured 664,916
bytes (sample range 632,047–665,126), versus 758,972 (726,090–759,182) for current
objects. The cross-proposal harness independently measured 664,928 and 758,984;
its typed and bit-packed results supply those comparison rows. Ranges are
individual sample variation, not confidence intervals.

### What the simple change buys

- **Snappy Mongo disk: 8.3% less**, 196.8 → 180.4 KB.
- **Zstd Mongo disk: no allocated-file saving in this fixture**, both 110.9 KB.
  This does not prove identical compressed streams or zero savings on other data.
- **Retained JS snapshot memory: 12.4% less**, 759.0 → 664.9 KB.
- **Logical BSON: 16.2% less**, 870,682 → 729,598 bytes without `_id`.
- **Loaded editing tree: unchanged**; the independent benchmark measured
  2,190,487 bytes for both input paths.

In BSON, removing `isDeleted` eliminates 12 bytes per run: one type byte,
ten field-name bytes including the terminator, and one boolean byte.
Negative and positive Int32 counts occupy the same four bytes on this trace.
11,757 × 12 = 141,084 bytes saved before Mongo compression.
The measured JS difference is 94,056 bytes, or eight bytes per run, in this V8
configuration; that is an observation, not a cross-engine object-size guarantee.

Snappy and Zstd already compress repetitive field names and boolean patterns.
That explains why uncompressed BSON savings need not become equivalent disk
savings; the measurements above, rather than the explanation alone, establish
the result for this fixture.

**Conclusion:** this is a useful low-complexity option. It keeps readable,
queryable ordinary objects and avoids binary range limits, but retains most
object overhead. Columnar/Binary reduces retained JS memory much further.
The two PRs explore different complexity/savings trade-offs, not equivalent
implementations.

## Measurement and reproduction

- Same repository 259,778-edit trace; IDs deterministically derived from SHA-256,
  truncated to eight base64url characters (not calls to NanoID).
- JS: Node 22.22.2 / V8 12.4.254.21-node.39, macOS arm64. Fresh child per case,
  three warmups, five samples × twenty retained snapshots after forced GC.
  Snapshot objects are parsed from JSON in both object cases. Input graphs and
  serialized sources are excluded; short parsed ID strings may be shared.
  This is a Node/V8 proxy, not a browser measurement, process RSS or peak memory.
- MongoDB Community 8.3.3, isolated localhost server, 0.25 GB WiredTiger cache.
  Four layouts × three compressors = twelve collections, 100 documents each.
  Each document gets its own deterministic dictionary; numeric trace repeats.
  Integer `_id` is included in disk/logical Mongo stats (nine extra bytes/doc).
  The standard `_id` index is 20,480 bytes per collection, excluded from the table.
- Explicit `block_compressor=none|snappy|zstd`, verified from each collection's
  creation string. JSON/BSON/load round trips checked; Mongo documents 0 and 99
  verified for each layout, including round-trip through the new signed loader.
- Every collection received `compact` with `freeSpaceTargetMB: 1`, returning
  `ok: 1, bytesFreed: 0`. These are freshly inserted data without deletion
  fragmentation; compaction does not guarantee an absolute minimum file size.
  After a locked `fsync`, `$collStats.storageStats.storageSize` matched the
  actual allocated `.wt` file. Repeated verification returned the same sizes.
- No Atlas/provisioned-storage billing, replicas, journals, CPU/latency, peak
  allocations, or production corpus was measured. The temporary local server
  is stopped after measurement; no production database was touched.
- The adapter currently materializes an intermediate old-format array on save
  and load. Its retained snapshot saving does not imply lower peak conversion
  memory. Direct serialization can be explored separately.

Run `npm ci`, `npm test`, `npm run build`, and `npm run benchmarks:storage`
with Node 22.22.2. The latter tests both formats across eight-character IDs, UUIDs
and shared-prefix strings, as well as reconstructed editing-tree memory.

For actual Mongo sizes, create a fresh temporary directory and start a dedicated
server (never point this at production):

```sh
benchmark_dbpath=$(mktemp -d /private/tmp/articulated-signed-mongo.XXXXXX)
mongod --dbpath "$benchmark_dbpath" --port 27184 --bind_ip 127.0.0.1 \
  --wiredTigerCacheSizeGB 0.25
```

In a second terminal, from this checkout, substitute that exact printed/assigned
directory in `ARTICULATED_BENCH_DBPATH`:

```sh
ARTICULATED_BENCH_DBPATH=/absolute/temp/dbpath \
  mongosh --quiet mongodb://127.0.0.1:27184/admin \
  --file benchmarks/mongo-signed-counts.mongosh
```

By default the script compares current objects and signed-count objects.
Optionally set `ARTICULATED_COLUMNS_ROOT` to a separate, built checkout of
PR #24 to include Binary and bit-packed columns. The comparison used commit
`b1765532518403ed2b2248912c238ca23b16e1ec`.
The script checks the server path, port and localhost binding, uses only its
named benchmark database, never drops data, refuses partial fixtures, and checks
existing complete fixtures on resume. Stop the dedicated server when finished.

Raw evidence:

- [Mongo sizes, compaction results, and filesystem verification](benchmarks/results/signed-counts-mongo.json)
- [Independent signed-count implementation benchmark](benchmarks/results/signed-counts-memory.md)
- [Cross-proposal JS/BSON rerun](benchmarks/results/cross-proposal-js.md)
- [Earlier comparison rows marked †](https://github.com/scottmessinger/articulated/blob/b1765532518403ed2b2248912c238ca23b16e1ec/benchmarks/results/packed-options-experiment.json)
