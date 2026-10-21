import type { ElementId, SavedIdList } from "articulated";
import { Schema } from "prosemirror-model";
import { EditorState, type Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { CanonicalEdit } from "./canonical-workload";
import { explorationCandidate } from "./exploration-candidates";
import type { BenchmarkList } from "./list-interface";

export const canonicalSchema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*", toDOM: () => ["p", 0] },
    text: {},
  },
});

/** Common editor bookkeeping, independent of the candidate ID container.
 * Paragraph lengths have a Fenwick sum index. Character edits update one entry;
 * paragraph splits/joins rebuild this small index. No full-document text scan is
 * needed on each keystroke. A paragraph's virtual trailing newline has weight 1,
 * including the last paragraph's insertion-at-end sentinel. */
export class ParagraphOffsets {
  private lengths = [0];
  private sums = [0, 1];
  get textLength() {
    let sum = 0;
    for (let i = this.lengths.length; i > 0; i -= i & -i) sum += this.sums[i];
    return sum - 1;
  }
  locate(index: number): {
    paragraph: number;
    offset: number;
    position: number;
  } {
    if (!Number.isSafeInteger(index) || index < 0 || index > this.textLength)
      throw new Error("Text offset outside document");
    let paragraph = 0,
      before = 0;
    let step = 1;
    while (step * 2 <= this.lengths.length) step *= 2;
    for (; step; step = Math.floor(step / 2)) {
      const next = paragraph + step;
      if (next <= this.lengths.length && before + this.sums[next] <= index) {
        paragraph = next;
        before += this.sums[next];
      }
    }
    return {
      paragraph,
      offset: index - before,
      position: index + paragraph + 1,
    };
  }
  private rebuild() {
    this.sums = new Array(this.lengths.length + 1).fill(0);
    for (let i = 0; i < this.lengths.length; i++) {
      this.sums[i + 1] += this.lengths[i] + 1;
      const parent = i + 1 + ((i + 1) & -(i + 1));
      if (parent < this.sums.length) this.sums[parent] += this.sums[i + 1];
    }
  }
  update(edit: Pick<CanonicalEdit, "type" | "index" | "char">) {
    const { paragraph, offset } = this.locate(edit.index);
    if (edit.char === "\n") {
      if (edit.type === "insert") {
        const old = this.lengths[paragraph];
        this.lengths.splice(paragraph, 1, offset, old - offset);
      } else {
        if (
          offset !== this.lengths[paragraph] ||
          paragraph + 1 >= this.lengths.length
        )
          throw new Error("Deleted newline is not a paragraph boundary");
        this.lengths.splice(
          paragraph,
          2,
          this.lengths[paragraph] + this.lengths[paragraph + 1],
        );
      }
      this.rebuild();
    } else {
      if (edit.type === "delete" && offset >= this.lengths[paragraph])
        throw new Error("Character deletion reached a paragraph boundary");
      const delta =
        edit.type === "insert" ? edit.char.length : -edit.char.length;
      this.lengths[paragraph] += delta;
      for (let i = paragraph + 1; i < this.sums.length; i += i & -i)
        this.sums[i] += delta;
    }
  }
}

/** Real PM paragraph splits and joins, not a final whole-document replacement. */
export function applyDocumentEdit(
  transaction: Transaction,
  offsets: ParagraphOffsets,
  edit: CanonicalEdit,
): Transaction {
  const { position } = offsets.locate(edit.index);
  if (edit.type === "insert") {
    if (edit.char === "\n") transaction.split(position);
    else transaction.insertText(edit.char, position);
  } else if (edit.char === "\n") transaction.join(position + 1);
  else transaction.delete(position, position + edit.char.length);
  offsets.update(edit);
  return transaction;
}

export interface CanonicalSample {
  operations: number;
  elapsedMs: number;
  retainedVersions: number;
}
export interface CanonicalCheck {
  saved: SavedIdList;
  text: string;
  samples: { index: number; id: ElementId }[];
}
export interface CanonicalAPI {
  initialize(candidate: string, editor: boolean): void;
  prepareFullTrace(url: string): Promise<number>;
  replayFullTrace(): CanonicalSample;
  replayEditorChunk(
    edits: CanonicalEdit[],
    start: number,
    historyLimit: number,
  ): Promise<CanonicalSample>;
  check(
    expected: CanonicalCheck,
    completed: number,
  ): {
    fullSavedState: true;
    sampledLookups: true;
    renderedText: boolean;
    operations: number;
  };
  releaseHistory(): void;
}
declare global {
  interface Window {
    canonicalBenchmark: CanonicalAPI;
  }
}

/** Match generateAfter's string sharing without rerunning identity generation.
 * The reference builder proves a non-continuing bunch is globally new. JSON
 * input may duplicate equal strings; continuation must reuse the actual anchor
 * returned by this container, just as the live generator would. There is no
 * retained intern table. This common object allocation is inside the clock. */
export function generatedInsertionId(
  anchor: ElementId | null,
  assigned: ElementId,
): ElementId {
  return {
    bunchId:
      anchor && anchor.bunchId === assigned.bunchId
        ? anchor.bunchId
        : assigned.bunchId,
    counter: assigned.counter,
  };
}

function installCanonicalBenchmark() {
  let current: BenchmarkList | undefined;
  let view: EditorView | undefined;
  let offsets: ParagraphOffsets | undefined;
  let history: BenchmarkList[] = [];
  let prepared: CanonicalEdit[] | undefined;
  let completed = 0;
  const root = document.getElementById("editor")!;
  const frame = () =>
    new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  function applyIdEdit(edit: CanonicalEdit) {
    if (!current) throw new Error("Initialize the empty container first");
    const actual =
      edit.type === "insert"
        ? edit.index
          ? current.at(edit.index - 1)
          : null
        : current.at(edit.index);
    const expected = edit.type === "insert" ? edit.before : edit.id;
    if (
      actual?.bunchId !== expected?.bunchId ||
      actual?.counter !== expected?.counter
    )
      throw new Error(
        `Canonical anchor/target mismatch at operation ${completed}`,
      );
    current =
      edit.type === "insert"
        ? current.insertAfter(actual, generatedInsertionId(actual, edit.id))
        : current.delete(actual!);
    completed++;
  }
  window.canonicalBenchmark = {
    initialize(id, editor) {
      if (current || view || completed)
        throw new Error("Each full replay requires a fresh context");
      const candidate = explorationCandidate(id);
      current = candidate.hydrate(candidate.decode(candidate.encode([])));
      if (current.length !== 0)
        throw new Error("Canonical replay must begin empty");
      if (editor) {
        offsets = new ParagraphOffsets();
        view = new EditorView(root, {
          state: EditorState.create({ schema: canonicalSchema }),
        });
      }
    },
    async prepareFullTrace(url) {
      if (view || completed || prepared)
        throw new Error("Trace preparation is for a fresh ID-only replay");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Cannot fetch canonical operations");
      prepared = (await response.json()) as CanonicalEdit[];
      return prepared.length;
    },
    replayFullTrace() {
      if (!prepared || !current || completed || view)
        throw new Error("Prepare a fresh ID-only replay");
      const edits = prepared;
      prepared = undefined;
      // Exactly one clock around the full stream: no per-operation timing probes,
      // yielding, forced collection, chunk pauses, reloads or synthetic edits.
      const start = performance.now();
      for (const edit of edits) applyIdEdit(edit);
      const elapsedMs = performance.now() - start;
      return { operations: completed, elapsedMs, retainedVersions: 0 };
    },
    async replayEditorChunk(edits, start, historyLimit) {
      if (!view || !offsets || !current || prepared || completed !== start)
        throw new Error(
          "Editor chunks must continue the same unreloaded document",
        );
      if (historyLimit !== 0 && historyLimit !== 100)
        throw new Error("Unsupported history limit");
      const before = completed;
      const began = performance.now();
      for (const edit of edits) {
        if (historyLimit) {
          history.push(current!);
          if (history.length > historyLimit) history.shift();
        }
        applyIdEdit(edit);
        view.dispatch(applyDocumentEdit(view.state.tr, offsets, edit));
      }
      void view.dom.getBoundingClientRect().height;
      await frame();
      await frame();
      return {
        operations: completed - before,
        elapsedMs: performance.now() - began,
        retainedVersions: history.length,
      };
    },
    check(expected, count) {
      if (
        !current ||
        completed !== count ||
        current.length !== expected.text.length
      )
        throw new Error("Canonical operation count or final length mismatch");
      const saved = current.save();
      if (saved.length !== expected.saved.length)
        throw new Error("Canonical saved run count mismatch");
      for (let i = 0; i < saved.length; i++) {
        const actual = saved[i],
          wanted = expected.saved[i];
        if (
          actual.bunchId !== wanted.bunchId ||
          actual.startCounter !== wanted.startCounter ||
          actual.count !== wanted.count ||
          actual.isDeleted !== wanted.isDeleted
        )
          throw new Error(`Canonical saved state mismatch at run ${i}`);
      }
      for (const sample of expected.samples) {
        const id = current.at(sample.index);
        if (
          id.bunchId !== sample.id.bunchId ||
          id.counter !== sample.id.counter ||
          current.indexOf(sample.id) !== sample.index
        )
          throw new Error("Canonical sampled lookup mismatch");
      }
      if (view) {
        if (!view.dom.isConnected || root.childElementCount !== 1)
          throw new Error("Canonical editor not mounted");
        const text = view.state.doc.textBetween(
          0,
          view.state.doc.content.size,
          "\n",
        );
        const rendered = [...view.dom.querySelectorAll("p")]
          .map((p) => p.textContent ?? "")
          .join("\n");
        if (
          text !== expected.text ||
          rendered !== expected.text ||
          offsets!.textLength !== expected.text.length
        )
          throw new Error("Canonical editor state or rendered text mismatch");
      }
      return {
        fullSavedState: true,
        sampledLookups: true,
        renderedText: Boolean(view),
        operations: completed,
      };
    },
    releaseHistory() {
      history = [];
    },
  };
}
if (typeof window !== "undefined") installCanonicalBenchmark();
