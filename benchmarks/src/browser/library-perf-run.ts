/** Runtime first. All runs serialized; no Mongo/server/editor work in timings. */
import { build } from "esbuild";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium, type CDPSession } from "playwright";
import { canonicalWorkloads } from "./canonical-workload";
import { nativeFirstEdit } from "./edit-workload";
import { libraryCases, type LibraryCase } from "./library-perf-candidates";
import type {} from "./library-perf-page";
import { sessionWorkload } from "./session-workload";

async function heap(cdp: CDPSession) {
  await cdp.send("HeapProfiler.collectGarbage");
  const h = await cdp.send("Runtime.getHeapUsage");
  assert(Number.isFinite(h.backingStorageSize));
  return h.usedSize + h.backingStorageSize;
}
async function main() {
  const directory = path.resolve(
    __dirname,
    "../../results",
    process.env.LIBRARY_OUTPUT ?? "library-perf",
  );
  assert(!fs.existsSync(directory), "Never overwrite evidence");
  fs.mkdirSync(directory, { recursive: true });
  const requested = (process.env.LIBRARY_CASES ?? libraryCases.join(",")).split(
    ",",
  ) as LibraryCase[];
  assert(
    requested.length && requested.every((id) => libraryCases.includes(id)),
  );
  const repetitions = Number(process.env.LIBRARY_TRIALS ?? 3);
  assert(Number.isSafeInteger(repetitions) && repetitions > 0);
  const workloads = await canonicalWorkloads();
  const canonical = workloads.opaque8;
  const last = canonical.chunks.at(-1)!;
  const fixture = JSON.stringify(last.expected);
  const hash = (s: string | Uint8Array) =>
    createHash("sha256").update(s).digest("hex");
  assert.equal(hash(fixture), canonical.metadata.finalSavedSha256);
  const payloads = new Map<string, string>([
    ["/fixture", fixture],
    [
      "/trace",
      JSON.stringify({
        edits: canonical.chunks.flatMap((c) => c.edits),
        expected: last.expected,
      }),
    ],
  ]);
  for (const kind of ["local", "distributed", "new-bunches"] as const) {
    const chunks = sessionWorkload(
      last.expected,
      canonical.finalText,
      kind,
      2000,
      "opaque8",
    );
    payloads.set(
      `/session/${kind}`,
      JSON.stringify({
        edits: chunks.flatMap((c) => c.edits),
        expected: chunks.at(-1)!.expected,
        firstId: { bunchId: nativeFirstEdit, counter: 0 },
      }),
    );
  }
  const metadata = canonical.metadata;
  workloads.opaque8.chunks = [];
  workloads.structured.chunks = [];
  const bundle = await build({
    entryPoints: [path.join(__dirname, "library-perf-page.ts")],
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
    path.join(directory, "measured-bundle.js"),
    bundle.outputFiles[0].contents,
  );
  const rows: unknown[] = [],
    profiles: unknown[] = [];
  const result = {
    complete: false,
    generatedAt: new Date().toISOString(),
    cpu: os.cpus()[0].model,
    platform: `${process.platform}/${process.arch}`,
    node: process.version,
    browser: "",
    cases: requested,
    repetitions,
    sourceSavedSha256: hash(fixture),
    bundleSha256: hash(bundle.outputFiles[0].contents),
    canonical: metadata,
    calibration: {} as unknown,
    rows,
    profiles,
    interpretation: [
      "Explicit1xCPU; fresh contexts in one browser process, not separate browser processes.",
      "Load samples are warm replacement construction, excluding JSON.parse; load CPU profiles include parsing.",
      "Canonical CPU profiles include post-clock validation; diagnostic only.",
      "Remote sessions omit at, anchor checks, and ID-object creation; not a pure at-time subtraction.",
      "Local lookup is first20000positions sequentially, not cursor-local.",
      "Heap deltas include post-warmup runtime/JIT growth, not exclusively list bytes.",
      "All existing-tree variants use the same thin runtime wrapper; native variants use direct calls.",
      "Three case rotations do not fully counterbalance all candidates; report ranges, not significance.",
    ],
    methodology:
      "Library-only Chromium. Same decoded F01 input; native conversion charged in load. 20 warm loads after one warmup per fresh context. Replay clock includes anchor validation and optional last-100 ID-version retention, not final full-state/history verification. Full canonical stream is uninterrupted, 259778 operations; loaded sessions are2000. Lookup pairs=at+indexOf, not separate operations. Forced GC before/after tests, never inside timed replay. Memory=heap+backing relative to empty warmed context; input JSON text retained in baseline, decoded run objects released. CPU profiles are separate diagnostic runs, never mixed into unprofiled timing. No editor/rendering, network or Mongo metrics.",
  };
  const save = () =>
    fs.writeFileSync(
      path.join(directory, "results.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
  save();
  const server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.url === "/")
      res.end('<!doctype html><script src="/bundle.js"></script>');
    else if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(bundle.outputFiles[0].contents);
    } else if (payloads.has(req.url!)) {
      res.setHeader("Content-Type", "application/json");
      res.end(payloads.get(req.url!));
    } else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const addr = server.address();
  assert(addr && typeof addr !== "string");
  const origin = `http://127.0.0.1:${addr.port}`;
  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-precise-memory-info"],
  });
  result.browser = browser.version();
  async function context(id: LibraryCase) {
    const ctx = await browser.newContext(),
      page = await ctx.newPage(),
      cdp = await ctx.newCDPSession(page);
    await page.goto(origin);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await page.evaluate((id) => window.libraryPerf.prepare(id), id);
    await page.evaluate(() => {
      window.libraryPerf.load();
      window.libraryPerf.clear();
    });
    return { ctx, page, cdp };
  }
  try {
    {
      const { ctx, page, cdp } = await context(requested[0]);
      const before = await cdp.send("Runtime.getHeapUsage");
      await page.evaluate(() => {
        (window as unknown as { calibration: Uint8Array }).calibration =
          new Uint8Array(8 * 1024 * 1024);
      });
      const after = await cdp.send("Runtime.getHeapUsage");
      assert(
        after.backingStorageSize - before.backingStorageSize >= 8 * 1024 * 1024,
      );
      assert(after.usedSize - before.usedSize < 4 * 1024 * 1024);
      result.calibration = { before, after };
      await ctx.close();
    }
    // Rotate case order each repetition; hold runtime work fixed within each job.
    for (let repetition = 0; repetition < repetitions; repetition++) {
      const ordered = requested
        .slice(repetition % requested.length)
        .concat(requested.slice(0, repetition % requested.length));
      for (const id of ordered) {
        {
          const { ctx, page, cdp } = await context(id);
          try {
            const baseline = await heap(cdp);
            const samples = await page.evaluate(() =>
              window.libraryPerf.loadTrials(20),
            );
            const loadedBytes = (await heap(cdp)) - baseline;
            await page.evaluate(() => window.libraryPerf.checkLoaded());
            const lookup = [];
            for (const kind of ["local", "random"] as const)
              lookup.push({
                kind,
                ...(await page.evaluate(
                  (k) => window.libraryPerf.lookups(k),
                  kind,
                )),
              });
            rows.push({
              id,
              repetition,
              kind: "load-lookups",
              samples,
              loadedBytes,
              lookup,
              stress: await page.evaluate(() => window.libraryPerf.stress()),
            });
            save();
          } finally {
            await ctx.close();
          }
        }
        for (const kind of [
          "canonical",
          "local",
          "distributed",
          "new-bunches",
          "remote-distributed",
          "remote-new-bunches",
        ])
          for (const historyLimit of [0, 100]) {
            const { ctx, page, cdp } = await context(id);
            try {
              const baseline = await heap(cdp);
              await page.evaluate(
                (empty) => window.libraryPerf.load(empty),
                kind === "canonical",
              );
              const operations =
                kind === "canonical"
                  ? await page.evaluate(() => window.libraryPerf.prepareTrace())
                  : await page.evaluate(
                      (k) => window.libraryPerf.prepareSession(k),
                      kind.replace("remote-", ""),
                    );
              assert.equal(operations, kind === "canonical" ? 259778 : 2000);
              await heap(cdp);
              const sample = await page.evaluate(
                ({ h, remote }) => window.libraryPerf.replay(h, remote),
                { h: historyLimit, remote: kind.startsWith("remote-") },
              );
              const retainedBytes = (await heap(cdp)) - baseline;
              await page.evaluate(() => window.libraryPerf.releaseHistory());
              const releasedHistoryBytes = (await heap(cdp)) - baseline;
              rows.push({
                id,
                repetition,
                kind,
                historyLimit,
                ...sample,
                retainedBytes,
                releasedHistoryBytes,
              });
              save();
            } finally {
              await ctx.close();
            }
          }
        console.log(
          `Library runtime: ${id}, repetition ${repetition + 1}/${repetitions}`,
        );
      }
    }
    for (const id of requested.filter(
      (id) =>
        ![
          "native-64",
          "native-256",
          "native-reuse-64",
          "native-reuse-256",
        ].includes(id),
    ))
      for (const kind of ["load", "canonical"] as const) {
        const { ctx, page, cdp } = await context(id);
        try {
          if (kind === "canonical") {
            await page.evaluate(() => window.libraryPerf.load(true));
            await page.evaluate(() => window.libraryPerf.prepareTrace());
          }
          await cdp.send("Profiler.enable");
          await cdp.send("Profiler.setSamplingInterval", { interval: 500 });
          await cdp.send("Profiler.start");
          if (kind === "canonical")
            await page.evaluate(() => window.libraryPerf.replay(0));
          else await page.evaluate(() => window.libraryPerf.loadTrials(100));
          const { profile } = await cdp.send("Profiler.stop");
          const filename = `${id}-${kind}.cpuprofile`;
          fs.writeFileSync(
            path.join(directory, filename),
            JSON.stringify(profile),
          );
          profiles.push({
            id,
            kind,
            filename,
            samples: profile.samples?.length,
          });
          save();
        } finally {
          await ctx.close();
        }
      }
    assert.equal(rows.length, requested.length * repetitions * 13);
    result.complete = true;
    save();
  } finally {
    await browser.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
