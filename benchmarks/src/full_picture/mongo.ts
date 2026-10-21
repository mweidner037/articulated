import { IdList, type SavedIdList } from "articulated";
import { Binary } from "bson";
import { gunzipSync, gzipSync } from "fflate";
import { MongoClient } from "mongodb";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { binaryBytes, codecs, loadWire, wireBytes } from "./codecs";
import { forDocument } from "./fixture";

const resultDir = path.resolve(__dirname, "../../results/full-picture");
const documents = Number(process.env.FULL_PICTURE_DOCUMENTS ?? 100);
assert(Number.isInteger(documents) && documents >= 2);

async function main() {
  const expected = process.env.ARTICULATED_BENCH_DBPATH;
  assert(
    expected && path.isAbsolute(expected),
    "Set the dedicated temporary server's absolute dbPath",
  );
  // No configurable production URI. Verify exact path, port and loopback binding.
  const client = new MongoClient(
    "mongodb://127.0.0.1:27184/?directConnection=true",
  );
  await client.connect();
  const admin = client.db("admin"),
    db = client.db("articulated_full_picture");
  try {
    const options = await admin.command({ getCmdLineOpts: 1 });
    assert.equal(options.parsed.storage.dbPath, expected);
    assert.equal(options.parsed.net.port, 27184);
    assert.equal(options.parsed.net.bindIp, "127.0.0.1");
    assert.equal(
      (await db.listCollections().toArray()).length,
      0,
      "Requires fresh database; never drops existing data",
    );
    const saved: SavedIdList = JSON.parse(
      fs.readFileSync(path.join(resultDir, "fixture.json"), "utf8"),
    );
    const entries: Record<string, unknown>[] = [];
    // Also measure the actual gzip-as-Binary choice rather than assume that
    // WiredTiger-compressed ordinary BSON equals gzipped serialized output.
    for (const compressor of ["snappy", "zstd"]) {
      for (const codec of codecs) {
        for (const gzip of [false, true]) {
          const name = `${compressor}_${codec.name.replaceAll("-", "_")}_${gzip ? "gzip" : "native"}`;
          const collection = await db.createCollection<{
            _id: number;
            state: unknown;
          }>(name, {
            storageEngine: {
              wiredTiger: { configString: `block_compressor=${compressor}` },
            },
          });
          for (let offset = 0; offset < documents; offset += 5) {
            const batch = [];
            for (let i = offset; i < Math.min(offset + 5, documents); i++) {
              const runs = forDocument(saved, i),
                payload = codec.save(IdList.load(runs));
              assert.deepEqual(codec.load(payload).save(), runs);
              const state = gzip
                ? new Binary(gzipSync(wireBytes(codec, payload), { mtime: 0 }))
                : codec.toMongo(payload);
              batch.push({ _id: i, state });
            }
            await collection.insertMany(batch);
          }
          assert.equal(await collection.countDocuments(), documents);
          // Real driver read-back; full-state check for ordinary layouts.
          for (const i of [0, documents - 1]) {
            const doc = await collection.findOne({ _id: i });
            assert(doc);
            const loaded = gzip
              ? loadWire(codec, gunzipSync(binaryBytes(doc.state)))
              : codec.fromMongo(doc.state);
            assert.deepEqual(loaded.save(), forDocument(saved, i));
          }
          const compact = await db.command({
            compact: name,
            freeSpaceTargetMB: 1,
          });
          assert.equal(compact.ok, 1);
          entries.push({ name, codec: codec.name, compressor, gzip, compact });
          console.error(`Measured Mongo ${name}`);
        }
      }
    }
    // Checkpoint all writes before a second compaction. The first pass can run
    // before checkpoints make old pages reusable and therefore miss that space.
    await admin.command({ fsync: 1 });
    for (const entry of entries) {
      const compactAfterCheckpoint = await db.command({
        compact: entry.name,
        freeSpaceTargetMB: 1,
      });
      assert.equal(compactAfterCheckpoint.ok, 1);
      entry.compactAfterCheckpoint = compactAfterCheckpoint;
    }
    await admin.command({ fsync: 1, lock: true });
    try {
      const rows = [];
      for (const entry of entries) {
        const result = await db
          .collection(entry.name as string)
          .aggregate([{ $collStats: { storageStats: { scale: 1 } } }])
          .next();
        assert(result);
        const stats = result.storageStats;
        assert(
          stats.wiredTiger.creationString.includes(
            `block_compressor=${entry.compressor}`,
          ),
        );
        const table = stats.wiredTiger.uri.split(":").pop();
        assert(/^collection[-a-zA-Z0-9_]+$/.test(table));
        const fileBytes: number = fs.statSync(
          path.join(expected, table + ".wt"),
        ).size;
        assert.equal(fileBytes, stats.storageSize);
        rows.push({
          ...entry,
          count: stats.count,
          storageBytes: fileBytes,
          freeBytes: stats.freeStorageSize ?? 0,
          indexBytes: stats.totalIndexSize,
        });
      }
      fs.writeFileSync(
        path.join(resultDir, "mongo.json"),
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
void main();
