/** Numeric-container experiment only: not an IdList implementation. */
export interface ProbeF05 {
  bunchIds: string[];
  counts: number[];
  startCounterIndexes: number[];
  startCounters: number[];
}
export interface ProbeOptions {
  storage: "ordinary" | "typed32" | "dense-only";
  /** Zero selects one flat document-sized page. */
  pageSize: number;
}
type Numbers = number[] | Int32Array | Uint32Array;
interface Page {
  bunchIds: string[];
  counts: Numbers;
  starts: Numbers;
  byId: Map<string, Numbers>;
}
const unsignedMaximum = 0xffffffff;
const signedMaximum = 0x7fffffff;
function unsigned(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > unsignedMaximum)
    throw new Error("Value requires a wider-than-Uint32 representation");
}
function signedCount(value: number) {
  if (!Number.isSafeInteger(value) || !value || Math.abs(value) > signedMaximum)
    throw new Error(
      "Count requires a wider-than-symmetric-Int32 representation",
    );
}

/** Both representations do identical validation and construct identical maps,
 * pages and prefix topology. Ordinary arrays contain only small integers; the
 * alternative uses Int32 counts and Uint32 starts, row indexes and prefixes.
 * Strings stay ordinary opaque strings, never packed into UUID/binary fields. */
export class NumericPages {
  private constructor(
    private readonly pages: Page[],
    private readonly prefix: Numbers,
    readonly rows: number,
    readonly options: ProbeOptions,
    private readonly effectivePageSize: number,
  ) {}
  static load(input: ProbeF05, options: ProbeOptions): NumericPages {
    if (
      !["ordinary", "typed32", "dense-only"].includes(options.storage) ||
      !Number.isSafeInteger(options.pageSize) ||
      options.pageSize < 0
    )
      throw new Error("Invalid representation options");
    const { bunchIds, counts, startCounterIndexes, startCounters } = input;
    if (
      ![bunchIds, counts, startCounterIndexes, startCounters].every(
        Array.isArray,
      ) ||
      bunchIds.length !== counts.length ||
      startCounterIndexes.length !== startCounters.length
    )
      throw new Error("Mismatched F05 columns");
    unsigned(counts.length);
    let exceptionRow = 0;
    for (let i = 0; i < startCounterIndexes.length; i++) {
      unsigned(startCounterIndexes[i]);
      unsigned(startCounters[i]);
      exceptionRow += startCounterIndexes[i];
      if ((i > 0 && !startCounterIndexes[i]) || exceptionRow >= counts.length)
        throw new Error("Invalid counter exception index");
    }
    const starts: number[] = [],
      next = new Map<string, number>(),
      intervals = new Map<string, number[]>();
    let exception = 0;
    exceptionRow = startCounterIndexes[0] ?? -1;
    for (let i = 0; i < counts.length; i++) {
      const id = bunchIds[i],
        count = counts[i];
      if (typeof id !== "string" || !/^[A-Za-z0-9_-]{8}$/.test(id))
        throw new Error("Expected an opaque eight-character bunch ID");
      signedCount(count);
      let start = next.get(id) ?? 0;
      if (i === exceptionRow) {
        start = startCounters[exception++];
        exceptionRow =
          exception === startCounterIndexes.length
            ? -1
            : exceptionRow + startCounterIndexes[exception];
      }
      unsigned(start);
      const end = start + Math.abs(count);
      unsigned(end);
      starts.push(start);
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
          throw new Error("Duplicate identity intervals");
    }
    const pageSize = options.pageSize || Math.max(1, counts.length);
    const typed = options.storage !== "ordinary";
    const pages: Page[] = [],
      prefix: number[] = [0];
    for (let from = 0; from < counts.length; from += pageSize) {
      const to = Math.min(counts.length, from + pageSize);
      const ids = bunchIds.slice(from, to),
        pageCounts = counts.slice(from, to),
        pageStarts = starts.slice(from, to);
      const byId = new Map<string, Numbers>();
      let visible = 0;
      for (let row = 0; row < ids.length; row++) {
        let rows = byId.get(ids[row]) as number[] | undefined;
        if (!rows) byId.set(ids[row], (rows = []));
        rows.push(row);
        if (pageCounts[row] > 0) visible += pageCounts[row];
      }
      if (options.storage === "typed32")
        for (const [id, rows] of byId) byId.set(id, Uint32Array.from(rows));
      const end = prefix.at(-1)! + visible;
      unsigned(end);
      prefix.push(end);
      pages.push({
        bunchIds: ids,
        counts: typed ? Int32Array.from(pageCounts) : pageCounts,
        starts: typed ? Uint32Array.from(pageStarts) : pageStarts,
        byId,
      });
    }
    return new NumericPages(
      pages,
      typed ? Uint32Array.from(prefix) : prefix,
      counts.length,
      { ...options },
      pageSize,
    );
  }
  get visibleLength() {
    return this.prefix[this.prefix.length - 1];
  }
  countAt(index: number) {
    if (!Number.isSafeInteger(index) || index < 0 || index >= this.rows)
      throw new Error("Row outside container");
    return this.pages[Math.floor(index / this.effectivePageSize)].counts[
      index % this.effectivePageSize
    ];
  }
  /** Shape-preserving whole-run visibility toggle. Immutable starts/strings/maps
   * are shared; only the count page, page directory and prefix are copied.
   * No insert/split/merge/search/editor behavior is claimed by this operation. */
  toggle(index: number): NumericPages {
    const before = this.countAt(index),
      pageIndex = Math.floor(index / this.effectivePageSize),
      row = index % this.effectivePageSize;
    const pages = this.pages.slice(),
      old = pages[pageIndex],
      counts = old.counts.slice();
    counts[row] = -before;
    pages[pageIndex] = { ...old, counts };
    const delta = -before,
      prefix = this.prefix.slice();
    unsigned(this.visibleLength + delta);
    for (let i = pageIndex + 1; i < prefix.length; i++) prefix[i] += delta;
    return new NumericPages(
      pages,
      prefix,
      this.rows,
      this.options,
      this.effectivePageSize,
    );
  }
  checksum() {
    let value = this.visibleLength >>> 0;
    for (let i = 0; i < this.rows; i++)
      value = Math.imul(value ^ this.countAt(i), 16777619) >>> 0;
    return value;
  }
  verify(initial: ProbeF05, toggles: readonly number[]) {
    const expected = initial.counts.slice();
    const starts: number[] = [],
      next = new Map<string, number>();
    let exception = 0,
      exceptionRow = initial.startCounterIndexes[0] ?? -1;
    for (let i = 0; i < initial.counts.length; i++) {
      let start = next.get(initial.bunchIds[i]) ?? 0;
      if (i === exceptionRow) {
        start = initial.startCounters[exception++];
        exceptionRow =
          exception === initial.startCounterIndexes.length
            ? -1
            : exceptionRow + initial.startCounterIndexes[exception];
      }
      starts.push(start);
      next.set(initial.bunchIds[i], start + Math.abs(initial.counts[i]));
    }
    for (const index of toggles) expected[index] = -expected[index];
    let visible = 0;
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== this.countAt(i))
        throw new Error("Count/version mismatch");
      if (expected[i] > 0) visible += expected[i];
    }
    if (visible !== this.visibleLength)
      throw new Error("Visible prefix mismatch");
    let offset = 0;
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p];
      let sum = 0;
      for (let i = 0; i < page.counts.length; i++) {
        if (page.bunchIds[i] !== initial.bunchIds[offset + i])
          throw new Error("String identity mismatch");
        if (page.starts[i] !== starts[offset + i])
          throw new Error("Start counter mismatch");
        if (!Array.from(page.byId.get(page.bunchIds[i])!).includes(i))
          throw new Error("Row index mismatch");
        if (page.counts[i] > 0) sum += page.counts[i];
      }
      if (this.prefix[p + 1] - this.prefix[p] !== sum)
        throw new Error("Page prefix mismatch");
      offset += page.counts.length;
    }
  }
  stats() {
    const numeric = this.pages.flatMap((page) => [
      page.counts,
      page.starts,
      ...page.byId.values(),
    ]);
    numeric.push(this.prefix);
    return {
      pages: this.pages.length,
      numericArrays: numeric.length,
      numericElements: numeric.reduce((sum, a) => sum + a.length, 0),
      typedBackingBytes: numeric.reduce(
        (sum, a) => sum + (Array.isArray(a) ? 0 : a.byteLength),
        0,
      ),
      rows: this.rows,
    };
  }
}

export function toggleRows(rows: number, operations = 2000): number[] {
  if (!Number.isSafeInteger(rows) || rows < 1)
    throw new Error("Need nonempty fixture");
  let seed = 417;
  return Array.from({ length: operations }, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % rows;
  });
}
