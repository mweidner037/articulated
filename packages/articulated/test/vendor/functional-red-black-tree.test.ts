import { expect } from "chai";
import type { RBNode } from "../../src/vendor/functional-red-black-tree";
import { RedBlackTree } from "../../src/vendor/functional-red-black-tree";

// Tests adapted from the upstream functional-red-black-tree test suite:
// https://github.com/mikolalysenko/functional-red-black-tree/blob/master/test/test.js
// which is MIT Licensed, Copyright (c) 2013 Mikola Lysenko.
//
// The upstream tests target a richer API (insert/forEach/keys/values/iterators/
// ge/gt/lt/at/update/length/_count). Our vendored copy keeps only a subset
// (set/get/le/find/remove plus the iterator's key/value/remove), so the tests
// have been rewritten against that API. White-box invariant checks reach into
// the private `root` the same way the other tests in this repo do.

const RED = 0;
const BLACK = 1;

function getRoot<K, V>(tree: RedBlackTree<K, V>): RBNode<K, V> | null {
  return tree["root"] as unknown as RBNode<K, V> | null;
}

// Collects [key, value] pairs via an in-order traversal of the internal tree.
function toEntries<K, V>(tree: RedBlackTree<K, V>): [K, V][] {
  const out: [K, V][] = [];
  function visit(node: RBNode<K, V> | null): void {
    if (!node) return;
    visit(node.left);
    out.push([node.key, node.value]);
    visit(node.right);
  }
  visit(getRoot(tree));
  return out;
}

function toKeys<K, V>(tree: RedBlackTree<K, V>): K[] {
  return toEntries(tree).map(([k]) => k);
}

function toValues<K, V>(tree: RedBlackTree<K, V>): V[] {
  return toEntries(tree).map(([, v]) => v);
}

// Ensures the red-black axioms are satisfied by tree.
function checkTree<K, V>(tree: RedBlackTree<K, V>): void {
  const root = getRoot(tree);
  if (!root) return;
  expect(root.color, "root is black").to.equal(BLACK);

  // Returns the black-height (number of black nodes along any path to a leaf).
  function checkNode(node: RBNode<K, V> | null): number {
    if (!node) return 1;
    if (node.color === RED) {
      expect(
        !node.left || node.left.color === BLACK,
        "children of red node must be black",
      ).to.equal(true);
      expect(
        !node.right || node.right.color === BLACK,
        "children of red node must be black",
      ).to.equal(true);
    } else {
      expect(node.color, "node color must be red or black").to.equal(BLACK);
    }
    if (node.left) {
      expect(
        tree.compare(node.left.key, node.key) <= 0,
        "left tree order invariant",
      ).to.equal(true);
    }
    if (node.right) {
      expect(
        tree.compare(node.right.key, node.key) >= 0,
        "right tree order invariant",
      ).to.equal(true);
    }
    const cl = checkNode(node.left);
    const cr = checkNode(node.right);
    expect(
      cl,
      "number of black nodes along all paths to root must be constant",
    ).to.equal(cr);
    return cl + node.color;
  }
  checkNode(root);
}

const numericCompare = (a: number, b: number) => a - b;

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

describe("functional-red-black-tree (vendored)", () => {
  it("set()", () => {
    let u = RedBlackTree.new<number, boolean>(numericCompare);

    const arr: number[] = [];
    for (let i = 20; i >= 0; --i) {
      const next = u.set(i, true);
      // Both the old and new trees must remain valid (persistence).
      checkTree(u);
      checkTree(next);
      expect(toKeys(u)).to.deep.equal([...arr].sort(numericCompare));
      arr.push(i);
      u = next;
    }
    for (let i = -20; i < 0; ++i) {
      const next = u.set(i, true);
      checkTree(u);
      checkTree(next);
      expect(toKeys(u)).to.deep.equal([...arr].sort(numericCompare));
      arr.push(i);
      u = next;
    }

    expect(toKeys(u)).to.deep.equal(range(41).map((j) => j - 20));
  });

  it("get() and in-order traversal", () => {
    let u = RedBlackTree.new<number, number>(numericCompare);
    for (let k = 0; k < 31; ++k) {
      u = u.set(k, k);
    }

    expect(toKeys(u)).to.deep.equal(range(31));
    expect(toValues(u)).to.deep.equal(range(31));

    for (let k = 0; k < 31; ++k) {
      expect(u.get(k)).to.equal(k);
    }
    expect(u.get(-1)).to.equal(undefined);
    expect(u.get(31)).to.equal(undefined);
  });

  it("set() replaces an existing value without mutating", () => {
    const arr = [0, 1, 2, 3, 4, 5, 6];
    let u = RedBlackTree.new<number, number>(numericCompare);
    for (const k of arr) {
      u = u.set(k, k);
    }

    for (const k of arr) {
      const updated = u.set(k, 1000);
      // The original tree is untouched.
      expect(u.get(k), "ensure no mutation").to.equal(k);
      // The new tree has the replaced value.
      expect(updated.get(k), "ensure update applied").to.equal(1000);
      checkTree(updated);
      checkTree(u);
      // Replacing a value must not change the set of keys.
      expect(toKeys(updated)).to.deep.equal(arr);
    }
  });

  it("remove()", () => {
    const sz = [1, 2, 10, 20, 23, 31, 32, 33];
    for (const c of sz) {
      let u = RedBlackTree.new<number, number>(numericCompare);
      for (let k = 0; k < c; ++k) {
        u = u.set(k, k);
      }
      for (let i = 0; i < c; ++i) {
        const removed = u.remove(i);
        checkTree(removed);
        // The removed key is gone; all others remain.
        expect(removed.get(i)).to.equal(undefined);
        expect(toKeys(removed)).to.deep.equal(range(c).filter((k) => k !== i));
        // Original tree is unchanged.
        expect(u.get(i)).to.equal(i);
      }
    }
  });

  it("keys and values (string keys)", () => {
    const originalKeys = [
      "potato",
      "sock",
      "foot",
      "apple",
      "newspaper",
      "gameboy",
    ];
    const originalValues = [42, 10, false, "!!!", {}, null];

    let u = RedBlackTree.new<string, unknown>((a, b) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    for (let i = 0; i < originalKeys.length; ++i) {
      u = u.set(originalKeys[i], originalValues[i]);
    }

    const zipped = range(originalKeys.length).map(
      (i) => [originalKeys[i], originalValues[i]] as [string, unknown],
    );
    zipped.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

    expect(toKeys(u)).to.deep.equal(zipped.map(([k]) => k));
    expect(toValues(u)).to.deep.equal(zipped.map(([, v]) => v));
    checkTree(u);
  });

  it("searching with le(), find(), get()", () => {
    const arr = [0, 1, 2, 3, 4, 5, 6];
    let u = RedBlackTree.new<number, number>(numericCompare);
    for (const k of arr) {
      u = u.set(k, k);
    }

    // get
    for (const k of arr) {
      expect(u.get(k), "get " + k).to.equal(k);
    }
    expect(u.get(-1), "get missing").to.equal(undefined);

    // le: last item with key <= query.
    expect(u.le(3).key, "le exact").to.equal(3);
    expect(u.le(3.5).key, "le between").to.equal(3);
    expect(u.le(0).key, "le first").to.equal(0);
    expect(u.le(6).key, "le last").to.equal(6);
    expect(u.le(100).key, "le big").to.equal(6);
    expect(u.le(-1).key, "le small (none)").to.equal(undefined);
    expect(u.le(-1).value, "le small (none) value").to.equal(undefined);
    expect(u.le(3).value, "le value").to.equal(3);

    // find: iterator at the matching key, else empty.
    expect(u.find(3).key, "find simple").to.equal(3);
    expect(u.find(3).value, "find value").to.equal(3);
    expect(u.find(-1).key, "find missing small").to.equal(undefined);
    expect(u.find(10000).key, "find missing big").to.equal(undefined);
    for (const k of arr) {
      expect(u.find(k).key, "find " + k).to.equal(k);
    }
  });

  it("iterator remove()", () => {
    const arr = [0, 1, 2, 3, 4, 5, 6];
    let u = RedBlackTree.new<number, number>(numericCompare);
    for (const k of arr) {
      u = u.set(k, k);
    }

    // Removing via an iterator obtained from find() matches tree.remove().
    for (const k of arr) {
      const viaIter = u.find(k).remove();
      checkTree(viaIter);
      expect(toKeys(viaIter)).to.deep.equal(arr.filter((x) => x !== k));
    }

    // Removing a missing key returns the same tree.
    const same = u.find(100).remove();
    expect(same).to.equal(u);
  });

  it("slab-sequence", () => {
    let tree = RedBlackTree.new<number, number>(numericCompare);

    tree = tree.set(0, 0);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([0]);

    tree = tree.set(1, 1);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([0, 1]);

    tree = tree.set(0.5, 2);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([0, 2, 1]);

    tree = tree.set(0.25, 3);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([0, 3, 2, 1]);

    tree = tree.remove(0);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([3, 2, 1]);

    tree = tree.set(0.375, 4);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([3, 4, 2, 1]);

    tree = tree.remove(1);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([3, 4, 2]);

    tree = tree.remove(0.5);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([3, 4]);

    tree = tree.remove(0.375);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([3]);

    tree = tree.remove(0.25);
    checkTree(tree);
    expect(toValues(tree)).to.deep.equal([]);
  });

  it("slab-sequence-2", () => {
    let u = RedBlackTree.new<number, number>(numericCompare);

    const inserts: [number, number][] = [
      [12, 22],
      [11, 3],
      [10, 28],
      [13, 16],
      [9, 9],
      [14, 10],
      [8, 15],
      [15, 29],
      [16, 4],
      [7, 21],
      [17, 23],
      [6, 2],
      [5, 27],
      [18, 17],
      [4, 8],
      [31, 11],
      [30, 30],
      [29, 5],
      [28, 24],
      [27, 18],
      [26, 12],
      [25, 31],
      [24, 6],
      [23, 25],
      [19, 7],
      [20, 13],
      [1, 20],
      [0, 14],
      [22, 0],
      [2, 1],
      [3, 26],
      [21, 19],
    ];
    for (const [k, v] of inserts) {
      u = u.set(k, v);
      checkTree(u);
    }

    const removals = [
      18, 17, 16, 15, 14, 13, 12, 6, 7, 8, 11, 4, 9, 10, 5, 31, 0, 30, 29, 1,
      28, 2, 3, 27, 19, 26, 20, 25, 24, 21, 23, 22,
    ];
    for (const k of removals) {
      u = u.remove(k);
      checkTree(u);
    }

    expect(toKeys(u)).to.deep.equal([]);
  });
});
