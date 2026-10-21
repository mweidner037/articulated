"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/aspromise.js
  var require_aspromise = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/aspromise.js"(exports, module) {
      "use strict";
      module.exports = asPromise;
      function asPromise(fn, ctx) {
        var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = true;
        while (index < arguments.length)
          params[offset++] = arguments[index++];
        return new Promise(function executor(resolve, reject) {
          params[offset] = function callback(err) {
            if (pending) {
              pending = false;
              if (err)
                reject(err);
              else {
                var params2 = new Array(arguments.length - 1), offset2 = 0;
                while (offset2 < params2.length)
                  params2[offset2++] = arguments[offset2];
                resolve.apply(null, params2);
              }
            }
          };
          try {
            fn.apply(ctx || null, params);
          } catch (err) {
            if (pending) {
              pending = false;
              reject(err);
            }
          }
        });
      }
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/base64.js
  var require_base64 = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/base64.js"(exports) {
      "use strict";
      var base64 = exports;
      base64.length = function length(string) {
        var p = string.length;
        if (!p)
          return 0;
        while (p > 0 && string.charAt(p - 1) === "=")
          --p;
        return Math.floor(p * 3 / 4);
      };
      var b64 = new Array(64);
      var s64 = new Array(123);
      for (i = 0; i < 64; )
        s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
      var i;
      s64[45] = 62;
      s64[95] = 63;
      base64.encode = function encode(buffer, start, end) {
        var parts = null, chunk = [];
        var i2 = 0, j = 0, t;
        while (start < end) {
          var b = buffer[start++];
          switch (j) {
            case 0:
              chunk[i2++] = b64[b >> 2];
              t = (b & 3) << 4;
              j = 1;
              break;
            case 1:
              chunk[i2++] = b64[t | b >> 4];
              t = (b & 15) << 2;
              j = 2;
              break;
            case 2:
              chunk[i2++] = b64[t | b >> 6];
              chunk[i2++] = b64[b & 63];
              j = 0;
              break;
          }
          if (i2 > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i2 = 0;
          }
        }
        if (j) {
          chunk[i2++] = b64[t];
          chunk[i2++] = 61;
          if (j === 1)
            chunk[i2++] = 61;
        }
        if (parts) {
          if (i2)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
          return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i2));
      };
      var invalidEncoding = "invalid encoding";
      base64.decode = function decode(string, buffer, offset) {
        var start = offset;
        var j = 0, t;
        for (var i2 = 0; i2 < string.length; ) {
          var c = string.charCodeAt(i2++);
          if (c === 61 && j > 1)
            break;
          if ((c = s64[c]) === void 0)
            throw Error(invalidEncoding);
          switch (j) {
            case 0:
              t = c;
              j = 1;
              break;
            case 1:
              buffer[offset++] = t << 2 | (c & 48) >> 4;
              t = c;
              j = 2;
              break;
            case 2:
              buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
              t = c;
              j = 3;
              break;
            case 3:
              buffer[offset++] = (t & 3) << 6 | c;
              j = 0;
              break;
          }
        }
        if (j === 1)
          throw Error(invalidEncoding);
        return offset - start;
      };
      var base64Re = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
      var base64UrlRe = /[-_]/;
      var base64UrlNoPaddingRe = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2}(?:==)?|[A-Za-z0-9_-]{3}=?)?$/;
      base64.test = function test2(string) {
        return base64Re.test(string) || base64UrlRe.test(string) && base64UrlNoPaddingRe.test(string);
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/eventemitter.js
  var require_eventemitter = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/eventemitter.js"(exports, module) {
      "use strict";
      module.exports = EventEmitter;
      function EventEmitter() {
        this._listeners = /* @__PURE__ */ Object.create(null);
      }
      EventEmitter.prototype.on = function on(evt, fn, ctx) {
        (this._listeners[evt] || (this._listeners[evt] = [])).push({
          fn,
          ctx: ctx || this
        });
        return this;
      };
      EventEmitter.prototype.off = function off(evt, fn) {
        if (evt === void 0)
          this._listeners = /* @__PURE__ */ Object.create(null);
        else {
          if (fn === void 0)
            this._listeners[evt] = [];
          else {
            var listeners = this._listeners[evt];
            if (!listeners)
              return this;
            for (var i = 0; i < listeners.length; )
              if (listeners[i].fn === fn)
                listeners.splice(i, 1);
              else
                ++i;
          }
        }
        return this;
      };
      EventEmitter.prototype.emit = function emit(evt) {
        var listeners = this._listeners[evt];
        if (listeners) {
          var args = [], i = 1;
          for (; i < arguments.length; )
            args.push(arguments[i++]);
          for (i = 0; i < listeners.length; )
            listeners[i].fn.apply(listeners[i++].ctx, args);
        }
        return this;
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/float.js
  var require_float = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/float.js"(exports, module) {
      "use strict";
      module.exports = factory(factory);
      function factory(exports2) {
        if (typeof Float32Array !== "undefined") (function() {
          var f32 = new Float32Array([-0]), f8b = new Uint8Array(f32.buffer), le = f8b[3] === 128;
          function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
          }
          function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
          }
          exports2.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
          exports2.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
          function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
          }
          function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
          }
          exports2.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
          exports2.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
        })();
        else (function() {
          function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
              val = -val;
            if (val === 0)
              writeUint(1 / val > 0 ? (
                /* positive */
                0
              ) : (
                /* negative 0 */
                2147483648
              ), buf, pos);
            else if (isNaN(val))
              writeUint(2143289344, buf, pos);
            else if (val > 34028234663852886e22)
              writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 11754943508222875e-54)
              writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos);
            else {
              var exponent = Math.floor(Math.log(val) / Math.LN2), mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
              writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
          }
          exports2.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
          exports2.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
          function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos), sign = (uint >> 31) * 2 + 1, exponent = uint >>> 23 & 255, mantissa = uint & 8388607;
            return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 1401298464324817e-60 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
          }
          exports2.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
          exports2.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
        })();
        if (typeof Float64Array !== "undefined") (function() {
          var f64 = new Float64Array([-0]), f8b = new Uint8Array(f64.buffer), le = f8b[7] === 128;
          function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
          }
          function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
          }
          exports2.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
          exports2.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
          function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
          }
          function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
          }
          exports2.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
          exports2.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
        })();
        else (function() {
          function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
              val = -val;
            if (val === 0) {
              writeUint(0, buf, pos + off0);
              writeUint(1 / val > 0 ? (
                /* positive */
                0
              ) : (
                /* negative 0 */
                2147483648
              ), buf, pos + off1);
            } else if (isNaN(val)) {
              writeUint(0, buf, pos + off0);
              writeUint(2146959360, buf, pos + off1);
            } else if (val > 17976931348623157e292) {
              writeUint(0, buf, pos + off0);
              writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
              var mantissa;
              if (val < 22250738585072014e-324) {
                mantissa = val / 5e-324;
                writeUint(mantissa >>> 0, buf, pos + off0);
                writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
              } else {
                var exponent = Math.floor(Math.log(val) / Math.LN2);
                if (exponent === 1024)
                  exponent = 1023;
                mantissa = val * Math.pow(2, -exponent);
                writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
              }
            }
          }
          exports2.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
          exports2.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
          function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
          }
          exports2.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
          exports2.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
        })();
        return exports2;
      }
      function writeUintLE(val, buf, pos) {
        buf[pos] = val & 255;
        buf[pos + 1] = val >>> 8 & 255;
        buf[pos + 2] = val >>> 16 & 255;
        buf[pos + 3] = val >>> 24;
      }
      function writeUintBE(val, buf, pos) {
        buf[pos] = val >>> 24;
        buf[pos + 1] = val >>> 16 & 255;
        buf[pos + 2] = val >>> 8 & 255;
        buf[pos + 3] = val & 255;
      }
      function readUintLE(buf, pos) {
        return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
      }
      function readUintBE(buf, pos) {
        return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
      }
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/utf8.js
  var require_utf8 = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/utf8.js"(exports) {
      "use strict";
      var utf8 = exports;
      var looseDecoder = new TextDecoder("utf-8", { ignoreBOM: true });
      var strictDecoder;
      var TEXT_DECODER_MIN_LENGTH = 64;
      try {
        strictDecoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
      } catch (err) {
        strictDecoder = looseDecoder;
      }
      utf8.length = function utf8_length(string) {
        var len = 0, c = 0;
        for (var i = 0; i < string.length; ++i) {
          c = string.charCodeAt(i);
          if (c < 128)
            len += 1;
          else if (c < 2048)
            len += 2;
          else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
            ++i;
            len += 4;
          } else
            len += 3;
        }
        return len;
      };
      function utf8_read_decoder(decoder, buffer, start, end) {
        var source = start === 0 && end === buffer.length ? buffer : buffer.subarray(start, end);
        return decoder.decode(source);
      }
      utf8.read = function utf8_read_loose(buffer, start, end) {
        if (end - start < 1)
          return "";
        if (end - start >= TEXT_DECODER_MIN_LENGTH)
          return utf8_read_decoder(looseDecoder, buffer, start, end);
        var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
        for (; i + 7 < end; i += 8) {
          c1 = buffer[i];
          c2 = buffer[i + 1];
          c3 = buffer[i + 2];
          c4 = buffer[i + 3];
          c5 = buffer[i + 4];
          c6 = buffer[i + 5];
          c7 = buffer[i + 6];
          c8 = buffer[i + 7];
          if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
            return str + utf8_read_decoder(looseDecoder, buffer, i, end);
          str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
        }
        for (; i < end; ++i) {
          c1 = buffer[i];
          if (c1 & 128)
            return str + utf8_read_decoder(looseDecoder, buffer, i, end);
          str += String.fromCharCode(c1);
        }
        return str;
      };
      utf8.readStrict = function utf8_read_strict(buffer, start, end) {
        if (end - start < 1)
          return "";
        if (end - start >= TEXT_DECODER_MIN_LENGTH)
          return utf8_read_decoder(strictDecoder, buffer, start, end);
        var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
        for (; i + 7 < end; i += 8) {
          c1 = buffer[i];
          c2 = buffer[i + 1];
          c3 = buffer[i + 2];
          c4 = buffer[i + 3];
          c5 = buffer[i + 4];
          c6 = buffer[i + 5];
          c7 = buffer[i + 6];
          c8 = buffer[i + 7];
          if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
            return str + utf8_read_decoder(strictDecoder, buffer, i, end);
          str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
        }
        for (; i < end; ++i) {
          c1 = buffer[i];
          if (c1 & 128)
            return str + utf8_read_decoder(strictDecoder, buffer, i, end);
          str += String.fromCharCode(c1);
        }
        return str;
      };
      utf8.write = function utf8_write(string, buffer, offset) {
        var start = offset, c1, c2;
        for (var i = 0; i < string.length; ++i) {
          c1 = string.charCodeAt(i);
          if (c1 < 128) {
            buffer[offset++] = c1;
          } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6 | 192;
            buffer[offset++] = c1 & 63 | 128;
          } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
            c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
            ++i;
            buffer[offset++] = c1 >> 18 | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
          } else {
            buffer[offset++] = c1 >> 12 | 224;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
          }
        }
        return offset - start;
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/pool.js
  var require_pool = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/pool.js"(exports, module) {
      "use strict";
      module.exports = pool;
      function pool(alloc, slice, size) {
        var SIZE = size || 8192;
        var MAX = SIZE >>> 1;
        var slab = null;
        var offset = SIZE;
        return function pool_alloc(size2) {
          if (size2 < 1 || size2 > MAX)
            return alloc(size2);
          if (offset + size2 > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
          }
          var buf = slice.call(slab, offset, offset += size2);
          if (offset & 7)
            offset = (offset | 7) + 1;
          return buf;
        };
      }
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/longbits.js
  var require_longbits = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/longbits.js"(exports, module) {
      "use strict";
      module.exports = LongBits;
      var Long;
      function LongBits(lo, hi) {
        this.lo = lo >>> 0;
        this.hi = hi >>> 0;
      }
      var zero = LongBits.zero = new LongBits(0, 0);
      zero.toNumber = function() {
        return 0;
      };
      zero.zzEncode = zero.zzDecode = function() {
        return this;
      };
      zero.length = function() {
        return 1;
      };
      var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
      LongBits.fromNumber = function fromNumber(value) {
        if (value === 0)
          return zero;
        var sign = value < 0;
        if (sign)
          value = -value;
        var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
        if (sign) {
          hi = ~hi >>> 0;
          lo = ~lo >>> 0;
          if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
              hi = 0;
          }
        }
        return new LongBits(lo, hi);
      };
      LongBits.from = function from(value) {
        if (typeof value === "number")
          return LongBits.fromNumber(value);
        if (typeof value === "string" || value instanceof String) {
          if (Long)
            value = Long.fromString(value);
          else
            return LongBits.fromNumber(parseInt(value, 10));
        }
        return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
      };
      LongBits.prototype.toNumber = function toNumber(unsigned) {
        if (!unsigned && this.hi >>> 31) {
          var lo = ~this.lo + 1 >>> 0, hi = ~this.hi >>> 0;
          if (!lo)
            hi = hi + 1 >>> 0;
          return -(lo + hi * 4294967296);
        }
        return this.lo + this.hi * 4294967296;
      };
      LongBits.prototype.toLong = function toLong(unsigned) {
        return Long ? new Long(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
      };
      var charCodeAt = String.prototype.charCodeAt;
      LongBits.fromHash = function fromHash(hash) {
        if (hash === zeroHash)
          return zero;
        return new LongBits(
          (charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0,
          (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0
        );
      };
      LongBits.prototype.toHash = function toHash() {
        return String.fromCharCode(
          this.lo & 255,
          this.lo >>> 8 & 255,
          this.lo >>> 16 & 255,
          this.lo >>> 24,
          this.hi & 255,
          this.hi >>> 8 & 255,
          this.hi >>> 16 & 255,
          this.hi >>> 24
        );
      };
      LongBits.prototype.zzEncode = function zzEncode() {
        var mask = this.hi >> 31;
        this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
        this.lo = (this.lo << 1 ^ mask) >>> 0;
        return this;
      };
      LongBits.prototype.zzDecode = function zzDecode() {
        var mask = -(this.lo & 1);
        this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
        this.hi = (this.hi >>> 1 ^ mask) >>> 0;
        return this;
      };
      LongBits.prototype.length = function length() {
        var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
        return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
      };
      LongBits._configure = function(Long_) {
        Long = Long_;
      };
    }
  });

  // node_modules/.pnpm/long@5.3.2/node_modules/long/umd/index.js
  var require_umd = __commonJS({
    "node_modules/.pnpm/long@5.3.2/node_modules/long/umd/index.js"(exports, module) {
      (function(global2, factory) {
        function preferDefault(exports2) {
          return exports2.default || exports2;
        }
        if (typeof define === "function" && define.amd) {
          define([], function() {
            var exports2 = {};
            factory(exports2);
            return preferDefault(exports2);
          });
        } else if (typeof exports === "object") {
          factory(exports);
          if (typeof module === "object") module.exports = preferDefault(exports);
        } else {
          (function() {
            var exports2 = {};
            factory(exports2);
            global2.Long = preferDefault(exports2);
          })();
        }
      })(
        typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports,
        function(_exports) {
          "use strict";
          Object.defineProperty(_exports, "__esModule", {
            value: true
          });
          _exports.default = void 0;
          var wasm = null;
          try {
            wasm = new WebAssembly.Instance(
              new WebAssembly.Module(
                new Uint8Array([
                  // \0asm
                  0,
                  97,
                  115,
                  109,
                  // version 1
                  1,
                  0,
                  0,
                  0,
                  // section "type"
                  1,
                  13,
                  2,
                  // 0, () => i32
                  96,
                  0,
                  1,
                  127,
                  // 1, (i32, i32, i32, i32) => i32
                  96,
                  4,
                  127,
                  127,
                  127,
                  127,
                  1,
                  127,
                  // section "function"
                  3,
                  7,
                  6,
                  // 0, type 0
                  0,
                  // 1, type 1
                  1,
                  // 2, type 1
                  1,
                  // 3, type 1
                  1,
                  // 4, type 1
                  1,
                  // 5, type 1
                  1,
                  // section "global"
                  6,
                  6,
                  1,
                  // 0, "high", mutable i32
                  127,
                  1,
                  65,
                  0,
                  11,
                  // section "export"
                  7,
                  50,
                  6,
                  // 0, "mul"
                  3,
                  109,
                  117,
                  108,
                  0,
                  1,
                  // 1, "div_s"
                  5,
                  100,
                  105,
                  118,
                  95,
                  115,
                  0,
                  2,
                  // 2, "div_u"
                  5,
                  100,
                  105,
                  118,
                  95,
                  117,
                  0,
                  3,
                  // 3, "rem_s"
                  5,
                  114,
                  101,
                  109,
                  95,
                  115,
                  0,
                  4,
                  // 4, "rem_u"
                  5,
                  114,
                  101,
                  109,
                  95,
                  117,
                  0,
                  5,
                  // 5, "get_high"
                  8,
                  103,
                  101,
                  116,
                  95,
                  104,
                  105,
                  103,
                  104,
                  0,
                  0,
                  // section "code"
                  10,
                  191,
                  1,
                  6,
                  // 0, "get_high"
                  4,
                  0,
                  35,
                  0,
                  11,
                  // 1, "mul"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  126,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 2, "div_s"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  127,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 3, "div_u"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  128,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 4, "rem_s"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  129,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 5, "rem_u"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  130,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11
                ])
              ),
              {}
            ).exports;
          } catch {
          }
          function Long(low, high, unsigned) {
            this.low = low | 0;
            this.high = high | 0;
            this.unsigned = !!unsigned;
          }
          Long.prototype.__isLong__;
          Object.defineProperty(Long.prototype, "__isLong__", {
            value: true
          });
          function isLong(obj) {
            return (obj && obj["__isLong__"]) === true;
          }
          function ctz32(value) {
            var c = Math.clz32(value & -value);
            return value ? 31 - c : c;
          }
          Long.isLong = isLong;
          var INT_CACHE = {};
          var UINT_CACHE = {};
          function fromInt(value, unsigned) {
            var obj, cachedObj, cache;
            if (unsigned) {
              value >>>= 0;
              if (cache = 0 <= value && value < 256) {
                cachedObj = UINT_CACHE[value];
                if (cachedObj) return cachedObj;
              }
              obj = fromBits(value, 0, true);
              if (cache) UINT_CACHE[value] = obj;
              return obj;
            } else {
              value |= 0;
              if (cache = -128 <= value && value < 128) {
                cachedObj = INT_CACHE[value];
                if (cachedObj) return cachedObj;
              }
              obj = fromBits(value, value < 0 ? -1 : 0, false);
              if (cache) INT_CACHE[value] = obj;
              return obj;
            }
          }
          Long.fromInt = fromInt;
          function fromNumber(value, unsigned) {
            if (isNaN(value)) return unsigned ? UZERO : ZERO;
            if (unsigned) {
              if (value < 0) return UZERO;
              if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
            } else {
              if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
              if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
            }
            if (value < 0) return fromNumber(-value, unsigned).neg();
            return fromBits(
              value % TWO_PWR_32_DBL | 0,
              value / TWO_PWR_32_DBL | 0,
              unsigned
            );
          }
          Long.fromNumber = fromNumber;
          function fromBits(lowBits, highBits, unsigned) {
            return new Long(lowBits, highBits, unsigned);
          }
          Long.fromBits = fromBits;
          var pow_dbl = Math.pow;
          function fromString(str, unsigned, radix) {
            if (str.length === 0) throw Error("empty string");
            if (typeof unsigned === "number") {
              radix = unsigned;
              unsigned = false;
            } else {
              unsigned = !!unsigned;
            }
            if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
              return unsigned ? UZERO : ZERO;
            radix = radix || 10;
            if (radix < 2 || 36 < radix) throw RangeError("radix");
            var p;
            if ((p = str.indexOf("-")) > 0) throw Error("interior hyphen");
            else if (p === 0) {
              return fromString(str.substring(1), unsigned, radix).neg();
            }
            var radixToPower = fromNumber(pow_dbl(radix, 8));
            var result = ZERO;
            for (var i = 0; i < str.length; i += 8) {
              var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
              if (size < 8) {
                var power = fromNumber(pow_dbl(radix, size));
                result = result.mul(power).add(fromNumber(value));
              } else {
                result = result.mul(radixToPower);
                result = result.add(fromNumber(value));
              }
            }
            result.unsigned = unsigned;
            return result;
          }
          Long.fromString = fromString;
          function fromValue(val, unsigned) {
            if (typeof val === "number") return fromNumber(val, unsigned);
            if (typeof val === "string") return fromString(val, unsigned);
            return fromBits(
              val.low,
              val.high,
              typeof unsigned === "boolean" ? unsigned : val.unsigned
            );
          }
          Long.fromValue = fromValue;
          var TWO_PWR_16_DBL = 1 << 16;
          var TWO_PWR_24_DBL = 1 << 24;
          var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
          var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
          var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
          var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
          var ZERO = fromInt(0);
          Long.ZERO = ZERO;
          var UZERO = fromInt(0, true);
          Long.UZERO = UZERO;
          var ONE = fromInt(1);
          Long.ONE = ONE;
          var UONE = fromInt(1, true);
          Long.UONE = UONE;
          var NEG_ONE = fromInt(-1);
          Long.NEG_ONE = NEG_ONE;
          var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
          Long.MAX_VALUE = MAX_VALUE;
          var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
          Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
          var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
          Long.MIN_VALUE = MIN_VALUE;
          var LongPrototype = Long.prototype;
          LongPrototype.toInt = function toInt() {
            return this.unsigned ? this.low >>> 0 : this.low;
          };
          LongPrototype.toNumber = function toNumber() {
            if (this.unsigned)
              return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
            return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
          };
          LongPrototype.toString = function toString2(radix) {
            radix = radix || 10;
            if (radix < 2 || 36 < radix) throw RangeError("radix");
            if (this.isZero()) return "0";
            if (this.isNegative()) {
              if (this.eq(MIN_VALUE)) {
                var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
              } else return "-" + this.neg().toString(radix);
            }
            var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
            var result = "";
            while (true) {
              var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
              rem = remDiv;
              if (rem.isZero()) return digits + result;
              else {
                while (digits.length < 6) digits = "0" + digits;
                result = "" + digits + result;
              }
            }
          };
          LongPrototype.getHighBits = function getHighBits() {
            return this.high;
          };
          LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
            return this.high >>> 0;
          };
          LongPrototype.getLowBits = function getLowBits() {
            return this.low;
          };
          LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
            return this.low >>> 0;
          };
          LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
            if (this.isNegative())
              return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
            var val = this.high != 0 ? this.high : this.low;
            for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;
            return this.high != 0 ? bit + 33 : bit + 1;
          };
          LongPrototype.isSafeInteger = function isSafeInteger() {
            var top11Bits = this.high >> 21;
            if (!top11Bits) return true;
            if (this.unsigned) return false;
            return top11Bits === -1 && !(this.low === 0 && this.high === -2097152);
          };
          LongPrototype.isZero = function isZero() {
            return this.high === 0 && this.low === 0;
          };
          LongPrototype.eqz = LongPrototype.isZero;
          LongPrototype.isNegative = function isNegative() {
            return !this.unsigned && this.high < 0;
          };
          LongPrototype.isPositive = function isPositive() {
            return this.unsigned || this.high >= 0;
          };
          LongPrototype.isOdd = function isOdd() {
            return (this.low & 1) === 1;
          };
          LongPrototype.isEven = function isEven() {
            return (this.low & 1) === 0;
          };
          LongPrototype.equals = function equals(other) {
            if (!isLong(other)) other = fromValue(other);
            if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
              return false;
            return this.high === other.high && this.low === other.low;
          };
          LongPrototype.eq = LongPrototype.equals;
          LongPrototype.notEquals = function notEquals(other) {
            return !this.eq(
              /* validates */
              other
            );
          };
          LongPrototype.neq = LongPrototype.notEquals;
          LongPrototype.ne = LongPrototype.notEquals;
          LongPrototype.lessThan = function lessThan(other) {
            return this.comp(
              /* validates */
              other
            ) < 0;
          };
          LongPrototype.lt = LongPrototype.lessThan;
          LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
            return this.comp(
              /* validates */
              other
            ) <= 0;
          };
          LongPrototype.lte = LongPrototype.lessThanOrEqual;
          LongPrototype.le = LongPrototype.lessThanOrEqual;
          LongPrototype.greaterThan = function greaterThan(other) {
            return this.comp(
              /* validates */
              other
            ) > 0;
          };
          LongPrototype.gt = LongPrototype.greaterThan;
          LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
            return this.comp(
              /* validates */
              other
            ) >= 0;
          };
          LongPrototype.gte = LongPrototype.greaterThanOrEqual;
          LongPrototype.ge = LongPrototype.greaterThanOrEqual;
          LongPrototype.compare = function compare(other) {
            if (!isLong(other)) other = fromValue(other);
            if (this.eq(other)) return 0;
            var thisNeg = this.isNegative(), otherNeg = other.isNegative();
            if (thisNeg && !otherNeg) return -1;
            if (!thisNeg && otherNeg) return 1;
            if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
            return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
          };
          LongPrototype.comp = LongPrototype.compare;
          LongPrototype.negate = function negate() {
            if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
            return this.not().add(ONE);
          };
          LongPrototype.neg = LongPrototype.negate;
          LongPrototype.add = function add(addend) {
            if (!isLong(addend)) addend = fromValue(addend);
            var a48 = this.high >>> 16;
            var a32 = this.high & 65535;
            var a16 = this.low >>> 16;
            var a00 = this.low & 65535;
            var b48 = addend.high >>> 16;
            var b32 = addend.high & 65535;
            var b16 = addend.low >>> 16;
            var b00 = addend.low & 65535;
            var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
            c00 += a00 + b00;
            c16 += c00 >>> 16;
            c00 &= 65535;
            c16 += a16 + b16;
            c32 += c16 >>> 16;
            c16 &= 65535;
            c32 += a32 + b32;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c48 += a48 + b48;
            c48 &= 65535;
            return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
          };
          LongPrototype.subtract = function subtract(subtrahend) {
            if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
            return this.add(subtrahend.neg());
          };
          LongPrototype.sub = LongPrototype.subtract;
          LongPrototype.multiply = function multiply(multiplier) {
            if (this.isZero()) return this;
            if (!isLong(multiplier)) multiplier = fromValue(multiplier);
            if (wasm) {
              var low = wasm["mul"](
                this.low,
                this.high,
                multiplier.low,
                multiplier.high
              );
              return fromBits(low, wasm["get_high"](), this.unsigned);
            }
            if (multiplier.isZero()) return this.unsigned ? UZERO : ZERO;
            if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
            if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
            if (this.isNegative()) {
              if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());
              else return this.neg().mul(multiplier).neg();
            } else if (multiplier.isNegative())
              return this.mul(multiplier.neg()).neg();
            if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
              return fromNumber(
                this.toNumber() * multiplier.toNumber(),
                this.unsigned
              );
            var a48 = this.high >>> 16;
            var a32 = this.high & 65535;
            var a16 = this.low >>> 16;
            var a00 = this.low & 65535;
            var b48 = multiplier.high >>> 16;
            var b32 = multiplier.high & 65535;
            var b16 = multiplier.low >>> 16;
            var b00 = multiplier.low & 65535;
            var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
            c00 += a00 * b00;
            c16 += c00 >>> 16;
            c00 &= 65535;
            c16 += a16 * b00;
            c32 += c16 >>> 16;
            c16 &= 65535;
            c16 += a00 * b16;
            c32 += c16 >>> 16;
            c16 &= 65535;
            c32 += a32 * b00;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c32 += a16 * b16;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c32 += a00 * b32;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
            c48 &= 65535;
            return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
          };
          LongPrototype.mul = LongPrototype.multiply;
          LongPrototype.divide = function divide(divisor) {
            if (!isLong(divisor)) divisor = fromValue(divisor);
            if (divisor.isZero()) throw Error("division by zero");
            if (wasm) {
              if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
                return this;
              }
              var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
              );
              return fromBits(low, wasm["get_high"](), this.unsigned);
            }
            if (this.isZero()) return this.unsigned ? UZERO : ZERO;
            var approx, rem, res;
            if (!this.unsigned) {
              if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                  return MIN_VALUE;
                else if (divisor.eq(MIN_VALUE)) return ONE;
                else {
                  var halfThis = this.shr(1);
                  approx = halfThis.div(divisor).shl(1);
                  if (approx.eq(ZERO)) {
                    return divisor.isNegative() ? ONE : NEG_ONE;
                  } else {
                    rem = this.sub(divisor.mul(approx));
                    res = approx.add(rem.div(divisor));
                    return res;
                  }
                }
              } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
              if (this.isNegative()) {
                if (divisor.isNegative()) return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
              } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();
              res = ZERO;
            } else {
              if (!divisor.unsigned) divisor = divisor.toUnsigned();
              if (divisor.gt(this)) return UZERO;
              if (divisor.gt(this.shru(1)))
                return UONE;
              res = UZERO;
            }
            rem = this;
            while (rem.gte(divisor)) {
              approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
              var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
              while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
              }
              if (approxRes.isZero()) approxRes = ONE;
              res = res.add(approxRes);
              rem = rem.sub(approxRem);
            }
            return res;
          };
          LongPrototype.div = LongPrototype.divide;
          LongPrototype.modulo = function modulo(divisor) {
            if (!isLong(divisor)) divisor = fromValue(divisor);
            if (wasm) {
              var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
              );
              return fromBits(low, wasm["get_high"](), this.unsigned);
            }
            return this.sub(this.div(divisor).mul(divisor));
          };
          LongPrototype.mod = LongPrototype.modulo;
          LongPrototype.rem = LongPrototype.modulo;
          LongPrototype.not = function not() {
            return fromBits(~this.low, ~this.high, this.unsigned);
          };
          LongPrototype.countLeadingZeros = function countLeadingZeros() {
            return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
          };
          LongPrototype.clz = LongPrototype.countLeadingZeros;
          LongPrototype.countTrailingZeros = function countTrailingZeros() {
            return this.low ? ctz32(this.low) : ctz32(this.high) + 32;
          };
          LongPrototype.ctz = LongPrototype.countTrailingZeros;
          LongPrototype.and = function and(other) {
            if (!isLong(other)) other = fromValue(other);
            return fromBits(
              this.low & other.low,
              this.high & other.high,
              this.unsigned
            );
          };
          LongPrototype.or = function or(other) {
            if (!isLong(other)) other = fromValue(other);
            return fromBits(
              this.low | other.low,
              this.high | other.high,
              this.unsigned
            );
          };
          LongPrototype.xor = function xor(other) {
            if (!isLong(other)) other = fromValue(other);
            return fromBits(
              this.low ^ other.low,
              this.high ^ other.high,
              this.unsigned
            );
          };
          LongPrototype.shiftLeft = function shiftLeft(numBits) {
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            else if (numBits < 32)
              return fromBits(
                this.low << numBits,
                this.high << numBits | this.low >>> 32 - numBits,
                this.unsigned
              );
            else return fromBits(0, this.low << numBits - 32, this.unsigned);
          };
          LongPrototype.shl = LongPrototype.shiftLeft;
          LongPrototype.shiftRight = function shiftRight(numBits) {
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            else if (numBits < 32)
              return fromBits(
                this.low >>> numBits | this.high << 32 - numBits,
                this.high >> numBits,
                this.unsigned
              );
            else
              return fromBits(
                this.high >> numBits - 32,
                this.high >= 0 ? 0 : -1,
                this.unsigned
              );
          };
          LongPrototype.shr = LongPrototype.shiftRight;
          LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            if (numBits < 32)
              return fromBits(
                this.low >>> numBits | this.high << 32 - numBits,
                this.high >>> numBits,
                this.unsigned
              );
            if (numBits === 32) return fromBits(this.high, 0, this.unsigned);
            return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
          };
          LongPrototype.shru = LongPrototype.shiftRightUnsigned;
          LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
          LongPrototype.rotateLeft = function rotateLeft(numBits) {
            var b;
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
            if (numBits < 32) {
              b = 32 - numBits;
              return fromBits(
                this.low << numBits | this.high >>> b,
                this.high << numBits | this.low >>> b,
                this.unsigned
              );
            }
            numBits -= 32;
            b = 32 - numBits;
            return fromBits(
              this.high << numBits | this.low >>> b,
              this.low << numBits | this.high >>> b,
              this.unsigned
            );
          };
          LongPrototype.rotl = LongPrototype.rotateLeft;
          LongPrototype.rotateRight = function rotateRight(numBits) {
            var b;
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
            if (numBits < 32) {
              b = 32 - numBits;
              return fromBits(
                this.high << b | this.low >>> numBits,
                this.low << b | this.high >>> numBits,
                this.unsigned
              );
            }
            numBits -= 32;
            b = 32 - numBits;
            return fromBits(
              this.low << b | this.high >>> numBits,
              this.high << b | this.low >>> numBits,
              this.unsigned
            );
          };
          LongPrototype.rotr = LongPrototype.rotateRight;
          LongPrototype.toSigned = function toSigned() {
            if (!this.unsigned) return this;
            return fromBits(this.low, this.high, false);
          };
          LongPrototype.toUnsigned = function toUnsigned() {
            if (this.unsigned) return this;
            return fromBits(this.low, this.high, true);
          };
          LongPrototype.toBytes = function toBytes(le) {
            return le ? this.toBytesLE() : this.toBytesBE();
          };
          LongPrototype.toBytesLE = function toBytesLE() {
            var hi = this.high, lo = this.low;
            return [
              lo & 255,
              lo >>> 8 & 255,
              lo >>> 16 & 255,
              lo >>> 24,
              hi & 255,
              hi >>> 8 & 255,
              hi >>> 16 & 255,
              hi >>> 24
            ];
          };
          LongPrototype.toBytesBE = function toBytesBE() {
            var hi = this.high, lo = this.low;
            return [
              hi >>> 24,
              hi >>> 16 & 255,
              hi >>> 8 & 255,
              hi & 255,
              lo >>> 24,
              lo >>> 16 & 255,
              lo >>> 8 & 255,
              lo & 255
            ];
          };
          Long.fromBytes = function fromBytes(bytes, unsigned, le) {
            return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
          };
          Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
            return new Long(
              bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
              bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
              unsigned
            );
          };
          Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
            return new Long(
              bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
              bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
              unsigned
            );
          };
          if (typeof BigInt === "function") {
            Long.fromBigInt = function fromBigInt(value, unsigned) {
              var lowBits = Number(BigInt.asIntN(32, value));
              var highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
              return fromBits(lowBits, highBits, unsigned);
            };
            Long.fromValue = function fromValueWithBigInt(value, unsigned) {
              if (typeof value === "bigint") return Long.fromBigInt(value, unsigned);
              return fromValue(value, unsigned);
            };
            LongPrototype.toBigInt = function toBigInt() {
              var lowBigInt = BigInt(this.low >>> 0);
              var highBigInt = BigInt(this.unsigned ? this.high >>> 0 : this.high);
              return highBigInt << BigInt(32) | lowBigInt;
            };
          }
          var _default = _exports.default = Long;
        }
      );
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/minimal.js
  var require_minimal = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/minimal.js"(exports) {
      "use strict";
      var util = exports;
      util.asPromise = require_aspromise();
      util.base64 = require_base64();
      util.EventEmitter = require_eventemitter();
      util.float = require_float();
      util.utf8 = require_utf8();
      util.pool = require_pool();
      util.LongBits = require_longbits();
      function isUnsafeProperty(key) {
        return key === "__proto__" || key === "prototype" || key === "constructor";
      }
      util.isUnsafeProperty = isUnsafeProperty;
      util.isNode = Boolean(typeof global !== "undefined" && global && global.process && global.process.versions && global.process.versions.node);
      util.global = util.isNode && global || typeof window !== "undefined" && window || typeof self !== "undefined" && self || typeof globalThis !== "undefined" && globalThis || exports;
      util.emptyArray = Object.freeze ? Object.freeze([]) : (
        /* istanbul ignore next */
        []
      );
      util.emptyObject = Object.freeze ? Object.freeze({}) : (
        /* istanbul ignore next */
        {}
      );
      util.isInteger = Number.isInteger || /* istanbul ignore next */
      function isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
      };
      util.isString = function isString(value) {
        return typeof value === "string" || value instanceof String;
      };
      util.isObject = function isObject(value) {
        return value && typeof value === "object";
      };
      util.isset = /**
       * Checks if a property on a message is considered to be present.
       * @param {Object} obj Plain object or message instance
       * @param {string} prop Property name
       * @returns {boolean} `true` if considered to be present, otherwise `false`
       */
      util.isSet = function isSet(obj, prop) {
        var value = obj[prop];
        if (value != null && Object.hasOwnProperty.call(obj, prop))
          return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
        return false;
      };
      util.Buffer = (function() {
        try {
          var Buffer2 = util.global.Buffer;
          return Buffer2.prototype.utf8Write || util.isNode ? Buffer2 : (
            /* istanbul ignore next */
            null
          );
        } catch (e) {
          return null;
        }
      })();
      util.newBuffer = function newBuffer(sizeOrArray) {
        var Buffer2 = util.Buffer;
        return typeof sizeOrArray === "number" ? Buffer2 ? Buffer2.allocUnsafe(sizeOrArray) : new Uint8Array(sizeOrArray) : Buffer2 ? Buffer2.from(sizeOrArray) : new Uint8Array(sizeOrArray);
      };
      util.rawField = function rawField(id, wireType, data) {
        var out = [], tag = id << 3 | wireType;
        tag >>>= 0;
        while (tag > 127) {
          out.push(tag & 127 | 128);
          tag >>>= 7;
        }
        out.push(tag);
        for (var i = 0; i < data.length; ++i)
          out.push(data[i]);
        return util.newBuffer(out);
      };
      util.Array = Uint8Array;
      util.Long = /* istanbul ignore next */
      util.global.dcodeIO && /* istanbul ignore next */
      util.global.dcodeIO.Long || /* istanbul ignore next */
      util.global.Long || (function() {
        try {
          var Long = require_umd();
          return Long && Long.isLong ? Long : null;
        } catch (e) {
          return null;
        }
      })();
      util.key2Re = /^(?:true|false|0|1)$/;
      util.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
      util.key64Re = /^(?:[\x00-\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
      util.longToHash = function longToHash(value) {
        return value ? util.LongBits.from(value).toHash() : util.LongBits.zeroHash;
      };
      util.longFromHash = function longFromHash(hash, unsigned) {
        var bits = util.LongBits.fromHash(hash);
        if (util.Long)
          return util.Long.fromBits(bits.lo, bits.hi, unsigned);
        return bits.toNumber(Boolean(unsigned));
      };
      util.longFromKey = function longFromKey(key, unsigned) {
        return util.key64Re.test(key) && !util.key32Re.test(key) ? util.longFromHash(key, unsigned) : key;
      };
      util.boolFromKey = function boolFromKey(key) {
        return key === "true" || key === "1";
      };
      function merge(dst) {
        var ifNotSet = typeof arguments[arguments.length - 1] === "boolean", limit = ifNotSet ? arguments.length - 1 : arguments.length;
        ifNotSet = ifNotSet && arguments[arguments.length - 1];
        for (var a = 1; a < limit; ++a) {
          var src = arguments[a];
          if (!src)
            continue;
          for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
            if (!isUnsafeProperty(keys[i]) && (!ifNotSet || !Object.prototype.hasOwnProperty.call(dst, keys[i]) || dst[keys[i]] === void 0))
              dst[keys[i]] = src[keys[i]];
        }
        return dst;
      }
      util.merge = merge;
      util.nestingLimit = 32;
      util.recursionLimit = 100;
      util.makeProp = function makeProp(obj, key, enumerable) {
        if (Object.prototype.hasOwnProperty.call(obj, key))
          return;
        Object.defineProperty(obj, key, {
          enumerable: enumerable === void 0 ? true : enumerable,
          configurable: true,
          writable: true
        });
      };
      util.lcFirst = function lcFirst(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
      };
      function newError(name) {
        function CustomError(message, properties) {
          if (!(this instanceof CustomError))
            return new CustomError(message, properties);
          Object.defineProperty(this, "message", { get: function() {
            return message;
          } });
          if (Error.captureStackTrace)
            Error.captureStackTrace(this, CustomError);
          else
            Object.defineProperty(this, "stack", { value: new Error().stack || "" });
          if (properties)
            merge(this, properties);
        }
        CustomError.prototype = Object.create(Error.prototype, {
          constructor: {
            value: CustomError,
            writable: true,
            enumerable: false,
            configurable: true
          },
          name: {
            get: function get2() {
              return name;
            },
            set: void 0,
            enumerable: false,
            // configurable: false would accurately preserve the behavior of
            // the original, but I'm guessing that was not intentional.
            // For an actual error subclass, this property would
            // be configurable.
            configurable: true
          },
          toString: {
            value: function value() {
              return this.name + ": " + this.message;
            },
            writable: true,
            enumerable: false,
            configurable: true
          }
        });
        return CustomError;
      }
      util.newError = newError;
      util.ProtocolError = newError("ProtocolError");
      util.oneOfGetter = function getOneOf(fieldNames) {
        var fieldMap = {};
        for (var i = 0; i < fieldNames.length; ++i)
          fieldMap[fieldNames[i]] = 1;
        return function() {
          for (var keys = Object.keys(this), i2 = keys.length - 1; i2 > -1; --i2)
            if (fieldMap[keys[i2]] === 1 && this[keys[i2]] !== void 0 && this[keys[i2]] !== null)
              return keys[i2];
        };
      };
      util.oneOfSetter = function setOneOf(fieldNames) {
        return function(name) {
          for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
              delete this[fieldNames[i]];
        };
      };
      util.toJSONOptions = {
        longs: String,
        enums: String,
        bytes: String,
        json: true
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer.js
  var require_writer = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer.js"(exports, module) {
      "use strict";
      module.exports = Writer;
      var util = require_minimal();
      var BufferWriter;
      var LongBits = util.LongBits;
      var base64 = util.base64;
      var utf8 = util.utf8;
      function Writer() {
        this.pos = 0;
        this.buf = this.constructor.alloc(Writer.initialBufferSize);
        this.view = null;
        this.states = null;
      }
      Writer.initialBufferSize = 128;
      Object.defineProperty(Writer.prototype, "len", {
        configurable: true,
        enumerable: true,
        get: function get_len() {
          return this.pos;
        }
      });
      var create = function create2() {
        return util.Buffer ? function create_buffer_setup() {
          return (Writer.create = function create_buffer() {
            return new BufferWriter();
          })();
        } : function create_array() {
          return new Writer();
        };
      };
      Writer.create = create();
      Writer.alloc = function alloc(size) {
        return new Uint8Array(size);
      };
      Writer.alloc = util.pool(Writer.alloc, Uint8Array.prototype.subarray);
      function sizeVarint32(value) {
        return value < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5;
      }
      Writer.prototype._reserve = function _reserve(n) {
        var need = this.pos + n;
        if (need > this.buf.length) {
          var size = this.buf.length << 1;
          if (size < need)
            size = need;
          var buf = this.constructor.alloc(size);
          buf.set(this.buf.subarray(0, this.pos), 0);
          this.buf = buf;
          this.view = null;
        }
      };
      function writeStringAscii(val, buf, pos) {
        for (var i = 0; i < val.length; )
          buf[pos++] = val.charCodeAt(i++);
      }
      function writeVarint32(val, buf, pos) {
        while (val > 127) {
          buf[pos++] = val & 127 | 128;
          val >>>= 7;
        }
        buf[pos] = val;
        return pos + 1;
      }
      Writer.prototype.uint32 = function write_uint32(value) {
        value = value >>> 0;
        this._reserve(5);
        var pos = this.pos;
        this.pos = writeVarint32(value, this.buf, pos);
        return this;
      };
      Writer.prototype.int32 = function write_int32(value) {
        if ((value |= 0) < 0) {
          this._reserve(10);
          writeVarint64(LongBits.fromNumber(value), this.buf, this.pos);
          this.pos += 10;
          return this;
        }
        return this.uint32(value);
      };
      Writer.prototype.sint32 = function write_sint32(value) {
        return this.uint32((value << 1 ^ value >> 31) >>> 0);
      };
      function writeVarint64(val, buf, pos) {
        var lo = val.lo, hi = val.hi;
        while (hi) {
          buf[pos++] = lo & 127 | 128;
          lo = (lo >>> 7 | hi << 25) >>> 0;
          hi >>>= 7;
        }
        while (lo > 127) {
          buf[pos++] = lo & 127 | 128;
          lo = lo >>> 7;
        }
        buf[pos] = lo;
        return pos + 1;
      }
      Writer.prototype.uint64 = function write_uint64(value) {
        var bits = LongBits.from(value);
        this._reserve(10);
        var pos = this.pos;
        this.pos = writeVarint64(bits, this.buf, pos);
        return this;
      };
      Writer.prototype.int64 = Writer.prototype.uint64;
      Writer.prototype.sint64 = function write_sint64(value) {
        var bits = LongBits.from(value).zzEncode();
        this._reserve(10);
        var pos = this.pos;
        this.pos = writeVarint64(bits, this.buf, pos);
        return this;
      };
      Writer.prototype.bool = function write_bool(value) {
        this._reserve(1);
        this.buf[this.pos++] = value ? 1 : 0;
        return this;
      };
      function writeFixed32(val, buf, pos) {
        buf[pos] = val & 255;
        buf[pos + 1] = val >>> 8 & 255;
        buf[pos + 2] = val >>> 16 & 255;
        buf[pos + 3] = val >>> 24;
      }
      Writer.prototype.fixed32 = function write_fixed32(value) {
        this._reserve(4);
        writeFixed32(value >>> 0, this.buf, this.pos);
        this.pos += 4;
        return this;
      };
      Writer.prototype.sfixed32 = Writer.prototype.fixed32;
      Writer.prototype.fixed64 = function write_fixed64(value) {
        var bits = LongBits.from(value);
        this._reserve(8);
        writeFixed32(bits.lo, this.buf, this.pos);
        writeFixed32(bits.hi, this.buf, this.pos + 4);
        this.pos += 8;
        return this;
      };
      Writer.prototype.sfixed64 = Writer.prototype.fixed64;
      Writer.prototype.float = function write_float(value) {
        this._reserve(4);
        util.float.writeFloatLE(value, this.buf, this.pos);
        this.pos += 4;
        return this;
      };
      Writer.prototype.double = function write_double(value) {
        this._reserve(8);
        util.float.writeDoubleLE(value, this.buf, this.pos);
        this.pos += 8;
        return this;
      };
      Writer.prototype.bytes = function write_bytes(value) {
        var len = value.length >>> 0;
        if (!len) {
          this._reserve(1);
          this.buf[this.pos++] = 0;
          return this;
        }
        if (util.isString(value)) {
          var buf = Writer.alloc(len = base64.length(value));
          base64.decode(value, buf, 0);
          value = buf;
        }
        this.uint32(len);
        this._reserve(len);
        this.buf.set(value, this.pos);
        this.pos += len;
        return this;
      };
      Writer.prototype.raw = function write_raw(value) {
        var len = value.length >>> 0;
        if (!len)
          return this;
        this._reserve(len);
        this.buf.set(value, this.pos);
        this.pos += len;
        return this;
      };
      Writer.prototype._delim = function _delim(pos, len) {
        var n = sizeVarint32(len);
        if (n > 1)
          this.buf.copyWithin(pos + n, pos + 1, pos + 1 + len);
        writeVarint32(len, this.buf, pos);
        this.pos = pos + n + len;
        return this;
      };
      Writer.prototype.string = function write_string(value) {
        var n = value.length;
        if (!n) {
          this._reserve(1);
          this.buf[this.pos++] = 0;
          return this;
        }
        if (n < 128) {
          this._reserve(n * 3 + 5);
          var lenPos = this.pos;
          return this._delim(lenPos, utf8.write(value, this.buf, lenPos + 1));
        }
        var len = utf8.length(value);
        this.uint32(len);
        this._reserve(len);
        if (len === value.length)
          writeStringAscii(value, this.buf, this.pos);
        else
          utf8.write(value, this.buf, this.pos);
        this.pos += len;
        return this;
      };
      Writer.prototype.uint32s = function write_uint32s(value) {
        var n = value.length;
        this._reserve(n * 5 + 5);
        var buf = this.buf, lenPos = this.pos, p = lenPos + 1;
        for (var i = 0; i < n; ++i)
          p = writeVarint32(value[i] >>> 0, buf, p);
        return this._delim(lenPos, p - lenPos - 1);
      };
      Writer.prototype.int32s = function write_int32s(value) {
        var n = value.length;
        this._reserve(n * 10 + 5);
        var buf = this.buf, lenPos = this.pos, pos = lenPos + 1, val;
        for (var i = 0; i < n; ++i) {
          if ((val = value[i] | 0) < 0) {
            pos = writeVarint64(LongBits.fromNumber(val), buf, pos);
          } else {
            pos = writeVarint32(val, buf, pos);
          }
        }
        return this._delim(lenPos, pos - lenPos - 1);
      };
      Writer.prototype.sint32s = function write_sint32s(value) {
        var n = value.length;
        this._reserve(n * 5 + 5);
        var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
        for (var i = 0; i < n; ++i)
          pos = writeVarint32((value[i] << 1 ^ value[i] >> 31) >>> 0, buf, pos);
        return this._delim(lenPos, pos - lenPos - 1);
      };
      Writer.prototype.uint64s = function write_uint64s(value) {
        var n = value.length;
        this._reserve(n * 10 + 5);
        var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
        for (var i = 0; i < n; ++i) {
          pos = writeVarint64(LongBits.from(value[i]), buf, pos);
        }
        return this._delim(lenPos, pos - lenPos - 1);
      };
      Writer.prototype.int64s = Writer.prototype.uint64s;
      Writer.prototype.sint64s = function write_sint64s(value) {
        var n = value.length;
        this._reserve(n * 10 + 5);
        var buf = this.buf, lenPos = this.pos, pos = lenPos + 1;
        for (var i = 0; i < n; ++i) {
          pos = writeVarint64(LongBits.from(value[i]).zzEncode(), buf, pos);
        }
        return this._delim(lenPos, pos - lenPos - 1);
      };
      Writer.prototype.bools = function write_bools(value) {
        var n = value.length;
        this.uint32(n);
        this._reserve(n);
        var buf = this.buf, p = this.pos;
        for (var i = 0; i < n; ++i)
          buf[p++] = value[i] ? 1 : 0;
        this.pos += n;
        return this;
      };
      var VIEW_THRESHOLD_FLOAT = 16;
      var VIEW_THRESHOLD_INT = 128;
      function getLazyView(writer, count, threshold) {
        var view = writer.view;
        if (view || count < threshold)
          return view;
        var buf = writer.buf;
        return writer.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      }
      Writer.prototype.fixed32s = function write_fixed32s(value) {
        var n = value.length, bytes = n * 4;
        this.uint32(bytes);
        this._reserve(bytes);
        var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_INT);
        if (dv)
          for (i = 0; i < n; ++i) {
            dv.setUint32(p, value[i] >>> 0, true);
            p += 4;
          }
        else {
          var buf = this.buf;
          for (i = 0; i < n; ++i) {
            writeFixed32(value[i] >>> 0, buf, p);
            p += 4;
          }
        }
        this.pos += bytes;
        return this;
      };
      Writer.prototype.sfixed32s = Writer.prototype.fixed32s;
      Writer.prototype.fixed64s = function write_fixed64s(value) {
        var n = value.length, bytes = n * 8;
        this.uint32(bytes);
        this._reserve(bytes);
        var p = this.pos, i, bits, dv = getLazyView(this, n, VIEW_THRESHOLD_INT);
        if (dv)
          for (i = 0; i < n; ++i) {
            bits = LongBits.from(value[i]);
            dv.setUint32(p, bits.lo, true);
            dv.setUint32(p + 4, bits.hi, true);
            p += 8;
          }
        else {
          var buf = this.buf;
          for (i = 0; i < n; ++i) {
            bits = LongBits.from(value[i]);
            writeFixed32(bits.lo, buf, p);
            writeFixed32(bits.hi, buf, p + 4);
            p += 8;
          }
        }
        this.pos += bytes;
        return this;
      };
      Writer.prototype.sfixed64s = Writer.prototype.fixed64s;
      Writer.prototype.floats = function write_floats(value) {
        var n = value.length, bytes = n * 4;
        this.uint32(bytes);
        this._reserve(bytes);
        var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_FLOAT);
        if (dv)
          for (i = 0; i < n; ++i) {
            dv.setFloat32(p, value[i], true);
            p += 4;
          }
        else {
          var buf = this.buf;
          for (i = 0; i < n; ++i) {
            util.float.writeFloatLE(value[i], buf, p);
            p += 4;
          }
        }
        this.pos += bytes;
        return this;
      };
      Writer.prototype.doubles = function write_doubles(value) {
        var n = value.length, bytes = n * 8;
        this.uint32(bytes);
        this._reserve(bytes);
        var p = this.pos, i, dv = getLazyView(this, n, VIEW_THRESHOLD_FLOAT);
        if (dv)
          for (i = 0; i < n; ++i) {
            dv.setFloat64(p, value[i], true);
            p += 8;
          }
        else {
          var buf = this.buf;
          for (i = 0; i < n; ++i) {
            util.float.writeDoubleLE(value[i], buf, p);
            p += 8;
          }
        }
        this.pos += bytes;
        return this;
      };
      Writer.prototype.fork = function fork() {
        this._reserve(1);
        (this.states || (this.states = [])).push(this.pos);
        this.pos += 1;
        return this;
      };
      Writer.prototype.reset = function reset() {
        var states = this.states;
        if (states && states.length) {
          this.pos = states.pop();
        } else {
          this.pos = 0;
        }
        return this;
      };
      Writer.prototype.ldelim = function ldelim() {
        var states = this.states, len, vlen;
        if (states && states.length) {
          var lenPos = states.pop();
          len = this.pos - lenPos - 1;
          vlen = sizeVarint32(len);
          if (vlen > 1) {
            this._reserve(vlen - 1);
            this.buf.copyWithin(lenPos + vlen, lenPos + 1, lenPos + 1 + len);
            this.pos += vlen - 1;
            writeVarint32(len, this.buf, lenPos);
          } else {
            this.buf[lenPos] = len;
          }
        } else {
          len = this.pos;
          vlen = sizeVarint32(len);
          this._reserve(vlen);
          this.buf.copyWithin(vlen, 0, len);
          writeVarint32(len, this.buf, 0);
          this.pos += vlen;
        }
        return this;
      };
      Writer.prototype.finish = function finish(shared) {
        if (shared)
          return this.buf.subarray(0, this.pos);
        var buf = this.constructor.alloc(this.pos);
        buf.set(this.buf.subarray(0, this.pos), 0);
        return buf;
      };
      Writer.prototype.finishInto = function finishInto(buf, offset) {
        if (offset === void 0)
          offset = 0;
        buf.set(this.buf.subarray(0, this.pos), offset);
        return buf;
      };
      Writer._configure = function(BufferWriter_) {
        BufferWriter = BufferWriter_;
        Writer.create = create();
        BufferWriter._configure();
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer_buffer.js
  var require_writer_buffer = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer_buffer.js"(exports, module) {
      "use strict";
      module.exports = BufferWriter;
      var Writer = require_writer();
      BufferWriter.prototype = Object.create(Writer.prototype, {
        constructor: {
          value: BufferWriter,
          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      var util = require_minimal();
      function BufferWriter() {
        Writer.call(this);
      }
      var writeStringBuffer;
      BufferWriter._configure = function() {
        BufferWriter.alloc = util.Buffer && util.Buffer.allocUnsafe;
        writeStringBuffer = util.Buffer && util.Buffer.prototype.utf8Write ? function writeStringBuffer_utf8Write(val, buf, pos) {
          return buf.utf8Write(val, pos);
        } : function writeStringBuffer_write(val, buf, pos) {
          return buf.write(val, pos);
        };
      };
      BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
        if (util.isString(value))
          value = util.Buffer.from(value, "base64");
        var len = value.length >>> 0;
        this.uint32(len);
        if (len) {
          this._reserve(len);
          this.buf.set(value, this.pos);
          this.pos += len;
        }
        return this;
      };
      BufferWriter.prototype.string = function write_string_buffer(value) {
        var n = value.length;
        if (!n) {
          this._reserve(1);
          this.buf[this.pos++] = 0;
          return this;
        }
        if (n < 128) {
          this._reserve(n * 3 + 5);
          var pos = this.pos, buf = this.buf;
          return this._delim(
            pos,
            n < 40 ? util.utf8.write(value, buf, pos + 1) : writeStringBuffer(value, buf, pos + 1)
          );
        }
        var len = util.Buffer.byteLength(value);
        this.uint32(len);
        this._reserve(len);
        writeStringBuffer(value, this.buf, this.pos);
        this.pos += len;
        return this;
      };
      BufferWriter._configure();
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader.js
  var require_reader = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader.js"(exports, module) {
      "use strict";
      module.exports = Reader;
      var util = require_minimal();
      var BufferReader;
      var LongBits = util.LongBits;
      var utf8 = util.utf8;
      function indexOutOfRange(reader, writeLength) {
        return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
      }
      function Reader(buffer) {
        this.buf = buffer;
        this.pos = 0;
        this.len = buffer.length;
        this.view = null;
        this.discardUnknown = Reader.discardUnknown;
      }
      function create_array(buffer) {
        if (Array.isArray(buffer))
          buffer = new Uint8Array(buffer);
        if (buffer instanceof Uint8Array)
          return new Reader(buffer);
        throw Error("illegal buffer");
      }
      var create = function create2() {
        return util.Buffer ? function create_buffer_setup(buffer) {
          return (Reader.create = function create_buffer(buffer2) {
            return util.Buffer.isBuffer(buffer2) ? new BufferReader(buffer2) : create_array(buffer2);
          })(buffer);
        } : create_array;
      };
      Reader.create = create();
      Reader.prototype.raw = function read_raw(start, end) {
        return this.buf.subarray(start, end);
      };
      function readVarint32NearEnd(reader) {
        var value = 0;
        for (var i = 0; i < 4; ++i) {
          if (reader.pos >= reader.len)
            throw indexOutOfRange(reader);
          var b = reader.buf[reader.pos++];
          value = (value | (b & 127) << i * 7) >>> 0;
          if (b < 128)
            return value;
        }
        throw indexOutOfRange(reader);
      }
      Reader.prototype.uint32 = function read_uint32() {
        if (this.len - this.pos < 5) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          if (this.buf[this.pos] >= 128)
            return readVarint32NearEnd(this);
        }
        var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 7) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 14) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 21) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 15) << 28) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        for (var i = 0; i < 5; ++i) {
          if (pos >= this.len) {
            this.pos = pos;
            throw indexOutOfRange(this);
          }
          if (buf[pos++] < 128) {
            this.pos = pos;
            return value;
          }
        }
        this.pos = pos;
        throw Error("invalid varint encoding");
      };
      Reader.prototype.tag = function read_tag() {
        if (this.len - this.pos < 5) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          if (this.buf[this.pos] >= 128)
            return readVarint32NearEnd(this);
        }
        var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 7) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 14) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 21) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 15) << 28) >>> 0;
        if (buf[pos] < 128 && (buf[pos] & 112) === 0) {
          this.pos = pos + 1;
          return value;
        }
        this.pos = pos + 1;
        throw Error("invalid tag encoding");
      };
      Reader.prototype.size = function read_size() {
        if (this.len - this.pos < 5) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          if (this.buf[this.pos] >= 128)
            return readVarint32NearEnd(this);
        }
        var buf = this.buf, pos = this.pos, value = (buf[pos] & 127) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 7) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 14) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        value = (value | (buf[pos] & 127) << 21) >>> 0;
        if (buf[pos++] < 128) {
          this.pos = pos;
          return value;
        }
        this.pos = pos + 1;
        if (buf[pos] > 7)
          throw Error("invalid length encoding");
        return (value | buf[pos] << 28) >>> 0;
      };
      Reader.prototype.int32 = function read_int32() {
        return this.uint32() | 0;
      };
      Reader.prototype.sint32 = function read_sint32() {
        var value = this.uint32();
        return value >>> 1 ^ -(value & 1) | 0;
      };
      function readLongVarint() {
        var bits = new LongBits(0, 0);
        var i = 0;
        if (this.len - this.pos > 4) {
          for (; i < 4; ++i) {
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
          i = 0;
        } else {
          for (; i < 4; ++i) {
            if (this.pos >= this.len)
              throw indexOutOfRange(this);
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
          throw indexOutOfRange(this);
        }
        if (this.len - this.pos > 4) {
          for (; i < 5; ++i) {
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
        } else {
          for (; i < 5; ++i) {
            if (this.pos >= this.len)
              throw indexOutOfRange(this);
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
        }
        throw Error("invalid varint encoding");
      }
      Reader.prototype.bool = function read_bool() {
        var value = false, b;
        for (var i = 0; i < 10; ++i) {
          if (this.pos >= this.len)
            throw indexOutOfRange(this);
          b = this.buf[this.pos++];
          if (b & 127)
            value = true;
          if (b < 128)
            return value;
        }
        throw Error("invalid varint encoding");
      };
      function readFixed32_end(buf, end) {
        return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
      }
      Reader.prototype.fixed32 = function read_fixed32() {
        if (this.pos + 4 > this.len)
          throw indexOutOfRange(this, 4);
        return readFixed32_end(this.buf, this.pos += 4);
      };
      Reader.prototype.sfixed32 = function read_sfixed32() {
        if (this.pos + 4 > this.len)
          throw indexOutOfRange(this, 4);
        return readFixed32_end(this.buf, this.pos += 4) | 0;
      };
      function readFixed64() {
        if (this.pos + 8 > this.len)
          throw indexOutOfRange(this, 8);
        return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
      }
      Reader.prototype.float = function read_float() {
        if (this.pos + 4 > this.len)
          throw indexOutOfRange(this, 4);
        var value = util.float.readFloatLE(this.buf, this.pos);
        this.pos += 4;
        return value;
      };
      Reader.prototype.double = function read_double() {
        if (this.pos + 8 > this.len)
          throw indexOutOfRange(this, 4);
        var value = util.float.readDoubleLE(this.buf, this.pos);
        this.pos += 8;
        return value;
      };
      Reader.prototype.uint32s = function read_uint32s(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len, buf = this.buf, pos = this.pos, value;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (pos < end) {
          value = buf[pos++];
          if (value < 128)
            array.push(value);
          else {
            this.pos = pos - 1;
            array.push(this.uint32());
            pos = this.pos;
          }
        }
        this.pos = pos;
        if (pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      Reader.prototype.int32s = function read_int32s(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len, buf = this.buf, pos = this.pos, value;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (pos < end) {
          value = buf[pos++];
          if (value < 128)
            array.push(value);
          else {
            this.pos = pos - 1;
            array.push(this.int32());
            pos = this.pos;
          }
        }
        this.pos = pos;
        if (pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      Reader.prototype.sint32s = function read_sint32s(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (this.pos < end)
          array.push(this.sint32());
        if (this.pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      Reader.prototype.bools = function read_bools(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len, buf = this.buf, pos = this.pos, value;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (pos < end) {
          value = buf[pos++];
          if (value < 128)
            array.push(value !== 0);
          else {
            this.pos = pos - 1;
            array.push(this.bool());
            pos = this.pos;
          }
        }
        this.pos = pos;
        if (pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      var VIEW_THRESHOLD_FLOAT = 8;
      var VIEW_THRESHOLD_INT = 128;
      function getLazyView(reader, count, threshold) {
        var view = reader.view;
        if (view || count < threshold)
          return view;
        var buf = reader.buf;
        return reader.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      }
      Reader.prototype.fixed32s = function read_fixed32s(array) {
        if (array === void 0) array = [];
        var len = this.size(), end = this.pos + len;
        if (end > this.len) throw indexOutOfRange(this, len);
        var count = len >>> 2, i = array.length, pos = this.pos;
        array.length = i + count;
        var dv = getLazyView(this, count, VIEW_THRESHOLD_INT);
        if (dv)
          for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getUint32(pos, true);
        else {
          var buf = this.buf;
          for (var j = 0; j < count; ++j, pos += 4) array[i++] = readFixed32_end(buf, pos + 4);
        }
        this.pos = pos;
        if (pos !== end) throw indexOutOfRange(this, 4);
        return array;
      };
      Reader.prototype.sfixed32s = function read_sfixed32s(array) {
        if (array === void 0) array = [];
        var len = this.size(), end = this.pos + len;
        if (end > this.len) throw indexOutOfRange(this, len);
        var count = len >>> 2, i = array.length, pos = this.pos;
        array.length = i + count;
        var dv = getLazyView(this, count, VIEW_THRESHOLD_INT);
        if (dv)
          for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getInt32(pos, true);
        else {
          var buf = this.buf;
          for (var j = 0; j < count; ++j, pos += 4) array[i++] = readFixed32_end(buf, pos + 4) | 0;
        }
        this.pos = pos;
        if (pos !== end) throw indexOutOfRange(this, 4);
        return array;
      };
      Reader.prototype.floats = function read_floats(array) {
        if (array === void 0) array = [];
        var len = this.size(), end = this.pos + len;
        if (end > this.len) throw indexOutOfRange(this, len);
        var count = len >>> 2, i = array.length, pos = this.pos;
        array.length = i + count;
        var dv = getLazyView(this, count, VIEW_THRESHOLD_FLOAT);
        if (dv)
          for (var k = 0; k < count; ++k, pos += 4) array[i++] = dv.getFloat32(pos, true);
        else {
          var buf = this.buf;
          for (var j = 0; j < count; ++j, pos += 4) array[i++] = util.float.readFloatLE(buf, pos);
        }
        this.pos = pos;
        if (pos !== end) throw indexOutOfRange(this, 4);
        return array;
      };
      Reader.prototype.doubles = function read_doubles(array) {
        if (array === void 0) array = [];
        var len = this.size(), end = this.pos + len;
        if (end > this.len) throw indexOutOfRange(this, len);
        var count = len >>> 3, i = array.length, pos = this.pos;
        array.length = i + count;
        var dv = getLazyView(this, count, VIEW_THRESHOLD_FLOAT);
        if (dv)
          for (var k = 0; k < count; ++k, pos += 8) array[i++] = dv.getFloat64(pos, true);
        else {
          var buf = this.buf;
          for (var j = 0; j < count; ++j, pos += 8) array[i++] = util.float.readDoubleLE(buf, pos);
        }
        this.pos = pos;
        if (pos !== end) throw indexOutOfRange(this, 8);
        return array;
      };
      Reader.prototype.uint64s = function read_uint64s(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (this.pos < end)
          array.push(this.uint64());
        if (this.pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      Reader.prototype.int64s = function read_int64s(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (this.pos < end)
          array.push(this.int64());
        if (this.pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      Reader.prototype.sint64s = function read_sint64s(array) {
        if (array === void 0) array = [];
        var end = this.size() + this.pos, len = this.len;
        if (end > len) throw indexOutOfRange(this, end - this.pos);
        this.len = end;
        while (this.pos < end)
          array.push(this.sint64());
        if (this.pos !== end) throw RangeError("index out of range");
        this.len = len;
        return array;
      };
      Reader.prototype.fixed64s = function read_fixed64s(array) {
        if (array === void 0) array = [];
        var len = this.size(), end = this.pos + len, i = array.length;
        if (end > this.len) throw indexOutOfRange(this, len);
        var count = len >>> 3;
        array.length = i + count;
        for (var j = 0; j < count; ++j)
          array[i++] = this.fixed64();
        if (this.pos !== end) throw indexOutOfRange(this, 8);
        return array;
      };
      Reader.prototype.sfixed64s = function read_sfixed64s(array) {
        if (array === void 0) array = [];
        var len = this.size(), end = this.pos + len, i = array.length;
        if (end > this.len) throw indexOutOfRange(this, len);
        var count = len >>> 3;
        array.length = i + count;
        for (var j = 0; j < count; ++j)
          array[i++] = this.sfixed64();
        if (this.pos !== end) throw indexOutOfRange(this, 8);
        return array;
      };
      Reader.prototype.bytes = function read_bytes() {
        var length = this.size(), start = this.pos, end = this.pos + length;
        if (end > this.len)
          throw indexOutOfRange(this, length);
        this.pos = end;
        return this.raw(start, end);
      };
      Reader.prototype.string = function read_string() {
        var length = this.size(), start = this.pos, end = this.pos + length;
        if (end > this.len)
          throw indexOutOfRange(this, length);
        this.pos = end;
        return utf8.read(this.buf, start, end);
      };
      Reader.prototype.stringVerify = function read_string_verify() {
        var length = this.size(), start = this.pos, end = this.pos + length;
        if (end > this.len)
          throw indexOutOfRange(this, length);
        this.pos = end;
        return utf8.readStrict(this.buf, start, end);
      };
      Reader.prototype.skip = function skip(length) {
        if (typeof length === "number") {
          if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
          this.pos += length;
        } else {
          do {
            if (this.pos >= this.len)
              throw indexOutOfRange(this);
          } while (this.buf[this.pos++] & 128);
        }
        return this;
      };
      Reader.recursionLimit = util.recursionLimit;
      Reader.discardUnknown = true;
      Reader.prototype.skipType = function(wireType, depth, fieldNumber) {
        if (depth === void 0) depth = 0;
        if (depth > Reader.recursionLimit)
          throw Error("max depth exceeded");
        if (fieldNumber === 0)
          throw Error("illegal tag: field number 0");
        switch (wireType) {
          case 0:
            this.skip();
            break;
          case 1:
            this.skip(8);
            break;
          case 2:
            this.skip(this.size());
            break;
          case 3:
            while (true) {
              var tag = this.tag();
              var nestedField = tag >>> 3;
              wireType = tag & 7;
              if (!nestedField)
                throw Error("illegal tag: field number 0");
              if (wireType === 4) {
                if (fieldNumber !== void 0 && nestedField !== fieldNumber)
                  throw Error("invalid end group tag");
                break;
              }
              this.skipType(wireType, depth + 1, nestedField);
            }
            break;
          case 5:
            this.skip(4);
            break;
          /* istanbul ignore next */
          default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
        }
        return this;
      };
      Reader._configure = function(BufferReader_) {
        BufferReader = BufferReader_;
        Reader.create = create();
        BufferReader._configure();
        var fn = util.Long ? "toLong" : (
          /* istanbul ignore next */
          "toNumber"
        );
        util.merge(Reader.prototype, {
          int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
          },
          uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
          },
          sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
          },
          fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
          },
          sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
          }
        });
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader_buffer.js
  var require_reader_buffer = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader_buffer.js"(exports, module) {
      "use strict";
      module.exports = BufferReader;
      var Reader = require_reader();
      BufferReader.prototype = Object.create(Reader.prototype, {
        constructor: {
          value: BufferReader,
          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      var util = require_minimal();
      function BufferReader(buffer) {
        Reader.call(this, buffer);
      }
      BufferReader._configure = function() {
        if (util.Buffer)
          BufferReader.prototype._slice = util.Buffer.prototype.slice;
      };
      BufferReader.prototype.raw = function read_raw_buffer(start, end) {
        return this._slice.call(this.buf, start, end);
      };
      BufferReader.prototype.string = function read_string_buffer() {
        var len = this.size(), start = this.pos, end = this.pos + len;
        if (end > this.len)
          throw RangeError("index out of range: " + this.pos + " + " + len + " > " + this.len);
        this.pos = end;
        return this.buf.utf8Slice ? this.buf.utf8Slice(start, end) : this.buf.toString("utf-8", start, end);
      };
      BufferReader._configure();
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc/service.js
  var require_service = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc/service.js"(exports, module) {
      "use strict";
      module.exports = Service;
      var util = require_minimal();
      Service.prototype = Object.create(util.EventEmitter.prototype, {
        constructor: {
          value: Service,
          writable: true,
          enumerable: false,
          configurable: true
        }
      });
      function Service(rpcImpl, requestDelimited, responseDelimited) {
        if (typeof rpcImpl !== "function")
          throw TypeError("rpcImpl must be a function");
        util.EventEmitter.call(this);
        this.rpcImpl = rpcImpl;
        this.requestDelimited = Boolean(requestDelimited);
        this.responseDelimited = Boolean(responseDelimited);
      }
      Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
        if (!request)
          throw TypeError("request must be specified");
        var self2 = this;
        if (!callback)
          return util.asPromise(rpcCall, self2, method, requestCtor, responseCtor, request);
        if (!self2.rpcImpl) {
          setTimeout(function() {
            callback(Error("already ended"));
          }, 0);
          return void 0;
        }
        try {
          return self2.rpcImpl(
            method,
            requestCtor[self2.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {
              if (err) {
                self2.emit("error", err, method);
                return callback(err);
              }
              if (response === null) {
                self2.end(
                  /* endedByRPC */
                  true
                );
                return void 0;
              }
              if (!(response instanceof responseCtor)) {
                try {
                  response = responseCtor[self2.responseDelimited ? "decodeDelimited" : "decode"](response);
                } catch (err2) {
                  self2.emit("error", err2, method);
                  return callback(err2);
                }
              }
              self2.emit("data", response, method);
              return callback(null, response);
            }
          );
        } catch (err) {
          self2.emit("error", err, method);
          setTimeout(function() {
            callback(err);
          }, 0);
          return void 0;
        }
      };
      Service.prototype.end = function end(endedByRPC) {
        if (this.rpcImpl) {
          if (!endedByRPC)
            this.rpcImpl(null, null, null);
          this.rpcImpl = null;
          this.emit("end").off();
        }
        return this;
      };
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc.js
  var require_rpc = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc.js"(exports) {
      "use strict";
      var rpc = exports;
      rpc.Service = require_service();
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/roots.js
  var require_roots = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/roots.js"(exports, module) {
      "use strict";
      module.exports = /* @__PURE__ */ Object.create(null);
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/index-minimal.js
  var require_index_minimal = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/index-minimal.js"(exports) {
      "use strict";
      exports.build = "minimal";
      exports.Writer = require_writer();
      exports.BufferWriter = require_writer_buffer();
      exports.Reader = require_reader();
      exports.BufferReader = require_reader_buffer();
      exports.util = require_minimal();
      exports.rpc = require_rpc();
      exports.roots = require_roots();
      exports.configure = configure;
      function configure() {
        exports.util.LongBits._configure(exports.util.Long);
        exports.Writer._configure(exports.BufferWriter);
        exports.Reader._configure(exports.BufferReader);
      }
      configure();
    }
  });

  // node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/minimal.js
  var require_minimal2 = __commonJS({
    "node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/minimal.js"(exports, module) {
      "use strict";
      module.exports = require_index_minimal();
    }
  });

  // node_modules/.pnpm/sparse-array-rled@2.0.1/node_modules/sparse-array-rled/build/esm/util.js
  function checkIndex(index, desc = "index") {
    if (!Number.isSafeInteger(index) || index < 0) {
      throw new Error(`Invalid ${desc}: ${index}`);
    }
  }

  // node_modules/.pnpm/sparse-array-rled@2.0.1/node_modules/sparse-array-rled/build/esm/sparse_items.js
  var PresentNode = class {
    constructor() {
      this.next = null;
    }
  };
  var DeletedNode = class _DeletedNode {
    constructor(length) {
      this.length = length;
      this.next = null;
    }
    /**
     * Set this node to the first half in-place; return a new second half. Don't update next pointers.
     *
     * @param index 0 < index < length
     */
    splitContent(index) {
      const after = new _DeletedNode(this.length - index);
      this.length = index;
      return after;
    }
  };
  var SparseItems = class {
    /**
     * Constructs a SparseItems with the given state, performing no validation.
     *
     * Don't override this constructor.
     */
    constructor(start) {
      this.next = null;
      this.next = start;
    }
    /**
     * The greatest present index in the array plus 1, or 0 if there are no
     * present values.
     *
     * All methods accept index arguments `>= this.length`, acting as if
     * the array ends with infinitely many deleted indices (empty slots).
     *
     * Note: Unlike an ordinary `Array`, you cannot explicitly set the length.
     */
    get length() {
      if (this.next === null)
        return 0;
      let ans = 0;
      let current2 = this.next;
      for (; current2.next !== null; current2 = current2.next) {
        ans += current2.length;
      }
      if (current2 instanceof PresentNode)
        ans += current2.length;
      return ans;
    }
    /**
     * Returns the number of present values in the array.
     */
    count() {
      let count = 0;
      for (let current2 = this.next; current2 !== null; current2 = current2.next) {
        if (current2 instanceof PresentNode) {
          count += current2.length;
        }
      }
      return count;
    }
    /**
     * @ignore Internal optimized combination of `countAt` and `has`.
     *
     * @throws If `index < 0`. (It is okay for index to exceed `this.length`.)
     */
    _countHas(index) {
      checkIndex(index);
      let count = 0;
      let remaining = index;
      for (let current2 = this.next; current2 !== null; current2 = current2.next) {
        if (remaining < current2.length) {
          if (current2 instanceof PresentNode) {
            count += remaining;
            return [count, true];
          } else
            return [count, false];
        }
        if (current2 instanceof PresentNode)
          count += current2.length;
        remaining -= current2.length;
      }
      return [count, false];
    }
    /**
     * Returns the count at index.
     *
     * The "count at index" is the number of present values up to but excluding index.
     * Equivalently, it is the `c` such that index is
     * the `c`-th present value (or would be if present).
     *
     * Invert with indexOfCount.
     *
     * @throws If `index < 0`. (It is okay for index to exceed `this.length`.)
     */
    countAt(index) {
      return this._countHas(index)[0];
    }
    /**
     * Returns whether the array has no present values.
     */
    isEmpty() {
      return this.next === null || this.next instanceof DeletedNode && this.next.next === null;
    }
    /**
     * @ignore Internal templated version of `get`.
     *
     * Returns the value at index, in the form [item, offset within item],
     * or null if not present.
     *
     * **Warning:** item is aliased with our internal state. It must not be
     * mutated and may mutate unexpectedly.
     *
     * @throws If `index < 0`. (It is okay for index to exceed `this.length`.)
     */
    _get(index) {
      checkIndex(index);
      let remaining = index;
      for (let current2 = this.next; current2 !== null; current2 = current2.next) {
        if (remaining < current2.length) {
          if (current2 instanceof DeletedNode)
            return null;
          else
            return [current2.item, remaining];
        }
        remaining -= current2.length;
      }
      return null;
    }
    /**
     * Returns whether index is present in the array.
     *
     * @throws If `index < 0`. (It is okay for index to exceed `this.length`.)
     */
    has(index) {
      return this._get(index) !== null;
    }
    /**
     * Finds the index corresponding to the given count.
     *
     * That is, we advance through the array
     * until reaching the `count`-th present value, returning its index.
     * If the array ends before finding such a value, returns -1.
     *
     * Invert with countAt.
     *
     * @param startIndex Index to start searching. If specified, only indices >= startIndex
     * contribute towards `count`.
     *
     * @throws If `count < 0` or `startIndex < 0`. (It is okay for startIndex to exceed `this.length`.)
     */
    indexOfCount(count, startIndex = 0) {
      checkIndex(count, "count");
      checkIndex(startIndex, "startIndex");
      if (this.next === null)
        return -1;
      const [node, offset, outside] = locate(this.next, startIndex);
      if (outside)
        return -1;
      if (node instanceof PresentNode)
        count += offset;
      let index = startIndex - offset;
      let countRemaining = count;
      for (let current2 = node; current2 !== null; current2 = current2.next) {
        if (current2 instanceof PresentNode) {
          if (countRemaining < current2.length) {
            return index + countRemaining;
          }
          countRemaining -= current2.length;
        }
        index += current2.length;
      }
      return -1;
    }
    /**
     * Returns a "slicer" that enumerates slices of the array in order.
     */
    newSlicer() {
      return new PairSlicer(this.next);
    }
    /**
     * Iterates over the present indices (keys), in order.
     */
    *keys() {
      let index = 0;
      for (let current2 = this.next; current2 !== null; current2 = current2.next) {
        if (current2 instanceof PresentNode) {
          for (let j = 0; j < current2.length; j++) {
            yield index + j;
          }
        }
        index += current2.length;
      }
    }
    /**
     * Iterates over the present items, in order.
     *
     * Each item [index, values] indicates a run of present values starting at index,
     * ending at either a deleted index or a value that cannot be merged with the run.
     */
    *items() {
      let index = 0;
      for (let current2 = this.next; current2 !== null; current2 = current2.next) {
        if (current2 instanceof PresentNode) {
          yield [index, current2.sliceItem()];
        }
        index += current2.length;
      }
    }
    /**
     * Returns a shallow copy of this array.
     */
    clone() {
      if (this.next === null)
        return this.construct(null);
      const startCloned = this.cloneNode(this.next);
      let currentCloned = startCloned;
      for (let current2 = this.next; current2.next !== null; current2 = current2.next) {
        const nextCloned = this.cloneNode(current2.next);
        currentCloned.next = nextCloned;
        currentCloned = nextCloned;
      }
      return this.construct(startCloned);
    }
    /**
     * Clones node's content while leaving next = null.
     */
    cloneNode(node) {
      if (node instanceof PresentNode) {
        return this.newNode(node.sliceItem());
      } else
        return new DeletedNode(node.length);
    }
    /**
     * Returns a compact JSON-serializable representation of our state.
     *
     * It consists of items (indicating present values) and numbers
     * (indicating deletions). It is normalized so that entries are
     * always nontrivial and cannot be merged with their neighbors.
     */
    serialize() {
      if (this.next === null)
        return [];
      const savedState = [];
      let current2 = this.next;
      for (; current2.next !== null; current2 = current2.next) {
        if (current2 instanceof PresentNode) {
          savedState.push(current2.sliceItem());
        } else {
          savedState.push(current2.length);
        }
      }
      if (current2 instanceof PresentNode) {
        savedState.push(current2.sliceItem());
      }
      return savedState;
    }
    toString() {
      return JSON.stringify(this.serialize());
    }
    /**
     * Deletes count values starting at index.
     *
     * That is, deletes all values in the range [index, index + count).
     *
     * @returns A sparse array of the previous values.
     * Index 0 in the returned array corresponds to `index` in this array.
     *
     * @throws If `index < 0` or `count < 0`. (It is okay if the range extends beyond `this.length`.)
     */
    delete(index, count = 1) {
      checkIndex(count, "count");
      return this.overwrite(index, new DeletedNode(count));
    }
    /**
     * @ignore Internal templated version of `set`.
     *
     * Sets values starting at index.
     *
     * That is, sets all values in the range [index, index + item.length) to the
     * given values.
     *
     * @returns A sparse array of the previous values.
     * Index 0 in the returned array corresponds to `index` in this array.
     *
     * @throws If `index < 0`. (It is okay if the range extends beyond `this.length`.)
     */
    _set(index, item) {
      return this.overwrite(index, this.newNode(item));
    }
    overwrite(index, node) {
      checkIndex(index);
      if (node.length === 0)
        return this.construct(null);
      if (this.next === null) {
        this.next = new DeletedNode(index + node.length);
      }
      if (this.next.next === null && this.next.length === index) {
        if (node instanceof PresentNode)
          append(this.next, node);
        return this.construct(null);
      }
      const beforeLeft = index === 0 ? this : createSplit(this.next, index);
      if (beforeLeft.next === null) {
        append(beforeLeft, node);
        return this.construct(null);
      }
      const afterLeft = beforeLeft.next;
      const beforeRight = createSplit(beforeLeft.next, node.length);
      const afterRight = beforeRight.next;
      beforeLeft.next = null;
      const appendedNode = append(beforeLeft, node);
      if (afterRight === null)
        appendedNode.next = null;
      else {
        const appendedAfterRight = append(appendedNode, afterRight);
        appendedAfterRight.next = afterRight.next;
      }
      beforeRight.next = null;
      return this.construct(afterLeft);
    }
  };
  function createSplit(start, delta) {
    let [left, leftOffset, leftOutside] = locate(start, delta);
    if (leftOutside) {
      left = append(left, new DeletedNode(leftOffset - left.length));
    } else
      split(left, leftOffset);
    return left;
  }
  function locate(start, delta) {
    let current2 = start;
    let remaining = delta;
    for (; current2.next !== null; current2 = current2.next) {
      if (remaining <= current2.length) {
        return [current2, remaining, false];
      }
      remaining -= current2.length;
    }
    return [current2, remaining, remaining > current2.length];
  }
  function append(before, after) {
    if (before instanceof PresentNode && after instanceof PresentNode) {
      const success = before.tryMergeContent(after);
      if (success)
        return before;
    } else if (before instanceof DeletedNode && after instanceof DeletedNode) {
      before.length += after.length;
      return before;
    }
    before.next = after;
    return after;
  }
  function split(node, offset) {
    if (offset !== node.length) {
      const after = node.splitContent(offset);
      after.next = node.next;
      node.next = after;
    }
  }
  var PairSlicer = class {
    constructor(current2) {
      this.current = current2;
      this.currentIndex = 0;
      this.offset = 0;
      this.prevEnd = 0;
    }
    nextSlice(endIndex) {
      if (endIndex !== null) {
        if (!Number.isSafeInteger(endIndex) || this.prevEnd === null || endIndex < this.prevEnd) {
          throw new Error(`Invalid endIndex: ${endIndex} (previous endIndex: ${this.prevEnd})`);
        }
      }
      this.prevEnd = endIndex;
      const ret = [];
      while (this.current !== null) {
        if (endIndex !== null && endIndex <= this.currentIndex)
          return ret;
        const currentEnd = this.currentIndex + this.current.length;
        if (endIndex === null || endIndex >= currentEnd) {
          if (this.current instanceof PresentNode) {
            ret.push([
              this.currentIndex + this.offset,
              // Always slice, to prevent exposing internal items.
              this.current.sliceItem(this.offset)
            ]);
          }
          this.currentIndex += this.current.length;
          this.current = this.current.next;
          this.offset = 0;
        } else {
          const endOffset = endIndex - this.currentIndex;
          if (endOffset > this.offset) {
            if (this.current instanceof PresentNode) {
              ret.push([
                this.currentIndex + this.offset,
                this.current.sliceItem(this.offset, endOffset)
              ]);
            }
            this.offset = endOffset;
          }
          return ret;
        }
      }
      return ret;
    }
  };

  // node_modules/.pnpm/sparse-array-rled@2.0.1/node_modules/sparse-array-rled/build/esm/sparse_indices.js
  var SparseIndices = class _SparseIndices extends SparseItems {
    // So list-positions can refer to unbound versions, we avoid using
    // "this" in static methods.
    /**
     * Returns a new, empty SparseIndices.
     */
    static new() {
      return new _SparseIndices(null);
    }
    /**
     * Returns a new SparseIndices by deserializing the given state
     * from `SparseIndices.serialize`.
     *
     * @throws If the serialized form is invalid (see `SparseIndices.serialize`).
     */
    static deserialize(serialized) {
      const startHolder = { next: null };
      let previous = startHolder;
      for (let i = 0; i < serialized.length; i++) {
        const maybeItem = serialized[i];
        if (!Number.isSafeInteger(maybeItem) || maybeItem < 0) {
          throw new Error(`Invalid ${i % 2 === 0 ? "present" : "delete"} count at serialized[${i}]: ${maybeItem}`);
        }
        if (maybeItem === 0)
          continue;
        let node;
        if (i % 2 === 1) {
          node = new DeletedNode(maybeItem);
        } else {
          node = new NumberNode(maybeItem);
        }
        previous = append(previous, node);
      }
      return new _SparseIndices(startHolder.next);
    }
    /**
     * Returns a compact JSON representation of our state.
     *
     * See SerializedSparseIndices for a description of the format.
     */
    serialize() {
      const savedState = [];
      let previousEndIndex = 0;
      for (const [index, count] of this.items()) {
        if (savedState.length === 0) {
          if (index === 0)
            savedState.push(count);
          else
            savedState.push(0, index, count);
        } else
          savedState.push(index - previousEndIndex, count);
        previousEndIndex = index + count;
      }
      return savedState;
    }
    newSlicer() {
      return super.newSlicer();
    }
    /**
     * Iterates over the present items, in order.
     *
     * Each item [index, count] indicates a run of `count` present values starting at index,
     * ending at a deleted index.
     */
    items() {
      return super.items();
    }
    /**
     * Sets values to be present, starting at index.
     *
     * That is, sets all values in the range [index, index + count) to be present.
     *
     * @returns A SparseIndices describing the previous values' presence.
     * Index 0 in the returned array corresponds to `index` in this array.
     */
    set(index, count = 1) {
      return this._set(index, count);
    }
    construct(start) {
      return new _SparseIndices(start);
    }
    newNode(item) {
      return new NumberNode(item);
    }
  };
  var NumberNode = class _NumberNode extends PresentNode {
    constructor(item) {
      super();
      this.item = item;
    }
    get length() {
      return this.item;
    }
    splitContent(index) {
      const after = new _NumberNode(this.item - index);
      this.item = index;
      return after;
    }
    tryMergeContent(other) {
      this.item += other.item;
      return true;
    }
    sliceItem(start, end) {
      return (end ?? this.item) - (start ?? 0);
    }
  };

  // packages/articulated/src/vendor/functional-red-black-tree.ts
  var RED = 0;
  var BLACK = 1;
  var RBNode = class {
    constructor(color, key, value, left, right) {
      this.color = color;
      this.key = key;
      this.value = value;
      this.left = left;
      this.right = right;
    }
  };
  function cloneNode(node) {
    return new RBNode(node.color, node.key, node.value, node.left, node.right);
  }
  function repaint(color, node) {
    return new RBNode(color, node.key, node.value, node.left, node.right);
  }
  var RedBlackTree = class _RedBlackTree {
    constructor(compare, root) {
      this.compare = compare;
      this.root = root;
    }
    /**
     * Creates an empty red-black tree.
     *
     * @param compare Comparison function, same semantics as array.sort().
     * @returns An empty tree ordered by `compare`.
     */
    static new(compare) {
      return new _RedBlackTree(compare, null);
    }
    /** Build once from strictly ordered entries without persistent path copies.
     * Entries are not retained. Subsequent updates use the normal persistent API.
     */
    static fromSorted(compare, entries) {
      for (let i = 1; i < entries.length; i++) {
        if (!(compare(entries[i - 1][0], entries[i][0]) < 0))
          throw new Error("Expected strictly increasing red-black tree keys");
      }
      let redLevel = 0;
      for (let remaining = entries.length; remaining > 0; ) {
        redLevel++;
        remaining = Math.floor((remaining - 1) / 2);
      }
      function build(lo, hi, level) {
        if (lo >= hi) return null;
        const mid = lo + Math.floor((hi - lo) / 2);
        const [key, value] = entries[mid];
        return new RBNode(
          level === redLevel ? RED : BLACK,
          key,
          value,
          build(lo, mid, level + 1),
          build(mid + 1, hi, level + 1)
        );
      }
      return new _RedBlackTree(compare, build(0, entries.length, 0));
    }
    /**
     * Creates a new tree with `key` set to `value`, overwriting any
     * existing value.
     *
     * @param key The key of the item to insert.
     * @param value The value of the item to insert.
     * @returns A new tree with `key` set to `value`.
     */
    set(key, value) {
      const cmp = this.compare;
      let n = this.root;
      const n_stack = [];
      const d_stack = [];
      let d = 0;
      while (n) {
        d = cmp(key, n.key);
        n_stack.push(n);
        d_stack.push(d);
        if (d === 0) break;
        else if (d < 0) {
          n = n.left;
        } else {
          n = n.right;
        }
      }
      const replace = d === 0 && n_stack.length > 0;
      if (replace) {
        const lastN = n_stack[n_stack.length - 1];
        if (lastN.key === key && lastN.value === value) return this;
        n_stack[n_stack.length - 1] = new RBNode(
          lastN.color,
          key,
          value,
          lastN.left,
          lastN.right
        );
      } else {
        n_stack.push(new RBNode(RED, key, value, null, null));
      }
      let s;
      for (s = n_stack.length - 2; s >= 0; --s) {
        n = n_stack[s];
        if (d_stack[s] <= 0) {
          n_stack[s] = new RBNode(
            n.color,
            n.key,
            n.value,
            n_stack[s + 1],
            n.right
          );
        } else {
          n_stack[s] = new RBNode(
            n.color,
            n.key,
            n.value,
            n.left,
            n_stack[s + 1]
          );
        }
      }
      if (replace) return new _RedBlackTree(cmp, n_stack[0]);
      for (s = n_stack.length - 1; s > 1; --s) {
        const p = n_stack[s - 1];
        n = n_stack[s];
        if (p.color === BLACK || n.color === BLACK) {
          break;
        }
        const pp = n_stack[s - 2];
        if (pp.left === p) {
          if (p.left === n) {
            const y = pp.right;
            if (y && y.color === RED) {
              p.color = BLACK;
              pp.right = repaint(BLACK, y);
              pp.color = RED;
              s -= 1;
            } else {
              pp.color = RED;
              pp.left = p.right;
              p.color = BLACK;
              p.right = pp;
              n_stack[s - 2] = p;
              n_stack[s - 1] = n;
              if (s >= 3) {
                const ppp = n_stack[s - 3];
                if (ppp.left === pp) {
                  ppp.left = p;
                } else {
                  ppp.right = p;
                }
              }
              break;
            }
          } else {
            const y = pp.right;
            if (y && y.color === RED) {
              p.color = BLACK;
              pp.right = repaint(BLACK, y);
              pp.color = RED;
              s -= 1;
            } else {
              p.right = n.left;
              pp.color = RED;
              pp.left = n.right;
              n.color = BLACK;
              n.left = p;
              n.right = pp;
              n_stack[s - 2] = n;
              n_stack[s - 1] = p;
              if (s >= 3) {
                const ppp = n_stack[s - 3];
                if (ppp.left === pp) {
                  ppp.left = n;
                } else {
                  ppp.right = n;
                }
              }
              break;
            }
          }
        } else {
          if (p.right === n) {
            const y = pp.left;
            if (y && y.color === RED) {
              p.color = BLACK;
              pp.left = repaint(BLACK, y);
              pp.color = RED;
              s -= 1;
            } else {
              pp.color = RED;
              pp.right = p.left;
              p.color = BLACK;
              p.left = pp;
              n_stack[s - 2] = p;
              n_stack[s - 1] = n;
              if (s >= 3) {
                const ppp = n_stack[s - 3];
                if (ppp.right === pp) {
                  ppp.right = p;
                } else {
                  ppp.left = p;
                }
              }
              break;
            }
          } else {
            const y = pp.left;
            if (y && y.color === RED) {
              p.color = BLACK;
              pp.left = repaint(BLACK, y);
              pp.color = RED;
              s -= 1;
            } else {
              p.left = n.right;
              pp.color = RED;
              pp.right = n.left;
              n.color = BLACK;
              n.right = p;
              n.left = pp;
              n_stack[s - 2] = n;
              n_stack[s - 1] = p;
              if (s >= 3) {
                const ppp = n_stack[s - 3];
                if (ppp.right === pp) {
                  ppp.right = n;
                } else {
                  ppp.left = n;
                }
              }
              break;
            }
          }
        }
      }
      n_stack[0].color = BLACK;
      return new _RedBlackTree(cmp, n_stack[0]);
    }
    /**
     * Finds the last item in the tree whose key is <= `key`.
     *
     * @param key The key to search for.
     * @returns An iterator at the given element.
     */
    le(key) {
      const cmp = this.compare;
      let n = this.root;
      const stack = [];
      let last_ptr = 0;
      while (n) {
        const d = cmp(key, n.key);
        stack.push(n);
        if (d >= 0) {
          last_ptr = stack.length;
        }
        if (d < 0) {
          n = n.left;
        } else {
          n = n.right;
        }
      }
      stack.length = last_ptr;
      return new RedBlackTreeIterator(this, stack);
    }
    /**
     * @returns An iterator pointing to the first item in the tree with `key`, otherwise null.
     */
    find(key) {
      const cmp = this.compare;
      let n = this.root;
      const stack = [];
      while (n) {
        const d = cmp(key, n.key);
        stack.push(n);
        if (d === 0) {
          return new RedBlackTreeIterator(this, stack);
        }
        if (d <= 0) {
          n = n.left;
        } else {
          n = n.right;
        }
      }
      return new RedBlackTreeIterator(this, []);
    }
    /**
     * Removes the first item with `key` in the tree.
     *
     * @param key The key of the item to remove.
     * @returns A new tree with the given item removed, if it exists.
     */
    remove(key) {
      const iter = this.find(key);
      return iter.remove();
    }
    /**
     * Retrieves the value associated with `key`.
     *
     * @param key The key of the item to look up.
     * @returns The value of the first node associated with `key`.
     */
    get(key) {
      const cmp = this.compare;
      let n = this.root;
      while (n) {
        const d = cmp(key, n.key);
        if (d === 0) {
          return n.value;
        }
        if (d <= 0) {
          n = n.left;
        } else {
          n = n.right;
        }
      }
      return;
    }
    forEach(callbackFn) {
      if (!this.root) return;
      doVisitFull(callbackFn, this.root);
    }
  };
  function swapNode(n, v) {
    n.key = v.key;
    n.value = v.value;
    n.left = v.left;
    n.right = v.right;
    n.color = v.color;
  }
  function fixDoubleBlack(stack) {
    let n, p, s, z;
    for (let i = stack.length - 1; i >= 0; --i) {
      n = stack[i];
      if (i === 0) {
        n.color = BLACK;
        return;
      }
      p = stack[i - 1];
      if (p.left === n) {
        s = p.right;
        if (s.right && s.right.color === RED) {
          s = p.right = cloneNode(s);
          z = s.right = cloneNode(s.right);
          p.right = s.left;
          s.left = p;
          s.right = z;
          s.color = p.color;
          n.color = BLACK;
          p.color = BLACK;
          z.color = BLACK;
          if (i > 1) {
            const pp = stack[i - 2];
            if (pp.left === p) {
              pp.left = s;
            } else {
              pp.right = s;
            }
          }
          stack[i - 1] = s;
          return;
        } else if (s.left && s.left.color === RED) {
          s = p.right = cloneNode(s);
          z = s.left = cloneNode(s.left);
          p.right = z.left;
          s.left = z.right;
          z.left = p;
          z.right = s;
          z.color = p.color;
          p.color = BLACK;
          s.color = BLACK;
          n.color = BLACK;
          if (i > 1) {
            const pp = stack[i - 2];
            if (pp.left === p) {
              pp.left = z;
            } else {
              pp.right = z;
            }
          }
          stack[i - 1] = z;
          return;
        }
        if (s.color === BLACK) {
          if (p.color === RED) {
            p.color = BLACK;
            p.right = repaint(RED, s);
            return;
          } else {
            p.right = repaint(RED, s);
            continue;
          }
        } else {
          s = cloneNode(s);
          p.right = s.left;
          s.left = p;
          s.color = p.color;
          p.color = RED;
          if (i > 1) {
            const pp = stack[i - 2];
            if (pp.left === p) {
              pp.left = s;
            } else {
              pp.right = s;
            }
          }
          stack[i - 1] = s;
          stack[i] = p;
          if (i + 1 < stack.length) {
            stack[i + 1] = n;
          } else {
            stack.push(n);
          }
          i = i + 2;
        }
      } else {
        s = p.left;
        if (s.left && s.left.color === RED) {
          s = p.left = cloneNode(s);
          z = s.left = cloneNode(s.left);
          p.left = s.right;
          s.right = p;
          s.left = z;
          s.color = p.color;
          n.color = BLACK;
          p.color = BLACK;
          z.color = BLACK;
          if (i > 1) {
            const pp = stack[i - 2];
            if (pp.right === p) {
              pp.right = s;
            } else {
              pp.left = s;
            }
          }
          stack[i - 1] = s;
          return;
        } else if (s.right && s.right.color === RED) {
          s = p.left = cloneNode(s);
          z = s.right = cloneNode(s.right);
          p.left = z.right;
          s.right = z.left;
          z.right = p;
          z.left = s;
          z.color = p.color;
          p.color = BLACK;
          s.color = BLACK;
          n.color = BLACK;
          if (i > 1) {
            const pp = stack[i - 2];
            if (pp.right === p) {
              pp.right = z;
            } else {
              pp.left = z;
            }
          }
          stack[i - 1] = z;
          return;
        }
        if (s.color === BLACK) {
          if (p.color === RED) {
            p.color = BLACK;
            p.left = repaint(RED, s);
            return;
          } else {
            p.left = repaint(RED, s);
            continue;
          }
        } else {
          s = cloneNode(s);
          p.left = s.right;
          s.right = p;
          s.color = p.color;
          p.color = RED;
          if (i > 1) {
            const pp = stack[i - 2];
            if (pp.right === p) {
              pp.right = s;
            } else {
              pp.left = s;
            }
          }
          stack[i - 1] = s;
          stack[i] = p;
          if (i + 1 < stack.length) {
            stack[i + 1] = n;
          } else {
            stack.push(n);
          }
          i = i + 2;
        }
      }
    }
  }
  function doVisitFull(callbackFn, node) {
    if (node.left) {
      doVisitFull(callbackFn, node.left);
    }
    callbackFn(node.key);
    if (node.right) {
      return doVisitFull(callbackFn, node.right);
    }
  }
  var RedBlackTreeIterator = class {
    constructor(tree, stack) {
      this.tree = tree;
      this.stack = stack;
    }
    /**
     * Removes the iterator's current item form the tree.
     *
     * @returns A new binary search tree with the item removed.
     */
    remove() {
      const stack = this.stack;
      if (stack.length === 0) {
        return this.tree;
      }
      const cstack = new Array(stack.length);
      let n = stack[stack.length - 1];
      cstack[cstack.length - 1] = new RBNode(
        n.color,
        n.key,
        n.value,
        n.left,
        n.right
      );
      let i;
      for (i = stack.length - 2; i >= 0; --i) {
        n = stack[i];
        if (n.left === stack[i + 1]) {
          cstack[i] = new RBNode(n.color, n.key, n.value, cstack[i + 1], n.right);
        } else {
          cstack[i] = new RBNode(n.color, n.key, n.value, n.left, cstack[i + 1]);
        }
      }
      n = cstack[cstack.length - 1];
      if (n.left && n.right) {
        const split2 = cstack.length;
        n = n.left;
        while (n.right) {
          cstack.push(n);
          n = n.right;
        }
        const v = cstack[split2 - 1];
        cstack.push(new RBNode(n.color, v.key, v.value, n.left, n.right));
        cstack[split2 - 1].key = n.key;
        cstack[split2 - 1].value = n.value;
        for (i = cstack.length - 2; i >= split2; --i) {
          n = cstack[i];
          cstack[i] = new RBNode(n.color, n.key, n.value, n.left, cstack[i + 1]);
        }
        cstack[split2 - 1].left = cstack[split2];
      }
      n = cstack[cstack.length - 1];
      if (n.color === RED) {
        const p = cstack[cstack.length - 2];
        if (p.left === n) {
          p.left = null;
        } else if (p.right === n) {
          p.right = null;
        }
        cstack.pop();
        return new RedBlackTree(this.tree.compare, cstack[0]);
      } else {
        if (n.left || n.right) {
          if (n.left) {
            swapNode(n, n.left);
          } else if (n.right) {
            swapNode(n, n.right);
          }
          n.color = BLACK;
          return new RedBlackTree(this.tree.compare, cstack[0]);
        } else if (cstack.length === 1) {
          return new RedBlackTree(this.tree.compare, null);
        } else {
          const parent = cstack[cstack.length - 2];
          fixDoubleBlack(cstack);
          if (parent.left === n) {
            parent.left = null;
          } else {
            parent.right = null;
          }
        }
      }
      return new RedBlackTree(this.tree.compare, cstack[0]);
    }
    /** The key of the iterator's current item. */
    get key() {
      if (this.stack.length > 0) {
        return this.stack[this.stack.length - 1].key;
      }
      return;
    }
    /** The value of the iterator's current item. */
    get value() {
      if (this.stack.length > 0) {
        return this.stack[this.stack.length - 1].value;
      }
      return;
    }
  };

  // packages/articulated/src/internal/leaf_map.ts
  var LeafMap = class _LeafMap {
    constructor(tree) {
      this.tree = tree;
    }
    static new() {
      return new this(RedBlackTree.new(compareLeaves));
    }
    /** Initialization only: sort once, then allocate each index node once. */
    static fromEntries(entries) {
      entries.sort((a, b) => compareLeaves(a[0], b[0]));
      for (let i = 1; i < entries.length; i++) {
        if (compareLeaves(entries[i - 1][0], entries[i][0]) === 0)
          throw new Error("Invalid savedState: duplicate ids");
      }
      return new _LeafMap(RedBlackTree.fromSorted(compareLeaves, entries));
    }
    /**
     * Returns the greatest leaf whose first id is <= the given id,
     * or undefined if none exists. Also returns the associated seq (or -1 if not found).
     *
     * The returned leaf might not actually contain the given id.
     */
    getLeaf(bunchId, counter) {
      const iter = this.tree.le({ bunchId, startCounter: counter });
      return [iter.key, iter.value ?? -1];
    }
    set(leaf, seq) {
      return new _LeafMap(this.tree.set(leaf, seq));
    }
    delete(leaf) {
      return new _LeafMap(this.tree.remove(leaf));
    }
    /**
     * Checks for duplicate ids after loading, returning whether the check passes.
     *
     * Duplicate ids imply leaves with overlapping id ranges, which lead to either:
     *
     * - Neighboring leaves (in our key order) that overlap.
     * - Or, a leaf that overwrote another, making our known id count too low.
     */
    checkAfterLoad(targetIdCount) {
      let hasOverlap = false;
      let idCount = 0;
      let prevLeaf = null;
      this.tree.forEach((leaf) => {
        if (prevLeaf) {
          if (leaf.bunchId === prevLeaf.bunchId && leaf.startCounter < prevLeaf.startCounter + prevLeaf.count) {
            hasOverlap = true;
          }
        }
        idCount += leaf.count;
        prevLeaf = leaf;
      });
      return !hasOverlap && idCount === targetIdCount;
    }
  };
  function compareLeaves(a, b) {
    if (a.bunchId === b.bunchId) {
      return a.startCounter - b.startCounter;
    } else {
      return a.bunchId > b.bunchId ? 1 : -1;
    }
  }

  // packages/articulated/src/internal/misc.ts
  function checkCount(count) {
    if (!(Number.isSafeInteger(count) && count >= 0)) {
      throw new Error(`Invalid count: ${count}`);
    }
  }

  // packages/articulated/src/internal/seq_map.ts
  var SeqMap = class _SeqMap {
    constructor(tree, nextSeq) {
      this.tree = tree;
      this.nextSeq = nextSeq;
    }
    static new() {
      return new this(
        RedBlackTree.new((a, b) => a - b),
        1
      );
    }
    /** Initialization only; explicitly sort the actual sequence keys. */
    static fromEntries(entries, nextSeq) {
      entries.sort((a, b) => a[0] - b[0]);
      return new _SeqMap(
        RedBlackTree.fromSorted((a, b) => a - b, entries),
        nextSeq
      );
    }
    bumpNextSeq() {
      return new _SeqMap(this.tree, this.nextSeq + 1);
    }
    get(seq) {
      return this.tree.get(seq);
    }
    set(seq, value) {
      return new _SeqMap(this.tree.set(seq, value), this.nextSeq);
    }
    // delete(seq: number): SeqMap {
    //   return new SeqMap(this.tree.remove(seq), this.nextSeq);
    // }
  };
  function getAndBumpNextSeq(seqsMut) {
    const nextSeq = seqsMut.value.nextSeq;
    seqsMut.value = seqsMut.value.bumpNextSeq();
    return nextSeq;
  }

  // packages/articulated/src/id_list.ts
  var InnerNodeInner = class {
    constructor(seq, children, parentSeqsMut) {
      this.seq = seq;
      this.children = children;
      let size = 0;
      let knownSize = 0;
      for (const child of children) {
        size += child.size;
        knownSize += child.knownSize;
        if (parentSeqsMut) {
          parentSeqsMut.value = parentSeqsMut.value.set(child.seq, seq);
        }
      }
      this.size = size;
      this.knownSize = knownSize;
    }
    size;
    knownSize;
  };
  var InnerNodeLeaf = class {
    constructor(seq, children, leafMapMut) {
      this.seq = seq;
      this.children = children;
      let size = 0;
      let knownSize = 0;
      for (const child of children) {
        size += child.present.count();
        knownSize += child.count;
        if (leafMapMut) {
          leafMapMut.value = leafMapMut.value.set(child, seq);
        }
      }
      this.size = size;
      this.knownSize = knownSize;
    }
    size;
    knownSize;
  };
  var M = 8;
  var IdList = class _IdList {
    /**
     * Internal - construct an IdList using a static method (e.g. `IdList.new`).
     */
    constructor(root, leafMap, parentSeqs) {
      this.root = root;
      this.leafMap = leafMap;
      this.parentSeqs = parentSeqs.set(root.seq, 0);
    }
    /**
     * A persistent map from each InnerNode's seq to its parent node's seq.
     *
     * We map the root's seq to 0 (in our constructor).
     */
    parentSeqs;
    /**
     * Constructs an empty list.
     *
     * To begin with a non-empty list, use {@link IdList.from}, {@link IdList.fromIds},
     * or {@link IdList.load}.
     */
    static new() {
      const leafMapMut = { value: LeafMap.new() };
      const parentSeqsMut = { value: SeqMap.new() };
      return new this(
        new InnerNodeLeaf(getAndBumpNextSeq(parentSeqsMut), [], leafMapMut),
        leafMapMut.value,
        parentSeqsMut.value
      );
    }
    /**
     * Constructs a list with the given known ids and their isDeleted status, in list order.
     */
    static from(knownIds) {
      const savedState = [];
      for (const { id, isDeleted } of knownIds) {
        if (savedState.length !== 0) {
          const current2 = savedState.at(-1);
          if (id.bunchId === current2.bunchId && id.counter === current2.startCounter + current2.count && isDeleted === current2.isDeleted) {
            current2.count++;
            continue;
          }
        }
        savedState.push({
          bunchId: id.bunchId,
          startCounter: id.counter,
          count: 1,
          isDeleted
        });
      }
      return _IdList.load(savedState);
    }
    /**
     * Constructs a list with the given present ids.
     *
     * Typically, you instead want {@link IdList.from}, which allows you to also
     * specify known-but-deleted ids. That way, you can reference the known-but-deleted ids
     * in future insertAfter/insertBefore operations.
     */
    static fromIds(ids) {
      return this.from(
        (function* () {
          for (const id of ids) yield { id, isDeleted: false };
        })()
      );
    }
    /**
     * Inserts `newId` immediately after the given id (`before`), which may be deleted.
     * A new IdList is returned and the current list remains unchanged.
     *
     * All ids to the right of `before` are shifted one index to the right, in the manner
     * of [Array.splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice).
     *
     * Use `before = null` to insert at the beginning of the list, to the left of all
     * known ids.
     *
     * @param count Provide this to bulk-insert `count` ids from left-to-right,
     * starting with newId and proceeding with the same bunchId and sequential counters.
     * @throws If `before` is not known.
     * @throws If any inserted id is already known.
     */
    insertAfter(before, newId, count = 1) {
      if (!(Number.isSafeInteger(newId.counter) && newId.counter >= 0)) {
        throw new Error(`Invalid counter: ${newId.counter}`);
      }
      checkCount(count);
      if (this.isAnyKnown(newId, count)) {
        throw new Error("An inserted id is already known");
      }
      if (before === null) {
        if (count === 0) return this;
        if (this.root.children.length === 0) {
          const present = SparseIndices.new();
          present.set(newId.counter, count);
          const leaf2 = {
            bunchId: newId.bunchId,
            startCounter: newId.counter,
            count,
            present
          };
          const leafMapMut = { value: this.leafMap };
          return new _IdList(
            new InnerNodeLeaf(this.root.seq, [leaf2], leafMapMut),
            leafMapMut.value,
            this.parentSeqs
          );
        } else {
          return this.insertBefore(firstId(this.root), newId, count);
        }
      }
      const located = this.locate(before);
      if (located === null) {
        throw new Error("before is not known");
      }
      if (count === 0) return this;
      const leaf = located[0].node;
      if (before.counter === leaf.startCounter + leaf.count - 1) {
        if (leaf.bunchId === newId.bunchId && leaf.startCounter + leaf.count === newId.counter) {
          const present = leaf.present.clone();
          present.set(newId.counter, count);
          return this.replaceLeaf(located, {
            ...leaf,
            count: leaf.count + count,
            present
          });
        } else {
          const present = SparseIndices.new();
          present.set(newId.counter, count);
          return this.replaceLeaf(located, leaf, {
            bunchId: newId.bunchId,
            startCounter: newId.counter,
            count,
            present
          });
        }
      } else {
        const newPresent = SparseIndices.new();
        newPresent.set(newId.counter, count);
        const [leftPresent, rightPresent] = splitPresent(
          leaf.present,
          before.counter + 1
        );
        return this.replaceLeaf(
          located,
          {
            ...leaf,
            count: before.counter + 1 - leaf.startCounter,
            present: leftPresent
          },
          {
            bunchId: newId.bunchId,
            startCounter: newId.counter,
            count,
            present: newPresent
          },
          {
            ...leaf,
            startCounter: before.counter + 1,
            count: leaf.count - (before.counter + 1 - leaf.startCounter),
            present: rightPresent
          }
        );
      }
    }
    /**
     * Inserts `newId` immediately before the given id (`after`), which may be deleted.
     * A new IdList is returned and the current list remains unchanged.
     *
     * All ids to the right of `after`, plus `after` itself, are shifted one index to the right, in the manner
     * of [Array.splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice).
     *
     * Use `after = null` to insert at the end of the list, to the right of all known ids.
     *
     * @param count Provide this to bulk-insert `count` ids from left-to-right,
     * starting with newId and proceeding with the same bunchId and sequential counters.
     * __Note__: Although the new ids are inserted to the left of `after`, they are still
     * inserted in left-to-right order relative to each other.
     * @throws If `after` is not known.
     * @throws If `newId` is already known.
     */
    insertBefore(after, newId, count = 1) {
      if (!(Number.isSafeInteger(newId.counter) && newId.counter >= 0)) {
        throw new Error(`Invalid counter: ${newId.counter}`);
      }
      checkCount(count);
      if (this.isAnyKnown(newId, count)) {
        throw new Error("An inserted id is already known");
      }
      if (after === null) {
        if (count === 0) return this;
        return this.insertAfter(
          this.root.knownSize === 0 ? null : lastId(this.root),
          newId,
          count
        );
      }
      const located = this.locate(after);
      if (located === null) {
        throw new Error("after is not known");
      }
      if (count === 0) return this;
      const leaf = located[0].node;
      if (after.counter === leaf.startCounter) {
        if (leaf.bunchId === newId.bunchId && leaf.startCounter === newId.counter + count) {
          const present = leaf.present.clone();
          present.set(newId.counter, count);
          return this.replaceLeaf(located, {
            ...leaf,
            startCounter: leaf.startCounter - count,
            count: leaf.count + count,
            present
          });
        } else {
          const present = SparseIndices.new();
          present.set(newId.counter, count);
          return this.replaceLeaf(
            located,
            {
              bunchId: newId.bunchId,
              startCounter: newId.counter,
              count,
              present
            },
            leaf
          );
        }
      } else {
        const present = SparseIndices.new();
        present.set(newId.counter, count);
        const [leftPresent, rightPresent] = splitPresent(
          leaf.present,
          after.counter
        );
        return this.replaceLeaf(
          located,
          {
            ...leaf,
            count: after.counter - leaf.startCounter,
            present: leftPresent
          },
          {
            bunchId: newId.bunchId,
            startCounter: newId.counter,
            count,
            present
          },
          {
            ...leaf,
            startCounter: after.counter,
            count: leaf.count - (after.counter - leaf.startCounter),
            present: rightPresent
          }
        );
      }
    }
    /**
     * Undoes the insertion of `id`, making it no longer known.
     * A new IdList is returned and the current list remains unchanged.
     *
     * This method is an exact inverse to `insertAfter(-, id)` or `insertBefore(-, id)`,
     * unlike `delete(id)`, which merely marks `id` as deleted.
     * You almost always want to use delete instead of uninsert, unless you are rolling
     * back the IdList state as part of a [server reconciliation](https://mattweidner.com/2024/06/04/server-architectures.html#1-server-reconciliation)
     * architecture. (Even then, you may find it easier to restore a snapshot instead
     * of explicitly undoing operations, making use of persistence.)
     *
     * If `id` is already not known, this method does nothing.
     *
     * @param count Provide this to bulk-uninsert `count` ids,
     * starting with id and proceeding with the same bunchId and sequential counters.
     * `uninsert(id, count)` is an exact inverse to `insertAfter(-, id, count)` or `insertBefore(-, id, count)`.
     */
    uninsert(id, count = 1) {
      checkCount(count);
      if (count === 0) return this;
      const located = this.locate(id);
      if (located) {
        const leaf = located[0].node;
        if (leaf.startCounter + leaf.count === id.counter + count) {
          if (leaf.startCounter === id.counter) {
            return this.replaceLeaf(located);
          } else {
            const present = leaf.present.clone();
            present.delete(id.counter, count);
            return this.replaceLeaf(located, {
              ...leaf,
              count: id.counter - leaf.startCounter,
              present
            });
          }
        }
      }
      let ans = this;
      for (let i = count - 1; i >= 0; i--) {
        ans = ans.uninsertOne({ bunchId: id.bunchId, counter: id.counter + i });
      }
      return ans;
    }
    uninsertOne(id) {
      const located = this.locate(id);
      if (located === null) return this;
      const leaf = located[0].node;
      const newLeaves = [];
      if (leaf.startCounter < id.counter) {
        const present = leaf.present.clone();
        present.delete(id.counter, present.length);
        newLeaves.push({
          ...leaf,
          count: id.counter - leaf.startCounter,
          present
        });
      }
      if (id.counter + 1 < leaf.startCounter + leaf.count) {
        const present = leaf.present.clone();
        present.delete(0, id.counter + 1);
        newLeaves.push({
          ...leaf,
          startCounter: id.counter + 1,
          count: leaf.startCounter + leaf.count - (id.counter + 1),
          present
        });
      }
      return this.replaceLeaf(located, ...newLeaves);
    }
    /**
     * Marks `id` as deleted from this list.
     * A new IdList is returned and the current list remains unchanged.
     *
     * Once deleted, `id` does not count towards the length of the list or index-based accessors.
     * However, it remains known (a "tombstone").
     * Because `id` is still known, you can reference it in future insertAfter/insertBefore
     * operations, including ones sent concurrently by other devices.
     * This does have a memory cost, but it is compressed in common cases.
     *
     * If `id` is already deleted or is not known, this method does nothing.
     *
     * @param count Provide this to bulk-delete `count` ids,
     * starting with newId and proceeding with the same bunchId and sequential counters.
     * __Note__: To delete multiple ids at sequential *indexes*, use deleteRange.
     */
    delete(id, count = 1) {
      checkCount(count);
      if (count === 0) return this;
      let ans = this;
      let currentCounter = id.counter;
      while (currentCounter < id.counter + count) {
        const currentId = {
          bunchId: id.bunchId,
          counter: currentCounter
        };
        const located = ans.locate(currentId);
        if (located === null) {
          currentCounter++;
          continue;
        }
        const leaf = located[0].node;
        const leafEnd = leaf.startCounter + leaf.count;
        const remaining = id.counter + count - currentCounter;
        const canDeleteInLeaf = Math.min(leafEnd - currentCounter, remaining);
        const newPresent = leaf.present.clone();
        newPresent.delete(currentCounter, canDeleteInLeaf);
        ans = ans.replaceLeaf(located, { ...leaf, present: newPresent });
        currentCounter += canDeleteInLeaf;
      }
      return ans;
    }
    /**
     * Deletes all ids with indexes in the range [from, to).
     *
     * @throws If any deleted index is out of bounds.
     */
    deleteRange(from, to) {
      const allIds = [];
      for (let i = from; i < to; i++) {
        allIds.push(this.at(i));
      }
      let ans = this;
      for (const id of allIds) ans = ans.delete(id);
      return ans;
    }
    /**
     * Un-marks `id` as deleted from this list, making it present again.
     * A new IdList is returned and the current list remains unchanged.
     *
     * This method is an exact inverse to {@link delete}.
     *
     * If `id` is already present, this method does nothing.
     *
     * @param count Provide this to bulk-undelete `count` ids,
     * starting with newId and proceeding with the same bunchId and sequential counters.
     * @throws If any deleted id is not known.
     */
    undelete(id, count = 1) {
      checkCount(count);
      if (count === 0) return this;
      let ans = this;
      let currentCounter = id.counter;
      while (currentCounter < id.counter + count) {
        const currentId = {
          bunchId: id.bunchId,
          counter: currentCounter
        };
        const located = ans.locate(currentId);
        if (located === null) {
          throw new Error("id is not known");
        }
        const leaf = located[0].node;
        const leafEnd = leaf.startCounter + leaf.count;
        const remaining = id.counter + count - currentCounter;
        const canUndeleteInLeaf = Math.min(leafEnd - currentCounter, remaining);
        const newPresent = leaf.present.clone();
        newPresent.set(currentCounter, canUndeleteInLeaf);
        ans = ans.replaceLeaf(located, { ...leaf, present: newPresent });
        currentCounter += canUndeleteInLeaf;
      }
      return ans;
    }
    /**
     * Returns the path from id's leaf node to the root, or null if id is not found.
     *
     * The path contains each node and its index in its parent's node, starting with id's
     * LeafNode and ending at a child of the root.
     */
    locate(id) {
      const [leaf, parentSeq] = this.leafMap.getLeaf(id.bunchId, id.counter);
      if (leaf === void 0) return null;
      if (!(leaf.bunchId === id.bunchId && leaf.startCounter <= id.counter && id.counter < leaf.startCounter + leaf.count)) {
        return null;
      }
      const innerSeqs = [];
      let curSeq = parentSeq;
      while (curSeq !== 0) {
        innerSeqs.push(curSeq);
        curSeq = this.parentSeqs.get(curSeq);
      }
      const innerNodes = [];
      let curParent = this.root;
      for (let i = innerSeqs.length - 2; i >= 0; i--) {
        const children = curParent.children;
        const childIndex = children.findIndex(
          (child2) => child2.seq === innerSeqs[i]
        );
        if (childIndex === -1) throw new Error("Internal error");
        const child = children[childIndex];
        innerNodes.push({ node: child, indexInParent: childIndex });
        curParent = child;
      }
      const leafChildIndex = curParent.children.indexOf(leaf);
      if (leafChildIndex === -1) throw new Error("Internal error");
      return [
        { node: leaf, indexInParent: leafChildIndex },
        ...innerNodes.reverse()
      ];
    }
    /**
     * Replaces the leaf at the given path with newLeaves.
     * Returns a proper (sufficiently balanced) B+Tree with updated sizes.
     *
     * Exception: If you delete the leaf (newLeaves is empty), we don't prevent
     * nodes from going under M/2 children. This lets us avoid implementing B+Tree
     * deletes; any performance penalty goes away after reloading.
     *
     * newLeaves.length must be at most M.
     */
    replaceLeaf(located, ...newLeaves) {
      const leafMapMut = { value: this.leafMap };
      const parentSeqsMut = { value: this.parentSeqs };
      leafMapMut.value = leafMapMut.value.delete(located[0].node);
      const newRoot = replaceNode(
        located,
        this.root,
        leafMapMut,
        parentSeqsMut,
        newLeaves,
        0
      );
      return new _IdList(newRoot, leafMapMut.value, parentSeqsMut.value);
    }
    // Accessors
    /**
     * Returns whether `id` is present in the list, i.e., it is known and not deleted.
     *
     * If `id` is not known, false is returned.
     *
     * Compare to {@link isKnown}.
     */
    has(id) {
      const [leaf] = this.leafMap.getLeaf(id.bunchId, id.counter);
      if (leaf && leaf.bunchId === id.bunchId) {
        return leaf.present.has(id.counter);
      }
      return false;
    }
    /**
     * Returns whether id is known to this list.
     *
     * Compare to {@link has}.
     */
    isKnown(id) {
      const [leaf] = this.leafMap.getLeaf(id.bunchId, id.counter);
      if (leaf && leaf.bunchId === id.bunchId) {
        return leaf.startCounter <= id.counter && id.counter < leaf.startCounter + leaf.count;
      }
      return false;
    }
    // TODO: Make public?
    /**
     * Returns true if any of the given bulk ids are known.
     */
    isAnyKnown(id, count) {
      if (count === 0) return false;
      const [leaf] = this.leafMap.getLeaf(id.bunchId, id.counter + count - 1);
      if (leaf && leaf.bunchId === id.bunchId) {
        const a = leaf.startCounter;
        const b = leaf.startCounter + leaf.count - 1;
        const c = id.counter;
        const d = id.counter + count - 1;
        return a <= d && c <= b;
      }
      return false;
    }
    /**
     * Returns the maximum counter across all known ElementIds with the given bunchId,
     * or undefined if no such ElementIds are known.
     */
    maxCounter(bunchId) {
      const [leaf] = this.leafMap.getLeaf(bunchId, Number.MAX_SAFE_INTEGER);
      if (leaf && leaf.bunchId === bunchId) {
        return leaf.startCounter + leaf.count - 1;
      }
      return void 0;
    }
    /**
     * The length of the list, counting only present ids.
     *
     * To include known but deleted ids, use `this.knownIds.length`.
     */
    get length() {
      return this.root.size;
    }
    /**
     * Returns the id at the given index in the list.
     *
     * @throws If index is out of bounds.
     */
    at(index) {
      if (!(Number.isSafeInteger(index) && 0 <= index && index < this.length)) {
        throw new Error(`Index out of bounds: ${index} (length: ${this.length})`);
      }
      let remaining = index;
      let curParent = this.root;
      recurse: while (true) {
        if (curParent instanceof InnerNodeInner) {
          for (const child of curParent.children) {
            if (remaining < child.size) {
              curParent = child;
              continue recurse;
            } else {
              remaining -= child.size;
            }
          }
        } else {
          for (const child of curParent.children) {
            const childSize = child.present.count();
            if (remaining < childSize) {
              return {
                bunchId: child.bunchId,
                counter: child.present.indexOfCount(remaining)
              };
            } else {
              remaining -= childSize;
            }
          }
        }
        throw new Error("Internal error");
      }
    }
    /**
     * Returns the index of `id` in the list.
     *
     * If `id` is known but deleted, the bias specifies what to return:
     * - "none": -1.
     * - "left": The index immediately to the left of `id`, possibly -1.
     * - "right": The index immediately to the right of `id`, possibly `this.length`.
     * Equivalently, the index where `id` would be if present.
     *
     * @throws If `id` is not known.
     */
    indexOf(id, bias = "none") {
      const located = this.locate(id);
      if (located === null) throw new Error("id is not known");
      let index = 0;
      for (let i = 1; i < located.length; i++) {
        const parent = i === located.length - 1 ? this.root : located[i + 1].node;
        for (let c = 0; c < located[i].indexInParent; c++) {
          index += parent.children[c].size;
        }
      }
      const leafParent = located.length === 1 ? this.root : located[1].node;
      for (let c = 0; c < located[0].indexInParent; c++) {
        index += leafParent.children[c].present.count();
      }
      const [count, has] = located[0].node.present._countHas(id.counter);
      index += count;
      if (has) return index;
      else {
        switch (bias) {
          case "none":
            return -1;
          case "left":
            return index - 1;
          case "right":
            return index;
        }
      }
    }
    /**
     * Returns the cursor at the given index within the list, i.e., between `index - 1` and `index`.
     * See [Cursors](https://github.com/mweidner037/articulated#cursors).
     *
     * Invert with {@link cursorIndex}.
     *
     * @param bind Whether to bind to the left or the right side of the gap, in case ids
     * later appear between `index - 1` and `index`. Default: `"left"`, which is typical for text cursors.
     * @throws If index is not in the range `[0, list.length]`.
     */
    cursorAt(index, bind = "left") {
      if (bind === "left") {
        return index === 0 ? null : this.at(index - 1);
      } else {
        return index === this.length ? null : this.at(index);
      }
    }
    /**
     * Returns the current index of the given cursor within the list.
     * That is, the cursor is in the gap between `index - 1` and `index`.
     *
     * Inverts {@link cursorAt}.
     *
     * @param bind The `bind` value that was used with {@link cursorAt}, if any.
     * @throws If `cursor` is an ElementId that is not known.
     */
    cursorIndex(cursor, bind = "left") {
      if (bind === "left") {
        return cursor === null ? 0 : this.indexOf(cursor, "left") + 1;
      } else {
        return cursor === null ? this.length : this.indexOf(cursor, "right");
      }
    }
    // Iterators and views
    /**
     * Iterates over all present ids in the list.
     */
    [Symbol.iterator]() {
      return iterateNode(this.root, false);
    }
    /**
     * Iterates over all present ids in the list.
     */
    values() {
      return this[Symbol.iterator]();
    }
    /**
     * Iterates over all __known__ ids in the list, indicating which are deleted.
     */
    valuesWithIsDeleted() {
      return iterateNodeWithIsDeleted(this.root);
    }
    _knownIds;
    /**
     * A view of this list that treats all known ids as present.
     * That is, it ignores is-deleted status when computing list indices or iterating.
     */
    get knownIds() {
      if (this._knownIds === void 0) {
        this._knownIds = new KnownIdView(this, this.root);
      }
      return this._knownIds;
    }
    // Save and load
    /**
     * Returns a JSON representation of this list's internal state.
     * Load with {@link load}.
     *
     * See {@link SavedIdList} for a description of the save format.
     */
    save() {
      const acc = [];
      saveNode(this.root, acc);
      return acc;
    }
    /**
     * Experimental benchmark hook, not a proposed stable API.
     * Emits canonical runs without materializing a SavedIdList. A scalar pending
     * run merges adjacent leaf fragments, just as save() does.
     */
    experimentalSaveTo(emit) {
      let pendingId;
      let pendingStart = 0, pendingCount = 0, pendingDeleted = false;
      const append2 = (id, start, count, deleted) => {
        if (id === pendingId && deleted === pendingDeleted && start === pendingStart + pendingCount) {
          pendingCount += count;
        } else {
          if (pendingId !== void 0)
            emit(pendingId, pendingStart, pendingCount, pendingDeleted);
          pendingId = id;
          pendingStart = start;
          pendingCount = count;
          pendingDeleted = deleted;
        }
      };
      const visit = (node) => {
        if (node instanceof InnerNodeInner) {
          for (const child of node.children) visit(child);
        } else {
          for (const child of node.children) {
            let next = child.startCounter;
            for (const [index, count] of child.present.items()) {
              if (next < index) append2(child.bunchId, next, index - next, true);
              append2(child.bunchId, index, count, false);
              next = index + count;
            }
            const end = child.startCounter + child.count;
            if (next < end) append2(child.bunchId, next, end - next, true);
          }
        }
      };
      visit(this.root);
      if (pendingId !== void 0)
        emit(pendingId, pendingStart, pendingCount, pendingDeleted);
    }
    /**
     * Loads a saved state returned by {@link save}.
     *
     * @throws If the saved state is not valid according to the {@link SavedIdList}
     * docs (e.g., it contains duplicate ids).
     */
    static load(savedState) {
      return _IdList.experimentalLoadFrom((append2) => {
        for (const item of savedState)
          append2(item.bunchId, item.startCounter, item.count, item.isDeleted);
      });
    }
    /** Experimental benchmark hook: same runtime/API, bulk-built auxiliary indexes. */
    static experimentalLoadBulk(savedState) {
      return _IdList.loadRuns((append2) => {
        for (const item of savedState)
          append2(item.bunchId, item.startCounter, item.count, item.isDeleted);
      }, true);
    }
    /** Experimental benchmark hook: build the existing tree from scalar runs. */
    static experimentalLoadFrom(read) {
      return _IdList.loadRuns(read, false);
    }
    static loadRuns(read, bulkIndexes) {
      const leaves = [];
      read((bunchId, startCounter, count, isDeleted) => {
        if (!(Number.isSafeInteger(count) && count >= 0)) {
          throw new Error(`Invalid count: ${count}`);
        }
        if (!(Number.isSafeInteger(startCounter) && startCounter >= 0)) {
          throw new Error(`Invalid startCounter: ${startCounter}`);
        }
        if (count === 0) return;
        if (leaves.length !== 0) {
          const lastLeaf = leaves.at(-1);
          if (bunchId === lastLeaf.bunchId && startCounter === lastLeaf.startCounter + lastLeaf.count) {
            lastLeaf.count += count;
            if (!isDeleted) {
              lastLeaf.present.set(startCounter, count);
            }
            return;
          }
        }
        const present = SparseIndices.new();
        if (!isDeleted) present.set(startCounter, count);
        leaves.push({
          bunchId,
          startCounter,
          count,
          present
        });
      });
      if (leaves.length === 0) return _IdList.new();
      const leafMapMut = { value: LeafMap.new() };
      const parentSeqsMut = { value: SeqMap.new() };
      const depth = leaves.length === 1 ? 1 : Math.ceil(Math.log(leaves.length) / Math.log(M));
      let list;
      if (bulkIndexes) {
        const leafEntries = [];
        const parentEntries = [];
        let nextSeq = 1;
        const build = (start, remaining) => {
          const seq = nextSeq++;
          if (remaining === 1) {
            const children2 = leaves.slice(start, start + M);
            for (const leaf of children2) leafEntries.push([leaf, seq]);
            return new InnerNodeLeaf(seq, children2, null);
          }
          const children = [];
          const stride = Math.pow(M, remaining - 1);
          for (let i = 0; i < M && start + i * stride < leaves.length; i++) {
            const child = build(start + i * stride, remaining - 1);
            children.push(child);
            parentEntries.push([child.seq, seq]);
          }
          return new InnerNodeInner(seq, children, null);
        };
        const root = build(0, depth);
        parentEntries.push([root.seq, 0]);
        list = new _IdList(
          root,
          LeafMap.fromEntries(leafEntries),
          SeqMap.fromEntries(parentEntries, nextSeq)
        );
      } else {
        const root = buildTree(leaves, leafMapMut, parentSeqsMut, 0, depth);
        list = new _IdList(root, leafMapMut.value, parentSeqsMut.value);
      }
      if (!list.leafMap.checkAfterLoad(list.root.knownSize)) {
        throw new Error("Invalid savedState: duplicate ids");
      }
      return list;
    }
  };
  var KnownIdView = class {
    /**
     * Internal use only. Use {@link IdList.knownIds} instead.
     */
    constructor(list, root) {
      this.list = list;
      this.root = root;
    }
    // Mutators are omitted - mutate this.list instead.
    // Accessors
    /**
     * Returns the id at the given index in this view.
     *
     * Equivalently, returns the index-th known id in `this.list`.
     *
     * @throws If index is out of bounds.
     */
    at(index) {
      if (!(Number.isSafeInteger(index) && 0 <= index && index < this.length)) {
        throw new Error(`Index out of bounds: ${index} (length: ${this.length})`);
      }
      let remaining = index;
      let curParent = this.root;
      recurse: while (true) {
        if (curParent instanceof InnerNodeInner) {
          for (const child of curParent.children) {
            if (remaining < child.knownSize) {
              curParent = child;
              continue recurse;
            } else {
              remaining -= child.knownSize;
            }
          }
        } else {
          for (const child of curParent.children) {
            if (remaining < child.count) {
              return {
                bunchId: child.bunchId,
                counter: child.startCounter + remaining
              };
            } else {
              remaining -= child.count;
            }
          }
        }
        throw new Error("Internal error");
      }
    }
    /**
     * Returns the index of `id` in this view.
     *
     * @throws If `id` is not known.
     */
    indexOf(id) {
      const located = this.list.locate(id);
      if (located === null) throw new Error("id is not known");
      let index = 0;
      for (let i = 1; i < located.length; i++) {
        const parent = i === located.length - 1 ? this.root : located[i + 1].node;
        for (let c = 0; c < located[i].indexInParent; c++) {
          index += parent.children[c].knownSize;
        }
      }
      const leafParent = located.length === 1 ? this.root : located[1].node;
      for (let c = 0; c < located[0].indexInParent; c++) {
        const child = leafParent.children[c];
        index += child.count;
      }
      return index + (id.counter - located[0].node.startCounter);
    }
    /**
     * The length of this view.
     *
     * Equivalently, the number of known ids in `this.list`.
     */
    get length() {
      return this.root.knownSize;
    }
    // Iterators
    /**
     * Iterates over all ids in this view, i.e., all known ids in `this.list`.
     */
    [Symbol.iterator]() {
      return iterateNode(this.root, true);
    }
    /**
     * Iterates over all ids in this view, i.e., all known ids in `this.list`.
     */
    values() {
      return this[Symbol.iterator]();
    }
  };
  function firstId(node) {
    let currentInner = node;
    while (!(currentInner instanceof InnerNodeLeaf)) {
      currentInner = currentInner.children[0];
    }
    const firstLeaf = currentInner.children[0];
    return {
      bunchId: firstLeaf.bunchId,
      counter: firstLeaf.startCounter
    };
  }
  function lastId(node) {
    let currentInner = node;
    while (!(currentInner instanceof InnerNodeLeaf)) {
      currentInner = currentInner.children.at(-1);
    }
    const lastLeaf = currentInner.children.at(-1);
    return {
      bunchId: lastLeaf.bunchId,
      counter: lastLeaf.startCounter + lastLeaf.count - 1
    };
  }
  function replaceNode(located, root, leafMapMut, parentSeqsMut, newNodes, i) {
    const parent = i === located.length - 1 ? root : located[i + 1].node;
    const indexInParent = located[i].indexInParent;
    const newChildren = parent.children.slice(0, indexInParent).concat(newNodes, parent.children.slice(indexInParent + 1));
    if (newChildren.length > M) {
      const split2 = Math.ceil(newChildren.length / 2);
      const seqs = [parent.seq, getAndBumpNextSeq(parentSeqsMut)];
      const newParents = [
        newChildren.slice(0, split2),
        newChildren.slice(split2)
      ].map(
        (children, j) => i === 0 ? new InnerNodeLeaf(seqs[j], children, leafMapMut) : new InnerNodeInner(seqs[j], children, parentSeqsMut)
      );
      if (i === located.length - 1) {
        return new InnerNodeInner(
          getAndBumpNextSeq(parentSeqsMut),
          newParents,
          parentSeqsMut
        );
      } else {
        return replaceNode(
          located,
          root,
          leafMapMut,
          parentSeqsMut,
          newParents,
          i + 1
        );
      }
    } else if (newChildren.length === 0) {
      if (i === located.length - 1) {
        return new InnerNodeInner(parent.seq, [], parentSeqsMut);
      } else {
        return replaceNode(located, root, leafMapMut, parentSeqsMut, [], i + 1);
      }
    } else {
      let newParent;
      if (i === 0) {
        newParent = new InnerNodeLeaf(
          parent.seq,
          newChildren,
          null
        );
        for (const newNode of newNodes) {
          leafMapMut.value = leafMapMut.value.set(newNode, parent.seq);
        }
      } else {
        newParent = new InnerNodeInner(
          parent.seq,
          newChildren,
          null
        );
        for (const newNode of newNodes) {
          if (newNode.seq !== located[i].node.seq) {
            parentSeqsMut.value = parentSeqsMut.value.set(
              newNode.seq,
              parent.seq
            );
          }
        }
      }
      if (i === located.length - 1) {
        return newParent;
      } else {
        return replaceNode(
          located,
          root,
          leafMapMut,
          parentSeqsMut,
          [newParent],
          i + 1
        );
      }
    }
  }
  function splitPresent(present, splitCounter) {
    const leftPresent = SparseIndices.new();
    const rightPresent = SparseIndices.new();
    const leafSlicer = present.newSlicer();
    for (const [index, count] of leafSlicer.nextSlice(splitCounter)) {
      leftPresent.set(index, count);
    }
    for (const [index, count] of leafSlicer.nextSlice(null)) {
      rightPresent.set(index, count);
    }
    return [leftPresent, rightPresent];
  }
  function* iterateNode(node, includeDeleted) {
    if (node instanceof InnerNodeInner) {
      for (const child of node.children) {
        yield* iterateNode(child, includeDeleted);
      }
    } else {
      for (const child of node.children) {
        if (includeDeleted) {
          for (let i = 0; i < child.count; i++) {
            yield { bunchId: child.bunchId, counter: child.startCounter + i };
          }
        } else {
          for (const counter of child.present.keys()) {
            yield { bunchId: child.bunchId, counter };
          }
        }
      }
    }
  }
  function* iterateNodeWithIsDeleted(node) {
    if (node instanceof InnerNodeInner) {
      for (const child of node.children) {
        yield* iterateNodeWithIsDeleted(child);
      }
    } else {
      for (const child of node.children) {
        let nextIndex = child.startCounter;
        for (const index of child.present.keys()) {
          while (nextIndex < index) {
            yield {
              id: { bunchId: child.bunchId, counter: nextIndex },
              isDeleted: true
            };
            nextIndex++;
          }
          yield {
            id: { bunchId: child.bunchId, counter: index },
            isDeleted: false
          };
          nextIndex++;
        }
        while (nextIndex < child.startCounter + child.count) {
          yield {
            id: { bunchId: child.bunchId, counter: nextIndex },
            isDeleted: true
          };
          nextIndex++;
        }
      }
    }
  }
  function saveNode(node, acc) {
    if (node instanceof InnerNodeInner) {
      for (const child of node.children) {
        saveNode(child, acc);
      }
    } else {
      for (const child of node.children) {
        let nextIndex = child.startCounter;
        for (const [index, count] of child.present.items()) {
          if (nextIndex < index) {
            pushSaveItem(acc, {
              bunchId: child.bunchId,
              startCounter: nextIndex,
              count: index - nextIndex,
              isDeleted: true
            });
          }
          pushSaveItem(acc, {
            bunchId: child.bunchId,
            startCounter: index,
            count,
            isDeleted: false
          });
          nextIndex = index + count;
        }
        if (nextIndex < child.startCounter + child.count) {
          pushSaveItem(acc, {
            bunchId: child.bunchId,
            startCounter: nextIndex,
            count: child.startCounter + child.count - nextIndex,
            isDeleted: true
          });
        }
      }
    }
  }
  function pushSaveItem(acc, item) {
    if (acc.length > 0) {
      const previous = acc.at(-1);
      if (previous.isDeleted === item.isDeleted && previous.bunchId === item.bunchId && previous.startCounter + previous.count === item.startCounter) {
        previous.count += item.count;
        return;
      }
    }
    acc.push(item);
  }
  function buildTree(leaves, leafMapMut, parentSeqsMut, startIndex, depthRemaining) {
    const parentSeq = getAndBumpNextSeq(parentSeqsMut);
    if (depthRemaining === 1) {
      return new InnerNodeLeaf(
        parentSeq,
        leaves.slice(startIndex, startIndex + M),
        leafMapMut
      );
    } else {
      const children = [];
      const childLeafCount = Math.pow(M, depthRemaining - 1);
      for (let i = 0; i < M; i++) {
        const childStartIndex = startIndex + i * childLeafCount;
        if (childStartIndex >= leaves.length) break;
        children.push(
          buildTree(
            leaves,
            leafMapMut,
            parentSeqsMut,
            childStartIndex,
            depthRemaining - 1
          )
        );
      }
      return new InnerNodeInner(parentSeq, children, parentSeqsMut);
    }
  }

  // benchmarks/src/generated/id_list_saved_state.js
  var import_minimal = __toESM(require_minimal2());
  var $Reader = import_minimal.default.Reader;
  var $Writer = import_minimal.default.Writer;
  var $util = import_minimal.default.util;
  var $Object = $util.global.Object;
  var $undefined = $util.global.undefined;
  var $Error = $util.global.Error;
  var $RangeError = $util.global.RangeError;
  var $root = import_minimal.default.roots["default"] || (import_minimal.default.roots["default"] = {});
  var TransposedSavedIdListMessage = $root.TransposedSavedIdListMessage = (() => {
    const TransposedSavedIdListMessage2 = function(properties) {
      this.bunchIds = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    TransposedSavedIdListMessage2.prototype.bunchIds = $util.emptyArray;
    TransposedSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    TransposedSavedIdListMessage2.prototype.counts = $util.emptyArray;
    TransposedSavedIdListMessage2.create = function(properties) {
      return new TransposedSavedIdListMessage2(properties);
    };
    TransposedSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.bunchIds != null && message.bunchIds.length)
        for (let i = 0; i < message.bunchIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.bunchIds[i]);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    TransposedSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
      message = _target || new $root.TransposedSavedIdListMessage();
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
          case 3: {
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
    return TransposedSavedIdListMessage2;
  })();
  var SplitTransposedSavedIdListMessage = $root.SplitTransposedSavedIdListMessage = (() => {
    const SplitTransposedSavedIdListMessage2 = function(properties) {
      this.clientIds = [];
      this.seqNums = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    SplitTransposedSavedIdListMessage2.prototype.clientIds = $util.emptyArray;
    SplitTransposedSavedIdListMessage2.prototype.seqNums = $util.emptyArray;
    SplitTransposedSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    SplitTransposedSavedIdListMessage2.prototype.counts = $util.emptyArray;
    SplitTransposedSavedIdListMessage2.create = function(properties) {
      return new SplitTransposedSavedIdListMessage2(properties);
    };
    SplitTransposedSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.clientIds != null && message.clientIds.length)
        for (let i = 0; i < message.clientIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.clientIds[i]);
      if (message.seqNums != null && message.seqNums.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.seqNums);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    SplitTransposedSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
      message = _target || new $root.SplitTransposedSavedIdListMessage();
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
    return SplitTransposedSavedIdListMessage2;
  })();
  var BunchIndexSavedIdListMessage = $root.BunchIndexSavedIdListMessage = (() => {
    const BunchIndexSavedIdListMessage2 = function(properties) {
      this.bunchIds = [];
      this.bunchIndices = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    BunchIndexSavedIdListMessage2.prototype.bunchIds = $util.emptyArray;
    BunchIndexSavedIdListMessage2.prototype.bunchIndices = $util.emptyArray;
    BunchIndexSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    BunchIndexSavedIdListMessage2.prototype.counts = $util.emptyArray;
    BunchIndexSavedIdListMessage2.create = function(properties) {
      return new BunchIndexSavedIdListMessage2(properties);
    };
    BunchIndexSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.bunchIds != null && message.bunchIds.length)
        for (let i = 0; i < message.bunchIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.bunchIds[i]);
      if (message.bunchIndices != null && message.bunchIndices.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.bunchIndices);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    BunchIndexSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
    return BunchIndexSavedIdListMessage2;
  })();
  var ClientIndexSavedIdListMessage = $root.ClientIndexSavedIdListMessage = (() => {
    const ClientIndexSavedIdListMessage2 = function(properties) {
      this.clientIds = [];
      this.clientIndices = [];
      this.seqNums = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    ClientIndexSavedIdListMessage2.prototype.clientIds = $util.emptyArray;
    ClientIndexSavedIdListMessage2.prototype.clientIndices = $util.emptyArray;
    ClientIndexSavedIdListMessage2.prototype.seqNums = $util.emptyArray;
    ClientIndexSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    ClientIndexSavedIdListMessage2.prototype.counts = $util.emptyArray;
    ClientIndexSavedIdListMessage2.create = function(properties) {
      return new ClientIndexSavedIdListMessage2(properties);
    };
    ClientIndexSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.clientIds != null && message.clientIds.length)
        for (let i = 0; i < message.clientIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.clientIds[i]);
      if (message.clientIndices != null && message.clientIndices.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.clientIndices);
      if (message.seqNums != null && message.seqNums.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.seqNums);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 5, wireType 2 =*/
          42
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    ClientIndexSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
    return ClientIndexSavedIdListMessage2;
  })();
  var BunchIndexOmitSavedIdListMessage = $root.BunchIndexOmitSavedIdListMessage = (() => {
    const BunchIndexOmitSavedIdListMessage2 = function(properties) {
      this.bunchIds = [];
      this.bunchIndices = [];
      this.startCounterIndexes = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    BunchIndexOmitSavedIdListMessage2.prototype.bunchIds = $util.emptyArray;
    BunchIndexOmitSavedIdListMessage2.prototype.bunchIndices = $util.emptyArray;
    BunchIndexOmitSavedIdListMessage2.prototype.startCounterIndexes = $util.emptyArray;
    BunchIndexOmitSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    BunchIndexOmitSavedIdListMessage2.prototype.counts = $util.emptyArray;
    BunchIndexOmitSavedIdListMessage2.create = function(properties) {
      return new BunchIndexOmitSavedIdListMessage2(properties);
    };
    BunchIndexOmitSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.bunchIds != null && message.bunchIds.length)
        for (let i = 0; i < message.bunchIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.bunchIds[i]);
      if (message.bunchIndices != null && message.bunchIndices.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.bunchIndices);
      if (message.startCounterIndexes != null && message.startCounterIndexes.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.startCounterIndexes);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 5, wireType 2 =*/
          42
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    BunchIndexOmitSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
      message = _target || new $root.BunchIndexOmitSavedIdListMessage();
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
    return BunchIndexOmitSavedIdListMessage2;
  })();
  var ClientIndexOmitSavedIdListMessage = $root.ClientIndexOmitSavedIdListMessage = (() => {
    const ClientIndexOmitSavedIdListMessage2 = function(properties) {
      this.clientIds = [];
      this.clientIndices = [];
      this.seqNums = [];
      this.startCounterIndexes = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    ClientIndexOmitSavedIdListMessage2.prototype.clientIds = $util.emptyArray;
    ClientIndexOmitSavedIdListMessage2.prototype.clientIndices = $util.emptyArray;
    ClientIndexOmitSavedIdListMessage2.prototype.seqNums = $util.emptyArray;
    ClientIndexOmitSavedIdListMessage2.prototype.startCounterIndexes = $util.emptyArray;
    ClientIndexOmitSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    ClientIndexOmitSavedIdListMessage2.prototype.counts = $util.emptyArray;
    ClientIndexOmitSavedIdListMessage2.create = function(properties) {
      return new ClientIndexOmitSavedIdListMessage2(properties);
    };
    ClientIndexOmitSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.clientIds != null && message.clientIds.length)
        for (let i = 0; i < message.clientIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.clientIds[i]);
      if (message.clientIndices != null && message.clientIndices.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.clientIndices);
      if (message.seqNums != null && message.seqNums.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.seqNums);
      if (message.startCounterIndexes != null && message.startCounterIndexes.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).uint32s(message.startCounterIndexes);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 5, wireType 2 =*/
          42
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 6, wireType 2 =*/
          50
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    ClientIndexOmitSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
      message = _target || new $root.ClientIndexOmitSavedIdListMessage();
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
          case 5: {
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
          case 6: {
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
    return ClientIndexOmitSavedIdListMessage2;
  })();
  var TransposedOmitSavedIdListMessage = $root.TransposedOmitSavedIdListMessage = (() => {
    const TransposedOmitSavedIdListMessage2 = function(properties) {
      this.bunchIds = [];
      this.startCounterIndexes = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    TransposedOmitSavedIdListMessage2.prototype.bunchIds = $util.emptyArray;
    TransposedOmitSavedIdListMessage2.prototype.startCounterIndexes = $util.emptyArray;
    TransposedOmitSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    TransposedOmitSavedIdListMessage2.prototype.counts = $util.emptyArray;
    TransposedOmitSavedIdListMessage2.create = function(properties) {
      return new TransposedOmitSavedIdListMessage2(properties);
    };
    TransposedOmitSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.bunchIds != null && message.bunchIds.length)
        for (let i = 0; i < message.bunchIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.bunchIds[i]);
      if (message.startCounterIndexes != null && message.startCounterIndexes.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.startCounterIndexes);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    TransposedOmitSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
      message = _target || new $root.TransposedOmitSavedIdListMessage();
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
    return TransposedOmitSavedIdListMessage2;
  })();
  var SplitTransposedOmitSavedIdListMessage = $root.SplitTransposedOmitSavedIdListMessage = (() => {
    const SplitTransposedOmitSavedIdListMessage2 = function(properties) {
      this.clientIds = [];
      this.seqNums = [];
      this.startCounterIndexes = [];
      this.startCounters = [];
      this.counts = [];
      if (properties) {
        for (let keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
          if (properties[keys[i]] != null && keys[i] !== "__proto__")
            this[keys[i]] = properties[keys[i]];
      }
    };
    SplitTransposedOmitSavedIdListMessage2.prototype.clientIds = $util.emptyArray;
    SplitTransposedOmitSavedIdListMessage2.prototype.seqNums = $util.emptyArray;
    SplitTransposedOmitSavedIdListMessage2.prototype.startCounterIndexes = $util.emptyArray;
    SplitTransposedOmitSavedIdListMessage2.prototype.startCounters = $util.emptyArray;
    SplitTransposedOmitSavedIdListMessage2.prototype.counts = $util.emptyArray;
    SplitTransposedOmitSavedIdListMessage2.create = function(properties) {
      return new SplitTransposedOmitSavedIdListMessage2(properties);
    };
    SplitTransposedOmitSavedIdListMessage2.encode = function(message, writer, _depth) {
      if (!writer)
        writer = $Writer.create();
      if (_depth === $undefined)
        _depth = 0;
      if (_depth > $util.recursionLimit)
        throw $Error("max depth exceeded");
      if (message.clientIds != null && message.clientIds.length)
        for (let i = 0; i < message.clientIds.length; ++i)
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.clientIds[i]);
      if (message.seqNums != null && message.seqNums.length)
        writer.uint32(
          /* id 2, wireType 2 =*/
          18
        ).uint32s(message.seqNums);
      if (message.startCounterIndexes != null && message.startCounterIndexes.length)
        writer.uint32(
          /* id 3, wireType 2 =*/
          26
        ).uint32s(message.startCounterIndexes);
      if (message.startCounters != null && message.startCounters.length)
        writer.uint32(
          /* id 4, wireType 2 =*/
          34
        ).uint32s(message.startCounters);
      if (message.counts != null && message.counts.length)
        writer.uint32(
          /* id 5, wireType 2 =*/
          42
        ).sint32s(message.counts);
      if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
        for (let i = 0; i < message.$unknowns.length; ++i)
          writer.raw(message.$unknowns[i]);
      return writer;
    };
    SplitTransposedOmitSavedIdListMessage2.decode = function(reader, length, _end, _depth, _target) {
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
      message = _target || new $root.SplitTransposedOmitSavedIdListMessage();
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
    return SplitTransposedOmitSavedIdListMessage2;
  })();

  // node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js
  var __defProp2 = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp2(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __name = (target, value) => __defProp2(target, "name", { value, configurable: true });
  var __export = (target, all) => {
    for (var name in all)
      __defProp2(target, name, { get: all[name], enumerable: true });
  };
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  var utils_exports = {};
  __export(utils_exports, {
    addChainableMethod: () => addChainableMethod,
    addLengthGuard: () => addLengthGuard,
    addMethod: () => addMethod,
    addProperty: () => addProperty,
    checkError: () => check_error_exports,
    compareByInspect: () => compareByInspect,
    eql: () => deep_eql_default,
    events: () => events,
    expectTypes: () => expectTypes,
    flag: () => flag,
    getActual: () => getActual,
    getMessage: () => getMessage2,
    getName: () => getName,
    getOperator: () => getOperator,
    getOwnEnumerableProperties: () => getOwnEnumerableProperties,
    getOwnEnumerablePropertySymbols: () => getOwnEnumerablePropertySymbols,
    getPathInfo: () => getPathInfo,
    hasProperty: () => hasProperty,
    inspect: () => inspect2,
    isNaN: () => isNaN22,
    isNumeric: () => isNumeric,
    isProxyEnabled: () => isProxyEnabled,
    isRegExp: () => isRegExp2,
    objDisplay: () => objDisplay,
    overwriteChainableMethod: () => overwriteChainableMethod,
    overwriteMethod: () => overwriteMethod,
    overwriteProperty: () => overwriteProperty,
    proxify: () => proxify,
    test: () => test,
    transferFlags: () => transferFlags,
    type: () => type
  });
  var check_error_exports = {};
  __export(check_error_exports, {
    compatibleConstructor: () => compatibleConstructor,
    compatibleInstance: () => compatibleInstance,
    compatibleMessage: () => compatibleMessage,
    getConstructorName: () => getConstructorName,
    getMessage: () => getMessage
  });
  function isErrorInstance(obj) {
    return obj instanceof Error || Object.prototype.toString.call(obj) === "[object Error]";
  }
  __name(isErrorInstance, "isErrorInstance");
  function isRegExp(obj) {
    return Object.prototype.toString.call(obj) === "[object RegExp]";
  }
  __name(isRegExp, "isRegExp");
  function compatibleInstance(thrown, errorLike) {
    return isErrorInstance(errorLike) && thrown === errorLike;
  }
  __name(compatibleInstance, "compatibleInstance");
  function compatibleConstructor(thrown, errorLike) {
    if (isErrorInstance(errorLike)) {
      return thrown.constructor === errorLike.constructor || thrown instanceof errorLike.constructor;
    } else if ((typeof errorLike === "object" || typeof errorLike === "function") && errorLike.prototype) {
      return thrown.constructor === errorLike || thrown instanceof errorLike;
    }
    return false;
  }
  __name(compatibleConstructor, "compatibleConstructor");
  function compatibleMessage(thrown, errMatcher) {
    const comparisonString = typeof thrown === "string" ? thrown : thrown.message;
    if (isRegExp(errMatcher)) {
      return errMatcher.test(comparisonString);
    } else if (typeof errMatcher === "string") {
      return comparisonString.indexOf(errMatcher) !== -1;
    }
    return false;
  }
  __name(compatibleMessage, "compatibleMessage");
  function getConstructorName(errorLike) {
    let constructorName = errorLike;
    if (isErrorInstance(errorLike)) {
      constructorName = errorLike.constructor.name;
    } else if (typeof errorLike === "function") {
      constructorName = errorLike.name;
      if (constructorName === "") {
        const newConstructorName = new errorLike().name;
        constructorName = newConstructorName || constructorName;
      }
    }
    return constructorName;
  }
  __name(getConstructorName, "getConstructorName");
  function getMessage(errorLike) {
    let msg = "";
    if (errorLike && errorLike.message) {
      msg = errorLike.message;
    } else if (typeof errorLike === "string") {
      msg = errorLike;
    }
    return msg;
  }
  __name(getMessage, "getMessage");
  function flag(obj, key, value) {
    let flags = obj.__flags || (obj.__flags = /* @__PURE__ */ Object.create(null));
    if (arguments.length === 3) {
      flags[key] = value;
    } else {
      return flags[key];
    }
  }
  __name(flag, "flag");
  function test(obj, args) {
    let negate = flag(obj, "negate"), expr = args[0];
    return negate ? !expr : expr;
  }
  __name(test, "test");
  function type(obj) {
    if (typeof obj === "undefined") {
      return "undefined";
    }
    if (obj === null) {
      return "null";
    }
    const stringTag = obj[Symbol.toStringTag];
    if (typeof stringTag === "string") {
      return stringTag;
    }
    const type3 = Object.prototype.toString.call(obj).slice(8, -1);
    return type3;
  }
  __name(type, "type");
  var canElideFrames = "captureStackTrace" in Error;
  var _AssertionError = class _AssertionError2 extends Error {
    constructor(message = "Unspecified AssertionError", props, ssf) {
      super(message);
      __publicField(this, "message");
      this.message = message;
      if (canElideFrames) {
        Error.captureStackTrace(this, ssf || _AssertionError2);
      }
      for (const key in props) {
        if (!(key in this)) {
          this[key] = props[key];
        }
      }
    }
    get name() {
      return "AssertionError";
    }
    get ok() {
      return false;
    }
    toJSON(stack) {
      return {
        ...this,
        name: this.name,
        message: this.message,
        ok: false,
        stack: stack !== false ? this.stack : void 0
      };
    }
  };
  __name(_AssertionError, "AssertionError");
  var AssertionError = _AssertionError;
  function expectTypes(obj, types) {
    let flagMsg = flag(obj, "message");
    let ssfi = flag(obj, "ssfi");
    flagMsg = flagMsg ? flagMsg + ": " : "";
    obj = flag(obj, "object");
    types = types.map(function(t) {
      return t.toLowerCase();
    });
    types.sort();
    let str = types.map(function(t, index) {
      let art = ~["a", "e", "i", "o", "u"].indexOf(t.charAt(0)) ? "an" : "a";
      let or = types.length > 1 && index === types.length - 1 ? "or " : "";
      return or + art + " " + t;
    }).join(", ");
    let objType = type(obj).toLowerCase();
    if (!types.some(function(expected2) {
      return objType === expected2;
    })) {
      throw new AssertionError(
        flagMsg + "object tested must be " + str + ", but " + objType + " given",
        void 0,
        ssfi
      );
    }
  }
  __name(expectTypes, "expectTypes");
  function getActual(obj, args) {
    return args.length > 4 ? args[4] : obj._obj;
  }
  __name(getActual, "getActual");
  var ansiColors = {
    bold: ["1", "22"],
    dim: ["2", "22"],
    italic: ["3", "23"],
    underline: ["4", "24"],
    // 5 & 6 are blinking
    inverse: ["7", "27"],
    hidden: ["8", "28"],
    strike: ["9", "29"],
    // 10-20 are fonts
    // 21-29 are resets for 1-9
    black: ["30", "39"],
    red: ["31", "39"],
    green: ["32", "39"],
    yellow: ["33", "39"],
    blue: ["34", "39"],
    magenta: ["35", "39"],
    cyan: ["36", "39"],
    white: ["37", "39"],
    brightblack: ["30;1", "39"],
    brightred: ["31;1", "39"],
    brightgreen: ["32;1", "39"],
    brightyellow: ["33;1", "39"],
    brightblue: ["34;1", "39"],
    brightmagenta: ["35;1", "39"],
    brightcyan: ["36;1", "39"],
    brightwhite: ["37;1", "39"],
    grey: ["90", "39"]
  };
  var styles = {
    special: "cyan",
    number: "yellow",
    bigint: "yellow",
    boolean: "yellow",
    undefined: "grey",
    null: "bold",
    string: "green",
    symbol: "green",
    date: "magenta",
    regexp: "red"
  };
  var truncator = "\u2026";
  function colorise(value, styleType) {
    const color = ansiColors[styles[styleType]] || ansiColors[styleType] || "";
    if (!color) {
      return String(value);
    }
    return `\x1B[${color[0]}m${String(value)}\x1B[${color[1]}m`;
  }
  __name(colorise, "colorise");
  function normaliseOptions({
    showHidden = false,
    depth = 2,
    colors = false,
    customInspect = true,
    showProxy = false,
    maxArrayLength = Infinity,
    breakLength = Infinity,
    seen = [],
    // eslint-disable-next-line no-shadow
    truncate: truncate2 = Infinity,
    stylize = String
  } = {}, inspect3) {
    const options = {
      showHidden: Boolean(showHidden),
      depth: Number(depth),
      colors: Boolean(colors),
      customInspect: Boolean(customInspect),
      showProxy: Boolean(showProxy),
      maxArrayLength: Number(maxArrayLength),
      breakLength: Number(breakLength),
      truncate: Number(truncate2),
      seen,
      inspect: inspect3,
      stylize
    };
    if (options.colors) {
      options.stylize = colorise;
    }
    return options;
  }
  __name(normaliseOptions, "normaliseOptions");
  function isHighSurrogate(char) {
    return char >= "\uD800" && char <= "\uDBFF";
  }
  __name(isHighSurrogate, "isHighSurrogate");
  function truncate(string, length, tail = truncator) {
    string = String(string);
    const tailLength = tail.length;
    const stringLength = string.length;
    if (tailLength > length && stringLength > tailLength) {
      return tail;
    }
    if (stringLength > length && stringLength > tailLength) {
      let end = length - tailLength;
      if (end > 0 && isHighSurrogate(string[end - 1])) {
        end = end - 1;
      }
      return `${string.slice(0, end)}${tail}`;
    }
    return string;
  }
  __name(truncate, "truncate");
  function inspectList(list, options, inspectItem, separator = ", ") {
    inspectItem = inspectItem || options.inspect;
    const size = list.length;
    if (size === 0)
      return "";
    const originalLength = options.truncate;
    let output = "";
    let peek = "";
    let truncated = "";
    for (let i = 0; i < size; i += 1) {
      const last = i + 1 === list.length;
      const secondToLast = i + 2 === list.length;
      truncated = `${truncator}(${list.length - i})`;
      const value = list[i];
      options.truncate = originalLength - output.length - (last ? 0 : separator.length);
      const string = peek || inspectItem(value, options) + (last ? "" : separator);
      const nextLength = output.length + string.length;
      const truncatedLength = nextLength + truncated.length;
      if (last && nextLength > originalLength && output.length + truncated.length <= originalLength) {
        break;
      }
      if (!last && !secondToLast && truncatedLength > originalLength) {
        break;
      }
      peek = last ? "" : inspectItem(list[i + 1], options) + (secondToLast ? "" : separator);
      if (!last && secondToLast && truncatedLength > originalLength && nextLength + peek.length > originalLength) {
        break;
      }
      output += string;
      if (!last && !secondToLast && nextLength + peek.length >= originalLength) {
        truncated = `${truncator}(${list.length - i - 1})`;
        break;
      }
      truncated = "";
    }
    return `${output}${truncated}`;
  }
  __name(inspectList, "inspectList");
  function quoteComplexKey(key) {
    if (key.match(/^[a-zA-Z_][a-zA-Z_0-9]*$/)) {
      return key;
    }
    return JSON.stringify(key).replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
  }
  __name(quoteComplexKey, "quoteComplexKey");
  function inspectProperty([key, value], options) {
    options.truncate -= 2;
    if (typeof key === "string") {
      key = quoteComplexKey(key);
    } else if (typeof key !== "number") {
      key = `[${options.inspect(key, options)}]`;
    }
    options.truncate -= key.length;
    value = options.inspect(value, options);
    return `${key}: ${value}`;
  }
  __name(inspectProperty, "inspectProperty");
  function inspectArray(array, options) {
    const nonIndexProperties = Object.keys(array).slice(array.length);
    if (!array.length && !nonIndexProperties.length)
      return "[]";
    options.truncate -= 4;
    const listContents = inspectList(array, options);
    options.truncate -= listContents.length;
    let propertyContents = "";
    if (nonIndexProperties.length) {
      propertyContents = inspectList(nonIndexProperties.map((key) => [key, array[key]]), options, inspectProperty);
    }
    return `[ ${listContents}${propertyContents ? `, ${propertyContents}` : ""} ]`;
  }
  __name(inspectArray, "inspectArray");
  var getArrayName = /* @__PURE__ */ __name((array) => {
    if (typeof Buffer === "function" && array instanceof Buffer) {
      return "Buffer";
    }
    if (array[Symbol.toStringTag]) {
      return array[Symbol.toStringTag];
    }
    return array.constructor.name;
  }, "getArrayName");
  function inspectTypedArray(array, options) {
    const name = getArrayName(array);
    options.truncate -= name.length + 4;
    const nonIndexProperties = Object.keys(array).slice(array.length);
    if (!array.length && !nonIndexProperties.length)
      return `${name}[]`;
    let output = "";
    for (let i = 0; i < array.length; i++) {
      const string = `${options.stylize(truncate(array[i], options.truncate), "number")}${i === array.length - 1 ? "" : ", "}`;
      options.truncate -= string.length;
      if (array[i] !== array.length && options.truncate <= 3) {
        output += `${truncator}(${array.length - array[i] + 1})`;
        break;
      }
      output += string;
    }
    let propertyContents = "";
    if (nonIndexProperties.length) {
      propertyContents = inspectList(nonIndexProperties.map((key) => [key, array[key]]), options, inspectProperty);
    }
    return `${name}[ ${output}${propertyContents ? `, ${propertyContents}` : ""} ]`;
  }
  __name(inspectTypedArray, "inspectTypedArray");
  function inspectDate(dateObject, options) {
    const stringRepresentation = dateObject.toJSON();
    if (stringRepresentation === null) {
      return "Invalid Date";
    }
    const split2 = stringRepresentation.split("T");
    const date = split2[0];
    return options.stylize(`${date}T${truncate(split2[1], options.truncate - date.length - 1)}`, "date");
  }
  __name(inspectDate, "inspectDate");
  function inspectFunction(func, options) {
    const functionType = func[Symbol.toStringTag] || "Function";
    const name = func.name;
    if (!name) {
      return options.stylize(`[${functionType}]`, "special");
    }
    return options.stylize(`[${functionType} ${truncate(name, options.truncate - 11)}]`, "special");
  }
  __name(inspectFunction, "inspectFunction");
  function inspectMapEntry([key, value], options) {
    options.truncate -= 4;
    key = options.inspect(key, options);
    options.truncate -= key.length;
    value = options.inspect(value, options);
    return `${key} => ${value}`;
  }
  __name(inspectMapEntry, "inspectMapEntry");
  function mapToEntries(map) {
    const entries = [];
    map.forEach((value, key) => {
      entries.push([key, value]);
    });
    return entries;
  }
  __name(mapToEntries, "mapToEntries");
  function inspectMap(map, options) {
    if (map.size === 0)
      return "Map{}";
    options.truncate -= 7;
    return `Map{ ${inspectList(mapToEntries(map), options, inspectMapEntry)} }`;
  }
  __name(inspectMap, "inspectMap");
  var isNaN2 = Number.isNaN || ((i) => i !== i);
  function inspectNumber(number, options) {
    if (isNaN2(number)) {
      return options.stylize("NaN", "number");
    }
    if (number === Infinity) {
      return options.stylize("Infinity", "number");
    }
    if (number === -Infinity) {
      return options.stylize("-Infinity", "number");
    }
    if (number === 0) {
      return options.stylize(1 / number === Infinity ? "+0" : "-0", "number");
    }
    return options.stylize(truncate(String(number), options.truncate), "number");
  }
  __name(inspectNumber, "inspectNumber");
  function inspectBigInt(number, options) {
    let nums = truncate(number.toString(), options.truncate - 1);
    if (nums !== truncator)
      nums += "n";
    return options.stylize(nums, "bigint");
  }
  __name(inspectBigInt, "inspectBigInt");
  function inspectRegExp(value, options) {
    const flags = value.toString().split("/")[2];
    const sourceLength = options.truncate - (2 + flags.length);
    const source = value.source;
    return options.stylize(`/${truncate(source, sourceLength)}/${flags}`, "regexp");
  }
  __name(inspectRegExp, "inspectRegExp");
  function arrayFromSet(set2) {
    const values = [];
    set2.forEach((value) => {
      values.push(value);
    });
    return values;
  }
  __name(arrayFromSet, "arrayFromSet");
  function inspectSet(set2, options) {
    if (set2.size === 0)
      return "Set{}";
    options.truncate -= 7;
    return `Set{ ${inspectList(arrayFromSet(set2), options)} }`;
  }
  __name(inspectSet, "inspectSet");
  var stringEscapeChars = new RegExp("['\\u0000-\\u001f\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]", "g");
  var escapeCharacters = {
    "\b": "\\b",
    "	": "\\t",
    "\n": "\\n",
    "\f": "\\f",
    "\r": "\\r",
    "'": "\\'",
    "\\": "\\\\"
  };
  var hex = 16;
  var unicodeLength = 4;
  function escape(char) {
    return escapeCharacters[char] || `\\u${`0000${char.charCodeAt(0).toString(hex)}`.slice(-unicodeLength)}`;
  }
  __name(escape, "escape");
  function inspectString(string, options) {
    if (stringEscapeChars.test(string)) {
      string = string.replace(stringEscapeChars, escape);
    }
    return options.stylize(`'${truncate(string, options.truncate - 2)}'`, "string");
  }
  __name(inspectString, "inspectString");
  function inspectSymbol(value) {
    if ("description" in Symbol.prototype) {
      return value.description ? `Symbol(${value.description})` : "Symbol()";
    }
    return value.toString();
  }
  __name(inspectSymbol, "inspectSymbol");
  var getPromiseValue = /* @__PURE__ */ __name(() => "Promise{\u2026}", "getPromiseValue");
  var promise_default = getPromiseValue;
  function inspectObject(object, options) {
    const properties = Object.getOwnPropertyNames(object);
    const symbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(object) : [];
    if (properties.length === 0 && symbols.length === 0) {
      return "{}";
    }
    options.truncate -= 4;
    options.seen = options.seen || [];
    if (options.seen.includes(object)) {
      return "[Circular]";
    }
    options.seen.push(object);
    const propertyContents = inspectList(properties.map((key) => [key, object[key]]), options, inspectProperty);
    const symbolContents = inspectList(symbols.map((key) => [key, object[key]]), options, inspectProperty);
    options.seen.pop();
    let sep = "";
    if (propertyContents && symbolContents) {
      sep = ", ";
    }
    return `{ ${propertyContents}${sep}${symbolContents} }`;
  }
  __name(inspectObject, "inspectObject");
  var toStringTag = typeof Symbol !== "undefined" && Symbol.toStringTag ? Symbol.toStringTag : false;
  function inspectClass(value, options) {
    let name = "";
    if (toStringTag && toStringTag in value) {
      name = value[toStringTag];
    }
    name = name || value.constructor.name;
    if (!name || name === "_class") {
      name = "<Anonymous Class>";
    }
    options.truncate -= name.length;
    return `${name}${inspectObject(value, options)}`;
  }
  __name(inspectClass, "inspectClass");
  function inspectArguments(args, options) {
    if (args.length === 0)
      return "Arguments[]";
    options.truncate -= 13;
    return `Arguments[ ${inspectList(args, options)} ]`;
  }
  __name(inspectArguments, "inspectArguments");
  var errorKeys = [
    "stack",
    "line",
    "column",
    "name",
    "message",
    "fileName",
    "lineNumber",
    "columnNumber",
    "number",
    "description",
    "cause"
  ];
  function inspectObject2(error, options) {
    const properties = Object.getOwnPropertyNames(error).filter((key) => errorKeys.indexOf(key) === -1);
    const name = error.name;
    options.truncate -= name.length;
    let message = "";
    if (typeof error.message === "string") {
      message = truncate(error.message, options.truncate);
    } else {
      properties.unshift("message");
    }
    message = message ? `: ${message}` : "";
    options.truncate -= message.length + 5;
    options.seen = options.seen || [];
    if (options.seen.includes(error)) {
      return "[Circular]";
    }
    options.seen.push(error);
    const propertyContents = inspectList(properties.map((key) => [key, error[key]]), options, inspectProperty);
    return `${name}${message}${propertyContents ? ` { ${propertyContents} }` : ""}`;
  }
  __name(inspectObject2, "inspectObject");
  function inspectAttribute([key, value], options) {
    options.truncate -= 3;
    if (!value) {
      return `${options.stylize(String(key), "yellow")}`;
    }
    return `${options.stylize(String(key), "yellow")}=${options.stylize(`"${value}"`, "string")}`;
  }
  __name(inspectAttribute, "inspectAttribute");
  function inspectNodeCollection(collection, options) {
    return inspectList(collection, options, inspectNode, "\n");
  }
  __name(inspectNodeCollection, "inspectNodeCollection");
  function inspectNode(node, options) {
    switch (node.nodeType) {
      case 1:
        return inspectHTML(node, options);
      case 3:
        return options.inspect(node.data, options);
      default:
        return options.inspect(node, options);
    }
  }
  __name(inspectNode, "inspectNode");
  function inspectHTML(element, options) {
    const properties = element.getAttributeNames();
    const name = element.tagName.toLowerCase();
    const head = options.stylize(`<${name}`, "special");
    const headClose = options.stylize(`>`, "special");
    const tail = options.stylize(`</${name}>`, "special");
    options.truncate -= name.length * 2 + 5;
    let propertyContents = "";
    if (properties.length > 0) {
      propertyContents += " ";
      propertyContents += inspectList(properties.map((key) => [key, element.getAttribute(key)]), options, inspectAttribute, " ");
    }
    options.truncate -= propertyContents.length;
    const truncate2 = options.truncate;
    let children = inspectNodeCollection(element.children, options);
    if (children && children.length > truncate2) {
      children = `${truncator}(${element.children.length})`;
    }
    return `${head}${propertyContents}${headClose}${children}${tail}`;
  }
  __name(inspectHTML, "inspectHTML");
  var symbolsSupported = typeof Symbol === "function" && typeof Symbol.for === "function";
  var chaiInspect = symbolsSupported ? /* @__PURE__ */ Symbol.for("chai/inspect") : "@@chai/inspect";
  var nodeInspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
  var constructorMap = /* @__PURE__ */ new WeakMap();
  var stringTagMap = {};
  var baseTypesMap = {
    undefined: /* @__PURE__ */ __name((value, options) => options.stylize("undefined", "undefined"), "undefined"),
    null: /* @__PURE__ */ __name((value, options) => options.stylize("null", "null"), "null"),
    boolean: /* @__PURE__ */ __name((value, options) => options.stylize(String(value), "boolean"), "boolean"),
    Boolean: /* @__PURE__ */ __name((value, options) => options.stylize(String(value), "boolean"), "Boolean"),
    number: inspectNumber,
    Number: inspectNumber,
    bigint: inspectBigInt,
    BigInt: inspectBigInt,
    string: inspectString,
    String: inspectString,
    function: inspectFunction,
    Function: inspectFunction,
    symbol: inspectSymbol,
    // A Symbol polyfill will return `Symbol` not `symbol` from typedetect
    Symbol: inspectSymbol,
    Array: inspectArray,
    Date: inspectDate,
    Map: inspectMap,
    Set: inspectSet,
    RegExp: inspectRegExp,
    Promise: promise_default,
    // WeakSet, WeakMap are totally opaque to us
    WeakSet: /* @__PURE__ */ __name((value, options) => options.stylize("WeakSet{\u2026}", "special"), "WeakSet"),
    WeakMap: /* @__PURE__ */ __name((value, options) => options.stylize("WeakMap{\u2026}", "special"), "WeakMap"),
    Arguments: inspectArguments,
    Int8Array: inspectTypedArray,
    Uint8Array: inspectTypedArray,
    Uint8ClampedArray: inspectTypedArray,
    Int16Array: inspectTypedArray,
    Uint16Array: inspectTypedArray,
    Int32Array: inspectTypedArray,
    Uint32Array: inspectTypedArray,
    Float32Array: inspectTypedArray,
    Float64Array: inspectTypedArray,
    Generator: /* @__PURE__ */ __name(() => "", "Generator"),
    DataView: /* @__PURE__ */ __name(() => "", "DataView"),
    ArrayBuffer: /* @__PURE__ */ __name(() => "", "ArrayBuffer"),
    Error: inspectObject2,
    HTMLCollection: inspectNodeCollection,
    NodeList: inspectNodeCollection
  };
  var inspectCustom = /* @__PURE__ */ __name((value, options, type3, inspectFn) => {
    if (chaiInspect in value && typeof value[chaiInspect] === "function") {
      return value[chaiInspect](options);
    }
    if (nodeInspect in value && typeof value[nodeInspect] === "function") {
      return value[nodeInspect](options.depth, options, inspectFn);
    }
    if ("inspect" in value && typeof value.inspect === "function") {
      return value.inspect(options.depth, options);
    }
    if ("constructor" in value && constructorMap.has(value.constructor)) {
      return constructorMap.get(value.constructor)(value, options);
    }
    if (stringTagMap[type3]) {
      return stringTagMap[type3](value, options);
    }
    return "";
  }, "inspectCustom");
  var toString = Object.prototype.toString;
  function inspect(value, opts = {}) {
    const options = normaliseOptions(opts, inspect);
    const { customInspect } = options;
    let type3 = value === null ? "null" : typeof value;
    if (type3 === "object") {
      type3 = toString.call(value).slice(8, -1);
    }
    if (type3 in baseTypesMap) {
      return baseTypesMap[type3](value, options);
    }
    if (customInspect && value) {
      const output = inspectCustom(value, options, type3, inspect);
      if (output) {
        if (typeof output === "string")
          return output;
        return inspect(output, options);
      }
    }
    const proto = value ? Object.getPrototypeOf(value) : false;
    if (proto === Object.prototype || proto === null) {
      return inspectObject(value, options);
    }
    if (value && typeof HTMLElement === "function" && value instanceof HTMLElement) {
      return inspectHTML(value, options);
    }
    if ("constructor" in value) {
      if (value.constructor !== Object) {
        return inspectClass(value, options);
      }
      return inspectObject(value, options);
    }
    if (value === Object(value)) {
      return inspectObject(value, options);
    }
    return options.stylize(String(value), type3);
  }
  __name(inspect, "inspect");
  var config = {
    /**
     * ### config.includeStack
     *
     * User configurable property, influences whether stack trace
     * is included in Assertion error message. Default of false
     * suppresses stack trace in the error message.
     *
     *     chai.config.includeStack = true;  // enable stack on error
     *
     * @param {boolean}
     * @public
     */
    includeStack: false,
    /**
     * ### config.showDiff
     *
     * User configurable property, influences whether or not
     * the `showDiff` flag should be included in the thrown
     * AssertionErrors. `false` will always be `false`; `true`
     * will be true when the assertion has requested a diff
     * be shown.
     *
     * @param {boolean}
     * @public
     */
    showDiff: true,
    /**
     * ### config.truncateThreshold
     *
     * User configurable property, sets length threshold for actual and
     * expected values in assertion errors. If this threshold is exceeded, for
     * example for large data structures, the value is replaced with something
     * like `[ Array(3) ]` or `{ Object (prop1, prop2) }`.
     *
     * Set it to zero if you want to disable truncating altogether.
     *
     * This is especially userful when doing assertions on arrays: having this
     * set to a reasonable large value makes the failure messages readily
     * inspectable.
     *
     *     chai.config.truncateThreshold = 0;  // disable truncating
     *
     * @param {number}
     * @public
     */
    truncateThreshold: 40,
    /**
     * ### config.useProxy
     *
     * User configurable property, defines if chai will use a Proxy to throw
     * an error when a non-existent property is read, which protects users
     * from typos when using property-based assertions.
     *
     * Set it to false if you want to disable this feature.
     *
     *     chai.config.useProxy = false;  // disable use of Proxy
     *
     * This feature is automatically disabled regardless of this config value
     * in environments that don't support proxies.
     *
     * @param {boolean}
     * @public
     */
    useProxy: true,
    /**
     * ### config.proxyExcludedKeys
     *
     * User configurable property, defines which properties should be ignored
     * instead of throwing an error if they do not exist on the assertion.
     * This is only applied if the environment Chai is running in supports proxies and
     * if the `useProxy` configuration setting is enabled.
     * By default, `then` and `inspect` will not throw an error if they do not exist on the
     * assertion object because the `.inspect` property is read by `util.inspect` (for example, when
     * using `console.log` on the assertion object) and `.then` is necessary for promise type-checking.
     *
     *     // By default these keys will not throw an error if they do not exist on the assertion object
     *     chai.config.proxyExcludedKeys = ['then', 'inspect'];
     *
     * @param {Array}
     * @public
     */
    proxyExcludedKeys: ["then", "catch", "inspect", "toJSON"],
    /**
     * ### config.deepEqual
     *
     * User configurable property, defines which a custom function to use for deepEqual
     * comparisons.
     * By default, the function used is the one from the `deep-eql` package without custom comparator.
     *
     *     // use a custom comparator
     *     chai.config.deepEqual = (expected, actual) => {
     *         return chai.util.eql(expected, actual, {
     *             comparator: (expected, actual) => {
     *                 // for non number comparison, use the default behavior
     *                 if(typeof expected !== 'number') return null;
     *                 // allow a difference of 10 between compared numbers
     *                 return typeof actual === 'number' && Math.abs(actual - expected) < 10
     *             }
     *         })
     *     };
     *
     * @param {Function}
     * @public
     */
    deepEqual: null
  };
  function inspect2(obj, showHidden, depth, colors) {
    let options = {
      colors,
      depth: typeof depth === "undefined" ? 2 : depth,
      showHidden,
      truncate: config.truncateThreshold ? config.truncateThreshold : Infinity
    };
    return inspect(obj, options);
  }
  __name(inspect2, "inspect");
  function objDisplay(obj) {
    let str = inspect2(obj), type3 = Object.prototype.toString.call(obj);
    if (config.truncateThreshold && str.length >= config.truncateThreshold) {
      if (type3 === "[object Function]") {
        return !obj.name || obj.name === "" ? "[Function]" : "[Function: " + obj.name + "]";
      } else if (type3 === "[object Array]") {
        return "[ Array(" + obj.length + ") ]";
      } else if (type3 === "[object Object]") {
        let keys = Object.keys(obj), kstr = keys.length > 2 ? keys.splice(0, 2).join(", ") + ", ..." : keys.join(", ");
        return "{ Object (" + kstr + ") }";
      } else {
        return str;
      }
    } else {
      return str;
    }
  }
  __name(objDisplay, "objDisplay");
  function getMessage2(obj, args) {
    let negate = flag(obj, "negate");
    let val = flag(obj, "object");
    let expected2 = args[3];
    let actual = getActual(obj, args);
    let msg = negate ? args[2] : args[1];
    let flagMsg = flag(obj, "message");
    if (typeof msg === "function") msg = msg();
    msg = msg || "";
    msg = msg.replace(/#\{this\}/g, function() {
      return objDisplay(val);
    }).replace(/#\{act\}/g, function() {
      return objDisplay(actual);
    }).replace(/#\{exp\}/g, function() {
      return objDisplay(expected2);
    });
    return flagMsg ? flagMsg + ": " + msg : msg;
  }
  __name(getMessage2, "getMessage");
  function transferFlags(assertion, object, includeAll) {
    let flags = assertion.__flags || (assertion.__flags = /* @__PURE__ */ Object.create(null));
    if (!object.__flags) {
      object.__flags = /* @__PURE__ */ Object.create(null);
    }
    includeAll = arguments.length === 3 ? includeAll : true;
    for (let flag3 in flags) {
      if (includeAll || flag3 !== "object" && flag3 !== "ssfi" && flag3 !== "lockSsfi" && flag3 != "message") {
        object.__flags[flag3] = flags[flag3];
      }
    }
  }
  __name(transferFlags, "transferFlags");
  function type2(obj) {
    if (typeof obj === "undefined") {
      return "undefined";
    }
    if (obj === null) {
      return "null";
    }
    const stringTag = obj[Symbol.toStringTag];
    if (typeof stringTag === "string") {
      return stringTag;
    }
    const sliceStart = 8;
    const sliceEnd = -1;
    return Object.prototype.toString.call(obj).slice(sliceStart, sliceEnd);
  }
  __name(type2, "type");
  function FakeMap() {
    this._key = "chai/deep-eql__" + Math.random() + Date.now();
  }
  __name(FakeMap, "FakeMap");
  FakeMap.prototype = {
    get: /* @__PURE__ */ __name(function get(key) {
      return key[this._key];
    }, "get"),
    set: /* @__PURE__ */ __name(function set(key, value) {
      if (Object.isExtensible(key)) {
        Object.defineProperty(key, this._key, {
          value,
          configurable: true
        });
      }
    }, "set")
  };
  var MemoizeMap = typeof WeakMap === "function" ? WeakMap : FakeMap;
  function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
    if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
      return null;
    }
    var leftHandMap = memoizeMap.get(leftHandOperand);
    if (leftHandMap) {
      var result = leftHandMap.get(rightHandOperand);
      if (typeof result === "boolean") {
        return result;
      }
    }
    return null;
  }
  __name(memoizeCompare, "memoizeCompare");
  function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
    if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
      return;
    }
    var leftHandMap = memoizeMap.get(leftHandOperand);
    if (leftHandMap) {
      leftHandMap.set(rightHandOperand, result);
    } else {
      leftHandMap = new MemoizeMap();
      leftHandMap.set(rightHandOperand, result);
      memoizeMap.set(leftHandOperand, leftHandMap);
    }
  }
  __name(memoizeSet, "memoizeSet");
  var deep_eql_default = deepEqual;
  function deepEqual(leftHandOperand, rightHandOperand, options) {
    if (options && options.comparator) {
      return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
    }
    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
    if (simpleResult !== null) {
      return simpleResult;
    }
    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
  }
  __name(deepEqual, "deepEqual");
  function simpleEqual(leftHandOperand, rightHandOperand) {
    if (leftHandOperand === rightHandOperand) {
      return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
    }
    if (leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
    rightHandOperand !== rightHandOperand) {
      return true;
    }
    if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
      return false;
    }
    return null;
  }
  __name(simpleEqual, "simpleEqual");
  function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
    options = options || {};
    options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
    var comparator = options && options.comparator;
    var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
    if (memoizeResultLeft !== null) {
      return memoizeResultLeft;
    }
    var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
    if (memoizeResultRight !== null) {
      return memoizeResultRight;
    }
    if (comparator) {
      var comparatorResult = comparator(leftHandOperand, rightHandOperand);
      if (comparatorResult === false || comparatorResult === true) {
        memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
        return comparatorResult;
      }
      var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
      if (simpleResult !== null) {
        return simpleResult;
      }
    }
    var leftHandType = type2(leftHandOperand);
    if (leftHandType !== type2(rightHandOperand)) {
      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
      return false;
    }
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);
    var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
    return result;
  }
  __name(extensiveDeepEqual, "extensiveDeepEqual");
  function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
    switch (leftHandType) {
      case "String":
      case "Number":
      case "Boolean":
      case "Date":
        return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
      case "Promise":
      case "Symbol":
      case "function":
      case "WeakMap":
      case "WeakSet":
        return leftHandOperand === rightHandOperand;
      case "Error":
        return keysEqual(leftHandOperand, rightHandOperand, ["name", "message", "code"], options);
      case "Arguments":
      case "Int8Array":
      case "Uint8Array":
      case "Uint8ClampedArray":
      case "Int16Array":
      case "Uint16Array":
      case "Int32Array":
      case "Uint32Array":
      case "Float32Array":
      case "Float64Array":
      case "Array":
        return iterableEqual(leftHandOperand, rightHandOperand, options);
      case "RegExp":
        return regexpEqual(leftHandOperand, rightHandOperand);
      case "Generator":
        return generatorEqual(leftHandOperand, rightHandOperand, options);
      case "DataView":
        return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
      case "ArrayBuffer":
        return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
      case "Set":
        return entriesEqual(leftHandOperand, rightHandOperand, options);
      case "Map":
        return entriesEqual(leftHandOperand, rightHandOperand, options);
      case "Temporal.PlainDate":
      case "Temporal.PlainTime":
      case "Temporal.PlainDateTime":
      case "Temporal.Instant":
      case "Temporal.ZonedDateTime":
      case "Temporal.PlainYearMonth":
      case "Temporal.PlainMonthDay":
        return leftHandOperand.equals(rightHandOperand);
      case "Temporal.Duration":
        return leftHandOperand.total("nanoseconds") === rightHandOperand.total("nanoseconds");
      case "Temporal.TimeZone":
      case "Temporal.Calendar":
        return leftHandOperand.toString() === rightHandOperand.toString();
      default:
        return objectEqual(leftHandOperand, rightHandOperand, options);
    }
  }
  __name(extensiveDeepEqualByType, "extensiveDeepEqualByType");
  function regexpEqual(leftHandOperand, rightHandOperand) {
    return leftHandOperand.toString() === rightHandOperand.toString();
  }
  __name(regexpEqual, "regexpEqual");
  function entriesEqual(leftHandOperand, rightHandOperand, options) {
    try {
      if (leftHandOperand.size !== rightHandOperand.size) {
        return false;
      }
      if (leftHandOperand.size === 0) {
        return true;
      }
    } catch (sizeError) {
      return false;
    }
    var leftHandItems = [];
    var rightHandItems = [];
    leftHandOperand.forEach(/* @__PURE__ */ __name(function gatherEntries(key, value) {
      leftHandItems.push([key, value]);
    }, "gatherEntries"));
    rightHandOperand.forEach(/* @__PURE__ */ __name(function gatherEntries(key, value) {
      rightHandItems.push([key, value]);
    }, "gatherEntries"));
    return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
  }
  __name(entriesEqual, "entriesEqual");
  function iterableEqual(leftHandOperand, rightHandOperand, options) {
    var length = leftHandOperand.length;
    if (length !== rightHandOperand.length) {
      return false;
    }
    if (length === 0) {
      return true;
    }
    var index = -1;
    while (++index < length) {
      if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
        return false;
      }
    }
    return true;
  }
  __name(iterableEqual, "iterableEqual");
  function generatorEqual(leftHandOperand, rightHandOperand, options) {
    return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
  }
  __name(generatorEqual, "generatorEqual");
  function hasIteratorFunction(target) {
    return typeof Symbol !== "undefined" && typeof target === "object" && typeof Symbol.iterator !== "undefined" && typeof target[Symbol.iterator] === "function";
  }
  __name(hasIteratorFunction, "hasIteratorFunction");
  function getIteratorEntries(target) {
    if (hasIteratorFunction(target)) {
      try {
        return getGeneratorEntries(target[Symbol.iterator]());
      } catch (iteratorError) {
        return [];
      }
    }
    return [];
  }
  __name(getIteratorEntries, "getIteratorEntries");
  function getGeneratorEntries(generator) {
    var generatorResult = generator.next();
    var accumulator = [generatorResult.value];
    while (generatorResult.done === false) {
      generatorResult = generator.next();
      accumulator.push(generatorResult.value);
    }
    return accumulator;
  }
  __name(getGeneratorEntries, "getGeneratorEntries");
  function getEnumerableKeys(target) {
    var keys = [];
    for (var key in target) {
      keys.push(key);
    }
    return keys;
  }
  __name(getEnumerableKeys, "getEnumerableKeys");
  function getEnumerableSymbols(target) {
    var keys = [];
    var allKeys = Object.getOwnPropertySymbols(target);
    for (var i = 0; i < allKeys.length; i += 1) {
      var key = allKeys[i];
      if (Object.getOwnPropertyDescriptor(target, key).enumerable) {
        keys.push(key);
      }
    }
    return keys;
  }
  __name(getEnumerableSymbols, "getEnumerableSymbols");
  function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
    var length = keys.length;
    if (length === 0) {
      return true;
    }
    for (var i = 0; i < length; i += 1) {
      if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
        return false;
      }
    }
    return true;
  }
  __name(keysEqual, "keysEqual");
  function objectEqual(leftHandOperand, rightHandOperand, options) {
    var leftHandKeys = getEnumerableKeys(leftHandOperand);
    var rightHandKeys = getEnumerableKeys(rightHandOperand);
    var leftHandSymbols = getEnumerableSymbols(leftHandOperand);
    var rightHandSymbols = getEnumerableSymbols(rightHandOperand);
    leftHandKeys = leftHandKeys.concat(leftHandSymbols);
    rightHandKeys = rightHandKeys.concat(rightHandSymbols);
    if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
      if (iterableEqual(mapSymbols(leftHandKeys).sort(), mapSymbols(rightHandKeys).sort()) === false) {
        return false;
      }
      return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
    }
    var leftHandEntries = getIteratorEntries(leftHandOperand);
    var rightHandEntries = getIteratorEntries(rightHandOperand);
    if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
      leftHandEntries.sort();
      rightHandEntries.sort();
      return iterableEqual(leftHandEntries, rightHandEntries, options);
    }
    if (leftHandKeys.length === 0 && leftHandEntries.length === 0 && rightHandKeys.length === 0 && rightHandEntries.length === 0) {
      return true;
    }
    return false;
  }
  __name(objectEqual, "objectEqual");
  function isPrimitive(value) {
    return value === null || typeof value !== "object";
  }
  __name(isPrimitive, "isPrimitive");
  function mapSymbols(arr) {
    return arr.map(/* @__PURE__ */ __name(function mapSymbol(entry) {
      if (typeof entry === "symbol") {
        return entry.toString();
      }
      return entry;
    }, "mapSymbol"));
  }
  __name(mapSymbols, "mapSymbols");
  function hasProperty(obj, name) {
    if (typeof obj === "undefined" || obj === null) {
      return false;
    }
    return name in Object(obj);
  }
  __name(hasProperty, "hasProperty");
  function parsePath(path) {
    const str = path.replace(/([^\\])\[/g, "$1.[");
    const parts = str.match(/(\\\.|[^.]+?)+/g);
    return parts.map((value) => {
      if (value === "constructor" || value === "__proto__" || value === "prototype") {
        return {};
      }
      const regexp = /^\[(\d+)\]$/;
      const mArr = regexp.exec(value);
      let parsed = null;
      if (mArr) {
        parsed = { i: parseFloat(mArr[1]) };
      } else {
        parsed = { p: value.replace(/\\([.[\]])/g, "$1") };
      }
      return parsed;
    });
  }
  __name(parsePath, "parsePath");
  function internalGetPathValue(obj, parsed, pathDepth) {
    let temporaryValue = obj;
    let res = null;
    pathDepth = typeof pathDepth === "undefined" ? parsed.length : pathDepth;
    for (let i = 0; i < pathDepth; i++) {
      const part = parsed[i];
      if (temporaryValue) {
        if (typeof part.p === "undefined") {
          temporaryValue = temporaryValue[part.i];
        } else {
          temporaryValue = temporaryValue[part.p];
        }
        if (i === pathDepth - 1) {
          res = temporaryValue;
        }
      }
    }
    return res;
  }
  __name(internalGetPathValue, "internalGetPathValue");
  function getPathInfo(obj, path) {
    const parsed = parsePath(path);
    const last = parsed[parsed.length - 1];
    const info = {
      parent: parsed.length > 1 ? internalGetPathValue(obj, parsed, parsed.length - 1) : obj,
      name: last.p || last.i,
      value: internalGetPathValue(obj, parsed)
    };
    info.exists = hasProperty(info.parent, info.name);
    return info;
  }
  __name(getPathInfo, "getPathInfo");
  var _Assertion = class _Assertion2 {
    /**
     * Creates object for chaining.
     * `Assertion` objects contain metadata in the form of flags. Three flags can
     * be assigned during instantiation by passing arguments to this constructor:
     *
     * - `object`: This flag contains the target of the assertion. For example, in
     * the assertion `expect(numKittens).to.equal(7);`, the `object` flag will
     * contain `numKittens` so that the `equal` assertion can reference it when
     * needed.
     *
     * - `message`: This flag contains an optional custom error message to be
     * prepended to the error message that's generated by the assertion when it
     * fails.
     *
     * - `ssfi`: This flag stands for "start stack function indicator". It
     * contains a function reference that serves as the starting point for
     * removing frames from the stack trace of the error that's created by the
     * assertion when it fails. The goal is to provide a cleaner stack trace to
     * end users by removing Chai's internal functions. Note that it only works
     * in environments that support `Error.captureStackTrace`, and only when
     * `Chai.config.includeStack` hasn't been set to `false`.
     *
     * - `lockSsfi`: This flag controls whether or not the given `ssfi` flag
     * should retain its current value, even as assertions are chained off of
     * this object. This is usually set to `true` when creating a new assertion
     * from within another assertion. It's also temporarily set to `true` before
     * an overwritten assertion gets called by the overwriting assertion.
     *
     * - `eql`: This flag contains the deepEqual function to be used by the assertion.
     *
     * @param {unknown} obj target of the assertion
     * @param {string} [msg] (optional) custom error message
     * @param {Function} [ssfi] (optional) starting point for removing stack frames
     * @param {boolean} [lockSsfi] (optional) whether or not the ssfi flag is locked
     */
    constructor(obj, msg, ssfi, lockSsfi) {
      __publicField(this, "__flags", {});
      flag(this, "ssfi", ssfi || _Assertion2);
      flag(this, "lockSsfi", lockSsfi);
      flag(this, "object", obj);
      flag(this, "message", msg);
      flag(this, "eql", config.deepEqual || deep_eql_default);
      return proxify(this);
    }
    /** @returns {boolean} */
    static get includeStack() {
      console.warn(
        "Assertion.includeStack is deprecated, use chai.config.includeStack instead."
      );
      return config.includeStack;
    }
    /** @param {boolean} value */
    static set includeStack(value) {
      console.warn(
        "Assertion.includeStack is deprecated, use chai.config.includeStack instead."
      );
      config.includeStack = value;
    }
    /** @returns {boolean} */
    static get showDiff() {
      console.warn(
        "Assertion.showDiff is deprecated, use chai.config.showDiff instead."
      );
      return config.showDiff;
    }
    /** @param {boolean} value */
    static set showDiff(value) {
      console.warn(
        "Assertion.showDiff is deprecated, use chai.config.showDiff instead."
      );
      config.showDiff = value;
    }
    /**
     * @param {string} name
     * @param {Function} fn
     */
    static addProperty(name, fn) {
      addProperty(this.prototype, name, fn);
    }
    /**
     * @param {string} name
     * @param {Function} fn
     */
    static addMethod(name, fn) {
      addMethod(this.prototype, name, fn);
    }
    /**
     * @param {string} name
     * @param {Function} fn
     * @param {Function} chainingBehavior
     */
    static addChainableMethod(name, fn, chainingBehavior) {
      addChainableMethod(this.prototype, name, fn, chainingBehavior);
    }
    /**
     * @param {string} name
     * @param {Function} fn
     */
    static overwriteProperty(name, fn) {
      overwriteProperty(this.prototype, name, fn);
    }
    /**
     * @param {string} name
     * @param {Function} fn
     */
    static overwriteMethod(name, fn) {
      overwriteMethod(this.prototype, name, fn);
    }
    /**
     * @param {string} name
     * @param {Function} fn
     * @param {Function} chainingBehavior
     */
    static overwriteChainableMethod(name, fn, chainingBehavior) {
      overwriteChainableMethod(this.prototype, name, fn, chainingBehavior);
    }
    /**
     * ### .assert(expression, message, negateMessage, expected, actual, showDiff)
     *
     * Executes an expression and check expectations. Throws AssertionError for reporting if test doesn't pass.
     *
     * @name assert
     * @param {unknown} _expr to be tested
     * @param {string | Function} msg or function that returns message to display if expression fails
     * @param {string | Function} _negateMsg or function that returns negatedMessage to display if negated expression fails
     * @param {unknown} expected value (remember to check for negation)
     * @param {unknown} _actual (optional) will default to `this.obj`
     * @param {boolean} showDiff (optional) when set to `true`, assert will display a diff in addition to the message if expression fails
     * @returns {void}
     */
    assert(_expr, msg, _negateMsg, expected2, _actual, showDiff) {
      const ok = test(this, arguments);
      if (false !== showDiff) showDiff = true;
      if (void 0 === expected2 && void 0 === _actual) showDiff = false;
      if (true !== config.showDiff) showDiff = false;
      if (!ok) {
        msg = getMessage2(this, arguments);
        const actual = getActual(this, arguments);
        const assertionErrorObjectProperties = {
          actual,
          expected: expected2,
          showDiff
        };
        const operator = getOperator(this, arguments);
        if (operator) {
          assertionErrorObjectProperties.operator = operator;
        }
        throw new AssertionError(
          msg,
          assertionErrorObjectProperties,
          // @ts-expect-error Not sure what to do about these types yet
          config.includeStack ? this.assert : flag(this, "ssfi")
        );
      }
    }
    /**
     * Quick reference to stored `actual` value for plugin developers.
     *
     * @returns {unknown}
     */
    get _obj() {
      return flag(this, "object");
    }
    /**
     * Quick reference to stored `actual` value for plugin developers.
     *
     * @param {unknown} val
     */
    set _obj(val) {
      flag(this, "object", val);
    }
  };
  __name(_Assertion, "Assertion");
  var Assertion = _Assertion;
  var events = new EventTarget();
  var _PluginEvent = class _PluginEvent2 extends Event {
    constructor(type3, name, fn) {
      super(type3);
      this.name = String(name);
      this.fn = fn;
    }
  };
  __name(_PluginEvent, "PluginEvent");
  var PluginEvent = _PluginEvent;
  function isProxyEnabled() {
    return config.useProxy && typeof Proxy !== "undefined" && typeof Reflect !== "undefined";
  }
  __name(isProxyEnabled, "isProxyEnabled");
  function addProperty(ctx, name, getter) {
    getter = getter === void 0 ? function() {
    } : getter;
    Object.defineProperty(ctx, name, {
      get: /* @__PURE__ */ __name(function propertyGetter() {
        if (!isProxyEnabled() && !flag(this, "lockSsfi")) {
          flag(this, "ssfi", propertyGetter);
        }
        let result = getter.call(this);
        if (result !== void 0) return result;
        let newAssertion = new Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }, "propertyGetter"),
      configurable: true
    });
    events.dispatchEvent(new PluginEvent("addProperty", name, getter));
  }
  __name(addProperty, "addProperty");
  var fnLengthDesc = Object.getOwnPropertyDescriptor(function() {
  }, "length");
  function addLengthGuard(fn, assertionName, isChainable) {
    if (!fnLengthDesc.configurable) return fn;
    Object.defineProperty(fn, "length", {
      get: /* @__PURE__ */ __name(function() {
        if (isChainable) {
          throw Error(
            "Invalid Chai property: " + assertionName + '.length. Due to a compatibility issue, "length" cannot directly follow "' + assertionName + '". Use "' + assertionName + '.lengthOf" instead.'
          );
        }
        throw Error(
          "Invalid Chai property: " + assertionName + '.length. See docs for proper usage of "' + assertionName + '".'
        );
      }, "get")
    });
    return fn;
  }
  __name(addLengthGuard, "addLengthGuard");
  function getProperties(object) {
    let result = Object.getOwnPropertyNames(object);
    function addProperty2(property) {
      if (result.indexOf(property) === -1) {
        result.push(property);
      }
    }
    __name(addProperty2, "addProperty");
    let proto = Object.getPrototypeOf(object);
    while (proto !== null) {
      Object.getOwnPropertyNames(proto).forEach(addProperty2);
      proto = Object.getPrototypeOf(proto);
    }
    return result;
  }
  __name(getProperties, "getProperties");
  var builtins = ["__flags", "__methods", "_obj", "assert"];
  function proxify(obj, nonChainableMethodName) {
    if (!isProxyEnabled()) return obj;
    return new Proxy(obj, {
      get: /* @__PURE__ */ __name(function proxyGetter(target, property) {
        if (typeof property === "string" && config.proxyExcludedKeys.indexOf(property) === -1 && !Reflect.has(target, property)) {
          if (nonChainableMethodName) {
            throw Error(
              "Invalid Chai property: " + nonChainableMethodName + "." + property + '. See docs for proper usage of "' + nonChainableMethodName + '".'
            );
          }
          let suggestion = null;
          let suggestionDistance = 4;
          getProperties(target).forEach(function(prop) {
            if (
              // we actually mean to check `Object.prototype` here
              // eslint-disable-next-line no-prototype-builtins
              !Object.prototype.hasOwnProperty(prop) && builtins.indexOf(prop) === -1
            ) {
              let dist = stringDistanceCapped(property, prop, suggestionDistance);
              if (dist < suggestionDistance) {
                suggestion = prop;
                suggestionDistance = dist;
              }
            }
          });
          if (suggestion !== null) {
            throw Error(
              "Invalid Chai property: " + property + '. Did you mean "' + suggestion + '"?'
            );
          } else {
            throw Error("Invalid Chai property: " + property);
          }
        }
        if (builtins.indexOf(property) === -1 && !flag(target, "lockSsfi")) {
          flag(target, "ssfi", proxyGetter);
        }
        return Reflect.get(target, property);
      }, "proxyGetter")
    });
  }
  __name(proxify, "proxify");
  function stringDistanceCapped(strA, strB, cap) {
    if (Math.abs(strA.length - strB.length) >= cap) {
      return cap;
    }
    let memo = [];
    for (let i = 0; i <= strA.length; i++) {
      memo[i] = Array(strB.length + 1).fill(0);
      memo[i][0] = i;
    }
    for (let j = 0; j < strB.length; j++) {
      memo[0][j] = j;
    }
    for (let i = 1; i <= strA.length; i++) {
      let ch = strA.charCodeAt(i - 1);
      for (let j = 1; j <= strB.length; j++) {
        if (Math.abs(i - j) >= cap) {
          memo[i][j] = cap;
          continue;
        }
        memo[i][j] = Math.min(
          memo[i - 1][j] + 1,
          memo[i][j - 1] + 1,
          memo[i - 1][j - 1] + (ch === strB.charCodeAt(j - 1) ? 0 : 1)
        );
      }
    }
    return memo[strA.length][strB.length];
  }
  __name(stringDistanceCapped, "stringDistanceCapped");
  function addMethod(ctx, name, method) {
    let methodWrapper = /* @__PURE__ */ __name(function() {
      if (!flag(this, "lockSsfi")) {
        flag(this, "ssfi", methodWrapper);
      }
      let result = method.apply(this, arguments);
      if (result !== void 0) return result;
      let newAssertion = new Assertion();
      transferFlags(this, newAssertion);
      return newAssertion;
    }, "methodWrapper");
    addLengthGuard(methodWrapper, name, false);
    ctx[name] = proxify(methodWrapper, name);
    events.dispatchEvent(new PluginEvent("addMethod", name, method));
  }
  __name(addMethod, "addMethod");
  function overwriteProperty(ctx, name, getter) {
    let _get = Object.getOwnPropertyDescriptor(ctx, name), _super = /* @__PURE__ */ __name(function() {
    }, "_super");
    if (_get && "function" === typeof _get.get) _super = _get.get;
    Object.defineProperty(ctx, name, {
      get: /* @__PURE__ */ __name(function overwritingPropertyGetter() {
        if (!isProxyEnabled() && !flag(this, "lockSsfi")) {
          flag(this, "ssfi", overwritingPropertyGetter);
        }
        let origLockSsfi = flag(this, "lockSsfi");
        flag(this, "lockSsfi", true);
        let result = getter(_super).call(this);
        flag(this, "lockSsfi", origLockSsfi);
        if (result !== void 0) {
          return result;
        }
        let newAssertion = new Assertion();
        transferFlags(this, newAssertion);
        return newAssertion;
      }, "overwritingPropertyGetter"),
      configurable: true
    });
  }
  __name(overwriteProperty, "overwriteProperty");
  function overwriteMethod(ctx, name, method) {
    let _method = ctx[name], _super = /* @__PURE__ */ __name(function() {
      throw new Error(name + " is not a function");
    }, "_super");
    if (_method && "function" === typeof _method) _super = _method;
    let overwritingMethodWrapper = /* @__PURE__ */ __name(function() {
      if (!flag(this, "lockSsfi")) {
        flag(this, "ssfi", overwritingMethodWrapper);
      }
      let origLockSsfi = flag(this, "lockSsfi");
      flag(this, "lockSsfi", true);
      let result = method(_super).apply(this, arguments);
      flag(this, "lockSsfi", origLockSsfi);
      if (result !== void 0) {
        return result;
      }
      let newAssertion = new Assertion();
      transferFlags(this, newAssertion);
      return newAssertion;
    }, "overwritingMethodWrapper");
    addLengthGuard(overwritingMethodWrapper, name, false);
    ctx[name] = proxify(overwritingMethodWrapper, name);
  }
  __name(overwriteMethod, "overwriteMethod");
  var canSetPrototype = typeof Object.setPrototypeOf === "function";
  var testFn = /* @__PURE__ */ __name(function() {
  }, "testFn");
  var excludeNames = Object.getOwnPropertyNames(testFn).filter(function(name) {
    let propDesc = Object.getOwnPropertyDescriptor(testFn, name);
    if (typeof propDesc !== "object") return true;
    return !propDesc.configurable;
  });
  var call = Function.prototype.call;
  var apply = Function.prototype.apply;
  var _PluginAddChainableMethodEvent = class _PluginAddChainableMethodEvent2 extends PluginEvent {
    constructor(type3, name, fn, chainingBehavior) {
      super(type3, name, fn);
      this.chainingBehavior = chainingBehavior;
    }
  };
  __name(_PluginAddChainableMethodEvent, "PluginAddChainableMethodEvent");
  var PluginAddChainableMethodEvent = _PluginAddChainableMethodEvent;
  function addChainableMethod(ctx, name, method, chainingBehavior) {
    if (typeof chainingBehavior !== "function") {
      chainingBehavior = /* @__PURE__ */ __name(function() {
      }, "chainingBehavior");
    }
    let chainableBehavior = {
      method,
      chainingBehavior
    };
    if (!ctx.__methods) {
      ctx.__methods = {};
    }
    ctx.__methods[name] = chainableBehavior;
    Object.defineProperty(ctx, name, {
      get: /* @__PURE__ */ __name(function chainableMethodGetter() {
        chainableBehavior.chainingBehavior.call(this);
        let chainableMethodWrapper = /* @__PURE__ */ __name(function() {
          if (!flag(this, "lockSsfi")) {
            flag(this, "ssfi", chainableMethodWrapper);
          }
          let result = chainableBehavior.method.apply(this, arguments);
          if (result !== void 0) {
            return result;
          }
          let newAssertion = new Assertion();
          transferFlags(this, newAssertion);
          return newAssertion;
        }, "chainableMethodWrapper");
        addLengthGuard(chainableMethodWrapper, name, true);
        if (canSetPrototype) {
          let prototype = Object.create(this);
          prototype.call = call;
          prototype.apply = apply;
          Object.setPrototypeOf(chainableMethodWrapper, prototype);
        } else {
          let asserterNames = Object.getOwnPropertyNames(ctx);
          asserterNames.forEach(function(asserterName) {
            if (excludeNames.indexOf(asserterName) !== -1) {
              return;
            }
            let pd = Object.getOwnPropertyDescriptor(ctx, asserterName);
            Object.defineProperty(chainableMethodWrapper, asserterName, pd);
          });
        }
        transferFlags(this, chainableMethodWrapper);
        return proxify(chainableMethodWrapper);
      }, "chainableMethodGetter"),
      configurable: true
    });
    events.dispatchEvent(
      new PluginAddChainableMethodEvent(
        "addChainableMethod",
        name,
        method,
        chainingBehavior
      )
    );
  }
  __name(addChainableMethod, "addChainableMethod");
  function overwriteChainableMethod(ctx, name, method, chainingBehavior) {
    let chainableBehavior = ctx.__methods[name];
    let _chainingBehavior = chainableBehavior.chainingBehavior;
    chainableBehavior.chainingBehavior = /* @__PURE__ */ __name(function overwritingChainableMethodGetter() {
      let result = chainingBehavior(_chainingBehavior).call(this);
      if (result !== void 0) {
        return result;
      }
      let newAssertion = new Assertion();
      transferFlags(this, newAssertion);
      return newAssertion;
    }, "overwritingChainableMethodGetter");
    let _method = chainableBehavior.method;
    chainableBehavior.method = /* @__PURE__ */ __name(function overwritingChainableMethodWrapper() {
      let result = method(_method).apply(this, arguments);
      if (result !== void 0) {
        return result;
      }
      let newAssertion = new Assertion();
      transferFlags(this, newAssertion);
      return newAssertion;
    }, "overwritingChainableMethodWrapper");
  }
  __name(overwriteChainableMethod, "overwriteChainableMethod");
  function compareByInspect(a, b) {
    return inspect2(a) < inspect2(b) ? -1 : 1;
  }
  __name(compareByInspect, "compareByInspect");
  function getOwnEnumerablePropertySymbols(obj) {
    if (typeof Object.getOwnPropertySymbols !== "function") return [];
    return Object.getOwnPropertySymbols(obj).filter(function(sym) {
      return Object.getOwnPropertyDescriptor(obj, sym).enumerable;
    });
  }
  __name(getOwnEnumerablePropertySymbols, "getOwnEnumerablePropertySymbols");
  function getOwnEnumerableProperties(obj) {
    return Object.keys(obj).concat(getOwnEnumerablePropertySymbols(obj));
  }
  __name(getOwnEnumerableProperties, "getOwnEnumerableProperties");
  var isNaN22 = Number.isNaN;
  function isObjectType(obj) {
    let objectType = type(obj);
    let objectTypes = ["Array", "Object", "Function"];
    return objectTypes.indexOf(objectType) !== -1;
  }
  __name(isObjectType, "isObjectType");
  function getOperator(obj, args) {
    let operator = flag(obj, "operator");
    let negate = flag(obj, "negate");
    let expected2 = args[3];
    let msg = negate ? args[2] : args[1];
    if (operator) {
      return operator;
    }
    if (typeof msg === "function") msg = msg();
    msg = msg || "";
    if (!msg) {
      return void 0;
    }
    if (/\shave\s/.test(msg)) {
      return void 0;
    }
    let isObject = isObjectType(expected2);
    if (/\snot\s/.test(msg)) {
      return isObject ? "notDeepStrictEqual" : "notStrictEqual";
    }
    return isObject ? "deepStrictEqual" : "strictEqual";
  }
  __name(getOperator, "getOperator");
  function getName(fn) {
    return fn.name;
  }
  __name(getName, "getName");
  function isRegExp2(obj) {
    return Object.prototype.toString.call(obj) === "[object RegExp]";
  }
  __name(isRegExp2, "isRegExp");
  function isNumeric(obj) {
    return ["Number", "BigInt"].includes(type(obj));
  }
  __name(isNumeric, "isNumeric");
  var { flag: flag2 } = utils_exports;
  [
    "to",
    "be",
    "been",
    "is",
    "and",
    "has",
    "have",
    "with",
    "that",
    "which",
    "at",
    "of",
    "same",
    "but",
    "does",
    "still",
    "also"
  ].forEach(function(chain) {
    Assertion.addProperty(chain);
  });
  Assertion.addProperty("not", function() {
    flag2(this, "negate", true);
  });
  Assertion.addProperty("deep", function() {
    flag2(this, "deep", true);
  });
  Assertion.addProperty("nested", function() {
    flag2(this, "nested", true);
  });
  Assertion.addProperty("own", function() {
    flag2(this, "own", true);
  });
  Assertion.addProperty("ordered", function() {
    flag2(this, "ordered", true);
  });
  Assertion.addProperty("any", function() {
    flag2(this, "any", true);
    flag2(this, "all", false);
  });
  Assertion.addProperty("all", function() {
    flag2(this, "all", true);
    flag2(this, "any", false);
  });
  var functionTypes = {
    function: [
      "function",
      "asyncfunction",
      "generatorfunction",
      "asyncgeneratorfunction"
    ],
    asyncfunction: ["asyncfunction", "asyncgeneratorfunction"],
    generatorfunction: ["generatorfunction", "asyncgeneratorfunction"],
    asyncgeneratorfunction: ["asyncgeneratorfunction"]
  };
  function an(type3, msg) {
    if (msg) flag2(this, "message", msg);
    type3 = type3.toLowerCase();
    let obj = flag2(this, "object"), article = ~["a", "e", "i", "o", "u"].indexOf(type3.charAt(0)) ? "an " : "a ";
    const detectedType = type(obj).toLowerCase();
    if (functionTypes["function"].includes(type3)) {
      this.assert(
        functionTypes[type3].includes(detectedType),
        "expected #{this} to be " + article + type3,
        "expected #{this} not to be " + article + type3
      );
    } else {
      this.assert(
        type3 === detectedType,
        "expected #{this} to be " + article + type3,
        "expected #{this} not to be " + article + type3
      );
    }
  }
  __name(an, "an");
  Assertion.addChainableMethod("an", an);
  Assertion.addChainableMethod("a", an);
  function SameValueZero(a, b) {
    return isNaN22(a) && isNaN22(b) || a === b;
  }
  __name(SameValueZero, "SameValueZero");
  function includeChainingBehavior() {
    flag2(this, "contains", true);
  }
  __name(includeChainingBehavior, "includeChainingBehavior");
  function include(val, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), objType = type(obj).toLowerCase(), flagMsg = flag2(this, "message"), negate = flag2(this, "negate"), ssfi = flag2(this, "ssfi"), isDeep = flag2(this, "deep"), descriptor = isDeep ? "deep " : "", isEql = isDeep ? flag2(this, "eql") : SameValueZero;
    flagMsg = flagMsg ? flagMsg + ": " : "";
    let included = false;
    switch (objType) {
      case "string":
        included = obj.indexOf(val) !== -1;
        break;
      case "weakset":
        if (isDeep) {
          throw new AssertionError(
            flagMsg + "unable to use .deep.include with WeakSet",
            void 0,
            ssfi
          );
        }
        included = obj.has(val);
        break;
      case "map":
        obj.forEach(function(item) {
          included = included || isEql(item, val);
        });
        break;
      case "set":
        if (isDeep) {
          obj.forEach(function(item) {
            included = included || isEql(item, val);
          });
        } else {
          included = obj.has(val);
        }
        break;
      case "array":
        if (isDeep) {
          included = obj.some(function(item) {
            return isEql(item, val);
          });
        } else {
          included = obj.indexOf(val) !== -1;
        }
        break;
      default: {
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + "the given combination of arguments (" + objType + " and " + type(val).toLowerCase() + ") is invalid for this assertion. You can use an array, a map, an object, a set, a string, or a weakset instead of a " + type(val).toLowerCase(),
            void 0,
            ssfi
          );
        }
        let props = Object.keys(val);
        let firstErr = null;
        let numErrs = 0;
        props.forEach(function(prop) {
          let propAssertion = new Assertion(obj);
          transferFlags(this, propAssertion, true);
          flag2(propAssertion, "lockSsfi", true);
          if (!negate || props.length === 1) {
            propAssertion.property(prop, val[prop]);
            return;
          }
          try {
            propAssertion.property(prop, val[prop]);
          } catch (err) {
            if (!check_error_exports.compatibleConstructor(err, AssertionError)) {
              throw err;
            }
            if (firstErr === null) firstErr = err;
            numErrs++;
          }
        }, this);
        if (negate && props.length > 1 && numErrs === props.length) {
          throw firstErr;
        }
        return;
      }
    }
    this.assert(
      included,
      "expected #{this} to " + descriptor + "include " + inspect2(val),
      "expected #{this} to not " + descriptor + "include " + inspect2(val)
    );
  }
  __name(include, "include");
  Assertion.addChainableMethod("include", include, includeChainingBehavior);
  Assertion.addChainableMethod("contain", include, includeChainingBehavior);
  Assertion.addChainableMethod("contains", include, includeChainingBehavior);
  Assertion.addChainableMethod("includes", include, includeChainingBehavior);
  Assertion.addProperty("ok", function() {
    this.assert(
      flag2(this, "object"),
      "expected #{this} to be truthy",
      "expected #{this} to be falsy"
    );
  });
  Assertion.addProperty("true", function() {
    this.assert(
      true === flag2(this, "object"),
      "expected #{this} to be true",
      "expected #{this} to be false",
      flag2(this, "negate") ? false : true
    );
  });
  Assertion.addProperty("numeric", function() {
    const object = flag2(this, "object");
    this.assert(
      ["Number", "BigInt"].includes(type(object)),
      "expected #{this} to be numeric",
      "expected #{this} to not be numeric",
      flag2(this, "negate") ? false : true
    );
  });
  Assertion.addProperty("callable", function() {
    const val = flag2(this, "object");
    const ssfi = flag2(this, "ssfi");
    const message = flag2(this, "message");
    const msg = message ? `${message}: ` : "";
    const negate = flag2(this, "negate");
    const assertionMessage = negate ? `${msg}expected ${inspect2(val)} not to be a callable function` : `${msg}expected ${inspect2(val)} to be a callable function`;
    const isCallable = [
      "Function",
      "AsyncFunction",
      "GeneratorFunction",
      "AsyncGeneratorFunction"
    ].includes(type(val));
    if (isCallable && negate || !isCallable && !negate) {
      throw new AssertionError(assertionMessage, void 0, ssfi);
    }
  });
  Assertion.addProperty("false", function() {
    this.assert(
      false === flag2(this, "object"),
      "expected #{this} to be false",
      "expected #{this} to be true",
      flag2(this, "negate") ? true : false
    );
  });
  Assertion.addProperty("null", function() {
    this.assert(
      null === flag2(this, "object"),
      "expected #{this} to be null",
      "expected #{this} not to be null"
    );
  });
  Assertion.addProperty("undefined", function() {
    this.assert(
      void 0 === flag2(this, "object"),
      "expected #{this} to be undefined",
      "expected #{this} not to be undefined"
    );
  });
  Assertion.addProperty("NaN", function() {
    this.assert(
      isNaN22(flag2(this, "object")),
      "expected #{this} to be NaN",
      "expected #{this} not to be NaN"
    );
  });
  function assertExist() {
    let val = flag2(this, "object");
    this.assert(
      val !== null && val !== void 0,
      "expected #{this} to exist",
      "expected #{this} to not exist"
    );
  }
  __name(assertExist, "assertExist");
  Assertion.addProperty("exist", assertExist);
  Assertion.addProperty("exists", assertExist);
  Assertion.addProperty("empty", function() {
    let val = flag2(this, "object"), ssfi = flag2(this, "ssfi"), flagMsg = flag2(this, "message"), itemsCount;
    flagMsg = flagMsg ? flagMsg + ": " : "";
    switch (type(val).toLowerCase()) {
      case "array":
      case "string":
        itemsCount = val.length;
        break;
      case "map":
      case "set":
        itemsCount = val.size;
        break;
      case "weakmap":
      case "weakset":
        throw new AssertionError(
          flagMsg + ".empty was passed a weak collection",
          void 0,
          ssfi
        );
      case "function": {
        const msg = flagMsg + ".empty was passed a function " + getName(val);
        throw new AssertionError(msg.trim(), void 0, ssfi);
      }
      default:
        if (val !== Object(val)) {
          throw new AssertionError(
            flagMsg + ".empty was passed non-string primitive " + inspect2(val),
            void 0,
            ssfi
          );
        }
        itemsCount = Object.keys(val).length;
    }
    this.assert(
      0 === itemsCount,
      "expected #{this} to be empty",
      "expected #{this} not to be empty"
    );
  });
  function checkArguments() {
    let obj = flag2(this, "object"), type3 = type(obj);
    this.assert(
      "Arguments" === type3,
      "expected #{this} to be arguments but got " + type3,
      "expected #{this} to not be arguments"
    );
  }
  __name(checkArguments, "checkArguments");
  Assertion.addProperty("arguments", checkArguments);
  Assertion.addProperty("Arguments", checkArguments);
  function assertEqual(val, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object");
    if (flag2(this, "deep")) {
      let prevLockSsfi = flag2(this, "lockSsfi");
      flag2(this, "lockSsfi", true);
      this.eql(val);
      flag2(this, "lockSsfi", prevLockSsfi);
    } else {
      this.assert(
        val === obj,
        "expected #{this} to equal #{exp}",
        "expected #{this} to not equal #{exp}",
        val,
        this._obj,
        true
      );
    }
  }
  __name(assertEqual, "assertEqual");
  Assertion.addMethod("equal", assertEqual);
  Assertion.addMethod("equals", assertEqual);
  Assertion.addMethod("eq", assertEqual);
  function assertEql(obj, msg) {
    if (msg) flag2(this, "message", msg);
    let eql = flag2(this, "eql");
    this.assert(
      eql(obj, flag2(this, "object")),
      "expected #{this} to deeply equal #{exp}",
      "expected #{this} to not deeply equal #{exp}",
      obj,
      this._obj,
      true
    );
  }
  __name(assertEql, "assertEql");
  Assertion.addMethod("eql", assertEql);
  Assertion.addMethod("eqls", assertEql);
  function assertAbove(n, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase();
    if (doLength && objType !== "map" && objType !== "set") {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
    }
    if (!doLength && objType === "date" && nType !== "date") {
      throw new AssertionError(
        msgPrefix + "the argument to above must be a date",
        void 0,
        ssfi
      );
    } else if (!isNumeric(n) && (doLength || isNumeric(obj))) {
      throw new AssertionError(
        msgPrefix + "the argument to above must be a number",
        void 0,
        ssfi
      );
    } else if (!doLength && objType !== "date" && !isNumeric(obj)) {
      let printObj = objType === "string" ? "'" + obj + "'" : obj;
      throw new AssertionError(
        msgPrefix + "expected " + printObj + " to be a number or a date",
        void 0,
        ssfi
      );
    }
    if (doLength) {
      let descriptor = "length", itemsCount;
      if (objType === "map" || objType === "set") {
        descriptor = "size";
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
        itemsCount > n,
        "expected #{this} to have a " + descriptor + " above #{exp} but got #{act}",
        "expected #{this} to not have a " + descriptor + " above #{exp}",
        n,
        itemsCount
      );
    } else {
      this.assert(
        obj > n,
        "expected #{this} to be above #{exp}",
        "expected #{this} to be at most #{exp}",
        n
      );
    }
  }
  __name(assertAbove, "assertAbove");
  Assertion.addMethod("above", assertAbove);
  Assertion.addMethod("gt", assertAbove);
  Assertion.addMethod("greaterThan", assertAbove);
  function assertLeast(n, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase(), errorMessage, shouldThrow = true;
    if (doLength && objType !== "map" && objType !== "set") {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
    }
    if (!doLength && objType === "date" && nType !== "date") {
      errorMessage = msgPrefix + "the argument to least must be a date";
    } else if (!isNumeric(n) && (doLength || isNumeric(obj))) {
      errorMessage = msgPrefix + "the argument to least must be a number";
    } else if (!doLength && objType !== "date" && !isNumeric(obj)) {
      let printObj = objType === "string" ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
    } else {
      shouldThrow = false;
    }
    if (shouldThrow) {
      throw new AssertionError(errorMessage, void 0, ssfi);
    }
    if (doLength) {
      let descriptor = "length", itemsCount;
      if (objType === "map" || objType === "set") {
        descriptor = "size";
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
        itemsCount >= n,
        "expected #{this} to have a " + descriptor + " at least #{exp} but got #{act}",
        "expected #{this} to have a " + descriptor + " below #{exp}",
        n,
        itemsCount
      );
    } else {
      this.assert(
        obj >= n,
        "expected #{this} to be at least #{exp}",
        "expected #{this} to be below #{exp}",
        n
      );
    }
  }
  __name(assertLeast, "assertLeast");
  Assertion.addMethod("least", assertLeast);
  Assertion.addMethod("gte", assertLeast);
  Assertion.addMethod("greaterThanOrEqual", assertLeast);
  function assertBelow(n, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase(), errorMessage, shouldThrow = true;
    if (doLength && objType !== "map" && objType !== "set") {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
    }
    if (!doLength && objType === "date" && nType !== "date") {
      errorMessage = msgPrefix + "the argument to below must be a date";
    } else if (!isNumeric(n) && (doLength || isNumeric(obj))) {
      errorMessage = msgPrefix + "the argument to below must be a number";
    } else if (!doLength && objType !== "date" && !isNumeric(obj)) {
      let printObj = objType === "string" ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
    } else {
      shouldThrow = false;
    }
    if (shouldThrow) {
      throw new AssertionError(errorMessage, void 0, ssfi);
    }
    if (doLength) {
      let descriptor = "length", itemsCount;
      if (objType === "map" || objType === "set") {
        descriptor = "size";
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
        itemsCount < n,
        "expected #{this} to have a " + descriptor + " below #{exp} but got #{act}",
        "expected #{this} to not have a " + descriptor + " below #{exp}",
        n,
        itemsCount
      );
    } else {
      this.assert(
        obj < n,
        "expected #{this} to be below #{exp}",
        "expected #{this} to be at least #{exp}",
        n
      );
    }
  }
  __name(assertBelow, "assertBelow");
  Assertion.addMethod("below", assertBelow);
  Assertion.addMethod("lt", assertBelow);
  Assertion.addMethod("lessThan", assertBelow);
  function assertMost(n, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), nType = type(n).toLowerCase(), errorMessage, shouldThrow = true;
    if (doLength && objType !== "map" && objType !== "set") {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
    }
    if (!doLength && objType === "date" && nType !== "date") {
      errorMessage = msgPrefix + "the argument to most must be a date";
    } else if (!isNumeric(n) && (doLength || isNumeric(obj))) {
      errorMessage = msgPrefix + "the argument to most must be a number";
    } else if (!doLength && objType !== "date" && !isNumeric(obj)) {
      let printObj = objType === "string" ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
    } else {
      shouldThrow = false;
    }
    if (shouldThrow) {
      throw new AssertionError(errorMessage, void 0, ssfi);
    }
    if (doLength) {
      let descriptor = "length", itemsCount;
      if (objType === "map" || objType === "set") {
        descriptor = "size";
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
        itemsCount <= n,
        "expected #{this} to have a " + descriptor + " at most #{exp} but got #{act}",
        "expected #{this} to have a " + descriptor + " above #{exp}",
        n,
        itemsCount
      );
    } else {
      this.assert(
        obj <= n,
        "expected #{this} to be at most #{exp}",
        "expected #{this} to be above #{exp}",
        n
      );
    }
  }
  __name(assertMost, "assertMost");
  Assertion.addMethod("most", assertMost);
  Assertion.addMethod("lte", assertMost);
  Assertion.addMethod("lessThanOrEqual", assertMost);
  Assertion.addMethod("within", function(start, finish, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), doLength = flag2(this, "doLength"), flagMsg = flag2(this, "message"), msgPrefix = flagMsg ? flagMsg + ": " : "", ssfi = flag2(this, "ssfi"), objType = type(obj).toLowerCase(), startType = type(start).toLowerCase(), finishType = type(finish).toLowerCase(), errorMessage, shouldThrow = true, range = startType === "date" && finishType === "date" ? start.toISOString() + ".." + finish.toISOString() : start + ".." + finish;
    if (doLength && objType !== "map" && objType !== "set") {
      new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
    }
    if (!doLength && objType === "date" && (startType !== "date" || finishType !== "date")) {
      errorMessage = msgPrefix + "the arguments to within must be dates";
    } else if ((!isNumeric(start) || !isNumeric(finish)) && (doLength || isNumeric(obj))) {
      errorMessage = msgPrefix + "the arguments to within must be numbers";
    } else if (!doLength && objType !== "date" && !isNumeric(obj)) {
      let printObj = objType === "string" ? "'" + obj + "'" : obj;
      errorMessage = msgPrefix + "expected " + printObj + " to be a number or a date";
    } else {
      shouldThrow = false;
    }
    if (shouldThrow) {
      throw new AssertionError(errorMessage, void 0, ssfi);
    }
    if (doLength) {
      let descriptor = "length", itemsCount;
      if (objType === "map" || objType === "set") {
        descriptor = "size";
        itemsCount = obj.size;
      } else {
        itemsCount = obj.length;
      }
      this.assert(
        itemsCount >= start && itemsCount <= finish,
        "expected #{this} to have a " + descriptor + " within " + range,
        "expected #{this} to not have a " + descriptor + " within " + range
      );
    } else {
      this.assert(
        obj >= start && obj <= finish,
        "expected #{this} to be within " + range,
        "expected #{this} to not be within " + range
      );
    }
  });
  function assertInstanceOf(constructor, msg) {
    if (msg) flag2(this, "message", msg);
    let target = flag2(this, "object");
    let ssfi = flag2(this, "ssfi");
    let flagMsg = flag2(this, "message");
    let isInstanceOf;
    try {
      isInstanceOf = target instanceof constructor;
    } catch (err) {
      if (err instanceof TypeError) {
        flagMsg = flagMsg ? flagMsg + ": " : "";
        throw new AssertionError(
          flagMsg + "The instanceof assertion needs a constructor but " + type(constructor) + " was given.",
          void 0,
          ssfi
        );
      }
      throw err;
    }
    let name = getName(constructor);
    if (name == null) {
      name = "an unnamed constructor";
    }
    this.assert(
      isInstanceOf,
      "expected #{this} to be an instance of " + name,
      "expected #{this} to not be an instance of " + name
    );
  }
  __name(assertInstanceOf, "assertInstanceOf");
  Assertion.addMethod("instanceof", assertInstanceOf);
  Assertion.addMethod("instanceOf", assertInstanceOf);
  function assertProperty(name, val, msg) {
    if (msg) flag2(this, "message", msg);
    let isNested = flag2(this, "nested"), isOwn = flag2(this, "own"), flagMsg = flag2(this, "message"), obj = flag2(this, "object"), ssfi = flag2(this, "ssfi"), nameType = typeof name;
    flagMsg = flagMsg ? flagMsg + ": " : "";
    if (isNested) {
      if (nameType !== "string") {
        throw new AssertionError(
          flagMsg + "the argument to property must be a string when using nested syntax",
          void 0,
          ssfi
        );
      }
    } else {
      if (nameType !== "string" && nameType !== "number" && nameType !== "symbol") {
        throw new AssertionError(
          flagMsg + "the argument to property must be a string, number, or symbol",
          void 0,
          ssfi
        );
      }
    }
    if (isNested && isOwn) {
      throw new AssertionError(
        flagMsg + 'The "nested" and "own" flags cannot be combined.',
        void 0,
        ssfi
      );
    }
    if (obj === null || obj === void 0) {
      throw new AssertionError(
        flagMsg + "Target cannot be null or undefined.",
        void 0,
        ssfi
      );
    }
    let isDeep = flag2(this, "deep"), negate = flag2(this, "negate"), pathInfo = isNested ? getPathInfo(obj, name) : null, value = isNested ? pathInfo.value : obj[name], isEql = isDeep ? flag2(this, "eql") : (val1, val2) => val1 === val2;
    let descriptor = "";
    if (isDeep) descriptor += "deep ";
    if (isOwn) descriptor += "own ";
    if (isNested) descriptor += "nested ";
    descriptor += "property ";
    let hasProperty2;
    if (isOwn) hasProperty2 = Object.prototype.hasOwnProperty.call(obj, name);
    else if (isNested) hasProperty2 = pathInfo.exists;
    else hasProperty2 = hasProperty(obj, name);
    if (!negate || arguments.length === 1) {
      this.assert(
        hasProperty2,
        "expected #{this} to have " + descriptor + inspect2(name),
        "expected #{this} to not have " + descriptor + inspect2(name)
      );
    }
    if (arguments.length > 1) {
      this.assert(
        hasProperty2 && isEql(val, value),
        "expected #{this} to have " + descriptor + inspect2(name) + " of #{exp}, but got #{act}",
        "expected #{this} to not have " + descriptor + inspect2(name) + " of #{act}",
        val,
        value
      );
    }
    flag2(this, "object", value);
  }
  __name(assertProperty, "assertProperty");
  Assertion.addMethod("property", assertProperty);
  function assertOwnProperty(_name, _value, _msg) {
    flag2(this, "own", true);
    assertProperty.apply(this, arguments);
  }
  __name(assertOwnProperty, "assertOwnProperty");
  Assertion.addMethod("ownProperty", assertOwnProperty);
  Assertion.addMethod("haveOwnProperty", assertOwnProperty);
  function assertOwnPropertyDescriptor(name, descriptor, msg) {
    if (typeof descriptor === "string") {
      msg = descriptor;
      descriptor = null;
    }
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object");
    let actualDescriptor = Object.getOwnPropertyDescriptor(Object(obj), name);
    let eql = flag2(this, "eql");
    if (actualDescriptor && descriptor) {
      this.assert(
        eql(descriptor, actualDescriptor),
        "expected the own property descriptor for " + inspect2(name) + " on #{this} to match " + inspect2(descriptor) + ", got " + inspect2(actualDescriptor),
        "expected the own property descriptor for " + inspect2(name) + " on #{this} to not match " + inspect2(descriptor),
        descriptor,
        actualDescriptor,
        true
      );
    } else {
      this.assert(
        actualDescriptor,
        "expected #{this} to have an own property descriptor for " + inspect2(name),
        "expected #{this} to not have an own property descriptor for " + inspect2(name)
      );
    }
    flag2(this, "object", actualDescriptor);
  }
  __name(assertOwnPropertyDescriptor, "assertOwnPropertyDescriptor");
  Assertion.addMethod("ownPropertyDescriptor", assertOwnPropertyDescriptor);
  Assertion.addMethod("haveOwnPropertyDescriptor", assertOwnPropertyDescriptor);
  function assertLengthChain() {
    flag2(this, "doLength", true);
  }
  __name(assertLengthChain, "assertLengthChain");
  function assertLength(n, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), objType = type(obj).toLowerCase(), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi"), descriptor = "length", itemsCount;
    switch (objType) {
      case "map":
      case "set":
        descriptor = "size";
        itemsCount = obj.size;
        break;
      default:
        new Assertion(obj, flagMsg, ssfi, true).to.have.property("length");
        itemsCount = obj.length;
    }
    this.assert(
      itemsCount == n,
      "expected #{this} to have a " + descriptor + " of #{exp} but got #{act}",
      "expected #{this} to not have a " + descriptor + " of #{act}",
      n,
      itemsCount
    );
  }
  __name(assertLength, "assertLength");
  Assertion.addChainableMethod("length", assertLength, assertLengthChain);
  Assertion.addChainableMethod("lengthOf", assertLength, assertLengthChain);
  function assertMatch(re, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object");
    this.assert(
      re.exec(obj),
      "expected #{this} to match " + re,
      "expected #{this} not to match " + re
    );
  }
  __name(assertMatch, "assertMatch");
  Assertion.addMethod("match", assertMatch);
  Assertion.addMethod("matches", assertMatch);
  Assertion.addMethod("string", function(str, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
    new Assertion(obj, flagMsg, ssfi, true).is.a("string");
    this.assert(
      ~obj.indexOf(str),
      "expected #{this} to contain " + inspect2(str),
      "expected #{this} to not contain " + inspect2(str)
    );
  });
  function assertKeys(keys) {
    let obj = flag2(this, "object"), objType = type(obj), keysType = type(keys), ssfi = flag2(this, "ssfi"), isDeep = flag2(this, "deep"), str, deepStr = "", actual, ok = true, flagMsg = flag2(this, "message");
    flagMsg = flagMsg ? flagMsg + ": " : "";
    let mixedArgsMsg = flagMsg + "when testing keys against an object or an array you must give a single Array|Object|String argument or multiple String arguments";
    if (objType === "Map" || objType === "Set") {
      deepStr = isDeep ? "deeply " : "";
      actual = [];
      obj.forEach(function(val, key) {
        actual.push(key);
      });
      if (keysType !== "Array") {
        keys = Array.prototype.slice.call(arguments);
      }
    } else {
      actual = getOwnEnumerableProperties(obj);
      switch (keysType) {
        case "Array":
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, void 0, ssfi);
          }
          break;
        case "Object":
          if (arguments.length > 1) {
            throw new AssertionError(mixedArgsMsg, void 0, ssfi);
          }
          keys = Object.keys(keys);
          break;
        default:
          keys = Array.prototype.slice.call(arguments);
      }
      keys = keys.map(function(val) {
        return typeof val === "symbol" ? val : String(val);
      });
    }
    if (!keys.length) {
      throw new AssertionError(flagMsg + "keys required", void 0, ssfi);
    }
    let len = keys.length, any = flag2(this, "any"), all = flag2(this, "all"), expected2 = keys, isEql = isDeep ? flag2(this, "eql") : (val1, val2) => val1 === val2;
    if (!any && !all) {
      all = true;
    }
    if (any) {
      ok = expected2.some(function(expectedKey) {
        return actual.some(function(actualKey) {
          return isEql(expectedKey, actualKey);
        });
      });
    }
    if (all) {
      ok = expected2.every(function(expectedKey) {
        return actual.some(function(actualKey) {
          return isEql(expectedKey, actualKey);
        });
      });
      if (!flag2(this, "contains")) {
        ok = ok && keys.length == actual.length;
      }
    }
    if (len > 1) {
      keys = keys.map(function(key) {
        return inspect2(key);
      });
      let last = keys.pop();
      if (all) {
        str = keys.join(", ") + ", and " + last;
      }
      if (any) {
        str = keys.join(", ") + ", or " + last;
      }
    } else {
      str = inspect2(keys[0]);
    }
    str = (len > 1 ? "keys " : "key ") + str;
    str = (flag2(this, "contains") ? "contain " : "have ") + str;
    this.assert(
      ok,
      "expected #{this} to " + deepStr + str,
      "expected #{this} to not " + deepStr + str,
      expected2.slice(0).sort(compareByInspect),
      actual.sort(compareByInspect),
      true
    );
  }
  __name(assertKeys, "assertKeys");
  Assertion.addMethod("keys", assertKeys);
  Assertion.addMethod("key", assertKeys);
  function assertThrows(errorLike, errMsgMatcher, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), ssfi = flag2(this, "ssfi"), flagMsg = flag2(this, "message"), negate = flag2(this, "negate") || false;
    new Assertion(obj, flagMsg, ssfi, true).is.a("function");
    if (isRegExp2(errorLike) || typeof errorLike === "string") {
      errMsgMatcher = errorLike;
      errorLike = null;
    }
    let caughtErr;
    let errorWasThrown = false;
    try {
      obj();
    } catch (err) {
      errorWasThrown = true;
      caughtErr = err;
    }
    let everyArgIsUndefined = errorLike === void 0 && errMsgMatcher === void 0;
    let everyArgIsDefined = Boolean(errorLike && errMsgMatcher);
    let errorLikeFail = false;
    let errMsgMatcherFail = false;
    if (everyArgIsUndefined || !everyArgIsUndefined && !negate) {
      let errorLikeString = "an error";
      if (errorLike instanceof Error) {
        errorLikeString = "#{exp}";
      } else if (errorLike) {
        errorLikeString = check_error_exports.getConstructorName(errorLike);
      }
      let actual = caughtErr;
      if (caughtErr instanceof Error) {
        actual = caughtErr.toString();
      } else if (typeof caughtErr === "string") {
        actual = caughtErr;
      } else if (caughtErr && (typeof caughtErr === "object" || typeof caughtErr === "function")) {
        try {
          actual = check_error_exports.getConstructorName(caughtErr);
        } catch (_err) {
        }
      }
      this.assert(
        errorWasThrown,
        "expected #{this} to throw " + errorLikeString,
        "expected #{this} to not throw an error but #{act} was thrown",
        errorLike && errorLike.toString(),
        actual
      );
    }
    if (errorLike && caughtErr) {
      if (errorLike instanceof Error) {
        let isCompatibleInstance = check_error_exports.compatibleInstance(
          caughtErr,
          errorLike
        );
        if (isCompatibleInstance === negate) {
          if (everyArgIsDefined && negate) {
            errorLikeFail = true;
          } else {
            this.assert(
              negate,
              "expected #{this} to throw #{exp} but #{act} was thrown",
              "expected #{this} to not throw #{exp}" + (caughtErr && !negate ? " but #{act} was thrown" : ""),
              errorLike.toString(),
              caughtErr.toString()
            );
          }
        }
      }
      let isCompatibleConstructor = check_error_exports.compatibleConstructor(
        caughtErr,
        errorLike
      );
      if (isCompatibleConstructor === negate) {
        if (everyArgIsDefined && negate) {
          errorLikeFail = true;
        } else {
          this.assert(
            negate,
            "expected #{this} to throw #{exp} but #{act} was thrown",
            "expected #{this} to not throw #{exp}" + (caughtErr ? " but #{act} was thrown" : ""),
            errorLike instanceof Error ? errorLike.toString() : errorLike && check_error_exports.getConstructorName(errorLike),
            caughtErr instanceof Error ? caughtErr.toString() : caughtErr && check_error_exports.getConstructorName(caughtErr)
          );
        }
      }
    }
    if (caughtErr && errMsgMatcher !== void 0 && errMsgMatcher !== null) {
      let placeholder = "including";
      if (isRegExp2(errMsgMatcher)) {
        placeholder = "matching";
      }
      let isCompatibleMessage = check_error_exports.compatibleMessage(
        caughtErr,
        errMsgMatcher
      );
      if (isCompatibleMessage === negate) {
        if (everyArgIsDefined && negate) {
          errMsgMatcherFail = true;
        } else {
          this.assert(
            negate,
            "expected #{this} to throw error " + placeholder + " #{exp} but got #{act}",
            "expected #{this} to throw error not " + placeholder + " #{exp}",
            errMsgMatcher,
            check_error_exports.getMessage(caughtErr)
          );
        }
      }
    }
    if (errorLikeFail && errMsgMatcherFail) {
      this.assert(
        negate,
        "expected #{this} to throw #{exp} but #{act} was thrown",
        "expected #{this} to not throw #{exp}" + (caughtErr ? " but #{act} was thrown" : ""),
        errorLike instanceof Error ? errorLike.toString() : errorLike && check_error_exports.getConstructorName(errorLike),
        caughtErr instanceof Error ? caughtErr.toString() : caughtErr && check_error_exports.getConstructorName(caughtErr)
      );
    }
    flag2(this, "object", caughtErr);
  }
  __name(assertThrows, "assertThrows");
  Assertion.addMethod("throw", assertThrows);
  Assertion.addMethod("throws", assertThrows);
  Assertion.addMethod("Throw", assertThrows);
  function respondTo(method, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), itself = flag2(this, "itself"), context = "function" === typeof obj && !itself ? obj.prototype[method] : obj[method];
    this.assert(
      "function" === typeof context,
      "expected #{this} to respond to " + inspect2(method),
      "expected #{this} to not respond to " + inspect2(method)
    );
  }
  __name(respondTo, "respondTo");
  Assertion.addMethod("respondTo", respondTo);
  Assertion.addMethod("respondsTo", respondTo);
  Assertion.addProperty("itself", function() {
    flag2(this, "itself", true);
  });
  function satisfy(matcher, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object");
    let result = matcher(obj);
    this.assert(
      result,
      "expected #{this} to satisfy " + objDisplay(matcher),
      "expected #{this} to not satisfy" + objDisplay(matcher),
      flag2(this, "negate") ? false : true,
      result
    );
  }
  __name(satisfy, "satisfy");
  Assertion.addMethod("satisfy", satisfy);
  Assertion.addMethod("satisfies", satisfy);
  function closeTo(expected2, delta, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
    new Assertion(obj, flagMsg, ssfi, true).is.numeric;
    let message = "A `delta` value is required for `closeTo`";
    if (delta == void 0) {
      throw new AssertionError(
        flagMsg ? `${flagMsg}: ${message}` : message,
        void 0,
        ssfi
      );
    }
    new Assertion(delta, flagMsg, ssfi, true).is.numeric;
    message = "A `expected` value is required for `closeTo`";
    if (expected2 == void 0) {
      throw new AssertionError(
        flagMsg ? `${flagMsg}: ${message}` : message,
        void 0,
        ssfi
      );
    }
    new Assertion(expected2, flagMsg, ssfi, true).is.numeric;
    const abs = /* @__PURE__ */ __name((x) => x < 0 ? -x : x, "abs");
    const strip = /* @__PURE__ */ __name((number) => parseFloat(parseFloat(number).toPrecision(12)), "strip");
    this.assert(
      strip(abs(obj - expected2)) <= delta,
      "expected #{this} to be close to " + expected2 + " +/- " + delta,
      "expected #{this} not to be close to " + expected2 + " +/- " + delta
    );
  }
  __name(closeTo, "closeTo");
  Assertion.addMethod("closeTo", closeTo);
  Assertion.addMethod("approximately", closeTo);
  function isSubsetOf(_subset, _superset, cmp, contains, ordered) {
    let superset = Array.from(_superset);
    let subset = Array.from(_subset);
    if (!contains) {
      if (subset.length !== superset.length) return false;
      superset = superset.slice();
    }
    return subset.every(function(elem, idx) {
      if (ordered) return cmp ? cmp(elem, superset[idx]) : elem === superset[idx];
      if (!cmp) {
        let matchIdx = superset.indexOf(elem);
        if (matchIdx === -1) return false;
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      }
      return superset.some(function(elem2, matchIdx) {
        if (!cmp(elem, elem2)) return false;
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      });
    });
  }
  __name(isSubsetOf, "isSubsetOf");
  Assertion.addMethod("members", function(subset, msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
    new Assertion(obj, flagMsg, ssfi, true).to.be.iterable;
    new Assertion(subset, flagMsg, ssfi, true).to.be.iterable;
    let contains = flag2(this, "contains");
    let ordered = flag2(this, "ordered");
    let subject, failMsg, failNegateMsg;
    if (contains) {
      subject = ordered ? "an ordered superset" : "a superset";
      failMsg = "expected #{this} to be " + subject + " of #{exp}";
      failNegateMsg = "expected #{this} to not be " + subject + " of #{exp}";
    } else {
      subject = ordered ? "ordered members" : "members";
      failMsg = "expected #{this} to have the same " + subject + " as #{exp}";
      failNegateMsg = "expected #{this} to not have the same " + subject + " as #{exp}";
    }
    let cmp = flag2(this, "deep") ? flag2(this, "eql") : void 0;
    this.assert(
      isSubsetOf(subset, obj, cmp, contains, ordered),
      failMsg,
      failNegateMsg,
      subset,
      obj,
      true
    );
  });
  Assertion.addProperty("iterable", function(msg) {
    if (msg) flag2(this, "message", msg);
    let obj = flag2(this, "object");
    this.assert(
      obj != void 0 && obj[Symbol.iterator],
      "expected #{this} to be an iterable",
      "expected #{this} to not be an iterable",
      obj
    );
  });
  function oneOf(list, msg) {
    if (msg) flag2(this, "message", msg);
    let expected2 = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi"), contains = flag2(this, "contains"), isDeep = flag2(this, "deep"), eql = flag2(this, "eql");
    new Assertion(list, flagMsg, ssfi, true).to.be.an("array");
    if (contains) {
      this.assert(
        list.some(function(possibility) {
          return expected2.indexOf(possibility) > -1;
        }),
        "expected #{this} to contain one of #{exp}",
        "expected #{this} to not contain one of #{exp}",
        list,
        expected2
      );
    } else {
      if (isDeep) {
        this.assert(
          list.some(function(possibility) {
            return eql(expected2, possibility);
          }),
          "expected #{this} to deeply equal one of #{exp}",
          "expected #{this} to deeply equal one of #{exp}",
          list,
          expected2
        );
      } else {
        this.assert(
          list.indexOf(expected2) > -1,
          "expected #{this} to be one of #{exp}",
          "expected #{this} to not be one of #{exp}",
          list,
          expected2
        );
      }
    }
  }
  __name(oneOf, "oneOf");
  Assertion.addMethod("oneOf", oneOf);
  function assertChanges(subject, prop, msg) {
    if (msg) flag2(this, "message", msg);
    let fn = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
    new Assertion(fn, flagMsg, ssfi, true).is.a("function");
    let initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a("function");
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }
    fn();
    let final = prop === void 0 || prop === null ? subject() : subject[prop];
    let msgObj = prop === void 0 || prop === null ? initial : "." + prop;
    flag2(this, "deltaMsgObj", msgObj);
    flag2(this, "initialDeltaValue", initial);
    flag2(this, "finalDeltaValue", final);
    flag2(this, "deltaBehavior", "change");
    flag2(this, "realDelta", final !== initial);
    this.assert(
      initial !== final,
      "expected " + msgObj + " to change",
      "expected " + msgObj + " to not change"
    );
  }
  __name(assertChanges, "assertChanges");
  Assertion.addMethod("change", assertChanges);
  Assertion.addMethod("changes", assertChanges);
  function assertIncreases(subject, prop, msg) {
    if (msg) flag2(this, "message", msg);
    let fn = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
    new Assertion(fn, flagMsg, ssfi, true).is.a("function");
    let initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a("function");
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }
    new Assertion(initial, flagMsg, ssfi, true).is.a("number");
    fn();
    let final = prop === void 0 || prop === null ? subject() : subject[prop];
    let msgObj = prop === void 0 || prop === null ? initial : "." + prop;
    flag2(this, "deltaMsgObj", msgObj);
    flag2(this, "initialDeltaValue", initial);
    flag2(this, "finalDeltaValue", final);
    flag2(this, "deltaBehavior", "increase");
    flag2(this, "realDelta", final - initial);
    this.assert(
      final - initial > 0,
      "expected " + msgObj + " to increase",
      "expected " + msgObj + " to not increase"
    );
  }
  __name(assertIncreases, "assertIncreases");
  Assertion.addMethod("increase", assertIncreases);
  Assertion.addMethod("increases", assertIncreases);
  function assertDecreases(subject, prop, msg) {
    if (msg) flag2(this, "message", msg);
    let fn = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi");
    new Assertion(fn, flagMsg, ssfi, true).is.a("function");
    let initial;
    if (!prop) {
      new Assertion(subject, flagMsg, ssfi, true).is.a("function");
      initial = subject();
    } else {
      new Assertion(subject, flagMsg, ssfi, true).to.have.property(prop);
      initial = subject[prop];
    }
    new Assertion(initial, flagMsg, ssfi, true).is.a("number");
    fn();
    let final = prop === void 0 || prop === null ? subject() : subject[prop];
    let msgObj = prop === void 0 || prop === null ? initial : "." + prop;
    flag2(this, "deltaMsgObj", msgObj);
    flag2(this, "initialDeltaValue", initial);
    flag2(this, "finalDeltaValue", final);
    flag2(this, "deltaBehavior", "decrease");
    flag2(this, "realDelta", initial - final);
    this.assert(
      final - initial < 0,
      "expected " + msgObj + " to decrease",
      "expected " + msgObj + " to not decrease"
    );
  }
  __name(assertDecreases, "assertDecreases");
  Assertion.addMethod("decrease", assertDecreases);
  Assertion.addMethod("decreases", assertDecreases);
  function assertDelta(delta, msg) {
    if (msg) flag2(this, "message", msg);
    let msgObj = flag2(this, "deltaMsgObj");
    let initial = flag2(this, "initialDeltaValue");
    let final = flag2(this, "finalDeltaValue");
    let behavior = flag2(this, "deltaBehavior");
    let realDelta = flag2(this, "realDelta");
    let expression;
    if (behavior === "change") {
      expression = Math.abs(final - initial) === Math.abs(delta);
    } else {
      expression = realDelta === Math.abs(delta);
    }
    this.assert(
      expression,
      "expected " + msgObj + " to " + behavior + " by " + delta,
      "expected " + msgObj + " to not " + behavior + " by " + delta
    );
  }
  __name(assertDelta, "assertDelta");
  Assertion.addMethod("by", assertDelta);
  Assertion.addProperty("extensible", function() {
    let obj = flag2(this, "object");
    let isExtensible = obj === Object(obj) && Object.isExtensible(obj);
    this.assert(
      isExtensible,
      "expected #{this} to be extensible",
      "expected #{this} to not be extensible"
    );
  });
  Assertion.addProperty("sealed", function() {
    let obj = flag2(this, "object");
    let isSealed = obj === Object(obj) ? Object.isSealed(obj) : true;
    this.assert(
      isSealed,
      "expected #{this} to be sealed",
      "expected #{this} to not be sealed"
    );
  });
  Assertion.addProperty("frozen", function() {
    let obj = flag2(this, "object");
    let isFrozen = obj === Object(obj) ? Object.isFrozen(obj) : true;
    this.assert(
      isFrozen,
      "expected #{this} to be frozen",
      "expected #{this} to not be frozen"
    );
  });
  Assertion.addProperty("finite", function(_msg) {
    let obj = flag2(this, "object");
    this.assert(
      typeof obj === "number" && isFinite(obj),
      "expected #{this} to be a finite number",
      "expected #{this} to not be a finite number"
    );
  });
  function compareSubset(expected2, actual) {
    if (expected2 === actual) {
      return true;
    }
    if (typeof actual !== typeof expected2) {
      return false;
    }
    if (typeof expected2 !== "object" || expected2 === null) {
      return expected2 === actual;
    }
    if (!actual) {
      return false;
    }
    if (Array.isArray(expected2)) {
      if (!Array.isArray(actual)) {
        return false;
      }
      return expected2.every(function(exp) {
        return actual.some(function(act) {
          return compareSubset(exp, act);
        });
      });
    }
    if (expected2 instanceof Date) {
      if (actual instanceof Date) {
        return expected2.getTime() === actual.getTime();
      } else {
        return false;
      }
    }
    return Object.keys(expected2).every(function(key) {
      let expectedValue = expected2[key];
      let actualValue = actual[key];
      if (typeof expectedValue === "object" && expectedValue !== null && actualValue !== null) {
        return compareSubset(expectedValue, actualValue);
      }
      if (typeof expectedValue === "function") {
        return expectedValue(actualValue);
      }
      return actualValue === expectedValue;
    });
  }
  __name(compareSubset, "compareSubset");
  Assertion.addMethod("containSubset", function(expected2) {
    const actual = flag(this, "object");
    const showDiff = config.showDiff;
    this.assert(
      compareSubset(expected2, actual),
      "expected #{act} to contain subset #{exp}",
      "expected #{act} to not contain subset #{exp}",
      expected2,
      actual,
      showDiff
    );
  });
  function expect(val, message) {
    return new Assertion(val, message);
  }
  __name(expect, "expect");
  expect.fail = function(actual, expected2, message, operator) {
    if (arguments.length < 2) {
      message = actual;
      actual = void 0;
    }
    message = message || "expect.fail()";
    throw new AssertionError(
      message,
      {
        actual,
        expected: expected2,
        operator
      },
      expect.fail
    );
  };
  var should_exports = {};
  __export(should_exports, {
    Should: () => Should,
    should: () => should
  });
  function loadShould() {
    function shouldGetter() {
      if (this instanceof String || this instanceof Number || this instanceof Boolean || typeof Symbol === "function" && this instanceof Symbol || typeof BigInt === "function" && this instanceof BigInt) {
        return new Assertion(this.valueOf(), null, shouldGetter);
      }
      return new Assertion(this, null, shouldGetter);
    }
    __name(shouldGetter, "shouldGetter");
    function shouldSetter(value) {
      Object.defineProperty(this, "should", {
        value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    }
    __name(shouldSetter, "shouldSetter");
    Object.defineProperty(Object.prototype, "should", {
      set: shouldSetter,
      get: shouldGetter,
      configurable: true
    });
    let should2 = {};
    should2.fail = function(actual, expected2, message, operator) {
      if (arguments.length < 2) {
        message = actual;
        actual = void 0;
      }
      message = message || "should.fail()";
      throw new AssertionError(
        message,
        {
          actual,
          expected: expected2,
          operator
        },
        should2.fail
      );
    };
    should2.equal = function(actual, expected2, message) {
      new Assertion(actual, message).to.equal(expected2);
    };
    should2.Throw = function(fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };
    should2.exist = function(val, msg) {
      new Assertion(val, msg).to.exist;
    };
    should2.not = {};
    should2.not.equal = function(actual, expected2, msg) {
      new Assertion(actual, msg).to.not.equal(expected2);
    };
    should2.not.Throw = function(fn, errt, errs, msg) {
      new Assertion(fn, msg).to.not.Throw(errt, errs);
    };
    should2.not.exist = function(val, msg) {
      new Assertion(val, msg).to.not.exist;
    };
    should2["throw"] = should2["Throw"];
    should2.not["throw"] = should2.not["Throw"];
    return should2;
  }
  __name(loadShould, "loadShould");
  var should = loadShould;
  var Should = loadShould;
  function assert(express, errmsg) {
    let test2 = new Assertion(null, null, assert, true);
    test2.assert(express, errmsg, "[ negation message unavailable ]");
  }
  __name(assert, "assert");
  assert.fail = function(actual, expected2, message, operator) {
    if (arguments.length < 2) {
      message = actual;
      actual = void 0;
    }
    message = message || "assert.fail()";
    throw new AssertionError(
      message,
      {
        actual,
        expected: expected2,
        operator
      },
      assert.fail
    );
  };
  assert.isOk = function(val, msg) {
    new Assertion(val, msg, assert.isOk, true).is.ok;
  };
  assert.isNotOk = function(val, msg) {
    new Assertion(val, msg, assert.isNotOk, true).is.not.ok;
  };
  assert.equal = function(act, exp, msg) {
    let test2 = new Assertion(act, msg, assert.equal, true);
    test2.assert(
      exp == flag(test2, "object"),
      "expected #{this} to equal #{exp}",
      "expected #{this} to not equal #{act}",
      exp,
      act,
      true
    );
  };
  assert.notEqual = function(act, exp, msg) {
    let test2 = new Assertion(act, msg, assert.notEqual, true);
    test2.assert(
      exp != flag(test2, "object"),
      "expected #{this} to not equal #{exp}",
      "expected #{this} to equal #{act}",
      exp,
      act,
      true
    );
  };
  assert.strictEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert.strictEqual, true).to.equal(exp);
  };
  assert.notStrictEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert.notStrictEqual, true).to.not.equal(exp);
  };
  assert.deepEqual = assert.deepStrictEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert.deepEqual, true).to.eql(exp);
  };
  assert.notDeepEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert.notDeepEqual, true).to.not.eql(exp);
  };
  assert.isAbove = function(val, abv, msg) {
    new Assertion(val, msg, assert.isAbove, true).to.be.above(abv);
  };
  assert.isAtLeast = function(val, atlst, msg) {
    new Assertion(val, msg, assert.isAtLeast, true).to.be.least(atlst);
  };
  assert.isBelow = function(val, blw, msg) {
    new Assertion(val, msg, assert.isBelow, true).to.be.below(blw);
  };
  assert.isAtMost = function(val, atmst, msg) {
    new Assertion(val, msg, assert.isAtMost, true).to.be.most(atmst);
  };
  assert.isTrue = function(val, msg) {
    new Assertion(val, msg, assert.isTrue, true).is["true"];
  };
  assert.isNotTrue = function(val, msg) {
    new Assertion(val, msg, assert.isNotTrue, true).to.not.equal(true);
  };
  assert.isFalse = function(val, msg) {
    new Assertion(val, msg, assert.isFalse, true).is["false"];
  };
  assert.isNotFalse = function(val, msg) {
    new Assertion(val, msg, assert.isNotFalse, true).to.not.equal(false);
  };
  assert.isNull = function(val, msg) {
    new Assertion(val, msg, assert.isNull, true).to.equal(null);
  };
  assert.isNotNull = function(val, msg) {
    new Assertion(val, msg, assert.isNotNull, true).to.not.equal(null);
  };
  assert.isNaN = function(val, msg) {
    new Assertion(val, msg, assert.isNaN, true).to.be.NaN;
  };
  assert.isNotNaN = function(value, message) {
    new Assertion(value, message, assert.isNotNaN, true).not.to.be.NaN;
  };
  assert.exists = function(val, msg) {
    new Assertion(val, msg, assert.exists, true).to.exist;
  };
  assert.notExists = function(val, msg) {
    new Assertion(val, msg, assert.notExists, true).to.not.exist;
  };
  assert.isUndefined = function(val, msg) {
    new Assertion(val, msg, assert.isUndefined, true).to.equal(void 0);
  };
  assert.isDefined = function(val, msg) {
    new Assertion(val, msg, assert.isDefined, true).to.not.equal(void 0);
  };
  assert.isCallable = function(value, message) {
    new Assertion(value, message, assert.isCallable, true).is.callable;
  };
  assert.isNotCallable = function(value, message) {
    new Assertion(value, message, assert.isNotCallable, true).is.not.callable;
  };
  assert.isObject = function(val, msg) {
    new Assertion(val, msg, assert.isObject, true).to.be.a("object");
  };
  assert.isNotObject = function(val, msg) {
    new Assertion(val, msg, assert.isNotObject, true).to.not.be.a("object");
  };
  assert.isArray = function(val, msg) {
    new Assertion(val, msg, assert.isArray, true).to.be.an("array");
  };
  assert.isNotArray = function(val, msg) {
    new Assertion(val, msg, assert.isNotArray, true).to.not.be.an("array");
  };
  assert.isString = function(val, msg) {
    new Assertion(val, msg, assert.isString, true).to.be.a("string");
  };
  assert.isNotString = function(val, msg) {
    new Assertion(val, msg, assert.isNotString, true).to.not.be.a("string");
  };
  assert.isNumber = function(val, msg) {
    new Assertion(val, msg, assert.isNumber, true).to.be.a("number");
  };
  assert.isNotNumber = function(val, msg) {
    new Assertion(val, msg, assert.isNotNumber, true).to.not.be.a("number");
  };
  assert.isNumeric = function(val, msg) {
    new Assertion(val, msg, assert.isNumeric, true).is.numeric;
  };
  assert.isNotNumeric = function(val, msg) {
    new Assertion(val, msg, assert.isNotNumeric, true).is.not.numeric;
  };
  assert.isFinite = function(val, msg) {
    new Assertion(val, msg, assert.isFinite, true).to.be.finite;
  };
  assert.isBoolean = function(val, msg) {
    new Assertion(val, msg, assert.isBoolean, true).to.be.a("boolean");
  };
  assert.isNotBoolean = function(val, msg) {
    new Assertion(val, msg, assert.isNotBoolean, true).to.not.be.a("boolean");
  };
  assert.typeOf = function(val, type3, msg) {
    new Assertion(val, msg, assert.typeOf, true).to.be.a(type3);
  };
  assert.notTypeOf = function(value, type3, message) {
    new Assertion(value, message, assert.notTypeOf, true).to.not.be.a(type3);
  };
  assert.instanceOf = function(val, type3, msg) {
    new Assertion(val, msg, assert.instanceOf, true).to.be.instanceOf(type3);
  };
  assert.notInstanceOf = function(val, type3, msg) {
    new Assertion(val, msg, assert.notInstanceOf, true).to.not.be.instanceOf(
      type3
    );
  };
  assert.include = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.include, true).include(inc);
  };
  assert.notInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notInclude, true).not.include(inc);
  };
  assert.deepInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepInclude, true).deep.include(inc);
  };
  assert.notDeepInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepInclude, true).not.deep.include(inc);
  };
  assert.nestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.nestedInclude, true).nested.include(inc);
  };
  assert.notNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notNestedInclude, true).not.nested.include(
      inc
    );
  };
  assert.deepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepNestedInclude, true).deep.nested.include(
      inc
    );
  };
  assert.notDeepNestedInclude = function(exp, inc, msg) {
    new Assertion(
      exp,
      msg,
      assert.notDeepNestedInclude,
      true
    ).not.deep.nested.include(inc);
  };
  assert.ownInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.ownInclude, true).own.include(inc);
  };
  assert.notOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notOwnInclude, true).not.own.include(inc);
  };
  assert.deepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.deepOwnInclude, true).deep.own.include(inc);
  };
  assert.notDeepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert.notDeepOwnInclude, true).not.deep.own.include(
      inc
    );
  };
  assert.match = function(exp, re, msg) {
    new Assertion(exp, msg, assert.match, true).to.match(re);
  };
  assert.notMatch = function(exp, re, msg) {
    new Assertion(exp, msg, assert.notMatch, true).to.not.match(re);
  };
  assert.property = function(obj, prop, msg) {
    new Assertion(obj, msg, assert.property, true).to.have.property(prop);
  };
  assert.notProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert.notProperty, true).to.not.have.property(prop);
  };
  assert.propertyVal = function(obj, prop, val, msg) {
    new Assertion(obj, msg, assert.propertyVal, true).to.have.property(prop, val);
  };
  assert.notPropertyVal = function(obj, prop, val, msg) {
    new Assertion(obj, msg, assert.notPropertyVal, true).to.not.have.property(
      prop,
      val
    );
  };
  assert.deepPropertyVal = function(obj, prop, val, msg) {
    new Assertion(obj, msg, assert.deepPropertyVal, true).to.have.deep.property(
      prop,
      val
    );
  };
  assert.notDeepPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert.notDeepPropertyVal,
      true
    ).to.not.have.deep.property(prop, val);
  };
  assert.ownProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert.ownProperty, true).to.have.own.property(prop);
  };
  assert.notOwnProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert.notOwnProperty, true).to.not.have.own.property(
      prop
    );
  };
  assert.ownPropertyVal = function(obj, prop, value, msg) {
    new Assertion(obj, msg, assert.ownPropertyVal, true).to.have.own.property(
      prop,
      value
    );
  };
  assert.notOwnPropertyVal = function(obj, prop, value, msg) {
    new Assertion(
      obj,
      msg,
      assert.notOwnPropertyVal,
      true
    ).to.not.have.own.property(prop, value);
  };
  assert.deepOwnPropertyVal = function(obj, prop, value, msg) {
    new Assertion(
      obj,
      msg,
      assert.deepOwnPropertyVal,
      true
    ).to.have.deep.own.property(prop, value);
  };
  assert.notDeepOwnPropertyVal = function(obj, prop, value, msg) {
    new Assertion(
      obj,
      msg,
      assert.notDeepOwnPropertyVal,
      true
    ).to.not.have.deep.own.property(prop, value);
  };
  assert.nestedProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert.nestedProperty, true).to.have.nested.property(
      prop
    );
  };
  assert.notNestedProperty = function(obj, prop, msg) {
    new Assertion(
      obj,
      msg,
      assert.notNestedProperty,
      true
    ).to.not.have.nested.property(prop);
  };
  assert.nestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert.nestedPropertyVal,
      true
    ).to.have.nested.property(prop, val);
  };
  assert.notNestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert.notNestedPropertyVal,
      true
    ).to.not.have.nested.property(prop, val);
  };
  assert.deepNestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert.deepNestedPropertyVal,
      true
    ).to.have.deep.nested.property(prop, val);
  };
  assert.notDeepNestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert.notDeepNestedPropertyVal,
      true
    ).to.not.have.deep.nested.property(prop, val);
  };
  assert.lengthOf = function(exp, len, msg) {
    new Assertion(exp, msg, assert.lengthOf, true).to.have.lengthOf(len);
  };
  assert.hasAnyKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyKeys, true).to.have.any.keys(keys);
  };
  assert.hasAllKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllKeys, true).to.have.all.keys(keys);
  };
  assert.containsAllKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.containsAllKeys, true).to.contain.all.keys(
      keys
    );
  };
  assert.doesNotHaveAnyKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAnyKeys, true).to.not.have.any.keys(
      keys
    );
  };
  assert.doesNotHaveAllKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.doesNotHaveAllKeys, true).to.not.have.all.keys(
      keys
    );
  };
  assert.hasAnyDeepKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAnyDeepKeys, true).to.have.any.deep.keys(
      keys
    );
  };
  assert.hasAllDeepKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert.hasAllDeepKeys, true).to.have.all.deep.keys(
      keys
    );
  };
  assert.containsAllDeepKeys = function(obj, keys, msg) {
    new Assertion(
      obj,
      msg,
      assert.containsAllDeepKeys,
      true
    ).to.contain.all.deep.keys(keys);
  };
  assert.doesNotHaveAnyDeepKeys = function(obj, keys, msg) {
    new Assertion(
      obj,
      msg,
      assert.doesNotHaveAnyDeepKeys,
      true
    ).to.not.have.any.deep.keys(keys);
  };
  assert.doesNotHaveAllDeepKeys = function(obj, keys, msg) {
    new Assertion(
      obj,
      msg,
      assert.doesNotHaveAllDeepKeys,
      true
    ).to.not.have.all.deep.keys(keys);
  };
  assert.throws = function(fn, errorLike, errMsgMatcher, msg) {
    if ("string" === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }
    let assertErr = new Assertion(fn, msg, assert.throws, true).to.throw(
      errorLike,
      errMsgMatcher
    );
    return flag(assertErr, "object");
  };
  assert.doesNotThrow = function(fn, errorLike, errMsgMatcher, message) {
    if ("string" === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }
    new Assertion(fn, message, assert.doesNotThrow, true).to.not.throw(
      errorLike,
      errMsgMatcher
    );
  };
  assert.operator = function(val, operator, val2, msg) {
    let ok;
    switch (operator) {
      case "==":
        ok = val == val2;
        break;
      case "===":
        ok = val === val2;
        break;
      case ">":
        ok = val > val2;
        break;
      case ">=":
        ok = val >= val2;
        break;
      case "<":
        ok = val < val2;
        break;
      case "<=":
        ok = val <= val2;
        break;
      case "!=":
        ok = val != val2;
        break;
      case "!==":
        ok = val !== val2;
        break;
      default:
        msg = msg ? msg + ": " : msg;
        throw new AssertionError(
          msg + 'Invalid operator "' + operator + '"',
          void 0,
          assert.operator
        );
    }
    let test2 = new Assertion(ok, msg, assert.operator, true);
    test2.assert(
      true === flag(test2, "object"),
      "expected " + inspect2(val) + " to be " + operator + " " + inspect2(val2),
      "expected " + inspect2(val) + " to not be " + operator + " " + inspect2(val2)
    );
  };
  assert.closeTo = function(act, exp, delta, msg) {
    new Assertion(act, msg, assert.closeTo, true).to.be.closeTo(exp, delta);
  };
  assert.approximately = function(act, exp, delta, msg) {
    new Assertion(act, msg, assert.approximately, true).to.be.approximately(
      exp,
      delta
    );
  };
  assert.sameMembers = function(set1, set2, msg) {
    new Assertion(set1, msg, assert.sameMembers, true).to.have.same.members(set2);
  };
  assert.notSameMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.notSameMembers,
      true
    ).to.not.have.same.members(set2);
  };
  assert.sameDeepMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.sameDeepMembers,
      true
    ).to.have.same.deep.members(set2);
  };
  assert.notSameDeepMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.notSameDeepMembers,
      true
    ).to.not.have.same.deep.members(set2);
  };
  assert.sameOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.sameOrderedMembers,
      true
    ).to.have.same.ordered.members(set2);
  };
  assert.notSameOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.notSameOrderedMembers,
      true
    ).to.not.have.same.ordered.members(set2);
  };
  assert.sameDeepOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.sameDeepOrderedMembers,
      true
    ).to.have.same.deep.ordered.members(set2);
  };
  assert.notSameDeepOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert.notSameDeepOrderedMembers,
      true
    ).to.not.have.same.deep.ordered.members(set2);
  };
  assert.includeMembers = function(superset, subset, msg) {
    new Assertion(superset, msg, assert.includeMembers, true).to.include.members(
      subset
    );
  };
  assert.notIncludeMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.notIncludeMembers,
      true
    ).to.not.include.members(subset);
  };
  assert.includeDeepMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.includeDeepMembers,
      true
    ).to.include.deep.members(subset);
  };
  assert.notIncludeDeepMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.notIncludeDeepMembers,
      true
    ).to.not.include.deep.members(subset);
  };
  assert.includeOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.includeOrderedMembers,
      true
    ).to.include.ordered.members(subset);
  };
  assert.notIncludeOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.notIncludeOrderedMembers,
      true
    ).to.not.include.ordered.members(subset);
  };
  assert.includeDeepOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.includeDeepOrderedMembers,
      true
    ).to.include.deep.ordered.members(subset);
  };
  assert.notIncludeDeepOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert.notIncludeDeepOrderedMembers,
      true
    ).to.not.include.deep.ordered.members(subset);
  };
  assert.oneOf = function(inList, list, msg) {
    new Assertion(inList, msg, assert.oneOf, true).to.be.oneOf(list);
  };
  assert.isIterable = function(obj, msg) {
    if (obj == void 0 || !obj[Symbol.iterator]) {
      msg = msg ? `${msg} expected ${inspect2(obj)} to be an iterable` : `expected ${inspect2(obj)} to be an iterable`;
      throw new AssertionError(msg, void 0, assert.isIterable);
    }
  };
  assert.changes = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.changes, true).to.change(obj, prop);
  };
  assert.changesBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.changesBy, true).to.change(obj, prop).by(delta);
  };
  assert.doesNotChange = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert.doesNotChange, true).to.not.change(
      obj,
      prop
    );
  };
  assert.changesButNotBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.changesButNotBy, true).to.change(obj, prop).but.not.by(delta);
  };
  assert.increases = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert.increases, true).to.increase(obj, prop);
  };
  assert.increasesBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.increasesBy, true).to.increase(obj, prop).by(delta);
  };
  assert.doesNotIncrease = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert.doesNotIncrease, true).to.not.increase(
      obj,
      prop
    );
  };
  assert.increasesButNotBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.increasesButNotBy, true).to.increase(obj, prop).but.not.by(delta);
  };
  assert.decreases = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert.decreases, true).to.decrease(obj, prop);
  };
  assert.decreasesBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.decreasesBy, true).to.decrease(obj, prop).by(delta);
  };
  assert.doesNotDecrease = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert.doesNotDecrease, true).to.not.decrease(
      obj,
      prop
    );
  };
  assert.doesNotDecreaseBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert.doesNotDecreaseBy, true).to.not.decrease(obj, prop).by(delta);
  };
  assert.decreasesButNotBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert.decreasesButNotBy, true).to.decrease(obj, prop).but.not.by(delta);
  };
  assert.ifError = function(val) {
    if (val) {
      throw val;
    }
  };
  assert.isExtensible = function(obj, msg) {
    new Assertion(obj, msg, assert.isExtensible, true).to.be.extensible;
  };
  assert.isNotExtensible = function(obj, msg) {
    new Assertion(obj, msg, assert.isNotExtensible, true).to.not.be.extensible;
  };
  assert.isSealed = function(obj, msg) {
    new Assertion(obj, msg, assert.isSealed, true).to.be.sealed;
  };
  assert.isNotSealed = function(obj, msg) {
    new Assertion(obj, msg, assert.isNotSealed, true).to.not.be.sealed;
  };
  assert.isFrozen = function(obj, msg) {
    new Assertion(obj, msg, assert.isFrozen, true).to.be.frozen;
  };
  assert.isNotFrozen = function(obj, msg) {
    new Assertion(obj, msg, assert.isNotFrozen, true).to.not.be.frozen;
  };
  assert.isEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isEmpty, true).to.be.empty;
  };
  assert.isNotEmpty = function(val, msg) {
    new Assertion(val, msg, assert.isNotEmpty, true).to.not.be.empty;
  };
  assert.containsSubset = function(val, exp, msg) {
    new Assertion(val, msg).to.containSubset(exp);
  };
  assert.doesNotContainSubset = function(val, exp, msg) {
    new Assertion(val, msg).to.not.containSubset(exp);
  };
  var aliases = [
    ["isOk", "ok"],
    ["isNotOk", "notOk"],
    ["throws", "throw"],
    ["throws", "Throw"],
    ["isExtensible", "extensible"],
    ["isNotExtensible", "notExtensible"],
    ["isSealed", "sealed"],
    ["isNotSealed", "notSealed"],
    ["isFrozen", "frozen"],
    ["isNotFrozen", "notFrozen"],
    ["isEmpty", "empty"],
    ["isNotEmpty", "notEmpty"],
    ["isCallable", "isFunction"],
    ["isNotCallable", "isNotFunction"],
    ["containsSubset", "containSubset"]
  ];
  for (const [name, as] of aliases) {
    assert[as] = assert[name];
  }
  var used = [];
  function use(fn) {
    const exports = {
      use,
      AssertionError,
      util: utils_exports,
      config,
      expect,
      assert,
      Assertion,
      ...should_exports
    };
    if (!~used.indexOf(fn)) {
      fn(exports, utils_exports);
      used.push(fn);
    }
    return exports;
  }
  __name(use, "use");

  // benchmarks/src/algorithms/id_list_saved_states.ts
  function signedCount(item) {
    return item.isDeleted ? -item.count : item.count;
  }
  function toSparseStartCounters(saved) {
    const nextCounters = /* @__PURE__ */ new Map();
    const out = {
      startCounterIndexes: [],
      startCounters: []
    };
    let lastIncluded = 0;
    for (let i = 0; i < saved.length; i++) {
      const item = saved[i];
      if (item.startCounter !== (nextCounters.get(item.bunchId) ?? 0)) {
        out.startCounterIndexes.push(i - lastIncluded);
        out.startCounters.push(item.startCounter);
        lastIncluded = i;
      }
      nextCounters.set(item.bunchId, item.startCounter + item.count);
    }
    return out;
  }
  function toTransposedOmit(saved) {
    const bunchIds = new Array(saved.length);
    const counts = new Array(saved.length);
    for (let i = 0; i < saved.length; i++) {
      bunchIds[i] = saved[i].bunchId;
      counts[i] = signedCount(saved[i]);
    }
    return { bunchIds, ...toSparseStartCounters(saved), counts };
  }

  // benchmarks/src/browser/native-f05.ts
  function idHash(id) {
    let hash = 2166136261;
    for (let i = 0; i < id.length; i++)
      hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
    hash ^= hash >>> 16;
    hash = Math.imul(hash, 2246822507);
    hash ^= hash >>> 13;
    return hash >>> 0;
  }
  function addToFilter(filter, hash) {
    const first = hash & 511, second = hash >>> 9 & 511;
    filter[first >>> 5] |= 1 << (first & 31);
    filter[second >>> 5] |= 1 << (second & 31);
  }
  function mayContain(filter, hash) {
    const first = hash & 511, second = hash >>> 9 & 511;
    return !!(filter[first >>> 5] & 1 << (first & 31)) && !!(filter[second >>> 5] & 1 << (second & 31));
  }
  function natural(n) {
    if (!Number.isSafeInteger(n) || n < 0)
      throw new Error("Invalid nonnegative integer");
  }
  function validId(id) {
    if (typeof id.bunchId !== "string") throw new Error("Invalid bunch ID");
    natural(id.counter);
  }
  function pagesFor(columns, starts, options) {
    const pages = [];
    const size = Math.ceil(
      columns.counts.length / Math.max(1, Math.ceil(columns.counts.length / options.pageSize))
    );
    for (let offset = 0; offset < columns.counts.length; offset += size) {
      const end = Math.min(offset + size, columns.counts.length);
      const owned = options.ownership === "owned";
      const data = owned ? {
        bunchIds: columns.bunchIds.slice(offset, end),
        counts: columns.counts.slice(offset, end)
      } : columns;
      const counters = owned ? starts.slice(offset, end) : starts;
      const from = owned ? 0 : offset, to = owned ? end - offset : end;
      const byId = /* @__PURE__ */ new Map();
      let length = 0;
      for (let i = from; i < to; i++) {
        const id = data.bunchIds[i], rows = byId.get(id);
        if (rows === void 0) byId.set(id, i);
        else if (typeof rows === "number") byId.set(id, [rows, i]);
        else rows.push(i);
        if (data.counts[i] > 0) length += data.counts[i];
      }
      const page = {
        columns: data,
        starts: counters,
        from,
        to,
        length,
        byId
      };
      if (options.pageIdFilter) {
        page.idFilter = new Uint32Array(16);
        for (const id of byId.keys()) addToFilter(page.idFilter, idHash(id));
      }
      pages.push(page);
    }
    return pages;
  }
  var EditBuffer = class {
    columns = { bunchIds: [], counts: [] };
    starts = [];
    append(id, start, count) {
      if (!count) return;
      const s = this.columns, last = s.counts.length - 1;
      if (last >= 0 && s.bunchIds[last] === id && this.starts[last] + Math.abs(s.counts[last]) === start && Math.sign(s.counts[last]) === Math.sign(count))
        s.counts[last] += count;
      else {
        s.bunchIds.push(id);
        s.counts.push(count);
        this.starts.push(start);
      }
    }
    copy(page, row) {
      this.append(
        page.columns.bunchIds[row],
        page.starts[row],
        page.columns.counts[row]
      );
    }
    finish(options) {
      return pagesFor(this.columns, Float64Array.from(this.starts), options);
    }
  };
  var NativeF05 = class _NativeF05 {
    constructor(pages, options, original) {
      this.pages = pages;
      this.options = options;
      this.original = original;
      this.prefix = new Float64Array(pages.length + 1);
      for (let i = 0; i < pages.length; i++)
        this.prefix[i + 1] = this.prefix[i] + pages[i].length;
      this.length = this.prefix[pages.length];
      natural(this.length);
    }
    length;
    prefix;
    static load(s, options = {}) {
      const config2 = {
        ownership: options.ownership ?? "shared",
        pageSize: options.pageSize ?? 128,
        pageIdFilter: options.pageIdFilter ?? false
      };
      natural(config2.pageSize);
      if (config2.pageSize === 0 || config2.ownership !== "shared" && config2.ownership !== "owned" || typeof config2.pageIdFilter !== "boolean")
        throw new Error("Invalid page options");
      const { bunchIds, counts, startCounterIndexes, startCounters } = s;
      if (![bunchIds, counts, startCounterIndexes, startCounters].every(
        Array.isArray
      ))
        throw new Error("Invalid columns");
      if (bunchIds.length !== counts.length || startCounterIndexes.length !== startCounters.length)
        throw new Error("Mismatched columns");
      let exceptionRow = 0;
      for (let i = 0; i < startCounterIndexes.length; i++) {
        const delta = startCounterIndexes[i];
        natural(delta);
        natural(startCounters[i]);
        exceptionRow += delta;
        if (i > 0 && delta === 0 || exceptionRow >= counts.length)
          throw new Error("Invalid counter exceptions");
      }
      const starts = new Float64Array(counts.length), next = /* @__PURE__ */ new Map(), intervals = /* @__PURE__ */ new Map();
      let exception = 0;
      exceptionRow = startCounterIndexes[0] ?? -1;
      for (let i = 0; i < counts.length; i++) {
        const id = bunchIds[i], count = counts[i];
        if (typeof id !== "string" || !Number.isSafeInteger(count) || !count)
          throw new Error("Invalid run");
        let start = next.get(id) ?? 0;
        if (i === exceptionRow) {
          start = startCounters[exception++];
          exceptionRow = exception === startCounterIndexes.length ? -1 : exceptionRow + startCounterIndexes[exception];
        }
        const end = start + Math.abs(count);
        natural(end);
        starts[i] = start;
        next.set(id, end);
        let rows = intervals.get(id);
        if (!rows) intervals.set(id, rows = []);
        rows.push(i);
      }
      for (const rows of intervals.values()) {
        rows.sort((a, b) => starts[a] - starts[b]);
        for (let i = 1; i < rows.length; i++)
          if (starts[rows[i]] < starts[rows[i - 1]] + Math.abs(counts[rows[i - 1]]))
            throw new Error("Duplicate IDs");
      }
      return new _NativeF05(
        pagesFor(s, starts, config2),
        config2,
        config2.ownership === "shared" ? s : void 0
      );
    }
    /** Shared mode is zero-copy before edits. All other exports flatten columns,
     * merge adjacent compatible runs, and recompute sparse counter exceptions. */
    get wireState() {
      if (this.original) return this.original;
      const out = {
        bunchIds: [],
        counts: [],
        startCounterIndexes: [],
        startCounters: []
      };
      const next = /* @__PURE__ */ new Map();
      let pendingId, pendingStart = 0, pendingCount = 0, lastException = 0;
      const flush = () => {
        if (pendingId === void 0) return;
        if (pendingStart !== (next.get(pendingId) ?? 0)) {
          out.startCounterIndexes.push(out.counts.length - lastException);
          out.startCounters.push(pendingStart);
          lastException = out.counts.length;
        }
        out.bunchIds.push(pendingId);
        out.counts.push(pendingCount);
        next.set(pendingId, pendingStart + Math.abs(pendingCount));
      };
      for (const page of this.pages)
        for (let i = page.from; i < page.to; i++) {
          const id = page.columns.bunchIds[i], start = page.starts[i], count = page.columns.counts[i];
          if (id === pendingId && start === pendingStart + Math.abs(pendingCount) && Math.sign(count) === Math.sign(pendingCount))
            pendingCount += count;
          else {
            flush();
            pendingId = id;
            pendingStart = start;
            pendingCount = count;
          }
        }
      flush();
      return out;
    }
    find(id) {
      validId(id);
      const hash = this.options.pageIdFilter ? idHash(id.bunchId) : void 0;
      for (let p = 0; p < this.pages.length; p++) {
        const page = this.pages[p];
        if (hash !== void 0 && !mayContain(page.idFilter, hash)) continue;
        const rows = page.byId.get(id.bunchId);
        if (rows !== void 0)
          for (let j = 0, size = typeof rows === "number" ? 1 : rows.length; j < size; j++) {
            const row = typeof rows === "number" ? rows : rows[j];
            if (page.starts[row] <= id.counter && id.counter < page.starts[row] + Math.abs(page.columns.counts[row]))
              return { page: p, row };
          }
      }
      throw new Error("Unknown ID");
    }
    at(index) {
      natural(index);
      if (index >= this.length) throw new Error("Index out of bounds");
      let lo = 0, hi = this.pages.length;
      while (lo < hi) {
        const mid = lo + hi >>> 1;
        if (this.prefix[mid + 1] <= index) lo = mid + 1;
        else hi = mid;
      }
      const page = this.pages[lo];
      index -= this.prefix[lo];
      for (let i = page.from; i < page.to; i++) {
        const count = page.columns.counts[i];
        if (count <= 0) continue;
        if (index < count)
          return {
            bunchId: page.columns.bunchIds[i],
            counter: page.starts[i] + index
          };
        index -= count;
      }
      throw new Error("Invalid prefix index");
    }
    indexOf(id, bias = "none") {
      const found = this.find(id), page = this.pages[found.page];
      let seen = this.prefix[found.page];
      for (let i = page.from; i < found.row; i++)
        if (page.columns.counts[i] > 0) seen += page.columns.counts[i];
      return page.columns.counts[found.row] > 0 ? seen + id.counter - page.starts[found.row] : bias === "none" ? -1 : seen - (bias === "left" ? 1 : 0);
    }
    insertAfter(before, id, count = 1) {
      natural(count);
      validId(id);
      natural(id.counter + count);
      const anchor = before === null ? null : this.find(before);
      if (count === 0) return this;
      natural(this.length + count);
      const hash = this.options.pageIdFilter ? idHash(id.bunchId) : void 0;
      for (const page2 of this.pages) {
        if (hash !== void 0 && !mayContain(page2.idFilter, hash)) continue;
        const rows = page2.byId.get(id.bunchId);
        if (rows !== void 0)
          for (let j = 0, size = typeof rows === "number" ? 1 : rows.length; j < size; j++) {
            const row = typeof rows === "number" ? rows : rows[j];
            if (page2.starts[row] < id.counter + count && id.counter < page2.starts[row] + Math.abs(page2.columns.counts[row]))
              throw new Error("Duplicate IDs");
          }
      }
      const target = anchor?.page ?? 0, page = this.pages[target], buffer = new EditBuffer();
      if (!anchor) buffer.append(id.bunchId, id.counter, count);
      if (page)
        for (let i = page.from; i < page.to; i++) {
          if (anchor && i === anchor.row) {
            const name = page.columns.bunchIds[i], start = page.starts[i], n = page.columns.counts[i], left = before.counter - start + 1, sign = Math.sign(n);
            buffer.append(name, start, sign * left);
            buffer.append(id.bunchId, id.counter, count);
            buffer.append(name, start + left, sign * (Math.abs(n) - left));
          } else buffer.copy(page, i);
        }
      const pages = this.pages.slice();
      pages.splice(target, page ? 1 : 0, ...buffer.finish(this.options));
      return new _NativeF05(pages, this.options);
    }
    delete(id, count = 1) {
      natural(count);
      validId(id);
      natural(id.counter + count);
      if (!count) return this;
      let result;
      const hash = this.options.pageIdFilter ? idHash(id.bunchId) : void 0;
      for (let p = 0; p < this.pages.length; p++) {
        const page = this.pages[p];
        if (hash !== void 0 && !mayContain(page.idFilter, hash)) {
          if (result) result.push(page);
          continue;
        }
        const rows = page.byId.get(id.bunchId);
        let hits;
        if (rows !== void 0)
          for (let j = 0, size = typeof rows === "number" ? 1 : rows.length; j < size; j++) {
            const row = typeof rows === "number" ? rows : rows[j];
            if (page.columns.counts[row] > 0 && page.starts[row] < id.counter + count && id.counter < page.starts[row] + page.columns.counts[row]) {
              if (!hits) hits = [];
              hits.push(row);
            }
          }
        if (!hits?.length) {
          if (result) result.push(page);
          continue;
        }
        if (!result) result = this.pages.slice(0, p);
        const buffer = new EditBuffer();
        let hit = 0;
        for (let i = page.from; i < page.to; i++) {
          if (i !== hits[hit]) {
            buffer.copy(page, i);
            continue;
          }
          hit++;
          const name = page.columns.bunchIds[i], start = page.starts[i], n = page.columns.counts[i], lo = Math.max(start, id.counter), hi = Math.min(start + n, id.counter + count);
          buffer.append(name, start, lo - start);
          buffer.append(name, lo, -(hi - lo));
          buffer.append(name, hi, start + n - hi);
        }
        result.push(...buffer.finish(this.options));
      }
      return result ? new _NativeF05(result, this.options) : this;
    }
    save() {
      const result = [];
      for (const page of this.pages)
        for (let i = page.from; i < page.to; i++) {
          const bunchId = page.columns.bunchIds[i], startCounter = page.starts[i], count = Math.abs(page.columns.counts[i]), isDeleted = page.columns.counts[i] < 0, last = result.at(-1);
          if (last && last.bunchId === bunchId && last.isDeleted === isDeleted && last.startCounter + last.count === startCounter)
            result[result.length - 1] = { ...last, count: last.count + count };
          else result.push({ bunchId, startCounter, count, isDeleted });
        }
      return result;
    }
  };

  // benchmarks/src/browser/library-perf-candidates.ts
  var libraryCases = [
    "existing",
    "bulk-index-build",
    "native-128",
    "native-filter-128",
    "native-64",
    "native-256"
  ];
  function libraryLoad(id, saved) {
    if (id === "existing") return IdList.load(saved);
    if (id === "bulk-index-build") return IdList.experimentalLoadBulk(saved);
    if (!libraryCases.includes(id)) throw new Error(`Unknown case ${id}`);
    return NativeF05.load(toTransposedOmit(saved), {
      ownership: "owned",
      pageSize: Number(id.split("-").at(-1)),
      pageIdFilter: id === "native-filter-128"
    });
  }

  // benchmarks/src/browser/library-perf-page.ts
  var current;
  var history = [];
  var prepared;
  var expected;
  var fixture = "";
  var selected;
  function same(a, b) {
    if (a?.bunchId !== b?.bunchId || a?.counter !== b?.counter)
      throw new Error("Runtime edit anchor mismatch");
  }
  function apply2(list, edit) {
    const anchor = edit.type === "insert" ? edit.index ? list.at(edit.index - 1) : null : list.at(edit.index);
    same(anchor, edit.type === "insert" ? edit.before : edit.id);
    return edit.type === "insert" ? list.insertAfter(anchor, {
      bunchId: anchor?.bunchId === edit.id.bunchId ? anchor.bunchId : edit.id.bunchId,
      counter: edit.id.counter
    }) : list.delete(anchor);
  }
  function equalSaved(list, wanted) {
    if (JSON.stringify(list.save()) !== JSON.stringify(wanted))
      throw new Error("Runtime full saved-state mismatch");
  }
  var libraryAPI = {
    async prepare(id) {
      selected = id;
      fixture = await (await fetch("/fixture")).text();
    },
    clear() {
      current = void 0;
      history = [];
      prepared = void 0;
      expected = void 0;
    },
    load(empty = false) {
      const decoded = empty ? [] : JSON.parse(fixture);
      const start = performance.now();
      current = libraryLoad(selected, decoded);
      const ms = performance.now() - start;
      return { ms, length: current.length };
    },
    loadTrials(count) {
      const samples = [];
      for (let i = 0; i < count; i++) samples.push(libraryAPI.load().ms);
      return samples;
    },
    async prepareTrace() {
      const payload = await (await fetch("/trace")).json();
      prepared = payload.edits;
      expected = payload.expected;
      return prepared.length;
    },
    async prepareSession(kind) {
      const payload = await (await fetch(`/session/${kind}`)).json();
      current = current.insertAfter(null, payload.firstId);
      prepared = payload.edits;
      expected = payload.expected;
      return prepared.length;
    },
    replay(historyLimit, remoteOnly = false) {
      if (!current || !prepared || !expected || ![0, 100].includes(historyLimit))
        throw new Error("Prepare runtime replay first");
      const edits = prepared;
      prepared = void 0;
      const start = performance.now();
      for (let i = 0; i < edits.length; i++) {
        if (historyLimit) {
          history.push({ list: current, offset: i });
          if (history.length > historyLimit) history.shift();
        }
        const edit = edits[i];
        current = remoteOnly ? edit.type === "insert" ? current.insertAfter(edit.before, edit.id) : current.delete(edit.id) : apply2(current, edit);
      }
      const ms = performance.now() - start;
      equalSaved(current, expected);
      for (const position of [
        0,
        Math.floor(history.length / 2),
        history.length - 1
      ]) {
        const version = history[position];
        if (!version) continue;
        let list = version.list;
        for (let i = version.offset; i < edits.length; i++)
          list = apply2(list, edits[i]);
        equalSaved(list, expected);
      }
      expected = void 0;
      return {
        ms,
        operations: edits.length,
        retainedVersions: history.length,
        verified: true
      };
    },
    lookups(kind, count = 2e4) {
      if (!current?.length) throw new Error("Load first");
      let seed = 72, checksum = 0;
      const start = performance.now();
      for (let i = 0; i < count; i++) {
        seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
        const at = kind === "local" ? i % current.length : seed % current.length;
        const id = current.at(at);
        const found = current.indexOf(id);
        if (found !== at) throw new Error("Runtime lookup mismatch");
        checksum += found;
      }
      return { ms: performance.now() - start, operations: count, checksum };
    },
    checkLoaded() {
      equalSaved(current, JSON.parse(fixture));
      return true;
    },
    stress() {
      const fragmented = Array.from({ length: 2048 }, (_, i) => ({
        bunchId: "frag0001",
        startCounter: i,
        count: 1,
        isDeleted: i % 2 === 1
      }));
      current = libraryLoad(selected, fragmented);
      const fragmentedLookups = libraryAPI.lookups("random", 5e3);
      const tombstone = { bunchId: "frag0001", counter: 1 };
      const start = performance.now();
      for (let i = 0; i < 2e3; i++) current = current.delete(tombstone);
      const tombstoneDeleteMs = performance.now() - start;
      equalSaved(current, fragmented);
      current = libraryLoad(selected, [
        { bunchId: "gap00001", startCounter: 0, count: 1, isDeleted: false },
        { bunchId: "gap00001", startCounter: 99999, count: 1, isDeleted: false }
      ]);
      const gapStart = performance.now();
      current = current.delete({ bunchId: "gap00001", counter: 0 }, 1e5);
      const gapDeleteMs = performance.now() - gapStart;
      equalSaved(current, [
        { bunchId: "gap00001", startCounter: 0, count: 1, isDeleted: true },
        { bunchId: "gap00001", startCounter: 99999, count: 1, isDeleted: true }
      ]);
      return {
        fragmentedLookups,
        tombstoneDeleteMs,
        gapDeleteMs,
        verified: true
      };
    },
    releaseHistory() {
      history = [];
    }
  };
  window.libraryPerf = libraryAPI;
})();
/*! Bundled license information:

long/umd/index.js:
  (**
   * @license
   * Copyright 2009 The Closure Library Authors
   * Copyright 2020 Daniel Wirtz / The long.js Authors.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   * SPDX-License-Identifier: Apache-2.0
   *)
*/
