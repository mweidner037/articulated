import type { Experiment } from "./base";
import { iterateExperiment } from "./iterate";
import { loadExperiment } from "./load";
import { loadGzipExperiment } from "./load_gzip";
import { memoryExperiment } from "./memory";
import { opTimesExperiment } from "./op_times";
import { saveExperiment } from "./save";
import { saveGzipExperiment } from "./save_gzip";

export const allExperiments: Record<string, Experiment> = {
  iterate: iterateExperiment,
  load: loadExperiment,
  loadGzip: loadGzipExperiment,
  memory: memoryExperiment,
  opTimes: opTimesExperiment,
  save: saveExperiment,
  saveGzip: saveGzipExperiment,
};
