import { assert } from "chai";
import { EditorState } from "prosemirror-state";
import { realTextTraceEdits } from "../internal/util";
import type { TextAlgorithm } from "../text_algorithm";

export class ProseMirrorAlgorithm implements TextAlgorithm {
  apply(start: number, deleteCount: number, char?: string): void {
    throw new Error("Method not implemented.");
  }

  iterate(): void {
    throw new Error("Method not implemented.");
  }

  save(): string | Uint8Array {
    throw new Error("Method not implemented.");
  }

  load(savedState: string | Uint8Array): void {
    throw new Error("Method not implemented.");
  }
}
