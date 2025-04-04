import { gunzipSync, gzipSync } from "fflate";
import fs from "fs";
import path from "path";

export function realTextTraceEdits(): {
  finalText: string;
  edits: Array<[number, number, string | undefined]>;
} {
  // A JSON import would be nicer, but it blows up the heap usage for some reason,
  // making heap snapshots slow.
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, "real_text_trace_edits.json"), {
      encoding: "utf8",
    })
  ) as {
    finalText: string;
    edits: Array<[number, number, string | undefined]>;
  };
}

export function getMemUsed() {
  if (global.gc) {
    // Experimentally, calling gc() twice makes memory msmts more reliable -
    // otherwise may get negative diffs (last trial getting GC'd in the middle?).
    global.gc();
    global.gc();
  }
  return process.memoryUsage().heapUsed;
}

export function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param percentiles Out of 100
 * @returns Nearest-rank percentiles
 */
export function percentiles(values: number[], percentiles: number[]): number[] {
  if (values.length === 0) return new Array<number>(percentiles.length).fill(0);

  values.sort((a, b) => a - b);
  const ans: number[] = [];
  for (const perc of percentiles) {
    ans.push(values[Math.ceil(values.length * (perc / 100)) - 1]);
  }
  return ans;
}

export function gzipString(str: string): Uint8Array {
  return gzipSync(new TextEncoder().encode(str));
}

export function gunzipString(data: Uint8Array): string {
  return new TextDecoder().decode(gunzipSync(data));
}
