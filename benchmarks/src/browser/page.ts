import { candidate } from "./candidates";
import { installBenchmark } from "./page-runtime";
export type { BrowserAPI, BrowserSample } from "./page-runtime";
installBenchmark(candidate);
