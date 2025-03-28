import createRBTree, { Tree } from "functional-red-black-tree";
import type { LeafNode } from "../id_list";

/**
 * A persistent sorted map from each LeafNode to its parent's seqNum.
 *
 * Leaves are sorted by their first ElementId.
 * This lets you quickly look up the LeafNode containing an ElementId,
 * even though the LeafNode might start at a lower counter.
 */
export class LeafMap {
  private constructor(private readonly tree: Tree<LeafNode, number>) {}

  static new() {
    return new this(createRBTree(compareLeaves));
  }

  getSeq(leaf: LeafNode): number {
    return this.tree.get(leaf)!;
  }

  /**
   * Returns the greatest leaf whose first id is <= the given id,
   * or undefined if none exists.
   *
   * The returned leaf might not actually contain the given id.
   */
  getLeaf(bunchId: string, counter: number): LeafNode | undefined {
    return this.tree.le({ bunchId, startCounter: counter } as LeafNode).key;
  }

  set(leaf: LeafNode, seq: number): LeafMap {
    // TODO: Vendor functional-red-black-tree and add our own set method
    // so we can avoid this 2x penalty.
    return new LeafMap(this.tree.remove(leaf).insert(leaf, seq));
  }

  delete(leaf: LeafNode): LeafMap {
    return new LeafMap(this.tree.remove(leaf));
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
