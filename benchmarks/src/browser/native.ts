import type { ElementId, SavedIdList } from "articulated";
import type { toClientIndexOmit } from "../algorithms/id_list_saved_states";
import type { BenchmarkList } from "./list-interface";

export type F08 = ReturnType<typeof toClientIndexOmit>;
type Visit = (
  client: number,
  seq: number,
  start: number,
  count: number,
) => boolean | void;
function natural(n: number) {
  if (!Number.isSafeInteger(n) || n < 0)
    throw new Error("Invalid nonnegative integer");
}
function split(id: string): [string, number] {
  const p = id.lastIndexOf("_");
  const suffix = id.slice(p + 1),
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
const join = (state: F08, client: number, seq: number) =>
  `${state.clientIds[client]}_${seq.toString(36)}`;

/** Traverse the actual F08 columns, reconstructing counters as needed.
 * No expanded starts, run objects, editing tree or lookup index is retained. */
function scan(s: F08, visit: Visit) {
  const next = s.clientIds.map(() => new Map<number, number>());
  let exception = 0,
    exceptionRow = s.startCounterIndexes[0] ?? -1;
  for (let i = 0; i < s.counts.length; i++) {
    const c = s.clientIndices[i],
      seq = s.seqNums[i],
      count = s.counts[i];
    let start = next[c].get(seq) ?? 0;
    if (i === exceptionRow) {
      start = s.startCounters[exception++];
      exceptionRow =
        exception === s.startCounterIndexes.length
          ? -1
          : exceptionRow + s.startCounterIndexes[exception];
    }
    next[c].set(seq, start + Math.abs(count));
    if (visit(c, seq, start, count) === false) break;
  }
}

/** Streaming column writer; canonicalizes adjacent runs without an object-run adapter. */
class Writer {
  readonly state: F08;
  length = 0;
  private next: Map<number, number>[];
  private lastException = 0;
  private pending: [number, number, number, number] | null = null;
  constructor(clients: string[]) {
    this.state = {
      clientIds: [...clients],
      clientIndices: [],
      seqNums: [],
      startCounterIndexes: [],
      startCounters: [],
      counts: [],
    };
    this.next = clients.map(() => new Map());
  }
  append(c: number, seq: number, start: number, count: number) {
    if (count === 0) return;
    const p = this.pending;
    if (
      p &&
      p[0] === c &&
      p[1] === seq &&
      p[2] + Math.abs(p[3]) === start &&
      Math.sign(p[3]) === Math.sign(count)
    )
      p[3] += count;
    else {
      this.flush();
      this.pending = [c, seq, start, count];
    }
  }
  private flush() {
    const p = this.pending;
    if (!p) return;
    const [c, seq, start, count] = p,
      s = this.state;
    if (start !== (this.next[c].get(seq) ?? 0)) {
      s.startCounterIndexes.push(s.counts.length - this.lastException);
      s.startCounters.push(start);
      this.lastException = s.counts.length;
    }
    s.clientIndices.push(c);
    s.seqNums.push(seq);
    s.counts.push(count);
    this.next[c].set(seq, start + Math.abs(count));
    if (count > 0) this.length += count;
    this.pending = null;
  }
  finish() {
    this.flush();
    return this.state;
  }
}

/** Experimental immutable list backed directly by the F08 wire columns.
 * Takes ownership of decoded input: callers must not mutate its arrays afterward.
 * load validates; lookups scan; edits stream a new set of columns (O(runs)).
 * This intentionally tests EXACT wire-layout adoption, not an indexed/chunked design.
 */
export class NativeF08 implements BenchmarkList {
  private constructor(
    private readonly state: F08,
    readonly length: number,
  ) {}
  static load(s: F08): NativeF08 {
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
    let row = 0;
    startCounterIndexes.forEach((delta, i) => {
      natural(delta);
      natural(startCounters[i]);
      row += delta;
      if ((i > 0 && delta === 0) || row >= counts.length)
        throw new Error("Invalid counter exceptions");
    });
    counts.forEach((count, i) => {
      natural(clientIndices[i]);
      natural(seqNums[i]);
      if (
        clientIndices[i] >= clientIds.length ||
        !Number.isSafeInteger(count) ||
        count === 0
      )
        throw new Error("Invalid run");
    });
    // Temporary interval validation is included in load timing, then discarded.
    const intervals = clientIds.map(
      () => new Map<number, [number, number][]>(),
    );
    let length = 0;
    scan(s, (c, seq, start, count) => {
      const end = start + Math.abs(count);
      natural(end);
      const ranges = intervals[c].get(seq) ?? [];
      ranges.push([start, end]);
      intervals[c].set(seq, ranges);
      if (count > 0) length += count;
    });
    natural(length);
    for (const client of intervals)
      for (const ranges of client.values()) {
        ranges.sort((a, b) => a[0] - b[0]);
        for (let i = 1; i < ranges.length; i++)
          if (ranges[i][0] < ranges[i - 1][1]) throw new Error("Duplicate IDs");
      }
    return new NativeF08(s, length);
  }
  /** Borrowed read-only-by-contract reference; used to prove zero-copy adoption. */
  get wireState(): Readonly<F08> {
    return this.state;
  }
  at(index: number): ElementId {
    natural(index);
    if (index >= this.length) throw new Error("Index out of bounds");
    let result!: ElementId;
    scan(this.state, (c, seq, start, count) => {
      if (count <= 0) return;
      if (index < count) {
        result = { bunchId: join(this.state, c, seq), counter: start + index };
        return false;
      }
      index -= count;
    });
    return result;
  }
  indexOf(id: ElementId, bias: "none" | "left" | "right" = "none"): number {
    const [client, sequence] = split(id.bunchId),
      clientIndex = this.state.clientIds.indexOf(client);
    let seen = 0,
      result: number | undefined;
    scan(this.state, (c, seq, start, count) => {
      if (
        c === clientIndex &&
        seq === sequence &&
        start <= id.counter &&
        id.counter < start + Math.abs(count)
      ) {
        result =
          count > 0
            ? seen + id.counter - start
            : bias === "none"
              ? -1
              : seen - (bias === "left" ? 1 : 0);
        return false;
      }
      if (count > 0) seen += count;
    });
    if (result === undefined) throw new Error("Unknown ID");
    return result;
  }
  insertAfter(before: ElementId | null, id: ElementId, count = 1): NativeF08 {
    natural(count);
    natural(id.counter);
    natural(id.counter + count);
    const [client, sequence] = split(id.bunchId);
    const clients = [...this.state.clientIds];
    let ci = clients.indexOf(client);
    if (ci < 0) {
      ci = clients.length;
      clients.push(client);
    }
    const anchor = before ? split(before.bunchId) : null;
    const ac = anchor ? clients.indexOf(anchor[0]) : -1;
    const writer = new Writer(clients);
    let found = before === null;
    if (found) writer.append(ci, sequence, id.counter, count);
    scan(this.state, (c, seq, start, n) => {
      const end = start + Math.abs(n);
      if (
        count > 0 &&
        c === ci &&
        seq === sequence &&
        start < id.counter + count &&
        id.counter < end
      )
        throw new Error("Duplicate IDs");
      if (
        before &&
        c === ac &&
        seq === anchor![1] &&
        start <= before.counter &&
        before.counter < end
      ) {
        const left = before.counter - start + 1,
          sign = Math.sign(n);
        writer.append(c, seq, start, sign * left);
        writer.append(ci, sequence, id.counter, count);
        writer.append(c, seq, start + left, sign * (Math.abs(n) - left));
        found = true;
      } else writer.append(c, seq, start, n);
    });
    if (!found) throw new Error("Unknown anchor");
    if (count === 0) return this;
    return new NativeF08(writer.finish(), this.length + count);
  }
  delete(id: ElementId, count = 1): NativeF08 {
    natural(count);
    natural(id.counter);
    natural(id.counter + count);
    if (!count) return this;
    const [client, sequence] = split(id.bunchId),
      ci = this.state.clientIds.indexOf(client);
    if (ci < 0) return this;
    const writer = new Writer(this.state.clientIds);
    let removed = 0;
    scan(this.state, (c, seq, start, n) => {
      const lo = Math.max(start, id.counter),
        hi = Math.min(start + n, id.counter + count);
      if (c === ci && seq === sequence && n > 0 && lo < hi) {
        writer.append(c, seq, start, lo - start);
        writer.append(c, seq, lo, -(hi - lo));
        writer.append(c, seq, hi, start + n - hi);
        removed += hi - lo;
      } else writer.append(c, seq, start, n);
    });
    return removed
      ? new NativeF08(writer.finish(), this.length - removed)
      : this;
  }
  save(): SavedIdList {
    const result: SavedIdList = [];
    scan(this.state, (c, seq, startCounter, count) => {
      const bunchId = join(this.state, c, seq),
        isDeleted = count < 0,
        size = Math.abs(count),
        last = result.at(-1);
      if (
        last &&
        last.bunchId === bunchId &&
        last.isDeleted === isDeleted &&
        last.startCounter + last.count === startCounter
      )
        result[result.length - 1] = { ...last, count: last.count + size };
      else result.push({ bunchId, startCounter, count: size, isDeleted });
    });
    return result;
  }
}
