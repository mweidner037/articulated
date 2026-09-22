import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/traces";

export type Measurement = <E extends TraceEdit | TraceProseMirrorEdit>(
  Alg: TextAlgorithmConstructor<E>,
  edits: E[],
  finalText: string,
) => Promise<void>;
