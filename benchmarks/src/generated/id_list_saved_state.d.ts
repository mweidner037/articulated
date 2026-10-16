// DO NOT EDIT! This is a generated file. Edit the source file instead and regenerate.

import * as $protobuf from "protobufjs";

/**
 * Properties of a SplitSavedIdListMessage.
 * @deprecated Use SplitSavedIdListMessage.$Properties instead.
 */
export interface ISplitSavedIdListMessage extends SplitSavedIdListMessage.$Properties {
}

/** Represents a SplitSavedIdListMessage. */
export class SplitSavedIdListMessage {

    /**
     * Constructs a new SplitSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: SplitSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** SplitSavedIdListMessage entries. */
    entries: SplitSavedIdListEntry.$Properties[];

    /**
     * Creates a new SplitSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SplitSavedIdListMessage instance
     */
    static create(properties: SplitSavedIdListMessage.$Shape): SplitSavedIdListMessage & SplitSavedIdListMessage.$Shape;
    static create(properties?: SplitSavedIdListMessage.$Properties): SplitSavedIdListMessage;

    /**
     * Encodes the specified SplitSavedIdListMessage message. Does not implicitly {@link SplitSavedIdListMessage.verify|verify} messages.
     * @param message SplitSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: SplitSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SplitSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {SplitSavedIdListMessage & SplitSavedIdListMessage.$Shape} SplitSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SplitSavedIdListMessage & SplitSavedIdListMessage.$Shape;
}

export namespace SplitSavedIdListMessage {

    /** Properties of a SplitSavedIdListMessage. */
    interface $Properties {

        /** SplitSavedIdListMessage entries */
        entries?: (SplitSavedIdListEntry.$Properties[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a SplitSavedIdListMessage. */
    type $Shape = SplitSavedIdListMessage.$Properties;
}

/**
 * Properties of a SplitSavedIdListEntry.
 * @deprecated Use SplitSavedIdListEntry.$Properties instead.
 */
export interface ISplitSavedIdListEntry extends SplitSavedIdListEntry.$Properties {
}

/** Represents a SplitSavedIdListEntry. */
export class SplitSavedIdListEntry {

    /**
     * Constructs a new SplitSavedIdListEntry.
     * @param [properties] Properties to set
     */
    constructor(properties?: SplitSavedIdListEntry.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** SplitSavedIdListEntry clientId. */
    clientId: string;

    /** SplitSavedIdListEntry seqNum. */
    seqNum: number;

    /** SplitSavedIdListEntry startCounter. */
    startCounter: number;

    /** SplitSavedIdListEntry count. */
    count: number;

    /** SplitSavedIdListEntry isDeleted. */
    isDeleted: boolean;

    /**
     * Creates a new SplitSavedIdListEntry instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SplitSavedIdListEntry instance
     */
    static create(properties: SplitSavedIdListEntry.$Shape): SplitSavedIdListEntry & SplitSavedIdListEntry.$Shape;
    static create(properties?: SplitSavedIdListEntry.$Properties): SplitSavedIdListEntry;

    /**
     * Encodes the specified SplitSavedIdListEntry message. Does not implicitly {@link SplitSavedIdListEntry.verify|verify} messages.
     * @param message SplitSavedIdListEntry message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: SplitSavedIdListEntry.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SplitSavedIdListEntry message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {SplitSavedIdListEntry & SplitSavedIdListEntry.$Shape} SplitSavedIdListEntry
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SplitSavedIdListEntry & SplitSavedIdListEntry.$Shape;
}

export namespace SplitSavedIdListEntry {

    /** Properties of a SplitSavedIdListEntry. */
    interface $Properties {

        /** SplitSavedIdListEntry clientId */
        clientId?: (string|null);

        /** SplitSavedIdListEntry seqNum */
        seqNum?: (number|null);

        /** SplitSavedIdListEntry startCounter */
        startCounter?: (number|null);

        /** SplitSavedIdListEntry count */
        count?: (number|null);

        /** SplitSavedIdListEntry isDeleted */
        isDeleted?: (boolean|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a SplitSavedIdListEntry. */
    type $Shape = SplitSavedIdListEntry.$Properties;
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
