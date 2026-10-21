import { build } from "esbuild";
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { chromium, type CDPSession } from "playwright";
import { fixture } from "../full_picture/fixture";
import { loadTrace } from "../internal/trace";
import { explorationCandidates } from "./exploration-candidates";
import { formats } from "./formats";
import { opaqueFixture } from "./opaque-fixture";
import { sessionWorkload } from "./session-workload";

async function main() {
  const idModel = (process.env.BROWSER_ID_MODEL ?? "structured") as
    "structured" | "opaque8";
  assert(["structured", "opaque8"].includes(idModel));
  const original = await fixture();
  const saved = idModel === "opaque8" ? opaqueFixture(original) : original;
  const { finalText } = await loadTrace("kleppmannReal", false);
  const candidates = explorationCandidates.filter(
    (c) =>
      (idModel !== "opaque8" ||
        (c.shape !== formats.split.name && c.shape !== formats.client.name)) &&
      (!process.env.SESSION_CASES ||
        process.env.SESSION_CASES.split(",").includes(c.id)),
  );
  const repetitions = Number(process.env.SESSION_TRIALS ?? 3),
    documents = Number(process.env.SESSION_DOCUMENTS ?? 4);
  const operations = Number(process.env.SESSION_OPERATIONS ?? 2000);
  assert(repetitions > 0 && documents > 0 && operations >= 1000);
  const workloads = {
    local: sessionWorkload(saved, finalText, "local", operations, idModel),
    distributed: sessionWorkload(
      saved,
      finalText,
      "distributed",
      operations,
      idModel,
    ),
    "new-bunches": sessionWorkload(
      saved,
      finalText,
      "new-bunches",
      operations,
      idModel,
    ),
  };
  const payloads = new Map(candidates.map((c) => [c.id, c.encode(saved)]));
  const document = JSON.stringify({
    type: "doc",
    content: finalText.split("\n").map((text) => ({
      type: "paragraph",
      ...(text ? { content: [{ type: "text", text }] } : {}),
    })),
  });
  const bundle = await build({
    entryPoints: [path.join(__dirname, "exploration-page.ts")],
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
  const server = http.createServer((req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<!doctype html><meta charset="utf-8"><style>body{font:16px/1.45 Arial;margin:24px}section{max-width:760px}.ProseMirror{white-space:pre-wrap;overflow-wrap:break-word}p{margin:0 0 12px}</style><main id="editors"></main><script src="/bundle.js"></script>',
      );
    } else if (req.url === "/bundle.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.end(bundle.outputFiles[0].contents);
    } else if (req.url === "/document") res.end(document);
    else if (req.url?.startsWith("/payload/") && payloads.has(req.url.slice(9)))
      res.end(payloads.get(req.url.slice(9)));
    else {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const address = server.address();
  assert(address && typeof address !== "string");
  const browser = await chromium.launch({
    headless: true,
    args: ["--enable-precise-memory-info"],
  });
  const dir = path.resolve(
    __dirname,
    "../../results",
    process.env.EXPLORATION_OUTPUT ?? "exploration",
  );
  fs.mkdirSync(dir, { recursive: true });
  const rows: {
    id: string;
    workload: string;
    historyLimit: number;
    repetition: number;
    loadedBytes: number;
    checkpoints: {
      completed: number;
      segmentOperations: number;
      listMs: number;
      totalMs: number;
      retainedVersions: number;
      retainedBytes: number;
      beforeGCBytes: number;
    }[];
    releasedHistoryBytes: number;
  }[] = [];
  const result = {
    complete: false,
    browser: browser.version(),
    cpu: os.cpus()[0].model,
    platform: `${process.platform}/${process.arch}`,
    generatedAt: new Date().toISOString(),
    idModel,
    documents,
    operations,
    repetitions,
    note: "Four real editors by default; only first edited. Each operation applies an incremental ProseMirror transaction. Two animation frames per checkpoint, not per keystroke. Memory = JS heap + backing storage after forced GC; beforeGC is a sampled boundary, not peak. Undo retains last 100 ID-list versions only, not full ProseMirror history. Workloads/checks are not retained in browser between calls.",
    rows,
  };
  const save = () =>
    fs.writeFileSync(
      path.join(dir, "sessions.json"),
      JSON.stringify(result, null, 2) + "\n",
    );
  const heap = async (cdp: CDPSession, collect = true) => {
    if (collect) await cdp.send("HeapProfiler.collectGarbage");
    const h = await cdp.send("Runtime.getHeapUsage");
    assert(Number.isFinite(h.backingStorageSize));
    return h.usedSize + h.backingStorageSize;
  };
  let seed = 98;
  const workloadNames = (
    process.env.SESSION_WORKLOADS ?? "local,distributed,new-bunches"
  ).split(",") as (keyof typeof workloads)[];
  assert(workloadNames.every((name) => name in workloads));
  const jobs = candidates.flatMap((c) =>
    workloadNames.flatMap((workload) =>
      [0, 100].flatMap((historyLimit) =>
        Array.from({ length: repetitions }, (_, repetition) => ({
          c,
          workload,
          historyLimit,
          repetition,
        })),
      ),
    ),
  );
  for (let i = jobs.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [jobs[i], jobs[j]] = [jobs[j], jobs[i]];
  }
  try {
    for (const { c, workload, historyLimit, repetition } of jobs) {
      const context = await browser.newContext(),
        page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      try {
        await page.goto(`http://127.0.0.1:${address.port}`);
        await page.evaluate(
          async ({ id, documents }) => {
            await window.benchmark.prepare(id);
            await window.benchmark.run(documents);
            window.benchmark.clear();
          },
          { id: c.id, documents },
        );
        const baseline = await heap(cdp);
        await page.evaluate(
          async ({ id, documents }) => {
            await window.benchmark.prepare(id);
            await window.benchmark.run(documents);
          },
          { id: c.id, documents },
        );
        const row: (typeof rows)[number] = {
          id: c.id,
          workload,
          historyLimit,
          repetition,
          loadedBytes: (await heap(cdp)) - baseline,
          checkpoints: [],
          releasedHistoryBytes: 0,
        };
        for (const checkpoint of workloads[workload]) {
          const sample = await page.evaluate(
            ({ edits, historyLimit }) =>
              window.benchmark.session(edits, historyLimit),
            { edits: checkpoint.edits, historyLimit },
          );
          const beforeGCBytes = (await heap(cdp, false)) - baseline;
          await page.evaluate(
            ({ expected, text }) =>
              window.benchmark.checkSession(expected, text),
            { expected: checkpoint.expected, text: checkpoint.text },
          );
          row.checkpoints.push({
            completed: checkpoint.completed,
            segmentOperations: checkpoint.edits.length,
            ...sample,
            retainedBytes: (await heap(cdp)) - baseline,
            beforeGCBytes,
          });
        }
        await page.evaluate(() => window.benchmark.dropHistory());
        row.releasedHistoryBytes = (await heap(cdp)) - baseline;
        rows.push(row);
        save();
        console.log(
          `Session ${rows.length}/${jobs.length}: ${c.id} ${workload} undo=${historyLimit} trial=${repetition}`,
        );
      } finally {
        await context.close();
      }
    }
    result.complete = true;
    save();
  } finally {
    await browser.close();
    await new Promise<void>((r) => server.close(() => r()));
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
