import { nativeFirstEdit } from "./edit-workload";
import { explorationCandidate } from "./exploration-candidates";
import { installBenchmark } from "./page-runtime";
installBenchmark(explorationCandidate, nativeFirstEdit);
