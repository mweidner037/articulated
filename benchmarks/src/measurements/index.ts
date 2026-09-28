import type { Measurement } from "./base";
import { measureCheck } from "./check";
import { measureOpTimes } from "./op_times";

export const allMeasurements: Record<string, Measurement> = {
  check: measureCheck,
  opTimes: measureOpTimes,
};
