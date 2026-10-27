/**
 * Mongo-free probe for the protobuf / packed-varint question on PR #34.
 *
 * For each format, encodes the canonical snapshot (renamed exactly like the
 * Mongo probe's document 0), serializes the {_id, state} BSON document, and
 * reports raw BSON bytes plus per-document gzip / zstd / snappy sizes as a
 * proxy for WiredTiger block compression. It also times BSON deserialize +
 * decode + IdList.load in Node. Physical Mongo sizes still need
 * direct-storage-probe.ts (DIRECT_STORAGE_VARINT=1).
 *
 * Usage: FLAT_VARINT_FIXTURE=/abs/canonical-input.json SNAPPYJS=/abs/snappyjs \
 *   node --import tsx src/browser/flat-varint-probe.ts
 */
import { IdList, type SavedIdList } from "articulated";
import { Binary, deserialize, serialize } from "bson";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";
import zlib from "node:zlib";
import {
  fromTransposedOmit,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";
import { TransposedOmitSavedIdListMessage } from "../generated/id_list_saved_state";
import { flatFloat64Formats } from "./flat-f64-formats";
import { flatProtoFormat, flatVarintFormat } from "./flat-varint-formats";
import type { SweepFormat } from "./storage-sweep-formats";

/** PR #30's TransposedOmit message as-is: repeated string bunchIds. */
const transposedOmitProto: SweepFormat = {
  id: "Proto-30",
  label: "PR #30 TransposedOmitSavedIdListMessage (repeated string ids)",
  readiness: "protobufjs generated codec",
  pageSize: 0,
  idEncoding: "array",
  binary: true,
  encode: (saved) =>
    new Binary(
      TransposedOmitSavedIdListMessage.encode(toTransposedOmit(saved)).finish(),
    ),
  decode: (state) =>
    fromTransposedOmit(
      TransposedOmitSavedIdListMessage.decode(
        (state as Binary).value(),
      ) as never,
    ),
};

// Same whole-ID remapping as direct-storage-probe.ts document 0.
function independentDocument(saved: SavedIdList, document: number) {
  const names = new Map<string, string>();
  return saved.map((row) => {
    let id = names.get(row.bunchId);
    if (id === undefined) {
      id = createHash("sha256")
        .update(JSON.stringify(["opaque8", document, row.bunchId]))
        .digest("base64url")
        .slice(0, 8);
      names.set(row.bunchId, id);
    }
    return { ...row, bunchId: id };
  });
}

function percentile(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

function main() {
  const fixture = process.env.FLAT_VARINT_FIXTURE;
  assert(fixture, "Set FLAT_VARINT_FIXTURE to canonical-input.json");
  const source = JSON.parse(fs.readFileSync(fixture, "utf8")) as SavedIdList;
  const saved = independentDocument(source, 0);
  const snappy = process.env.SNAPPYJS
    ? (createRequire(__filename)(process.env.SNAPPYJS) as {
        compress(b: Uint8Array): Uint8Array;
      })
    : null;
  const formats = [
    ...flatFloat64Formats,
    flatVarintFormat,
    flatProtoFormat,
    transposedOmitProto,
  ];
  const trials = Number(process.env.FLAT_VARINT_TRIALS ?? 200);
  const rows = [];
  for (const format of formats) {
    const bson = serialize({ _id: 0, state: format.encode(saved) });
    const roundtrip = format.decode(deserialize(bson).state);
    assert.deepEqual(roundtrip, saved, `${format.id} roundtrip`);
    const times: number[] = [];
    for (let i = 0; i < trials + 20; i++) {
      const start = performance.now();
      IdList.load(format.decode(deserialize(bson).state));
      if (i >= 20) times.push(performance.now() - start);
    }
    times.sort((a, b) => a - b);
    rows.push({
      id: format.id,
      bsonBytes: bson.length,
      gzipBytes: zlib.gzipSync(bson, { level: 6 }).length,
      // MongoDB's default zstdCompressionLevel is 6.
      zstdBytes: zlib.zstdCompressSync(bson, {
        params: { [zlib.constants.ZSTD_c_compressionLevel]: 6 },
      }).length,
      snappyBytes: snappy ? snappy.compress(bson).length : null,
      decodeLoadMedianMs: percentile(times, 0.5),
      decodeLoadP95Ms: percentile(times, 0.95),
    });
  }
  const out = {
    generatedAt: new Date().toISOString(),
    nodeVersion: process.version,
    runs: saved.length,
    trials,
    measurement:
      "Single-document compression of the full {_id,state} BSON; proxy only, not WiredTiger physical storage. Timing is Node, not browser.",
    rows,
  };
  const output = process.env.FLAT_VARINT_OUTPUT;
  if (output)
    fs.writeFileSync(output, JSON.stringify(out, null, 2) + "\n", {
      flag: "wx",
    });
  console.table(rows);
}
main();
