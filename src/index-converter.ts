export interface Position {
  readonly bunchId: string;
  readonly innerIndex: number;
}

interface ListNode {
  bunchId: string;
  innerIndex: number;
  size: number;
  isDeleted: boolean;
  right: ListNode | null;
}

export class IndexConverter {
  static readonly ROOT: Position = {
    bunchId: "ROOT",
    innerIndex: 0,
  };

  private head: ListNode = {
    bunchId: IndexConverter.ROOT.bunchId,
    innerIndex: IndexConverter.ROOT.innerIndex,
    size: 1,
    isDeleted: true,
    right: null,
  };

  // TODO: update this
  private _length = 0;

  // Mutators

  insertAfter(beforePos: Position, pos: Position, count = 1) {
    // TODO: Check all count positions, not just pos.
    if (this.has(pos)) throw new Error("Already contains pos");

    for (
      let node: ListNode | null = this.head;
      node !== null;
      node = node.right
    ) {
      if (
        node.bunchId === beforePos.bunchId &&
        node.innerIndex <= beforePos.innerIndex &&
        beforePos.innerIndex < node.innerIndex + node.size
      ) {
        // beforePos is in or at the end of node.

        // In the common case of LtR bunch insertions, just extend node.
        if (
          node.bunchId === pos.bunchId &&
          node.innerIndex + node.size === pos.innerIndex
        ) {
          node.size += count;
          return;
        }

        const [left, right] = this.splitIfNeeded(
          node,
          beforePos.innerIndex - node.innerIndex
        );
        const newNode: ListNode = {
          bunchId: pos.bunchId,
          innerIndex: pos.innerIndex,
          size: count,
          isDeleted: false,
          right: right,
        };
        left.right = newNode;

        this.tryMergeTwice(left);

        return;
      }
    }

    throw new Error("Unknown position: beforePos");
  }

  delete(pos: Position) {
    // TODO: option to merge.
    // TODO: return whether already deleted?
  }

  // TODO: bulk delete? Tricky to communicate what is deleted (may be split by
  // intervening positions or partially deleted already).

  hardDelete(pos: Position, count = 1) {}

  // TODO: move to functions, for minification.
  /**
   * Given offset in (0, node.size], splits the node at offset if needed (i.e., if offset != node.size).
   * Returns the nodes to the left and right of the split.
   */
  private splitIfNeeded(
    node: ListNode,
    offset: number
  ): [left: ListNode, right: ListNode | null] {
    if (offset === node.size) return [node, node.right];
    const rightHalf: ListNode = {
      bunchId: node.bunchId,
      innerIndex: node.innerIndex + offset,
      size: node.size - offset,
      isDeleted: node.isDeleted,
      right: node.right,
    };
    node.size = offset;
    node.right = rightHalf;
    return [node, rightHalf];
  }

  /**
   * Tries to merge node.right with both of its neighbors.
   */
  private tryMergeTwice(node: ListNode) {
    const newRight = this.tryMergeOnce(node);
    if (newRight !== null) this.tryMergeOnce(newRight);
  }

  /**
   * Tries to merge node with node.right. Returns the new rightmost node.
   */
  private tryMergeOnce(node: ListNode): ListNode | null {
    if (node.right === null) return null;
    if (
      node.bunchId === node.right.bunchId &&
      node.innerIndex + node.size === node.right.innerIndex &&
      node.isDeleted === node.right.isDeleted
    ) {
      // Merge.
      node.size += node.right.size;
      node.right = node.right.right;
      return node;
    } else return node.right;
  }

  // Accessors

  positionAt(index: number): Position {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) {
      throw new Error(`Invalid index: ${index} (length: ${this.length}`);
    }

    let remaining = index;
    for (
      let node: ListNode | null = this.head;
      node !== null;
      node = node.right
    ) {
      if (!node.isDeleted) {
        if (node.size < remaining) {
          return {
            bunchId: node.bunchId,
            innerIndex: node.innerIndex + remaining,
          };
        }
        remaining -= node.size;
      }
    }

    throw new Error("Internal error: valid index not found");
  }

  indexOf(pos: Position, bias: "exact" | "left" | "right" = "exact"): number {
    let index = 0;

    for (
      let node: ListNode | null = this.head;
      node !== null;
      node = node.right
    ) {
      if (
        node.bunchId === pos.bunchId &&
        node.innerIndex <= pos.innerIndex &&
        pos.innerIndex < node.innerIndex + node.size
      ) {
        // pos is within node.
        if (node.isDeleted) {
          switch (bias) {
            case "exact":
              return -1;
            case "left":
              return index - 1;
            case "right":
              return index;
          }
        } else {
          return index + (pos.innerIndex - node.innerIndex);
        }
      }

      if (!node.isDeleted) index += node.size;
    }

    throw new Error("Unknown position");
  }

  has(pos: Position): boolean {
    for (
      let node: ListNode | null = this.head;
      node !== null;
      node = node.right
    ) {
      if (
        node.bunchId === pos.bunchId &&
        node.innerIndex <= pos.innerIndex &&
        pos.innerIndex < node.innerIndex + node.size
      ) {
        return !node.isDeleted;
      }
    }

    throw new Error("Unknown position");
  }

  get length(): number {
    return this._length;
  }

  // TODO: iterators, incl optimized ones.

  // Misc

  clone(): IndexConverter {}

  // TODO: save/load
}
