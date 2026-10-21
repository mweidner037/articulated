import assert from "node:assert/strict";
import { test } from "node:test";
import { example } from "../full_picture/fixture";
import { candidates } from "./candidates";

for (const c of candidates)
  test(`${c.id}: round trip and same logical JSON within each family`, () => {
    for (const saved of [[], example]) {
      const state = c.decode(c.encode(saved));
      assert.deepEqual(c.hydrate(state).save(), saved);
      const baseline = candidates.find((other) => other.shape === c.shape)!;
      assert.deepEqual(
        c.logical(state),
        baseline.logical(baseline.decode(baseline.encode(saved))),
      );
    }
  });
