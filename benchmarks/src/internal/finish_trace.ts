import fs from "fs";
import path from "path";
import { proseMirrorEdits } from "./prose_mirror";
import type { TextTrace } from "./trace";
import { loadTrace } from "./trace";

(async function () {
  // Process args

  const args = process.argv.slice(2);
  if (args.length !== 1) failWithUsage("Wrong number of arguments");

  const traceName = args[0];

  let trace: TextTrace;
  try {
    trace = await loadTrace(traceName, false);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    failWithUsage("Error loading trace " + traceName + ": " + message);
  }

  // Compute proseMirrorEdits and write back

  const finished: TextTrace = {
    finalText: trace.finalText,
    edits: trace.edits,
    proseMirrorEdits: proseMirrorEdits(trace.edits, trace.finalText),
  };
  const tracePath = path.join(__dirname, "../traces", traceName + ".json");
  fs.writeFileSync(tracePath, JSON.stringify(finished));

  console.log(
    `Wrote ${finished.proseMirrorEdits.length} proseMirrorEdits to ${tracePath}`,
  );
})();

function failWithUsage(message: string): never {
  console.error(message);
  console.error(
    "\nUsage: pnpm finish-trace <traceName>" +
      "\nwhere src/traces/<traceName>.json is the trace file",
  );
  process.exit(1);
}
