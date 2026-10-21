import type { ElementId, SavedIdList } from "articulated";
import type { BenchmarkList } from "./list-interface";
import type { F08 } from "./native";
import { PersistentIndex } from "./persistent-index";

type Key = readonly [number, number, number];
type Range = { key: Key; end: number; page: number };
type Columns = Pick<F08, "clientIndices" | "seqNums" | "counts">;
interface Page {
  columns: Columns;
  starts: Float64Array;
  from: number;
  to: number;
  length: number;
  ranges: Range[];
}
interface Tree {
  id: number;
  page: Page;
  left: Tree | null;
  right: Tree | null;
  height: number;
  size: number;
  length: number;
}
export interface PagedF08Options {
  ownership?: "shared" | "owned";
  pageSize?: number;
}
const compare = (a: Key, b: Key) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const numeric = (a: number, b: number) => a - b;
const lexical = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const size = (n: Tree | null) => n?.size ?? 0;
const length = (n: Tree | null) => n?.length ?? 0;
const height = (n: Tree | null) => n?.height ?? 0;
function natural(n: number) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("Invalid nonnegative integer");
}
function split(id: string): [string, number] {
  const p = id.lastIndexOf("_"),
    suffix = id.slice(p + 1),
    seq = parseInt(suffix, 36);
  if (
    p < 1 ||
    !Number.isSafeInteger(seq) ||
    seq < 0 ||
    seq.toString(36) !== suffix
  )
    throw new Error("F08 requires canonical client_sequence IDs");
  return [id.slice(0, p), seq];
}
function make(
  id: number,
  page: Page,
  left: Tree | null,
  right: Tree | null,
): Tree {
  return {
    id,
    page,
    left,
    right,
    height: 1 + Math.max(height(left), height(right)),
    size: 1 + size(left) + size(right),
    length: page.length + length(left) + length(right),
  };
}
function pageFor(
  columns: Columns,
  starts: Float64Array,
  from: number,
  to: number,
  id: number,
  knownRanges?: Range[],
): Page {
  let visible = 0;
  const ranges: Range[] = [];
  for (let row = from; row < to; row++) {
    const count = columns.counts[row];
    if (count > 0) visible += count;
    if (!knownRanges)
      ranges.push({
        key: [columns.clientIndices[row], columns.seqNums[row], starts[row]],
        end: starts[row] + Math.abs(count),
        page: id,
      });
  }
  if (knownRanges)
    return { columns, starts, from, to, length: visible, ranges: knownRanges };
  ranges.sort((a, b) => compare(a.key, b.key));
  let write = 0;
  for (const range of ranges) {
    const last = ranges[write - 1];
    if (
      last &&
      last.key[0] === range.key[0] &&
      last.key[1] === range.key[1] &&
      last.end === range.key[2]
    )
      last.end = range.end;
    else ranges[write++] = range;
  }
  ranges.length = write;
  return { columns, starts, from, to, length: visible, ranges };
}
class Buffer {
  columns: Columns = { clientIndices: [], seqNums: [], counts: [] };
  starts: number[] = [];
  append(c: number, seq: number, start: number, count: number) {
    if (!count) return;
    const s = this.columns,
      last = s.counts.length - 1;
    if (
      last >= 0 &&
      s.clientIndices[last] === c &&
      s.seqNums[last] === seq &&
      this.starts[last] + Math.abs(s.counts[last]) === start &&
      Math.sign(s.counts[last]) === Math.sign(count)
    )
      s.counts[last] += count;
    else {
      s.clientIndices.push(c);
      s.seqNums.push(seq);
      s.counts.push(count);
      this.starts.push(start);
    }
  }
  copy(p: Page, row: number) {
    this.append(
      p.columns.clientIndices[row],
      p.columns.seqNums[row],
      p.starts[row],
      p.columns.counts[row],
    );
  }
}

/** Experimental persistent page tree. Pages retain F08 numeric columns; the
 * numeric interval index locates identity without reconstructing whole IDs.
 * Parent/page directories are versioned, so old versions remain navigable.
 * Owned loading copies columns into bounded allocations; shared loading adopts
 * source arrays. Both eagerly build and charge all navigation indexes. */
export class PagedF08 implements BenchmarkList {
  private constructor(
    private readonly clients: string[],
    private readonly clientIndex: PersistentIndex<string, number>,
    private readonly root: Tree | null,
    private readonly pages: PersistentIndex<number, Tree>,
    private readonly parents: PersistentIndex<number, number | null>,
    private readonly identities: PersistentIndex<Key, Range>,
    private readonly nextId: number,
    private readonly pageSize: number,
  ) {}
  get length() {
    return length(this.root);
  }

  static load(s: F08, options: PagedF08Options = {}): PagedF08 {
    const pageSize = options.pageSize ?? 128;
    if (!Number.isSafeInteger(pageSize) || pageSize < 4)
      throw new Error("Invalid page size");
    const {
      clientIds,
      clientIndices,
      seqNums,
      counts,
      startCounterIndexes,
      startCounters,
    } = s;
    if (
      ![
        clientIds,
        clientIndices,
        seqNums,
        counts,
        startCounterIndexes,
        startCounters,
      ].every(Array.isArray) ||
      clientIndices.length !== counts.length ||
      seqNums.length !== counts.length ||
      startCounters.length !== startCounterIndexes.length
    )
      throw new Error("Invalid columns");
    if (
      new Set(clientIds).size !== clientIds.length ||
      clientIds.some((c) => typeof c !== "string" || !c.length)
    )
      throw new Error("Invalid clients");
    let exceptionRow = 0;
    for (let i = 0; i < startCounterIndexes.length; i++) {
      natural(startCounterIndexes[i]);
      natural(startCounters[i]);
      exceptionRow += startCounterIndexes[i];
      natural(exceptionRow);
      if (
        (i > 0 && startCounterIndexes[i] === 0) ||
        exceptionRow >= counts.length
      )
        throw new Error("Invalid exceptions");
    }
    const starts = new Float64Array(counts.length),
      next = clientIds.map(() => new Map<number, number>());
    let exception = 0,
      visible = 0;
    exceptionRow = startCounterIndexes[0] ?? -1;
    for (let i = 0; i < counts.length; i++) {
      const c = clientIndices[i],
        seq = seqNums[i],
        count = counts[i];
      natural(c);
      natural(seq);
      if (c >= clientIds.length || !Number.isSafeInteger(count) || !count)
        throw new Error("Invalid run");
      let start = next[c].get(seq) ?? 0;
      if (i === exceptionRow) {
        start = startCounters[exception++];
        exceptionRow =
          exception < startCounterIndexes.length
            ? exceptionRow + startCounterIndexes[exception]
            : -1;
      }
      const end = start + Math.abs(count);
      natural(end);
      starts[i] = start;
      next[c].set(seq, end);
      if (count > 0) visible += count;
    }
    natural(visible);
    const pages: Page[] = [],
      ranges: Range[] = [];
    const span = Math.ceil(
      counts.length / Math.max(1, Math.ceil(counts.length / pageSize)),
    );
    for (let from = 0; from < counts.length; from += span) {
      const to = Math.min(from + span, counts.length),
        id = pages.length;
      const page =
        options.ownership === "shared"
          ? pageFor(s, starts, from, to, id)
          : pageFor(
              {
                clientIndices: clientIndices.slice(from, to),
                seqNums: seqNums.slice(from, to),
                counts: counts.slice(from, to),
              },
              starts.slice(from, to),
              0,
              to - from,
              id,
            );
      pages.push(page);
      ranges.push(...page.ranges);
    }
    ranges.sort((a, b) => compare(a.key, b.key));
    for (let i = 1; i < ranges.length; i++) {
      const a = ranges[i - 1],
        b = ranges[i];
      if (a.key[0] === b.key[0] && a.key[1] === b.key[1] && a.end > b.key[2])
        throw new Error("Duplicate IDs");
    }
    const nodes: [number, Tree][] = [],
      parents: [number, number | null][] = [];
    function build(lo: number, hi: number, parent: number | null): Tree | null {
      if (lo === hi) return null;
      const mid = (lo + hi) >>> 1;
      const n = make(
        mid,
        pages[mid],
        build(lo, mid, mid),
        build(mid + 1, hi, mid),
      );
      nodes.push([mid, n]);
      parents.push([mid, parent]);
      return n;
    }
    const root = build(0, pages.length, null);
    nodes.sort((a, b) => a[0] - b[0]);
    parents.sort((a, b) => a[0] - b[0]);
    return new PagedF08(
      clientIds.slice(),
      PersistentIndex.sorted(
        lexical,
        clientIds
          .map((c, i) => [c, i] as const)
          .sort((a, b) => lexical(a[0], b[0])),
      ),
      root,
      PersistentIndex.sorted(numeric, nodes),
      PersistentIndex.sorted(numeric, parents),
      PersistentIndex.sorted(
        compare,
        ranges.map((r) => [r.key, r] as const),
      ),
      pages.length,
      pageSize,
    );
  }
  private locate(id: ElementId): { node: Tree; row: number } {
    natural(id.counter);
    const [client, seq] = split(id.bunchId),
      c = this.clientIndex.get(client);
    const range =
      c === undefined
        ? undefined
        : this.identities.floor([c, seq, id.counter])?.[1];
    if (
      !range ||
      range.key[0] !== c ||
      range.key[1] !== seq ||
      id.counter >= range.end
    )
      throw new Error("Unknown ID");
    const node = this.pages.get(range.page)!,
      p = node.page;
    for (let row = p.from; row < p.to; row++)
      if (
        p.columns.clientIndices[row] === c &&
        p.columns.seqNums[row] === seq &&
        p.starts[row] <= id.counter &&
        id.counter < p.starts[row] + Math.abs(p.columns.counts[row])
      )
        return { node, row };
    throw new Error("Invalid identity index");
  }
  private position(node: Tree): { rank: number; visible: number } {
    let rank = size(node.left),
      visible = length(node.left),
      current = node;
    for (;;) {
      const parentId = this.parents.get(current.id);
      if (parentId === null) return { rank, visible };
      if (parentId === undefined) throw new Error("Missing parent");
      const parent = this.pages.get(parentId)!;
      if (parent.right?.id === current.id) {
        rank += size(parent.left) + 1;
        visible += length(parent.left) + parent.page.length;
      } else if (parent.left?.id !== current.id)
        throw new Error("Stale parent");
      current = parent;
    }
  }
  at(index: number): ElementId {
    natural(index);
    if (index >= this.length) throw new Error("Index out of bounds");
    let node = this.root!;
    for (;;) {
      if (index < length(node.left)) {
        node = node.left!;
        continue;
      }
      index -= length(node.left);
      if (index >= node.page.length) {
        index -= node.page.length;
        node = node.right!;
        continue;
      }
      const p = node.page;
      for (let row = p.from; row < p.to; row++) {
        const count = p.columns.counts[row];
        if (count <= 0) continue;
        if (index < count)
          return {
            bunchId: `${this.clients[p.columns.clientIndices[row]]}_${p.columns.seqNums[row].toString(36)}`,
            counter: p.starts[row] + index,
          };
        index -= count;
      }
      throw new Error("Invalid visible index");
    }
  }
  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {
    const { node, row } = this.locate(id),
      p = node.page;
    let visible = this.position(node).visible;
    for (let i = p.from; i < row; i++)
      if (p.columns.counts[i] > 0) visible += p.columns.counts[i];
    return p.columns.counts[row] > 0
      ? visible + id.counter - p.starts[row]
      : bias === "none"
        ? -1
        : visible - (bias === "left" ? 1 : 0);
  }

  /** Replace one page and path-copy only its ancestors/directories. Splitting
   * changes ownership and therefore refreshes only that page's interval keys. */
  private replace(
    old: Tree | null,
    buffer: Buffer,
    clients = this.clients,
    clientIndex = this.clientIndex,
    identityUnchanged = false,
  ): PagedF08 {
    let directory = this.pages,
      parents = this.parents,
      identities = this.identities,
      nextId = this.nextId;
    const rank = old ? this.position(old).rank : 0;
    const count = buffer.columns.counts.length,
      span = Math.ceil(count / Math.max(1, Math.ceil(count / this.pageSize)));
    // Visibility-only changes cannot alter known identity ranges. Reuse both
    // their descriptors and index unless splitting changes page ownership.
    const reusedRanges =
      identityUnchanged && old && count <= this.pageSize
        ? old.page.ranges
        : undefined;
    const replacements: { id: number; page: Page }[] = [];
    for (let from = 0; from < count; from += span) {
      const to = Math.min(from + span, count),
        id = from === 0 && old ? old.id : nextId++;
      const columns = {
        clientIndices: buffer.columns.clientIndices.slice(from, to),
        seqNums: buffer.columns.seqNums.slice(from, to),
        counts: buffer.columns.counts.slice(from, to),
      };
      replacements.push({
        id,
        page: pageFor(
          columns,
          Float64Array.from(buffer.starts.slice(from, to)),
          0,
          to - from,
          id,
          reusedRanges,
        ),
      });
    }
    const fresh =
        replacements.length === 1
          ? replacements[0].page.ranges
          : replacements
              .flatMap((r) => r.page.ranges)
              .sort((a, b) => compare(a.key, b.key)),
      previous = old?.page.ranges ?? [];
    // Coalesced ranges deliberately ignore deletion boundaries. An ordinary
    // delete's identical ranges therefore preserve the identity index object.
    let a = 0,
      b = 0;
    while (!reusedRanges && (a < previous.length || b < fresh.length)) {
      const before = previous[a],
        after = fresh[b],
        d = !before ? 1 : !after ? -1 : compare(before.key, after.key);
      if (d < 0) {
        identities = identities.delete(before.key);
        a++;
      } else if (d > 0) {
        identities = identities.set(after.key, after);
        b++;
      } else {
        if (before.end !== after.end || before.page !== after.page)
          identities = identities.set(after.key, after);
        a++;
        b++;
      }
    }
    const record = (n: Tree) => {
      directory = directory.set(n.id, n);
      if (n.left && parents.get(n.left.id) !== n.id)
        parents = parents.set(n.left.id, n.id);
      if (n.right && parents.get(n.right.id) !== n.id)
        parents = parents.set(n.right.id, n.id);
      return n;
    };
    const balance = (n: Tree): Tree => {
      if (height(n.left) > height(n.right) + 1) {
        const l = n.left!;
        if (height(l.left) >= height(l.right))
          return record(
            make(
              l.id,
              l.page,
              l.left,
              record(make(n.id, n.page, l.right, n.right)),
            ),
          );
        const m = l.right!;
        return record(
          make(
            m.id,
            m.page,
            record(make(l.id, l.page, l.left, m.left)),
            record(make(n.id, n.page, m.right, n.right)),
          ),
        );
      }
      if (height(n.right) > height(n.left) + 1) {
        const r = n.right!;
        if (height(r.right) >= height(r.left))
          return record(
            make(
              r.id,
              r.page,
              record(make(n.id, n.page, n.left, r.left)),
              r.right,
            ),
          );
        const m = r.left!;
        return record(
          make(
            m.id,
            m.page,
            record(make(n.id, n.page, n.left, m.left)),
            record(make(r.id, r.page, m.right, r.right)),
          ),
        );
      }
      return record(n);
    };
    function replaceAt(n: Tree, pos: number, p: Page): Tree {
      const leftSize = size(n.left);
      return pos === leftSize
        ? record(make(n.id, p, n.left, n.right))
        : pos < leftSize
          ? record(make(n.id, n.page, replaceAt(n.left!, pos, p), n.right))
          : record(
              make(
                n.id,
                n.page,
                n.left,
                replaceAt(n.right!, pos - leftSize - 1, p),
              ),
            );
    }
    function insertAt(
      n: Tree | null,
      pos: number,
      replacement: { id: number; page: Page },
    ): Tree {
      if (!n) return record(make(replacement.id, replacement.page, null, null));
      const leftSize = size(n.left);
      return balance(
        pos <= leftSize
          ? make(n.id, n.page, insertAt(n.left, pos, replacement), n.right)
          : make(
              n.id,
              n.page,
              n.left,
              insertAt(n.right, pos - leftSize - 1, replacement),
            ),
      );
    }
    let root = this.root;
    if (old) root = replaceAt(root!, rank, replacements[0].page);
    for (let i = old ? 1 : 0; i < replacements.length; i++)
      root = insertAt(root, rank + i, replacements[i]);
    if (root && parents.get(root.id) !== null)
      parents = parents.set(root.id, null);
    return new PagedF08(
      clients,
      clientIndex,
      root,
      directory,
      parents,
      identities,
      nextId,
      this.pageSize,
    );
  }
  insertAfter(before: ElementId | null, id: ElementId, count = 1): PagedF08 {
    natural(count);
    natural(id.counter);
    natural(id.counter + count);
    natural(this.length + count);
    const [client, seq] = split(id.bunchId),
      anchor = before === null ? null : this.locate(before);
    if (!count) return this;
    let c = this.clientIndex.get(client),
      clients = this.clients,
      clientIndex = this.clientIndex;
    if (c === undefined) {
      c = clients.length;
      clients = [...clients, client];
      clientIndex = clientIndex.set(client, c);
    }
    const key: Key = [c, seq, id.counter],
      floor = this.identities.floor(key)?.[1],
      ceiling = this.identities.ceiling(key)?.[1];
    if (
      (floor &&
        floor.key[0] === c &&
        floor.key[1] === seq &&
        floor.end > id.counter) ||
      (ceiling &&
        ceiling.key[0] === c &&
        ceiling.key[1] === seq &&
        ceiling.key[2] < id.counter + count)
    )
      throw new Error("Duplicate IDs");
    let target = anchor?.node ?? this.root;
    if (!anchor) while (target?.left) target = target.left;
    const p = target?.page,
      buffer = new Buffer();
    if (!anchor) buffer.append(c, seq, id.counter, count);
    if (p)
      for (let row = p.from; row < p.to; row++) {
        if (anchor && row === anchor.row) {
          const start = p.starts[row],
            n = p.columns.counts[row],
            left = before!.counter - start + 1,
            sign = Math.sign(n);
          buffer.append(
            p.columns.clientIndices[row],
            p.columns.seqNums[row],
            start,
            sign * left,
          );
          buffer.append(c, seq, id.counter, count);
          buffer.append(
            p.columns.clientIndices[row],
            p.columns.seqNums[row],
            start + left,
            sign * (Math.abs(n) - left),
          );
        } else buffer.copy(p, row);
      }
    return this.replace(target, buffer, clients, clientIndex);
  }
  delete(id: ElementId, count = 1): PagedF08 {
    natural(count);
    natural(id.counter);
    natural(id.counter + count);
    if (!count) return this;
    const [client, seq] = split(id.bunchId),
      c = this.clientIndex.get(client);
    if (c === undefined) return this;
    const end = id.counter + count,
      pageIds = new Set<number>();
    let entry = this.identities.floor([c, seq, id.counter]);
    if (
      !entry ||
      entry[1].key[0] !== c ||
      entry[1].key[1] !== seq ||
      entry[1].end <= id.counter
    )
      entry = this.identities.ceiling([c, seq, id.counter]);
    while (
      entry &&
      entry[0][0] === c &&
      entry[0][1] === seq &&
      entry[0][2] < end
    ) {
      pageIds.add(entry[1].page);
      entry = this.identities.ceiling([c, seq, entry[1].end]);
    }
    let result: PagedF08 | undefined;
    for (const pageId of pageIds) {
      const current = result ?? this;
      const node = current.pages.get(pageId)!,
        p = node.page,
        buffer = new Buffer();
      let changed = false;
      for (let row = p.from; row < p.to; row++) {
        const start = p.starts[row],
          n = p.columns.counts[row];
        if (
          n > 0 &&
          p.columns.clientIndices[row] === c &&
          p.columns.seqNums[row] === seq &&
          start < end &&
          id.counter < start + n
        ) {
          changed = true;
          const lo = Math.max(start, id.counter),
            hi = Math.min(start + n, end);
          buffer.append(c, seq, start, lo - start);
          buffer.append(c, seq, lo, -(hi - lo));
          buffer.append(c, seq, hi, start + n - hi);
        } else buffer.copy(p, row);
      }
      if (changed)
        result = current.replace(
          node,
          buffer,
          current.clients,
          current.clientIndex,
          true,
        );
    }
    return result ?? this;
  }
  private *orderedPages(): Generator<Page> {
    function* visit(n: Tree | null): Generator<Page> {
      if (n) {
        yield* visit(n.left);
        yield n.page;
        yield* visit(n.right);
      }
    }
    yield* visit(this.root);
  }
  get wireState(): F08 {
    const buffer = new Buffer();
    for (const page of this.orderedPages())
      for (let row = page.from; row < page.to; row++) buffer.copy(page, row);
    const out: F08 = {
      clientIds: this.clients.slice(),
      ...buffer.columns,
      startCounterIndexes: [],
      startCounters: [],
    };
    const next = this.clients.map(() => new Map<number, number>());
    let lastException = 0;
    for (let i = 0; i < out.counts.length; i++) {
      const c = out.clientIndices[i],
        seq = out.seqNums[i],
        start = buffer.starts[i];
      if (start !== (next[c].get(seq) ?? 0)) {
        out.startCounterIndexes.push(i - lastException);
        out.startCounters.push(start);
        lastException = i;
      }
      next[c].set(seq, start + Math.abs(out.counts[i]));
    }
    return out;
  }
  save(): SavedIdList {
    const out: SavedIdList = [];
    for (const p of this.orderedPages())
      for (let row = p.from; row < p.to; row++) {
        const bunchId = `${this.clients[p.columns.clientIndices[row]]}_${p.columns.seqNums[row].toString(36)}`,
          startCounter = p.starts[row],
          count = Math.abs(p.columns.counts[row]),
          isDeleted = p.columns.counts[row] < 0,
          last = out.at(-1);
        if (
          last &&
          last.bunchId === bunchId &&
          last.startCounter + last.count === startCounter &&
          last.isDeleted === isDeleted
        )
          out[out.length - 1] = { ...last, count: last.count + count };
        else out.push({ bunchId, startCounter, count, isDeleted });
      }
    return out;
  }
}
