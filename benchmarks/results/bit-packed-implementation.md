# Recorded bit-packed implementation benchmark

Run on September 17, 2026 with `mise exec node@22.22.2 -- npm run benchmarks:storage`.
This captures logical BSON and retained JS memory, not a new Mongo disk run.
See [the single-file explanation and combined table](../../bit_packed_snapshots.md).

```text
> articulated@1.3.2 benchmarks:storage
> TS_NODE_PROJECT='./tsconfig.dev.json' node -r ts-node/register --expose-gc benchmarks/storage.ts

# Dictionary and per-array BSON Binary benchmarks

Runtime: Node v22.22.2, V8 12.4.254.21-node.39, darwin/arm64.

Reproduce: `npm ci && npm run benchmarks:storage`. No compression or network metrics.

Each ID variant replays the same 259,778 edits: 182,315 inserted IDs, 104,852 live IDs. UUID/8-character nanoid values are deterministic SHA-256-derived fixtures, not calls to the ID libraries.

Memory: fresh child process per case, median of 5 samples of 20 retained copies after GC. Total = heapUsed + arrayBuffers, not external + arrayBuffers. Min/max show sample variation. Node/V8 proxy, not a browser measurement or peak allocation measurement.

BSON sizes are actual serialized byte lengths for `{state: value}`, checked against calculateObjectSize. Ordinary numeric arrays are verified to contain BSON Int32 elements for this trace; explicit Int32 encoding is byte-identical. Binary values are explicitly wrapped in Binary. These are logical document bytes, not measured WiredTiger disk or cache bytes.

## shared-prefix

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format | BSON bytes |
|---|---:|
| Objects | 1244366 |
| Four-tuples | 903413 |
| Dictionary + ordinary Mongo arrays (automatic Int32) | 627016 |
| Dictionary + ordinary Mongo arrays (explicit Int32) | 627016 |
| Dictionary + ordinary Mongo arrays (forced Double) | 768100 |
| Dictionary + three BSON Binary arrays | 507505 |
| Dictionary + three bit-packed Binary arrays (13/11/12 bits) | 325273 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 272365 dictionary/document/array framing bytes = 627016 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 272365 dictionary/document/binary framing bytes = 507505 bytes.


| JS representation | Heap bytes | Buffer bytes | Total bytes | Total min–max |
|---|---:|---:|---:|---:|
| objects | 1410918 | 0 | 1410918 | 1410906–1411171 |
| tuples | 1693086 | 0 | 1693086 | 1693074–1693339 |
| columns | 626902 | 0 | 626902 | 626890–627155 |
| typed-columns | 345174 | 70542 | 415716 | 415716–416131 |
| binary-columns | 345174 | 70542 | 415716 | 409039–415728 |
| bit-packed-columns | 345184 | 52908 | 398092 | 398069–398751 |
| json-tree | 2747137 | 0 | 2747137 | 2739803–2747194 |
| columnar-tree | 2485808 | 0 | 2485808 | 2478612–2485910 |
| binary-tree | 2484992 | 0 | 2484992 | 2480050–2486755 |

## uuid

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format | BSON bytes |
|---|---:|
| Objects | 1199878 |
| Four-tuples | 858925 |
| Dictionary + ordinary Mongo arrays (automatic Int32) | 606598 |
| Dictionary + ordinary Mongo arrays (explicit Int32) | 606598 |
| Dictionary + ordinary Mongo arrays (forced Double) | 747682 |
| Dictionary + three BSON Binary arrays | 487087 |
| Dictionary + three bit-packed Binary arrays (13/11/12 bits) | 304855 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 251947 dictionary/document/array framing bytes = 606598 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 251947 dictionary/document/binary framing bytes = 487087 bytes.


| JS representation | Heap bytes | Buffer bytes | Total bytes | Total min–max |
|---|---:|---:|---:|---:|
| objects | 1410918 | 0 | 1410918 | 1410906–1411171 |
| tuples | 1693086 | 0 | 1693086 | 1693074–1693339 |
| columns | 626902 | 0 | 626902 | 626890–627155 |
| typed-columns | 345174 | 70542 | 415716 | 415716–416131 |
| binary-columns | 345174 | 70542 | 415716 | 409031–415728 |
| bit-packed-columns | 345179 | 52908 | 398087 | 398062–398747 |
| json-tree | 2746562 | 0 | 2746562 | 2739842–2747358 |
| columnar-tree | 2485517 | 0 | 2485517 | 2479910–2486120 |
| binary-tree | 2485462 | 0 | 2485462 | 2478811–2486622 |

## nanoid

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format | BSON bytes |
|---|---:|
| Objects | 870682 |
| Four-tuples | 529729 |
| Dictionary + ordinary Mongo arrays (automatic Int32) | 455902 |
| Dictionary + ordinary Mongo arrays (explicit Int32) | 455902 |
| Dictionary + ordinary Mongo arrays (forced Double) | 596986 |
| Dictionary + three BSON Binary arrays | 336391 |
| Dictionary + three bit-packed Binary arrays (13/11/12 bits) | 154159 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 101251 dictionary/document/array framing bytes = 455902 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 101251 dictionary/document/binary framing bytes = 336391 bytes.


| JS representation | Heap bytes | Buffer bytes | Total bytes | Total min–max |
|---|---:|---:|---:|---:|
| objects | 758984 | 0 | 758984 | 758972–759237 |
| tuples | 1041152 | 0 | 1041152 | 1041140–1041405 |
| columns | 331968 | 0 | 331968 | 331956–332221 |
| typed-columns | 50241 | 70542 | 120783 | 120783–121198 |
| binary-columns | 50241 | 70542 | 120783 | 114094–120795 |
| bit-packed-columns | 50250 | 52908 | 103158 | 103128–103817 |
| json-tree | 2190478 | 0 | 2190478 | 2183575–2191161 |
| columnar-tree | 2190824 | 0 | 2190824 | 2183594–2191205 |
| binary-tree | 2190578 | 0 | 2190578 | 2190407–2192181 |

`typed-columns` and `binary-columns` retain the same adaptive typed JS arrays. The first loads ordinary JSON columns; the second decodes the three separate fixed-schema BSON binary fields, compacts them, and discards the wider temporary arrays. Both parse the dictionary from JSON for comparable string allocation. Storage widths do not dictate retained JS widths. The tree rows retain only the loaded editing tree; snapshot inputs are excluded.

The editing tree is not packed by this change. Differences between tree rows can include ID string sharing and allocation effects; they are not evidence of a different tree layout. Save/load allocation peaks, real browser heaps, Mongo compression, indexes, replicas and billing are not measured.

`bit-packed-columns` retains three packed byte arrays and scalar accessors. Experimental limits: 8192 dictionary entries, starts 0..2047, signed counts -2048..2047 excluding zero. No automatic fallback or widening.

Exact binary, columnar JSON, and editing-tree round trips passed for all three trace variants.
```
