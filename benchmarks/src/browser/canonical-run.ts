/** Full, original 259,778-operation replay. This never truncates the trace.
 * ID-only throughput and checkpointed editor/memory are separate fresh pages. */
import { build } from "esbuild";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium, type CDPSession } from "playwright";
import type { CanonicalCheck } from "./canonical-page";
import {
  canonicalWorkloads,
  type CanonicalWorkload,
} from "./canonical-workload";
import { explorationCandidate } from "./exploration-candidates";

export const canonicalCases = [
  "objects",
  "f01-rows-owned-128",
  "f02-rows-owned-128",
  "f03-rows-owned-128",
  "f05-flat-owned-128",
  "f07-flat-owned-128",
  "f09-flat-owned-128",
  "f08-flat-owned-128",
  "f08-tree-owned-128",
] as const;
type Model = "structured" | "opaque8";
type Pass = "id-only" | "editor";
export interface CanonicalCheckpointResult {
  completed: number;
  segmentOperations: number;
  elapsedMs: number;
  retainedVersions: number;
  retainedBytes: number;
  beforeGCBytes: number;
  fullSavedState: true;
  sampledLookups: true;
  renderedText: boolean;
}
export interface CanonicalReplayResult {
  id: string;
  model: Model;
  pass: Pass;
  repetition: number;
  historyLimit: number;
  startedAt: string;
  finishedAt: string;
  hostLoadAverageBefore: number[];
  hostLoadAverageAfter: number[];
  operations: number;
  elapsedMs: number;
  baselineBytes: number;
  emptyInitializedBytes: number;
  checkpoints: CanonicalCheckpointResult[];
  releasedHistoryBytes: number;
  historyFreedBytes: number;
}

function expectedCheck(
  chunk: CanonicalWorkload["chunks"][number],
): CanonicalCheck {
  const wanted = new Set(
    [
      0,
      Math.floor(chunk.text.length / 4),
      Math.floor(chunk.text.length / 2),
      Math.floor((chunk.text.length * 3) / 4),
      chunk.text.length - 1,
    ].filter((i) => i >= 0 && i < chunk.text.length),
  );
  const samples: CanonicalCheck["samples"] = [];
  let position = 0;
  for (const run of chunk.expected) {
    if (run.isDeleted) continue;
    for (const index of wanted)
      if (index >= position && index < position + run.count)
        samples.push({
          index,
          id: {
            bunchId: run.bunchId,
            counter: run.startCounter + index - position,
          },
        });
    position += run.count;
  }
  assert.equal(position, chunk.text.length);
  assert.equal(samples.length, wanted.size);
  return { saved: chunk.expected, text: chunk.text, samples };
}

async function heap(cdp: CDPSession, collect = true) {
  if (collect) await cdp.send("HeapProfiler.collectGarbage");
  const result = await cdp.send("Runtime.getHeapUsage");
  assert(
    Number.isFinite(result.backingStorageSize),
    "Backing-store measurement unavailable",
  );
  return result.usedSize + result.backingStorageSize;
}

async function main() {
  const requestedCases = (
    process.env.CANONICAL_CASES ?? canonicalCases.join(",")
  ).split(",");
  const models = (process.env.CANONICAL_MODELS ?? "structured,opaque8").split(
    ",",
  ) as Model[];
  const passes = (process.env.CANONICAL_PASSES ?? "id-only,editor").split(
    ",",
  ) as Pass[];
  const histories = (process.env.CANONICAL_HISTORY_LIMITS ?? "0,100")
    .split(",")
    .map(Number);
  const repetitions = Number(process.env.CANONICAL_TRIALS ?? 3);
  const browserIsolation = process.env.CANONICAL_BROWSER_ISOLATION ?? "process";
  assert(browserIsolation === "process" || browserIsolation === "context");
  assert(
    requestedCases.length &&
      new Set(requestedCases).size === requestedCases.length,
  );
  for (const id of requestedCases) {
    assert(
      (canonicalCases as readonly string[]).includes(id),
      `Unsupported canonical case ${id}`,
    );
    explorationCandidate(id);
  }
  assert(
    models.length &&
      models.every((m) => m === "structured" || m === "opaque8") &&
      new Set(models).size === models.length,
  );
  assert(
    passes.length &&
      passes.every((p) => p === "id-only" || p === "editor") &&
      new Set(passes).size === passes.length,
  );
  assert(
    histories.length &&
      histories.every((h) => h === 0 || h === 100) &&
      new Set(histories).size === histories.length,
  );
  assert(Number.isSafeInteger(repetitions) && repetitions > 0);
  const directory = path.resolve(
    __dirname,
    "../../results",
    process.env.CANONICAL_OUTPUT ?? "exploration",
  );
  fs.mkdirSync(directory, { recursive: true });
  const destination = path.join(directory, "canonical.json");
  // Claim the path before expensive preparation. Never overwrite another run.
  const descriptor = fs.openSync(destination, "wx");
  const save = (value: unknown) => {
    const bytes = Buffer.from(JSON.stringify(value, null, 2) + "\n");
    fs.writeSync(descriptor, bytes, 0, bytes.length, 0);
    fs.ftruncateSync(descriptor, bytes.length);
    fs.fsyncSync(descriptor);
  };
  save({
    complete: false,
    stage: "preparing",
    generatedAt: new Date().toISOString(),
  });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
  let server: http.Server | undefined;
  try {
    const workloads = await canonicalWorkloads();
    for (const model of models) {
      const workload = workloads[model];
      assert.equal(workload.metadata.counts.operations, 259778);
      assert.equal(workload.chunks.at(-1)!.completed, 259778);
      assert.deepEqual(
        workload.metadata.checkpoints,
        [10000, 50000, 100000, 200000, 259778],
      );
      assert.equal(
        workload.metadata.source.upstreamVerification.verified,
        true,
        "Verify the pinned upstream trace before measuring",
      );
      assert.equal(workload.chunks[0].start, 0);
      for (let i = 0; i < workload.chunks.length; i++) {
        const chunk = workload.chunks[i];
        assert.equal(chunk.start, i ? workload.chunks[i - 1].completed : 0);
        assert.equal(chunk.edits.length, chunk.completed - chunk.start);
      }
    }
    const traces = new Map(
      models.map((model) => [
        model,
        JSON.stringify(workloads[model].chunks.flatMap((c) => c.edits)),
      ]),
    );
    const bundle = await build({
      entryPoints: [path.join(__dirname, "canonical-page.ts")],
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
    server = http.createServer((request, response) => {
      response.setHeader("Cache-Control", "no-store");
      if (request.url === "/") {
        response.setHeader("Content-Type", "text/html");
        response.end(
          '<!doctype html><meta charset="utf-8"><style>body{font:16px/1.45 Arial;margin:24px}#editor{max-width:760px}.ProseMirror{white-space:pre-wrap;overflow-wrap:break-word}p{margin:0 0 12px}</style><main id="editor"></main><script src="/bundle.js"></script>',
        );
      } else if (request.url === "/bundle.js") {
        response.setHeader("Content-Type", "text/javascript");
        response.end(bundle.outputFiles[0].contents);
      } else if (
        request.url?.startsWith("/trace/") &&
        traces.has(request.url.slice(7) as Model)
      ) {
        response.setHeader("Content-Type", "application/json");
        response.end(traces.get(request.url.slice(7) as Model));
      } else {
        response.statusCode = 404;
        response.end();
      }
    });
    await new Promise<void>((resolve, reject) => {
      server!.once("error", reject);
      server!.listen(0, "127.0.0.1", resolve);
    });
    const address = server.address();
    assert(address && typeof address !== "string");
    const origin = `http://127.0.0.1:${address.port}`;
    const launchBrowser = () =>
      chromium.launch({
        headless: true,
        args: ["--enable-precise-memory-info"],
        ...(process.env.BROWSER_EXECUTABLE
          ? { executablePath: process.env.BROWSER_EXECUTABLE }
          : {}),
      });
    browser = await launchBrowser();
    const browserVersion = browser.version();
    const jobs = models.flatMap((model) =>
      requestedCases
        .filter((id) => model !== "opaque8" || !id.startsWith("f08-"))
        .flatMap((id) =>
          passes.flatMap((pass) =>
            (pass === "id-only" ? [0] : histories).flatMap((historyLimit) =>
              Array.from({ length: repetitions }, (_, repetition) => ({
                model,
                id,
                pass,
                historyLimit,
                repetition,
              })),
            ),
          ),
        ),
    );
    assert(jobs.length > 0);
    // Stable interleaving prevents every trial of one format running consecutively.
    let seed = 761;
    for (let i = jobs.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
    }
    const rows: CanonicalReplayResult[] = [];
    const result = {
      complete: false,
      generatedAt: new Date().toISOString(),
      browser: browserVersion,
      browserIsolation,
      browserBundleSha256: createHash("sha256")
        .update(bundle.outputFiles[0].contents)
        .digest("hex"),
      node: process.version,
      cpu: os.cpus()[0].model,
      platform: `${process.platform}/${process.arch}`,
      cpuRate: 1,
      operations: 259778,
      documents: 1,
      repetitions,
      cases: requestedCases,
      models,
      passes,
      histories,
      expectedRows: jobs.length,
      metadata: Object.fromEntries(
        models.map((model) => [model, workloads[model].metadata]),
      ),
      inProgress: null as null | {
        job: (typeof jobs)[number];
        startedAt: string;
        hostLoadAverageBefore: number[];
        checkpoints: CanonicalCheckpointResult[];
      },
      methodology: {
        idOnly:
          "One uninterrupted clock around all operations, natural GC only. Common precomputed trace is retained during the loop and released before post-run memory. No per-operation timers or yields. Initialization, input preparation and final verification excluded.",
        editor:
          "Incremental ProseMirror transaction for every operation, including paragraph split/join. Shared Fenwick paragraph mapping, anchor/target verification, ID-history maintenance, and two animation frames at each checkpoint are included. Elapsed time is the sum of five segments, not uninterrupted throughput. Forced GC and full reference verification are outside segment clocks.",
        identities:
          "All containers receive the same precomputed identities per model. Actual insertion anchors/deletion targets are obtained through list.at inside timed operations and checked against the reference. Each insertion creates the same small ID object inside the clock; continuing a bunch reuses the actual anchor's bunchId string, matching generateAfter without a retained intern pool. Workload validation proves any non-continuing bunch is globally new. Identity-value generation is excluded for every candidate. Serialized trace input still creates common transient garbage.",
        memory:
          "Heap plus backing storage after forced GC, minus prepared-page baseline measured before empty container/editor initialization. Trace chunks and expected states are released before observations. History retains prior 100 ID-list versions only, not ProseMirror undo. Before-GC samples are boundary observations, not peaks. releasedHistoryBytes is retained total after release; historyFreedBytes is the difference.",
        trials: `${browserIsolation === "process" ? "Fresh browser process and context for every full replay" : "Fresh browser context for each full replay; browser process is shared (pilot reproduction mode)"}. Browser launch/close are outside all clocks; browser version must remain unchanged. Three trials by default: report median and range, not p95. One initially empty document; separate from the four-preloaded-document load/session suite.`,
        hostPressure:
          "Per-job wall-clock timestamps and host 1/5/15-minute load averages are sampled outside all browser timers, before context creation and after final verification/collection. They are diagnostic context, not thermal measurements or grounds for automatic outlier removal.",
      },
      rows,
    };
    save(result);
    for (const job of jobs) {
      const startedAt = new Date().toISOString();
      const hostLoadAverageBefore = os.loadavg();
      browser ??= await launchBrowser();
      assert.equal(
        browser.version(),
        browserVersion,
        "Browser version changed between full replays",
      );
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
      });
      try {
        const page = await context.newPage();
        await page.goto(origin);
        await page.waitForFunction(() => Boolean(window.canonicalBenchmark));
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const baselineBytes = await heap(cdp);
        await page.evaluate(
          ({ id, pass }) =>
            window.canonicalBenchmark.initialize(id, pass === "editor"),
          job,
        );
        const emptyInitializedBytes = (await heap(cdp)) - baselineBytes;
        const workload = workloads[job.model];
        const checkpoints: CanonicalCheckpointResult[] = [];
        result.inProgress = {
          job,
          startedAt,
          hostLoadAverageBefore,
          checkpoints,
        };
        save(result);
        if (job.pass === "id-only") {
          assert.equal(
            await page.evaluate(
              (url) => window.canonicalBenchmark.prepareFullTrace(url),
              `/trace/${job.model}`,
            ),
            259778,
          );
          await heap(cdp);
          const sample = await page.evaluate(() =>
            window.canonicalBenchmark.replayFullTrace(),
          );
          assert.equal(sample.operations, 259778);
          const beforeGCBytes = (await heap(cdp, false)) - baselineBytes;
          const last = workload.chunks.at(-1)!;
          const checked = await page.evaluate(
            ({ expected, completed }) =>
              window.canonicalBenchmark.check(expected, completed),
            { expected: expectedCheck(last), completed: last.completed },
          );
          const retainedBytes = (await heap(cdp)) - baselineBytes;
          checkpoints.push({
            completed: last.completed,
            segmentOperations: sample.operations,
            elapsedMs: sample.elapsedMs,
            retainedVersions: sample.retainedVersions,
            beforeGCBytes,
            retainedBytes,
            fullSavedState: checked.fullSavedState,
            sampledLookups: checked.sampledLookups,
            renderedText: checked.renderedText,
          });
        } else {
          for (const chunk of workload.chunks) {
            const sample = await page.evaluate(
              ({ edits, start, historyLimit }) =>
                window.canonicalBenchmark.replayEditorChunk(
                  edits,
                  start,
                  historyLimit,
                ),
              {
                edits: chunk.edits,
                start: chunk.start,
                historyLimit: job.historyLimit,
              },
            );
            assert.equal(sample.operations, chunk.completed - chunk.start);
            assert.equal(
              sample.retainedVersions,
              job.historyLimit
                ? Math.min(job.historyLimit, chunk.completed)
                : 0,
            );
            const beforeGCBytes = (await heap(cdp, false)) - baselineBytes;
            const checked = await page.evaluate(
              ({ expected, completed }) =>
                window.canonicalBenchmark.check(expected, completed),
              { expected: expectedCheck(chunk), completed: chunk.completed },
            );
            // Both calls have returned: browser references to serialized edits and
            // expected IDs/text are now gone before the forced-GC observation.
            const retainedBytes = (await heap(cdp)) - baselineBytes;
            checkpoints.push({
              completed: chunk.completed,
              segmentOperations: sample.operations,
              elapsedMs: sample.elapsedMs,
              retainedVersions: sample.retainedVersions,
              beforeGCBytes,
              retainedBytes,
              fullSavedState: checked.fullSavedState,
              sampledLookups: checked.sampledLookups,
              renderedText: checked.renderedText,
            });
            save(result);
            console.log(
              `${rows.length + 1}/${jobs.length} ${job.model} ${job.id} ${job.pass} history=${job.historyLimit} trial=${job.repetition + 1}: ${chunk.completed}/259778`,
            );
          }
        }
        await page.evaluate(() => window.canonicalBenchmark.releaseHistory());
        const releasedHistoryBytes = (await heap(cdp)) - baselineBytes;
        const operations = checkpoints.reduce(
          (sum, row) => sum + row.segmentOperations,
          0,
        );
        assert.equal(operations, 259778);
        rows.push({
          ...job,
          startedAt,
          finishedAt: new Date().toISOString(),
          hostLoadAverageBefore,
          hostLoadAverageAfter: os.loadavg(),
          operations,
          elapsedMs: checkpoints.reduce((sum, row) => sum + row.elapsedMs, 0),
          baselineBytes,
          emptyInitializedBytes,
          checkpoints,
          releasedHistoryBytes,
          historyFreedBytes:
            checkpoints.at(-1)!.retainedBytes - releasedHistoryBytes,
        });
        result.inProgress = null;
        save(result);
        console.log(
          `${rows.length}/${jobs.length} complete: ${job.model} ${job.id} ${job.pass} history=${job.historyLimit} trial=${job.repetition + 1}`,
        );
      } finally {
        try {
          await context.close();
        } finally {
          if (browserIsolation === "process") {
            await browser.close();
            browser = undefined;
          }
        }
      }
    }
    assert.equal(rows.length, jobs.length);
    result.complete = true;
    save(result);
    console.log(
      `Completed ${rows.length} full canonical replays: ${destination}`,
    );
  } finally {
    await browser?.close();
    if (server)
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    fs.closeSync(descriptor);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
