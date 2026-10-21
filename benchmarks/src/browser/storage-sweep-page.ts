import { nativeFirstEdit } from "./edit-workload";
import { installBenchmark } from "./page-runtime";
import { storageSweepCandidate } from "./storage-sweep-candidates";
installBenchmark(storageSweepCandidate, nativeFirstEdit);
