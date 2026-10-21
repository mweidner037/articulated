import type { SavedIdList } from "articulated";
import type { Candidate } from "./candidates";
import { directStorageFormats } from "./direct-storage-formats";
import { explorationCandidate } from "./exploration-candidates";
import { libraryLoad, type LibraryCase } from "./library-perf-candidates";
const ids: LibraryCase[] = [
  "existing",
  "bulk-index-build",
  "native-128",
  "native-reuse-128",
];
export const libraryFrontendCandidates: Candidate[] = ids.map((id) => ({
  ...explorationCandidate("objects"),
  id,
  internalFormat: `Runtime experiment: ${id}; identical F01 input`,
  hydrate: (saved: unknown) => libraryLoad(id, saved as SavedIdList),
}));
const paged = directStorageFormats.find((format) => format.id === "DS08")!;
for (const id of [
  "existing",
  "bulk-index-build",
  "native-reuse-128",
] as const) {
  libraryFrontendCandidates.push({
    ...explorationCandidate("objects"),
    id: `ds08-${id}`,
    internalFormat: `Runtime experiment: ${id}; DS08 page-local columns`,
    encode: (saved) =>
      new TextEncoder().encode(JSON.stringify(paged.encode(saved))),
    hydrate: (saved) => libraryLoad(id, paged.decode(saved)),
    snapshot: (list) => paged.encode(list.save()),
    logical: (saved) => paged.decode(saved),
  });
}
export function libraryFrontendCandidate(id: string) {
  const candidate = libraryFrontendCandidates.find((c) => c.id === id);
  if (!candidate) throw new Error(`Unknown runtime candidate ${id}`);
  return candidate;
}
