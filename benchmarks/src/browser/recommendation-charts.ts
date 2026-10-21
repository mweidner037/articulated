import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// Presentation only: read the validated final summary, never rerun measurements.
const root = path.resolve(__dirname, "../..");
const summary = JSON.parse(
  fs.readFileSync(
    path.join(root, "results/flat-f64-browser-1/summary.json"),
    "utf8",
  ),
) as {
  rows: {
    id: string;
    snappyKB: number[];
    zstdKB: number[];
    timings: { readyP95: number; retainedMB: number }[];
  }[];
};
assert.equal(summary.rows.length, 5);
const names: Record<string, string> = {
  F01: "F01 · Original objects",
  F05: "F05 · Flat columns / ID array",
  "Sflat-joined": "Flat JSON · Joined IDs",
  "Flat-JSON-direct": "Flat JSON · Direct reader",
  "Flat-F64": "Flat Float64 · BSON response",
};
const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
type Row = { label: string; values: number[] };
function chart(
  title: string,
  subtitle: string,
  rows: Row[],
  series: string[],
  units: string,
  digits: number,
  filename: string,
) {
  const width = 980,
    left = 290,
    plotWidth = 540;
  const height = 150 + rows.length * 72;
  const largest = Math.max(...rows.flatMap((r) => r.values));
  assert(largest > 0 && rows.every((r) => r.values.every(Number.isFinite)));
  const max = Math.ceil(largest * 1.1);
  const x = (value: number) => left + (value / max) * plotWidth;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">`,
    `<rect width="100%" height="100%" fill="white"/>`,
    `<style>text{font-family:Arial,sans-serif;fill:#172b4d;font-size:14px}.title{font-size:22px;font-weight:600}.sub{fill:#42526e;font-size:13px}.value{font-variant-numeric:tabular-nums}</style>`,
    `<text class="title" x="24" y="32">${esc(title)}</text>`,
    `<text class="sub" x="24" y="56">${esc(subtitle)}</text>`,
  ];
  const colors = ["#2459a6", "#559d8b"];
  series.forEach((name, i) => {
    svg.push(
      `<rect x="${left + i * 180}" y="72" width="12" height="12" fill="${colors[i]}"/><text x="${left + i * 180 + 20}" y="83">${esc(name)}</text>`,
    );
  });
  for (let tick = 0; tick <= 4; tick++) {
    const value = (max * tick) / 4;
    svg.push(
      `<line x1="${x(value)}" x2="${x(value)}" y1="98" y2="${height - 46}" stroke="#e3e8ef"/><text class="sub" x="${x(value)}" y="${height - 26}" text-anchor="middle">${value.toFixed(digits > 1 ? 1 : 0)}</text>`,
    );
  }
  rows.forEach((row, i) => {
    const y = 112 + i * 72;
    svg.push(`<text x="24" y="${y + 17}">${esc(row.label)}</text>`);
    row.values.forEach((value, j) => {
      svg.push(
        `<rect x="${left}" y="${y + j * 22}" width="${x(value) - left}" height="17" fill="${colors[j]}"/><text class="value" x="${x(value) + 8}" y="${y + j * 22 + 13}">${value.toFixed(digits)}</text>`,
      );
    });
  });
  svg.push(
    `<text class="sub" x="${left + plotWidth / 2}" y="${height - 6}" text-anchor="middle">${esc(units)} · zero-based axis · lower is better</text></svg>`,
  );
  const dir = path.join(root, "recommendation-charts");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), svg.join("\n"));
}
const sorted = [...summary.rows].sort(
  (a, b) =>
    Math.max(...a.timings.map((t) => t.readyP95)) -
    Math.max(...b.timings.map((t) => t.readyP95)),
);
chart(
  "Mongo storage",
  "Physical collection bytes / 100 independently renamed documents; both fresh builds agree.",
  summary.rows
    .filter((r) => r.id !== "Flat-JSON-direct")
    .sort((a, b) => a.zstdKB[0] - b.zstdKB[0])
    .map((r) => ({
      label: r.id === "Flat-F64" ? "Flat Float64 · Joined IDs" : names[r.id],
      values: [r.snappyKB[0], r.zstdKB[0]],
    })),
  ["Snappy", "zstd"],
  "KB per document",
  1,
  "storage.svg",
);
chart(
  "Browser ready p95",
  "Four editors; sorted by slower batch p95. Two batch results, not confidence intervals.",
  sorted.map((r) => ({
    label: names[r.id],
    values: r.timings.map((t) => t.readyP95),
  })),
  ["Batch 1", "Batch 2"],
  "Milliseconds",
  1,
  "browser.svg",
);
chart(
  "Retained browser JS",
  "Four editors after loading and first edit; same IdList runtime in every row.",
  sorted.map((r) => ({
    label: names[r.id],
    values: r.timings.map((t) => t.retainedMB),
  })),
  ["Batch 1", "Batch 2"],
  "MB (decimal)",
  3,
  "memory.svg",
);
