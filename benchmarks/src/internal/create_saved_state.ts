import { gzipSync } from "fflate";
import seedrandom from "seedrandom";
import { allAlgorithms } from "../algorithms";
import { loadTrace } from "./trace";
import { applyEdits, gzipString } from "./util";

/**
 * Used by the load experiments to generate saved states in a separate process.
 *
 * Usage: tsx src/internal/create_saved_state.ts <trace> <algorithm> <refreshInterval> <plain|gzip>
 * The saved state (GZIP'd if requested) is written to stdout.
 */
(async function () {
  const [traceName, algorithmName, refreshIntervalStr, format] =
    process.argv.slice(2);
  const refreshInterval = Number(refreshIntervalStr);

  const trace = await loadTrace(traceName);
  const Alg = allAlgorithms[algorithmName];
  const edits = Alg.isProseMirror ? trace.proseMirrorEdits : trace.edits;

  const alg = applyEdits(Alg, seedrandom("42"), refreshInterval, edits);
  const savedState = alg.save();

  if (format === "gzip") {
    process.stdout.write(
      typeof savedState === "string"
        ? gzipString(savedState)
        : gzipSync(savedState),
    );
  } else {
    process.stdout.write(savedState);
  }
})();
