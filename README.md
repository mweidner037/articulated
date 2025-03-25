# articulated

A TypeScript library for managing stable element identifiers in mutable lists, perfect for collaborative editing and other applications where elements need persistent identities despite insertions and deletions.

## Features

- **Stable identifiers**: Elements keep their identity even as their indices change
- **Efficient storage**: Optimized compression for sequential IDs
- **Collaborative-ready**: Supports concurrent operations from multiple sources
- **Tombstone support**: Deleted elements remain addressable
- **TypeScript-first**: Full type safety and excellent IDE integration

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

For optimal compression, when inserting multiple ElementIds in a left-to-right sequence, use the same `bunchId` with sequential `counter` values.

```typescript
// Example of IDs that will compress well
const id1 = { bunchId: "abc123", counter: 0 };
const id2 = { bunchId: "abc123", counter: 1 };
const id3 = { bunchId: "abc123", counter: 2 };
```

### IdList Operations

To enable easy and efficient rollbacks, such as in a [server reconciliation](https://mattweidner.com/2024/06/04/server-architectures.html#1-server-reconciliation) architecture, IdList is a persistent (immutable) data structure. Mutating methods return a new IdList, sharing memory with the old IdList where possible.

#### Basic Operations

- `insertAfter(before, newId): IdList`: Insert after a specific ElementId
- `insertBefore(after, newId): IdList`: Insert before a specific ElementId
- `delete(id): IdList`: Mark an ElementId as deleted (remains known)
- `undelete(id): IdList`: Restore a deleted ElementId

#### Basic Accessors

- `at(index)`: Get the ElementId at a specific index
- `indexOf(id, bias: "none" | "left" | "right" = "none")`: Get the index of an ElementId, with optional bias for deleted-but-known ElementIds

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

## Internals

IdList stores its state as a modified [B+Tree](https://en.wikipedia.org/wiki/B%2B_tree), described at the top of [its source code](./src/id_list.ts). Each leaf in the B+Tree represents multiple ElementIds (sharing a bunchId and sequential counters) in a compressed way; for normal collaborative text editing, expect 10-20 ElementIds per leaf.

In terms of the number of leaves `L`, mutating an IdList with insertAfter/insertBefore/delete/undelete will only create `O(log(L))` new tree nodes, reusing the rest. However, most methods currently take `O(L)` total time because they search the whole tree for a given ElementId, which has not yet been optimized (it uses a simple depth-first search). Exception: `IdList.at(index)` takes only `O(log(L))` time.

If you want to get a sense of what IdList is or how to implement your own version, consider reading the source code for [IdListSimple](./test/id_list_simple.ts), which behaves identically to IdList. It is short (<300 SLOC) and direct, using an array and `Array.splice`. The downside is that IdListSimple does not compress ElementIds, and all of its operations take `O(# ids)` time. We use it as a known-good implementation in our fuzz tests.

<!-- TODO: related work: CRDTs, ropes, list-positions, ?? -->
