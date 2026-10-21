import type { ElementId, SavedIdList } from "articulated";
import { libraryLoad, type LibraryCase } from "./library-perf-candidates";
import type { BenchmarkList } from "./list-interface";

type Edit =
  | { type: "insert"; index: number; id: ElementId; before: ElementId | null }
  | { type: "delete"; index: number; id: ElementId };
let current: BenchmarkList | undefined;
let history: { list: BenchmarkList; offset: number }[] = [];
let prepared: Edit[] | undefined;
let expected: SavedIdList | undefined;
let fixture = "";
let selected: LibraryCase;
function same(a: ElementId | null, b: ElementId | null) {
  if (a?.bunchId !== b?.bunchId || a?.counter !== b?.counter)
    throw new Error("Runtime edit anchor mismatch");
}
function apply(list: BenchmarkList, edit: Edit) {
  const anchor =
    edit.type === "insert"
      ? edit.index
        ? list.at(edit.index - 1)
        : null
      : list.at(edit.index);
  same(anchor, edit.type === "insert" ? edit.before : edit.id);
  return edit.type === "insert"
    ? list.insertAfter(anchor, {
        bunchId:
          anchor?.bunchId === edit.id.bunchId
            ? anchor.bunchId
            : edit.id.bunchId,
        counter: edit.id.counter,
      })
    : list.delete(anchor!);
}
function equalSaved(list: BenchmarkList, wanted: SavedIdList) {
  if (JSON.stringify(list.save()) !== JSON.stringify(wanted))
    throw new Error("Runtime full saved-state mismatch");
}
export const libraryAPI = {
  async prepare(id: LibraryCase) {
    selected = id;
    fixture = await (await fetch("/fixture")).text();
  },
  clear() {
    current = undefined;
    history = [];
    prepared = undefined;
    expected = undefined;
  },
  load(empty = false) {
    const decoded = empty ? [] : (JSON.parse(fixture) as SavedIdList);
    const start = performance.now();
    current = libraryLoad(selected, decoded);
    const ms = performance.now() - start;
    return { ms, length: current.length };
  },
  loadTrials(count: number) {
    const samples = [];
    for (let i = 0; i < count; i++) samples.push(libraryAPI.load().ms);
    return samples;
  },
  async prepareTrace() {
    const payload = await (await fetch("/trace")).json();
    prepared = payload.edits;
    expected = payload.expected;
    return prepared!.length;
  },
  async prepareSession(kind: string) {
    const payload = await (await fetch(`/session/${kind}`)).json();
    // Shared setup insertion from the reference session builder, outside timer.
    current = current!.insertAfter(null, payload.firstId);
    prepared = payload.edits;
    expected = payload.expected;
    return prepared!.length;
  },
  replay(historyLimit: number, remoteOnly = false) {
    if (!current || !prepared || !expected || ![0, 100].includes(historyLimit))
      throw new Error("Prepare runtime replay first");
    const edits = prepared;
    prepared = undefined;
    const start = performance.now();
    for (let i = 0; i < edits.length; i++) {
      if (historyLimit) {
        history.push({ list: current, offset: i });
        if (history.length > historyLimit) history.shift();
      }
      const edit = edits[i];
      current = remoteOnly
        ? edit.type === "insert"
          ? current.insertAfter(edit.before, edit.id)
          : current.delete(edit.id)
        : apply(current, edit);
    }
    const ms = performance.now() - start;
    // Reference checks and sampled old-version replay are OUTSIDE the clock.
    equalSaved(current, expected);
    for (const position of [
      0,
      Math.floor(history.length / 2),
      history.length - 1,
    ]) {
      const version = history[position];
      if (!version) continue;
      let list = version.list;
      for (let i = version.offset; i < edits.length; i++)
        list = apply(list, edits[i]);
      equalSaved(list, expected);
    }
    expected = undefined;
    return {
      ms,
      operations: edits.length,
      retainedVersions: history.length,
      verified: true,
    };
  },
  lookups(kind: "local" | "random", count = 20000) {
    if (!current?.length) throw new Error("Load first");
    let seed = 72,
      checksum = 0;
    const start = performance.now();
    for (let i = 0; i < count; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const at = kind === "local" ? i % current.length : seed % current.length;
      const id = current.at(at);
      const found = current.indexOf(id);
      if (found !== at) throw new Error("Runtime lookup mismatch");
      checksum += found;
    }
    return { ms: performance.now() - start, operations: count, checksum };
  },
  checkLoaded() {
    equalSaved(current!, JSON.parse(fixture));
    return true;
  },
  stress() {
    const fragmented: SavedIdList = Array.from({ length: 2048 }, (_, i) => ({
      bunchId: "frag0001",
      startCounter: i,
      count: 1,
      isDeleted: i % 2 === 1,
    }));
    current = libraryLoad(selected, fragmented);
    const fragmentedLookups = libraryAPI.lookups("random", 5000);
    const tombstone = { bunchId: "frag0001", counter: 1 };
    const start = performance.now();
    for (let i = 0; i < 2000; i++) current = current.delete(tombstone);
    const tombstoneDeleteMs = performance.now() - start;
    equalSaved(current, fragmented);
    current = libraryLoad(selected, [
      { bunchId: "gap00001", startCounter: 0, count: 1, isDeleted: false },
      { bunchId: "gap00001", startCounter: 99999, count: 1, isDeleted: false },
    ]);
    const gapStart = performance.now();
    current = current.delete({ bunchId: "gap00001", counter: 0 }, 100000);
    const gapDeleteMs = performance.now() - gapStart;
    equalSaved(current, [
      { bunchId: "gap00001", startCounter: 0, count: 1, isDeleted: true },
      { bunchId: "gap00001", startCounter: 99999, count: 1, isDeleted: true },
    ]);
    return {
      fragmentedLookups,
      tombstoneDeleteMs,
      gapDeleteMs,
      verified: true,
    };
  },
  releaseHistory() {
    history = [];
  },
};
declare global {
  interface Window {
    libraryPerf: typeof libraryAPI;
  }
}
window.libraryPerf = libraryAPI;
