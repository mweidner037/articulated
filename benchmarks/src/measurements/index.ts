import type { Measurement } from "./base";
import { measureOpTimes } from "./op_times";
import { measureSave } from "./save";
import { measureSaveGzip } from "./save_gzip";

export const allMeasurements: Record<string, Measurement> = {
  opTimes: measureOpTimes,
  save: measureSave,
  saveGzip: measureSaveGzip,
};
