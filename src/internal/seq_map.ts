import createRBTree, { Tree } from "../vendor/functional-red-black-tree";

/**
 * A persistent map from an InnerNode's seq to its parent's seq
 * (or 0 for the root).
 *
 * Sequence numbers start at 1 and increment each time you call set(nextSeq, ...).
 */
export class SeqMap {
  constructor(
    private readonly tree: Tree<number, number>,
    private readonly nextSeq: number
  ) {}

  static new(): SeqMap {
    return new this(
      createRBTree((a, b) => a - b),
      1
    );
  }

  bumpNextSeq(): SeqMap {
    return new SeqMap(this.tree, this.nextSeq + 1);
  }

  get(seq: number): number {
    return this.tree.get(seq)!;
  }

  set(seq: number, value: number): SeqMap {
    return new SeqMap(this.tree.set(seq, value), this.nextSeq);
  }

  // delete(seq: number): SeqMap {
  //   return new SeqMap(this.tree.remove(seq), this.nextSeq);
  // }
}

export interface MutableSeqMap {
  value: SeqMap;
}

export function getAndBumpNextSeq(seqsMut: MutableSeqMap): number {
  // @ts-expect-error Ignore private
  const nextSeq = seqsMut.value.nextSeq;
  seqsMut.value = seqsMut.value.bumpNextSeq();
  return nextSeq;
}
