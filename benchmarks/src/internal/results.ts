import fs from "fs";
import path from "path";

export const RESULTS_FILE = path.join(__dirname, "../../results/data.csv");

export const CSV_COLUMNS = [
  "Trace",
  "Refresh Interval",
  "Measurement",
  "Algorithm",
  "Datum",
  "Value",
] as const;

/**
 * Creates RESULTS_FILE with its CSV header if it doesn't exist already.
 */
export function ensureResultsFile() {
  if (fs.existsSync(RESULTS_FILE)) return;
  fs.mkdirSync(path.dirname(RESULTS_FILE), { recursive: true });
  fs.writeFileSync(RESULTS_FILE, formatCsvRow(CSV_COLUMNS));
}

export function appendResultRows(rows: string[][]) {
  ensureResultsFile();
  fs.appendFileSync(RESULTS_FILE, rows.map(formatCsvRow).join(""));
}

/**
 * Formats a CSV row, quoting all fields except numbers.
 */
export function formatCsvRow(fields: readonly string[]): string {
  return (
    fields
      .map((field) =>
        field !== "" && field.trim() === field && Number.isFinite(Number(field))
          ? field
          : `"${field.replaceAll('"', '""')}"`,
      )
      .join(",") + "\n"
  );
}

/**
 * Parses CSV text (as written by formatCsvRow) into rows of fields.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length !== 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
