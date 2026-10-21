import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { canonicalWorkloads } from "./canonical-workload";
import { makeEditWorkload } from "./edit-workload";
import { libraryFrontendCandidates } from "./library-frontend-run-candidates";
import { runBrowserBenchmark } from "./runner";
async function main() {
  const output = process.env.EXPLORATION_OUTPUT ?? "library-frontend";
  assert(!fs.existsSync(path.resolve(__dirname, "../../results", output)));
  assert.equal(process.env.BROWSER_DOCUMENTS, "4");
  assert.equal(process.env.BROWSER_ID_MODEL, "opaque8");
  const workloads = await canonicalWorkloads();
  const saved = workloads.opaque8.chunks.at(-1)!.expected;
  const finalText = workloads.opaque8.finalText;
  workloads.structured.chunks = [];
  workloads.opaque8.chunks = [];
  await runBrowserBenchmark(libraryFrontendCandidates, {
    output,
    page: "library-frontend-page.ts",
    edits: makeEditWorkload,
    fixture: {
      saved,
      finalText,
      description:
        "Same uninterrupted canonical opaque8 snapshot; controlled F01 runtime comparison, then DS08 storage adapter combinations",
    },
  });
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
