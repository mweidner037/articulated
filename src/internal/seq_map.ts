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

  get(seq: number): number {
    return this.tree.get(seq)!;
  }

  set(seq: number, value: number): SeqMap {
    if (seq === this.nextSeq) {
      return new SeqMap(this.tree.insert(seq, value), this.nextSeq + 1);
    } else {
      return new SeqMap(this.tree.remove(seq).insert(seq, value), this.nextSeq);
    }
  }

  delete(seq: number): SeqMap {
    return new SeqMap(this.tree.remove(seq), this.nextSeq);
  }
}

export interface MutableSeqMap {
  value: SeqMap;
}
