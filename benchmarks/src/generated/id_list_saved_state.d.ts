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

/**
 * Properties of a GroupedSavedIdListMessage.
 * @deprecated Use GroupedSavedIdListMessage.$Properties instead.
 */
export interface IGroupedSavedIdListMessage extends GroupedSavedIdListMessage.$Properties {
}

/** Represents a GroupedSavedIdListMessage. */
export class GroupedSavedIdListMessage {

    /**
     * Constructs a new GroupedSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: GroupedSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** GroupedSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** GroupedSavedIdListMessage groupSizes. */
    groupSizes: number[];

    /** GroupedSavedIdListMessage startCounters. */
    startCounters: number[];

    /** GroupedSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new GroupedSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns GroupedSavedIdListMessage instance
     */
    static create(properties: GroupedSavedIdListMessage.$Shape): GroupedSavedIdListMessage & GroupedSavedIdListMessage.$Shape;
    static create(properties?: GroupedSavedIdListMessage.$Properties): GroupedSavedIdListMessage;

    /**
     * Encodes the specified GroupedSavedIdListMessage message. Does not implicitly {@link GroupedSavedIdListMessage.verify|verify} messages.
     * @param message GroupedSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: GroupedSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a GroupedSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {GroupedSavedIdListMessage & GroupedSavedIdListMessage.$Shape} GroupedSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): GroupedSavedIdListMessage & GroupedSavedIdListMessage.$Shape;
}

export namespace GroupedSavedIdListMessage {

    /** Properties of a GroupedSavedIdListMessage. */
    interface $Properties {

        /** GroupedSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** GroupedSavedIdListMessage groupSizes */
        groupSizes?: (number[]|null);

        /** GroupedSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** GroupedSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a GroupedSavedIdListMessage. */
    type $Shape = GroupedSavedIdListMessage.$Properties;
}

/**
 * Properties of a SplitGroupedSavedIdListMessage.
 * @deprecated Use SplitGroupedSavedIdListMessage.$Properties instead.
 */
export interface ISplitGroupedSavedIdListMessage extends SplitGroupedSavedIdListMessage.$Properties {
}

/** Represents a SplitGroupedSavedIdListMessage. */
export class SplitGroupedSavedIdListMessage {

    /**
     * Constructs a new SplitGroupedSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: SplitGroupedSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** SplitGroupedSavedIdListMessage clientIds. */
    clientIds: string[];

    /** SplitGroupedSavedIdListMessage seqNums. */
    seqNums: number[];

    /** SplitGroupedSavedIdListMessage groupSizes. */
    groupSizes: number[];

    /** SplitGroupedSavedIdListMessage startCounters. */
    startCounters: number[];

    /** SplitGroupedSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new SplitGroupedSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SplitGroupedSavedIdListMessage instance
     */
    static create(properties: SplitGroupedSavedIdListMessage.$Shape): SplitGroupedSavedIdListMessage & SplitGroupedSavedIdListMessage.$Shape;
    static create(properties?: SplitGroupedSavedIdListMessage.$Properties): SplitGroupedSavedIdListMessage;

    /**
     * Encodes the specified SplitGroupedSavedIdListMessage message. Does not implicitly {@link SplitGroupedSavedIdListMessage.verify|verify} messages.
     * @param message SplitGroupedSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: SplitGroupedSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SplitGroupedSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {SplitGroupedSavedIdListMessage & SplitGroupedSavedIdListMessage.$Shape} SplitGroupedSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SplitGroupedSavedIdListMessage & SplitGroupedSavedIdListMessage.$Shape;
}

export namespace SplitGroupedSavedIdListMessage {

    /** Properties of a SplitGroupedSavedIdListMessage. */
    interface $Properties {

        /** SplitGroupedSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** SplitGroupedSavedIdListMessage seqNums */
        seqNums?: (number[]|null);

        /** SplitGroupedSavedIdListMessage groupSizes */
        groupSizes?: (number[]|null);

        /** SplitGroupedSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** SplitGroupedSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a SplitGroupedSavedIdListMessage. */
    type $Shape = SplitGroupedSavedIdListMessage.$Properties;
}

/**
 * Properties of a BunchIndexOmitStartSavedIdListMessage.
 * @deprecated Use BunchIndexOmitStartSavedIdListMessage.$Properties instead.
 */
export interface IBunchIndexOmitStartSavedIdListMessage extends BunchIndexOmitStartSavedIdListMessage.$Properties {
}

/** Represents a BunchIndexOmitStartSavedIdListMessage. */
export class BunchIndexOmitStartSavedIdListMessage {

    /**
     * Constructs a new BunchIndexOmitStartSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: BunchIndexOmitStartSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** BunchIndexOmitStartSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** BunchIndexOmitStartSavedIdListMessage bunchIndices. */
    bunchIndices: number[];

    /** BunchIndexOmitStartSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** BunchIndexOmitStartSavedIdListMessage startCounters. */
    startCounters: number[];

    /** BunchIndexOmitStartSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new BunchIndexOmitStartSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns BunchIndexOmitStartSavedIdListMessage instance
     */
    static create(properties: BunchIndexOmitStartSavedIdListMessage.$Shape): BunchIndexOmitStartSavedIdListMessage & BunchIndexOmitStartSavedIdListMessage.$Shape;
    static create(properties?: BunchIndexOmitStartSavedIdListMessage.$Properties): BunchIndexOmitStartSavedIdListMessage;

    /**
     * Encodes the specified BunchIndexOmitStartSavedIdListMessage message. Does not implicitly {@link BunchIndexOmitStartSavedIdListMessage.verify|verify} messages.
     * @param message BunchIndexOmitStartSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: BunchIndexOmitStartSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a BunchIndexOmitStartSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {BunchIndexOmitStartSavedIdListMessage & BunchIndexOmitStartSavedIdListMessage.$Shape} BunchIndexOmitStartSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): BunchIndexOmitStartSavedIdListMessage & BunchIndexOmitStartSavedIdListMessage.$Shape;
}

export namespace BunchIndexOmitStartSavedIdListMessage {

    /** Properties of a BunchIndexOmitStartSavedIdListMessage. */
    interface $Properties {

        /** BunchIndexOmitStartSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** BunchIndexOmitStartSavedIdListMessage bunchIndices */
        bunchIndices?: (number[]|null);

        /** BunchIndexOmitStartSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** BunchIndexOmitStartSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** BunchIndexOmitStartSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a BunchIndexOmitStartSavedIdListMessage. */
    type $Shape = BunchIndexOmitStartSavedIdListMessage.$Properties;
}

/**
 * Properties of a ClientIndexOmitStartSavedIdListMessage.
 * @deprecated Use ClientIndexOmitStartSavedIdListMessage.$Properties instead.
 */
export interface IClientIndexOmitStartSavedIdListMessage extends ClientIndexOmitStartSavedIdListMessage.$Properties {
}

/** Represents a ClientIndexOmitStartSavedIdListMessage. */
export class ClientIndexOmitStartSavedIdListMessage {

    /**
     * Constructs a new ClientIndexOmitStartSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: ClientIndexOmitStartSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** ClientIndexOmitStartSavedIdListMessage clientIds. */
    clientIds: string[];

    /** ClientIndexOmitStartSavedIdListMessage clientIndices. */
    clientIndices: number[];

    /** ClientIndexOmitStartSavedIdListMessage seqNums. */
    seqNums: number[];

    /** ClientIndexOmitStartSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** ClientIndexOmitStartSavedIdListMessage startCounters. */
    startCounters: number[];

    /** ClientIndexOmitStartSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new ClientIndexOmitStartSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ClientIndexOmitStartSavedIdListMessage instance
     */
    static create(properties: ClientIndexOmitStartSavedIdListMessage.$Shape): ClientIndexOmitStartSavedIdListMessage & ClientIndexOmitStartSavedIdListMessage.$Shape;
    static create(properties?: ClientIndexOmitStartSavedIdListMessage.$Properties): ClientIndexOmitStartSavedIdListMessage;

    /**
     * Encodes the specified ClientIndexOmitStartSavedIdListMessage message. Does not implicitly {@link ClientIndexOmitStartSavedIdListMessage.verify|verify} messages.
     * @param message ClientIndexOmitStartSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: ClientIndexOmitStartSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ClientIndexOmitStartSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ClientIndexOmitStartSavedIdListMessage & ClientIndexOmitStartSavedIdListMessage.$Shape} ClientIndexOmitStartSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ClientIndexOmitStartSavedIdListMessage & ClientIndexOmitStartSavedIdListMessage.$Shape;
}

export namespace ClientIndexOmitStartSavedIdListMessage {

    /** Properties of a ClientIndexOmitStartSavedIdListMessage. */
    interface $Properties {

        /** ClientIndexOmitStartSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** ClientIndexOmitStartSavedIdListMessage clientIndices */
        clientIndices?: (number[]|null);

        /** ClientIndexOmitStartSavedIdListMessage seqNums */
        seqNums?: (number[]|null);

        /** ClientIndexOmitStartSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** ClientIndexOmitStartSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** ClientIndexOmitStartSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a ClientIndexOmitStartSavedIdListMessage. */
    type $Shape = ClientIndexOmitStartSavedIdListMessage.$Properties;
}
