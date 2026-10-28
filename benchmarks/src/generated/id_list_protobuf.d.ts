// DO NOT EDIT! This is a generated file. Edit the source file instead and regenerate.

import * as $protobuf from "protobufjs";

/**
 * Properties of a SavedIdListMessage.
 * @deprecated Use SavedIdListMessage.$Properties instead.
 */
export interface ISavedIdListMessage extends SavedIdListMessage.$Properties {
}

/** Represents a SavedIdListMessage. */
export class SavedIdListMessage {

    /**
     * Constructs a new SavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: SavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** SavedIdListMessage clientIds. */
    clientIds: string[];

    /** SavedIdListMessage clientIndexDeltas. */
    clientIndexDeltas: number[];

    /** SavedIdListMessage seqNumIncs. */
    seqNumIncs: number[];

    /** SavedIdListMessage signedCounts. */
    signedCounts: number[];

    /** SavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** SavedIdListMessage startCounters. */
    startCounters: number[];

    /**
     * Creates a new SavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SavedIdListMessage instance
     */
    static create(properties: SavedIdListMessage.$Shape): SavedIdListMessage & SavedIdListMessage.$Shape;
    static create(properties?: SavedIdListMessage.$Properties): SavedIdListMessage;

    /**
     * Encodes the specified SavedIdListMessage message. Does not implicitly {@link SavedIdListMessage.verify|verify} messages.
     * @param message SavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: SavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {SavedIdListMessage & SavedIdListMessage.$Shape} SavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SavedIdListMessage & SavedIdListMessage.$Shape;
}

export namespace SavedIdListMessage {

    /** Properties of a SavedIdListMessage. */
    interface $Properties {

        /** SavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** SavedIdListMessage clientIndexDeltas */
        clientIndexDeltas?: (number[]|null);

        /** SavedIdListMessage seqNumIncs */
        seqNumIncs?: (number[]|null);

        /** SavedIdListMessage signedCounts */
        signedCounts?: (number[]|null);

        /** SavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** SavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a SavedIdListMessage. */
    type $Shape = SavedIdListMessage.$Properties;
}
