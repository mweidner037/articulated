import { IdList } from "articulated";
import { deserialize, serialize } from "bson";
import type { Candidate } from "./candidates";
import { storageSweepFormats } from "./storage-sweep-formats";
const encoder = new TextEncoder(),
  decoder = new TextDecoder();
export const storageSweepCandidates: Candidate[] = storageSweepFormats.map(
  (format) => ({
    id: format.id,
    shape: format.id,
    encoding: format.binary ? "BSON binary fields" : "JSON",
    path: "objects",
    internalFormat:
      "Unchanged existing IdList; identical ordered runs passed to IdList.load",
    encode: (saved) =>
      format.binary
        ? serialize({ state: format.encode(saved) })
        : encoder.encode(JSON.stringify(format.encode(saved))),
    decode: (bytes) =>
      format.binary
        ? deserialize(bytes).state
        : JSON.parse(decoder.decode(bytes)),
    hydrate: (state) => IdList.load(format.decode(state)),
    logical: (state) => format.decode(state),
  }),
);
export function storageSweepCandidate(id: string) {
  const candidate = storageSweepCandidates.find((c) => c.id === id);
  if (!candidate) throw new Error(`Unknown storage case ${id}`);
  return candidate;
}
