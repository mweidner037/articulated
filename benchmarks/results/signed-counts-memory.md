# Signed-count implementation benchmark

Measured on Node 22.22.2 / V8 12.4.254.21-node.39, macOS arm64.
Five samples of twenty retained copies, fresh child process per case, three warmups.
Total = heapUsed + arrayBuffers after GC, excluding source inputs. Node proxy,
not a browser measurement, RSS, or peak save/load allocation. Run
`npm run benchmarks:storage` using Node 22.22.2.

## nanoid

11757 runs; 5382 distinct IDs.

| Format               | Logical BSON bytes | Retained JS bytes |      JS min-max |
| -------------------- | -----------------: | ----------------: | --------------: |
| objects              |             870682 |            758972 |   726090–759182 |
| signed-count-objects |             729598 |            664916 |   632047–665126 |
| original-tree        |                  — |           2190487 | 2150570–2190499 |
| signed-count-tree    |                  — |           2190487 | 2150612–2190511 |

## uuid

11757 runs; 5382 distinct IDs.

| Format               | Logical BSON bytes | Retained JS bytes |      JS min-max |
| -------------------- | -----------------: | ----------------: | --------------: |
| objects              |            1199878 |           1410905 | 1378024–1411116 |
| signed-count-objects |            1058794 |           1316849 | 1283981–1317060 |
| original-tree        |                  — |           2746717 | 2706798–2746729 |
| signed-count-tree    |                  — |           2746725 | 2714174–2746741 |

## shared-prefix

11757 runs; 5382 distinct IDs.

| Format               | Logical BSON bytes | Retained JS bytes |      JS min-max |
| -------------------- | -----------------: | ----------------: | --------------: |
| objects              |            1244366 |           1410905 | 1378024–1411116 |
| signed-count-objects |            1103282 |           1316849 | 1283981–1317060 |
| original-tree        |                  — |           2746717 | 2714132–2746729 |
| signed-count-tree    |                  — |           2746717 | 2706767–2746741 |

All JSON, BSON, editing-tree, and live-ID round trips passed. Live tree layout unchanged; timing and peak memory not measured.
