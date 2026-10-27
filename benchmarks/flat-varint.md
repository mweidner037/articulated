# Protobuf / packed varints instead of Float64

This answers the two review comments on PR #34:

1. Would protobuf-style packed varints beat the Float64 Binary columns, maybe with the whole saved state stored as one protobuf message?
2. Joining fixed-length IDs into one string with no lengths is a footgun.

So every option below keeps **each ID as its own entry**, and nothing assumes IDs are 8 characters.

## Summary

| Option                                                   | Mongo size, zstd | Mongo size, snappy | Readable in Mongo shell? |
| -------------------------------------------------------- | ---------------: | -----------------: | ------------------------ |
| Today: saved objects                                     |         110.3 KB |           193.3 KB | Yes                      |
| PR #34 pick: Float64 columns, IDs joined into one string |          56.5 KB |            83.0 KB | Mostly                   |
| Float64 columns, IDs as an array                         |          75.8 KB |           131.6 KB | Mostly                   |
| **A.** Varint columns, IDs as an array                   |          71.8 KB |           119.0 KB | Mostly                   |
| **B.** Whole state as one protobuf blob                  |      **58.7 KB** |        **78.2 KB** | No                       |

- **B answers both comments.** It is the same size as the PR #34 pick (2 KB bigger with zstd, 5 KB smaller with snappy), and every ID keeps its own length.
- **A loses most of the gain.** Varints shrink the numbers, but storing IDs as a BSON array costs more than that saves. In BSON, every array element carries its own key and length (see the appendix).
- **Read speed** is about the same for all of them, because `IdList.load` dominates.
- **The app sees the same JSON in every option.** Only what Mongo stores changes, and the Ecto type converts in both directions.
- **B fits only if nothing reads `state` outside Ecto.** That means no Mongo shell queries, aggregations or other services touching it.

The sizes are estimates for the real canonical document (11,757 runs): each document's BSON is compressed on its own, with zstd at Mongo's default level. On earlier formats this estimate came within 1–4% of physical Mongo measurements. Real Mongo runs for A and B are still to do.

Merging `startCounterIndexes` and `startCounters` into `counts` (for example, 0 as a marker) was also considered. It is dropped: this document has no start counters, so those fields are already empty and merging saves nothing.

## The example

Every option below stores the small example state from PR #34. The app and the browser see this JSON in all of them:

```json
{
  "bunchIds": ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
  "startCounterIndexes": [2, 1],
  "startCounters": [20, 8],
  "counts": [3, -2, 1, 2]
}
```

## Option A: varint columns, IDs as an array

The PR #34 `SavedIdColumns` schema with two changes: `bunch_ids` is a list of strings instead of one joined string, and the number columns use varint types instead of `Float64Array`.

```elixir
defmodule SavedIdColumns do
  use Ecto.Schema
  @primary_key false

  embedded_schema do
    field :bunch_ids, {:array, :string}, source: :bunchIds, default: []
    field :start_counter_indexes, UintVarintArray, source: :startCounterIndexes, default: []
    field :start_counters, UintVarintArray, source: :startCounters, default: []
    field :counts, SintVarintArray, default: []
  end
end

# Inside the existing Document schema:
embeds_one :state, SavedIdColumns
```

`UintVarintArray` and `SintVarintArray` are drop-in replacements for `Float64Array`. They have the same `cast`/`dump`/`load` shape and the same safe-integer check, but each number takes 1 byte when it is small instead of always 8. The full code is in [ecto/saved_id_list_types.ex](ecto/saved_id_list_types.ex).

What the Mongo shell shows:

```js
{
  _id: …,
  state: {
    bunchIds: ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
    startCounterIndexes: Binary.createFromBase64("AgE=", 0),
    startCounters: Binary.createFromBase64("FAg=", 0),
    counts: Binary.createFromBase64("BgMCBA==", 0)
  }
}
```

For comparison, the Float64 version of `counts` is `Binary.createFromBase64("AAAAAAAACEAAAAAAAAAAwAAAAAAAAPA/AAAAAAAAAEA=", 0)`: 32 bytes instead of 4.

## Option B: whole state as one protobuf blob

`state` becomes a single field. The Ecto type turns the map above into one protobuf message (`FlatSavedIdListMessage` in [id_list_saved_state.proto](src/algorithms/id_list_saved_state.proto)) and back. This is PR #30's `TransposedOmitSavedIdListMessage` layout with 64-bit numbers, so counters can't overflow.

```elixir
# Inside the existing Document schema:
field :state, SavedIdListProto
```

```elixir
# What the app reads and writes:
%{
  bunch_ids: ["aB3dE5fG", "aB3dE5fG", "hJ7kL9mN", "aB3dE5fG"],
  start_counter_indexes: [2, 1],
  start_counters: [20, 8],
  counts: [3, -2, 1, 2]
}
```

`SavedIdListProto` is about 80 lines with no dependencies; the full code is in [ecto/saved_id_list_types.ex](ecto/saved_id_list_types.ex). Elixir integers have no size limit, so the `protobuf` Hex package would also work in place of the hand-written encoder.

What the Mongo shell shows (only bytes):

```js
{
  _id: …,
  state: Binary.createFromBase64("CghhQjNkRTVmRwoIYUIzZEU1ZkcKCGhKN2tMOW1OCghhQjNkRTVmRxICAgEaAhQIIgQGAwIE", 0)
}
```

## Verification

- The Elixir types read the bytes the JS codec writes, and write the same bytes back. This holds for the example, the full canonical document, and edge cases: IDs of mixed length, an empty ID, a non-ASCII ID and the largest safe integers. Run [ecto/check.exs](ecto/check.exs). Hex isn't reachable from where this was built, so the check uses a stand-in for `Ecto.Type`; the type modules are unchanged.
- The JS codec matches protobufjs byte for byte. `pnpm test` in benchmarks: 212 passed.

## Appendix: why the sizes come out this way

**Float64 vs varint.** Float64 spends 8 bytes on every number, mostly zeros:

```
3  → 00 00 00 00 00 00 08 40
-2 → 00 00 00 00 00 00 00 c0
```

A varint spends 1 byte on a small number. Negatives are folded in first (3→6, -2→3, 1→2, 2→4), so `counts` is `06 03 02 04`. In the real document 94% of counts are under 64 and take 1 byte; the largest, 1396, takes 2 bytes (`e8 15`).

**An ID in a BSON array** costs about 16 to 20 bytes. BSON stores an array as an object whose keys are `"0"`, `"1"`, `"2"`, …:

```
02        type: string
30 00     key "0"
09 00 00 00   length 9
61 42 33 64 45 35 66 47 00   "aB3dE5fG" + terminator
```

**An ID in protobuf** costs 10 bytes:

```
0a        field 1 (bunchIds)
08        length 8
61 42 33 64 45 35 66 47   "aB3dE5fG"
```

**Option B's full blob** for the example:

```
0a 08 61 42 33 64 45 35 66 47   ID 1
0a 08 61 42 33 64 45 35 66 47   ID 2
0a 08 68 4a 37 6b 4c 39 6d 4e   ID 3
0a 08 61 42 33 64 45 35 66 47   ID 4
12 02 02 01                     startCounterIndexes [2, 1]
1a 02 14 08                     startCounters [20, 8]
22 04 06 03 02 04               counts [3, -2, 1, 2]
```

**Full size table** (canonical document; raw is the uncompressed BSON):

| Option                             |    Raw |   gzip |   zstd | snappy |
| ---------------------------------- | -----: | -----: | -----: | -----: |
| Today: saved objects               | 871 KB | 128 KB | 110 KB | 193 KB |
| PR #34 pick: Float64, joined IDs   | 188 KB |  56 KB |  57 KB |  83 KB |
| Float64, IDs as an array           | 318 KB |  89 KB |  76 KB | 132 KB |
| A. Varint columns, IDs as an array | 237 KB |  83 KB |  72 KB | 119 KB |
| B. One protobuf blob               | 130 KB |  57 KB |  59 KB |  78 KB |

## Reproduce

```
FLAT_VARINT_FIXTURE=$PWD/results/storage-sweep-browser/canonical-input.json \
SNAPPYJS=/abs/path/to/node_modules/snappyjs \
TSX_TSCONFIG_PATH=tsconfig.dev.json node --import tsx src/browser/flat-varint-probe.ts
```

For physical Mongo sizes, run `src/browser/direct-storage-probe.ts` as described in [flat-f64.md](flat-f64.md) with `DIRECT_STORAGE_VARINT=1`. Raw output: [results/flat-varint-probe/node.json](results/flat-varint-probe/node.json). JS codec: [src/browser/flat-varint-formats.ts](src/browser/flat-varint-formats.ts). Tests: [src/browser/flat-varint.test.ts](src/browser/flat-varint.test.ts).
