# Saved-state size matrix

This answers the review comments on PR #34 and the follow-up questions about IDs:

1. Would protobuf-style packed varints beat the Float64 Binary columns, maybe with the whole saved state as one protobuf message?
2. Joining fixed-length IDs into one string with no lengths is a footgun.
3. Could IDs be generated or stored so they compress better?

Every option keeps **each ID as its own entry**, and nothing assumes IDs have a fixed length.

There are two separate choices, so the results are a matrix:

- **Arrangement (rows): what is stored.** There are four arrangements, each with a name used below. **Objects** is one object per run (today). **Columns** is one list per field, with the full ID on every run. **Deduplicated columns** stores each distinct ID once. **Split IDs** stores each ID as a client plus a counter number. Each arrangement appears twice: once with random 8-character IDs and once with `clientId_counter` IDs.
- **Encoding (columns): how those fields become bytes in Mongo.** The options are plain BSON arrays, Float64 Binary per number field, varint Binary per number field, or one protobuf blob for the whole state.

## Results

Every proposal has a code made of its three choices, **arrangement-IDs-encoding**:

- **Arrangement:** `OBJ` Objects, `COL` Columns, `DEDUP` Deduplicated columns, `SPLIT` Split IDs, `JOIN` IDs joined into one string (the PR #34 pick, for reference only).
- **IDs:** `R` random 8 characters, `CC` `clientId_counter`.
- **Encoding:** `BSON` plain BSON arrays, `F64` Float64 Binary per number field, `VAR` varint Binary per number field, `PB` one protobuf blob.

For example, `SPLIT-CC-VAR` is Split IDs, with `client_counter` IDs, encoded as varint per field.

Each cell shows its code, then **raw BSON KB / zstd KB / snappy KB** for the canonical document (11,757 runs, 5,382 distinct IDs). Raw is the uncompressed BSON document; zstd (Mongo's default level) and snappy are that document compressed on its own.

| IDs                 | Arrangement          |                            Plain BSON |                   Float64 per field |                    Varint per field |                  One protobuf blob |
| ------------------- | -------------------- | ------------------------------------: | ----------------------------------: | ----------------------------------: | ---------------------------------: |
| Random 8 characters | Objects              |   `OBJ-R-BSON`<br>871 / 110.3 / 193.4 |                                   — |                                   — |                                  — |
| Random 8 characters | Columns              |    `COL-R-BSON`<br>342 / 98.2 / 173.9 |   `COL-R-F64`<br>318 / 75.8 / 131.7 |   `COL-R-VAR`<br>237 / 71.8 / 119.1 |    `COL-R-PB`<br>130 / 58.7 / 78.2 |
| Random 8 characters | Deduplicated columns | `DEDUP-R-BSON`<br>338 / 112.1 / 199.7 | `DEDUP-R-F64`<br>289 / 70.6 / 116.1 |  `DEDUP-R-VAR`<br>126 / 65.0 / 91.8 |   `DEDUP-R-PB`<br>78 / 56.8 / 72.8 |
| `client_counter`    | Objects              |   `OBJ-CC-BSON`<br>938 / 80.2 / 164.1 |                                   — |                                   — |                                  — |
| `client_counter`    | Columns              |   `COL-CC-BSON`<br>410 / 74.3 / 147.3 |  `COL-CC-F64`<br>386 / 52.9 / 105.1 |   `COL-CC-VAR`<br>304 / 46.0 / 92.5 |   `COL-CC-PB`<br>197 / 26.9 / 53.8 |
| `client_counter`    | Deduplicated columns | `DEDUP-CC-BSON`<br>369 / 85.6 / 173.2 | `DEDUP-CC-F64`<br>320 / 45.7 / 89.8 | `DEDUP-CC-VAR`<br>157 / 34.9 / 65.7 | `DEDUP-CC-PB`<br>109 / 28.5 / 45.1 |
| `client_counter`    | Split IDs            | `SPLIT-CC-BSON`<br>355 / 76.6 / 184.8 | `SPLIT-CC-F64`<br>282 / 31.6 / 55.6 |  `SPLIT-CC-VAR`<br>39 / 19.7 / 25.7 |  `SPLIT-CC-PB`<br>39 / 19.6 / 25.6 |

For reference, the PR #34 pick, `JOIN-R-F64` (Float64 per field, random IDs **joined into one string**), is 188 / 56.5 / 83.0.

The same proposals as one list, smallest zstd first:

| Code            | IDs                 | Arrangement                              | Encoding          |    Raw |     zstd |   snappy |
| --------------- | ------------------- | ---------------------------------------- | ----------------- | -----: | -------: | -------: |
| `SPLIT-CC-PB`   | `client_counter`    | Split IDs                                | One protobuf blob |  39 KB |  19.6 KB |  25.6 KB |
| `SPLIT-CC-VAR`  | `client_counter`    | Split IDs                                | Varint per field  |  39 KB |  19.7 KB |  25.7 KB |
| `COL-CC-PB`     | `client_counter`    | Columns                                  | One protobuf blob | 197 KB |  26.9 KB |  53.8 KB |
| `DEDUP-CC-PB`   | `client_counter`    | Deduplicated columns                     | One protobuf blob | 109 KB |  28.5 KB |  45.1 KB |
| `SPLIT-CC-F64`  | `client_counter`    | Split IDs                                | Float64 per field | 282 KB |  31.6 KB |  55.6 KB |
| `DEDUP-CC-VAR`  | `client_counter`    | Deduplicated columns                     | Varint per field  | 157 KB |  34.9 KB |  65.7 KB |
| `DEDUP-CC-F64`  | `client_counter`    | Deduplicated columns                     | Float64 per field | 320 KB |  45.7 KB |  89.8 KB |
| `COL-CC-VAR`    | `client_counter`    | Columns                                  | Varint per field  | 304 KB |  46.0 KB |  92.5 KB |
| `COL-CC-F64`    | `client_counter`    | Columns                                  | Float64 per field | 386 KB |  52.9 KB | 105.1 KB |
| `JOIN-R-F64`    | Random 8 characters | IDs joined into one string (PR #34 pick) | Float64 per field | 188 KB |  56.5 KB |  83.0 KB |
| `DEDUP-R-PB`    | Random 8 characters | Deduplicated columns                     | One protobuf blob |  78 KB |  56.8 KB |  72.8 KB |
| `COL-R-PB`      | Random 8 characters | Columns                                  | One protobuf blob | 130 KB |  58.7 KB |  78.2 KB |
| `DEDUP-R-VAR`   | Random 8 characters | Deduplicated columns                     | Varint per field  | 126 KB |  65.0 KB |  91.8 KB |
| `DEDUP-R-F64`   | Random 8 characters | Deduplicated columns                     | Float64 per field | 289 KB |  70.6 KB | 116.1 KB |
| `COL-R-VAR`     | Random 8 characters | Columns                                  | Varint per field  | 237 KB |  71.8 KB | 119.1 KB |
| `COL-CC-BSON`   | `client_counter`    | Columns                                  | Plain BSON        | 410 KB |  74.3 KB | 147.3 KB |
| `COL-R-F64`     | Random 8 characters | Columns                                  | Float64 per field | 318 KB |  75.8 KB | 131.7 KB |
| `SPLIT-CC-BSON` | `client_counter`    | Split IDs                                | Plain BSON        | 355 KB |  76.6 KB | 184.8 KB |
| `OBJ-CC-BSON`   | `client_counter`    | Objects                                  | Plain BSON        | 938 KB |  80.2 KB | 164.1 KB |
| `DEDUP-CC-BSON` | `client_counter`    | Deduplicated columns                     | Plain BSON        | 369 KB |  85.6 KB | 173.2 KB |
| `COL-R-BSON`    | Random 8 characters | Columns                                  | Plain BSON        | 342 KB |  98.2 KB | 173.9 KB |
| `OBJ-R-BSON`    | Random 8 characters | Objects                                  | Plain BSON        | 871 KB | 110.3 KB | 193.4 KB |
| `DEDUP-R-BSON`  | Random 8 characters | Deduplicated columns                     | Plain BSON        | 338 KB | 112.1 KB | 199.7 KB |

**What the matrix says:**

- **How IDs are generated matters most.** Switching from random IDs to `client_counter` IDs shrinks every arrangement and every encoding. Even today's format drops from 110 to 80 KB with zstd with no other change (`OBJ-R-BSON` → `OBJ-CC-BSON`).
- **`SPLIT-CC-VAR` and `SPLIT-CC-PB` are the smallest by far: about 39 / 20 / 26 KB.** That's about a third of `JOIN-R-F64` and a sixth of today's `OBJ-R-BSON`. Split IDs stores IDs as numbers, so there are almost no strings left to store.
- **`SPLIT-CC-VAR` and `SPLIT-CC-PB` are the same size.** The protobuf blob only wins when there are many strings, because a BSON array spends about 16 to 20 bytes per string (see the appendix). Split IDs has almost no strings, so `SPLIT-CC-VAR` keeps readable, separate fields in Mongo at no cost.
- **Float64 is never the best encoding.** Varint is always smaller, and much smaller once IDs are numbers (`SPLIT-CC-F64` 31.6 vs `SPLIT-CC-VAR` 19.7 KB with zstd).
- **Deduplicating helps only a little** (`COL-R-PB` 58.7 → `DEDUP-R-PB` 56.8 KB with zstd), which matches what Matthew saw. Splitting IDs into a client and a counter is what makes the difference.
- **Read speed** is about the same everywhere, because `IdList.load` dominates.

**Caveats.** These sizes are estimates. On earlier formats they came within 1–4% of physical Mongo measurements, but real Mongo runs for these cells are still to do. The trace was written by one editor. A simulated 4-client split gives nearly the same numbers (see the appendix), but that is not real collaboration. Split IDs needs every ID to have the `client_counter` form; the protobuf version below falls back to storing the full text for any ID that doesn't, so existing documents with random IDs still load.

## The arrangements (rows), as JSON

Each arrangement below holds the same small example, with `client_counter` IDs: four runs, the third and fourth of which have non-obvious start counters (20 and 8). With random IDs the shapes are identical; only the ID strings differ, such as `"aB3dE5fG"` in place of `"Qm3xT9vKpa_0"`. Split IDs works only with `client_counter` IDs.

**Objects (today).**

```json
[
  {
    "bunchId": "Qm3xT9vKpa_0",
    "startCounter": 0,
    "count": 3,
    "isDeleted": false
  },
  {
    "bunchId": "Qm3xT9vKpa_0",
    "startCounter": 3,
    "count": 2,
    "isDeleted": true
  },
  {
    "bunchId": "7hLw2ZcRne_0",
    "startCounter": 20,
    "count": 1,
    "isDeleted": false
  },
  {
    "bunchId": "Qm3xT9vKpa_1",
    "startCounter": 8,
    "count": 2,
    "isDeleted": false
  }
]
```

**Columns.** One list per field, with the full ID on every run. Negative counts mean deleted, and only the non-obvious start counters are kept.

```json
{
  "bunchIds": ["Qm3xT9vKpa_0", "Qm3xT9vKpa_0", "7hLw2ZcRne_0", "Qm3xT9vKpa_1"],
  "startCounterIndexes": [2, 1],
  "startCounters": [20, 8],
  "counts": [3, -2, 1, 2]
}
```

**Deduplicated columns.** Each distinct ID is stored once. For each run, `idRefs` says "new ID" (0) or how many IDs back to look.

```json
{
  "uniqueIds": ["Qm3xT9vKpa_0", "7hLw2ZcRne_0", "Qm3xT9vKpa_1"],
  "idRefs": [0, 1, 0, 0],
  "startCounterIndexes": [2, 1],
  "startCounters": [20, 8],
  "counts": [3, -2, 1, 2]
}
```

**Split IDs.** Each client ID is stored once. Each run stores which client it belongs to (1-based) and how far its counter moved since that client's previous run.

```json
{
  "clientIds": ["Qm3xT9vKpa", "7hLw2ZcRne"],
  "clientIndexes": [1, 1, 2, 1],
  "counterChanges": [0, 0, 0, 1],
  "startCounterIndexes": [2, 1],
  "startCounters": [20, 8],
  "counts": [3, -2, 1, 2]
}
```

`client_counter` IDs come from the generator the benchmarks already use:

```js
// One random client ID per editor session; the counter goes 0, 1, 2, … (base 36).
const clientId = maybeRandomString({ length: 10 });
let seq = 0;
const generator = new ElementIdGenerator(
  () => `${clientId}_${(seq++).toString(36)}`,
);
```

## The encodings (columns), as Ecto schemas

Each encoding is shown for the Columns arrangement, plus Split IDs where it differs. In every case the app and the browser still get the Columns JSON above; only what Mongo stores changes.

**Plain BSON.** Ordinary Ecto fields.

```elixir
embedded_schema do
  field :bunch_ids, {:array, :string}, source: :bunchIds, default: []
  field :start_counter_indexes, {:array, :integer}, source: :startCounterIndexes, default: []
  field :start_counters, {:array, :integer}, source: :startCounters, default: []
  field :counts, {:array, :integer}, default: []
end
```

**Float64 per field.** PR #34's `Float64Array` type on each number field.

```elixir
embedded_schema do
  field :bunch_ids, {:array, :string}, source: :bunchIds, default: []
  field :start_counter_indexes, Float64Array, source: :startCounterIndexes, default: []
  field :start_counters, Float64Array, source: :startCounters, default: []
  field :counts, Float64Array, default: []
end
```

Mongo shows `counts: Binary.createFromBase64("AAAAAAAACEAAAAAAAAAAwAAAAAAAAPA/AAAAAAAAAEA=", 0)`, which is 32 bytes.

**Varint per field.** `UintVarintArray` and `SintVarintArray` are drop-in replacements for `Float64Array`, with the same safe-integer checks, but a small number takes 1 byte instead of 8.

```elixir
embedded_schema do
  field :bunch_ids, {:array, :string}, source: :bunchIds, default: []
  field :start_counter_indexes, UintVarintArray, source: :startCounterIndexes, default: []
  field :start_counters, UintVarintArray, source: :startCounters, default: []
  field :counts, SintVarintArray, default: []
end
```

Mongo shows `counts: Binary.createFromBase64("BgMCBA==", 0)`, which is 4 bytes.

For **`SPLIT-CC-VAR`**, the schema stores the split IDs, and two helpers convert to and from `bunch_ids`:

```elixir
embedded_schema do
  field :client_ids, {:array, :string}, source: :clientIds, default: []
  field :client_indexes, UintVarintArray, source: :clientIndexes, default: []
  field :counter_changes, SintVarintArray, source: :counterChanges, default: []
  field :start_counter_indexes, UintVarintArray, source: :startCounterIndexes, default: []
  field :start_counters, UintVarintArray, source: :startCounters, default: []
  field :counts, SintVarintArray, default: []
end

# bunch_ids -> {client_ids, client_indexes, counter_changes, raw_ids}
SavedIdListCompactProto.split_ids(bunch_ids)
# and back:
SavedIdListCompactProto.join_ids(client_ids, client_indexes, counter_changes, raw_ids)
```

Mongo shows readable client IDs and small binaries:

```js
state: {
  clientIds: ["Qm3xT9vKpa", "7hLw2ZcRne"],
  clientIndexes: Binary.createFromBase64("AQECAQ==", 0),
  counterChanges: Binary.createFromBase64("AAAAAg==", 0),
  startCounterIndexes: Binary.createFromBase64("AgE=", 0),
  startCounters: Binary.createFromBase64("FAg=", 0),
  counts: Binary.createFromBase64("BgMCBA==", 0)
}
```

**One protobuf blob.** `state` is a single field, and the Ecto type converts the whole map. For `COL-*-PB` that's `SavedIdListProto` (`FlatSavedIdListMessage`, which is PR #30's layout with 64-bit numbers). For `SPLIT-CC-PB` it's `SavedIdListCompactProto` (`CompactIdSavedIdListMessage`), which also keeps any ID that isn't `client_counter` as text.

```elixir
# Inside the existing Document schema; the app reads and writes the Columns map:
field :state, SavedIdListCompactProto

%{
  bunch_ids: ["Qm3xT9vKpa_0", "Qm3xT9vKpa_0", "7hLw2ZcRne_0", "Qm3xT9vKpa_1"],
  start_counter_indexes: [2, 1],
  start_counters: [20, 8],
  counts: [3, -2, 1, 2]
}
```

Mongo shows only bytes:

```js
state: Binary.createFromBase64(
  "CgpRbTN4VDl2S3BhCgo3aEx3MlpjUm5lEgQBAQIBGgQAAAACKgICATICFAg6BAYDAgQ=",
  0,
);
```

The blob fits only if nothing reads `state` outside Ecto, such as Mongo shell queries, aggregations or other services.

All the Ecto types are in [ecto/saved_id_list_types.ex](ecto/saved_id_list_types.ex), with no dependencies beyond Ecto.

## Verification

- Every matrix cell is decoded back and checked against the original saved state ([src/browser/saved-state-matrix.ts](src/browser/saved-state-matrix.ts)).
- The Elixir types read the bytes the JS code writes and write the same bytes back. This is checked on the example, the full document with random IDs, the full document with `client_counter` IDs, a mix of `client_counter` and other IDs, and edge cases: IDs of mixed length, an empty ID, a non-ASCII ID and the largest safe integers. Run [ecto/check.exs](ecto/check.exs). Hex isn't reachable from where this was built, so the check uses a stand-in for `Ecto.Type`; the type modules are unchanged.
- The JS protobuf code matches protobufjs byte for byte. `pnpm test` in benchmarks passes.

## Appendix

**4 clients (simulated).** The same document with its bunches reassigned to 4 clients in blocks of 250. Cells are raw / zstd / snappy KB:

| IDs                 | Arrangement          |                            Plain BSON |                   Float64 per field |                    Varint per field |                  One protobuf blob |
| ------------------- | -------------------- | ------------------------------------: | ----------------------------------: | ----------------------------------: | ---------------------------------: |
| Random 8 characters | Objects              |   `OBJ-R-BSON`<br>871 / 110.3 / 193.4 |                                   — |                                   — |                                  — |
| Random 8 characters | Columns              |    `COL-R-BSON`<br>342 / 98.2 / 173.9 |   `COL-R-F64`<br>318 / 75.8 / 131.7 |   `COL-R-VAR`<br>237 / 71.8 / 119.1 |    `COL-R-PB`<br>130 / 58.7 / 78.2 |
| Random 8 characters | Deduplicated columns | `DEDUP-R-BSON`<br>338 / 112.1 / 199.7 | `DEDUP-R-F64`<br>289 / 70.6 / 116.1 |  `DEDUP-R-VAR`<br>126 / 65.0 / 91.8 |   `DEDUP-R-PB`<br>78 / 56.8 / 72.8 |
| `client_counter`    | Objects              |   `OBJ-CC-BSON`<br>930 / 80.4 / 169.8 |                                   — |                                   — |                                  — |
| `client_counter`    | Columns              |   `COL-CC-BSON`<br>401 / 74.5 / 151.4 |  `COL-CC-F64`<br>377 / 52.7 / 109.5 |   `COL-CC-VAR`<br>295 / 46.0 / 96.9 |   `COL-CC-PB`<br>189 / 26.3 / 53.2 |
| `client_counter`    | Deduplicated columns | `DEDUP-CC-BSON`<br>365 / 86.3 / 173.4 | `DEDUP-CC-F64`<br>316 / 46.1 / 90.2 | `DEDUP-CC-VAR`<br>153 / 35.7 / 66.2 | `DEDUP-CC-PB`<br>105 / 26.7 / 43.7 |
| `client_counter`    | Split IDs            | `SPLIT-CC-BSON`<br>355 / 81.5 / 181.6 | `SPLIT-CC-F64`<br>282 / 31.8 / 56.1 |  `SPLIT-CC-VAR`<br>37 / 18.9 / 25.8 |  `SPLIT-CC-PB`<br>37 / 18.8 / 25.7 |

**Float64 vs varint.** Float64 spends 8 bytes on every number, mostly zeros:

```
3  → 00 00 00 00 00 00 08 40
-2 → 00 00 00 00 00 00 00 c0
```

A varint spends 1 byte on a small number. Negatives are folded in first (3→6, -2→3, 1→2, 2→4), so `counts` is `06 03 02 04`. In the real document 94% of counts are under 64 and take 1 byte; the largest, 1396, takes 2 bytes (`e8 15`).

**A string in a BSON array** costs about 16 to 20 bytes, because BSON stores an array as an object whose keys are `"0"`, `"1"`, `"2"`, …:

```
02            type: string
30 00         key "0"
09 00 00 00   length 9
61 42 33 64 45 35 66 47 00   "aB3dE5fG" + terminator
```

**A string in protobuf** costs its length plus 2 bytes:

```
0a        field 1
08        length 8
61 42 33 64 45 35 66 47   "aB3dE5fG"
```

**The `SPLIT-CC-PB` blob** for the example:

```
0a 0a 51 6d 33 78 54 39 76 4b 70 61   client "Qm3xT9vKpa"
0a 0a 37 68 4c 77 32 5a 63 52 6e 65   client "7hLw2ZcRne"
12 04 01 01 02 01                     clientIndexes [1, 1, 2, 1]
1a 04 00 00 00 02                     counterChanges [0, 0, 0, 1]
2a 02 02 01                           startCounterIndexes [2, 1]
32 02 14 08                           startCounters [20, 8]
3a 04 06 03 02 04                     counts [3, -2, 1, 2]
```

## Reproduce

From `benchmarks/`:

```
SNAPPYJS=/abs/path/to/node_modules/snappyjs \
TSX_TSCONFIG_PATH=tsconfig.dev.json node --import tsx src/browser/saved-state-matrix.ts
```

For physical Mongo sizes of the earlier formats, run `src/browser/direct-storage-probe.ts` as described in [flat-f64.md](flat-f64.md) with `DIRECT_STORAGE_VARINT=1`. Raw output: [results/flat-varint-probe/matrix.json](results/flat-varint-probe/matrix.json).
