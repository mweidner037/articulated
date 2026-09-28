import type { Measurement } from "./base";
import { measureCheck } from "./check";
import { measureOpTimes } from "./op_times";
import { measureSave } from "./save";
import { measureSaveGzip } from "./save_gzip";

export const allMeasurements: Record<string, Measurement> = {
  check: measureCheck,
  opTimes: measureOpTimes,
  save: measureSave,
  saveGzip: measureSaveGzip,
};
