import assert from "assert";
import { spawnSync } from "child_process";
import { calculateObjectSize, deserialize, serialize } from "bson";
import { IdList, SavedIdList } from "../src";
import { family } from "./format_family";
import { fixture } from "./format_fixture";
import {
  decode,
  encode,
  fromMongo,
  mongo,
  retain,
  storageVariant,
  variants,
  Variant,
  Encoded,
} from "./format_matrix";
const copies = 20,
  samples = 5;
const example: SavedIdList = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "hJ7kL9mN", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
];
function gc() {
  for (let i = 0; i < 4; i++) global.gc!();
}
function memory(variant: Variant) {
  const saved = fixture(),
    input = encode(saved, family, storageVariant(variant));
  const json = JSON.stringify(input);
  const binary =
    variant.includes("binary") ||
    variant.startsWith("packed") ||
    variant === "bit-columns";
  const factory = () => {
    if (!binary && variant !== "typed-columns" && variant !== "typed-flat")
      return JSON.parse(json) as Encoded;
    return retain(
      binary ? input : (JSON.parse(json) as Encoded),
      family,
      variant
    );
  };
  for (let i = 0; i < 3; i++) factory();
  let retained: Encoded[] = [];
  const measurements: Array<{ heap: number; buffers: number; total: number }> =
    [];
  for (let sample = 0; sample < samples; sample++) {
    retained = [];
    gc();
    const before = process.memoryUsage();
    for (let i = 0; i < copies; i++) retained.push(factory());
    gc();
    const after = process.memoryUsage();
    const heap = (after.heapUsed - before.heapUsed) / copies;
    const buffers = (after.arrayBuffers - before.arrayBuffers) / copies;
    measurements.push({ heap, buffers, total: heap + buffers });
  }
  assert.equal(saved.length, 11757);
  assert(json.length);
  assert(input);
  assert.equal(retained.length, copies);
  // Validate what we actually retain, not just the stored representation.
  const retainedVariant =
    variant === "binary-columns"
      ? "typed-columns"
      : variant === "binary-flat"
      ? "typed-flat"
      : variant;
  assert.deepStrictEqual(decode(retained[0], family, retainedVariant), saved);
  const sorted = [...measurements].sort((a, b) => a.total - b.total);
  return {
    median: sorted[2],
    min: sorted[0].total,
    max: sorted[4].total,
    samples: measurements,
  };
}
if (!global.gc) throw new Error("Run with --expose-gc");
if (process.argv[2] === "--memory")
  console.log(JSON.stringify(memory(process.argv[3] as Variant)));
else {
  const saved = fixture();
  const rows = variants.map((variant) => {
    const input = encode(saved, family, storageVariant(variant));
    assert.deepStrictEqual(
      decode(input, family, storageVariant(variant)),
      saved
    );
    const doc = { state: mongo(input) },
      bytes = serialize(doc);
    assert.equal(bytes.length, calculateObjectSize(doc));
    const decoded = fromMongo(deserialize(bytes).state as Encoded);
    assert.deepStrictEqual(
      decode(decoded, family, storageVariant(variant)),
      saved
    );
    assert.deepStrictEqual(
      IdList.load(decode(decoded, family, storageVariant(variant))).save(),
      saved
    );
    const child = spawnSync(
      process.execPath,
      [...process.execArgv, __filename, "--memory", variant],
      { encoding: "utf8" }
    );
    assert.equal(child.status, 0, child.stderr);
    const result = {
      variant,
      bsonBytes: bytes.length,
      memory: JSON.parse(child.stdout) as ReturnType<typeof memory>,
      example: encode(example, family, variant),
    };
    console.error(`Measured ${family}: ${variant}`);
    return result;
  });
  console.log(
    JSON.stringify(
      {
        family,
        runtime: process.version,
        v8: process.versions.v8,
        platform: process.platform,
        arch: process.arch,
        copies,
        samples,
        runs: saved.length,
        bunches: new Set(saved.map((r) => r.bunchId)).size,
        rows,
      },
      (_, value: unknown) =>
        ArrayBuffer.isView(value) ? Array.from(value as Uint8Array) : value,
      2
    )
  );
}
