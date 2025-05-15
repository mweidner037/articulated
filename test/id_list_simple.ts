import { ElementId, equalsId, expandIds, SavedIdList } from "../src";

interface ListElement {
  readonly id: ElementId;
  readonly isDeleted: boolean;
}

// Simpler implementation of IdList, used for illustration purposes and fuzz testing.

/**
 * A list of ElementIds, as a mutable data structure.
 *
 * An IdListSimple helps you assign a unique immutable id to each element of a list, such
 * as a todo-list or a text document (= list of characters). That way, you can keep track
 * of those elements even as their (array) indices change due to insert/delete operations
 * earlier in the list.
 *
 * Any id that has been inserted into an IdListSimple remains **known** to that list indefinitely,
 * allowing you to reference it in insertAfter/insertBefore operations. Calling {@link delete}
 * merely marks an id as deleted (= not present); it remains in memory as a "tombstone".
 * This is useful in collaborative settings, since another user might instruct you to
 * call `insertAfter(before, newId)` when you have already deleted `before` locally.
 *
 * See {@link ElementId} for advice on generating ElementIds. IdListSimple is optimized for
 * the case where sequential ElementIds often have the same bunchId and sequential counters.
 * However, you are not required to order ids in this way - it is okay if future edits
 * cause such ids to be separated, partially deleted, or even reordered.
 */
export class IdListSimple {
  /**
   * Internal - construct an IdListSimple using a static method (e.g. `IdListSimple.new`).
   */
  private constructor(private state: ListElement[], private _length: number) {}

  /**
   * Constructs an empty list.
   *
   * To begin with a non-empty list, use {@link IdListSimple.from} or {@link IdListSimple.fromIds}.
   */
  static new() {
    return new this([], 0);
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
   * Typically, you instead want {@link IdListSimple.from}, which allows you to also
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
  insertAfter(before: ElementId | null, newId: ElementId, count = 1): void {
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

    if (count === 0) return;
    if (this.isAnyKnown(newId, count)) {
      throw new Error("An inserted id is already known");
    }

    this.state.splice(index + 1, 0, ...expandElements(newId, false, count));
    this._length += count;
  }

  /**
   * Inserts `newId` immediately before the given id (`after`), which may be deleted.
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
   * @throws If any inserted id is already known.
   */
  insertBefore(after: ElementId | null, newId: ElementId, count = 1): void {
    let index: number;
    if (after === null) {
      index = this.state.length;
    } else {
      index = this.state.findIndex((elt) => equalsId(elt.id, after));
      if (index === -1) {
        throw new Error("after is not known");
      }
    }

    if (count === 0) return;
    if (this.isAnyKnown(newId, count)) {
      throw new Error("An inserted id is already known");
    }

    // We insert the bunch from left-to-right even though it's insertBefore.
    this.state.splice(index, 0, ...expandElements(newId, false, count));
    this._length += count;
  }

  /**
   * Undoes the insertion of `id`, making it no longer known.
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
  uninsert(id: ElementId, count = 1): void {
    for (const curId of expandIds(id, count)) {
      const index = this.state.findIndex((elt) => equalsId(elt.id, curId));
      if (index !== -1) {
        const elt = this.state[index];
        this.state.splice(index, 1);
        if (!elt.isDeleted) this._length--;
      }
    }
  }

  /**
   * Marks `id` as deleted from this list.
   *
   * The id remains known (a "tombstone").
   * Because `id` is still known, you can reference it in future insertAfter/insertBefore
   * operations, including ones sent concurrently by other devices.
   * However, it does occupy space in memory (compressed in common cases).
   *
   * If `id` is already deleted or not known, this method does nothing.
   */
  delete(id: ElementId): void {
    const index = this.state.findIndex((elt) => equalsId(elt.id, id));
    if (index != -1) {
      const elt = this.state[index];
      if (!elt.isDeleted) {
        this.state.splice(index, 1, { id: elt.id, isDeleted: true });
        this._length--;
      }
    }
  }

  /**
   * Un-marks `id` as deleted from this list, making it present again.
   *
   * This method is an exact inverse to {@link delete}.
   *
   * If `id` is already present, this method does nothing.
   *
   * @throws If `id` is not known.
   */
  undelete(id: ElementId): void {
    const index = this.state.findIndex((elt) => equalsId(elt.id, id));
    if (index == -1) {
      throw new Error("id is not known");
    }
    const elt = this.state[index];
    if (elt.isDeleted) {
      this.state.splice(index, 1, { id: elt.id, isDeleted: false });
      this._length++;
    }
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
    const elt = this.state.find((elt) => equalsId(elt.id, id));
    if (elt === undefined) return false;
    return !elt.isDeleted;
  }

  /**
   * Returns whether id is known to this list.
   *
   * Compare to {@link has}.
   */
  isKnown(id: ElementId): boolean {
    return this.isAnyKnown(id, 1);
  }

  private isAnyKnown(id: ElementId, count: number): boolean {
    return this.state.some(
      (elt) =>
        elt.id.bunchId === id.bunchId &&
        id.counter <= elt.id.counter &&
        elt.id.counter < id.counter + count
    );
  }

  /**
   * Returns the maximum counter across all known ElementIds with the given bunchId,
   * or undefined if no such ElementIds are known.
   *
   * This method is useful when creating ElementIds.
   */
  maxCounter(bunchId: string): number | undefined {
    let max: number | undefined = undefined;
    for (const { id } of this.state) {
      if (id.bunchId === bunchId) {
        if (max === undefined || id.counter > max) max = id.counter;
      }
    }
    return max;
  }

  get length(): number {
    return this._length;
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
    for (const elt of this.state) {
      if (!elt.isDeleted) {
        if (remaining === 0) return elt.id;
        remaining--;
      }
    }

    throw new Error("Internal error");
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
    /**
     * The number of present ids less than id.
     * Equivalently, the index id would have if present.
     */
    let index = 0;
    for (const elt of this.state) {
      if (equalsId(elt.id, id)) {
        // Found it.
        if (elt.isDeleted) {
          switch (bias) {
            case "none":
              return -1;
            case "left":
              return index - 1;
            case "right":
              return index;
          }
        } else return index;
      }
      if (!elt.isDeleted) index++;
    }

    throw new Error("id is not known");
  }

  // Iterators and views

  /**
   * Iterates over all present ids in the list.
   */
  *[Symbol.iterator](): IterableIterator<ElementId> {
    for (const elt of this.state) {
      if (!elt.isDeleted) yield elt.id;
    }
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
    return this.state.values();
  }

  private _knownIds?: KnownIdView;

  /**
   * A view of this list that treats all known ids as present.
   * That is, it ignores isDeleted status when computing list indices or iterating.
   */
  get knownIds(): KnownIdView {
    if (this._knownIds === undefined) {
      this._knownIds = new KnownIdView(this, this.state);
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
    const ans: SavedIdList = [];

    for (const { id, isDeleted } of this.state) {
      if (ans.length !== 0) {
        const current = ans[ans.length - 1];
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

      ans.push({
        bunchId: id.bunchId,
        startCounter: id.counter,
        count: 1,
        isDeleted,
      });
    }

    return ans;
  }

  /**
   * Loads a saved state returned by {@link save}, **overwriting** the current list state.
   */
  load(savedState: SavedIdList): void {
    this.state = [];
    this._length = 0;

    for (const { bunchId, startCounter, count, isDeleted } of savedState) {
      if (!(Number.isSafeInteger(count) && count >= 0)) {
        throw new Error(`Invalid count: ${count}`);
      }
      if (!(Number.isSafeInteger(count) && count >= 0)) {
        throw new Error(`Invalid startCounter: ${startCounter}`);
      }

      for (let i = 0; i < count; i++) {
        this.state.push({
          id: { bunchId, counter: startCounter + i },
          isDeleted,
        });
      }
      if (!isDeleted) this._length += count;
    }
  }
}

/**
 * A view of an IdListSimple that treats all known ids as present.
 * That is, this class ignores the underlying list's isDeleted status when computing list indices.
 * Access using {@link IdListSimple.knownIds}.
 *
 * Like IdListSimple, KnownIdView is immutable. To mutate, use a mutating method on the original IdListSimple
 * and access the returned list's `knownIds`.
 */
export class KnownIdView {
  /**
   * Internal use only. Use {@link IdListSimple.knownIds} instead.
   */
  constructor(
    readonly list: IdListSimple,
    private readonly state: ListElement[]
  ) {}

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

    return this.state[index].id;
  }

  /**
   * Returns the index of `id` in this view, or -1 if it is not known.
   */
  indexOf(id: ElementId): number {
    return this.state.findIndex((elt) => equalsId(elt.id, id));
  }

  /**
   * The length of this view.
   *
   * Equivalently, the number of known ids in `this.list`.
   */
  get length(): number {
    return this.state.length;
  }

  // Iterators

  /**
   * Iterates over all ids in this view, i.e., all known ids in `this.list`.
   */
  *[Symbol.iterator](): IterableIterator<ElementId> {
    for (const elt of this.state) {
      yield elt.id;
    }
  }

  /**
   * Iterates over all ids in this view, i.e., all known ids in `this.list`.
   */
  values() {
    return this[Symbol.iterator]();
  }
}

function expandElements(
  startId: ElementId,
  isDeleted: boolean,
  count: number
): ListElement[] {
  if (!(Number.isSafeInteger(count) && count >= 0)) {
    throw new Error(`Invalid count: ${count}`);
  }

  const ans: ListElement[] = [];
  for (let i = 0; i < count; i++) {
    ans.push({
      id: { bunchId: startId.bunchId, counter: startId.counter + i },
      isDeleted,
    });
  }
  return ans;
}
