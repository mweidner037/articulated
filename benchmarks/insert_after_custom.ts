import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import { ElementId, IdList, SavedIdList } from "../src";
import {
  avg,
  getMemUsed,
  gunzipString,
  gzipString,
  realTextTraceEdits,
  sleep,
} from "./internal/util";

const { edits, finalText } = realTextTraceEdits();

type Update = string;

export async function insertAfterCustom() {
  console.log("\n## Insert-After, Custom Encoding\n");
  console.log(
    "Send insertAfter and delete operations over a reliable link (e.g. WebSocket) - ElementId only."
  );
  console.log(
    "Updates use a custom string encoding; saved states use JSON with optional GZIP.\n"
  );

  // TODO: Deterministic randomness.
  const replicaId = uuidv4();
  let replicaCounter = 0;
  function nextBunchId(): string {
    // This is unrealistic (more than one replica will edit a document this large)
    // but the closest comparison to existing CRDT / list-positions benchmarks.
    return replicaId + replicaCounter++;
  }

  // Perform the whole trace, sending all updates.
  const updates: string[] = [];
  let startTime = process.hrtime.bigint();
  let sender = IdList.new();
  const lastCounters = new Map<string, number>();
  for (const edit of edits) {
    let update: Update;
    if (edit[2] !== undefined) {
      const before = edit[0] === 0 ? null : sender.at(edit[0] - 1);
      let id: ElementId;
      // Try to extend before's bunch, so that it will be compressed.
      if (
        before !== null &&
        lastCounters.get(before.bunchId) === before.counter
      ) {
        id = { bunchId: before.bunchId, counter: before.counter + 1 };
      } else {
        // id = { bunchId: uuidv4(), counter: 0 };
        id = { bunchId: nextBunchId(), counter: 0 };
      }
      lastCounters.set(id.bunchId, id.counter);

      sender = sender.insertAfter(before, id);

      update = encodeInsertAfter(id, before);
    } else {
      const id = sender.at(edit[0]);
      sender = sender.delete(id);
      update = "d" + id.bunchId + " " + id.counter.toString(36);
    }

    updates.push(update);
  }

  console.log(
    "- Sender time (ms):",
    Math.round(
      new Number(process.hrtime.bigint() - startTime).valueOf() / 1000000
    )
  );
  console.log(
    "- Avg update size (bytes):",
    avg(updates.map((message) => message.length)).toFixed(1)
  );
  // TODO
  // assert.strictEqual(sender.toString(), finalText);

  // Receive all updates.
  startTime = process.hrtime.bigint();
  let receiver = IdList.new();
  for (const update of updates) {
    if (update[0] === "i") {
      // type "insertAfter"
      const { id, before } = decodeInsertAfter(update);
      receiver = receiver.insertAfter(before, id);
      // To simulate events, also compute the inserted index.
      void receiver.indexOf(id);
    } else {
      // type "delete"
      const parts = update.slice(1).split(" ");
      const id: ElementId = {
        bunchId: parts[0],
        counter: Number.parseInt(parts[1], 36),
      };
      if (receiver.has(id)) {
        // To simulate events, also compute the inserted index.
        void receiver.indexOf(id);
        receiver = receiver.delete(id); // Also okay to call outside of the "has" guard.
      }
    }
  }

  console.log(
    "- Receiver time (ms):",
    Math.round(
      new Number(process.hrtime.bigint() - startTime).valueOf() / 1000000
    )
  );
  assert.deepStrictEqual(
    [...receiver.valuesWithIsDeleted()],
    [...sender.valuesWithIsDeleted()]
  );
  // TODO
  // assert.strictEqual(receiver.toString(), finalText);

  const savedState = saveLoad(receiver, false) as string;
  saveLoad(receiver, true);

  await memory(savedState);
}

function encodeInsertAfter(id: ElementId, before: ElementId | null): Update {
  let update = "i" + id.bunchId + " " + id.counter.toString(36) + " ";
  if (before === null) {
    update += "A";
  } else if (id.bunchId === before?.bunchId) {
    if (id.counter == before.counter + 1) {
      update += "B";
    } else {
      update += "C" + before.counter.toString(36);
    }
  } else {
    update += "D" + before.bunchId + " " + before.counter.toString(36);
  }
  return update;
}

function decodeInsertAfter(update: Update): {
  id: ElementId;
  before: ElementId | null;
} {
  const parts = update.slice(1).split(" ");
  const id: ElementId = {
    bunchId: parts[0],
    counter: Number.parseInt(parts[1], 36),
  };

  let before: ElementId | null;
  switch (parts[2][0]) {
    case "A":
      before = null;
      break;
    case "B":
      before = { bunchId: id.bunchId, counter: id.counter - 1 };
      break;
    case "C":
      before = {
        bunchId: id.bunchId,
        counter: Number.parseInt(parts[2].slice(1), 36),
      };
      break;
    case "D":
      before = {
        bunchId: parts[2].slice(1),
        counter: Number.parseInt(parts[3], 36),
      };
      break;
    default:
      throw new Error("parse error");
  }

  return { id, before };
}

function saveLoad(saver: IdList, gzip: boolean): string | Uint8Array {
  // Save.
  let startTime = process.hrtime.bigint();
  const savedStateObj = saver.save();
  const savedState = gzip
    ? gzipString(JSON.stringify(savedStateObj))
    : JSON.stringify(savedStateObj);

  console.log(
    `- Save time ${gzip ? "GZIP'd " : ""}(ms):`,
    Math.round(
      new Number(process.hrtime.bigint() - startTime).valueOf() / 1000000
    )
  );
  console.log(
    `- Save size ${gzip ? "GZIP'd " : ""}(bytes):`,
    savedState.length
  );

  // Load the saved state.
  startTime = process.hrtime.bigint();
  const toLoadStr = gzip
    ? gunzipString(savedState as Uint8Array)
    : (savedState as string);
  const toLoadObj = JSON.parse(toLoadStr) as SavedIdList;
  void IdList.load(toLoadObj);

  console.log(
    `- Load time ${gzip ? "GZIP'd " : ""}(ms):`,
    Math.round(
      new Number(process.hrtime.bigint() - startTime).valueOf() / 1000000
    )
  );

  return savedState;
}

async function memory(savedState: string) {
  // Measure memory usage of loading the saved state.

  // Pause (& separate function) seems to make GC more consistent -
  // less likely to get negative diffs.
  await sleep(1000);
  const startMem = getMemUsed();

  let loader: IdList | null = null;
  // Keep the parsed saved state in a separate scope so it can be GC'd
  // before we measure memory.
  (function () {
    const savedStateObj = JSON.parse(savedState) as SavedIdList;
    loader = IdList.load(savedStateObj);
  })();

  console.log(
    "- Mem used estimate (MB):",
    ((getMemUsed() - startMem) / 1000000).toFixed(1)
  );

  // Keep stuff in scope so we don't accidentally subtract its memory usage.
  void loader;
  void savedState;
}
