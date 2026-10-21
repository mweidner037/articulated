import type { ElementId, SavedIdList } from "articulated";
import type { toBunchIndexOmit } from "../algorithms/id_list_saved_states";
import type { BenchmarkList } from "./list-interface";

export type F07 = ReturnType<typeof toBunchIndexOmit>;
export interface F09 {
  bunchIds: string[];
  bunchIndices: number[];
  startCounters: number[];
  counts: number[];
}
type Wire = F07 | F09;
type CounterColumn = Float64Array | number[];
export interface NativeDictionaryOptions {
  ownership?: "shared" | "owned";
  pageSize?: number;
}
type Options = Required<NativeDictionaryOptions>;
type Columns = Pick<F07, "bunchIndices" | "counts">;
interface Page {
  columns: Columns;
  starts: CounterColumn;
  from: number;
  to: number;
  length: number;
  byId: Map<number, number | number[]>;
}
function natural(n: number) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("Invalid nonnegative integer");
}
function validId(id: ElementId) {
  if (typeof id.bunchId !== "string") throw new Error("Invalid bunch ID");
  natural(id.counter);
}
function pagesFor(
  columns: Columns,
  starts: CounterColumn,
  options: Options,
): Page[] {
  const pages: Page[] = [];
  const size = Math.ceil(
    columns.counts.length /
      Math.max(1, Math.ceil(columns.counts.length / options.pageSize)),
  );
  for (let offset = 0; offset < columns.counts.length; offset += size) {
    const end = Math.min(offset + size, columns.counts.length);
    // Owned pages never retain a view into a document-sized backing array.
    const owned = options.ownership === "owned";
    const data = owned
      ? {
          bunchIndices: columns.bunchIndices.slice(offset, end),
          counts: columns.counts.slice(offset, end),
        }
      : columns;
    const counters = owned ? starts.slice(offset, end) : starts;
    const from = owned ? 0 : offset,
      to = owned ? end - offset : end;
    const byId = new Map<number, number | number[]>();
    let length = 0;
    for (let i = from; i < to; i++) {
      const id = data.bunchIndices[i],
        rows = byId.get(id);
      if (rows === undefined) byId.set(id, i);
      else if (typeof rows === "number") byId.set(id, [rows, i]);
      else rows.push(i);
      if (data.counts[i] > 0) length += data.counts[i];
    }
    pages.push({ columns: data, starts: counters, from, to, length, byId });
  }
  return pages;
}
class EditBuffer {
  readonly columns: Columns = { bunchIndices: [], counts: [] };
  readonly starts: number[] = [];
  append(id: number, start: number, count: number) {
    if (!count) return;
    const s = this.columns,
      last = s.counts.length - 1;
    if (
      last >= 0 &&
      s.bunchIndices[last] === id &&
      this.starts[last] + Math.abs(s.counts[last]) === start &&
      Math.sign(s.counts[last]) === Math.sign(count)
    )
      s.counts[last] += count;
    else {
      s.bunchIndices.push(id);
      s.counts.push(count);
      this.starts.push(start);
    }
  }
  copy(page: Page, row: number) {
    this.append(
      page.columns.bunchIndices[row],
      page.starts[row],
      page.columns.counts[row],
    );
  }
  finish(options: Options) {
    return pagesFor(this.columns, Float64Array.from(this.starts), options);
  }
}

/** Native dictionary-ID columns, for F07 reconstructed counters or F09 all
 * counters. The shared-mode F09 loader adopts the actual startCounters column.
 * Pages and their local maps keep numeric dictionary indices, never expanded
 * whole-ID strings per run. A new identity appends the dictionary and copies its
 * lookup map; edits to known identities share both across versions. */
export class NativeDictionary implements BenchmarkList {
  readonly length: number;
  private readonly prefix: Float64Array;
  private constructor(
    private readonly pages: readonly Page[],
    private readonly options: Options,
    private readonly dictionary: string[],
    private readonly lookup: ReadonlyMap<string, number>,
    readonly format: "F07" | "F09",
    private readonly original?: Wire,
  ) {
    this.prefix = new Float64Array(pages.length + 1);
    for (let i = 0; i < pages.length; i++)
      this.prefix[i + 1] = this.prefix[i] + pages[i].length;
    this.length = this.prefix[pages.length];
    natural(this.length);
  }
  static loadF07(
    s: F07,
    options: NativeDictionaryOptions = {},
  ): NativeDictionary {
    return NativeDictionary.load(s, "F07", options);
  }
  static loadF09(
    s: F09,
    options: NativeDictionaryOptions = {},
  ): NativeDictionary {
    return NativeDictionary.load(s, "F09", options);
  }
  private static load(
    s: Wire,
    format: "F07" | "F09",
    options: NativeDictionaryOptions,
  ): NativeDictionary {
    const config: Options = {
      ownership: options.ownership ?? "shared",
      pageSize: options.pageSize ?? 128,
    };
    natural(config.pageSize);
    if (
      config.pageSize === 0 ||
      (config.ownership !== "shared" && config.ownership !== "owned")
    )
      throw new Error("Invalid page options");
    const { bunchIds, bunchIndices, counts, startCounters } = s;
    const startCounterIndexes =
      format === "F07" ? (s as F07).startCounterIndexes : undefined;
    if (
      ![bunchIds, bunchIndices, counts, startCounters].every(Array.isArray) ||
      (format === "F07" && !Array.isArray(startCounterIndexes))
    )
      throw new Error("Invalid columns");
    if (
      bunchIndices.length !== counts.length ||
      (format === "F07"
        ? startCounterIndexes!.length !== startCounters.length
        : startCounters.length !== counts.length)
    )
      throw new Error("Mismatched columns");
    if (new Set(bunchIds).size !== bunchIds.length)
      throw new Error("Invalid ID dictionary");
    for (const id of bunchIds)
      if (typeof id !== "string") throw new Error("Invalid ID dictionary");
    let exceptionRow = 0;
    for (let i = 0; i < (startCounterIndexes?.length ?? 0); i++) {
      const delta = startCounterIndexes![i];
      natural(delta);
      natural(startCounters[i]);
      exceptionRow += delta;
      if ((i > 0 && delta === 0) || exceptionRow >= counts.length)
        throw new Error("Invalid counter exceptions");
    }
    // F09 already stores every counter: do not allocate a redundant dense cache.
    const starts: CounterColumn =
      format === "F09" ? startCounters : new Float64Array(counts.length);
    const next = new Float64Array(bunchIds.length),
      intervals = new Map<number, number[]>();
    let exception = 0;
    exceptionRow = startCounterIndexes?.[0] ?? -1;
    for (let i = 0; i < counts.length; i++) {
      const id = bunchIndices[i],
        count = counts[i];
      natural(id);
      if (id >= bunchIds.length || !Number.isSafeInteger(count) || !count)
        throw new Error("Invalid run");
      let start = format === "F09" ? startCounters[i] : next[id];
      if (i === exceptionRow) {
        start = startCounters[exception++];
        exceptionRow =
          exception === startCounterIndexes!.length
            ? -1
            : exceptionRow + startCounterIndexes![exception];
      }
      natural(start);
      const end = start + Math.abs(count);
      natural(end);
      if (format === "F07") starts[i] = start;
      next[id] = end;
      let rows = intervals.get(id);
      if (!rows) intervals.set(id, (rows = []));
      rows.push(i);
    }
    for (const rows of intervals.values()) {
      rows.sort((a, b) => starts[a] - starts[b]);
      for (let i = 1; i < rows.length; i++)
        if (
          starts[rows[i]] <
          starts[rows[i - 1]] + Math.abs(counts[rows[i - 1]])
        )
          throw new Error("Duplicate IDs");
    }
    const dictionary =
      config.ownership === "owned" ? bunchIds.slice() : bunchIds;
    const lookup = new Map<string, number>(dictionary.map((id, i) => [id, i]));
    return new NativeDictionary(
      pagesFor(s, starts, config),
      config,
      dictionary,
      lookup,
      format,
      config.ownership === "shared" ? s : undefined,
    );
  }
  get wireState(): Readonly<Wire> {
    if (this.original) return this.original;
    const out: F07 = {
      bunchIds: this.dictionary,
      bunchIndices: [],
      counts: [],
      startCounterIndexes: [],
      startCounters: [],
    };
    const next = new Float64Array(this.dictionary.length);
    let pendingId = -1,
      pendingStart = 0,
      pendingCount = 0,
      lastException = 0;
    const flush = () => {
      if (pendingId < 0) return;
      if (this.format === "F09") out.startCounters.push(pendingStart);
      else if (pendingStart !== next[pendingId]) {
        out.startCounterIndexes.push(out.counts.length - lastException);
        out.startCounters.push(pendingStart);
        lastException = out.counts.length;
      }
      out.bunchIndices.push(pendingId);
      out.counts.push(pendingCount);
      next[pendingId] = pendingStart + Math.abs(pendingCount);
    };
    for (const page of this.pages)
      for (let i = page.from; i < page.to; i++) {
        const id = page.columns.bunchIndices[i],
          start = page.starts[i],
          count = page.columns.counts[i];
        if (
          id === pendingId &&
          start === pendingStart + Math.abs(pendingCount) &&
          Math.sign(count) === Math.sign(pendingCount)
        )
          pendingCount += count;
        else {
          flush();
          pendingId = id;
          pendingStart = start;
          pendingCount = count;
        }
      }
    flush();
    if (this.format === "F09")
      return {
        bunchIds: out.bunchIds,
        bunchIndices: out.bunchIndices,
        startCounters: out.startCounters,
        counts: out.counts,
      };
    return out;
  }
  private find(id: ElementId): { page: number; row: number } {
    validId(id);
    const bunchIndex = this.lookup.get(id.bunchId);
    if (bunchIndex === undefined) throw new Error("Unknown ID");
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p],
        rows = page.byId.get(bunchIndex);
      if (rows !== undefined)
        for (
          let j = 0, size = typeof rows === "number" ? 1 : rows.length;
          j < size;
          j++
        ) {
          const row = typeof rows === "number" ? rows : rows[j];
          if (
            page.starts[row] <= id.counter &&
            id.counter < page.starts[row] + Math.abs(page.columns.counts[row])
          )
            return { page: p, row };
        }
    }
    throw new Error("Unknown ID");
  }
  at(index: number): ElementId {
    natural(index);
    if (index >= this.length) throw new Error("Index out of bounds");
    let lo = 0,
      hi = this.pages.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.prefix[mid + 1] <= index) lo = mid + 1;
      else hi = mid;
    }
    const page = this.pages[lo];
    index -= this.prefix[lo];
    for (let i = page.from; i < page.to; i++) {
      const count = page.columns.counts[i];
      if (count <= 0) continue;
      if (index < count)
        return {
          bunchId: this.dictionary[page.columns.bunchIndices[i]],
          counter: page.starts[i] + index,
        };
      index -= count;
    }
    throw new Error("Invalid prefix index");
  }
  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {
    const found = this.find(id),
      page = this.pages[found.page];
    let seen = this.prefix[found.page];
    for (let i = page.from; i < found.row; i++)
      if (page.columns.counts[i] > 0) seen += page.columns.counts[i];
    return page.columns.counts[found.row] > 0
      ? seen + id.counter - page.starts[found.row]
      : bias === "none"
        ? -1
        : seen - (bias === "left" ? 1 : 0);
  }
  insertAfter(
    before: ElementId | null,
    id: ElementId,
    count = 1,
  ): NativeDictionary {
    natural(count);
    validId(id);
    natural(id.counter + count);
    const anchor = before === null ? null : this.find(before);
    if (count === 0) return this;
    natural(this.length + count);
    let bunchIndex = this.lookup.get(id.bunchId);
    if (bunchIndex !== undefined)
      for (const page of this.pages) {
        const rows = page.byId.get(bunchIndex ?? -1);
        if (rows !== undefined)
          for (
            let j = 0, size = typeof rows === "number" ? 1 : rows.length;
            j < size;
            j++
          ) {
            const row = typeof rows === "number" ? rows : rows[j];
            if (
              page.starts[row] < id.counter + count &&
              id.counter < page.starts[row] + Math.abs(page.columns.counts[row])
            )
              throw new Error("Duplicate IDs");
          }
      }
    let dictionary = this.dictionary,
      lookup = this.lookup;
    if (bunchIndex === undefined) {
      bunchIndex = dictionary.length;
      dictionary = [...dictionary, id.bunchId];
      const updated = new Map(lookup);
      updated.set(id.bunchId, bunchIndex);
      lookup = updated;
    }
    const target = anchor?.page ?? 0,
      page = this.pages[target],
      buffer = new EditBuffer();
    if (!anchor) buffer.append(bunchIndex, id.counter, count);
    if (page)
      for (let i = page.from; i < page.to; i++) {
        if (anchor && i === anchor.row) {
          const name = page.columns.bunchIndices[i],
            start = page.starts[i],
            n = page.columns.counts[i],
            left = before!.counter - start + 1,
            sign = Math.sign(n);
          buffer.append(name, start, sign * left);
          buffer.append(bunchIndex, id.counter, count);
          buffer.append(name, start + left, sign * (Math.abs(n) - left));
        } else buffer.copy(page, i);
      }
    const pages = this.pages.slice();
    pages.splice(target, page ? 1 : 0, ...buffer.finish(this.options));
    return new NativeDictionary(
      pages,
      this.options,
      dictionary,
      lookup,
      this.format,
    );
  }
  delete(id: ElementId, count = 1): NativeDictionary {
    natural(count);
    validId(id);
    natural(id.counter + count);
    if (!count) return this;
    const bunchIndex = this.lookup.get(id.bunchId);
    if (bunchIndex === undefined) return this;
    let result: Page[] | undefined;
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p],
        rows = page.byId.get(bunchIndex);
      let hits: number[] | undefined;
      if (rows !== undefined)
        for (
          let j = 0, size = typeof rows === "number" ? 1 : rows.length;
          j < size;
          j++
        ) {
          const row = typeof rows === "number" ? rows : rows[j];
          if (
            page.columns.counts[row] > 0 &&
            page.starts[row] < id.counter + count &&
            id.counter < page.starts[row] + page.columns.counts[row]
          ) {
            if (!hits) hits = [];
            hits.push(row);
          }
        }
      if (!hits?.length) {
        if (result) result.push(page);
        continue;
      }
      if (!result) result = this.pages.slice(0, p);
      const buffer = new EditBuffer();
      let hit = 0;
      for (let i = page.from; i < page.to; i++) {
        if (i !== hits[hit]) {
          buffer.copy(page, i);
          continue;
        }
        hit++;
        const name = page.columns.bunchIndices[i],
          start = page.starts[i],
          n = page.columns.counts[i],
          lo = Math.max(start, id.counter),
          hi = Math.min(start + n, id.counter + count);
        buffer.append(name, start, lo - start);
        buffer.append(name, lo, -(hi - lo));
        buffer.append(name, hi, start + n - hi);
      }
      result.push(...buffer.finish(this.options));
    }
    return result
      ? new NativeDictionary(
          result,
          this.options,
          this.dictionary,
          this.lookup,
          this.format,
        )
      : this;
  }
  save(): SavedIdList {
    const result: SavedIdList = [];
    for (const page of this.pages)
      for (let i = page.from; i < page.to; i++) {
        const bunchId = this.dictionary[page.columns.bunchIndices[i]],
          startCounter = page.starts[i],
          count = Math.abs(page.columns.counts[i]),
          isDeleted = page.columns.counts[i] < 0,
          last = result.at(-1);
        if (
          last &&
          last.bunchId === bunchId &&
          last.isDeleted === isDeleted &&
          last.startCounter + last.count === startCounter
        )
          result[result.length - 1] = { ...last, count: last.count + count };
        else result.push({ bunchId, startCounter, count, isDeleted });
      }
    return result;
  }
}
