// DO NOT EDIT! This is a generated file. Edit the source file instead and regenerate.

import * as $protobuf from "protobufjs";

/**
 * Properties of a BunchIndexSavedIdListMessage.
 * @deprecated Use BunchIndexSavedIdListMessage.$Properties instead.
 */
export interface IBunchIndexSavedIdListMessage extends BunchIndexSavedIdListMessage.$Properties {
}

/** Represents a BunchIndexSavedIdListMessage. */
export class BunchIndexSavedIdListMessage {

    /**
     * Constructs a new BunchIndexSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: BunchIndexSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** BunchIndexSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** BunchIndexSavedIdListMessage bunchIndices. */
    bunchIndices: number[];

    /** BunchIndexSavedIdListMessage startCounters. */
    startCounters: number[];

    /** BunchIndexSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new BunchIndexSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns BunchIndexSavedIdListMessage instance
     */
    static create(properties: BunchIndexSavedIdListMessage.$Shape): BunchIndexSavedIdListMessage & BunchIndexSavedIdListMessage.$Shape;
    static create(properties?: BunchIndexSavedIdListMessage.$Properties): BunchIndexSavedIdListMessage;

    /**
     * Encodes the specified BunchIndexSavedIdListMessage message. Does not implicitly {@link BunchIndexSavedIdListMessage.verify|verify} messages.
     * @param message BunchIndexSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: BunchIndexSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a BunchIndexSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {BunchIndexSavedIdListMessage & BunchIndexSavedIdListMessage.$Shape} BunchIndexSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): BunchIndexSavedIdListMessage & BunchIndexSavedIdListMessage.$Shape;
}

export namespace BunchIndexSavedIdListMessage {

    /** Properties of a BunchIndexSavedIdListMessage. */
    interface $Properties {

        /** BunchIndexSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** BunchIndexSavedIdListMessage bunchIndices */
        bunchIndices?: (number[]|null);

        /** BunchIndexSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** BunchIndexSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a BunchIndexSavedIdListMessage. */
    type $Shape = BunchIndexSavedIdListMessage.$Properties;
}

/**
 * Properties of a ClientIndexSavedIdListMessage.
 * @deprecated Use ClientIndexSavedIdListMessage.$Properties instead.
 */
export interface IClientIndexSavedIdListMessage extends ClientIndexSavedIdListMessage.$Properties {
}

/** Represents a ClientIndexSavedIdListMessage. */
export class ClientIndexSavedIdListMessage {

    /**
     * Constructs a new ClientIndexSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: ClientIndexSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** ClientIndexSavedIdListMessage clientIds. */
    clientIds: string[];

    /** ClientIndexSavedIdListMessage clientIndices. */
    clientIndices: number[];

    /** ClientIndexSavedIdListMessage seqNums. */
    seqNums: number[];

    /** ClientIndexSavedIdListMessage startCounters. */
    startCounters: number[];

    /** ClientIndexSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new ClientIndexSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ClientIndexSavedIdListMessage instance
     */
    static create(properties: ClientIndexSavedIdListMessage.$Shape): ClientIndexSavedIdListMessage & ClientIndexSavedIdListMessage.$Shape;
    static create(properties?: ClientIndexSavedIdListMessage.$Properties): ClientIndexSavedIdListMessage;

    /**
     * Encodes the specified ClientIndexSavedIdListMessage message. Does not implicitly {@link ClientIndexSavedIdListMessage.verify|verify} messages.
     * @param message ClientIndexSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: ClientIndexSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ClientIndexSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ClientIndexSavedIdListMessage & ClientIndexSavedIdListMessage.$Shape} ClientIndexSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ClientIndexSavedIdListMessage & ClientIndexSavedIdListMessage.$Shape;
}

export namespace ClientIndexSavedIdListMessage {

    /** Properties of a ClientIndexSavedIdListMessage. */
    interface $Properties {

        /** ClientIndexSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** ClientIndexSavedIdListMessage clientIndices */
        clientIndices?: (number[]|null);

        /** ClientIndexSavedIdListMessage seqNums */
        seqNums?: (number[]|null);

        /** ClientIndexSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** ClientIndexSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a ClientIndexSavedIdListMessage. */
    type $Shape = ClientIndexSavedIdListMessage.$Properties;
}
