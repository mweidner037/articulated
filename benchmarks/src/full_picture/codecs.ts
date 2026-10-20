import { IdList, type SavedIdList } from "articulated";
import { Binary, deserialize, serialize } from "bson";
import assert from "node:assert/strict";
import { endianness } from "node:os";
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
  BunchIndexOmitSavedIdListMessage,
  ClientIndexOmitSavedIdListMessage,
} from "../generated/id_list_saved_state";

export type Emit = (
  id: string,
  start: number,
  count: number,
  deleted: boolean,
) => void;
type Read = (emit: Emit) => void;
export type BinaryState = {
  bunchIds: string[];
  bunchIndices: Uint8Array;
  startCounters: Uint8Array;
  counts: Uint8Array;
};
export type Payload = string | Uint8Array | BinaryState;
export type Probe = () => void;
export interface Codec {
  name: string;
  label: string;
  kind: "json" | "proto" | "columns";
  save(list: IdList, probe?: Probe): Payload;
  saveMongo?(list: IdList): unknown;
  load(payload: Payload, probe?: Probe): IdList;
  snapshot(payload: Payload): unknown;
  toMongo(payload: Payload): unknown;
  fromMongo(state: unknown, probe?: Probe): IdList;
}

function jsonCodec<T>(
  name: string,
  label: string,
  to: (saved: SavedIdList) => T,
  from: (state: T) => SavedIdList,
): Codec {
  const loadState = (state: T, probe?: Probe) => {
    probe?.();
    const runs = from(state);
    probe?.();
    const result = IdList.load(runs);
    probe?.();
    return result;
  };
  return {
    name,
    label,
    kind: "json",
    saveMongo: (list) => to(list.save()),
    save(list, probe) {
      const runs = list.save();
      probe?.();
      const state = to(runs);
      probe?.();
      const out = JSON.stringify(state);
      probe?.();
      return out;
    },
    load: (payload, probe) => loadState(JSON.parse(payload as string), probe),
    snapshot: (payload) => JSON.parse(payload as string),
    toMongo: (payload) => JSON.parse(payload as string),
    fromMongo: (state, probe) => loadState(state as T, probe),
  };
}

// Protobuf uses Matthew's transforms and generated encoders without changing them.
function protoCodec<T>(
  name: string,
  label: string,
  to: (saved: SavedIdList) => T,
  from: (state: T) => SavedIdList,
  encode: (state: T) => Uint8Array,
  decode: (bytes: Uint8Array) => T,
): Codec {
  const load = (payload: Payload, probe?: Probe) => {
    const state = decode(payload as Uint8Array);
    probe?.();
    const runs = from(state);
    probe?.();
    const result = IdList.load(runs);
    probe?.();
    return result;
  };
  return {
    name,
    label,
    kind: "proto",
    save(list, probe) {
      const runs = list.save();
      probe?.();
      const state = to(runs);
      probe?.();
      const bytes = encode(state);
      probe?.();
      return bytes;
    },
    load,
    snapshot: (payload) => decode(payload as Uint8Array),
    toMongo: (payload) => new Binary(payload as Uint8Array),
    fromMongo: (state, probe) => load(binaryBytes(state), probe),
  };
}

export function binaryBytes(value: unknown): Uint8Array {
  assert(value instanceof Binary);
  return value.value();
}

export function integer(value: number, max: number): void {
  assert(
    Number.isSafeInteger(value) && value >= 0 && value <= max,
    `Out of range: ${value} > ${max}`,
  );
}

// All direct writers use two tree walks: sizing/dictionary, then exact allocation.
// No intermediate numerical arrays or SavedIdList. Costs of BOTH passes are timed.
function columnWriter(read: Read, packed: boolean, probe?: Probe): BinaryState {
  const bunchIds: string[] = [],
    dictionary = new Map<string, number>();
  let size = 0;
  read((id) => {
    if (!dictionary.has(id)) {
      dictionary.set(id, bunchIds.length);
      bunchIds.push(id);
    }
    size++;
  });
  const widths = packed ? [13, 11, 12] : [32, 32, 32];
  integer(bunchIds.length, packed ? 8192 : 2 ** 32);
  const arrays = widths.map(
    (width) => new Uint8Array(Math.ceil((size * width) / 8)),
  );
  const views = arrays.map((a) => new DataView(a.buffer));
  let index = 0;
  read((id, start, count, deleted) => {
    const signed = deleted ? -count : count;
    integer(start, packed ? 2047 : 0xffffffff);
    integer(count, packed ? (deleted ? 2048 : 2047) : 0x7fffffff);
    if (packed) {
      writeBits(arrays[0], index * 13, 13, dictionary.get(id)!);
      writeBits(arrays[1], index * 11, 11, start);
      writeBits(
        arrays[2],
        index * 12,
        12,
        signed < 0 ? -2 * signed - 1 : 2 * signed,
      );
    } else {
      views[0].setUint32(index * 4, dictionary.get(id)!, true);
      views[1].setUint32(index * 4, start, true);
      views[2].setInt32(index * 4, signed, true);
    }
    if (++index % 1024 === 0) probe?.();
  });
  probe?.();
  return {
    bunchIds,
    bunchIndices: arrays[0],
    startCounters: arrays[1],
    counts: arrays[2],
  };
}

export function writeBits(
  bytes: Uint8Array,
  offset: number,
  width: number,
  value: number,
): void {
  while (width > 0) {
    const shift = offset % 8,
      take = Math.min(8 - shift, width);
    bytes[offset >>> 3] |= (value & ((1 << take) - 1)) << shift;
    value >>>= take;
    offset += take;
    width -= take;
  }
}
export function readBits(
  bytes: Uint8Array,
  offset: number,
  width: number,
): number {
  let result = 0,
    read = 0;
  while (width > 0) {
    const shift = offset % 8,
      take = Math.min(8 - shift, width);
    result |= ((bytes[offset >>> 3] >>> shift) & ((1 << take) - 1)) << read;
    offset += take;
    read += take;
    width -= take;
  }
  return result >>> 0;
}

// Mongo BSON payload offsets need not be aligned. Copy only when a typed view
// cannot be made safely. This fallback is INCLUDED in the Mongo-load timing.
export function alignedView(
  bytes: Uint8Array,
  signed: boolean,
): Uint32Array | Int32Array {
  assert.equal(bytes.byteLength % 4, 0);
  if (endianness() !== "LE") {
    const out = signed
      ? new Int32Array(bytes.length / 4)
      : new Uint32Array(bytes.length / 4);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let i = 0; i < out.length; i++)
      out[i] = signed
        ? view.getInt32(i * 4, true)
        : view.getUint32(i * 4, true);
    return out;
  }
  if (bytes.byteOffset % 4 !== 0) bytes = new Uint8Array(bytes);
  return signed
    ? new Int32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4)
    : new Uint32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
}
function openColumns(state: BinaryState, packed: boolean) {
  return packed
    ? state
    : {
        bunchIds: state.bunchIds,
        bunchIndices: alignedView(state.bunchIndices, false),
        startCounters: alignedView(state.startCounters, false),
        counts: alignedView(state.counts, true),
      };
}
function readColumns(
  state: BinaryState,
  packed: boolean,
  emit: Emit,
  probe?: Probe,
) {
  const columns = openColumns(state, packed);
  const size = packed
    ? Math.floor((state.bunchIndices.length * 8) / 13)
    : columns.bunchIndices.length;
  assert.equal(
    state.startCounters.length,
    packed ? Math.ceil((size * 11) / 8) : size * 4,
  );
  assert.equal(
    state.counts.length,
    packed ? Math.ceil((size * 12) / 8) : size * 4,
  );
  for (let i = 0; i < size; i++) {
    const index = packed
      ? readBits(state.bunchIndices, i * 13, 13)
      : columns.bunchIndices[i];
    const start = packed
      ? readBits(state.startCounters, i * 11, 11)
      : columns.startCounters[i];
    const code = packed
      ? readBits(state.counts, i * 12, 12)
      : columns.counts[i];
    const signed = packed ? (code % 2 ? -(code + 1) / 2 : code / 2) : code;
    assert(index < state.bunchIds.length);
    emit(state.bunchIds[index], start, Math.abs(signed), signed < 0);
    if (i % 1024 === 0) probe?.();
  }
}
function columnCodec(packed: boolean, direct: boolean): Codec {
  const name = `${packed ? "bit" : "binary"}-${direct ? "direct" : "adapter"}`;
  const load = (payload: Payload, probe?: Probe) => {
    const read: Read = (emit) =>
      readColumns(payload as BinaryState, packed, emit, probe);
    if (direct) {
      const list = IdList.experimentalLoadFrom(read);
      probe?.();
      return list;
    }
    const runs: SavedIdList = [];
    read((bunchId, startCounter, count, isDeleted) =>
      runs.push({ bunchId, startCounter, count, isDeleted }),
    );
    probe?.();
    const list = IdList.load(runs);
    probe?.();
    return list;
  };
  return {
    name,
    label: `${packed ? "Bit-packed" : "Binary"} columns / ${direct ? "direct" : "adapter"}`,
    kind: "columns",
    save(list, probe) {
      if (direct)
        return columnWriter(
          (emit) => list.experimentalSaveTo(emit),
          packed,
          probe,
        );
      const runs = list.save();
      probe?.();
      return columnWriter(
        (emit) => {
          for (const r of runs)
            emit(r.bunchId, r.startCounter, r.count, r.isDeleted);
        },
        packed,
        probe,
      );
    },
    load,
    snapshot: (payload) => openColumns(payload as BinaryState, packed),
    toMongo(payload) {
      const state = payload as BinaryState;
      return {
        bunchIds: state.bunchIds,
        bunchIndices: new Binary(state.bunchIndices),
        startCounters: new Binary(state.startCounters),
        counts: new Binary(state.counts),
      };
    },
    fromMongo(state, probe) {
      return load(columnsFromMongo(state), probe);
    },
  };
}
function columnsFromMongo(value: unknown): BinaryState {
  const state = value as Record<string, unknown>;
  return {
    bunchIds: state.bunchIds as string[],
    bunchIndices: binaryBytes(state.bunchIndices),
    startCounters: binaryBytes(state.startCounters),
    counts: binaryBytes(state.counts),
  };
}

type Split = ReturnType<typeof toClientIndexOmit>;
function directSplit(list: IdList, probe?: Probe): Split {
  const state: Split = {
    clientIds: [],
    clientIndices: [],
    seqNums: [],
    startCounterIndexes: [],
    startCounters: [],
    counts: [],
  };
  const clients = new Map<string, number>(),
    next = new Map<string, number>();
  let index = 0,
    last = 0;
  list.experimentalSaveTo((id, start, count, deleted) => {
    const at = id.lastIndexOf("_");
    const client = id.slice(0, at),
      seq = parseInt(id.slice(at + 1), 36);
    let ci = clients.get(client);
    if (ci === undefined) {
      ci = state.clientIds.length;
      clients.set(client, ci);
      state.clientIds.push(client);
    }
    state.clientIndices.push(ci);
    state.seqNums.push(seq);
    state.counts.push(deleted ? -count : count);
    if (start !== (next.get(id) ?? 0)) {
      state.startCounterIndexes.push(index - last);
      state.startCounters.push(start);
      last = index;
    }
    next.set(id, start + count);
    if (++index % 1024 === 0) probe?.();
  });
  return state;
}
function readSplit(state: Split, emit: Emit, probe?: Probe): void {
  const next = new Map<string, number>();
  let k = 0,
    exception = state.startCounterIndexes.length
      ? state.startCounterIndexes[0]
      : -1;
  for (let i = 0; i < state.counts.length; i++) {
    const id = `${state.clientIds[state.clientIndices[i]]}_${state.seqNums[i].toString(36)}`;
    let start = next.get(id) ?? 0;
    if (i === exception) {
      start = state.startCounters[k++];
      exception =
        k === state.startCounterIndexes.length
          ? -1
          : exception + state.startCounterIndexes[k];
    }
    const count = state.counts[i];
    emit(id, start, Math.abs(count), count < 0);
    next.set(id, start + Math.abs(count));
    if (i % 1024 === 0) probe?.();
  }
}

const protobuf = protoCodec(
  "split-proto",
  "Matthew split + omit / protobuf",
  toClientIndexOmit,
  fromClientIndexOmit,
  (state) => ClientIndexOmitSavedIdListMessage.encode(state).finish(),
  (bytes) => ClientIndexOmitSavedIdListMessage.decode(bytes),
);
const directProtobuf: Codec = {
  ...protobuf,
  name: "split-proto-direct",
  label: "Same split protobuf / direct",
  save(list, probe) {
    const state = directSplit(list, probe);
    probe?.();
    const bytes = ClientIndexOmitSavedIdListMessage.encode(state).finish();
    probe?.();
    return bytes;
  },
  load(payload, probe) {
    const state = ClientIndexOmitSavedIdListMessage.decode(
      payload as Uint8Array,
    );
    probe?.();
    const list = IdList.experimentalLoadFrom((emit) =>
      readSplit(state, emit, probe),
    );
    probe?.();
    return list;
  },
  fromMongo(state, probe) {
    return this.load(binaryBytes(state), probe);
  },
};

export const codecs: Codec[] = [
  jsonCodec(
    "objects",
    "Original objects / JSON",
    (s) => s,
    (s) => s,
  ),
  jsonCodec(
    "signed",
    "Signed objects / JSON",
    (s) =>
      s.map((r) => ({
        bunchId: r.bunchId,
        startCounter: r.startCounter,
        count: r.isDeleted ? -r.count : r.count,
      })),
    (s) =>
      s.map((r) => ({
        ...r,
        count: Math.abs(r.count),
        isDeleted: r.count < 0,
      })),
  ),
  jsonCodec(
    "tuples",
    "Signed tuples / JSON",
    (s): [string, number, number][] =>
      s.map((r) => [
        r.bunchId,
        r.startCounter,
        r.isDeleted ? -r.count : r.count,
      ]),
    (s) =>
      s.map(([bunchId, startCounter, signed]) => ({
        bunchId,
        startCounter,
        count: Math.abs(signed),
        isDeleted: signed < 0,
      })),
  ),
  jsonCodec(
    "columns",
    "Matthew ordinary columns / JSON",
    toTransposed,
    fromTransposed,
  ),
  jsonCodec(
    "omit",
    "Matthew columns + omit / JSON",
    toTransposedOmit,
    fromTransposedOmit,
  ),
  jsonCodec(
    "split-omit",
    "Matthew split + omit / JSON",
    toSplitTransposedOmit,
    fromSplitTransposedOmit,
  ),
  jsonCodec(
    "dictionary-omit",
    "Dictionary + omit / JSON",
    toBunchIndexOmit,
    fromBunchIndexOmit,
  ),
  protoCodec(
    "dictionary-proto",
    "Matthew dictionary + omit / protobuf",
    toBunchIndexOmit,
    fromBunchIndexOmit,
    (s) => BunchIndexOmitSavedIdListMessage.encode(s).finish(),
    (b) => BunchIndexOmitSavedIdListMessage.decode(b),
  ),
  protobuf,
  directProtobuf,
  columnCodec(false, false),
  columnCodec(false, true),
  columnCodec(true, false),
  columnCodec(true, true),
];

export function getCodec(name: string): Codec {
  const codec = codecs.find((c) => c.name === name);
  assert(codec, name);
  return codec;
}
// Natural Mongo shape: JSON becomes ordinary BSON fields, protobuf one Binary,
// columns separate Binary fields. No JSON strings or Base64 stored in Mongo.
export function bsonDocument(codec: Codec, payload: Payload): Uint8Array {
  return serialize({ state: codec.toMongo(payload) });
}
export function loadBson(
  codec: Codec,
  bytes: Uint8Array,
  probe?: Probe,
): IdList {
  const doc = deserialize(bytes);
  probe?.();
  return codec.fromMongo(doc.state, probe);
}
// Only used for serialized/gzip comparisons: binary-column objects need a
// container. BSON is explicitly included; it is NOT an added on-disk envelope.
export function wireBytes(codec: Codec, payload: Payload): Uint8Array {
  return typeof payload === "string"
    ? new TextEncoder().encode(payload)
    : payload instanceof Uint8Array
      ? payload
      : bsonDocument(codec, payload);
}
export function loadWire(codec: Codec, bytes: Uint8Array): IdList {
  return codec.kind === "columns"
    ? loadBson(codec, bytes)
    : codec.load(
        codec.kind === "json" ? new TextDecoder().decode(bytes) : bytes,
      );
}
export function ownedPayload(codec: Codec, payload: Payload): Payload {
  if (typeof payload === "string") return payload;
  if (payload instanceof Uint8Array) return new Uint8Array(payload);
  return columnsFromMongo(deserialize(bsonDocument(codec, payload)).state);
}
