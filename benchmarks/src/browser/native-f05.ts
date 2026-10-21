import type { ElementId, SavedIdList } from "articulated";
import type { toTransposedOmit } from "../algorithms/id_list_saved_states";
import type { BenchmarkList } from "./list-interface";

export type F05 = ReturnType<typeof toTransposedOmit>;
export interface NativeF05Options {
  ownership?: "shared" | "owned";
  pageSize?: number;
  /** Experimental negative membership test before probing page-local ID maps. */
  pageIdFilter?: boolean;
  /** Adopt fresh, bounded edit arrays instead of copying them a second time. */
  adoptEdits?: boolean;
  /** Extend a visible run by copying only counts when its identity index is unchanged. */
  reuseUnchangedColumns?: boolean;
}
type Options = Required<NativeF05Options>;
type Columns = Pick<F05, "bunchIds" | "counts">;
interface Page {
  columns: Columns;
  starts: Float64Array;
  from: number;
  to: number;
  length: number;
  byId: Map<string, number | number[]>;
  idFilter?: Uint32Array;
}
// Two positions in a 512-bit membership filter. False positives fall through to
// the authoritative Map and interval checks; a filter never establishes identity.
function idHash(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++)
    hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  return hash >>> 0;
}
function addToFilter(filter: Uint32Array, hash: number) {
  const first = hash & 511,
    second = (hash >>> 9) & 511;
  filter[first >>> 5] |= 1 << (first & 31);
  filter[second >>> 5] |= 1 << (second & 31);
}
function mayContain(filter: Uint32Array, hash: number): boolean {
  const first = hash & 511,
    second = (hash >>> 9) & 511;
  return (
    !!(filter[first >>> 5] & (1 << (first & 31))) &&
    !!(filter[second >>> 5] & (1 << (second & 31)))
  );
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
  starts: Float64Array,
  options: Options,
  freshEdit = false,
): Page[] {
  const pages: Page[] = [];
  // Only EditBuffer.finish transfers ownership. Loading caller-provided state
  // never uses this path; split pages still own independent bounded arrays.
  const adopt = freshEdit && columns.counts.length <= options.pageSize;
  const size = Math.ceil(
    columns.counts.length /
      Math.max(1, Math.ceil(columns.counts.length / options.pageSize)),
  );
  for (let offset = 0; offset < columns.counts.length; offset += size) {
    const end = Math.min(offset + size, columns.counts.length);
    // Owned pages never retain a view into a document-sized backing array.
    const owned = options.ownership === "owned";
    const copy = owned && !adopt;
    const data = copy
      ? {
          bunchIds: columns.bunchIds.slice(offset, end),
          counts: columns.counts.slice(offset, end),
        }
      : columns;
    const counters = copy ? starts.slice(offset, end) : starts;
    const from = owned ? 0 : offset,
      to = owned ? end - offset : end;
    const byId = new Map<string, number | number[]>();
    let length = 0;
    for (let i = from; i < to; i++) {
      const id = data.bunchIds[i],
        rows = byId.get(id);
      if (rows === undefined) byId.set(id, i);
      else if (typeof rows === "number") byId.set(id, [rows, i]);
      else rows.push(i);
      if (data.counts[i] > 0) length += data.counts[i];
    }
    const page: Page = {
      columns: data,
      starts: counters,
      from,
      to,
      length,
      byId,
    };
    if (options.pageIdFilter) {
      page.idFilter = new Uint32Array(16);
      for (const id of byId.keys()) addToFilter(page.idFilter, idHash(id));
    }
    pages.push(page);
  }
  return pages;
}
class EditBuffer {
  readonly columns: Columns = { bunchIds: [], counts: [] };
  readonly starts: number[] = [];
  append(id: string, start: number, count: number) {
    if (!count) return;
    const s = this.columns,
      last = s.counts.length - 1;
    if (
      last >= 0 &&
      s.bunchIds[last] === id &&
      this.starts[last] + Math.abs(s.counts[last]) === start &&
      Math.sign(s.counts[last]) === Math.sign(count)
    )
      s.counts[last] += count;
    else {
      s.bunchIds.push(id);
      s.counts.push(count);
      this.starts.push(start);
    }
  }
  copy(page: Page, row: number) {
    this.append(
      page.columns.bunchIds[row],
      page.starts[row],
      page.columns.counts[row],
    );
  }
  finish(options: Options) {
    // Terminal operation: neither this buffer nor its arrays are mutated after
    // finish. The buffer is local to a single edit and is never exposed.
    return pagesFor(
      this.columns,
      Float64Array.from(this.starts),
      options,
      options.adoptEdits,
    );
  }
}

/** Native F05 columns with immutable page edits and eager sidecar indexes.
 * No SavedIdList or IdList is constructed on the load/edit paths. Shared mode
 * adopts input arrays by ownership transfer; owned mode copies only numeric and
 * string-reference columns into independent pages, without retaining the input.
 * Both modes copy the flat page directory and rebuild its prefix on mutation.
 * All indexing, validation and ownership copying is part of load timing.
 * The optional membership filter only avoids some Map probes; page scans and
 * directory/prefix copying remain linear in page count. Unedited pages, including
 * their filters, are shared immutably across versions. No wire fields change.
 * adoptEdits optionally transfers fresh single-page edit buffers directly into
 * owned pages. Load ownership and split-page isolation remain unchanged.
 * reuseUnchangedColumns optionally extends an owned visible run by copying only
 * counts; its immutable identity columns and page-local indexes remain valid.
 */
export class NativeF05 implements BenchmarkList {
  readonly length: number;
  private readonly prefix: Float64Array;
  private constructor(
    private readonly pages: readonly Page[],
    private readonly options: Options,
    private readonly original?: F05,
  ) {
    this.prefix = new Float64Array(pages.length + 1);
    for (let i = 0; i < pages.length; i++)
      this.prefix[i + 1] = this.prefix[i] + pages[i].length;
    this.length = this.prefix[pages.length];
    natural(this.length);
  }
  static load(s: F05, options: NativeF05Options = {}): NativeF05 {
    const config: Options = {
      ownership: options.ownership ?? "shared",
      pageSize: options.pageSize ?? 128,
      pageIdFilter: options.pageIdFilter ?? false,
      adoptEdits: options.adoptEdits ?? false,
      reuseUnchangedColumns: options.reuseUnchangedColumns ?? false,
    };
    natural(config.pageSize);
    if (
      config.pageSize === 0 ||
      (config.ownership !== "shared" && config.ownership !== "owned") ||
      typeof config.pageIdFilter !== "boolean" ||
      typeof config.adoptEdits !== "boolean" ||
      typeof config.reuseUnchangedColumns !== "boolean"
    )
      throw new Error("Invalid page options");
    const { bunchIds, counts, startCounterIndexes, startCounters } = s;
    if (
      ![bunchIds, counts, startCounterIndexes, startCounters].every(
        Array.isArray,
      )
    )
      throw new Error("Invalid columns");
    if (
      bunchIds.length !== counts.length ||
      startCounterIndexes.length !== startCounters.length
    )
      throw new Error("Mismatched columns");
    let exceptionRow = 0;
    for (let i = 0; i < startCounterIndexes.length; i++) {
      const delta = startCounterIndexes[i];
      natural(delta);
      natural(startCounters[i]);
      exceptionRow += delta;
      if ((i > 0 && delta === 0) || exceptionRow >= counts.length)
        throw new Error("Invalid counter exceptions");
    }
    const starts = new Float64Array(counts.length),
      next = new Map<string, number>(),
      intervals = new Map<string, number[]>();
    let exception = 0;
    exceptionRow = startCounterIndexes[0] ?? -1;
    for (let i = 0; i < counts.length; i++) {
      const id = bunchIds[i],
        count = counts[i];
      if (typeof id !== "string" || !Number.isSafeInteger(count) || !count)
        throw new Error("Invalid run");
      let start = next.get(id) ?? 0;
      if (i === exceptionRow) {
        start = startCounters[exception++];
        exceptionRow =
          exception === startCounterIndexes.length
            ? -1
            : exceptionRow + startCounterIndexes[exception];
      }
      const end = start + Math.abs(count);
      natural(end);
      starts[i] = start;
      next.set(id, end);
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
    return new NativeF05(
      pagesFor(s, starts, config),
      config,
      config.ownership === "shared" ? s : undefined,
    );
  }
  /** Shared mode is zero-copy before edits. All other exports flatten columns,
   * merge adjacent compatible runs, and recompute sparse counter exceptions. */
  get wireState(): Readonly<F05> {
    if (this.original) return this.original;
    const out: F05 = {
      bunchIds: [],
      counts: [],
      startCounterIndexes: [],
      startCounters: [],
    };
    const next = new Map<string, number>();
    let pendingId: string | undefined,
      pendingStart = 0,
      pendingCount = 0,
      lastException = 0;
    const flush = () => {
      if (pendingId === undefined) return;
      if (pendingStart !== (next.get(pendingId) ?? 0)) {
        out.startCounterIndexes.push(out.counts.length - lastException);
        out.startCounters.push(pendingStart);
        lastException = out.counts.length;
      }
      out.bunchIds.push(pendingId);
      out.counts.push(pendingCount);
      next.set(pendingId, pendingStart + Math.abs(pendingCount));
    };
    for (const page of this.pages)
      for (let i = page.from; i < page.to; i++) {
        const id = page.columns.bunchIds[i],
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
    return out;
  }
  private find(id: ElementId): { page: number; row: number } {
    validId(id);
    const hash = this.options.pageIdFilter ? idHash(id.bunchId) : undefined;
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p];
      if (hash !== undefined && !mayContain(page.idFilter!, hash)) continue;
      const rows = page.byId.get(id.bunchId);
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
          bunchId: page.columns.bunchIds[i],
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
  insertAfter(before: ElementId | null, id: ElementId, count = 1): NativeF05 {
    natural(count);
    validId(id);
    natural(id.counter + count);
    const anchor = before === null ? null : this.find(before);
    if (count === 0) return this;
    natural(this.length + count);
    const hash = this.options.pageIdFilter ? idHash(id.bunchId) : undefined;
    for (const page of this.pages) {
      if (hash !== undefined && !mayContain(page.idFilter!, hash)) continue;
      const rows = page.byId.get(id.bunchId);
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
    // Validation above includes every later live/deleted interval for this ID.
    // Continuing a positive run changes only its count, not its start or row.
    if (
      this.options.reuseUnchangedColumns &&
      this.options.ownership === "owned" &&
      anchor
    ) {
      const page = this.pages[anchor.page],
        row = anchor.row;
      const oldCount = page.columns.counts[row];
      if (
        oldCount > 0 &&
        page.columns.bunchIds[row] === id.bunchId &&
        before!.counter === page.starts[row] + oldCount - 1 &&
        id.counter === before!.counter + 1
      ) {
        const counts = page.columns.counts.slice();
        counts[row] += count;
        const pages = this.pages.slice();
        pages[anchor.page] = {
          ...page,
          columns: { bunchIds: page.columns.bunchIds, counts },
          length: page.length + count,
        };
        return new NativeF05(pages, this.options);
      }
    }
    const target = anchor?.page ?? 0,
      page = this.pages[target],
      buffer = new EditBuffer();
    if (!anchor) buffer.append(id.bunchId, id.counter, count);
    if (page)
      for (let i = page.from; i < page.to; i++) {
        if (anchor && i === anchor.row) {
          const name = page.columns.bunchIds[i],
            start = page.starts[i],
            n = page.columns.counts[i],
            left = before!.counter - start + 1,
            sign = Math.sign(n);
          buffer.append(name, start, sign * left);
          buffer.append(id.bunchId, id.counter, count);
          buffer.append(name, start + left, sign * (Math.abs(n) - left));
        } else buffer.copy(page, i);
      }
    const pages = this.pages.slice();
    pages.splice(target, page ? 1 : 0, ...buffer.finish(this.options));
    return new NativeF05(pages, this.options);
  }
  delete(id: ElementId, count = 1): NativeF05 {
    natural(count);
    validId(id);
    natural(id.counter + count);
    if (!count) return this;
    let result: Page[] | undefined;
    const hash = this.options.pageIdFilter ? idHash(id.bunchId) : undefined;
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p];
      if (hash !== undefined && !mayContain(page.idFilter!, hash)) {
        if (result) result.push(page);
        continue;
      }
      const rows = page.byId.get(id.bunchId);
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
        const name = page.columns.bunchIds[i],
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
    return result ? new NativeF05(result, this.options) : this;
  }
  save(): SavedIdList {
    const result: SavedIdList = [];
    for (const page of this.pages)
      for (let i = page.from; i < page.to; i++) {
        const bunchId = page.columns.bunchIds[i],
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
