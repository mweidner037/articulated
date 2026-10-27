/** Synthetic ID-list scaling diagnostic. Deliberately NO editor or rendering.
 * Run only while other performance benchmarks are idle:
 *   node --import tsx benchmarks/src/browser/exploration-scale.ts
 * Build-only validation (does not launch Chromium or generate the trace):
 *   SCALE_BUILD_ONLY=1 node --import tsx benchmarks/src/browser/exploration-scale.ts
 */
import { IdList, type ElementId, type SavedIdList } from "articulated";
import { build } from "esbuild";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium, type CDPSession } from "playwright";
import { fixture } from "../full_picture/fixture";
import type { Candidate } from "./candidates";
import { explorationCandidates } from "./exploration-candidates";

const defaultCases = [
  "objects",
  "omit",
  "client",
  "f05-flat-owned-128",
  "f08-flat-owned-128",
  "f08-tree-owned-128",
  "f01-rows-owned-128",
  "f07-flat-owned-128",
];
type Edit =
  | { type: "insert"; before: ElementId | null; id: ElementId }
  | { type: "delete"; id: ElementId };
interface Workload {
  lookups: { index: number; id: ElementId }[];
  edits: Edit[];
  expected: SavedIdList;
}
interface Sample {
  id: string;
  internalFormat: string;
  scale: number;
  runs: number;
  visibleIds: number;
  repetition: number;
  historyLimit: number;
  loadMs: number;
  parseMs: number;
  hydrateMs: number;
  lookupMs: number;
  editMs: number;
  retainedVersions: number;
  baselineHeapBytes: number;
  baselineBackingBytes: number;
  loadedHeapDeltaBytes: number;
  loadedBackingDeltaBytes: number;
  loadedBytes: number;
  editedBytes: number;
  releasedHistoryBytes: number;
  checks: { lookup: true; fullSave: true };
}

/** Rename client prefixes, not counters/sequence numbers, so copies have
 * disjoint identities while retaining each original run's structure. */
function repeatedFixture(base: SavedIdList, copies: number): SavedIdList {
  const result: SavedIdList = [];
  for (let copy = 0; copy < copies; copy++) {
    const prefix = `scale${copy.toString(36).padStart(4, "0")}-`;
    for (const run of base) {
      assert(
        run.bunchId.lastIndexOf("_") > 0,
        "Fixture requires structured IDs",
      );
      result.push({ ...run, bunchId: prefix + run.bunchId });
    }
  }
  return result;
}

/** Generate one operation trace per scale with the existing IdList, outside
 * every browser timer. All candidates receive exactly these same IDs/anchors. */
function makeWorkload(saved: SavedIdList): Workload {
  let list = IdList.load(saved),
    seed = 72;
  const random = (n: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % n;
  };
  const lookups = Array.from({ length: 128 }, () => {
    const index = random(list.length);
    return { index, id: list.at(index) };
  });
  const edits: Edit[] = [];
  for (let i = 0; i < 200; i++) {
    if (i % 2 === 0) {
      const index = random(list.length + 1);
      const before = index ? list.at(index - 1) : null;
      const id = { bunchId: "scale-editor_0", counter: i };
      list = list.insertAfter(before, id);
      edits.push({ type: "insert", before, id });
    } else {
      const id = list.at(random(list.length));
      list = list.delete(id);
      edits.push({ type: "delete", id });
    }
  }
  return { lookups, edits, expected: list.save() };
}

function candidates(): Candidate[] {
  const ids = process.env.SCALE_CASES?.split(",") ?? defaultCases;
  assert(
    ids.length && new Set(ids).size === ids.length,
    "Unique cases required",
  );
  return ids.map((id) => {
    const c = explorationCandidates.find((candidate) => candidate.id === id);
    assert(c, `Unknown case: ${id}`);
    assert.equal(
      c.encoding,
      "JSON",
      "This diagnostic tests JSON models, not binary encodings",
    );
    return c;
  });
}

// Kept in this file so the diagnostic is one reproducible executable. esbuild
// checks this TypeScript source in build-only mode without starting a browser.
const browserSource = String.raw`
import type { SavedIdList } from "articulated";
import type { BenchmarkList } from "./list-interface";
import { explorationCandidates } from "./exploration-candidates";
let current: BenchmarkList | undefined;
let input: string | undefined;
let selected: typeof explorationCandidates[number] | undefined;
let history: BenchmarkList[] = [];
const api = {
  async prepare(id: string, scale: number) {
    selected = explorationCandidates.find(c => c.id === id);
    if (!selected) throw new Error("Unknown candidate " + id);
    const response = await fetch("/payload/" + scale + "/" + id);
    if (!response.ok) throw new Error("Payload fetch failed");
    input = await response.text();
  },
  load() {
    if (!selected || input === undefined) throw new Error("Prepare first");
    const start = performance.now();
    const state = JSON.parse(input);
    const parsed = performance.now();
    current = selected.hydrate(state);
    const end = performance.now();
    // Release the prepared source string. Parsed input lives only if the native
    // implementation itself keeps it; all temporary load locals end on return.
    input = undefined;
    return { loadMs: end - start, parseMs: parsed - start, hydrateMs: end - parsed };
  },
  exercise(workload, historyLimit: number) {
    if (!current) throw new Error("Load first");
    const actualIds = new Array(workload.lookups.length);
    const actualIndexes = new Array(workload.lookups.length);
    const start = performance.now();
    for (let i = 0; i < workload.lookups.length; i++) {
      const lookup = workload.lookups[i];
      actualIds[i] = current.at(lookup.index);
      actualIndexes[i] = current.indexOf(lookup.id);
    }
    const lookupMs = performance.now() - start;
    for (let i = 0; i < workload.lookups.length; i++) {
      const lookup = workload.lookups[i], actual = actualIds[i];
      if (actual.bunchId !== lookup.id.bunchId || actual.counter !== lookup.id.counter || actualIndexes[i] !== lookup.index)
        throw new Error("Lookup mismatch at " + i);
    }
    const editStart = performance.now();
    for (const edit of workload.edits) {
      if (historyLimit) {
        history.push(current);
        if (history.length > historyLimit) history.shift();
      }
      current = edit.type === "insert"
        ? current.insertAfter(edit.before, edit.id)
        : current.delete(edit.id);
    }
    const editMs = performance.now() - editStart;
    return { lookupMs, editMs, retainedVersions: history.length };
  },
  check(expected: SavedIdList) {
    if (!current) throw new Error("Load first");
    const actual = current.save();
    if (actual.length !== expected.length) throw new Error("Saved length mismatch");
    for (let i = 0; i < actual.length; i++) {
      const a = actual[i], e = expected[i];
      if (a.bunchId !== e.bunchId || a.startCounter !== e.startCounter || a.count !== e.count || a.isDeleted !== e.isDeleted)
        throw new Error("Full save mismatch at row " + i);
    }
  },
  dropHistory() { history = []; },
};
(window as any).scaleDiagnostic = api;
`;

declare global {
  interface Window {
    scaleDiagnostic: {
      prepare(id: string, scale: number): Promise<void>;
      load(): { loadMs: number; parseMs: number; hydrateMs: number };
      exercise(
        workload: Omit<Workload, "expected">,
        historyLimit: number,
      ): { lookupMs: number; editMs: number; retainedVersions: number };
      check(expected: SavedIdList): void;
      dropHistory(): void;
    };
  }
}

async function heap(cdp: CDPSession) {
  await cdp.send("HeapProfiler.collectGarbage");
  const h = await cdp.send("Runtime.getHeapUsage");
  assert(
    Number.isFinite(h.backingStorageSize),
    "Browser must report backing storage",
  );
  return {
    heap: h.usedSize,
    backing: h.backingStorageSize,
    total: h.usedSize + h.backingStorageSize,
  };
}

async function main() {
  const selected = candidates();
  const bundle = await build({
    stdin: {
      contents: browserSource,
      loader: "ts",
      resolveDir: __dirname,
      sourcefile: "scale-diagnostic-browser.ts",
    },
    bundle: true,
    write: false,
    platform: "browser",
    format: "iife",
    target: "chrome120",
    alias: {
      "node:assert/strict": path.join(__dirname, "shims.ts"),
      "node:os": path.join(__dirname, "shims.ts"),
    },
  });
  if (process.env.SCALE_BUILD_ONLY === "1") {
    console.log(
      `Scaling diagnostic bundle valid; ${selected.length} selected candidates; no browser launched.`,
    );
    return;
  }
  const scales = (process.env.SCALE_MULTIPLIERS ?? "1,4,16")
    .split(",")
    .map(Number);
  const historyLimits = (process.env.SCALE_HISTORY_LIMITS ?? "0")
    .split(",")
    .map(Number);
  const repetitions = Number(process.env.SCALE_TRIALS ?? 5);
  const browserIsolation = process.env.SCALE_BROWSER_ISOLATION ?? "context";
  const cpuRate =
    process.env.SCALE_CPU_RATE === undefined
      ? undefined
      : Number(process.env.SCALE_CPU_RATE);
  assert(
    cpuRate === undefined || (Number.isFinite(cpuRate) && cpuRate >= 1),
    "SCALE_CPU_RATE must be a finite number >= 1 when supplied",
  );
  assert(
    browserIsolation === "context" || browserIsolation === "process",
    "SCALE_BROWSER_ISOLATION must be context or process",
  );
  assert(
    scales.length && scales.every((n) => Number.isSafeInteger(n) && n > 0),
  );
  assert(
    historyLimits.length && historyLimits.every((n) => n === 0 || n === 100),
  );
  assert(Number.isSafeInteger(repetitions) && repetitions > 0);
  const output = path.resolve(
    __dirname,
    "../../results",
    process.env.EXPLORATION_OUTPUT ?? "exploration",
    "scale.json",
  );
  assert(!fs.existsSync(output), `Refusing to overwrite ${output}`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  const base = await fixture();
  const decoder = new TextDecoder();
  const workloads = new Map<number, Workload>();
  const dimensions = new Map<number, { runs: number; visibleIds: number }>();
  const payloads = new Map<string, string>();
  for (const scale of scales) {
    const saved = repeatedFixture(base, scale);
    dimensions.set(scale, {
      runs: saved.length,
      visibleIds: saved.reduce(
        (n, run) => n + (run.isDeleted ? 0 : run.count),
        0,
      ),
    });
    workloads.set(scale, makeWorkload(saved));
    for (const c of selected)
      payloads.set(`${scale}/${c.id}`, decoder.decode(c.encode(saved)));
  }
  const server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<!doctype html><meta charset="utf-8"><title>ID-list scale diagnostic (no editor)</title><script src="/bundle.js"></script>',
      );
    } else if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(bundle.outputFiles[0].contents);
    } else if (
      req.url?.startsWith("/payload/") &&
      payloads.has(req.url.slice(9))
    ) {
      res.setHeader("Content-Type", "application/json");
      res.end(payloads.get(req.url.slice(9)));
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  const launchBrowser = () =>
    chromium.launch({
      headless: true,
      args: ["--enable-precise-memory-info"],
      ...(process.env.BROWSER_EXECUTABLE
        ? { executablePath: process.env.BROWSER_EXECUTABLE }
        : {}),
    });
  let browser = await launchBrowser().catch((error) => {
    server.close();
    throw error;
  });
  const browserVersion = browser.version();
  const rows: Sample[] = [];
  const result = {
    complete: false,
    diagnosticOnly: true,
    generatedAt: new Date().toISOString(),
    browser: browserVersion,
    browserIsolation,
    cpuRate: cpuRate ?? null,
    node: process.version,
    cpu: os.cpus()[0].model,
    platform: `${process.platform}/${process.arch}`,
    scales,
    historyLimits,
    repetitions,
    candidates: selected.map((c) => ({
      id: c.id,
      shape: c.shape,
      internalFormat: c.internalFormat,
    })),
    baseRuns: base.length,
    notes: [
      "Synthetic repeated Kleppmann corpus, not independent production documents. Each copy has a disjoint deterministic structured-client prefix, preserving sequence numbers and counters.",
      "No editor, rendering, DOM update, frame wait, network timing or binary encoding. This diagnoses ID-list scaling and cannot establish document-open/render performance.",
      "First parse/load in each fresh browser context; no warmup. JSON strings are prepared outside timers. Parse and hydrate (including validation, ownership copying and indexes) are timed separately and together.",
      "Retained bytes = Runtime.getHeapUsage usedSize plus backingStorageSize after forced GC, minus the same fresh-context pre-load baseline. Prepared JSON and parsed input locals are released before memory readings; implementations retain only what their ownership strategy keeps.",
      "Exactly 128 at plus 128 indexOf calls and 200 precomputed distributed mutations per sample. Reference workload generation, lookup validation and full final save parity are outside measured clocks. History maintenance, when enabled, is inside the edit clock.",
      "Five samples by default; preserve raw values and use medians/ranges, not p95 or significance claims. Jobs shuffled with seed 989 to reduce execution-order bias.",
      browserIsolation === "process"
        ? "Each sample uses a fresh browser process, launched and closed outside all measured clocks. This controls browser lifetime, without identifying an OS or scheduling root cause."
        : "Each sample uses a fresh browser context in one shared browser process.",
      "Optional undo keeps the latest 100 prior ID-list versions only, not application/editor history. Baseline may include different first-use compilation overhead; this is a first-use diagnostic, not a warmed throughput benchmark.",
    ],
    rows,
  };
  // Exclusive creation: an existing run can never be silently replaced.
  const fd = fs.openSync(output, "wx");
  const save = () => {
    const bytes = Buffer.from(JSON.stringify(result, null, 2) + "\n");
    fs.writeSync(fd, bytes, 0, bytes.length, 0);
    fs.ftruncateSync(fd, bytes.length);
  };
  const jobs = scales.flatMap((scale) =>
    selected.flatMap((c) =>
      historyLimits.flatMap((historyLimit) =>
        Array.from({ length: repetitions }, (_, repetition) => ({
          scale,
          c,
          historyLimit,
          repetition,
        })),
      ),
    ),
  );
  let seed = 989;
  for (let i = jobs.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
  }
  save();
  try {
    for (const { scale, c, historyLimit, repetition } of jobs) {
      if (!browser.isConnected()) {
        browser = await launchBrowser();
        assert.equal(browser.version(), browserVersion);
      }
      const context = await browser.newContext();
      try {
        const page = await context.newPage();
        await page.goto(`http://127.0.0.1:${address.port}`);
        await page.waitForFunction(() => Boolean(window.scaleDiagnostic));
        const cdp = await context.newCDPSession(page);
        await cdp.send("HeapProfiler.enable");
        if (cpuRate !== undefined)
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
        const baseline = await heap(cdp);
        await page.evaluate(
          ({ id, scale }) => window.scaleDiagnostic.prepare(id, scale),
          { id: c.id, scale },
        );
        const load = await page.evaluate(() => window.scaleDiagnostic.load());
        const loaded = await heap(cdp);
        const workload = workloads.get(scale)!;
        const exercise = await page.evaluate(
          ({ lookups, edits, historyLimit }) =>
            window.scaleDiagnostic.exercise({ lookups, edits }, historyLimit),
          { lookups: workload.lookups, edits: workload.edits, historyLimit },
        );
        // Read retained memory before sending the large expected SavedIdList.
        // The full parity check therefore cannot inflate these readings.
        const edited = await heap(cdp);
        await page.evaluate(() => window.scaleDiagnostic.dropHistory());
        const released = await heap(cdp);
        await page.evaluate(
          (expected) => window.scaleDiagnostic.check(expected),
          workload.expected,
        );
        rows.push({
          id: c.id,
          internalFormat: c.internalFormat ?? "Existing IdList",
          scale,
          ...dimensions.get(scale)!,
          repetition,
          historyLimit,
          ...load,
          ...exercise,
          baselineHeapBytes: baseline.heap,
          baselineBackingBytes: baseline.backing,
          loadedHeapDeltaBytes: loaded.heap - baseline.heap,
          loadedBackingDeltaBytes: loaded.backing - baseline.backing,
          loadedBytes: loaded.total - baseline.total,
          editedBytes: edited.total - baseline.total,
          releasedHistoryBytes: released.total - baseline.total,
          checks: { lookup: true, fullSave: true },
        });
        save();
        console.log(
          `Scale ${rows.length}/${jobs.length}: ${scale}x ${c.id}, undo=${historyLimit}, trial=${repetition}`,
        );
      } finally {
        await context.close();
        if (browserIsolation === "process") await browser.close();
      }
    }
    result.complete = true;
    save();
  } finally {
    fs.closeSync(fd);
    if (browser.isConnected()) await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
