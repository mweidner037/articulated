import assert from "assert";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { calculateObjectSize, deserialize, serialize } from "bson";
import {
  ElementIdGenerator,
  IdList,
  SavedIdList,
  SavedSignedCountIdList,
} from "../src";
import { realTextTraceEdits } from "./internal/util";

type Style = "nanoid" | "uuid" | "shared-prefix";
type Mode =
  | "objects"
  | "signed-count-objects"
  | "original-tree"
  | "signed-count-tree";
const copies = 20;
const samples = 5;
function replay(style: Style) {
  let next = 0;
  let list = IdList.new();
  const generator = new ElementIdGenerator(() => {
    const index = next++;
    if (style === "shared-prefix")
      return `00000000-0000-4000-8000-000000000000${index}`;
    const hash = createHash("sha256").update(`bunch-${index}`).digest();
    if (style === "nanoid") return hash.toString("base64url").slice(0, 8);
    hash[6] = (hash[6] & 15) | 64;
    hash[8] = (hash[8] & 63) | 128;
    const hex = hash.subarray(0, 16).toString("hex");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
      12,
      16
    )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  });
  for (const edit of realTextTraceEdits().edits) {
    if (edit[2] !== undefined) {
      const before = edit[0] === 0 ? null : list.at(edit[0] - 1);
      list = list.insertAfter(before, generator.generateAfter(before));
    } else list = list.delete(list.at(edit[0]));
  }
  return list;
}
function gc() {
  for (let i = 0; i < 4; i++) global.gc!();
}
function median(values: number[]) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}
function memory(style: Style, mode: Mode) {
  const list = replay(style);
  const source = JSON.stringify(list.save());
  const signed = JSON.stringify(list.saveSignedCounts());
  const factory = (): unknown => {
    if (mode === "objects") return JSON.parse(source) as unknown;
    if (mode === "signed-count-objects") return JSON.parse(signed) as unknown;
    if (mode === "original-tree")
      return IdList.load(JSON.parse(source) as SavedIdList);
    return IdList.loadSignedCounts(
      JSON.parse(signed) as SavedSignedCountIdList
    );
  };
  for (let i = 0; i < 3; i++) factory();
  let retained: unknown[] = [];
  const heap: number[] = [],
    buffers: number[] = [],
    total: number[] = [];
  for (let sample = 0; sample < samples; sample++) {
    retained = [];
    gc();
    const before = process.memoryUsage();
    for (let i = 0; i < copies; i++) retained.push(factory());
    gc();
    const after = process.memoryUsage();
    const h = (after.heapUsed - before.heapUsed) / copies;
    const b = (after.arrayBuffers - before.arrayBuffers) / copies;
    heap.push(h);
    buffers.push(b);
    total.push(h + b);
  }
  // Keep setup state alive, so its collection is not mistaken for savings.
  assert.equal(list.save().length, 11757);
  assert.equal(retained.length, copies);
  assert(source.length && signed.length);
  return {
    heap: Math.round(median(heap)),
    buffers: Math.round(median(buffers)),
    total: Math.round(median(total)),
    min: Math.round(Math.min(...total)),
    max: Math.round(Math.max(...total)),
  };
}
if (!global.gc) throw new Error("Use npm run benchmarks:storage (--expose-gc)");
if (process.argv[2] === "--memory")
  console.log(
    JSON.stringify(memory(process.argv[3] as Style, process.argv[4] as Mode))
  );
else {
  console.log(
    `# Signed-count object benchmark\n\nNode ${process.version}, V8 ${process.versions.v8}, ${process.platform}/${process.arch}.`
  );
  console.log(
    `\nMemory: fresh child per case, ${samples} samples, ${copies} retained copies, 3 warmups, 4 GCs before/after. Total = heapUsed + arrayBuffers. Inputs excluded. Node proxy, not browser heap or peak allocation.`
  );
  console.log(
    "\n259,778-edit repository trace; deterministic SHA-256-derived ID fixtures. Logical BSON wraps snapshots in {state: value}, no _id. Disk is measured separately by mongo-signed-counts.mongosh."
  );
  console.log(
    '\nExample: {bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true} -> {bunchId: "aB3dE5fG", startCounter: 3, count: -2}\n'
  );
  for (const style of ["nanoid", "uuid", "shared-prefix"] as const) {
    const list = replay(style);
    const saved = list.save(),
      signed = list.saveSignedCounts();
    const values = { objects: saved, "signed-count-objects": signed };
    for (const input of [
      JSON.parse(JSON.stringify(signed)) as SavedSignedCountIdList,
      deserialize(serialize({ state: signed })).state as SavedSignedCountIdList,
    ]) {
      const loaded = IdList.loadSignedCounts(input);
      assert.deepStrictEqual(loaded.save(), saved);
      assert.deepStrictEqual(loaded.saveSignedCounts(), signed);
      assert.deepStrictEqual([...loaded], [...list]);
    }
    console.log(
      `## ${style}\n\n${saved.length} runs; ${
        new Set(saved.map((run) => run.bunchId)).size
      } distinct IDs.\n`
    );
    console.log(
      "| Format | Logical BSON bytes | Retained JS bytes | JS min-max |\n|---|---:|---:|---:|"
    );
    for (const mode of [
      "objects",
      "signed-count-objects",
      "original-tree",
      "signed-count-tree",
    ] as const) {
      const child = spawnSync(
        process.execPath,
        [...process.execArgv, __filename, "--memory", style, mode],
        { encoding: "utf8" }
      );
      assert.equal(child.status, 0, child.stderr);
      const result = JSON.parse(child.stdout) as ReturnType<typeof memory>;
      let size: number | string = "—";
      if (mode === "objects" || mode === "signed-count-objects") {
        const doc = { state: values[mode] };
        size = serialize(doc).length;
        assert.equal(size, calculateObjectSize(doc));
      }
      console.log(
        `| ${mode} | ${size} | ${result.total} | ${result.min}–${result.max} |`
      );
    }
    console.log("");
  }
  console.log(
    "All JSON, BSON, editing-tree, and live-ID round trips passed. Live tree layout unchanged; timing and peak memory not measured."
  );
}
