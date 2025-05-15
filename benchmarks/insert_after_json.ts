import { assert } from "chai";
import { v4 as uuidv4 } from "uuid";
import { ElementId, PersistentIdList, SavedIdList } from "../src";
import {
  avg,
  getMemUsed,
  gunzipString,
  gzipString,
  realTextTraceEdits,
  sleep,
} from "./internal/util";

const { edits, finalText } = realTextTraceEdits();

type Update =
  | {
      type: "insertAfter";
      id: ElementId;
      before: ElementId | null;
    }
  | { type: "delete"; id: ElementId };

export async function insertAfterJson() {
  console.log("\n## Insert-After, JSON Encoding\n");
  console.log(
    "Send insertAfter and delete operations over a reliable link (e.g. WebSocket) - ElementId only."
  );
  console.log(
    "Updates and saved states use JSON encoding, with optional GZIP for saved states.\n"
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
  let sender = PersistentIdList.new();
  for (const edit of edits) {
    let updateObj: Update;
    if (edit[2] !== undefined) {
      const before = edit[0] === 0 ? null : sender.at(edit[0] - 1);
      let id: ElementId;
      // Try to extend before's bunch, so that it will be compressed.
      if (
        before !== null &&
        sender.maxCounter(before.bunchId) === before.counter
      ) {
        id = { bunchId: before.bunchId, counter: before.counter + 1 };
      } else {
        // id = { bunchId: uuidv4(), counter: 0 };
        id = { bunchId: nextBunchId(), counter: 0 };
      }

      sender = sender.insertAfter(before, id);

      updateObj = { type: "insertAfter", id, before };
    } else {
      const id = sender.at(edit[0]);
      sender = sender.delete(id);
      updateObj = { type: "delete", id };
    }

    updates.push(JSON.stringify(updateObj));
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
  let receiver = PersistentIdList.new();
  for (const update of updates) {
    const updateObj = JSON.parse(update) as Update;
    if (updateObj.type === "insertAfter") {
      receiver = receiver.insertAfter(updateObj.before, updateObj.id);
      // To simulate events, also compute the inserted index.
      void receiver.indexOf(updateObj.id);
    } else {
      // type "delete"
      if (receiver.has(updateObj.id)) {
        // To simulate events, also compute the inserted index.
        void receiver.indexOf(updateObj.id);
        receiver = receiver.delete(updateObj.id); // Also okay to call outside of the "has" guard.
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

function saveLoad(saver: PersistentIdList, gzip: boolean): string | Uint8Array {
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
  void PersistentIdList.load(toLoadObj);

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

  let loader: PersistentIdList | null = null;
  // Keep the parsed saved state in a separate scope so it can be GC'd
  // before we measure memory.
  (function () {
    const savedStateObj = JSON.parse(savedState) as SavedIdList;
    loader = PersistentIdList.load(savedStateObj);
  })();

  console.log(
    "- Mem used estimate (MB):",
    ((getMemUsed() - startMem) / 1000000).toFixed(1)
  );

  // Keep stuff in scope so we don't accidentally subtract its memory usage.
  void loader;
  void savedState;
}
