import { nativeFirstEdit } from "./edit-workload";
import { nativeCandidate } from "./native-candidates";
import { installBenchmark } from "./page-runtime";
installBenchmark(nativeCandidate, nativeFirstEdit);
