import type { LeafNode } from "../id_list";
import { RedBlackTree } from "../vendor/functional-red-black-tree";

/**
 * A persistent sorted map from each LeafNode to its parent's seq.
 *
 * Leaves are sorted by their first ElementId.
 * This lets you quickly look up the LeafNode containing an ElementId,
 * even though the LeafNode might start at a lower counter.
 */
export class LeafMap {
  private constructor(private readonly tree: RedBlackTree<LeafNode, number>) {}

  static new() {
    return new this(RedBlackTree.new(compareLeaves));
  }

  /** Initialization only: sort once, then allocate each index node once. */
  static fromEntries(entries: [LeafNode, number][]): LeafMap {
    entries.sort((a, b) => compareLeaves(a[0], b[0]));
    for (let i = 1; i < entries.length; i++) {
      if (compareLeaves(entries[i - 1][0], entries[i][0]) === 0)
        throw new Error("Invalid savedState: duplicate ids");
    }
    return new LeafMap(RedBlackTree.fromSorted(compareLeaves, entries));
  }

  /**
   * Returns the greatest leaf whose first id is <= the given id,
   * or undefined if none exists. Also returns the associated seq (or -1 if not found).
   *
   * The returned leaf might not actually contain the given id.
   */
  getLeaf(
    bunchId: string,
    counter: number,
  ): [leaf: LeafNode | undefined, seq: number] {
    const iter = this.tree.le({ bunchId, startCounter: counter } as LeafNode);
    return [iter.key, iter.value ?? -1];
  }

  /** Finds the containing or next known counter interval for this bunch.
   * Seek against the current version after each replacement, never a stale
   * iterator into a previous persistent tree.
   */
  getLeafAtOrAfter(bunchId: string, counter: number): LeafNode | undefined {
    const key = { bunchId, startCounter: counter } as LeafNode;
    const previous = this.tree.le(key).key;
    if (
      previous?.bunchId === bunchId &&
      counter < previous.startCounter + previous.count
    )
      return previous;
    const next = this.tree.ge(key).key;
    return next?.bunchId === bunchId ? next : undefined;
  }

  set(leaf: LeafNode, seq: number): LeafMap {
    return new LeafMap(this.tree.set(leaf, seq));
  }

  delete(leaf: LeafNode): LeafMap {
    return new LeafMap(this.tree.remove(leaf));
  }

  /**
   * Checks for duplicate ids after loading, returning whether the check passes.
   *
   * Duplicate ids imply leaves with overlapping id ranges, which lead to either:
   *
   * - Neighboring leaves (in our key order) that overlap.
   * - Or, a leaf that overwrote another, making our known id count too low.
   */
  checkAfterLoad(targetIdCount: number): boolean {
    let hasOverlap = false;
    let idCount = 0;

    let prevLeaf: LeafNode | null = null;
    this.tree.forEach((leaf) => {
      if (prevLeaf) {
        if (
          leaf.bunchId === prevLeaf.bunchId &&
          leaf.startCounter < prevLeaf.startCounter + prevLeaf.count
        ) {
          hasOverlap = true;
        }
      }
      idCount += leaf.count;

      prevLeaf = leaf;
    });

    return !hasOverlap && idCount === targetIdCount;
  }
}

/**
 * Sort function for LeafNodes in LeafMap.
 *
 * Sorting by startCounters lets us quickly look up the LeafNode containing an ElementId,
 * even though the LeafNode might start at a lower counter.
 */
function compareLeaves(a: LeafNode, b: LeafNode) {
  if (a.bunchId === b.bunchId) {
    return a.startCounter - b.startCounter;
  } else {
    return a.bunchId > b.bunchId ? 1 : -1;
  }
}

export interface MutableLeafMap {
  value: LeafMap;
}
