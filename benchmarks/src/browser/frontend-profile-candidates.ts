import { IdList } from "articulated";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import type { Candidate } from "./candidates";
import { directStorageFormats } from "./direct-storage-formats";
import { explorationCandidate } from "./exploration-candidates";

export const pageLocalF05 = directStorageFormats.find((f) => f.id === "DS08")!;
const f05 = explorationCandidate("omit");
export const frontendCandidates: Candidate[] = [
  ...["objects", "omit", "f05-flat-owned-128", "f03-rows-owned-128"].map(
    explorationCandidate,
  ),
  {
    ...f05,
    id: "page-local-f05",
    internalFormat: "Existing IdList; page-local F05 storage adapter",
    encode: (saved) =>
      new TextEncoder().encode(JSON.stringify(pageLocalF05.encode(saved))),
    hydrate: (state) => IdList.load(pageLocalF05.decode(state)),
    snapshot: (list) => pageLocalF05.encode(list.save()),
    // The runner checks logical equivalence against the flat F05 candidate.
    logical: (state) => toTransposedOmit(pageLocalF05.decode(state)),
  },
];
frontendCandidates.push({
  ...frontendCandidates.at(-1)!,
  id: "page-local-f05-native",
  path: "native",
  internalFormat: "Native F05 owned pages; page-local F05 storage adapter",
  hydrate: (state) =>
    explorationCandidate("f05-flat-owned-128").hydrate(
      toTransposedOmit(pageLocalF05.decode(state)),
    ),
});
export function frontendCandidate(id: string): Candidate {
  const result = frontendCandidates.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Unknown frontend profile candidate: ${id}`);
  return result;
}
