import type { Measurement } from "./base";
import { measureLoad } from "./load";
import { measureLoadGzip } from "./load_gzip";
import { measureMemory } from "./memory";
import { measureOpTimes } from "./op_times";
import { measureSave } from "./save";
import { measureSaveGzip } from "./save_gzip";

export const allMeasurements: Record<string, Measurement> = {
  load: measureLoad,
  loadGzip: measureLoadGzip,
  memory: measureMemory,
  opTimes: measureOpTimes,
  save: measureSave,
  saveGzip: measureSaveGzip,
};
