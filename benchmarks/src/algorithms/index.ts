import type { TraceEdit, TraceProseMirrorEdit } from "../internal/trace";
import { AutomergeAlgorithm } from "./automerge";
import type {
  AnyTextAlgorithmConstructor,
  TextAlgorithmConstructor,
} from "./base";
import { CharArrayAlgorithm } from "./char_array";
import { IdListAlgorithm } from "./id_list";
import {
  IdListBunchDeltaOmitAlgorithm,
  IdListBunchIndexAlgorithm,
  IdListBunchIndexOmitAlgorithm,
  IdListBunchIndexOmitProtoAlgorithm,
  IdListBunchIndexProtoAlgorithm,
  IdListOmitAlgorithm,
  IdListSignedAlgorithm,
  IdListSplitClientDeltaOmitProtoAlgorithm,
  IdListSplitClientIndexAlgorithm,
  IdListSplitClientIndexOmitAlgorithm,
  IdListSplitClientIndexOmitProtoAlgorithm,
  IdListSplitClientIndexProtoAlgorithm,
  IdListSplitOmitAlgorithm,
  IdListSplitSignedAlgorithm,
  IdListSplitTransposedAlgorithm,
  IdListSplitTransposedOmitAlgorithm,
  IdListSplitTransposedOmitProtoAlgorithm,
  IdListSplitTransposedProtoAlgorithm,
  IdListTransposedAlgorithm,
  IdListTransposedOmitAlgorithm,
  IdListTransposedOmitProtoAlgorithm,
  IdListTransposedProtoAlgorithm,
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
  // Non-split bunchIds:
  idListSigned: IdListSignedAlgorithm,
  idListOmit: IdListOmitAlgorithm,
  idListTransposed: IdListTransposedAlgorithm,
  idListTransposedOmit: IdListTransposedOmitAlgorithm,
  idListBunchIndex: IdListBunchIndexAlgorithm,
  idListBunchIndexOmit: IdListBunchIndexOmitAlgorithm,
  idListBunchDeltaOmit: IdListBunchDeltaOmitAlgorithm,
  idListTransposedProto: IdListTransposedProtoAlgorithm,
  idListTransposedOmitProto: IdListTransposedOmitProtoAlgorithm,
  idListBunchIndexProto: IdListBunchIndexProtoAlgorithm,
  idListBunchIndexOmitProto: IdListBunchIndexOmitProtoAlgorithm,
  // Split bunchIds:
  idListSplitSigned: IdListSplitSignedAlgorithm,
  idListSplitOmit: IdListSplitOmitAlgorithm,
  idListSplitTransposed: IdListSplitTransposedAlgorithm,
  idListSplitTransposedOmit: IdListSplitTransposedOmitAlgorithm,
  idListSplitClientIndex: IdListSplitClientIndexAlgorithm,
  idListSplitClientIndexOmit: IdListSplitClientIndexOmitAlgorithm,
  idListSplitTransposedProto: IdListSplitTransposedProtoAlgorithm,
  idListSplitTransposedOmitProto: IdListSplitTransposedOmitProtoAlgorithm,
  idListSplitClientIndexProto: IdListSplitClientIndexProtoAlgorithm,
  idListSplitClientIndexOmitProto: IdListSplitClientIndexOmitProtoAlgorithm,
  idListSplitClientDeltaOmitProto: IdListSplitClientDeltaOmitProtoAlgorithm,
  automerge: AutomergeAlgorithm,
  yjsText: YjsTextAlgorithm,
} satisfies Record<string, AnyTextAlgorithmConstructor>;
