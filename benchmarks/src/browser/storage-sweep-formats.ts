import type { SavedIdList } from "articulated";
import { Binary } from "bson";
import assert from "node:assert/strict";
import {
  fromTransposedOmit,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";

type Columns = ReturnType<typeof toTransposedOmit>;
type IdEncoding = "array" | "joined" | "dictionary";
type Numbers = number[] | Binary;
interface Page {
  bunchIds: string[] | string;
  bunchIndexes?: Numbers;
  startCounterIndexes: Numbers;
  startCounters: Numbers;
  counts: Numbers;
}
export interface SweepFormat {
  id: string;
  label: string;
  readiness: string;
  pageSize: number;
  idEncoding: IdEncoding;
  binary: boolean;
  encode(saved: SavedIdList): unknown;
  decode(state: unknown): SavedIdList;
}

// Schema-fixed little-endian signed int32 fields: no per-column type metadata.
// Explicit range checks prevent silently corrupting counters outside this schema.
function pack(values: number[]): Binary {
  const bytes = new Uint8Array(values.length * 4);
  const view = new DataView(bytes.buffer);
  values.forEach((n, i) => {
    assert(Number.isInteger(n) && n >= -2147483648 && n <= 2147483647);
    view.setInt32(i * 4, n, true);
  });
  return new Binary(bytes);
}
function unpack(value: Numbers): number[] {
  if (Array.isArray(value)) return value;
  assert(value instanceof Binary);
  const bytes = value.value();
  assert.equal(bytes.byteLength % 4, 0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from({ length: bytes.byteLength / 4 }, (_, i) =>
    view.getInt32(i * 4, true),
  );
}
function encodePage(
  saved: SavedIdList,
  ids: IdEncoding,
  binary: boolean,
): Page {
  const columns = toTransposedOmit(saved);
  let bunchIds: string[] | string = columns.bunchIds;
  let indexes: number[] | undefined;
  if (ids === "joined") {
    assert(columns.bunchIds.every((id) => /^[A-Za-z0-9_-]{8}$/.test(id)));
    bunchIds = columns.bunchIds.join("");
  } else if (ids === "dictionary") {
    const dictionary = new Map<string, number>();
    indexes = columns.bunchIds.map((id) => {
      if (!dictionary.has(id)) dictionary.set(id, dictionary.size);
      return dictionary.get(id)!;
    });
    bunchIds = [...dictionary.keys()];
  }
  const numbers = (values: number[]) => (binary ? pack(values) : values);
  return {
    bunchIds,
    ...(indexes ? { bunchIndexes: numbers(indexes) } : {}),
    startCounterIndexes: numbers(columns.startCounterIndexes),
    startCounters: numbers(columns.startCounters),
    counts: numbers(columns.counts),
  };
}
function decodePage(page: Page, ids: IdEncoding): SavedIdList {
  const counts = unpack(page.counts);
  let bunchIds: string[];
  if (ids === "joined") {
    assert.equal(typeof page.bunchIds, "string");
    assert.equal(page.bunchIds.length, counts.length * 8);
    const joined = page.bunchIds as string;
    bunchIds = Array.from({ length: counts.length }, (_, i) =>
      joined.slice(i * 8, i * 8 + 8),
    );
  } else {
    assert(Array.isArray(page.bunchIds));
    const names = page.bunchIds as string[];
    bunchIds =
      ids === "dictionary"
        ? unpack(page.bunchIndexes!).map((i) => {
            assert(Number.isInteger(i) && i >= 0 && i < names.length);
            return names[i];
          })
        : names;
  }
  assert.equal(bunchIds.length, counts.length);
  const columns: Columns = {
    bunchIds,
    startCounterIndexes: unpack(page.startCounterIndexes),
    startCounters: unpack(page.startCounters),
    counts,
  };
  assert.equal(
    columns.startCounters.length,
    columns.startCounterIndexes.length,
  );
  return fromTransposedOmit(columns);
}
function format(
  pageSize: number,
  idEncoding: IdEncoding,
  binary = false,
): SweepFormat {
  const id =
    !binary && idEncoding === "array" && pageSize === 0
      ? "F05"
      : !binary && idEncoding === "array" && pageSize === 128
        ? "DS08"
        : `S${pageSize || "flat"}-${idEncoding}${binary ? "-binary" : ""}`;
  return {
    id,
    label: `${pageSize ? `${pageSize}-run pages` : "Whole-document columns"}; ${idEncoding} IDs${binary ? "; int32 binary numeric columns" : ""}`,
    readiness:
      "Storage encoding only; decoded to runs then unchanged IdList.load",
    pageSize,
    idEncoding,
    binary,
    encode(saved) {
      if (!pageSize) return encodePage(saved, idEncoding, binary);
      const pages: Page[] = [];
      for (let i = 0; i < saved.length; i += pageSize)
        pages.push(
          encodePage(saved.slice(i, i + pageSize), idEncoding, binary),
        );
      return { pages };
    },
    decode(state) {
      const pages = pageSize
        ? (state as { pages: Page[] }).pages
        : [state as Page];
      const saved: SavedIdList = [];
      for (const page of pages) saved.push(...decodePage(page, idEncoding));
      return saved;
    },
  };
}
export const storageSweepFormats: SweepFormat[] = [
  {
    id: "F01",
    label: "Original saved objects",
    readiness: "Unchanged IdList.load",
    pageSize: 0,
    idEncoding: "array",
    binary: false,
    encode: (saved) => saved,
    decode: (state) => state as SavedIdList,
  },
  ...[0, 32, 64, 128, 256, 512].flatMap((size) =>
    (["array", "joined", "dictionary"] as const).map((ids) =>
      format(size, ids),
    ),
  ),
  ...(["array", "joined", "dictionary"] as const).map((ids) =>
    format(128, ids, true),
  ),
];
