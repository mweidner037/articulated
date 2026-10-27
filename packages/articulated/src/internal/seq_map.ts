import { RedBlackTree } from "../vendor/functional-red-black-tree";

/**
 * A persistent map from an InnerNode's seq to its parent's seq
 * (or 0 for the root).
 *
 * Sequence numbers start at 1 and increment each time you call set(nextSeq, ...).
 */
export class SeqMap {
  constructor(
    private readonly tree: RedBlackTree<number, number>,
    private readonly nextSeq: number,
  ) {}

  static new(): SeqMap {
    return new this(
      RedBlackTree.new((a, b) => a - b),
      1,
    );
  }

  /** Initialization only; explicitly sort the actual sequence keys. */
  static fromEntries(entries: [number, number][], nextSeq: number): SeqMap {
    entries.sort((a, b) => a[0] - b[0]);
    return new SeqMap(
      RedBlackTree.fromSorted((a, b) => a - b, entries),
      nextSeq,
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
