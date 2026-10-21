import type { ElementId, SavedIdList } from "articulated";
import type { toClientIndexOmit } from "../algorithms/id_list_saved_states";
import type { BenchmarkList } from "./list-interface";

export type F08 = ReturnType<typeof toClientIndexOmit>;
type Columns = Pick<F08, "clientIndices" | "seqNums" | "counts">;
const CHUNK_SIZE = 128;
export interface NativeF08Options {
  ownership?: "shared" | "owned";
  pageSize?: number;
}
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
const join = (clients: readonly string[], c: number, seq: number) =>
  `${clients[c]}_${seq.toString(36)}`;

/** Loaded chunks share wire arrays and a derived counter index. Edited chunks
 * own small arrays. Chunk-local indexes are immutable and shared across versions. */
interface Chunk {
  columns: Columns;
  starts: Float64Array;
  from: number;
  to: number;
  length: number;
  byId: Map<string, number | number[]>;
}
function chunksFor(
  columns: Columns,
  starts: Float64Array,
  clients: string[],
  options: NativeF08Options = {},
): Chunk[] {
  const pageSize = options.pageSize ?? CHUNK_SIZE;
  if (!Number.isSafeInteger(pageSize) || pageSize < 2)
    throw new Error("Invalid page size");
  const chunks: Chunk[] = [];
  const names = new Map<number, Map<number, string>>();
  const size = Math.ceil(
    columns.counts.length /
      Math.max(1, Math.ceil(columns.counts.length / pageSize)),
  );
  for (let from = 0; from < columns.counts.length; from += size) {
    const to = Math.min(from + size, columns.counts.length);
    const byId = new Map<string, number | number[]>();
    let length = 0;
    for (let i = from; i < to; i++) {
      const c = columns.clientIndices[i],
        seq = columns.seqNums[i];
      let client = names.get(c);
      if (!client) names.set(c, (client = new Map()));
      let id = client.get(seq);
      if (id === undefined) client.set(seq, (id = join(clients, c, seq)));
      const rows = byId.get(id);
      if (rows === undefined) byId.set(id, i);
      else if (typeof rows === "number") byId.set(id, [rows, i]);
      else rows.push(i);
      if (columns.counts[i] > 0) length += columns.counts[i];
    }
    if (options.ownership === "owned") {
      for (const [id, rows] of byId) {
        byId.set(
          id,
          typeof rows === "number" ? rows - from : rows.map((r) => r - from),
        );
      }
      chunks.push({
        columns: {
          clientIndices: columns.clientIndices.slice(from, to),
          seqNums: columns.seqNums.slice(from, to),
          counts: columns.counts.slice(from, to),
        },
        starts: starts.slice(from, to),
        from: 0,
        to: to - from,
        length,
        byId,
      });
    } else chunks.push({ columns, starts, from, to, length, byId });
  }
  return chunks;
}

/** Small copy-on-write buffer, without a temporary tuple per run. */
class EditBuffer {
  readonly columns: Columns = { clientIndices: [], seqNums: [], counts: [] };
  readonly starts: number[] = [];
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
  copy(chunk: Chunk, row: number) {
    const s = chunk.columns;
    this.append(
      s.clientIndices[row],
      s.seqNums[row],
      chunk.starts[row],
      s.counts[row],
    );
  }
  finish(clients: string[], options: NativeF08Options) {
    return chunksFor(
      this.columns,
      Float64Array.from(this.starts),
      clients,
      options,
    );
  }
}

/** Experimental immutable F08-backed list with sidecar indexes and chunked edits.
 * Input arrays are adopted, not converted to IdList. Callers transfer ownership.
 * Index construction/validation are eager and included in load/memory metrics.
 * wireState is zero-copy before edits; after edits it explicitly flattens chunks.
 */
export class NativeF08 implements BenchmarkList {
  readonly length: number;
  private readonly prefix: Float64Array;
  private constructor(
    private readonly clients: string[],
    private readonly chunks: readonly Chunk[],
    private readonly original?: F08,
    private readonly options: NativeF08Options = {},
  ) {
    this.prefix = new Float64Array(chunks.length + 1);
    for (let i = 0; i < chunks.length; i++)
      this.prefix[i + 1] = this.prefix[i] + chunks[i].length;
    this.length = this.prefix[chunks.length];
    natural(this.length);
  }
  static load(s: F08, options: NativeF08Options = {}): NativeF08 {
    const {
      clientIds,
      clientIndices,
      seqNums,
      startCounterIndexes,
      startCounters,
      counts,
    } = s;
    if (
      ![
        clientIds,
        clientIndices,
        seqNums,
        startCounterIndexes,
        startCounters,
        counts,
      ].every(Array.isArray)
    )
      throw new Error("Invalid columns");
    if (
      clientIndices.length !== counts.length ||
      seqNums.length !== counts.length ||
      startCounterIndexes.length !== startCounters.length
    )
      throw new Error("Mismatched columns");
    if (
      new Set(clientIds).size !== clientIds.length ||
      clientIds.some((c) => typeof c !== "string" || !c.length)
    )
      throw new Error("Invalid client dictionary");
    let exceptionRow = 0;
    startCounterIndexes.forEach((delta, i) => {
      natural(delta);
      natural(startCounters[i]);
      exceptionRow += delta;
      if ((i > 0 && delta === 0) || exceptionRow >= counts.length)
        throw new Error("Invalid counter exceptions");
    });
    // Float64 preserves safe integer counters; this is a derived index, not a wire encoding.
    const starts = new Float64Array(counts.length);
    const next = clientIds.map(() => new Map<number, number>());
    const intervals = clientIds.map(() => new Map<number, number[]>());
    let exception = 0;
    exceptionRow = startCounterIndexes[0] ?? -1;
    for (let i = 0; i < counts.length; i++) {
      const c = clientIndices[i],
        seq = seqNums[i],
        count = counts[i];
      natural(c);
      natural(seq);
      if (c >= clientIds.length || !Number.isSafeInteger(count) || count === 0)
        throw new Error("Invalid run");
      let start = next[c].get(seq) ?? 0;
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
      next[c].set(seq, end);
      let rows = intervals[c].get(seq);
      if (!rows) intervals[c].set(seq, (rows = []));
      rows.push(i);
    }
    for (const client of intervals)
      for (const rows of client.values()) {
        rows.sort((a, b) => starts[a] - starts[b]);
        for (let i = 1; i < rows.length; i++)
          if (
            starts[rows[i]] <
            starts[rows[i - 1]] + Math.abs(counts[rows[i - 1]])
          )
            throw new Error("Duplicate IDs");
      }
    return new NativeF08(
      clientIds,
      chunksFor(s, starts, clientIds, options),
      options.ownership === "owned" ? undefined : s,
      options,
    );
  }
  /** Zero-copy before edits; O(runs) flatten/re-encode after edits. Not cached. */
  get wireState(): Readonly<F08> {
    if (this.original) return this.original;
    const out: F08 = {
      clientIds: this.clients,
      clientIndices: [],
      seqNums: [],
      startCounterIndexes: [],
      startCounters: [],
      counts: [],
    };
    const next = this.clients.map(() => new Map<number, number>());
    let pendingC = -1,
      pendingSeq = 0,
      pendingStart = 0,
      pendingCount = 0,
      lastException = 0;
    const flush = () => {
      if (pendingC < 0) return;
      if (pendingStart !== (next[pendingC].get(pendingSeq) ?? 0)) {
        out.startCounterIndexes.push(out.counts.length - lastException);
        out.startCounters.push(pendingStart);
        lastException = out.counts.length;
      }
      out.clientIndices.push(pendingC);
      out.seqNums.push(pendingSeq);
      out.counts.push(pendingCount);
      next[pendingC].set(pendingSeq, pendingStart + Math.abs(pendingCount));
    };
    for (const chunk of this.chunks)
      for (let i = chunk.from; i < chunk.to; i++) {
        const s = chunk.columns,
          c = s.clientIndices[i],
          seq = s.seqNums[i],
          start = chunk.starts[i],
          count = s.counts[i];
        if (
          c === pendingC &&
          seq === pendingSeq &&
          start === pendingStart + Math.abs(pendingCount) &&
          Math.sign(count) === Math.sign(pendingCount)
        )
          pendingCount += count;
        else {
          flush();
          pendingC = c;
          pendingSeq = seq;
          pendingStart = start;
          pendingCount = count;
        }
      }
    flush();
    return out;
  }
  private find(id: ElementId): { chunk: number; row: number } {
    for (let c = 0; c < this.chunks.length; c++) {
      const chunk = this.chunks[c],
        rows = chunk.byId.get(id.bunchId);
      if (rows !== undefined)
        for (
          let j = 0, size = typeof rows === "number" ? 1 : rows.length;
          j < size;
          j++
        ) {
          const row = typeof rows === "number" ? rows : rows[j];
          if (
            chunk.starts[row] <= id.counter &&
            id.counter < chunk.starts[row] + Math.abs(chunk.columns.counts[row])
          )
            return { chunk: c, row };
        }
    }
    throw new Error("Unknown ID");
  }
  at(index: number): ElementId {
    natural(index);
    if (index >= this.length) throw new Error("Index out of bounds");
    let lo = 0,
      hi = this.chunks.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.prefix[mid + 1] <= index) lo = mid + 1;
      else hi = mid;
    }
    const chunk = this.chunks[lo];
    index -= this.prefix[lo];
    for (let i = chunk.from; i < chunk.to; i++) {
      const s = chunk.columns,
        count = s.counts[i];
      if (count <= 0) continue;
      if (index < count)
        return {
          bunchId: join(this.clients, s.clientIndices[i], s.seqNums[i]),
          counter: chunk.starts[i] + index,
        };
      index -= count;
    }
    throw new Error("Invalid prefix index");
  }
  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {
    const found = this.find(id),
      chunk = this.chunks[found.chunk];
    let seen = this.prefix[found.chunk];
    for (let i = chunk.from; i < found.row; i++)
      if (chunk.columns.counts[i] > 0) seen += chunk.columns.counts[i];
    return chunk.columns.counts[found.row] > 0
      ? seen + id.counter - chunk.starts[found.row]
      : bias === "none"
        ? -1
        : seen - (bias === "left" ? 1 : 0);
  }
  insertAfter(before: ElementId | null, id: ElementId, count = 1): NativeF08 {
    natural(count);
    natural(id.counter);
    natural(id.counter + count);
    const [client, seq] = split(id.bunchId);
    const anchor = before === null ? null : this.find(before);
    if (count === 0) return this;
    natural(this.length + count);
    for (const chunk of this.chunks) {
      const rows = chunk.byId.get(id.bunchId);
      if (rows !== undefined)
        for (
          let j = 0, size = typeof rows === "number" ? 1 : rows.length;
          j < size;
          j++
        ) {
          const row = typeof rows === "number" ? rows : rows[j];
          if (
            chunk.starts[row] < id.counter + count &&
            id.counter < chunk.starts[row] + Math.abs(chunk.columns.counts[row])
          )
            throw new Error("Duplicate IDs");
        }
    }
    let ci = this.clients.indexOf(client),
      clients = this.clients;
    if (ci < 0) {
      ci = clients.length;
      clients = [...clients, client];
    }
    const target = anchor?.chunk ?? 0,
      chunk = this.chunks[target],
      buffer = new EditBuffer();
    if (!anchor) buffer.append(ci, seq, id.counter, count);
    if (chunk)
      for (let i = chunk.from; i < chunk.to; i++) {
        if (anchor && i === anchor.row) {
          const s = chunk.columns,
            start = chunk.starts[i],
            n = s.counts[i],
            left = before!.counter - start + 1,
            sign = Math.sign(n);
          buffer.append(s.clientIndices[i], s.seqNums[i], start, sign * left);
          buffer.append(ci, seq, id.counter, count);
          buffer.append(
            s.clientIndices[i],
            s.seqNums[i],
            start + left,
            sign * (Math.abs(n) - left),
          );
        } else buffer.copy(chunk, i);
      }
    const chunks = this.chunks.slice();
    chunks.splice(
      target,
      chunk ? 1 : 0,
      ...buffer.finish(clients, this.options),
    );
    return new NativeF08(clients, chunks, undefined, this.options);
  }
  delete(id: ElementId, count = 1): NativeF08 {
    natural(count);
    natural(id.counter);
    natural(id.counter + count);
    if (!count) return this;
    split(id.bunchId);
    let result: Chunk[] | undefined;
    for (let c = 0; c < this.chunks.length; c++) {
      const chunk = this.chunks[c],
        rows = chunk.byId.get(id.bunchId);
      let hits: number[] | undefined;
      if (rows !== undefined)
        for (
          let j = 0, size = typeof rows === "number" ? 1 : rows.length;
          j < size;
          j++
        ) {
          const row = typeof rows === "number" ? rows : rows[j];
          if (
            chunk.columns.counts[row] > 0 &&
            chunk.starts[row] < id.counter + count &&
            id.counter < chunk.starts[row] + chunk.columns.counts[row]
          ) {
            if (!hits) hits = [];
            hits.push(row);
          }
        }
      if (!hits?.length) {
        if (result) result.push(chunk);
        continue;
      }
      if (!result) result = this.chunks.slice(0, c);
      const buffer = new EditBuffer();
      let hit = 0;
      for (let i = chunk.from; i < chunk.to; i++) {
        if (i !== hits[hit]) {
          buffer.copy(chunk, i);
          continue;
        }
        hit++;
        const s = chunk.columns,
          start = chunk.starts[i],
          n = s.counts[i],
          lo = Math.max(start, id.counter),
          hi = Math.min(start + n, id.counter + count);
        buffer.append(s.clientIndices[i], s.seqNums[i], start, lo - start);
        buffer.append(s.clientIndices[i], s.seqNums[i], lo, -(hi - lo));
        buffer.append(s.clientIndices[i], s.seqNums[i], hi, start + n - hi);
      }
      result.push(...buffer.finish(this.clients, this.options));
    }
    return result
      ? new NativeF08(this.clients, result, undefined, this.options)
      : this;
  }
  save(): SavedIdList {
    const result: SavedIdList = [];
    for (const chunk of this.chunks)
      for (let i = chunk.from; i < chunk.to; i++) {
        const s = chunk.columns,
          bunchId = join(this.clients, s.clientIndices[i], s.seqNums[i]),
          startCounter = chunk.starts[i],
          count = Math.abs(s.counts[i]),
          isDeleted = s.counts[i] < 0,
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
