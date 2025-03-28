import createRBTree, { Tree } from "functional-red-black-tree";

/**
 * A persistent map from an InnerNode's seqNum to its parent's seqNum
 * (or 0 for the root).
 *
 * Sequence numbers start at 1 and increment each time you call set(nextSeq, ...).
 */
export class SeqMap {
  constructor(
    private readonly tree: Tree<number, number>,
    readonly nextSeq: number
  ) {}

  static new(): SeqMap {
    return new this(
      createRBTree((a, b) => a - b),
      0
    );
  }

  bumpNextSeq(): SeqMap {
    return new SeqMap(this.tree, this.nextSeq + 1);
  }

  get(seq: number): number {
    return this.tree.get(seq)!;
  }

  set(seq: number, value: number): SeqMap {
    // TODO: Vendor functional-red-black-tree and add our own set method
    // so we can avoid this 2x penalty.
    return new SeqMap(this.tree.remove(seq).insert(seq, value), this.nextSeq);
  }

  delete(seq: number): SeqMap {
    return new SeqMap(this.tree.remove(seq), this.nextSeq);
  }
}

export interface MutableSeqMap {
  value: SeqMap;
}

export function getAndBumpNextSeq(seqsMut: MutableSeqMap): number {
  const nextSeq = seqsMut.value.nextSeq;
  seqsMut.value = seqsMut.value.bumpNextSeq();
  return nextSeq;
}
