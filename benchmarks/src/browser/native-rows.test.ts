import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { example } from "../full_picture/fixture";
import { candidate } from "./candidates";
import {
  NativeRows,
  type NativeRowsOptions,
  type ObjectRow,
  type SignedRow,
  type TupleRow,
} from "./native-rows";

const variants = [
  {
    id: "objects",
    load: (s: unknown, o?: NativeRowsOptions) =>
      NativeRows.loadF01(s as SavedIdList, o),
  },
  {
    id: "signed",
    load: (s: unknown, o?: NativeRowsOptions) =>
      NativeRows.loadF02(s as SignedRow[], o),
  },
  {
    id: "tuples",
    load: (s: unknown, o?: NativeRowsOptions) =>
      NativeRows.loadF03(s as TupleRow[], o),
  },
];
const pages = (list: NativeRows) =>
  (
    list as unknown as {
      pages: { rows: unknown[]; from: number; to: number }[];
      original?: unknown[];
    }
  ).pages;
function state(id: string, saved: SavedIdList): unknown[] {
  const c = candidate(id);
  return c.decode(c.encode(saved)) as unknown[];
}
for (const variant of variants)
  for (const ownership of ["owned", "shared"] as const) {
    test(`${variant.id}/${ownership} keeps parsed rows native with ownership and no tree adapter`, () => {
      const saved = Array.from({ length: 500 }, (_, i) => ({
        bunchId: i % 2 ? "opaque-A" : "opaque-B",
        startCounter: Math.floor(i / 2) * 4,
        count: 3,
        isDeleted: i % 5 === 0,
      }));
      const wire = state(variant.id, saved);
      for (const row of wire) Object.freeze(row);
      Object.freeze(wire);
      const originalLoad = IdList.load,
        originalDirect = IdList.experimentalLoadFrom;
      let list: NativeRows;
      try {
        IdList.load = () => {
          throw new Error("Adapter called");
        };
        IdList.experimentalLoadFrom = () => {
          throw new Error("Tree builder called");
        };
        list = variant.load(wire, { ownership, pageSize: 64 });
        assert.deepEqual(list.save(), saved);
        assert.equal(
          pages(list).every((p) => p.to - p.from <= 64),
          true,
        );
        if (ownership === "shared") {
          assert.equal(list.wireState, wire);
          assert(pages(list).every((p) => p.rows === wire));
        } else {
          assert.notEqual(list.wireState, wire);
          assert(pages(list).every((p) => p.rows !== wire));
          assert.equal(
            (list as unknown as { original?: unknown }).original,
            undefined,
          );
        }
        assert.deepEqual(list.wireState, wire);
        for (const page of pages(list))
          for (let i = page.from; i < page.to; i++)
            assert(
              wire.includes(page.rows[i]),
              "Input rows were cloned or converted",
            );
        const edited = list.insertAfter(
          list.at(499),
          { bunchId: "opaque-new", counter: 2 ** 40 },
          3,
        );
        assert.equal(
          pages(list).filter((p) => pages(edited).includes(p)).length,
          pages(list).length - 1,
        );
        const editedRows = pages(edited).flatMap((p) =>
          p.rows.slice(p.from, p.to),
        );
        assert.equal(
          wire.filter((r) => editedRows.includes(r)).length,
          wire.length - 1,
          "Unchanged row references must be reused",
        );
        assert.deepEqual(list.save(), saved);
        assert.deepEqual(
          variant.load(structuredClone(edited.wireState)).save(),
          edited.save(),
        );
      } finally {
        IdList.load = originalLoad;
        IdList.experimentalLoadFrom = originalDirect;
      }
    });

    test(`${variant.id}/${ownership} randomized parity, bulk deletes, tombstone anchors and immutable versions`, () => {
      const saved = Array.from({ length: 160 }, (_, i) => ({
        bunchId: `opaque/${i % 7}`,
        startCounter: Math.floor(i / 7) * 4,
        count: 4,
        isDeleted: i % 5 === 0,
      }));
      let tree = IdList.load(saved),
        native = variant.load(state(variant.id, saved), {
          ownership,
          pageSize: 16,
        }),
        seed = 42;
      const random = (n: number) => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed % n;
      };
      for (let i = 0; i < 250; i++) {
        const old = native,
          oldSaved = native.save();
        if (i % 3 !== 0) {
          const runs = tree.save(),
            run = runs[random(runs.length)];
          const before =
            i % 13
              ? {
                  bunchId: run.bunchId,
                  counter: run.startCounter + random(run.count),
                }
              : null;
          const id = {
              bunchId: `new opaque ${i % 11}`,
              counter: 2 ** 40 + i * 8,
            },
            count = 1 + random(4);
          tree = tree.insertAfter(before, id, count);
          native = native.insertAfter(before, id, count);
        } else {
          const runs = tree.save(),
            run = runs[random(runs.length)],
            id = { bunchId: run.bunchId, counter: run.startCounter },
            count = 1 + random(24);
          tree = tree.delete(id, count);
          native = native.delete(id, count);
        }
        assert.deepEqual(native.save(), tree.save());
        assert.deepEqual(old.save(), oldSaved);
        assert.equal(native.length, tree.length);
        for (let j = 0; j < 8; j++) {
          const index = random(tree.length),
            id = tree.at(index);
          assert.deepEqual(native.at(index), id);
          assert.equal(native.indexOf(id), index);
        }
        if (i % 25 === 0) {
          assert.deepEqual(
            variant.load(structuredClone(native.wireState)).save(),
            tree.save(),
          );
          for (const run of tree.save())
            for (const bias of ["none", "left", "right"] as const) {
              const id = { bunchId: run.bunchId, counter: run.startCounter };
              assert.equal(native.indexOf(id, bias), tree.indexOf(id, bias));
            }
          const id = { bunchId: "branched-from-old", counter: 0 };
          assert.deepEqual(
            old.insertAfter(null, id).save(),
            IdList.load(oldSaved).insertAfter(null, id).save(),
          );
        }
      }
    });

    test(`${variant.id}/${ownership} safe integers, duplicate rejection, empty lists and no-ops`, () => {
      const opts = { ownership, pageSize: 1 },
        list = variant.load(state(variant.id, example), opts);
      assert.throws(() =>
        list.insertAfter(null, { bunchId: "alice_0", counter: 2 }, 2),
      );
      assert.throws(() =>
        list.insertAfter(null, { bunchId: "alice_0", counter: 4 }),
      );
      assert.throws(() =>
        list.insertAfter(null, {
          bunchId: "new",
          counter: Number.MAX_SAFE_INTEGER,
        }),
      );
      assert.throws(() =>
        list.delete(
          { bunchId: "alice_0", counter: Number.MAX_SAFE_INTEGER },
          2,
        ),
      );
      assert.throws(() => list.at(-1));
      assert.throws(() => list.at(list.length));
      assert.throws(() => list.at(0.5));
      assert.throws(() => list.indexOf({ bunchId: "unknown", counter: 0 }));
      assert.equal(list.delete({ bunchId: "unknown", counter: 0 }), list);
      assert.equal(list.delete({ bunchId: "alice_0", counter: 3 }, 2), list);
      assert.equal(
        list.insertAfter(null, { bunchId: "new", counter: 0 }, 0),
        list,
      );
      const empty = variant.load([], opts);
      assert.equal(empty.length, 0);
      assert.deepEqual(empty.save(), []);
      const huge = empty.insertAfter(
        null,
        { bunchId: "opaque", counter: 2 ** 40 },
        2 ** 35,
      );
      assert.deepEqual(huge.at(2 ** 34), {
        bunchId: "opaque",
        counter: 2 ** 40 + 2 ** 34,
      });
      assert.equal(
        huge.indexOf({ bunchId: "opaque", counter: 2 ** 40 + 2 ** 34 }),
        2 ** 34,
      );
      assert.deepEqual(
        variant.load(structuredClone(huge.wireState)).save(),
        huge.save(),
      );
      assert.throws(() =>
        variant.load(state(variant.id, example), { pageSize: 0 }),
      );
      assert.throws(() =>
        variant.load(state(variant.id, example), {
          ownership: "bad" as "owned",
        }),
      );
      for (const bad of [null, {}, [null], [undefined]])
        assert.throws(() => variant.load(bad));
      const duplicate = state(variant.id, example);
      duplicate.push(duplicate[0]);
      assert.throws(() => variant.load(duplicate));
    });
  }
test("row-specific malformed data is rejected", () => {
  for (const bad of [
    { bunchId: "id", startCounter: 0, count: 1 },
    { bunchId: "id", startCounter: 0, count: -1, isDeleted: true },
    { bunchId: "id", startCounter: 0, count: 1, isDeleted: "false" },
  ])
    assert.throws(() => NativeRows.loadF01([bad as ObjectRow]));
  for (const count of [0, NaN, Infinity, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() =>
      NativeRows.loadF02([{ bunchId: "id", startCounter: 0, count }]),
    );
    assert.throws(() => NativeRows.loadF03([["id", 0, count]]));
  }
  assert.throws(() =>
    NativeRows.loadF02([
      { bunchId: "id", startCounter: Number.MAX_SAFE_INTEGER, count: 1 },
    ]),
  );
  assert.throws(() => NativeRows.loadF03([["id", -1, 1]]));
  assert.throws(() =>
    NativeRows.loadF03([["id", 0, 1, false] as unknown as TupleRow]),
  );
  assert.throws(() => NativeRows.loadF03([[99, 0, 1] as unknown as TupleRow]));
  assert.throws(() =>
    NativeRows.loadF02([
      { bunchId: "a", startCounter: 0, count: Number.MAX_SAFE_INTEGER },
      { bunchId: "b", startCounter: 0, count: 1 },
    ]),
  );
});
