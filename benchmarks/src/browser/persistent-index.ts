/** Small persistent AVL index for the experimental page directory and ID ranges.
 * Bulk construction avoids allocating an update path for every loaded entry. */
interface Node<K, V> {
  key: K;
  value: V;
  left: Node<K, V> | null;
  right: Node<K, V> | null;
  height: number;
}
const height = <K, V>(n: Node<K, V> | null) => n?.height ?? 0;
function node<K, V>(
  key: K,
  value: V,
  left: Node<K, V> | null,
  right: Node<K, V> | null,
): Node<K, V> {
  return {
    key,
    value,
    left,
    right,
    height: 1 + Math.max(height(left), height(right)),
  };
}
function balance<K, V>(
  key: K,
  value: V,
  left: Node<K, V> | null,
  right: Node<K, V> | null,
): Node<K, V> {
  if (height(left) > height(right) + 1) {
    const l = left!;
    if (height(l.left) >= height(l.right))
      return node(l.key, l.value, l.left, node(key, value, l.right, right));
    const m = l.right!;
    return node(
      m.key,
      m.value,
      node(l.key, l.value, l.left, m.left),
      node(key, value, m.right, right),
    );
  }
  if (height(right) > height(left) + 1) {
    const r = right!;
    if (height(r.right) >= height(r.left))
      return node(r.key, r.value, node(key, value, left, r.left), r.right);
    const m = r.left!;
    return node(
      m.key,
      m.value,
      node(key, value, left, m.left),
      node(r.key, r.value, m.right, r.right),
    );
  }
  return node(key, value, left, right);
}
export class PersistentIndex<K, V> {
  constructor(
    private readonly compare: (a: K, b: K) => number,
    private readonly root: Node<K, V> | null = null,
  ) {}
  static sorted<K, V>(
    compare: (a: K, b: K) => number,
    entries: readonly (readonly [K, V])[],
  ) {
    function build(lo: number, hi: number): Node<K, V> | null {
      if (lo === hi) return null;
      const mid = (lo + hi) >>> 1,
        [key, value] = entries[mid];
      return node(key, value, build(lo, mid), build(mid + 1, hi));
    }
    return new PersistentIndex(compare, build(0, entries.length));
  }
  get(key: K): V | undefined {
    let n = this.root;
    while (n) {
      const d = this.compare(key, n.key);
      if (!d) return n.value;
      n = d < 0 ? n.left : n.right;
    }
  }
  floor(key: K): readonly [K, V] | undefined {
    let n = this.root,
      found: Node<K, V> | null = null;
    while (n) {
      const d = this.compare(key, n.key);
      if (d === 0) return [n.key, n.value];
      if (d > 0) {
        found = n;
        n = n.right;
      } else n = n.left;
    }
    return found ? [found.key, found.value] : undefined;
  }
  ceiling(key: K): readonly [K, V] | undefined {
    let n = this.root,
      found: Node<K, V> | null = null;
    while (n) {
      const d = this.compare(key, n.key);
      if (d === 0) return [n.key, n.value];
      if (d < 0) {
        found = n;
        n = n.left;
      } else n = n.right;
    }
    return found ? [found.key, found.value] : undefined;
  }
  set(key: K, value: V): PersistentIndex<K, V> {
    const visit = (n: Node<K, V> | null): Node<K, V> => {
      if (!n) return node(key, value, null, null);
      const d = this.compare(key, n.key);
      if (!d) return node(key, value, n.left, n.right);
      return d < 0
        ? balance(n.key, n.value, visit(n.left), n.right)
        : balance(n.key, n.value, n.left, visit(n.right));
    };
    return new PersistentIndex(this.compare, visit(this.root));
  }
  delete(key: K): PersistentIndex<K, V> {
    const visit = (n: Node<K, V> | null): Node<K, V> | null => {
      if (!n) return null;
      const d = this.compare(key, n.key);
      if (d < 0) return balance(n.key, n.value, visit(n.left), n.right);
      if (d > 0) return balance(n.key, n.value, n.left, visit(n.right));
      if (!n.left) return n.right;
      if (!n.right) return n.left;
      let next = n.right;
      while (next.left) next = next.left;
      const removeMin = (r: Node<K, V>): Node<K, V> | null =>
        r.left ? balance(r.key, r.value, removeMin(r.left), r.right) : r.right;
      return balance(next.key, next.value, n.left, removeMin(n.right));
    };
    return new PersistentIndex(this.compare, visit(this.root));
  }
  *entries(): Generator<readonly [K, V]> {
    function* visit(n: Node<K, V> | null): Generator<readonly [K, V]> {
      if (!n) return;
      yield* visit(n.left);
      yield [n.key, n.value];
      yield* visit(n.right);
    }
    yield* visit(this.root);
  }
}
