/** Focused end-to-end attribution, not a new container or timing replacement.
 * Run with BROWSER_ID_MODEL=opaque8 BROWSER_DOCUMENTS=4. Keeps all old evidence.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { canonicalWorkloads } from "./canonical-workload";
import { makeEditWorkload } from "./edit-workload";
import { frontendCandidates } from "./frontend-profile-candidates";
import { runBrowserBenchmark } from "./runner";

const output = process.env.EXPLORATION_OUTPUT ?? "frontend-profile";
assert.equal(process.env.BROWSER_ID_MODEL, "opaque8");
assert.equal(process.env.BROWSER_DOCUMENTS, "4");
assert(
  !fs.existsSync(path.resolve(__dirname, "../../results", output)),
  "Refuse to replace existing evidence; use a fresh output directory",
);
async function main() {
  const canonical =
    process.env.FRONTEND_CANONICAL === "1"
      ? (await canonicalWorkloads()).opaque8
      : undefined;
  await runBrowserBenchmark(frontendCandidates, {
    output,
    page: "frontend-profile-page.ts",
    edits: makeEditWorkload,
    fixture: canonical
      ? {
          saved: canonical.chunks.at(-1)!.expected,
          finalText: canonical.finalText,
          description:
            "Exact uninterrupted canonical opaque8 final snapshot, matching the direct Mongo and numeric probes",
        }
      : undefined,
  });
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
