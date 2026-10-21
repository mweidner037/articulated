import { makeEditWorkload } from "./edit-workload";
import { nativeCandidates } from "./native-candidates";
import { runBrowserBenchmark } from "./runner";
void runBrowserBenchmark(nativeCandidates, {
  output: "native",
  page: "native-page.ts",
  edits: makeEditWorkload,
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
