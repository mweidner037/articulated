# Benchmarks

For the expanded native-container exploration, start with [storage, loading, and editing](exploration.md). It includes the complete Kleppmann paper-edit stream from an empty document, native objects/tuples/columns, eight-character IDs, separate browser memory and physical Mongo measurements, and reproducible raw results. These are draft experiments, not a production migration.

Start with [the paired-format Mongo and real-browser benchmark](browser.md): one integrated browser chart per workload, plus a separate Mongo storage comparison. JSON and binary encodings are paired by logical structure; browser totals include decoding, ID hydration, editor creation, layout and a rendering opportunity, with GC and memory diagnostics alongside them.

Benchmarks of articulated's IdList and other text-editor data structures on local text-editing traces.

The goal is to evaluate the cost of per-character IDs stored in an IdList, both in absolute terms (is the cost reasonable for modern hardware?) and relative to:

- Traditional text-editor data structures - IdList adds to their cost.
- Existing optimized Conflict-free Replicated Data Types (CRDTs) - these show what's currently possible when storing the text, per-character IDs, and additional collaborative metadata.

The benchmarks simulate local editing, replaying a trace of single-character insertions and deletions against each data structure. They measure the time per operation, memory usage for the final state, and cost of saving and loading the final state.

Traces:

1. kleppmannReal: A real-world editing trace by Martin Kleppmann, from https://github.com/automerge/automerge-perf. It consists of 182,315 insertions and 77,463 deletions, for a final document size of 104,852 characters - the LaTeX source of [a 17 page paper](https://arxiv.org/abs/1608.03960).

Results are in [results.md](./results.md). They were generated on an M4 MacBook Pro with 48 GB of RAM, running pnpm 11.7.0 and node 24.16.0.

For the separate saved-state and translation-layer experiment, see
[Full picture: Mongo storage, JS memory, and save/load costs](./full_picture.md).
It includes concrete Mongo examples, one complete comparison table, direct-versus-adapter
controls, raw results, and reproduction commands. This is a draft exploration,
not a proposed production format.

## Commands

Run an individual benchmark, printing its data to stdout and appending it to `results/data.csv`:

```bash
pnpm worker <trace> <refreshInterval> <experiment> <algorithm>
```

Run multiple benchmarks (each in a separate worker process), first erasing any matching rows in `results/data.csv` and then appending new ones as the benchmarks run:

```bash
pnpm start <numTrials> <traces> <refreshIntervals> <experiments> <algorithms>
```

Run all benchmarks with 10 trials each:

```bash
pnpm start 10 ALL ALL ALL ALL
```

Generate `results.md` from `results/data.csv`:

```bash
pnpm results
```

## Adding a trace

Create the trace as a JSON file in `src/traces/`. It must match the `TextTrace` TypeScript type, except that you don't need the `proseMirrorEdits` field - instead, generate that by running

```
pnpm finish-trace <traceName>
```

where the trace file is `src/traces/${traceName}.json`.
