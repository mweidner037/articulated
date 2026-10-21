import { IdList, type SavedIdList } from "articulated";
import { EJSON, serialize } from "bson";
import { gunzipSync, gzipSync } from "fflate";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  BenchmarkMemoryHolder,
  measureRetainedSize,
} from "../internal/heap_snapshot";
import {
  bsonDocument,
  codecs,
  getCodec,
  loadBson,
  loadWire,
  ownedPayload,
  wireBytes,
  type Codec,
  type Payload,
} from "./codecs";
import { example, fixture } from "./fixture";

export const resultDir = path.resolve(__dirname, "../../results/full-picture");
const fixturePath = path.join(resultDir, "fixture.json");
const trials = Number(process.env.FULL_PICTURE_TRIALS ?? 10);
assert(Number.isInteger(trials) && trials >= 3);
function readFixture(): SavedIdList {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8"));
}
function gc() {
  assert(global.gc, "Run node with --expose-gc");
  for (let i = 0; i < 3; i++) global.gc();
}
export function stats(values: number[]) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / (values.length - 1);
  // 95% Student t, df=9 for the published 10 trials. Other runs omit CI.
  return {
    mean,
    ci95:
      values.length === 10
        ? 2.262157 * Math.sqrt(variance / values.length)
        : null,
    median: [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)],
    min: Math.min(...values),
    max: Math.max(...values),
    samples: values,
  };
}
function timed<T>(fn: () => T, verify: (value: T) => void) {
  for (let i = 0; i < 5; i++) verify(fn());
  const samples: number[] = [];
  for (let i = 0; i < trials; i++) {
    gc();
    const start = performance.now();
    const result = fn();
    const elapsed = performance.now() - start;
    samples.push(elapsed);
    verify(result);
  }
  return stats(samples);
}
function correctness(list: IdList, saved: SavedIdList) {
  assert.deepEqual(list.save(), saved);
}
function highWater<T>(
  fn: (probe: () => void) => T,
  verify: (value: T) => void,
) {
  const samples: number[] = [];
  for (let i = 0; i < 5; i++) {
    gc();
    const initial = memory();
    let high = initial;
    const probe = () => {
      high = Math.max(high, memory());
    };
    const result = fn(probe);
    probe();
    samples.push(high - initial);
    verify(result);
  }
  return stats(samples);
}
function memory() {
  const m = process.memoryUsage();
  return m.heapUsed + m.arrayBuffers;
}
function timings(codec: Codec) {
  const saved = readFixture(),
    list = IdList.load(saved),
    payload = codec.save(list);
  const bson = bsonDocument(codec, payload),
    wire = wireBytes(codec, payload),
    gzipped = gzipSync(wire, { mtime: 0 });
  const verifyPayload = (value: Payload) =>
    correctness(codec.load(value), saved);
  verifyPayload(payload);
  correctness(loadBson(codec, bson), saved);
  correctness(loadWire(codec, gunzipSync(gzipped)), saved);
  // Verify the complete IDs/deletion state, not only text length.
  return {
    name: codec.name,
    saveMs: timed(() => codec.save(list), verifyPayload),
    mongoSaveMs: timed(
      () =>
        serialize({
          state: codec.saveMongo
            ? codec.saveMongo(list)
            : codec.toMongo(codec.save(list)),
        }),
      (bytes) => correctness(loadBson(codec, bytes), saved),
    ),
    openSnapshotMs: timed(
      () => codec.snapshot(payload),
      (v) => assert(v),
    ),
    loadMs: timed(
      () => codec.load(payload),
      (v) => correctness(v, saved),
    ),
    mongoLoadMs: timed(
      () => loadBson(codec, bson),
      (v) => correctness(v, saved),
    ),
    gzipSaveMs: timed(
      () => gzipSync(wireBytes(codec, codec.save(list)), { mtime: 0 }),
      (v) => correctness(loadWire(codec, gunzipSync(v)), saved),
    ),
    gzipLoadMs: timed(
      () => loadWire(codec, gunzipSync(gzipped)),
      (v) => correctness(v, saved),
    ),
    serializedBytes: wire.byteLength,
    gzipBytes: gzipped.byteLength,
    saveObservedHighWaterBytes: highWater(
      (p) => codec.save(list, p),
      verifyPayload,
    ),
    loadObservedHighWaterBytes: highWater(
      (p) => codec.load(payload, p),
      (v) => correctness(v, saved),
    ),
    mongoLoadObservedHighWaterBytes: highWater(
      (p) => loadBson(codec, bson, p),
      (v) => correctness(v, saved),
    ),
  };
}

function memoryValue(codec: Codec, mode: string): unknown {
  // All construction references die before taking a heap snapshot. In
  // particular the input payload is NOT held elsewhere when measuring a view.
  const payload = ownedPayload(codec, codec.save(IdList.load(readFixture())));
  if (mode === "snapshot") return codec.snapshot(payload);
  if (mode === "live") return codec.load(payload);
  throw new Error(mode);
}
function retained(codec: Codec, mode: string) {
  // Warm code before creating the unique holder, then release all warm values.
  for (let i = 0; i < 3; i++) memoryValue(codec, mode);
  gc();
  const holder = new BenchmarkMemoryHolder(memoryValue(codec, mode));
  const bytes = measureRetainedSize();
  assert(holder.value); // Keep the holder alive across snapshotting.
  return bytes;
}

function child(mode: string, codec: Codec): unknown {
  return JSON.parse(
    execFileSync(
      process.execPath,
      ["--expose-gc", "--import", "tsx", __filename, mode, codec.name],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024, env: process.env },
    ),
  );
}
async function main() {
  const mode = process.argv[2],
    name = process.argv[3];
  if (mode === "calibration") {
    // Keep the allocation out of this stack frame so the holder is its only owner.
    const makeHolder = () => new BenchmarkMemoryHolder(new Uint8Array(1048576));
    const holder = makeHolder();
    const bytes = measureRetainedSize();
    assert(bytes >= 1048576 && bytes < 1052672);
    assert.equal((holder.value as Uint8Array).byteLength, 1048576);
    console.log(
      JSON.stringify({ allocatedBytes: 1048576, retainedBytes: bytes }),
    );
    return;
  }
  if (mode === "timing") {
    console.log(JSON.stringify(timings(getCodec(name))));
    return;
  }
  if (mode === "snapshot" || mode === "live") {
    console.log(JSON.stringify(retained(getCodec(name), mode)));
    return;
  }
  fs.mkdirSync(resultDir, { recursive: true });
  const saved = await fixture();
  fs.writeFileSync(fixturePath, JSON.stringify(saved));
  const identicalPairs = [
    ["binary-adapter", "binary-direct"],
    ["bit-adapter", "bit-direct"],
    ["split-proto", "split-proto-direct"],
  ];
  for (const [a, b] of identicalPairs) {
    const list = IdList.load(saved),
      ca = getCodec(a),
      cb = getCodec(b);
    assert.deepEqual(
      bsonDocument(ca, ca.save(list)),
      bsonDocument(cb, cb.save(list)),
    );
  }
  const calibration = child("calibration", codecs[0]);
  const rows: Record<string, unknown>[] = [];
  // Deterministic shuffle limits systematic order/thermal bias.
  const order = [...codecs].sort((a, b) =>
    a.name
      .split("")
      .reverse()
      .join("")
      .localeCompare(b.name.split("").reverse().join("")),
  );
  for (const codec of order) {
    console.error(
      `Measuring ${codec.name}: timing, snapshot heap, loaded editor heap`,
    );
    const timing = child("timing", codec) as Record<string, unknown>;
    const snapshots = Array.from(
      { length: 3 },
      () => child("snapshot", codec) as number,
    );
    const editors = Array.from(
      { length: 3 },
      () => child("live", codec) as number,
    );
    rows.push({
      ...timing,
      snapshotBytes: stats(snapshots).median,
      liveBytes: stats(editors).median,
      snapshotMemory: stats(snapshots),
      liveMemory: stats(editors),
    });
    fs.writeFileSync(
      path.join(resultDir, "js.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          upstream: "26bd59c014dde2e59861936d8514a268db7135a6",
          runtime: process.version,
          v8: process.versions.v8,
          platform: process.platform,
          arch: process.arch,
          cpu: os.cpus()[0].model,
          trials,
          warmups: 5,
          trace: "kleppmannReal",
          refreshInterval: 1000,
          runs: saved.length,
          bunches: new Set(saved.map((r) => r.bunchId)).size,
          clients: new Set(
            saved.map((r) => r.bunchId.slice(0, r.bunchId.lastIndexOf("_"))),
          ).size,
          rows,
          identicalPairs,
          calibration,
        },
        null,
        2,
      ) + "\n",
    );
  }
  const examples = codecs.map((c) => {
    const payload = c.save(IdList.load(example));
    return {
      name: c.name,
      mongo: EJSON.serialize({ state: c.toMongo(payload) }, { relaxed: true }),
      decoded: c.snapshot(payload),
    };
  });
  fs.writeFileSync(
    path.join(resultDir, "examples.json"),
    JSON.stringify(
      examples,
      (_, v: unknown) =>
        ArrayBuffer.isView(v) ? Array.from(v as Uint8Array) : v,
      2,
    ) + "\n",
  );
}
void main();
