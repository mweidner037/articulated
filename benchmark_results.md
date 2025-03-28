# Benchmark Results
Output of
```bash
npm run benchmarks -s > benchmark_results.md
```
Each benchmark applies the [automerge-perf](https://github.com/automerge/automerge-perf) 260k edit text trace and measures various stats, modeled on [crdt-benchmarks](https://github.com/dmonad/crdt-benchmarks/)' B4 experiment.

For perspective on the save sizes: the final text (excluding deleted chars) is 104,852 bytes, or 27556 bytes GZIP'd. It is ~15 pages of two-column text (in LaTeX).

Note: This is not a fair comparison to list/text CRDTs. The executions benchmarked here do not accommodate concurrency and would need to be used in conjunction with a server reconciliation strategy, which adds its own overhead. Also, we do not send or store the actual text, only the corresponding ElementIds.

## Insert-After, JSON Encoding

Send insertAfter and delete operations over a reliable link (e.g. WebSocket) - ElementId only.
Updates and saved states use JSON encoding, with optional GZIP for saved states.

- Sender time (ms): 2562
- Avg update size (bytes): 147.3
- Receiver time (ms): 2570
- Save time (ms): 14
- Save size (bytes): 1177551
- Load time (ms): 34
- Save time GZIP'd (ms): 55
- Save size GZIP'd (bytes): 65894
- Load time GZIP'd (ms): 60
- Mem used estimate (MB): 2.8

## Insert-After, Custom Encoding

Send insertAfter and delete operations over a reliable link (e.g. WebSocket) - ElementId only.
Updates use a custom string encoding; saved states use JSON with optional GZIP.

- Sender time (ms): 2202
- Avg update size (bytes): 45.6
- Receiver time (ms): 3818
- Save time (ms): 13
- Save size (bytes): 1177551
- Load time (ms): 27
- Save time GZIP'd (ms): 56
- Save size GZIP'd (bytes): 65897
- Load time GZIP'd (ms): 58
- Mem used estimate (MB): 2.8
