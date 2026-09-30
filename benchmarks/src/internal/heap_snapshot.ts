import fs from "fs";
import path from "path";
import v8 from "v8";

/**
 * Holds an object whose memory usage we want to measure.
 *
 * Measuring process.memoryUsage().heapUsed is unreliable, so instead we take a
 * heap snapshot and search it for the (unique) instance of this class.
 */
export class BenchmarkMemoryHolder {
  constructor(readonly value: unknown) {}
}

const TMP_DIR = path.join(__dirname, "../../tmp");

/**
 * Takes a heap snapshot and returns the retained size (in bytes) of the value
 * stored in the unique live BenchmarkMemoryHolder instance.
 *
 * The retained size is the total self size of all heap objects that would be
 * freed if the value were released. Objects shared with the rest of the heap
 * (e.g., the PRNG or trace strings) are not counted.
 */
export function measureRetainedSize(): number {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const file = path.join(TMP_DIR, `memory-${process.pid}.heapsnapshot`);
  // writeHeapSnapshot runs a full GC first, so only live objects appear.
  v8.writeHeapSnapshot(file);
  try {
    return retainedSizeInSnapshot(
      JSON.parse(fs.readFileSync(file, "utf8")) as HeapSnapshot,
    );
  } finally {
    fs.rmSync(file, { force: true });
  }
}

interface HeapSnapshot {
  snapshot: {
    meta: {
      node_fields: string[];
      node_types: [string[], ...unknown[]];
      edge_fields: string[];
      edge_types: [string[], ...unknown[]];
    };
  };
  nodes: number[];
  edges: number[];
  strings: string[];
}

function retainedSizeInSnapshot(snapshot: HeapSnapshot): number {
  const meta = snapshot.snapshot.meta;
  const { nodes, edges, strings } = snapshot;

  const nodeFieldCount = meta.node_fields.length;
  const nodeIdOffset = meta.node_fields.indexOf("id");
  const nodeTypeOffset = meta.node_fields.indexOf("type");
  const nodeNameOffset = meta.node_fields.indexOf("name");
  const nodeSelfSizeOffset = meta.node_fields.indexOf("self_size");
  const nodeEdgeCountOffset = meta.node_fields.indexOf("edge_count");
  const objectNodeType = meta.node_types[0].indexOf("object");

  const edgeFieldCount = meta.edge_fields.length;
  const edgeTypeOffset = meta.edge_fields.indexOf("type");
  const edgeNameOffset = meta.edge_fields.indexOf("name_or_index");
  const edgeToNodeOffset = meta.edge_fields.indexOf("to_node");
  const weakEdgeType = meta.edge_types[0].indexOf("weak");
  const internalEdgeType = meta.edge_types[0].indexOf("internal");

  const nodeCount = nodes.length / nodeFieldCount;

  // Index of each node's first edge in edges (edges are stored in node order).
  const firstEdge = new Uint32Array(nodeCount + 1);
  for (let i = 0; i < nodeCount; i++) {
    firstEdge[i + 1] =
      firstEdge[i] + nodes[i * nodeFieldCount + nodeEdgeCountOffset];
  }

  // Find the holder.
  let holder = -1;
  for (let i = 0; i < nodeCount; i++) {
    if (
      nodes[i * nodeFieldCount + nodeTypeOffset] === objectNodeType &&
      strings[nodes[i * nodeFieldCount + nodeNameOffset]] ===
        BenchmarkMemoryHolder.name
    ) {
      if (holder !== -1) {
        throw new Error("Found multiple BenchmarkMemoryHolder instances");
      }
      holder = i;
    }
  }
  if (holder === -1) throw new Error("BenchmarkMemoryHolder not found");

  /**
   * V8 represents each WeakMap entry as two strong internal edges to the
   * value, one from the key and one from the WeakMap's backing table, named
   * "<n> / part of key (... @keyId) -> value (... @valueId) pair in WeakMap (table @tableId)".
   *
   * We skip the table's edge so that the value is only reachable via its key,
   * matching WeakMap semantics. Otherwise, a module-level WeakMap cache whose
   * values reference their keys (e.g., prosemirror-model's resolveCache)
   * makes the keys appear reachable from the root.
   *
   * Maps edge name string index -> table node id, or -1 if not a WeakMap edge.
   */
  const weakMapTableIds = new Map<number, number>();
  function isWeakMapTableEdge(from: number, edgeIndex: number): boolean {
    if (edges[edgeIndex + edgeTypeOffset] !== internalEdgeType) return false;
    const nameIndex = edges[edgeIndex + edgeNameOffset];
    let tableId = weakMapTableIds.get(nameIndex);
    if (tableId === undefined) {
      const match = / pair in WeakMap \(table @(\d+)\)$/.exec(
        strings[nameIndex],
      );
      tableId = match === null ? -1 : Number(match[1]);
      weakMapTableIds.set(nameIndex, tableId);
    }
    return tableId === nodes[from * nodeFieldCount + nodeIdOffset];
  }

  /**
   * BFS over strong edges from start, skipping nodes already marked in
   * visited (which it mutates).
   */
  const stack = new Uint32Array(nodeCount);
  function markReachable(start: number, visited: Uint8Array): void {
    let stackSize = 0;
    visited[start] = 1;
    stack[stackSize++] = start;
    while (stackSize > 0) {
      const node = stack[--stackSize];
      for (let e = firstEdge[node]; e < firstEdge[node + 1]; e++) {
        const edgeIndex = e * edgeFieldCount;
        if (edges[edgeIndex + edgeTypeOffset] === weakEdgeType) continue;
        if (isWeakMapTableEdge(node, edgeIndex)) continue;
        const to = edges[edgeIndex + edgeToNodeOffset] / nodeFieldCount;
        if (visited[to] === 0) {
          visited[to] = 1;
          stack[stackSize++] = to;
        }
      }
    }
  }

  // The holder's retained set = nodes that become unreachable from the root
  // (node 0) once the holder is removed, i.e., the nodes it dominates.
  // Mark everything reachable from the root without passing through the holder.
  const visited = new Uint8Array(nodeCount);
  visited[holder] = 1;
  markReachable(0, visited);
  visited[holder] = 0;

  // Then collect what's newly reachable from the holder.
  const before = visited.slice();
  markReachable(holder, visited);
  let retainedSize = 0;
  for (let i = 0; i < nodeCount; i++) {
    if (visited[i] === 1 && before[i] === 0 && i !== holder) {
      retainedSize += nodes[i * nodeFieldCount + nodeSelfSizeOffset];
    }
  }
  return retainedSize;
}
