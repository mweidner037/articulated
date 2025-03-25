import { expect } from "chai";
import { ElementId, IdList } from "../src";
import { IdList as IdListSimple } from "./id_list_simple";

const DEBUG = false;

/**
 * Applies mutations to both IdList and IdListSimple (a simpler, known-good implementation),
 * erroring if the resulting states differ.
 */
export class Fuzzer {
  constructor(readonly list: IdList, readonly simple: IdListSimple) {
    // Check that states agree.
    expect([...list.valuesWithDeleted()]).to.deep.equal([
      ...simple.valuesWithDeleted(),
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

    // Check loaded state as well.
    expect([
      ...IdList.load(this.list.save()).valuesWithDeleted(),
    ]).to.deep.equal([...this.simple.valuesWithDeleted()]);
  }

  static new() {
    return new Fuzzer(IdList.new(), IdListSimple.new());
  }

  static from(knownIds: Iterable<{ id: ElementId; isDeleted: boolean }>) {
    return new Fuzzer(IdList.from(knownIds), IdListSimple.from(knownIds));
  }

  static fromIds(ids: Iterable<ElementId>) {
    return new Fuzzer(IdList.fromIds(ids), IdListSimple.fromIds(ids));
  }

  insertAfter(before: ElementId | null, newId: ElementId, count?: number) {
    if (DEBUG) {
      console.log("insertAfter", before, newId, count);
    }
    return new Fuzzer(
      this.list.insertAfter(before, newId, count),
      this.simple.insertAfter(before, newId, count)
    );
  }

  insertBefore(after: ElementId | null, newId: ElementId, count?: number) {
    if (DEBUG) {
      console.log("insertBefore", after, newId, count);
    }
    return new Fuzzer(
      this.list.insertBefore(after, newId, count),
      this.simple.insertBefore(after, newId, count)
    );
  }

  delete(id: ElementId) {
    if (DEBUG) {
      console.log("delete", id);
    }
    return new Fuzzer(this.list.delete(id), this.simple.delete(id));
  }

  undelete(id: ElementId) {
    if (DEBUG) {
      console.log("undelete", id);
    }
    return new Fuzzer(this.list.undelete(id), this.simple.undelete(id));
  }
}
