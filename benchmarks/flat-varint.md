# Protobuf / packed varints instead of Float64

This answers the two review comments on PR #34:

1. Would protobuf-style packed varints beat the Float64 Binary columns, maybe with the whole saved state stored as one protobuf message?
2. Joining fixed-length IDs into one string with no lengths is a footgun.

So every option below keeps **each ID as its own entry**. Nothing assumes IDs are 8 characters. (Flat-F64, the current PR #34 recommendation, still joins them; it is kept only as the number to beat.)

## The ideas, with an example

The small example state from PR #34, with IDs kept separate:

```js
{
  bunchIds: ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
  startCounterIndexes: [2, 1],
  startCounters: [20, 8],
  counts: [3, -2, 1, 2],
}
```

### Numbers: Float64 vs varint

**Float64 (current).** Every number takes 8 bytes, however small, so `counts` is 32 bytes and mostly zeros:

```
3  → 00 00 00 00 00 00 08 40
-2 → 00 00 00 00 00 00 00 c0   …and so on
```

**Varint (what protobuf uses).** Small numbers take 1 byte and bigger ones take more. Negatives are folded in first (3→6, -2→3, 1→2, 2→4), so the same `counts` is 4 bytes: `06 03 02 04`. In the real document 94% of counts are under 64 and take 1 byte. The largest, 1396, takes 2 bytes (`e8 15`).

### IDs: a BSON array vs protobuf

**Plain BSON array.** BSON stores an array as an object whose keys are the strings `"0"`, `"1"`, `"2"`, …. Each 8-character ID costs about 16 to 20 bytes:

```
02 30 00 09 00 00 00 61 42 33 64 45 35 66 47 00
^type ^"0"  ^length 9   a  B  3  d  E  5  f  G  ^end
```

**Protobuf `repeated string`.** Each ID costs 10 bytes: one tag byte, one length byte, then the characters. The length is stored with every ID, which is exactly what the reviewer asked for.

```
0a 08 61 42 33 64 45 35 66 47
^tag ^len a  B  3  d  E  5  f  G
```

### The two ways to store it in Mongo

**A. Varint per field (Flat-Varint).** A normal Mongo document. IDs are a normal array and each number column is a Binary of varints:

```js
{
  bunchIds: ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
  startCounterIndexes: Binary(02 01),
  startCounters: Binary(14 08),
  counts: Binary(06 03 02 04),
}
```

**B. Whole state as one protobuf message (Flat-Proto).** One blob. This is PR #30's `TransposedOmitSavedIdListMessage` layout with 64-bit number fields, so counters can't overflow:

```js
{ state: Binary(0a 08 61 42 33 64 45 35 66 47  0a 08 …  12 02 02 01  1a 02 14 08  22 04 06 03 02 04) }
//              ID 1 (len 8)                    ID 2…  indexes      counters     counts
```

In the Mongo shell B shows only bytes, so it fits only if nothing reads the saved state outside the Ecto type.

## Results on the real document (11,757 runs)

| Option                                       |    Raw | zstd (Mongo default) |   snappy |
| -------------------------------------------- | -----: | -------------------: | -------: |
| Today's objects (F01)                        | 871 KB |             110.3 KB | 193.3 KB |
| Current PR #34 pick: Float64, **joined** IDs | 188 KB |              56.5 KB |  83.0 KB |
| Float64, separate IDs (BSON array)           | 318 KB |              75.8 KB | 131.6 KB |
| **A.** Varint per field, separate IDs        | 237 KB |              71.8 KB | 119.0 KB |
| **B.** One protobuf message, separate IDs    | 130 KB |              58.7 KB |  78.2 KB |

- **B is the answer to both comments.** It is the same size as the current Float64 pick (2 KB bigger with zstd, 5 KB smaller with snappy), and it stores a length with every ID, so it has no fixed-length assumption. Raw size drops from 188 KB to 130 KB.
- **A loses most of the gain.** Varints help, but keeping IDs separate in a BSON array adds back more than they save, because of BSON's per-element keys and lengths. This is the "verbose BSON" point from the first comment.
- **Read speed** is about the same for all of them, within a few ms in Node, because `IdList.load` dominates. These Node timings are noisy and are not the browser harness.
- **What's left in B** is mostly the IDs themselves. The numbers are already small.

The compressed sizes are estimates: each document's BSON is compressed on its own (zstd at Mongo's default level 6). On earlier formats this estimate came within 1–4% of the physical Mongo measurements (F01 zstd 110.3 vs 110.8 KB, Flat-F64 snappy 83.0 vs 86.2 KB). Real Mongo numbers for A and B are still to run.

## Reproduce

```
FLAT_VARINT_FIXTURE=$PWD/results/storage-sweep-browser/canonical-input.json \
SNAPPYJS=/abs/path/to/node_modules/snappyjs \
TSX_TSCONFIG_PATH=tsconfig.dev.json node --import tsx src/browser/flat-varint-probe.ts
```

For physical Mongo sizes, run `src/browser/direct-storage-probe.ts` as described in [flat-f64.md](flat-f64.md) with `DIRECT_STORAGE_VARINT=1`. Raw output: [results/flat-varint-probe/node.json](results/flat-varint-probe/node.json). Codec: [src/browser/flat-varint-formats.ts](src/browser/flat-varint-formats.ts). Schema: `FlatSavedIdListMessage` in [id_list_saved_state.proto](src/algorithms/id_list_saved_state.proto). Tests, including IDs of mixed length, empty IDs, non-ASCII IDs and byte-for-byte agreement with protobufjs: [src/browser/flat-varint.test.ts](src/browser/flat-varint.test.ts).
