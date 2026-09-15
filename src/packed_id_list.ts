import { SavedIdList } from "./saved_id_list";

const HEADER_SIZE = 20;
const MAGIC = 0x4c444941; // "AIDL", little endian.
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type Width = 1 | 2 | 4 | 8;

function widthFor(value: number): Width {
  if (value <= 0xff) return 1;
  if (value <= 0xffff) return 2;
  if (value <= 0xffffffff) return 4;
  return 8;
}

function read(view: DataView, offset: number, width: Width): number {
  switch (width) {
    case 1:
      return view.getUint8(offset);
    case 2:
      return view.getUint16(offset, true);
    case 4:
      return view.getUint32(offset, true);
    case 8:
      return view.getFloat64(offset, true);
  }
}

function write(view: DataView, offset: number, width: Width, value: number) {
  switch (width) {
    case 1:
      view.setUint8(offset, value);
      break;
    case 2:
      view.setUint16(offset, value, true);
      break;
    case 4:
      view.setUint32(offset, value, true);
      break;
    case 8:
      view.setFloat64(offset, value, true);
      break;
  }
}

function checkRange(start: number, count: number) {
  if (
    !Number.isSafeInteger(start) ||
    start < 0 ||
    !Number.isSafeInteger(count) ||
    count < 0 ||
    (count > 0 && count - 1 > Number.MAX_SAFE_INTEGER - start)
  )
    throw new Error("Invalid packed run counter range");
}

function encodeId(id: string): Uint8Array {
  if (uuidPattern.test(id)) {
    const hex = id.replace(/-/g, "");
    const result = new Uint8Array(17);
    result[0] = 1;
    for (let i = 0; i < 16; i++)
      result[i + 1] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
    return result;
  }
  const utf8 = encoder.encode(id);
  if (decoder.decode(utf8) === id) {
    const result = new Uint8Array(utf8.length + 1);
    result.set(utf8, 1); // Tag 0: UTF-8.
    return result;
  }
  // Preserve lone UTF-16 surrogates, which TextEncoder would replace.
  const result = new Uint8Array(1 + 2 * id.length);
  result[0] = 2;
  const view = new DataView(result.buffer);
  for (let i = 0; i < id.length; i++)
    view.setUint16(1 + 2 * i, id.charCodeAt(i), true);
  return result;
}

function decodeId(bytes: Uint8Array): string {
  switch (bytes[0]) {
    case 0:
      return decoder.decode(bytes.subarray(1));
    case 1: {
      if (bytes.length !== 17) throw new Error("Invalid packed UUID");
      let hex = "";
      for (let i = 1; i < 17; i++)
        hex += bytes[i].toString(16).padStart(2, "0");
      // join materializes a flat string rather than retaining a tree of slices
      // and concatenations for each cached UUID.
      return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20),
      ].join("-");
    }
    case 2: {
      if (bytes.length % 2 !== 1)
        throw new Error("Invalid packed UTF-16 string");
      const view = new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength
      );
      let result = "";
      for (let i = 1; i < bytes.length; i += 2)
        result += String.fromCharCode(view.getUint16(i, true));
      return result;
    }
    default:
      throw new Error("Invalid packed ID encoding");
  }
}

/**
 * A compact, read-only snapshot of saved runs. Numeric columns and deletion bits
 * stay in one binary buffer; ID strings are decoded and cached on first access.
 * This is a snapshot, not the mutable/persistent editing tree used by IdList.
 * See binary_snapshots.md for the versioned on-disk format.
 */
export class PackedIdList implements Iterable<SavedIdList[number]> {
  private readonly view: DataView;
  private ids?: (string | undefined)[];
  private readonly indexWidth: Width;
  private readonly startWidth: Width;
  private readonly countWidth: Width;
  private readonly dictionaryOffset: number;
  private readonly indexOffset: number;
  private readonly startOffset: number;
  private readonly countOffset: number;
  private readonly deletedOffset: number;
  readonly runCount: number;
  readonly bunchCount: number;

  private constructor(private readonly bytes: Uint8Array) {
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (
      bytes.byteLength < HEADER_SIZE ||
      this.view.getUint32(0, true) !== MAGIC
    ) {
      throw new Error("Invalid packed IdList header");
    }
    if (bytes[4] !== 1)
      throw new Error(`Unsupported packed IdList version: ${bytes[4]}`);
    for (const width of bytes.subarray(5, 8)) {
      if (![1, 2, 4, 8].includes(width))
        throw new Error("Invalid packed column width");
    }
    this.indexWidth = bytes[5] as Width;
    this.startWidth = bytes[6] as Width;
    this.countWidth = bytes[7] as Width;
    this.runCount = this.view.getUint32(8, true);
    this.bunchCount = this.view.getUint32(12, true);
    this.dictionaryOffset = HEADER_SIZE + 4 * (this.bunchCount + 1);
    this.indexOffset = this.dictionaryOffset + this.view.getUint32(16, true);
    this.startOffset = this.indexOffset + this.runCount * this.indexWidth;
    this.countOffset = this.startOffset + this.runCount * this.startWidth;
    this.deletedOffset = this.countOffset + this.runCount * this.countWidth;
    if (
      this.deletedOffset + Math.ceil(this.runCount / 8) !==
      bytes.byteLength
    ) {
      throw new Error("Invalid packed IdList byte length");
    }
    let previous = this.view.getUint32(HEADER_SIZE, true);
    if (previous !== 0) throw new Error("Invalid packed dictionary offset");
    for (let i = 0; i < this.bunchCount; i++) {
      const next = this.view.getUint32(HEADER_SIZE + 4 * (i + 1), true);
      if (next <= previous || this.dictionaryOffset + next > this.indexOffset) {
        throw new Error("Invalid packed dictionary offset");
      }
      // Validate text without retaining decoded strings until they are accessed.
      decodeId(
        bytes.subarray(
          this.dictionaryOffset + previous,
          this.dictionaryOffset + next
        )
      );
      previous = next;
    }
    if (this.dictionaryOffset + previous !== this.indexOffset)
      throw new Error("Invalid packed dictionary length");
    for (let i = 0; i < this.runCount; i++) {
      const index = read(
        this.view,
        this.indexOffset + i * this.indexWidth,
        this.indexWidth
      );
      if (!Number.isSafeInteger(index) || index >= this.bunchCount || index < 0)
        throw new Error("Invalid packed bunch index");
      checkRange(this.startCounterAt(i), this.countAt(i));
    }
    if (
      this.runCount % 8 &&
      bytes[bytes.length - 1] >> this.runCount % 8 !== 0
    ) {
      throw new Error("Invalid packed deletion padding");
    }
  }

  /** Encode saved runs. The caller's objects are not retained. */
  static fromSaved(saved: SavedIdList): PackedIdList {
    const ids = new Map<string, number>();
    const dictionary: Uint8Array[] = [];
    let dictionarySize = 0,
      maxStart = 0,
      maxCount = 0;
    for (const run of saved) {
      checkRange(run.startCounter, run.count);
      if (typeof run.bunchId !== "string" || typeof run.isDeleted !== "boolean")
        throw new Error("Invalid packed run");
      if (!ids.has(run.bunchId)) {
        const encoded = encodeId(run.bunchId);
        ids.set(run.bunchId, ids.size);
        dictionary.push(encoded);
        dictionarySize += encoded.byteLength;
      }
      maxStart = Math.max(maxStart, run.startCounter);
      maxCount = Math.max(maxCount, run.count);
    }
    if (
      saved.length > 0xffffffff ||
      ids.size > 0xffffffff ||
      dictionarySize > 0xffffffff
    ) {
      throw new Error("Packed IdList is too large");
    }
    const iw = widthFor(Math.max(0, ids.size - 1)),
      sw = widthFor(maxStart),
      cw = widthFor(maxCount);
    const dictionaryOffset = HEADER_SIZE + 4 * (ids.size + 1);
    const indexOffset = dictionaryOffset + dictionarySize;
    const startOffset = indexOffset + saved.length * iw;
    const countOffset = startOffset + saved.length * sw;
    const deletedOffset = countOffset + saved.length * cw;
    const bytes = new Uint8Array(deletedOffset + Math.ceil(saved.length / 8));
    const view = new DataView(bytes.buffer);
    view.setUint32(0, MAGIC, true);
    bytes.set([1, iw, sw, cw], 4);
    view.setUint32(8, saved.length, true);
    view.setUint32(12, ids.size, true);
    view.setUint32(16, dictionarySize, true);
    let position = 0;
    dictionary.forEach((id, i) => {
      view.setUint32(HEADER_SIZE + 4 * i, position, true);
      bytes.set(id, dictionaryOffset + position);
      position += id.byteLength;
    });
    view.setUint32(HEADER_SIZE + 4 * dictionary.length, position, true);
    saved.forEach((run, i) => {
      write(view, indexOffset + i * iw, iw, ids.get(run.bunchId)!);
      write(view, startOffset + i * sw, sw, run.startCounter);
      write(view, countOffset + i * cw, cw, run.count);
      if (run.isDeleted) bytes[deletedOffset + Math.floor(i / 8)] |= 1 << i % 8;
    });
    return new PackedIdList(bytes);
  }

  /**
   * Validate and load binary v1. Copies by default to own a compact buffer.
   * With copy:false, the caller must not mutate the bytes for this view's lifetime;
   * a small slice may also keep its entire backing buffer alive.
   */
  static load(
    bytes: Uint8Array,
    options: { copy?: boolean } = {}
  ): PackedIdList {
    return new PackedIdList(
      options.copy === false ? bytes : new Uint8Array(bytes)
    );
  }

  /** A copy suitable for BSON Binary or persistent snapshot storage. */
  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }

  get byteLength(): number {
    return this.bytes.byteLength;
  }

  private checkIndex(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.runCount)
      throw new RangeError("Run index out of bounds");
  }

  bunchIdAt(index: number): string {
    this.checkIndex(index);
    const idIndex = read(
      this.view,
      this.indexOffset + index * this.indexWidth,
      this.indexWidth
    );
    const ids =
      this.ids ?? (this.ids = new Array<string | undefined>(this.bunchCount));
    let id = ids[idIndex];
    if (id === undefined) {
      const start = this.view.getUint32(HEADER_SIZE + 4 * idIndex, true);
      const end = this.view.getUint32(HEADER_SIZE + 4 * (idIndex + 1), true);
      id = decodeId(
        this.bytes.subarray(
          this.dictionaryOffset + start,
          this.dictionaryOffset + end
        )
      );
      ids[idIndex] = id;
    }
    return id;
  }

  startCounterAt(index: number): number {
    this.checkIndex(index);
    return read(
      this.view,
      this.startOffset + index * this.startWidth,
      this.startWidth
    );
  }

  countAt(index: number): number {
    this.checkIndex(index);
    return read(
      this.view,
      this.countOffset + index * this.countWidth,
      this.countWidth
    );
  }

  isDeletedAt(index: number): boolean {
    this.checkIndex(index);
    return (
      (this.bytes[this.deletedOffset + Math.floor(index / 8)] &
        (1 << index % 8)) !==
      0
    );
  }

  /** Materializes one run; use scalar accessors to avoid even this allocation. */
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

  /** Explicitly expands the snapshot into the existing JSON representation. */
  toSaved(): SavedIdList {
    return [...this];
  }
}
