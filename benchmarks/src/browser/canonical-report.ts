/** Report-only module: validates finished canonical evidence before emitting
 * Markdown or static figures. Importing this file never starts a benchmark. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import type { CanonicalReplayResult } from "./canonical-run";
import {
  verifiedCanonicalDigests,
  type CanonicalMetadata,
} from "./canonical-workload";
import { comparisonChart } from "./charts";
import { explorationCandidate } from "./exploration-candidates";
import { formats } from "./formats";

type Model = "structured" | "opaque8";
interface Replay {
  complete: boolean;
  browser: string;
  browserBundleSha256: string;
  node: string;
  cpu: string;
  platform: string;
  cpuRate: number;
  browserIsolation: "context" | "process";
  operations: number;
  documents: number;
  repetitions: number;
  cases: string[];
  models: Model[];
  passes: string[];
  histories: number[];
  expectedRows: number;
  metadata: Record<Model, CanonicalMetadata>;
  inProgress: unknown;
  rows: CanonicalReplayResult[];
}
interface MongoRow {
  id: string;
  formatId: string;
  snapshot: string;
  compressor: string;
  storageBytes: number;
  storageBytesPerDocument: number;
  freeBytes: number;
  indexBytes: number;
  filesystemAllocatedBytes: number;
  collectionFile: string;
  checkedDocuments: number[];
  compact: { ok: number };
  compactAfterCheckpoint: { ok: number };
  compressorCreationString: string;
}
interface Mongo {
  complete: boolean;
  dataset: Model;
  fixtureMode: string;
  // Older completed Mongo runs store this digest in fixtures[].sha256 instead.
  canonicalSource: Omit<CanonicalMetadata, "finalSavedSha256">;
  documents: number;
  version: string;
  procedure: string[];
  fixtures: {
    id: string;
    sha256: string;
    runs: number;
    visibleIds: number;
    document0DistinctIds: number;
    document0IdLengths: number[];
  }[];
  rows: MongoRow[];
}
const cases = [
  "objects",
  "f01-rows-owned-128",
  "f02-rows-owned-128",
  "f03-rows-owned-128",
  "f05-flat-owned-128",
  "f07-flat-owned-128",
  "f09-flat-owned-128",
  "f08-flat-owned-128",
  "f08-tree-owned-128",
];
const checkpoints = [10_000, 50_000, 100_000, 200_000, 259_778];
const labels: Record<string, string> = {
  objects: "F01 · existing IdList",
  "f01-rows-owned-128": "F01 · native plain objects",
  "f02-rows-owned-128": "F02 · native objects; negative means deleted",
  "f03-rows-owned-128": "F03 · native tuples",
  "f05-flat-owned-128": "F05 · native columns; reconstruct counters",
  "f07-flat-owned-128": "F07 · native whole-ID dictionary columns",
  "f09-flat-owned-128": "F09 · native dictionary + all counters",
  "f08-flat-owned-128": "F08 · native client dictionary; flat pages",
  "f08-tree-owned-128": "F08 · native client dictionary; indexed pages",
};
const storageLabels: Record<string, string> = {
  F01: "F01 · plain SavedIdList objects",
  F02: "F02 · objects; negative means deleted",
  F03: "F03 · three-element tuples",
  F04: "F04 · columns; all counters",
  F05: "F05 · columns; reconstruct counters",
  F06: "F06 · split IDs; reconstruct counters",
  F07: "F07 · whole-ID dictionary columns",
  F08: "F08 · client dictionary columns",
  F09: "F09 · whole-ID dictionary + all counters",
};
const models: Model[] = ["opaque8", "structured"];
const selected = (model: Model) =>
  cases.filter((id) => model !== "opaque8" || !id.startsWith("f08-"));
const formatId = (id: string) => {
  const found = Object.values(formats).find(
    (format) => format.name === explorationCandidate(id).shape,
  );
  assert(found, `Missing format for ${id}`);
  return found.id;
};
const n = (value: number, digits = 1) => value.toFixed(digits);
function median(values: number[]) {
  assert(values.length && values.every(Number.isFinite));
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}
const range = (values: number[], divisor = 1) =>
  `${n(median(values) / divisor)} [${n(Math.min(...values) / divisor)}–${n(Math.max(...values) / divisor)}]`;
const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;

function validateMetadata(
  metadata: Omit<CanonicalMetadata, "finalSavedSha256">,
) {
  assert.equal(metadata.trace, "kleppmannReal");
  assert.equal(metadata.startState, "empty");
  assert.equal(metadata.refreshInterval, null);
  assert.equal(metadata.seed, "42");
  assert.deepEqual(metadata.checkpoints, checkpoints);
  assert.deepEqual(metadata.counts, {
    operations: 259778,
    insertions: 182315,
    deletions: 77463,
    newlineInsertions: 1767,
    newlineDeletions: 595,
    finalCharacters: 104852,
  });
  assert.equal(metadata.editsSha256, verifiedCanonicalDigests.editsSha256);
  assert.equal(
    metadata.finalTextSha256,
    verifiedCanonicalDigests.finalTextSha256,
  );
  assert.match(metadata.traceSha256, /^[0-9a-f]{64}$/);
  assert.equal(metadata.bunchCount, 5382);
  assert.equal(metadata.source.license, "CC-BY-4.0");
  assert.equal(
    metadata.source.upstreamCommit,
    "da212e984c777d31ee7d888f82637288aa4c61d3",
  );
  assert.equal(metadata.source.upstreamVerification.verified, true);
  const proof = metadata.source.upstreamVerification;
  assert(proof.verified);
  assert.equal(proof.upstreamSha256, verifiedCanonicalDigests.upstreamSha256);
  assert.equal(proof.editsSha256, metadata.editsSha256);
  assert.equal(proof.finalTextSha256, metadata.finalTextSha256);
  assert.equal(proof.operations, 259778);
}
function validateReplay(replay: Replay) {
  assert.equal(replay.cpuRate, 1);
  assert.equal(replay.browserIsolation, "process");
  assert(
    replay.complete,
    "Canonical replay is incomplete; no recommendations generated",
  );
  assert.equal(replay.inProgress, null);
  assert.match(replay.browserBundleSha256, /^[0-9a-f]{64}$/);
  assert.equal(replay.operations, 259778);
  assert.equal(replay.documents, 1);
  assert.equal(replay.repetitions, 3);
  assert.deepEqual([...replay.cases].sort(), [...cases].sort());
  assert.deepEqual([...replay.models].sort(), [...models].sort());
  assert.deepEqual([...replay.passes].sort(), ["editor", "id-only"]);
  assert.deepEqual(
    [...replay.histories].sort((a, b) => a - b),
    [0, 100],
  );
  assert.equal(replay.expectedRows, 144);
  assert.equal(replay.rows.length, 144);
  assert.equal(
    new Set(
      replay.rows.map(
        (row) =>
          `${row.model}/${row.id}/${row.pass}/${row.historyLimit}/${row.repetition}`,
      ),
    ).size,
    144,
  );
  for (const model of models) {
    validateMetadata(replay.metadata[model]);
    assert.match(replay.metadata[model].finalSavedSha256, /^[0-9a-f]{64}$/);
    for (const id of selected(model))
      for (const pass of ["id-only", "editor"] as const)
        for (const history of pass === "id-only" ? [0] : [0, 100]) {
          const rows = replay.rows.filter(
            (row) =>
              row.model === model &&
              row.id === id &&
              row.pass === pass &&
              row.historyLimit === history,
          );
          assert.equal(
            rows.length,
            3,
            `Missing canonical trials: ${model}/${id}/${pass}/${history}`,
          );
          assert.deepEqual(rows.map((row) => row.repetition).sort(), [0, 1, 2]);
          for (const row of rows) {
            assert.equal(row.operations, 259778);
            assert(nonnegative(row.elapsedMs) && row.elapsedMs > 0);
            assert(nonnegative(row.baselineBytes));
            assert(Number.isFinite(row.emptyInitializedBytes));
            assert(nonnegative(row.releasedHistoryBytes));
            assert(Number.isFinite(row.historyFreedBytes));
            const expected = pass === "id-only" ? [259778] : checkpoints;
            assert.deepEqual(
              row.checkpoints.map((point) => point.completed),
              expected,
            );
            for (let i = 0; i < row.checkpoints.length; i++) {
              const point = row.checkpoints[i];
              assert.equal(
                point.segmentOperations,
                point.completed - (i ? row.checkpoints[i - 1].completed : 0),
              );
              assert.equal(point.retainedVersions, history);
              assert.equal(point.fullSavedState, true);
              assert.equal(point.sampledLookups, true);
              assert.equal(point.renderedText, pass === "editor");
              assert(
                nonnegative(point.elapsedMs) &&
                  nonnegative(point.retainedBytes) &&
                  Number.isFinite(point.beforeGCBytes),
              );
            }
            assert.equal(
              row.checkpoints.reduce((sum, p) => sum + p.segmentOperations, 0),
              259778,
            );
            assert(
              Math.abs(
                row.elapsedMs -
                  row.checkpoints.reduce((sum, p) => sum + p.elapsedMs, 0),
              ) < 0.001,
            );
            assert(
              Math.abs(
                row.historyFreedBytes -
                  (row.checkpoints.at(-1)!.retainedBytes -
                    row.releasedHistoryBytes),
              ) < 0.001,
            );
          }
        }
  }
  assert.equal(
    replay.metadata.structured.traceSha256,
    replay.metadata.opaque8.traceSha256,
  );
}
function validateMongo(
  mongo: Mongo,
  model: Model,
  metadata: CanonicalMetadata,
) {
  assert(mongo.complete, `Canonical ${model} Mongo measurement is incomplete`);
  assert.equal(mongo.dataset, model);
  assert.equal(mongo.fixtureMode, "canonical");
  assert.equal(mongo.documents, 100);
  validateMetadata(mongo.canonicalSource);
  for (const key of [
    "traceSha256",
    "editsSha256",
    "finalTextSha256",
    "idPolicy",
  ] as const)
    assert.equal(mongo.canonicalSource[key], metadata[key]);
  assert.equal(mongo.fixtures.length, 1);
  const fixture = mongo.fixtures[0];
  assert.equal(fixture.id, "canonical-final");
  assert.equal(
    fixture.sha256,
    metadata.finalSavedSha256,
    `Mongo and browser assigned final SavedIdList differ for ${model}`,
  );
  assert.equal(fixture.runs, 11757);
  assert.equal(fixture.visibleIds, 104852);
  assert.equal(fixture.document0DistinctIds, 5382);
  if (model === "opaque8") assert.deepEqual(fixture.document0IdLengths, [8]);
  const ids = Object.values(formats)
    .map((format) => format.id)
    .filter((id) => model !== "opaque8" || !["F06", "F08"].includes(id));
  assert.equal(mongo.rows.length, ids.length * 2);
  assert.equal(
    new Set(
      mongo.rows.map(
        (row) => `${row.formatId}/${row.compressor}/${row.snapshot}`,
      ),
    ).size,
    mongo.rows.length,
  );
  assert(
    mongo.procedure.some((step) => step.includes("fsync with lock")),
    "Missing physical-file checkpoint/fsync procedure",
  );
  for (const id of ids)
    for (const compressor of ["snappy", "zstd"]) {
      const row = mongo.rows.find(
        (row) => row.formatId === id && row.compressor === compressor,
      );
      assert(row, `Missing canonical storage ${model}/${id}/${compressor}`);
      assert.equal(row.snapshot, "canonical-final");
      assert.equal(row.compact.ok, 1);
      assert.equal(row.compactAfterCheckpoint.ok, 1);
      assert.deepEqual(row.checkedDocuments, [0, 99]);
      assert(row.storageBytes > 0 && Number.isFinite(row.storageBytes));
      assert.equal(row.storageBytes / 100, row.storageBytesPerDocument);
      assert(nonnegative(row.freeBytes) && row.freeBytes <= row.storageBytes);
      assert(nonnegative(row.indexBytes));
      assert(nonnegative(row.filesystemAllocatedBytes));
      assert(row.collectionFile.endsWith(".wt"));
      assert(
        row.compressorCreationString.includes(`block_compressor=${compressor}`),
      );
    }
}

/** Return a self-contained report section; caller inserts it into its Markdown.
 * Paths in returned links are relative to benchmarks/, matching exploration.md.
 * Requires all three complete raw files before any figure is written. */
export function canonicalReport(outputDirectory: string): string[] {
  const read = <T>(name: string): T =>
    JSON.parse(fs.readFileSync(path.join(outputDirectory, name), "utf8")) as T;
  const replay = read<Replay>("canonical.json");
  const mongo: Record<Model, Mongo> = {
    structured: read<Mongo>("canonical-mongo.json"),
    opaque8: read<Mongo>("canonical-mongo-opaque8.json"),
  };
  validateReplay(replay);
  for (const model of models)
    validateMongo(mongo[model], model, replay.metadata[model]);
  assert.equal(mongo.structured.version, mongo.opaque8.version);
  const relative = path
    .relative(path.resolve(__dirname, "../.."), outputDirectory)
    .split(path.sep)
    .join("/");
  const rows = (
    model: Model,
    id: string,
    pass: "id-only" | "editor",
    history = 0,
  ) =>
    replay.rows.filter(
      (row) =>
        row.model === model &&
        row.id === id &&
        row.pass === pass &&
        row.historyLimit === history,
    );
  const times = (
    model: Model,
    id: string,
    pass: "id-only" | "editor",
    history = 0,
  ) => rows(model, id, pass, history).map((row) => row.elapsedMs);
  const memories = (model: Model, id: string, history = 0) =>
    rows(model, id, "editor", history).map(
      (row) => row.checkpoints.at(-1)!.retainedBytes,
    );
  const disk = (model: Model, format: string, compressor: string) => {
    const row = mongo[model].rows.find(
      (row) => row.formatId === format && row.compressor === compressor,
    );
    assert(row);
    return row.storageBytesPerDocument / 1000;
  };
  const speedOrder = (model: Model) =>
    [...selected(model)].sort(
      (a, b) =>
        median(times(model, a, "editor")) - median(times(model, b, "editor")) ||
        a.localeCompare(b),
    );
  const storageOrder = (model: Model) =>
    [...new Set(mongo[model].rows.map((row) => row.formatId))].sort(
      (a, b) =>
        disk(model, a, "snappy") - disk(model, b, "snappy") ||
        a.localeCompare(b),
    );
  const table = (model: Model) => [
    "| Internal representation | ID-only seconds [range] | Editor seconds [range] | JS MB: no history / +100 versions | Mongo KB: Snappy / zstd |",
    "|---|---:|---:|---:|---:|",
    ...speedOrder(model).map(
      (id) =>
        `| ${labels[id]} | ${range(times(model, id, "id-only"), 1000)} | ${range(times(model, id, "editor"), 1000)} | ${n(median(memories(model, id)) / 1e6)} / ${n(median(memories(model, id, 100)) / 1e6)} | ${n(disk(model, formatId(id), "snappy"))} / ${n(disk(model, formatId(id), "zstd"))} |`,
    ),
  ];
  const detailTable = (model: Model) => [
    "| Internal representation | Editor +100 versions, seconds [range] | JS MB no history [range] | JS MB +100 versions [range] | JS MB after releasing history [range] |",
    "|---|---:|---:|---:|---:|",
    ...speedOrder(model).map(
      (id) =>
        `| ${labels[id]} | ${range(times(model, id, "editor", 100), 1000)} | ${range(memories(model, id), 1e6)} | ${range(memories(model, id, 100), 1e6)} | ${range(
          rows(model, id, "editor", 100).map((row) => row.releasedHistoryBytes),
          1e6,
        )} |`,
    ),
  ];
  for (const model of models) {
    const modelLabel =
      model === "opaque8"
        ? "Opaque 8-character IDs"
        : "Structured client_sequence IDs";
    const charts = {
      speed: comparisonChart(
        `${modelLabel}: full-stream timings`,
        "259,778 operations; observed medians of 3. No dependable editor-speed winner.",
        ["ID-only seconds", "Editor seconds"],
        speedOrder(model).map((id) => ({
          label: labels[id],
          detail: `Ranges: ID ${n(Math.min(...times(model, id, "id-only")) / 1000)}–${n(Math.max(...times(model, id, "id-only")) / 1000)} s; editor ${n(Math.min(...times(model, id, "editor")) / 1000)}–${n(Math.max(...times(model, id, "editor")) / 1000)} s`,
          values: [
            median(times(model, id, "id-only")) / 1000,
            median(times(model, id, "editor")) / 1000,
          ],
          ranges: (["id-only", "editor"] as const).map((pass) => ({
            min: Math.min(...times(model, id, pass)) / 1000,
            max: Math.max(...times(model, id, pass)) / 1000,
          })),
        })),
        "Separate passes, not additive: uninterrupted ID-only vs checkpointed editor. No p95 claim.",
        "Internal representation",
      ),
      memory: comparisonChart(
        `${modelLabel}: retained JS memory`,
        "One document grown from empty; final memory; median of 3; lower is better.",
        ["No history, MB", "+100 ID versions, MB"],
        [...selected(model)]
          .sort(
            (a, b) =>
              median(memories(model, a, 100)) - median(memories(model, b, 100)),
          )
          .map((id) => ({
            label: labels[id],
            detail: "Editor + ID list; forced GC; includes backing storage",
            values: [
              median(memories(model, id)) / 1e6,
              median(memories(model, id, 100)) / 1e6,
            ],
          })),
        "ID-list history only, not editor undo; decimal MB. Final retained memory, not peak or total allocation.",
        "Internal representation",
      ),
      storage: comparisonChart(
        `${modelLabel}: physical Mongo storage`,
        "Final unrefreshed snapshot; 100 independently renamed documents per layout.",
        ["Snappy KB/document", "zstd KB/document"],
        storageOrder(model).map((id) => ({
          label: storageLabels[id],
          values: [disk(model, id, "snappy"), disk(model, id, "zstd")],
        })),
        "Actual compacted collection-file bytes / 100; excludes indexes and shared files; one build per layout.",
        "Stored JSON format",
      ),
    };
    for (const [kind, contents] of Object.entries(charts))
      fs.writeFileSync(
        path.join(outputDirectory, `canonical-${model}-${kind}.svg`),
        contents,
      );
  }
  const opaqueIds = speedOrder("opaque8");
  const fastest = opaqueIds[0];
  const leanest = [...opaqueIds].sort(
    (a, b) =>
      median(memories("opaque8", a, 100)) - median(memories("opaque8", b, 100)),
  )[0];
  const smallest = storageOrder("opaque8")[0];
  const fastRange = times("opaque8", fastest, "editor"),
    baseRange = times("opaque8", "objects", "editor");
  const formatsWithReplay = new Set(opaqueIds.map(formatId));
  const lines = [
    "## The original Kleppmann editing stream — not a synthetic follow-up",
    "",
    "This replays **all 259,778 original operations** from an empty document: 182,315 single-character insertions and 77,463 deletions, including 1,767 newline insertions and 595 newline deletions. Original indices, characters and order are preserved. There is **no initial snapshot, synthetic first edit, periodic save/reload, or omitted prefix**. Final text is exactly 104,852 characters; its canonical saved state contains 11,757 runs and 5,382 bunch identities.",
    "",
    `Source: [Martin Kleppmann’s editing trace](${replay.metadata.structured.source.traceUrl}), pinned to \`${replay.metadata.structured.source.upstreamCommit}\`; [upstream description and CC-BY-4.0 attribution](${replay.metadata.structured.source.readmeUrl}). The recorded concurrent history was flattened upstream; cursor moves are not part of this index-based trace. ElementIds are **our controlled harness assignment**, not collaborator identities recorded in the source. Seed42 + ElementIdGenerator assigns structured IDs once; the opaque model bijectively renames whole bunch IDs to collision-checked eight-character strings without changing grouping or counters.`,
    "",
    "### Decision table for your opaque eight-character IDs",
    "",
    `**No dependable editor-speed winner.** Timing variation remains unresolved despite the fresh-process and explicit CPU-rate controls. A useful warning within this run: F09 took ${n(median(times("opaque8", "f09-flat-owned-128", "editor")) / 1000)} seconds without history but ${n(median(times("opaque8", "f09-flat-owned-128", "editor", 100)) / 1000)} seconds while retaining 100 versions. Do not interpret that reversal, or the ordering below, as an established algorithm effect. All trials and ranges are retained; memory and storage are separate observations.`,
    "",
    "Sorted by median editor replay time, fastest first. Times are **median [minimum–maximum] of three fresh-browser-process trials**, not p95; browser launch/close is outside all clocks. ID-only time and editor time are separate passes and must not be added. Memory is final retained JS heap plus backing storage after collection; values include one editor grown from empty. This is **one document**, unlike the separate four-preloaded-document load/session suite: do not compare their raw memory totals. Storage follows the saved F-format, not the runtime data structure.",
    "",
    ...table("opaque8"),
    "",
    `![Canonical opaque-ID full-stream speed](${relative}/canonical-opaque8-speed.svg)`,
    "",
    `![Canonical opaque-ID retained memory](${relative}/canonical-opaque8-memory.svg)`,
    "",
    `![Canonical opaque-ID physical Mongo storage](${relative}/canonical-opaque8-storage.svg)`,
    "",
    "### Three priorities, three bounded conclusions",
    "",
    `1. **Editing speed: no demonstrated winner.** ${labels[fastest]} has the lowest observed editor median: ${range(fastRange, 1000)} seconds, versus ${range(baseRange, 1000)} for existing IdList. Host/runtime variability and three trials prevent a dependable speed recommendation from these rankings. The separate persisted-document load test answers a different question.`,
    `2. **Editing memory:** native F05 retains ${n(median(memories("opaque8", "f05-flat-owned-128")) / 1e6, 2)} MB without history, versus ${n(median(memories("opaque8", "objects")) / 1e6, 2)} MB for existing IdList. With 100 ID-list versions, ${labels[leanest]} has the lowest median, but F05 and F03 are practically close: ${n(median(memories("opaque8", "f05-flat-owned-128", 100)) / 1e6, 3)} and ${n(median(memories("opaque8", "f03-rows-owned-128", 100)) / 1e6, 3)} MB, versus ${n(median(memories("opaque8", "objects", 100)) / 1e6, 3)} MB for existing IdList. Do not turn that small F05/F03 difference into a categorical winner. This is not full ProseMirror/application undo memory.`,
    `3. **Mongo storage:** ${storageLabels[smallest]} is smallest under Snappy in this canonical opaque-ID snapshot: ${n(disk("opaque8", smallest, "snappy"))} KB/document; its zstd result is ${n(disk("opaque8", smallest, "zstd"))} KB. ${formatsWithReplay.has(smallest as ReturnType<typeof formatId>) ? "Use the corresponding replay row to judge the browser tradeoff separately." : "That stored format is not among the canonical runtime candidates, so this section does not establish its editing speed or memory."} The zstd column is a measurement, not a claim that Atlas compression can be changed without operational work.`,
    "",
    "These conclusions cover one initially empty document, one canonical trace, and these implementations. They do not replace the separate persisted-document load/render benchmark. Native candidates implement the measured API subset, not every IdList operation; all native replay candidates use owned 128-run pages. F01 native rows retain immutable row objects while owning page arrays; column variants own their primitive page columns. These are exploratory implementations, not production migration recommendations.",
    "",
    "<details>",
    "<summary>Opaque-ID history timing and memory ranges</summary>",
    "",
    ...detailTable("opaque8"),
    "",
    "</details>",
    "",
    "<details>",
    "<summary>Structured client_sequence IDs — separate comparison, including F08</summary>",
    "",
    "F08 can split these IDs into clients and sequence numbers. It cannot losslessly apply that assumption to arbitrary opaque eight-character IDs. Do not transfer this model’s F08 result to the opaque-ID recommendation.",
    "",
    ...table("structured"),
    "",
    `![Canonical structured-ID full-stream speed](${relative}/canonical-structured-speed.svg)`,
    "",
    `![Canonical structured-ID retained memory](${relative}/canonical-structured-memory.svg)`,
    "",
    `![Canonical structured-ID physical Mongo storage](${relative}/canonical-structured-storage.svg)`,
    "",
    ...detailTable("structured"),
    "",
    "</details>",
    "",
    "<details>",
    "<summary>Canonical methodology, validation, source hashes and reproduction</summary>",
    "",
    "- **ID-only:** one uninterrupted clock around all operations; natural GC, no per-operation timers or yields. Actual at(index) navigation and mutations are timed. Identity generation, input preparation, initialization and final checking are outside the clock. There is no editor in this pass.",
    "- **Identity allocation:** counters and ID values are precomputed equally for all containers. Each insertion allocates the same small ID object inside the timed loop; a continuation reuses the actual anchor’s bunchId string, like ElementIdGenerator. Reference preparation proves that every non-anchor bunch is globally new and every continuation uses its next counter. There is no retained intern pool or generator-policy Map in the browser. Serialized trace inputs still produce common transient garbage; this is not a measurement of live ID-generator allocation costs.",
    "- **Editor:** every operation dispatches an incremental ProseMirror transaction, including paragraph splits/joins. Shared paragraph mapping, anchor/target checking and ID-history maintenance are included. Time is the sum of five segments with two animation frames at each checkpoint, not per-keystroke paint latency. Full verification and forced GC between segments are excluded.",
    "- **Memory and GC:** observations after 10,000, 50,000, 100,000, 200,000 and 259,778 operations use JS heap plus backing storage after forced GC, minus the prepared-page baseline. Trace arguments/reference states are released before measurement. Charts show the final checkpoint, not a peak. Before-GC observations include discarded input garbage, so they are not pure container allocation or peak-memory measurements. The +100 condition retains the latest 100 prior ID-list versions only. Releasing history is separately measured. Natural GC contributes to elapsed time, but this canonical harness does not measure GC-pause durations or collection counts separately.",
    `- **Mongo:** MongoDB ${mongo.structured.version}, 100 independently renamed documents per layout, final unrefreshed snapshot only. Each collection is compacted, checkpointed, compacted again and fsynced with a lock; its actual .wt file length equals storageSize and its compressor is verified. Index/shared-file bytes are excluded. One storage build per layout, not repeated statistical trials; this is fresh insertion of the final snapshot, not physical fragmentation from replaying Mongo updates. All stored JSON formats are shown in the storage charts, including ones absent from the runtime replay subset.`,
    `- **Validation:** 144 complete replays: structured 9 containers + opaque 7, each with 3 ID-only trials and 3 editor trials for each history condition. Full final SavedIdList and sampled lookup checks pass; every editor checkpoint also checks full saved state and exact rendered text. Runtime: ${replay.browser}; ${replay.node}; ${replay.cpu}; ${replay.platform}; explicit CPU rate ${replay.cpuRate}×. Per-job timestamps and host load averages are retained for diagnosis; they do not measure thermal throttling and no outliers are discarded.`,
    `- **Hashes:** vendored trace \`${replay.metadata.structured.traceSha256}\`; canonical operation stream \`${replay.metadata.structured.editsSha256}\`; final text \`${replay.metadata.structured.finalTextSha256}\`; pinned upstream source \`${verifiedCanonicalDigests.upstreamSha256}\`. Upstream JS was inspected as JSON-compatible literals, never executed; offline runs recompute matching operation/text digests.`,
    `- **Executed browser bundle:** SHA-256 \`${replay.browserBundleSha256}\`; recorded before the replay starts so the raw results identify the actual loaded implementation.`,
    "",
    "```sh",
    "TSX_TSCONFIG_PATH=benchmarks/tsconfig.dev.json node --import tsx benchmarks/src/browser/canonical-run.ts",
    "```",
    "",
    "Run timings alone, with no competing benchmark processes. Default: both identity models, three trials, ID-only and editor passes, and 0/100 history. The runner refuses an existing canonical.json. Optional CANONICAL_UPSTREAM_PATH points to the pinned source downloaded as data for a fresh literal-only comparison. For storage, use the isolated local Mongo setup documented below with ARTICULATED_EXPLORATION_FIXTURE=canonical and ARTICULATED_EXPLORATION_DATASET=structured or opaque8; never point it at Atlas or another existing database.",
    "",
    `[Raw canonical replay](${relative}/canonical.json) · [Canonical structured Mongo](${relative}/canonical-mongo.json) · [Canonical opaque Mongo](${relative}/canonical-mongo-opaque8.json) · [Replay runner](src/browser/canonical-run.ts) · [Reference/provenance](src/browser/canonical-workload.ts) · [Storage runner](src/browser/exploration-mongo.ts)`,
    "",
    "</details>",
    "",
  ];
  return lines;
}
