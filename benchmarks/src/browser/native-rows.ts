import type { ElementId, SavedIdList } from "articulated";
import type { BenchmarkList } from "./list-interface";

export type ObjectRow = SavedIdList[number];
export interface SignedRow {
  bunchId: string;
  startCounter: number;
  count: number;
}
export type TupleRow = [string, number, number];
type Row = ObjectRow | SignedRow | TupleRow;
export interface NativeRowsOptions {
  ownership?: "shared" | "owned";
  pageSize?: number;
}
type Options = Required<NativeRowsOptions>;
interface Access<R extends Row> {
  id(row: R): string;
  start(row: R): number;
  count(row: R): number;
  make(id: string, start: number, count: number): R;
  validate(row: R): void;
}
function natural(n: number) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("Invalid nonnegative integer");
}
function validId(id: ElementId) {
  if (!id || typeof id.bunchId !== "string")
    throw new Error("Invalid bunch ID");
  natural(id.counter);
}
function object(row: ObjectRow | SignedRow) {
  if (!row || typeof row !== "object" || Array.isArray(row))
    throw new Error("Invalid object row");
}
const plain: Access<ObjectRow> = {
  id: (r) => r.bunchId,
  start: (r) => r.startCounter,
  count: (r) => (r.isDeleted ? -r.count : r.count),
  make: (bunchId, startCounter, count) => ({
    bunchId,
    startCounter,
    count: Math.abs(count),
    isDeleted: count < 0,
  }),
  validate(r) {
    object(r);
    if (typeof r.isDeleted !== "boolean" || !(r.count > 0))
      throw new Error("Invalid plain row");
  },
};
const signed: Access<SignedRow> = {
  id: (r) => r.bunchId,
  start: (r) => r.startCounter,
  count: (r) => r.count,
  make: (bunchId, startCounter, count) => ({ bunchId, startCounter, count }),
  validate: object,
};
const tuple: Access<TupleRow> = {
  id: (r) => r[0],
  start: (r) => r[1],
  count: (r) => r[2],
  make: (id, start, count) => [id, start, count],
  validate(r) {
    if (!Array.isArray(r) || r.length !== 3)
      throw new Error("Invalid tuple row");
  },
};
interface Page<R extends Row> {
  rows: R[];
  from: number;
  to: number;
  length: number;
  byId: Map<string, number | number[]>;
}
function pagesFor<R extends Row>(
  rows: R[],
  access: Access<R>,
  options: Options,
): Page<R>[] {
  const pages: Page<R>[] = [];
  const size = Math.ceil(
    rows.length / Math.max(1, Math.ceil(rows.length / options.pageSize)),
  );
  for (let offset = 0; offset < rows.length; offset += size) {
    const end = Math.min(offset + size, rows.length),
      owned = options.ownership === "owned";
    const data = owned ? rows.slice(offset, end) : rows;
    const from = owned ? 0 : offset,
      to = owned ? end - offset : end;
    const byId = new Map<string, number | number[]>();
    let length = 0;
    for (let i = from; i < to; i++) {
      const id = access.id(data[i]),
        prior = byId.get(id),
        n = access.count(data[i]);
      if (prior === undefined) byId.set(id, i);
      else if (typeof prior === "number") byId.set(id, [prior, i]);
      else prior.push(i);
      if (n > 0) length += n;
    }
    pages.push({ rows: data, from, to, length, byId });
  }
  return pages;
}
/** Reuses untouched immutable rows; allocates a row only for a split/merge/new run. */
class EditBuffer<R extends Row> {
  readonly rows: R[] = [];
  constructor(private readonly access: Access<R>) {}
  copy(row: R) {
    const a = this.access,
      last = this.rows.at(-1),
      count = a.count(row);
    if (
      last &&
      a.id(last) === a.id(row) &&
      a.start(last) + Math.abs(a.count(last)) === a.start(row) &&
      Math.sign(a.count(last)) === Math.sign(count)
    ) {
      this.rows[this.rows.length - 1] = a.make(
        a.id(last),
        a.start(last),
        a.count(last) + count,
      );
    } else this.rows.push(row);
  }
  append(id: string, start: number, count: number) {
    if (count) this.copy(this.access.make(id, start, count));
  }
}

/** Native F01/F02/F03 row pages: no IdList or columnar representation on load/edit.
 * Inputs transfer immutable ownership. Owned mode copies page arrays, NOT row
 * objects/tuples; shared mode keeps views into the input array. A flat directory
 * and eager per-page ID indexes intentionally match the F05/F08 flat-page design.
 */
export class NativeRows<R extends Row = Row> implements BenchmarkList {
  readonly length: number;
  private readonly prefix: Float64Array;
  private constructor(
    private readonly pages: readonly Page<R>[],
    private readonly access: Access<R>,
    private readonly options: Options,
    private readonly original?: R[],
  ) {
    this.prefix = new Float64Array(pages.length + 1);
    for (let i = 0; i < pages.length; i++)
      this.prefix[i + 1] = this.prefix[i] + pages[i].length;
    this.length = this.prefix[pages.length];
    natural(this.length);
  }
  static loadF01(
    rows: SavedIdList,
    options: NativeRowsOptions = {},
  ): NativeRows<ObjectRow> {
    return NativeRows.load(rows, plain, options);
  }
  static loadF02(
    rows: SignedRow[],
    options: NativeRowsOptions = {},
  ): NativeRows<SignedRow> {
    return NativeRows.load(rows, signed, options);
  }
  static loadF03(
    rows: TupleRow[],
    options: NativeRowsOptions = {},
  ): NativeRows<TupleRow> {
    return NativeRows.load(rows, tuple, options);
  }
  private static load<R extends Row>(
    rows: R[],
    access: Access<R>,
    options: NativeRowsOptions,
  ): NativeRows<R> {
    const config: Options = {
      ownership: options.ownership ?? "shared",
      pageSize: options.pageSize ?? 128,
    };
    natural(config.pageSize);
    if (!config.pageSize || !["owned", "shared"].includes(config.ownership))
      throw new Error("Invalid page options");
    if (!Array.isArray(rows)) throw new Error("Invalid rows");
    const intervals = new Map<string, number[]>();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      access.validate(r);
      const id = access.id(r),
        start = access.start(r),
        count = access.count(r);
      if (typeof id !== "string" || !Number.isSafeInteger(count) || !count)
        throw new Error("Invalid run");
      natural(start);
      natural(start + Math.abs(count));
      let group = intervals.get(id);
      if (!group) intervals.set(id, (group = []));
      group.push(i);
    }
    for (const group of intervals.values()) {
      group.sort((a, b) => access.start(rows[a]) - access.start(rows[b]));
      for (let i = 1; i < group.length; i++) {
        const previous = rows[group[i - 1]];
        if (
          access.start(rows[group[i]]) <
          access.start(previous) + Math.abs(access.count(previous))
        )
          throw new Error("Duplicate IDs");
      }
    }
    return new NativeRows(
      pagesFor(rows, access, config),
      access,
      config,
      config.ownership === "shared" ? rows : undefined,
    );
  }
  get wireState(): Readonly<R[]> {
    if (this.original) return this.original;
    const out = new EditBuffer(this.access);
    for (const page of this.pages)
      for (let i = page.from; i < page.to; i++) out.copy(page.rows[i]);
    return out.rows;
  }
  private find(id: ElementId): { page: number; row: number } {
    validId(id);
    const a = this.access;
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p],
        hits = page.byId.get(id.bunchId);
      if (hits === undefined) continue;
      for (
        let j = 0, size = typeof hits === "number" ? 1 : hits.length;
        j < size;
        j++
      ) {
        const index = typeof hits === "number" ? hits : hits[j],
          row = page.rows[index],
          start = a.start(row);
        if (start <= id.counter && id.counter < start + Math.abs(a.count(row)))
          return { page: p, row: index };
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
      const mid = Math.floor((lo + hi) / 2);
      if (this.prefix[mid + 1] <= index) lo = mid + 1;
      else hi = mid;
    }
    const page = this.pages[lo],
      a = this.access;
    index -= this.prefix[lo];
    for (let i = page.from; i < page.to; i++) {
      const row = page.rows[i],
        n = a.count(row);
      if (n <= 0) continue;
      if (index < n)
        return { bunchId: a.id(row), counter: a.start(row) + index };
      index -= n;
    }
    throw new Error("Invalid prefix index");
  }
  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {
    const found = this.find(id),
      page = this.pages[found.page],
      a = this.access;
    let seen = this.prefix[found.page];
    for (let i = page.from; i < found.row; i++) {
      const n = a.count(page.rows[i]);
      if (n > 0) seen += n;
    }
    const row = page.rows[found.row];
    return a.count(row) > 0
      ? seen + id.counter - a.start(row)
      : bias === "none"
        ? -1
        : seen - (bias === "left" ? 1 : 0);
  }
  insertAfter(
    before: ElementId | null,
    id: ElementId,
    count = 1,
  ): NativeRows<R> {
    natural(count);
    validId(id);
    natural(id.counter + count);
    const anchor = before === null ? null : this.find(before);
    if (!count) return this;
    natural(this.length + count);
    const a = this.access;
    for (const page of this.pages) {
      const hits = page.byId.get(id.bunchId);
      if (hits === undefined) continue;
      for (
        let j = 0, size = typeof hits === "number" ? 1 : hits.length;
        j < size;
        j++
      ) {
        const row = page.rows[typeof hits === "number" ? hits : hits[j]],
          start = a.start(row);
        if (
          start < id.counter + count &&
          id.counter < start + Math.abs(a.count(row))
        )
          throw new Error("Duplicate IDs");
      }
    }
    const target = anchor?.page ?? 0,
      page = this.pages[target],
      buffer = new EditBuffer(a);
    if (!anchor) buffer.append(id.bunchId, id.counter, count);
    if (page)
      for (let i = page.from; i < page.to; i++) {
        const row = page.rows[i];
        if (anchor && i === anchor.row) {
          const name = a.id(row),
            start = a.start(row),
            n = a.count(row),
            left = before!.counter - start + 1,
            sign = Math.sign(n);
          if (left === Math.abs(n)) buffer.copy(row);
          else buffer.append(name, start, sign * left);
          buffer.append(id.bunchId, id.counter, count);
          buffer.append(name, start + left, sign * (Math.abs(n) - left));
        } else buffer.copy(row);
      }
    const pages = this.pages.slice();
    pages.splice(
      target,
      page ? 1 : 0,
      ...pagesFor(buffer.rows, a, this.options),
    );
    return new NativeRows(pages, a, this.options);
  }
  delete(id: ElementId, count = 1): NativeRows<R> {
    natural(count);
    validId(id);
    natural(id.counter + count);
    if (!count) return this;
    const a = this.access;
    let result: Page<R>[] | undefined;
    for (let p = 0; p < this.pages.length; p++) {
      const page = this.pages[p],
        rows = page.byId.get(id.bunchId);
      let hits: number[] | undefined;
      if (rows !== undefined)
        for (
          let j = 0, size = typeof rows === "number" ? 1 : rows.length;
          j < size;
          j++
        ) {
          const index = typeof rows === "number" ? rows : rows[j],
            row = page.rows[index],
            n = a.count(row),
            start = a.start(row);
          if (n > 0 && start < id.counter + count && id.counter < start + n) {
            if (!hits) hits = [];
            hits.push(index);
          }
        }
      if (!hits?.length) {
        if (result) result.push(page);
        continue;
      }
      if (!result) result = this.pages.slice(0, p);
      const buffer = new EditBuffer(a);
      let hit = 0;
      for (let i = page.from; i < page.to; i++) {
        const row = page.rows[i];
        if (i !== hits[hit]) {
          buffer.copy(row);
          continue;
        }
        hit++;
        const name = a.id(row),
          start = a.start(row),
          n = a.count(row),
          lo = Math.max(start, id.counter),
          hi = Math.min(start + n, id.counter + count);
        buffer.append(name, start, lo - start);
        buffer.append(name, lo, -(hi - lo));
        buffer.append(name, hi, start + n - hi);
      }
      result.push(...pagesFor(buffer.rows, a, this.options));
    }
    return result ? new NativeRows(result, a, this.options) : this;
  }
  save(): SavedIdList {
    const out: SavedIdList = [],
      a = this.access;
    for (const page of this.pages)
      for (let i = page.from; i < page.to; i++) {
        const row = page.rows[i],
          bunchId = a.id(row),
          startCounter = a.start(row),
          signedCount = a.count(row),
          count = Math.abs(signedCount),
          isDeleted = signedCount < 0,
          last = out.at(-1);
        if (
          last &&
          last.bunchId === bunchId &&
          last.isDeleted === isDeleted &&
          last.startCounter + last.count === startCounter
        )
          out[out.length - 1] = { ...last, count: last.count + count };
        else out.push({ bunchId, startCounter, count, isDeleted });
      }
    return out;
  }
}
