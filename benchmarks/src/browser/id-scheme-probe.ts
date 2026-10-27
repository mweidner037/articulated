/**
 * How much do different bunchId schemes cost inside the one-blob protobuf
 * option (Flat-Proto)? Numbers are encoded exactly as in Flat-Proto; only the
 * ID fields change. Every scheme is decoded back and checked.
 *
 * Uses the canonical trace's structured IDs (`<10-char client>_<base36 seq>`,
 * one client) and, for a multi-client estimate, the same bunches split across
 * 4 clients in blocks of 250 creations.
 *
 * Usage: SNAPPYJS=/abs/snappyjs node --import tsx src/browser/id-scheme-probe.ts
 */
import type { SavedIdList } from "articulated";
import { Binary, serialize } from "bson";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import zlib from "node:zlib";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { canonicalWorkloads } from "./canonical-workload";
import {
  packSintVarints,
  packUintVarints,
  readSintVarints,
  readUintVarints,
  VarintReader,
  VarintWriter,
} from "./flat-varint-formats";

const encoder = new TextEncoder(),
  decoder = new TextDecoder();

function writeNumbers(w: VarintWriter, saved: SavedIdList) {
  const c = toTransposedOmit(saved);
  w.field(2, packUintVarints(c.startCounterIndexes));
  w.field(3, packUintVarints(c.startCounters));
  w.field(4, packSintVarints(c.counts));
}
/** Field number -> payloads, in order. */
function fields(bytes: Uint8Array) {
  const out = new Map<number, Uint8Array[]>();
  const r = new VarintReader(bytes);
  while (r.pos < bytes.length) {
    const tag = r.uint();
    assert.equal(tag & 7, 2);
    const len = r.uint();
    const list = out.get(tag >>> 3) ?? [];
    list.push(bytes.subarray(r.pos, r.pos + len));
    out.set(tag >>> 3, list);
    r.pos += len;
  }
  return out;
}
const strings = (f: Map<number, Uint8Array[]>, n: number) =>
  (f.get(n) ?? []).map((b) => decoder.decode(b));
const uints = (f: Map<number, Uint8Array[]>, n: number) =>
  f.has(n) ? readUintVarints(f.get(n)![0]) : [];
const sints = (f: Map<number, Uint8Array[]>, n: number) =>
  f.has(n) ? readSintVarints(f.get(n)![0]) : [];

interface Scheme {
  id: string;
  label: string;
  encode(saved: SavedIdList): Uint8Array;
  /** Returns the per-run bunchIds. */
  decodeIds(bytes: Uint8Array): string[];
}

/** Every run stores its full ID (Flat-Proto as-is). */
const eachId: Scheme = {
  id: "each-id",
  label: "Full ID on every run",
  encode(saved) {
    const w = new VarintWriter();
    for (const r of saved) w.string(1, encoder.encode(r.bunchId));
    writeNumbers(w, saved);
    return w.finish();
  },
  decodeIds: (bytes) => strings(fields(bytes), 1),
};

/** Each distinct ID once; runs say "new" (0) or how far back (k >= 1). */
const idOnce: Scheme = {
  id: "id-once",
  label: "Each distinct ID once + back-reference per run",
  encode(saved) {
    const w = new VarintWriter();
    const index = new Map<string, number>();
    const refs: number[] = [];
    for (const r of saved) {
      const i = index.get(r.bunchId);
      if (i === undefined) {
        index.set(r.bunchId, index.size);
        w.string(5, encoder.encode(r.bunchId));
        refs.push(0);
      } else refs.push(index.size - i);
    }
    w.field(6, packUintVarints(refs));
    writeNumbers(w, saved);
    return w.finish();
  },
  decodeIds(bytes) {
    const f = fields(bytes);
    const unique = strings(f, 5);
    let seen = 0;
    return uints(f, 6).map((k) => unique[k === 0 ? seen++ : seen - k]);
  },
};

function splitId(id: string): [string, number] {
  const at = id.lastIndexOf("_");
  assert(at > 0);
  const seq = parseInt(id.slice(at + 1), 36);
  assert.equal(seq.toString(36), id.slice(at + 1));
  return [id.slice(0, at), seq];
}
const joinId = (client: string, seq: number) => `${client}_${seq.toString(36)}`;

/** Client IDs once; per run a client index and the counter as a number. */
const clientCounter: Scheme = {
  id: "client+counter",
  label: "Client IDs once + per-run client index and counter",
  encode(saved) {
    const w = new VarintWriter();
    const clients = new Map<string, number>();
    const clientIndexes: number[] = [],
      seqs: number[] = [];
    for (const r of saved) {
      const [client, seq] = splitId(r.bunchId);
      if (!clients.has(client)) {
        clients.set(client, clients.size);
        w.string(7, encoder.encode(client));
      }
      clientIndexes.push(clients.get(client)!);
      seqs.push(seq);
    }
    w.field(8, packUintVarints(clientIndexes));
    w.field(9, packUintVarints(seqs));
    writeNumbers(w, saved);
    return w.finish();
  },
  decodeIds(bytes) {
    const f = fields(bytes);
    const clients = strings(f, 7),
      seqs = uints(f, 9);
    return uints(f, 8).map((c, i) => joinId(clients[c], seqs[i]));
  },
};

/** Same, but each counter is stored as the change from that client's previous run. */
const clientCounterDelta: Scheme = {
  id: "client+counter-delta",
  label: "Client IDs once + per-run client index and counter change",
  encode(saved) {
    const w = new VarintWriter();
    const clients = new Map<string, number>(),
      last: number[] = [];
    const clientIndexes: number[] = [],
      deltas: number[] = [];
    for (const r of saved) {
      const [client, seq] = splitId(r.bunchId);
      if (!clients.has(client)) {
        clients.set(client, clients.size);
        last.push(0);
        w.string(7, encoder.encode(client));
      }
      const c = clients.get(client)!;
      clientIndexes.push(c);
      deltas.push(seq - last[c]);
      last[c] = seq;
    }
    w.field(8, packUintVarints(clientIndexes));
    w.field(10, packSintVarints(deltas));
    writeNumbers(w, saved);
    return w.finish();
  },
  decodeIds(bytes) {
    const f = fields(bytes);
    const clients = strings(f, 7),
      deltas = sints(f, 10);
    const last = clients.map(() => 0);
    return uints(f, 8).map((c, i) =>
      joinId(clients[c], (last[c] += deltas[i])),
    );
  },
};

const schemes = [eachId, idOnce, clientCounter, clientCounterDelta];

/** Random 8-character IDs, as in the Mongo/browser benchmarks. */
function opaque(saved: SavedIdList): SavedIdList {
  const names = new Map<string, string>();
  return saved.map((r) => {
    let id = names.get(r.bunchId);
    if (id === undefined) {
      id = createHash("sha256")
        .update(`opaque8:${r.bunchId}`)
        .digest("base64url")
        .slice(0, 8);
      names.set(r.bunchId, id);
    }
    return { ...r, bunchId: id };
  });
}
/** Split one client's bunches across 4 clients, in blocks of 250 creations. */
function fourClients(saved: SavedIdList): SavedIdList {
  const clients = ["Qm3xT9vKpa", "7hLw2ZcRne", "bY8sUf4GjD", "Kt5oV1iXq0"];
  return saved.map((r) => {
    const [, seq] = splitId(r.bunchId);
    const block = Math.floor(seq / 250);
    return {
      ...r,
      bunchId: joinId(
        clients[block % 4],
        Math.floor(block / 4) * 250 + (seq % 250),
      ),
    };
  });
}

async function main() {
  const structured = (await canonicalWorkloads()).structured.chunks.at(
    -1,
  )!.expected;
  const snappy = process.env.SNAPPYJS
    ? (createRequire(__filename)(process.env.SNAPPYJS) as {
        compress(b: Uint8Array): Uint8Array;
      })
    : null;
  const datasets: [string, SavedIdList][] = [
    ["random 8-char IDs", opaque(structured)],
    ["client_counter IDs, 1 client", structured],
    ["client_counter IDs, 4 clients", fourClients(structured)],
  ];
  const rows = [];
  for (const [dataset, saved] of datasets) {
    for (const scheme of schemes) {
      if (dataset.startsWith("random") && scheme.id.startsWith("client"))
        continue;
      const blob = scheme.encode(saved);
      assert.deepEqual(
        scheme.decodeIds(blob),
        saved.map((r) => r.bunchId),
        `${scheme.id} on ${dataset}`,
      );
      const bson = serialize({ _id: 0, state: new Binary(blob) });
      rows.push({
        dataset,
        scheme: scheme.id,
        rawBytes: bson.length,
        gzipBytes: zlib.gzipSync(bson, { level: 6 }).length,
        zstdBytes: zlib.zstdCompressSync(bson, {
          params: { [zlib.constants.ZSTD_c_compressionLevel]: 6 },
        }).length,
        snappyBytes: snappy ? snappy.compress(bson).length : null,
      });
    }
  }
  console.table(rows);
  const output = process.env.ID_SCHEME_OUTPUT;
  if (output)
    fs.writeFileSync(
      output,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          runs: structured.length,
          distinctBunches: new Set(structured.map((r) => r.bunchId)).size,
          measurement:
            "Single-document compression of {_id, state: Binary(blob)}; proxy for WiredTiger, not a Mongo measurement.",
          rows,
        },
        null,
        2,
      ) + "\n",
      { flag: "wx" },
    );
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
