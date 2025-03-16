import { ElementId, equalsId } from "./id";
import { SavedIdList } from "./saved_id_list";

interface LeafNode {
  readonly bunchId: string;
  readonly startCounter: number;
  readonly count: number;
  readonly isDeleted: boolean;
}

class InnerNodeInner {
  constructor(
    readonly children: readonly InnerNode[],
    readonly size: number,
    readonly knownSize: number
  ) {}
}

class InnerNodeLeaf {
  constructor(
    readonly children: readonly LeafNode[],
    readonly size: number,
    readonly knownSize: number
  ) {}
}

type InnerNode = InnerNodeInner | InnerNodeLeaf;

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
    return new this(new InnerNodeLeaf([], 0, 0));
  }

  /**
   * Constructs a list with the given known ids and their isDeleted status, in list order.
   */
  static from(knownIds: Iterable<{ id: ElementId; isDeleted: boolean }>) {
    const state: ListElement[] = [];
    let length = 0;
    for (const { id, isDeleted } of knownIds) {
      // Clone to prevent aliasing.
      state.push({ id, isDeleted });
      if (!isDeleted) length++;
    }
    return new this(state, length);
  }

  /**
   * Constructs a list with the given present ids.
   *
   * Typically, you instead want {@link IdList.from}, which allows you to also
   * specify known-but-deleted ids. That way, you can reference the known-but-deleted ids
   * in future insertAfter/insertBefore operations.
   */
  static fromIds(ids: Iterable<ElementId>) {
    const state: ListElement[] = [];
    let length = 0;
    for (const id of ids) {
      state.push({ id, isDeleted: false });
      length++;
    }
    return new this(state, length);
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
  insertAfter(before: ElementId | null, newId: ElementId, count = 1) {
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    let index: number;
    if (before === null) {
      // -1 so index + 1 is 0: insert at the beginning of the list.
      index = -1;
    } else {
      index = this.state.findIndex((elt) => equalsId(elt.id, before));
      if (index === -1) {
        throw new Error("before is not known");
      }
    }

    if (count === 0) return this;

    return new IdList(
      this.state
        .slice(0, index + 1)
        .concat(
          expandElements(newId, false, count),
          this.state.slice(index + 1)
        ),
      this.length + count
    );
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
  insertBefore(after: ElementId | null, newId: ElementId, count = 1) {
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    let index: number;
    if (after === null) {
      index = this.state.length;
    } else {
      index = this.state.findIndex((elt) => equalsId(elt.id, after));
      if (index === -1) {
        throw new Error("after is not known");
      }
    }

    if (count === 0) return this;

    // We insert the bunch from left-to-right even though it's insertBefore.
    return new IdList(
      this.state
        .slice(0, index)
        .concat(expandElements(newId, false, count), this.state.slice(index)),
      this.length + count
    );
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
   * For an exact inverse to `insertAfter(-, id)` or `insertBefore(-, id)`
   * that makes `id` no longer known, see {@link uninsert}.
   *
   * If `id` is already deleted or not known, this method does nothing.
   */
  delete(id: ElementId) {
    const index = this.state.findIndex((elt) => equalsId(elt.id, id));
    if (index != -1) {
      const elt = this.state[index];
      if (!elt.isDeleted) {
        return new IdList(
          this.state
            .slice(0, index)
            .concat(
              [{ id: elt.id, isDeleted: true }],
              this.state.slice(index + 1)
            ),
          this.length - 1
        );
      }
    }

    return this;
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
    const index = this.state.findIndex((elt) => equalsId(elt.id, id));
    if (index == -1) {
      throw new Error("id is not known");
    }
    const elt = this.state[index];
    if (elt.isDeleted) {
      return new IdList(
        this.state
          .slice(0, index)
          .concat(
            [{ id: elt.id, isDeleted: false }],
            this.state.slice(index + 1)
          ),
        this.length + 1
      );
    }

    return this;
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
    return !located[1].isDeleted;
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
          if (!child.isDeleted) {
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
    const path = located[0];

    /**
     * The number of present ids less than id.
     * Equivalently, the index id would have if present.
     */
    let index = 0;

    let curParent = this.root;
    for (const childIndex of path) {
      if (curParent instanceof InnerNodeInner) {
        for (let i = 0; i < childIndex; i++) {
          index += curParent.children[i].size;
        }
        curParent = curParent.children[childIndex];
      } else {
        for (let i = 0; i < childIndex; i++) {
          const child = curParent.children[i];
          if (!child.isDeleted) index += child.count;
        }
        const idLeaf = curParent.children[childIndex];
        if (idLeaf.isDeleted) {
          switch (bias) {
            case "none":
              return -1;
            case "left":
              return index - 1;
            case "right":
              return index;
          }
        } else {
          return index + (id.counter - idLeaf.startCounter);
        }
      }
    }

    throw new Error("Internal error");
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
    return iterateWithDeletedNode(this.root);
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
    const state: ListElement[] = [];
    let length = 0;

    for (const { bunchId, startCounter, count, isDeleted } of savedState) {
      if (!(Number.isSafeInteger(count) && count >= 0)) {
        throw new Error(`Invalid count: ${count}`);
      }
      // Negative counters are okay, but they must be integral.
      if (!Number.isSafeInteger(startCounter)) {
        throw new Error(`Invalid startCounter: ${startCounter}`);
      }

      for (let i = 0; i < count; i++) {
        state.push({
          id: { bunchId, counter: startCounter + i },
          isDeleted,
        });
      }
      if (!isDeleted) length += count;
    }

    return new IdList(state, length);
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
    const path = located[0];

    /**
     * The number of present ids less than id.
     * Equivalently, the index id would have if present.
     */
    let index = 0;

    let curParent = this.root;
    for (const childIndex of path) {
      if (curParent instanceof InnerNodeInner) {
        for (let i = 0; i < childIndex; i++) {
          index += curParent.children[i].knownSize;
        }
        curParent = curParent.children[childIndex];
      } else {
        for (let i = 0; i < childIndex; i++) {
          const child = curParent.children[i];
          if (!child.isDeleted) index += child.count;
        }
        const idLeaf = curParent.children[childIndex];
        return index + (id.counter - idLeaf.startCounter);
      }
    }

    throw new Error("Internal error");
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
    return iterateNode(this.root, false);
  }

  /**
   * Iterates over all ids in this view, i.e., all known ids in `this.list`.
   */
  values() {
    return this[Symbol.iterator]();
  }
}

function locate(
  id: ElementId,
  root: InnerNode
): [path: number[], leaf: LeafNode] | null {
  // TODO: Optimize with separate RBTree maps.
  const located = locateInner(id, root);
  if (located === null) return null;
  else {
    located[0].reverse();
    return located;
  }
}

function locateInner(
  id: ElementId,
  node: InnerNode
): [pathReversed: number[], leaf: LeafNode] | null {
  if (node instanceof InnerNodeInner) {
    for (let i = 0; i < node.children.length; i++) {
      const childLocated = locateInner(id, node.children[i]);
      if (childLocated !== null) {
        childLocated[0].push(i);
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
        return [[i], child];
      }
    }
  }
  return null;
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
      if (includeDeleted || !child.isDeleted) {
        for (let i = 0; i < child.count; i++) {
          yield { bunchId: child.bunchId, counter: child.startCounter + i };
        }
      }
    }
  }
}

function* iterateWithDeletedNode(
  node: InnerNode
): IterableIterator<{ id: ElementId; isDeleted: boolean }> {
  if (node instanceof InnerNodeInner) {
    for (const child of node.children) {
      yield* iterateWithDeletedNode(child);
    }
  } else {
    for (const child of node.children) {
      for (let i = 0; i < child.count; i++) {
        yield {
          id: { bunchId: child.bunchId, counter: child.startCounter + i },
          isDeleted: child.isDeleted,
        };
      }
    }
  }
}

// Note: This assumes that nodes are already fully merged with neighbors.
// TODO: Test '' in save() outputs.
function saveNode(node: InnerNode, acc: SavedIdList) {
  if (node instanceof InnerNodeInner) {
    for (const child of node.children) {
      saveNode(child, acc);
    }
  } else {
    // TODO: Push the whole children array directly?
    // Only if we trust consumers to respect readonly and we trust
    // ourselves to not add additional properties to LeafNode.
    for (const child of node.children) {
      acc.push({
        bunchId: child.bunchId,
        startCounter: child.startCounter,
        count: child.count,
        isDeleted: child.isDeleted,
      });
    }
  }
}
