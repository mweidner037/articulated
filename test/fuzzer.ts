import { expect } from "chai";
import { ElementId, IdList } from "../src";
import { IdListSimple } from "./id_list_simple";

const DEBUG = false;

/**
 * Applies mutations to both IdList and IdListSimple (a simpler, known-good implementation),
 * erroring if the resulting states differ.
 */
export class Fuzzer {
  readonly list: IdList;
  readonly simple: IdListSimple;

  constructor(makeList: () => IdList, makeSimple: () => IdListSimple) {
    try {
      this.list = makeList();
      this.simple = makeSimple();
    } catch (e) {
      if (DEBUG) {
        console.log("An implementation threw error", e);
      }
      // If one throws, they both should throw.
      // E.g. you tried to insert a known id.
      expect(makeList).to.throw((e as Error).message);
      expect(makeSimple).to.throw((e as Error).message);

      // Throw the original error for the caller.
      // Our tests usually filter out non-AssertionErrors.
      throw e;
    }

    // Check that states agree.
    expect([...this.list.valuesWithIsDeleted()]).to.deep.equal([
      ...this.simple.valuesWithIsDeleted(),
    ]);
  }

  /**
   * Check that all accessors agree.
   *
   * Not called on every mutation because it is more expensive.
   */
  checkAll() {
    expect(this.list.length).to.equal(this.simple.length);
    for (let i = 0; i < this.simple.length; i++) {
      expect(this.list.at(i)).to.deep.equal(this.simple.at(i));
      expect(this.list.indexOf(this.simple.at(i))).to.equal(i);
    }
    expect([...this.list.values()]).to.deep.equal([...this.simple.values()]);
    expect(this.list.save()).to.deep.equal(this.simple.save());

    expect(this.list.knownIds.length).to.equal(this.simple.knownIds.length);
    for (let i = 0; i < this.simple.knownIds.length; i++) {
      expect(this.list.knownIds.at(i)).to.deep.equal(
        this.simple.knownIds.at(i)
      );
      expect(this.list.knownIds.indexOf(this.simple.knownIds.at(i))).to.equal(
        i
      );
    }
    expect([...this.list.knownIds.values()]).to.deep.equal([
      ...this.simple.knownIds.values(),
    ]);

    const allBunchIds = new Set<string>();
    for (const id of this.simple.knownIds) allBunchIds.add(id.bunchId);
    for (const bunchId of allBunchIds) {
      expect(this.list.maxCounter(bunchId)).to.equal(
        this.simple.maxCounter(bunchId)
      );
    }

    // Check loaded state as well.
    expect([
      ...IdList.load(this.list.save()).valuesWithIsDeleted(),
    ]).to.deep.equal([...this.simple.valuesWithIsDeleted()]);
  }

  static new() {
    return new Fuzzer(
      () => IdList.new(),
      () => IdListSimple.new()
    );
  }

  static from(knownIds: Iterable<{ id: ElementId; isDeleted: boolean }>) {
    return new Fuzzer(
      () => IdList.from(knownIds),
      () => IdListSimple.from(knownIds)
    );
  }

  static fromIds(ids: Iterable<ElementId>) {
    return new Fuzzer(
      () => IdList.fromIds(ids),
      () => IdListSimple.fromIds(ids)
    );
  }

  insertAfter(before: ElementId | null, newId: ElementId, count?: number) {
    if (DEBUG) {
      console.log("insertAfter", before, newId, count);
    }
    return new Fuzzer(
      () => this.list.insertAfter(before, newId, count),
      () => this.simple.insertAfter(before, newId, count)
    );
  }

  insertBefore(after: ElementId | null, newId: ElementId, count?: number) {
    if (DEBUG) {
      console.log("insertBefore", after, newId, count);
    }
    return new Fuzzer(
      () => this.list.insertBefore(after, newId, count),
      () => this.simple.insertBefore(after, newId, count)
    );
  }

  uninsert(id: ElementId, count?: number) {
    if (DEBUG) {
      console.log("uninsert", id, count);
    }
    return new Fuzzer(
      () => this.list.uninsert(id, count),
      () => this.simple.uninsert(id, count)
    );
  }

  delete(id: ElementId) {
    if (DEBUG) {
      console.log("delete", id);
    }
    return new Fuzzer(
      () => this.list.delete(id),
      () => this.simple.delete(id)
    );
  }

  undelete(id: ElementId) {
    if (DEBUG) {
      console.log("undelete", id);
    }
    return new Fuzzer(
      () => this.list.undelete(id),
      () => this.simple.undelete(id)
    );
  }
}
