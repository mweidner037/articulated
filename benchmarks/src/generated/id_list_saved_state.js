/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $RangeError = $util.global.RangeError;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const BunchIndexSavedIdListMessage = $root.BunchIndexSavedIdListMessage = (() => {

    /**
     * Properties of a BunchIndexSavedIdListMessage.
     * @typedef {Object} BunchIndexSavedIdListMessage.$Properties
     * @property {Array.<string>|null} [bunchIds] BunchIndexSavedIdListMessage bunchIds
     * @property {Array.<number>|null} [bunchIndices] BunchIndexSavedIdListMessage bunchIndices
     * @property {Array.<number>|null} [startCounters] BunchIndexSavedIdListMessage startCounters
     * @property {Array.<number>|null} [counts] BunchIndexSavedIdListMessage counts
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a BunchIndexSavedIdListMessage.
     * @exports IBunchIndexSavedIdListMessage
     * @interface IBunchIndexSavedIdListMessage
     * @augments BunchIndexSavedIdListMessage.$Properties
     * @deprecated Use BunchIndexSavedIdListMessage.$Properties instead.
     */

    /**
     * Shape of a BunchIndexSavedIdListMessage.
     * @typedef {BunchIndexSavedIdListMessage.$Properties} BunchIndexSavedIdListMessage.$Shape
     */

    /**
     * Constructs a new BunchIndexSavedIdListMessage.
     * @exports BunchIndexSavedIdListMessage
     * @classdesc Represents a BunchIndexSavedIdListMessage.
     * @constructor
     * @param {BunchIndexSavedIdListMessage.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const BunchIndexSavedIdListMessage = function (properties) {
        this.bunchIds = [];
        this.bunchIndices = [];
        this.startCounters = [];
        this.counts = [];
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * BunchIndexSavedIdListMessage bunchIds.
     * @member {Array.<string>} bunchIds
     * @memberof BunchIndexSavedIdListMessage
     * @instance
     */
    BunchIndexSavedIdListMessage.prototype.bunchIds = $util.emptyArray;

    /**
     * BunchIndexSavedIdListMessage bunchIndices.
     * @member {Array.<number>} bunchIndices
     * @memberof BunchIndexSavedIdListMessage
     * @instance
     */
    BunchIndexSavedIdListMessage.prototype.bunchIndices = $util.emptyArray;

    /**
     * BunchIndexSavedIdListMessage startCounters.
     * @member {Array.<number>} startCounters
     * @memberof BunchIndexSavedIdListMessage
     * @instance
     */
    BunchIndexSavedIdListMessage.prototype.startCounters = $util.emptyArray;

    /**
     * BunchIndexSavedIdListMessage counts.
     * @member {Array.<number>} counts
     * @memberof BunchIndexSavedIdListMessage
     * @instance
     */
    BunchIndexSavedIdListMessage.prototype.counts = $util.emptyArray;

    /**
     * Creates a new BunchIndexSavedIdListMessage instance using the specified properties.
     * @function create
     * @memberof BunchIndexSavedIdListMessage
     * @static
     * @param {BunchIndexSavedIdListMessage.$Properties=} [properties] Properties to set
     * @returns {BunchIndexSavedIdListMessage} BunchIndexSavedIdListMessage instance
     * @type {{
     *   (properties: BunchIndexSavedIdListMessage.$Shape): BunchIndexSavedIdListMessage & BunchIndexSavedIdListMessage.$Shape;
     *   (properties?: BunchIndexSavedIdListMessage.$Properties): BunchIndexSavedIdListMessage;
     * }}
     */
    BunchIndexSavedIdListMessage.create = function(properties) {
        return new BunchIndexSavedIdListMessage(properties);
    };

    /**
     * Encodes the specified BunchIndexSavedIdListMessage message. Does not implicitly {@link BunchIndexSavedIdListMessage.verify|verify} messages.
     * @function encode
     * @memberof BunchIndexSavedIdListMessage
     * @static
     * @param {BunchIndexSavedIdListMessage.$Properties} message BunchIndexSavedIdListMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    BunchIndexSavedIdListMessage.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.bunchIds != null && message.bunchIds.length)
            for (let i = 0; i < message.bunchIds.length; ++i)
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.bunchIds[i]);
        if (message.bunchIndices != null && message.bunchIndices.length)
            writer.uint32(/* id 2, wireType 2 =*/18).uint32s(message.bunchIndices);
        if (message.startCounters != null && message.startCounters.length)
            writer.uint32(/* id 3, wireType 2 =*/26).uint32s(message.startCounters);
        if (message.counts != null && message.counts.length)
            writer.uint32(/* id 4, wireType 2 =*/34).sint32s(message.counts);
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a BunchIndexSavedIdListMessage message from the specified reader or buffer.
     * @function decode
     * @memberof BunchIndexSavedIdListMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {BunchIndexSavedIdListMessage & BunchIndexSavedIdListMessage.$Shape} BunchIndexSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    BunchIndexSavedIdListMessage.decode = function (reader, length, _end, _depth, _target) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
        let end, message;
        if (length === $undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw $RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = _target || new $root.BunchIndexSavedIdListMessage();
        while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
                _end = $undefined;
                break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
            case 1: {
                    if (wireType !== 2)
                        break;
                    if (!(message.bunchIds && message.bunchIds.length))
                        message.bunchIds = [];
                    message.bunchIds.push(reader.stringVerify());
                    continue;
                }
            case 2: {
                    if (wireType === 2) {
                        if (!(message.bunchIndices && message.bunchIndices.length))
                            message.bunchIndices = [];
                        reader.uint32s(message.bunchIndices);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.bunchIndices && message.bunchIndices.length))
                        message.bunchIndices = [];
                    message.bunchIndices.push(reader.uint32());
                    continue;
                }
            case 3: {
                    if (wireType === 2) {
                        if (!(message.startCounters && message.startCounters.length))
                            message.startCounters = [];
                        reader.uint32s(message.startCounters);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.startCounters && message.startCounters.length))
                        message.startCounters = [];
                    message.startCounters.push(reader.uint32());
                    continue;
                }
            case 4: {
                    if (wireType === 2) {
                        if (!(message.counts && message.counts.length))
                            message.counts = [];
                        reader.sint32s(message.counts);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.counts && message.counts.length))
                        message.counts = [];
                    message.counts.push(reader.sint32());
                    continue;
                }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
                $util.makeProp(message, "$unknowns", false);
                (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
        }
        if (length !== $undefined) {
            if (reader.pos !== end)
                throw $RangeError("index out of range");
            reader.len = length;
        }
        if (_end !== $undefined)
            throw $Error("missing end group");
        return message;
    };

    return BunchIndexSavedIdListMessage;
})();

export const ClientIndexSavedIdListMessage = $root.ClientIndexSavedIdListMessage = (() => {

    /**
     * Properties of a ClientIndexSavedIdListMessage.
     * @typedef {Object} ClientIndexSavedIdListMessage.$Properties
     * @property {Array.<string>|null} [clientIds] ClientIndexSavedIdListMessage clientIds
     * @property {Array.<number>|null} [clientIndices] ClientIndexSavedIdListMessage clientIndices
     * @property {Array.<number>|null} [seqNums] ClientIndexSavedIdListMessage seqNums
     * @property {Array.<number>|null} [startCounters] ClientIndexSavedIdListMessage startCounters
     * @property {Array.<number>|null} [counts] ClientIndexSavedIdListMessage counts
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a ClientIndexSavedIdListMessage.
     * @exports IClientIndexSavedIdListMessage
     * @interface IClientIndexSavedIdListMessage
     * @augments ClientIndexSavedIdListMessage.$Properties
     * @deprecated Use ClientIndexSavedIdListMessage.$Properties instead.
     */

    /**
     * Shape of a ClientIndexSavedIdListMessage.
     * @typedef {ClientIndexSavedIdListMessage.$Properties} ClientIndexSavedIdListMessage.$Shape
     */

    /**
     * Constructs a new ClientIndexSavedIdListMessage.
     * @exports ClientIndexSavedIdListMessage
     * @classdesc Represents a ClientIndexSavedIdListMessage.
     * @constructor
     * @param {ClientIndexSavedIdListMessage.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const ClientIndexSavedIdListMessage = function (properties) {
        this.clientIds = [];
        this.clientIndices = [];
        this.seqNums = [];
        this.startCounters = [];
        this.counts = [];
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * ClientIndexSavedIdListMessage clientIds.
     * @member {Array.<string>} clientIds
     * @memberof ClientIndexSavedIdListMessage
     * @instance
     */
    ClientIndexSavedIdListMessage.prototype.clientIds = $util.emptyArray;

    /**
     * ClientIndexSavedIdListMessage clientIndices.
     * @member {Array.<number>} clientIndices
     * @memberof ClientIndexSavedIdListMessage
     * @instance
     */
    ClientIndexSavedIdListMessage.prototype.clientIndices = $util.emptyArray;

    /**
     * ClientIndexSavedIdListMessage seqNums.
     * @member {Array.<number>} seqNums
     * @memberof ClientIndexSavedIdListMessage
     * @instance
     */
    ClientIndexSavedIdListMessage.prototype.seqNums = $util.emptyArray;

    /**
     * ClientIndexSavedIdListMessage startCounters.
     * @member {Array.<number>} startCounters
     * @memberof ClientIndexSavedIdListMessage
     * @instance
     */
    ClientIndexSavedIdListMessage.prototype.startCounters = $util.emptyArray;

    /**
     * ClientIndexSavedIdListMessage counts.
     * @member {Array.<number>} counts
     * @memberof ClientIndexSavedIdListMessage
     * @instance
     */
    ClientIndexSavedIdListMessage.prototype.counts = $util.emptyArray;

    /**
     * Creates a new ClientIndexSavedIdListMessage instance using the specified properties.
     * @function create
     * @memberof ClientIndexSavedIdListMessage
     * @static
     * @param {ClientIndexSavedIdListMessage.$Properties=} [properties] Properties to set
     * @returns {ClientIndexSavedIdListMessage} ClientIndexSavedIdListMessage instance
     * @type {{
     *   (properties: ClientIndexSavedIdListMessage.$Shape): ClientIndexSavedIdListMessage & ClientIndexSavedIdListMessage.$Shape;
     *   (properties?: ClientIndexSavedIdListMessage.$Properties): ClientIndexSavedIdListMessage;
     * }}
     */
    ClientIndexSavedIdListMessage.create = function(properties) {
        return new ClientIndexSavedIdListMessage(properties);
    };

    /**
     * Encodes the specified ClientIndexSavedIdListMessage message. Does not implicitly {@link ClientIndexSavedIdListMessage.verify|verify} messages.
     * @function encode
     * @memberof ClientIndexSavedIdListMessage
     * @static
     * @param {ClientIndexSavedIdListMessage.$Properties} message ClientIndexSavedIdListMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    ClientIndexSavedIdListMessage.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.clientIds != null && message.clientIds.length)
            for (let i = 0; i < message.clientIds.length; ++i)
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.clientIds[i]);
        if (message.clientIndices != null && message.clientIndices.length)
            writer.uint32(/* id 2, wireType 2 =*/18).uint32s(message.clientIndices);
        if (message.seqNums != null && message.seqNums.length)
            writer.uint32(/* id 3, wireType 2 =*/26).uint32s(message.seqNums);
        if (message.startCounters != null && message.startCounters.length)
            writer.uint32(/* id 4, wireType 2 =*/34).uint32s(message.startCounters);
        if (message.counts != null && message.counts.length)
            writer.uint32(/* id 5, wireType 2 =*/42).sint32s(message.counts);
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a ClientIndexSavedIdListMessage message from the specified reader or buffer.
     * @function decode
     * @memberof ClientIndexSavedIdListMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {ClientIndexSavedIdListMessage & ClientIndexSavedIdListMessage.$Shape} ClientIndexSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    ClientIndexSavedIdListMessage.decode = function (reader, length, _end, _depth, _target) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
        let end, message;
        if (length === $undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw $RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = _target || new $root.ClientIndexSavedIdListMessage();
        while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
                _end = $undefined;
                break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
            case 1: {
                    if (wireType !== 2)
                        break;
                    if (!(message.clientIds && message.clientIds.length))
                        message.clientIds = [];
                    message.clientIds.push(reader.stringVerify());
                    continue;
                }
            case 2: {
                    if (wireType === 2) {
                        if (!(message.clientIndices && message.clientIndices.length))
                            message.clientIndices = [];
                        reader.uint32s(message.clientIndices);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.clientIndices && message.clientIndices.length))
                        message.clientIndices = [];
                    message.clientIndices.push(reader.uint32());
                    continue;
                }
            case 3: {
                    if (wireType === 2) {
                        if (!(message.seqNums && message.seqNums.length))
                            message.seqNums = [];
                        reader.uint32s(message.seqNums);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.seqNums && message.seqNums.length))
                        message.seqNums = [];
                    message.seqNums.push(reader.uint32());
                    continue;
                }
            case 4: {
                    if (wireType === 2) {
                        if (!(message.startCounters && message.startCounters.length))
                            message.startCounters = [];
                        reader.uint32s(message.startCounters);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.startCounters && message.startCounters.length))
                        message.startCounters = [];
                    message.startCounters.push(reader.uint32());
                    continue;
                }
            case 5: {
                    if (wireType === 2) {
                        if (!(message.counts && message.counts.length))
                            message.counts = [];
                        reader.sint32s(message.counts);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.counts && message.counts.length))
                        message.counts = [];
                    message.counts.push(reader.sint32());
                    continue;
                }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
                $util.makeProp(message, "$unknowns", false);
                (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
        }
        if (length !== $undefined) {
            if (reader.pos !== end)
                throw $RangeError("index out of range");
            reader.len = length;
        }
        if (_end !== $undefined)
            throw $Error("missing end group");
        return message;
    };

    return ClientIndexSavedIdListMessage;
})();

export const GroupedSavedIdListMessage = $root.GroupedSavedIdListMessage = (() => {

    /**
     * Properties of a GroupedSavedIdListMessage.
     * @typedef {Object} GroupedSavedIdListMessage.$Properties
     * @property {Array.<string>|null} [bunchIds] GroupedSavedIdListMessage bunchIds
     * @property {Array.<number>|null} [groupSizes] GroupedSavedIdListMessage groupSizes
     * @property {Array.<number>|null} [startCounters] GroupedSavedIdListMessage startCounters
     * @property {Array.<number>|null} [counts] GroupedSavedIdListMessage counts
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a GroupedSavedIdListMessage.
     * @exports IGroupedSavedIdListMessage
     * @interface IGroupedSavedIdListMessage
     * @augments GroupedSavedIdListMessage.$Properties
     * @deprecated Use GroupedSavedIdListMessage.$Properties instead.
     */

    /**
     * Shape of a GroupedSavedIdListMessage.
     * @typedef {GroupedSavedIdListMessage.$Properties} GroupedSavedIdListMessage.$Shape
     */

    /**
     * Constructs a new GroupedSavedIdListMessage.
     * @exports GroupedSavedIdListMessage
     * @classdesc Represents a GroupedSavedIdListMessage.
     * @constructor
     * @param {GroupedSavedIdListMessage.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const GroupedSavedIdListMessage = function (properties) {
        this.bunchIds = [];
        this.groupSizes = [];
        this.startCounters = [];
        this.counts = [];
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * GroupedSavedIdListMessage bunchIds.
     * @member {Array.<string>} bunchIds
     * @memberof GroupedSavedIdListMessage
     * @instance
     */
    GroupedSavedIdListMessage.prototype.bunchIds = $util.emptyArray;

    /**
     * GroupedSavedIdListMessage groupSizes.
     * @member {Array.<number>} groupSizes
     * @memberof GroupedSavedIdListMessage
     * @instance
     */
    GroupedSavedIdListMessage.prototype.groupSizes = $util.emptyArray;

    /**
     * GroupedSavedIdListMessage startCounters.
     * @member {Array.<number>} startCounters
     * @memberof GroupedSavedIdListMessage
     * @instance
     */
    GroupedSavedIdListMessage.prototype.startCounters = $util.emptyArray;

    /**
     * GroupedSavedIdListMessage counts.
     * @member {Array.<number>} counts
     * @memberof GroupedSavedIdListMessage
     * @instance
     */
    GroupedSavedIdListMessage.prototype.counts = $util.emptyArray;

    /**
     * Creates a new GroupedSavedIdListMessage instance using the specified properties.
     * @function create
     * @memberof GroupedSavedIdListMessage
     * @static
     * @param {GroupedSavedIdListMessage.$Properties=} [properties] Properties to set
     * @returns {GroupedSavedIdListMessage} GroupedSavedIdListMessage instance
     * @type {{
     *   (properties: GroupedSavedIdListMessage.$Shape): GroupedSavedIdListMessage & GroupedSavedIdListMessage.$Shape;
     *   (properties?: GroupedSavedIdListMessage.$Properties): GroupedSavedIdListMessage;
     * }}
     */
    GroupedSavedIdListMessage.create = function(properties) {
        return new GroupedSavedIdListMessage(properties);
    };

    /**
     * Encodes the specified GroupedSavedIdListMessage message. Does not implicitly {@link GroupedSavedIdListMessage.verify|verify} messages.
     * @function encode
     * @memberof GroupedSavedIdListMessage
     * @static
     * @param {GroupedSavedIdListMessage.$Properties} message GroupedSavedIdListMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    GroupedSavedIdListMessage.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.bunchIds != null && message.bunchIds.length)
            for (let i = 0; i < message.bunchIds.length; ++i)
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.bunchIds[i]);
        if (message.groupSizes != null && message.groupSizes.length)
            writer.uint32(/* id 2, wireType 2 =*/18).uint32s(message.groupSizes);
        if (message.startCounters != null && message.startCounters.length)
            writer.uint32(/* id 3, wireType 2 =*/26).uint32s(message.startCounters);
        if (message.counts != null && message.counts.length)
            writer.uint32(/* id 4, wireType 2 =*/34).sint32s(message.counts);
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a GroupedSavedIdListMessage message from the specified reader or buffer.
     * @function decode
     * @memberof GroupedSavedIdListMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {GroupedSavedIdListMessage & GroupedSavedIdListMessage.$Shape} GroupedSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    GroupedSavedIdListMessage.decode = function (reader, length, _end, _depth, _target) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
        let end, message;
        if (length === $undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw $RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = _target || new $root.GroupedSavedIdListMessage();
        while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
                _end = $undefined;
                break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
            case 1: {
                    if (wireType !== 2)
                        break;
                    if (!(message.bunchIds && message.bunchIds.length))
                        message.bunchIds = [];
                    message.bunchIds.push(reader.stringVerify());
                    continue;
                }
            case 2: {
                    if (wireType === 2) {
                        if (!(message.groupSizes && message.groupSizes.length))
                            message.groupSizes = [];
                        reader.uint32s(message.groupSizes);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.groupSizes && message.groupSizes.length))
                        message.groupSizes = [];
                    message.groupSizes.push(reader.uint32());
                    continue;
                }
            case 3: {
                    if (wireType === 2) {
                        if (!(message.startCounters && message.startCounters.length))
                            message.startCounters = [];
                        reader.uint32s(message.startCounters);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.startCounters && message.startCounters.length))
                        message.startCounters = [];
                    message.startCounters.push(reader.uint32());
                    continue;
                }
            case 4: {
                    if (wireType === 2) {
                        if (!(message.counts && message.counts.length))
                            message.counts = [];
                        reader.sint32s(message.counts);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.counts && message.counts.length))
                        message.counts = [];
                    message.counts.push(reader.sint32());
                    continue;
                }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
                $util.makeProp(message, "$unknowns", false);
                (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
        }
        if (length !== $undefined) {
            if (reader.pos !== end)
                throw $RangeError("index out of range");
            reader.len = length;
        }
        if (_end !== $undefined)
            throw $Error("missing end group");
        return message;
    };

    return GroupedSavedIdListMessage;
})();

export const SplitGroupedSavedIdListMessage = $root.SplitGroupedSavedIdListMessage = (() => {

    /**
     * Properties of a SplitGroupedSavedIdListMessage.
     * @typedef {Object} SplitGroupedSavedIdListMessage.$Properties
     * @property {Array.<string>|null} [clientIds] SplitGroupedSavedIdListMessage clientIds
     * @property {Array.<number>|null} [seqNums] SplitGroupedSavedIdListMessage seqNums
     * @property {Array.<number>|null} [groupSizes] SplitGroupedSavedIdListMessage groupSizes
     * @property {Array.<number>|null} [startCounters] SplitGroupedSavedIdListMessage startCounters
     * @property {Array.<number>|null} [counts] SplitGroupedSavedIdListMessage counts
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a SplitGroupedSavedIdListMessage.
     * @exports ISplitGroupedSavedIdListMessage
     * @interface ISplitGroupedSavedIdListMessage
     * @augments SplitGroupedSavedIdListMessage.$Properties
     * @deprecated Use SplitGroupedSavedIdListMessage.$Properties instead.
     */

    /**
     * Shape of a SplitGroupedSavedIdListMessage.
     * @typedef {SplitGroupedSavedIdListMessage.$Properties} SplitGroupedSavedIdListMessage.$Shape
     */

    /**
     * Constructs a new SplitGroupedSavedIdListMessage.
     * @exports SplitGroupedSavedIdListMessage
     * @classdesc Represents a SplitGroupedSavedIdListMessage.
     * @constructor
     * @param {SplitGroupedSavedIdListMessage.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const SplitGroupedSavedIdListMessage = function (properties) {
        this.clientIds = [];
        this.seqNums = [];
        this.groupSizes = [];
        this.startCounters = [];
        this.counts = [];
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * SplitGroupedSavedIdListMessage clientIds.
     * @member {Array.<string>} clientIds
     * @memberof SplitGroupedSavedIdListMessage
     * @instance
     */
    SplitGroupedSavedIdListMessage.prototype.clientIds = $util.emptyArray;

    /**
     * SplitGroupedSavedIdListMessage seqNums.
     * @member {Array.<number>} seqNums
     * @memberof SplitGroupedSavedIdListMessage
     * @instance
     */
    SplitGroupedSavedIdListMessage.prototype.seqNums = $util.emptyArray;

    /**
     * SplitGroupedSavedIdListMessage groupSizes.
     * @member {Array.<number>} groupSizes
     * @memberof SplitGroupedSavedIdListMessage
     * @instance
     */
    SplitGroupedSavedIdListMessage.prototype.groupSizes = $util.emptyArray;

    /**
     * SplitGroupedSavedIdListMessage startCounters.
     * @member {Array.<number>} startCounters
     * @memberof SplitGroupedSavedIdListMessage
     * @instance
     */
    SplitGroupedSavedIdListMessage.prototype.startCounters = $util.emptyArray;

    /**
     * SplitGroupedSavedIdListMessage counts.
     * @member {Array.<number>} counts
     * @memberof SplitGroupedSavedIdListMessage
     * @instance
     */
    SplitGroupedSavedIdListMessage.prototype.counts = $util.emptyArray;

    /**
     * Creates a new SplitGroupedSavedIdListMessage instance using the specified properties.
     * @function create
     * @memberof SplitGroupedSavedIdListMessage
     * @static
     * @param {SplitGroupedSavedIdListMessage.$Properties=} [properties] Properties to set
     * @returns {SplitGroupedSavedIdListMessage} SplitGroupedSavedIdListMessage instance
     * @type {{
     *   (properties: SplitGroupedSavedIdListMessage.$Shape): SplitGroupedSavedIdListMessage & SplitGroupedSavedIdListMessage.$Shape;
     *   (properties?: SplitGroupedSavedIdListMessage.$Properties): SplitGroupedSavedIdListMessage;
     * }}
     */
    SplitGroupedSavedIdListMessage.create = function(properties) {
        return new SplitGroupedSavedIdListMessage(properties);
    };

    /**
     * Encodes the specified SplitGroupedSavedIdListMessage message. Does not implicitly {@link SplitGroupedSavedIdListMessage.verify|verify} messages.
     * @function encode
     * @memberof SplitGroupedSavedIdListMessage
     * @static
     * @param {SplitGroupedSavedIdListMessage.$Properties} message SplitGroupedSavedIdListMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SplitGroupedSavedIdListMessage.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.clientIds != null && message.clientIds.length)
            for (let i = 0; i < message.clientIds.length; ++i)
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.clientIds[i]);
        if (message.seqNums != null && message.seqNums.length)
            writer.uint32(/* id 2, wireType 2 =*/18).uint32s(message.seqNums);
        if (message.groupSizes != null && message.groupSizes.length)
            writer.uint32(/* id 3, wireType 2 =*/26).uint32s(message.groupSizes);
        if (message.startCounters != null && message.startCounters.length)
            writer.uint32(/* id 4, wireType 2 =*/34).uint32s(message.startCounters);
        if (message.counts != null && message.counts.length)
            writer.uint32(/* id 5, wireType 2 =*/42).sint32s(message.counts);
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a SplitGroupedSavedIdListMessage message from the specified reader or buffer.
     * @function decode
     * @memberof SplitGroupedSavedIdListMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SplitGroupedSavedIdListMessage & SplitGroupedSavedIdListMessage.$Shape} SplitGroupedSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SplitGroupedSavedIdListMessage.decode = function (reader, length, _end, _depth, _target) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
        let end, message;
        if (length === $undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw $RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = _target || new $root.SplitGroupedSavedIdListMessage();
        while (reader.pos < end) {
            let start = reader.pos;
            let tag = reader.tag();
            if (tag === _end) {
                _end = $undefined;
                break;
            }
            let wireType = tag & 7;
            switch (tag >>>= 3) {
            case 1: {
                    if (wireType !== 2)
                        break;
                    if (!(message.clientIds && message.clientIds.length))
                        message.clientIds = [];
                    message.clientIds.push(reader.stringVerify());
                    continue;
                }
            case 2: {
                    if (wireType === 2) {
                        if (!(message.seqNums && message.seqNums.length))
                            message.seqNums = [];
                        reader.uint32s(message.seqNums);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.seqNums && message.seqNums.length))
                        message.seqNums = [];
                    message.seqNums.push(reader.uint32());
                    continue;
                }
            case 3: {
                    if (wireType === 2) {
                        if (!(message.groupSizes && message.groupSizes.length))
                            message.groupSizes = [];
                        reader.uint32s(message.groupSizes);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.groupSizes && message.groupSizes.length))
                        message.groupSizes = [];
                    message.groupSizes.push(reader.uint32());
                    continue;
                }
            case 4: {
                    if (wireType === 2) {
                        if (!(message.startCounters && message.startCounters.length))
                            message.startCounters = [];
                        reader.uint32s(message.startCounters);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.startCounters && message.startCounters.length))
                        message.startCounters = [];
                    message.startCounters.push(reader.uint32());
                    continue;
                }
            case 5: {
                    if (wireType === 2) {
                        if (!(message.counts && message.counts.length))
                            message.counts = [];
                        reader.sint32s(message.counts);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.counts && message.counts.length))
                        message.counts = [];
                    message.counts.push(reader.sint32());
                    continue;
                }
            }
            reader.skipType(wireType, _depth, tag);
            if (!reader.discardUnknown) {
                $util.makeProp(message, "$unknowns", false);
                (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
            }
        }
        if (length !== $undefined) {
            if (reader.pos !== end)
                throw $RangeError("index out of range");
            reader.len = length;
        }
        if (_end !== $undefined)
            throw $Error("missing end group");
        return message;
    };

    return SplitGroupedSavedIdListMessage;
})();

export {
  $root as default
};
