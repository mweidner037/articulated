import { SavedIdList } from "./saved_id_list";

/** Readable JSON storage for a columnar snapshot. Counts are nonzero and signed. */
export interface SavedColumnarIdList {
  readonly version: 1;
  readonly bunchIds: readonly string[];
  readonly bunchIndexes: readonly number[];
  readonly startCounters: readonly number[];
  /** Negative means deleted; absolute value is the number of IDs. */
  readonly signedCounts: readonly number[];
}

type UnsignedColumn = Uint8Array | Uint16Array | Uint32Array | Float64Array;
type SignedColumn = Int8Array | Int16Array | Int32Array | Float64Array;

function unsigned(values: readonly number[]): UnsignedColumn {
  let max = 0;
  for (const value of values) max = Math.max(max, value);
  if (max <= 0xff) return new Uint8Array(values);
  if (max <= 0xffff) return new Uint16Array(values);
  if (max <= 0xffffffff) return new Uint32Array(values);
  return new Float64Array(values);
}

function signed(values: readonly number[]): SignedColumn {
  let min = 0,
    max = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (min >= -128 && max <= 127) return new Int8Array(values);
  if (min >= -32768 && max <= 32767) return new Int16Array(values);
  if (min >= -2147483648 && max <= 2147483647) return new Int32Array(values);
  return new Float64Array(values);
}

/**
 * A read-only snapshot with a JSON persistence format and typed numeric columns
 * in JS. Stores each ID once as a string. No binary envelope or ID codec is used.
 * Loading does not retain the source numeric arrays; release the source JSON
 * object to realize the retained-memory saving. This is not an editing tree.
 */
export class ColumnarIdList implements Iterable<SavedIdList[number]> {
  private constructor(
    private readonly bunches: readonly string[],
    private readonly indexes: UnsignedColumn,
    private readonly starts: UnsignedColumn,
    private readonly counts: SignedColumn
  ) {}

  /** Validate before converting, so typed arrays cannot silently truncate values. */
  static load(saved: SavedColumnarIdList): ColumnarIdList {
    if (
      !saved ||
      saved.version !== 1 ||
      ![
        saved.bunchIds,
        saved.bunchIndexes,
        saved.startCounters,
        saved.signedCounts,
      ].every(Array.isArray)
    ) {
      throw new Error("Invalid columnar IdList format");
    }
    if (
      saved.bunchIndexes.length !== saved.startCounters.length ||
      saved.bunchIndexes.length !== saved.signedCounts.length
    ) {
      throw new Error("Columnar IdList columns have different lengths");
    }
    for (const id of saved.bunchIds) {
      if (typeof id !== "string") throw new Error("Invalid columnar ID");
    }
    for (let k = 0; k < saved.bunchIndexes.length; k++) {
      const index = saved.bunchIndexes[k],
        start = saved.startCounters[k],
        count = Math.abs(saved.signedCounts[k]);
      if (
        !Number.isSafeInteger(index) ||
        index < 0 ||
        index >= saved.bunchIds.length
      )
        throw new Error("Invalid columnar bunch index");
      if (
        !Number.isSafeInteger(start) ||
        start < 0 ||
        !Number.isSafeInteger(saved.signedCounts[k]) ||
        count === 0 ||
        count - 1 > Number.MAX_SAFE_INTEGER - start
      ) {
        throw new Error("Invalid columnar run counter range");
      }
    }
    return new ColumnarIdList(
      saved.bunchIds.slice(),
      unsigned(saved.bunchIndexes),
      unsigned(saved.startCounters),
      signed(saved.signedCounts)
    );
  }

  /**
   * Convert existing saved runs. Zero-count entries are ignored, as by IdList.load;
   * JSON cannot preserve the distinction between 0 and -0 for deleted empty runs.
   */
  static fromSaved(saved: SavedIdList): ColumnarIdList {
    const ids = new Map<string, number>();
    const indexes: number[] = [],
      starts: number[] = [],
      counts: number[] = [];
    for (const run of saved) {
      if (
        typeof run.bunchId !== "string" ||
        typeof run.isDeleted !== "boolean" ||
        !Number.isSafeInteger(run.startCounter) ||
        run.startCounter < 0 ||
        !Number.isSafeInteger(run.count) ||
        run.count < 0
      ) {
        throw new Error("Invalid columnar saved run");
      }
      if (run.count === 0) continue;
      if (!ids.has(run.bunchId)) ids.set(run.bunchId, ids.size);
      indexes.push(ids.get(run.bunchId)!);
      starts.push(run.startCounter);
      counts.push(run.isDeleted ? -run.count : run.count);
    }
    return ColumnarIdList.load({
      version: 1,
      bunchIds: [...ids.keys()],
      bunchIndexes: indexes,
      startCounters: starts,
      signedCounts: counts,
    });
  }

  get runCount(): number {
    return this.indexes.length;
  }
  get bunchCount(): number {
    return this.bunches.length;
  }
  /** Numeric backing buffers only; excludes JS strings and object overhead. */
  get numericByteLength(): number {
    return (
      this.indexes.byteLength + this.starts.byteLength + this.counts.byteLength
    );
  }

  private checkIndex(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.runCount)
      throw new RangeError("Run index out of bounds");
  }

  bunchIdAt(index: number): string {
    this.checkIndex(index);
    return this.bunches[this.indexes[index]];
  }

  startCounterAt(index: number): number {
    this.checkIndex(index);
    return this.starts[index];
  }

  countAt(index: number): number {
    this.checkIndex(index);
    return Math.abs(this.counts[index]);
  }

  isDeletedAt(index: number): boolean {
    this.checkIndex(index);
    return this.counts[index] < 0;
  }

  at(index: number): SavedIdList[number] {
    return {
      bunchId: this.bunchIdAt(index),
      startCounter: this.startCounterAt(index),
      count: this.countAt(index),
      isDeleted: this.isDeletedAt(index),
    };
  }

  *[Symbol.iterator](): IterableIterator<SavedIdList[number]> {
    for (let i = 0; i < this.runCount; i++) yield this.at(i);
  }

  toSaved(): SavedIdList {
    return [...this];
  }

  /** Plain JSON arrays for MongoDB or JSON.stringify; returned arrays are copies. */
  toJSON(): SavedColumnarIdList {
    return {
      version: 1,
      bunchIds: this.bunches.slice(),
      bunchIndexes: Array.from(this.indexes),
      startCounters: Array.from(this.starts),
      signedCounts: Array.from(this.counts),
    };
  }
}
