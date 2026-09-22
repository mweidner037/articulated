import type seedrandom from "seedrandom";
import type { TextAlgorithm } from "../text_algorithm";

export class CharArrayAlgorithm implements TextAlgorithm {
  chars: string[] = [];

  constructor(_prng: seedrandom.PRNG) {}

  apply(start: number, deleteCount: number, char?: string): void {
    // @ts-expect-error Does not like undefined char
    this.chars.splice(start, deleteCount, char);
  }

  iterate(): void {
    for (const char of this.chars) {
      void char;
    }
  }

  save(): string {
    return this.chars.join("");
  }

  load(savedState: string): void {
    this.chars = [...savedState];
  }
}
