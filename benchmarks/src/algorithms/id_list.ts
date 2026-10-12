import { ElementIdGenerator, IdList } from "articulated";
import { assert } from "chai";
import { maybeRandomString } from "maybe-random-string";
import type seedrandom from "seedrandom";
import type { TraceEdit } from "../internal/trace";
import type { TextAlgorithm } from "./base";

const CLIENT_ID_LENGTH = 10;

/**
 * An IdList with ids only (no chars).
 *
 * Bunch ids use the form `"clientId_seqNum"`, where clientId is 10
 * chars long (60 bit of entropy) and seqNum is base-36 encoded.
 *
 * Saved states are the SavedIdList as a JSON string.
 */
export class IdListAlgorithm implements TextAlgorithm<TraceEdit, string> {
  static readonly isProseMirror = false;
  static readonly isSavedStateString = true;
  static readonly isWasm = false;

  readonly idGen: ElementIdGenerator;
  list: IdList = IdList.new();

  constructor(prng: seedrandom.PRNG) {
    const clientId = maybeRandomString({
      prng,
      length: CLIENT_ID_LENGTH,
    });
    let seqNum = 0;
    const newBunchId = () => `${clientId}_${(seqNum++).toString(36)}`;
    this.idGen = new ElementIdGenerator(newBunchId);
  }

  apply(edit: TraceEdit): void {
    switch (edit.type) {
      case "insert": {
        const beforeId = edit.index === 0 ? null : this.list.at(edit.index - 1);
        this.list = this.list.insertAfter(
          beforeId,
          this.idGen.generateAfter(beforeId),
        );
        break;
      }
      case "delete": {
        this.list = this.list.delete(this.list.at(edit.index));
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
    this.list = IdList.load(JSON.parse(savedState));
  }

  check(finalText: string): void {
    // We don't store chars; check length only.
    assert.strictEqual(this.list.length, finalText.length);
  }

  free(): void {}
}
