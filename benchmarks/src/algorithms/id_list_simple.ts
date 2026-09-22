import { ElementIdGenerator } from "articulated";
import { assert } from "chai";
import { maybeRandomString } from "maybe-random-string";
import type seedrandom from "seedrandom";
import { IdListSimple } from "../../../packages/articulated/test/id_list_simple";
import type { TraceEdit } from "../internal/traces";
import type { TextAlgorithm } from "../text_algorithm";

const CLIENT_ID_LENGTH = 10;

export class IdListSimpleAlgorithm implements TextAlgorithm<TraceEdit> {
  readonly idGen: ElementIdGenerator;
  list: IdListSimple = IdListSimple.new();

  constructor(prng: seedrandom.PRNG) {
    const clientId = maybeRandomString({ prng, length: CLIENT_ID_LENGTH });
    let counter = 0;
    const newBunchId = () => `${clientId}:${(counter++).toString(36)}`;
    this.idGen = new ElementIdGenerator(newBunchId);
  }

  readonly isProseMirror = false;

  apply(edit: TraceEdit): void {
    switch (edit.type) {
      case "insert": {
        const beforeId = edit.index === 0 ? null : this.list.at(edit.index - 1);
        this.list.insertAfter(beforeId, this.idGen.generateAfter(beforeId));
        break;
      }
      case "delete": {
        this.list.delete(this.list.at(edit.index));
        break;
      }
    }
  }

  iterate(): void {
    for (const id of this.list) {
      void id;
    }
  }

  save(): string {
    return JSON.stringify(this.list.save());
  }

  load(savedState: string): void {
    this.list.load(JSON.parse(savedState));
  }

  check(finalText: string): void {
    // We don't store chars; check length only.
    assert.strictEqual(this.list.length, finalText.length);
  }
}
