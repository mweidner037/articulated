import { IdList, type SavedIdList } from "articulated";
import assert from "node:assert/strict";
import { test } from "node:test";
import { toTransposedOmit } from "../algorithms/id_list_saved_states";
import { NativeF05 } from "./native-f05";

type Page = {
  columns: { bunchIds: string[]; counts: number[] };
  starts: Float64Array;
  byId: Map<string, number | number[]>;
  idFilter?: Uint32Array;
};
const pages = (list: NativeF05) => (list as unknown as { pages: Page[] }).pages;
const row = (
  bunchId: string,
  startCounter: number,
  count: number,
  isDeleted = false,
) => ({ bunchId, startCounter, count, isDeleted });
const options = {
  ownership: "owned" as const,
  pageSize: 4,
  adoptEdits: true,
  reuseUnchangedColumns: true,
};

test("continuation copies counts but shares immutable identity columns and indexes", () => {
  const saved = [row("abcdefgh", 2 ** 40, 3), row("ijklmnop", 0, 2)];
  for (const pageIdFilter of [false, true]) {
    const old = NativeF05.load(toTransposedOmit(saved), {
      ...options,
      pageIdFilter,
    });
    const before = { bunchId: "abcdefgh", counter: 2 ** 40 + 2 };
    const id = { bunchId: "abcdefgh", counter: 2 ** 40 + 3 };
    const next = old.insertAfter(before, id, 2);
    const originalPage = pages(old)[0],
      nextPage = pages(next)[0];
    assert.notEqual(nextPage.columns.counts, originalPage.columns.counts);
    assert.equal(nextPage.columns.bunchIds, originalPage.columns.bunchIds);
    assert.equal(nextPage.starts, originalPage.starts);
    assert.equal(nextPage.byId, originalPage.byId);
    assert.equal(nextPage.idFilter, originalPage.idFilter);
    assert.deepEqual(
      next.save(),
      IdList.load(saved).insertAfter(before, id, 2).save(),
    );
    assert.equal(next.indexOf({ ...id, counter: id.counter + 1 }), 4);
    const branch = old.insertAfter(before, id, 5);
    assert.equal(branch.length, old.length + 5);
    assert.equal(next.length, old.length + 2);
    assert.deepEqual(old.save(), saved);
    const deleted = next.delete(id, 2);
    assert.deepEqual(
      deleted.save(),
      IdList.load(next.save()).delete(id, 2).save(),
    );
    assert.deepEqual(
      next.save(),
      IdList.load(saved).insertAfter(before, id, 2).save(),
    );
  }
});

test("continuation still rejects overlap with later live or deleted ranges", () => {
  for (const isDeleted of [false, true]) {
    const saved = [
      row("abcdefgh", 0, 3),
      row("ijklmnop", 0, 1),
      row("abcdefgh", 5, 2, isDeleted),
    ];
    const list = NativeF05.load(toTransposedOmit(saved), options);
    const before = { bunchId: "abcdefgh", counter: 2 },
      id = { bunchId: "abcdefgh", counter: 3 };
    assert.throws(() => list.insertAfter(before, id, 3), /Duplicate IDs/);
    assert.deepEqual(
      list.insertAfter(before, id, 2).save(),
      IdList.load(saved).insertAfter(before, id, 2).save(),
    );
    assert.deepEqual(list.save(), saved);
  }
});

test("middle, tombstone, different-bunch and shared-page insertions use reconstruction", () => {
  const cases = [
    {
      saved: [row("abcdefgh", 0, 4)],
      before: { bunchId: "abcdefgh", counter: 1 },
      id: { bunchId: "abcdefgh", counter: 4 },
    },
    {
      saved: [row("abcdefgh", 0, 4, true)],
      before: { bunchId: "abcdefgh", counter: 3 },
      id: { bunchId: "abcdefgh", counter: 4 },
    },
    {
      saved: [row("abcdefgh", 0, 4)],
      before: { bunchId: "abcdefgh", counter: 3 },
      id: { bunchId: "ijklmnop", counter: 0 },
    },
  ];
  for (const { saved, before, id } of cases) {
    const list = NativeF05.load(toTransposedOmit(saved), options);
    const next = list.insertAfter(before, id);
    assert.notEqual(pages(next)[0].starts, pages(list)[0].starts);
    assert.deepEqual(
      next.save(),
      IdList.load(saved).insertAfter(before, id).save(),
    );
  }
  const saved = [row("abcdefgh", 0, 4)];
  const shared = NativeF05.load(toTransposedOmit(saved), {
    ...options,
    ownership: "shared",
  });
  const next = shared.insertAfter(
    { bunchId: "abcdefgh", counter: 3 },
    { bunchId: "abcdefgh", counter: 4 },
  );
  assert.notEqual(pages(next)[0].starts, pages(shared)[0].starts);
  assert.deepEqual(shared.save(), saved);
});

test("continuation may bridge adjacent runs without changing normalized exports or split behavior", () => {
  const saved: SavedIdList = [
    row("abcdefgh", 0, 3),
    row("abcdefgh", 5, 2),
    row("ijklmnop", 0, 2),
    row("qrstuvwx", 0, 2),
  ];
  const list = NativeF05.load(toTransposedOmit(saved), options);
  const baseline = NativeF05.load(toTransposedOmit(saved), {
    ownership: "owned",
    pageSize: 4,
  });
  const before = { bunchId: "abcdefgh", counter: 2 },
    id = { bunchId: "abcdefgh", counter: 3 };
  const next = list.insertAfter(before, id, 2),
    expected = baseline.insertAfter(before, id, 2);
  assert.deepEqual(next.save(), expected.save());
  assert.deepEqual(next.wireState, expected.wireState);
  for (let i = 0; i < expected.length; i++)
    assert.deepEqual(next.at(i), expected.at(i));
  const inserted = { bunchId: "newnew12", counter: 0 };
  const split = next.insertAfter(next.at(1), inserted);
  assert.equal(pages(split).length, 2);
  assert.deepEqual(
    split.save(),
    expected.insertAfter(expected.at(1), inserted).save(),
  );
  assert.throws(() =>
    NativeF05.load(toTransposedOmit([]), {
      reuseUnchangedColumns: 1 as unknown as boolean,
    }),
  );
});
