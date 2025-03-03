export interface ElementId {
  readonly bunchId: string;
  readonly counter: number;
}

export function equalsId(a: ElementId, b: ElementId) {
  return a.counter === b.counter && a.bunchId === b.bunchId;
}

export type SavedIdList = Array<{
  bunchId: string;
  startCounter: number;
  length: number;
  isDeleted: boolean;
}>;

interface ListElement {
  id: ElementId;
  isDeleted: boolean;
}

export class IdList {
  private readonly state: ListElement[];
  private _length: number;

  // TODO: Allow importing starting state? E.g. iterable of ids.
  constructor() {
    this.state = [];
    this._length = 0;
  }

  /**
   *
   * @param before
   * @param newId
   * @throws If before is not known.
   * @throws If newId is already known.
   */
  insertAfter(before: ElementId, newId: ElementId) {
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    const index = this.state.findIndex((elt) => equalsId(elt.id, before));
    if (index === -1) {
      throw new Error("before is not known");
    }
    this.state.splice(index + 1, 0, { id: newId, isDeleted: false });
    this._length++;
  }

  insertBefore(after: ElementId, newId: ElementId) {
    if (this.isKnown(newId)) {
      throw new Error("newId is already known");
    }

    const index = this.state.findIndex((elt) => equalsId(elt.id, after));
    if (index === -1) {
      throw new Error("after is not known");
    }
    this.state.splice(index, 0, { id: newId, isDeleted: false });
    this._length++;
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

  private _knownView?: IdListKnownView;
  knownView(): IdListKnownView {
    if (this._knownView === undefined) {
      this._knownView = new IdListKnownView(this, this.state);
    }
    return this._knownView;
  }

  // Save and load

  save(): SavedIdList {
    const ans: SavedIdList = [];

    for (const { id, isDeleted } of this.state) {
      if (ans.length !== 0) {
        const current = ans[ans.length - 1];
        if (
          id.bunchId === current.bunchId &&
          id.counter === current.startCounter + current.length &&
          isDeleted === current.isDeleted
        ) {
          break;
        }
      }

      ans.push({
        bunchId: id.bunchId,
        startCounter: id.counter,
        length: 1,
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

    for (const { bunchId, startCounter, length, isDeleted } of savedState) {
      if (!(Number.isInteger(length) && length >= 0)) {
        throw new Error(`Invalid length: ${length}`);
      }

      for (let i = 0; i < length; i++) {
        this.state.push({
          id: { bunchId, counter: startCounter + i },
          isDeleted,
        });
      }
      if (!isDeleted) this._length += length;
    }
  }
}

// TODO: name. Also update in other places.
export class IdListKnownView {
  /**
   * Internal use only. Access `.knownView` on an IdList instead.
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

  hasAt(index: number): boolean {
    if (!(Number.isInteger(index) && 0 <= index && index < this.length)) {
      throw new Error(`Index out of bounds: ${index} (length: ${this.length}`);
    }

    return !this.state[index].isDeleted;
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
