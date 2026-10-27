import type { SavedIdList } from "articulated";
import { Binary } from "bson";
import assert from "node:assert/strict";
import { storageSweepFormats, type SweepFormat } from "./storage-sweep-formats";

export interface FlatColumns {
  bunchIds: string;
  startCounterIndexes: ArrayLike<number>;
  startCounters: ArrayLike<number>;
  counts: ArrayLike<number>;
}
export interface FlatBinary {
  bunchIds: string;
  startCounterIndexes: Binary;
  startCounters: Binary;
  counts: Binary;
}
const nativeLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

/** Schema-fixed IEEE754 binary64, little endian; no headers or width metadata. */
export function packFloat64(values: ArrayLike<number>): Binary {
  const bytes = new Uint8Array(values.length * 8);
  const view = new DataView(bytes.buffer);
  for (let i = 0; i < values.length; i++) {
    assert(
      Number.isSafeInteger(values[i]),
      "Numeric fields must be safe integers",
    );
    view.setFloat64(i * 8, values[i], true);
  }
  return new Binary(bytes);
}

/** Read a typed view when possible; exactly one alignment copy otherwise.
 * Passing false exercises the portable DataView path on little-endian test hosts.
 */
export function readFloat64(
  value: Binary,
  littleEndian = nativeLittleEndian,
): Float64Array {
  assert(value instanceof Binary && value.sub_type === Binary.SUBTYPE_DEFAULT);
  const bytes = value.value();
  assert.equal(bytes.byteLength % 8, 0);
  if (littleEndian) {
    const aligned = bytes.byteOffset % 8 === 0 ? bytes : new Uint8Array(bytes);
    return new Float64Array(
      aligned.buffer,
      aligned.byteOffset,
      aligned.byteLength / 8,
    );
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = new Float64Array(bytes.byteLength / 8);
  for (let i = 0; i < result.length; i++)
    result[i] = view.getFloat64(i * 8, true);
  return result;
}

/** Same reader for JSON arrays and Float64Array views. No expanded ID array or
 * number[] copies; only the run objects needed by the existing IdList.load.
 */
export function decodeFlatColumns(state: FlatColumns): SavedIdList {
  const { bunchIds, startCounterIndexes, startCounters, counts } = state;
  assert.equal(typeof bunchIds, "string");
  assert.equal(bunchIds.length, counts.length * 8);
  assert.equal(startCounterIndexes.length, startCounters.length);
  let position = 0;
  for (let i = 0; i < startCounterIndexes.length; i++) {
    const delta = startCounterIndexes[i];
    assert(Number.isSafeInteger(delta) && (i === 0 ? delta >= 0 : delta > 0));
    position += delta;
    assert(position < counts.length);
    assert(Number.isSafeInteger(startCounters[i]) && startCounters[i] >= 0);
  }
  const nextCounters = new Map<string, number>();
  const saved: SavedIdList = new Array(counts.length);
  let k = 0;
  let nextIncluded = startCounterIndexes.length ? startCounterIndexes[0] : -1;
  for (let i = 0; i < counts.length; i++) {
    const bunchId = bunchIds.slice(i * 8, i * 8 + 8);
    const signed = counts[i];
    assert(Number.isSafeInteger(signed));
    const count = Math.abs(signed);
    let startCounter: number;
    if (i === nextIncluded) {
      startCounter = startCounters[k++];
      nextIncluded =
        k < startCounterIndexes.length
          ? nextIncluded + startCounterIndexes[k]
          : -1;
    } else startCounter = nextCounters.get(bunchId) ?? 0;
    saved[i] = { bunchId, startCounter, count, isDeleted: signed < 0 };
    nextCounters.set(bunchId, startCounter + count);
  }
  return saved;
}

const joined = storageSweepFormats.find(
  (format) => format.id === "Sflat-joined",
)!;
export const flatFloat64Format: SweepFormat = {
  id: "Flat-F64",
  label: "Flat concatenated IDs; fixed Float64 binary numeric columns",
  readiness:
    "No pages; schema-fixed little-endian Float64; unchanged IdList.load",
  pageSize: 0,
  idEncoding: "joined",
  binary: true,
  encode(saved): FlatBinary {
    const json = joined.encode(saved) as FlatColumns;
    return {
      bunchIds: json.bunchIds,
      startCounterIndexes: packFloat64(json.startCounterIndexes),
      startCounters: packFloat64(json.startCounters),
      counts: packFloat64(json.counts),
    };
  },
  decode(state) {
    const binary = state as FlatBinary;
    return decodeFlatColumns({
      bunchIds: binary.bunchIds,
      startCounterIndexes: readFloat64(binary.startCounterIndexes),
      startCounters: readFloat64(binary.startCounters),
      counts: readFloat64(binary.counts),
    });
  },
};
export const flatFloat64Formats: SweepFormat[] = [
  ...storageSweepFormats.filter((format) =>
    ["F01", "F05", "Sflat-joined"].includes(format.id),
  ),
  flatFloat64Format,
];
