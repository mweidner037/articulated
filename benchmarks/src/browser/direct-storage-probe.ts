import { IdList, type SavedIdList } from "articulated";
import { MongoClient } from "mongodb";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  canonicalWorkloads,
  type CanonicalMetadata,
} from "./canonical-workload";
import {
  directStorageExample,
  directStorageFormats,
  directStoragePageSize,
  type DirectStorageFormat,
} from "./direct-storage-formats";
import { flatFloat64Formats } from "./flat-f64-formats";
import { flatProtoFormat, flatVarintFormat } from "./flat-varint-formats";
import { storageSweepFormats } from "./storage-sweep-formats";

const sha256 = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
/** Same document-independent whole-ID remapping as the earlier opaque Mongo pass. */
function independentDocument(
  saved: SavedIdList,
  document: number,
): SavedIdList {
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
      assert(!used.has(id), "Whole-ID hash collision");
      names.set(row.bunchId, id);
      used.add(id);
    }
    return { ...row, bunchId: id };
  });
}
async function main() {
  const sweep = process.env.DIRECT_STORAGE_SWEEP === "1";
  const varint = process.env.DIRECT_STORAGE_VARINT === "1";
  const f64 = varint || process.env.DIRECT_STORAGE_F64 === "1";
  const formats: DirectStorageFormat[] = varint
    ? [...flatFloat64Formats, flatVarintFormat, flatProtoFormat]
    : f64
      ? flatFloat64Formats
      : sweep
        ? storageSweepFormats
        : directStorageFormats;
  const expected = process.env.DIRECT_STORAGE_DBPATH;
  assert(
    expected && path.isAbsolute(expected),
    "Set an isolated temporary dbPath",
  );
  assert(
    fs
      .realpathSync(expected)
      .startsWith("/private/tmp/articulated-direct-storage-"),
  );
  const output = path.resolve(
    __dirname,
    "../../results",
    process.env.DIRECT_STORAGE_OUTPUT ?? "direct-storage-probe",
    "mongo.json",
  );
  assert(!fs.existsSync(output), "Never overwrite existing results");
  const client = new MongoClient(
    "mongodb://127.0.0.1:27186/?directConnection=true",
  );
  await client.connect();
  const admin = client.db("admin"),
    db = client.db("articulated_direct_storage_probe");
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
      "Fresh database required; no data is dropped",
    );
    const build = await admin.command({ buildInfo: 1 });
    const fixturePath = process.env.DIRECT_STORAGE_FIXTURE;
    let saved: SavedIdList, metadata: CanonicalMetadata;
    if (fixturePath) {
      assert(path.isAbsolute(fixturePath));
      saved = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as SavedIdList;
      const referencePath = path.resolve(
        __dirname,
        "../../results/exploration/canonical-mongo-opaque8.json",
      );
      const reference = JSON.parse(fs.readFileSync(referencePath, "utf8")) as {
        complete: boolean;
        dataset: string;
        canonicalSource: CanonicalMetadata;
        fixtures: { sha256: string }[];
      };
      assert.equal(reference.complete, true);
      assert.equal(reference.dataset, "opaque8");
      assert.equal(reference.fixtures.length, 1);
      assert.equal(reference.fixtures[0].sha256, sha256(saved));
      metadata = {
        ...reference.canonicalSource,
        finalSavedSha256: sha256(saved),
      };
    } else {
      const workload = (await canonicalWorkloads()).opaque8;
      saved = workload.chunks.at(-1)!.expected;
      metadata = workload.metadata;
    }
    assert.equal(metadata.finalSavedSha256, sha256(saved));
    assert.equal(metadata.source.upstreamVerification.verified, true);
    assert(saved.every((row) => /^[A-Za-z0-9_-]{8}$/.test(row.bunchId)));
    const documents = 100;
    const entries: {
      collection: string;
      id: string;
      label: string;
      readiness: string;
      compressor: string;
      compact: unknown;
      compactAfterCheckpoint?: unknown;
      checkedDocuments: number[];
      storedStateHashDocument0: string;
      sourceHashDocument0: string;
    }[] = [];
    for (const compressor of ["zstd", "snappy"])
      for (const format of formats) {
        const name = `${compressor}_${format.id.toLowerCase()}`;
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
              state = format.encode(independentDocument(saved, index));
            if (index === 0) state0 = state;
            return { _id: index, state };
          });
          await collection.insertMany(batch);
        }
        assert.equal(await collection.countDocuments(), documents);
        for (const index of [0, documents - 1]) {
          const document = await collection.findOne({ _id: index });
          assert(document);
          const source = independentDocument(saved, index),
            decoded = format.decode(document.state);
          assert.deepEqual(
            decoded,
            source,
            `${format.id}: full SavedIdList differs`,
          );
          assert.deepEqual(
            IdList.load(decoded).save(),
            source,
            `${format.id}: existing library validation failed`,
          );
          format.assertSnapshot?.(document.state);
          if (format.id === "F01") assert.deepEqual(document.state, source);
        }
        const compact = await db.command({
          compact: name,
          freeSpaceTargetMB: 1,
        });
        assert.equal(compact.ok, 1);
        entries.push({
          collection: name,
          id: format.id,
          label: format.label,
          readiness: format.readiness,
          compressor,
          compact,
          checkedDocuments: [0, 99],
          storedStateHashDocument0: sha256(state0),
          sourceHashDocument0: sha256(independentDocument(saved, 0)),
        });
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(
          path.join(path.dirname(output), "mongo-progress.json"),
          JSON.stringify(
            { complete: false, sourceSavedSha256: sha256(saved), entries },
            null,
            2,
          ),
        );
        console.log(`Stored, round-tripped and compacted ${name}`);
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
      const measurements: ((typeof entries)[number] & {
        storageBytes: number;
        storageBytesPerDocument: number;
        freeBytes: number;
        indexBytes: number;
        collectionFile: string;
        filesystemAllocatedBytes: number;
        compressorCreationString: string;
      })[] = [];
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
        const collectionFile = path.join(expected, table + ".wt"),
          stat = fs.statSync(collectionFile);
        assert.equal(stat.size, s.storageSize);
        assert.equal(s.count, documents);
        measurements.push({
          ...entry,
          storageBytes: stat.size,
          storageBytesPerDocument: stat.size / documents,
          freeBytes: s.freeStorageSize ?? 0,
          indexBytes: s.totalIndexSize,
          collectionFile,
          filesystemAllocatedBytes: stat.blocks * 512,
          compressorCreationString: s.wiredTiger.creationString,
        });
      }
      const paired = (id: string, compressor: string) => {
        const row = measurements.find(
          (r) => r.id === id && r.compressor === compressor,
        );
        assert(row);
        return row.storageBytesPerDocument;
      };
      const rows = measurements.map((row) => {
        const baseline = paired("F01", row.compressor),
          f05 = paired("F05", row.compressor);
        const leaf = (
          { DS03: "DS02", DS04: "DS02", DS05: "DS07", DS06: "DS08" } as Record<
            string,
            string
          >
        )[row.id];
        return {
          ...row,
          gate: {
            reference: "Same-run F01, same canonical snapshot and compressor",
            baselineBytesPerDocument: baseline,
            passesMeasuredStorageCeiling:
              row.storageBytesPerDocument <= baseline,
            remainingBytesPerDocument: baseline - row.storageBytesPerDocument,
            deltaBytesPerDocument: row.storageBytesPerDocument - baseline,
          },
          f05PairedHeadroomBytesPerDocument: baseline - f05,
          navigationMetadataDelta: leaf
            ? {
                pairedLeafId: leaf,
                additionalCompressedBytesPerDocument:
                  row.storageBytesPerDocument - paired(leaf, row.compressor),
              }
            : null,
        };
      });
      fs.mkdirSync(path.dirname(output), { recursive: true });
      fs.writeFileSync(
        output,
        JSON.stringify(
          {
            complete: true,
            generatedAt: new Date().toISOString(),
            version: build.version,
            mongoGitVersion: build.gitVersion,
            nodeVersion: process.version,
            cpu: os.cpus()[0]?.model,
            platform: process.platform,
            arch: process.arch,
            dbPath: expected,
            port: 27186,
            documents,
            pageSize: f64
              ? 0
              : sweep
                ? "Per candidate: whole document, 32, 64, 128, 256, 512"
                : directStoragePageSize,
            ...(sweep
              ? {
                  suite: "storage-sweep",
                  formatDefinitions: storageSweepFormats.map(
                    ({ id, pageSize, idEncoding, binary }) => ({
                      id,
                      pageSize,
                      idEncoding,
                      binary,
                    }),
                  ),
                }
              : {}),
            primaryCompressor: "zstd",
            ...(varint
              ? {
                  suite: "flat-varint",
                  numericEncoding:
                    "Flat-F64 plus protobuf uint64/sint64 packed varints (Flat-Varint per field, Flat-Proto whole message)",
                }
              : f64
                ? {
                    suite: "flat-f64",
                    numericEncoding:
                      "IEEE754 binary64 little endian; full safe-integer range; no per-column schema metadata",
                  }
                : {}),
            canonicalSource: metadata,
            reusedFixturePath: fixturePath ?? null,
            sourceSavedSha256: sha256(saved),
            document0SavedSha256: sha256(independentDocument(saved, 0)),
            fixture: {
              runs: saved.length,
              distinctWholeIds: new Set(saved.map((r) => r.bunchId)).size,
              visibleIds: saved.reduce(
                (n, r) => n + (r.isDeleted ? 0 : r.count),
                0,
              ),
            },
            measurement:
              "Actual physical collection .wt file length / 100, including collection allocation/free space. All layouts use exactly the same {_id,state} wrapper. Index/shared-database files excluded. Logical BSON and network sizes not used.",
            gateMeaning:
              "Measured gate on this fixture only: physical bytes must not exceed paired same-run F01 under the same compressor. This is not a universal storage ceiling guarantee for unseen documents or production migrations.",
            readiness: f64
              ? "All candidates are flat, with unchanged IdList.load. Float64 binary fields use eight-byte little-endian values; aligned typed views or safe alignment/endian copies."
              : sweep
                ? "Every saved format decodes to the same ordered run objects and unchanged IdList.load; no internal structure changes. Binary fields have schema-fixed int32 little-endian values with checked ranges."
                : "DS01/DS02/DS07/DS08 are leaf-only proposals; DS03 adds position navigation only. DS04/DS05/DS06 persist the specified complete navigation metadata, but their editing implementations, load work, typed-array conversion, and performance have NOT been built or measured. No hidden production IdList tree is assumed.",
            objective:
              "Optimize lossless stored shape under the measured F01 ceiling. Cheap conversion to a different runtime is allowed and may be preferable. Persisted navigation indexes are optional cost counterexamples, NOT requirements for a winning storage format or the optimization target.",
            procedure: [
              "Fresh isolated localhost27186 MongoDB with dbPath/bind/port verified before writes; no database dropped",
              "100 independently renamed whole-ID documents per layout, all opaque IDs exactly8chars and collisionchecked",
              "Full exact SavedIdList roundtrip plus IdList validation for documents0/99; persisted indexes validated where present",
              "Compact everycollection; fsync checkpoint; compact everycollection again; fsync with lock",
              "Verify actual .wt file length equals storageSize and compressor matches requested value while locked; unlock afterward",
            ],
            caveats: [
              "Single uninterrupted canonical trace with harness-assigned IDs, not production corpus",
              "One collection build per case, not statistical repeats; page allocations may produce ties",
              "Identical run structure across independently renamed documents",
              "Final snapshots freshly inserted, not Mongo update fragmentation",
              "Metadata overhead is a paired compressed-file difference, not uncompressed metadata bytes; compression interactions may affect its sign",
            ],
            examples: formats.map((f) => ({
              id: f.id,
              label: f.label,
              readiness: f.readiness,
              storedDocument: { _id: 0, state: f.encode(directStorageExample) },
            })),
            rows,
          },
          null,
          2,
        ) + "\n",
        { flag: "wx" },
      );
      console.log(
        `Saved ${rows.length} paired physical-storage measurements: ${output}`,
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
