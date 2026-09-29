import { default as fs } from "fs";
import { default as path } from "path";

export interface TextTrace {
  description?: string;
  finalText: string;
  edits: TraceEdit[];
  proseMirrorEdits: TraceProseMirrorEdit[];
}

export type TraceEdit =
  | {
      type: "insert";
      index: number;
      char: string;
    }
  | { type: "delete"; index: number };

export type TraceProseMirrorEdit =
  | {
      type: "insert";
      pos: number;
      char: string;
    }
  | { type: "delete"; pos: number }
  | { type: "split"; pos: number }
  | { type: "join"; pos: number };

/**
 * Loads the text trace from src/traces/${traceName}.json.
 *
 * @throws If the file is not found, unreadable, not JSON, or not shaped like a TextTrace.
 */
export async function loadTrace(
  traceName: string,
  requirePM = true,
): Promise<TextTrace> {
  const loaded = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../traces", traceName + ".json"), {
      encoding: "utf8",
    }),
  ) as TextTrace;

  // Ensure it looks like a TextTrace.
  if (!(
    typeof loaded === "object" &&
    typeof loaded.finalText === "string" &&
    Array.isArray(loaded.edits)
  )) {
    throw new Error("Not a TextTrace");
  }
  if (requirePM && !Array.isArray(loaded.proseMirrorEdits)) {
    throw new Error(
      `Missing proseMirrorEdits; run \`pnpm finish-trace ${traceName}\``,
    );
  }

  return loaded;
}

export function allTraceNames(): string[] {
  return fs
    .readdirSync(path.join(__dirname, "..", "traces"))
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.slice(0, -5));
}
