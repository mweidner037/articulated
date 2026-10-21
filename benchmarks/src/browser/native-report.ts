import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toClientIndexOmit } from "../algorithms/id_list_saved_states";
import { example } from "../full_picture/fixture";
import { comparisonChart } from "./charts";
import { nativeCandidates } from "./native-candidates";
import type { BrowserSample, EditSample } from "./page-runtime";
import type { analyzeTrace } from "./trace";

interface Row {
  id: string;
  documents: number;
  samples: (BrowserSample & { round: number })[];
  cold: BrowserSample[];
  gc: ReturnType<typeof analyzeTrace>;
  editSamples: EditSample[];
  editGC: ReturnType<typeof analyzeTrace>;
  memory: {
    retainedDelta: number;
    observedHighWaterDelta: number;
    sampledAllocation: number;
  }[];
}
const dir = path.resolve(__dirname, "../../results/native");
const data = JSON.parse(
  fs.readFileSync(path.join(dir, "browser.json"), "utf8"),
) as {
  complete: boolean;
  browser: string;
  cpu: string;
  cpuRate: number;
  generatedAt: string;
  rounds: number;
  trials: number;
  switches: number;
  memoryTrials: number;
  documentCharacters: number;
  paragraphs: number;
  runs: number;
  rows: Row[];
};
assert(data.complete, "Refuse to publish incomplete measurements");
assert.equal(data.rows.length, 6);
for (const docs of [1, 4]) {
  const rows = data.rows.filter((r) => r.documents === docs);
  assert.deepEqual(
    rows.map((r) => r.id),
    nativeCandidates.map((c) => c.id),
  );
  for (const r of rows) {
    assert.equal(r.samples.length, data.rounds * data.trials);
    assert.equal(r.gc.length, data.switches);
    assert.equal(r.memory.length, data.memoryTrials);
    assert.equal(r.editSamples.length, 10);
    assert.equal(r.editGC.length, 1);
    assert([...r.gc, ...r.editGC].every((g) => g.paintEvents > 0));
    for (const s of r.samples) {
      assert(Object.values(s).every((n) => Number.isFinite(n) && n >= 0));
      assert(
        Math.abs(
          s.total - s.decode - s.hydrate - s.editor - s.layout - s.frameWait,
        ) < 0.001,
      );
    }
    for (const s of r.editSamples) {
      assert(Object.values(s).every((n) => Number.isFinite(n) && n >= 0));
      assert(s.totalMs >= s.lookupMs + s.editMs);
    }
  }
}
const labels: Record<string, string> = {
  "f08-tree": "I1 — Current IdList tree",
  "f08-tree-direct": "I1 — Current IdList tree",
  "f08-native": "I2 — Native F08 columns",
};
const loaders: Record<string, string> = {
  "f08-tree": "Via IdList.load()",
  "f08-tree-direct": "Direct tree construction",
  "f08-native": "Adopt decoded arrays; validate",
};
const q = (ns: number[], p = 0.5) =>
  [...ns].sort((a, b) => a - b)[Math.max(0, Math.ceil(ns.length * p) - 1)];
const mean = (ns: number[]) => ns.reduce((a, b) => a + b, 0) / ns.length;
const ms = (r: Row, key: keyof BrowserSample, p = 0.95) =>
  q(
    r.samples.map((s) => s[key]),
    p,
  );
const mem = (r: Row, key: keyof Row["memory"][number]) =>
  q(r.memory.map((m) => m[key])) / 1e6;
const edit = (r: Row, key: keyof EditSample) =>
  q(r.editSamples.map((s) => s[key]));
const f = (n: number) => n.toFixed(1);
const sorted = (docs: number) =>
  data.rows
    .filter((r) => r.documents === docs)
    .sort((a, b) => ms(a, "total") - ms(b, "total"));
const row = (id: string, docs = 4) =>
  data.rows.find((r) => r.id === id && r.documents === docs)!;
const tree = row("f08-tree"),
  direct = row("f08-tree-direct"),
  native = row("f08-native");
const caption = (r: Row) => `${labels[r.id]} — ${loaders[r.id]}`;
for (const docs of [1, 4]) {
  const rows = sorted(docs);
  const chart = (
    file: string,
    title: string,
    subtitle: string,
    headings: string[],
    order: Row[],
    values: (r: Row) => number[],
    note: string,
  ) => {
    fs.writeFileSync(
      path.join(dir, `${file}-${docs}.svg`),
      comparisonChart(
        title,
        subtitle,
        headings,
        order.map((r) => ({
          label: labels[r.id],
          detail: loaders[r.id],
          values: values(r),
        })),
        note,
        "Internal format / loading path",
      ),
    );
  };
  chart(
    "speed",
    `${docs} documents: same F08 JSON, different internals`,
    "Sorted by complete-ready P95, fastest first. Lower is better in every panel.",
    [
      "Complete-ready P95 (ms)",
      "To internal list P95 (ms)",
      "Load GC mean (ms)",
    ],
    rows,
    (r) => [ms(r, "total"), ms(r, "hydrate"), mean(r.gc.map((g) => g.gcMs))],
    "100 timed loads per row. Conversion is part of total; percentiles are not additive. GC measured in a separate pass.",
  );
  chart(
    "memory",
    `${docs} documents: JS memory with the editor loaded`,
    "Sorted by retained memory, smallest first. Same F08 JSON in every row.",
    [
      "Retained median (MB)",
      "Observed high-water (MB)",
      "Sampled allocations (MB)",
    ],
    [...rows].sort((a, b) => mem(a, "retainedDelta") - mem(b, "retainedDelta")),
    (r) => [
      mem(r, "retainedDelta"),
      Math.max(...r.memory.map((m) => m.observedHighWaterDelta)) / 1e6,
      mem(r, "sampledAllocation"),
    ],
    "Three separate memory runs per row, including first edit. High-water is sampled, not an exact peak. Not renderer RSS.",
  );
  chart(
    "editing",
    `${docs} documents retained: operations on one document`,
    "256 lookups and 200 immutable edits. Ten fresh-context trials per row; lower is better.",
    [
      "Lookup batch median (ms)",
      "Edit batch median (ms)",
      "Batch + render median (ms)",
    ],
    [...rows].sort((a, b) => edit(a, "totalMs") - edit(b, "totalMs")),
    (r) => [edit(r, "lookupMs"), edit(r, "editMs"), edit(r, "totalMs")],
    "Total includes both operation batches and ONE final render. This is not 200 keystrokes or per-keystroke latency.",
  );
}
const mongo = JSON.parse(
  fs.readFileSync(
    path.resolve(__dirname, "../../results/browser/mongo.json"),
    "utf8",
  ),
) as {
  version: string;
  documents: number;
  rows: { id: string; compressor: string; storageBytes: number }[];
};
const disk = (compressor: string) => {
  const r = mongo.rows.find(
    (r) => r.id === "client" && r.compressor === compressor,
  );
  assert(r);
  return r.storageBytes / mongo.documents / 1000;
};
const summary = [
  "| Internal format / loading path | Ready p95 (ms) | Conversion p95 (ms) | Retained JS (MB) | 200 edits, median (ms) |",
  "| --- | ---: | ---: | ---: | ---: |",
  ...sorted(4).map(
    (r) =>
      `| ${caption(r)} | ${f(ms(r, "total"))} | ${f(ms(r, "hydrate"))} | ${f(mem(r, "retainedDelta"))} | ${f(edit(r, "editMs"))} |`,
  ),
];
const lines = [
  "# Same F08 JSON: current IdList tree versus native columns",
  "",
  "Draft experiment, not a production migration. **Yes: avoiding the translation/tree build saved meaningful time and memory in the four-document test. But the literal, unindexed wire layout was much slower for lookups and edits.** One document reached the rendering threshold at essentially the same time with either design, despite faster native loading.",
  "",
  "This is a matched comparison of **two internal formats**, with a third loading path as a control. Every row receives byte-identical **F08 — Columnar store: deduplicate clients + reconstruct counters**, encoded as ordinary JSON. Binary and network transfer are excluded. I1/I2 identify internal designs; F08 identifies the unchanged interchange format.",
  "",
  "## Four-document result",
  "",
  ...summary,
  "",
  `Compared with the normal tree loader, native columns reduced ready p95 by **${f(ms(tree, "total") - ms(native, "total"))} ms (${f((1 - ms(native, "total") / ms(tree, "total")) * 100)}%)** and retained JS by **${f(mem(tree, "retainedDelta") - mem(native, "retainedDelta"))} MB (${f((1 - mem(native, "retainedDelta") / mem(tree, "retainedDelta")) * 100)}%)**. The conversion/validation interval fell from ${f(ms(tree, "hydrate"))} to ${f(ms(native, "hydrate"))} ms. Compared with direct tree construction, the ready-p95 difference was ${f(ms(direct, "total") - ms(native, "total"))} ms. These are differences between empirical percentiles, not a decomposition of a single load.`,
  "",
  "## What I recommend",
  "",
  `1. **Editing performance first:** keep I1, the existing tree. The native prototype's edit batch took ${f(edit(native, "editMs") / edit(tree, "editMs"))}× as long; the lookup batch took ${f(edit(native, "lookupMs") / edit(tree, "lookupMs"))}× as long. The direct-tree loader is a smaller optimization to investigate without changing the editing data structure.`,
  "",
  "2. **Opening many documents / retained memory first:** native columns are worth further work. This experiment demonstrates an actual benefit from not building the tree, not merely a smaller serialized payload. A read-mostly document could retain columns and build a tree only when editing starts, but that hybrid has not been implemented or measured here.",
  "",
  "3. **Fast loading AND fast editing:** do not ship this unindexed prototype. Next test columns with compact lookup indexes and chunked immutable updates. They may preserve much of the loading/memory benefit without full scans and whole-array rewrites, but their build time and retained memory must be included. These results do not establish that all columnar internal designs edit slowly.",
  "",
  "## Exactly what is stored and loaded",
  "",
  "All three paths store the same Mongo fields and parse the same JSON. Example: three live IDs from alice_0, one from bob_0, two from alice_1, then two deleted IDs from alice_0:",
  "",
  "```json",
  JSON.stringify(toClientIndexOmit(example), null, 2),
  "```",
  "",
  "Each position in clientIndices, seqNums and counts is a run. Negative counts mean deleted. The start counter defaults to zero for the first run of a whole ID, then the end of its preceding run. Exceptions go into startCounters; startCounterIndexes stores delta-encoded run positions. Here the last run starts at 3, so there is no exception. If it started at 8, those arrays would be [3] and [8].",
  "",
  "**ID limitation:** this is Matthew's structured client_sequence design, where the sequence suffix is base 36. It is NOT a proposed conversion of independent opaque 8-character nanoids. F07 deduplicates whole IDs without that requirement; it is a different format and is not the native implementation tested here.",
  "",
  "| Case | What happens after JSON.parse | What the library uses for lookup/editing |",
  "| --- | --- | --- |",
  "| I1 / Via IdList.load() | Reconstruct IDs/counters into SavedIdList run objects, then build the tree | Existing IdList tree |",
  "| I1 / Direct tree construction | Stream reconstructed fields directly into the tree builder, skipping the intermediate run-object array | The same existing tree |",
  "| I2 / Native F08 columns | Validate the columns and cache visible length; retain those exact arrays | F08 columns, with counters reconstructed during scans |",
  "",
  "The actual native implementation is [NativeF08](src/browser/native.ts), not another adapter that eventually invokes IdList.load:",
  "",
  "```ts",
  "const decoded = JSON.parse(json);",
  "const list = NativeF08.load(decoded); // validates, then adopts the arrays",
  "list.wireState === decoded; // true: no tree or second snapshot",
  "list.wireState.counts === decoded.counts; // true",
  "const id = list.at(2); // reads the columns, reconstructing counters",
  "const edited = list.delete(id); // new F08 columns; original list unchanged",
  "const snapshot = edited.wireState; // already the interchange shape",
  "```",
  "",
  "Zero-copy adoption does **not** mean zero-cost loading: schema/range/duplicate validation uses temporary maps and interval arrays, and is included in conversion time. No expanded counter column, lookup index, run objects, or editing tree is retained. Callers transfer ownership of the decoded arrays and must not mutate them afterward. wireState is read-only by contract, not deeply frozen.",
  "",
  "at/indexOf scan runs; inserts/deletes stream a new column set and merge compatible adjacent runs. That keeps the exact wire shape and immutable previous versions, but makes operations O(number of runs) rather than using the tree's indexes/structural sharing. Reconstructing counters also allocates temporary maps during scans. This is a deliberately literal first implementation, not an optimized bound on columnar performance.",
  "",
  "Implemented API subset: length, at, indexOf (including deleted-entry bias), insertAfter, delete, and save for correctness checks. No insertBefore, undelete, uninsert, or complete iterator/API parity. The prototype lives in the benchmark package; the public library default has not changed.",
  "",
  "## Load speed, conversion and GC",
  "",
  "![Four-document load speed, fastest p95 first](results/native/speed-4.svg)",
  "",
  "Complete-ready covers decoding → internal list → ProseMirror creation → layout → a rendering opportunity. Conversion is timed directly around the loader and is already part of total. Common editor/layout work is not presented as a separate competitive metric. GC is measured in separate traced runs; do not add that bar to the timed total.",
  "",
  `For **one document**, ready p95 was ${f(ms(row("f08-tree", 1), "total"))} ms with the normal tree loader, ${f(ms(row("f08-tree-direct", 1), "total"))} ms with direct tree construction and ${f(ms(row("f08-native", 1), "total"))} ms with native columns. Native conversion still fell from ${f(ms(row("f08-tree", 1), "hydrate"))} to ${f(ms(row("f08-native", 1), "hydrate"))} ms, but the rendering-opportunity threshold masked that gain in this workload. Do not promise a visible single-document speedup from these results.`,
  "",
  "## JS memory",
  "",
  "![Four-document retained memory and allocation](results/native/memory-4.svg)",
  "",
  "Retained = JS heap + backing storage after forced GC, relative to the empty harness, with editors loaded and the first edit completed. It includes editor/model state, not just IDs. Observed high-water is the largest sampled phase boundary, not an exact peak. Sampled allocations include subsequently collected objects; they are not retained memory. These three values are different measures and must not be added. These runs do not measure memory after the sustained edit batch or total renderer RSS.",
  "",
  "## Lookup and edit cost",
  "",
  "![Lookups, edits and one final render](results/native/editing-4.svg)",
  "",
  "Each fresh-context trial retains one or four documents but operates on **one**: 128 distributed at calls + 128 indexOf calls, followed by 100 inserts and 100 deletes at deterministic distributed positions. Both designs perform real immutable mutations; the final saved IDs are checked against the reference tree. The document's final text is rendered once after the batch and verified. ID anchors and expected text are prepared outside the timing interval.",
  "",
  "This is **not** 200 simulated keystrokes or 200 incremental ProseMirror renders. Operation timing isolates library work; batch + render adds one final document replacement/layout/rendering opportunity. Ten trials support medians and ranges, not a robust p95 editing claim. It does not cover a representative production distribution of local typing, remote merges, undo, or long edit sessions.",
  "",
  `In one separately traced four-document edit batch, tree / direct tree / native columns spent **${f(tree.editGC[0].gcMs)} / ${f(direct.editGC[0].gcMs)} / ${f(native.editGC[0].gcMs)} ms** in main-thread GC, with **${tree.editGC[0].gcEvents} / ${direct.editGC[0].gcEvents} / ${native.editGC[0].gcEvents}** events. The native implementation saves retained memory but creates substantially more temporary work during editing. This single trace per case is diagnostic, not an estimate of tail GC.`,
  "",
  "## Mongo storage: unchanged by this internal-format choice",
  "",
  "| Internal representation | Mongo Snappy KB/document | Mongo Zstd KB/document |",
  "| --- | ---: | ---: |",
  ...[
    "I1 — Current IdList tree (either loader)",
    "I2 — Native F08 columns",
  ].map((name) => `| ${name} | ${f(disk("snappy"))} | ${f(disk("zstd"))} |`),
  "",
  `Both persist the same initial F08 fields. These are the existing **measured Mongo ${mongo.version} collection-file results**, not estimates from JSON/BSON size: ${mongo.documents} documents per layout, independent client dictionaries, compact/checkpoint and locked filesystem sync. Collection indexes/shared server overhead excluded. Mongo was not rerun because the stored payload is unchanged. The measurement is for the initial snapshot, not the post-edit batch. [Storage procedure and raw data](browser.md#physical-mongo-storage-all-measurements).`,
  "",
  "## Complete measurements (collapsed)",
  "",
];
for (const docs of [1, 4]) {
  lines.push(
    `<details><summary>${docs} document(s): load, memory, edits, GC and per-round p95</summary>`,
    "",
    "| Internal / loader | Decode p95 ms | Conversion p50 / p95 ms | Ready p50 / p95 / max ms | First edit + render p95 ms | Load GC mean ms |",
    "| --- | ---: | ---: | ---: | ---: | ---: |",
    ...sorted(docs).map(
      (r) =>
        `| ${caption(r)} | ${f(ms(r, "decode"))} | ${f(ms(r, "hydrate", 0.5))} / ${f(ms(r, "hydrate"))} | ${f(ms(r, "total", 0.5))} / ${f(ms(r, "total"))} / ${f(ms(r, "total", 1))} | ${f(ms(r, "edit"))} | ${f(mean(r.gc.map((g) => g.gcMs)))} |`,
    ),
    "",
    "| Internal / loader | Retained median MB | High-water maximum MB | Allocations median MB | Ready p95 by round (ms) |",
    "| --- | ---: | ---: | ---: | --- |",
    ...sorted(docs).map(
      (r) =>
        `| ${caption(r)} | ${f(mem(r, "retainedDelta"))} | ${f(Math.max(...r.memory.map((m) => m.observedHighWaterDelta)) / 1e6)} | ${f(mem(r, "sampledAllocation"))} | ${[
          ...new Set(r.samples.map((s) => s.round)),
        ]
          .map((round) =>
            f(
              q(
                r.samples.filter((s) => s.round === round).map((s) => s.total),
                0.95,
              ),
            ),
          )
          .join(" / ")} |`,
    ),
    "",
    "Operation batches: median [minimum–maximum], ms. GC: one separate traced batch.",
    "",
    "| Internal / loader | 256 lookups | 200 edits | Both batches + final render | GC ms / events / longest ms |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...sorted(docs).map(
      (r) =>
        `| ${caption(r)} | ${(["lookupMs", "editMs", "totalMs"] as const)
          .map(
            (k) =>
              `${f(edit(r, k))} [${f(
                q(
                  r.editSamples.map((s) => s[k]),
                  0,
                ),
              )}–${f(
                q(
                  r.editSamples.map((s) => s[k]),
                  1,
                ),
              )}]`,
          )
          .join(
            " | ",
          )} | ${f(r.editGC[0].gcMs)} / ${r.editGC[0].gcEvents} / ${f(r.editGC[0].longestGC)} |`,
    ),
    "",
    ...(docs === 1
      ? [
          "![One-document load speed](results/native/speed-1.svg)",
          "",
          "![One-document JS memory](results/native/memory-1.svg)",
          "",
          "![One-document editing](results/native/editing-1.svg)",
          "",
        ]
      : []),
    "</details>",
    "",
  );
}
lines.push(
  "## Reproduce and interpret",
  "",
  `Run started ${data.generatedAt}. Chromium ${data.browser}, ${data.cpu}, CPU rate ${data.cpuRate}×. Same ${data.documentCharacters.toLocaleString("en-US")}-character, ${data.paragraphs.toLocaleString("en-US")}-paragraph, ${data.runs.toLocaleString("en-US")}-run Kleppmann trace used by the interchange benchmark, with Matthew's structured IDs. Four documents are four copies of this trace, not a corpus of independent production documents.`,
  "",
  `Three paths × two document counts × ${data.rounds} fresh-context rounds × ${data.trials} measured replacement loads = **${data.rows.reduce((n, r) => n + r.samples.length, 0)} warm timed loads**, with shuffled case order and no filtered samples. First load in each context is retained separately as cold data, not mixed into the p95. Separate passes: **${data.rows.reduce((n, r) => n + r.gc.length, 0)} traced loads**, **${data.rows.reduce((n, r) => n + r.memory.length, 0)} memory runs**, **${data.rows.reduce((n, r) => n + r.editSamples.length, 0)} edit/lookup batches**, and **${data.rows.reduce((n, r) => n + r.editGC.length, 0)} traced operation batches**. All three paths were measured together; this report does not compare new native timings against the older interchange run.`,
  "",
  "Ready is a two-animation-frame proxy, not physical display scan-out. The controlled minimal ProseMirror harness is not the production integration. Server/network transfer and ID generation are excluded. The first edit is measured separately after readiness. GC uses matched main-thread trace windows with paint checks and an outside-window GC canary; timing runs are untraced. Memory measurements are intrusive and separate from primary timing. Cold samples, first edits and raw phases remain available.",
  "",
  "Correctness checks cover full loaded/edited SavedIdList equality, visible length, actual rendered text, paint events and backing-memory calibration. Unit tests verify identical encoders/decoders across cases, exact array identity, no hidden tree fallback, 250 immutable mutations against the reference tree, all visible lookups, tombstone bias, bulk changes, counter exceptions and malformed input. This is not complete public-API parity or security hardening.",
  "",
  "From the benchmark package, using the repository's pinned dependencies:",
  "",
  "```sh",
  "npm run native:run",
  "npm run native:report",
  "npm test",
  "```",
  "",
  "[Raw measurements](results/native/browser.json) · [Completion record](results/native/complete.json) · [Exact edit workload](results/native/edit-workload.json) · [GC traces](results/native/traces) · [Native implementation](src/browser/native.ts) · [Matched candidates](src/browser/native-candidates.ts) · [Shared rendering/timing harness](src/browser/page-runtime.ts) · [Broader interchange-format comparison and examples F01–F09](browser.md)",
  "",
);
fs.writeFileSync(path.resolve(__dirname, "../../native.md"), lines.join("\n"));
