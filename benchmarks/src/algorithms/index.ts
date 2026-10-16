import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { AutomergeAlgorithm } from "./automerge";
import type {
  AnyTextAlgorithmConstructor,
  TextAlgorithmConstructor,
} from "./base";
import { CharArrayAlgorithm } from "./char_array";
import { IdListAlgorithm } from "./id_list";
import {
  IdListBunchIndexAlgorithm,
  IdListBunchIndexOmitAlgorithm,
  IdListBunchIndexOmitProtoAlgorithm,
  IdListBunchIndexProtoAlgorithm,
  IdListOmitAlgorithm,
  IdListSignedAlgorithm,
  IdListSplitClientIndexAlgorithm,
  IdListSplitClientIndexOmitAlgorithm,
  IdListSplitClientIndexOmitProtoAlgorithm,
  IdListSplitClientIndexProtoAlgorithm,
  IdListSplitOmitAlgorithm,
  IdListSplitSignedAlgorithm,
  IdListSplitTransposedAlgorithm,
  IdListTransposedAlgorithm,
} from "./id_list_saved_states";
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
  string: StringAlgorithm,
  charArray: CharArrayAlgorithm,
  rope: RopeAlgorithm,
  proseMirror: ProseMirrorAlgorithm,
  // Skipping this as it is too slow to apply all ops.
  // idListSimple: IdListSimpleAlgorithm,
  idList: IdListAlgorithm,
  // Alternative saved state formats for IdList.
  idListSigned: IdListSignedAlgorithm,
  idListTransposed: IdListTransposedAlgorithm,
  idListBunchIndex: IdListBunchIndexAlgorithm,
  idListSplitSigned: IdListSplitSignedAlgorithm,
  idListSplitTransposed: IdListSplitTransposedAlgorithm,
  idListSplitClientIndex: IdListSplitClientIndexAlgorithm,
  idListBunchIndexProto: IdListBunchIndexProtoAlgorithm,
  idListSplitClientIndexProto: IdListSplitClientIndexProtoAlgorithm,
  idListOmit: IdListOmitAlgorithm,
  idListSplitOmit: IdListSplitOmitAlgorithm,
  idListBunchIndexOmit: IdListBunchIndexOmitAlgorithm,
  idListSplitClientIndexOmit: IdListSplitClientIndexOmitAlgorithm,
  idListBunchIndexOmitProto: IdListBunchIndexOmitProtoAlgorithm,
  idListSplitClientIndexOmitProto: IdListSplitClientIndexOmitProtoAlgorithm,
  automerge: AutomergeAlgorithm,
  yjsText: YjsTextAlgorithm,
} satisfies Record<string, AnyTextAlgorithmConstructor>;
