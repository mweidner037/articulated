import assert from "node:assert/strict";
import { test } from "node:test";
import { EditorState } from "prosemirror-state";
import {
  applyDocumentEdit,
  canonicalSchema,
  generatedInsertionId,
  ParagraphOffsets,
} from "./canonical-page";
import type { CanonicalEdit } from "./canonical-workload";

test("generator-faithful insertion creates a fresh ID without mutating the trace", () => {
  const anchor = Object.freeze({
    bunchId: ["shared", "0"].join("_"),
    counter: 7,
  });
  const assigned = Object.freeze({
    bunchId: JSON.parse('"shared_0"') as string,
    counter: 8,
  });
  const continued = generatedInsertionId(anchor, assigned);
  assert.deepEqual(continued, assigned);
  assert.notEqual(continued, assigned);
  assert.notEqual(continued, anchor);
  const newlyAssigned = Object.freeze({ bunchId: "other_0", counter: 0 });
  assert.deepEqual(generatedInsertionId(anchor, newlyAssigned), newlyAssigned);
  assert.deepEqual(generatedInsertionId(null, newlyAssigned), newlyAssigned);
  assert.equal(anchor.counter, 7);
  assert.equal(assigned.counter, 8);
});

test("canonical paragraph offsets and real PM split/join match plain text after every operation", () => {
  const offsets = new ParagraphOffsets();
  let state = EditorState.create({ schema: canonicalSchema });
  let text = "",
    counter = 0;
  const apply = (type: "insert" | "delete", index: number, char = "") => {
    if (type === "delete") char = text[index];
    const edit: CanonicalEdit =
      type === "insert"
        ? {
            type,
            index,
            char,
            before: null,
            id: { bunchId: "test_0", counter: counter++ },
          }
        : { type, index, char, id: { bunchId: "test_0", counter: counter++ } };
    state = state.apply(applyDocumentEdit(state.tr, offsets, edit));
    text =
      type === "insert"
        ? text.slice(0, index) + char + text.slice(index)
        : text.slice(0, index) + text.slice(index + 1);
    assert.equal(state.doc.textBetween(0, state.doc.content.size, "\n"), text);
    assert.equal(offsets.textLength, text.length);
    assert.equal(state.doc.childCount, text.split("\n").length);
    for (let i = 0; i <= text.length; i++) {
      const actual = offsets.locate(i);
      const before = text.slice(0, i).split("\n");
      assert.equal(actual.paragraph, before.length - 1);
      assert.equal(actual.offset, before.at(-1)!.length);
      assert.equal(actual.position, i + before.length);
      const resolved = state.doc.resolve(actual.position);
      assert.equal(resolved.depth, 1);
      assert.equal(resolved.parentOffset, actual.offset);
    }
  };
  // Empty paragraphs at either end and repeated empty split/join boundaries.
  for (const char of "\n\na\nbc\n\n") apply("insert", text.length, char);
  apply("insert", 0, "z");
  apply("delete", 1);
  while (text.includes("\n")) apply("delete", text.indexOf("\n"));
  while (text.length) apply("delete", 0);
  let seed = 107;
  const random = (size: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % size;
  };
  for (let i = 0; i < 1200; i++) {
    if (!text.length || random(3))
      apply("insert", random(text.length + 1), random(4) ? "x" : "\n");
    else apply("delete", random(text.length));
  }
});

test("canonical paragraph mapping rejects invalid boundaries", () => {
  const offsets = new ParagraphOffsets();
  assert.throws(() => offsets.locate(-1));
  assert.throws(() => offsets.locate(1));
  assert.throws(() => offsets.locate(0.5));
  assert.throws(() => offsets.update({ type: "delete", index: 0, char: "x" }));
  assert.throws(() => offsets.update({ type: "delete", index: 0, char: "\n" }));
  offsets.update({ type: "insert", index: 0, char: "a" });
  assert.throws(() => offsets.update({ type: "delete", index: 0, char: "\n" }));
});
