import type { SavedIdList } from "articulated";
import { MongoClient } from "mongodb";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { example, fixture, forDocument } from "../full_picture/fixture";
import { loadTrace } from "../internal/trace";
import { candidates } from "./candidates";
import { makeEditWorkload } from "./edit-workload";
import { formats } from "./formats";

const sha256 = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

/** Preserve whole-ID identity and run/counter structure without assuming that an
 * opaque ID contains a separable client or sequence. Every document is independent. */
function opaqueDocument(saved: SavedIdList, document: number): SavedIdList {
  const names = new Map<string, string>(),
    used = new Set<string>();
  return saved.map((row) => {
    let id = names.get(row.bunchId);
    if (id === undefined) {
      id = createHash("sha256")
        .update(JSON.stringify(["opaque8", document, row.bunchId]))
        .digest("base64url")
        .slice(0, 8);
      assert.match(id, /^[A-Za-z0-9_-]{8}$/);
      assert(!used.has(id), "Truncated whole-ID hash collision");
      names.set(row.bunchId, id);
      used.add(id);
    }
    return { ...row, bunchId: id };
  });
}

/** Isolated physical-storage experiment. Never drops databases or collections. */
async function main() {
  const dataset = process.env.ARTICULATED_EXPLORATION_DATASET ?? "structured";
  assert(["structured", "opaque8"].includes(dataset), "Unknown dataset");
  const fixtureMode =
    process.env.ARTICULATED_EXPLORATION_FIXTURE ?? "refreshed";
  assert(["refreshed", "canonical"].includes(fixtureMode), "Unknown fixture");
  const canonical = fixtureMode === "canonical";
  const opaque = dataset === "opaque8",
    documentState = opaque ? opaqueDocument : forDocument;
  const expected = process.env.ARTICULATED_EXPLORATION_DBPATH;
  assert(
    expected && path.isAbsolute(expected),
    "Set isolated temporary dbPath",
  );
  assert(
    fs
      .realpathSync(expected)
      .startsWith("/private/tmp/articulated-exploration-mongo-"),
    "Only this experiment's newly created temporary directory is allowed",
  );
  const output = path.resolve(
    __dirname,
    "../../results",
    process.env.EXPLORATION_OUTPUT ?? "exploration",
    `${canonical ? "canonical-" : ""}${opaque ? "mongo-opaque8" : "mongo"}.json`,
  );
  assert(
    !fs.existsSync(output),
    "Preserve published results; output already exists",
  );
  const layouts = candidates.filter(
    (c) =>
      c.path === "objects" &&
      c.encoding === "JSON" &&
      (!opaque || !["split", "client"].includes(c.id)),
  );
  assert.equal(layouts.length, opaque ? 7 : 9);
  const client = new MongoClient(
    "mongodb://127.0.0.1:27186/?directConnection=true",
  );
  await client.connect();
  const admin = client.db("admin"),
    db = client.db("articulated_exploration_formats");
  try {
    const options = await admin.command({ getCmdLineOpts: 1 });
    assert.equal(
      fs.realpathSync(options.parsed.storage.dbPath),
      fs.realpathSync(expected),
    );
    assert.equal(options.parsed.net.port, 27186);
    assert.equal(options.parsed.net.bindIp, "127.0.0.1");
    assert.equal(
      (await db.listCollections().toArray()).length,
      0,
      "Fresh database required",
    );
    const build = await admin.command({ buildInfo: 1 });
    let canonicalSource: unknown;
    let snapshots: { id: string; saved: SavedIdList; description: string }[];
    if (canonical) {
      // Use the browser harness's uninterrupted reference replay, preserving its
      // exact operation grouping and ID policy. Only rename IDs for independent
      // Mongo documents; never introduce save/load cycles into that replay.
      const { canonicalWorkloads } = await import("./canonical-workload");
      const workload = (await canonicalWorkloads())[
        opaque ? "opaque8" : "structured"
      ];
      canonicalSource = workload.metadata;
      const final = workload.chunks.at(-1);
      assert(final, "Canonical replay must have a final checkpoint");
      snapshots = [
        {
          id: "canonical-final",
          saved: final.expected,
          description:
            "Final snapshot of the complete original Kleppmann edit stream replayed from empty with no save/load refresh; original operation indices and characters; ElementIds assigned by the benchmark harness",
        },
      ];
    } else {
      const saved = await fixture(),
        trace = await loadTrace("kleppmannReal", false);
      const afterEdits = makeEditWorkload(saved, trace.finalText).expected;
      snapshots = [
        {
          id: "initial",
          saved,
          description: "Kleppmann real trace, seed 42, refresh interval 1000",
        },
        {
          id: "after-200-edits",
          saved: afterEdits,
          description:
            "Initial snapshot + first insertion + the same deterministic 100 insertions and 100 deletions used by the browser benchmark",
        },
      ];
    }
    const documents = 100;
    const entries: {
      collection: string;
      id: string;
      formatId: string;
      shape: string;
      snapshot: string;
      compressor: string;
      compact: unknown;
      compactAfterCheckpoint?: unknown;
      checkedDocuments: number[];
      storedStateHashDocument0: string;
      fields: string[];
    }[] = [];
    for (const snapshot of snapshots)
      for (const compressor of ["snappy", "zstd"])
        for (const c of layouts) {
          const formatId = formats[c.id as keyof typeof formats].id;
          const name = `${snapshot.id.replaceAll("-", "_")}_${compressor}_${formatId.toLowerCase()}`;
          const collection = await db.createCollection<{
            _id: number;
            state: unknown;
          }>(name, {
            storageEngine: {
              wiredTiger: { configString: `block_compressor=${compressor}` },
            },
          });
          let state0: unknown;
          for (let offset = 0; offset < documents; offset += 5) {
            const batch = Array.from({ length: 5 }, (_, j) => {
              const index = offset + j,
                state = c.decode(
                  c.encode(documentState(snapshot.saved, index)),
                );
              if (index === 0) state0 = state;
              return { _id: index, state };
            });
            await collection.insertMany(batch);
          }
          assert.equal(await collection.countDocuments(), documents);
          for (const i of [0, documents - 1]) {
            const doc = await collection.findOne({ _id: i });
            assert(doc);
            assert.deepEqual(
              c.hydrate(doc.state).save(),
              documentState(snapshot.saved, i),
            );
          }
          if (c.id === "objects")
            assert.deepEqual(state0, documentState(snapshot.saved, 0));
          const compact = await db.command({
            compact: name,
            freeSpaceTargetMB: 1,
          });
          assert.equal(compact.ok, 1);
          entries.push({
            collection: name,
            id: c.id,
            formatId,
            shape: c.shape,
            snapshot: snapshot.id,
            compressor,
            compact,
            checkedDocuments: [0, 99],
            storedStateHashDocument0: sha256(state0),
            fields: Object.keys(
              Array.isArray(state0) ? state0[0] : (state0 as object),
            ),
          });
          console.log(`Stored and validated ${name}`);
        }
    await admin.command({ fsync: 1 });
    for (const entry of entries) {
      const compact = await db.command({
        compact: entry.collection,
        freeSpaceTargetMB: 1,
      });
      assert.equal(compact.ok, 1);
      entry.compactAfterCheckpoint = compact;
    }
    await admin.command({ fsync: 1, lock: true });
    try {
      const rows = [];
      for (const entry of entries) {
        const result = await db
          .collection(entry.collection)
          .aggregate([{ $collStats: { storageStats: { scale: 1 } } }])
          .next();
        assert(result);
        const s = result.storageStats;
        assert(
          s.wiredTiger.creationString.includes(
            `block_compressor=${entry.compressor}`,
          ),
        );
        const table = s.wiredTiger.uri.split(":").pop();
        assert(/^collection[-a-zA-Z0-9_]+$/.test(table));
        const file = path.join(expected, table + ".wt"),
          stat = fs.statSync(file);
        assert.equal(stat.size, s.storageSize);
        assert.equal(s.count, documents);
        rows.push({
          ...entry,
          storageBytes: stat.size,
          storageBytesPerDocument: stat.size / documents,
          freeBytes: s.freeStorageSize ?? 0,
          indexBytes: s.totalIndexSize,
          collectionFile: file,
          filesystemAllocatedBytes: stat.blocks * 512,
          compressorCreationString: s.wiredTiger.creationString,
        });
      }
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(
        output,
        JSON.stringify(
          {
            complete: true,
            dataset,
            fixtureMode,
            canonicalSource,
            idModel: opaque
              ? "Each distinct whole bunchId is replaced with an independent collision-checked 8-character base64url SHA-256 prefix for each document; no client/sequence structure is retained"
              : "Structured client_sequence IDs with independently renamed 10-character clients per document",
            excludedFormats: opaque
              ? [
                  {
                    formatId: "F06",
                    reason:
                      "Requires structured client_sequence IDs; cannot losslessly split arbitrary opaque 8-character IDs",
                  },
                  {
                    formatId: "F08",
                    reason:
                      "Requires structured client_sequence IDs; client deduplication does not apply to opaque IDs",
                  },
                ]
              : [],
            generatedAt: new Date().toISOString(),
            version: build.version,
            mongoGitVersion: build.gitVersion,
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            cpu: os.cpus()[0]?.model,
            dbPath: expected,
            port: 27186,
            documents,
            procedure: [
              "Fresh local standalone bound to 127.0.0.1:27186; dbPath and bind options verified before writes",
              opaque
                ? "100 independently renamed whole-ID dictionaries per layout and snapshot; every ID, including post-edit IDs, is exactly 8 base64url characters; collisions checked; same document IDs in every collection"
                : "100 independently renamed client dictionaries per layout and snapshot; same document IDs in every collection",
              "Insert in batches of five; validate full SavedIdList round trip for documents 0 and 99",
              "compact every collection; fsync checkpoint; compact every collection again; fsync with lock",
              "Read actual collection .wt file length while locked and verify equality with storageSize; verify configured compressor",
              "Unlock; preserve database files for audit; no existing database or result overwritten",
            ],
            measurement:
              "Physical collection file bytes, including collection allocation/free space; excludes _id indexes and shared database files. No logical BSON size is used.",
            caveats: [
              opaque
                ? "One trace with whole IDs remapped to opaque 8-character strings; not actual production data or a new trace generated using nanoid"
                : "One trace, structured client_sequence IDs (not opaque 8-character nanoids)",
              opaque
                ? "Independent whole-ID strings are 8-character hashes; run shapes and counters repeat across 100 documents; F06/F08 excluded because their structural assumption does not hold"
                : "Independent client strings are 10-character hashes; run shapes and counters repeat across 100 documents",
              "Each snapshot is freshly inserted, not an in-place Mongo update history; these results isolate snapshot representation",
              "Whole-collection file allocation is amortized over 100 documents; one storage build per layout, not statistical repeats",
              "Native runtime representations do not change stored bytes when exporting the same logical F-format",
            ],
            fixtures: snapshots.map((s) => ({
              id: s.id,
              description: s.description,
              sha256: sha256(s.saved),
              document0Sha256: sha256(documentState(s.saved, 0)),
              document0DistinctIds: new Set(s.saved.map((r) => r.bunchId)).size,
              document0IdLengths: [
                ...new Set(
                  documentState(s.saved, 0).map((r) => r.bunchId.length),
                ),
              ].sort((a, b) => a - b),
              runs: s.saved.length,
              visibleIds: s.saved.reduce(
                (n, r) => n + (r.isDeleted ? 0 : r.count),
                0,
              ),
            })),
            examples: layouts.map((c) => ({
              id: c.id,
              formatId: formats[c.id as keyof typeof formats].id,
              shape: c.shape,
              storedDocument: {
                _id: 0,
                state: c.logical(
                  c.decode(
                    c.encode(opaque ? opaqueDocument(example, 0) : example),
                  ),
                ),
              },
            })),
            rows,
          },
          null,
          2,
        ) + "\n",
        { flag: "wx" },
      );
      console.log(
        `Saved ${rows.length} physical-storage measurements to ${output}`,
      );
    } finally {
      await admin.command({ fsyncUnlock: 1 });
    }
  } finally {
    await client.close();
  }
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
