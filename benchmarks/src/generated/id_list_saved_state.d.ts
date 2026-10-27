// DO NOT EDIT! This is a generated file. Edit the source file instead and regenerate.

import * as $protobuf from "protobufjs";

/**
 * Properties of a TransposedSavedIdListMessage.
 * @deprecated Use TransposedSavedIdListMessage.$Properties instead.
 */
export interface ITransposedSavedIdListMessage extends TransposedSavedIdListMessage.$Properties {
}

/** Represents a TransposedSavedIdListMessage. */
export class TransposedSavedIdListMessage {

    /**
     * Constructs a new TransposedSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: TransposedSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** TransposedSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** TransposedSavedIdListMessage startCounters. */
    startCounters: number[];

    /** TransposedSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new TransposedSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns TransposedSavedIdListMessage instance
     */
    static create(properties: TransposedSavedIdListMessage.$Shape): TransposedSavedIdListMessage & TransposedSavedIdListMessage.$Shape;
    static create(properties?: TransposedSavedIdListMessage.$Properties): TransposedSavedIdListMessage;

    /**
     * Encodes the specified TransposedSavedIdListMessage message. Does not implicitly {@link TransposedSavedIdListMessage.verify|verify} messages.
     * @param message TransposedSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: TransposedSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a TransposedSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {TransposedSavedIdListMessage & TransposedSavedIdListMessage.$Shape} TransposedSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): TransposedSavedIdListMessage & TransposedSavedIdListMessage.$Shape;
}

export namespace TransposedSavedIdListMessage {

    /** Properties of a TransposedSavedIdListMessage. */
    interface $Properties {

        /** TransposedSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** TransposedSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** TransposedSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a TransposedSavedIdListMessage. */
    type $Shape = TransposedSavedIdListMessage.$Properties;
}

/**
 * Properties of a SplitTransposedSavedIdListMessage.
 * @deprecated Use SplitTransposedSavedIdListMessage.$Properties instead.
 */
export interface ISplitTransposedSavedIdListMessage extends SplitTransposedSavedIdListMessage.$Properties {
}

/** Represents a SplitTransposedSavedIdListMessage. */
export class SplitTransposedSavedIdListMessage {

    /**
     * Constructs a new SplitTransposedSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: SplitTransposedSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** SplitTransposedSavedIdListMessage clientIds. */
    clientIds: string[];

    /** SplitTransposedSavedIdListMessage seqNums. */
    seqNums: number[];

    /** SplitTransposedSavedIdListMessage startCounters. */
    startCounters: number[];

    /** SplitTransposedSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new SplitTransposedSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SplitTransposedSavedIdListMessage instance
     */
    static create(properties: SplitTransposedSavedIdListMessage.$Shape): SplitTransposedSavedIdListMessage & SplitTransposedSavedIdListMessage.$Shape;
    static create(properties?: SplitTransposedSavedIdListMessage.$Properties): SplitTransposedSavedIdListMessage;

    /**
     * Encodes the specified SplitTransposedSavedIdListMessage message. Does not implicitly {@link SplitTransposedSavedIdListMessage.verify|verify} messages.
     * @param message SplitTransposedSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: SplitTransposedSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SplitTransposedSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {SplitTransposedSavedIdListMessage & SplitTransposedSavedIdListMessage.$Shape} SplitTransposedSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SplitTransposedSavedIdListMessage & SplitTransposedSavedIdListMessage.$Shape;
}

export namespace SplitTransposedSavedIdListMessage {

    /** Properties of a SplitTransposedSavedIdListMessage. */
    interface $Properties {

        /** SplitTransposedSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** SplitTransposedSavedIdListMessage seqNums */
        seqNums?: (number[]|null);

        /** SplitTransposedSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** SplitTransposedSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a SplitTransposedSavedIdListMessage. */
    type $Shape = SplitTransposedSavedIdListMessage.$Properties;
}

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
 * Properties of a BunchIndexOmitSavedIdListMessage.
 * @deprecated Use BunchIndexOmitSavedIdListMessage.$Properties instead.
 */
export interface IBunchIndexOmitSavedIdListMessage extends BunchIndexOmitSavedIdListMessage.$Properties {
}

/** Represents a BunchIndexOmitSavedIdListMessage. */
export class BunchIndexOmitSavedIdListMessage {

    /**
     * Constructs a new BunchIndexOmitSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: BunchIndexOmitSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** BunchIndexOmitSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** BunchIndexOmitSavedIdListMessage bunchIndices. */
    bunchIndices: number[];

    /** BunchIndexOmitSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** BunchIndexOmitSavedIdListMessage startCounters. */
    startCounters: number[];

    /** BunchIndexOmitSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new BunchIndexOmitSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns BunchIndexOmitSavedIdListMessage instance
     */
    static create(properties: BunchIndexOmitSavedIdListMessage.$Shape): BunchIndexOmitSavedIdListMessage & BunchIndexOmitSavedIdListMessage.$Shape;
    static create(properties?: BunchIndexOmitSavedIdListMessage.$Properties): BunchIndexOmitSavedIdListMessage;

    /**
     * Encodes the specified BunchIndexOmitSavedIdListMessage message. Does not implicitly {@link BunchIndexOmitSavedIdListMessage.verify|verify} messages.
     * @param message BunchIndexOmitSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: BunchIndexOmitSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a BunchIndexOmitSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {BunchIndexOmitSavedIdListMessage & BunchIndexOmitSavedIdListMessage.$Shape} BunchIndexOmitSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): BunchIndexOmitSavedIdListMessage & BunchIndexOmitSavedIdListMessage.$Shape;
}

export namespace BunchIndexOmitSavedIdListMessage {

    /** Properties of a BunchIndexOmitSavedIdListMessage. */
    interface $Properties {

        /** BunchIndexOmitSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** BunchIndexOmitSavedIdListMessage bunchIndices */
        bunchIndices?: (number[]|null);

        /** BunchIndexOmitSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** BunchIndexOmitSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** BunchIndexOmitSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a BunchIndexOmitSavedIdListMessage. */
    type $Shape = BunchIndexOmitSavedIdListMessage.$Properties;
}

/**
 * Properties of a ClientIndexOmitSavedIdListMessage.
 * @deprecated Use ClientIndexOmitSavedIdListMessage.$Properties instead.
 */
export interface IClientIndexOmitSavedIdListMessage extends ClientIndexOmitSavedIdListMessage.$Properties {
}

/** Represents a ClientIndexOmitSavedIdListMessage. */
export class ClientIndexOmitSavedIdListMessage {

    /**
     * Constructs a new ClientIndexOmitSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: ClientIndexOmitSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** ClientIndexOmitSavedIdListMessage clientIds. */
    clientIds: string[];

    /** ClientIndexOmitSavedIdListMessage clientIndices. */
    clientIndices: number[];

    /** ClientIndexOmitSavedIdListMessage seqNums. */
    seqNums: number[];

    /** ClientIndexOmitSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** ClientIndexOmitSavedIdListMessage startCounters. */
    startCounters: number[];

    /** ClientIndexOmitSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new ClientIndexOmitSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns ClientIndexOmitSavedIdListMessage instance
     */
    static create(properties: ClientIndexOmitSavedIdListMessage.$Shape): ClientIndexOmitSavedIdListMessage & ClientIndexOmitSavedIdListMessage.$Shape;
    static create(properties?: ClientIndexOmitSavedIdListMessage.$Properties): ClientIndexOmitSavedIdListMessage;

    /**
     * Encodes the specified ClientIndexOmitSavedIdListMessage message. Does not implicitly {@link ClientIndexOmitSavedIdListMessage.verify|verify} messages.
     * @param message ClientIndexOmitSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: ClientIndexOmitSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a ClientIndexOmitSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {ClientIndexOmitSavedIdListMessage & ClientIndexOmitSavedIdListMessage.$Shape} ClientIndexOmitSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): ClientIndexOmitSavedIdListMessage & ClientIndexOmitSavedIdListMessage.$Shape;
}

export namespace ClientIndexOmitSavedIdListMessage {

    /** Properties of a ClientIndexOmitSavedIdListMessage. */
    interface $Properties {

        /** ClientIndexOmitSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** ClientIndexOmitSavedIdListMessage clientIndices */
        clientIndices?: (number[]|null);

        /** ClientIndexOmitSavedIdListMessage seqNums */
        seqNums?: (number[]|null);

        /** ClientIndexOmitSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** ClientIndexOmitSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** ClientIndexOmitSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a ClientIndexOmitSavedIdListMessage. */
    type $Shape = ClientIndexOmitSavedIdListMessage.$Properties;
}

/**
 * Properties of a TransposedOmitSavedIdListMessage.
 * @deprecated Use TransposedOmitSavedIdListMessage.$Properties instead.
 */
export interface ITransposedOmitSavedIdListMessage extends TransposedOmitSavedIdListMessage.$Properties {
}

/** Represents a TransposedOmitSavedIdListMessage. */
export class TransposedOmitSavedIdListMessage {

    /**
     * Constructs a new TransposedOmitSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: TransposedOmitSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** TransposedOmitSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** TransposedOmitSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** TransposedOmitSavedIdListMessage startCounters. */
    startCounters: number[];

    /** TransposedOmitSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new TransposedOmitSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns TransposedOmitSavedIdListMessage instance
     */
    static create(properties: TransposedOmitSavedIdListMessage.$Shape): TransposedOmitSavedIdListMessage & TransposedOmitSavedIdListMessage.$Shape;
    static create(properties?: TransposedOmitSavedIdListMessage.$Properties): TransposedOmitSavedIdListMessage;

    /**
     * Encodes the specified TransposedOmitSavedIdListMessage message. Does not implicitly {@link TransposedOmitSavedIdListMessage.verify|verify} messages.
     * @param message TransposedOmitSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: TransposedOmitSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a TransposedOmitSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {TransposedOmitSavedIdListMessage & TransposedOmitSavedIdListMessage.$Shape} TransposedOmitSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): TransposedOmitSavedIdListMessage & TransposedOmitSavedIdListMessage.$Shape;
}

export namespace TransposedOmitSavedIdListMessage {

    /** Properties of a TransposedOmitSavedIdListMessage. */
    interface $Properties {

        /** TransposedOmitSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** TransposedOmitSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** TransposedOmitSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** TransposedOmitSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a TransposedOmitSavedIdListMessage. */
    type $Shape = TransposedOmitSavedIdListMessage.$Properties;
}

/**
 * Properties of a SplitTransposedOmitSavedIdListMessage.
 * @deprecated Use SplitTransposedOmitSavedIdListMessage.$Properties instead.
 */
export interface ISplitTransposedOmitSavedIdListMessage extends SplitTransposedOmitSavedIdListMessage.$Properties {
}

/** Represents a SplitTransposedOmitSavedIdListMessage. */
export class SplitTransposedOmitSavedIdListMessage {

    /**
     * Constructs a new SplitTransposedOmitSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: SplitTransposedOmitSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** SplitTransposedOmitSavedIdListMessage clientIds. */
    clientIds: string[];

    /** SplitTransposedOmitSavedIdListMessage seqNums. */
    seqNums: number[];

    /** SplitTransposedOmitSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** SplitTransposedOmitSavedIdListMessage startCounters. */
    startCounters: number[];

    /** SplitTransposedOmitSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new SplitTransposedOmitSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns SplitTransposedOmitSavedIdListMessage instance
     */
    static create(properties: SplitTransposedOmitSavedIdListMessage.$Shape): SplitTransposedOmitSavedIdListMessage & SplitTransposedOmitSavedIdListMessage.$Shape;
    static create(properties?: SplitTransposedOmitSavedIdListMessage.$Properties): SplitTransposedOmitSavedIdListMessage;

    /**
     * Encodes the specified SplitTransposedOmitSavedIdListMessage message. Does not implicitly {@link SplitTransposedOmitSavedIdListMessage.verify|verify} messages.
     * @param message SplitTransposedOmitSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: SplitTransposedOmitSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a SplitTransposedOmitSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {SplitTransposedOmitSavedIdListMessage & SplitTransposedOmitSavedIdListMessage.$Shape} SplitTransposedOmitSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): SplitTransposedOmitSavedIdListMessage & SplitTransposedOmitSavedIdListMessage.$Shape;
}

export namespace SplitTransposedOmitSavedIdListMessage {

    /** Properties of a SplitTransposedOmitSavedIdListMessage. */
    interface $Properties {

        /** SplitTransposedOmitSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** SplitTransposedOmitSavedIdListMessage seqNums */
        seqNums?: (number[]|null);

        /** SplitTransposedOmitSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** SplitTransposedOmitSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** SplitTransposedOmitSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a SplitTransposedOmitSavedIdListMessage. */
    type $Shape = SplitTransposedOmitSavedIdListMessage.$Properties;
}

/**
 * Properties of a FlatSavedIdListMessage.
 * @deprecated Use FlatSavedIdListMessage.$Properties instead.
 */
export interface IFlatSavedIdListMessage extends FlatSavedIdListMessage.$Properties {
}

/** Represents a FlatSavedIdListMessage. */
export class FlatSavedIdListMessage {

    /**
     * Constructs a new FlatSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: FlatSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** FlatSavedIdListMessage bunchIds. */
    bunchIds: string[];

    /** FlatSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** FlatSavedIdListMessage startCounters. */
    startCounters: number[];

    /** FlatSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new FlatSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns FlatSavedIdListMessage instance
     */
    static create(properties: FlatSavedIdListMessage.$Shape): FlatSavedIdListMessage & FlatSavedIdListMessage.$Shape;
    static create(properties?: FlatSavedIdListMessage.$Properties): FlatSavedIdListMessage;

    /**
     * Encodes the specified FlatSavedIdListMessage message. Does not implicitly {@link FlatSavedIdListMessage.verify|verify} messages.
     * @param message FlatSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: FlatSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a FlatSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {FlatSavedIdListMessage & FlatSavedIdListMessage.$Shape} FlatSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): FlatSavedIdListMessage & FlatSavedIdListMessage.$Shape;
}

export namespace FlatSavedIdListMessage {

    /** Properties of a FlatSavedIdListMessage. */
    interface $Properties {

        /** FlatSavedIdListMessage bunchIds */
        bunchIds?: (string[]|null);

        /** FlatSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** FlatSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** FlatSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a FlatSavedIdListMessage. */
    type $Shape = FlatSavedIdListMessage.$Properties;
}

/**
 * Properties of a CompactIdSavedIdListMessage.
 * @deprecated Use CompactIdSavedIdListMessage.$Properties instead.
 */
export interface ICompactIdSavedIdListMessage extends CompactIdSavedIdListMessage.$Properties {
}

/** Represents a CompactIdSavedIdListMessage. */
export class CompactIdSavedIdListMessage {

    /**
     * Constructs a new CompactIdSavedIdListMessage.
     * @param [properties] Properties to set
     */
    constructor(properties?: CompactIdSavedIdListMessage.$Properties);

    /** Unknown fields preserved while decoding when enabled */
    $unknowns?: Uint8Array[];

    /** CompactIdSavedIdListMessage clientIds. */
    clientIds: string[];

    /** CompactIdSavedIdListMessage clientIndexes. */
    clientIndexes: number[];

    /** CompactIdSavedIdListMessage counterChanges. */
    counterChanges: number[];

    /** CompactIdSavedIdListMessage rawBunchIds. */
    rawBunchIds: string[];

    /** CompactIdSavedIdListMessage startCounterIndexes. */
    startCounterIndexes: number[];

    /** CompactIdSavedIdListMessage startCounters. */
    startCounters: number[];

    /** CompactIdSavedIdListMessage counts. */
    counts: number[];

    /**
     * Creates a new CompactIdSavedIdListMessage instance using the specified properties.
     * @param [properties] Properties to set
     * @returns CompactIdSavedIdListMessage instance
     */
    static create(properties: CompactIdSavedIdListMessage.$Shape): CompactIdSavedIdListMessage & CompactIdSavedIdListMessage.$Shape;
    static create(properties?: CompactIdSavedIdListMessage.$Properties): CompactIdSavedIdListMessage;

    /**
     * Encodes the specified CompactIdSavedIdListMessage message. Does not implicitly {@link CompactIdSavedIdListMessage.verify|verify} messages.
     * @param message CompactIdSavedIdListMessage message or plain object to encode
     * @param [writer] Writer to encode to
     * @returns Writer
     */
    static encode(message: CompactIdSavedIdListMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

    /**
     * Decodes a CompactIdSavedIdListMessage message from the specified reader or buffer.
     * @param reader Reader or buffer to decode from
     * @param [length] Message length if known beforehand
     * @returns {CompactIdSavedIdListMessage & CompactIdSavedIdListMessage.$Shape} CompactIdSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): CompactIdSavedIdListMessage & CompactIdSavedIdListMessage.$Shape;
}

export namespace CompactIdSavedIdListMessage {

    /** Properties of a CompactIdSavedIdListMessage. */
    interface $Properties {

        /** CompactIdSavedIdListMessage clientIds */
        clientIds?: (string[]|null);

        /** CompactIdSavedIdListMessage clientIndexes */
        clientIndexes?: (number[]|null);

        /** CompactIdSavedIdListMessage counterChanges */
        counterChanges?: (number[]|null);

        /** CompactIdSavedIdListMessage rawBunchIds */
        rawBunchIds?: (string[]|null);

        /** CompactIdSavedIdListMessage startCounterIndexes */
        startCounterIndexes?: (number[]|null);

        /** CompactIdSavedIdListMessage startCounters */
        startCounters?: (number[]|null);

        /** CompactIdSavedIdListMessage counts */
        counts?: (number[]|null);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];
    }

    /** Shape of a CompactIdSavedIdListMessage. */
    type $Shape = CompactIdSavedIdListMessage.$Properties;
}
