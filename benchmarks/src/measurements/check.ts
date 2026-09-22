import type { TextAlgorithmConstructor } from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "../internal/traces";
import type { Measurement } from "./base";

/**
 * Checks correctness.
 */
export const measureCheck: Measurement = async <
  E extends TraceEdit | TraceProseMirrorEdit,
>(
  Alg: TextAlgorithmConstructor<E>,
  edits: E[],
  finalText: string,
) => {
  // Applying all edits
  const alg = new Alg();
  for (const edit of edits) {
    alg.apply(edit);
  }
  alg.iterate();
  alg.check(finalText);

  // Saving and loading
  const savedState = alg.save();
  const alg2 = new Alg();
  alg2.load(savedState);
  alg2.iterate();
  alg2.check(finalText);
};
