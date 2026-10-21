import { candidates } from "./candidates";
import { runBrowserBenchmark } from "./runner";
void runBrowserBenchmark(candidates, {
  output: "browser",
  page: "page.ts",
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
