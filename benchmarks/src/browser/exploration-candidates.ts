import type { IdList, SavedIdList } from "articulated";
import {
  toBunchIndexOmit,
  toClientIndexOmit,
  toSplitTransposedOmit,
  toTransposed,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";
import { getCodec } from "../full_picture/codecs";
import { candidate, candidates, toColumns, type Candidate } from "./candidates";
import { formats } from "./formats";
import { NativeF08, type F08 } from "./native";
import { NativeDictionary, type F07, type F09 } from "./native-dictionary";
import { NativeF05, type F05 } from "./native-f05";
import { NativeRows, type SignedRow, type TupleRow } from "./native-rows";
import { PagedF08 } from "./paged-f08";

const transformations = {
  columns: toTransposed,
  omit: toTransposedOmit,
  split: toSplitTransposedOmit,
  dictionary: toBunchIndexOmit,
  client: toClientIndexOmit,
  full: toColumns,
};
export const explorationCandidates: Candidate[] = candidates
  .filter((c) => c.encoding === "JSON" && c.path === "objects")
  .map((c) => ({
    ...c,
    internalFormat: "Existing IdList",
    snapshot: (list) =>
      c.id in transformations
        ? transformations[c.id as keyof typeof transformations](list.save())
        : getCodec(c.id).saveMongo!(list as IdList),
  }));

for (const format of ["f05", "f08"] as const)
  for (const ownership of ["shared", "owned"] as const)
    for (const pageSize of ownership === "shared" ? [128] : [64, 128, 256]) {
      explorationCandidates.push({
        ...candidate(format === "f05" ? "omit" : "client"),
        id: `${format}-flat-${ownership}-${pageSize}`,
        path: "native",
        internalFormat: `Native columns; flat directory; ${ownership}; ${pageSize} runs/page`,
        hydrate: (s) =>
          format === "f05"
            ? NativeF05.load(s as F05, { ownership, pageSize })
            : NativeF08.load(s as F08, { ownership, pageSize }),
        snapshot: (list) => (list as NativeF05 | NativeF08).wireState,
      });
    }
for (const ownership of ["shared", "owned"] as const)
  for (const pageSize of ownership === "shared" ? [128] : [64, 128, 256])
    explorationCandidates.push({
      ...candidate("client"),
      id: `f08-tree-${ownership}-${pageSize}`,
      path: "native",
      internalFormat: `Native columns; indexed page tree; ${ownership}; ${pageSize} runs/page`,
      hydrate: (s) => PagedF08.load(s as F08, { ownership, pageSize }),
      snapshot: (list) => (list as PagedF08).wireState,
    });

for (const format of ["f07", "f09"] as const)
  for (const ownership of ["shared", "owned"] as const)
    explorationCandidates.push({
      ...candidate(format === "f07" ? "dictionary" : "full"),
      id: `${format}-flat-${ownership}-128`,
      path: "native",
      internalFormat: `Native dictionary columns; flat directory; ${ownership}; 128 runs/page`,
      hydrate: (s) =>
        format === "f07"
          ? NativeDictionary.loadF07(s as F07, { ownership, pageSize: 128 })
          : NativeDictionary.loadF09(s as F09, { ownership, pageSize: 128 }),
      snapshot: (list) => (list as NativeDictionary).wireState,
    });

for (const [format, source] of [
  ["f01", "objects"],
  ["f02", "signed"],
  ["f03", "tuples"],
] as const)
  for (const ownership of ["shared", "owned"] as const)
    explorationCandidates.push({
      ...candidate(source),
      id: `${format}-rows-${ownership}-128`,
      path: "native",
      internalFormat: `Native ${format === "f03" ? "tuple" : "object"} rows; flat directory; ${ownership}; 128 runs/page`,
      hydrate: (s) =>
        format === "f01"
          ? NativeRows.loadF01(s as SavedIdList, { ownership, pageSize: 128 })
          : format === "f02"
            ? NativeRows.loadF02(s as SignedRow[], { ownership, pageSize: 128 })
            : NativeRows.loadF03(s as TupleRow[], { ownership, pageSize: 128 }),
      snapshot: (list) => (list as NativeRows).wireState,
    });

export function explorationCandidate(id: string) {
  const c = explorationCandidates.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown experiment: ${id}`);
  return c;
}
export function experimentLabel(c: Candidate) {
  const format = Object.values(formats).find((f) => f.name === c.shape)!;
  if (c.path !== "native")
    return `${format.id} — ${format.id === "F01" ? "Plain SavedIdList" : "JSON"} → IdList`;
  return `${format.id} — ${c.id.includes("-tree-") ? "Indexed column pages" : c.id.includes("-rows-") ? "Native row pages" : "Flat column pages"}, ${c.id.split("-").slice(-2).join(" ")}`;
}
