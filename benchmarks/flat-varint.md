# Packed varints / protobuf instead of Float64

Follow-up to the PR #34 review question: would a protobuf-style packed int array beat the Float64 Binary fields, and should the Ecto adapter store the whole saved state as one protobuf message?

Two candidates were added, both wire-compatible with protobuf `uint64`/`sint64` (zigzag) packed fields, so they keep the full safe-integer range like Flat-F64:

- **Flat-Varint**: same Mongo shape as Flat-F64 (`bunchIds` string plus three Binary fields), but each Binary holds packed varints instead of 8-byte floats.
- **Flat-Proto**: the whole flat state as one `FlatSavedIdListMessage` (added to `id_list_saved_state.proto`) in a single BSON Binary. Tests check it is byte-identical to the protobufjs encoder.

PR #30's `TransposedOmitSavedIdListMessage` (repeated string IDs, uint32) is included as **Proto-30** for reference.

## In plain terms, with an example

Take the small example state from PR #34:

```js
{
  bunchIds: "aB3dE5fGaB3dE5fGhJ7kL9mNaB3dE5fG",
  startCounterIndexes: [2, 1],
  startCounters: [20, 8],
  counts: [3, -2, 1, 2],
}
```

**Today (Float64).** Every number takes 8 bytes, however small, so `counts` is 32 bytes, mostly zeros:

```
3  → 00 00 00 00 00 00 08 40
-2 → 00 00 00 00 00 00 00 c0   …and so on
```

**The suggestion (varints, as protobuf uses).** Small numbers take 1 byte, bigger ones take more. Negatives are folded in first (3→6, -2→3, 1→2, 2→4), so the same `counts` is 4 bytes: `06 03 02 04`. In the real canonical document 94% of counts are under 64 and take 1 byte; the largest, 1396, takes 2 bytes (`e8 15`).

There are two ways to store that in Mongo:

1. **Varint per field** (Flat-Varint below). Same document as today; only what is inside each Binary changes:

   ```js
   {
     bunchIds: "aB3dE5fG…",
     startCounterIndexes: Binary(02 01),
     startCounters: Binary(14 08),
     counts: Binary(06 03 02 04),
   }
   ```

2. **Whole state as one protobuf message** (Flat-Proto below). Everything, IDs included, goes into one blob:

   ```js
   { state: Binary(0a 20 61 42 33 64 … 12 02 02 01 1a 02 14 08 22 04 06 03 02 04) }
   ```

   In the Mongo shell this is only bytes, which is why it only makes sense if nothing reads the saved state outside the Ecto type.

**What happens on the real document:** it shrinks from 188 KB to 107 KB before compression. After Mongo compresses it, it goes from 56.5 KB to 53.1 KB with zstd (about 6% smaller) and from 83 KB to 70 KB with snappy (about 15% smaller). Compression already removes most of the Float64 zeros, so the saving shrinks. About 40 KB of the 53 KB that remain are the 8-character IDs, so changing how the numbers are stored can't move the total much further. The two storage options come out the same size. Option 1 is the safer pick because the document stays readable in Mongo.

## Result (canonical snapshot, 11,757 runs, document 0)

| Format       | BSON KB | gzip KB | zstd KB | snappy KB | Node decode + IdList.load median / p95 ms |
| ------------ | ------: | ------: | ------: | --------: | ----------------------------------------: |
| F01          |   870.7 |   127.6 |   110.3 |     193.3 |                               29.2 / 42.4 |
| Sflat-joined |   212.4 |    79.7 |    80.4 |     125.7 |                               18.6 / 29.4 |
| Flat-F64     |   188.2 |    56.0 |    56.5 |      83.0 |                               17.5 / 27.2 |
| Flat-Varint  |   106.6 |    50.5 |    53.1 |      70.4 |                               18.3 / 29.2 |
| Flat-Proto   |   106.5 |    50.5 |    53.1 |      70.3 |                               17.4 / 26.6 |
| Proto-30     |   130.0 |    56.6 |    58.7 |      78.2 |                               17.4 / 26.8 |

Compressed sizes are single-document compression of the `{_id, state}` BSON (zstd level 6, MongoDB's default). This proxy tracks the earlier physical WiredTiger measurements closely (F01 zstd 110.3 vs 110.8 KB measured; Flat-F64 56.5 vs 57.5 KB zstd and 83.0 vs 86.2 KB snappy), but it is not a Mongo measurement. Timing is Node only, not the browser harness.

## What this says

- Varints nearly halve the **uncompressed** document (188 → 107 KB) because 94% of counts fit in one byte. That matters for anything that sees raw BSON: the WiredTiger cache, the wire between Mongo and the app server, and the 16 MB document limit.
- After compression the gain is modest: **−6% zstd, −10% gzip, −15% snappy** versus Flat-F64. zstd already squeezes most of the zero bytes out of the Float64 columns (counts: 15.2 KB as Float64+zstd vs 8.6 KB as varint+zstd).
- The rest of the document is the IDs: the 94 KB `bunchIds` string is about 40 KB after zstd, roughly three quarters of the compressed total. Further numeric tricks cannot move the total much; only ID representation can.
- Per-field varints and one whole protobuf message are the same size (BSON field names cost about 70 bytes). The choice between them is about who can read the stored document, not bytes.
- Decode + load time is unchanged within noise; `IdList.load` dominates.
- Proto-30 is larger than Flat-Proto because repeated strings add a tag and length byte per run (about 23 KB raw), and its uint32 fields cap counters at 2^32.

## Open question for the adapter

Whole-message protobuf only makes sense if nothing reads the saved state outside the Ecto type (Mongo shell queries, aggregation, other services). If something does, Flat-Varint keeps `bunchIds` and the columns as separate, inspectable fields at the same size.

## Reproduce

```
FLAT_VARINT_FIXTURE=$PWD/results/storage-sweep-browser/canonical-input.json \
SNAPPYJS=/abs/path/to/node_modules/snappyjs \
TSX_TSCONFIG_PATH=tsconfig.dev.json node --import tsx src/browser/flat-varint-probe.ts
```

Physical Mongo sizes: run `src/browser/direct-storage-probe.ts` as described in [flat-f64.md](flat-f64.md) with `DIRECT_STORAGE_VARINT=1` (not yet run). Raw output: [results/flat-varint-probe/node.json](results/flat-varint-probe/node.json). Codec: [src/browser/flat-varint-formats.ts](src/browser/flat-varint-formats.ts). Tests: [src/browser/flat-varint.test.ts](src/browser/flat-varint.test.ts).
