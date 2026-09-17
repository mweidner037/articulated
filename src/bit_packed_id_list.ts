import { ColumnarIdList, SavedColumnarIdList } from "./columnar_id_list";
import { SavedIdList } from "./saved_id_list";

/**
 * Experimental version 2: dictionary plus three independent BSON Binary fields.
 * Fixed widths: 13-bit indexes, 11-bit starts, 12-bit zigzag signed counts.
 * Values are packed low-bit-first, with zero padding only at each column's end.
 * No column-type metadata, offsets, or whole-snapshot binary envelope.
 */
export interface SavedBitPackedColumnarIdList {
  readonly version: 2;
  readonly bunchIds: readonly string[];
  readonly bunchIndexes: Uint8Array;
  readonly startCounters: Uint8Array;
  readonly signedCounts: Uint8Array;
}

const INDEX_BITS = 13;
const START_BITS = 11;
const COUNT_BITS = 12;

function packColumn(values: readonly number[], width: number): Uint8Array {
  const bytes = new Uint8Array(Math.ceil((values.length * width) / 8));
  for (let i = 0; i < values.length; i++) {
    let value = values[i];
    if (!Number.isInteger(value) || value < 0 || value >= 2 ** width)
      throw new RangeError(`Value at run ${i} does not fit ${width} bits`);
    let position = i * width;
    let remaining = width;
    while (remaining > 0) {
      const shift = position % 8;
      const take = Math.min(8 - shift, remaining);
      bytes[Math.floor(position / 8)] += (value % 2 ** take) * 2 ** shift;
      value = Math.floor(value / 2 ** take);
      position += take;
      remaining -= take;
    }
  }
  return bytes;
}

/** Reads at most three bytes; never materializes an unpacked column. */
function readColumn(bytes: Uint8Array, index: number, width: number): number {
  let position = index * width;
  let remaining = width;
  let multiplier = 1;
  let value = 0;
  while (remaining > 0) {
    const shift = position % 8;
    const take = Math.min(8 - shift, remaining);
    value +=
      (Math.floor(bytes[Math.floor(position / 8)] / 2 ** shift) % 2 ** take) *
      multiplier;
    position += take;
    remaining -= take;
    multiplier *= 2 ** take;
  }
  return value;
}

function validateColumn(bytes: Uint8Array, width: number, runs: number) {
  if (bytes.length !== Math.ceil((runs * width) / 8))
    throw new Error("Bit-packed columns have invalid or mismatched lengths");
  const usedBits = (runs * width) % 8;
  if (usedBits !== 0 && bytes[bytes.length - 1] >= 2 ** usedBits)
    throw new Error("Bit-packed column has nonzero padding bits");
}

function signedCode(count: number): number {
  if (count < -2048 || count > 2047 || count === 0)
    throw new RangeError(
      "Bit-packed signed count must be -2048..2047, nonzero"
    );
  return count < 0 ? -2 * count - 1 : 2 * count;
}

function decodeCount(code: number): number {
  return code % 2 === 0 ? code / 2 : -(code + 1) / 2;
}

/**
 * Experimental read-only snapshot that retains bit-packed columns in JS.
 * Maximum 8192 dictionary entries, start counters 0..2047, signed counts
 * -2048..2047 (nonzero). Throws on overflow; never silently truncates or widens.
 * Existing ColumnarIdList/saveBinary APIs keep their full integer ranges.
 * This does not change the live IdList editing tree.
 */
export class BitPackedIdList implements Iterable<SavedIdList[number]> {
  private constructor(
    private readonly bunches: readonly string[],
    private readonly indexes: Uint8Array,
    private readonly starts: Uint8Array,
    private readonly counts: Uint8Array
  ) {}

  /** Pack readable columns. Unpacked intermediate data is not retained. */
  static load(saved: SavedColumnarIdList): BitPackedIdList {
    return BitPackedIdList.pack(ColumnarIdList.load(saved));
  }

  /** Pack existing saved runs; ignores empty runs, like IdList.load. */
  static fromSaved(saved: SavedIdList): BitPackedIdList {
    return BitPackedIdList.pack(ColumnarIdList.fromSaved(saved));
  }

  private static pack(snapshot: ColumnarIdList): BitPackedIdList {
    if (snapshot.bunchCount > 2 ** INDEX_BITS)
      throw new RangeError("Bit-packed dictionary exceeds 8192 entries");
    const columns = snapshot.toJSON();
    return new BitPackedIdList(
      columns.bunchIds,
      packColumn(columns.bunchIndexes, INDEX_BITS),
      packColumn(columns.startCounters, START_BITS),
      packColumn(columns.signedCounts.map(signedCode), COUNT_BITS)
    );
  }

  /**
   * Load raw bytes (including Mongo driver Buffer slices) without unpacking.
   * Inputs are copied and validated. End padding must be zero; malformed lengths,
   * missing dictionary references and zero counts are rejected.
   */
  static loadBinary(saved: SavedBitPackedColumnarIdList): BitPackedIdList {
    if (
      !saved ||
      saved.version !== 2 ||
      !Array.isArray(saved.bunchIds) ||
      ![saved.bunchIndexes, saved.startCounters, saved.signedCounts].every(
        (column) => column instanceof Uint8Array
      )
    )
      throw new Error("Invalid bit-packed IdList format");
    if (saved.bunchIds.length > 2 ** INDEX_BITS)
      throw new RangeError("Bit-packed dictionary exceeds 8192 entries");
    for (const id of saved.bunchIds)
      if (typeof id !== "string")
        throw new Error("Invalid bit-packed dictionary");

    const snapshot = new BitPackedIdList(
      saved.bunchIds.slice(),
      new Uint8Array(saved.bunchIndexes),
      new Uint8Array(saved.startCounters),
      new Uint8Array(saved.signedCounts)
    );
    validateColumn(snapshot.indexes, INDEX_BITS, snapshot.runCount);
    validateColumn(snapshot.starts, START_BITS, snapshot.runCount);
    validateColumn(snapshot.counts, COUNT_BITS, snapshot.runCount);
    for (let i = 0; i < snapshot.runCount; i++) {
      if (readColumn(snapshot.indexes, i, INDEX_BITS) >= snapshot.bunchCount)
        throw new Error("Bit-packed run references a missing dictionary entry");
      if (readColumn(snapshot.counts, i, COUNT_BITS) === 0)
        throw new Error("Bit-packed run has a zero count");
    }
    return snapshot;
  }

  get runCount(): number {
    // Width > 7 means end padding cannot be mistaken for an extra value.
    return Math.floor((this.counts.length * 8) / COUNT_BITS);
  }
  get bunchCount(): number {
    return this.bunches.length;
  }
  /** Numeric buffers only; excludes dictionary strings and JS object overhead. */
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
    return this.bunches[readColumn(this.indexes, index, INDEX_BITS)];
  }
  startCounterAt(index: number): number {
    this.checkIndex(index);
    return readColumn(this.starts, index, START_BITS);
  }
  countAt(index: number): number {
    this.checkIndex(index);
    return Math.abs(decodeCount(readColumn(this.counts, index, COUNT_BITS)));
  }
  isDeletedAt(index: number): boolean {
    this.checkIndex(index);
    return readColumn(this.counts, index, COUNT_BITS) % 2 === 1;
  }

  /** Allocates one decoded run; scalar accessors above allocate no run objects. */
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

  /** Same packed bytes for Mongo and JS. Every returned array is an owned copy. */
  toBinary(): SavedBitPackedColumnarIdList {
    return {
      version: 2,
      bunchIds: this.bunches.slice(),
      bunchIndexes: this.indexes.slice(),
      startCounters: this.starts.slice(),
      signedCounts: this.counts.slice(),
    };
  }

  /** Explicitly unpack to the existing readable version-1 JSON column schema. */
  toJSON(): SavedColumnarIdList {
    const indexes: number[] = [],
      starts: number[] = [],
      counts: number[] = [];
    for (let i = 0; i < this.runCount; i++) {
      indexes.push(readColumn(this.indexes, i, INDEX_BITS));
      starts.push(readColumn(this.starts, i, START_BITS));
      counts.push(decodeCount(readColumn(this.counts, i, COUNT_BITS)));
    }
    return {
      version: 1,
      bunchIds: this.bunches.slice(),
      bunchIndexes: indexes,
      startCounters: starts,
      signedCounts: counts,
    };
  }
}
