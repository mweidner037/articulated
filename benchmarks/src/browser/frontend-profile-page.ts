/** Phase attribution only; candidates and editor workload are unchanged. */
import { IdList } from "articulated";
import {
  fromTransposedOmit,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";
import { nativeFirstEdit } from "./edit-workload";
import { explorationCandidate } from "./exploration-candidates";
import { frontendCandidate, pageLocalF05 } from "./frontend-profile-candidates";
import { installBenchmark } from "./page-runtime";

let adapterMs = 0;
let buildInternalMs = 0;
let initializedDocuments = 0;

installBenchmark((id) => {
  const candidate = frontendCandidate(id);
  return {
    ...candidate,
    hydrate(state) {
      const start = performance.now();
      if (id === "page-local-f05-native") {
        const columns = toTransposedOmit(pageLocalF05.decode(state));
        const adapted = performance.now();
        const list =
          explorationCandidate("f05-flat-owned-128").hydrate(columns);
        const built = performance.now();
        adapterMs += adapted - start;
        buildInternalMs += built - adapted;
        initializedDocuments++;
        return list;
      }
      if (id === "omit" || id === "page-local-f05") {
        // Identical to the existing candidate's IdList.load(from(state)).
        // Only the timestamp separating those operations is new.
        const runs =
          id === "page-local-f05"
            ? pageLocalF05.decode(state)
            : fromTransposedOmit(
                state as Parameters<typeof fromTransposedOmit>[0],
              );
        const adapted = performance.now();
        const list = IdList.load(runs);
        const built = performance.now();
        adapterMs += adapted - start;
        buildInternalMs += built - adapted;
        initializedDocuments++;
        return list;
      }
      const list = candidate.hydrate(state);
      buildInternalMs += performance.now() - start;
      initializedDocuments++;
      return list;
    },
  };
}, nativeFirstEdit);

const run = window.benchmark.run.bind(window.benchmark);
window.benchmark.run = async (count, memory = false) => {
  adapterMs = 0;
  buildInternalMs = 0;
  initializedDocuments = 0;
  const result = await run(count, memory);
  if (initializedDocuments !== count)
    throw new Error("Incomplete initialization phase measurements");
  return {
    ...result,
    initializationProfile: { adapterMs, buildInternalMs, initializedDocuments },
  };
};
