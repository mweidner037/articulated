// Modified from https://github.com/mikolalysenko/functional-red-black-tree/blob/master/rbtree.js
// which is MIT Licensed, Copyright (c) 2013 Mikola Lysenko.
//
// External types modified from
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/functional-red-black-tree/functional-red-black-tree-tests.ts
// which is MIT Licensed.

const RED = 0;
const BLACK = 1;
type Color = typeof RED | typeof BLACK;

class RBNode<K, V> {
  constructor(
    public _color: Color,
    /** The key associated with the node. */
    public key: K,
    /** The value associated with the node. */
    public value: V,
    /** The left subtree of the node. */
    public left: RBNode<K, V> | null,
    /** The right subtree of the node. */
    public right: RBNode<K, V> | null
  ) {}
}

function cloneNode<K, V>(node: RBNode<K, V>): RBNode<K, V> {
  return new RBNode(node._color, node.key, node.value, node.left, node.right);
}

function repaint<K, V>(color: Color, node: RBNode<K, V>): RBNode<K, V> {
  return new RBNode(color, node.key, node.value, node.left, node.right);
}

/** Represents a functional red-black tree. */
export class RedBlackTree<K, V> {
  constructor(
    readonly compare: (key1: K, key2: K) => number,
    private readonly root: RBNode<K, V> | null
  ) {}

  /**
   * Creates an empty red-black tree.
   *
   * @param compare Comparison function, same semantics as array.sort().
   * @returns An empty tree ordered by `compare`.
   */
  static new<K, V>(compare: (key1: K, key2: K) => number): RedBlackTree<K, V> {
    return new RedBlackTree<K, V>(compare, null);
  }

  /**
   * Creates a new tree with `key` set to `value`, overwriting any
   * existing value.
   *
   * @param key The key of the item to insert.
   * @param value The value of the item to insert.
   * @returns A new tree with `key` set to `value`.
   */
  set(key: K, value: V): RedBlackTree<K, V> {
    const cmp = this.compare;
    //Find point to insert/replace node
    let n = this.root;
    const n_stack: RBNode<K, V>[] = [];
    const d_stack: number[] = [];
    let d = 0;
    while (n) {
      d = cmp(key, n.key);
      n_stack.push(n);
      d_stack.push(d);
      // If the keys are equivalent, skip straight to the replace = true case.
      if (d === 0) break;
      else if (d < 0) {
        n = n.left;
      } else {
        n = n.right;
      }
    }

    const replace = d === 0 && n_stack.length > 0;
    if (replace) {
      // The last node in the n_stack has key equivalent to `key`.
      // Replace its entry without changing the tree structure.
      const lastN = n_stack[n_stack.length - 1];
      if (lastN.key === key && lastN.value === value) return this;
      n_stack[n_stack.length - 1] = new RBNode(
        lastN._color,
        key,
        value,
        lastN.left,
        lastN.right
      );
    } else {
      n_stack.push(new RBNode(RED, key, value, null, null));
    }

    //Rebuild path to leaf node
    let s: number;
    for (s = n_stack.length - 2; s >= 0; --s) {
      n = n_stack[s];
      if (d_stack[s] <= 0) {
        n_stack[s] = new RBNode(
          n._color,
          n.key,
          n.value,
          n_stack[s + 1],
          n.right
        );
      } else {
        n_stack[s] = new RBNode(
          n._color,
          n.key,
          n.value,
          n.left,
          n_stack[s + 1]
        );
      }
    }

    if (replace) return new RedBlackTree<K, V>(cmp, n_stack[0]);

    //Rebalance tree using rotations
    //console.log("start insert", key, d_stack)
    for (s = n_stack.length - 1; s > 1; --s) {
      const p = n_stack[s - 1];
      n = n_stack[s];
      if (p._color === BLACK || n._color === BLACK) {
        break;
      }
      const pp = n_stack[s - 2];
      if (pp.left === p) {
        if (p.left === n) {
          const y = pp.right;
          if (y && y._color === RED) {
            //console.log("LLr")
            p._color = BLACK;
            pp.right = repaint(BLACK, y);
            pp._color = RED;
            s -= 1;
          } else {
            //console.log("LLb")
            pp._color = RED;
            pp.left = p.right;
            p._color = BLACK;
            p.right = pp;
            n_stack[s - 2] = p;
            n_stack[s - 1] = n;
            if (s >= 3) {
              const ppp = n_stack[s - 3];
              if (ppp.left === pp) {
                ppp.left = p;
              } else {
                ppp.right = p;
              }
            }
            break;
          }
        } else {
          const y = pp.right;
          if (y && y._color === RED) {
            //console.log("LRr")
            p._color = BLACK;
            pp.right = repaint(BLACK, y);
            pp._color = RED;
            s -= 1;
          } else {
            //console.log("LRb")
            p.right = n.left;
            pp._color = RED;
            pp.left = n.right;
            n._color = BLACK;
            n.left = p;
            n.right = pp;
            n_stack[s - 2] = n;
            n_stack[s - 1] = p;
            if (s >= 3) {
              const ppp = n_stack[s - 3];
              if (ppp.left === pp) {
                ppp.left = n;
              } else {
                ppp.right = n;
              }
            }
            break;
          }
        }
      } else {
        if (p.right === n) {
          const y = pp.left;
          if (y && y._color === RED) {
            //console.log("RRr", y.key)
            p._color = BLACK;
            pp.left = repaint(BLACK, y);
            pp._color = RED;
            s -= 1;
          } else {
            //console.log("RRb")
            pp._color = RED;
            pp.right = p.left;
            p._color = BLACK;
            p.left = pp;
            n_stack[s - 2] = p;
            n_stack[s - 1] = n;
            if (s >= 3) {
              const ppp = n_stack[s - 3];
              if (ppp.right === pp) {
                ppp.right = p;
              } else {
                ppp.left = p;
              }
            }
            break;
          }
        } else {
          const y = pp.left;
          if (y && y._color === RED) {
            //console.log("RLr")
            p._color = BLACK;
            pp.left = repaint(BLACK, y);
            pp._color = RED;
            s -= 1;
          } else {
            //console.log("RLb")
            p.left = n.right;
            pp._color = RED;
            pp.right = n.left;
            n._color = BLACK;
            n.right = p;
            n.left = pp;
            n_stack[s - 2] = n;
            n_stack[s - 1] = p;
            if (s >= 3) {
              const ppp = n_stack[s - 3];
              if (ppp.right === pp) {
                ppp.right = n;
              } else {
                ppp.left = n;
              }
            }
            break;
          }
        }
      }
    }
    //Return new tree
    n_stack[0]._color = BLACK;
    return new RedBlackTree<K, V>(cmp, n_stack[0]);
  }

  /**
   * Finds the last item in the tree whose key is <= `key`.
   *
   * @param key The key to search for.
   * @returns An iterator at the given element.
   */
  le(key: K): RedBlackTreeIterator<K, V> {
    const cmp = this.compare;
    let n = this.root;
    const stack: RBNode<K, V>[] = [];
    let last_ptr = 0;
    while (n) {
      const d = cmp(key, n.key);
      stack.push(n);
      if (d >= 0) {
        last_ptr = stack.length;
      }
      if (d < 0) {
        n = n.left;
      } else {
        n = n.right;
      }
    }
    stack.length = last_ptr;
    return new RedBlackTreeIterator<K, V>(this, stack);
  }

  /**
   * @returns An iterator pointing to the first item in the tree with `key`, otherwise null.
   */
  find(key: K): RedBlackTreeIterator<K, V> {
    const cmp = this.compare;
    let n = this.root;
    const stack: RBNode<K, V>[] = [];
    while (n) {
      const d = cmp(key, n.key);
      stack.push(n);
      if (d === 0) {
        return new RedBlackTreeIterator<K, V>(this, stack);
      }
      if (d <= 0) {
        n = n.left;
      } else {
        n = n.right;
      }
    }
    return new RedBlackTreeIterator<K, V>(this, []);
  }

  /**
   * Removes the first item with `key` in the tree.
   *
   * @param key The key of the item to remove.
   * @returns A new tree with the given item removed, if it exists.
   */
  remove(key: K): RedBlackTree<K, V> {
    const iter = this.find(key);
    return iter.remove();
  }

  /**
   * Retrieves the value associated with `key`.
   *
   * @param key The key of the item to look up.
   * @returns The value of the first node associated with `key`.
   */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  get(key: K): V | void {
    const cmp = this.compare;
    let n = this.root;
    while (n) {
      const d = cmp(key, n.key);
      if (d === 0) {
        return n.value;
      }
      if (d <= 0) {
        n = n.left;
      } else {
        n = n.right;
      }
    }
    return;
  }
}

//Swaps two nodes
function swapNode<K, V>(n: RBNode<K, V>, v: RBNode<K, V>): void {
  n.key = v.key;
  n.value = v.value;
  n.left = v.left;
  n.right = v.right;
  n._color = v._color;
}

//Fix up a double black node in a tree
function fixDoubleBlack<K, V>(stack: RBNode<K, V>[]): void {
  let n: RBNode<K, V>, p: RBNode<K, V>, s: RBNode<K, V>, z: RBNode<K, V>;
  for (let i = stack.length - 1; i >= 0; --i) {
    n = stack[i];
    if (i === 0) {
      n._color = BLACK;
      return;
    }
    //console.log("visit node:", n.key, i, stack[i].key, stack[i-1].key)
    p = stack[i - 1];
    if (p.left === n) {
      //console.log("left child")
      s = p.right!;
      if (s.right && s.right._color === RED) {
        //console.log("case 1: right sibling child red")
        s = p.right = cloneNode(s);
        z = s.right = cloneNode(s.right!);
        p.right = s.left;
        s.left = p;
        s.right = z;
        s._color = p._color;
        n._color = BLACK;
        p._color = BLACK;
        z._color = BLACK;
        if (i > 1) {
          const pp = stack[i - 2];
          if (pp.left === p) {
            pp.left = s;
          } else {
            pp.right = s;
          }
        }
        stack[i - 1] = s;
        return;
      } else if (s.left && s.left._color === RED) {
        //console.log("case 1: left sibling child red")
        s = p.right = cloneNode(s);
        z = s.left = cloneNode(s.left!);
        p.right = z.left;
        s.left = z.right;
        z.left = p;
        z.right = s;
        z._color = p._color;
        p._color = BLACK;
        s._color = BLACK;
        n._color = BLACK;
        if (i > 1) {
          const pp = stack[i - 2];
          if (pp.left === p) {
            pp.left = z;
          } else {
            pp.right = z;
          }
        }
        stack[i - 1] = z;
        return;
      }
      if (s._color === BLACK) {
        if (p._color === RED) {
          //console.log("case 2: black sibling, red parent", p.right.value)
          p._color = BLACK;
          p.right = repaint(RED, s);
          return;
        } else {
          //console.log("case 2: black sibling, black parent", p.right.value)
          p.right = repaint(RED, s);
          continue;
        }
      } else {
        //console.log("case 3: red sibling")
        s = cloneNode(s);
        p.right = s.left;
        s.left = p;
        s._color = p._color;
        p._color = RED;
        if (i > 1) {
          const pp = stack[i - 2];
          if (pp.left === p) {
            pp.left = s;
          } else {
            pp.right = s;
          }
        }
        stack[i - 1] = s;
        stack[i] = p;
        if (i + 1 < stack.length) {
          stack[i + 1] = n;
        } else {
          stack.push(n);
        }
        i = i + 2;
      }
    } else {
      //console.log("right child")
      s = p.left!;
      if (s.left && s.left._color === RED) {
        //console.log("case 1: left sibling child red", p.value, p._color)
        s = p.left = cloneNode(s);
        z = s.left = cloneNode(s.left!);
        p.left = s.right;
        s.right = p;
        s.left = z;
        s._color = p._color;
        n._color = BLACK;
        p._color = BLACK;
        z._color = BLACK;
        if (i > 1) {
          const pp = stack[i - 2];
          if (pp.right === p) {
            pp.right = s;
          } else {
            pp.left = s;
          }
        }
        stack[i - 1] = s;
        return;
      } else if (s.right && s.right._color === RED) {
        //console.log("case 1: right sibling child red")
        s = p.left = cloneNode(s);
        z = s.right = cloneNode(s.right!);
        p.left = z.right;
        s.right = z.left;
        z.right = p;
        z.left = s;
        z._color = p._color;
        p._color = BLACK;
        s._color = BLACK;
        n._color = BLACK;
        if (i > 1) {
          const pp = stack[i - 2];
          if (pp.right === p) {
            pp.right = z;
          } else {
            pp.left = z;
          }
        }
        stack[i - 1] = z;
        return;
      }
      if (s._color === BLACK) {
        if (p._color === RED) {
          //console.log("case 2: black sibling, red parent")
          p._color = BLACK;
          p.left = repaint(RED, s);
          return;
        } else {
          //console.log("case 2: black sibling, black parent")
          p.left = repaint(RED, s);
          continue;
        }
      } else {
        //console.log("case 3: red sibling")
        s = cloneNode(s);
        p.left = s.right;
        s.right = p;
        s._color = p._color;
        p._color = RED;
        if (i > 1) {
          const pp = stack[i - 2];
          if (pp.right === p) {
            pp.right = s;
          } else {
            pp.left = s;
          }
        }
        stack[i - 1] = s;
        stack[i] = p;
        if (i + 1 < stack.length) {
          stack[i + 1] = n;
        } else {
          stack.push(n);
        }
        i = i + 2;
      }
    }
  }
}

/** Iterates through the nodes in a red-black tree. */
export class RedBlackTreeIterator<K, V> {
  constructor(
    /** The tree associated with the iterator. */
    readonly tree: RedBlackTree<K, V>,
    private readonly stack: RBNode<K, V>[]
  ) {}

  /**
   * Removes the iterator's current item form the tree.
   *
   * @returns A new binary search tree with the item removed.
   */
  remove(): RedBlackTree<K, V> {
    const stack = this.stack;
    if (stack.length === 0) {
      return this.tree;
    }
    //First copy path to node
    const cstack = new Array<RBNode<K, V>>(stack.length);
    let n = stack[stack.length - 1];
    cstack[cstack.length - 1] = new RBNode(
      n._color,
      n.key,
      n.value,
      n.left,
      n.right
    );
    let i: number;
    for (i = stack.length - 2; i >= 0; --i) {
      n = stack[i];
      if (n.left === stack[i + 1]) {
        cstack[i] = new RBNode(
          n._color,
          n.key,
          n.value,
          cstack[i + 1],
          n.right
        );
      } else {
        cstack[i] = new RBNode(n._color, n.key, n.value, n.left, cstack[i + 1]);
      }
    }

    //Get node
    n = cstack[cstack.length - 1];
    //console.log("start remove: ", n.value)

    //If not leaf, then swap with previous node
    if (n.left && n.right) {
      //console.log("moving to leaf")

      //First walk to previous leaf
      const split = cstack.length;
      n = n.left;
      while (n.right) {
        cstack.push(n);
        n = n.right;
      }
      //Copy path to leaf
      const v = cstack[split - 1];
      cstack.push(new RBNode(n._color, v.key, v.value, n.left, n.right));
      cstack[split - 1].key = n.key;
      cstack[split - 1].value = n.value;

      //Fix up stack
      for (i = cstack.length - 2; i >= split; --i) {
        n = cstack[i];
        cstack[i] = new RBNode(n._color, n.key, n.value, n.left, cstack[i + 1]);
      }
      cstack[split - 1].left = cstack[split];
    }
    //console.log("stack=", cstack.map(function(v) { return v.value }))

    //Remove leaf node
    n = cstack[cstack.length - 1];
    if (n._color === RED) {
      //Easy case: removing red leaf
      //console.log("RED leaf")
      const p = cstack[cstack.length - 2];
      if (p.left === n) {
        p.left = null;
      } else if (p.right === n) {
        p.right = null;
      }
      cstack.pop();
      return new RedBlackTree<K, V>(this.tree.compare, cstack[0]);
    } else {
      if (n.left || n.right) {
        //Second easy case:  Single child black parent
        //console.log("BLACK single child")
        if (n.left) {
          swapNode(n, n.left);
        } else if (n.right) {
          swapNode(n, n.right);
        }
        //Child must be red, so repaint it black to balance color
        n._color = BLACK;
        return new RedBlackTree<K, V>(this.tree.compare, cstack[0]);
      } else if (cstack.length === 1) {
        //Third easy case: root
        //console.log("ROOT")
        return new RedBlackTree<K, V>(this.tree.compare, null);
      } else {
        //Hard case: Repaint n, and then do some nasty stuff
        //console.log("BLACK leaf no children")
        const parent = cstack[cstack.length - 2];
        fixDoubleBlack(cstack);
        //Fix up links
        if (parent.left === n) {
          parent.left = null;
        } else {
          parent.right = null;
        }
      }
    }
    return new RedBlackTree<K, V>(this.tree.compare, cstack[0]);
  }

  /** The key of the iterator's current item. */
  get key(): K | undefined {
    if (this.stack.length > 0) {
      return this.stack[this.stack.length - 1].key;
    }
    return;
  }

  /** The value of the iterator's current item. */
  get value(): V | undefined {
    if (this.stack.length > 0) {
      return this.stack[this.stack.length - 1].value;
    }
    return;
  }
}
