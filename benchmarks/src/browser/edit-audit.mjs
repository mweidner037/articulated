import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fixture } from "../full_picture/fixture.ts";
const root = path.resolve(import.meta.dirname, "../../..");
const require = createRequire(root + "/benchmarks/package.json");
const { build } = require("esbuild");
const { chromium } = require("playwright");
const saved = await fixture();
const workload = JSON.parse(
  fs.readFileSync(
    root + "/benchmarks/results/native/edit-workload.json",
    "utf8",
  ),
);
const source = `
import {nativeCandidate} from './src/browser/native-candidates';
let base, edits, expected;
globalThis.audit={
 prepare(saved,workload,kind){
  const c=nativeCandidate(kind);
  base=c.hydrate(c.decode(c.encode(saved))).insertAfter(null,{bunchId:'browser-first-edit_0',counter:0});
  edits=workload.edits; expected=JSON.stringify(workload.expected);
 },
 run(){
  let list=base;
  const start=performance.now();
  for(const e of edits)list=e.type==='insert'?list.insertAfter(e.before,e.id):list.delete(e.id);
  const ms=performance.now()-start;
  globalThis.timedWork = {...globalThis.work};
  if(JSON.stringify(list.save())!==expected)throw Error('Incorrect final IDs');
  return ms;
 }
};`;
async function bundle(instrument = false) {
  return (
    await build({
      stdin: {
        contents: source,
        resolveDir: root + "/benchmarks",
        loader: "ts",
      },
      bundle: true,
      write: false,
      platform: "browser",
      format: "iife",
      sourcemap: "inline",
      plugins: instrument
        ? [
            {
              name: "count-work",
              setup(b) {
                b.onLoad({ filter: /\/browser\/native\.ts$/ }, ({ path }) => {
                  let text = fs.readFileSync(path, "utf8");
                  text = text.replace(
                    "function scan(s: F08, visit: Visit) {",
                    "function scan(s: F08, visit: Visit) { globalThis.work.scans++; globalThis.work.maps += s.clientIds.length;",
                  );
                  text = text.replace(
                    "for (let i = 0; i < s.counts.length; i++) {",
                    "for (let i = 0; i < s.counts.length; i++) { globalThis.work.runs++;",
                  );
                  text = text.replace(
                    "this.pending = [c, seq, start, count];",
                    "{ globalThis.work.tuples++; this.pending = [c, seq, start, count]; }",
                  );
                  text = text.replace(
                    "this.next = clients.map(() => new Map());",
                    "globalThis.work.maps += clients.length; this.next = clients.map(() => new Map());",
                  );
                  return { contents: text, loader: "ts" };
                });
              },
            },
          ]
        : [],
      alias: {
        "node:assert/strict": root + "/benchmarks/src/browser/shims.ts",
        "node:os": root + "/benchmarks/src/browser/shims.ts",
      },
    })
  ).outputFiles[0].text;
}
const browser = await chromium.launch({
  headless: true,
  args: ["--enable-precise-memory-info"],
});
const results = [];
try {
  const js = await bundle();
  for (let round = 0; round < 3; round++)
    for (const kind of round % 2
      ? ["f08-native", "f08-tree"]
      : ["f08-tree", "f08-native"]) {
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.addScriptTag({ content: js });
      await page.evaluate(
        ({ saved, workload, kind }) =>
          globalThis.audit.prepare(saved, workload, kind),
        { saved, workload, kind },
      );
      const cold = await page.evaluate(() => globalThis.audit.run());
      for (let i = 0; i < 3; i++)
        await page.evaluate(() => globalThis.audit.run());
      const samples = [];
      for (let i = 0; i < 10; i++)
        samples.push(await page.evaluate(() => globalThis.audit.run()));
      results.push({ round, kind, cold, samples });
      console.log(JSON.stringify(results.at(-1)));
      await context.close();
    }
  const context = await browser.newContext(),
    page = await context.newPage();
  await page.evaluate(() => {
    globalThis.work = { scans: 0, runs: 0, tuples: 0, maps: 0 };
  });
  await page.addScriptTag({ content: await bundle(true) });
  await page.evaluate(
    ({ saved, workload }) =>
      globalThis.audit.prepare(saved, workload, "f08-native"),
    { saved, workload },
  );
  const work = await page.evaluate(() => {
    globalThis.work = { scans: 0, runs: 0, tuples: 0, maps: 0 };
    globalThis.audit.run();
    return globalThis.timedWork;
  });
  // Snapshot counters before the out-of-timer save() correctness check.
  console.log("instrumented timed edits ONLY", JSON.stringify(work));
  await context.close();
  const profileContext = await browser.newContext(),
    p = await profileContext.newPage();
  await p.addScriptTag({ content: js });
  await p.evaluate(
    ({ saved, workload }) =>
      globalThis.audit.prepare(saved, workload, "f08-native"),
    { saved, workload },
  );
  const cdp = await profileContext.newCDPSession(p);
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.start");
  await p.evaluate(() => {
    for (let i = 0; i < 20; i++) globalThis.audit.run();
  });
  const { profile } = await cdp.send("Profiler.stop");
  const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
  const hits = {};
  for (const id of profile.samples ?? []) {
    const name = nodes.get(id).callFrame.functionName || "(anonymous)";
    hits[name] = (hits[name] || 0) + 1;
  }
  console.log(
    "profile sample counts (includes final checks)",
    JSON.stringify(
      Object.entries(hits)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15),
    ),
  );
  fs.writeFileSync(
    root + "/benchmarks/results/native/edit-audit.json",
    JSON.stringify(
      { browser: browser.version(), results, work, hits },
      null,
      2,
    ),
  );
  await profileContext.close();
} finally {
  await browser.close();
}
