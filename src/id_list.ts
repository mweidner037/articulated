import { SparseIndices } from "sparse-array-rled";
import { ElementId } from "./element_id";
import { LeafMap, MutableLeafMap } from "./internal/leaf_map";
import { checkCount } from "./internal/misc";
import { getAndBumpNextSeq, MutableSeqMap, SeqMap } from "./internal/seq_map";
import { SavedIdList } from "./saved_id_list";

// Most exports are only for tests. See index.ts for public exports.

/*
 IdList implementation using a modified B+Tree.

 See tests/id_list_simple.ts for a simpler implementation with the same API but
 impractical efficiency (linear time ops; one object in memory per id).
 The fuzz tests compare that implementation to this one.

 The B+Tree is unusual in that it has no keys, only values (= ids). The order on the values
 is determined "by fiat" using insertAfter/insertBefore instead of using sorted keys.

 The leaves in the B+Tree are not individual ids; instead, each leaf is a compressed representation of a groups of ids
 with the same bunchId and sequential counters. Each leaf also contains a `present`
 field to track which of its ids are deleted.
 (Unlike in a SavedIdList, we do not separate adjacent ids with different isDeleted statuses.)

 Note that it is possible for adjacent leaves to be mergeable (i.e., they could be one leaf) but not merged.
 This happens if you insert the middle ids later (e.g., 0, 2, 1).
 It has a slight perf penalty that goes away once you reload.
 Note that save() needs to work around this possibility - see pushSaveItem.

 The B+Tree also stores two statistics about each subtree: its size (# of present ids)
 and its knownSize (# of known ids). These allow indexed access in log time.

 Unlike some B+Trees, we do not store a linked list of leaves. Iteration instead uses a depth-first search.

 Finally, we also store a "bottom-up" view of the B+Tree, in order to quickly find the leaf or
 tree path corresponding to an ElementId. Each inner node is assigned a unique sequence number
 (seq), and we store a persistent map from each leaf to its parent's seq (leafMap)
 and from each inner node's seq to its parent's seq (parentSeqs). Because leafMap is sorted
 by (LeafNode.bunchId, LeafNode.startCounter), we can also use it to lookup the leaf corresponding
 to an ElementId, e.g., for IdList.has.
*/

export interface LeafNode {
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
  /**
   * The present counter values in this leaf node.
   *
   * Note that it is indexed by counter, not by (counter - this.startCounter).
   */
  readonly present: SparseIndices;
}

/**
 * An inner node with inner-node children.
 */
export class InnerNodeInner {
  readonly size: number;
  readonly knownSize: number;

  constructor(
    /**
     * A unique identifer for this node within its IdTree.
     */
    readonly seq: number,
    readonly children: readonly InnerNode[],
    /**
     * We add entries for the children to this map, overwriting any existing parentSeqs.
     *
     * Pass null to skip when you are doing it yourself. Regardless, you need to
     * delete any outdated entries yourself.
     */
    parentSeqsMut: MutableSeqMap | null
  ) {
    let size = 0;
    let knownSize = 0;
    for (const child of children) {
      size += child.size;
      knownSize += child.knownSize;
      if (parentSeqsMut) {
        parentSeqsMut.value = parentSeqsMut.value.set(child.seq, seq);
      }
    }
    this.size = size;
    this.knownSize = knownSize;
  }
}

/**
 * An inner node with leaf children.
 */
export class InnerNodeLeaf {
  readonly size: number;
  readonly knownSize: number;

  constructor(
    /**
     * A unique identifer for this node within its IdTree.
     */
    readonly seq: number,
    readonly children: readonly LeafNode[],
    /**
     * We add entries for the children to this map, overwriting any existing parentSeqs.
     *
     * Pass null to skip when you are doing it yourself.
     */
    leafMapMut: MutableLeafMap | null
  ) {
    let size = 0;
    let knownSize = 0;
    for (const child of children) {
      size += child.present.count();
      knownSize += child.count;
      if (leafMapMut) {
        leafMapMut.value = leafMapMut.value.set(child, seq);
      }
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
 * (64 byte cache line) / (8 byte pointer) = 8.
 */
export const M = 8;

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
 * merely marks an id as deleted (= not present); a deleted id does not count towards the length of the list or index-based accessors, but it does remain in memory as a "tombstone".
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
   * A persistent map from each InnerNode's seq to its parent node's seq.
   *
   * We map the root's seq to 0 (in our constructor).
   */
  private readonly parentSeqs: SeqMap;

  /**
   * Internal - construct an IdList using a static method (e.g. `IdList.new`).
   */
  private constructor(
    private readonly root: InnerNode,
    /**
     * A persistent sorted map from each leaf to its parent node's seq.
     *
     * Besides parentSeqs, we also use this to lookup leaves by ElementId.
     */
    private readonly leafMap: LeafMap,
    parentSeqs: SeqMap
  ) {
    this.parentSeqs = parentSeqs.set(root.seq, 0);
  }

  /**
   * Constructs an empty list.
   *
   * To begin with a non-empty list, use {@link IdList.from}, {@link IdList.fromIds},
   * or {@link IdList.load}.
   */
  static new() {
    const leafMapMut = { value: LeafMap.new() };
    const parentSeqsMut = { value: SeqMap.new() };
    return new this(
      new InnerNodeLeaf(getAndBumpNextSeq(parentSeqsMut), [], leafMapMut),
      leafMapMut.value,
      parentSeqsMut.value
    );
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
        const current = savedState.at(-1)!;
        if (
          id.bunchId === current.bunchId &&
          id.counter === current.startCounter + current.count &&
          isDeleted === current.isDeleted
        ) {
          // @ts-expect-error Mutating for convenience; no aliasing to worry about.
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
   * @throws If any inserted id is already known.
   */
  insertAfter(before: ElementId | null, newId: ElementId, count = 1): IdList {
    if (!(Number.isSafeInteger(newId.counter) && newId.counter >= 0)) {
      throw new Error(`Invalid counter: ${newId.counter}`);
    }
    checkCount(count);
    if (this.isAnyKnown(newId, count)) {
      throw new Error("An inserted id is already known");
    }

    if (before === null) {
      if (count === 0) return this;

      if (this.root.children.length === 0) {
        // Insert the first leaf as a child of root.
        const present = SparseIndices.new();
        present.set(newId.counter, count);
        const leaf: LeafNode = {
          bunchId: newId.bunchId,
          startCounter: newId.counter,
          count,
          present,
        };

        const leafMapMut = { value: this.leafMap };
        return new IdList(
          new InnerNodeLeaf(this.root.seq, [leaf], leafMapMut),
          leafMapMut.value,
          this.parentSeqs
        );
      } else {
        // Insert before the first known id.
        return this.insertBefore(firstId(this.root), newId, count);
      }
    }

    const located = this.locate(before);
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
    checkCount(count);
    if (this.isAnyKnown(newId, count)) {
      throw new Error("An inserted id is already known");
    }

    if (after === null) {
      if (count === 0) return this;

      // Insert after the last known id, or at the beginning if empty.
      return this.insertAfter(
        this.root.knownSize === 0 ? null : lastId(this.root),
        newId,
        count
      );
    }

    const located = this.locate(after);
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
   * Undoes the insertion of `id`, making it no longer known.
   * A new IdList is returned and the current list remains unchanged.
   *
   * This method is an exact inverse to `insertAfter(-, id)` or `insertBefore(-, id)`,
   * unlike `delete(id)`, which merely marks `id` as deleted.
   * You almost always want to use delete instead of uninsert, unless you are rolling
   * back the IdList state as part of a [server reconciliation](https://mattweidner.com/2024/06/04/server-architectures.html#1-server-reconciliation)
   * architecture. (Even then, you may find it easier to restore a snapshot instead
   * of explicitly undoing operations, making use of persistence.)
   *
   * If `id` is already not known, this method does nothing.
   *
   * @param count Provide this to bulk-uninsert `count` ids,
   * starting with id and proceeding with the same bunchId and sequential counters.
   * `uninsert(id, count)` is an exact inverse to `insertAfter(-, id, count)` or `insertBefore(-, id, count)`.
   */
  uninsert(id: ElementId, count = 1) {
    checkCount(count);
    if (count === 0) return this;

    // We optimize for the case where you are undoing the most recent insert operation.
    // In that case:
    // - All of the bulk ids are known and still together in one leaf.
    // - The bulk ids are at the right end of their leaf (assuming normal LtR ElementId generation).
    const located = this.locate(id);
    if (located) {
      const leaf = located[0].node;
      if (leaf.startCounter + leaf.count === id.counter + count) {
        if (leaf.startCounter === id.counter) {
          // Uninsert the entire leaf.
          return this.replaceLeaf(located);
        } else {
          // Shrink the right end of leaf.
          const present = leaf.present.clone();
          present.delete(id.counter, count);
          return this.replaceLeaf(located, {
            ...leaf,
            count: id.counter - leaf.startCounter,
            present,
          });
        }
      }
    }

    // Fallback for the general case.
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ans: IdList = this;
    for (let i = count - 1; i >= 0; i--) {
      ans = ans.uninsertOne({ bunchId: id.bunchId, counter: id.counter + i });
    }
    return ans;
  }

  private uninsertOne(id: ElementId) {
    const located = this.locate(id);
    if (located === null) return this;

    const leaf = located[0].node;
    const newLeaves: LeafNode[] = [];
    if (leaf.startCounter < id.counter) {
      // The part of leaf before id.
      const present = leaf.present.clone();
      present.delete(id.counter, present.length);
      newLeaves.push({
        ...leaf,
        count: id.counter - leaf.startCounter,
        present,
      });
    }
    if (id.counter + 1 < leaf.startCounter + leaf.count) {
      // The part of leaf after id.
      const present = leaf.present.clone();
      present.delete(0, id.counter + 1);
      newLeaves.push({
        ...leaf,
        startCounter: id.counter + 1,
        count: leaf.startCounter + leaf.count - (id.counter + 1),
        present,
      });
    }
    return this.replaceLeaf(located, ...newLeaves);
  }

  /**
   * Marks `id` as deleted from this list.
   * A new IdList is returned and the current list remains unchanged.
   *
   * Once deleted, `id` does not count towards the length of the list or index-based accessors.
   * However, it remains known (a "tombstone").
   * Because `id` is still known, you can reference it in future insertAfter/insertBefore
   * operations, including ones sent concurrently by other devices.
   * This does have a memory cost, but it is compressed in common cases.
   *
   * If `id` is already deleted or is not known, this method does nothing.
   *
   * @param count Provide this to bulk-delete `count` ids,
   * starting with newId and proceeding with the same bunchId and sequential counters.
   * __Note__: To delete multiple ids at sequential *indexes*, use deleteRange.
   */
  delete(id: ElementId, count = 1) {
    checkCount(count);
    if (count === 0) return this;

    const located = this.locate(id);
    if (located !== null) {
      const leaf = located[0].node;
      // Check if all ids are in the same leaf, then they can be bulk deleted
      if (
        leaf.bunchId === id.bunchId &&
        id.counter >= leaf.startCounter &&
        id.counter + count <= leaf.startCounter + leaf.count
      ) {
        const newPresent = leaf.present.clone();
        newPresent.delete(id.counter, count);
  
        return this.replaceLeaf(located, { ...leaf, present: newPresent });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ans: IdList = this;
    for (let i = 0; i < count; i++) {
      ans = ans.deleteOne({ bunchId: id.bunchId, counter: id.counter + i });
    }
    return ans;
  }

  private deleteOne(id: ElementId) {
    const located = this.locate(id);
    if (located === null) return this;

    const leaf = located[0].node;
    if (!leaf.present.has(id.counter)) return this;

    const newPresent = leaf.present.clone();
    newPresent.delete(id.counter);

    return this.replaceLeaf(located, { ...leaf, present: newPresent });
  }

  /**
   * Deletes all ids with indexes in the range [from, to).
   *
   * @throws If any deleted index is out of bounds.
   */
  deleteRange(from: number, to: number) {
    const allIds: ElementId[] = [];
    for (let i = from; i < to; i++) {
      allIds.push(this.at(i));
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ans: IdList = this;
    for (const id of allIds) ans = ans.delete(id);

    return ans;
  }

  /**
   * Un-marks `id` as deleted from this list, making it present again.
   * A new IdList is returned and the current list remains unchanged.
   *
   * This method is an exact inverse to {@link delete}.
   *
   * If `id` is already present, this method does nothing.
   *
   * @param count Provide this to bulk-undelete `count` ids,
   * starting with newId and proceeding with the same bunchId and sequential counters.
   * @throws If any deleted id is not known.
   */
  undelete(id: ElementId, count = 1) {
    checkCount(count);
    if (count === 0) return this;

    const located = this.locate(id);
    if (located === null) {
      throw new Error("id is not known");
    }

    const leaf = located[0].node;
    // Check if all ids are in the same leaf, then they can be bulk undeleted
    if (
      leaf.bunchId === id.bunchId &&
      id.counter >= leaf.startCounter &&
      id.counter + count <= leaf.startCounter + leaf.count
    ) {
      const newPresent = leaf.present.clone();
      newPresent.set(id.counter, count);

      return this.replaceLeaf(located, { ...leaf, present: newPresent });
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let ans: IdList = this;
    for (let i = count - 1; i >= 0; i--) {
      ans = ans.undeleteOne({ bunchId: id.bunchId, counter: id.counter + i });
    }
    return ans;
  }

  private undeleteOne(id: ElementId) {
    const located = this.locate(id);
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
   * Returns the path from id's leaf node to the root, or null if id is not found.
   *
   * The path contains each node and its index in its parent's node, starting with id's
   * LeafNode and ending at a child of the root.
   */
  private locate(id: ElementId): Located | null {
    // Find the leaf containing id, if any.
    const [leaf, parentSeq] = this.leafMap.getLeaf(id.bunchId, id.counter);
    if (leaf === undefined) return null;
    if (
      !(
        leaf.bunchId === id.bunchId &&
        leaf.startCounter <= id.counter &&
        id.counter < leaf.startCounter + leaf.count
      )
    ) {
      return null;
    }

    // Find the seqs on the path (leaf, root].
    const innerSeqs: number[] = [];
    let curSeq = parentSeq;
    while (curSeq !== 0) {
      innerSeqs.push(curSeq);
      curSeq = this.parentSeqs.get(curSeq);
    }

    // Find the nodes and indexInParent's on the path (root, leaf),
    // using seqs to find the appropriate child of each node.
    const innerNodes: { node: InnerNode; indexInParent: number }[] = [];
    let curParent = this.root;
    // Start at the root child's seq and proceed to the leaf parent's seq.
    for (let i = innerSeqs.length - 2; i >= 0; i--) {
      const children = (curParent as InnerNodeInner).children;
      const childIndex = children.findIndex(
        (child) => child.seq === innerSeqs[i]
      );
      if (childIndex === -1) throw new Error("Internal error");
      const child = children[childIndex];

      innerNodes.push({ node: child, indexInParent: childIndex });
      curParent = child;
    }

    // Now curParent is the leaf's parent. Find leaf in its children and return.
    const leafChildIndex = (curParent as InnerNodeLeaf).children.indexOf(leaf);
    if (leafChildIndex === -1) throw new Error("Internal error");
    return [
      { node: leaf, indexInParent: leafChildIndex },
      ...innerNodes.reverse(),
    ];
  }

  /**
   * Replaces the leaf at the given path with newLeaves.
   * Returns a proper (sufficiently balanced) B+Tree with updated sizes.
   *
   * Exception: If you delete the leaf (newLeaves is empty), we don't prevent
   * nodes from going under M/2 children. This lets us avoid implementing B+Tree
   * deletes; any performance penalty goes away after reloading.
   *
   * newLeaves.length must be at most M.
   */
  private replaceLeaf(located: Located, ...newLeaves: LeafNode[]): IdList {
    const leafMapMut = { value: this.leafMap };
    const parentSeqsMut = { value: this.parentSeqs };

    // Important to delete the replaced leaf's entry, so that it doesn't corrupt by-ElementId searches.
    leafMapMut.value = leafMapMut.value.delete(located[0].node);

    const newRoot = replaceNode(
      located,
      this.root,
      leafMapMut,
      parentSeqsMut,
      newLeaves,
      0
    );
    return new IdList(newRoot, leafMapMut.value, parentSeqsMut.value);
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
    // Find the LeafNode that would contain id if known.
    const [leaf] = this.leafMap.getLeaf(id.bunchId, id.counter);
    if (leaf && leaf.bunchId === id.bunchId) {
      return leaf.present.has(id.counter);
    }

    return false;
  }

  /**
   * Returns whether id is known to this list.
   *
   * Compare to {@link has}.
   */
  isKnown(id: ElementId): boolean {
    // Find the LeafNode that would contain id if known.
    const [leaf] = this.leafMap.getLeaf(id.bunchId, id.counter);
    if (leaf && leaf.bunchId === id.bunchId) {
      return (
        leaf.startCounter <= id.counter &&
        id.counter < leaf.startCounter + leaf.count
      );
    }

    return false;
  }

  // TODO: Make public?
  /**
   * Returns true if any of the given bulk ids are known.
   */
  private isAnyKnown(id: ElementId, count: number): boolean {
    if (count === 0) return false;

    // Find the leaf containing the last id, or the previous leaf.
    // If any leaf knows any of the ids, this leaf must know an id too.
    const [leaf] = this.leafMap.getLeaf(id.bunchId, id.counter + count - 1);

    if (leaf && leaf.bunchId === id.bunchId) {
      // Test if there is any overlap between the leaf's counter range [a, b]
      // and the bulk ids' counter range [c, d].
      const a = leaf.startCounter;
      const b = leaf.startCounter + leaf.count - 1;
      const c = id.counter;
      const d = id.counter + count - 1;
      return a <= d && c <= b;
    }

    return false;
  }

  /**
   * Returns the maximum counter across all known ElementIds with the given bunchId,
   * or undefined if no such ElementIds are known.
   */
  maxCounter(bunchId: string): number | undefined {
    // Find the greatest-counter leaf containing bunchId.
    const [leaf] = this.leafMap.getLeaf(bunchId, Number.MAX_SAFE_INTEGER);
    if (leaf && leaf.bunchId === bunchId) {
      return leaf.startCounter + leaf.count - 1;
    }
    return undefined;
  }

  /**
   * The length of the list, counting only present ids.
   *
   * To include known but deleted ids, use `this.knownIds.length`.
   */
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
      throw new Error(`Index out of bounds: ${index} (length: ${this.length})`);
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
    const located = this.locate(id);
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
    const [count, has] = located[0].node.present._countHas(id.counter);
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

  /**
   * Returns the cursor at the given index within the list, i.e., between `index - 1` and `index`.
   * See [Cursors](https://github.com/mweidner037/articulated#cursors).
   *
   * Invert with {@link cursorIndex}.
   *
   * @param bind Whether to bind to the left or the right side of the gap, in case ids
   * later appear between `index - 1` and `index`. Default: `"left"`, which is typical for text cursors.
   * @throws If index is not in the range `[0, list.length]`.
   */
  cursorAt(index: number, bind: "left" | "right" = "left"): ElementId | null {
    if (bind === "left") {
      return index === 0 ? null : this.at(index - 1);
    } else {
      return index === this.length ? null : this.at(index);
    }
  }

  /**
   * Returns the current index of the given cursor within the list.
   * That is, the cursor is in the gap between `index - 1` and `index`.
   *
   * Inverts {@link cursorAt}.
   *
   * @param bind The `bind` value that was used with {@link cursorAt}, if any.
   * @throws If `cursor` is an ElementId that is not known.
   */
  cursorIndex(
    cursor: ElementId | null,
    bind: "left" | "right" = "left"
  ): number {
    if (bind === "left") {
      return cursor === null ? 0 : this.indexOf(cursor, "left") + 1;
    } else {
      return cursor === null ? this.length : this.indexOf(cursor, "right");
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
  valuesWithIsDeleted(): IterableIterator<{
    id: ElementId;
    isDeleted: boolean;
  }> {
    return iterateNodeWithIsDeleted(this.root);
  }

  private _knownIds?: KnownIdView;

  /**
   * A view of this list that treats all known ids as present.
   * That is, it ignores is-deleted status when computing list indices or iterating.
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
    // 1. Determine the leaves in list order.

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
          if (!item.isDeleted) {
            lastLeaf.present.set(item.startCounter, item.count);
          }
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
    // We do a "direct" balanced construction that takes O(L) time, instead of inserting
    // leaves one-by-one, which would take O(L log(L)) time.
    // However, constructing the sorted leafMap brings the overall runtime to O(L log(L)).

    if (leaves.length === 0) return IdList.new();

    // TODO: Test the aux data structures after loading.
    // E.g. reload and then call checkAll again.
    // Also should do insertions to test splitting of the full tree.

    const leafMapMut = { value: LeafMap.new() };
    const parentSeqsMut = { value: SeqMap.new() };

    // Depth of the B+Tree (number of non-root nodes on any path from a leaf to the root).
    // A full B+Tree of depth d has between [M^{d-1} + 1, M^d] leaves.
    const depth =
      leaves.length === 1
        ? 1
        : Math.ceil(Math.log(leaves.length) / Math.log(M));
    const root = buildTree(leaves, leafMapMut, parentSeqsMut, 0, depth);
    return new IdList(root, leafMapMut.value, parentSeqsMut.value);
  }
}

/**
 * A view of an IdList that treats all known ids as present.
 * That is, this class ignores the underlying list's is-deleted status when computing list indices.
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
      throw new Error(`Index out of bounds: ${index} (length: ${this.length})`);
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
   * Returns the index of `id` in this view.
   *
   * @throws If `id` is not known.
   */
  indexOf(id: ElementId): number {
    // @ts-expect-error Ignore private
    const located = this.list.locate(id);
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
    return index + (id.counter - located[0].node.startCounter);
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

/**
 * Returns the first (leftmost) known ElementId in node's subtree.
 */
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

/**
 * Returns the last (rightmost) known ElementId in node's subtree.
 */
function lastId(node: InnerNode): ElementId {
  let currentInner = node;
  while (!(currentInner instanceof InnerNodeLeaf)) {
    currentInner = currentInner.children.at(-1)!;
  }
  const lastLeaf = currentInner.children.at(-1)!;
  return {
    bunchId: lastLeaf.bunchId,
    counter: lastLeaf.startCounter + lastLeaf.count - 1,
  };
}

/**
 * Replace located[i].node with newNodes.
 *
 * newNodes.length must be at most M.
 *
 * The returned node's descendants are recorded in leafMapMut and parentSeqsMut,
 * but the node itself is not (since we don't know its parent here).
 * Also, we don't delete the replaced node from those collections; this is okay
 * for parentSeqsMut, while the caller must update leafMapMut.
 */
function replaceNode(
  located: Located,
  root: InnerNode,
  leafMapMut: MutableLeafMap,
  parentSeqsMut: MutableSeqMap,
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
    // Split the parent to maintain BTree property (# children <= M).
    // Treat the right parent as "new", getting a new seq.
    const split = Math.ceil(newChildren.length / 2);
    const seqs = [parent.seq, getAndBumpNextSeq(parentSeqsMut)];
    const newParents = [
      newChildren.slice(0, split),
      newChildren.slice(split),
    ].map((children, j) =>
      i === 0
        ? new InnerNodeLeaf(seqs[j], children as LeafNode[], leafMapMut)
        : new InnerNodeInner(seqs[j], children as InnerNode[], parentSeqsMut)
    );
    if (i === located.length - 1) {
      // newParents replace root. We need a new root to hold them.
      return new InnerNodeInner(
        getAndBumpNextSeq(parentSeqsMut),
        newParents,
        parentSeqsMut
      );
    } else {
      return replaceNode(
        located,
        root,
        leafMapMut,
        parentSeqsMut,
        newParents,
        i + 1
      );
    }
  } else if (newChildren.length === 0) {
    // parent holds no content, so it can be replaced with nothing.
    if (i === located.length - 1) {
      // Instead of deleting the root, replace it with an empty node.
      return new InnerNodeInner(parent.seq, [], parentSeqsMut);
    } else {
      return replaceNode(located, root, leafMapMut, parentSeqsMut, [], i + 1);
    }
  } else {
    // "Replace" parent, reusing its seq.
    // To avoid doing newChildren.length sets every time (which makes replaceLeaf
    // do >=(M/2)*log(L) total sets, even when none were necessary),
    // we bypass the InnerNode constructors' leafMap/parentSeq operations,
    // instead doing them ourselves only on the changed children.
    let newParent: InnerNode;
    if (i === 0) {
      newParent = new InnerNodeLeaf(
        parent.seq,
        newChildren as LeafNode[],
        null
      );
      for (const newNode of newNodes as LeafNode[]) {
        leafMapMut.value = leafMapMut.value.set(newNode, parent.seq);
      }
    } else {
      newParent = new InnerNodeInner(
        parent.seq,
        newChildren as InnerNode[],
        null
      );
      for (const newNode of newNodes as InnerNode[]) {
        if (newNode.seq !== (located[i].node as InnerNode).seq) {
          parentSeqsMut.value = parentSeqsMut.value.set(
            newNode.seq,
            parent.seq
          );
        }
      }
    }

    if (i === located.length - 1) {
      // Replaces root.
      return newParent;
    } else {
      return replaceNode(
        located,
        root,
        leafMapMut,
        parentSeqsMut,
        [newParent],
        i + 1
      );
    }
  }
}

/**
 * Splits present into two SparseIndices at the given counter.
 */
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

function* iterateNodeWithIsDeleted(
  node: InnerNode
): IterableIterator<{ id: ElementId; isDeleted: boolean }> {
  if (node instanceof InnerNodeInner) {
    for (const child of node.children) {
      yield* iterateNodeWithIsDeleted(child);
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

/**
 * Updates acc to account for node's subtree, as part of a depth-first search
 * in list order.
 */
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
          pushSaveItem(acc, {
            bunchId: child.bunchId,
            startCounter: nextIndex,
            count: index - nextIndex,
            isDeleted: true,
          });
        }
        pushSaveItem(acc, {
          bunchId: child.bunchId,
          startCounter: index,
          count,
          isDeleted: false,
        });
        nextIndex = index + count;
      }
      if (nextIndex < child.startCounter + child.count) {
        pushSaveItem(acc, {
          bunchId: child.bunchId,
          startCounter: nextIndex,
          count: child.startCounter + child.count - nextIndex,
          isDeleted: true,
        });
      }
    }
  }
}

/**
 * Pushes a save item onto acc, combing it with the previous item if possible.
 *
 * This function is necessary because we don't guarantee that adjacent leaves are fully merged.
 * Specifically, if you insert a bunch's ids with counter values (0, 2, 1)
 * in that order, then counter 1 will extend one of the existing leaves
 * but not merge with the other leaf.
 *
 * This situation won't appear in typical usage, and its perf penalty
 * will go away once you reload. Thus we tolerate it instead of figuring out
 * how to delete leaves from a B+Tree.
 */
function pushSaveItem(acc: SavedIdList, item: SavedIdList[number]) {
  if (acc.length > 0) {
    const previous = acc.at(-1)!;
    if (
      previous.isDeleted === item.isDeleted &&
      previous.bunchId === item.bunchId &&
      previous.startCounter + previous.count === item.startCounter
    ) {
      // Combine items.
      // @ts-expect-error Mutating for convenience; no aliasing to worry about.
      previous.count += item.count;
      return;
    }
  }
  acc.push(item);
}

/**
 * Builds a tree with the given leaves. Used by IdList.load.
 *
 * The returned node's descendants are recorded in leafMapMut and parentSeqsMut,
 * but not the node itself (since we don't know its parent here).
 *
 * In contrast to inserting the leaves one-by-one, this function fills nodes
 * with M children whenever possible,
 * and the B+Tree parts run in O(L) time instead of O(L log(L)).
 * However, the overall runtime is O(L log(L)) from constructing the sorted leafMap.
 */
function buildTree(
  leaves: LeafNode[],
  leafMapMut: MutableLeafMap,
  parentSeqsMut: MutableSeqMap,
  startIndex: number,
  depthRemaining: number
): InnerNode {
  const parentSeq = getAndBumpNextSeq(parentSeqsMut);
  if (depthRemaining === 1) {
    return new InnerNodeLeaf(
      parentSeq,
      leaves.slice(startIndex, startIndex + M),
      leafMapMut
    );
  } else {
    const children: InnerNode[] = [];
    const childLeafCount = Math.pow(M, depthRemaining - 1);
    for (let i = 0; i < M; i++) {
      const childStartIndex = startIndex + i * childLeafCount;
      if (childStartIndex >= leaves.length) break;
      children.push(
        buildTree(
          leaves,
          leafMapMut,
          parentSeqsMut,
          childStartIndex,
          depthRemaining - 1
        )
      );
    }
    return new InnerNodeInner(parentSeq, children, parentSeqsMut);
  }
}
