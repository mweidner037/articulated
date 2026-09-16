import assert from "assert";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import {
  Binary,
  calculateObjectSize,
  deserialize,
  Double,
  Int32,
  serialize,
} from "bson";
import {
  ColumnarIdList,
  SavedColumnarIdList,
  ElementIdGenerator,
  IdList,
  PackedIdList,
  SavedIdList,
} from "../src";
import { realTextTraceEdits } from "./internal/util";

type IdStyle = "shared-prefix" | "uuid" | "nanoid";
type Mode =
  | "objects"
  | "tuples"
  | "columns"
  | "typed-columns"
  | "packed-cold"
  | "packed-read"
  | "json-tree"
  | "columnar-tree"
  | "binary-tree";
const styles: IdStyle[] = ["shared-prefix", "uuid", "nanoid"];
const modes: Mode[] = [
  "objects",
  "tuples",
  "columns",
  "typed-columns",
  "packed-cold",
  "packed-read",
  "json-tree",
  "columnar-tree",
  "binary-tree",
];
const copies = 20;
const samples = 5;

function idFor(style: IdStyle, index: number) {
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
}

function replay(style: IdStyle): IdList {
  let next = 0,
    list = IdList.new();
  const generator = new ElementIdGenerator(() => idFor(style, next++));
  for (const edit of realTextTraceEdits().edits) {
    if (edit[2] !== undefined) {
      const before = edit[0] === 0 ? null : list.at(edit[0] - 1);
      list = list.insertAfter(before, generator.generateAfter(before));
    } else list = list.delete(list.at(edit[0]));
  }
  return list;
}

function alternatives(saved: SavedIdList) {
  return {
    tuples: saved.map((x) => [x.bunchId, x.startCounter, x.count, x.isDeleted]),
    columns: ColumnarIdList.fromSaved(saved).toJSON(),
  };
}

function numericColumns<T>(
  columns: SavedColumnarIdList,
  convert: (value: number) => T
) {
  return {
    ...columns,
    bunchIndexes: columns.bunchIndexes.map(convert),
    startCounters: columns.startCounters.map(convert),
    signedCounts: columns.signedCounts.map(convert),
  };
}

function bsonSize(value: unknown): number {
  const document = { state: value };
  const bytes = serialize(document);
  assert.equal(bytes.byteLength, calculateObjectSize(document));
  return bytes.byteLength;
}

function verifyMongoArrays(columns: SavedColumnarIdList, saved: SavedIdList) {
  const bytes = serialize({ state: columns });
  const decoded = deserialize(bytes).state as SavedColumnarIdList;
  assert.deepStrictEqual(decoded, columns);
  assert.deepStrictEqual(ColumnarIdList.load(decoded).toSaved(), saved);
  // Verify actual BSON types, not just assumptions about JS numbers.
  const raw = deserialize(bytes, { promoteValues: false }).state as Record<
    "bunchIndexes" | "startCounters" | "signedCounts",
    unknown[]
  >;
  for (const key of [
    "bunchIndexes",
    "startCounters",
    "signedCounts",
  ] as const) {
    for (const value of raw[key]) assert(value instanceof Int32);
  }
  const explicitInts = numericColumns(columns, (value) => new Int32(value));
  assert.deepStrictEqual(serialize({ state: explicitInts }), bytes);
  const explicitDoubles = numericColumns(columns, (value) => new Double(value));
  assert.deepStrictEqual(
    deserialize(serialize({ state: explicitDoubles })).state,
    columns
  );
  return { explicitInts, explicitDoubles };
}

function collect() {
  for (let i = 0; i < 4; i++) global.gc!();
}
function median(values: number[]) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

function memory(style: IdStyle, mode: Mode) {
  // Serialize source fixtures before measuring. No source tree is retained.
  const saved = replay(style).save();
  const objectJson = JSON.stringify(saved);
  const { tuples, columns } = alternatives(saved);
  const tupleJson = JSON.stringify(tuples),
    columnJson = JSON.stringify(columns);
  const bytes = PackedIdList.fromSaved(saved).toBytes();
  const factory = (): unknown => {
    switch (mode) {
      case "objects":
        return JSON.parse(objectJson) as unknown;
      case "tuples":
        return JSON.parse(tupleJson) as unknown;
      case "columns":
        return JSON.parse(columnJson) as unknown;
      case "typed-columns":
        return ColumnarIdList.load(
          JSON.parse(columnJson) as SavedColumnarIdList
        );
      case "packed-cold":
        return PackedIdList.load(bytes);
      case "packed-read": {
        const packed = PackedIdList.load(bytes);
        for (let i = 0; i < packed.runCount; i++) {
          packed.bunchIdAt(i);
          packed.startCounterAt(i);
          packed.countAt(i);
          packed.isDeletedAt(i);
        }
        return packed;
      }
      case "json-tree":
        return IdList.load(JSON.parse(objectJson) as SavedIdList);
      case "columnar-tree":
        return IdList.loadColumnar(
          JSON.parse(columnJson) as SavedColumnarIdList
        );
      case "binary-tree":
        return IdList.loadBinary(bytes);
    }
  };
  // Warm constructor/JIT paths before measuring; maintain one root for all results.
  for (let i = 0; i < 3; i++) factory();
  let retained: unknown[] = [];
  const heap: number[] = [],
    buffers: number[] = [],
    total: number[] = [];
  for (let sample = 0; sample < samples; sample++) {
    retained = [];
    collect();
    const before = process.memoryUsage();
    for (let i = 0; i < copies; i++) retained.push(factory());
    collect();
    const after = process.memoryUsage();
    const h = (after.heapUsed - before.heapUsed) / copies;
    const b = (after.arrayBuffers - before.arrayBuffers) / copies;
    heap.push(h);
    buffers.push(b);
    total.push(h + b);
    assert.equal(retained.length, copies);
  }
  // Keep fixture graphs alive across both measurements, avoiding false savings
  // from GC of setup data. arrayBuffers is added once, not again via external.
  assert.equal(saved.length, tuples.length);
  assert.equal(columns.bunchIndexes.length, saved.length);
  assert.equal(retained.length, copies);
  return {
    heap: Math.round(median(heap)),
    buffers: Math.round(median(buffers)),
    total: Math.round(median(total)),
    min: Math.round(Math.min(...total)),
    max: Math.round(Math.max(...total)),
  };
}

if (!global.gc)
  throw new Error("Run with --expose-gc (npm run benchmarks:storage)");
if (process.argv[2] === "--memory") {
  console.log(
    JSON.stringify(memory(process.argv[3] as IdStyle, process.argv[4] as Mode))
  );
} else {
  console.log("# Binary snapshot storage and JS memory benchmarks\n");
  console.log(
    `Runtime: Node ${process.version}, V8 ${process.versions.v8}, ${process.platform}/${process.arch}.\n`
  );
  console.log(
    "Reproduce: `npm ci && npm run benchmarks:storage`. No compression or network metrics.\n"
  );
  console.log(
    "Each ID variant replays the same 259,778 edits: 182,315 inserted IDs, 104,852 live IDs. UUID/8-character nanoid values are deterministic SHA-256-derived fixtures, not calls to the ID libraries.\n"
  );
  console.log(
    `Memory: fresh child process per case, median of ${samples} samples of ${copies} retained copies after GC. Total = heapUsed + arrayBuffers, not external + arrayBuffers. Min/max show sample variation. Node/V8 proxy, not a browser measurement or peak allocation measurement.\n`
  );
  console.log(
    "BSON sizes are actual serialized byte lengths for `{state: value}`, checked against calculateObjectSize. Ordinary numeric arrays are verified to contain BSON Int32 elements for this trace; explicit Int32 encoding is byte-identical. Binary values are explicitly wrapped in Binary. These are logical document bytes, not measured WiredTiger disk or cache bytes.\n"
  );
  for (const style of styles) {
    const list = replay(style),
      saved = list.save();
    const packed = PackedIdList.fromSaved(saved),
      bytes = packed.toBytes();
    assert.deepStrictEqual(packed.toSaved(), saved);
    assert.deepStrictEqual(IdList.loadBinary(bytes).save(), saved);
    const { tuples, columns } = alternatives(saved);
    const { explicitInts, explicitDoubles } = verifyMongoArrays(columns, saved);
    assert.deepStrictEqual(
      ColumnarIdList.load(
        JSON.parse(JSON.stringify(columns)) as SavedColumnarIdList
      ).toSaved(),
      saved
    );
    assert.deepStrictEqual(IdList.loadColumnar(columns).save(), saved);
    console.log(`## ${style}\n`);
    console.log(
      `${packed.runCount} runs, ${packed.bunchCount} distinct IDs; binary column widths (index/start/count): ${bytes[5]}/${bytes[6]}/${bytes[7]} bytes.\n`
    );
    console.log("| Format | BSON bytes |\n|---|---:|");
    for (const [name, value] of [
      ["Objects", saved],
      ["Four-tuples", tuples],
      ["Dictionary + ordinary Mongo arrays (automatic Int32)", columns],
      ["Dictionary + ordinary Mongo arrays (explicit Int32)", explicitInts],
      ["Dictionary + ordinary Mongo arrays (forced Double)", explicitDoubles],
      ["Packed binary v1", new Binary(bytes)],
    ] as const) {
      console.log(`| ${name} | ${bsonSize(value)} |`);
    }
    const emptyNumericColumns = numericColumns(columns, (value) => value);
    emptyNumericColumns.bunchIndexes = [];
    emptyNumericColumns.startCounters = [];
    emptyNumericColumns.signedCounts = [];
    const numericPayload = saved.length * 3 * 4;
    const numericElements = bsonSize(columns) - bsonSize(emptyNumericColumns);
    console.log(
      `\nOrdinary Mongo arrays: ${numericPayload} numeric payload bytes + ${
        numericElements - numericPayload
      } numeric element type/index-key bytes + ${bsonSize(
        emptyNumericColumns
      )} dictionary/document/array framing bytes = ${bsonSize(
        columns
      )} bytes.\n`
    );
    console.log(
      "\n| JS representation | Heap bytes | Buffer bytes | Total bytes | Total min–max |\n|---|---:|---:|---:|---:|"
    );
    for (const mode of modes) {
      const child = spawnSync(
        process.execPath,
        [...process.execArgv, __filename, "--memory", style, mode],
        { encoding: "utf8" }
      );
      if (child.status !== 0)
        throw new Error(child.stderr || `Memory child exited ${child.status}`);
      const result = JSON.parse(child.stdout) as ReturnType<typeof memory>;
      console.log(
        `| ${mode} | ${result.heap} | ${result.buffers} | ${result.total} | ${result.min}–${result.max} |`
      );
    }
    console.log("");
  }
  console.log(
    "`typed-columns` retains a string dictionary and adaptive typed arrays after discarding parsed JSON numeric arrays. It uses the same persisted JSON/BSON as `columns`. `packed-cold` retains a validated owned buffer with no cached IDs. `packed-read` additionally caches every decoded ID after accessing every run. The tree rows retain only the loaded editing tree; their snapshot input is excluded.\n"
  );
  console.log(
    "The editing tree is not packed by this change. Differences between tree rows can include ID string sharing and allocation effects; they are not evidence of a different tree layout. Save/load allocation peaks, real browser heaps, Mongo compression, indexes, replicas and billing are not measured.\n"
  );
  console.log(
    "Exact binary, columnar JSON, and editing-tree round trips passed for all three trace variants."
  );
}
