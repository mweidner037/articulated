import { IdList, type SavedIdList } from "articulated";
import { Node as PMNode, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { Candidate } from "./candidates";
import type { EditWorkload } from "./edit-workload";
import type { BenchmarkList } from "./list-interface";

export interface BrowserSample {
  decode: number;
  /** Decoded interchange state -> usable internal list, including
   * reconstruction, intermediate run objects, validation and indexes if used.
   * Excludes decoding and editor/rendering. Kept as `hydrate` for raw-data compatibility.
   */
  hydrate: number;
  editor: number;
  layout: number;
  frameWait: number;
  total: number;
  edit: number;
}
export interface EditSample {
  lookupMs: number;
  editMs: number;
  totalMs: number;
  snapshotMs: number;
  stringifyMs: number;
}
export interface BrowserAPI {
  session(
    edits: SessionEdit[],
    historyLimit: number,
  ): Promise<{ listMs: number; totalMs: number; retainedVersions: number }>;
  checkSession(saved: SavedIdList, text: string): void;
  dropHistory(): void;
  exercise(workload: EditWorkload): Promise<EditSample>;
  prepare(id: string): Promise<void>;
  run(count: number, memory?: boolean): Promise<BrowserSample>;
  clear(): void;
  check(saved: SavedIdList, text: string, edited?: boolean): void;
}
export interface SessionEdit {
  type: "insert" | "delete";
  index: number;
  before?: { bunchId: string; counter: number } | null;
  id: { bunchId: string; counter: number };
}
declare global {
  interface Window {
    benchmark: BrowserAPI;
    memoryProbe(stage: string): Promise<void>;
  }
}
const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", toDOM: () => ["p", 0] },
    text: {},
  },
});
let prepared: { id: string; bytes: Uint8Array; documentJSON: string } | null =
  null;
let editors: { list: BenchmarkList; view: EditorView; candidate: Candidate }[] =
  [];
let history: BenchmarkList[] = [];
const root = document.getElementById("editors")!;
const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function clear() {
  for (const { view } of editors) view.destroy();
  editors = [];
  history = [];
  prepared = null;
  root.replaceChildren();
}
export function installBenchmark(
  candidate: (id: string) => Candidate,
  firstEditBunchId = "browser-first-edit",
) {
  window.benchmark = {
    dropHistory() {
      history = [];
    },
    checkSession(saved, text) {
      if (JSON.stringify(editors[0].list.save()) !== JSON.stringify(saved))
        throw new Error("Session ID mismatch");
      if (
        editors[0].view.state.doc.textBetween(
          0,
          editors[0].view.state.doc.content.size,
          "\n",
        ) !== text
      )
        throw new Error("Session document mismatch");
      if (
        root.children.length !== editors.length ||
        editors.some(({ view }) => !view.dom.isConnected)
      )
        throw new Error("Session editor mount mismatch");
      const rendered = [...editors[0].view.dom.querySelectorAll("p")]
        .map((p) => p.textContent ?? "")
        .join("\n");
      if (rendered !== text) throw new Error("Session rendered text mismatch");
    },
    async session(edits, historyLimit) {
      const editor = editors[0];
      let listMs = 0;
      const start = performance.now();
      for (const edit of edits) {
        if (historyLimit) {
          history.push(editor.list);
          if (history.length > historyLimit) history.shift();
        }
        const t = performance.now();
        const actual =
          edit.type === "insert"
            ? edit.index
              ? editor.list.at(edit.index - 1)
              : null
            : editor.list.at(edit.index);
        editor.list =
          edit.type === "insert"
            ? editor.list.insertAfter(actual, edit.id)
            : editor.list.delete(actual!);
        listMs += performance.now() - t;
        const expected =
          edit.type === "insert" ? (edit.before ?? null) : edit.id;
        if (
          actual?.bunchId !== expected?.bunchId ||
          actual?.counter !== expected?.counter
        )
          throw new Error("Session index-to-ID mismatch");
        // Map text offsets through paragraph separators. This is deliberately
        // common editor work; do not attribute it to the ID container.
        let position = 1,
          remaining = edit.index;
        for (let i = 0; i < editor.view.state.doc.childCount; i++) {
          const paragraph = editor.view.state.doc.child(i);
          if (remaining <= paragraph.content.size) {
            position += remaining;
            break;
          }
          remaining -= paragraph.content.size + 1;
          position += paragraph.nodeSize;
        }
        const transaction = editor.view.state.tr;
        if (edit.type === "insert") transaction.insertText("x", position);
        else transaction.delete(position, position + 1);
        editor.view.dispatch(transaction);
      }
      void root.getBoundingClientRect();
      await frame();
      await frame();
      return {
        listMs,
        totalMs: performance.now() - start,
        retainedVersions: history.length,
      };
    },
    async prepare(id) {
      const [bytes, documentJSON] = await Promise.all([
        fetch(`/payload/${id}`).then((r) => r.arrayBuffer()),
        fetch("/document").then((r) => r.text()),
      ]);
      prepared = { id, bytes: new Uint8Array(bytes), documentJSON };
    },
    async run(count, memory = false) {
      if (!prepared) throw new Error("Call prepare first");
      const input = prepared;
      prepared = null;
      const c = candidate(input.id);
      await frame();
      performance.mark("bench-start");
      const start = performance.now();
      // Replacing a previously open document is part of the timed load.
      clear();
      const result: BrowserSample = {
        decode: 0,
        hydrate: 0,
        editor: 0,
        layout: 0,
        frameWait: 0,
        total: 0,
        edit: 0,
      };
      const probe = async (phase: string) => {
        if (memory) await window.memoryProbe(phase);
      };
      for (let i = 0; i < count; i++) {
        let t = performance.now();
        let state: unknown = c.decode(input.bytes);
        result.decode += performance.now() - t;
        await probe("decoded");
        t = performance.now();
        // Explicit conversion-to-internal-format interval, independent of decode.
        const list = c.hydrate(state);
        result.hydrate += performance.now() - t;
        // eslint-disable-next-line no-useless-assignment -- release before the intrusive memory probe
        state = null; // Only the editable list retains the state it needs.
        await probe("hydrated");
        t = performance.now();
        const host = document.createElement("section");
        root.append(host);
        const doc = PMNode.fromJSON(schema, JSON.parse(input.documentJSON));
        const view = new EditorView(host, {
          state: EditorState.create({ schema, doc }),
        });
        editors.push({ list, view, candidate: c });
        result.editor += performance.now() - t;
        await probe("editor");
      }
      const t = performance.now();
      // Force layout for all mounted editors, not just the visible first one.
      for (const { view } of editors)
        void view.dom.getBoundingClientRect().height;
      result.layout = performance.now() - t;
      await probe("layout");
      const syncEnd = performance.now();
      // A rendering opportunity passes between callbacks. This is a readiness
      // proxy, not an assertion about physical display scan-out.
      await frame();
      await frame();
      const ready = performance.now();
      result.total = ready - start;
      performance.mark("bench-end");
      result.frameWait = ready - syncEnd;
      // Account for teardown and loop overhead in editor work so the components
      // exactly partition the observed total (not independently timed means).
      result.editor =
        result.total -
        result.decode -
        result.hydrate -
        result.layout -
        result.frameWait;
      const editStart = performance.now();
      const first = editors[0];
      first.list = first.list.insertAfter(null, {
        bunchId: firstEditBunchId,
        counter: 0,
      });
      first.view.dispatch(first.view.state.tr.insertText("x", 1));
      first.view.focus();
      await frame();
      await frame();
      result.edit = performance.now() - editStart;
      performance.mark("bench-edit-end");
      return result;
    },
    async exercise(workload) {
      const entry = editors[0];
      let list = entry.list;
      await frame();
      performance.mark("bench-start");
      const started = performance.now();
      let checksum = 0;
      for (const query of workload.lookups) {
        const id = list.at(query.index);
        if (id.bunchId !== query.id.bunchId || id.counter !== query.id.counter)
          throw new Error("Lookup mismatch");
        checksum += list.indexOf(query.id);
      }
      const lookupMs = performance.now() - started;
      const editStart = performance.now();
      for (const edit of workload.edits)
        list =
          edit.type === "insert"
            ? list.insertAfter(edit.before, edit.id)
            : list.delete(edit.id);
      const editMs = performance.now() - editStart;
      entry.list = list;
      // Render the resulting document once. These are batch library-operation
      // timings, not 200 simulated user keystrokes or per-keystroke paint latency.
      const doc = PMNode.fromJSON(schema, {
        type: "doc",
        content: workload.expectedText.split("\n").map((text) => ({
          type: "paragraph",
          ...(text ? { content: [{ type: "text", text }] } : {}),
        })),
      });
      entry.view.dispatch(
        entry.view.state.tr.replaceWith(
          0,
          entry.view.state.doc.content.size,
          doc.content,
        ),
      );
      void entry.view.dom.getBoundingClientRect().height;
      await frame();
      await frame();
      const totalMs = performance.now() - started;
      performance.mark("bench-end");
      // Separate from editing/rendering: measure export of the edited state to
      // the SAME candidate interchange shape, then JSON encoding. No network timing.
      const snapshotStart = performance.now();
      const snapshot = entry.candidate.snapshot!(list);
      const snapshotMs = performance.now() - snapshotStart;
      const stringifyStart = performance.now();
      const serialized = JSON.stringify(snapshot);
      const stringifyMs = performance.now() - stringifyStart;
      if (
        JSON.stringify(
          entry.candidate.hydrate(JSON.parse(serialized)).save(),
        ) !== JSON.stringify(workload.expected)
      )
        throw new Error("Exported snapshot mismatch");
      if (checksum !== workload.lookups.reduce((sum, q) => sum + q.index, 0))
        throw new Error("Index mismatch");
      if (JSON.stringify(list.save()) !== JSON.stringify(workload.expected))
        throw new Error("Edited IDs mismatch");
      const text = Array.from(
        entry.view.dom.querySelectorAll("p"),
        (p) => p.textContent,
      ).join("\n");
      if (text !== workload.expectedText)
        throw new Error("Edited DOM mismatch");
      return { lookupMs, editMs, totalMs, snapshotMs, stringifyMs };
    },
    clear,
    check(saved, text, edited = true) {
      const expected = IdList.load(saved);
      for (let i = 0; i < editors.length; i++) {
        const e = editors[i];
        const expectedList =
          i === 0 && edited
            ? expected.insertAfter(null, {
                bunchId: firstEditBunchId,
                counter: 0,
              })
            : expected;
        if (
          JSON.stringify(e.list.save()) !== JSON.stringify(expectedList.save())
        )
          throw new Error("ID state mismatch");
        const actual = e.view.state.doc.textBetween(
          0,
          e.view.state.doc.content.size,
          "\n",
        );
        const dom = Array.from(
          e.view.dom.querySelectorAll("p"),
          (p) => p.textContent,
        ).join("\n");
        const expectedText = (i === 0 && edited ? "x" : "") + text;
        if (actual !== expectedText || dom !== expectedText)
          throw new Error("Rendered document mismatch");
        if (e.list.length !== actual.length)
          throw new Error("ID/text lengths disagree");
      }
    },
  };
}
