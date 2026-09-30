# Benchmarks

Benchmarks of IdList and other text-editor data structures on local text-editing traces.

The goal is to evaluate the cost of per-character IDs stored in an IdList, both in absolute terms (is the cost reasonable for modern hardware?) and relative to:

- Traditional text-editor data structures - IdList adds to their cost.
- Existing optimized Conflict-free Replicated Data Types (CRDTs) - these show what's currently possible when storing the text, per-character IDs, and additional collaborative metadata.

The benchmarks simulate local editing, replaying a trace of single-character insertions and deletions against each data structure. They measure the time per operation, memory usage for the final state, and cost of saving and loading the final state.

Traces:

1. kleppmannReal: A real-world editing trace by Martin Kleppmann, from https://github.com/automerge/automerge-perf. It consists of 182,315 insertions and 77,463 deletions, for a final document size of 104,852 characters - the LaTeX source of [a 17 page paper](https://arxiv.org/abs/1608.03960).

## Commands

Run an individual benchmark, printing its data to stdout and appending it to `results/data.csv`:

```bash
pnpm worker <trace> <refreshInterval> <measurement> <algorithm>
```

Run multiple benchmarks (each in a separate worker process), erasing any matching rows in `results/data.csv` and then appending new ones:

```bash
pnpm start <numTrials> <traces> <refreshIntervals> <measurements> <algorithms>
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
