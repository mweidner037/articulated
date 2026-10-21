import { toClientIndexOmit } from "../algorithms/id_list_saved_states";
import { candidate, type Candidate } from "./candidates";
import { NativeF08, type F08 } from "./native";

const base = candidate("client");
export const nativeCandidates: Candidate[] = [
  {
    ...base,
    id: "f08-tree",
    internalFormat: "IdList via IdList.load()",
    snapshot: (list) => toClientIndexOmit(list.save()),
  },
  {
    ...candidate("client-direct"),
    id: "f08-tree-direct",
    internalFormat: "Current IdList tree",
  },
  {
    ...base,
    id: "f08-native",
    path: "native",
    internalFormat: "Native F08 columns + chunk indexes",
    hydrate: (state) => NativeF08.load(state as F08),
    snapshot: (list) => (list as NativeF08).wireState,
  },
];
export function nativeCandidate(id: string) {
  const result = nativeCandidates.find((c) => c.id === id);
  if (!result) throw new Error(`Unknown native case: ${id}`);
  return result;
}
