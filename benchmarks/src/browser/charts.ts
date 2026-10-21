import assert from "node:assert/strict";

/** Static report charts. Each metric has its own zero-based scale and units. */
export interface ChartRow {
  label: string;
  detail?: string;
  values: number[];
}
const escape = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function comparisonChart(
  title: string,
  subtitle: string,
  headings: string[],
  rows: ChartRow[],
  note: string,
  rowHeading = "Interchange format",
) {
  assert(rows.length > 0 && headings.length > 0);
  for (const row of rows) {
    assert.equal(row.values.length, headings.length);
    assert(row.values.every((value) => Number.isFinite(value) && value >= 0));
  }
  const left = 425,
    column = 290,
    top = 138,
    step = 82;
  const width = left + headings.length * column + 20;
  const height = top + rows.length * step + 80;
  const text = (x: number, y: number, value: string, extra = "") =>
    `<text x="${x}" y="${y}" ${extra}>${escape(value)}</text>`;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">`,
    `<title id="title">${escape(title)}</title><desc id="desc">${escape(subtitle + " " + note)}. Exact values are labeled on every bar.</desc>`,
    `<style>text{font:17px Arial,Helvetica,sans-serif;fill:#243248}.small{font-size:15px}.title{font-size:25px;font-weight:500}</style><rect width="${width}" height="${height}" fill="white"/>`,
    text(24, 36, title, 'class="title"'),
    text(24, 68, subtitle),
    text(24, 110, rowHeading),
  ];
  headings.forEach((heading, j) => {
    const x = left + j * column;
    const max = Math.max(...rows.map((r) => r.values[j]), 0.1);
    const domain = Math.ceil(max * 1.05 * 10) / 10;
    const plot = column - 76;
    svg.push(text(x, 110, heading));
    for (let i = 0; i <= 2; i++) {
      const tick = x + (plot * i) / 2;
      svg.push(
        `<line x1="${tick}" x2="${tick}" y1="${top}" y2="${height - 67}" stroke="#e2e6eb"/>`,
        text(
          tick,
          height - 44,
          ((domain * i) / 2).toFixed(1),
          'class="small" text-anchor="middle"',
        ),
      );
    }
    rows.forEach((r, i) => {
      const y = top + i * step;
      const barWidth = (r.values[j] / domain) * plot;
      svg.push(
        `<rect x="${x}" y="${y + 27}" width="${barWidth}" height="23" fill="${["#3266a6", "#3c8077", "#8571ac"][j % 3]}"/>`,
        text(x + barWidth + 7, y + 45, r.values[j].toFixed(1), 'class="small"'),
      );
    });
  });
  rows.forEach((r, i) => {
    const y = top + i * step;
    const labelLines = [""];
    for (const word of r.label.split(" ")) {
      const last = labelLines.length - 1;
      if ((labelLines[last] + " " + word).trim().length > 43)
        labelLines.push(word);
      else labelLines[last] = (labelLines[last] + " " + word).trim();
    }
    assert(labelLines.length <= 2, "Shorten chart name to fit two lines");
    labelLines.forEach((line, j) => svg.push(text(24, y + 24 + j * 20, line)));
    if (r.detail) svg.push(text(24, y + 66, r.detail, 'class="small"'));
  });
  svg.push(text(24, height - 12, note, 'class="small"'), "</svg>");
  return svg.join("\n") + "\n";
}
