// Benchmark-only alternative encodings. These are not new public save formats.
import assert from "assert";
import { Binary } from "bson";
import { SavedIdList } from "../src";

export type Family = "four-field" | "signed-count";
export const variants = [
  "objects",
  "tuples",
  "columns",
  "typed-columns",
  "binary-columns",
  "flat",
  "typed-flat",
  "binary-flat",
  "packed-eight",
  "packed-five",
  "bit-columns",
] as const;
export type Variant = (typeof variants)[number];
export const diskVariants: Variant[] = variants.filter(
  (v) => v !== "typed-columns" && v !== "typed-flat"
);
type Numeric =
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Float64Array;
type ColumnValue = number[] | boolean[] | Numeric;
export type Encoding = {
  version: number;
  bunchIds: string[];
  bunchIndexes?: ColumnValue;
  startCounters?: ColumnValue;
  counts?: ColumnValue;
  isDeleted?: ColumnValue;
  signedCounts?: ColumnValue;
  runs?: ColumnValue;
};
type Signed = Array<{ bunchId: string; startCounter: number; count: number }>;
type Tuples = Array<Array<string | number | boolean>>;
export type Encoded = SavedIdList | Signed | Tuples | Encoding;
const keys = (family: Family) =>
  family === "four-field"
    ? (["bunchIndexes", "startCounters", "counts", "isDeleted"] as const)
    : (["bunchIndexes", "startCounters", "signedCounts"] as const);
const widths = (family: Family) =>
  family === "four-field" ? [13, 11, 11, 1] : [13, 11, 12];
export function storageVariant(variant: Variant): Variant {
  return variant === "typed-columns"
    ? "columns"
    : variant === "typed-flat"
    ? "flat"
    : variant;
}
function compact(values: number[]): Numeric {
  let min = 0,
    max = 0;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  const Type =
    min < 0
      ? min >= -128 && max <= 127
        ? Int8Array
        : min >= -32768 && max <= 32767
        ? Int16Array
        : min >= -2147483648 && max <= 2147483647
        ? Int32Array
        : Float64Array
      : max <= 255
      ? Uint8Array
      : max <= 65535
      ? Uint16Array
      : max <= 4294967295
      ? Uint32Array
      : Float64Array;
  return new Type(values);
}
function fixed(values: number[], width: number): Uint8Array {
  const bytes = new Uint8Array(values.length * width);
  const view = new DataView(bytes.buffer);
  values.forEach((value, i) => {
    if (width === 1) view.setUint8(i, value);
    else if (width === 4) view.setUint32(i * width, value, true);
    else view.setFloat64(i * width, value, true);
  });
  return bytes;
}
function readFixed(bytes: Numeric, index: number, width: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return width === 1
    ? view.getUint8(index)
    : width === 4
    ? view.getUint32(index * 4, true)
    : view.getFloat64(index * 8, true);
}
function bits(values: number[], width: number) {
  const bytes = new Uint8Array(Math.ceil((values.length * width) / 8));
  values.forEach((initial, index) => {
    assert(
      Number.isSafeInteger(initial) && initial >= 0 && initial < 2 ** width
    );
    let value = initial,
      cursor = index * width,
      remaining = width;
    while (remaining) {
      const shift = cursor % 8,
        take = Math.min(8 - shift, remaining);
      bytes[Math.floor(cursor / 8)] += (value % 2 ** take) * 2 ** shift;
      value = Math.floor(value / 2 ** take);
      cursor += take;
      remaining -= take;
    }
  });
  return bytes;
}
function readBits(bytes: Numeric, index: number, width: number) {
  let cursor = index * width,
    remaining = width,
    multiplier = 1,
    result = 0;
  while (remaining) {
    const shift = cursor % 8,
      take = Math.min(8 - shift, remaining);
    result +=
      (Math.floor(bytes[Math.floor(cursor / 8)] / 2 ** shift) % 2 ** take) *
      multiplier;
    cursor += take;
    remaining -= take;
    multiplier *= 2 ** take;
  }
  return result;
}
function columnNumbers(source: Encoding, key: keyof Encoding): number[] {
  return Array.from(source[key] as ColumnValue, Number);
}
function countCode(count: number) {
  return count < 0 ? -2 * count - 1 : 2 * count;
}
function fromCode(code: number) {
  return code % 2 ? -(code + 1) / 2 : code / 2;
}

export function encode(
  saved: SavedIdList,
  family: Family,
  variant: Variant
): Encoded {
  if (variant === "objects")
    return saved.map(({ bunchId, startCounter, count, isDeleted }) =>
      family === "four-field"
        ? { bunchId, startCounter, count, isDeleted }
        : { bunchId, startCounter, count: isDeleted ? -count : count }
    );
  if (variant === "tuples")
    return saved.map((r) =>
      family === "four-field"
        ? [r.bunchId, r.startCounter, r.count, r.isDeleted]
        : [r.bunchId, r.startCounter, r.isDeleted ? -r.count : r.count]
    );
  const bunchIds = [...new Set(saved.map((r) => r.bunchId))];
  const indexes = new Map(bunchIds.map((id, i) => [id, i]));
  const source: Encoding = {
    version: 1,
    bunchIds,
    bunchIndexes: saved.map((r) => indexes.get(r.bunchId)!),
    startCounters: saved.map((r) => r.startCounter),
    ...(family === "four-field"
      ? {
          counts: saved.map((r) => r.count),
          isDeleted: saved.map((r) => r.isDeleted),
        }
      : { signedCounts: saved.map((r) => (r.isDeleted ? -r.count : r.count)) }),
  };
  const fields = keys(family);
  if (variant === "columns") return source;
  const out: Encoding = { version: 1, bunchIds };
  if (variant === "typed-columns" || variant === "binary-columns") {
    for (const key of fields) {
      const values = columnNumbers(source, key);
      out[key] =
        variant === "typed-columns"
          ? compact(values)
          : fixed(
              values,
              key === "bunchIndexes" ? 4 : key === "isDeleted" ? 1 : 8
            );
    }
    return out;
  }
  const flat = saved.flatMap((_, i) =>
    fields.map((key) => Number(source[key]![i]))
  );
  if (
    variant === "flat" ||
    variant === "typed-flat" ||
    variant === "binary-flat"
  ) {
    out.runs =
      variant === "flat"
        ? flat
        : variant === "typed-flat"
        ? compact(flat)
        : fixed(flat, 8);
    return out;
  }
  assert(bunchIds.length <= 8192, "Packed dictionary overflow");
  for (const run of saved) {
    assert(
      Number.isSafeInteger(run.startCounter) &&
        run.startCounter >= 0 &&
        run.startCounter < 2048,
      "Packed start overflow"
    );
    assert(
      Number.isSafeInteger(run.count) &&
        run.count > 0 &&
        run.count <= (family === "signed-count" && run.isDeleted ? 2048 : 2047),
      "Packed count overflow"
    );
  }
  if (variant === "bit-columns") {
    fields.forEach((key, index) => {
      const values = columnNumbers(source, key);
      out[key] = bits(
        key === "signedCounts" ? values.map(countCode) : values,
        widths(family)[index]
      );
    });
    return out;
  }
  const packed = saved.map(
    (r, i) =>
      (Number(source.bunchIndexes![i]) * 2048 + r.startCounter) * 4096 +
      (family === "four-field"
        ? 2 * r.count + Number(r.isDeleted)
        : countCode(r.isDeleted ? -r.count : r.count))
  );
  if (variant === "packed-eight") out.runs = fixed(packed, 8);
  else {
    const bytes = new Uint8Array(packed.length * 5);
    packed.forEach((initial, i) => {
      let value = initial;
      for (let j = 0; j < 5; j++) {
        bytes[i * 5 + j] = value % 256;
        value = Math.floor(value / 256);
      }
    });
    out.runs = bytes;
  }
  return out;
}

export function runCount(value: Encoded, family: Family, variant: Variant) {
  if (Array.isArray(value)) return value.length;
  if (variant === "packed-five") return value.runs!.length / 5;
  if (variant === "packed-eight") return value.runs!.length / 8;
  if (variant === "flat" || variant === "typed-flat")
    return value.runs!.length / keys(family).length;
  if (variant === "binary-flat")
    return value.runs!.length / (8 * keys(family).length);
  if (variant === "binary-columns") return value.bunchIndexes!.length / 4;
  if (variant === "bit-columns")
    return Math.floor((value.bunchIndexes!.length * 8) / 13);
  return value.bunchIndexes!.length;
}
// Scalar random access; only at() style calls allocate one decoded run, never an unpacked snapshot.
export function at(
  value: Encoded,
  family: Family,
  variant: Variant,
  index: number
): SavedIdList[number] {
  assert(
    Number.isInteger(index) &&
      index >= 0 &&
      index < runCount(value, family, variant)
  );
  if (variant === "objects") {
    const row = (value as SavedIdList)[index];
    return {
      bunchId: row.bunchId,
      startCounter: row.startCounter,
      count: Math.abs(row.count),
      isDeleted: family === "four-field" ? row.isDeleted : row.count < 0,
    };
  }
  if (variant === "tuples") {
    const row = (value as Tuples)[index];
    return {
      bunchId: row[0] as string,
      startCounter: row[1] as number,
      count: Math.abs(row[2] as number),
      isDeleted:
        family === "four-field" ? (row[3] as boolean) : Number(row[2]) < 0,
    };
  }
  const source = value as Encoding;
  let values: number[];
  if (variant === "packed-five" || variant === "packed-eight") {
    let packed = 0;
    if (variant === "packed-eight")
      packed = readFixed(source.runs as Numeric, index, 8);
    else
      for (let j = 4; j >= 0; j--)
        packed = packed * 256 + Number(source.runs![index * 5 + j]);
    const code = packed % 4096;
    values = [
      Math.floor(packed / 8388608),
      Math.floor(packed / 4096) % 2048,
      ...(family === "four-field"
        ? [Math.floor(code / 2), code % 2]
        : [fromCode(code)]),
    ];
  } else
    values = keys(family).map((key, field) => {
      if (variant === "binary-columns")
        return readFixed(
          source[key] as Numeric,
          index,
          key === "bunchIndexes" ? 4 : key === "isDeleted" ? 1 : 8
        );
      if (variant === "bit-columns") {
        const number = readBits(
          source[key] as Numeric,
          index,
          widths(family)[field]
        );
        return key === "signedCounts" ? fromCode(number) : number;
      }
      if (variant === "binary-flat")
        return readFixed(
          source.runs as Numeric,
          index * keys(family).length + field,
          8
        );
      if (variant === "flat" || variant === "typed-flat")
        return Number(source.runs![index * keys(family).length + field]);
      return Number(source[key]![index]);
    });
  return {
    bunchId: source.bunchIds[values[0]],
    startCounter: values[1],
    count: Math.abs(values[2]),
    isDeleted: family === "four-field" ? Boolean(values[3]) : values[2] < 0,
  };
}
export function decode(
  value: Encoded,
  family: Family,
  variant: Variant
): SavedIdList {
  return Array.from({ length: runCount(value, family, variant) }, (_, i) =>
    at(value, family, variant, i)
  );
}
export function mongo(value: Encoded): unknown {
  if (Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      ArrayBuffer.isView(item) ? new Binary(item as Uint8Array) : item,
    ])
  );
}
export function fromMongo(value: Encoded): Encoded {
  if (Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      item instanceof Binary ? item.value() : item,
    ])
  ) as Encoding;
}
export function retain(
  input: Encoded,
  family: Family,
  variant: Variant
): Encoded {
  if (variant === "binary-columns" || variant === "binary-flat") {
    // Decode/recompact like a client; wider intermediate arrays are not retained.
    const source = input as Encoding;
    return encode(
      decode(
        {
          ...source,
          bunchIds: JSON.parse(JSON.stringify(source.bunchIds)) as string[],
        },
        family,
        variant
      ),
      family,
      variant === "binary-columns" ? "typed-columns" : "typed-flat"
    );
  }
  if (variant === "typed-columns" || variant === "typed-flat")
    return encode(
      decode(input, family, storageVariant(variant)),
      family,
      variant
    );
  if (Array.isArray(input)) return JSON.parse(JSON.stringify(input)) as Encoded;
  return {
    ...input,
    bunchIds: JSON.parse(JSON.stringify(input.bunchIds)) as string[],
    ...Object.fromEntries(
      Object.entries(input)
        .filter(
          ([key, v]) =>
            key !== "bunchIds" && (ArrayBuffer.isView(v) || Array.isArray(v))
        )
        .map(([key, v]) => [
          key,
          ArrayBuffer.isView(v)
            ? new Uint8Array(v as Uint8Array)
            : (v as number[]).slice(),
        ])
    ),
  };
}
