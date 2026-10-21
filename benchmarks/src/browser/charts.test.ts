import assert from "node:assert/strict";
import { test } from "node:test";
import { comparisonChart } from "./charts";
import { formatLabel, formats, loaderName } from "./formats";

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

test("observed ranges include outliers in the axis and label whiskers honestly", () => {
  const svg = comparisonChart(
    "Observed timings",
    "Three trials",
    ["Time (ms)"],
    [{ label: "Row <A>", values: [20], ranges: [{ min: 10, max: 1000 }] }],
    "Lower is better",
  );
  assert(
    svg.includes(">1050.0</text>"),
    "Axis must include the 1000 ms outlier",
  );
  assert(
    svg.includes("Whiskers: observed min–max (not confidence intervals)."),
  );
  assert(svg.includes("Row &lt;A&gt;: observed min 10, max 1000"));
  const whisker =
    /class="observed-range"[^]*?<line x1="([\d.]+)" x2="([\d.]+)"/.exec(svg)!;
  assert(whisker);
  assert(Number(whisker[1]) >= 425);
  assert(Number(whisker[2]) > Number(whisker[1]));
  assert(Number(whisker[2]) <= 425 + 214, "Outlier must fit the plot");
});

test("observed ranges reject malformed bounds and missing metrics", () => {
  for (const ranges of [
    [],
    [{ min: -1, max: 20 }],
    [{ min: NaN, max: 20 }],
    [{ min: 0, max: Infinity }],
    [{ min: 11, max: 20 }],
    [{ min: 0, max: 9 }],
    [{ min: 20, max: 0 }],
    [{ min: 0, max: 20 }, undefined],
  ])
    assert.throws(() =>
      comparisonChart(
        "Title",
        "Subtitle",
        ["ms"],
        [{ label: "Row", values: [10], ranges }],
        "Note",
      ),
    );
});

test("omitted ranges leave existing charts byte-for-byte unchanged", () => {
  const without = comparisonChart(
    "Title",
    "Subtitle",
    ["ms"],
    [{ label: "Row", values: [10] }],
    "Note",
  );
  const omitted = comparisonChart(
    "Title",
    "Subtitle",
    ["ms"],
    [{ label: "Row", values: [10], ranges: [undefined] }],
    "Note",
  );
  assert.equal(omitted, without);
  assert(!without.includes("observed-range"));
  const mixed = comparisonChart(
    "Title",
    "Subtitle",
    ["ms", "MB"],
    [
      {
        label: "Row",
        values: [10, 2],
        ranges: [{ min: 10, max: 10 }, undefined],
      },
    ],
    "Note",
  );
  assert.equal((mixed.match(/class="observed-range"/g) ?? []).length, 1);
});

test("every interchange name fits the chart and has an explanation", () => {
  const names = Object.values(formats).map((f) => f.name);
  assert.equal(new Set(names).size, 9);
  for (const f of Object.values(formats)) {
    assert(f.explanation.length > 20);
    const svg = comparisonChart(
      "Title",
      "Internal format: existing IdList tree",
      ["ms"],
      [
        {
          label: formatLabel(f.name),
          values: [1],
          detail: `JSON · ${loaderName("objects")}`,
        },
      ],
      "Note",
    );
    assert(svg.includes("Interchange format"));
    assert(!svg.includes("NaN"));
  }
});

test("format IDs are stable and independent of rank, encoding or loader", () => {
  assert.deepEqual(
    Object.entries(formats).map(([key, f]) => [key, f.id]),
    [
      ["objects", "F01"],
      ["signed", "F02"],
      ["tuples", "F03"],
      ["columns", "F04"],
      ["omit", "F05"],
      ["split", "F06"],
      ["dictionary", "F07"],
      ["client", "F08"],
      ["full", "F09"],
    ],
  );
  assert.equal(
    formatLabel(formats.omit.name),
    "F05 — Columnar store: reconstruct counters",
  );
  assert.throws(() => formatLabel("missing format"));
});
