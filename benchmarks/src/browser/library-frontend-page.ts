import { nativeFirstEdit } from "./edit-workload";
import { libraryFrontendCandidate } from "./library-frontend-run-candidates";
import { installBenchmark } from "./page-runtime";
installBenchmark(libraryFrontendCandidate, nativeFirstEdit);
