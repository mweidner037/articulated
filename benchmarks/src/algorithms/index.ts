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
  IdListBunchIndexOmitStartAlgorithm,
  IdListBunchIndexOmitStartProtoAlgorithm,
  IdListBunchIndexProtoAlgorithm,
  IdListGroupedAlgorithm,
  IdListGroupedProtoAlgorithm,
  IdListOmitAlgorithm,
  IdListSignedAlgorithm,
  IdListSplitAlgorithm,
  IdListSplitClientIndexAlgorithm,
  IdListSplitClientIndexOmitStartAlgorithm,
  IdListSplitClientIndexOmitStartProtoAlgorithm,
  IdListSplitClientIndexProtoAlgorithm,
  IdListSplitGroupedAlgorithm,
  IdListSplitGroupedProtoAlgorithm,
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
  idListSplit: IdListSplitAlgorithm,
  idListSplitSigned: IdListSplitSignedAlgorithm,
  idListSplitTransposed: IdListSplitTransposedAlgorithm,
  idListSplitClientIndex: IdListSplitClientIndexAlgorithm,
  idListBunchIndexProto: IdListBunchIndexProtoAlgorithm,
  idListSplitClientIndexProto: IdListSplitClientIndexProtoAlgorithm,
  idListOmit: IdListOmitAlgorithm,
  idListSplitOmit: IdListSplitOmitAlgorithm,
  idListGrouped: IdListGroupedAlgorithm,
  idListSplitGrouped: IdListSplitGroupedAlgorithm,
  idListGroupedProto: IdListGroupedProtoAlgorithm,
  idListSplitGroupedProto: IdListSplitGroupedProtoAlgorithm,
  idListBunchIndexOmitStart: IdListBunchIndexOmitStartAlgorithm,
  idListSplitClientIndexOmitStart: IdListSplitClientIndexOmitStartAlgorithm,
  idListBunchIndexOmitStartProto: IdListBunchIndexOmitStartProtoAlgorithm,
  idListSplitClientIndexOmitStartProto:
    IdListSplitClientIndexOmitStartProtoAlgorithm,
  automerge: AutomergeAlgorithm,
  yjsText: YjsTextAlgorithm,
} satisfies Record<string, AnyTextAlgorithmConstructor>;
