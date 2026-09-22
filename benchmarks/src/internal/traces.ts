import fs from "fs";
import path from "path";
import { proseMirrorEdits } from "./prose_mirror";

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

export let realTextTrace!: TextTrace;

export async function loadTraces() {
  await loadRealTextTrace();
}

async function loadRealTextTrace() {
  // A JSON import would be nicer, but it blows up the heap usage for some reason,
  // making heap snapshots slow.
  const loaded = JSON.parse(
    fs.readFileSync(path.join(__dirname, "real_text_trace_edits.json"), {
      encoding: "utf8",
    }),
  ) as {
    edits: Array<[number, number, string | undefined]>;
    finalText: string;
  };

  const finalText = loaded.finalText;
  const edits: TraceEdit[] = loaded.edits.map((edit) =>
    edit[1] === 0
      ? { type: "insert", index: edit[0], char: edit[2]! }
      : { type: "delete", index: edit[0] },
  );
  realTextTrace = {
    finalText,
    edits,
    proseMirrorEdits: proseMirrorEdits(edits, finalText),
  };
}
