import type { SavedIdList } from "articulated";
import { Binary } from "bson";
import assert from "node:assert/strict";
import {
  fromTransposedOmit,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";
import { packFloat64, readFloat64 } from "./flat-f64-formats";
import type { SweepFormat } from "./storage-sweep-formats";

/**
 * Protobuf-compatible varints for the full JavaScript safe-integer range.
 *
 * Unsigned values use the uint64 wire format; signed values use sint64
 * (zigzag). The byte layout matches protobufjs's uint64s/sint64s packed
 * encoding, but numbers stay plain numbers instead of Long objects.
 */
export class VarintWriter {
  private bytes = new Uint8Array(256);
  length = 0;

  private reserve(extra: number) {
    if (this.length + extra <= this.bytes.length) return;
    let size = this.bytes.length * 2;
    while (size < this.length + extra) size *= 2;
    const next = new Uint8Array(size);
    next.set(this.bytes.subarray(0, this.length));
    this.bytes = next;
  }

  uint(value: number) {
    assert(Number.isSafeInteger(value) && value >= 0, "Expected uint");
    this.reserve(8);
    while (value >= 128) {
      this.bytes[this.length++] = (value % 128) | 128;
      value = Math.floor(value / 128);
    }
    this.bytes[this.length++] = value;
  }

  /** Zigzag: n >= 0 -> 2n, n < 0 -> 2|n| - 1, without exceeding 2^53. */
  sint(value: number) {
    assert(Number.isSafeInteger(value), "Expected safe integer");
    const sign = value < 0 ? 1 : 0;
    // zigzag(value) = 2 * q + sign, with q <= MAX_SAFE_INTEGER.
    const q = sign ? -value - 1 : value;
    this.reserve(9);
    const low = (q % 64) * 2 + sign;
    const rest = Math.floor(q / 64);
    if (rest === 0) {
      this.bytes[this.length++] = low;
      return;
    }
    this.bytes[this.length++] = low | 128;
    this.uint(rest);
  }

  /** Length-delimited field header + raw bytes (protobuf wire type 2). */
  field(fieldNumber: number, payload: Uint8Array) {
    if (payload.length === 0) return;
    this.uint(fieldNumber * 8 + 2);
    this.uint(payload.length);
    this.reserve(payload.length);
    this.bytes.set(payload, this.length);
    this.length += payload.length;
  }

  /** Length-delimited entry that is written even when empty (repeated string). */
  string(fieldNumber: number, payload: Uint8Array) {
    this.uint(fieldNumber * 8 + 2);
    this.uint(payload.length);
    this.reserve(payload.length);
    this.bytes.set(payload, this.length);
    this.length += payload.length;
  }

  finish(): Uint8Array {
    return this.bytes.slice(0, this.length);
  }
}

export class VarintReader {
  pos: number;
  constructor(
    readonly bytes: Uint8Array,
    start = 0,
    readonly end = bytes.length,
  ) {
    this.pos = start;
  }

  uint(): number {
    let result = 0;
    let scale = 1;
    for (let i = 0; i < 8; i++) {
      assert(this.pos < this.end, "Truncated varint");
      const byte = this.bytes[this.pos++];
      result += (byte & 127) * scale;
      if (byte < 128) {
        assert(Number.isSafeInteger(result), "Varint exceeds safe integer");
        return result;
      }
      scale *= 128;
    }
    throw new Error("Varint exceeds safe integer");
  }

  sint(): number {
    assert(this.pos < this.end, "Truncated varint");
    const first = this.bytes[this.pos++];
    const sign = first & 1;
    let q = (first & 127) >>> 1;
    if (first >= 128) q += this.uint() * 64;
    assert(Number.isSafeInteger(q), "Varint exceeds safe integer");
    return sign ? -q - 1 : q;
  }
}

export function packUintVarints(values: ArrayLike<number>): Uint8Array {
  const writer = new VarintWriter();
  for (let i = 0; i < values.length; i++) writer.uint(values[i]);
  return writer.finish();
}
export function packSintVarints(values: ArrayLike<number>): Uint8Array {
  const writer = new VarintWriter();
  for (let i = 0; i < values.length; i++) writer.sint(values[i]);
  return writer.finish();
}
function readAll(
  bytes: Uint8Array,
  signed: boolean,
  start = 0,
  end = bytes.length,
): number[] {
  const reader = new VarintReader(bytes, start, end);
  const out: number[] = [];
  while (reader.pos < end) out.push(signed ? reader.sint() : reader.uint());
  return out;
}
export const readUintVarints = (
  bytes: Uint8Array,
  start?: number,
  end?: number,
) => readAll(bytes, false, start, end);
export const readSintVarints = (
  bytes: Uint8Array,
  start?: number,
  end?: number,
) => readAll(bytes, true, start, end);

function binaryBytes(value: unknown): Uint8Array {
  assert(value instanceof Binary && value.sub_type === Binary.SUBTYPE_DEFAULT);
  return value.value();
}

/**
 * Transposed saved state with one entry per bunchId (no concatenation), so
 * IDs of any length round-trip without a fixed-width assumption.
 */
export interface VarintColumns {
  bunchIds: string[];
  startCounterIndexes: number[];
  startCounters: number[];
  counts: number[];
}

export interface FlatVarintBinary {
  bunchIds: string[];
  startCounterIndexes: Binary;
  startCounters: Binary;
  counts: Binary;
}

/** Same Mongo shape as F05's columns, but each numeric field is a Binary of packed varints. */
export const flatVarintFormat: SweepFormat = {
  id: "Flat-Varint",
  label: "Flat ID array; protobuf-style packed varint numeric columns",
  readiness:
    "No pages; uint64/sint64 varints (full safe-integer range); unchanged IdList.load",
  pageSize: 0,
  idEncoding: "array",
  binary: true,
  encode(saved): FlatVarintBinary {
    const columns: VarintColumns = toTransposedOmit(saved);
    return {
      bunchIds: columns.bunchIds,
      startCounterIndexes: new Binary(
        packUintVarints(columns.startCounterIndexes),
      ),
      startCounters: new Binary(packUintVarints(columns.startCounters)),
      counts: new Binary(packSintVarints(columns.counts)),
    };
  },
  decode(state) {
    const binary = state as FlatVarintBinary;
    return decodeVarintColumns({
      bunchIds: binary.bunchIds,
      startCounterIndexes: readUintVarints(
        binaryBytes(binary.startCounterIndexes),
      ),
      startCounters: readUintVarints(binaryBytes(binary.startCounters)),
      counts: readSintVarints(binaryBytes(binary.counts)),
    });
  },
};

export function decodeVarintColumns(columns: VarintColumns): SavedIdList {
  const { bunchIds, startCounterIndexes, startCounters, counts } = columns;
  assert(Array.isArray(bunchIds));
  assert(bunchIds.every((id) => typeof id === "string"));
  assert.equal(bunchIds.length, counts.length);
  assert.equal(startCounterIndexes.length, startCounters.length);
  let position = 0;
  for (let i = 0; i < startCounterIndexes.length; i++) {
    position += startCounterIndexes[i];
    assert(i === 0 || startCounterIndexes[i] > 0);
    assert(position < counts.length, "Invalid startCounterIndexes");
  }
  return fromTransposedOmit(columns);
}

/**
 * Whole saved state as one FlatSavedIdListMessage (see id_list_saved_state.proto),
 * stored as a single BSON Binary. Wire-compatible with protobufjs; hand-written
 * here so decoding produces plain numbers rather than Long objects.
 */
export function encodeFlatProto(columns: VarintColumns): Uint8Array {
  const writer = new VarintWriter();
  const encoder = new TextEncoder();
  // repeated string: one length-prefixed entry per ID, even if empty.
  for (const id of columns.bunchIds) writer.string(1, encoder.encode(id));
  writer.field(2, packUintVarints(columns.startCounterIndexes));
  writer.field(3, packUintVarints(columns.startCounters));
  writer.field(4, packSintVarints(columns.counts));
  return writer.finish();
}
/** ASCII fast path (typical IDs); falls back to strict UTF-8 otherwise. */
function decodeString(
  decoder: TextDecoder,
  bytes: Uint8Array,
  start: number,
  end: number,
): string {
  let out = "";
  for (let i = start; i < end; i++) {
    const byte = bytes[i];
    if (byte >= 128) return decoder.decode(bytes.subarray(start, end));
    out += String.fromCharCode(byte);
  }
  return out;
}
export function decodeFlatProto(bytes: Uint8Array): VarintColumns {
  const out: VarintColumns = {
    bunchIds: [],
    startCounterIndexes: [],
    startCounters: [],
    counts: [],
  };
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const reader = new VarintReader(bytes);
  while (reader.pos < bytes.length) {
    const tag = reader.uint();
    assert.equal(tag & 7, 2, "Expected length-delimited field");
    const length = reader.uint();
    const start = reader.pos,
      end = start + length;
    assert(end <= bytes.length, "Truncated field");
    switch (tag >>> 3) {
      case 1:
        out.bunchIds.push(decodeString(decoder, bytes, start, end));
        break;
      case 2:
        out.startCounterIndexes.push(...readUintVarints(bytes, start, end));
        break;
      case 3:
        out.startCounters.push(...readUintVarints(bytes, start, end));
        break;
      case 4:
        out.counts.push(...readSintVarints(bytes, start, end));
        break;
      default:
      // Unknown field: skip, as protobuf does.
    }
    reader.pos = end;
  }
  return out;
}

export const flatProtoFormat: SweepFormat = {
  id: "Flat-Proto",
  label: "Whole flat state as one protobuf message in a BSON Binary",
  readiness:
    "No pages; FlatSavedIdListMessage (repeated string IDs, uint64/sint64 packed); unchanged IdList.load",
  pageSize: 0,
  idEncoding: "array",
  binary: true,
  encode(saved) {
    return new Binary(encodeFlatProto(toTransposedOmit(saved)));
  },
  decode(state) {
    return decodeVarintColumns(decodeFlatProto(binaryBytes(state)));
  },
};

/** Flat-F64 with an ID array instead of concatenated IDs: isolates the varint effect. */
export const flatFloat64IdsFormat: SweepFormat = {
  id: "Flat-F64-ids",
  label: "Flat ID array; fixed Float64 binary numeric columns",
  readiness: "No pages; little-endian Float64; unchanged IdList.load",
  pageSize: 0,
  idEncoding: "array",
  binary: true,
  encode(saved) {
    const columns = toTransposedOmit(saved);
    return {
      bunchIds: columns.bunchIds,
      startCounterIndexes: packFloat64(columns.startCounterIndexes),
      startCounters: packFloat64(columns.startCounters),
      counts: packFloat64(columns.counts),
    };
  },
  decode(state) {
    const binary = state as FlatVarintBinary;
    return decodeVarintColumns({
      bunchIds: binary.bunchIds,
      startCounterIndexes: [...readFloat64(binary.startCounterIndexes)],
      startCounters: [...readFloat64(binary.startCounters)],
      counts: [...readFloat64(binary.counts)],
    });
  },
};
