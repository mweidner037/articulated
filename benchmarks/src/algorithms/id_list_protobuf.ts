import { ElementIdGenerator, IdList } from "articulated";
import { assert } from "chai";
import { DEFAULT_CHARS, maybeRandomString } from "maybe-random-string";
import type seedrandom from "seedrandom";
import { SavedIdListMessage } from "../generated/id_list_protobuf";
import type { TraceEdit } from "../internal/trace";
import type { TextAlgorithm } from "./base";

const CLIENT_ID_LENGTH = 10;
const MAX_UINT32 = 0xffffffff;

/**
 * An IdList with ids only (no chars).
 *
 * Bunch ids use the form `"clientId.seqNum"`, where clientId is 10
 * chars long (60 bits of entropy) and seqNum is base-36 encoded.
 *
 * Saved states are a custom protobuf format, as described in packages/articulated/protobuf_saved_states.md.
 * Protobuf encoding uses protobufjs, with generated code in
 * src/generated/ built using `pnpm proto`.
 */
export class IdListProtobufAlgorithm implements TextAlgorithm<
  TraceEdit,
  Uint8Array
> {
  static readonly isProseMirror = false;
  static readonly isSavedStateString = false;
  static readonly isWasm = false;

  readonly idGen: ElementIdGenerator;
  list: IdList = IdList.new();

  constructor(prng: seedrandom.PRNG) {
    const clientId = maybeRandomString({
      prng,
      length: CLIENT_ID_LENGTH,
      // nanoid's alphabet.
      chars: DEFAULT_CHARS + "_-",
    });
    let seqNum = 0;
    const newBunchId = () => `${clientId}.${(seqNum++).toString(36)}`;
    this.idGen = new ElementIdGenerator(newBunchId);
  }

  apply(edit: TraceEdit): void {
    switch (edit.type) {
      case "insert": {
        const beforeId = edit.index === 0 ? null : this.list.at(edit.index - 1);
        this.list = this.list.insertAfter(
          beforeId,
          this.idGen.generateAfter(beforeId),
        );
        break;
      }
      case "delete": {
        this.list = this.list.delete(this.list.at(edit.index));
        break;
      }
    }
  }

  iterate(): void {
    for (const id of this.list) {
      void id;
    }
  }

  save(): Uint8Array {
    const { bunchIds, signedCounts, startCounterDeltas, startCounterValues } =
      this.list.saveCompact();

    const clientIds: string[] = [];
    const clientIndexMap = new Map<string, number>();
    const clientIndexDeltas: number[] = new Array(bunchIds.length);
    const seqNumIncs: number[] = new Array(bunchIds.length);

    let lastClientIndex = 0;
    for (let i = 0; i < bunchIds.length; i++) {
      const bunchId = bunchIds[i];

      // Try to split bunchId into `${clientId}.${seqNum}`.
      // If it doesn't round-trip exactly, store the whole bunchId as the clientId.
      let clientId = bunchId;
      let seqNumInc = 0;
      const delimiter = bunchId.lastIndexOf(".");
      if (delimiter !== -1) {
        const seqNumStr = bunchId.slice(delimiter + 1);
        const seqNum = parseInt(seqNumStr, 36);
        if (
          seqNum >= 0 &&
          seqNum < MAX_UINT32 &&
          seqNum.toString(36) === seqNumStr
        ) {
          clientId = bunchId.slice(0, delimiter);
          seqNumInc = seqNum + 1;
        }
      }

      let clientIndex = clientIndexMap.get(clientId);
      if (clientIndex === undefined) {
        clientIndex = clientIds.length;
        clientIds.push(clientId);
        clientIndexMap.set(clientId, clientIndex);
      }
      clientIndexDeltas[i] = clientIndex - lastClientIndex;
      lastClientIndex = clientIndex;
      seqNumIncs[i] = seqNumInc;
    }

    return SavedIdListMessage.encode({
      clientIds,
      clientIndexDeltas,
      seqNumIncs,
      signedCounts,
      startCounterIndexes: startCounterDeltas,
      startCounters: startCounterValues,
    }).finish();
  }

  load(savedState: Uint8Array): void {
    const {
      clientIds,
      clientIndexDeltas,
      seqNumIncs,
      signedCounts,
      startCounterIndexes,
      startCounters,
    } = SavedIdListMessage.decode(savedState);

    const bunchIds: string[] = new Array(clientIndexDeltas.length);
    let clientIndex = 0;
    for (let i = 0; i < clientIndexDeltas.length; i++) {
      clientIndex += clientIndexDeltas[i];
      const seqNumInc = seqNumIncs[i];
      bunchIds[i] =
        seqNumInc === 0
          ? clientIds[clientIndex]
          : `${clientIds[clientIndex]}.${(seqNumInc - 1).toString(36)}`;
    }

    this.list = IdList.loadCompact({
      bunchIds,
      signedCounts,
      startCounterDeltas: startCounterIndexes,
      startCounterValues: startCounters,
    });
  }

  check(finalText: string): void {
    // We don't store chars; check length only.
    assert.strictEqual(this.list.length, finalText.length);
  }

  free(): void {}
}
