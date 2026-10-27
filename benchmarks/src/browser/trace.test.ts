import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeTrace, unionDuration } from "./trace";
test("GC pauses are clipped, unioned, and limited to the renderer main thread", () => {
  const e = (name: string, ts: number, dur = 0, tid = 1) => ({
    name,
    ts,
    dur,
    tid,
    pid: 1,
    ph: "X",
  });
  const result = analyzeTrace([
    e("bench-start", 1000),
    e("bench-end", 9000),
    e("MinorGC", 500, 2000),
    e("MajorGC", 2000, 3000),
    e("MinorGC", 8000, 2000),
    e("MinorGC", 1000, 8000, 2),
  ]);
  assert.equal(result[0].gcMs, 5);
  assert.equal(
    unionDuration([
      [0, 5],
      [2, 3],
      [10, 11],
    ]),
    6,
  );
});
