import createRBTree, { Tree } from "../vendor/functional-red-black-tree";
import type { LeafNode } from "../id_list";

/**
 * A persistent sorted map from each LeafNode to its parent's seq.
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

  /**
   * Returns the greatest leaf whose first id is <= the given id,
   * or undefined if none exists. Also returns the associated seq (or -1 if not found).
   *
   * The returned leaf might not actually contain the given id.
   */
  getLeaf(
    bunchId: string,
    counter: number
  ): [leaf: LeafNode | undefined, seq: number] {
    const iter = this.tree.le({ bunchId, startCounter: counter } as LeafNode);
    return [iter.key, iter.value ?? -1];
  }

  set(leaf: LeafNode, seq: number): LeafMap {
    return new LeafMap(this.tree.set(leaf, seq));
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
