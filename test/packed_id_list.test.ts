import { expect } from "chai";
import seedrandom from "seedrandom";
import { IdList, PackedIdList, SavedIdList } from "../src";

const example: SavedIdList = [
  { bunchId: "alice", startCounter: 0, count: 3, isDeleted: false },
  { bunchId: "bob", startCounter: 0, count: 1, isDeleted: false },
  { bunchId: "alice", startCounter: 3, count: 2, isDeleted: true },
];

describe("PackedIdList", () => {
  it("reads the documented example through scalar accessors", () => {
    const packed = PackedIdList.fromSaved(example);
    expect(packed.runCount).to.equal(3);
    expect(packed.bunchCount).to.equal(2);
    expect(packed.byteLength).to.equal(52);
    expect(packed.bunchIdAt(2)).to.equal("alice");
    expect(packed.startCounterAt(2)).to.equal(3);
    expect(packed.countAt(2)).to.equal(2);
    expect(packed.isDeletedAt(2)).to.equal(true);
    expect(packed.toSaved()).to.deep.equal(example);
    expect(PackedIdList.load(packed.toBytes()).toSaved()).to.deep.equal(
      example
    );
  });

  it("has a stable v1 byte fixture", () => {
    const bytes = PackedIdList.fromSaved(example).toBytes();
    expect(Array.from(bytes)).to.deep.equal([
      65,
      73,
      68,
      76,
      1,
      1,
      1,
      1, // Magic, version, column widths.
      3,
      0,
      0,
      0,
      2,
      0,
      0,
      0,
      10,
      0,
      0,
      0, // Run count, ID count, ID bytes.
      0,
      0,
      0,
      0,
      6,
      0,
      0,
      0,
      10,
      0,
      0,
      0, // ID offsets.
      0,
      97,
      108,
      105,
      99,
      101,
      0,
      98,
      111,
      98, // UTF-8 IDs.
      0,
      1,
      0,
      0,
      0,
      3,
      3,
      1,
      2,
      4, // Columns and deletion bits.
    ]);
  });

  it("preserves arbitrary strings, nanoids, UUID case, BOMs and lone surrogates", () => {
    const ids = [
      "",
      "__proto__",
      "こんにちは😀",
      "\ufeffhello",
      "\ud800",
      "\udfff",
      "a\u0000b",
      "V1StGXR8",
      "_-Ab09Zx",
      "V1StGXR8_Z5jdHi6B-myT",
      "1747629c-eb71-4815-9424-f46844305eb5",
      "1747629C-EB71-4815-9424-F46844305EB5",
    ];
    const saved = ids.map((bunchId) => ({
      bunchId,
      startCounter: 0,
      count: 1,
      isDeleted: false,
    }));
    expect(
      PackedIdList.load(PackedIdList.fromSaved(saved).toBytes()).toSaved()
    ).to.deep.equal(saved);
  });

  it("selects widths without truncating safe integer counters", () => {
    for (const [n, width] of [
      [0, 1],
      [255, 1],
      [256, 2],
      [65535, 2],
      [65536, 4],
      [2 ** 32 - 1, 4],
      [2 ** 32, 8],
      [Number.MAX_SAFE_INTEGER, 8],
    ]) {
      const saved = [
        { bunchId: "a", startCounter: n, count: 1, isDeleted: false },
      ];
      const packed = PackedIdList.fromSaved(saved);
      expect(packed.toBytes()[6]).to.equal(width);
      expect(PackedIdList.load(packed.toBytes()).toSaved()).to.deep.equal(
        saved
      );
      const largeCount = [
        { bunchId: "a", startCounter: 0, count: n, isDeleted: true },
      ];
      const counts = PackedIdList.fromSaved(largeCount);
      expect(counts.toBytes()[7]).to.equal(width);
      expect(PackedIdList.load(counts.toBytes()).toSaved()).to.deep.equal(
        largeCount
      );
    }
  });

  it("widens dictionary indexes at 256 and 65536 IDs", () => {
    for (const [n, width] of [
      [256, 1],
      [257, 2],
      [65536, 2],
      [65537, 4],
    ]) {
      const saved = Array.from({ length: n }, (_, i) => ({
        bunchId: `id${i}`,
        startCounter: 0,
        count: 1,
        isDeleted: false,
      }));
      const packed = PackedIdList.fromSaved(saved);
      expect(packed.toBytes()[5]).to.equal(width);
      expect(packed.at(n - 1)).to.deep.equal(saved[n - 1]);
    }
  });

  it("loads sliced and unaligned input and isolates buffers by default", () => {
    const bytes = PackedIdList.fromSaved(example).toBytes();
    const backing = new Uint8Array(bytes.length + 7);
    backing.set(bytes, 3);
    const slice = backing.subarray(3, 3 + bytes.length);
    const copied = PackedIdList.load(slice);
    const borrowed = PackedIdList.load(slice, { copy: false });
    expect(borrowed.toSaved()).to.deep.equal(example);
    slice[slice.length - 1] = 0;
    expect(copied.isDeletedAt(2)).to.equal(true);
    expect(borrowed.isDeletedAt(2)).to.equal(false);
    const output = copied.toBytes();
    output[output.length - 1] = 0;
    expect(copied.isDeletedAt(2)).to.equal(true);
  });

  it("rejects truncated, incompatible and corrupt data", () => {
    const original = PackedIdList.fromSaved(example).toBytes();
    for (let length = 0; length < original.length; length++) {
      expect(() => PackedIdList.load(original.subarray(0, length))).to.throw();
    }
    for (const [offset, value] of [
      [0, 0],
      [4, 2],
      [5, 3],
      [8, 255],
      [12, 255],
      [16, 255],
      [20, 1],
      [24, 0],
      [28, 255],
      [32, 99],
      [33, 255],
      [42, 2],
      [51, 128],
    ]) {
      const bytes = original.slice();
      bytes[offset] = value;
      expect(() => PackedIdList.load(bytes), `offset ${offset}`).to.throw();
    }
    expect(() =>
      PackedIdList.load(new Uint8Array([...original, 0]))
    ).to.throw();
    for (const n of [-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() =>
        PackedIdList.fromSaved([{ ...example[0], startCounter: n }])
      ).to.throw();
      expect(() =>
        PackedIdList.fromSaved([{ ...example[0], count: n }])
      ).to.throw();
    }
    expect(() =>
      PackedIdList.fromSaved([
        { ...example[0], startCounter: Number.MAX_SAFE_INTEGER, count: 2 },
      ])
    ).to.throw();
    const packed = PackedIdList.fromSaved(example);
    for (const n of [-1, 0.5, 3, NaN])
      expect(() => packed.at(n)).to.throw(RangeError);
  });

  it("round trips empty and zero-count snapshots", () => {
    expect(PackedIdList.fromSaved([]).toSaved()).to.deep.equal([]);
    expect(IdList.loadBinary(IdList.new().saveBinary()).save()).to.deep.equal(
      []
    );
    const zero = [{ ...example[0], count: 0 }];
    expect(PackedIdList.fromSaved(zero).toSaved()).to.deep.equal(zero);
    expect(
      IdList.loadBinary(PackedIdList.fromSaved(zero).toBytes()).save()
    ).to.deep.equal([]);
  });

  it("keeps tombstones, cursors and immutable edits after loading", () => {
    const list = IdList.load(example);
    const loaded = IdList.loadBinary(list.saveBinary());
    const deleted = { bunchId: "alice", counter: 4 };
    expect(loaded.isKnown(deleted)).to.equal(true);
    expect(loaded.has(deleted)).to.equal(false);
    expect(loaded.cursorIndex(deleted)).to.equal(list.cursorIndex(deleted));
    const next = loaded
      .insertAfter(deleted, { bunchId: "nanoid_-123", counter: 0 })
      .undelete(deleted);
    expect(next.save()).to.deep.equal(
      list
        .insertAfter(deleted, { bunchId: "nanoid_-123", counter: 0 })
        .undelete(deleted)
        .save()
    );
    expect(loaded.save()).to.deep.equal(list.save());
  });

  it("matches JSON snapshots throughout a deterministic mixed-edit trace", () => {
    const random = seedrandom("packed snapshots");
    let list = IdList.new();
    for (let i = 0; i < 1500; i++) {
      if (list.length === 0 || random() < 0.65) {
        const index = Math.floor(random() * (list.length + 1));
        list = list.insertAfter(index === 0 ? null : list.at(index - 1), {
          bunchId: `edit${i % 11}`,
          counter: i,
        });
      } else list = list.delete(list.at(Math.floor(random() * list.length)));
      if (i % 37 === 0) {
        const json = list.save();
        const packed = PackedIdList.load(list.saveBinary());
        expect(packed.toSaved()).to.deep.equal(json);
        const loaded = IdList.loadBinary(packed.toBytes());
        expect(loaded.save()).to.deep.equal(json);
        expect([...loaded.valuesWithIsDeleted()]).to.deep.equal([
          ...list.valuesWithIsDeleted(),
        ]);
        list = loaded;
      }
    }
  });
});
