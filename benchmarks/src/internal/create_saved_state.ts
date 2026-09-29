import { gzipSync } from "fflate";
import { allAlgorithms } from "../algorithms";
import { loadTrace } from "./trace";
import { gzipString } from "./util";

/**
 * Used by the load measurements to generate saved states in a separate process.
 *
 * Usage: tsx src/internal/create_saved_state.ts <trace> <algorithm> <plain|gzip>
 * The saved state (GZIP'd if requested) is written to stdout.
 */
(async function () {
  const [traceName, algorithmName, format] = process.argv.slice(2);

  const trace = await loadTrace(traceName);
  const Alg = allAlgorithms[algorithmName];
  const edits = Alg.isProseMirror ? trace.proseMirrorEdits : trace.edits;

  const alg = new Alg();
  for (const edit of edits) {
    alg.apply(edit);
  }
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
