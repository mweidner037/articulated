/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $RangeError = $util.global.RangeError;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const SplitSavedIdListMessage = $root.SplitSavedIdListMessage = (() => {

    /**
     * Properties of a SplitSavedIdListMessage.
     * @typedef {Object} SplitSavedIdListMessage.$Properties
     * @property {Array.<SplitSavedIdListEntry.$Properties>|null} [entries] SplitSavedIdListMessage entries
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a SplitSavedIdListMessage.
     * @exports ISplitSavedIdListMessage
     * @interface ISplitSavedIdListMessage
     * @augments SplitSavedIdListMessage.$Properties
     * @deprecated Use SplitSavedIdListMessage.$Properties instead.
     */

    /**
     * Shape of a SplitSavedIdListMessage.
     * @typedef {SplitSavedIdListMessage.$Properties} SplitSavedIdListMessage.$Shape
     */

    /**
     * Constructs a new SplitSavedIdListMessage.
     * @exports SplitSavedIdListMessage
     * @classdesc Represents a SplitSavedIdListMessage.
     * @constructor
     * @param {SplitSavedIdListMessage.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const SplitSavedIdListMessage = function (properties) {
        this.entries = [];
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * SplitSavedIdListMessage entries.
     * @member {Array.<SplitSavedIdListEntry.$Properties>} entries
     * @memberof SplitSavedIdListMessage
     * @instance
     */
    SplitSavedIdListMessage.prototype.entries = $util.emptyArray;

    /**
     * Creates a new SplitSavedIdListMessage instance using the specified properties.
     * @function create
     * @memberof SplitSavedIdListMessage
     * @static
     * @param {SplitSavedIdListMessage.$Properties=} [properties] Properties to set
     * @returns {SplitSavedIdListMessage} SplitSavedIdListMessage instance
     * @type {{
     *   (properties: SplitSavedIdListMessage.$Shape): SplitSavedIdListMessage & SplitSavedIdListMessage.$Shape;
     *   (properties?: SplitSavedIdListMessage.$Properties): SplitSavedIdListMessage;
     * }}
     */
    SplitSavedIdListMessage.create = function(properties) {
        return new SplitSavedIdListMessage(properties);
    };

    /**
     * Encodes the specified SplitSavedIdListMessage message. Does not implicitly {@link SplitSavedIdListMessage.verify|verify} messages.
     * @function encode
     * @memberof SplitSavedIdListMessage
     * @static
     * @param {SplitSavedIdListMessage.$Properties} message SplitSavedIdListMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SplitSavedIdListMessage.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.entries != null && message.entries.length)
            for (let i = 0; i < message.entries.length; ++i)
                $root.SplitSavedIdListEntry.encode(message.entries[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a SplitSavedIdListMessage message from the specified reader or buffer.
     * @function decode
     * @memberof SplitSavedIdListMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SplitSavedIdListMessage & SplitSavedIdListMessage.$Shape} SplitSavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SplitSavedIdListMessage.decode = function (reader, length, _end, _depth, _target) {
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
        message = _target || new $root.SplitSavedIdListMessage();
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
                    if (!(message.entries && message.entries.length))
                        message.entries = [];
                    message.entries.push($root.SplitSavedIdListEntry.decode(reader, reader.size(), $undefined, _depth + 1));
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

    return SplitSavedIdListMessage;
})();

export const SplitSavedIdListEntry = $root.SplitSavedIdListEntry = (() => {

    /**
     * Properties of a SplitSavedIdListEntry.
     * @typedef {Object} SplitSavedIdListEntry.$Properties
     * @property {string|null} [clientId] SplitSavedIdListEntry clientId
     * @property {number|null} [seqNum] SplitSavedIdListEntry seqNum
     * @property {number|null} [startCounter] SplitSavedIdListEntry startCounter
     * @property {number|null} [count] SplitSavedIdListEntry count
     * @property {boolean|null} [isDeleted] SplitSavedIdListEntry isDeleted
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a SplitSavedIdListEntry.
     * @exports ISplitSavedIdListEntry
     * @interface ISplitSavedIdListEntry
     * @augments SplitSavedIdListEntry.$Properties
     * @deprecated Use SplitSavedIdListEntry.$Properties instead.
     */

    /**
     * Shape of a SplitSavedIdListEntry.
     * @typedef {SplitSavedIdListEntry.$Properties} SplitSavedIdListEntry.$Shape
     */

    /**
     * Constructs a new SplitSavedIdListEntry.
     * @exports SplitSavedIdListEntry
     * @classdesc Represents a SplitSavedIdListEntry.
     * @constructor
     * @param {SplitSavedIdListEntry.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const SplitSavedIdListEntry = function (properties) {
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * SplitSavedIdListEntry clientId.
     * @member {string} clientId
     * @memberof SplitSavedIdListEntry
     * @instance
     */
    SplitSavedIdListEntry.prototype.clientId = "";

    /**
     * SplitSavedIdListEntry seqNum.
     * @member {number} seqNum
     * @memberof SplitSavedIdListEntry
     * @instance
     */
    SplitSavedIdListEntry.prototype.seqNum = 0;

    /**
     * SplitSavedIdListEntry startCounter.
     * @member {number} startCounter
     * @memberof SplitSavedIdListEntry
     * @instance
     */
    SplitSavedIdListEntry.prototype.startCounter = 0;

    /**
     * SplitSavedIdListEntry count.
     * @member {number} count
     * @memberof SplitSavedIdListEntry
     * @instance
     */
    SplitSavedIdListEntry.prototype.count = 0;

    /**
     * SplitSavedIdListEntry isDeleted.
     * @member {boolean} isDeleted
     * @memberof SplitSavedIdListEntry
     * @instance
     */
    SplitSavedIdListEntry.prototype.isDeleted = false;

    /**
     * Creates a new SplitSavedIdListEntry instance using the specified properties.
     * @function create
     * @memberof SplitSavedIdListEntry
     * @static
     * @param {SplitSavedIdListEntry.$Properties=} [properties] Properties to set
     * @returns {SplitSavedIdListEntry} SplitSavedIdListEntry instance
     * @type {{
     *   (properties: SplitSavedIdListEntry.$Shape): SplitSavedIdListEntry & SplitSavedIdListEntry.$Shape;
     *   (properties?: SplitSavedIdListEntry.$Properties): SplitSavedIdListEntry;
     * }}
     */
    SplitSavedIdListEntry.create = function(properties) {
        return new SplitSavedIdListEntry(properties);
    };

    /**
     * Encodes the specified SplitSavedIdListEntry message. Does not implicitly {@link SplitSavedIdListEntry.verify|verify} messages.
     * @function encode
     * @memberof SplitSavedIdListEntry
     * @static
     * @param {SplitSavedIdListEntry.$Properties} message SplitSavedIdListEntry message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SplitSavedIdListEntry.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.clientId != null && $Object.hasOwnProperty.call(message, "clientId") && message.clientId !== "")
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.clientId);
        if (message.seqNum != null && $Object.hasOwnProperty.call(message, "seqNum") && message.seqNum !== 0)
            writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.seqNum);
        if (message.startCounter != null && $Object.hasOwnProperty.call(message, "startCounter") && message.startCounter !== 0)
            writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.startCounter);
        if (message.count != null && $Object.hasOwnProperty.call(message, "count") && message.count !== 0)
            writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.count);
        if (message.isDeleted != null && $Object.hasOwnProperty.call(message, "isDeleted") && message.isDeleted !== false)
            writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isDeleted);
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a SplitSavedIdListEntry message from the specified reader or buffer.
     * @function decode
     * @memberof SplitSavedIdListEntry
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SplitSavedIdListEntry & SplitSavedIdListEntry.$Shape} SplitSavedIdListEntry
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SplitSavedIdListEntry.decode = function (reader, length, _end, _depth, _target) {
        if (!(reader instanceof $Reader))
            reader = $Reader.create(reader);
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $Reader.recursionLimit)
            throw $Error("max depth exceeded");
        let end, message, value;
        if (length === $undefined)
            end = reader.len;
        else {
            end = reader.pos + length;
            if (end > reader.len)
                throw $RangeError("index out of range");
            length = reader.len;
            reader.len = end;
        }
        message = _target || new $root.SplitSavedIdListEntry();
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
                    if ((value = reader.stringVerify()).length)
                        message.clientId = value;
                    else
                        delete message.clientId;
                    continue;
                }
            case 2: {
                    if (wireType !== 0)
                        break;
                    if (value = reader.uint32())
                        message.seqNum = value;
                    else
                        delete message.seqNum;
                    continue;
                }
            case 3: {
                    if (wireType !== 0)
                        break;
                    if (value = reader.uint32())
                        message.startCounter = value;
                    else
                        delete message.startCounter;
                    continue;
                }
            case 4: {
                    if (wireType !== 0)
                        break;
                    if (value = reader.uint32())
                        message.count = value;
                    else
                        delete message.count;
                    continue;
                }
            case 5: {
                    if (wireType !== 0)
                        break;
                    if (value = reader.bool())
                        message.isDeleted = value;
                    else
                        delete message.isDeleted;
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

    return SplitSavedIdListEntry;
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

export {
  $root as default
};
