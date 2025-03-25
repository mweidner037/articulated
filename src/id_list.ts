import { SparseIndices } from "sparse-array-rled";
import { ElementId } from "./id";
import { SavedIdList } from "./saved_id_list";

// Most exports are only for tests. See index.ts for public exports.

export interface LeafNode {
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
  /**
   * The present counter values in this leaf node.
   *
   * Note that it starts at this.count, not 0.
   */
  readonly present: SparseIndices;
}

export class InnerNodeInner {
  readonly size: number;
  readonly knownSize: number;

  constructor(readonly children: readonly InnerNode[]) {
    let size = 0;
    let knownSize = 0;
    for (const child of children) {
      size += child.size;
      knownSize += child.knownSize;
    }
    this.size = size;
    this.knownSize = knownSize;
  }
}

export class InnerNodeLeaf {
  readonly size: number;
  readonly knownSize: number;

  constructor(readonly children: readonly LeafNode[]) {
    let size = 0;
    let knownSize = 0;
    for (const child of children) {
      size += child.present.count();
      knownSize += child.count;
    }
    this.size = size;
    this.knownSize = knownSize;
  }
}

export type InnerNode = InnerNodeInner | InnerNodeLeaf;

type Located = [
  { node: LeafNode; indexInParent: number },
  // Index 1 will be an InnerNodeLeaf if it exists.
  ...{ node: InnerNode; indexInParent: number }[]
];

/**
 * The B+Tree's branching factor, i.e., the max number of children of a node.
 *
 * Note that our B+Tree has no keys - in particular, no keys in internal nodes.
 *
 * Wiki B+Tree: "B+ trees can also be used for data stored in RAM.
 * In this case a reasonable choice for block size would be the size of [the] processor's cache line."
 * (64 bytes) / (8 byte pointer) = 8.
 */
export const M = 8;

// TODO:
// - Move helper methods to functions, for minification.
// - Combine at/indexOf with KnownId versions, for easier modification & smaller code.

/**
 * A list of ElementIds, as a persistent (immutable) data structure.
 *
 * An IdList helps you assign a unique immutable id to each element of a list, such
 * as a todo-list or a text document (= list of characters). That way, you can keep track
 * of those elements even as their (array) indices change due to insert/delete operations
 * earlier in the list.
 *
 * Any id that has been inserted into an IdList remains **known** to that list indefinitely,
 * allowing you to reference it in insertAfter/insertBefore operations. Calling {@link delete}
 * merely marks an id as deleted (= not present); it remains in memory as a "tombstone".
 * This is useful in collaborative settings, since another user might instruct you to
 * call `insertAfter(before, newId)` when you have already deleted `before` locally.
 *
 * To enable easy and efficient rollbacks, such as in a
 * [server reconciliation](https://mattweidner.com/2024/06/04/server-architectures.html#1-server-reconciliation)
 * architecture, IdList is a persistent (immutable) data structure. Mutating methods
 * return a new IdList, sharing memory with the old IdList where possible.
 *
 * See {@link ElementId} for advice on generating ElementIds. IdList is optimized for
 * the case where sequential ElementIds often have the same bunchId and sequential counters.
 * However, you are not required to order ids in this way - it is okay if future edits
 * cause such ids to be separated, partially deleted, or even reordered.
 */
export class IdList {
  /**
   * Internal - construct an IdList using a static method (e.g. `IdList.new`).
   */
  private constructor(private readonly root: InnerNode) {}

  /**
   * Constructs an empty list.
   *
   * To begin with a non-empty list, use {@link IdList.from} or {@link IdList.fromIds}.
   */
  static new() {
    return new this(new InnerNodeLeaf([]));
  }

  /**
   * Constructs a list with the given known ids and their isDeleted status, in list order.
   */
  static from(
    knownIds: Iterable<{ id: ElementId; isDeleted: boolean }>
  ): IdList {
    // Convert knownIds to a saved state and load that.
    const savedState: SavedIdList = [];

    for (const { id, isDeleted } of knownIds) {
      if (savedState.length !== 0) {
        const current = savedState[savedState.length - 1];
        if (
          id.bunchId === current.bunchId &&
          id.counter === current.startCounter + current.count &&
          isDeleted === current.isDeleted
        ) {
          current.count++;
          continue;
        }
      }

      savedState.push({
        bunchId: id.bunchId,
        startCounter: id.counter,
        count: 1,
        isDeleted,
      });
    }

    return IdList.load(savedState);
  }

  /**
   * Constructs a list with the given present ids.
   *
   * Typically, you instead want {@link IdList.from}, which allows you to also
   * specify known-but-deleted ids. That way, you can reference the known-but-deleted ids
   * in future insertAfter/insertBefore operations.
   */
  static fromIds(ids: Iterable<ElementId>): IdList {
    return this.from(
      (function* () {
        for (const id of ids) yield { id, isDeleted: false };
      })()
    );
  }

  /**
   * Inserts `newId` immediately after the given id (`before`), which may be deleted.
   * A new IdList is returned and the current list remains unchanged.
   *
   * All ids to the right of `before` are shifted one index to the right, in the manner
   * of [Array.splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice).
   *
   * Use `before = null` to insert at the beginning of the list, to the left of all
   * known ids.
   *
   * @param count Provide this to bulk-insert `count` ids from left-to-right,
   * starting with newId and proceeding with the same bunchId and sequential counters.
   * @throws If `before` is not known.
   * @throws If `newId` is already known.
   */
  insertAfter(before: ElementId | null, newId: ElementId, count = 1): IdList {
    if (!(Number.isSafeInteger(newId.counter) && newId.counter >= 0)) {
      throw new Error(`Invalid counter: ${newId.counter}`);
    }
    if (!(Number.isSafeInteger(count) && count >= 0)) {
      throw new Error(`Invalid count: ${count}`);
    }
    // TODO: This doesn't check if newId...count ids are known.
    // Likewise in insertBefore and IdListSimple.
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    if (before === null) {
      if (count === 0) return this;

      if (this.root.children.length === 0) {
        // Insert the first leaf as a child of root.
        const present = SparseIndices.new();
        present.set(newId.counter, count);
        return new IdList(
          new InnerNodeLeaf([
            {
              bunchId: newId.bunchId,
              startCounter: newId.counter,
              count,
              present,
            },
          ])
        );
      } else {
        // Insert before the first known id.
        return this.insertBefore(firstId(this.root), newId, count);
      }
    }

    const located = locate(before, this.root);
    if (located === null) {
      throw new Error("before is not known");
    }
    if (count === 0) return this;
    const leaf = located[0].node;

    if (before.counter === leaf.startCounter + leaf.count - 1) {
      // before is leaf's last id: we insert directly after leaf.
      if (
        leaf.bunchId === newId.bunchId &&
        leaf.startCounter + leaf.count === newId.counter
      ) {
        // Extending leaf forwards.
        const present = leaf.present.clone();
        present.set(newId.counter, count);
        return this.replaceLeaf(located, {
          ...leaf,
          count: leaf.count + count,
          present,
        });
      } else {
        const present = SparseIndices.new();
        present.set(newId.counter, count);
        return this.replaceLeaf(located, leaf, {
          bunchId: newId.bunchId,
          startCounter: newId.counter,
          count,
          present,
        });
      }
    } else {
      // before is not leaf's last id: we need to split leaf and insert there.
      const newPresent = SparseIndices.new();
      newPresent.set(newId.counter, count);
      const [leftPresent, rightPresent] = splitPresent(
        leaf.present,
        before.counter + 1
      );
      return this.replaceLeaf(
        located,
        {
          ...leaf,
          count: before.counter + 1 - leaf.startCounter,
          present: leftPresent,
        },
        {
          bunchId: newId.bunchId,
          startCounter: newId.counter,
          count,
          present: newPresent,
        },
        {
          ...leaf,
          startCounter: before.counter + 1,
          count: leaf.count - (before.counter + 1 - leaf.startCounter),
          present: rightPresent,
        }
      );
    }
  }

  /**
   * Inserts `newId` immediately before the given id (`after`), which may be deleted.
   * A new IdList is returned and the current list remains unchanged.
   *
   * All ids to the right of `after`, plus `after` itself, are shifted one index to the right, in the manner
   * of [Array.splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice).
   *
   * Use `after = null` to insert at the end of the list, to the right of all known ids.
   *
   * @param count Provide this to bulk-insert `count` ids from left-to-right,
   * starting with newId and proceeding with the same bunchId and sequential counters.
   * __Note__: Although the new ids are inserted to the left of `after`, they are still
   * inserted in left-to-right order relative to each other.
   * @throws If `after` is not known.
   * @throws If `newId` is already known.
   */
  insertBefore(after: ElementId | null, newId: ElementId, count = 1): IdList {
    if (!(Number.isSafeInteger(newId.counter) && newId.counter >= 0)) {
      throw new Error(`Invalid counter: ${newId.counter}`);
    }
    if (!(Number.isSafeInteger(count) && count >= 0)) {
      throw new Error(`Invalid count: ${count}`);
    }
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    if (after === null) {
      if (count === 0) return this;

      if (this.root.children.length === 0) {
        // Insert the first leaf as a child of root.
        const present = SparseIndices.new();
        present.set(newId.counter, count);
        return new IdList(
          new InnerNodeLeaf([
            {
              bunchId: newId.bunchId,
              startCounter: newId.counter,
              count,
              present,
            },
          ])
        );
      } else {
        // Insert after the first known id.
        return this.insertAfter(lastId(this.root), newId, count);
      }
    }

    const located = locate(after, this.root);
    if (located === null) {
      throw new Error("after is not known");
    }
    if (count === 0) return this;
    const leaf = located[0].node;

    if (after.counter === leaf.startCounter) {
      // after is leaf's first id: we insert directly before leaf.
      if (
        leaf.bunchId === newId.bunchId &&
        leaf.startCounter === newId.counter + count
      ) {
        // Extending leaf backwards.
        const present = leaf.present.clone();
        present.set(newId.counter, count);
        return this.replaceLeaf(located, {
          ...leaf,
          startCounter: leaf.startCounter - count,
          count: leaf.count + count,
          present,
        });
      } else {
        const present = SparseIndices.new();
        present.set(newId.counter, count);
        return this.replaceLeaf(
          located,
          {
            bunchId: newId.bunchId,
            startCounter: newId.counter,
            count,
            present,
          },
          leaf
        );
      }
    } else {
      // after is not leaf's first id: we need to split leaf and insert there.
      const present = SparseIndices.new();
      present.set(newId.counter, count);
      const [leftPresent, rightPresent] = splitPresent(
        leaf.present,
        after.counter
      );
      return this.replaceLeaf(
        located,
        {
          ...leaf,
          count: after.counter - leaf.startCounter,
          present: leftPresent,
        },
        {
          bunchId: newId.bunchId,
          startCounter: newId.counter,
          count,
          present,
        },
        {
          ...leaf,
          startCounter: after.counter,
          count: leaf.count - (after.counter - leaf.startCounter),
          present: rightPresent,
        }
      );
    }
  }

  /**
   * Marks `id` as deleted from this list.
   * A new IdList is returned and the current list remains unchanged.
   *
   * The id remains known (a "tombstone").
   * Because `id` is still known, you can reference it in future insertAfter/insertBefore
   * operations, including ones sent concurrently by other devices.
   * However, it does occupy space in memory (compressed in common cases).
   *
   * If `id` is already deleted or not known, this method does nothing.
   */
  delete(id: ElementId) {
    const located = locate(id, this.root);
    if (located === null) return this;

    const leaf = located[0].node;
    if (!leaf.present.has(id.counter)) return this;

    const newPresent = leaf.present.clone();
    newPresent.delete(id.counter);

    return this.replaceLeaf(located, { ...leaf, present: newPresent });
  }

  /**
   * Un-marks `id` as deleted from this list, making it present again.
   * A new IdList is returned and the current list remains unchanged.
   *
   * This method is an exact inverse to {@link delete}.
   *
   * If `id` is already present, this method does nothing.
   *
   * @throws If `id` is not known.
   */
  undelete(id: ElementId) {
    const located = locate(id, this.root);
    if (located === null) {
      throw new Error("id is not known");
    }

    const leaf = located[0].node;
    if (leaf.present.has(id.counter)) return this;

    const newPresent = leaf.present.clone();
    newPresent.set(id.counter);

    return this.replaceLeaf(located, { ...leaf, present: newPresent });
  }

  /**
   * Replaces the leaf at the given path with newLeaves.
   * Returns a proper BTree with updated sizes.
   *
   * newLeaves.length must be in [1, M].
   */
  private replaceLeaf(located: Located, ...newLeaves: LeafNode[]): IdList {
    return new IdList(replaceNode(located, this.root, newLeaves, 0));
  }

  // Accessors

  /**
   * Returns whether `id` is present in the list, i.e., it is known and not deleted.
   *
   * If `id` is not known, false is returned.
   *
   * Compare to {@link isKnown}.
   */
  has(id: ElementId): boolean {
    const located = locate(id, this.root);
    if (located === null) return false;
    return located[0].node.present.has(id.counter);
  }

  /**
   * Returns whether id is known to this list.
   *
   * Compare to {@link has}.
   */
  isKnown(id: ElementId): boolean {
    return locate(id, this.root) !== null;
  }

  get length() {
    return this.root.size;
  }

  /**
   * Returns the id at the given index in the list.
   *
   * @throws If index is out of bounds.
   */
  at(index: number): ElementId {
    if (!(Number.isSafeInteger(index) && 0 <= index && index < this.length)) {
      throw new Error(`Index out of bounds: ${index} (length: ${this.length}`);
    }

    let remaining = index;
    let curParent = this.root;
    // eslint-disable-next-line no-constant-condition
    recurse: while (true) {
      if (curParent instanceof InnerNodeInner) {
        for (const child of curParent.children) {
          if (remaining < child.size) {
            // Recurse.
            curParent = child;
            continue recurse;
          } else {
            remaining -= child.size;
          }
        }
      } else {
        for (const child of curParent.children) {
          const childSize = child.present.count();
          if (remaining < childSize) {
            // Found it.
            return {
              bunchId: child.bunchId,
              counter: child.present.indexOfCount(remaining),
            };
          } else {
            remaining -= childSize;
          }
        }
      }

      throw new Error("Internal error");
    }
  }

  /**
   * Returns the index of `id` in the list.
   *
   * If `id` is known but deleted, the bias specifies what to return:
   * - "none": -1.
   * - "left": The index immediately to the left of `id`, possibly -1.
   * - "right": The index immediately to the right of `id`, possibly `this.length`.
   * Equivalently, the index where `id` would be if present.
   *
   * @throws If `id` is not known.
   */
  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {
    const located = locate(id, this.root);
    if (located === null) throw new Error("id is not known");

    /**
     * The number of present ids less than id.
     * Equivalently, the index id would have if present.
     */
    let index = 0;

    // Lesser siblings of parent, grandparent, etc.
    for (let i = 1; i < located.length; i++) {
      const parent = (
        i === located.length - 1 ? this.root : located[i + 1].node
      ) as InnerNodeInner;
      for (let c = 0; c < located[i].indexInParent; c++) {
        index += parent.children[c].size;
      }
    }

    // Siblings of id's leaf.
    const leafParent = (
      located.length === 1 ? this.root : located[1].node
    ) as InnerNodeLeaf;
    for (let c = 0; c < located[0].indexInParent; c++) {
      index += leafParent.children[c].present.count();
    }

    // id's index within leaf.
    const idLeaf = leafParent.children[located[0].indexInParent];
    const [count, has] = idLeaf.present._countHas(id.counter);
    index += count;
    if (has) return index;
    else {
      switch (bias) {
        case "none":
          return -1;
        case "left":
          return index - 1;
        case "right":
          return index;
      }
    }
  }

  // Iterators and views

  /**
   * Iterates over all present ids in the list.
   */
  [Symbol.iterator](): IterableIterator<ElementId> {
    return iterateNode(this.root, false);
  }

  /**
   * Iterates over all present ids in the list.
   */
  values() {
    return this[Symbol.iterator]();
  }

  /**
   * Iterates over all __known__ ids in the list, indicating which are deleted.
   */
  valuesWithDeleted(): IterableIterator<{ id: ElementId; isDeleted: boolean }> {
    return iterateNodeWithDeleted(this.root);
  }

  private _knownIds?: KnownIdView;

  /**
   * A view of this list that treats all known ids as present.
   * That is, it ignores isDeleted status when computing list indices or iterating.
   */
  get knownIds(): KnownIdView {
    if (this._knownIds === undefined) {
      this._knownIds = new KnownIdView(this, this.root);
    }
    return this._knownIds;
  }

  // Save and load

  /**
   * Returns a compact JSON representation of this list's internal state.
   * Load with {@link load}.
   *
   * See {@link SavedIdList} for a description of the save format.
   */
  save(): SavedIdList {
    const acc: SavedIdList = [];
    saveNode(this.root, acc);
    return acc;
  }

  /**
   * Loads a saved state returned by {@link save}.
   */
  static load(savedState: SavedIdList) {
    // TODO: Checks to ban duplicate ids.

    // 1. Determine the leaves.

    const leaves: LeafNode[] = [];
    for (let i = 0; i < savedState.length; i++) {
      const item = savedState[i];

      if (!(Number.isSafeInteger(item.count) && item.count >= 0)) {
        throw new Error(`Invalid count: ${item.count}`);
      }
      if (
        !(Number.isSafeInteger(item.startCounter) && item.startCounter >= 0)
      ) {
        throw new Error(`Invalid startCounter: ${item.startCounter}`);
      }

      if (item.count === 0) continue;

      if (leaves.length !== 0) {
        const lastLeaf = leaves.at(-1)!;
        if (
          item.bunchId === lastLeaf.bunchId &&
          item.startCounter === lastLeaf.startCounter + lastLeaf.count
        ) {
          // Extend lastLeaf.
          // Okay to mutate in-place since we haven't referenced it anywhere else yet.
          // @ts-expect-error Mutate in place
          lastLeaf.count += item.count;
          if (!item.isDeleted)
            lastLeaf.present.set(item.startCounter, item.count);
          continue;
        }
      }

      // If we get to here, we need a new leaf.
      const present = SparseIndices.new();
      if (!item.isDeleted) present.set(item.startCounter, item.count);
      leaves.push({
        bunchId: item.bunchId,
        startCounter: item.startCounter,
        count: item.count,
        present,
      });
    }

    // 2. Create a B+Tree with the given leaves.
    // We do a "direct" balanced construction that takes O(n) time, instead of inserting
    // leaves one-by-one, which would take O(n log(n)) time.

    if (leaves.length === 0) return IdList.new();
    // Depth of the B+Tree, excluding the root.
    // A B+Tree of depth d has between [M^{d-1} - 1, M^d] leaves.
    let depth = Math.ceil(Math.log(leaves.length) / Math.log(M));
    if (depth === 0) depth = 1;
    return new IdList(buildTree(leaves, 0, depth - 1));
  }
}

function buildTree(
  leaves: LeafNode[],
  startIndex: number,
  depthRemaining: number
): InnerNode {
  if (depthRemaining === 0) {
    return new InnerNodeLeaf(leaves.slice(startIndex, startIndex + M));
  } else {
    const children: InnerNode[] = [];
    const childLeafCount = Math.pow(M, depthRemaining);
    for (let i = 0; i < M; i++) {
      const childStartIndex = startIndex + i * childLeafCount;
      if (childStartIndex >= leaves.length) break;
      children.push(buildTree(leaves, childStartIndex, depthRemaining - 1));
    }
    return new InnerNodeInner(children);
  }
}

/**
 * A view of an IdList that treats all known ids as present.
 * That is, this class ignores the underlying list's isDeleted status when computing list indices.
 * Access using {@link IdList.knownIds}.
 *
 * Like IdList, KnownIdView is immutable. To mutate, use a mutating method on the original IdList
 * and access the returned list's `knownIds`.
 */
export class KnownIdView {
  /**
   * Internal use only. Use {@link IdList.knownIds} instead.
   */
  constructor(readonly list: IdList, private readonly root: InnerNode) {}

  // Mutators are omitted - mutate this.list instead.

  // Accessors

  /**
   * Returns the id at the given index in this view.
   *
   * Equivalently, returns the index-th known id in `this.list`.
   *
   * @throws If index is out of bounds.
   */
  at(index: number): ElementId {
    if (!(Number.isSafeInteger(index) && 0 <= index && index < this.length)) {
      throw new Error(`Index out of bounds: ${index} (length: ${this.length}`);
    }

    let remaining = index;
    let curParent = this.root;
    // eslint-disable-next-line no-constant-condition
    recurse: while (true) {
      if (curParent instanceof InnerNodeInner) {
        for (const child of curParent.children) {
          if (remaining < child.knownSize) {
            // Recurse.
            curParent = child;
            continue recurse;
          } else {
            remaining -= child.knownSize;
          }
        }
      } else {
        for (const child of curParent.children) {
          if (remaining < child.count) {
            // Found it.
            return {
              bunchId: child.bunchId,
              counter: child.startCounter + remaining,
            };
          } else {
            remaining -= child.count;
          }
        }
      }

      throw new Error("Internal error");
    }
  }

  /**
   * Returns the index of `id` in this view, or -1 if it is not known.
   */
  indexOf(id: ElementId): number {
    const located = locate(id, this.root);
    if (located === null) throw new Error("id is not known");

    /**
     * The number of present ids less than id.
     * Equivalently, the index id would have if present.
     */
    let index = 0;

    // Lesser siblings of parent, grandparent, etc.
    for (let i = 1; i < located.length; i++) {
      const parent = (
        i === located.length - 1 ? this.root : located[i + 1].node
      ) as InnerNodeInner;
      for (let c = 0; c < located[i].indexInParent; c++) {
        index += parent.children[c].knownSize;
      }
    }

    // Siblings of id's leaf.
    const leafParent = (
      located.length === 1 ? this.root : located[1].node
    ) as InnerNodeLeaf;
    for (let c = 0; c < located[0].indexInParent; c++) {
      const child = leafParent.children[c];
      index += child.count;
    }

    // id's index with leaf.
    const idLeaf = leafParent.children[located[0].indexInParent];
    return index + (id.counter - idLeaf.startCounter);
  }

  /**
   * The length of this view.
   *
   * Equivalently, the number of known ids in `this.list`.
   */
  get length(): number {
    return this.root.knownSize;
  }

  // Iterators

  /**
   * Iterates over all ids in this view, i.e., all known ids in `this.list`.
   */
  [Symbol.iterator](): IterableIterator<ElementId> {
    return iterateNode(this.root, true);
  }

  /**
   * Iterates over all ids in this view, i.e., all known ids in `this.list`.
   */
  values() {
    return this[Symbol.iterator]();
  }
}

function firstId(node: InnerNode): ElementId {
  let currentInner = node;
  while (!(currentInner instanceof InnerNodeLeaf)) {
    currentInner = currentInner.children[0];
  }
  const firstLeaf = currentInner.children[0];
  return {
    bunchId: firstLeaf.bunchId,
    counter: firstLeaf.startCounter,
  };
}

function lastId(node: InnerNode): ElementId {
  let currentInner = node;
  while (!(currentInner instanceof InnerNodeLeaf)) {
    currentInner = currentInner.children.at(-1)!;
  }
  const lastLeaf = currentInner.children.at(-1)!;
  return {
    bunchId: lastLeaf.bunchId,
    counter: lastLeaf.startCounter,
  };
}

/**
 * Returns the path from id's leaf node to the root, or null if id is not found.
 *
 * The path contains each node and its index in its parent's node, starting with id's
 * LeafNode and ending at a child of the root.
 */
export function locate(id: ElementId, node: InnerNode): Located | null {
  if (node instanceof InnerNodeInner) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      const childLocated = locate(id, child);
      if (childLocated !== null) {
        childLocated.push({ node: child, indexInParent: i });
        return childLocated;
      }
    }
  } else {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (
        child.bunchId === id.bunchId &&
        child.startCounter <= id.counter &&
        id.counter < child.startCounter + child.count
      ) {
        return [{ node: child, indexInParent: i }];
      }
    }
  }
  return null;
}

/**
 * Replace located[i].node with newNodes. root is effectively located[located.length].node.
 *
 * newNodes.length must be in [1, M].
 */
function replaceNode(
  located: Located,
  root: InnerNode,
  newNodes: InnerNode[] | LeafNode[],
  i: number
): InnerNode {
  const parent =
    i === located.length - 1 ? root : (located[i + 1].node as InnerNode);
  const indexInParent = located[i].indexInParent;
  // Copy-on-write version of parent.children.splice(indexInParent, 1, ...newNodes)
  const newChildren = parent.children
    .slice(0, indexInParent)
    .concat(newNodes, parent.children.slice(indexInParent + 1));

  if (newChildren.length > M) {
    const split = Math.floor(newChildren.length / 2);
    const newParents = [
      newChildren.slice(0, split),
      newChildren.slice(split),
    ].map((children) =>
      i === 0
        ? new InnerNodeLeaf(children as LeafNode[])
        : new InnerNodeInner(children as InnerNode[])
    );
    if (i === located.length - 1) {
      // newParents replace root. We need a new root to hold them.
      return new InnerNodeInner(newParents);
    } else {
      return replaceNode(located, root, newParents, i + 1);
    }
  } else {
    const newParent =
      i === 0
        ? new InnerNodeLeaf(newChildren as LeafNode[])
        : new InnerNodeInner(newChildren as InnerNode[]);
    if (i === located.length - 1) {
      // Replaces root.
      return newParent;
    } else {
      return replaceNode(located, root, [newParent], i + 1);
    }
  }
}

function splitPresent(
  present: SparseIndices,
  splitCounter: number
): [leftPresent: SparseIndices, rightPresent: SparseIndices] {
  const leftPresent = SparseIndices.new();
  const rightPresent = SparseIndices.new();
  const leafSlicer = present.newSlicer();
  for (const [index, count] of leafSlicer.nextSlice(splitCounter)) {
    leftPresent.set(index, count);
  }
  for (const [index, count] of leafSlicer.nextSlice(null)) {
    rightPresent.set(index, count);
  }
  return [leftPresent, rightPresent];
}

function* iterateNode(
  node: InnerNode,
  includeDeleted: boolean
): IterableIterator<ElementId> {
  if (node instanceof InnerNodeInner) {
    for (const child of node.children) {
      yield* iterateNode(child, includeDeleted);
    }
  } else {
    for (const child of node.children) {
      if (includeDeleted) {
        for (let i = 0; i < child.count; i++) {
          yield { bunchId: child.bunchId, counter: child.startCounter + i };
        }
      } else {
        for (const counter of child.present.keys()) {
          yield { bunchId: child.bunchId, counter };
        }
      }
    }
  }
}

function* iterateNodeWithDeleted(
  node: InnerNode
): IterableIterator<{ id: ElementId; isDeleted: boolean }> {
  if (node instanceof InnerNodeInner) {
    for (const child of node.children) {
      yield* iterateNodeWithDeleted(child);
    }
  } else {
    for (const child of node.children) {
      let nextIndex = child.startCounter;
      for (const index of child.present.keys()) {
        while (nextIndex < index) {
          yield {
            id: { bunchId: child.bunchId, counter: nextIndex },
            isDeleted: true,
          };
          nextIndex++;
        }
        yield {
          id: { bunchId: child.bunchId, counter: index },
          isDeleted: false,
        };
        nextIndex++;
      }
      while (nextIndex < child.startCounter + child.count) {
        yield {
          id: { bunchId: child.bunchId, counter: nextIndex },
          isDeleted: true,
        };
        nextIndex++;
      }
    }
  }
}

// TODO: It's possible for adjacent leaves to be mergeable but not merged.
// This happens if you insert a bunch in pattern 0, 2, 1.
// I think that's okay (just a perf issue that goes away after reloading),
// but we need to merge the resulting save items, document it,
// and check that no other parts of the code depend on fully-merged leaves.
function saveNode(node: InnerNode, acc: SavedIdList) {
  if (node instanceof InnerNodeInner) {
    for (const child of node.children) {
      saveNode(child, acc);
    }
  } else {
    for (const child of node.children) {
      let nextIndex = child.startCounter;
      for (const [index, count] of child.present.items()) {
        if (nextIndex < index) {
          // Need a deleted item.
          acc.push({
            bunchId: child.bunchId,
            startCounter: nextIndex,
            count: index - nextIndex,
            isDeleted: true,
          });
        }
        acc.push({
          bunchId: child.bunchId,
          startCounter: index,
          count,
          isDeleted: false,
        });
        nextIndex = index + count;
      }
      if (nextIndex < child.startCounter + child.count) {
        acc.push({
          bunchId: child.bunchId,
          startCounter: nextIndex,
          count: child.startCounter + child.count - nextIndex,
          isDeleted: true,
        });
      }
    }
  }
}
