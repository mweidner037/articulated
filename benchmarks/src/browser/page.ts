import { IdList, type SavedIdList } from "articulated";
import { Node as PMNode, Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { candidate } from "./candidates";

export interface BrowserSample {
  decode: number;
  /** Decoded interchange state -> usable internal IdList tree, including
   * reconstruction, intermediate run objects (if any), validation and indexes.
   * Excludes decoding and editor/rendering. Kept as `hydrate` for raw-data compatibility.
   */
  hydrate: number;
  editor: number;
  layout: number;
  frameWait: number;
  total: number;
  edit: number;
}
export interface BrowserAPI {
  prepare(id: string): Promise<void>;
  run(count: number, memory?: boolean): Promise<BrowserSample>;
  clear(): void;
  check(saved: SavedIdList, text: string, edited?: boolean): void;
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
let editors: { list: IdList; view: EditorView }[] = [];
const root = document.getElementById("editors")!;
const frame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
function clear() {
  for (const { view } of editors) view.destroy();
  editors = [];
  prepared = null;
  root.replaceChildren();
}
window.benchmark = {
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
      state = null; // Do not retain a second snapshot beside the editable tree.
      await probe("hydrated");
      t = performance.now();
      const host = document.createElement("section");
      root.append(host);
      const doc = PMNode.fromJSON(schema, JSON.parse(input.documentJSON));
      const view = new EditorView(host, {
        state: EditorState.create({ schema, doc }),
      });
      editors.push({ list, view });
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
      bunchId: "browser-first-edit",
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
  clear,
  check(saved, text, edited = true) {
    const expected = IdList.load(saved);
    for (let i = 0; i < editors.length; i++) {
      const e = editors[i];
      const expectedList =
        i === 0 && edited
          ? expected.insertAfter(null, {
              bunchId: "browser-first-edit",
              counter: 0,
            })
          : expected;
      if (JSON.stringify(e.list.save()) !== JSON.stringify(expectedList.save()))
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
