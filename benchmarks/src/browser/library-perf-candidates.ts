import { IdList, type SavedIdList } from "articulated";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import type { BenchmarkList } from "./list-interface";
import { NativeF05 } from "./native-f05";

/** Runtime experiment: every case receives identical decoded plain run objects.
 * Any conversion needed by a native container is INCLUDED in construction. */
export const libraryCases = [
  "existing",
  "bulk-index-build",
  "bulk-fast-delete",
  "native-128",
  "native-filter-128",
  "native-adopt-128",
  "native-reuse-128",
  "native-reuse-64",
  "native-reuse-256",
  "native-64",
  "native-256",
] as const;
export type LibraryCase = (typeof libraryCases)[number];
/** Identical wrapper overhead for ALL existing-tree variants. */
class TreeRuntime implements BenchmarkList {
  constructor(
    private readonly list: IdList,
    private readonly fastDelete: boolean,
  ) {}
  get length() {
    return this.list.length;
  }
  at(index: number) {
    return this.list.at(index);
  }
  indexOf(...args: Parameters<IdList["indexOf"]>) {
    return this.list.indexOf(...args);
  }
  insertAfter(...args: Parameters<IdList["insertAfter"]>) {
    return new TreeRuntime(this.list.insertAfter(...args), this.fastDelete);
  }
  delete(...args: Parameters<IdList["delete"]>) {
    return new TreeRuntime(
      this.fastDelete
        ? this.list.experimentalDeleteIntervals(...args)
        : this.list.delete(...args),
      this.fastDelete,
    );
  }
  save() {
    return this.list.save();
  }
}
export function libraryLoad(
  id: LibraryCase,
  saved: SavedIdList,
): BenchmarkList {
  if (id === "existing") return new TreeRuntime(IdList.load(saved), false);
  if (id === "bulk-index-build" || id === "bulk-fast-delete")
    return new TreeRuntime(
      IdList.experimentalLoadBulk(saved),
      id === "bulk-fast-delete",
    );
  if (!libraryCases.includes(id)) throw new Error(`Unknown case ${id}`);
  return NativeF05.load(toTransposedOmit(saved), {
    ownership: "owned",
    pageSize: Number(id.split("-").at(-1)),
    pageIdFilter: id === "native-filter-128",
    adoptEdits: id === "native-adopt-128" || id.startsWith("native-reuse-"),
    reuseUnchangedColumns: id.startsWith("native-reuse-"),
  });
}
