import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { loadTrace } from "../internal/trace";
import { flatFloat64Candidates } from "./flat-f64-candidates";
import { runBrowserBenchmark } from "./runner";
import { storageSweepCandidates } from "./storage-sweep-candidates";
async function main() {
  const f64 = process.env.DIRECT_STORAGE_F64 === "1";
  const output = process.env.EXPLORATION_OUTPUT ?? "storage-sweep-browser";
  assert(!fs.existsSync(path.resolve(__dirname, "../../results", output)));
  assert.equal(process.env.BROWSER_DOCUMENTS, "4");
  assert.equal(process.env.BROWSER_ID_MODEL, "opaque8");
  const saved = JSON.parse(
    fs.readFileSync(process.env.DIRECT_STORAGE_FIXTURE!, "utf8"),
  );
  const reference = JSON.parse(
    fs.readFileSync(
      path.resolve(
        __dirname,
        "../../results/exploration/canonical-mongo-opaque8.json",
      ),
      "utf8",
    ),
  );
  assert(reference.complete);
  assert.equal(
    createHash("sha256").update(JSON.stringify(saved)).digest("hex"),
    reference.fixtures[0].sha256,
  );
  const { finalText } = await loadTrace("kleppmannReal", false);
  assert.equal(
    createHash("sha256").update(finalText).digest("hex"),
    reference.canonicalSource.finalTextSha256,
  );
  await runBrowserBenchmark(
    f64 ? flatFloat64Candidates : storageSweepCandidates,
    {
      output,
      page: f64 ? "flat-f64-page.ts" : "storage-sweep-page.ts",
      fixture: {
        saved,
        finalText,
        description: f64
          ? "Exact canonical opaque8 snapshot; flat JSON versus fixed Float64 numeric binary fields, matched direct reader, existing IdList unchanged; no pages or custom headers."
          : "Exact canonical opaque8 snapshot; saved-format sweep into unchanged IdList.load. Binary is only an encoding of the same 128-run JSON columns.",
      },
    },
  );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
