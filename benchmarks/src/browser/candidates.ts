import { IdList, type SavedIdList } from "articulated";
import { deserialize, serialize } from "bson";
import {
  fromBunchIndexOmit,
  fromClientIndexOmit,
  fromSplitTransposedOmit,
  fromTransposed,
  fromTransposedOmit,
  toBunchIndexOmit,
  toClientIndexOmit,
  toSplitTransposedOmit,
  toTransposed,
  toTransposedOmit,
} from "../algorithms/id_list_saved_states";
import {
  bsonDocument,
  columnsFromMongo,
  getCodec,
  readColumns,
  readSplit,
  type Emit,
} from "../full_picture/codecs";
import {
  BunchIndexOmitSavedIdListMessage,
  ClientIndexOmitSavedIdListMessage,
  SplitTransposedOmitSavedIdListMessage,
  TransposedOmitSavedIdListMessage,
  TransposedSavedIdListMessage,
} from "../generated/id_list_saved_state";
import { formats } from "./formats";

export interface Candidate {
  id: string;
  shape: string;
  encoding: string;
  path: "objects" | "direct";
  encode(saved: SavedIdList): Uint8Array;
  decode(bytes: Uint8Array): unknown;
  hydrate(state: unknown): IdList;
  // Canonical logical JSON, used only in correctness tests, outside timers.
  logical(state: unknown): unknown;
}
const encoder = new TextEncoder(),
  decoder = new TextDecoder();
function json<T>(
  id: string,
  shape: string,
  to: (s: SavedIdList) => T,
  from: (s: T) => SavedIdList,
): Candidate {
  return {
    id,
    shape,
    encoding: "JSON",
    path: "objects",
    encode: (s) => encoder.encode(JSON.stringify(to(s))),
    decode: (b) => JSON.parse(decoder.decode(b)),
    hydrate: (s) => IdList.load(from(s as T)),
    logical: (s) => s,
  };
}
function original(id: string, shape: string): Candidate {
  const codec = getCodec(id);
  return {
    id,
    shape,
    encoding: "JSON",
    path: "objects",
    encode: (s) => encoder.encode(codec.save(IdList.load(s)) as string),
    decode: (b) => JSON.parse(decoder.decode(b)),
    hydrate: (s) => codec.fromMongo(s),
    logical: (s) => s,
  };
}
function bson(source: Candidate): Candidate {
  return {
    ...source,
    id: source.id + "-bson",
    encoding: "BSON",
    encode: (s) => serialize({ state: source.decode(source.encode(s)) }),
    decode: (b) => deserialize(b).state,
  };
}
function proto<T>(
  source: Candidate,
  to: (s: SavedIdList) => T,
  encode: (s: T) => Uint8Array,
  decode: (b: Uint8Array) => T,
): Candidate {
  return {
    ...source,
    id: source.id + "-proto",
    encoding: "protobuf",
    encode: (s) => encode(to(s)),
    decode,
    logical: (s) => JSON.parse(JSON.stringify(s)),
  };
}
type Columns = {
  bunchIds: string[];
  bunchIndices: number[];
  startCounters: number[];
  counts: number[];
};
function toColumns(saved: SavedIdList): Columns {
  const ids = new Map<string, number>();
  const out: Columns = {
    bunchIds: [],
    bunchIndices: [],
    startCounters: [],
    counts: [],
  };
  for (const r of saved) {
    if (!ids.has(r.bunchId)) {
      ids.set(r.bunchId, ids.size);
      out.bunchIds.push(r.bunchId);
    }
    out.bunchIndices.push(ids.get(r.bunchId)!);
    out.startCounters.push(r.startCounter);
    out.counts.push(r.isDeleted ? -r.count : r.count);
  }
  return out;
}
function readJSONColumns(s: Columns, emit: Emit) {
  for (let i = 0; i < s.counts.length; i++)
    emit(
      s.bunchIds[s.bunchIndices[i]],
      s.startCounters[i],
      Math.abs(s.counts[i]),
      s.counts[i] < 0,
    );
}
function fromColumns(s: Columns): SavedIdList {
  const out: SavedIdList = [];
  readJSONColumns(s, (bunchId, startCounter, count, isDeleted) =>
    out.push({ bunchId, startCounter, count, isDeleted }),
  );
  return out;
}
const objects = original("objects", formats.objects.name);
const signed = original("signed", formats.signed.name);
const tuples = original("tuples", formats.tuples.name);
const columns = json(
  "columns",
  formats.columns.name,
  toTransposed,
  fromTransposed,
);
const omit = json(
  "omit",
  formats.omit.name,
  toTransposedOmit,
  fromTransposedOmit,
);
const split = json(
  "split",
  formats.split.name,
  toSplitTransposedOmit,
  fromSplitTransposedOmit,
);
const dictionary = json(
  "dictionary",
  formats.dictionary.name,
  toBunchIndexOmit,
  fromBunchIndexOmit,
);
const client = json(
  "client",
  formats.client.name,
  toClientIndexOmit,
  fromClientIndexOmit,
);
const clientProto = proto(
  client,
  toClientIndexOmit,
  (s) => ClientIndexOmitSavedIdListMessage.encode(s).finish(),
  (b) => ClientIndexOmitSavedIdListMessage.decode(b),
);
const full = json("full", formats.full.name, toColumns, fromColumns);
function binary(packed: boolean, direct: boolean): Candidate {
  const codec = getCodec(
    `${packed ? "bit" : "binary"}-${direct ? "direct" : "adapter"}`,
  );
  return {
    id: codec.name,
    shape: full.shape,
    encoding: packed ? "bit-packed" : "uint32/int32",
    path: direct ? "direct" : "objects",
    encode: (s) => bsonDocument(codec, codec.save(IdList.load(s))),
    decode: (b) => deserialize(b).state,
    hydrate: (s) => codec.fromMongo(s),
    logical(s) {
      const runs: SavedIdList = [];
      readColumns(
        columnsFromMongo(s),
        packed,
        (bunchId, startCounter, count, isDeleted) =>
          runs.push({ bunchId, startCounter, count, isDeleted }),
      );
      return toColumns(runs);
    },
  };
}
function directClient(source: Candidate): Candidate {
  return {
    ...source,
    id: source.id + "-direct",
    path: "direct",
    hydrate: (s) =>
      IdList.experimentalLoadFrom((emit) =>
        readSplit(s as ReturnType<typeof toClientIndexOmit>, emit),
      ),
  };
}
export const candidates: Candidate[] = [
  objects,
  bson(objects),
  signed,
  bson(signed),
  tuples,
  bson(tuples),
  columns,
  proto(
    columns,
    toTransposed,
    (s) => TransposedSavedIdListMessage.encode(s).finish(),
    (b) => TransposedSavedIdListMessage.decode(b),
  ),
  omit,
  proto(
    omit,
    toTransposedOmit,
    (s) => TransposedOmitSavedIdListMessage.encode(s).finish(),
    (b) => TransposedOmitSavedIdListMessage.decode(b),
  ),
  split,
  proto(
    split,
    toSplitTransposedOmit,
    (s) => SplitTransposedOmitSavedIdListMessage.encode(s).finish(),
    (b) => SplitTransposedOmitSavedIdListMessage.decode(b),
  ),
  dictionary,
  proto(
    dictionary,
    toBunchIndexOmit,
    (s) => BunchIndexOmitSavedIdListMessage.encode(s).finish(),
    (b) => BunchIndexOmitSavedIdListMessage.decode(b),
  ),
  client,
  clientProto,
  directClient(client),
  directClient(clientProto),
  full,
  {
    ...full,
    id: "full-direct",
    path: "direct",
    hydrate: (s) =>
      IdList.experimentalLoadFrom((emit) =>
        readJSONColumns(s as Columns, emit),
      ),
  },
  binary(false, false),
  binary(false, true),
  binary(true, false),
  binary(true, true),
];
export function candidate(id: string) {
  const result = candidates.find((c) => c.id === id);
  if (!result) throw new Error(`Unknown candidate ${id}`);
  return result;
}
