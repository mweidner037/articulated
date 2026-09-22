import { ElementIdGenerator } from "articulated";
import { maybeRandomString } from "maybe-random-string";
import type seedrandom from "seedrandom";
import { IdListSimple } from "../../../packages/articulated/test/id_list_simple";
import type { TextAlgorithm } from "../text_algorithm";

const CLIENT_ID_LENGTH = 10;

export class IdListSimpleAlgorithm implements TextAlgorithm {
  readonly idGen: ElementIdGenerator;
  list: IdListSimple = IdListSimple.new();

  constructor(prng: seedrandom.PRNG) {
    const clientId = maybeRandomString({ prng, length: CLIENT_ID_LENGTH });
    let counter = 0;
    const newBunchId = () => `${clientId}:${(counter++).toString(36)}`;
    this.idGen = new ElementIdGenerator(newBunchId);
  }

  apply(start: number, deleteCount: number, _char?: string): void {
    if (deleteCount === 0) {
      // Insert
      const beforeId = start === 0 ? null : this.list.at(start - 1);
      this.list.insertAfter(beforeId, this.idGen.generateAfter(beforeId));
    } else {
      // Delete
      this.list.delete(this.list.at(start));
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
}
