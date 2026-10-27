# Numeric arrays inside an editable runtime: bounded probe

This experiment measures **compact F05 JSON → initialized numeric containers**, then immutable numeric-page updates. Cheap translation is acceptable: the load outcome is **parse + initialize together**, not conversion time in isolation. This does **not** implement or measure a complete IdList, editor, character-edit stream, or Mongo representation.

## What the measurements support

- **32-bit typed arrays did not deliver a material memory saving here.** Ordinary 128-run pages used 1.032 MB loaded; the dense-only typed alternative used 1.049 MB. That 17 KB difference is small relative to the largest observed within-checkpoint GC measurement range (18.4 KB). Treat these as approximately tied, not proof of a universal penalty or advantage. Typed-all pages were clearly larger, at 1.263 MB, because thousands of small per-ID row-index arrays also became typed-array objects.
- **Bounded copying mattered much more than scalar representation.** Retaining 100 previous versions cost 5.678 MB total with ordinary flat arrays versus 1.189 MB with ordinary 128-run pages. Typed-all flat arrays still retained 5.891 MB. Page sizes are a separate factor; the ordinary/typed comparison within each page size uses identical topology.
- **Retain compact JSON and choose runtime storage on its merits.** The dense-only path's parse + initialize median was 3.85 ms, versus 3.80 ms for ordinary 128-run pages. Conversion is not a meaningful disqualifier by itself. This particular typed variant simply did not establish a compensating memory/editing win. A complete editor implementation, narrower validated element widths, and different workloads could change the result; none is claimed measured here.

## Results

Decimal MB include **JS heap + backing storage**, minus the prepared-page baseline. Loaded memory and load-time medians use six fresh-process observations per configuration. Each editing/history result uses three trials. Timings are whole **2,000-toggle batches**, not per-keystroke latency or rendered-editor time.

| Runtime numeric arrays | Runs/page | Parse + initialize ms | Loaded MB | After toggles MB | +100 versions MB | Toggles ms, no history | Toggles ms, +100 versions |
|---|---:|---:|---:|---:|---:|---:|---:|
| Ordinary integer arrays | Flat | 3.70 | 0.942 | 0.959 | 5.678 | 3.90 | 16.70 |
| Ordinary integer arrays | 128 | 3.80 | 1.032 | 1.047 | 1.189 | 0.80 | 1.10 |
| Ordinary integer arrays | 256 | 3.70 | 1.009 | 1.025 | 1.181 | 0.80 | 1.20 |
| Typed-all numeric arrays | Flat | 4.80 | 1.137 | 1.152 | 5.891 | 8.00 | 7.70 |
| Typed-all numeric arrays | 128 | 4.90 | 1.263 | 1.278 | 1.441 | 1.60 | 1.60 |
| Typed-all numeric arrays | 256 | 4.70 | 1.226 | 1.241 | 1.415 | 1.40 | 1.50 |
| Dense-only typed columns | 128 | 3.85 | 1.049 | 1.064 | 1.224 | 1.50 | 1.60 |

<details>
<summary>Observed timing ranges and memory after releasing history</summary>

These are observed minimum–maximum ranges, not confidence intervals. All trials, including the dense-only 5.50 ms initial load, remain in the raw data.

| Runtime / page size | Parse + initialize ms | Toggle batch ms, no history | Toggle batch ms, +100 versions | Retained MB after releasing history |
|---|---:|---:|---:|---:|
| Ordinary / flat | 3.50–3.90 | 3.80–3.90 | 16.30–17.20 | 0.958 |
| Ordinary / 128 | 3.60–4.10 | 0.80–0.90 | 1.10–1.10 | 1.048 |
| Ordinary / 256 | 3.50–3.80 | 0.80–0.90 | 1.10–1.30 | 1.026 |
| Typed-all / flat | 4.60–5.00 | 7.40–8.70 | 7.60–10.40 | 1.153 |
| Typed-all / 128 | 4.70–5.20 | 1.50–1.70 | 1.50–1.60 | 1.283 |
| Typed-all / 256 | 4.60–4.80 | 1.30–1.50 | 1.50–1.60 | 1.242 |
| Dense-only / 128 | 3.70–5.50 | 1.40–1.60 | 1.50–1.80 | 1.065 |

</details>

## What is held in memory

All configurations start from the same final canonical opaque-eight-character-ID F05 JSON: **11,757 runs, 5,382 distinct whole IDs, zero sparse counter exceptions in this particular final state**, maximum absolute run count 1,396. No UUID assumptions or ID-byte packing are used.

Each page contains ordinary string references, signed count and explicit start-counter columns, and a `Map<string, row-index-array>`. A flat page directory and cumulative visible-length prefix cover the pages. Identical validation detects malformed columns, duplicate identity intervals, and out-of-range scalars; sparse counters are reconstructed and every map/index is built during initialization.

- **Ordinary:** all numeric arrays are ordinary JS integer arrays.
- **Typed-all:** counts use `Int32Array`; starts, prefix sums, and every per-ID row-index array use `Uint32Array`.
- **Dense-only:** counts/starts/prefix are typed, but small per-ID row-index lists remain ordinary arrays. At 128 runs/page there are 6,257 numeric arrays; only 185 dense arrays become typed in this variant. This avoids conflating column storage with thousands of tiny buffer wrappers.

Every update flips one existing run's visibility. It copies the affected count page, page object, flat page directory and prefix array; immutable strings, start-counter arrays and identity maps are shared. This intentionally does **not** test run insertion, splitting, merging, counter changes, ID generation, searching, or rendering. It is not a substitute for the full canonical editor benchmark.

Both ordinary and typed variants enforce the same narrow domain before allocation: nonzero signed count magnitude ≤2³¹−1, unsigned counters/endpoints/indexes/prefixes ≤2³²−1. Values outside this domain throw instead of wrapping/truncating. A production implementation would need a validated wider representation or safe-number fallback; the probe implements neither. It does not claim 32-bit arrays beat smaller-width/adaptive representations.

## Measurement checks

- 42 jobs, three fresh browser processes per configuration/history combination; all completed. Explicit CPU-throttle rate 1; command-scoped display/idle-sleep prevention. No concurrent benchmark work.
- Three consecutive forced-GC observations at each memory stage; raw heap and backing counters preserved separately. An 8 MiB buffer increased backing storage by 8,388,634 bytes and used heap by only 26,912 bytes, verifying that summing these counters does not double-count the large buffer.
- Parsed source and verification scratch references are released before memory observations. No full trace/reference text is transferred to measured pages. Observable checksums agree across every configuration: loaded `2573197895`, edited `52662555`.
- Every current state and three sampled retained versions are checked against independently replayed count signs, start counters, string identities, row indexes, and prefix sums. History release is separately measured. No forced GC occurs within the timed update loop.
- Small batch differences approach timer granularity; do not infer a noticeable editor responsiveness improvement from them. Fresh-load observations, GC noise, and all timing outliers are preserved in [browser.json](browser.json).

## Reproduction

From the repository root, using Node 24:

```sh
TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json node --import tsx --test benchmarks/src/browser/direct-array-probe.test.ts
TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json DIRECT_ARRAY_OUTPUT=direct-array-probe-reproduction caffeinate -di node --import tsx benchmarks/src/browser/direct-array-probe.ts
```

The runner refuses to overwrite an existing `browser.json`; use a fresh `DIRECT_ARRAY_OUTPUT` directory name for each rerun. It binds only a local test server and does not connect to Mongo or alter existing implementations. It also writes a reusable final-state snapshot to `/private/tmp/articulated-direct-canonical-opaque8.json`, refusing a conflicting existing snapshot.

Fixture SHA256: `b3cc04d6e0a3261d25b13f139d4fdde5c9bd44f956eb6797b79f74fc7583299b`. F05 JSON SHA256: `57658b8baa5eb49edf8782347287083a7ac5a7ae36298e8ac1157c4740f917b8`. Raw metadata records the browser-bundle hash, runtime/platform, source/license attribution, job timestamps and host load averages.
