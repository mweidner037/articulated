export interface ElementId {
  readonly bunchId: string;
  readonly counter: number;
}

interface ListElement {
  id: ElementId;
  isDeleted: boolean;
}

// TODO:
// - compare ids (maybe deleted)
// - get id just before/after another id (maybe deleted)
// Both can be accomplished with a list that ignores deleted status, eventually in log(n) time.

export class IdListStrawman {
  private readonly state: ListElement[] = [];

  /**
   *
   * @param before
   * @param newId
   * @throws If before does not exist in the list.
   * @throws If newId already exists in the list.
   */
  insertAfter(before: ElementId, newId: ElementId) {
    const index = this.state.findIndex((element) =>
      equalsPosition(element.pos, pos)
    );
    this.state.splice(index + 1, 0, { pos, isDeleted: false });
  }

  insertBefore(after: ElementId, newId: ElementId) {}

  /**
   * Un-inserts id from the list, making it no longer exist.
   *
   * This is distinct from delete(id), which leaves id in the list as a tombstone
   * (it exists but is not present). Un-insert is an exact inverse to insert*.
   *
   * Okay of id doesn't exist? (Skipped)
   * @param id
   */
  uninsert(id: ElementId) {}

  /**
   * Okay of id doesn't exist? (Skipped)
   * @param id
   */
  delete(id: ElementId) {}

  /**
   *
   * @param id
   * @throws If id does not exist in the list.
   */
  undelete(id: ElementId) {}

  // Accessors

  get length(): number {}

  /**
   * Whether id is present in the list.
   *
   * If id does not exist, false is returned.
   */
  has(id: ElementId): boolean {}

  /**
   * Whether is exists in the list.
   */
  exists(id: ElementId): boolean {}

  at(index: number): ElementId {}

  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {}

  /**
   * ids don't need to be in list order, but it will be more efficient if they are.
   *
   * @param ids
   * @returns index: where it would be if present (bias="right");
   * in same order as you provide them, skipping non-existent ids.
   * TODO: easier way to see which ones exist?
   */
  describe(
    ids: ElementId[]
  ): Array<{ id: ElementId; index: number; isDeleted: boolean }> {}

  /**
   * in same order as counters, skipping non-existent ids.
   */
  describeBunch(
    bunchId: string
  ): Array<{ id: ElementId; index: number; isDeleted: boolean }>;

  [Symbol.iterator](): IterableIterator<ElementId> {}

  values() {
    return this[Symbol.iterator]();
  }

  // TODO: name
  state(): Array<{ id: ElementId; isDeleted: boolean }> {}

  // Save and load
}
