export interface ElementId {
  readonly bunchId: string;
  readonly counter: number;
}

export function equalsId(a: ElementId, b: ElementId) {
  return a.counter === b.counter && a.bunchId === b.bunchId;
}

export function expandIds(startId: ElementId, count: number): ElementId[] {
  const ans: ElementId[] = [];
  for (let i = 0; i < count; i++) {
    ans.push({ bunchId: startId.bunchId, counter: startId.counter + i });
  }
  return ans;
}

export type SavedIdList = Array<{
  bunchId: string;
  startCounter: number;
  count: number;
  isDeleted: boolean;
}>;

interface ListElement {
  id: ElementId;
  isDeleted: boolean;
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

export class IdList {
  private readonly state: ListElement[];
  private _length: number;

  constructor() {
    this.state = [];
    this._length = 0;
  }

  static from(state: Iterable<{ id: ElementId; isDeleted: boolean }>) {
    const list = new IdList();
    for (const { id, isDeleted } of state) {
      // Clone to prevent aliasing.
      list.state.push({ id, isDeleted });
      list._length++;
    }
    return list;
  }

  static fromIds(ids: Iterable<ElementId>) {
    const list = new IdList();
    for (const id of ids) {
      list.state.push({ id, isDeleted: false });
      list._length++;
    }
    return list;
  }

  /**
   *
   * @param before
   * @param newId
   * @param count Set to bulk-insert sequential ids in the same bunch, starting at newId.
   * @throws If before is not known.
   * @throws If newId is already known.
   */
  insertAfter(before: ElementId, newId: ElementId, count = 1) {
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    const index = this.state.findIndex((elt) => equalsId(elt.id, before));
    if (index === -1) {
      throw new Error("before is not known");
    }
    this.state.splice(index + 1, 0, ...expandElements(newId, false, count));
    this._length += count;
  }

  insertBefore(after: ElementId, newId: ElementId, count = 1) {
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    const index = this.state.findIndex((elt) => equalsId(elt.id, after));
    if (index === -1) {
      throw new Error("after is not known");
    }
    // We insert left-to-right even though it's insertBefore.
    this.state.splice(index, 0, ...expandElements(newId, false, count));
    this._length += count;
  }

  /**
   * Un-inserts id from the list, making it no longer known.
   *
   * This is distinct from delete(id), which leaves id in the list as a tombstone
   * (it is known but marked as deleted). Un-insert is an exact inverse to insert*.
   *
   * Okay if id isn't known (skipped).
   * @param id
   */
  uninsert(id: ElementId) {
    const index = this.state.findIndex((elt) => equalsId(elt.id, id));
    if (index !== -1) {
      this.state.splice(index, 1);
      this._length--;
    }
  }

  /**
   * Okay of id isn't known (skipped).
   * @param id
   */
  delete(id: ElementId) {
    const elt = this.state.find((elt) => equalsId(elt.id, id));
    if (elt !== undefined && !elt.isDeleted) {
      elt.isDeleted = true;
      this._length--;
    }
  }

  /**
   *
   * @param id
   * @throws If id is not known.
   */
  undelete(id: ElementId) {
    const elt = this.state.find((elt) => equalsId(elt.id, id));
    if (elt === undefined) {
      throw new Error("id is not known");
    }
    if (elt.isDeleted) {
      elt.isDeleted = false;
      this._length++;
    }
  }

  // Accessors

  /**
   * Whether id is present in the list.
   *
   * If id is not known, false is returned.
   */
  has(id: ElementId): boolean {
    const elt = this.state.find((elt) => equalsId(elt.id, id));
    if (elt === undefined) return false;
    return !elt.isDeleted;
  }

  /**
   * Whether id is known by this list.
   */
  isKnown(id: ElementId): boolean {
    return this.state.some((elt) => equalsId(elt.id, id));
  }

  /**
   *
   * @param index
   * @returns
   * @throws If index is not in [0, this.length).
   */
  at(index: number): ElementId {
    if (!(Number.isInteger(index) && 0 <= index && index < this.length)) {
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
   *
   * @param id
   * @param bias
   * @throws If id is not known, regardless of bias.
   * (Prevents trickery when you use bias left/right and thought you'd definitely get an answer.)
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

  // /**
  //  * ids don't need to be in list order, but it will be more efficient if they are.
  //  *
  //  * @param ids
  //  * @returns index: where it would be if present (bias="right");
  //  * in same order as you provide them, skipping non-existent ids.
  //  * TODO: easier way to see which ones exist?
  //  */
  // describe(
  //   ids: ElementId[]
  // ): Array<{ id: ElementId; index: number; isDeleted: boolean }> {}

  get length(): number {
    return this._length;
  }

  // /**
  //  * in same order as counters, skipping non-existent ids.
  //  */
  // describeBunch(
  //   bunchId: string
  // ): Array<{ id: ElementId; index: number; isDeleted: boolean }>;

  // Iterators and views

  *[Symbol.iterator](): IterableIterator<ElementId> {
    for (const elt of this.state) {
      if (!elt.isDeleted) yield elt.id;
    }
  }

  values() {
    return this[Symbol.iterator]();
  }

  valuesWithDeleted(): IterableIterator<{ id: ElementId; isDeleted: boolean }> {
    return this.state.values();
  }

  clone(): IdList {
    return IdList.from(this.state);
  }

  private _allIdView?: AllIdView;
  allIdView(): AllIdView {
    if (this._allIdView === undefined) {
      this._allIdView = new AllIdView(this, this.state);
    }
    return this._allIdView;
  }

  // Save and load

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
          break;
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
   * Overwrites the current state.
   *
   * @param savedState
   */
  load(savedState: SavedIdList) {
    this.state.length = 0;
    this._length = 0;

    for (const { bunchId, startCounter, count, isDeleted } of savedState) {
      if (!(Number.isInteger(count) && count >= 0)) {
        throw new Error(`Invalid length: ${count}`);
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
 * View of an IdList that treats all known ids as present.
 *
 * To mutate, call methods on the original IdList (this.list).
 */
export class AllIdView {
  /**
   * Internal use only. Access `.allIdView` on an IdList instead.
   */
  constructor(readonly list: IdList, private readonly state: ListElement[]) {}

  // Mutators omitted - mutate this.list instead.

  // Accessors

  /**
   *
   * @param index
   * @returns
   * @throws If index is not in [0, this.length).
   */
  at(index: number): ElementId {
    if (!(Number.isInteger(index) && 0 <= index && index < this.length)) {
      throw new Error(`Index out of bounds: ${index} (length: ${this.length}`);
    }

    return this.state[index].id;
  }

  /**
   *
   * @param id
   * @param bias
   * @returns -1 if id is not known.
   */
  indexOf(id: ElementId): number {
    return this.state.findIndex((elt) => equalsId(elt.id, id));
  }

  get length(): number {
    return this.state.length;
  }

  // Iterators

  *[Symbol.iterator](): IterableIterator<ElementId> {
    for (const elt of this.state) {
      yield elt.id;
    }
  }

  values() {
    return this[Symbol.iterator]();
  }

  // Save that ignores deleted? For e.g. making an actual IdList like this one.
}
