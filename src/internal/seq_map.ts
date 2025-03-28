import createRBTree, { Tree } from "functional-red-black-tree";

/**
 * A persistent map from sequence numbers to values.
 *
 * Sequence numbers start at 1 and increment each time you call set(nextSeq, ...).
 */
export class SeqMap<T> {
  constructor(
    private readonly tree: Tree<number, T>,
    readonly nextSeq: number
  ) {}

  static new<T>(): SeqMap<T> {
    return new this(
      createRBTree((a, b) => a - b),
      0
    );
  }

  get(seq: number): T {
    return this.tree.get(seq)!;
  }

  set(seq: number, value: T): SeqMap<T> {
    if (seq === this.nextSeq) {
      return new SeqMap(this.tree.insert(seq, value), this.nextSeq + 1);
    } else {
      return new SeqMap(this.tree.remove(seq).insert(seq, value), this.nextSeq);
    }
  }

  delete(seq: number): SeqMap<T> {
    return new SeqMap(this.tree.remove(seq), this.nextSeq);
  }
}
