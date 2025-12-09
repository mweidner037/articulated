# articulated

A TypeScript library for managing stable element identifiers in mutable lists, intended for collaborative editing and other applications where elements need persistent identities despite insertions and deletions.

[Demos](https://github.com/mweidner037/articulated-demos)

## Features

- **Stable identifiers**: Elements keep their identity even as their indices change.
- **Efficient storage**: Optimized compression for sequential IDs.
- **Collaboration-ready**: Designed to handle operations from multiple sources.
- **Tombstone support**: Deleted elements remain addressable.

## Installation

```bash
npm install --save articulated
# or
yarn add articulated
```

## Quick Start

```typescript
import { IdList } from "articulated";

// Create an empty list.
let list = IdList.new();

// Insert a new ElementId at the beginning.
// Note: Persistent (immutable) data structure! Mutators return a new IdList.
list = list.insertAfter(null, { bunchId: "user1", counter: 0 });

// Insert another ElementId after the first.
list = list.insertAfter(
  { bunchId: "user1", counter: 0 },
  { bunchId: "user1", counter: 1 }
);

// Delete an ElementId (marks as deleted but keeps as known).
list = list.delete({ bunchId: "user1", counter: 0 });

// Check if ElementIds are present/known.
console.log(list.has({ bunchId: "user1", counter: 0 })); // false (deleted)
console.log(list.isKnown({ bunchId: "user1", counter: 0 })); // true (known but deleted)
```

## Core Concepts

### ElementId

An `ElementId` is a globally unique identifier for a list element, composed of:

- `bunchId`: A string UUID or similar globally unique ID
- `counter`: A numeric value to distinguish ElementIds in the same bunch

For optimal compression, when inserting multiple ElementIds in a left-to-right sequence, use the same `bunchId` with sequential `counter` values. Use `ElementIdGenerator` to help with that.

```typescript
// Example of IDs that will compress well:
const id1 = { bunchId: "abc123", counter: 0 };
const id2 = { bunchId: "abc123", counter: 1 };
const id3 = { bunchId: "abc123", counter: 2 };
```

To automatically generate ElementIds like these when appropriate, use `ElementIdGenerator`.

```ts
import { ElementIdGenerator } from "articulated";

const generator = new ElementIdGenerator(() => crypto.randomUUID());

// Specify the id you're planning to insert-after as an optimization hint.
const id1 = generator.generateAfter(null);
const id2 = generator.generateAfter(id1);
const id3 = generator.generateAfter(id2);
// { bunchId: "1747629c-eb71-4815-9424-f46844305eb5", counter: 0 },
// { bunchId: "1747629c-eb71-4815-9424-f46844305eb5", counter: 1 },
// { bunchId: "1747629c-eb71-4815-9424-f46844305eb5", counter: 2 }
```

### IdList Operations

To enable easy and efficient rollbacks, such as in a [server reconciliation](https://mattweidner.com/2024/06/04/server-architectures.html#1-server-reconciliation) architecture, IdList is a persistent (immutable) data structure. Mutating methods return a new IdList, sharing memory with the old IdList where possible.

#### Basic Operations

- `insertAfter(before, newId): IdList`: Insert after a specific ElementId.
- `insertBefore(after, newId): IdList`: Insert before a specific ElementId.
- `delete(id): IdList`: Mark an ElementId as deleted (it remains known).
- `undelete(id): IdList`: Restore a deleted ElementId.
- `uninsert(id): IdList`: Undo an insertion, making the ElementId no longer known. Use `delete(id)` instead in most cases (see method docs).

#### Basic Accessors

- `at(index)`: Get the ElementId at a specific index.
- `indexOf(id, bias: "none" | "left" | "right" = "none")`: Get the index of an ElementId, with optional bias for deleted-but-known ElementIds.

#### Cursors

A **cursor** points to a gap between two list elements - e.g., a cursor in a text document.

Internally, a cursor is represented as the ElementId on the left side of the gap, or null if it is at the start of the list. The cursor's index changes as the id's index changes, and it also "shifts left" if that id becomes deleted. (To bind to the id on the right instead, pass `bind = "right"` to the cursor methods.)

Convert indices to cursors and back using the methods `cursorAt` and `cursorIndex`. These are wrappers around `at` and `indexOf` that get the edge cases correct.

#### Bulk Operations

```typescript
// Insert multiple sequential ids at once
list = list.insertAfter(null, { bunchId: "user1", counter: 0 }, 5);
// Inserts 5 ids with bunchId="user1" and counters 0, 1, 2, 3, 4
```

#### Save and load

Save and load the list state in JSON form:

```typescript
// Save list state
const savedState = list.save();

// Later, load from saved state
let newList = IdList.load(savedState);
```

## Use Cases

- Text editors where characters need stable identities
- Todo lists with collaborative editing
- Any list where elements' positions change but need stable identifiers
- Conflict-free replicated data type (CRDT) implementations

**Note**: IdList is not itself a CRDT. Concurrent insertAfter operations with the same `before` ID will _not_ commute with each other. However, you can implement a list/text CRDT on top of IdList, by processing collaborative insertAfter and delete operations in an [eventually consistent total order](https://mattweidner.com/2025/05/21/text-without-crdts.html#decentralized-variants).

## Internals

IdList stores its state as a modified [B+Tree](https://en.wikipedia.org/wiki/B%2B_tree), described at the top of [its source code](./src/id_list.ts). Each leaf in the B+Tree represents multiple ElementIds (sharing a bunchId and sequential counters) in a compressed way; for normal collaborative text editing, expect 10-20 ElementIds per leaf.

To speed up searches, we also maintain a "bottom-up" tree that maps from each node to a sequence number identifying its parent. (Using sequence numbers instead of pointers is necessary for persistence.) The map is implemented using persistent balanced trees from [functional-red-black-tree](https://www.npmjs.com/package/functional-red-black-tree).

Asymptotic runtimes are given in terms of the number of leaves `L` and the maximum "fragmentation" of a leaf `F`, which is the number of times its ElementIds alternate between deleted vs present.

- insertAfter, insertBefore: `O(log^2(L) + F)`.
  - The bottleneck is finding the B+Tree path of the before/after ElementId. This requires `O(log(L))` lookups in the bottom-up tree's map, each of which takes `O(log(L))` time. See the implementation of `IdList.locate`.
- delete, undelete: `O(log^2(L) + F)`.
- indexOf: `O(log^2(L) + F)`.
  - Bottleneck is locating the id.
- at: `O(log(L) + F)`.
  - Simple B+Tree search.
- has, isKnown: `O(log(L) + F)`
  - Part of the bottom-up tree is a sorted map with leaf keys; due to the sort, we can also use that map to look up the leaf corresponding to an ElementId, in `O(log(L))` time.
- length: `O(1)`.
  - Cached.
- save: `O(S + L)`, where `S <= L * F` is the saved state's length.
- load: `O(S * log(S))`
  - The bottleneck is constructing the bottom-up tree: specifically, the map from each leaf to its parent's sequence number (`leafMap`). That map is itself a sorted tree, hence takes `O(L * log(L))` time to construct, and `L <= S`.

If you want to get a sense of what IdList is or how to implement your own version, consider reading the source code for [IdListSimple](./test/id_list_simple.ts), which behaves identically to IdList. It is short (<300 SLOC) and direct, using an array and `Array.splice`. The downside is that IdListSimple does not compress ElementIds and all of its operations take `O(# ids)` time. We use it as a known-good implementation in our fuzz tests.

<!-- TODO: related work: CRDTs, ropes, list-positions, ?? -->
