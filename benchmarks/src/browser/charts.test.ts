import assert from "node:assert/strict";
import { test } from "node:test";
import { comparisonChart } from "./charts";

test("comparison charts preserve caller ranking, label values and escape text", () => {
  const svg = comparisonChart(
    "A & B",
    "Fastest first",
    ["Time (ms)"],
    [
      { label: "Fast <row>", values: [0] },
      { label: "Slow row", detail: "JSON / objects", values: [23.45] },
    ],
    "Independent scales",
  );
  assert(svg.includes("A &amp; B"));
  assert(svg.includes("Fast &lt;row&gt;"));
  assert(svg.indexOf("Fast &lt;row&gt;") < svg.indexOf("Slow row"));
  assert(svg.includes(">23.4</text>"));
  assert(svg.includes(">0.0</text>"));
  assert(svg.includes("Time (ms)"));
  assert(!svg.includes("NaN"));
});

test("comparison charts reject missing or invalid metrics", () => {
  for (const values of [[], [NaN], [Infinity], [-1], [1, 2]])
    assert.throws(() =>
      comparisonChart(
        "Title",
        "Subtitle",
        ["MB"],
        [{ label: "Row", values }],
        "Note",
      ),
    );
  assert.throws(() => comparisonChart("Title", "Subtitle", ["MB"], [], "Note"));
});
