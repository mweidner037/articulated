import { makeEditWorkload } from "./edit-workload";
import { explorationCandidates } from "./exploration-candidates";
import { formats } from "./formats";
import { runBrowserBenchmark } from "./runner";
const selected =
  process.env.BROWSER_ID_MODEL === "opaque8"
    ? explorationCandidates.filter(
        (c) =>
          c.shape !== formats.client.name && c.shape !== formats.split.name,
      )
    : explorationCandidates;
void runBrowserBenchmark(selected, {
  output: process.env.EXPLORATION_OUTPUT ?? "exploration",
  page: "exploration-page.ts",
  edits: makeEditWorkload,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
