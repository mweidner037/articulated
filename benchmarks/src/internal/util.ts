import { execFile } from "child_process";
import { gunzipSync, gzipSync } from "fflate";
import path from "path";
import type seedrandom from "seedrandom";
import { promisify } from "util";
import type {
  TextAlgorithm,
  TextAlgorithmConstructor,
} from "../algorithms/base";
import type { TraceEdit, TraceProseMirrorEdit } from "./trace";

export function getMemUsed() {
  if (global.gc) {
    // Experimentally, calling gc() twice makes memory msmts more reliable -
    // otherwise may get negative diffs (last trial getting GC'd in the middle?).
    global.gc();
    global.gc();
  }
  return process.memoryUsage().heapUsed;
}

export function mean(values: number[]): number {
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

/**
 * Applies all edits to a new Alg instance and returns it.
 *
 * If refreshInterval is nonzero, the alg is "refreshed" (saved and loaded
 * into a new instance) every refreshInterval edits.
 */
export function applyEdits<
  E extends TraceEdit | TraceProseMirrorEdit,
  S extends Uint8Array | string,
>(
  Alg: TextAlgorithmConstructor<E, S>,
  prng: seedrandom.PRNG,
  refreshInterval: number,
  edits: E[],
): TextAlgorithm<E, S> {
  let alg = new Alg(prng);
  for (let i = 0; i < edits.length; i++) {
    if (i !== 0 && refreshInterval !== 0 && i % refreshInterval === 0) {
      const savedState = alg.save();
      alg = new Alg(prng);
      alg.load(savedState);
    }
    alg.apply(edits[i]);
  }
  return alg;
}

/**
 * Generates the saved state for the given trace & algorithm in a separate process.
 *
 * @returns The saved state's raw bytes (UTF-8 encoded if it is a string),
 * GZIP'd if format is "gzip".
 */
export async function createSavedStateInProcess(
  traceName: string,
  algorithmName: string,
  refreshInterval: number,
  format: "plain" | "gzip",
): Promise<Uint8Array> {
  const { stdout } = await promisify(execFile)(
    process.execPath,
    [
      "--import",
      "tsx",
      path.join(__dirname, "create_saved_state.ts"),
      traceName,
      algorithmName,
      String(refreshInterval),
      format,
    ],
    { encoding: "buffer", maxBuffer: 1024 * 1024 * 1024 },
  );
  // Copy into a plain Uint8Array (not a Buffer).
  return new Uint8Array(stdout);
}
