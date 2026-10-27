/** Isolated numeric-storage probe, not an IdList/editor performance benchmark. */
import { build } from "esbuild";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium, type CDPSession } from "playwright";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { canonicalWorkloads } from "./canonical-workload";
import type { ProbeOptions } from "./direct-array-model";
import type {} from "./direct-array-page";

const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const median = (values: number[]) => {
  const sorted = values.slice().sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
async function heap(cdp: CDPSession) {
  await cdp.send("HeapProfiler.collectGarbage");
  const { usedSize, backingStorageSize } = await cdp.send(
    "Runtime.getHeapUsage",
  );
  assert(Number.isFinite(usedSize) && Number.isFinite(backingStorageSize));
  return { usedSize, backingStorageSize, total: usedSize + backingStorageSize };
}
async function samples(cdp: CDPSession) {
  return [await heap(cdp), await heap(cdp), await heap(cdp)];
}
type HeapSamples = Awaited<ReturnType<typeof samples>>;
function retained(samples: HeapSamples, baseline: HeapSamples) {
  const before = median(baseline.map((s) => s.total));
  return {
    median: median(samples.map((s) => s.total)) - before,
    minimum: Math.min(...samples.map((s) => s.total)) - before,
    maximum: Math.max(...samples.map((s) => s.total)) - before,
  };
}

async function main() {
  const directory = path.resolve(
    __dirname,
    "../../results",
    process.env.DIRECT_ARRAY_OUTPUT ?? "direct-array-probe",
  );
  fs.mkdirSync(directory, { recursive: true });
  const output = path.join(directory, "browser.json");
  const descriptor = fs.openSync(output, "wx");
  const save = (result: unknown) => {
    const data = Buffer.from(JSON.stringify(result, null, 2) + "\n");
    fs.writeSync(descriptor, data, 0, data.length, 0);
    fs.ftruncateSync(descriptor, data.length);
    fs.fsyncSync(descriptor);
  };
  save({
    complete: false,
    stage: "preparing",
    generatedAt: new Date().toISOString(),
  });
  let server: http.Server | undefined;
  try {
    const workloads = await canonicalWorkloads();
    const workload = workloads.opaque8;
    const saved = workload.chunks.at(-1)!.expected;
    assert.equal(saved.length, 11757);
    const snapshot = JSON.stringify(saved);
    assert.equal(hash(snapshot), workload.metadata.finalSavedSha256);
    const snapshotPath =
      "/private/tmp/articulated-direct-canonical-opaque8.json";
    if (fs.existsSync(snapshotPath))
      assert.equal(
        fs.readFileSync(snapshotPath, "utf8"),
        snapshot,
        "Existing canonical snapshot differs",
      );
    else fs.writeFileSync(snapshotPath, snapshot, { flag: "wx" });
    console.log(
      `Canonical opaque snapshot: ${snapshotPath}, SHA256 ${hash(snapshot)}`,
    );
    const fixture = toTransposedOmit(saved),
      json = JSON.stringify(fixture);
    // Retain only the final fixture in the host. No trace or reference text is
    // transferred into measured browser pages or saved in the result file.
    workloads.structured.chunks = [];
    workloads.opaque8.chunks = [];
    const bundle = await build({
      entryPoints: [path.join(__dirname, "direct-array-page.ts")],
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      target: "chrome120",
    });
    server = http.createServer((request, response) => {
      response.setHeader("Cache-Control", "no-store");
      if (request.url === "/") {
        response.setHeader("Content-Type", "text/html");
        response.end(
          '<!doctype html><meta charset="utf-8"><script src="/bundle.js"></script>',
        );
      } else if (request.url === "/bundle.js") {
        response.setHeader("Content-Type", "text/javascript");
        response.end(bundle.outputFiles[0].contents);
      } else if (request.url === "/fixture") {
        response.setHeader("Content-Type", "application/json");
        response.end(json);
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
    const cases: ProbeOptions[] = (["ordinary", "typed32"] as const).flatMap(
      (storage) => [0, 128, 256].map((pageSize) => ({ storage, pageSize })),
    );
    cases.push({ storage: "dense-only", pageSize: 128 });
    const jobs = cases.flatMap((options) =>
      [0, 100].flatMap((historyLimit) =>
        Array.from({ length: 3 }, (_, repetition) => ({
          options,
          historyLimit,
          repetition,
        })),
      ),
    );
    let seed = 804;
    for (let i = jobs.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
    }
    type Row = {
      options: ProbeOptions;
      historyLimit: number;
      repetition: number;
      startedAt: string;
      finishedAt: string;
      hostLoadAverageBefore: number[];
      hostLoadAverageAfter: number[];
      load: Awaited<ReturnType<Window["directArrayProbe"]["load"]>>;
      edit: ReturnType<Window["directArrayProbe"]["edit"]>;
      check: Awaited<ReturnType<Window["directArrayProbe"]["check"]>>;
      baseline: HeapSamples;
      loaded: HeapSamples;
      edited: HeapSamples;
      released: HeapSamples;
      retainedLoadedBytes: ReturnType<typeof retained>;
      retainedEditedBytes: ReturnType<typeof retained>;
      retainedReleasedBytes: ReturnType<typeof retained>;
    };
    const rows: Row[] = [];
    const result = {
      complete: false,
      generatedAt: new Date().toISOString(),
      browser: "",
      node: process.version,
      platform: `${process.platform}/${process.arch}`,
      cpu: os.cpus()[0].model,
      cpuRate: 1,
      browserIsolation: "process",
      browserBundleSha256: hash(bundle.outputFiles[0].contents),
      expectedRows: 42,
      repetitions: 3,
      operations: 2000,
      fixture: {
        model: "opaque8",
        savedSha256: hash(snapshot),
        f05Sha256: hash(json),
        rows: saved.length,
        uniqueBunchIds: new Set(fixture.bunchIds).size,
        sparseCounterExceptions: fixture.startCounters.length,
        maxAbsoluteCount: Math.max(...fixture.counts.map(Math.abs)),
        canonical: workload.metadata,
      },
      cases,
      calibration: null as null | {
        before: Awaited<ReturnType<typeof heap>>;
        after: Awaited<ReturnType<typeof heap>>;
      },
      methodology: {
        scope:
          "Numerical-container experiment only, not a complete IdList, ID lookup benchmark, editor or Mongo storage claim. Strings remain opaque eight-character IDs. Same F05 JSON in every case; flat vs paged topology is a separate factor from numeric representation.",
        representation:
          "Each page owns bunchId string references, signed counts, explicit reconstructed start counters, and Map<string,row-index-array>. A flat directory and cumulative visible-length prefix index cover pages. Ordinary uses JS small-integer arrays for all numeric arrays; typed32 (typed-all) uses Int32 counts plus Uint32 starts, map row indexes, and prefixes. Dense-only uses typed counts/starts/prefix but keeps ordinary small row-index arrays. This separates dense-column optimization from thousands of tiny typed-buffer wrappers.",
        loading:
          "Fetch excluded. JSON parse plus complete validation, sparse-counter reconstruction, page allocation, all typed conversions and index building are timed. Parse+initialize TOTAL is the outcome; conversion breakdown is diagnostic, not a reason to reject cheap translation that benefits runtime memory/editing. Parsed source references disappear when load returns, before GC. No original JSON retained. Cold creation in a fresh browser process per trial; no p95 claims from three editing trials/six loads per configuration.",
        editing:
          "2,000 deterministic whole-run visibility toggles, not character edits. Every mutation copies the affected count array, page object, flat page directory and prefix array, updating later prefix entries. Unchanged strings, start counters and identity maps are shared. History maintenance is timed. No forced GC inside the timed loop; common workload generation and observable checksums/verification are outside it.",
        memory:
          "Prepared-page baseline precedes load. Three consecutive after-GC heap+backing observations at each stage preserve raw ranges; 8MiB buffer calibration rejects double counting backing bytes. No workload/expected arrays retained between calls. History is 100 prior numeric-container versions only. Current state and three retained old versions are checked before memory observations. Memory ranges show collection noise, not confidence intervals or peak allocation.",
        widths:
          "Both representations deliberately enforce the same narrow domain: nonzero signed counts with magnitude <=2^31−1; start counters, end counters, row indexes, total visible length and prefixes <=2^32−1. Values outside this domain are rejected, never silently truncated. Production needs a validated Float64/safe-number fallback or wider representation; this probe does not implement it.",
        limitations:
          "No insertion, split/merge, counter mutation, new-string growth, persistent balanced-tree update or rendering is exercised. This is not proof that replacing NativeF05 columns by typed arrays has identical overall results. Retained memory includes small row-index arrays and maps; not all numeric arrays are large columns. Keep all trials, including outliers.",
      },
      rows,
    };
    save(result);
    for (const job of jobs) {
      const startedAt = new Date().toISOString(),
        hostLoadAverageBefore = os.loadavg();
      const browser = await chromium.launch({
        headless: true,
        args: ["--enable-precise-memory-info"],
      });
      try {
        if (!result.browser) result.browser = browser.version();
        assert.equal(browser.version(), result.browser);
        if (!result.calibration) {
          const context = await browser.newContext(),
            page = await context.newPage(),
            cdp = await context.newCDPSession(page);
          const before = await heap(cdp);
          await page.evaluate(() =>
            Object.assign(window, {
              calibrationBuffer: new Uint8Array(8 * 1024 * 1024),
            }),
          );
          const after = await heap(cdp);
          assert(
            after.backingStorageSize - before.backingStorageSize >=
              8 * 1024 * 1024,
          );
          assert(
            after.usedSize - before.usedSize < 4 * 1024 * 1024,
            "Heap already includes backing bytes; summing would double count",
          );
          result.calibration = { before, after };
          await context.close();
        }
        const context = await browser.newContext(),
          page = await context.newPage();
        await page.goto(origin);
        await page.waitForFunction(() => Boolean(window.directArrayProbe));
        const cdp = await context.newCDPSession(page);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const baseline = await samples(cdp);
        const load = await page.evaluate(
          (options) => window.directArrayProbe.load(options),
          job.options,
        );
        await page.evaluate(() => window.directArrayProbe.check());
        const loaded = await samples(cdp);
        const edit = await page.evaluate(
          (limit) => window.directArrayProbe.edit(limit),
          job.historyLimit,
        );
        assert.equal(edit.operations, 2000);
        assert.equal(edit.retainedVersions, job.historyLimit);
        const check = await page.evaluate(() =>
          window.directArrayProbe.check(),
        );
        assert.equal(check.oldVersionsValidated, job.historyLimit ? 3 : 0);
        const edited = await samples(cdp);
        await page.evaluate(() => window.directArrayProbe.releaseHistory());
        const released = await samples(cdp);
        rows.push({
          ...job,
          startedAt,
          finishedAt: new Date().toISOString(),
          hostLoadAverageBefore,
          hostLoadAverageAfter: os.loadavg(),
          load,
          edit,
          check,
          baseline,
          loaded,
          edited,
          released,
          retainedLoadedBytes: retained(loaded, baseline),
          retainedEditedBytes: retained(edited, baseline),
          retainedReleasedBytes: retained(released, baseline),
        });
        assert(
          rows.every(
            (row) =>
              row.load.checksum === rows[0].load.checksum &&
              row.edit.checksum === rows[0].edit.checksum,
          ),
        );
        save(result);
        console.log(
          `${rows.length}/42 ${job.options.storage} page=${job.options.pageSize || "flat"} history=${job.historyLimit} trial=${job.repetition + 1}: load=${load.totalMs.toFixed(2)}ms edit=${edit.elapsedMs.toFixed(2)}ms memory=${(rows.at(-1)!.retainedEditedBytes.median / 1e6).toFixed(3)}MB`,
        );
      } finally {
        await browser.close();
      }
    }
    assert.equal(rows.length, 42);
    result.complete = true;
    save(result);
    console.log(`Complete: ${output}`);
  } finally {
    if (server)
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    fs.closeSync(descriptor);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
