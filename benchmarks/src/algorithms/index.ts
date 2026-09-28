import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import type { TextAlgorithmConstructor } from "./base";
import { CharArrayAlgorithm } from "./char_array";
import { IdListAlgorithm } from "./id_list";
import { IdListSimpleAlgorithm } from "./id_list_simple";
import { ProseMirrorAlgorithm } from "./prose_mirror";
import { RopeAlgorithm } from "./rope";
import { StringAlgorithm } from "./string";

export const allAlgorithms: Record<
  string,
  TextAlgorithmConstructor<TraceEdit | TraceProseMirrorEdit>
> = {
  charArray: CharArrayAlgorithm,
  idListSimple: IdListSimpleAlgorithm,
  idList: IdListAlgorithm,
  proseMirror: ProseMirrorAlgorithm,
  rope: RopeAlgorithm,
  string: StringAlgorithm,
};
