import { IdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { example } from "../full_picture/fixture";
import { explorationCandidates } from "./exploration-candidates";
import { formats } from "./formats";
import { opaqueFixture } from "./opaque-fixture";
import { sessionWorkload } from "./session-workload";

function freeze(value: unknown): void {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value)) freeze(child);
  }
}
test("opaque fixture preserves repeated identities without inventing client structure", () => {
  const mapped = opaqueFixture(example);
  assert.deepEqual(opaqueFixture(example), mapped);
  const mapping = new Map<string, string>();
  for (let i = 0; i < example.length; i++) {
    assert.match(mapped[i].bunchId, /^[A-Za-z0-9_-]{8}$/);
    assert.deepEqual({ ...mapped[i], bunchId: example[i].bunchId }, example[i]);
    const previous = mapping.get(example[i].bunchId);
    if (previous !== undefined) assert.equal(mapped[i].bunchId, previous);
    mapping.set(example[i].bunchId, mapped[i].bunchId);
  }
  assert.equal(new Set(mapping.values()).size, mapping.size);
  for (const candidate of explorationCandidates.filter(
    (c) => c.shape !== formats.split.name && c.shape !== formats.client.name,
  )) {
    assert.deepEqual(
      candidate.hydrate(candidate.decode(candidate.encode(mapped))).save(),
      mapped,
      candidate.id,
    );
  }
});
test("opaque session additions use collision-checked eight-character IDs", () => {
  const saved = opaqueFixture(example);
  const text = "x".repeat(IdList.load(saved).length);
  for (const kind of ["local", "distributed", "new-bunches"] as const) {
    const checkpoints = sessionWorkload(saved, text, kind, 1000, "opaque8");
    assert.deepEqual(
      checkpoints.map((c) => c.completed),
      [200, 1000],
    );
    for (const edit of checkpoints.flatMap((c) => c.edits)) {
      if (edit.type === "insert")
        assert.match(edit.id.bunchId, /^[A-Za-z0-9_-]{8}$/);
    }
  }
});
test("exploration contains all nine unchanged JSON shapes and an explicit plain SavedIdList baseline", () => {
  assert.equal(explorationCandidates.length, 31);
  assert.equal(new Set(explorationCandidates.map((c) => c.id)).size, 31);
  assert.deepEqual(
    new Set(explorationCandidates.map((c) => c.shape)),
    new Set(Object.values(formats).map((f) => f.name)),
  );
  const baseline = explorationCandidates.find((c) => c.id === "objects")!;
  assert.deepEqual(baseline.decode(baseline.encode(example)), example);
  for (const c of explorationCandidates) {
    assert.equal(c.encoding, "JSON");
    const reference = explorationCandidates.find(
      (r) => r.path === "objects" && r.shape === c.shape,
    )!;
    assert.deepEqual(c.encode(example), reference.encode(example), c.id);
  }
});
for (const c of explorationCandidates)
  test(`${c.id}: frozen input, edits, old versions and exported format round trip`, () => {
    const input = c.decode(c.encode(example));
    freeze(input);
    const original = c.hydrate(input);
    let actual = original,
      expected = IdList.load(example);
    const id = { bunchId: "new_0", counter: 2 ** 40 };
    const before = { bunchId: "alice_0", counter: 3 };
    actual = actual.insertAfter(before, id, 3);
    expected = expected.insertAfter(before, id, 3);
    actual = actual.delete({ bunchId: id.bunchId, counter: id.counter + 1 });
    expected = expected.delete({
      bunchId: id.bunchId,
      counter: id.counter + 1,
    });
    assert.deepEqual(actual.save(), expected.save());
    assert.deepEqual(original.save(), example);
    for (let i = 0; i < expected.length; i++) {
      assert.deepEqual(actual.at(i), expected.at(i));
      assert.equal(actual.indexOf(actual.at(i)), i);
    }
    const snapshot = c.snapshot!(actual);
    assert.deepEqual(
      c.hydrate(JSON.parse(JSON.stringify(snapshot))).save(),
      expected.save(),
    );
    assert.deepEqual(c.decode(c.encode(example)), input);
  });
