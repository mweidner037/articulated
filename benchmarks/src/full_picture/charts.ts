import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

interface Estimate {
  mean: number;
  ci95: number | null;
}
export interface ChartRow {
  name: string;
  snapshotBytes: number;
  liveBytes: number;
  saveMs: Estimate;
  loadMs: Estimate;
  mongoLoadMs: Estimate;
}
interface Value {
  value: number;
  error?: number;
}
interface Panel {
  title: string;
  unit: string;
  values: Value[][];
  domain?: number;
  precision: number;
}

// Short labels are shared by every chart; the report retains the complete names.
const labels: Record<string, string> = {
  objects: "Original objects",
  signed: "Signed objects",
  tuples: "Signed tuples",
  columns: "Ordinary columns",
  omit: "Columns + omit",
  "split-omit": "Split + omit / JSON",
  "dictionary-omit": "Dictionary + omit / JSON",
  "dictionary-proto": "Dictionary / protobuf",
  "split-proto": "Split / protobuf",
  "split-proto-direct": "Split / protobuf · direct",
  "binary-adapter": "Binary columns · adapter",
  "binary-direct": "Binary columns · direct",
  "bit-adapter": "Bit-packed · adapter",
  "bit-direct": "Bit-packed · direct",
};
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const colors = ["#3266a6", "#b45b21"];

// Static, dependency-free SVGs for GitHub. Numeric labels are the source values,
// not values inferred from pixel widths. All bars start at zero.
function chart(
  title: string,
  subtitle: string,
  names: string[],
  panels: Panel[],
  series: string[] = [],
) {
  const width = 1100;
  const left = 310;
  const panelWidth = 365;
  const plotWidth = 270;
  const paired = series.length === 2;
  const rowHeight = paired ? 78 : 47;
  const top = paired ? 145 : 115;
  const bottom = top + names.length * rowHeight;
  const height = bottom + 80;
  const svg: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escape(title)}</title>`,
    `<desc id="desc">${escape(subtitle)} Lower is better. ${panels.map((p) => `${p.title}: ${names.map((name, i) => `${name}: ${p.values[i].map((v, j) => `${series[j] ?? ""} ${v.value.toFixed(p.precision)}${v.error === undefined ? "" : ` ± ${v.error.toFixed(p.precision)}`} ${p.unit}`).join(", ")}`).join("; ")}`).join(". ")}</desc>`,
    "<style>text{font-family:Arial,Helvetica,sans-serif;font-size:17px;fill:#243248} .secondary{fill:#526175} .title{font-size:24px;font-weight:500} .panel{font-weight:500} .tick{font-size:16px}</style>",
    `<rect width="${width}" height="${height}" fill="#ffffff"/>`,
    `<text x="24" y="34" class="title">${escape(title)}</text>`,
    `<text x="24" y="64" class="secondary">${escape(subtitle)}</text>`,
    `<text x="24" y="${top - 18}" class="panel">Format / path</text>`,
  ];
  if (paired)
    series.forEach((label, i) => {
      svg.push(
        `<rect x="${left + i * 190}" y="84" width="16" height="16" fill="${colors[i]}"/>`,
        `<text x="${left + 24 + i * 190}" y="98">${escape(label)}</text>`,
      );
    });
  names.forEach((name, i) => {
    svg.push(
      `<text x="24" y="${top + i * rowHeight + rowHeight / 2 + 6}">${escape(name)}</text>`,
    );
  });
  panels.forEach((panel, p) => {
    assert.equal(panel.values.length, names.length);
    const max =
      panel.domain ??
      Math.max(...panel.values.flat().map((v) => v.value + (v.error ?? 0))) *
        1.12;
    assert(max > 0 && Number.isFinite(max));
    const x = left + p * panelWidth;
    svg.push(
      `<text x="${x}" y="${top - 18}" class="panel">${escape(panel.title)}</text>`,
    );
    for (let tick = 0; tick <= 3; tick++) {
      const tx = x + (tick / 3) * plotWidth;
      svg.push(
        `<line x1="${tx}" x2="${tx}" y1="${top}" y2="${bottom}" stroke="#e2e6eb"/>`,
        `<text x="${tx}" y="${bottom + 26}" text-anchor="middle" class="tick secondary">${((tick / 3) * max).toFixed(panel.precision)}</text>`,
      );
    }
    svg.push(
      `<text x="${x + plotWidth / 2}" y="${bottom + 57}" text-anchor="middle">${escape(panel.unit)} · lower is better</text>`,
    );
    panel.values.forEach((values, i) => {
      values.forEach((v, j) => {
        assert(Number.isFinite(v.value) && v.value >= 0);
        assert(v.error === undefined || (v.error >= 0 && v.value >= v.error));
        const cy =
          top + i * rowHeight + rowHeight / 2 + (paired ? j * 32 - 16 : 0);
        const end = x + (v.value / max) * plotWidth;
        svg.push(
          `<rect x="${x}" y="${cy - 10}" width="${end - x}" height="20" fill="${colors[j]}"/>`,
        );
        if (v.error !== undefined) {
          const delta = (v.error / max) * plotWidth;
          svg.push(
            `<path d="M${end - delta} ${cy}H${end + delta} M${end - delta} ${cy - 5}V${cy + 5} M${end + delta} ${cy - 5}V${cy + 5}" fill="none" stroke="#243248" stroke-width="1.5"/>`,
          );
        }
        svg.push(
          `<text x="${x + plotWidth + 14}" y="${cy + 6}">${v.value.toFixed(panel.precision)}</text>`,
        );
      });
    });
  });
  return svg.join("\n") + "\n</svg>\n";
}

export function writeCharts(
  rows: ChartRow[],
  disk: (name: string, compressor: string, gzip: boolean) => number,
) {
  const directory = path.resolve(
    __dirname,
    "../../results/full-picture/charts",
  );
  fs.mkdirSync(directory, { recursive: true });
  const byName = new Map(rows.map((r) => [r.name, r]));
  const all = Object.keys(labels);
  assert.deepEqual(new Set(byName.keys()), new Set(all));
  const selected = [
    "objects",
    "columns",
    "split-proto",
    "binary-direct",
    "bit-direct",
  ];
  const names = (keys: string[]) => keys.map((key) => labels[key]);
  const measured = (
    keys: string[],
    field: "saveMs" | "loadMs" | "mongoLoadMs",
  ) =>
    keys.map((key) => {
      const value = byName.get(key)![field];
      return [{ value: value.mean, error: value.ci95 ?? undefined }];
    });
  const memory = (keys: string[], field: "snapshotBytes" | "liveBytes") =>
    keys.map((key) => [{ value: byName.get(key)![field] / 1e6 }]);
  const storage = (keys: string[], compressor: string) =>
    keys.map((key) => [{ value: disk(key, compressor, false) }]);
  const write = (file: string, svg: string) =>
    fs.writeFileSync(path.join(directory, `${file}.svg`), svg);
  write(
    "overview",
    chart(
      "The smallest storage and fastest load are different choices",
      "Selected comparisons · one shared fixture · time whiskers: within-process 95% intervals",
      names(selected),
      [
        {
          title: "Mongo storage · Snappy",
          unit: "KB / document",
          values: storage(selected, "snappy"),
          precision: 1,
        },
        {
          title: "BSON → editable IdList",
          unit: "ms",
          values: measured(selected, "mongoLoadMs"),
          precision: 2,
        },
      ],
    ),
  );
  const memoryDomain =
    (Math.max(...rows.map((r) => Math.max(r.snapshotBytes, r.liveBytes))) /
      1e6) *
    1.12;
  const memoryPanels = (keys: string[]): Panel[] => [
    {
      title: "Retained snapshot",
      unit: "MB",
      values: memory(keys, "snapshotBytes"),
      domain: memoryDomain,
      precision: 2,
    },
    {
      title: "Retained editable IdList",
      unit: "MB",
      values: memory(keys, "liveBytes"),
      domain: memoryDomain,
      precision: 2,
    },
  ];
  write(
    "memory-overview",
    chart(
      "Compact snapshots do not eliminate the editing tree",
      "Same scale in both panels · alternative retention choices, not additive · Node/V8, not browser",
      names(selected),
      memoryPanels(selected),
    ),
  );
  const pairs = [
    ["binary-adapter", "binary-direct"],
    ["bit-adapter", "bit-direct"],
    ["split-proto", "split-proto-direct"],
  ];
  const paired = (field: "saveMs" | "loadMs") =>
    pairs.map((pair) =>
      pair.map((key) => {
        const v = byName.get(key)![field];
        return { value: v.mean, error: v.ci95 ?? undefined };
      }),
    );
  write(
    "translation",
    chart(
      "Removing the intermediate objects helps some loads, but costs more to save",
      "Identical saved bytes within each pair · mean ± within-process 95% interval · no database I/O",
      ["Binary columns", "Bit-packed columns", "Split / protobuf"],
      [
        {
          title: "Tree → saved value",
          unit: "ms",
          values: paired("saveMs"),
          precision: 2,
        },
        {
          title: "Saved value → editable IdList",
          unit: "ms",
          values: paired("loadMs"),
          precision: 2,
        },
      ],
      ["Via objects", "Direct"],
    ),
  );
  const unique = all.filter((key) => !key.endsWith("-direct"));
  const storageDomain =
    Math.max(
      ...unique.flatMap((key) => [
        disk(key, "snappy", false),
        disk(key, "zstd", false),
      ]),
    ) * 1.12;
  write(
    "all-storage",
    chart(
      "Mongo storage: every distinct persisted format",
      "Native BSON layouts after compact + checkpoint · direct and adapter paths have identical bytes",
      names(unique),
      [
        {
          title: "Snappy",
          unit: "KB / document",
          values: storage(unique, "snappy"),
          domain: storageDomain,
          precision: 1,
        },
        {
          title: "Zstd",
          unit: "KB / document",
          values: storage(unique, "zstd"),
          domain: storageDomain,
          precision: 1,
        },
      ],
    ),
  );
  write(
    "all-memory",
    chart(
      "Retained JS memory: every format and load path",
      "Same scale in both panels · alternative retention choices, not additive · Node/V8, not browser",
      names(all),
      memoryPanels(all),
    ),
  );
  write(
    "all-time",
    chart(
      "Save and Mongo-load time: every format and path",
      "Mean ± within-process 95% interval · BSON load includes decoding + tree construction, not database I/O",
      names(all),
      [
        {
          title: "Tree → saved value",
          unit: "ms",
          values: measured(all, "saveMs"),
          precision: 2,
        },
        {
          title: "BSON → editable IdList",
          unit: "ms",
          values: measured(all, "mongoLoadMs"),
          precision: 2,
        },
      ],
    ),
  );
}
