import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { AutomergeAlgorithm } from "./automerge";
import type {
  AnyTextAlgorithmConstructor,
  TextAlgorithmConstructor,
} from "./base";
import { CharArrayAlgorithm } from "./char_array";
import { IdListAlgorithm } from "./id_list";
import { IdListSimpleAlgorithm } from "./id_list_simple";
import { ProseMirrorAlgorithm } from "./prose_mirror";
import { RopeAlgorithm } from "./rope";
import { StringAlgorithm } from "./string";
import { YjsTextAlgorithm } from "./yjs_text";

export const allAlgorithms: Record<
  string,
  TextAlgorithmConstructor<
    TraceEdit | TraceProseMirrorEdit,
    Uint8Array | string
  >
> = {
  automerge: AutomergeAlgorithm,
  charArray: CharArrayAlgorithm,
  idListSimple: IdListSimpleAlgorithm,
  idList: IdListAlgorithm,
  proseMirror: ProseMirrorAlgorithm,
  rope: RopeAlgorithm,
  string: StringAlgorithm,
  yjsText: YjsTextAlgorithm,
} satisfies Record<string, AnyTextAlgorithmConstructor>;
