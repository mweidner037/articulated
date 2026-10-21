/** Exact canonical edit stream. Reference generation and identity assignment
 * happen in Node, never in measured browser clocks. No reload/refresh is used. */
import {
  ElementIdGenerator,
  IdList,
  type ElementId,
  type SavedIdList,
} from "articulated";
import { maybeRandomString } from "maybe-random-string";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import seedrandom from "seedrandom";
import { loadTrace, type TextTrace, type TraceEdit } from "../internal/trace";

export const canonicalSource = {
  upstreamCommit: "da212e984c777d31ee7d888f82637288aa4c61d3",
  traceUrl:
    "https://github.com/automerge/automerge-perf/blob/da212e984c777d31ee7d888f82637288aa4c61d3/edit-by-index/editing-trace.js",
  readmeUrl:
    "https://github.com/automerge/automerge-perf/blob/da212e984c777d31ee7d888f82637288aa4c61d3/README.md",
  rawUrl:
    "https://raw.githubusercontent.com/automerge/automerge-perf/da212e984c777d31ee7d888f82637288aa4c61d3/edit-by-index/editing-trace.js",
  license: "CC-BY-4.0",
  attribution:
    "Editing trace by Martin Kleppmann and the paper's authors, from automerge/automerge-perf. The upstream README states CC-BY-4.0 for the trace. Its concurrent history was flattened to index-based single-character edits; cursor moves are omitted.",
} as const;

export type CanonicalEdit =
  | {
      type: "insert";
      index: number;
      char: string;
      /** Expected anchor before the insertion. */ before: ElementId | null;
      /** New generated identity. */ id: ElementId;
    }
  | {
      type: "delete";
      index: number;
      /** Actual removed character, including newlines. */ char: string;
      /** Expected deletion target at index. */ id: ElementId;
    };
export interface CanonicalChunk {
  /** Number of operations consumed before this chunk. */
  start: number;
  /** Number of operations consumed after this chunk. */
  completed: number;
  edits: CanonicalEdit[];
  expected: SavedIdList;
  text: string;
}
export interface ProvenanceVerification {
  verified: true;
  upstreamSha256: string;
  editsSha256: string;
  finalTextSha256: string;
  operations: number;
  method:
    | "JSON-literal extraction; upstream JavaScript never executed"
    | "Local operation/text digests match pinned upstream JSON-literal comparison";
}
/** Derived from a direct literal-only comparison of the pinned upstream source.
 * Offline replay recomputes operation/text hashes and fails on any mismatch.
 * Pass upstreamSource/upstreamPath to repeat the full source-byte comparison. */
export const verifiedCanonicalDigests: ProvenanceVerification = {
  verified: true,
  upstreamSha256:
    "23116070719243e2950c310006dd50b3d80744be7542a86c62e7d5c2ed7326d0",
  editsSha256:
    "1fc4e3f3a44299a7cf11d63abef214a45df9b4dc96765f5cc001f16c121deebc",
  finalTextSha256:
    "a489e9022976c14e46627aea174d07797edcb3fd17df42605956d4cf01bf9039",
  operations: 259778,
  method:
    "Local operation/text digests match pinned upstream JSON-literal comparison",
};
export interface CanonicalMetadata {
  trace: string;
  traceSha256: string;
  editsSha256: string;
  finalTextSha256: string;
  /** SHA-256 of JSON.stringify(final SavedIdList), before per-document Mongo renaming. */
  finalSavedSha256: string;
  counts: {
    operations: number;
    insertions: number;
    deletions: number;
    newlineInsertions: number;
    newlineDeletions: number;
    finalCharacters: number;
  };
  seed: "42";
  startState: "empty";
  refreshInterval: null;
  checkpoints: number[];
  idPolicy: string;
  bunchCount: number;
  source: typeof canonicalSource & {
    upstreamVerification:
      ProvenanceVerification | { verified: false; reason: string };
  };
}
export interface CanonicalWorkload {
  model: "structured" | "opaque8";
  metadata: CanonicalMetadata;
  chunks: CanonicalChunk[];
  finalText: string;
}
export interface CanonicalWorkloads {
  structured: CanonicalWorkload;
  opaque8: CanonicalWorkload;
}
interface BuildOptions {
  checkpoints?: number[];
  traceSha256?: string;
  traceName?: string;
  upstreamVerification?: ProvenanceVerification;
}
const hash = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");

/** Stable digest of original Array.splice-style tuples, one JSON tuple per line.
 * Assigned ElementIds and derived deleted characters are deliberately excluded. */
export function canonicalEditDigest(edits: readonly TraceEdit[]): string {
  const digest = createHash("sha256");
  for (const edit of edits)
    digest.update(
      JSON.stringify(
        edit.type === "insert" ? [edit.index, 0, edit.char] : [edit.index, 1],
      ) + "\n",
    );
  return digest.digest("hex");
}

/** Extract only the two JSON-compatible literal assignments in the pinned
 * upstream file. Reject all additional syntax; never eval/import/run the JS. */
export function parseUpstreamCanonicalTrace(
  source: string,
): Pick<TextTrace, "edits" | "finalText"> {
  const text = source.trim(),
    prefix = "const edits = ";
  assert(text.startsWith(prefix), "Unexpected upstream edits declaration");
  const end = text.indexOf("\n];", prefix.length);
  assert(end >= 0, "Missing upstream literal array boundary");
  const tuples: unknown = JSON.parse(
    text.slice(prefix.length, end + 2).replace(/,\s*]$/, "]"),
  );
  const rest = text.slice(end + 3).trim(),
    finalPrefix = "const finalText = ";
  assert(
    rest.startsWith(finalPrefix),
    "Unexpected upstream finalText declaration",
  );
  const suffix =
    /;\s*if \(typeof module === ['"]object['"]\) module\.exports = \{ edits, finalText \}\s*;?\s*$/;
  const tail = suffix.exec(rest);
  assert(tail, "Unexpected upstream executable suffix");
  const finalText: unknown = JSON.parse(
    rest.slice(finalPrefix.length, tail.index),
  );
  assert(typeof finalText === "string" && Array.isArray(tuples));
  const edits: TraceEdit[] = tuples.map((tuple: unknown) => {
    assert(Array.isArray(tuple));
    const [index, deleted, char] = tuple;
    assert(Number.isSafeInteger(index) && index >= 0, "Invalid upstream index");
    if (deleted === 0) {
      assert(
        tuple.length === 3 &&
          typeof char === "string" &&
          char.length === 1 &&
          char.charCodeAt(0) <= 127,
        "Expected one ASCII insertion",
      );
      return { type: "insert", index, char };
    }
    assert(tuple.length === 2 && deleted === 1, "Expected one deletion");
    return { type: "delete", index };
  });
  return { edits, finalText };
}

/** Safe direct comparison against bytes fetched from canonicalSource.rawUrl.
 * Caller provides the text: benchmark runs need no network or remote execution. */
export function verifyCanonicalProvenance(
  source: string,
  local: Pick<TextTrace, "edits" | "finalText">,
): ProvenanceVerification {
  const upstream = parseUpstreamCanonicalTrace(source);
  assert.equal(
    upstream.finalText,
    local.finalText,
    "Upstream final text differs",
  );
  assert.equal(
    upstream.edits.length,
    local.edits.length,
    "Upstream operation count differs",
  );
  for (let i = 0; i < upstream.edits.length; i++) {
    const a = upstream.edits[i],
      b = local.edits[i];
    assert(
      a.type === b.type &&
        a.index === b.index &&
        (a.type !== "insert" || (b.type === "insert" && a.char === b.char)),
      `Upstream edit mismatch at ${i}`,
    );
  }
  return {
    verified: true,
    upstreamSha256: hash(source),
    editsSha256: canonicalEditDigest(upstream.edits),
    finalTextSha256: hash(upstream.finalText),
    operations: upstream.edits.length,
    method: "JSON-literal extraction; upstream JavaScript never executed",
  };
}

/** Mutable gap buffer for exact reference text, outside browser timers. It
 * preserves newline edits and avoids copying the entire growing string per key. */
class ReferenceText {
  private readonly left: string[] = [];
  private readonly right: string[] = [];
  get length() {
    return this.left.length + this.right.length;
  }
  private move(index: number) {
    while (this.left.length > index) this.right.push(this.left.pop()!);
    while (this.left.length < index) this.left.push(this.right.pop()!);
  }
  insert(index: number, char: string) {
    this.move(index);
    this.left.push(char);
  }
  delete(index: number) {
    this.move(index);
    return this.right.pop()!;
  }
  value() {
    return this.left.join("") + [...this.right].reverse().join("");
  }
}

/** Small-fixture entry point for tests. Production callers use canonicalWorkloads
 * for canonical counts and source-file hashing in addition to these checks. */
export function buildCanonicalWorkloads(
  trace: Pick<TextTrace, "edits" | "finalText">,
  options: BuildOptions = {},
): CanonicalWorkloads {
  const requested = options.checkpoints ?? [10_000, 50_000, 100_000, 200_000];
  assert(
    requested.every((n) => Number.isSafeInteger(n) && n > 0),
    "Invalid checkpoint",
  );
  const checkpoints = [
    ...new Set([
      ...requested.filter((n) => n < trace.edits.length),
      trace.edits.length,
    ]),
  ].sort((a, b) => a - b);
  const checkpointSet = new Set(checkpoints);
  const clientId = maybeRandomString({ prng: seedrandom("42"), length: 10 });
  const bunchIds: string[] = [];
  const idGen = new ElementIdGenerator(() => {
    const id = `${clientId}_${bunchIds.length.toString(36)}`;
    bunchIds.push(id);
    return id;
  });
  let list = IdList.new();
  // This independently checks the policy needed to restore live-generator
  // string sharing after serializing the precomputed operations to a browser.
  const assignedCounters = new Map<string, number>();
  const text = new ReferenceText();
  const counts = {
    operations: trace.edits.length,
    insertions: 0,
    deletions: 0,
    newlineInsertions: 0,
    newlineDeletions: 0,
    finalCharacters: trace.finalText.length,
  };
  const chunks: CanonicalChunk[] = [];
  let edits: CanonicalEdit[] = [],
    start = 0;
  for (let i = 0; i < trace.edits.length; i++) {
    const edit = trace.edits[i];
    assert(
      Number.isSafeInteger(edit.index) && edit.index >= 0,
      `Invalid index at ${i}`,
    );
    if (edit.type === "insert") {
      assert(
        edit.index <= list.length &&
          typeof edit.char === "string" &&
          edit.char.length === 1 &&
          edit.char.charCodeAt(0) <= 127,
        `Invalid ASCII insertion at ${i}`,
      );
      const before = edit.index ? list.at(edit.index - 1) : null;
      const id = idGen.generateAfter(before);
      if (before && id.bunchId === before.bunchId) {
        assert.equal(
          id.counter,
          before.counter + 1,
          "Continuation must follow its anchor counter",
        );
        assert.equal(
          assignedCounters.get(id.bunchId),
          id.counter,
          "Continuation must use the generator's next counter",
        );
      } else {
        assert(
          !assignedCounters.has(id.bunchId),
          "Non-anchor bunch must be new on its first insertion",
        );
        assert.equal(id.counter, 0, "A new bunch must start at counter zero");
      }
      assignedCounters.set(id.bunchId, id.counter + 1);
      list = list.insertAfter(before, id);
      text.insert(edit.index, edit.char);
      edits.push({
        type: "insert",
        index: edit.index,
        char: edit.char,
        before,
        id,
      });
      counts.insertions++;
      if (edit.char === "\n") counts.newlineInsertions++;
    } else {
      assert(
        edit.type === "delete" && edit.index < list.length,
        `Invalid deletion at ${i}`,
      );
      const id = list.at(edit.index),
        char = text.delete(edit.index);
      list = list.delete(id);
      edits.push({ type: "delete", index: edit.index, char, id });
      counts.deletions++;
      if (char === "\n") counts.newlineDeletions++;
    }
    assert.equal(list.length, text.length, `ID/text length mismatch at ${i}`);
    if (checkpointSet.has(i + 1)) {
      chunks.push({
        start,
        completed: i + 1,
        edits,
        expected: list.save(),
        text: text.value(),
      });
      start = i + 1;
      edits = [];
    }
  }
  if (!trace.edits.length)
    chunks.push({
      start: 0,
      completed: 0,
      edits: [],
      expected: list.save(),
      text: "",
    });
  assert.equal(
    text.value(),
    trace.finalText,
    "Replayed text is not the canonical final text",
  );
  assert.equal(counts.insertions - counts.deletions, trace.finalText.length);
  const editsSha256 = canonicalEditDigest(trace.edits),
    finalTextSha256 = hash(trace.finalText);
  if (options.upstreamVerification) {
    assert.equal(options.upstreamVerification.editsSha256, editsSha256);
    assert.equal(options.upstreamVerification.finalTextSha256, finalTextSha256);
    assert.equal(options.upstreamVerification.operations, counts.operations);
  }
  const metadata: CanonicalMetadata = {
    trace: options.traceName ?? "unit-fixture",
    traceSha256: options.traceSha256 ?? hash(JSON.stringify(trace)),
    editsSha256,
    finalTextSha256,
    finalSavedSha256: hash(JSON.stringify(chunks.at(-1)!.expected)),
    counts,
    seed: "42",
    startState: "empty",
    refreshInterval: null,
    checkpoints,
    idPolicy:
      "Harness-assigned identities, not collaborator IDs recorded in the trace. Same seed42/maybeRandomString 10-character client policy as IdListAlgorithm; one continuous ElementIdGenerator assigns client_sequence (base36) bunches and counters. Every non-anchor bunch is asserted new; a continuation must match both anchor.counter+1 and the generator's next counter. Start empty; never save/reload during replay. Checkpoint save() only observes state.",
    bunchCount: bunchIds.length,
    source: {
      ...canonicalSource,
      upstreamVerification: options.upstreamVerification ?? {
        verified: false,
        reason:
          "Pinned upstream provenance is documented; pass upstreamSource/upstreamPath to canonicalWorkloads to perform direct data-only comparison.",
      },
    },
  };
  const names = new Map<string, string>(),
    used = new Set<string>();
  for (const original of bunchIds) {
    let nonce = 0,
      name: string;
    do {
      name = createHash("sha256")
        .update(`canonical-opaque8:${original}:${nonce++}`)
        .digest("base64url")
        .slice(0, 8);
    } while (used.has(name));
    used.add(name);
    names.set(original, name);
  }
  const remap = (id: ElementId): ElementId => {
    const bunchId = names.get(id.bunchId);
    assert(bunchId, "Unknown generated bunch");
    return { bunchId, counter: id.counter };
  };
  const opaqueChunks = chunks.map((chunk) => ({
    ...chunk,
    edits: chunk.edits.map((edit): CanonicalEdit =>
      edit.type === "insert"
        ? {
            ...edit,
            before: edit.before ? remap(edit.before) : null,
            id: remap(edit.id),
          }
        : { ...edit, id: remap(edit.id) },
    ),
    expected: chunk.expected.map((run) => ({
      ...run,
      bunchId: names.get(run.bunchId)!,
    })),
  }));
  return {
    structured: {
      model: "structured",
      metadata,
      chunks,
      finalText: trace.finalText,
    },
    opaque8: {
      model: "opaque8",
      metadata: {
        ...metadata,
        finalSavedSha256: hash(JSON.stringify(opaqueChunks.at(-1)!.expected)),
        idPolicy:
          "Harness-assigned opaque 8-character IDs: collision-checked deterministic SHA256/base64url prefixes map EACH WHOLE generated structured bunch ID bijectively. Counters, run grouping, operation order, anchors and characters are identical to the structured replay. Not recorded collaborator identities; no refresh or regrouping.",
      },
      chunks: opaqueChunks,
      finalText: trace.finalText,
    },
  };
}

/** Load the vendored canonical stream, verify exact source counts/text and assign
 * IDs once. Optional upstream text/path enables pinned, data-only provenance
 * comparison. No network is performed and no JavaScript from upstream executes. */
export async function canonicalWorkloads(
  options: {
    upstreamSource?: string;
    upstreamPath?: string;
    checkpoints?: number[];
  } = {},
): Promise<CanonicalWorkloads> {
  const tracePath = path.join(__dirname, "../traces/kleppmannReal.json");
  const trace = await loadTrace("kleppmannReal", false);
  assert.equal(
    trace.edits.length,
    259_778,
    "Unexpected canonical operation count",
  );
  assert.equal(
    trace.finalText.length,
    104_852,
    "Unexpected canonical final length",
  );
  let upstream = options.upstreamSource;
  const upstreamPath =
    options.upstreamPath ?? process.env.CANONICAL_UPSTREAM_PATH;
  if (upstream === undefined && upstreamPath)
    upstream = fs.readFileSync(upstreamPath, "utf8");
  const workloads = buildCanonicalWorkloads(trace, {
    checkpoints: options.checkpoints,
    traceName: "kleppmannReal",
    traceSha256: hash(fs.readFileSync(tracePath)),
    upstreamVerification:
      upstream === undefined
        ? verifiedCanonicalDigests
        : verifyCanonicalProvenance(upstream, trace),
  });
  assert.equal(workloads.structured.metadata.counts.insertions, 182_315);
  assert.equal(workloads.structured.metadata.counts.deletions, 77_463);
  return workloads;
}
