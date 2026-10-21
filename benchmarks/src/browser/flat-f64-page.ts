import { nativeFirstEdit } from "./edit-workload";
import { flatFloat64Candidate } from "./flat-f64-candidates";
import { installBenchmark } from "./page-runtime";
installBenchmark(flatFloat64Candidate, nativeFirstEdit);
