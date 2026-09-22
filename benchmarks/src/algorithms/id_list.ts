import { ElementIdGenerator, IdList } from "articulated";
import { assert } from "chai";
import { maybeRandomString } from "maybe-random-string";
import type seedrandom from "seedrandom";
import type { TraceEdit } from "../internal/traces";
import { gunzipString, gzipString } from "../internal/util";
import type { TextAlgorithm } from "../text_algorithm";

const CLIENT_ID_LENGTH = 10;

abstract class IdListAlgorithm implements TextAlgorithm<TraceEdit> {
  readonly idGen: ElementIdGenerator;
  list: IdList = IdList.new();

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

export class IdListJsonAlgorithm extends IdListAlgorithm {
  save(): string {
    return JSON.stringify(this.list.save());
  }

  load(savedState: string): void {
    this.list = IdList.load(JSON.parse(savedState));
  }
}

export class IdListGzipAlgorithm extends IdListAlgorithm {
  save(): Uint8Array {
    return gzipString(JSON.stringify(this.list.save()));
  }

  load(savedState: Uint8Array): void {
    this.list = IdList.load(JSON.parse(gunzipString(savedState)));
  }
}
