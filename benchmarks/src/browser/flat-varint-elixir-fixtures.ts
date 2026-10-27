/**
 * Writes JS-encoded varint/protobuf fixtures so ecto/check.exs can prove the
 * Elixir Ecto types read and write exactly the same bytes.
 *
 * Usage: FLAT_VARINT_FIXTURE=/abs/canonical-input.json \
 *   node --import tsx src/browser/flat-varint-elixir-fixtures.ts /abs/out-dir
 */
import type { SavedIdList } from "articulated";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { canonicalWorkloads } from "./canonical-workload";
import { directStorageExample } from "./direct-storage-formats";
import {
  encodeCompactIdProto,
  encodeFlatProto,
  packSintVarints,
  packUintVarints,
} from "./flat-varint-formats";

const out = process.argv[2];
assert(out && path.isAbsolute(out), "Pass an absolute output directory");
const fixture = process.env.FLAT_VARINT_FIXTURE;
assert(fixture, "Set FLAT_VARINT_FIXTURE to canonical-input.json");
const cases: Record<string, SavedIdList> = {
  example: directStorageExample,
  canonical: JSON.parse(fs.readFileSync(fixture, "utf8")) as SavedIdList,
  structured: [],
  edge: [
    {
      bunchId: "client_42_17",
      startCounter: 2 ** 40 + 7,
      count: 3,
      isDeleted: false,
    },
    {
      bunchId: "é漢字",
      startCounter: Number.MAX_SAFE_INTEGER - 5,
      count: 2,
      isDeleted: true,
    },
    { bunchId: "", startCounter: 0, count: 1, isDeleted: true },
  ],
};
async function main() {
  cases.structured = (await canonicalWorkloads()).structured.chunks.at(
    -1,
  )!.expected;
  cases.mixed = [
    { bunchId: "Qm3xT9vKpa_0", startCounter: 0, count: 3, isDeleted: false },
    { bunchId: "aB3dE5fG", startCounter: 0, count: 2, isDeleted: true },
    { bunchId: "a_b_24e", startCounter: 0, count: 1, isDeleted: false },
    { bunchId: "Qm3xT9vKpa_1", startCounter: 0, count: 2, isDeleted: false },
    { bunchId: "x_01", startCounter: 0, count: 1, isDeleted: false },
    { bunchId: "Qm3xT9vKpa_0", startCounter: 3, count: 1, isDeleted: false },
  ];
  fs.mkdirSync(out, { recursive: true });
  for (const [name, saved] of Object.entries(cases)) {
    const c = toTransposedOmit(saved);
    const s = JSON.stringify;
    // Elixir map literal; JSON arrays and strings are valid Elixir syntax.
    fs.writeFileSync(
      path.join(out, `${name}.exs`),
      `%{bunch_ids: ${s(c.bunchIds)}, start_counter_indexes: ${s(c.startCounterIndexes)}, start_counters: ${s(c.startCounters)}, counts: ${s(c.counts)}}\n`,
    );
    fs.writeFileSync(path.join(out, `${name}.proto.bin`), encodeFlatProto(c));
    fs.writeFileSync(
      path.join(out, `${name}.compact.bin`),
      encodeCompactIdProto(c),
    );
    fs.writeFileSync(
      path.join(out, `${name}.start_counter_indexes.bin`),
      packUintVarints(c.startCounterIndexes),
    );
    fs.writeFileSync(
      path.join(out, `${name}.start_counters.bin`),
      packUintVarints(c.startCounters),
    );
    fs.writeFileSync(
      path.join(out, `${name}.counts.bin`),
      packSintVarints(c.counts),
    );
  }
  console.log(`Wrote ${Object.keys(cases).length} fixture sets to ${out}`);
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
