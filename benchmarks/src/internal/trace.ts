import fs from "fs";
import path from "path";

export interface TextTrace {
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
 * Loads the text trace from src/traces/${fileStem}.json.
 *
 * @throws If the file is not found, can't be read, not JSON, or not shaped like a TextTrace.
 */
export async function loadTrace(fileStem: string): Promise<TextTrace> {
  const loaded = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../traces", fileStem + ".json"), {
      encoding: "utf8",
    }),
  ) as TextTrace;

  // Ensure it looks like a TextTrace.
  if (!(
    typeof loaded === "object" &&
    typeof loaded.finalText === "string" &&
    Array.isArray(loaded.edits) &&
    Array.isArray(loaded.proseMirrorEdits)
  )) {
    throw new Error("Not a TextTrace");
  }

  return loaded;
}
