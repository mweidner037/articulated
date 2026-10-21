import { candidate, type Candidate } from "./candidates";
import { NativeF08, type F08 } from "./native";

const base = candidate("client");
export const nativeCandidates: Candidate[] = [
  { ...base, id: "f08-tree", internalFormat: "Current IdList tree" },
  {
    ...candidate("client-direct"),
    id: "f08-tree-direct",
    internalFormat: "Current IdList tree",
  },
  {
    ...base,
    id: "f08-native",
    path: "native",
    internalFormat: "Native F08 columns",
    hydrate: (state) => NativeF08.load(state as F08),
  },
];
export function nativeCandidate(id: string) {
  const result = nativeCandidates.find((c) => c.id === id);
  if (!result) throw new Error(`Unknown native case: ${id}`);
  return result;
}
