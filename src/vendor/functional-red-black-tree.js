"use strict";

module.exports = createRBTree;

// Modified from https://github.com/mikolalysenko/functional-red-black-tree/blob/master/rbtree.js
// which is MIT Licensed, Copyright (c) 2013 Mikola Lysenko.

var RED = 0;
var BLACK = 1;

function RBNode(color, key, value, left, right) {
  this._color = color;
  this.key = key;
  this.value = value;
  this.left = left;
  this.right = right;
}

function cloneNode(node) {
  return new RBNode(node._color, node.key, node.value, node.left, node.right);
}

function repaint(color, node) {
  return new RBNode(color, node.key, node.value, node.left, node.right);
}

function RedBlackTree(compare, root) {
  this._compare = compare;
  this.root = root;
}

var proto = RedBlackTree.prototype;

// Object.defineProperty(proto, "keys", {
//   get: function () {
//     var result = [];
//     this.forEach(function (k, v) {
//       result.push(k);
//     });
//     return result;
//   },
// });

// Object.defineProperty(proto, "values", {
//   get: function () {
//     var result = [];
//     this.forEach(function (k, v) {
//       result.push(v);
//     });
//     return result;
//   },
// });

//Set a key-value pair
proto.set = function (key, value) {
  var cmp = this._compare;
  //Find point to insert/replace node
  var n = this.root;
  var n_stack = [];
  var d_stack = [];
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
  for (var s = n_stack.length - 2; s >= 0; --s) {
    var n = n_stack[s];
    if (d_stack[s] <= 0) {
      n_stack[s] = new RBNode(
        n._color,
        n.key,
        n.value,
        n_stack[s + 1],
        n.right
      );
    } else {
      n_stack[s] = new RBNode(n._color, n.key, n.value, n.left, n_stack[s + 1]);
    }
  }

  if (replace) return new RedBlackTree(cmp, n_stack[0]);

  //Rebalance tree using rotations
  //console.log("start insert", key, d_stack)
  for (var s = n_stack.length - 1; s > 1; --s) {
    var p = n_stack[s - 1];
    var n = n_stack[s];
    if (p._color === BLACK || n._color === BLACK) {
      break;
    }
    var pp = n_stack[s - 2];
    if (pp.left === p) {
      if (p.left === n) {
        var y = pp.right;
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
            var ppp = n_stack[s - 3];
            if (ppp.left === pp) {
              ppp.left = p;
            } else {
              ppp.right = p;
            }
          }
          break;
        }
      } else {
        var y = pp.right;
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
            var ppp = n_stack[s - 3];
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
        var y = pp.left;
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
            var ppp = n_stack[s - 3];
            if (ppp.right === pp) {
              ppp.right = p;
            } else {
              ppp.left = p;
            }
          }
          break;
        }
      } else {
        var y = pp.left;
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
            var ppp = n_stack[s - 3];
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
  return new RedBlackTree(cmp, n_stack[0]);
};

// //Visit all nodes inorder
// function doVisitFull(visit, node) {
//   if (node.left) {
//     var v = doVisitFull(visit, node.left);
//     if (v) {
//       return v;
//     }
//   }
//   var v = visit(node.key, node.value);
//   if (v) {
//     return v;
//   }
//   if (node.right) {
//     return doVisitFull(visit, node.right);
//   }
// }

// //Visit half nodes in order
// function doVisitHalf(lo, compare, visit, node) {
//   var l = compare(lo, node.key);
//   if (l <= 0) {
//     if (node.left) {
//       var v = doVisitHalf(lo, compare, visit, node.left);
//       if (v) {
//         return v;
//       }
//     }
//     var v = visit(node.key, node.value);
//     if (v) {
//       return v;
//     }
//   }
//   if (node.right) {
//     return doVisitHalf(lo, compare, visit, node.right);
//   }
// }

// //Visit all nodes within a range
// function doVisit(lo, hi, compare, visit, node) {
//   var l = compare(lo, node.key);
//   var h = compare(hi, node.key);
//   var v;
//   if (l <= 0) {
//     if (node.left) {
//       v = doVisit(lo, hi, compare, visit, node.left);
//       if (v) {
//         return v;
//       }
//     }
//     if (h > 0) {
//       v = visit(node.key, node.value);
//       if (v) {
//         return v;
//       }
//     }
//   }
//   if (h > 0 && node.right) {
//     return doVisit(lo, hi, compare, visit, node.right);
//   }
// }

// proto.forEach = function rbTreeForEach(visit, lo, hi) {
//   if (!this.root) {
//     return;
//   }
//   switch (arguments.length) {
//     case 1:
//       return doVisitFull(visit, this.root);
//       break;

//     case 2:
//       return doVisitHalf(lo, this._compare, visit, this.root);
//       break;

//     case 3:
//       if (this._compare(lo, hi) >= 0) {
//         return;
//       }
//       return doVisit(lo, hi, this._compare, visit, this.root);
//       break;
//   }
// };

// //First item in list
// Object.defineProperty(proto, "begin", {
//   get: function () {
//     var stack = [];
//     var n = this.root;
//     while (n) {
//       stack.push(n);
//       n = n.left;
//     }
//     return new RedBlackTreeIterator(this, stack);
//   },
// });

// //Last item in list
// Object.defineProperty(proto, "end", {
//   get: function () {
//     var stack = [];
//     var n = this.root;
//     while (n) {
//       stack.push(n);
//       n = n.right;
//     }
//     return new RedBlackTreeIterator(this, stack);
//   },
// });

// proto.ge = function (key) {
//   var cmp = this._compare;
//   var n = this.root;
//   var stack = [];
//   var last_ptr = 0;
//   while (n) {
//     var d = cmp(key, n.key);
//     stack.push(n);
//     if (d <= 0) {
//       last_ptr = stack.length;
//     }
//     if (d <= 0) {
//       n = n.left;
//     } else {
//       n = n.right;
//     }
//   }
//   stack.length = last_ptr;
//   return new RedBlackTreeIterator(this, stack);
// };

// proto.gt = function (key) {
//   var cmp = this._compare;
//   var n = this.root;
//   var stack = [];
//   var last_ptr = 0;
//   while (n) {
//     var d = cmp(key, n.key);
//     stack.push(n);
//     if (d < 0) {
//       last_ptr = stack.length;
//     }
//     if (d < 0) {
//       n = n.left;
//     } else {
//       n = n.right;
//     }
//   }
//   stack.length = last_ptr;
//   return new RedBlackTreeIterator(this, stack);
// };

// proto.lt = function (key) {
//   var cmp = this._compare;
//   var n = this.root;
//   var stack = [];
//   var last_ptr = 0;
//   while (n) {
//     var d = cmp(key, n.key);
//     stack.push(n);
//     if (d > 0) {
//       last_ptr = stack.length;
//     }
//     if (d <= 0) {
//       n = n.left;
//     } else {
//       n = n.right;
//     }
//   }
//   stack.length = last_ptr;
//   return new RedBlackTreeIterator(this, stack);
// };

proto.le = function (key) {
  var cmp = this._compare;
  var n = this.root;
  var stack = [];
  var last_ptr = 0;
  while (n) {
    var d = cmp(key, n.key);
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
  return new RedBlackTreeIterator(this, stack);
};

//Finds the item with key if it exists
proto.find = function (key) {
  var cmp = this._compare;
  var n = this.root;
  var stack = [];
  while (n) {
    var d = cmp(key, n.key);
    stack.push(n);
    if (d === 0) {
      return new RedBlackTreeIterator(this, stack);
    }
    if (d <= 0) {
      n = n.left;
    } else {
      n = n.right;
    }
  }
  return new RedBlackTreeIterator(this, []);
};

//Removes item with key from tree
proto.remove = function (key) {
  var iter = this.find(key);
  return iter.remove();
};

//Returns the item at `key`
proto.get = function (key) {
  var cmp = this._compare;
  var n = this.root;
  while (n) {
    var d = cmp(key, n.key);
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
};

//Iterator for red black tree
function RedBlackTreeIterator(tree, stack) {
  this.tree = tree;
  this._stack = stack;
}

var iproto = RedBlackTreeIterator.prototype;

// //Test if iterator is valid
// Object.defineProperty(iproto, "valid", {
//   get: function () {
//     return this._stack.length > 0;
//   },
// });

// //Node of the iterator
// Object.defineProperty(iproto, "node", {
//   get: function () {
//     if (this._stack.length > 0) {
//       return this._stack[this._stack.length - 1];
//     }
//     return null;
//   },
//   enumerable: true,
// });

// //Makes a copy of an iterator
// iproto.clone = function () {
//   return new RedBlackTreeIterator(this.tree, this._stack.slice());
// };

//Swaps two nodes
function swapNode(n, v) {
  n.key = v.key;
  n.value = v.value;
  n.left = v.left;
  n.right = v.right;
  n._color = v._color;
}

//Fix up a double black node in a tree
function fixDoubleBlack(stack) {
  var n, p, s, z;
  for (var i = stack.length - 1; i >= 0; --i) {
    n = stack[i];
    if (i === 0) {
      n._color = BLACK;
      return;
    }
    //console.log("visit node:", n.key, i, stack[i].key, stack[i-1].key)
    p = stack[i - 1];
    if (p.left === n) {
      //console.log("left child")
      s = p.right;
      if (s.right && s.right._color === RED) {
        //console.log("case 1: right sibling child red")
        s = p.right = cloneNode(s);
        z = s.right = cloneNode(s.right);
        p.right = s.left;
        s.left = p;
        s.right = z;
        s._color = p._color;
        n._color = BLACK;
        p._color = BLACK;
        z._color = BLACK;
        if (i > 1) {
          var pp = stack[i - 2];
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
        z = s.left = cloneNode(s.left);
        p.right = z.left;
        s.left = z.right;
        z.left = p;
        z.right = s;
        z._color = p._color;
        p._color = BLACK;
        s._color = BLACK;
        n._color = BLACK;
        if (i > 1) {
          var pp = stack[i - 2];
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
          var pp = stack[i - 2];
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
      s = p.left;
      if (s.left && s.left._color === RED) {
        //console.log("case 1: left sibling child red", p.value, p._color)
        s = p.left = cloneNode(s);
        z = s.left = cloneNode(s.left);
        p.left = s.right;
        s.right = p;
        s.left = z;
        s._color = p._color;
        n._color = BLACK;
        p._color = BLACK;
        z._color = BLACK;
        if (i > 1) {
          var pp = stack[i - 2];
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
        z = s.right = cloneNode(s.right);
        p.left = z.right;
        s.right = z.left;
        z.right = p;
        z.left = s;
        z._color = p._color;
        p._color = BLACK;
        s._color = BLACK;
        n._color = BLACK;
        if (i > 1) {
          var pp = stack[i - 2];
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
          var pp = stack[i - 2];
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

//Removes item at iterator from tree
iproto.remove = function () {
  var stack = this._stack;
  if (stack.length === 0) {
    return this.tree;
  }
  //First copy path to node
  var cstack = new Array(stack.length);
  var n = stack[stack.length - 1];
  cstack[cstack.length - 1] = new RBNode(
    n._color,
    n.key,
    n.value,
    n.left,
    n.right
  );
  for (var i = stack.length - 2; i >= 0; --i) {
    var n = stack[i];
    if (n.left === stack[i + 1]) {
      cstack[i] = new RBNode(n._color, n.key, n.value, cstack[i + 1], n.right);
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
    var split = cstack.length;
    n = n.left;
    while (n.right) {
      cstack.push(n);
      n = n.right;
    }
    //Copy path to leaf
    var v = cstack[split - 1];
    cstack.push(new RBNode(n._color, v.key, v.value, n.left, n.right));
    cstack[split - 1].key = n.key;
    cstack[split - 1].value = n.value;

    //Fix up stack
    for (var i = cstack.length - 2; i >= split; --i) {
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
    var p = cstack[cstack.length - 2];
    if (p.left === n) {
      p.left = null;
    } else if (p.right === n) {
      p.right = null;
    }
    cstack.pop();
    return new RedBlackTree(this.tree._compare, cstack[0]);
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
      return new RedBlackTree(this.tree._compare, cstack[0]);
    } else if (cstack.length === 1) {
      //Third easy case: root
      //console.log("ROOT")
      return new RedBlackTree(this.tree._compare, null);
    } else {
      //Hard case: Repaint n, and then do some nasty stuff
      //console.log("BLACK leaf no children")
      var parent = cstack[cstack.length - 2];
      fixDoubleBlack(cstack);
      //Fix up links
      if (parent.left === n) {
        parent.left = null;
      } else {
        parent.right = null;
      }
    }
  }
  return new RedBlackTree(this.tree._compare, cstack[0]);
};

//Returns key
Object.defineProperty(iproto, "key", {
  get: function () {
    if (this._stack.length > 0) {
      return this._stack[this._stack.length - 1].key;
    }
    return;
  },
  enumerable: true,
});

//Returns value
Object.defineProperty(iproto, "value", {
  get: function () {
    if (this._stack.length > 0) {
      return this._stack[this._stack.length - 1].value;
    }
    return;
  },
  enumerable: true,
});

// //Advances iterator to next element in list
// iproto.next = function () {
//   var stack = this._stack;
//   if (stack.length === 0) {
//     return;
//   }
//   var n = stack[stack.length - 1];
//   if (n.right) {
//     n = n.right;
//     while (n) {
//       stack.push(n);
//       n = n.left;
//     }
//   } else {
//     stack.pop();
//     while (stack.length > 0 && stack[stack.length - 1].right === n) {
//       n = stack[stack.length - 1];
//       stack.pop();
//     }
//   }
// };

// //Checks if iterator is at end of tree
// Object.defineProperty(iproto, "hasNext", {
//   get: function () {
//     var stack = this._stack;
//     if (stack.length === 0) {
//       return false;
//     }
//     if (stack[stack.length - 1].right) {
//       return true;
//     }
//     for (var s = stack.length - 1; s > 0; --s) {
//       if (stack[s - 1].left === stack[s]) {
//         return true;
//       }
//     }
//     return false;
//   },
// });

// //Update value
// iproto.update = function (value) {
//   var stack = this._stack;
//   if (stack.length === 0) {
//     throw new Error("Can't update empty node!");
//   }
//   var cstack = new Array(stack.length);
//   var n = stack[stack.length - 1];
//   cstack[cstack.length - 1] = new RBNode(
//     n._color,
//     n.key,
//     value,
//     n.left,
//     n.right
//   );
//   for (var i = stack.length - 2; i >= 0; --i) {
//     n = stack[i];
//     if (n.left === stack[i + 1]) {
//       cstack[i] = new RBNode(n._color, n.key, n.value, cstack[i + 1], n.right);
//     } else {
//       cstack[i] = new RBNode(n._color, n.key, n.value, n.left, cstack[i + 1]);
//     }
//   }
//   return new RedBlackTree(this.tree._compare, cstack[0]);
// };

// //Moves iterator backward one element
// iproto.prev = function () {
//   var stack = this._stack;
//   if (stack.length === 0) {
//     return;
//   }
//   var n = stack[stack.length - 1];
//   if (n.left) {
//     n = n.left;
//     while (n) {
//       stack.push(n);
//       n = n.right;
//     }
//   } else {
//     stack.pop();
//     while (stack.length > 0 && stack[stack.length - 1].left === n) {
//       n = stack[stack.length - 1];
//       stack.pop();
//     }
//   }
// };

// //Checks if iterator is at start of tree
// Object.defineProperty(iproto, "hasPrev", {
//   get: function () {
//     var stack = this._stack;
//     if (stack.length === 0) {
//       return false;
//     }
//     if (stack[stack.length - 1].left) {
//       return true;
//     }
//     for (var s = stack.length - 1; s > 0; --s) {
//       if (stack[s - 1].right === stack[s]) {
//         return true;
//       }
//     }
//     return false;
//   },
// });

// //Default comparison function
// function defaultCompare(a, b) {
//   if (a < b) {
//     return -1;
//   }
//   if (a > b) {
//     return 1;
//   }
//   return 0;
// }

//Build a tree
function createRBTree(compare) {
  return new RedBlackTree(compare, null);
}
