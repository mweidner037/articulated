import type seedrandom from "seedrandom";
import type { TextAlgorithm } from "../text_algorithm";

export class CharArrayAlgorithm implements TextAlgorithm {
  state: string[] = [];

  constructor(_prng: seedrandom.PRNG) {}

  apply(start: number, deleteCount: number, char?: string): void {
    // @ts-expect-error Does not like undefined char
    this.state.splice(start, deleteCount, char);
  }

  iterate(): void {
    for (const char of this.state) {
      void char;
    }
  }

  save(): string {
    return this.state.join("");
  }

  load(savedState: string): void {
    this.state = [...savedState];
  }
}
