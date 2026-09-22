import { ElementIdGenerator, IdList } from "articulated";
import { assert } from "chai";
import { maybeRandomString } from "maybe-random-string";
import seedrandom from "seedrandom";
import type { TraceEdit } from "../internal/traces";
import { gunzipString, gzipString } from "../internal/util";
import type { TextAlgorithm } from "./base";

const CLIENT_ID_LENGTH = 10;

abstract class IdListAlgorithm implements TextAlgorithm<TraceEdit> {
  static readonly isProseMirror = false;

  readonly idGen: ElementIdGenerator;
  list: IdList = IdList.new();

  constructor() {
    const clientId = maybeRandomString({
      prng: seedrandom("42"),
      length: CLIENT_ID_LENGTH,
    });
    let seqNum = 0;
    const newBunchId = () => `${clientId}:${(seqNum++).toString(36)}`;
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

  abstract save(): string | Uint8Array;

  abstract load(savedState: string | Uint8Array): void;

  check(finalText: string): void {
    // We don't store chars; check length only.
    assert.strictEqual(this.list.length, finalText.length);
  }
}

/**
 * An IdList with ids only (no chars).
 *
 * Bunch ids use the form `"clientId_seqNum"`, where clientId is 10
 * chars long (60 bit of entropy) and seqNum is base-36 encoded.
 *
 * Saved states are the SavedIdList as a JSON string.
 */
export class IdListJsonAlgorithm extends IdListAlgorithm {
  save(): string {
    return JSON.stringify(this.list.save());
  }

  load(savedState: string): void {
    this.list = IdList.load(JSON.parse(savedState));
  }
}

/**
 * An IdList with ids only (no chars).
 *
 * Bunch ids use the form `"clientId_seqNum"`, where clientId is 10
 * chars long (60 bit of entropy) and seqNum is base-36 encoded.
 *
 * Saved states are the SavedIdList as a JSON string, **GZIP'd**.
 */
export class IdListGzipAlgorithm extends IdListAlgorithm {
  save(): Uint8Array {
    return gzipString(JSON.stringify(this.list.save()));
  }

  load(savedState: Uint8Array): void {
    this.list = IdList.load(JSON.parse(gunzipString(savedState)));
  }
}
