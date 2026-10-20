import { IdList } from "articulated";
import { EJSON } from "bson";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { writeCharts } from "./charts";
import { codecs } from "./codecs";
import { example } from "./fixture";

interface Measurement {
  mean: number;
  ci95: number | null;
  max: number;
  samples: number[];
}
interface JSRow {
  name: string;
  snapshotBytes: number;
  liveBytes: number;
  saveMs: Measurement;
  mongoSaveMs: Measurement;
  openSnapshotMs: Measurement;
  loadMs: Measurement;
  mongoLoadMs: Measurement;
  gzipSaveMs: Measurement;
  gzipLoadMs: Measurement;
  saveObservedHighWaterBytes: Measurement;
  loadObservedHighWaterBytes: Measurement;
  mongoLoadObservedHighWaterBytes: Measurement;
  serializedBytes: number;
  gzipBytes: number;
}
interface MongoRow {
  codec: string;
  compressor: string;
  gzip: boolean;
  storageBytes: number;
  freeBytes: number;
  compact: { ok: number; bytesFreed: number };
  compactAfterCheckpoint: { ok: number; bytesFreed: number };
}
const directory = path.resolve(__dirname, "../../results/full-picture");
const js = JSON.parse(
  fs.readFileSync(path.join(directory, "js.json"), "utf8"),
) as {
  generatedAt: string;
  runtime: string;
  v8: string;
  cpu: string;
  trials: number;
  runs: number;
  bunches: number;
  clients: number;
  rows: JSRow[];
};
const mongo = JSON.parse(
  fs.readFileSync(path.join(directory, "mongo.json"), "utf8"),
) as { version: string; documents: number; rows: MongoRow[] };
assert.equal(js.rows.length, codecs.length);
assert.equal(mongo.rows.length, codecs.length * 4);
assert(mongo.rows.every((r) => r.compact.ok === 1));
assert(mongo.rows.every((r) => r.compactAfterCheckpoint.ok === 1));
const byName = new Map(js.rows.map((r) => [r.name, r]));
const aliases: Record<string, string> = {
  "binary-direct": "binary-adapter",
  "bit-direct": "bit-adapter",
  "split-proto-direct": "split-proto",
};
function disk(name: string, compressor: string, gzip: boolean) {
  const row = mongo.rows.find(
    (r) =>
      r.codec === (aliases[name] ?? name) &&
      r.compressor === compressor &&
      r.gzip === gzip,
  );
  assert(row);
  return row.storageBytes / mongo.documents / 1000;
}
writeCharts(js.rows, disk);
const number = (n: number) => n.toFixed(1);
const ms = (s: Measurement) =>
  `${s.mean.toFixed(2)}${s.ci95 === null ? "" : ` ± ${s.ci95.toFixed(2)}`}`;
const headers = [
  "Format / path",
  "Mongo S KB",
  "Mongo Z KB",
  "Gzip Mongo S KB",
  "Gzip Mongo Z KB",
  "Snapshot JS KB",
  "Editor JS KB",
  "Open snapshot ms",
  "Save ms",
  "Mongo save ms",
  "Load editor ms",
  "Mongo load ms",
  "Observed save MB",
  "Observed load MB",
  "Observed Mongo load MB",
  "Serialized KB",
  "Gzip KB",
  "Gzip save ms",
  "Gzip load ms",
];
const lines = [
  "# Full picture: saved-state format AND translation cost",
  "",
  "**Archived Node-only experiment.** For browser conclusions, use [the paired-format browser benchmark](browser.md), which measures real Chromium rendering, GC, and memory together, with Mongo storage evaluated separately. The Node microbenchmarks below are not end-to-end browser measurements.",
  "",
  "Draft experiment on top of [Matthew’s PR #30](https://github.com/mweidner037/articulated/pull/30). Not a production format or API proposal.",
  "",
  "The question is not only ‘how small is the output?’ It is also ‘what must be allocated and computed to get from that output to an editable IdList—and back?’",
  "",
  "## Start here: the visual comparison",
  "",
  "These first two charts select the original objects, ordinary columns, Matthew’s split/omitted-counter protobuf, and our two direct binary-column paths. Every format appears in the full charts below. Lower is better. This is one structured-ID editing trace, not a production corpus or an opaque-ID benchmark.",
  "",
  "![Selected formats: measured Snappy Mongo storage and time from BSON to editable IdList](results/full-picture/charts/overview.svg)",
  "",
  "**Storage and load speed favor different choices.** Matthew’s split protobuf is much smaller in Mongo. Direct binary columns load faster here. Ordinary columns reduce snapshot memory but actually occupy more Snappy Mongo storage than the original objects. The time panel includes BSON deserialization and building the usable editing tree; it excludes database/network I/O.",
  "",
  "![Snapshot versus editable IdList memory on the same scale](results/full-picture/charts/memory-overview.svg)",
  "",
  "**Your native-format concern is real: all these paths still build the existing editing tree.** Compact snapshots reduce retained snapshot memory, but the loaded editable IdList remains roughly 2.45–2.64 MB. The panels are alternative retained states, not two amounts to add together. These are Node/V8 measurements, not browser measurements.",
  "",
  "![Identical-byte adapter versus direct paths: save and load timings](results/full-picture/charts/translation.svg)",
  "",
  "**Direct conversion is not automatically cheaper in both directions.** Removing the intermediate SavedIdList objects speeds up binary/bit-packed loads here, but their two-pass direct writers save more slowly. The split-protobuf direct path still needs decoding and ID/counter reconstruction; it does not show a clear load benefit. Whiskers show within-process 95% intervals, not uncertainty across machines or workloads.",
  "",
  "Jump to [actual Mongo examples](#first-what-is-actually-stored), [charts of every option](#every-option-visually), [the complete numeric table](#one-table-storage-retained-memory-working-memory-and-time), or [measurement definitions](#definitions-and-method). The existing full table retains gzip/output-size and sampled working-memory metrics; no wire-size estimate is used to stand in for Mongo storage.",
  "",
  "## First: what is actually stored?",
  "",
  "Every example below represents these same runs. Negative counts replace the deletion boolean in the alternative formats; the final run continues alice_0 at counter 3.",
  "",
  "```json",
  JSON.stringify(example, null, 2),
  "```",
  "",
];
for (const codec of codecs) {
  if (aliases[codec.name]) continue;
  const payload = codec.save(IdList.load(example));
  lines.push(`### ${codec.label}`, "");
  if (codec.kind === "proto")
    lines.push(
      "Decoded contents before protobuf encoding:",
      "",
      "```json",
      JSON.stringify(codec.snapshot(payload), null, 2),
      "```",
      "",
    );
  lines.push(
    "Mongo document (Extended JSON; `$binary` displays raw BSON Binary, not a stored Base64 string):",
    "",
    "```json",
    EJSON.stringify({ state: codec.toMongo(payload) }, null, 2, {
      relaxed: true,
    }),
    "```",
    "",
  );
  if (codec.name === "binary-adapter")
    lines.push(
      "Each numeric field is its own little-endian binary: unsigned 32-bit indexes/starts, signed 32-bit counts. JS uses Uint32Array/Int32Array views where alignment allows; otherwise it copies into an aligned buffer. Both paths retain the same snapshot layout.",
      "",
    );
  if (codec.name === "bit-adapter")
    lines.push(
      "Each numeric field is its own packed binary: 13-bit dictionary indexes, 11-bit starts, 12-bit zigzag signed counts. JS retains the bytes and reads fields with bit extraction. No per-run object array is required. Limits: 8,192 dictionary entries; starts ≤ 2,047; positive counts ≤ 2,047; deleted magnitudes ≤ 2,048. Overflow throws; no automatic widening.",
      "",
    );
}
lines.push(
  "Binary-direct, bit-direct, and split-proto-direct have **exactly the same saved bytes** as their adapter counterparts. Only the traversal/conversion path changes. Unit tests verify byte equality, and direct-path tests fail if they invoke the object-based save/load adapters.",
  "",
  "For the gzip storage choice, the whole serialized value is gzipped (mtime: 0 for reproducibility) and stored as one BSON Binary. This is a separate physical Mongo layout, not an assumption about WiredTiger compression.",
  "",
  "## Every option, visually",
  "",
  "The same row order and labels are used throughout. ‘Split / protobuf’ means Matthew’s split + omit format. ‘Dictionary / protobuf’ also includes omit. Direct and adapter variants share one storage row because their saved bytes are identical; both appear in memory and time charts. These native-layout charts do not include application-level gzip; its separately measured Mongo storage and CPU costs remain in the full table.",
  "",
  "![All persisted formats: actual Mongo Snappy and Zstd storage](results/full-picture/charts/all-storage.svg)",
  "",
  "![All formats and paths: retained snapshot and editable IdList memory](results/full-picture/charts/all-memory.svg)",
  "",
  "![All formats and paths: save and BSON-to-editor timings](results/full-picture/charts/all-time.svg)",
  "",
  "## One table: storage, retained memory, working memory, and time",
  "",
  `Measured ${js.generatedAt.slice(0, 10)} on ${js.cpu}, Node ${js.runtime}, V8 ${js.v8}, MongoDB ${mongo.version}. Decimal KB/MB. ${js.runs.toLocaleString("en-US")} runs, ${js.bunches.toLocaleString("en-US")} distinct bunch IDs, ${js.clients} distinct clients.`,
  "",
  "S = Snappy; Z = Zstd. Timing cells show mean ± 95% t interval across 10 warmed trials within an isolated process per format. Snapshot and editor memory are different retention choices, **not additive**. Observed working-memory columns are sampled high-water increases, **not exact peaks**.",
  "",
  `| ${headers.join(" | ")} |`,
  `| ${headers.map((_, i) => (i ? "---:" : "---")).join(" | ")} |`,
);
for (const codec of codecs) {
  const r = byName.get(codec.name)!;
  const cells = [
    codec.label,
    number(disk(r.name, "snappy", false)),
    number(disk(r.name, "zstd", false)),
    number(disk(r.name, "snappy", true)),
    number(disk(r.name, "zstd", true)),
    number(r.snapshotBytes / 1000),
    number(r.liveBytes / 1000),
    ms(r.openSnapshotMs),
    ms(r.saveMs),
    ms(r.mongoSaveMs),
    ms(r.loadMs),
    ms(r.mongoLoadMs),
    number(r.saveObservedHighWaterBytes.max / 1e6),
    number(r.loadObservedHighWaterBytes.max / 1e6),
    number(r.mongoLoadObservedHighWaterBytes.max / 1e6),
    number(r.serializedBytes / 1000),
    number(r.gzipBytes / 1000),
    ms(r.gzipSaveMs),
    ms(r.gzipLoadMs),
  ];
  lines.push(`| ${cells.join(" | ")} |`);
}
lines.push(
  "",
  "### Isolating the translation layer",
  "",
  "These pairs have identical persistence formats. The table below compares measured mean times; a negative change means faster. It is descriptive, not a between-process significance test.",
  "",
  "| Same bytes | Adapter save ms | Direct save ms | Change | Adapter load ms | Direct load ms | Change |",
  "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
);
for (const [direct, adapter] of Object.entries(aliases)) {
  const a = byName.get(adapter)!,
    d = byName.get(direct)!;
  const change = (x: number, y: number) => `${((y / x - 1) * 100).toFixed(1)}%`;
  lines.push(
    `| ${direct} | ${a.saveMs.mean.toFixed(2)} | ${d.saveMs.mean.toFixed(2)} | ${change(a.saveMs.mean, d.saveMs.mean)} | ${a.loadMs.mean.toFixed(2)} | ${d.loadMs.mean.toFixed(2)} | ${change(a.loadMs.mean, d.loadMs.mean)} |`,
  );
}
lines.push(
  "",
  "## Main findings on this fixture",
  "",
  `- Matthew’s split/omitted-counter protobuf occupies **${number(disk("split-proto", "snappy", false))} KB with Snappy and ${number(disk("split-proto", "zstd", false))} KB with Zstd**, versus ${number(disk("objects", "snappy", false))}/${number(disk("objects", "zstd", false))} KB for ordinary objects. These are the native Mongo layouts, before any application-level gzip.`,
  `- Keeping the binary-column bytes identical, direct loading changes **${byName.get("binary-adapter")!.loadMs.mean.toFixed(2)} → ${byName.get("binary-direct")!.loadMs.mean.toFixed(2)} ms**. Saving changes **${byName.get("binary-adapter")!.saveMs.mean.toFixed(2)} → ${byName.get("binary-direct")!.saveMs.mean.toFixed(2)} ms**. Removing the intermediate array is not automatically a win in both directions.`,
  `- The split-protobuf pair loads in **${byName.get("split-proto")!.loadMs.mean.toFixed(2)} vs ${byName.get("split-proto-direct")!.loadMs.mean.toFixed(2)} ms**. Protobuf decoding and counter/ID reconstruction remain even without the SavedIdList array; this is not a zero-copy typed-array path.`,
  `- Loaded editors retain **${(Math.min(...js.rows.map((r) => r.liveBytes)) / 1e6).toFixed(2)}–${(Math.max(...js.rows.map((r) => r.liveBytes)) / 1e6).toFixed(2)} MB** across the matrix. Compact snapshot storage is a separate benefit; it does not remove the existing editing tree’s cost.`,
  "",
  "## How to read the result",
  "",
  "- **Compact persistence is not a compact editing tree.** Every load ends with the same existing IdList data structure. The retained editor is much larger than its saved payload, and its actual heap footprint can vary with string sharing and runtime representation. This experiment does not replace the tree with packed columns.",
  "- **Direct does not mean free.** Binary/bit writers make two tree walks (size/dictionary, then fill exact-size buffers). Direct protobuf grows column arrays and still encodes/decodes protobuf; it only removes SavedIdList materialization. Faster loads do not guarantee faster saves.",
  "- **Typed-array views are conditional zero-copy.** Unaligned BSON offsets require aligned copies; these are included in Mongo-load time. Bit-packed fields need extraction. Omitted starts require sequential reconstruction with a Map. These costs are measured, not assumed away.",
  "- **Do not infer Mongo size from serialized size.** The ordinary-column and gzip-as-binary layouts are measured separately under both compressors. No logical BSON-size column is used as a storage proxy.",
  "- **Identical format means identical storage choice.** The main table reuses each adapter’s measured disk rows for its direct counterpart. Both were actually measured independently; their allocated file sizes differ because of allocation/checkpoint/free-space effects. Those differences are not compression gains. All 56 raw collection measurements are retained.",
  "- **This fixture favors structured-ID sharing.** It uses Matthew’s client/sequence generation and refresh-every-1000-operations setup. These numbers must not be applied to independent opaque IDs or to a production corpus without remeasurement.",
  "",
  "## Definitions and method",
  "",
  "### CPU and input equivalence",
  "",
  "The fixture replays kleppmannReal with seed 42 and a refresh every 1,000 operations using Matthew’s IdListAlgorithm. All rows receive the same canonical final state, loaded into the same tree before timed saves. This deliberately controls final-tree shape; it is not an exact reproduction of his final unrefreshed save experiment. His existing transform functions and generated protobuf encoders are reused. The delta-index protobuf variant named in his comment is absent from the pinned source; this report uses the implemented split-client-index variant, not an invented delta codec.",
  "",
  "- **Open snapshot:** parse/decode the saved value to its retained snapshot representation, without building an editing tree. Binary columns open views or make alignment copies; packed columns already are the view.",
  "- **Save:** tree to each codec’s saved value, as in Matthew’s API. JSON returns a string; protobuf returns bytes; separate binary columns return a dictionary and byte fields. The latter has no extra whole-document envelope at this step.",
  "- **Mongo save:** tree to natural BSON document bytes, including BSON serialization. JSON formats directly produce objects/columns here, avoiding an artificial stringify/parse round trip. This excludes database I/O.",
  "- **Load editor:** saved value to usable IdList, including parsing/decoding, translation, validation in the shared tree builder, and tree construction.",
  "- **Mongo load:** BSON bytes to usable IdList, including driver-compatible BSON deserialization. JSON layouts consume the deserialized fields directly rather than re-stringifying them. Excludes network, database query time, and WiredTiger decompression.",
  "- **Serialized/Gzip KB:** Matthew’s output-size metrics, included for completeness, not as Mongo storage estimates. JSON is UTF-8; protobuf uses its bytes; separate binary columns use a BSON document as the serialization container. Gzip save/load includes conversion to/from that container and compression/decompression.",
  "- Five warmups then ten measured operations, explicit GC before each timed trial, verification outside the timer. Format order is deterministically shuffled. Each format’s timings run in a fresh child process, but its ten samples share that process/JIT. Confidence intervals do not capture between-process, machine, browser or workload variation.",
  "",
  "### Memory",
  "",
  "Snapshot JS KB and Editor JS KB use Matthew’s V8 heap-snapshot dominator calculation. Each result is the median of three fresh processes after warmup. Temporary fixture, input and conversion references are released before capture; the unique holder owns the retained result. ArrayBuffer backing storage is counted by the heap snapshot; it is not added a second time. A 1 MiB typed-array calibration verifies that native backing bytes are present. Raw samples are in js.json.",
  "",
  "Observed save/load MB uses heapUsed + arrayBuffers above a pre-operation baseline, sampled at conversion boundaries, operation end, and every 1,024 runs in direct/custom paths. The table takes the largest of five observations. Input and pre-existing tree are excluded by the baseline, while outputs and not-yet-collected garbage are included. There is no forced GC inside the operation. Sampling can miss peaks and itself adds overhead; it runs separately from timings. This is neither allocation volume nor a precise live-memory peak. GC scheduling can dominate differences. No claim of zero transient memory follows from a low value.",
  "",
  "These are Node/V8 measurements, not actual Chrome heap measurements. No browser rendering, application state, concurrent editors, workers, or WASM memory is included.",
  "",
  "### Mongo",
  "",
  `A dedicated loopback MongoDB ${mongo.version} server with a fresh temporary dbPath, port 27184, and 0.25 GB WiredTiger cache. ${mongo.documents} documents per collection, each with a distinct deterministic 10-character client dictionary while preserving sequence numbers, sharing, and edit structure. Same numeric trace repeats: this is not a production corpus.`,
  "",
  "All collections are checked for document count. Documents 0 and 99 are read back through the actual Mongo driver and fully decoded/checked, including gzip layouts. Every collection runs compact with freeSpaceTargetMB: 1; after all writes are checkpointed with fsync, every collection is compacted again. A final locked fsync precedes measurement. Allocated .wt file sizes must exactly match $collStats.storageStats.storageSize, and creationString must identify the requested compressor. Reported KB is collection-file bytes divided by document count; integer _ids are included, indexes/journals/replicas/shared server overhead are not. Raw free and index bytes and both compact responses are preserved. Compact does not guarantee minimum file size or remove all free space.",
  "",
  "### Scope and correctness",
  "",
  "The library change is an explicitly experimental scalar visitor/consumer interface. save() remains unchanged; load() delegates to the same builder used by the direct consumer. All rows use this refactored builder, so reported times are not claimed to match the unmodified PR’s timings. No stable API, migration, editor-tree redesign or production rollout is proposed.",
  "",
  "The matrix validates complete saved runs after every measured load and after BSON/gzip round trips—not only list length. Focused tests cover sparse exceptions (including first/nonzero starts and backward counters), empty/zero-count/merged runs, edits after reload, scalar traversal through random edits, direct-vs-adapter byte equality, bypassing the object adapters, aligned/unaligned buffers, packed range limits and truncated fields, and duplicate-ID rejection. Fixed-width binary here is a new uint32/int32 experiment, not a rerun of the earlier Float64-based safe-integer codec. It rejects overflow. Protobuf inherits Matthew’s uint32/sint32 limits and non-hardened decoding; arbitrary IDs and out-of-range input need separate production validation. Packed inputs are not hardened against hostile input either.",
  "",
  "## Reproduce",
  "",
  "Use Node 24 and pnpm 11. Run CPU benchmarks without Mongo or other heavy jobs running.",
  "",
  "```sh",
  "pnpm install --frozen-lockfile",
  "pnpm --filter articulated build",
  "pnpm test",
  "pnpm --filter benchmarks full-picture:js",
  "```",
  "",
  "Start a separate isolated server (foreground works on macOS):",
  "",
  "```sh",
  "benchmark_dbpath=$(mktemp -d /private/tmp/articulated-full-picture.XXXXXX)",
  'mongod --dbpath "$benchmark_dbpath" --port 27184 --bind_ip 127.0.0.1 --wiredTigerCacheSizeGB 0.25',
  "```",
  "",
  "In another terminal, use that exact printed/selected path:",
  "",
  "```sh",
  "ARTICULATED_BENCH_DBPATH=/absolute/path/from/mktemp pnpm --filter benchmarks full-picture:mongo",
  "pnpm --filter benchmarks full-picture:report",
  "```",
  "",
  "The runner refuses a server with another path/port/binding and refuses a nonempty benchmark database. It never drops data. Stop the dedicated server after measurement. The generated fixture stays local; the measured results and report are committed.",
  "",
  "Raw results: [JS timings and memory](results/full-picture/js.json), [Mongo collection measurements](results/full-picture/mongo.json), [examples](results/full-picture/examples.json). Benchmark source: [full_picture](src/full_picture).",
);
fs.writeFileSync(
  path.resolve(__dirname, "../../full_picture.md"),
  lines.join("\n") + "\n",
);
