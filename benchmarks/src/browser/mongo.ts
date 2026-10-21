import { Binary, deserialize } from "bson";
import { MongoClient } from "mongodb";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fixture, forDocument } from "../full_picture/fixture";
import { candidates, type Candidate } from "./candidates";

// BSON response encoding of ordinary objects is not a new Mongo layout.
// Direct loading likewise changes no stored bytes. Measure each layout once.
export const storageCandidates = candidates.filter(
  (c) => c.path === "objects" && c.encoding !== "BSON",
);
export function mongoState(
  c: Candidate,
  saved: Parameters<Candidate["encode"]>[0],
): unknown {
  const bytes = c.encode(saved);
  if (c.encoding === "JSON") return c.decode(bytes);
  if (c.encoding === "protobuf") return new Binary(bytes);
  return deserialize(bytes).state;
}
async function main() {
  const expected = process.env.ARTICULATED_BROWSER_DBPATH;
  assert(
    expected && path.isAbsolute(expected),
    "Set isolated temporary dbPath",
  );
  const client = new MongoClient(
    "mongodb://127.0.0.1:27185/?directConnection=true",
  );
  await client.connect();
  const admin = client.db("admin"),
    db = client.db("articulated_browser_formats");
  try {
    const options = await admin.command({ getCmdLineOpts: 1 });
    assert.equal(options.parsed.storage.dbPath, expected);
    assert.equal(options.parsed.net.port, 27185);
    assert.equal(options.parsed.net.bindIp, "127.0.0.1");
    assert.equal(
      (await db.listCollections().toArray()).length,
      0,
      "Fresh benchmark database required; no data is dropped",
    );
    const saved = await fixture(),
      documents = 100;
    const entries: {
      name: string;
      id: string;
      shape: string;
      encoding: string;
      compressor: string;
      compact: unknown;
      compactAfterCheckpoint?: unknown;
    }[] = [];
    for (const compressor of ["snappy", "zstd"])
      for (const c of storageCandidates) {
        const name = `${compressor}_${c.id.replaceAll("-", "_")}`;
        const collection = await db.createCollection<{
          _id: number;
          state: unknown;
        }>(name, {
          storageEngine: {
            wiredTiger: { configString: `block_compressor=${compressor}` },
          },
        });
        for (let offset = 0; offset < documents; offset += 5) {
          await collection.insertMany(
            Array.from({ length: 5 }, (_, j) => ({
              _id: offset + j,
              state: mongoState(c, forDocument(saved, offset + j)),
            })),
          );
        }
        assert.equal(await collection.countDocuments(), documents);
        for (const i of [0, documents - 1]) {
          const doc = await collection.findOne({ _id: i });
          assert(doc);
          const state =
            c.encoding === "protobuf"
              ? c.decode((doc.state as Binary).value())
              : doc.state;
          assert.deepEqual(c.hydrate(state).save(), forDocument(saved, i));
        }
        const compact = await db.command({
          compact: name,
          freeSpaceTargetMB: 1,
        });
        assert.equal(compact.ok, 1);
        entries.push({
          name,
          id: c.id,
          shape: c.shape,
          encoding: c.encoding,
          compressor,
          compact,
        });
        console.log(`Mongo: ${name}`);
      }
    await admin.command({ fsync: 1 });
    for (const e of entries) {
      const compact = await db.command({
        compact: e.name,
        freeSpaceTargetMB: 1,
      });
      assert.equal(compact.ok, 1);
      e.compactAfterCheckpoint = compact;
    }
    await admin.command({ fsync: 1, lock: true });
    try {
      const rows = [];
      for (const e of entries) {
        const result = await db
          .collection(e.name)
          .aggregate([{ $collStats: { storageStats: { scale: 1 } } }])
          .next();
        assert(result);
        const s = result.storageStats;
        assert(
          s.wiredTiger.creationString.includes(
            `block_compressor=${e.compressor}`,
          ),
        );
        const table = s.wiredTiger.uri.split(":").pop();
        assert(/^collection[-a-zA-Z0-9_]+$/.test(table));
        const storageBytes: number = fs.statSync(
          path.join(expected, table + ".wt"),
        ).size;
        assert.equal(storageBytes, s.storageSize);
        assert.equal(s.count, documents);
        rows.push({
          ...e,
          storageBytes,
          freeBytes: s.freeStorageSize ?? 0,
          indexBytes: s.totalIndexSize,
        });
      }
      const output = path.resolve(__dirname, "../../results/browser");
      fs.mkdirSync(output, { recursive: true });
      fs.writeFileSync(
        path.join(output, "mongo.json"),
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            version: (await admin.command({ buildInfo: 1 })).version,
            documents,
            rows,
          },
          null,
          2,
        ) + "\n",
      );
    } finally {
      await admin.command({ fsyncUnlock: 1 });
    }
  } finally {
    await client.close();
  }
}
if (process.argv[1]?.endsWith("browser/mongo.ts"))
  void main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
