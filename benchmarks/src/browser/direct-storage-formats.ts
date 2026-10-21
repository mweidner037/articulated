import type { SavedIdList } from "articulated";
import assert from "node:assert/strict";
import {
  fromTransposedOmit,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";

type Run = SavedIdList[number];
export const directStoragePageSize = 128;
export interface IdentitySpans {
  bunchIds: string[];
  startCounters: number[];
  identityCounts: number[];
  /** Signed counts partition the same TOTAL (visible + deleted) ordered space,
   * independently of identity-span boundaries. Negative means deleted. */
  visibilityCounts: number[];
}
interface Columns {
  bunchIds: string[];
  startCounters: number[];
  counts: number[];
}
type PagePayload =
  Columns | IdentitySpans | ReturnType<typeof toTransposedOmit>;
export interface IndexedPages<P extends PagePayload = PagePayload> {
  pages: Record<string, P>;
  pageOrder: number[];
  /** Indexed by stable page ID. Initial pages are dense; future splits may append IDs. */
  pagePositions: number[];
  visibleEnds: number[];
  /** Each whole ID maps to flattened [pageId, rowIndex, ...] pairs sorted by
   * counter. Starts are read from that page, not duplicated in this index. */
  identityLocations: Record<string, number[]>;
}
export interface DirectStorageFormat {
  id: string;
  label: string;
  readiness: string;
  encode(saved: SavedIdList): unknown;
  decode(state: unknown): SavedIdList;
  assertSnapshot?(state: unknown): void;
}
function append(out: SavedIdList, row: Run) {
  if (!row.count) return;
  const last = out.at(-1);
  if (
    last &&
    last.bunchId === row.bunchId &&
    last.isDeleted === row.isDeleted &&
    last.startCounter + last.count === row.startCounter
  )
    out[out.length - 1] = { ...last, count: last.count + row.count };
  else out.push({ ...row });
}
function flatten(pages: SavedIdList[]): SavedIdList {
  const out: SavedIdList = [];
  for (const page of pages) for (const row of page) append(out, row);
  return out;
}
export function toIdentitySpans(saved: SavedIdList): IdentitySpans {
  const out: IdentitySpans = {
    bunchIds: [],
    startCounters: [],
    identityCounts: [],
    visibilityCounts: [],
  };
  for (const row of saved) {
    const i = out.identityCounts.length - 1;
    if (
      i >= 0 &&
      out.bunchIds[i] === row.bunchId &&
      out.startCounters[i] + out.identityCounts[i] === row.startCounter
    )
      out.identityCounts[i] += row.count;
    else {
      out.bunchIds.push(row.bunchId);
      out.startCounters.push(row.startCounter);
      out.identityCounts.push(row.count);
    }
    const count = row.isDeleted ? -row.count : row.count,
      j = out.visibilityCounts.length - 1;
    if (j >= 0 && Math.sign(out.visibilityCounts[j]) === Math.sign(count))
      out.visibilityCounts[j] += count;
    else out.visibilityCounts.push(count);
  }
  return out;
}
export function fromIdentitySpans(state: IdentitySpans): SavedIdList {
  assert.equal(state.bunchIds.length, state.startCounters.length);
  assert.equal(state.bunchIds.length, state.identityCounts.length);
  const out: SavedIdList = [];
  let visibility = 0,
    consumed = 0;
  for (let i = 0; i < state.identityCounts.length; i++) {
    assert(
      state.identityCounts[i] > 0 &&
        Number.isSafeInteger(state.identityCounts[i]),
    );
    let remaining = state.identityCounts[i],
      start = state.startCounters[i];
    while (remaining > 0) {
      assert(
        visibility < state.visibilityCounts.length,
        "Visibility ended before identity spans",
      );
      const signed = state.visibilityCounts[visibility];
      assert(signed !== 0 && Number.isSafeInteger(signed));
      const count = Math.min(remaining, Math.abs(signed) - consumed);
      assert(count > 0);
      append(out, {
        bunchId: state.bunchIds[i],
        startCounter: start,
        count,
        isDeleted: signed < 0,
      });
      remaining -= count;
      start += count;
      consumed += count;
      if (consumed === Math.abs(signed)) {
        visibility++;
        consumed = 0;
      }
    }
  }
  assert.equal(
    visibility,
    state.visibilityCounts.length,
    "Visibility exceeds identity spans",
  );
  assert.equal(consumed, 0);
  return out;
}
function toColumns(saved: SavedIdList): Columns {
  return {
    bunchIds: saved.map((r) => r.bunchId),
    startCounters: saved.map((r) => r.startCounter),
    counts: saved.map((r) => (r.isDeleted ? -r.count : r.count)),
  };
}
function fromColumns(s: Columns): SavedIdList {
  assert.equal(s.bunchIds.length, s.counts.length);
  assert.equal(s.startCounters.length, s.counts.length);
  return s.counts.map((n, i) => ({
    bunchId: s.bunchIds[i],
    startCounter: s.startCounters[i],
    count: Math.abs(n),
    isDeleted: n < 0,
  }));
}
function split(saved: SavedIdList): SavedIdList[] {
  const pages: SavedIdList[] = [];
  for (let i = 0; i < saved.length; i += directStoragePageSize)
    pages.push(saved.slice(i, i + directStoragePageSize));
  return pages;
}
function visibleEnds(pages: SavedIdList[]): number[] {
  let end = 0;
  return pages.map(
    (page) =>
      (end += page.reduce((n, r) => n + (r.isDeleted ? 0 : r.count), 0)),
  );
}
function spansAsRuns(s: IdentitySpans): SavedIdList {
  return s.identityCounts.map((count, i) => ({
    bunchId: s.bunchIds[i],
    startCounter: s.startCounters[i],
    count,
    isDeleted: false,
  }));
}
function indexed<P extends PagePayload>(
  saved: SavedIdList,
  encode: (s: SavedIdList) => P,
  identities: (p: P) => SavedIdList,
): IndexedPages<P> {
  const source = split(saved),
    pages: Record<string, P> = Object.create(null);
  const grouped = new Map<
    string,
    { page: number; row: number; start: number }[]
  >();
  source.forEach((page, id) => {
    const encoded = encode(page);
    pages[id] = encoded;
    identities(encoded).forEach((run, row) => {
      let locations = grouped.get(run.bunchId);
      if (!locations) grouped.set(run.bunchId, (locations = []));
      locations.push({ page: id, row, start: run.startCounter });
    });
  });
  const identityLocations: Record<string, number[]> = Object.create(null);
  for (const [id, locations] of grouped) {
    locations.sort((a, b) => a.start - b.start);
    identityLocations[id] = locations.flatMap((l) => [l.page, l.row]);
  }
  return {
    pages,
    pageOrder: source.map((_, i) => i),
    pagePositions: source.map((_, i) => i),
    visibleEnds: visibleEnds(source),
    identityLocations,
  };
}
function validateIndexed<P extends PagePayload>(
  s: IndexedPages<P>,
  decode: (p: P) => SavedIdList,
  identities: (p: P) => SavedIdList,
) {
  assert.equal(s.pageOrder.length, Object.keys(s.pages).length);
  assert.equal(new Set(s.pageOrder).size, s.pageOrder.length);
  assert.equal(s.visibleEnds.length, s.pageOrder.length);
  assert.equal(s.pagePositions.length, s.pageOrder.length);
  let end = 0;
  const allLocations = new Set<string>();
  s.pageOrder.forEach((page, position) => {
    assert.equal(s.pagePositions[page], position);
    const data = s.pages[page];
    assert(data);
    end += decode(data).reduce((n, r) => n + (r.isDeleted ? 0 : r.count), 0);
    assert.equal(s.visibleEnds[position], end);
    identities(data).forEach((r, row) =>
      allLocations.add(`${page}:${row}:${r.bunchId}`),
    );
  });
  for (const [id, locations] of Object.entries(s.identityLocations)) {
    assert.equal(locations.length % 2, 0);
    let lastEnd = -1;
    for (let i = 0; i < locations.length; i += 2) {
      const page = locations[i],
        index = locations[i + 1],
        row = identities(s.pages[page])[index];
      assert(row);
      assert.equal(row.bunchId, id);
      assert(row.startCounter >= lastEnd);
      lastEnd = row.startCounter + row.count;
      assert(
        allLocations.delete(`${page}:${index}:${id}`),
        "Duplicated or unknown identity location",
      );
    }
  }
  assert.equal(
    allLocations.size,
    0,
    "Identity index omitted rows (including tombstones)",
  );
}
function indexedFormat<P extends PagePayload>(
  id: string,
  label: string,
  encode: (s: SavedIdList) => P,
  decode: (p: P) => SavedIdList,
  identities: (p: P) => SavedIdList,
): DirectStorageFormat {
  return {
    id,
    label,
    readiness:
      "Complete proposed navigation metadata: stable page IDs/order/positions, visible prefix ends, and whole-ID-to-page/row locations sorted by counter. Bounded within-page scans remain. Editing code and performance are NOT implemented or measured; immutable directory/index update costs remain to be evaluated.",
    encode: (saved) => indexed(saved, encode, identities),
    decode: (state) => {
      const s = state as IndexedPages<P>;
      return flatten(s.pageOrder.map((id) => decode(s.pages[id])));
    },
    assertSnapshot: (state) =>
      validateIndexed(state as IndexedPages<P>, decode, identities),
  };
}
export const directStorageFormats: DirectStorageFormat[] = [
  {
    id: "F01",
    label: "Plain SavedIdList objects — paired baseline",
    readiness:
      "Existing library interchange baseline, loaded into existing IdList; not a dump of its editable internal tree",
    encode: (s) => s,
    decode: (s) => s as SavedIdList,
  },
  {
    id: "F05",
    label: "Whole-ID columns; reconstruct counters — paired reference",
    readiness:
      "Existing columnar interchange; runtime indexes are not persisted",
    encode: toTransposedOmit,
    decode: (s) => fromTransposedOmit(s as ReturnType<typeof toTransposedOmit>),
  },
  {
    id: "DS01",
    label: "Identity spans + separate visibility",
    readiness:
      "Leaf payload only. Identity, order and visibility are lossless; no persisted navigation/index metadata. Not a ready indexed native snapshot",
    encode: toIdentitySpans,
    decode: (s) => fromIdentitySpans(s as IdentitySpans),
  },
  {
    id: "DS02",
    label: "128-run pages; explicit counters",
    readiness:
      "Leaf pages only. No visible directory or identity index; runtime navigation construction remains unmeasured",
    encode: (s) => ({ pages: split(s).map(toColumns) }),
    decode: (s) => flatten((s as { pages: Columns[] }).pages.map(fromColumns)),
  },
  {
    id: "DS03",
    label: "Explicit-counter pages + visible prefix ends",
    readiness:
      "Position-navigation metadata only: at(index) can use visibleEnds and page-local scans. Identity lookup remains linear without building a separate index. Not the fully indexed proposal",
    encode: (s) => {
      const pages = split(s);
      return { pages: pages.map(toColumns), visibleEnds: visibleEnds(pages) };
    },
    decode: (s) => flatten((s as { pages: Columns[] }).pages.map(fromColumns)),
    assertSnapshot: (state) => {
      const s = state as { pages: Columns[]; visibleEnds: number[] };
      assert.deepEqual(s.visibleEnds, visibleEnds(s.pages.map(fromColumns)));
    },
  },
  indexedFormat(
    "DS04",
    "Explicit-counter pages + complete navigation metadata",
    toColumns,
    fromColumns,
    fromColumns,
  ),
  indexedFormat(
    "DS05",
    "Identity-span pages + visibility + complete navigation metadata",
    toIdentitySpans,
    fromIdentitySpans,
    spansAsRuns,
  ),
  indexedFormat(
    "DS06",
    "Page-local reconstructed-counter columns + complete navigation metadata",
    toTransposedOmit,
    fromTransposedOmit,
    fromTransposedOmit,
  ),
  {
    id: "DS07",
    label: "128-run identity-span pages + separate visibility",
    readiness:
      "Leaf pages only; paired control isolates the metadata added by DS05",
    encode: (s) => ({ pages: split(s).map(toIdentitySpans) }),
    decode: (s) =>
      flatten((s as { pages: IdentitySpans[] }).pages.map(fromIdentitySpans)),
  },
  {
    id: "DS08",
    label: "128-run page-local reconstructed-counter columns",
    readiness:
      "Leaf pages only; page-local counter exceptions restart at each page; paired control isolates metadata added by DS06",
    encode: (s) => ({ pages: split(s).map(toTransposedOmit) }),
    decode: (s) =>
      flatten(
        (s as { pages: ReturnType<typeof toTransposedOmit>[] }).pages.map(
          fromTransposedOmit,
        ),
      ),
  },
];

export const directStorageExample: SavedIdList = [
  { bunchId: "aB3dE5fG", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 3, count: 2, isDeleted: true },
  { bunchId: "hJ7kL9mN", startCounter: 20, count: 1, isDeleted: false },
  { bunchId: "aB3dE5fG", startCounter: 8, count: 2, isDeleted: false },
];
