import { build } from "esbuild";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium, type CDPSession, type Page } from "playwright";
import { fixture } from "../full_picture/fixture";
import { loadTrace } from "../internal/trace";
import type { Candidate } from "./candidates";
import type { EditWorkload } from "./edit-workload";
import { internalFormat } from "./formats";
import { opaqueFixture } from "./opaque-fixture";
import type { BrowserSample } from "./page";
import type { EditSample } from "./page-runtime";
import { analyzeTrace, type TraceEvent } from "./trace";

export async function runBrowserBenchmark(
  candidates: Candidate[],
  suite: {
    output: string;
    page: string;
    edits?: (
      saved: Awaited<ReturnType<typeof fixture>>,
      text: string,
    ) => EditWorkload;
    fixture?: {
      saved: Awaited<ReturnType<typeof fixture>>;
      finalText: string;
      description: string;
    };
  },
) {
  const output = path.resolve(__dirname, "../../results", suite.output);
  const rounds = Number(process.env.BROWSER_ROUNDS ?? 5);
  const trials = Number(process.env.BROWSER_TRIALS ?? 20);
  const switches = Number(process.env.BROWSER_SWITCHES ?? 8);
  const memoryTrials = Number(process.env.BROWSER_MEMORY_TRIALS ?? 3);
  const counts = (process.env.BROWSER_DOCUMENTS ?? "1,4")
    .split(",")
    .map(Number);
  const cpuRate = Number(process.env.BROWSER_CPU_RATE ?? 1);
  assert(
    [rounds, trials, switches, memoryTrials, ...counts].every(
      (n) => Number.isInteger(n) && n > 0,
    ),
  );
  assert(cpuRate >= 1);
  const selected = process.env.BROWSER_CASES
    ? candidates.filter((c) =>
        process.env.BROWSER_CASES!.split(",").includes(c.id),
      )
    : candidates;
  assert(selected.length > 0);
  if (process.env.BROWSER_ARCHIVE_PREVIOUS === "1") {
    const archive = path.join(output, "previous");
    assert(!fs.existsSync(archive), "Refuse to overwrite an archived run");
    const previous = JSON.parse(
      fs.readFileSync(path.join(output, "browser.json"), "utf8"),
    );
    assert(previous.complete, "Only archive a completed reference run");
    fs.mkdirSync(archive);
    for (const name of [
      "browser.json",
      "complete.json",
      "traces",
      "rendered-editor.png",
    ])
      fs.cpSync(path.join(output, name), path.join(archive, name), {
        recursive: true,
        errorOnExist: true,
        force: false,
      });
  }
  fs.mkdirSync(path.join(output, "traces"), { recursive: true });
  const original = suite.fixture?.saved ?? (await fixture());
  const saved =
    !suite.fixture && process.env.BROWSER_ID_MODEL === "opaque8"
      ? opaqueFixture(original)
      : original;
  const { finalText } =
    suite.fixture ?? (await loadTrace("kleppmannReal", false));
  const documentJSON = JSON.stringify({
    type: "doc",
    content: finalText.split("\n").map((text) => ({
      type: "paragraph",
      ...(text ? { content: [{ type: "text", text }] } : {}),
    })),
  });
  const payloads = new Map(selected.map((c) => [c.id, c.encode(saved)]));
  for (const c of selected) {
    const state = c.decode(payloads.get(c.id)!);
    assert.deepEqual(c.hydrate(state).save(), saved);
    const base = candidates.find((other) => other.shape === c.shape)!;
    assert.deepEqual(
      c.logical(state),
      base.logical(base.decode(base.encode(saved))),
    );
  }
  const bundle = await build({
    entryPoints: [path.join(__dirname, suite.page)],
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
  fs.writeFileSync(
    path.join(output, "measured-bundle.js"),
    bundle.outputFiles[0].contents,
  );
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>IdList browser benchmark</title><style>body{margin:24px;font:16px/1.45 Arial}section{max-width:760px;margin-bottom:40px}.ProseMirror{white-space:pre-wrap;overflow-wrap:break-word;outline:none}p{margin:0 0 12px}</style></head><body><main id="editors"></main><script src="/bundle.js"></script></body></html>`;
  const server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    } else if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(bundle.outputFiles[0].contents);
    } else if (req.url === "/document") {
      res.setHeader("Content-Type", "application/json");
      res.end(documentJSON);
    } else if (
      req.url?.startsWith("/payload/") &&
      payloads.has(req.url.slice(9))
    ) {
      res.setHeader("Content-Type", "application/octet-stream");
      res.end(payloads.get(req.url.slice(9)));
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address === "object");
  const origin = `http://127.0.0.1:${address.port}`;
  const browser = await chromium
    .launch({
      headless: true,
      args: ["--enable-precise-memory-info"],
      ...(process.env.BROWSER_EXECUTABLE
        ? { executablePath: process.env.BROWSER_EXECUTABLE }
        : {}),
    })
    .catch((error) => {
      server.close();
      throw error;
    });
  async function newPage() {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => {
      console.error(error);
    });
    await page.goto(origin);
    await page.waitForFunction(() => Boolean(window.benchmark));
    const cdp = await context.newCDPSession(page);
    await cdp.send("HeapProfiler.enable");
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuRate });
    return { page, cdp, context };
  }
  async function load(page: Page, c: Candidate, count: number, memory = false) {
    await page.evaluate((id) => window.benchmark.prepare(id), c.id);
    return page.evaluate(
      ({ count, memory }) => window.benchmark.run(count, memory),
      { count, memory },
    );
  }
  async function check(page: Page) {
    await page.evaluate(
      ({ saved, finalText }) => window.benchmark.check(saved, finalText),
      { saved, finalText },
    );
  }
  interface Heap {
    usedSize: number;
    backingStorageSize: number;
    embedderHeapUsedSize: number;
  }
  async function heap(cdp: CDPSession): Promise<Heap> {
    const result = await cdp.send("Runtime.getHeapUsage");
    assert(
      Number.isFinite(result.backingStorageSize),
      "Browser must expose backing storage",
    );
    return result;
  }
  const bytes = (h: Heap) => h.usedSize + h.backingStorageSize;
  interface Row {
    id: string;
    shape: string;
    internalFormat: string;
    editSamples: EditSample[];
    editGC: ReturnType<typeof analyzeTrace>;
    encoding: string;
    path: string;
    documents: number;
    samples: (BrowserSample & { round: number })[];
    cold: BrowserSample[];
    gc: ReturnType<typeof analyzeTrace>;
    gcSamples: BrowserSample[];
    memory: {
      baseline: Heap;
      retained: Heap;
      probes: { stage: string; heap: Heap }[];
      observedHighWaterDelta: number;
      retainedDelta: number;
      sampledAllocation: number;
      domNodes: number;
    }[];
  }
  const rows: Row[] = counts.flatMap((documents) =>
    selected.map((c) => ({
      id: c.id,
      shape: c.shape,
      internalFormat: c.internalFormat ?? internalFormat,
      editSamples: [],
      editGC: [],
      encoding: c.encoding,
      path: c.path,
      documents,
      samples: [],
      cold: [],
      gc: [],
      gcSamples: [],
      memory: [],
    })),
  );
  const result = {
    complete: false,
    calibration: null as { before: Heap; after: Heap } | null,
    generatedAt: new Date().toISOString(),
    idModel:
      process.env.BROWSER_ID_MODEL === "opaque8" ? "opaque8" : "structured",
    browser: browser.version(),
    playwright: "1.62.1",
    cpu: os.cpus()[0].model,
    platform: `${process.platform}/${process.arch}`,
    cpuRate,
    bundleSha256: createHash("sha256")
      .update(bundle.outputFiles[0].contents)
      .digest("hex"),
    rounds,
    trials,
    switches,
    memoryTrials,
    documentCharacters: finalText.length,
    paragraphs: finalText.split("\n").length,
    runs: saved.length,
    fixtureDescription:
      suite.fixture?.description ?? "Historical refreshed snapshot",
    sourceSavedSha256: createHash("sha256")
      .update(JSON.stringify(saved))
      .digest("hex"),
    internalFormat: suite.edits ? "Varies by row" : internalFormat,
    conversionMetric:
      "hydrate: decoded interchange state to usable internal list; excludes decoding and rendering",
    rows,
  };
  const save = () =>
    fs.writeFileSync(
      path.join(output, "browser.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
  // Deterministic shuffling, including round order. Retain the order in raw samples.
  let seed = 42;
  function shuffle<T>(values: T[]) {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  try {
    // Calibrate backing-storage accounting instead of silently excluding binaries.
    const calibration = await newPage();
    const before = await heap(calibration.cdp);
    await calibration.page.evaluate(() => {
      Object.assign(window, {
        calibrationBuffer: new Uint8Array(8 * 1024 * 1024),
      });
    });
    const after = await heap(calibration.cdp);
    assert(
      after.backingStorageSize - before.backingStorageSize >= 8 * 1024 * 1024,
    );
    assert(
      after.usedSize - before.usedSize < 4 * 1024 * 1024,
      "Heap metric already includes backing bytes; do not double count",
    );
    result.calibration = { before, after };
    await calibration.context.close();
    for (let round = 0; round < rounds; round++)
      for (const row of shuffle(rows)) {
        const c = selected.find((v) => v.id === row.id)!;
        const { page, cdp, context } = await newPage();
        try {
          row.cold.push(await load(page, c, row.documents));
          await check(page);
          for (let warm = 0; warm < 2; warm++)
            await load(page, c, row.documents);
          await cdp.send("HeapProfiler.collectGarbage");
          // No forced GC between loads. Previous editor teardown is timed.
          for (let i = 0; i < trials; i++)
            row.samples.push({
              ...(await load(page, c, row.documents)),
              round,
            });
          await check(page);
          console.log(
            `timing ${round + 1}/${rounds}: ${row.id} ×${row.documents}`,
          );
        } finally {
          await context.close();
        }
        save();
      }
    for (const row of shuffle(rows)) {
      const c = selected.find((v) => v.id === row.id)!;
      const { page, cdp, context } = await newPage();
      try {
        for (let warm = 0; warm < 2; warm++) await load(page, c, row.documents);
        await page.evaluate(() => window.benchmark.clear());
        const events: TraceEvent[] = [];
        cdp.on("Tracing.dataCollected", ({ value }) =>
          events.push(...(value as unknown as TraceEvent[])),
        );
        await cdp.send("Tracing.start", {
          categories:
            "devtools.timeline,v8,blink.user_timing,disabled-by-default-v8.gc",
          transferMode: "ReportEvents",
        });
        // Canary is outside timed markers: verify this Chromium emits recognized GC events.
        await cdp.send("HeapProfiler.collectGarbage");
        for (let i = 0; i < switches; i++)
          row.gcSamples.push(await load(page, c, row.documents));
        const complete = new Promise<void>((resolve) =>
          cdp.once("Tracing.tracingComplete", () => resolve()),
        );
        await cdp.send("Tracing.end");
        await complete;
        assert(
          events.some(
            (e) => /^(MinorGC|MajorGC)$/.test(e.name) && e.ph === "X",
          ),
          "GC canary not detected; do not report missing data as zero",
        );
        row.gc = analyzeTrace(events);
        assert.equal(row.gc.length, switches);
        assert(
          row.gc.every((g) => g.paintEvents > 0),
          "No paint observed during a measured readiness window",
        );
        fs.writeFileSync(
          path.join(output, "traces", `${row.id}-${row.documents}.json.gz`),
          gzipSync(JSON.stringify({ traceEvents: events })),
        );
        await check(page);
        if (row.id === "objects" && row.documents === 1)
          await page.screenshot({
            path: path.join(output, "rendered-editor.png"),
          });
      } finally {
        await context.close();
      }
      for (let i = 0; i < memoryTrials; i++) {
        const { page, cdp, context } = await newPage();
        try {
          await load(page, c, row.documents);
          await page.evaluate(() => window.benchmark.clear());
          await cdp.send("HeapProfiler.collectGarbage");
          const baseline = await heap(cdp);
          const probes: { stage: string; heap: Heap }[] = [];
          await page.exposeBinding(
            "memoryProbe",
            async (_source, stage: string) => {
              probes.push({ stage, heap: await heap(cdp) });
            },
          );
          await page.evaluate((id) => window.benchmark.prepare(id), c.id);
          probes.push({ stage: "input", heap: await heap(cdp) });
          await cdp.send("HeapProfiler.startSampling", {
            samplingInterval: 16384,
            includeObjectsCollectedByMajorGC: true,
            includeObjectsCollectedByMinorGC: true,
          });
          await page.evaluate(
            (count) => window.benchmark.run(count, true),
            row.documents,
          );
          const { profile } = await cdp.send("HeapProfiler.stopSampling");
          probes.push({ stage: "ready", heap: await heap(cdp) });
          await cdp.send("HeapProfiler.collectGarbage");
          const retained = await heap(cdp);
          const dom = await cdp.send("Memory.getDOMCounters");
          row.memory.push({
            baseline,
            retained,
            probes,
            observedHighWaterDelta:
              Math.max(...probes.map((p) => bytes(p.heap))) - bytes(baseline),
            retainedDelta: bytes(retained) - bytes(baseline),
            sampledAllocation: profile.samples.reduce(
              (sum, s) => sum + s.size,
              0,
            ),
            domNodes: dom.nodes,
          });
          await check(page);
        } finally {
          await context.close();
        }
      }
      console.log(`GC + memory: ${row.id} ×${row.documents}`);
      save();
    }
    if (suite.edits) {
      const workload = suite.edits(saved, finalText);
      // Ten fresh contexts/case for operation batches; one extra traced batch.
      // No primary timings are mixed with tracing.
      for (const row of shuffle(rows)) {
        const c = selected.find((v) => v.id === row.id)!;
        for (let trial = 0; trial < 11; trial++) {
          const { page, cdp, context } = await newPage();
          try {
            await load(page, c, row.documents);
            await check(page);
            await cdp.send("HeapProfiler.collectGarbage");
            const events: TraceEvent[] = [];
            if (trial === 10) {
              cdp.on("Tracing.dataCollected", ({ value }) =>
                events.push(...(value as unknown as TraceEvent[])),
              );
              await cdp.send("Tracing.start", {
                categories:
                  "devtools.timeline,v8,blink.user_timing,disabled-by-default-v8.gc",
                transferMode: "ReportEvents",
              });
              await cdp.send("HeapProfiler.collectGarbage");
            }
            const sample = await page.evaluate(
              (w) => window.benchmark.exercise(w),
              workload,
            );
            if (trial < 10) row.editSamples.push(sample);
            else {
              const done = new Promise<void>((resolve) =>
                cdp.once("Tracing.tracingComplete", () => resolve()),
              );
              await cdp.send("Tracing.end");
              await done;
              row.editGC = analyzeTrace(events);
              assert.equal(row.editGC.length, 1);
              assert(row.editGC[0].paintEvents > 0);
              assert(
                events.some(
                  (e) => /^(MinorGC|MajorGC)$/.test(e.name) && e.ph === "X",
                ),
              );
              fs.writeFileSync(
                path.join(
                  output,
                  "traces",
                  `editing-${row.id}-${row.documents}.json.gz`,
                ),
                gzipSync(JSON.stringify({ traceEvents: events })),
              );
            }
          } finally {
            await context.close();
          }
        }
        console.log(`Editing + lookups: ${row.id} ×${row.documents}`);
        save();
      }
      fs.writeFileSync(
        path.join(output, "edit-workload.json"),
        JSON.stringify(workload),
      );
    }
    result.complete = true;
    save();
    fs.writeFileSync(
      path.join(output, "complete.json"),
      JSON.stringify({
        completedAt: new Date().toISOString(),
        rows: rows.length,
        samples: rows.reduce((n, r) => n + r.samples.length, 0),
      }) + "\n",
    );
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
