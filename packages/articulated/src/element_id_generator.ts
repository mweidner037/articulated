import { ElementId } from "./element_id";

/**
 * Utility class for generating unique ElementIds while utilizing our "bunch" optimizations.
 */
export class ElementIdGenerator {
  /**
   * Maps each bunchId that we've generated to the next counter to use for that bunchId.
   */
  private readonly nextCounterMap = new Map<string, number>();

  /**
   * @param newBunchId A function that returns a new globally unique bunchId each time it
   * is called. E.g., `() => crypto.randomUUID()`.
   */
  constructor(private readonly newBunchId: () => string) {}

  /**
   * Returns a unique new ElementId.
   *
   * The ElementId is optimized for insertion after beforeId, though that is not mandatory.
   * Specifically, if allowed, the new ElementId will be
   * ```
   * { bunchId: beforeId.bunchId, counter: beforeId.counter + 1 }
   * ```
   * which compresses well when inserted after beforeId.
   *
   * @param count Provide this if you are planning to bulk-insert `count` ids from left-to-right
   * (by supplying the same `count` to insertAfter/insertBefore).
   * Only the first id is returned, but we will reserve space for the other ids so that
   * they are not generated again.
   * @throws If count is provided but is not >= 1.
   */
  generateAfter(beforeId: ElementId | null, count = 1): ElementId {
    if (!(Number.isSafeInteger(count) && count >= 1)) {
      throw new Error(`Invalid count: ${count}`);
    }

    if (beforeId !== null) {
      const nextCounter = this.nextCounterMap.get(beforeId.bunchId);
      if (nextCounter !== undefined && nextCounter === beforeId.counter + 1) {
        // It's our own ElementId and the last in its bunch. Extend the bunch.
        this.nextCounterMap.set(beforeId.bunchId, nextCounter + count);
        return { bunchId: beforeId.bunchId, counter: nextCounter };
      }
    }

    // In all other cases, start a new bunch.
    const bunchId = this.newBunchId();
    this.nextCounterMap.set(bunchId, count);
    return { bunchId, counter: 0 };
  }
}
