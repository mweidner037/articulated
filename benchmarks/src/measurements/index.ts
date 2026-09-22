import type { Measurement } from "./base";
import { measureCheck } from "./check";

export const allMeasurements: Record<string, Measurement> = {
  check: measureCheck,
};
