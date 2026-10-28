/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
import $protobuf from "protobufjs/minimal.js";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
const $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $RangeError = $util.global.RangeError;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const SavedIdListMessage = $root.SavedIdListMessage = (() => {

    /**
     * Properties of a SavedIdListMessage.
     * @typedef {Object} SavedIdListMessage.$Properties
     * @property {Array.<string>|null} [clientIds] SavedIdListMessage clientIds
     * @property {Array.<number>|null} [clientIndexDeltas] SavedIdListMessage clientIndexDeltas
     * @property {Array.<number>|null} [seqNumIncs] SavedIdListMessage seqNumIncs
     * @property {Array.<number>|null} [signedCounts] SavedIdListMessage signedCounts
     * @property {Array.<number>|null} [startCounterIndexes] SavedIdListMessage startCounterIndexes
     * @property {Array.<number>|null} [startCounters] SavedIdListMessage startCounters
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */

    /**
     * Properties of a SavedIdListMessage.
     * @exports ISavedIdListMessage
     * @interface ISavedIdListMessage
     * @augments SavedIdListMessage.$Properties
     * @deprecated Use SavedIdListMessage.$Properties instead.
     */

    /**
     * Shape of a SavedIdListMessage.
     * @typedef {SavedIdListMessage.$Properties} SavedIdListMessage.$Shape
     */

    /**
     * Constructs a new SavedIdListMessage.
     * @exports SavedIdListMessage
     * @classdesc Represents a SavedIdListMessage.
     * @constructor
     * @param {SavedIdListMessage.$Properties=} [properties] Properties to set
     * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
     */
    const SavedIdListMessage = function (properties) {
        this.clientIds = [];
        this.clientIndexDeltas = [];
        this.seqNumIncs = [];
        this.signedCounts = [];
        this.startCounterIndexes = [];
        this.startCounters = [];
        if (properties)
            for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                if (properties[keys[i]] != null && keys[i] !== "__proto__")
                    this[keys[i]] = properties[keys[i]];
    };

    /**
     * SavedIdListMessage clientIds.
     * @member {Array.<string>} clientIds
     * @memberof SavedIdListMessage
     * @instance
     */
    SavedIdListMessage.prototype.clientIds = $util.emptyArray;

    /**
     * SavedIdListMessage clientIndexDeltas.
     * @member {Array.<number>} clientIndexDeltas
     * @memberof SavedIdListMessage
     * @instance
     */
    SavedIdListMessage.prototype.clientIndexDeltas = $util.emptyArray;

    /**
     * SavedIdListMessage seqNumIncs.
     * @member {Array.<number>} seqNumIncs
     * @memberof SavedIdListMessage
     * @instance
     */
    SavedIdListMessage.prototype.seqNumIncs = $util.emptyArray;

    /**
     * SavedIdListMessage signedCounts.
     * @member {Array.<number>} signedCounts
     * @memberof SavedIdListMessage
     * @instance
     */
    SavedIdListMessage.prototype.signedCounts = $util.emptyArray;

    /**
     * SavedIdListMessage startCounterIndexes.
     * @member {Array.<number>} startCounterIndexes
     * @memberof SavedIdListMessage
     * @instance
     */
    SavedIdListMessage.prototype.startCounterIndexes = $util.emptyArray;

    /**
     * SavedIdListMessage startCounters.
     * @member {Array.<number>} startCounters
     * @memberof SavedIdListMessage
     * @instance
     */
    SavedIdListMessage.prototype.startCounters = $util.emptyArray;

    /**
     * Creates a new SavedIdListMessage instance using the specified properties.
     * @function create
     * @memberof SavedIdListMessage
     * @static
     * @param {SavedIdListMessage.$Properties=} [properties] Properties to set
     * @returns {SavedIdListMessage} SavedIdListMessage instance
     * @type {{
     *   (properties: SavedIdListMessage.$Shape): SavedIdListMessage & SavedIdListMessage.$Shape;
     *   (properties?: SavedIdListMessage.$Properties): SavedIdListMessage;
     * }}
     */
    SavedIdListMessage.create = function(properties) {
        return new SavedIdListMessage(properties);
    };

    /**
     * Encodes the specified SavedIdListMessage message. Does not implicitly {@link SavedIdListMessage.verify|verify} messages.
     * @function encode
     * @memberof SavedIdListMessage
     * @static
     * @param {SavedIdListMessage.$Properties} message SavedIdListMessage message or plain object to encode
     * @param {$protobuf.Writer} [writer] Writer to encode to
     * @returns {$protobuf.Writer} Writer
     */
    SavedIdListMessage.encode = function (message, writer, _depth) {
        if (!writer)
            writer = $Writer.create();
        if (_depth === $undefined)
            _depth = 0;
        if (_depth > $util.recursionLimit)
            throw $Error("max depth exceeded");
        if (message.clientIds != null && message.clientIds.length)
            for (let i = 0; i < message.clientIds.length; ++i)
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.clientIds[i]);
        if (message.clientIndexDeltas != null && message.clientIndexDeltas.length)
            writer.uint32(/* id 2, wireType 2 =*/18).sint32s(message.clientIndexDeltas);
        if (message.seqNumIncs != null && message.seqNumIncs.length)
            writer.uint32(/* id 3, wireType 2 =*/26).uint32s(message.seqNumIncs);
        if (message.signedCounts != null && message.signedCounts.length)
            writer.uint32(/* id 4, wireType 2 =*/34).sint32s(message.signedCounts);
        if (message.startCounterIndexes != null && message.startCounterIndexes.length)
            writer.uint32(/* id 5, wireType 2 =*/42).uint32s(message.startCounterIndexes);
        if (message.startCounters != null && message.startCounters.length)
            writer.uint32(/* id 6, wireType 2 =*/50).uint32s(message.startCounters);
        if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
            for (let i = 0; i < message.$unknowns.length; ++i)
                writer.raw(message.$unknowns[i]);
        return writer;
    };

    /**
     * Decodes a SavedIdListMessage message from the specified reader or buffer.
     * @function decode
     * @memberof SavedIdListMessage
     * @static
     * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
     * @param {number} [length] Message length if known beforehand
     * @returns {SavedIdListMessage & SavedIdListMessage.$Shape} SavedIdListMessage
     * @throws {Error} If the payload is not a reader or valid buffer
     * @throws {$protobuf.util.ProtocolError} If required fields are missing
     */
    SavedIdListMessage.decode = function (reader, length, _end, _depth, _target) {
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
        message = _target || new $root.SavedIdListMessage();
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
                        if (!(message.clientIndexDeltas && message.clientIndexDeltas.length))
                            message.clientIndexDeltas = [];
                        reader.sint32s(message.clientIndexDeltas);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.clientIndexDeltas && message.clientIndexDeltas.length))
                        message.clientIndexDeltas = [];
                    message.clientIndexDeltas.push(reader.sint32());
                    continue;
                }
            case 3: {
                    if (wireType === 2) {
                        if (!(message.seqNumIncs && message.seqNumIncs.length))
                            message.seqNumIncs = [];
                        reader.uint32s(message.seqNumIncs);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.seqNumIncs && message.seqNumIncs.length))
                        message.seqNumIncs = [];
                    message.seqNumIncs.push(reader.uint32());
                    continue;
                }
            case 4: {
                    if (wireType === 2) {
                        if (!(message.signedCounts && message.signedCounts.length))
                            message.signedCounts = [];
                        reader.sint32s(message.signedCounts);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.signedCounts && message.signedCounts.length))
                        message.signedCounts = [];
                    message.signedCounts.push(reader.sint32());
                    continue;
                }
            case 5: {
                    if (wireType === 2) {
                        if (!(message.startCounterIndexes && message.startCounterIndexes.length))
                            message.startCounterIndexes = [];
                        reader.uint32s(message.startCounterIndexes);
                        continue;
                    }
                    if (wireType !== 0)
                        break;
                    if (!(message.startCounterIndexes && message.startCounterIndexes.length))
                        message.startCounterIndexes = [];
                    message.startCounterIndexes.push(reader.uint32());
                    continue;
                }
            case 6: {
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

    return SavedIdListMessage;
})();

export {
  $root as default
};
