import { IdList } from "articulated";
import { deserialize, serialize } from "bson";
import type { Candidate } from "./candidates";
import {
  decodeFlatColumns,
  flatFloat64Format,
  type FlatColumns,
} from "./flat-f64-formats";
import { storageSweepCandidates } from "./storage-sweep-candidates";
const oldJSON = storageSweepCandidates.find((c) => c.id === "Sflat-joined")!;
export const flatFloat64Candidates: Candidate[] = [
  ...storageSweepCandidates.filter((c) =>
    ["F01", "F05", "Sflat-joined"].includes(c.id),
  ),
  {
    ...oldJSON,
    id: "Flat-JSON-direct",
    internalFormat:
      "Existing IdList; flat JSON read directly into ordered runs without intermediate columns",
    hydrate: (state) => IdList.load(decodeFlatColumns(state as FlatColumns)),
  },
  {
    id: "Flat-F64",
    shape: "Sflat-joined",
    encoding: "BSON fixed Float64 binary fields",
    path: "objects",
    internalFormat:
      "Existing IdList; same direct reader as Flat-JSON-direct, using Float64Array views/alignment copies",
    encode: (saved) => serialize({ state: flatFloat64Format.encode(saved) }),
    decode: (bytes) => deserialize(bytes).state,
    hydrate: (state) => IdList.load(flatFloat64Format.decode(state)),
    logical: (state) => flatFloat64Format.decode(state),
  },
];
export function flatFloat64Candidate(id: string) {
  const candidate = flatFloat64Candidates.find((c) => c.id === id);
  if (!candidate) throw new Error(`Unknown Float64 candidate ${id}`);
  return candidate;
}
