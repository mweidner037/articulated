# Cross-proposal JS/BSON benchmark

Measured on Node 22.22.2 / V8 12.4.254.21-node.39, macOS arm64.
This is PR #24's `benchmarks/storage.ts` plus the signed-count-object row.
Same trace, 5 samples x 20 copies, fresh process per case, heapUsed + arrayBuffers.
These are logical BSON and retained JS bytes, not Mongo disk measurements.

## shared-prefix

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format                                                      | BSON bytes |
| ----------------------------------------------------------- | ---------: |
| Objects                                                     |    1244366 |
| Objects with signed count (no isDeleted)                    |    1103282 |
| Four-tuples                                                 |     903413 |
| Dictionary + ordinary Mongo arrays (automatic Int32)        |     627016 |
| Dictionary + ordinary Mongo arrays (explicit Int32)         |     627016 |
| Dictionary + ordinary Mongo arrays (forced Double)          |     768100 |
| Dictionary + three BSON Binary arrays                       |     507505 |
| Dictionary + three bit-packed Binary arrays (13/11/12 bits) |     325273 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 272365 dictionary/document/array framing bytes = 627016 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 272365 dictionary/document/binary framing bytes = 507505 bytes.

| JS representation    | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| -------------------- | ---------: | -----------: | ----------: | --------------: |
| objects              |    1410918 |            0 |     1410918 | 1410906–1411184 |
| signed-count-objects |    1316862 |            0 |     1316862 | 1316850–1317128 |
| tuples               |    1693086 |            0 |     1693086 | 1693074–1693352 |
| columns              |     626890 |            0 |      626890 |   626890–627171 |
| typed-columns        |     345174 |        70542 |      415716 |   415716–416144 |
| binary-columns       |     345174 |        70542 |      415716 |   415716–416339 |
| bit-packed-columns   |     345184 |        52908 |      398092 |   398062–398748 |
| json-tree            |    2747046 |            0 |     2747046 | 2739829–2747292 |
| columnar-tree        |    2485837 |            0 |     2485837 | 2484669–2486485 |
| binary-tree          |    2485548 |            0 |     2485548 | 2478727–2486712 |

## uuid

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format                                                      | BSON bytes |
| ----------------------------------------------------------- | ---------: |
| Objects                                                     |    1199878 |
| Objects with signed count (no isDeleted)                    |    1058794 |
| Four-tuples                                                 |     858925 |
| Dictionary + ordinary Mongo arrays (automatic Int32)        |     606598 |
| Dictionary + ordinary Mongo arrays (explicit Int32)         |     606598 |
| Dictionary + ordinary Mongo arrays (forced Double)          |     747682 |
| Dictionary + three BSON Binary arrays                       |     487087 |
| Dictionary + three bit-packed Binary arrays (13/11/12 bits) |     304855 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 251947 dictionary/document/array framing bytes = 606598 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 251947 dictionary/document/binary framing bytes = 487087 bytes.

| JS representation    | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| -------------------- | ---------: | -----------: | ----------: | --------------: |
| objects              |    1410918 |            0 |     1410918 | 1410906–1411184 |
| signed-count-objects |    1316862 |            0 |     1316862 | 1316850–1317128 |
| tuples               |    1693086 |            0 |     1693086 | 1693074–1693352 |
| columns              |     626890 |            0 |      626890 |   626890–627171 |
| typed-columns        |     345174 |        70542 |      415716 |   415716–416144 |
| binary-columns       |     345174 |        70542 |      415716 |   409019–415728 |
| bit-packed-columns   |     345179 |        52908 |      398087 |   398062–398748 |
| json-tree            |    2747130 |            0 |     2747130 | 2746549–2748065 |
| columnar-tree        |    2485796 |            0 |     2485796 | 2485350–2486108 |
| binary-tree          |    2485446 |            0 |     2485446 | 2480364–2486171 |

## nanoid

11757 runs, 5382 distinct IDs; independent binary arrays use Uint32 indexes and Float64 starts/signed counts (4/8/8 bytes per run). No column-type metadata.

| Format                                                      | BSON bytes |
| ----------------------------------------------------------- | ---------: |
| Objects                                                     |     870682 |
| Objects with signed count (no isDeleted)                    |     729598 |
| Four-tuples                                                 |     529729 |
| Dictionary + ordinary Mongo arrays (automatic Int32)        |     455902 |
| Dictionary + ordinary Mongo arrays (explicit Int32)         |     455902 |
| Dictionary + ordinary Mongo arrays (forced Double)          |     596986 |
| Dictionary + three BSON Binary arrays                       |     336391 |
| Dictionary + three bit-packed Binary arrays (13/11/12 bits) |     154159 |

Ordinary Mongo arrays: 141084 numeric payload bytes + 213567 numeric element type/index-key bytes + 101251 dictionary/document/array framing bytes = 455902 bytes.

Separate BSON binaries: 235140 numeric payload bytes + 101251 dictionary/document/binary framing bytes = 336391 bytes.

| JS representation    | Heap bytes | Buffer bytes | Total bytes |   Total min–max |
| -------------------- | ---------: | -----------: | ----------: | --------------: |
| objects              |     758984 |            0 |      758984 |   758972–759250 |
| signed-count-objects |     664928 |            0 |      664928 |   664916–665194 |
| tuples               |    1041152 |            0 |     1041152 | 1041140–1041418 |
| columns              |     331956 |            0 |      331956 |   331956–332237 |
| typed-columns        |      50241 |        70542 |      120783 |   120783–121210 |
| binary-columns       |      50241 |        70542 |      120783 |   114059–120795 |
| bit-packed-columns   |      50292 |        52908 |      103200 |   103138–103818 |
| json-tree            |    2190825 |            0 |     2190825 | 2183550–2191269 |
| columnar-tree        |    2190446 |            0 |     2190446 | 2183602–2191367 |
| binary-tree          |    2190520 |            0 |     2190520 | 2183861–2191641 |

`typed-columns` and `binary-columns` retain the same adaptive typed JS arrays. The first loads ordinary JSON columns; the second decodes the three separate fixed-schema BSON binary fields, compacts them, and discards the wider temporary arrays. Both parse the dictionary from JSON for comparable string allocation. Storage widths do not dictate retained JS widths. The tree rows retain only the loaded editing tree; snapshot inputs are excluded.

The editing tree is not packed by this change. Differences between tree rows can include ID string sharing and allocation effects; they are not evidence of a different tree layout. Save/load allocation peaks, real browser heaps, Mongo compression, indexes, replicas and billing are not measured.

`bit-packed-columns` retains three packed byte arrays and scalar accessors. Experimental limits: 8192 dictionary entries, starts 0..2047, signed counts -2048..2047 excluding zero. No automatic fallback or widening.

Exact binary, columnar JSON, and editing-tree round trips passed for all three trace variants.
