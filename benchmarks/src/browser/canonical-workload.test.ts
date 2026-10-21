import { ElementIdGenerator, IdList } from "articulated";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import type { TraceEdit } from "../internal/trace";
import {
  buildCanonicalWorkloads,
  canonicalEditDigest,
  parseUpstreamCanonicalTrace,
  verifyCanonicalProvenance,
} from "./canonical-workload";

const edits: TraceEdit[] = [
  { type: "insert", index: 0, char: "a" },
  { type: "insert", index: 1, char: "\n" },
  { type: "insert", index: 2, char: "b" },
  { type: "insert", index: 0, char: "X" },
  { type: "delete", index: 2 },
  { type: "insert", index: 2, char: "\n" },
  { type: "delete", index: 0 },
  { type: "insert", index: 3, char: "c" },
  { type: "delete", index: 1 },
];
const trace = { edits, finalText: "abc" };
test("final snapshot digest identifies exact assigned IDs and matches Mongo JSON serialization", () => {
  const workloads = buildCanonicalWorkloads(trace, { checkpoints: [2, 5] });
  const digest = (value: unknown) =>
    createHash("sha256").update(JSON.stringify(value)).digest("hex");
  for (const workload of [workloads.structured, workloads.opaque8]) {
    const saved = workload.chunks.at(-1)!.expected;
    assert.equal(workload.metadata.finalSavedSha256, digest(saved));
    assert.notEqual(
      workload.metadata.finalSavedSha256,
      digest(
        saved.map((row, i) =>
          i === 0 ? { ...row, bunchId: row.bunchId + "changed" } : row,
        ),
      ),
      "Equal operation/text digests must not hide different assigned identities",
    );
  }
  assert.equal(
    workloads.structured.metadata.editsSha256,
    workloads.opaque8.metadata.editsSha256,
  );
  assert.notEqual(
    workloads.structured.metadata.finalSavedSha256,
    workloads.opaque8.metadata.finalSavedSha256,
  );
  const empty = buildCanonicalWorkloads({ edits: [], finalText: "" });
  assert.equal(empty.structured.metadata.finalSavedSha256, digest([]));
  assert.equal(empty.opaque8.metadata.finalSavedSha256, digest([]));
});
function upstreamSource(source = trace) {
  const tuples = source.edits.map((edit) =>
    JSON.stringify(
      edit.type === "insert" ? [edit.index, 0, edit.char] : [edit.index, 1],
    ),
  );
  return `const edits = [\n  ${tuples.join(",\n  ")}\n];\n\nconst finalText = ${JSON.stringify(source.finalText)};\n\nif (typeof module === 'object') module.exports = { edits, finalText }\n`;
}

test("canonical workload preserves every index, character and newline edit from empty", () => {
  const workloads = buildCanonicalWorkloads(trace, { checkpoints: [2, 5, 9] });
  for (const workload of [workloads.structured, workloads.opaque8]) {
    assert.equal(workload.finalText, "abc");
    assert.deepEqual(
      workload.chunks.map((c) => [c.start, c.completed]),
      [
        [0, 2],
        [2, 5],
        [5, 9],
      ],
    );
    assert.deepEqual(workload.metadata.counts, {
      operations: 9,
      insertions: 6,
      deletions: 3,
      newlineInsertions: 2,
      newlineDeletions: 2,
      finalCharacters: 3,
    });
    assert.equal(workload.metadata.refreshInterval, null);
    assert.equal(workload.metadata.startState, "empty");
    let list = IdList.new(),
      text = "",
      i = 0;
    for (const chunk of workload.chunks) {
      for (const edit of chunk.edits) {
        const original = edits[i++];
        assert.equal(edit.type, original.type);
        assert.equal(edit.index, original.index);
        if (edit.type === "insert") {
          assert.equal(
            edit.char,
            (original as Extract<TraceEdit, { type: "insert" }>).char,
          );
          assert.deepEqual(
            edit.before,
            edit.index ? list.at(edit.index - 1) : null,
          );
          list = list.insertAfter(edit.before, edit.id);
          text = text.slice(0, edit.index) + edit.char + text.slice(edit.index);
        } else {
          assert.equal(edit.char, text[edit.index]);
          assert.deepEqual(edit.id, list.at(edit.index));
          list = list.delete(edit.id);
          text = text.slice(0, edit.index) + text.slice(edit.index + 1);
        }
      }
      assert.equal(text, chunk.text);
      assert.deepEqual(list.save(), chunk.expected);
    }
    assert.equal(i, 9);
    assert.equal(text, trace.finalText);
  }
});

test("canonical reference never calls IdList.load and assigns both identity models consistently", () => {
  const originalLoad = IdList.load;
  let workloads: ReturnType<typeof buildCanonicalWorkloads>;
  try {
    IdList.load = () => {
      throw new Error("Reference replay reloaded");
    };
    workloads = buildCanonicalWorkloads(trace, { checkpoints: [2, 5] });
  } finally {
    IdList.load = originalLoad;
  }
  assert.deepEqual(
    workloads,
    buildCanonicalWorkloads(trace, { checkpoints: [2, 5] }),
    "Assignments must be reproducible",
  );
  const structured = workloads.structured.chunks.flatMap((c) => c.edits),
    opaque = workloads.opaque8.chunks.flatMap((c) => c.edits);
  const mapping = new Map<string, string>();
  for (let i = 0; i < structured.length; i++) {
    const a = structured[i],
      b = opaque[i];
    assert.equal(a.id.counter, b.id.counter);
    assert.match(b.id.bunchId, /^[A-Za-z0-9_-]{8}$/);
    if (mapping.has(a.id.bunchId))
      assert.equal(mapping.get(a.id.bunchId), b.id.bunchId);
    else mapping.set(a.id.bunchId, b.id.bunchId);
  }
  assert.equal(new Set(mapping.values()).size, mapping.size);
  assert.equal(mapping.size, workloads.structured.metadata.bunchCount);
  assert.equal(
    workloads.structured.metadata.editsSha256,
    workloads.opaque8.metadata.editsSha256,
  );
  assert.equal(
    structured.length,
    trace.edits.length,
    "No synthetic initial operation",
  );
});

test("upstream provenance comparison parses data literals without executing JS", () => {
  const source = upstreamSource();
  assert.deepEqual(parseUpstreamCanonicalTrace(source), trace);
  const verification = verifyCanonicalProvenance(source, trace);
  assert.equal(verification.verified, true);
  assert.equal(verification.operations, 9);
  assert.equal(verification.editsSha256, canonicalEditDigest(edits));
  assert.match(verification.upstreamSha256, /^[0-9a-f]{64}$/);
  const workloads = buildCanonicalWorkloads(trace, {
    upstreamVerification: verification,
  });
  assert.deepEqual(
    workloads.structured.metadata.source.upstreamVerification,
    verification,
  );
  assert.throws(() =>
    parseUpstreamCanonicalTrace(source + "\nglobalThis.__executed = true;"),
  );
  assert.throws(() =>
    parseUpstreamCanonicalTrace(
      source.replace('[0,0,"a"]', '[0,0,(()=>"a")()]'),
    ),
  );
  assert.throws(() =>
    verifyCanonicalProvenance(source, { ...trace, finalText: "wrong" }),
  );
  assert.throws(() =>
    verifyCanonicalProvenance(source, {
      ...trace,
      edits: [{ type: "insert", index: 0, char: "x" }, ...edits.slice(1)],
    }),
  );
  assert.deepEqual(
    parseUpstreamCanonicalTrace(source.replace("\n];", ",\n];")),
    trace,
    "Allow only a trailing array comma, not executable expressions",
  );
});

test("canonical builder rejects invalid operations/final text and handles empty input", () => {
  assert.throws(() =>
    buildCanonicalWorkloads({ ...trace, finalText: "wrong" }),
  );
  assert.throws(() =>
    buildCanonicalWorkloads({
      edits: [{ type: "delete", index: 0 }],
      finalText: "",
    }),
  );
  assert.throws(() =>
    buildCanonicalWorkloads({
      edits: [{ type: "insert", index: 1, char: "a" }],
      finalText: "a",
    }),
  );
  assert.throws(() =>
    buildCanonicalWorkloads({
      edits: [{ type: "insert", index: 0, char: "ab" }],
      finalText: "ab",
    }),
  );
  assert.throws(() =>
    buildCanonicalWorkloads({
      edits: [{ type: "insert", index: 0, char: "é" }],
      finalText: "é",
    }),
  );
  assert.throws(() => buildCanonicalWorkloads(trace, { checkpoints: [0] }));
  for (const workload of Object.values(
    buildCanonicalWorkloads({ edits: [], finalText: "" }),
  ))
    assert.deepEqual(workload.chunks, [
      { start: 0, completed: 0, edits: [], expected: [], text: "" },
    ]);
});

test("canonical identity policy guarantees anchor reuse or a genuinely new bunch", () => {
  const workloads = buildCanonicalWorkloads(trace);
  for (const workload of [workloads.structured, workloads.opaque8]) {
    const next = new Map<string, number>();
    for (const edit of workload.chunks.flatMap((chunk) => chunk.edits)) {
      if (edit.type !== "insert") continue;
      if (edit.before?.bunchId === edit.id.bunchId) {
        assert.equal(edit.id.counter, edit.before.counter + 1);
        assert.equal(next.get(edit.id.bunchId), edit.id.counter);
      } else {
        assert.equal(next.has(edit.id.bunchId), false);
        assert.equal(edit.id.counter, 0);
      }
      next.set(edit.id.bunchId, edit.id.counter + 1);
    }
  }
  const original = ElementIdGenerator.prototype.generateAfter;
  try {
    ElementIdGenerator.prototype.generateAfter = function (before, count) {
      const id = original.call(this, before, count);
      return before && id.bunchId === before.bunchId
        ? { ...id, counter: id.counter + 1 }
        : id;
    };
    assert.throws(
      () => buildCanonicalWorkloads(trace),
      /Continuation must follow its anchor counter/,
    );
  } finally {
    ElementIdGenerator.prototype.generateAfter = original;
  }
});
