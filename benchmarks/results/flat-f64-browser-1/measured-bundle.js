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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/aspromise.js
  var require_aspromise = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/aspromise.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/base64.js
  var require_base64 = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/base64.js"(exports) {
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
      base64.encode = function encode(buffer2, start, end) {
        var parts = null, chunk = [];
        var i2 = 0, j = 0, t;
        while (start < end) {
          var b = buffer2[start++];
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
      base64.decode = function decode(string, buffer2, offset) {
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
              buffer2[offset++] = t << 2 | (c & 48) >> 4;
              t = c;
              j = 2;
              break;
            case 2:
              buffer2[offset++] = (t & 15) << 4 | (c & 60) >> 2;
              t = c;
              j = 3;
              break;
            case 3:
              buffer2[offset++] = (t & 3) << 6 | c;
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/eventemitter.js
  var require_eventemitter = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/eventemitter.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/float.js
  var require_float = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/float.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/utf8.js
  var require_utf8 = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/utf8.js"(exports) {
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
      function utf8_read_decoder(decoder2, buffer2, start, end) {
        var source = start === 0 && end === buffer2.length ? buffer2 : buffer2.subarray(start, end);
        return decoder2.decode(source);
      }
      utf8.read = function utf8_read_loose(buffer2, start, end) {
        if (end - start < 1)
          return "";
        if (end - start >= TEXT_DECODER_MIN_LENGTH)
          return utf8_read_decoder(looseDecoder, buffer2, start, end);
        var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
        for (; i + 7 < end; i += 8) {
          c1 = buffer2[i];
          c2 = buffer2[i + 1];
          c3 = buffer2[i + 2];
          c4 = buffer2[i + 3];
          c5 = buffer2[i + 4];
          c6 = buffer2[i + 5];
          c7 = buffer2[i + 6];
          c8 = buffer2[i + 7];
          if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
            return str + utf8_read_decoder(looseDecoder, buffer2, i, end);
          str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
        }
        for (; i < end; ++i) {
          c1 = buffer2[i];
          if (c1 & 128)
            return str + utf8_read_decoder(looseDecoder, buffer2, i, end);
          str += String.fromCharCode(c1);
        }
        return str;
      };
      utf8.readStrict = function utf8_read_strict(buffer2, start, end) {
        if (end - start < 1)
          return "";
        if (end - start >= TEXT_DECODER_MIN_LENGTH)
          return utf8_read_decoder(strictDecoder, buffer2, start, end);
        var str = "", i = start, c1, c2, c3, c4, c5, c6, c7, c8;
        for (; i + 7 < end; i += 8) {
          c1 = buffer2[i];
          c2 = buffer2[i + 1];
          c3 = buffer2[i + 2];
          c4 = buffer2[i + 3];
          c5 = buffer2[i + 4];
          c6 = buffer2[i + 5];
          c7 = buffer2[i + 6];
          c8 = buffer2[i + 7];
          if ((c1 | c2 | c3 | c4 | c5 | c6 | c7 | c8) & 128)
            return str + utf8_read_decoder(strictDecoder, buffer2, i, end);
          str += String.fromCharCode(c1, c2, c3, c4, c5, c6, c7, c8);
        }
        for (; i < end; ++i) {
          c1 = buffer2[i];
          if (c1 & 128)
            return str + utf8_read_decoder(strictDecoder, buffer2, i, end);
          str += String.fromCharCode(c1);
        }
        return str;
      };
      utf8.write = function utf8_write(string, buffer2, offset) {
        var start = offset, c1, c2;
        for (var i = 0; i < string.length; ++i) {
          c1 = string.charCodeAt(i);
          if (c1 < 128) {
            buffer2[offset++] = c1;
          } else if (c1 < 2048) {
            buffer2[offset++] = c1 >> 6 | 192;
            buffer2[offset++] = c1 & 63 | 128;
          } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
            c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
            ++i;
            buffer2[offset++] = c1 >> 18 | 240;
            buffer2[offset++] = c1 >> 12 & 63 | 128;
            buffer2[offset++] = c1 >> 6 & 63 | 128;
            buffer2[offset++] = c1 & 63 | 128;
          } else {
            buffer2[offset++] = c1 >> 12 | 224;
            buffer2[offset++] = c1 >> 6 & 63 | 128;
            buffer2[offset++] = c1 & 63 | 128;
          }
        }
        return offset - start;
      };
    }
  });

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/pool.js
  var require_pool = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/pool.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/longbits.js
  var require_longbits = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/longbits.js"(exports, module) {
      "use strict";
      module.exports = LongBits;
      var Long2;
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
          if (Long2)
            value = Long2.fromString(value);
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
        return Long2 ? new Long2(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
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
        Long2 = Long_;
      };
    }
  });

  // ../node_modules/.pnpm/long@5.3.2/node_modules/long/umd/index.js
  var require_umd = __commonJS({
    "../node_modules/.pnpm/long@5.3.2/node_modules/long/umd/index.js"(exports, module) {
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
          var wasm2 = null;
          try {
            wasm2 = new WebAssembly.Instance(
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
          function Long2(low, high, unsigned) {
            this.low = low | 0;
            this.high = high | 0;
            this.unsigned = !!unsigned;
          }
          Long2.prototype.__isLong__;
          Object.defineProperty(Long2.prototype, "__isLong__", {
            value: true
          });
          function isLong(obj) {
            return (obj && obj["__isLong__"]) === true;
          }
          function ctz32(value) {
            var c = Math.clz32(value & -value);
            return value ? 31 - c : c;
          }
          Long2.isLong = isLong;
          var INT_CACHE2 = {};
          var UINT_CACHE2 = {};
          function fromInt(value, unsigned) {
            var obj, cachedObj, cache;
            if (unsigned) {
              value >>>= 0;
              if (cache = 0 <= value && value < 256) {
                cachedObj = UINT_CACHE2[value];
                if (cachedObj) return cachedObj;
              }
              obj = fromBits(value, 0, true);
              if (cache) UINT_CACHE2[value] = obj;
              return obj;
            } else {
              value |= 0;
              if (cache = -128 <= value && value < 128) {
                cachedObj = INT_CACHE2[value];
                if (cachedObj) return cachedObj;
              }
              obj = fromBits(value, value < 0 ? -1 : 0, false);
              if (cache) INT_CACHE2[value] = obj;
              return obj;
            }
          }
          Long2.fromInt = fromInt;
          function fromNumber(value, unsigned) {
            if (isNaN(value)) return unsigned ? UZERO : ZERO;
            if (unsigned) {
              if (value < 0) return UZERO;
              if (value >= TWO_PWR_64_DBL2) return MAX_UNSIGNED_VALUE;
            } else {
              if (value <= -TWO_PWR_63_DBL2) return MIN_VALUE;
              if (value + 1 >= TWO_PWR_63_DBL2) return MAX_VALUE;
            }
            if (value < 0) return fromNumber(-value, unsigned).neg();
            return fromBits(
              value % TWO_PWR_32_DBL2 | 0,
              value / TWO_PWR_32_DBL2 | 0,
              unsigned
            );
          }
          Long2.fromNumber = fromNumber;
          function fromBits(lowBits, highBits, unsigned) {
            return new Long2(lowBits, highBits, unsigned);
          }
          Long2.fromBits = fromBits;
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
          Long2.fromString = fromString;
          function fromValue(val, unsigned) {
            if (typeof val === "number") return fromNumber(val, unsigned);
            if (typeof val === "string") return fromString(val, unsigned);
            return fromBits(
              val.low,
              val.high,
              typeof unsigned === "boolean" ? unsigned : val.unsigned
            );
          }
          Long2.fromValue = fromValue;
          var TWO_PWR_16_DBL2 = 1 << 16;
          var TWO_PWR_24_DBL2 = 1 << 24;
          var TWO_PWR_32_DBL2 = TWO_PWR_16_DBL2 * TWO_PWR_16_DBL2;
          var TWO_PWR_64_DBL2 = TWO_PWR_32_DBL2 * TWO_PWR_32_DBL2;
          var TWO_PWR_63_DBL2 = TWO_PWR_64_DBL2 / 2;
          var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL2);
          var ZERO = fromInt(0);
          Long2.ZERO = ZERO;
          var UZERO = fromInt(0, true);
          Long2.UZERO = UZERO;
          var ONE = fromInt(1);
          Long2.ONE = ONE;
          var UONE = fromInt(1, true);
          Long2.UONE = UONE;
          var NEG_ONE = fromInt(-1);
          Long2.NEG_ONE = NEG_ONE;
          var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
          Long2.MAX_VALUE = MAX_VALUE;
          var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
          Long2.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
          var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
          Long2.MIN_VALUE = MIN_VALUE;
          var LongPrototype = Long2.prototype;
          LongPrototype.toInt = function toInt() {
            return this.unsigned ? this.low >>> 0 : this.low;
          };
          LongPrototype.toNumber = function toNumber() {
            if (this.unsigned)
              return (this.high >>> 0) * TWO_PWR_32_DBL2 + (this.low >>> 0);
            return this.high * TWO_PWR_32_DBL2 + (this.low >>> 0);
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
          LongPrototype.lessThan = function lessThan2(other) {
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
            if (wasm2) {
              var low = wasm2["mul"](
                this.low,
                this.high,
                multiplier.low,
                multiplier.high
              );
              return fromBits(low, wasm2["get_high"](), this.unsigned);
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
            if (wasm2) {
              if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
                return this;
              }
              var low = (this.unsigned ? wasm2["div_u"] : wasm2["div_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
              );
              return fromBits(low, wasm2["get_high"](), this.unsigned);
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
            if (wasm2) {
              var low = (this.unsigned ? wasm2["rem_u"] : wasm2["rem_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
              );
              return fromBits(low, wasm2["get_high"](), this.unsigned);
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
          Long2.fromBytes = function fromBytes(bytes, unsigned, le) {
            return le ? Long2.fromBytesLE(bytes, unsigned) : Long2.fromBytesBE(bytes, unsigned);
          };
          Long2.fromBytesLE = function fromBytesLE(bytes, unsigned) {
            return new Long2(
              bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
              bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
              unsigned
            );
          };
          Long2.fromBytesBE = function fromBytesBE(bytes, unsigned) {
            return new Long2(
              bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
              bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
              unsigned
            );
          };
          if (typeof BigInt === "function") {
            Long2.fromBigInt = function fromBigInt(value, unsigned) {
              var lowBits = Number(BigInt.asIntN(32, value));
              var highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
              return fromBits(lowBits, highBits, unsigned);
            };
            Long2.fromValue = function fromValueWithBigInt(value, unsigned) {
              if (typeof value === "bigint") return Long2.fromBigInt(value, unsigned);
              return fromValue(value, unsigned);
            };
            LongPrototype.toBigInt = function toBigInt() {
              var lowBigInt = BigInt(this.low >>> 0);
              var highBigInt = BigInt(this.unsigned ? this.high >>> 0 : this.high);
              return highBigInt << BigInt(32) | lowBigInt;
            };
          }
          var _default = _exports.default = Long2;
        }
      );
    }
  });

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/minimal.js
  var require_minimal = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/util/minimal.js"(exports) {
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
          var Long2 = require_umd();
          return Long2 && Long2.isLong ? Long2 : null;
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer.js
  var require_writer = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer_buffer.js
  var require_writer_buffer = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/writer_buffer.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader.js
  var require_reader = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader.js"(exports, module) {
      "use strict";
      module.exports = Reader;
      var util = require_minimal();
      var BufferReader;
      var LongBits = util.LongBits;
      var utf8 = util.utf8;
      function indexOutOfRange(reader, writeLength) {
        return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
      }
      function Reader(buffer2) {
        this.buf = buffer2;
        this.pos = 0;
        this.len = buffer2.length;
        this.view = null;
        this.discardUnknown = Reader.discardUnknown;
      }
      function create_array(buffer2) {
        if (Array.isArray(buffer2))
          buffer2 = new Uint8Array(buffer2);
        if (buffer2 instanceof Uint8Array)
          return new Reader(buffer2);
        throw Error("illegal buffer");
      }
      var create = function create2() {
        return util.Buffer ? function create_buffer_setup(buffer2) {
          return (Reader.create = function create_buffer(buffer3) {
            return util.Buffer.isBuffer(buffer3) ? new BufferReader(buffer3) : create_array(buffer3);
          })(buffer2);
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader_buffer.js
  var require_reader_buffer = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/reader_buffer.js"(exports, module) {
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
      function BufferReader(buffer2) {
        Reader.call(this, buffer2);
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc/service.js
  var require_service = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc/service.js"(exports, module) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc.js
  var require_rpc = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/rpc.js"(exports) {
      "use strict";
      var rpc = exports;
      rpc.Service = require_service();
    }
  });

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/roots.js
  var require_roots = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/roots.js"(exports, module) {
      "use strict";
      module.exports = /* @__PURE__ */ Object.create(null);
    }
  });

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/index-minimal.js
  var require_index_minimal = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/src/index-minimal.js"(exports) {
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

  // ../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/minimal.js
  var require_minimal2 = __commonJS({
    "../node_modules/.pnpm/protobufjs@8.8.1/node_modules/protobufjs/minimal.js"(exports, module) {
      "use strict";
      module.exports = require_index_minimal();
    }
  });

  // ../node_modules/.pnpm/sparse-array-rled@2.0.1/node_modules/sparse-array-rled/build/esm/util.js
  function checkIndex(index, desc = "index") {
    if (!Number.isSafeInteger(index) || index < 0) {
      throw new Error(`Invalid ${desc}: ${index}`);
    }
  }

  // ../node_modules/.pnpm/sparse-array-rled@2.0.1/node_modules/sparse-array-rled/build/esm/sparse_items.js
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
      let current = this.next;
      for (; current.next !== null; current = current.next) {
        ans += current.length;
      }
      if (current instanceof PresentNode)
        ans += current.length;
      return ans;
    }
    /**
     * Returns the number of present values in the array.
     */
    count() {
      let count = 0;
      for (let current = this.next; current !== null; current = current.next) {
        if (current instanceof PresentNode) {
          count += current.length;
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
      for (let current = this.next; current !== null; current = current.next) {
        if (remaining < current.length) {
          if (current instanceof PresentNode) {
            count += remaining;
            return [count, true];
          } else
            return [count, false];
        }
        if (current instanceof PresentNode)
          count += current.length;
        remaining -= current.length;
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
      for (let current = this.next; current !== null; current = current.next) {
        if (remaining < current.length) {
          if (current instanceof DeletedNode)
            return null;
          else
            return [current.item, remaining];
        }
        remaining -= current.length;
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
      for (let current = node; current !== null; current = current.next) {
        if (current instanceof PresentNode) {
          if (countRemaining < current.length) {
            return index + countRemaining;
          }
          countRemaining -= current.length;
        }
        index += current.length;
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
      for (let current = this.next; current !== null; current = current.next) {
        if (current instanceof PresentNode) {
          for (let j = 0; j < current.length; j++) {
            yield index + j;
          }
        }
        index += current.length;
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
      for (let current = this.next; current !== null; current = current.next) {
        if (current instanceof PresentNode) {
          yield [index, current.sliceItem()];
        }
        index += current.length;
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
      for (let current = this.next; current.next !== null; current = current.next) {
        const nextCloned = this.cloneNode(current.next);
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
      let current = this.next;
      for (; current.next !== null; current = current.next) {
        if (current instanceof PresentNode) {
          savedState.push(current.sliceItem());
        } else {
          savedState.push(current.length);
        }
      }
      if (current instanceof PresentNode) {
        savedState.push(current.sliceItem());
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
    let current = start;
    let remaining = delta;
    for (; current.next !== null; current = current.next) {
      if (remaining <= current.length) {
        return [current, remaining, false];
      }
      remaining -= current.length;
    }
    return [current, remaining, remaining > current.length];
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
    constructor(current) {
      this.current = current;
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

  // ../node_modules/.pnpm/sparse-array-rled@2.0.1/node_modules/sparse-array-rled/build/esm/sparse_indices.js
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

  // ../packages/articulated/src/vendor/functional-red-black-tree.ts
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
    constructor(compare, root2) {
      this.compare = compare;
      this.root = root2;
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
      const cmp2 = this.compare;
      let n = this.root;
      const n_stack = [];
      const d_stack = [];
      let d = 0;
      while (n) {
        d = cmp2(key, n.key);
        n_stack.push(n);
        d_stack.push(d);
        if (d === 0) break;
        else if (d < 0) {
          n = n.left;
        } else {
          n = n.right;
        }
      }
      const replace2 = d === 0 && n_stack.length > 0;
      if (replace2) {
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
      if (replace2) return new _RedBlackTree(cmp2, n_stack[0]);
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
      return new _RedBlackTree(cmp2, n_stack[0]);
    }
    /**
     * Finds the last item in the tree whose key is <= `key`.
     *
     * @param key The key to search for.
     * @returns An iterator at the given element.
     */
    le(key) {
      const cmp2 = this.compare;
      let n = this.root;
      const stack = [];
      let last_ptr = 0;
      while (n) {
        const d = cmp2(key, n.key);
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
    /** Finds the first item whose key is >= key, or an empty iterator. */
    ge(key) {
      let node = this.root;
      const stack = [];
      let first = 0;
      while (node) {
        const order = this.compare(key, node.key);
        stack.push(node);
        if (order <= 0) {
          first = stack.length;
          node = node.left;
        } else {
          node = node.right;
        }
      }
      stack.length = first;
      return new RedBlackTreeIterator(this, stack);
    }
    /**
     * @returns An iterator pointing to the first item in the tree with `key`, otherwise null.
     */
    find(key) {
      const cmp2 = this.compare;
      let n = this.root;
      const stack = [];
      while (n) {
        const d = cmp2(key, n.key);
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
      const cmp2 = this.compare;
      let n = this.root;
      while (n) {
        const d = cmp2(key, n.key);
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
        const split3 = cstack.length;
        n = n.left;
        while (n.right) {
          cstack.push(n);
          n = n.right;
        }
        const v = cstack[split3 - 1];
        cstack.push(new RBNode(n.color, v.key, v.value, n.left, n.right));
        cstack[split3 - 1].key = n.key;
        cstack[split3 - 1].value = n.value;
        for (i = cstack.length - 2; i >= split3; --i) {
          n = cstack[i];
          cstack[i] = new RBNode(n.color, n.key, n.value, n.left, cstack[i + 1]);
        }
        cstack[split3 - 1].left = cstack[split3];
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

  // ../packages/articulated/src/internal/leaf_map.ts
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
    /** Finds the containing or next known counter interval for this bunch.
     * Seek against the current version after each replacement, never a stale
     * iterator into a previous persistent tree.
     */
    getLeafAtOrAfter(bunchId, counter) {
      const key = { bunchId, startCounter: counter };
      const previous = this.tree.le(key).key;
      if (previous?.bunchId === bunchId && counter < previous.startCounter + previous.count)
        return previous;
      const next = this.tree.ge(key).key;
      return next?.bunchId === bunchId ? next : void 0;
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

  // ../packages/articulated/src/internal/misc.ts
  function checkCount(count) {
    if (!(Number.isSafeInteger(count) && count >= 0)) {
      throw new Error(`Invalid count: ${count}`);
    }
  }

  // ../packages/articulated/src/internal/seq_map.ts
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

  // ../packages/articulated/src/id_list.ts
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
    constructor(root2, leafMap, parentSeqs) {
      this.root = root2;
      this.leafMap = leafMap;
      this.parentSeqs = parentSeqs.set(root2.seq, 0);
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
          const current = savedState.at(-1);
          if (id.bunchId === current.bunchId && id.counter === current.startCounter + current.count && isDeleted === current.isDeleted) {
            current.count++;
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
    /** Experimental benchmark hook: skip unknown counter gaps and unchanged
     * visibility. The public delete implementation remains the control.
     */
    experimentalDeleteIntervals(id, count = 1) {
      checkCount(count);
      if (count === 0) return this;
      const start = id.counter;
      const end = start + count;
      if (typeof id.bunchId !== "string" || !Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(end))
        return this.delete(id, count);
      let answer = this;
      let counter = start;
      while (counter < end) {
        const leaf = answer.leafMap.getLeafAtOrAfter(id.bunchId, counter);
        if (!leaf || leaf.startCounter >= end) break;
        const from = Math.max(counter, leaf.startCounter);
        const to = Math.min(end, leaf.startCounter + leaf.count);
        const changes = !leaf.present.isEmpty() && (to - from === 1 ? leaf.present.has(from) : leaf.present.countAt(to) !== leaf.present.countAt(from));
        if (changes) {
          const located = answer.locate({ bunchId: id.bunchId, counter: from });
          if (located === null) throw new Error("Internal error");
          const present = leaf.present.clone();
          present.delete(from, to - from);
          answer = answer.replaceLeaf(located, { ...leaf, present });
        }
        counter = to;
      }
      return answer;
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
    cursorAt(index, bind2 = "left") {
      if (bind2 === "left") {
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
    cursorIndex(cursor, bind2 = "left") {
      if (bind2 === "left") {
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
        const root2 = build(0, depth);
        parentEntries.push([root2.seq, 0]);
        list = new _IdList(
          root2,
          LeafMap.fromEntries(leafEntries),
          SeqMap.fromEntries(parentEntries, nextSeq)
        );
      } else {
        const root2 = buildTree(leaves, leafMapMut, parentSeqsMut, 0, depth);
        list = new _IdList(root2, leafMapMut.value, parentSeqsMut.value);
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
    constructor(list, root2) {
      this.list = list;
      this.root = root2;
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
  function replaceNode(located, root2, leafMapMut, parentSeqsMut, newNodes, i) {
    const parent = i === located.length - 1 ? root2 : located[i + 1].node;
    const indexInParent = located[i].indexInParent;
    const newChildren = parent.children.slice(0, indexInParent).concat(newNodes, parent.children.slice(indexInParent + 1));
    if (newChildren.length > M) {
      const split3 = Math.ceil(newChildren.length / 2);
      const seqs = [parent.seq, getAndBumpNextSeq(parentSeqsMut)];
      const newParents = [
        newChildren.slice(0, split3),
        newChildren.slice(split3)
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
          root2,
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
        return replaceNode(located, root2, leafMapMut, parentSeqsMut, [], i + 1);
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
          root2,
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

  // src/browser/edit-workload.ts
  var nativeFirstEdit = "browser-first-edit_0";

  // ../node_modules/.pnpm/bson@7.3.2/node_modules/bson/lib/bson.mjs
  var TypedArrayPrototypeGetSymbolToStringTag = (() => {
    const g = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(Uint8Array.prototype), Symbol.toStringTag).get;
    return (value) => g.call(value);
  })();
  function isUint8Array(value) {
    return TypedArrayPrototypeGetSymbolToStringTag(value) === "Uint8Array";
  }
  function isAnyArrayBuffer(value) {
    return typeof value === "object" && value != null && Symbol.toStringTag in value && (value[Symbol.toStringTag] === "ArrayBuffer" || value[Symbol.toStringTag] === "SharedArrayBuffer");
  }
  function isRegExp(regexp2) {
    return regexp2 instanceof RegExp || Object.prototype.toString.call(regexp2) === "[object RegExp]";
  }
  function isMap(value) {
    return typeof value === "object" && value != null && Symbol.toStringTag in value && value[Symbol.toStringTag] === "Map";
  }
  function isDate(date) {
    return date instanceof Date || Object.prototype.toString.call(date) === "[object Date]";
  }
  function defaultInspect(x, _options) {
    return JSON.stringify(x, (k, v) => {
      if (typeof v === "bigint") {
        return { $numberLong: `${v}` };
      } else if (isMap(v)) {
        return Object.fromEntries(v);
      }
      return v;
    });
  }
  function getStylizeFunction(options) {
    const stylizeExists = options != null && typeof options === "object" && "stylize" in options && typeof options.stylize === "function";
    if (stylizeExists) {
      return options.stylize;
    }
  }
  var BSON_MAJOR_VERSION = 7;
  var BSON_VERSION_SYMBOL = Symbol.for("@@mdb.bson.version");
  var BSON_INT32_MAX = 2147483647;
  var BSON_INT32_MIN = -2147483648;
  var BSON_INT64_MAX = Math.pow(2, 63) - 1;
  var BSON_INT64_MIN = -Math.pow(2, 63);
  var JS_INT_MAX = Math.pow(2, 53);
  var JS_INT_MIN = -Math.pow(2, 53);
  var BSON_DATA_NUMBER = 1;
  var BSON_DATA_STRING = 2;
  var BSON_DATA_OBJECT = 3;
  var BSON_DATA_ARRAY = 4;
  var BSON_DATA_BINARY = 5;
  var BSON_DATA_UNDEFINED = 6;
  var BSON_DATA_OID = 7;
  var BSON_DATA_BOOLEAN = 8;
  var BSON_DATA_DATE = 9;
  var BSON_DATA_NULL = 10;
  var BSON_DATA_REGEXP = 11;
  var BSON_DATA_DBPOINTER = 12;
  var BSON_DATA_CODE = 13;
  var BSON_DATA_SYMBOL = 14;
  var BSON_DATA_CODE_W_SCOPE = 15;
  var BSON_DATA_INT = 16;
  var BSON_DATA_TIMESTAMP = 17;
  var BSON_DATA_LONG = 18;
  var BSON_DATA_DECIMAL128 = 19;
  var BSON_DATA_MIN_KEY = 255;
  var BSON_DATA_MAX_KEY = 127;
  var BSON_BINARY_SUBTYPE_DEFAULT = 0;
  var BSON_BINARY_SUBTYPE_UUID_NEW = 4;
  var BSONType = Object.freeze({
    double: 1,
    string: 2,
    object: 3,
    array: 4,
    binData: 5,
    undefined: 6,
    objectId: 7,
    bool: 8,
    date: 9,
    null: 10,
    regex: 11,
    dbPointer: 12,
    javascript: 13,
    symbol: 14,
    javascriptWithScope: 15,
    int: 16,
    timestamp: 17,
    long: 18,
    decimal: 19,
    minKey: -1,
    maxKey: 127
  });
  var BSONError = class extends Error {
    get bsonError() {
      return true;
    }
    get name() {
      return "BSONError";
    }
    constructor(message, options) {
      super(message, options);
    }
    static isBSONError(value) {
      return value != null && typeof value === "object" && "bsonError" in value && value.bsonError === true && "name" in value && "message" in value && "stack" in value;
    }
  };
  var BSONVersionError = class extends BSONError {
    get name() {
      return "BSONVersionError";
    }
    constructor() {
      super(`Unsupported BSON version, bson types must be from bson ${BSON_MAJOR_VERSION}.x.x`);
    }
  };
  var BSONRuntimeError = class extends BSONError {
    get name() {
      return "BSONRuntimeError";
    }
    constructor(message) {
      super(message);
    }
  };
  var BSONOffsetError = class extends BSONError {
    get name() {
      return "BSONOffsetError";
    }
    offset;
    constructor(message, offset, options) {
      super(`${message}. offset: ${offset}`, options);
      this.offset = offset;
    }
  };
  var TextDecoderFatal;
  var TextDecoderNonFatal;
  function parseUtf8(buffer2, start, end, fatal) {
    if (fatal) {
      TextDecoderFatal ??= new TextDecoder("utf8", { fatal: true });
      try {
        return TextDecoderFatal.decode(buffer2.subarray(start, end));
      } catch (cause) {
        throw new BSONError("Invalid UTF-8 string in BSON document", { cause });
      }
    }
    TextDecoderNonFatal ??= new TextDecoder("utf8", { fatal: false });
    return TextDecoderNonFatal.decode(buffer2.subarray(start, end));
  }
  function tryReadBasicLatin(uint8array, start, end) {
    if (uint8array.length === 0) {
      return "";
    }
    const stringByteLength = end - start;
    if (stringByteLength === 0) {
      return "";
    }
    if (stringByteLength > 20) {
      return null;
    }
    if (stringByteLength === 1 && uint8array[start] < 128) {
      return String.fromCharCode(uint8array[start]);
    }
    if (stringByteLength === 2 && uint8array[start] < 128 && uint8array[start + 1] < 128) {
      return String.fromCharCode(uint8array[start]) + String.fromCharCode(uint8array[start + 1]);
    }
    if (stringByteLength === 3 && uint8array[start] < 128 && uint8array[start + 1] < 128 && uint8array[start + 2] < 128) {
      return String.fromCharCode(uint8array[start]) + String.fromCharCode(uint8array[start + 1]) + String.fromCharCode(uint8array[start + 2]);
    }
    const latinBytes = [];
    for (let i = start; i < end; i++) {
      const byte = uint8array[i];
      if (byte > 127) {
        return null;
      }
      latinBytes.push(byte);
    }
    return String.fromCharCode(...latinBytes);
  }
  function tryWriteBasicLatin(destination, source, offset) {
    if (source.length === 0)
      return 0;
    if (source.length > 25)
      return null;
    if (destination.length - offset < source.length)
      return null;
    for (let charOffset = 0, destinationOffset = offset; charOffset < source.length; charOffset++, destinationOffset++) {
      const char = source.charCodeAt(charOffset);
      if (char > 127)
        return null;
      destination[destinationOffset] = char;
    }
    return source.length;
  }
  function nodejsMathRandomBytes(byteLength) {
    return nodeJsByteUtils.fromNumberArray(Array.from({ length: byteLength }, () => Math.floor(Math.random() * 256)));
  }
  function nodejsSecureRandomBytes(byteLength) {
    return crypto.getRandomValues(nodeJsByteUtils.allocate(byteLength));
  }
  var nodejsRandomBytes = (() => {
    const { crypto: crypto2 } = globalThis;
    if (crypto2 != null && typeof crypto2.getRandomValues === "function") {
      return nodejsSecureRandomBytes;
    } else {
      return nodejsMathRandomBytes;
    }
  })();
  var nodeJsByteUtils = {
    isUint8Array,
    toLocalBufferType(potentialBuffer) {
      if (Buffer.isBuffer(potentialBuffer)) {
        return potentialBuffer;
      }
      if (ArrayBuffer.isView(potentialBuffer)) {
        return Buffer.from(potentialBuffer.buffer, potentialBuffer.byteOffset, potentialBuffer.byteLength);
      }
      const stringTag = potentialBuffer?.[Symbol.toStringTag] ?? Object.prototype.toString.call(potentialBuffer);
      if (stringTag === "ArrayBuffer" || stringTag === "SharedArrayBuffer" || stringTag === "[object ArrayBuffer]" || stringTag === "[object SharedArrayBuffer]") {
        return Buffer.from(potentialBuffer);
      }
      throw new BSONError(`Cannot create Buffer from the passed potentialBuffer.`);
    },
    allocate(size) {
      return Buffer.alloc(size);
    },
    allocateUnsafe(size) {
      return Buffer.allocUnsafe(size);
    },
    compare(a, b) {
      return nodeJsByteUtils.toLocalBufferType(a).compare(b);
    },
    concat(list) {
      return Buffer.concat(list);
    },
    copy(source, target, targetStart, sourceStart, sourceEnd) {
      return nodeJsByteUtils.toLocalBufferType(source).copy(target, targetStart ?? 0, sourceStart ?? 0, sourceEnd ?? source.length);
    },
    equals(a, b) {
      return nodeJsByteUtils.toLocalBufferType(a).equals(b);
    },
    fromNumberArray(array) {
      return Buffer.from(array);
    },
    fromBase64(base64) {
      return Buffer.from(base64, "base64");
    },
    fromUTF8(utf8) {
      return Buffer.from(utf8, "utf8");
    },
    toBase64(buffer2) {
      return nodeJsByteUtils.toLocalBufferType(buffer2).toString("base64");
    },
    fromISO88591(codePoints) {
      return Buffer.from(codePoints, "binary");
    },
    toISO88591(buffer2) {
      return nodeJsByteUtils.toLocalBufferType(buffer2).toString("binary");
    },
    fromHex(hex2) {
      return Buffer.from(hex2, "hex");
    },
    toHex(buffer2) {
      return nodeJsByteUtils.toLocalBufferType(buffer2).toString("hex");
    },
    toUTF8(buffer2, start, end, fatal) {
      const basicLatin = end - start <= 20 ? tryReadBasicLatin(buffer2, start, end) : null;
      if (basicLatin != null) {
        return basicLatin;
      }
      const string = nodeJsByteUtils.toLocalBufferType(buffer2).toString("utf8", start, end);
      if (fatal) {
        for (let i = 0; i < string.length; i++) {
          if (string.charCodeAt(i) === 65533) {
            parseUtf8(buffer2, start, end, true);
            break;
          }
        }
      }
      return string;
    },
    utf8ByteLength(input) {
      return Buffer.byteLength(input, "utf8");
    },
    encodeUTF8Into(buffer2, source, byteOffset) {
      const latinBytesWritten = tryWriteBasicLatin(buffer2, source, byteOffset);
      if (latinBytesWritten != null) {
        return latinBytesWritten;
      }
      return nodeJsByteUtils.toLocalBufferType(buffer2).write(source, byteOffset, void 0, "utf8");
    },
    randomBytes: nodejsRandomBytes,
    swap32(buffer2) {
      return nodeJsByteUtils.toLocalBufferType(buffer2).swap32();
    }
  };
  function isReactNative() {
    const { navigator: navigator2 } = globalThis;
    return typeof navigator2 === "object" && navigator2.product === "ReactNative";
  }
  function webMathRandomBytes(byteLength) {
    if (byteLength < 0) {
      throw new RangeError(`The argument 'byteLength' is invalid. Received ${byteLength}`);
    }
    return webByteUtils.fromNumberArray(Array.from({ length: byteLength }, () => Math.floor(Math.random() * 256)));
  }
  var webRandomBytes = (() => {
    const { crypto: crypto2 } = globalThis;
    if (crypto2 != null && typeof crypto2.getRandomValues === "function") {
      return (byteLength) => {
        return crypto2.getRandomValues(webByteUtils.allocate(byteLength));
      };
    } else {
      if (isReactNative()) {
        const { console: console2 } = globalThis;
        console2?.warn?.("BSON: For React Native please polyfill crypto.getRandomValues, e.g. using: https://www.npmjs.com/package/react-native-get-random-values.");
      }
      return webMathRandomBytes;
    }
  })();
  var HEX_DIGIT = /(\d|[a-f])/i;
  var webByteUtils = {
    isUint8Array,
    toLocalBufferType(potentialUint8array) {
      const stringTag = potentialUint8array?.[Symbol.toStringTag] ?? Object.prototype.toString.call(potentialUint8array);
      if (stringTag === "Uint8Array") {
        return potentialUint8array;
      }
      if (ArrayBuffer.isView(potentialUint8array)) {
        return new Uint8Array(potentialUint8array.buffer.slice(potentialUint8array.byteOffset, potentialUint8array.byteOffset + potentialUint8array.byteLength));
      }
      if (stringTag === "ArrayBuffer" || stringTag === "SharedArrayBuffer" || stringTag === "[object ArrayBuffer]" || stringTag === "[object SharedArrayBuffer]") {
        return new Uint8Array(potentialUint8array);
      }
      throw new BSONError(`Cannot make a Uint8Array from passed potentialBuffer.`);
    },
    allocate(size) {
      if (typeof size !== "number") {
        throw new TypeError(`The "size" argument must be of type number. Received ${String(size)}`);
      }
      return new Uint8Array(size);
    },
    allocateUnsafe(size) {
      return webByteUtils.allocate(size);
    },
    compare(uint8Array, otherUint8Array) {
      if (uint8Array === otherUint8Array)
        return 0;
      const len = Math.min(uint8Array.length, otherUint8Array.length);
      for (let i = 0; i < len; i++) {
        if (uint8Array[i] < otherUint8Array[i])
          return -1;
        if (uint8Array[i] > otherUint8Array[i])
          return 1;
      }
      if (uint8Array.length < otherUint8Array.length)
        return -1;
      if (uint8Array.length > otherUint8Array.length)
        return 1;
      return 0;
    },
    concat(uint8Arrays) {
      if (uint8Arrays.length === 0)
        return webByteUtils.allocate(0);
      let totalLength = 0;
      for (const uint8Array of uint8Arrays) {
        totalLength += uint8Array.length;
      }
      const result = webByteUtils.allocate(totalLength);
      let offset = 0;
      for (const uint8Array of uint8Arrays) {
        result.set(uint8Array, offset);
        offset += uint8Array.length;
      }
      return result;
    },
    copy(source, target, targetStart, sourceStart, sourceEnd) {
      if (sourceEnd !== void 0 && sourceEnd < 0) {
        throw new RangeError(`The value of "sourceEnd" is out of range. It must be >= 0. Received ${sourceEnd}`);
      }
      sourceEnd = sourceEnd ?? source.length;
      if (sourceStart !== void 0 && (sourceStart < 0 || sourceStart > sourceEnd)) {
        throw new RangeError(`The value of "sourceStart" is out of range. It must be >= 0 and <= ${sourceEnd}. Received ${sourceStart}`);
      }
      sourceStart = sourceStart ?? 0;
      if (targetStart !== void 0 && targetStart < 0) {
        throw new RangeError(`The value of "targetStart" is out of range. It must be >= 0. Received ${targetStart}`);
      }
      targetStart = targetStart ?? 0;
      const srcSlice = source.subarray(sourceStart, sourceEnd);
      const maxLen = Math.min(srcSlice.length, target.length - targetStart);
      if (maxLen <= 0) {
        return 0;
      }
      target.set(srcSlice.subarray(0, maxLen), targetStart);
      return maxLen;
    },
    equals(uint8Array, otherUint8Array) {
      if (uint8Array.byteLength !== otherUint8Array.byteLength) {
        return false;
      }
      for (let i = 0; i < uint8Array.byteLength; i++) {
        if (uint8Array[i] !== otherUint8Array[i]) {
          return false;
        }
      }
      return true;
    },
    fromNumberArray(array) {
      return Uint8Array.from(array);
    },
    fromBase64(base64) {
      return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    },
    fromUTF8(utf8) {
      return new TextEncoder().encode(utf8);
    },
    toBase64(uint8array) {
      return btoa(webByteUtils.toISO88591(uint8array));
    },
    fromISO88591(codePoints) {
      return Uint8Array.from(codePoints, (c) => c.charCodeAt(0) & 255);
    },
    toISO88591(uint8array) {
      return Array.from(Uint16Array.from(uint8array), (b) => String.fromCharCode(b)).join("");
    },
    fromHex(hex2) {
      const evenLengthHex = hex2.length % 2 === 0 ? hex2 : hex2.slice(0, hex2.length - 1);
      const buffer2 = [];
      for (let i = 0; i < evenLengthHex.length; i += 2) {
        const firstDigit = evenLengthHex[i];
        const secondDigit = evenLengthHex[i + 1];
        if (!HEX_DIGIT.test(firstDigit)) {
          break;
        }
        if (!HEX_DIGIT.test(secondDigit)) {
          break;
        }
        const hexDigit = Number.parseInt(`${firstDigit}${secondDigit}`, 16);
        buffer2.push(hexDigit);
      }
      return Uint8Array.from(buffer2);
    },
    toHex(uint8array) {
      return Array.from(uint8array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    },
    toUTF8(uint8array, start, end, fatal) {
      const basicLatin = end - start <= 20 ? tryReadBasicLatin(uint8array, start, end) : null;
      if (basicLatin != null) {
        return basicLatin;
      }
      return parseUtf8(uint8array, start, end, fatal);
    },
    utf8ByteLength(input) {
      return new TextEncoder().encode(input).byteLength;
    },
    encodeUTF8Into(uint8array, source, byteOffset) {
      const bytes = new TextEncoder().encode(source);
      uint8array.set(bytes, byteOffset);
      return bytes.byteLength;
    },
    randomBytes: webRandomBytes,
    swap32(buffer2) {
      if (buffer2.length % 4 !== 0) {
        throw new RangeError("Buffer size must be a multiple of 32-bits");
      }
      for (let i = 0; i < buffer2.length; i += 4) {
        const byte0 = buffer2[i];
        const byte1 = buffer2[i + 1];
        const byte2 = buffer2[i + 2];
        const byte3 = buffer2[i + 3];
        buffer2[i] = byte3;
        buffer2[i + 1] = byte2;
        buffer2[i + 2] = byte1;
        buffer2[i + 3] = byte0;
      }
      return buffer2;
    }
  };
  var hasGlobalBuffer = typeof Buffer === "function" && Buffer.prototype?._isBuffer !== true;
  var ByteUtils = hasGlobalBuffer ? nodeJsByteUtils : webByteUtils;
  var bsonType = Symbol.for("@@mdb.bson.type");
  var BSONValue = class {
    get [bsonType]() {
      return this._bsontype;
    }
    get [BSON_VERSION_SYMBOL]() {
      return BSON_MAJOR_VERSION;
    }
    [Symbol.for("nodejs.util.inspect.custom")](depth, options, inspect3) {
      return this.inspect(depth, options, inspect3);
    }
  };
  var FLOAT = new Float64Array(1);
  var FLOAT_BYTES = new Uint8Array(FLOAT.buffer, 0, 8);
  FLOAT[0] = -1;
  var isBigEndian = FLOAT_BYTES[7] === 0;
  var NumberUtils = {
    isBigEndian,
    getNonnegativeInt32LE(source, offset) {
      if (source[offset + 3] > 127) {
        throw new RangeError(`Size cannot be negative at offset: ${offset}`);
      }
      return source[offset] | source[offset + 1] << 8 | source[offset + 2] << 16 | source[offset + 3] << 24;
    },
    getInt32LE(source, offset) {
      return source[offset] | source[offset + 1] << 8 | source[offset + 2] << 16 | source[offset + 3] << 24;
    },
    getUint32LE(source, offset) {
      return source[offset] + source[offset + 1] * 256 + source[offset + 2] * 65536 + source[offset + 3] * 16777216;
    },
    getUint32BE(source, offset) {
      return source[offset + 3] + source[offset + 2] * 256 + source[offset + 1] * 65536 + source[offset] * 16777216;
    },
    getBigInt64LE(source, offset) {
      const hi = BigInt(source[offset + 4] + source[offset + 5] * 256 + source[offset + 6] * 65536 + (source[offset + 7] << 24));
      const lo = BigInt(source[offset] + source[offset + 1] * 256 + source[offset + 2] * 65536 + source[offset + 3] * 16777216);
      return (hi << 32n) + lo;
    },
    getFloat64LE: isBigEndian ? (source, offset) => {
      FLOAT_BYTES[7] = source[offset];
      FLOAT_BYTES[6] = source[offset + 1];
      FLOAT_BYTES[5] = source[offset + 2];
      FLOAT_BYTES[4] = source[offset + 3];
      FLOAT_BYTES[3] = source[offset + 4];
      FLOAT_BYTES[2] = source[offset + 5];
      FLOAT_BYTES[1] = source[offset + 6];
      FLOAT_BYTES[0] = source[offset + 7];
      return FLOAT[0];
    } : (source, offset) => {
      FLOAT_BYTES[0] = source[offset];
      FLOAT_BYTES[1] = source[offset + 1];
      FLOAT_BYTES[2] = source[offset + 2];
      FLOAT_BYTES[3] = source[offset + 3];
      FLOAT_BYTES[4] = source[offset + 4];
      FLOAT_BYTES[5] = source[offset + 5];
      FLOAT_BYTES[6] = source[offset + 6];
      FLOAT_BYTES[7] = source[offset + 7];
      return FLOAT[0];
    },
    setInt32BE(destination, offset, value) {
      destination[offset + 3] = value;
      value >>>= 8;
      destination[offset + 2] = value;
      value >>>= 8;
      destination[offset + 1] = value;
      value >>>= 8;
      destination[offset] = value;
      return 4;
    },
    setInt32LE(destination, offset, value) {
      destination[offset] = value;
      value >>>= 8;
      destination[offset + 1] = value;
      value >>>= 8;
      destination[offset + 2] = value;
      value >>>= 8;
      destination[offset + 3] = value;
      return 4;
    },
    setBigInt64LE(destination, offset, value) {
      const mask32bits = 0xffffffffn;
      let lo = Number(value & mask32bits);
      destination[offset] = lo;
      lo >>= 8;
      destination[offset + 1] = lo;
      lo >>= 8;
      destination[offset + 2] = lo;
      lo >>= 8;
      destination[offset + 3] = lo;
      let hi = Number(value >> 32n & mask32bits);
      destination[offset + 4] = hi;
      hi >>= 8;
      destination[offset + 5] = hi;
      hi >>= 8;
      destination[offset + 6] = hi;
      hi >>= 8;
      destination[offset + 7] = hi;
      return 8;
    },
    setFloat64LE: isBigEndian ? (destination, offset, value) => {
      FLOAT[0] = value;
      destination[offset] = FLOAT_BYTES[7];
      destination[offset + 1] = FLOAT_BYTES[6];
      destination[offset + 2] = FLOAT_BYTES[5];
      destination[offset + 3] = FLOAT_BYTES[4];
      destination[offset + 4] = FLOAT_BYTES[3];
      destination[offset + 5] = FLOAT_BYTES[2];
      destination[offset + 6] = FLOAT_BYTES[1];
      destination[offset + 7] = FLOAT_BYTES[0];
      return 8;
    } : (destination, offset, value) => {
      FLOAT[0] = value;
      destination[offset] = FLOAT_BYTES[0];
      destination[offset + 1] = FLOAT_BYTES[1];
      destination[offset + 2] = FLOAT_BYTES[2];
      destination[offset + 3] = FLOAT_BYTES[3];
      destination[offset + 4] = FLOAT_BYTES[4];
      destination[offset + 5] = FLOAT_BYTES[5];
      destination[offset + 6] = FLOAT_BYTES[6];
      destination[offset + 7] = FLOAT_BYTES[7];
      return 8;
    }
  };
  var Binary = class _Binary extends BSONValue {
    get _bsontype() {
      return "Binary";
    }
    static BSON_BINARY_SUBTYPE_DEFAULT = 0;
    static BUFFER_SIZE = 256;
    static SUBTYPE_DEFAULT = 0;
    static SUBTYPE_FUNCTION = 1;
    static SUBTYPE_BYTE_ARRAY = 2;
    static SUBTYPE_UUID_OLD = 3;
    static SUBTYPE_UUID = 4;
    static SUBTYPE_MD5 = 5;
    static SUBTYPE_ENCRYPTED = 6;
    static SUBTYPE_COLUMN = 7;
    static SUBTYPE_SENSITIVE = 8;
    static SUBTYPE_VECTOR = 9;
    static SUBTYPE_USER_DEFINED = 128;
    static VECTOR_TYPE = Object.freeze({
      Int8: 3,
      Float32: 39,
      PackedBit: 16
    });
    buffer;
    sub_type;
    position;
    constructor(buffer2, subType) {
      super();
      if (!(buffer2 == null) && typeof buffer2 === "string" && !ArrayBuffer.isView(buffer2) && !isAnyArrayBuffer(buffer2) && !Array.isArray(buffer2)) {
        throw new BSONError("Binary can only be constructed from Uint8Array or number[]");
      }
      this.sub_type = (subType ?? _Binary.BSON_BINARY_SUBTYPE_DEFAULT) & 255;
      if (buffer2 == null) {
        this.buffer = ByteUtils.allocate(_Binary.BUFFER_SIZE);
        this.position = 0;
      } else {
        this.buffer = Array.isArray(buffer2) ? ByteUtils.fromNumberArray(buffer2) : ByteUtils.toLocalBufferType(buffer2);
        this.position = this.buffer.byteLength;
      }
    }
    put(byteValue) {
      if (typeof byteValue === "string" && byteValue.length !== 1) {
        throw new BSONError("only accepts single character String");
      } else if (typeof byteValue !== "number" && byteValue.length !== 1)
        throw new BSONError("only accepts single character Uint8Array or Array");
      let decodedByte;
      if (typeof byteValue === "string") {
        decodedByte = byteValue.charCodeAt(0);
      } else if (typeof byteValue === "number") {
        decodedByte = byteValue;
      } else {
        decodedByte = byteValue[0];
      }
      if (decodedByte < 0 || decodedByte > 255) {
        throw new BSONError("only accepts number in a valid unsigned byte range 0-255");
      }
      if (this.buffer.byteLength > this.position) {
        this.buffer[this.position++] = decodedByte;
      } else {
        const newSpace = ByteUtils.allocate(_Binary.BUFFER_SIZE + this.buffer.length);
        newSpace.set(this.buffer, 0);
        this.buffer = newSpace;
        this.buffer[this.position++] = decodedByte;
      }
    }
    write(sequence, offset) {
      offset = typeof offset === "number" ? offset : this.position;
      if (this.buffer.byteLength < offset + sequence.length) {
        const newSpace = ByteUtils.allocate(this.buffer.byteLength + sequence.length);
        newSpace.set(this.buffer, 0);
        this.buffer = newSpace;
      }
      if (ArrayBuffer.isView(sequence)) {
        this.buffer.set(ByteUtils.toLocalBufferType(sequence), offset);
        this.position = offset + sequence.byteLength > this.position ? offset + sequence.length : this.position;
      } else if (typeof sequence === "string") {
        throw new BSONError("input cannot be string");
      }
    }
    read(position, length) {
      length = length && length > 0 ? length : this.position;
      const end = position + length;
      return this.buffer.subarray(position, end > this.position ? this.position : end);
    }
    value() {
      return this.buffer.length === this.position ? this.buffer : this.buffer.subarray(0, this.position);
    }
    length() {
      return this.position;
    }
    toJSON() {
      return ByteUtils.toBase64(this.buffer.subarray(0, this.position));
    }
    toString(encoding) {
      if (encoding === "hex")
        return ByteUtils.toHex(this.buffer.subarray(0, this.position));
      if (encoding === "base64")
        return ByteUtils.toBase64(this.buffer.subarray(0, this.position));
      if (encoding === "utf8" || encoding === "utf-8")
        return ByteUtils.toUTF8(this.buffer, 0, this.position, false);
      return ByteUtils.toUTF8(this.buffer, 0, this.position, false);
    }
    toExtendedJSON(options) {
      options = options || {};
      if (this.sub_type === _Binary.SUBTYPE_VECTOR) {
        validateBinaryVector(this);
      }
      const base64String = ByteUtils.toBase64(this.buffer);
      const subType = Number(this.sub_type).toString(16);
      if (options.legacy) {
        return {
          $binary: base64String,
          $type: subType.length === 1 ? "0" + subType : subType
        };
      }
      return {
        $binary: {
          base64: base64String,
          subType: subType.length === 1 ? "0" + subType : subType
        }
      };
    }
    toUUID() {
      if (this.sub_type === _Binary.SUBTYPE_UUID) {
        return new UUID(this.buffer.subarray(0, this.position));
      }
      throw new BSONError(`Binary sub_type "${this.sub_type}" (${typeof this.sub_type}) is not supported for converting to UUID. Only 0x${_Binary.SUBTYPE_UUID.toString(16).padStart(2, "0")} is currently supported.`);
    }
    static createFromHexString(hex2, subType) {
      return new _Binary(ByteUtils.fromHex(hex2), subType);
    }
    static createFromBase64(base64, subType) {
      return new _Binary(ByteUtils.fromBase64(base64), subType);
    }
    static fromExtendedJSON(doc3, options) {
      options = options || {};
      let data;
      let type3;
      if ("$binary" in doc3) {
        if (options.legacy && typeof doc3.$binary === "string" && "$type" in doc3) {
          type3 = doc3.$type ? parseInt(doc3.$type, 16) : 0;
          data = ByteUtils.fromBase64(doc3.$binary);
        } else {
          if (typeof doc3.$binary !== "string") {
            type3 = doc3.$binary.subType ? parseInt(doc3.$binary.subType, 16) : 0;
            data = ByteUtils.fromBase64(doc3.$binary.base64);
          }
        }
      } else if ("$uuid" in doc3) {
        type3 = 4;
        data = UUID.bytesFromString(doc3.$uuid);
      }
      if (!data) {
        throw new BSONError(`Unexpected Binary Extended JSON format ${JSON.stringify(doc3)}`);
      }
      return type3 === BSON_BINARY_SUBTYPE_UUID_NEW ? new UUID(data) : new _Binary(data, type3);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      const base64 = ByteUtils.toBase64(this.buffer.subarray(0, this.position));
      const base64Arg = inspect3(base64, options);
      const subTypeArg = inspect3(this.sub_type, options);
      return `Binary.createFromBase64(${base64Arg}, ${subTypeArg})`;
    }
    toInt8Array() {
      if (this.sub_type !== _Binary.SUBTYPE_VECTOR) {
        throw new BSONError("Binary sub_type is not Vector");
      }
      if (this.buffer[0] !== _Binary.VECTOR_TYPE.Int8) {
        throw new BSONError("Binary datatype field is not Int8");
      }
      validateBinaryVector(this);
      return new Int8Array(this.buffer.buffer.slice(this.buffer.byteOffset + 2, this.buffer.byteOffset + this.position));
    }
    toFloat32Array() {
      if (this.sub_type !== _Binary.SUBTYPE_VECTOR) {
        throw new BSONError("Binary sub_type is not Vector");
      }
      if (this.buffer[0] !== _Binary.VECTOR_TYPE.Float32) {
        throw new BSONError("Binary datatype field is not Float32");
      }
      validateBinaryVector(this);
      const floatBytes = new Uint8Array(this.buffer.buffer.slice(this.buffer.byteOffset + 2, this.buffer.byteOffset + this.position));
      if (NumberUtils.isBigEndian)
        ByteUtils.swap32(floatBytes);
      return new Float32Array(floatBytes.buffer);
    }
    toPackedBits() {
      if (this.sub_type !== _Binary.SUBTYPE_VECTOR) {
        throw new BSONError("Binary sub_type is not Vector");
      }
      if (this.buffer[0] !== _Binary.VECTOR_TYPE.PackedBit) {
        throw new BSONError("Binary datatype field is not packed bit");
      }
      validateBinaryVector(this);
      return new Uint8Array(this.buffer.buffer.slice(this.buffer.byteOffset + 2, this.buffer.byteOffset + this.position));
    }
    toBits() {
      if (this.sub_type !== _Binary.SUBTYPE_VECTOR) {
        throw new BSONError("Binary sub_type is not Vector");
      }
      if (this.buffer[0] !== _Binary.VECTOR_TYPE.PackedBit) {
        throw new BSONError("Binary datatype field is not packed bit");
      }
      validateBinaryVector(this);
      const byteCount = this.length() - 2;
      const bitCount = byteCount * 8 - this.buffer[1];
      const bits = new Int8Array(bitCount);
      for (let bitOffset = 0; bitOffset < bits.length; bitOffset++) {
        const byteOffset = bitOffset / 8 | 0;
        const byte = this.buffer[byteOffset + 2];
        const shift = 7 - bitOffset % 8;
        const bit = byte >> shift & 1;
        bits[bitOffset] = bit;
      }
      return bits;
    }
    static fromInt8Array(array) {
      const buffer2 = ByteUtils.allocate(array.byteLength + 2);
      buffer2[0] = _Binary.VECTOR_TYPE.Int8;
      buffer2[1] = 0;
      const intBytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      buffer2.set(intBytes, 2);
      const bin = new this(buffer2, this.SUBTYPE_VECTOR);
      validateBinaryVector(bin);
      return bin;
    }
    static fromFloat32Array(array) {
      const binaryBytes = ByteUtils.allocate(array.byteLength + 2);
      binaryBytes[0] = _Binary.VECTOR_TYPE.Float32;
      binaryBytes[1] = 0;
      const floatBytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      binaryBytes.set(floatBytes, 2);
      if (NumberUtils.isBigEndian)
        ByteUtils.swap32(new Uint8Array(binaryBytes.buffer, 2));
      const bin = new this(binaryBytes, this.SUBTYPE_VECTOR);
      validateBinaryVector(bin);
      return bin;
    }
    static fromPackedBits(array, padding = 0) {
      const buffer2 = ByteUtils.allocate(array.byteLength + 2);
      buffer2[0] = _Binary.VECTOR_TYPE.PackedBit;
      buffer2[1] = padding;
      buffer2.set(array, 2);
      const bin = new this(buffer2, this.SUBTYPE_VECTOR);
      validateBinaryVector(bin);
      return bin;
    }
    static fromBits(bits) {
      const byteLength = bits.length + 7 >>> 3;
      const bytes = new Uint8Array(byteLength + 2);
      bytes[0] = _Binary.VECTOR_TYPE.PackedBit;
      const remainder = bits.length % 8;
      bytes[1] = remainder === 0 ? 0 : 8 - remainder;
      for (let bitOffset = 0; bitOffset < bits.length; bitOffset++) {
        const byteOffset = bitOffset >>> 3;
        const bit = bits[bitOffset];
        if (bit !== 0 && bit !== 1) {
          throw new BSONError(`Invalid bit value at ${bitOffset}: must be 0 or 1, found ${bits[bitOffset]}`);
        }
        if (bit === 0)
          continue;
        const shift = 7 - bitOffset % 8;
        bytes[byteOffset + 2] |= bit << shift;
      }
      return new this(bytes, _Binary.SUBTYPE_VECTOR);
    }
  };
  function validateBinaryVector(vector) {
    if (vector.sub_type !== Binary.SUBTYPE_VECTOR)
      return;
    const size = vector.position;
    const datatype = vector.buffer[0];
    const padding = vector.buffer[1];
    if ((datatype === Binary.VECTOR_TYPE.Float32 || datatype === Binary.VECTOR_TYPE.Int8) && padding !== 0) {
      throw new BSONError("Invalid Vector: padding must be zero for int8 and float32 vectors");
    }
    if (datatype === Binary.VECTOR_TYPE.Float32) {
      if (size !== 0 && size - 2 !== 0 && (size - 2) % 4 !== 0) {
        throw new BSONError("Invalid Vector: Float32 vector must contain a multiple of 4 bytes");
      }
    }
    if (datatype === Binary.VECTOR_TYPE.PackedBit && padding !== 0 && size === 2) {
      throw new BSONError("Invalid Vector: padding must be zero for packed bit vectors that are empty");
    }
    if (datatype === Binary.VECTOR_TYPE.PackedBit && padding > 7) {
      throw new BSONError(`Invalid Vector: padding must be a value between 0 and 7. found: ${padding}`);
    }
  }
  var UUID_BYTE_LENGTH = 16;
  var UUID_WITHOUT_DASHES = /^[0-9A-F]{32}$/i;
  var UUID_WITH_DASHES = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  var UUID = class _UUID extends Binary {
    constructor(input) {
      let bytes;
      if (input == null) {
        bytes = _UUID.generate();
      } else if (input instanceof _UUID) {
        bytes = ByteUtils.toLocalBufferType(new Uint8Array(input.buffer));
      } else if (ArrayBuffer.isView(input) && input.byteLength === UUID_BYTE_LENGTH) {
        bytes = ByteUtils.toLocalBufferType(input);
      } else if (typeof input === "string") {
        bytes = _UUID.bytesFromString(input);
      } else {
        throw new BSONError("Argument passed in UUID constructor must be a UUID, a 16 byte Buffer or a 32/36 character hex string (dashes excluded/included, format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).");
      }
      super(bytes, BSON_BINARY_SUBTYPE_UUID_NEW);
    }
    get id() {
      return this.buffer;
    }
    set id(value) {
      this.buffer = value;
    }
    toHexString(includeDashes = true) {
      if (includeDashes) {
        return [
          ByteUtils.toHex(this.buffer.subarray(0, 4)),
          ByteUtils.toHex(this.buffer.subarray(4, 6)),
          ByteUtils.toHex(this.buffer.subarray(6, 8)),
          ByteUtils.toHex(this.buffer.subarray(8, 10)),
          ByteUtils.toHex(this.buffer.subarray(10, 16))
        ].join("-");
      }
      return ByteUtils.toHex(this.buffer);
    }
    toString(encoding) {
      if (encoding === "hex")
        return ByteUtils.toHex(this.id);
      if (encoding === "base64")
        return ByteUtils.toBase64(this.id);
      return this.toHexString();
    }
    toJSON() {
      return this.toHexString();
    }
    equals(otherId) {
      if (!otherId) {
        return false;
      }
      if (otherId instanceof _UUID) {
        return ByteUtils.equals(otherId.id, this.id);
      }
      try {
        return ByteUtils.equals(new _UUID(otherId).id, this.id);
      } catch {
        return false;
      }
    }
    toBinary() {
      return new Binary(this.id, Binary.SUBTYPE_UUID);
    }
    static generate() {
      const bytes = ByteUtils.randomBytes(UUID_BYTE_LENGTH);
      bytes[6] = bytes[6] & 15 | 64;
      bytes[8] = bytes[8] & 63 | 128;
      return bytes;
    }
    static isValid(input) {
      if (!input) {
        return false;
      }
      if (typeof input === "string") {
        return _UUID.isValidUUIDString(input);
      }
      if (isUint8Array(input)) {
        return input.byteLength === UUID_BYTE_LENGTH;
      }
      return input._bsontype === "Binary" && input.sub_type === this.SUBTYPE_UUID && input.buffer.byteLength === 16;
    }
    static createFromHexString(hexString) {
      const buffer2 = _UUID.bytesFromString(hexString);
      return new _UUID(buffer2);
    }
    static createFromBase64(base64) {
      return new _UUID(ByteUtils.fromBase64(base64));
    }
    static bytesFromString(representation) {
      if (!_UUID.isValidUUIDString(representation)) {
        throw new BSONError("UUID string representation must be 32 hex digits or canonical hyphenated representation");
      }
      return ByteUtils.fromHex(representation.replace(/-/g, ""));
    }
    static isValidUUIDString(representation) {
      return UUID_WITHOUT_DASHES.test(representation) || UUID_WITH_DASHES.test(representation);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      return `new UUID(${inspect3(this.toHexString(), options)})`;
    }
  };
  var Code = class _Code extends BSONValue {
    get _bsontype() {
      return "Code";
    }
    code;
    scope;
    constructor(code, scope) {
      super();
      this.code = code.toString();
      this.scope = scope ?? null;
    }
    toJSON() {
      if (this.scope != null) {
        return { code: this.code, scope: this.scope };
      }
      return { code: this.code };
    }
    toExtendedJSON() {
      if (this.scope) {
        return { $code: this.code, $scope: this.scope };
      }
      return { $code: this.code };
    }
    static fromExtendedJSON(doc3) {
      return new _Code(doc3.$code, doc3.$scope);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      let parametersString = inspect3(this.code, options);
      const multiLineFn = parametersString.includes("\n");
      if (this.scope != null) {
        parametersString += `,${multiLineFn ? "\n" : " "}${inspect3(this.scope, options)}`;
      }
      const endingNewline = multiLineFn && this.scope === null;
      return `new Code(${multiLineFn ? "\n" : ""}${parametersString}${endingNewline ? "\n" : ""})`;
    }
  };
  function isDBRefLike(value) {
    return value != null && typeof value === "object" && "$id" in value && value.$id != null && "$ref" in value && typeof value.$ref === "string" && (!("$db" in value) || "$db" in value && typeof value.$db === "string");
  }
  var DBRef = class _DBRef extends BSONValue {
    get _bsontype() {
      return "DBRef";
    }
    collection;
    oid;
    db;
    fields;
    constructor(collection, oid, db, fields) {
      super();
      const parts = collection.split(".");
      if (parts.length === 2) {
        db = parts.shift();
        collection = parts.shift();
      }
      this.collection = collection;
      this.oid = oid;
      this.db = db;
      this.fields = fields || {};
    }
    get namespace() {
      return this.collection;
    }
    set namespace(value) {
      this.collection = value;
    }
    toJSON() {
      const o = Object.assign({
        $ref: this.collection,
        $id: this.oid
      }, this.fields);
      if (this.db != null)
        o.$db = this.db;
      return o;
    }
    toExtendedJSON(options) {
      options = options || {};
      let o = {
        $ref: this.collection,
        $id: this.oid
      };
      if (options.legacy) {
        return o;
      }
      if (this.db)
        o.$db = this.db;
      o = Object.assign(o, this.fields);
      return o;
    }
    static fromExtendedJSON(doc3) {
      const copy2 = Object.assign({}, doc3);
      delete copy2.$ref;
      delete copy2.$id;
      delete copy2.$db;
      return new _DBRef(doc3.$ref, doc3.$id, doc3.$db, copy2);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      const args = [
        inspect3(this.namespace, options),
        inspect3(this.oid, options),
        ...this.db ? [inspect3(this.db, options)] : [],
        ...Object.keys(this.fields).length > 0 ? [inspect3(this.fields, options)] : []
      ];
      args[1] = inspect3 === defaultInspect ? `new ObjectId(${args[1]})` : args[1];
      return `new DBRef(${args.join(", ")})`;
    }
  };
  function removeLeadingZerosAndExplicitPlus(str) {
    if (str === "") {
      return str;
    }
    let startIndex = 0;
    const isNegative = str[startIndex] === "-";
    const isExplicitlyPositive = str[startIndex] === "+";
    if (isExplicitlyPositive || isNegative) {
      startIndex += 1;
    }
    let foundInsignificantZero = false;
    for (; startIndex < str.length && str[startIndex] === "0"; ++startIndex) {
      foundInsignificantZero = true;
    }
    if (!foundInsignificantZero) {
      return isExplicitlyPositive ? str.slice(1) : str;
    }
    return `${isNegative ? "-" : ""}${str.length === startIndex ? "0" : str.slice(startIndex)}`;
  }
  function validateStringCharacters(str, radix) {
    radix = radix ?? 10;
    const validCharacters = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, radix);
    const regex = new RegExp(`[^-+${validCharacters}]`, "i");
    return regex.test(str) ? false : str;
  }
  var wasm = void 0;
  try {
    wasm = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 13, 2, 96, 0, 1, 127, 96, 4, 127, 127, 127, 127, 1, 127, 3, 7, 6, 0, 1, 1, 1, 1, 1, 6, 6, 1, 127, 1, 65, 0, 11, 7, 50, 6, 3, 109, 117, 108, 0, 1, 5, 100, 105, 118, 95, 115, 0, 2, 5, 100, 105, 118, 95, 117, 0, 3, 5, 114, 101, 109, 95, 115, 0, 4, 5, 114, 101, 109, 95, 117, 0, 5, 8, 103, 101, 116, 95, 104, 105, 103, 104, 0, 0, 10, 191, 1, 6, 4, 0, 35, 0, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 126, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 127, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 128, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 129, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11, 36, 1, 1, 126, 32, 0, 173, 32, 1, 173, 66, 32, 134, 132, 32, 2, 173, 32, 3, 173, 66, 32, 134, 132, 130, 34, 4, 66, 32, 135, 167, 36, 0, 32, 4, 167, 11])), {}).exports;
  } catch {
  }
  var TWO_PWR_16_DBL = 1 << 16;
  var TWO_PWR_24_DBL = 1 << 24;
  var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
  var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
  var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
  var INT_CACHE = {};
  var UINT_CACHE = {};
  var MAX_INT64_STRING_LENGTH = 20;
  var DECIMAL_REG_EX = /^(\+?0|(\+|-)?[1-9][0-9]*)$/;
  var Long = class _Long extends BSONValue {
    get _bsontype() {
      return "Long";
    }
    get __isLong__() {
      return true;
    }
    high;
    low;
    unsigned;
    constructor(lowOrValue = 0, highOrUnsigned, unsigned) {
      super();
      const unsignedBool = typeof highOrUnsigned === "boolean" ? highOrUnsigned : Boolean(unsigned);
      const high = typeof highOrUnsigned === "number" ? highOrUnsigned : 0;
      const res = typeof lowOrValue === "string" ? _Long.fromString(lowOrValue, unsignedBool) : typeof lowOrValue === "bigint" ? _Long.fromBigInt(lowOrValue, unsignedBool) : { low: lowOrValue | 0, high: high | 0, unsigned: unsignedBool };
      this.low = res.low;
      this.high = res.high;
      this.unsigned = res.unsigned;
    }
    static TWO_PWR_24 = _Long.fromInt(TWO_PWR_24_DBL);
    static MAX_UNSIGNED_VALUE = _Long.fromBits(4294967295 | 0, 4294967295 | 0, true);
    static ZERO = _Long.fromInt(0);
    static UZERO = _Long.fromInt(0, true);
    static ONE = _Long.fromInt(1);
    static UONE = _Long.fromInt(1, true);
    static NEG_ONE = _Long.fromInt(-1);
    static MAX_VALUE = _Long.fromBits(4294967295 | 0, 2147483647 | 0, false);
    static MIN_VALUE = _Long.fromBits(0, 2147483648 | 0, false);
    static fromBits(lowBits, highBits, unsigned) {
      return new _Long(lowBits, highBits, unsigned);
    }
    static fromInt(value, unsigned) {
      let obj, cachedObj, cache;
      if (unsigned) {
        value >>>= 0;
        if (cache = 0 <= value && value < 256) {
          cachedObj = UINT_CACHE[value];
          if (cachedObj)
            return cachedObj;
        }
        obj = _Long.fromBits(value, (value | 0) < 0 ? -1 : 0, true);
        if (cache)
          UINT_CACHE[value] = obj;
        return obj;
      } else {
        value |= 0;
        if (cache = -128 <= value && value < 128) {
          cachedObj = INT_CACHE[value];
          if (cachedObj)
            return cachedObj;
        }
        obj = _Long.fromBits(value, value < 0 ? -1 : 0, false);
        if (cache)
          INT_CACHE[value] = obj;
        return obj;
      }
    }
    static fromNumber(value, unsigned) {
      if (isNaN(value))
        return unsigned ? _Long.UZERO : _Long.ZERO;
      if (unsigned) {
        if (value < 0)
          return _Long.UZERO;
        if (value >= TWO_PWR_64_DBL)
          return _Long.MAX_UNSIGNED_VALUE;
      } else {
        if (value <= -TWO_PWR_63_DBL)
          return _Long.MIN_VALUE;
        if (value + 1 >= TWO_PWR_63_DBL)
          return _Long.MAX_VALUE;
      }
      if (value < 0)
        return _Long.fromNumber(-value, unsigned).neg();
      return _Long.fromBits(value % TWO_PWR_32_DBL | 0, value / TWO_PWR_32_DBL | 0, unsigned);
    }
    static fromBigInt(value, unsigned) {
      const FROM_BIGINT_BIT_MASK = 0xffffffffn;
      const FROM_BIGINT_BIT_SHIFT = 32n;
      return new _Long(Number(value & FROM_BIGINT_BIT_MASK), Number(value >> FROM_BIGINT_BIT_SHIFT & FROM_BIGINT_BIT_MASK), unsigned);
    }
    static _fromString(str, unsigned, radix) {
      if (str.length === 0)
        throw new BSONError("empty string");
      if (radix < 2 || 36 < radix)
        throw new BSONError("radix");
      let p;
      if ((p = str.indexOf("-")) > 0)
        throw new BSONError("interior hyphen");
      else if (p === 0) {
        return _Long._fromString(str.substring(1), unsigned, radix).neg();
      }
      const radixToPower = _Long.fromNumber(Math.pow(radix, 8));
      let result = _Long.ZERO;
      for (let i = 0; i < str.length; i += 8) {
        const size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
        if (size < 8) {
          const power = _Long.fromNumber(Math.pow(radix, size));
          result = result.mul(power).add(_Long.fromNumber(value));
        } else {
          result = result.mul(radixToPower);
          result = result.add(_Long.fromNumber(value));
        }
      }
      result.unsigned = unsigned;
      return result;
    }
    static fromStringStrict(str, unsignedOrRadix, radix) {
      let unsigned = false;
      if (typeof unsignedOrRadix === "number") {
        radix = unsignedOrRadix, unsignedOrRadix = false;
      } else {
        unsigned = !!unsignedOrRadix;
      }
      radix ??= 10;
      if (str.trim() !== str) {
        throw new BSONError(`Input: '${str}' contains leading and/or trailing whitespace`);
      }
      if (!validateStringCharacters(str, radix)) {
        throw new BSONError(`Input: '${str}' contains invalid characters for radix: ${radix}`);
      }
      const cleanedStr = removeLeadingZerosAndExplicitPlus(str);
      const result = _Long._fromString(cleanedStr, unsigned, radix);
      if (result.toString(radix).toLowerCase() !== cleanedStr.toLowerCase()) {
        throw new BSONError(`Input: ${str} is not representable as ${result.unsigned ? "an unsigned" : "a signed"} 64-bit Long ${radix != null ? `with radix: ${radix}` : ""}`);
      }
      return result;
    }
    static fromString(str, unsignedOrRadix, radix) {
      let unsigned = false;
      if (typeof unsignedOrRadix === "number") {
        radix = unsignedOrRadix, unsignedOrRadix = false;
      } else {
        unsigned = !!unsignedOrRadix;
      }
      radix ??= 10;
      if (str === "NaN" && radix < 24) {
        return _Long.ZERO;
      } else if ((str === "Infinity" || str === "+Infinity" || str === "-Infinity") && radix < 35) {
        return _Long.ZERO;
      }
      return _Long._fromString(str, unsigned, radix);
    }
    static fromBytes(bytes, unsigned, le) {
      return le ? _Long.fromBytesLE(bytes, unsigned) : _Long.fromBytesBE(bytes, unsigned);
    }
    static fromBytesLE(bytes, unsigned) {
      return new _Long(bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24, bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24, unsigned);
    }
    static fromBytesBE(bytes, unsigned) {
      return new _Long(bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7], bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3], unsigned);
    }
    static isLong(value) {
      return value != null && typeof value === "object" && "__isLong__" in value && value.__isLong__ === true;
    }
    static fromValue(val, unsigned) {
      if (typeof val === "number")
        return _Long.fromNumber(val, unsigned);
      if (typeof val === "string")
        return _Long.fromString(val, unsigned);
      return _Long.fromBits(val.low, val.high, typeof unsigned === "boolean" ? unsigned : val.unsigned);
    }
    add(addend) {
      if (!_Long.isLong(addend))
        addend = _Long.fromValue(addend);
      const a48 = this.high >>> 16;
      const a32 = this.high & 65535;
      const a16 = this.low >>> 16;
      const a00 = this.low & 65535;
      const b48 = addend.high >>> 16;
      const b32 = addend.high & 65535;
      const b16 = addend.low >>> 16;
      const b00 = addend.low & 65535;
      let c48 = 0, c32 = 0, c16 = 0, c00 = 0;
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
      return _Long.fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    }
    and(other) {
      if (!_Long.isLong(other))
        other = _Long.fromValue(other);
      return _Long.fromBits(this.low & other.low, this.high & other.high, this.unsigned);
    }
    compare(other) {
      if (!_Long.isLong(other))
        other = _Long.fromValue(other);
      if (this.eq(other))
        return 0;
      const thisNeg = this.isNegative(), otherNeg = other.isNegative();
      if (thisNeg && !otherNeg)
        return -1;
      if (!thisNeg && otherNeg)
        return 1;
      if (!this.unsigned)
        return this.sub(other).isNegative() ? -1 : 1;
      return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
    }
    comp(other) {
      return this.compare(other);
    }
    divide(divisor) {
      if (!_Long.isLong(divisor))
        divisor = _Long.fromValue(divisor);
      if (divisor.isZero())
        throw new BSONError("division by zero");
      if (wasm) {
        if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
          return this;
        }
        const low = (this.unsigned ? wasm.div_u : wasm.div_s)(this.low, this.high, divisor.low, divisor.high);
        return _Long.fromBits(low, wasm.get_high(), this.unsigned);
      }
      if (this.isZero())
        return this.unsigned ? _Long.UZERO : _Long.ZERO;
      let approx, rem, res;
      if (!this.unsigned) {
        if (this.eq(_Long.MIN_VALUE)) {
          if (divisor.eq(_Long.ONE) || divisor.eq(_Long.NEG_ONE))
            return _Long.MIN_VALUE;
          else if (divisor.eq(_Long.MIN_VALUE))
            return _Long.ONE;
          else {
            const halfThis = this.shr(1);
            approx = halfThis.div(divisor).shl(1);
            if (approx.eq(_Long.ZERO)) {
              return divisor.isNegative() ? _Long.ONE : _Long.NEG_ONE;
            } else {
              rem = this.sub(divisor.mul(approx));
              res = approx.add(rem.div(divisor));
              return res;
            }
          }
        } else if (divisor.eq(_Long.MIN_VALUE))
          return this.unsigned ? _Long.UZERO : _Long.ZERO;
        if (this.isNegative()) {
          if (divisor.isNegative())
            return this.neg().div(divisor.neg());
          return this.neg().div(divisor).neg();
        } else if (divisor.isNegative())
          return this.div(divisor.neg()).neg();
        res = _Long.ZERO;
      } else {
        if (!divisor.unsigned)
          divisor = divisor.toUnsigned();
        if (divisor.gt(this))
          return _Long.UZERO;
        if (divisor.gt(this.shru(1)))
          return _Long.UONE;
        res = _Long.UZERO;
      }
      rem = this;
      while (rem.gte(divisor)) {
        approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
        const log2 = Math.ceil(Math.log(approx) / Math.LN2);
        const delta = log2 <= 48 ? 1 : Math.pow(2, log2 - 48);
        let approxRes = _Long.fromNumber(approx);
        let approxRem = approxRes.mul(divisor);
        while (approxRem.isNegative() || approxRem.gt(rem)) {
          approx -= delta;
          approxRes = _Long.fromNumber(approx, this.unsigned);
          approxRem = approxRes.mul(divisor);
        }
        if (approxRes.isZero())
          approxRes = _Long.ONE;
        res = res.add(approxRes);
        rem = rem.sub(approxRem);
      }
      return res;
    }
    div(divisor) {
      return this.divide(divisor);
    }
    equals(other) {
      if (!_Long.isLong(other))
        other = _Long.fromValue(other);
      if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
        return false;
      return this.high === other.high && this.low === other.low;
    }
    eq(other) {
      return this.equals(other);
    }
    getHighBits() {
      return this.high;
    }
    getHighBitsUnsigned() {
      return this.high >>> 0;
    }
    getLowBits() {
      return this.low;
    }
    getLowBitsUnsigned() {
      return this.low >>> 0;
    }
    getNumBitsAbs() {
      if (this.isNegative()) {
        return this.eq(_Long.MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
      }
      const val = this.high !== 0 ? this.high : this.low;
      let bit;
      for (bit = 31; bit > 0; bit--)
        if ((val & 1 << bit) !== 0)
          break;
      return this.high !== 0 ? bit + 33 : bit + 1;
    }
    greaterThan(other) {
      return this.comp(other) > 0;
    }
    gt(other) {
      return this.greaterThan(other);
    }
    greaterThanOrEqual(other) {
      return this.comp(other) >= 0;
    }
    gte(other) {
      return this.greaterThanOrEqual(other);
    }
    ge(other) {
      return this.greaterThanOrEqual(other);
    }
    isEven() {
      return (this.low & 1) === 0;
    }
    isNegative() {
      return !this.unsigned && this.high < 0;
    }
    isOdd() {
      return (this.low & 1) === 1;
    }
    isPositive() {
      return this.unsigned || this.high >= 0;
    }
    isZero() {
      return this.high === 0 && this.low === 0;
    }
    lessThan(other) {
      return this.comp(other) < 0;
    }
    lt(other) {
      return this.lessThan(other);
    }
    lessThanOrEqual(other) {
      return this.comp(other) <= 0;
    }
    lte(other) {
      return this.lessThanOrEqual(other);
    }
    modulo(divisor) {
      if (!_Long.isLong(divisor))
        divisor = _Long.fromValue(divisor);
      if (wasm) {
        const low = (this.unsigned ? wasm.rem_u : wasm.rem_s)(this.low, this.high, divisor.low, divisor.high);
        return _Long.fromBits(low, wasm.get_high(), this.unsigned);
      }
      return this.sub(this.div(divisor).mul(divisor));
    }
    mod(divisor) {
      return this.modulo(divisor);
    }
    rem(divisor) {
      return this.modulo(divisor);
    }
    multiply(multiplier) {
      if (this.isZero())
        return _Long.ZERO;
      if (!_Long.isLong(multiplier))
        multiplier = _Long.fromValue(multiplier);
      if (wasm) {
        const low = wasm.mul(this.low, this.high, multiplier.low, multiplier.high);
        return _Long.fromBits(low, wasm.get_high(), this.unsigned);
      }
      if (multiplier.isZero())
        return _Long.ZERO;
      if (this.eq(_Long.MIN_VALUE))
        return multiplier.isOdd() ? _Long.MIN_VALUE : _Long.ZERO;
      if (multiplier.eq(_Long.MIN_VALUE))
        return this.isOdd() ? _Long.MIN_VALUE : _Long.ZERO;
      if (this.isNegative()) {
        if (multiplier.isNegative())
          return this.neg().mul(multiplier.neg());
        else
          return this.neg().mul(multiplier).neg();
      } else if (multiplier.isNegative())
        return this.mul(multiplier.neg()).neg();
      if (this.lt(_Long.TWO_PWR_24) && multiplier.lt(_Long.TWO_PWR_24))
        return _Long.fromNumber(this.toNumber() * multiplier.toNumber(), this.unsigned);
      const a48 = this.high >>> 16;
      const a32 = this.high & 65535;
      const a16 = this.low >>> 16;
      const a00 = this.low & 65535;
      const b48 = multiplier.high >>> 16;
      const b32 = multiplier.high & 65535;
      const b16 = multiplier.low >>> 16;
      const b00 = multiplier.low & 65535;
      let c48 = 0, c32 = 0, c16 = 0, c00 = 0;
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
      return _Long.fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
    }
    mul(multiplier) {
      return this.multiply(multiplier);
    }
    negate() {
      if (!this.unsigned && this.eq(_Long.MIN_VALUE))
        return _Long.MIN_VALUE;
      return this.not().add(_Long.ONE);
    }
    neg() {
      return this.negate();
    }
    not() {
      return _Long.fromBits(~this.low, ~this.high, this.unsigned);
    }
    notEquals(other) {
      return !this.equals(other);
    }
    neq(other) {
      return this.notEquals(other);
    }
    ne(other) {
      return this.notEquals(other);
    }
    or(other) {
      if (!_Long.isLong(other))
        other = _Long.fromValue(other);
      return _Long.fromBits(this.low | other.low, this.high | other.high, this.unsigned);
    }
    shiftLeft(numBits) {
      if (_Long.isLong(numBits))
        numBits = numBits.toInt();
      if ((numBits &= 63) === 0)
        return this;
      else if (numBits < 32)
        return _Long.fromBits(this.low << numBits, this.high << numBits | this.low >>> 32 - numBits, this.unsigned);
      else
        return _Long.fromBits(0, this.low << numBits - 32, this.unsigned);
    }
    shl(numBits) {
      return this.shiftLeft(numBits);
    }
    shiftRight(numBits) {
      if (_Long.isLong(numBits))
        numBits = numBits.toInt();
      if ((numBits &= 63) === 0)
        return this;
      else if (numBits < 32)
        return _Long.fromBits(this.low >>> numBits | this.high << 32 - numBits, this.high >> numBits, this.unsigned);
      else
        return _Long.fromBits(this.high >> numBits - 32, this.high >= 0 ? 0 : -1, this.unsigned);
    }
    shr(numBits) {
      return this.shiftRight(numBits);
    }
    shiftRightUnsigned(numBits) {
      if (_Long.isLong(numBits))
        numBits = numBits.toInt();
      numBits &= 63;
      if (numBits === 0)
        return this;
      else {
        const high = this.high;
        if (numBits < 32) {
          const low = this.low;
          return _Long.fromBits(low >>> numBits | high << 32 - numBits, high >>> numBits, this.unsigned);
        } else if (numBits === 32)
          return _Long.fromBits(high, 0, this.unsigned);
        else
          return _Long.fromBits(high >>> numBits - 32, 0, this.unsigned);
      }
    }
    shr_u(numBits) {
      return this.shiftRightUnsigned(numBits);
    }
    shru(numBits) {
      return this.shiftRightUnsigned(numBits);
    }
    subtract(subtrahend) {
      if (!_Long.isLong(subtrahend))
        subtrahend = _Long.fromValue(subtrahend);
      return this.add(subtrahend.neg());
    }
    sub(subtrahend) {
      return this.subtract(subtrahend);
    }
    toInt() {
      return this.unsigned ? this.low >>> 0 : this.low;
    }
    toNumber() {
      if (this.unsigned)
        return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
      return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
    }
    toBigInt() {
      return BigInt(this.toString());
    }
    toBytes(le) {
      return le ? this.toBytesLE() : this.toBytesBE();
    }
    toBytesLE() {
      const hi = this.high, lo = this.low;
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
    }
    toBytesBE() {
      const hi = this.high, lo = this.low;
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
    }
    toSigned() {
      if (!this.unsigned)
        return this;
      return _Long.fromBits(this.low, this.high, false);
    }
    toString(radix) {
      radix = radix || 10;
      if (radix < 2 || 36 < radix)
        throw new BSONError("radix");
      if (this.isZero())
        return "0";
      if (this.isNegative()) {
        if (this.eq(_Long.MIN_VALUE)) {
          const radixLong = _Long.fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
          return div.toString(radix) + rem1.toInt().toString(radix);
        } else
          return "-" + this.neg().toString(radix);
      }
      const radixToPower = _Long.fromNumber(Math.pow(radix, 6), this.unsigned);
      let rem = this;
      let result = "";
      while (true) {
        const remDiv = rem.div(radixToPower);
        const intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0;
        let digits = intval.toString(radix);
        rem = remDiv;
        if (rem.isZero()) {
          return digits + result;
        } else {
          while (digits.length < 6)
            digits = "0" + digits;
          result = "" + digits + result;
        }
      }
    }
    toUnsigned() {
      if (this.unsigned)
        return this;
      return _Long.fromBits(this.low, this.high, true);
    }
    xor(other) {
      if (!_Long.isLong(other))
        other = _Long.fromValue(other);
      return _Long.fromBits(this.low ^ other.low, this.high ^ other.high, this.unsigned);
    }
    eqz() {
      return this.isZero();
    }
    le(other) {
      return this.lessThanOrEqual(other);
    }
    toExtendedJSON(options) {
      if (options && options.relaxed)
        return this.toNumber();
      return { $numberLong: this.toString() };
    }
    static fromExtendedJSON(doc3, options) {
      const { useBigInt64 = false, relaxed = true } = { ...options };
      if (doc3.$numberLong.length > MAX_INT64_STRING_LENGTH) {
        throw new BSONError("$numberLong string is too long");
      }
      if (!DECIMAL_REG_EX.test(doc3.$numberLong)) {
        throw new BSONError(`$numberLong string "${doc3.$numberLong}" is in an invalid format`);
      }
      if (useBigInt64) {
        const bigIntResult = BigInt(doc3.$numberLong);
        return BigInt.asIntN(64, bigIntResult);
      }
      const longResult = _Long.fromString(doc3.$numberLong);
      if (relaxed) {
        return longResult.toNumber();
      }
      return longResult;
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      const longVal = inspect3(this.toString(), options);
      const unsignedVal = this.unsigned ? `, ${inspect3(this.unsigned, options)}` : "";
      return `new Long(${longVal}${unsignedVal})`;
    }
  };
  var PARSE_STRING_REGEXP = /^(\+|-)?(\d+|(\d*\.\d*))?(E|e)?([-+])?(\d+)?$/;
  var PARSE_INF_REGEXP = /^(\+|-)?(Infinity|inf)$/i;
  var PARSE_NAN_REGEXP = /^(\+|-)?NaN$/i;
  var EXPONENT_MAX = 6111;
  var EXPONENT_MIN = -6176;
  var EXPONENT_BIAS = 6176;
  var MAX_DIGITS = 34;
  var NAN_BUFFER = ByteUtils.fromNumberArray([
    124,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ].reverse());
  var INF_NEGATIVE_BUFFER = ByteUtils.fromNumberArray([
    248,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ].reverse());
  var INF_POSITIVE_BUFFER = ByteUtils.fromNumberArray([
    120,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ].reverse());
  var EXPONENT_REGEX = /^([-+])?(\d+)?$/;
  var COMBINATION_MASK = 31;
  var EXPONENT_MASK = 16383;
  var COMBINATION_INFINITY = 30;
  var COMBINATION_NAN = 31;
  function isDigit(value) {
    return !isNaN(parseInt(value, 10));
  }
  function divideu128(value) {
    const DIVISOR = Long.fromNumber(1e3 * 1e3 * 1e3);
    let _rem = Long.fromNumber(0);
    if (!value.parts[0] && !value.parts[1] && !value.parts[2] && !value.parts[3]) {
      return { quotient: value, rem: _rem };
    }
    for (let i = 0; i <= 3; i++) {
      _rem = _rem.shiftLeft(32);
      _rem = _rem.add(new Long(value.parts[i], 0));
      value.parts[i] = _rem.div(DIVISOR).low;
      _rem = _rem.modulo(DIVISOR);
    }
    return { quotient: value, rem: _rem };
  }
  function multiply64x2(left, right) {
    if (!left && !right) {
      return { high: Long.fromNumber(0), low: Long.fromNumber(0) };
    }
    const leftHigh = left.shiftRightUnsigned(32);
    const leftLow = new Long(left.getLowBits(), 0);
    const rightHigh = right.shiftRightUnsigned(32);
    const rightLow = new Long(right.getLowBits(), 0);
    let productHigh = leftHigh.multiply(rightHigh);
    let productMid = leftHigh.multiply(rightLow);
    const productMid2 = leftLow.multiply(rightHigh);
    let productLow = leftLow.multiply(rightLow);
    productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
    productMid = new Long(productMid.getLowBits(), 0).add(productMid2).add(productLow.shiftRightUnsigned(32));
    productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
    productLow = productMid.shiftLeft(32).add(new Long(productLow.getLowBits(), 0));
    return { high: productHigh, low: productLow };
  }
  function lessThan(left, right) {
    const uhleft = left.high >>> 0;
    const uhright = right.high >>> 0;
    if (uhleft < uhright) {
      return true;
    } else if (uhleft === uhright) {
      const ulleft = left.low >>> 0;
      const ulright = right.low >>> 0;
      if (ulleft < ulright)
        return true;
    }
    return false;
  }
  function invalidErr(string, message) {
    throw new BSONError(`"${string}" is not a valid Decimal128 string - ${message}`);
  }
  var Decimal128 = class _Decimal128 extends BSONValue {
    get _bsontype() {
      return "Decimal128";
    }
    bytes;
    constructor(bytes) {
      super();
      if (typeof bytes === "string") {
        this.bytes = _Decimal128.fromString(bytes).bytes;
      } else if (bytes instanceof Uint8Array || isUint8Array(bytes)) {
        if (bytes.byteLength !== 16) {
          throw new BSONError("Decimal128 must take a Buffer of 16 bytes");
        }
        this.bytes = bytes;
      } else {
        throw new BSONError("Decimal128 must take a Buffer or string");
      }
    }
    static fromString(representation) {
      return _Decimal128._fromString(representation, { allowRounding: false });
    }
    static fromStringWithRounding(representation) {
      return _Decimal128._fromString(representation, { allowRounding: true });
    }
    static _fromString(representation, options) {
      let isNegative = false;
      let sawSign = false;
      let sawRadix = false;
      let foundNonZero = false;
      let significantDigits = 0;
      let nDigitsRead = 0;
      let nDigits = 0;
      let radixPosition = 0;
      let firstNonZero = 0;
      const digits = [0];
      let nDigitsStored = 0;
      let digitsInsert = 0;
      let lastDigit = 0;
      let exponent = 0;
      let significandHigh = new Long(0, 0);
      let significandLow = new Long(0, 0);
      let biasedExponent = 0;
      let index = 0;
      if (representation.length >= 7e3) {
        throw new BSONError("" + representation + " not a valid Decimal128 string");
      }
      const stringMatch = representation.match(PARSE_STRING_REGEXP);
      const infMatch = representation.match(PARSE_INF_REGEXP);
      const nanMatch = representation.match(PARSE_NAN_REGEXP);
      if (!stringMatch && !infMatch && !nanMatch || representation.length === 0) {
        throw new BSONError("" + representation + " not a valid Decimal128 string");
      }
      if (stringMatch) {
        const unsignedNumber = stringMatch[2];
        const e = stringMatch[4];
        const expSign = stringMatch[5];
        const expNumber = stringMatch[6];
        if (e && expNumber === void 0)
          invalidErr(representation, "missing exponent power");
        if (e && unsignedNumber === void 0)
          invalidErr(representation, "missing exponent base");
        if (e === void 0 && (expSign || expNumber)) {
          invalidErr(representation, "missing e before exponent");
        }
      }
      if (representation[index] === "+" || representation[index] === "-") {
        sawSign = true;
        isNegative = representation[index++] === "-";
      }
      if (!isDigit(representation[index]) && representation[index] !== ".") {
        if (representation[index] === "i" || representation[index] === "I") {
          return new _Decimal128(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER);
        } else if (representation[index] === "N") {
          return new _Decimal128(NAN_BUFFER);
        }
      }
      while (isDigit(representation[index]) || representation[index] === ".") {
        if (representation[index] === ".") {
          if (sawRadix)
            invalidErr(representation, "contains multiple periods");
          sawRadix = true;
          index = index + 1;
          continue;
        }
        if (nDigitsStored < MAX_DIGITS) {
          if (representation[index] !== "0" || foundNonZero) {
            if (!foundNonZero) {
              firstNonZero = nDigitsRead;
            }
            foundNonZero = true;
            digits[digitsInsert++] = parseInt(representation[index], 10);
            nDigitsStored = nDigitsStored + 1;
          }
        }
        if (foundNonZero)
          nDigits = nDigits + 1;
        if (sawRadix)
          radixPosition = radixPosition + 1;
        nDigitsRead = nDigitsRead + 1;
        index = index + 1;
      }
      if (sawRadix && !nDigitsRead)
        throw new BSONError("" + representation + " not a valid Decimal128 string");
      if (representation[index] === "e" || representation[index] === "E") {
        const match = representation.substr(++index).match(EXPONENT_REGEX);
        if (!match || !match[2])
          return new _Decimal128(NAN_BUFFER);
        exponent = parseInt(match[0], 10);
        index = index + match[0].length;
      }
      if (representation[index])
        return new _Decimal128(NAN_BUFFER);
      if (!nDigitsStored) {
        digits[0] = 0;
        nDigits = 1;
        nDigitsStored = 1;
        significantDigits = 0;
      } else {
        lastDigit = nDigitsStored - 1;
        significantDigits = nDigits;
        if (significantDigits !== 1) {
          while (representation[firstNonZero + significantDigits - 1 + Number(sawSign) + Number(sawRadix)] === "0") {
            significantDigits = significantDigits - 1;
          }
        }
      }
      if (exponent <= radixPosition && radixPosition > exponent + (1 << 14)) {
        exponent = EXPONENT_MIN;
      } else {
        exponent = exponent - radixPosition;
      }
      while (exponent > EXPONENT_MAX) {
        lastDigit = lastDigit + 1;
        if (lastDigit >= MAX_DIGITS) {
          if (significantDigits === 0) {
            exponent = EXPONENT_MAX;
            break;
          }
          invalidErr(representation, "overflow");
        }
        exponent = exponent - 1;
      }
      if (options.allowRounding) {
        while (exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
          if (lastDigit === 0 && significantDigits < nDigitsStored) {
            exponent = EXPONENT_MIN;
            significantDigits = 0;
            break;
          }
          if (nDigitsStored < nDigits) {
            nDigits = nDigits - 1;
          } else {
            lastDigit = lastDigit - 1;
          }
          if (exponent < EXPONENT_MAX) {
            exponent = exponent + 1;
          } else {
            const digitsString = digits.join("");
            if (digitsString.match(/^0+$/)) {
              exponent = EXPONENT_MAX;
              break;
            }
            invalidErr(representation, "overflow");
          }
        }
        if (lastDigit + 1 < significantDigits) {
          let endOfString = nDigitsRead;
          if (sawRadix) {
            firstNonZero = firstNonZero + 1;
            endOfString = endOfString + 1;
          }
          if (sawSign) {
            firstNonZero = firstNonZero + 1;
            endOfString = endOfString + 1;
          }
          const roundDigit = parseInt(representation[firstNonZero + lastDigit + 1], 10);
          let roundBit = 0;
          if (roundDigit >= 5) {
            roundBit = 1;
            if (roundDigit === 5) {
              roundBit = digits[lastDigit] % 2 === 1 ? 1 : 0;
              for (let i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
                if (parseInt(representation[i], 10)) {
                  roundBit = 1;
                  break;
                }
              }
            }
          }
          if (roundBit) {
            let dIdx = lastDigit;
            for (; dIdx >= 0; dIdx--) {
              if (++digits[dIdx] > 9) {
                digits[dIdx] = 0;
                if (dIdx === 0) {
                  if (exponent < EXPONENT_MAX) {
                    exponent = exponent + 1;
                    digits[dIdx] = 1;
                  } else {
                    return new _Decimal128(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER);
                  }
                }
              } else {
                break;
              }
            }
          }
        }
      } else {
        while (exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
          if (lastDigit === 0) {
            if (significantDigits === 0) {
              exponent = EXPONENT_MIN;
              break;
            }
            invalidErr(representation, "exponent underflow");
          }
          if (nDigitsStored < nDigits) {
            if (representation[nDigits - 1 + Number(sawSign) + Number(sawRadix)] !== "0" && significantDigits !== 0) {
              invalidErr(representation, "inexact rounding");
            }
            nDigits = nDigits - 1;
          } else {
            if (digits[lastDigit] !== 0) {
              invalidErr(representation, "inexact rounding");
            }
            lastDigit = lastDigit - 1;
          }
          if (exponent < EXPONENT_MAX) {
            exponent = exponent + 1;
          } else {
            invalidErr(representation, "overflow");
          }
        }
        if (lastDigit + 1 < significantDigits) {
          if (sawRadix) {
            firstNonZero = firstNonZero + 1;
          }
          if (sawSign) {
            firstNonZero = firstNonZero + 1;
          }
          const roundDigit = parseInt(representation[firstNonZero + lastDigit + 1], 10);
          if (roundDigit !== 0) {
            invalidErr(representation, "inexact rounding");
          }
        }
      }
      significandHigh = Long.fromNumber(0);
      significandLow = Long.fromNumber(0);
      if (significantDigits === 0) {
        significandHigh = Long.fromNumber(0);
        significandLow = Long.fromNumber(0);
      } else if (lastDigit < 17) {
        let dIdx = 0;
        significandLow = Long.fromNumber(digits[dIdx++]);
        significandHigh = new Long(0, 0);
        for (; dIdx <= lastDigit; dIdx++) {
          significandLow = significandLow.multiply(Long.fromNumber(10));
          significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
        }
      } else {
        let dIdx = 0;
        significandHigh = Long.fromNumber(digits[dIdx++]);
        for (; dIdx <= lastDigit - 17; dIdx++) {
          significandHigh = significandHigh.multiply(Long.fromNumber(10));
          significandHigh = significandHigh.add(Long.fromNumber(digits[dIdx]));
        }
        significandLow = Long.fromNumber(digits[dIdx++]);
        for (; dIdx <= lastDigit; dIdx++) {
          significandLow = significandLow.multiply(Long.fromNumber(10));
          significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
        }
      }
      const significand = multiply64x2(significandHigh, Long.fromString("100000000000000000"));
      significand.low = significand.low.add(significandLow);
      if (lessThan(significand.low, significandLow)) {
        significand.high = significand.high.add(Long.fromNumber(1));
      }
      biasedExponent = exponent + EXPONENT_BIAS;
      const dec = { low: Long.fromNumber(0), high: Long.fromNumber(0) };
      if (significand.high.shiftRightUnsigned(49).and(Long.fromNumber(1)).equals(Long.fromNumber(1))) {
        dec.high = dec.high.or(Long.fromNumber(3).shiftLeft(61));
        dec.high = dec.high.or(Long.fromNumber(biasedExponent).and(Long.fromNumber(16383).shiftLeft(47)));
        dec.high = dec.high.or(significand.high.and(Long.fromNumber(140737488355327)));
      } else {
        dec.high = dec.high.or(Long.fromNumber(biasedExponent & 16383).shiftLeft(49));
        dec.high = dec.high.or(significand.high.and(Long.fromNumber(562949953421311)));
      }
      dec.low = significand.low;
      if (isNegative) {
        dec.high = dec.high.or(Long.fromString("9223372036854775808"));
      }
      const buffer2 = ByteUtils.allocateUnsafe(16);
      index = 0;
      buffer2[index++] = dec.low.low & 255;
      buffer2[index++] = dec.low.low >> 8 & 255;
      buffer2[index++] = dec.low.low >> 16 & 255;
      buffer2[index++] = dec.low.low >> 24 & 255;
      buffer2[index++] = dec.low.high & 255;
      buffer2[index++] = dec.low.high >> 8 & 255;
      buffer2[index++] = dec.low.high >> 16 & 255;
      buffer2[index++] = dec.low.high >> 24 & 255;
      buffer2[index++] = dec.high.low & 255;
      buffer2[index++] = dec.high.low >> 8 & 255;
      buffer2[index++] = dec.high.low >> 16 & 255;
      buffer2[index++] = dec.high.low >> 24 & 255;
      buffer2[index++] = dec.high.high & 255;
      buffer2[index++] = dec.high.high >> 8 & 255;
      buffer2[index++] = dec.high.high >> 16 & 255;
      buffer2[index++] = dec.high.high >> 24 & 255;
      return new _Decimal128(buffer2);
    }
    toString() {
      let biased_exponent;
      let significand_digits = 0;
      const significand = new Array(36);
      for (let i = 0; i < significand.length; i++)
        significand[i] = 0;
      let index = 0;
      let is_zero = false;
      let significand_msb;
      let significand128 = { parts: [0, 0, 0, 0] };
      let j, k;
      const string = [];
      index = 0;
      const buffer2 = this.bytes;
      const low = buffer2[index++] | buffer2[index++] << 8 | buffer2[index++] << 16 | buffer2[index++] << 24;
      const midl = buffer2[index++] | buffer2[index++] << 8 | buffer2[index++] << 16 | buffer2[index++] << 24;
      const midh = buffer2[index++] | buffer2[index++] << 8 | buffer2[index++] << 16 | buffer2[index++] << 24;
      const high = buffer2[index++] | buffer2[index++] << 8 | buffer2[index++] << 16 | buffer2[index++] << 24;
      index = 0;
      const dec = {
        low: new Long(low, midl),
        high: new Long(midh, high)
      };
      if (dec.high.lessThan(Long.ZERO)) {
        string.push("-");
      }
      const combination = high >> 26 & COMBINATION_MASK;
      if (combination >> 3 === 3) {
        if (combination === COMBINATION_INFINITY) {
          return string.join("") + "Infinity";
        } else if (combination === COMBINATION_NAN) {
          return "NaN";
        } else {
          biased_exponent = high >> 15 & EXPONENT_MASK;
          significand_msb = 8 + (high >> 14 & 1);
        }
      } else {
        significand_msb = high >> 14 & 7;
        biased_exponent = high >> 17 & EXPONENT_MASK;
      }
      const exponent = biased_exponent - EXPONENT_BIAS;
      significand128.parts[0] = (high & 16383) + ((significand_msb & 15) << 14);
      significand128.parts[1] = midh;
      significand128.parts[2] = midl;
      significand128.parts[3] = low;
      if (significand128.parts[0] === 0 && significand128.parts[1] === 0 && significand128.parts[2] === 0 && significand128.parts[3] === 0) {
        is_zero = true;
      } else {
        for (k = 3; k >= 0; k--) {
          let least_digits = 0;
          const result = divideu128(significand128);
          significand128 = result.quotient;
          least_digits = result.rem.low;
          if (!least_digits)
            continue;
          for (j = 8; j >= 0; j--) {
            significand[k * 9 + j] = least_digits % 10;
            least_digits = Math.floor(least_digits / 10);
          }
        }
      }
      if (is_zero) {
        significand_digits = 1;
        significand[index] = 0;
      } else {
        significand_digits = 36;
        while (!significand[index]) {
          significand_digits = significand_digits - 1;
          index = index + 1;
        }
      }
      const scientific_exponent = significand_digits - 1 + exponent;
      if (scientific_exponent >= 34 || scientific_exponent <= -7 || exponent > 0) {
        if (significand_digits > 34) {
          string.push(`${0}`);
          if (exponent > 0)
            string.push(`E+${exponent}`);
          else if (exponent < 0)
            string.push(`E${exponent}`);
          return string.join("");
        }
        string.push(`${significand[index++]}`);
        significand_digits = significand_digits - 1;
        if (significand_digits) {
          string.push(".");
        }
        for (let i = 0; i < significand_digits; i++) {
          string.push(`${significand[index++]}`);
        }
        string.push("E");
        if (scientific_exponent > 0) {
          string.push(`+${scientific_exponent}`);
        } else {
          string.push(`${scientific_exponent}`);
        }
      } else {
        if (exponent >= 0) {
          for (let i = 0; i < significand_digits; i++) {
            string.push(`${significand[index++]}`);
          }
        } else {
          let radix_position = significand_digits + exponent;
          if (radix_position > 0) {
            for (let i = 0; i < radix_position; i++) {
              string.push(`${significand[index++]}`);
            }
          } else {
            string.push("0");
          }
          string.push(".");
          while (radix_position++ < 0) {
            string.push("0");
          }
          for (let i = 0; i < significand_digits - Math.max(radix_position - 1, 0); i++) {
            string.push(`${significand[index++]}`);
          }
        }
      }
      return string.join("");
    }
    toJSON() {
      return { $numberDecimal: this.toString() };
    }
    toExtendedJSON() {
      return { $numberDecimal: this.toString() };
    }
    static fromExtendedJSON(doc3) {
      return _Decimal128.fromString(doc3.$numberDecimal);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      const d128string = inspect3(this.toString(), options);
      return `new Decimal128(${d128string})`;
    }
  };
  var Double = class _Double extends BSONValue {
    get _bsontype() {
      return "Double";
    }
    value;
    constructor(value) {
      super();
      if (value instanceof Number) {
        value = value.valueOf();
      }
      this.value = +value;
    }
    static fromString(value) {
      const coercedValue = Number(value);
      if (value === "NaN")
        return new _Double(NaN);
      if (value === "Infinity")
        return new _Double(Infinity);
      if (value === "-Infinity")
        return new _Double(-Infinity);
      if (!Number.isFinite(coercedValue)) {
        throw new BSONError(`Input: ${value} is not representable as a Double`);
      }
      if (value.trim() !== value) {
        throw new BSONError(`Input: '${value}' contains whitespace`);
      }
      if (value === "") {
        throw new BSONError(`Input is an empty string`);
      }
      if (/[^-0-9.+eE]/.test(value)) {
        throw new BSONError(`Input: '${value}' is not in decimal or exponential notation`);
      }
      return new _Double(coercedValue);
    }
    valueOf() {
      return this.value;
    }
    toJSON() {
      return this.value;
    }
    toString(radix) {
      return this.value.toString(radix);
    }
    toExtendedJSON(options) {
      if (options && (options.legacy || options.relaxed && isFinite(this.value))) {
        return this.value;
      }
      if (Object.is(Math.sign(this.value), -0)) {
        return { $numberDouble: "-0.0" };
      }
      return {
        $numberDouble: Number.isInteger(this.value) ? this.value.toFixed(1) : this.value.toString()
      };
    }
    static fromExtendedJSON(doc3, options) {
      const doubleValue = parseFloat(doc3.$numberDouble);
      return options && options.relaxed ? doubleValue : new _Double(doubleValue);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      return `new Double(${inspect3(this.value, options)})`;
    }
  };
  var Int32 = class _Int32 extends BSONValue {
    get _bsontype() {
      return "Int32";
    }
    value;
    constructor(value) {
      super();
      if (value instanceof Number) {
        value = value.valueOf();
      }
      this.value = +value | 0;
    }
    static fromString(value) {
      const cleanedValue = removeLeadingZerosAndExplicitPlus(value);
      const coercedValue = Number(value);
      if (BSON_INT32_MAX < coercedValue) {
        throw new BSONError(`Input: '${value}' is larger than the maximum value for Int32`);
      } else if (BSON_INT32_MIN > coercedValue) {
        throw new BSONError(`Input: '${value}' is smaller than the minimum value for Int32`);
      } else if (!Number.isSafeInteger(coercedValue)) {
        throw new BSONError(`Input: '${value}' is not a safe integer`);
      } else if (coercedValue.toString() !== cleanedValue) {
        throw new BSONError(`Input: '${value}' is not a valid Int32 string`);
      }
      return new _Int32(coercedValue);
    }
    valueOf() {
      return this.value;
    }
    toString(radix) {
      return this.value.toString(radix);
    }
    toJSON() {
      return this.value;
    }
    toExtendedJSON(options) {
      if (options && (options.relaxed || options.legacy))
        return this.value;
      return { $numberInt: this.value.toString() };
    }
    static fromExtendedJSON(doc3, options) {
      return options && options.relaxed ? parseInt(doc3.$numberInt, 10) : new _Int32(doc3.$numberInt);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      return `new Int32(${inspect3(this.value, options)})`;
    }
  };
  var MaxKey = class _MaxKey extends BSONValue {
    get _bsontype() {
      return "MaxKey";
    }
    toExtendedJSON() {
      return { $maxKey: 1 };
    }
    static fromExtendedJSON() {
      return new _MaxKey();
    }
    inspect() {
      return "new MaxKey()";
    }
  };
  var MinKey = class _MinKey extends BSONValue {
    get _bsontype() {
      return "MinKey";
    }
    toExtendedJSON() {
      return { $minKey: 1 };
    }
    static fromExtendedJSON() {
      return new _MinKey();
    }
    inspect() {
      return "new MinKey()";
    }
  };
  var __idCache = /* @__PURE__ */ new WeakMap();
  var byteToHex = [];
  for (let n = 0; n < 256; n++)
    byteToHex.push(n.toString(16).padStart(2, "0"));
  var hexCharCodeToNibble = new Int8Array(103);
  for (let c = 48; c <= 57; c++)
    hexCharCodeToNibble[c] = c - 48;
  for (let c = 65; c <= 70; c++)
    hexCharCodeToNibble[c] = c - 55;
  for (let c = 97; c <= 102; c++)
    hexCharCodeToNibble[c] = c - 87;
  var ObjectId = class _ObjectId extends BSONValue {
    get _bsontype() {
      return "ObjectId";
    }
    static index = 0;
    static PROCESS_UNIQUE = null;
    static resetState = () => {
      this.index = Math.floor(Math.random() * 16777216);
      this.PROCESS_UNIQUE = null;
    };
    static {
      this.resetState();
      const { startupSnapshot } = globalThis?.process?.getBuiltinModule?.("v8") ?? {};
      if (startupSnapshot?.isBuildingSnapshot?.()) {
        startupSnapshot?.addDeserializeCallback?.(this.resetState);
      }
    }
    static cacheHexString;
    i0;
    i1;
    i2;
    i3;
    setFromBytes(b, offset = 0) {
      this.i0 = b[offset] << 16 | b[offset + 1] << 8 | b[offset + 2];
      this.i1 = b[offset + 3] << 16 | b[offset + 4] << 8 | b[offset + 5];
      this.i2 = b[offset + 6] << 16 | b[offset + 7] << 8 | b[offset + 8];
      this.i3 = b[offset + 9] << 16 | b[offset + 10] << 8 | b[offset + 11];
    }
    setFromHex(s) {
      const t = hexCharCodeToNibble;
      this.i0 = t[s.charCodeAt(0)] << 20 | t[s.charCodeAt(1)] << 16 | t[s.charCodeAt(2)] << 12 | t[s.charCodeAt(3)] << 8 | t[s.charCodeAt(4)] << 4 | t[s.charCodeAt(5)];
      this.i1 = t[s.charCodeAt(6)] << 20 | t[s.charCodeAt(7)] << 16 | t[s.charCodeAt(8)] << 12 | t[s.charCodeAt(9)] << 8 | t[s.charCodeAt(10)] << 4 | t[s.charCodeAt(11)];
      this.i2 = t[s.charCodeAt(12)] << 20 | t[s.charCodeAt(13)] << 16 | t[s.charCodeAt(14)] << 12 | t[s.charCodeAt(15)] << 8 | t[s.charCodeAt(16)] << 4 | t[s.charCodeAt(17)];
      this.i3 = t[s.charCodeAt(18)] << 20 | t[s.charCodeAt(19)] << 16 | t[s.charCodeAt(20)] << 12 | t[s.charCodeAt(21)] << 8 | t[s.charCodeAt(22)] << 4 | t[s.charCodeAt(23)];
    }
    constructor(inputId, offset) {
      super();
      if (typeof offset === "number") {
        this.setFromBytes(inputId, offset);
        return;
      }
      let workingId;
      if (typeof inputId === "object" && inputId && "id" in inputId) {
        if (_ObjectId.is(inputId) && typeof inputId.i0 === "number" && typeof inputId.i1 === "number" && typeof inputId.i2 === "number" && typeof inputId.i3 === "number") {
          this.i0 = inputId.i0;
          this.i1 = inputId.i1;
          this.i2 = inputId.i2;
          this.i3 = inputId.i3;
          return;
        }
        if (typeof inputId.id !== "string" && !ArrayBuffer.isView(inputId.id)) {
          throw new BSONError("Argument passed in must have an id that is of type string or Buffer");
        }
        if ("toHexString" in inputId && typeof inputId.toHexString === "function") {
          workingId = ByteUtils.fromHex(inputId.toHexString());
        } else {
          workingId = inputId.id;
        }
      } else {
        workingId = inputId;
      }
      if (workingId == null) {
        const time = Math.floor(Date.now() / 1e3);
        const inc = _ObjectId.getInc();
        const pu = _ObjectId.PROCESS_UNIQUE ??= ByteUtils.randomBytes(5);
        this.i0 = time >>> 8 & 16777215;
        this.i1 = (time & 255) << 16 | pu[0] << 8 | pu[1];
        this.i2 = pu[2] << 16 | pu[3] << 8 | pu[4];
        this.i3 = inc & 16777215;
      } else if (ArrayBuffer.isView(workingId) && workingId.byteLength === 12) {
        this.setFromBytes(workingId instanceof Uint8Array ? workingId : ByteUtils.toLocalBufferType(workingId));
      } else if (typeof workingId === "string") {
        if (_ObjectId.validateHexString(workingId)) {
          this.setFromHex(workingId);
          if (_ObjectId.cacheHexString) {
            __idCache.set(this, workingId);
          }
        } else {
          throw new BSONError("input must be a 24 character hex string, 12 byte Uint8Array, or an integer");
        }
      } else {
        throw new BSONError("Argument passed in does not match the accepted types");
      }
    }
    get id() {
      const b = ByteUtils.allocateUnsafe(12);
      b[0] = this.i0 >>> 16 & 255;
      b[1] = this.i0 >>> 8 & 255;
      b[2] = this.i0 & 255;
      b[3] = this.i1 >>> 16 & 255;
      b[4] = this.i1 >>> 8 & 255;
      b[5] = this.i1 & 255;
      b[6] = this.i2 >>> 16 & 255;
      b[7] = this.i2 >>> 8 & 255;
      b[8] = this.i2 & 255;
      b[9] = this.i3 >>> 16 & 255;
      b[10] = this.i3 >>> 8 & 255;
      b[11] = this.i3 & 255;
      return b;
    }
    set id(value) {
      const bytes = value instanceof Uint8Array ? value : ByteUtils.toLocalBufferType(value);
      this.setFromBytes(bytes);
      if (_ObjectId.cacheHexString) {
        __idCache.set(this, ByteUtils.toHex(bytes));
      }
    }
    static validateHexString(string) {
      if (string?.length !== 24)
        return false;
      for (let i = 0; i < 24; i++) {
        const char = string.charCodeAt(i);
        if (char >= 48 && char <= 57 || char >= 97 && char <= 102 || char >= 65 && char <= 70) {
          continue;
        }
        return false;
      }
      return true;
    }
    toHexString() {
      if (_ObjectId.cacheHexString) {
        const __id = __idCache.get(this);
        if (__id)
          return __id;
      }
      const i0 = this.i0;
      const i1 = this.i1;
      const i2 = this.i2;
      const i3 = this.i3;
      const hexString = byteToHex[i0 >>> 16 & 255] + byteToHex[i0 >>> 8 & 255] + byteToHex[i0 & 255] + byteToHex[i1 >>> 16 & 255] + byteToHex[i1 >>> 8 & 255] + byteToHex[i1 & 255] + byteToHex[i2 >>> 16 & 255] + byteToHex[i2 >>> 8 & 255] + byteToHex[i2 & 255] + byteToHex[i3 >>> 16 & 255] + byteToHex[i3 >>> 8 & 255] + byteToHex[i3 & 255];
      if (_ObjectId.cacheHexString) {
        __idCache.set(this, hexString);
      }
      return hexString;
    }
    static getInc() {
      return _ObjectId.index = (_ObjectId.index + 1) % 16777216;
    }
    static generate(time) {
      if ("number" !== typeof time) {
        time = Math.floor(Date.now() / 1e3);
      }
      const inc = _ObjectId.getInc();
      const buffer2 = ByteUtils.allocateUnsafe(12);
      NumberUtils.setInt32BE(buffer2, 0, time);
      const PROCESS_UNIQUE = this.PROCESS_UNIQUE ??= ByteUtils.randomBytes(5);
      buffer2[4] = PROCESS_UNIQUE[0];
      buffer2[5] = PROCESS_UNIQUE[1];
      buffer2[6] = PROCESS_UNIQUE[2];
      buffer2[7] = PROCESS_UNIQUE[3];
      buffer2[8] = PROCESS_UNIQUE[4];
      buffer2[11] = inc & 255;
      buffer2[10] = inc >>> 8 & 255;
      buffer2[9] = inc >>> 16 & 255;
      return buffer2;
    }
    toString(encoding) {
      if (encoding === "base64")
        return ByteUtils.toBase64(this.id);
      if (encoding === "hex")
        return this.toHexString();
      return this.toHexString();
    }
    toJSON() {
      return this.toHexString();
    }
    static is(variable) {
      return variable != null && typeof variable === "object" && "_bsontype" in variable && variable._bsontype === "ObjectId";
    }
    equals(otherId) {
      if (otherId === void 0 || otherId === null) {
        return false;
      }
      if (_ObjectId.is(otherId) && typeof otherId.i0 === "number" && typeof otherId.i1 === "number" && typeof otherId.i2 === "number" && typeof otherId.i3 === "number") {
        return this.i3 === otherId.i3 && this.i0 === otherId.i0 && this.i1 === otherId.i1 && this.i2 === otherId.i2;
      }
      if (typeof otherId === "string") {
        return otherId.toLowerCase() === this.toHexString();
      }
      if (typeof otherId === "object" && typeof otherId.toHexString === "function") {
        const otherIdString = otherId.toHexString();
        const thisIdString = this.toHexString();
        return typeof otherIdString === "string" && otherIdString.toLowerCase() === thisIdString;
      }
      return false;
    }
    getTimestamp() {
      const timestamp = /* @__PURE__ */ new Date();
      const time = this.i0 * 256 + (this.i1 >>> 16);
      timestamp.setTime(time * 1e3);
      return timestamp;
    }
    static createPk() {
      return new _ObjectId();
    }
    serializeInto(uint8array, index) {
      uint8array[index] = this.i0 >>> 16 & 255;
      uint8array[index + 1] = this.i0 >>> 8 & 255;
      uint8array[index + 2] = this.i0 & 255;
      uint8array[index + 3] = this.i1 >>> 16 & 255;
      uint8array[index + 4] = this.i1 >>> 8 & 255;
      uint8array[index + 5] = this.i1 & 255;
      uint8array[index + 6] = this.i2 >>> 16 & 255;
      uint8array[index + 7] = this.i2 >>> 8 & 255;
      uint8array[index + 8] = this.i2 & 255;
      uint8array[index + 9] = this.i3 >>> 16 & 255;
      uint8array[index + 10] = this.i3 >>> 8 & 255;
      uint8array[index + 11] = this.i3 & 255;
      return 12;
    }
    static createFromTime(time) {
      const buffer2 = ByteUtils.allocate(12);
      for (let i = 11; i >= 4; i--)
        buffer2[i] = 0;
      NumberUtils.setInt32BE(buffer2, 0, time);
      return new _ObjectId(buffer2);
    }
    static createFromHexString(hexString) {
      if (hexString?.length !== 24) {
        throw new BSONError("hex string must be 24 characters");
      }
      return new _ObjectId(ByteUtils.fromHex(hexString));
    }
    static createFromBase64(base64) {
      if (base64?.length !== 16) {
        throw new BSONError("base64 string must be 16 characters");
      }
      return new _ObjectId(ByteUtils.fromBase64(base64));
    }
    static isValid(id) {
      if (id == null)
        return false;
      if (typeof id === "string")
        return _ObjectId.validateHexString(id);
      try {
        new _ObjectId(id);
        return true;
      } catch {
        return false;
      }
    }
    toExtendedJSON() {
      if (this.toHexString)
        return { $oid: this.toHexString() };
      return { $oid: this.toString("hex") };
    }
    static fromExtendedJSON(doc3) {
      return new _ObjectId(doc3.$oid);
    }
    isCached() {
      return _ObjectId.cacheHexString && __idCache.has(this);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      return `new ObjectId(${inspect3(this.toHexString(), options)})`;
    }
  };
  function alphabetize(str) {
    return str.split("").sort().join("");
  }
  var BSONRegExp = class _BSONRegExp extends BSONValue {
    get _bsontype() {
      return "BSONRegExp";
    }
    pattern;
    options;
    constructor(pattern, options) {
      super();
      this.pattern = pattern;
      this.options = alphabetize(options ?? "");
      if (this.pattern.indexOf("\0") !== -1) {
        throw new BSONError(`BSON Regex patterns cannot contain null bytes, found: ${JSON.stringify(this.pattern)}`);
      }
      if (this.options.indexOf("\0") !== -1) {
        throw new BSONError(`BSON Regex options cannot contain null bytes, found: ${JSON.stringify(this.options)}`);
      }
      for (let i = 0; i < this.options.length; i++) {
        if (!(this.options[i] === "i" || this.options[i] === "m" || this.options[i] === "x" || this.options[i] === "l" || this.options[i] === "s" || this.options[i] === "u")) {
          throw new BSONError(`The regular expression option [${this.options[i]}] is not supported`);
        }
      }
    }
    static parseOptions(options) {
      return options ? options.split("").sort().join("") : "";
    }
    toExtendedJSON(options) {
      options = options || {};
      if (options.legacy) {
        return { $regex: this.pattern, $options: this.options };
      }
      return { $regularExpression: { pattern: this.pattern, options: this.options } };
    }
    static fromExtendedJSON(doc3) {
      if ("$regex" in doc3) {
        if (typeof doc3.$regex !== "string") {
          if (doc3.$regex._bsontype === "BSONRegExp") {
            return doc3;
          }
        } else {
          return new _BSONRegExp(doc3.$regex, _BSONRegExp.parseOptions(doc3.$options));
        }
      }
      if ("$regularExpression" in doc3) {
        return new _BSONRegExp(doc3.$regularExpression.pattern, _BSONRegExp.parseOptions(doc3.$regularExpression.options));
      }
      throw new BSONError(`Unexpected BSONRegExp EJSON object form: ${JSON.stringify(doc3)}`);
    }
    inspect(depth, options, inspect3) {
      const stylize = getStylizeFunction(options) ?? ((v) => v);
      inspect3 ??= defaultInspect;
      const pattern = stylize(inspect3(this.pattern), "regexp");
      const flags = stylize(inspect3(this.options), "regexp");
      return `new BSONRegExp(${pattern}, ${flags})`;
    }
  };
  var BSONSymbol = class _BSONSymbol extends BSONValue {
    get _bsontype() {
      return "BSONSymbol";
    }
    value;
    constructor(value) {
      super();
      this.value = value;
    }
    valueOf() {
      return this.value;
    }
    toString() {
      return this.value;
    }
    toJSON() {
      return this.value;
    }
    toExtendedJSON() {
      return { $symbol: this.value };
    }
    static fromExtendedJSON(doc3) {
      return new _BSONSymbol(doc3.$symbol);
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      return `new BSONSymbol(${inspect3(this.value, options)})`;
    }
  };
  var LongWithoutOverridesClass = Long;
  var Timestamp = class _Timestamp extends LongWithoutOverridesClass {
    get _bsontype() {
      return "Timestamp";
    }
    get [bsonType]() {
      return "Timestamp";
    }
    static MAX_VALUE = Long.MAX_UNSIGNED_VALUE;
    get i() {
      return this.low >>> 0;
    }
    get t() {
      return this.high >>> 0;
    }
    constructor(low) {
      if (low == null) {
        super(0, 0, true);
      } else if (typeof low === "bigint") {
        super(low, true);
      } else if (Long.isLong(low)) {
        super(low.low, low.high, true);
      } else if (typeof low === "object" && "t" in low && "i" in low) {
        if (typeof low.t !== "number" && (typeof low.t !== "object" || low.t._bsontype !== "Int32")) {
          throw new BSONError("Timestamp constructed from { t, i } must provide t as a number");
        }
        if (typeof low.i !== "number" && (typeof low.i !== "object" || low.i._bsontype !== "Int32")) {
          throw new BSONError("Timestamp constructed from { t, i } must provide i as a number");
        }
        const t = Number(low.t);
        const i = Number(low.i);
        if (t < 0 || Number.isNaN(t)) {
          throw new BSONError("Timestamp constructed from { t, i } must provide a positive t");
        }
        if (i < 0 || Number.isNaN(i)) {
          throw new BSONError("Timestamp constructed from { t, i } must provide a positive i");
        }
        if (t > 4294967295) {
          throw new BSONError("Timestamp constructed from { t, i } must provide t equal or less than uint32 max");
        }
        if (i > 4294967295) {
          throw new BSONError("Timestamp constructed from { t, i } must provide i equal or less than uint32 max");
        }
        super(i, t, true);
      } else {
        throw new BSONError("A Timestamp can only be constructed with: bigint, Long, or { t: number; i: number }");
      }
    }
    toJSON() {
      return {
        $timestamp: this.toString()
      };
    }
    static fromInt(value) {
      return new _Timestamp(Long.fromInt(value, true));
    }
    static fromNumber(value) {
      return new _Timestamp(Long.fromNumber(value, true));
    }
    static fromBits(lowBits, highBits) {
      return new _Timestamp({ i: lowBits, t: highBits });
    }
    static fromString(str, optRadix) {
      return new _Timestamp(Long.fromString(str, true, optRadix));
    }
    toExtendedJSON() {
      return { $timestamp: { t: this.t, i: this.i } };
    }
    static fromExtendedJSON(doc3) {
      const i = Long.isLong(doc3.$timestamp.i) ? doc3.$timestamp.i.getLowBitsUnsigned() : doc3.$timestamp.i;
      const t = Long.isLong(doc3.$timestamp.t) ? doc3.$timestamp.t.getLowBitsUnsigned() : doc3.$timestamp.t;
      return new _Timestamp({ t, i });
    }
    inspect(depth, options, inspect3) {
      inspect3 ??= defaultInspect;
      const t = inspect3(this.t, options);
      const i = inspect3(this.i, options);
      return `new Timestamp({ t: ${t}, i: ${i} })`;
    }
  };
  var JS_INT_MAX_LONG = Long.fromNumber(JS_INT_MAX);
  var JS_INT_MIN_LONG = Long.fromNumber(JS_INT_MIN);
  function internalDeserialize(buffer2, options, isArray) {
    options = options == null ? {} : options;
    const index = options && options.index ? options.index : 0;
    const size = NumberUtils.getInt32LE(buffer2, index);
    if (size < 5) {
      throw new BSONError(`bson size must be >= 5, is ${size}`);
    }
    if (options.allowObjectSmallerThanBufferSize && buffer2.length < size) {
      throw new BSONError(`buffer length ${buffer2.length} must be >= bson size ${size}`);
    }
    if (!options.allowObjectSmallerThanBufferSize && buffer2.length !== size) {
      throw new BSONError(`buffer length ${buffer2.length} must === bson size ${size}`);
    }
    if (size + index > buffer2.byteLength) {
      throw new BSONError(`(bson size ${size} + options.index ${index} must be <= buffer length ${buffer2.byteLength})`);
    }
    if (buffer2[index + size - 1] !== 0) {
      throw new BSONError("One object, sized correctly, with a spot for an EOO, but the EOO isn't 0x00");
    }
    return deserializeObject(buffer2, index, options, isArray);
  }
  var allowedDBRefKeys = /^\$ref$|^\$id$|^\$db$/;
  function assignValue(dest, name, value) {
    if (name === "__proto__") {
      Object.defineProperty(dest, name, {
        value,
        writable: true,
        enumerable: true,
        configurable: true
      });
    } else {
      dest[name] = value;
    }
  }
  function toPotentialDbRef(doc3) {
    if (isDBRefLike(doc3)) {
      const { $ref, $id, $db, ...fields } = doc3;
      return new DBRef($ref, $id, $db, fields);
    }
    return doc3;
  }
  function deserializeObject(buffer2, index, options, isArray = false) {
    options = { ...options };
    const fieldsAsRaw = options["fieldsAsRaw"] == null ? null : options["fieldsAsRaw"];
    const raw = options["raw"] == null ? false : options["raw"];
    const bsonRegExp = typeof options["bsonRegExp"] === "boolean" ? options["bsonRegExp"] : false;
    const promoteBuffers = options.promoteBuffers ?? false;
    const promoteLongs = options.promoteLongs ?? true;
    const promoteValues = options.promoteValues ?? true;
    const useBigInt64 = options.useBigInt64 ?? false;
    if (useBigInt64 && !promoteValues) {
      throw new BSONError("Must either request bigint or Long for int64 deserialization");
    }
    if (useBigInt64 && !promoteLongs) {
      throw new BSONError("Must either request bigint or Long for int64 deserialization");
    }
    const validation = options.validation == null ? { utf8: true } : options.validation;
    let globalUTFValidation = true;
    let validationSetting;
    let utf8KeysSet;
    const utf8ValidatedKeys = validation.utf8;
    if (typeof utf8ValidatedKeys === "boolean") {
      validationSetting = utf8ValidatedKeys;
    } else {
      globalUTFValidation = false;
      const utf8ValidationValues = Object.keys(utf8ValidatedKeys).map(function(key) {
        return utf8ValidatedKeys[key];
      });
      if (utf8ValidationValues.length === 0) {
        throw new BSONError("UTF-8 validation setting cannot be empty");
      }
      if (typeof utf8ValidationValues[0] !== "boolean") {
        throw new BSONError("Invalid UTF-8 validation option, must specify boolean values");
      }
      validationSetting = utf8ValidationValues[0];
      if (!utf8ValidationValues.every((item) => item === validationSetting)) {
        throw new BSONError("Invalid UTF-8 validation option - keys must be all true or all false");
      }
    }
    if (!globalUTFValidation) {
      utf8KeysSet = /* @__PURE__ */ new Set();
      for (const key of Object.keys(utf8ValidatedKeys)) {
        utf8KeysSet.add(key);
      }
    }
    const startIndex = index;
    if (buffer2.length < 5)
      throw new BSONError("corrupt bson message < 5 bytes long");
    const size = NumberUtils.getInt32LE(buffer2, index);
    index += 4;
    if (size < 5 || size > buffer2.length)
      throw new BSONError("corrupt bson message");
    const rootObject = isArray ? [] : {};
    let arrayIndex = 0;
    let isPossibleDBRef = isArray ? false : null;
    let currentFrame = null;
    let currentDest = rootObject;
    let currentIsArray = isArray;
    while (true) {
      const elementType = buffer2[index++];
      if (elementType === 0) {
        if (currentFrame) {
          if (index === currentFrame.lastIndex) {
            const completedFrame = currentFrame;
            currentFrame = completedFrame.prev;
            if (currentFrame === null) {
              currentDest = rootObject;
              currentIsArray = isArray;
            } else {
              currentDest = currentFrame.holdingDocument;
              currentIsArray = currentFrame.isArray;
            }
            let result = completedFrame.holdingDocument;
            switch (completedFrame.elementType) {
              case BSON_DATA_OBJECT:
                if (completedFrame.isPossibleDBRef) {
                  result = toPotentialDbRef(result);
                }
                break;
              case BSON_DATA_ARRAY:
                break;
              case BSON_DATA_CODE_W_SCOPE:
                result = new Code(completedFrame.functionString, completedFrame.holdingDocument);
                break;
              default:
                throw new BSONError("Unexpected element type in frame stack");
            }
            assignValue(currentDest, completedFrame.propertyName, result);
            continue;
          } else {
            if (currentFrame.elementType === BSON_DATA_ARRAY) {
              throw new BSONError("corrupted array bson");
            }
            throw new BSONError("Bad BSON Document: object not properly terminated");
          }
        } else {
          break;
        }
      }
      let i = index;
      while (buffer2[i] !== 0 && i < buffer2.length) {
        i++;
      }
      if (i >= buffer2.byteLength)
        throw new BSONError("Bad BSON Document: illegal CString");
      const name = currentIsArray ? currentFrame !== null ? currentFrame.arrayIndex++ : arrayIndex++ : ByteUtils.toUTF8(buffer2, index, i, false);
      let shouldValidateKey;
      if (currentFrame !== null) {
        shouldValidateKey = currentFrame.validationSetting;
      } else if (globalUTFValidation || utf8KeysSet?.has(name)) {
        shouldValidateKey = validationSetting;
      } else {
        shouldValidateKey = !validationSetting;
      }
      if (currentFrame !== null) {
        if (currentFrame.isPossibleDBRef !== false && typeof name === "string" && name[0] === "$") {
          currentFrame.isPossibleDBRef = allowedDBRefKeys.test(name);
        }
      } else if (isPossibleDBRef !== false && name[0] === "$") {
        isPossibleDBRef = allowedDBRefKeys.test(name);
      }
      let value;
      let isDeferredValue = false;
      index = i + 1;
      if (elementType === BSON_DATA_STRING) {
        const stringSize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        if (stringSize <= 0 || stringSize > buffer2.length - index || buffer2[index + stringSize - 1] !== 0) {
          throw new BSONError("bad string length in bson");
        }
        value = ByteUtils.toUTF8(buffer2, index, index + stringSize - 1, shouldValidateKey);
        index = index + stringSize;
      } else if (elementType === BSON_DATA_OID) {
        value = new ObjectId(buffer2, index);
        index = index + 12;
      } else if (elementType === BSON_DATA_INT && promoteValues === false) {
        value = new Int32(NumberUtils.getInt32LE(buffer2, index));
        index += 4;
      } else if (elementType === BSON_DATA_INT) {
        value = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
      } else if (elementType === BSON_DATA_NUMBER) {
        value = NumberUtils.getFloat64LE(buffer2, index);
        index += 8;
        if (promoteValues === false)
          value = new Double(value);
      } else if (elementType === BSON_DATA_DATE) {
        const lowBits = NumberUtils.getInt32LE(buffer2, index);
        const highBits = NumberUtils.getInt32LE(buffer2, index + 4);
        index += 8;
        value = new Date(new Long(lowBits, highBits).toNumber());
      } else if (elementType === BSON_DATA_BOOLEAN) {
        if (buffer2[index] !== 0 && buffer2[index] !== 1)
          throw new BSONError("illegal boolean type value");
        value = buffer2[index++] === 1;
      } else if (elementType === BSON_DATA_OBJECT) {
        const objectSize = NumberUtils.getInt32LE(buffer2, index);
        if (objectSize < 5 || objectSize > buffer2.length - index)
          throw new BSONError("bad embedded document length in bson");
        if (raw || (currentFrame?.raw ?? false)) {
          value = buffer2.subarray(index, index + objectSize);
          index = index + objectSize;
        } else {
          isDeferredValue = true;
          const objectFrame = {
            holdingDocument: {},
            elementType: BSON_DATA_OBJECT,
            propertyName: name,
            functionString: null,
            lastIndex: index + objectSize,
            isArray: false,
            arrayIndex: 0,
            raw: false,
            isPossibleDBRef: null,
            validationSetting: shouldValidateKey,
            prev: currentFrame
          };
          currentFrame = objectFrame;
          currentDest = objectFrame.holdingDocument;
          currentIsArray = false;
          index = index + 4;
        }
      } else if (elementType === BSON_DATA_ARRAY) {
        const objectSize = NumberUtils.getInt32LE(buffer2, index);
        if (objectSize < 5 || objectSize > buffer2.length - index)
          throw new BSONError("bad embedded array length in bson");
        const stopIndex = index + objectSize;
        const arrayRaw = !!(fieldsAsRaw && fieldsAsRaw[name]) || (currentFrame?.raw ?? false);
        isDeferredValue = true;
        const arrayFrame = {
          holdingDocument: [],
          elementType: BSON_DATA_ARRAY,
          propertyName: name,
          functionString: null,
          lastIndex: stopIndex,
          isArray: true,
          arrayIndex: 0,
          raw: arrayRaw,
          isPossibleDBRef: false,
          validationSetting: shouldValidateKey,
          prev: currentFrame
        };
        currentFrame = arrayFrame;
        currentDest = arrayFrame.holdingDocument;
        currentIsArray = true;
        index = index + 4;
      } else if (elementType === BSON_DATA_UNDEFINED) {
        value = void 0;
      } else if (elementType === BSON_DATA_NULL) {
        value = null;
      } else if (elementType === BSON_DATA_LONG) {
        if (useBigInt64) {
          value = NumberUtils.getBigInt64LE(buffer2, index);
          index += 8;
        } else {
          const lowBits = NumberUtils.getInt32LE(buffer2, index);
          const highBits = NumberUtils.getInt32LE(buffer2, index + 4);
          index += 8;
          const long = new Long(lowBits, highBits);
          if (promoteLongs && promoteValues === true) {
            value = long.lessThanOrEqual(JS_INT_MAX_LONG) && long.greaterThanOrEqual(JS_INT_MIN_LONG) ? long.toNumber() : long;
          } else {
            value = long;
          }
        }
      } else if (elementType === BSON_DATA_DECIMAL128) {
        const bytes = ByteUtils.allocateUnsafe(16);
        for (let i2 = 0; i2 < 16; i2++)
          bytes[i2] = buffer2[index + i2];
        index = index + 16;
        value = new Decimal128(bytes);
      } else if (elementType === BSON_DATA_BINARY) {
        let binarySize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        const totalBinarySize = binarySize;
        const subType = buffer2[index++];
        if (binarySize < 0)
          throw new BSONError("Negative binary type element size found");
        if (binarySize > buffer2.byteLength)
          throw new BSONError("Binary type size larger than document size");
        if (subType === Binary.SUBTYPE_BYTE_ARRAY) {
          binarySize = NumberUtils.getInt32LE(buffer2, index);
          index += 4;
          if (binarySize < 0)
            throw new BSONError("Negative binary type element size found for subtype 0x02");
          if (binarySize > totalBinarySize - 4)
            throw new BSONError("Binary type with subtype 0x02 contains too long binary size");
          if (binarySize < totalBinarySize - 4)
            throw new BSONError("Binary type with subtype 0x02 contains too short binary size");
        }
        if (promoteBuffers && promoteValues) {
          value = ByteUtils.toLocalBufferType(buffer2.subarray(index, index + binarySize));
        } else {
          value = new Binary(buffer2.subarray(index, index + binarySize), subType);
          if (subType === BSON_BINARY_SUBTYPE_UUID_NEW && UUID.isValid(value)) {
            value = value.toUUID();
          }
        }
        index = index + binarySize;
      } else if (elementType === BSON_DATA_REGEXP && bsonRegExp === false) {
        i = index;
        while (buffer2[i] !== 0 && i < buffer2.length) {
          i++;
        }
        if (i >= buffer2.length)
          throw new BSONError("Bad BSON Document: illegal CString");
        const source = ByteUtils.toUTF8(buffer2, index, i, false);
        index = i + 1;
        i = index;
        while (buffer2[i] !== 0 && i < buffer2.length) {
          i++;
        }
        if (i >= buffer2.length)
          throw new BSONError("Bad BSON Document: illegal CString");
        const regExpOptions = ByteUtils.toUTF8(buffer2, index, i, false);
        index = i + 1;
        const optionsArray = new Array(regExpOptions.length);
        for (i = 0; i < regExpOptions.length; i++) {
          switch (regExpOptions[i]) {
            case "m":
              optionsArray[i] = "m";
              break;
            case "s":
              optionsArray[i] = "g";
              break;
            case "i":
              optionsArray[i] = "i";
              break;
          }
        }
        value = new RegExp(source, optionsArray.join(""));
      } else if (elementType === BSON_DATA_REGEXP && bsonRegExp === true) {
        i = index;
        while (buffer2[i] !== 0 && i < buffer2.length) {
          i++;
        }
        if (i >= buffer2.length)
          throw new BSONError("Bad BSON Document: illegal CString");
        const source = ByteUtils.toUTF8(buffer2, index, i, false);
        index = i + 1;
        i = index;
        while (buffer2[i] !== 0 && i < buffer2.length) {
          i++;
        }
        if (i >= buffer2.length)
          throw new BSONError("Bad BSON Document: illegal CString");
        const regExpOptions = ByteUtils.toUTF8(buffer2, index, i, false);
        index = i + 1;
        value = new BSONRegExp(source, regExpOptions);
      } else if (elementType === BSON_DATA_SYMBOL) {
        const stringSize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        if (stringSize <= 0 || stringSize > buffer2.length - index || buffer2[index + stringSize - 1] !== 0) {
          throw new BSONError("bad string length in bson");
        }
        const symbol = ByteUtils.toUTF8(buffer2, index, index + stringSize - 1, shouldValidateKey);
        value = promoteValues ? symbol : new BSONSymbol(symbol);
        index = index + stringSize;
      } else if (elementType === BSON_DATA_TIMESTAMP) {
        value = new Timestamp({
          i: NumberUtils.getUint32LE(buffer2, index),
          t: NumberUtils.getUint32LE(buffer2, index + 4)
        });
        index += 8;
      } else if (elementType === BSON_DATA_MIN_KEY) {
        value = new MinKey();
      } else if (elementType === BSON_DATA_MAX_KEY) {
        value = new MaxKey();
      } else if (elementType === BSON_DATA_CODE) {
        const stringSize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        if (stringSize <= 0 || stringSize > buffer2.length - index || buffer2[index + stringSize - 1] !== 0) {
          throw new BSONError("bad string length in bson");
        }
        const functionString = ByteUtils.toUTF8(buffer2, index, index + stringSize - 1, shouldValidateKey);
        value = new Code(functionString);
        index = index + stringSize;
      } else if (elementType === BSON_DATA_CODE_W_SCOPE) {
        const totalSize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        if (totalSize < 4 + 4 + 4 + 1) {
          throw new BSONError("code_w_scope total size shorter minimum expected length");
        }
        const stringSize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        if (stringSize <= 0 || stringSize > buffer2.length - index || buffer2[index + stringSize - 1] !== 0) {
          throw new BSONError("bad string length in bson");
        }
        const functionString = ByteUtils.toUTF8(buffer2, index, index + stringSize - 1, shouldValidateKey);
        index = index + stringSize;
        const _index = index;
        const objectSize = NumberUtils.getInt32LE(buffer2, index);
        if (objectSize < 5 || objectSize > buffer2.length - index)
          throw new BSONError("bad scope document size in code_w_scope");
        if (totalSize < 4 + 4 + objectSize + stringSize) {
          throw new BSONError("code_w_scope total size is too short, truncating scope");
        }
        if (totalSize > 4 + 4 + objectSize + stringSize) {
          throw new BSONError("code_w_scope total size is too long, clips outer document");
        }
        isDeferredValue = true;
        const scopeFrame = {
          holdingDocument: {},
          elementType: BSON_DATA_CODE_W_SCOPE,
          propertyName: name,
          functionString,
          lastIndex: _index + objectSize,
          isArray: false,
          arrayIndex: 0,
          raw: false,
          isPossibleDBRef: null,
          validationSetting: shouldValidateKey,
          prev: currentFrame
        };
        currentFrame = scopeFrame;
        currentDest = scopeFrame.holdingDocument;
        currentIsArray = false;
        index = index + 4;
      } else if (elementType === BSON_DATA_DBPOINTER) {
        const stringSize = NumberUtils.getInt32LE(buffer2, index);
        index += 4;
        if (stringSize <= 0 || stringSize > buffer2.length - index || buffer2[index + stringSize - 1] !== 0)
          throw new BSONError("bad string length in bson");
        const namespace = ByteUtils.toUTF8(buffer2, index, index + stringSize - 1, shouldValidateKey);
        index = index + stringSize;
        const oidBuffer = ByteUtils.allocateUnsafe(12);
        for (let i2 = 0; i2 < 12; i2++)
          oidBuffer[i2] = buffer2[index + i2];
        const oid = new ObjectId(oidBuffer);
        index = index + 12;
        value = new DBRef(namespace, oid);
      } else {
        throw new BSONError(`Detected unknown BSON type ${elementType.toString(16)} for fieldname "${name}"`);
      }
      if (!isDeferredValue) {
        assignValue(currentDest, name, value);
      }
    }
    if (currentFrame !== null) {
      throw new BSONError("corrupted bson, more objects expected based on the current document size");
    }
    const object = rootObject;
    if (size !== index - startIndex) {
      if (isArray)
        throw new BSONError("corrupt array bson");
      throw new BSONError("corrupt object bson");
    }
    if (!isPossibleDBRef)
      return object;
    return toPotentialDbRef(object);
  }
  var regexp = /\x00/;
  var ignoreKeys = /* @__PURE__ */ new Set(["$db", "$ref", "$id", "$clusterTime"]);
  function serializeString(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_STRING;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes + 1;
    buffer2[index - 1] = 0;
    const size = ByteUtils.encodeUTF8Into(buffer2, value, index + 4);
    NumberUtils.setInt32LE(buffer2, index, size + 1);
    index = index + 4 + size;
    buffer2[index++] = 0;
    return index;
  }
  function serializeNumber(buffer2, key, value, index) {
    const isNegativeZero = Object.is(value, -0);
    const type3 = !isNegativeZero && Number.isSafeInteger(value) && value <= BSON_INT32_MAX && value >= BSON_INT32_MIN ? BSON_DATA_INT : BSON_DATA_NUMBER;
    buffer2[index++] = type3;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    if (type3 === BSON_DATA_INT) {
      index += NumberUtils.setInt32LE(buffer2, index, value);
    } else {
      index += NumberUtils.setFloat64LE(buffer2, index, value);
    }
    return index;
  }
  function serializeBigInt(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_LONG;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index += numberOfWrittenBytes;
    buffer2[index++] = 0;
    index += NumberUtils.setBigInt64LE(buffer2, index, value);
    return index;
  }
  function serializeNull(buffer2, key, _, index) {
    buffer2[index++] = BSON_DATA_NULL;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    return index;
  }
  function serializeBoolean(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_BOOLEAN;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    buffer2[index++] = value ? 1 : 0;
    return index;
  }
  function serializeDate(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_DATE;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    const dateInMilis = Long.fromNumber(value.getTime());
    const lowBits = dateInMilis.getLowBits();
    const highBits = dateInMilis.getHighBits();
    index += NumberUtils.setInt32LE(buffer2, index, lowBits);
    index += NumberUtils.setInt32LE(buffer2, index, highBits);
    return index;
  }
  function serializeRegExp(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_REGEXP;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    if (value.source && value.source.match(regexp) != null) {
      throw new BSONError("value " + value.source + " must not contain null bytes");
    }
    index = index + ByteUtils.encodeUTF8Into(buffer2, value.source, index);
    buffer2[index++] = 0;
    if (value.ignoreCase)
      buffer2[index++] = 105;
    if (value.global)
      buffer2[index++] = 115;
    if (value.multiline)
      buffer2[index++] = 109;
    buffer2[index++] = 0;
    return index;
  }
  function serializeBSONRegExp(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_REGEXP;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    if (value.pattern.match(regexp) != null) {
      throw new BSONError("pattern " + value.pattern + " must not contain null bytes");
    }
    index = index + ByteUtils.encodeUTF8Into(buffer2, value.pattern, index);
    buffer2[index++] = 0;
    const sortedOptions = value.options.split("").sort().join("");
    index = index + ByteUtils.encodeUTF8Into(buffer2, sortedOptions, index);
    buffer2[index++] = 0;
    return index;
  }
  function serializeMinMax(buffer2, key, value, index) {
    if (value === null) {
      buffer2[index++] = BSON_DATA_NULL;
    } else if (value[bsonType] === "MinKey") {
      buffer2[index++] = BSON_DATA_MIN_KEY;
    } else {
      buffer2[index++] = BSON_DATA_MAX_KEY;
    }
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    return index;
  }
  function serializeObjectId(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_OID;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    index += value.serializeInto(buffer2, index);
    return index;
  }
  function serializeBuffer(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_BINARY;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    const size = value.length;
    index += NumberUtils.setInt32LE(buffer2, index, size);
    buffer2[index++] = BSON_BINARY_SUBTYPE_DEFAULT;
    if (size <= 16) {
      for (let i = 0; i < size; i++)
        buffer2[index + i] = value[i];
    } else {
      buffer2.set(value, index);
    }
    index = index + size;
    return index;
  }
  function serializeDecimal128(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_DECIMAL128;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    for (let i = 0; i < 16; i++)
      buffer2[index + i] = value.bytes[i];
    return index + 16;
  }
  function serializeLong(buffer2, key, value, index) {
    buffer2[index++] = value[bsonType] === "Long" ? BSON_DATA_LONG : BSON_DATA_TIMESTAMP;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    const lowBits = value.getLowBits();
    const highBits = value.getHighBits();
    index += NumberUtils.setInt32LE(buffer2, index, lowBits);
    index += NumberUtils.setInt32LE(buffer2, index, highBits);
    return index;
  }
  function serializeInt32(buffer2, key, value, index) {
    value = value.valueOf();
    buffer2[index++] = BSON_DATA_INT;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    index += NumberUtils.setInt32LE(buffer2, index, value);
    return index;
  }
  function serializeDouble(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_NUMBER;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    index += NumberUtils.setFloat64LE(buffer2, index, value.value);
    return index;
  }
  function serializeFunction(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_CODE;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    const functionString = value.toString();
    const size = ByteUtils.encodeUTF8Into(buffer2, functionString, index + 4) + 1;
    NumberUtils.setInt32LE(buffer2, index, size);
    index = index + 4 + size - 1;
    buffer2[index++] = 0;
    return index;
  }
  function serializeBinary(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_BINARY;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    const data = value.buffer;
    let size = value.position;
    if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY)
      size = size + 4;
    index += NumberUtils.setInt32LE(buffer2, index, size);
    buffer2[index++] = value.sub_type;
    if (value.sub_type === Binary.SUBTYPE_BYTE_ARRAY) {
      size = size - 4;
      index += NumberUtils.setInt32LE(buffer2, index, size);
    }
    if (value.sub_type === Binary.SUBTYPE_VECTOR) {
      validateBinaryVector(value);
    }
    if (size <= 16) {
      for (let i = 0; i < size; i++)
        buffer2[index + i] = data[i];
    } else {
      buffer2.set(data, index);
    }
    index = index + value.position;
    return index;
  }
  function serializeSymbol(buffer2, key, value, index) {
    buffer2[index++] = BSON_DATA_SYMBOL;
    const numberOfWrittenBytes = ByteUtils.encodeUTF8Into(buffer2, key, index);
    index = index + numberOfWrittenBytes;
    buffer2[index++] = 0;
    const size = ByteUtils.encodeUTF8Into(buffer2, value.value, index + 4) + 1;
    NumberUtils.setInt32LE(buffer2, index, size);
    index = index + 4 + size - 1;
    buffer2[index++] = 0;
    return index;
  }
  function makeFrame(sourceObject, objectSizeIndex, codeSizeIndex, prev, checkKeys, ignoreUndefined) {
    if (Array.isArray(sourceObject)) {
      return {
        sourceObject,
        isArray: true,
        objectSizeIndex,
        codeSizeIndex,
        iterTarget: sourceObject,
        keys: null,
        keyIndex: 0,
        mapIterator: null,
        prev,
        checkKeys,
        ignoreUndefined
      };
    }
    if (sourceObject instanceof Map || isMap(sourceObject)) {
      return {
        sourceObject,
        isArray: false,
        objectSizeIndex,
        codeSizeIndex,
        iterTarget: sourceObject,
        keys: null,
        keyIndex: 0,
        mapIterator: sourceObject.entries(),
        prev,
        checkKeys,
        ignoreUndefined
      };
    }
    let target = sourceObject;
    if (typeof target?.toBSON === "function") {
      target = target.toBSON();
      if (target != null && typeof target !== "object") {
        throw new BSONError("toBSON function did not return an object");
      }
    }
    return {
      sourceObject,
      isArray: false,
      objectSizeIndex,
      codeSizeIndex,
      iterTarget: target,
      keys: Object.keys(target),
      keyIndex: 0,
      mapIterator: null,
      prev,
      checkKeys,
      ignoreUndefined
    };
  }
  function serializeInto(buffer2, object, checkKeys, startingIndex, serializeFunctions, ignoreUndefined, path) {
    if (path == null) {
      if (object == null) {
        buffer2[0] = 5;
        buffer2[1] = 0;
        buffer2[2] = 0;
        buffer2[3] = 0;
        buffer2[4] = 0;
        return 5;
      }
      if (Array.isArray(object)) {
        throw new BSONError("serialize does not support an array as the root input");
      }
      if (typeof object !== "object") {
        throw new BSONError("serialize does not support non-object as the root input");
      } else if ("_bsontype" in object && typeof object._bsontype === "string") {
        throw new BSONError(`BSON types cannot be serialized as a document`);
      } else if (isDate(object) || isRegExp(object) || isUint8Array(object) || isAnyArrayBuffer(object)) {
        throw new BSONError(`date, regexp, typedarray, and arraybuffer cannot be BSON documents`);
      }
      path = /* @__PURE__ */ new Set();
    }
    path.add(object);
    let currentFrame = makeFrame(object, startingIndex, null, null, checkKeys, ignoreUndefined);
    let index = startingIndex + 4;
    while (currentFrame !== null) {
      const frame2 = currentFrame;
      let key;
      let value;
      if (frame2.mapIterator !== null) {
        const next = frame2.mapIterator.next();
        if (next.done) {
          buffer2[index++] = 0;
          NumberUtils.setInt32LE(buffer2, frame2.objectSizeIndex, index - frame2.objectSizeIndex);
          if (frame2.codeSizeIndex !== null) {
            NumberUtils.setInt32LE(buffer2, frame2.codeSizeIndex, index - frame2.codeSizeIndex);
          }
          path.delete(frame2.sourceObject);
          currentFrame = frame2.prev;
          continue;
        }
        key = next.value[0];
        value = next.value[1];
      } else if (frame2.keys !== null) {
        if (frame2.keyIndex >= frame2.keys.length) {
          buffer2[index++] = 0;
          NumberUtils.setInt32LE(buffer2, frame2.objectSizeIndex, index - frame2.objectSizeIndex);
          if (frame2.codeSizeIndex !== null) {
            NumberUtils.setInt32LE(buffer2, frame2.codeSizeIndex, index - frame2.codeSizeIndex);
          }
          path.delete(frame2.sourceObject);
          currentFrame = frame2.prev;
          continue;
        }
        key = frame2.keys[frame2.keyIndex++];
        value = frame2.iterTarget[key];
      } else {
        const arr = frame2.iterTarget;
        if (frame2.keyIndex >= arr.length) {
          buffer2[index++] = 0;
          NumberUtils.setInt32LE(buffer2, frame2.objectSizeIndex, index - frame2.objectSizeIndex);
          if (frame2.codeSizeIndex !== null) {
            NumberUtils.setInt32LE(buffer2, frame2.codeSizeIndex, index - frame2.codeSizeIndex);
          }
          path.delete(frame2.sourceObject);
          currentFrame = frame2.prev;
          continue;
        }
        const i = frame2.keyIndex++;
        key = String(i);
        value = arr[i];
      }
      if (typeof value?.toBSON === "function") {
        value = value.toBSON();
      }
      if (!frame2.isArray && typeof key === "string" && !(key[0] === "$" && ignoreKeys.has(key))) {
        if (regexp.test(key)) {
          throw new BSONError("key " + key + " must not contain null bytes");
        }
        if (frame2.checkKeys) {
          if ("$" === key[0]) {
            throw new BSONError("key " + key + " must not start with '$'");
          } else if (key.includes(".")) {
            throw new BSONError("key " + key + " must not contain '.'");
          }
        }
      }
      const type3 = typeof value;
      if (value === void 0) {
        if (frame2.isArray || frame2.ignoreUndefined === false) {
          index = serializeNull(buffer2, key, value, index);
        }
      } else if (value === null) {
        index = serializeNull(buffer2, key, value, index);
      } else if (type3 === "string") {
        index = serializeString(buffer2, key, value, index);
      } else if (type3 === "number") {
        index = serializeNumber(buffer2, key, value, index);
      } else if (type3 === "bigint") {
        index = serializeBigInt(buffer2, key, value, index);
      } else if (type3 === "boolean") {
        index = serializeBoolean(buffer2, key, value, index);
      } else if (type3 === "object" && value._bsontype == null) {
        if (value instanceof Date || isDate(value)) {
          index = serializeDate(buffer2, key, value, index);
        } else if (value instanceof Uint8Array || isUint8Array(value)) {
          index = serializeBuffer(buffer2, key, value, index);
        } else if (value instanceof RegExp || isRegExp(value)) {
          index = serializeRegExp(buffer2, key, value, index);
        } else {
          if (path.has(value)) {
            throw new BSONError("Cannot convert circular structure to BSON");
          }
          const nestedIsArray = Array.isArray(value);
          buffer2[index++] = nestedIsArray ? BSON_DATA_ARRAY : BSON_DATA_OBJECT;
          index += ByteUtils.encodeUTF8Into(buffer2, key, index);
          buffer2[index++] = 0;
          const nestedStartIndex = index;
          path.add(value);
          currentFrame = makeFrame(value, nestedStartIndex, null, frame2, frame2.checkKeys, frame2.ignoreUndefined);
          index += 4;
        }
      } else if (type3 === "object") {
        if (value[BSON_VERSION_SYMBOL] !== BSON_MAJOR_VERSION) {
          throw new BSONVersionError();
        }
        const tag = value[bsonType];
        if (tag === "ObjectId") {
          index = serializeObjectId(buffer2, key, value, index);
        } else if (tag === "Decimal128") {
          index = serializeDecimal128(buffer2, key, value, index);
        } else if (tag === "Long" || tag === "Timestamp") {
          index = serializeLong(buffer2, key, value, index);
        } else if (tag === "Double") {
          index = serializeDouble(buffer2, key, value, index);
        } else if (tag === "Code") {
          const codeValue = value;
          if (codeValue.scope && typeof codeValue.scope === "object") {
            buffer2[index++] = BSON_DATA_CODE_W_SCOPE;
            index += ByteUtils.encodeUTF8Into(buffer2, key, index);
            buffer2[index++] = 0;
            const codeTotalSizeIndex = index;
            index += 4;
            const functionString = codeValue.code;
            const codeSize = ByteUtils.encodeUTF8Into(buffer2, functionString, index + 4) + 1;
            NumberUtils.setInt32LE(buffer2, index, codeSize);
            buffer2[index + 4 + codeSize - 1] = 0;
            index = index + codeSize + 4;
            const scope = codeValue.scope;
            if (path.has(scope)) {
              throw new BSONError("Cannot convert circular structure to BSON");
            }
            path.add(scope);
            currentFrame = makeFrame(scope, index, codeTotalSizeIndex, frame2, frame2.checkKeys, frame2.ignoreUndefined);
            index += 4;
          } else {
            buffer2[index++] = BSON_DATA_CODE;
            index += ByteUtils.encodeUTF8Into(buffer2, key, index);
            buffer2[index++] = 0;
            const functionString = codeValue.code.toString();
            const size = ByteUtils.encodeUTF8Into(buffer2, functionString, index + 4) + 1;
            NumberUtils.setInt32LE(buffer2, index, size);
            index = index + 4 + size - 1;
            buffer2[index++] = 0;
          }
        } else if (tag === "Binary") {
          index = serializeBinary(buffer2, key, value, index);
        } else if (tag === "BSONSymbol") {
          index = serializeSymbol(buffer2, key, value, index);
        } else if (tag === "DBRef") {
          const dbref = value;
          const orderedValues = Object.assign({ $ref: dbref.collection, $id: dbref.oid }, dbref.db != null ? { $db: dbref.db } : null, dbref.fields);
          buffer2[index++] = BSON_DATA_OBJECT;
          index += ByteUtils.encodeUTF8Into(buffer2, key, index);
          buffer2[index++] = 0;
          path.add(orderedValues);
          currentFrame = makeFrame(orderedValues, index, null, frame2, false, true);
          index += 4;
        } else if (tag === "BSONRegExp") {
          index = serializeBSONRegExp(buffer2, key, value, index);
        } else if (tag === "Int32") {
          index = serializeInt32(buffer2, key, value, index);
        } else if (tag === "MinKey" || tag === "MaxKey") {
          index = serializeMinMax(buffer2, key, value, index);
        } else if (typeof value._bsontype !== "undefined") {
          throw new BSONError(`Unrecognized or invalid _bsontype: ${String(value._bsontype)}`);
        }
      } else if (type3 === "function" && serializeFunctions) {
        index = serializeFunction(buffer2, key, value, index);
      }
    }
    return index;
  }
  function isBSONType(value) {
    return value != null && typeof value === "object" && "_bsontype" in value && typeof value._bsontype === "string";
  }
  var keysToCodecs = {
    $oid: ObjectId,
    $binary: Binary,
    $uuid: Binary,
    $symbol: BSONSymbol,
    $numberInt: Int32,
    $numberDecimal: Decimal128,
    $numberDouble: Double,
    $numberLong: Long,
    $minKey: MinKey,
    $maxKey: MaxKey,
    $regex: BSONRegExp,
    $regularExpression: BSONRegExp,
    $timestamp: Timestamp
  };
  function deserializeValue(value, options = {}) {
    if (typeof value === "number") {
      const in32BitRange = value <= BSON_INT32_MAX && value >= BSON_INT32_MIN;
      const in64BitRange = value <= BSON_INT64_MAX && value >= BSON_INT64_MIN;
      if (options.relaxed || options.legacy) {
        return value;
      }
      if (Number.isInteger(value) && !Object.is(value, -0)) {
        if (in32BitRange) {
          return new Int32(value);
        }
        if (in64BitRange) {
          if (options.useBigInt64) {
            return BigInt(value);
          }
          return Long.fromNumber(value);
        }
      }
      return new Double(value);
    }
    if (value == null || typeof value !== "object")
      return value;
    if (value.$undefined)
      return null;
    const keys = Object.keys(value).filter((k) => k.startsWith("$") && value[k] != null);
    for (let i = 0; i < keys.length; i++) {
      const c = keysToCodecs[keys[i]];
      if (c)
        return c.fromExtendedJSON(value, options);
    }
    if (value.$date != null) {
      const d = value.$date;
      const date = /* @__PURE__ */ new Date();
      if (options.legacy) {
        if (typeof d === "number")
          date.setTime(d);
        else if (typeof d === "string")
          date.setTime(Date.parse(d));
        else if (typeof d === "bigint")
          date.setTime(Number(d));
        else
          throw new BSONRuntimeError(`Unrecognized type for EJSON date: ${typeof d}`);
      } else {
        if (typeof d === "string")
          date.setTime(Date.parse(d));
        else if (Long.isLong(d))
          date.setTime(d.toNumber());
        else if (typeof d === "number" && options.relaxed)
          date.setTime(d);
        else if (typeof d === "bigint")
          date.setTime(Number(d));
        else
          throw new BSONRuntimeError(`Unrecognized type for EJSON date: ${typeof d}`);
      }
      return date;
    }
    if (value.$code != null) {
      const copy2 = Object.assign({}, value);
      if (value.$scope) {
        copy2.$scope = deserializeValue(value.$scope);
      }
      return Code.fromExtendedJSON(value);
    }
    if (isDBRefLike(value) || value.$dbPointer) {
      const v = value.$ref ? value : value.$dbPointer;
      if (v instanceof DBRef)
        return v;
      const dollarKeys = Object.keys(v).filter((k) => k.startsWith("$"));
      let valid = true;
      dollarKeys.forEach((k) => {
        if (["$ref", "$id", "$db"].indexOf(k) === -1)
          valid = false;
      });
      if (valid)
        return DBRef.fromExtendedJSON(v);
    }
    return value;
  }
  function serializeArray(array, options) {
    return array.map((v, index) => {
      options.seenObjects.push({ propertyName: `index ${index}`, obj: null });
      try {
        return serializeValue(v, options);
      } finally {
        options.seenObjects.pop();
      }
    });
  }
  function getISOString(date) {
    const isoStr = date.toISOString();
    return date.getUTCMilliseconds() !== 0 ? isoStr : isoStr.slice(0, -5) + "Z";
  }
  function serializeValue(value, options) {
    if (value instanceof Map || isMap(value)) {
      const obj = /* @__PURE__ */ Object.create(null);
      for (const [k, v] of value) {
        if (typeof k !== "string") {
          throw new BSONError("Can only serialize maps with string keys");
        }
        obj[k] = v;
      }
      return serializeValue(obj, options);
    }
    if ((typeof value === "object" || typeof value === "function") && value !== null) {
      const index = options.seenObjects.findIndex((entry) => entry.obj === value);
      if (index !== -1) {
        const props = options.seenObjects.map((entry) => entry.propertyName);
        const leadingPart = props.slice(0, index).map((prop) => `${prop} -> `).join("");
        const alreadySeen = props[index];
        const circularPart = " -> " + props.slice(index + 1, props.length - 1).map((prop) => `${prop} -> `).join("");
        const current = props[props.length - 1];
        const leadingSpace = " ".repeat(leadingPart.length + alreadySeen.length / 2);
        const dashes = "-".repeat(circularPart.length + (alreadySeen.length + current.length) / 2 - 1);
        throw new BSONError(`Converting circular structure to EJSON:
    ${leadingPart}${alreadySeen}${circularPart}${current}
    ${leadingSpace}\\${dashes}/`);
      }
      options.seenObjects[options.seenObjects.length - 1].obj = value;
    }
    if (Array.isArray(value))
      return serializeArray(value, options);
    if (value === void 0)
      return options.ignoreUndefined ? void 0 : null;
    if (value instanceof Date || isDate(value)) {
      const dateNum = value.getTime(), inRange = dateNum > -1 && dateNum < 2534023008e5;
      if (options.legacy) {
        return options.relaxed && inRange ? { $date: value.getTime() } : { $date: getISOString(value) };
      }
      return options.relaxed && inRange ? { $date: getISOString(value) } : { $date: { $numberLong: value.getTime().toString() } };
    }
    if (typeof value === "number" && (!options.relaxed || !isFinite(value))) {
      if (Number.isInteger(value) && !Object.is(value, -0)) {
        if (value >= BSON_INT32_MIN && value <= BSON_INT32_MAX) {
          return { $numberInt: value.toString() };
        }
        if (value >= BSON_INT64_MIN && value <= BSON_INT64_MAX) {
          return { $numberLong: value.toString() };
        }
      }
      return { $numberDouble: Object.is(value, -0) ? "-0.0" : value.toString() };
    }
    if (typeof value === "bigint") {
      if (!options.relaxed) {
        return { $numberLong: BigInt.asIntN(64, value).toString() };
      }
      return Number(BigInt.asIntN(64, value));
    }
    if (value instanceof RegExp || isRegExp(value)) {
      let flags = value.flags;
      if (flags === void 0) {
        const match = value.toString().match(/[gimuy]*$/);
        if (match) {
          flags = match[0];
        }
      }
      const rx = new BSONRegExp(value.source, flags);
      return rx.toExtendedJSON(options);
    }
    if (value != null && typeof value === "object")
      return serializeDocument(value, options);
    return value;
  }
  var BSON_TYPE_MAPPINGS = {
    Binary: (o) => new Binary(o.value(), o.sub_type),
    Code: (o) => new Code(o.code, o.scope),
    DBRef: (o) => new DBRef(o.collection || o.namespace, o.oid, o.db, o.fields),
    Decimal128: (o) => new Decimal128(o.bytes),
    Double: (o) => new Double(o.value),
    Int32: (o) => new Int32(o.value),
    Long: (o) => Long.fromBits(o.low != null ? o.low : o.low_, o.low != null ? o.high : o.high_, o.low != null ? o.unsigned : o.unsigned_),
    MaxKey: () => new MaxKey(),
    MinKey: () => new MinKey(),
    ObjectId: (o) => new ObjectId(o),
    BSONRegExp: (o) => new BSONRegExp(o.pattern, o.options),
    BSONSymbol: (o) => new BSONSymbol(o.value),
    Timestamp: (o) => Timestamp.fromBits(o.low, o.high)
  };
  function serializeDocument(doc3, options) {
    if (doc3 == null || typeof doc3 !== "object")
      throw new BSONError("not an object instance");
    const bsontype = doc3._bsontype;
    if (typeof bsontype === "undefined") {
      const _doc = {};
      for (const name of Object.keys(doc3)) {
        options.seenObjects.push({ propertyName: name, obj: null });
        try {
          const value = serializeValue(doc3[name], options);
          if (name === "__proto__") {
            Object.defineProperty(_doc, name, {
              value,
              writable: true,
              enumerable: true,
              configurable: true
            });
          } else {
            _doc[name] = value;
          }
        } finally {
          options.seenObjects.pop();
        }
      }
      return _doc;
    } else if (doc3 != null && typeof doc3 === "object" && typeof doc3._bsontype === "string" && doc3[BSON_VERSION_SYMBOL] !== BSON_MAJOR_VERSION) {
      throw new BSONVersionError();
    } else if (isBSONType(doc3)) {
      let outDoc = doc3;
      if (typeof outDoc.toExtendedJSON !== "function") {
        const mapper = BSON_TYPE_MAPPINGS[doc3._bsontype];
        if (!mapper) {
          throw new BSONError("Unrecognized or invalid _bsontype: " + doc3._bsontype);
        }
        outDoc = mapper(outDoc);
      }
      if (bsontype === "Code" && outDoc.scope) {
        outDoc = new Code(outDoc.code, serializeValue(outDoc.scope, options));
      } else if (bsontype === "DBRef" && outDoc.oid) {
        outDoc = new DBRef(serializeValue(outDoc.collection, options), serializeValue(outDoc.oid, options), serializeValue(outDoc.db, options), serializeValue(outDoc.fields, options));
      }
      return outDoc.toExtendedJSON(options);
    } else {
      throw new BSONError("_bsontype must be a string, but was: " + typeof bsontype);
    }
  }
  function parse(text, options) {
    const ejsonOptions = {
      useBigInt64: options?.useBigInt64 ?? false,
      relaxed: options?.relaxed ?? true,
      legacy: options?.legacy ?? false
    };
    return JSON.parse(text, (key, value) => {
      if (key.indexOf("\0") !== -1) {
        throw new BSONError(`BSON Document field names cannot contain null bytes, found: ${JSON.stringify(key)}`);
      }
      return deserializeValue(value, ejsonOptions);
    });
  }
  function stringify(value, replacerOrOptions, spaceOrOptions, options) {
    if (spaceOrOptions != null && typeof spaceOrOptions === "object") {
      options = spaceOrOptions;
      spaceOrOptions = void 0;
    }
    if (replacerOrOptions != null && typeof replacerOrOptions === "object" && !Array.isArray(replacerOrOptions)) {
      options = replacerOrOptions;
      replacerOrOptions = void 0;
    }
    const serializeOptions = Object.assign({ relaxed: true, legacy: false }, options, {
      seenObjects: [{ propertyName: "(root)", obj: null }]
    });
    const doc3 = serializeValue(value, serializeOptions);
    return JSON.stringify(doc3, replacerOrOptions, spaceOrOptions);
  }
  function EJSONserialize(value, options) {
    options = options || {};
    return JSON.parse(stringify(value, options));
  }
  function EJSONdeserialize(ejson, options) {
    options = options || {};
    return parse(JSON.stringify(ejson), options);
  }
  var EJSON = /* @__PURE__ */ Object.create(null);
  EJSON.parse = parse;
  EJSON.stringify = stringify;
  EJSON.serialize = EJSONserialize;
  EJSON.deserialize = EJSONdeserialize;
  Object.freeze(EJSON);
  var BSONElementType = {
    double: 1,
    string: 2,
    object: 3,
    array: 4,
    binData: 5,
    undefined: 6,
    objectId: 7,
    bool: 8,
    date: 9,
    null: 10,
    regex: 11,
    dbPointer: 12,
    javascript: 13,
    symbol: 14,
    javascriptWithScope: 15,
    int: 16,
    timestamp: 17,
    long: 18,
    decimal: 19,
    minKey: 255,
    maxKey: 127
  };
  function getSize(source, offset) {
    try {
      return NumberUtils.getNonnegativeInt32LE(source, offset);
    } catch (cause) {
      throw new BSONOffsetError("BSON size cannot be negative", offset, { cause });
    }
  }
  function findNull(bytes, offset) {
    let nullTerminatorOffset = offset;
    for (; bytes[nullTerminatorOffset] !== 0; nullTerminatorOffset++)
      ;
    if (nullTerminatorOffset === bytes.length - 1) {
      throw new BSONOffsetError("Null terminator not found", offset);
    }
    return nullTerminatorOffset;
  }
  function parseToElements(bytes, startOffset = 0) {
    startOffset ??= 0;
    if (bytes.length < 5) {
      throw new BSONOffsetError(`Input must be at least 5 bytes, got ${bytes.length} bytes`, startOffset);
    }
    const documentSize = getSize(bytes, startOffset);
    if (documentSize > bytes.length - startOffset) {
      throw new BSONOffsetError(`Parsed documentSize (${documentSize} bytes) does not match input length (${bytes.length} bytes)`, startOffset);
    }
    if (bytes[startOffset + documentSize - 1] !== 0) {
      throw new BSONOffsetError("BSON documents must end in 0x00", startOffset + documentSize);
    }
    const elements = [];
    let offset = startOffset + 4;
    while (offset <= documentSize + startOffset) {
      const type3 = bytes[offset];
      offset += 1;
      if (type3 === 0) {
        if (offset - startOffset !== documentSize) {
          throw new BSONOffsetError(`Invalid 0x00 type byte`, offset);
        }
        break;
      }
      const nameOffset = offset;
      const nameLength = findNull(bytes, offset) - nameOffset;
      offset += nameLength + 1;
      let length;
      if (type3 === BSONElementType.double || type3 === BSONElementType.long || type3 === BSONElementType.date || type3 === BSONElementType.timestamp) {
        length = 8;
      } else if (type3 === BSONElementType.int) {
        length = 4;
      } else if (type3 === BSONElementType.objectId) {
        length = 12;
      } else if (type3 === BSONElementType.decimal) {
        length = 16;
      } else if (type3 === BSONElementType.bool) {
        length = 1;
      } else if (type3 === BSONElementType.null || type3 === BSONElementType.undefined || type3 === BSONElementType.maxKey || type3 === BSONElementType.minKey) {
        length = 0;
      } else if (type3 === BSONElementType.regex) {
        length = findNull(bytes, findNull(bytes, offset) + 1) + 1 - offset;
      } else if (type3 === BSONElementType.object || type3 === BSONElementType.array || type3 === BSONElementType.javascriptWithScope) {
        length = getSize(bytes, offset);
      } else if (type3 === BSONElementType.string || type3 === BSONElementType.binData || type3 === BSONElementType.dbPointer || type3 === BSONElementType.javascript || type3 === BSONElementType.symbol) {
        length = getSize(bytes, offset) + 4;
        if (type3 === BSONElementType.binData) {
          length += 1;
        }
        if (type3 === BSONElementType.dbPointer) {
          length += 12;
        }
      } else {
        throw new BSONOffsetError(`Invalid 0x${type3.toString(16).padStart(2, "0")} type byte`, offset);
      }
      if (length > documentSize) {
        throw new BSONOffsetError("value reports length larger than document", offset);
      }
      elements.push([type3, nameOffset, nameLength, offset, length]);
      offset += length;
    }
    return elements;
  }
  var onDemand = /* @__PURE__ */ Object.create(null);
  onDemand.parseToElements = parseToElements;
  onDemand.ByteUtils = ByteUtils;
  onDemand.NumberUtils = NumberUtils;
  Object.freeze(onDemand);
  var MAXSIZE = 1024 * 1024 * 17;
  var buffer = ByteUtils.allocate(MAXSIZE);
  function serialize(object, options = {}) {
    const checkKeys = typeof options.checkKeys === "boolean" ? options.checkKeys : false;
    const serializeFunctions = typeof options.serializeFunctions === "boolean" ? options.serializeFunctions : false;
    const ignoreUndefined = typeof options.ignoreUndefined === "boolean" ? options.ignoreUndefined : true;
    const minInternalBufferSize = typeof options.minInternalBufferSize === "number" ? options.minInternalBufferSize : MAXSIZE;
    if (buffer.length < minInternalBufferSize) {
      buffer = ByteUtils.allocate(minInternalBufferSize);
    }
    const serializationIndex = serializeInto(buffer, object, checkKeys, 0, serializeFunctions, ignoreUndefined, null);
    const finishedBuffer = ByteUtils.allocateUnsafe(serializationIndex);
    finishedBuffer.set(buffer.subarray(0, serializationIndex), 0);
    return finishedBuffer;
  }
  function deserialize(buffer2, options = {}) {
    return internalDeserialize(ByteUtils.toLocalBufferType(buffer2), options);
  }

  // src/browser/shims.ts
  function assert(value, message) {
    if (!value) throw new Error(message ?? "Assertion failed");
  }
  assert.equal = (actual, expected) => {
    if (!Object.is(actual, expected)) throw new Error("Values are not equal");
  };
  var shims_default = assert;

  // src/generated/id_list_saved_state.js
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

  // ../node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js
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
    isRegExp: () => isRegExp22,
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
  function isRegExp2(obj) {
    return Object.prototype.toString.call(obj) === "[object RegExp]";
  }
  __name(isRegExp2, "isRegExp");
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
    if (isRegExp2(errMatcher)) {
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
    if (!types.some(function(expected) {
      return objType === expected;
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
    const split3 = stringRepresentation.split("T");
    const date = split3[0];
    return options.stylize(`${date}T${truncate(split3[1], options.truncate - date.length - 1)}`, "date");
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
    let expected = args[3];
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
      return objDisplay(expected);
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
      const regexp2 = /^\[(\d+)\]$/;
      const mArr = regexp2.exec(value);
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
    assert(_expr, msg, _negateMsg, expected, _actual, showDiff) {
      const ok = test(this, arguments);
      if (false !== showDiff) showDiff = true;
      if (void 0 === expected && void 0 === _actual) showDiff = false;
      if (true !== config.showDiff) showDiff = false;
      if (!ok) {
        msg = getMessage2(this, arguments);
        const actual = getActual(this, arguments);
        const assertionErrorObjectProperties = {
          actual,
          expected,
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
    let expected = args[3];
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
    let isObject = isObjectType(expected);
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
  function isRegExp22(obj) {
    return Object.prototype.toString.call(obj) === "[object RegExp]";
  }
  __name(isRegExp22, "isRegExp");
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
    let len = keys.length, any = flag2(this, "any"), all = flag2(this, "all"), expected = keys, isEql = isDeep ? flag2(this, "eql") : (val1, val2) => val1 === val2;
    if (!any && !all) {
      all = true;
    }
    if (any) {
      ok = expected.some(function(expectedKey) {
        return actual.some(function(actualKey) {
          return isEql(expectedKey, actualKey);
        });
      });
    }
    if (all) {
      ok = expected.every(function(expectedKey) {
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
      expected.slice(0).sort(compareByInspect),
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
    if (isRegExp22(errorLike) || typeof errorLike === "string") {
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
      if (isRegExp22(errMsgMatcher)) {
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
  function closeTo(expected, delta, msg) {
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
    if (expected == void 0) {
      throw new AssertionError(
        flagMsg ? `${flagMsg}: ${message}` : message,
        void 0,
        ssfi
      );
    }
    new Assertion(expected, flagMsg, ssfi, true).is.numeric;
    const abs = /* @__PURE__ */ __name((x) => x < 0 ? -x : x, "abs");
    const strip = /* @__PURE__ */ __name((number) => parseFloat(parseFloat(number).toPrecision(12)), "strip");
    this.assert(
      strip(abs(obj - expected)) <= delta,
      "expected #{this} to be close to " + expected + " +/- " + delta,
      "expected #{this} not to be close to " + expected + " +/- " + delta
    );
  }
  __name(closeTo, "closeTo");
  Assertion.addMethod("closeTo", closeTo);
  Assertion.addMethod("approximately", closeTo);
  function isSubsetOf(_subset, _superset, cmp2, contains, ordered) {
    let superset = Array.from(_superset);
    let subset = Array.from(_subset);
    if (!contains) {
      if (subset.length !== superset.length) return false;
      superset = superset.slice();
    }
    return subset.every(function(elem, idx) {
      if (ordered) return cmp2 ? cmp2(elem, superset[idx]) : elem === superset[idx];
      if (!cmp2) {
        let matchIdx = superset.indexOf(elem);
        if (matchIdx === -1) return false;
        if (!contains) superset.splice(matchIdx, 1);
        return true;
      }
      return superset.some(function(elem2, matchIdx) {
        if (!cmp2(elem, elem2)) return false;
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
    let cmp2 = flag2(this, "deep") ? flag2(this, "eql") : void 0;
    this.assert(
      isSubsetOf(subset, obj, cmp2, contains, ordered),
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
    let expected = flag2(this, "object"), flagMsg = flag2(this, "message"), ssfi = flag2(this, "ssfi"), contains = flag2(this, "contains"), isDeep = flag2(this, "deep"), eql = flag2(this, "eql");
    new Assertion(list, flagMsg, ssfi, true).to.be.an("array");
    if (contains) {
      this.assert(
        list.some(function(possibility) {
          return expected.indexOf(possibility) > -1;
        }),
        "expected #{this} to contain one of #{exp}",
        "expected #{this} to not contain one of #{exp}",
        list,
        expected
      );
    } else {
      if (isDeep) {
        this.assert(
          list.some(function(possibility) {
            return eql(expected, possibility);
          }),
          "expected #{this} to deeply equal one of #{exp}",
          "expected #{this} to deeply equal one of #{exp}",
          list,
          expected
        );
      } else {
        this.assert(
          list.indexOf(expected) > -1,
          "expected #{this} to be one of #{exp}",
          "expected #{this} to not be one of #{exp}",
          list,
          expected
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
  function compareSubset(expected, actual) {
    if (expected === actual) {
      return true;
    }
    if (typeof actual !== typeof expected) {
      return false;
    }
    if (typeof expected !== "object" || expected === null) {
      return expected === actual;
    }
    if (!actual) {
      return false;
    }
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        return false;
      }
      return expected.every(function(exp) {
        return actual.some(function(act) {
          return compareSubset(exp, act);
        });
      });
    }
    if (expected instanceof Date) {
      if (actual instanceof Date) {
        return expected.getTime() === actual.getTime();
      } else {
        return false;
      }
    }
    return Object.keys(expected).every(function(key) {
      let expectedValue = expected[key];
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
  Assertion.addMethod("containSubset", function(expected) {
    const actual = flag(this, "object");
    const showDiff = config.showDiff;
    this.assert(
      compareSubset(expected, actual),
      "expected #{act} to contain subset #{exp}",
      "expected #{act} to not contain subset #{exp}",
      expected,
      actual,
      showDiff
    );
  });
  function expect(val, message) {
    return new Assertion(val, message);
  }
  __name(expect, "expect");
  expect.fail = function(actual, expected, message, operator) {
    if (arguments.length < 2) {
      message = actual;
      actual = void 0;
    }
    message = message || "expect.fail()";
    throw new AssertionError(
      message,
      {
        actual,
        expected,
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
    should2.fail = function(actual, expected, message, operator) {
      if (arguments.length < 2) {
        message = actual;
        actual = void 0;
      }
      message = message || "should.fail()";
      throw new AssertionError(
        message,
        {
          actual,
          expected,
          operator
        },
        should2.fail
      );
    };
    should2.equal = function(actual, expected, message) {
      new Assertion(actual, message).to.equal(expected);
    };
    should2.Throw = function(fn, errt, errs, msg) {
      new Assertion(fn, msg).to.Throw(errt, errs);
    };
    should2.exist = function(val, msg) {
      new Assertion(val, msg).to.exist;
    };
    should2.not = {};
    should2.not.equal = function(actual, expected, msg) {
      new Assertion(actual, msg).to.not.equal(expected);
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
  function assert2(express, errmsg) {
    let test2 = new Assertion(null, null, assert2, true);
    test2.assert(express, errmsg, "[ negation message unavailable ]");
  }
  __name(assert2, "assert");
  assert2.fail = function(actual, expected, message, operator) {
    if (arguments.length < 2) {
      message = actual;
      actual = void 0;
    }
    message = message || "assert.fail()";
    throw new AssertionError(
      message,
      {
        actual,
        expected,
        operator
      },
      assert2.fail
    );
  };
  assert2.isOk = function(val, msg) {
    new Assertion(val, msg, assert2.isOk, true).is.ok;
  };
  assert2.isNotOk = function(val, msg) {
    new Assertion(val, msg, assert2.isNotOk, true).is.not.ok;
  };
  assert2.equal = function(act, exp, msg) {
    let test2 = new Assertion(act, msg, assert2.equal, true);
    test2.assert(
      exp == flag(test2, "object"),
      "expected #{this} to equal #{exp}",
      "expected #{this} to not equal #{act}",
      exp,
      act,
      true
    );
  };
  assert2.notEqual = function(act, exp, msg) {
    let test2 = new Assertion(act, msg, assert2.notEqual, true);
    test2.assert(
      exp != flag(test2, "object"),
      "expected #{this} to not equal #{exp}",
      "expected #{this} to equal #{act}",
      exp,
      act,
      true
    );
  };
  assert2.strictEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert2.strictEqual, true).to.equal(exp);
  };
  assert2.notStrictEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert2.notStrictEqual, true).to.not.equal(exp);
  };
  assert2.deepEqual = assert2.deepStrictEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert2.deepEqual, true).to.eql(exp);
  };
  assert2.notDeepEqual = function(act, exp, msg) {
    new Assertion(act, msg, assert2.notDeepEqual, true).to.not.eql(exp);
  };
  assert2.isAbove = function(val, abv, msg) {
    new Assertion(val, msg, assert2.isAbove, true).to.be.above(abv);
  };
  assert2.isAtLeast = function(val, atlst, msg) {
    new Assertion(val, msg, assert2.isAtLeast, true).to.be.least(atlst);
  };
  assert2.isBelow = function(val, blw, msg) {
    new Assertion(val, msg, assert2.isBelow, true).to.be.below(blw);
  };
  assert2.isAtMost = function(val, atmst, msg) {
    new Assertion(val, msg, assert2.isAtMost, true).to.be.most(atmst);
  };
  assert2.isTrue = function(val, msg) {
    new Assertion(val, msg, assert2.isTrue, true).is["true"];
  };
  assert2.isNotTrue = function(val, msg) {
    new Assertion(val, msg, assert2.isNotTrue, true).to.not.equal(true);
  };
  assert2.isFalse = function(val, msg) {
    new Assertion(val, msg, assert2.isFalse, true).is["false"];
  };
  assert2.isNotFalse = function(val, msg) {
    new Assertion(val, msg, assert2.isNotFalse, true).to.not.equal(false);
  };
  assert2.isNull = function(val, msg) {
    new Assertion(val, msg, assert2.isNull, true).to.equal(null);
  };
  assert2.isNotNull = function(val, msg) {
    new Assertion(val, msg, assert2.isNotNull, true).to.not.equal(null);
  };
  assert2.isNaN = function(val, msg) {
    new Assertion(val, msg, assert2.isNaN, true).to.be.NaN;
  };
  assert2.isNotNaN = function(value, message) {
    new Assertion(value, message, assert2.isNotNaN, true).not.to.be.NaN;
  };
  assert2.exists = function(val, msg) {
    new Assertion(val, msg, assert2.exists, true).to.exist;
  };
  assert2.notExists = function(val, msg) {
    new Assertion(val, msg, assert2.notExists, true).to.not.exist;
  };
  assert2.isUndefined = function(val, msg) {
    new Assertion(val, msg, assert2.isUndefined, true).to.equal(void 0);
  };
  assert2.isDefined = function(val, msg) {
    new Assertion(val, msg, assert2.isDefined, true).to.not.equal(void 0);
  };
  assert2.isCallable = function(value, message) {
    new Assertion(value, message, assert2.isCallable, true).is.callable;
  };
  assert2.isNotCallable = function(value, message) {
    new Assertion(value, message, assert2.isNotCallable, true).is.not.callable;
  };
  assert2.isObject = function(val, msg) {
    new Assertion(val, msg, assert2.isObject, true).to.be.a("object");
  };
  assert2.isNotObject = function(val, msg) {
    new Assertion(val, msg, assert2.isNotObject, true).to.not.be.a("object");
  };
  assert2.isArray = function(val, msg) {
    new Assertion(val, msg, assert2.isArray, true).to.be.an("array");
  };
  assert2.isNotArray = function(val, msg) {
    new Assertion(val, msg, assert2.isNotArray, true).to.not.be.an("array");
  };
  assert2.isString = function(val, msg) {
    new Assertion(val, msg, assert2.isString, true).to.be.a("string");
  };
  assert2.isNotString = function(val, msg) {
    new Assertion(val, msg, assert2.isNotString, true).to.not.be.a("string");
  };
  assert2.isNumber = function(val, msg) {
    new Assertion(val, msg, assert2.isNumber, true).to.be.a("number");
  };
  assert2.isNotNumber = function(val, msg) {
    new Assertion(val, msg, assert2.isNotNumber, true).to.not.be.a("number");
  };
  assert2.isNumeric = function(val, msg) {
    new Assertion(val, msg, assert2.isNumeric, true).is.numeric;
  };
  assert2.isNotNumeric = function(val, msg) {
    new Assertion(val, msg, assert2.isNotNumeric, true).is.not.numeric;
  };
  assert2.isFinite = function(val, msg) {
    new Assertion(val, msg, assert2.isFinite, true).to.be.finite;
  };
  assert2.isBoolean = function(val, msg) {
    new Assertion(val, msg, assert2.isBoolean, true).to.be.a("boolean");
  };
  assert2.isNotBoolean = function(val, msg) {
    new Assertion(val, msg, assert2.isNotBoolean, true).to.not.be.a("boolean");
  };
  assert2.typeOf = function(val, type3, msg) {
    new Assertion(val, msg, assert2.typeOf, true).to.be.a(type3);
  };
  assert2.notTypeOf = function(value, type3, message) {
    new Assertion(value, message, assert2.notTypeOf, true).to.not.be.a(type3);
  };
  assert2.instanceOf = function(val, type3, msg) {
    new Assertion(val, msg, assert2.instanceOf, true).to.be.instanceOf(type3);
  };
  assert2.notInstanceOf = function(val, type3, msg) {
    new Assertion(val, msg, assert2.notInstanceOf, true).to.not.be.instanceOf(
      type3
    );
  };
  assert2.include = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.include, true).include(inc);
  };
  assert2.notInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.notInclude, true).not.include(inc);
  };
  assert2.deepInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.deepInclude, true).deep.include(inc);
  };
  assert2.notDeepInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.notDeepInclude, true).not.deep.include(inc);
  };
  assert2.nestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.nestedInclude, true).nested.include(inc);
  };
  assert2.notNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.notNestedInclude, true).not.nested.include(
      inc
    );
  };
  assert2.deepNestedInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.deepNestedInclude, true).deep.nested.include(
      inc
    );
  };
  assert2.notDeepNestedInclude = function(exp, inc, msg) {
    new Assertion(
      exp,
      msg,
      assert2.notDeepNestedInclude,
      true
    ).not.deep.nested.include(inc);
  };
  assert2.ownInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.ownInclude, true).own.include(inc);
  };
  assert2.notOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.notOwnInclude, true).not.own.include(inc);
  };
  assert2.deepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.deepOwnInclude, true).deep.own.include(inc);
  };
  assert2.notDeepOwnInclude = function(exp, inc, msg) {
    new Assertion(exp, msg, assert2.notDeepOwnInclude, true).not.deep.own.include(
      inc
    );
  };
  assert2.match = function(exp, re, msg) {
    new Assertion(exp, msg, assert2.match, true).to.match(re);
  };
  assert2.notMatch = function(exp, re, msg) {
    new Assertion(exp, msg, assert2.notMatch, true).to.not.match(re);
  };
  assert2.property = function(obj, prop, msg) {
    new Assertion(obj, msg, assert2.property, true).to.have.property(prop);
  };
  assert2.notProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert2.notProperty, true).to.not.have.property(prop);
  };
  assert2.propertyVal = function(obj, prop, val, msg) {
    new Assertion(obj, msg, assert2.propertyVal, true).to.have.property(prop, val);
  };
  assert2.notPropertyVal = function(obj, prop, val, msg) {
    new Assertion(obj, msg, assert2.notPropertyVal, true).to.not.have.property(
      prop,
      val
    );
  };
  assert2.deepPropertyVal = function(obj, prop, val, msg) {
    new Assertion(obj, msg, assert2.deepPropertyVal, true).to.have.deep.property(
      prop,
      val
    );
  };
  assert2.notDeepPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert2.notDeepPropertyVal,
      true
    ).to.not.have.deep.property(prop, val);
  };
  assert2.ownProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert2.ownProperty, true).to.have.own.property(prop);
  };
  assert2.notOwnProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert2.notOwnProperty, true).to.not.have.own.property(
      prop
    );
  };
  assert2.ownPropertyVal = function(obj, prop, value, msg) {
    new Assertion(obj, msg, assert2.ownPropertyVal, true).to.have.own.property(
      prop,
      value
    );
  };
  assert2.notOwnPropertyVal = function(obj, prop, value, msg) {
    new Assertion(
      obj,
      msg,
      assert2.notOwnPropertyVal,
      true
    ).to.not.have.own.property(prop, value);
  };
  assert2.deepOwnPropertyVal = function(obj, prop, value, msg) {
    new Assertion(
      obj,
      msg,
      assert2.deepOwnPropertyVal,
      true
    ).to.have.deep.own.property(prop, value);
  };
  assert2.notDeepOwnPropertyVal = function(obj, prop, value, msg) {
    new Assertion(
      obj,
      msg,
      assert2.notDeepOwnPropertyVal,
      true
    ).to.not.have.deep.own.property(prop, value);
  };
  assert2.nestedProperty = function(obj, prop, msg) {
    new Assertion(obj, msg, assert2.nestedProperty, true).to.have.nested.property(
      prop
    );
  };
  assert2.notNestedProperty = function(obj, prop, msg) {
    new Assertion(
      obj,
      msg,
      assert2.notNestedProperty,
      true
    ).to.not.have.nested.property(prop);
  };
  assert2.nestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert2.nestedPropertyVal,
      true
    ).to.have.nested.property(prop, val);
  };
  assert2.notNestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert2.notNestedPropertyVal,
      true
    ).to.not.have.nested.property(prop, val);
  };
  assert2.deepNestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert2.deepNestedPropertyVal,
      true
    ).to.have.deep.nested.property(prop, val);
  };
  assert2.notDeepNestedPropertyVal = function(obj, prop, val, msg) {
    new Assertion(
      obj,
      msg,
      assert2.notDeepNestedPropertyVal,
      true
    ).to.not.have.deep.nested.property(prop, val);
  };
  assert2.lengthOf = function(exp, len, msg) {
    new Assertion(exp, msg, assert2.lengthOf, true).to.have.lengthOf(len);
  };
  assert2.hasAnyKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.hasAnyKeys, true).to.have.any.keys(keys);
  };
  assert2.hasAllKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.hasAllKeys, true).to.have.all.keys(keys);
  };
  assert2.containsAllKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.containsAllKeys, true).to.contain.all.keys(
      keys
    );
  };
  assert2.doesNotHaveAnyKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.doesNotHaveAnyKeys, true).to.not.have.any.keys(
      keys
    );
  };
  assert2.doesNotHaveAllKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.doesNotHaveAllKeys, true).to.not.have.all.keys(
      keys
    );
  };
  assert2.hasAnyDeepKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.hasAnyDeepKeys, true).to.have.any.deep.keys(
      keys
    );
  };
  assert2.hasAllDeepKeys = function(obj, keys, msg) {
    new Assertion(obj, msg, assert2.hasAllDeepKeys, true).to.have.all.deep.keys(
      keys
    );
  };
  assert2.containsAllDeepKeys = function(obj, keys, msg) {
    new Assertion(
      obj,
      msg,
      assert2.containsAllDeepKeys,
      true
    ).to.contain.all.deep.keys(keys);
  };
  assert2.doesNotHaveAnyDeepKeys = function(obj, keys, msg) {
    new Assertion(
      obj,
      msg,
      assert2.doesNotHaveAnyDeepKeys,
      true
    ).to.not.have.any.deep.keys(keys);
  };
  assert2.doesNotHaveAllDeepKeys = function(obj, keys, msg) {
    new Assertion(
      obj,
      msg,
      assert2.doesNotHaveAllDeepKeys,
      true
    ).to.not.have.all.deep.keys(keys);
  };
  assert2.throws = function(fn, errorLike, errMsgMatcher, msg) {
    if ("string" === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }
    let assertErr = new Assertion(fn, msg, assert2.throws, true).to.throw(
      errorLike,
      errMsgMatcher
    );
    return flag(assertErr, "object");
  };
  assert2.doesNotThrow = function(fn, errorLike, errMsgMatcher, message) {
    if ("string" === typeof errorLike || errorLike instanceof RegExp) {
      errMsgMatcher = errorLike;
      errorLike = null;
    }
    new Assertion(fn, message, assert2.doesNotThrow, true).to.not.throw(
      errorLike,
      errMsgMatcher
    );
  };
  assert2.operator = function(val, operator, val2, msg) {
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
          assert2.operator
        );
    }
    let test2 = new Assertion(ok, msg, assert2.operator, true);
    test2.assert(
      true === flag(test2, "object"),
      "expected " + inspect2(val) + " to be " + operator + " " + inspect2(val2),
      "expected " + inspect2(val) + " to not be " + operator + " " + inspect2(val2)
    );
  };
  assert2.closeTo = function(act, exp, delta, msg) {
    new Assertion(act, msg, assert2.closeTo, true).to.be.closeTo(exp, delta);
  };
  assert2.approximately = function(act, exp, delta, msg) {
    new Assertion(act, msg, assert2.approximately, true).to.be.approximately(
      exp,
      delta
    );
  };
  assert2.sameMembers = function(set1, set2, msg) {
    new Assertion(set1, msg, assert2.sameMembers, true).to.have.same.members(set2);
  };
  assert2.notSameMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.notSameMembers,
      true
    ).to.not.have.same.members(set2);
  };
  assert2.sameDeepMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.sameDeepMembers,
      true
    ).to.have.same.deep.members(set2);
  };
  assert2.notSameDeepMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.notSameDeepMembers,
      true
    ).to.not.have.same.deep.members(set2);
  };
  assert2.sameOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.sameOrderedMembers,
      true
    ).to.have.same.ordered.members(set2);
  };
  assert2.notSameOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.notSameOrderedMembers,
      true
    ).to.not.have.same.ordered.members(set2);
  };
  assert2.sameDeepOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.sameDeepOrderedMembers,
      true
    ).to.have.same.deep.ordered.members(set2);
  };
  assert2.notSameDeepOrderedMembers = function(set1, set2, msg) {
    new Assertion(
      set1,
      msg,
      assert2.notSameDeepOrderedMembers,
      true
    ).to.not.have.same.deep.ordered.members(set2);
  };
  assert2.includeMembers = function(superset, subset, msg) {
    new Assertion(superset, msg, assert2.includeMembers, true).to.include.members(
      subset
    );
  };
  assert2.notIncludeMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.notIncludeMembers,
      true
    ).to.not.include.members(subset);
  };
  assert2.includeDeepMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.includeDeepMembers,
      true
    ).to.include.deep.members(subset);
  };
  assert2.notIncludeDeepMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.notIncludeDeepMembers,
      true
    ).to.not.include.deep.members(subset);
  };
  assert2.includeOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.includeOrderedMembers,
      true
    ).to.include.ordered.members(subset);
  };
  assert2.notIncludeOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.notIncludeOrderedMembers,
      true
    ).to.not.include.ordered.members(subset);
  };
  assert2.includeDeepOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.includeDeepOrderedMembers,
      true
    ).to.include.deep.ordered.members(subset);
  };
  assert2.notIncludeDeepOrderedMembers = function(superset, subset, msg) {
    new Assertion(
      superset,
      msg,
      assert2.notIncludeDeepOrderedMembers,
      true
    ).to.not.include.deep.ordered.members(subset);
  };
  assert2.oneOf = function(inList, list, msg) {
    new Assertion(inList, msg, assert2.oneOf, true).to.be.oneOf(list);
  };
  assert2.isIterable = function(obj, msg) {
    if (obj == void 0 || !obj[Symbol.iterator]) {
      msg = msg ? `${msg} expected ${inspect2(obj)} to be an iterable` : `expected ${inspect2(obj)} to be an iterable`;
      throw new AssertionError(msg, void 0, assert2.isIterable);
    }
  };
  assert2.changes = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.changes, true).to.change(obj, prop);
  };
  assert2.changesBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.changesBy, true).to.change(obj, prop).by(delta);
  };
  assert2.doesNotChange = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert2.doesNotChange, true).to.not.change(
      obj,
      prop
    );
  };
  assert2.changesButNotBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.changesButNotBy, true).to.change(obj, prop).but.not.by(delta);
  };
  assert2.increases = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert2.increases, true).to.increase(obj, prop);
  };
  assert2.increasesBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.increasesBy, true).to.increase(obj, prop).by(delta);
  };
  assert2.doesNotIncrease = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert2.doesNotIncrease, true).to.not.increase(
      obj,
      prop
    );
  };
  assert2.increasesButNotBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.increasesButNotBy, true).to.increase(obj, prop).but.not.by(delta);
  };
  assert2.decreases = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert2.decreases, true).to.decrease(obj, prop);
  };
  assert2.decreasesBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.decreasesBy, true).to.decrease(obj, prop).by(delta);
  };
  assert2.doesNotDecrease = function(fn, obj, prop, msg) {
    if (arguments.length === 3 && typeof obj === "function") {
      msg = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert2.doesNotDecrease, true).to.not.decrease(
      obj,
      prop
    );
  };
  assert2.doesNotDecreaseBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    return new Assertion(fn, msg, assert2.doesNotDecreaseBy, true).to.not.decrease(obj, prop).by(delta);
  };
  assert2.decreasesButNotBy = function(fn, obj, prop, delta, msg) {
    if (arguments.length === 4 && typeof obj === "function") {
      let tmpMsg = delta;
      delta = prop;
      msg = tmpMsg;
    } else if (arguments.length === 3) {
      delta = prop;
      prop = null;
    }
    new Assertion(fn, msg, assert2.decreasesButNotBy, true).to.decrease(obj, prop).but.not.by(delta);
  };
  assert2.ifError = function(val) {
    if (val) {
      throw val;
    }
  };
  assert2.isExtensible = function(obj, msg) {
    new Assertion(obj, msg, assert2.isExtensible, true).to.be.extensible;
  };
  assert2.isNotExtensible = function(obj, msg) {
    new Assertion(obj, msg, assert2.isNotExtensible, true).to.not.be.extensible;
  };
  assert2.isSealed = function(obj, msg) {
    new Assertion(obj, msg, assert2.isSealed, true).to.be.sealed;
  };
  assert2.isNotSealed = function(obj, msg) {
    new Assertion(obj, msg, assert2.isNotSealed, true).to.not.be.sealed;
  };
  assert2.isFrozen = function(obj, msg) {
    new Assertion(obj, msg, assert2.isFrozen, true).to.be.frozen;
  };
  assert2.isNotFrozen = function(obj, msg) {
    new Assertion(obj, msg, assert2.isNotFrozen, true).to.not.be.frozen;
  };
  assert2.isEmpty = function(val, msg) {
    new Assertion(val, msg, assert2.isEmpty, true).to.be.empty;
  };
  assert2.isNotEmpty = function(val, msg) {
    new Assertion(val, msg, assert2.isNotEmpty, true).to.not.be.empty;
  };
  assert2.containsSubset = function(val, exp, msg) {
    new Assertion(val, msg).to.containSubset(exp);
  };
  assert2.doesNotContainSubset = function(val, exp, msg) {
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
    assert2[as] = assert2[name];
  }
  var used = [];
  function use(fn) {
    const exports = {
      use,
      AssertionError,
      util: utils_exports,
      config,
      expect,
      assert: assert2,
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

  // src/algorithms/id_list_saved_states.ts
  function signedCount(item) {
    return item.isDeleted ? -item.count : item.count;
  }
  function unsignedItem(bunchId, startCounter, signedCount2) {
    return signedCount2 < 0 ? { bunchId, startCounter, count: -signedCount2, isDeleted: true } : { bunchId, startCounter, count: signedCount2, isDeleted: false };
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
  function fromSparseStartCounters(bunchIds, counts, { startCounterIndexes, startCounters }) {
    const nextCounters = /* @__PURE__ */ new Map();
    const saved = new Array(bunchIds.length);
    let k = 0;
    let nextIncluded = startCounterIndexes.length === 0 ? -1 : startCounterIndexes[0];
    for (let i = 0; i < bunchIds.length; i++) {
      const bunchId = bunchIds[i];
      let startCounter;
      if (i === nextIncluded) {
        startCounter = startCounters[k++];
        nextIncluded = k === startCounterIndexes.length ? -1 : nextIncluded + startCounterIndexes[k];
      } else startCounter = nextCounters.get(bunchId) ?? 0;
      const item = unsignedItem(bunchId, startCounter, counts[i]);
      saved[i] = item;
      nextCounters.set(bunchId, startCounter + item.count);
    }
    return saved;
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
  function fromTransposedOmit(state) {
    return fromSparseStartCounters(state.bunchIds, state.counts, state);
  }

  // src/browser/storage-sweep-formats.ts
  function pack(values) {
    const bytes = new Uint8Array(values.length * 4);
    const view = new DataView(bytes.buffer);
    values.forEach((n, i) => {
      shims_default(Number.isInteger(n) && n >= -2147483648 && n <= 2147483647);
      view.setInt32(i * 4, n, true);
    });
    return new Binary(bytes);
  }
  function unpack(value) {
    if (Array.isArray(value)) return value;
    shims_default(value instanceof Binary);
    const bytes = value.value();
    shims_default.equal(bytes.byteLength % 4, 0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return Array.from(
      { length: bytes.byteLength / 4 },
      (_, i) => view.getInt32(i * 4, true)
    );
  }
  function encodePage(saved, ids, binary) {
    const columns = toTransposedOmit(saved);
    let bunchIds = columns.bunchIds;
    let indexes;
    if (ids === "joined") {
      shims_default(columns.bunchIds.every((id) => /^[A-Za-z0-9_-]{8}$/.test(id)));
      bunchIds = columns.bunchIds.join("");
    } else if (ids === "dictionary") {
      const dictionary = /* @__PURE__ */ new Map();
      indexes = columns.bunchIds.map((id) => {
        if (!dictionary.has(id)) dictionary.set(id, dictionary.size);
        return dictionary.get(id);
      });
      bunchIds = [...dictionary.keys()];
    }
    const numbers = (values) => binary ? pack(values) : values;
    return {
      bunchIds,
      ...indexes ? { bunchIndexes: numbers(indexes) } : {},
      startCounterIndexes: numbers(columns.startCounterIndexes),
      startCounters: numbers(columns.startCounters),
      counts: numbers(columns.counts)
    };
  }
  function decodePage(page, ids) {
    const counts = unpack(page.counts);
    let bunchIds;
    if (ids === "joined") {
      shims_default.equal(typeof page.bunchIds, "string");
      shims_default.equal(page.bunchIds.length, counts.length * 8);
      const joined2 = page.bunchIds;
      bunchIds = Array.from(
        { length: counts.length },
        (_, i) => joined2.slice(i * 8, i * 8 + 8)
      );
    } else {
      shims_default(Array.isArray(page.bunchIds));
      const names = page.bunchIds;
      bunchIds = ids === "dictionary" ? unpack(page.bunchIndexes).map((i) => {
        shims_default(Number.isInteger(i) && i >= 0 && i < names.length);
        return names[i];
      }) : names;
    }
    shims_default.equal(bunchIds.length, counts.length);
    const columns = {
      bunchIds,
      startCounterIndexes: unpack(page.startCounterIndexes),
      startCounters: unpack(page.startCounters),
      counts
    };
    shims_default.equal(
      columns.startCounters.length,
      columns.startCounterIndexes.length
    );
    return fromTransposedOmit(columns);
  }
  function format(pageSize, idEncoding, binary = false) {
    const id = !binary && idEncoding === "array" && pageSize === 0 ? "F05" : !binary && idEncoding === "array" && pageSize === 128 ? "DS08" : `S${pageSize || "flat"}-${idEncoding}${binary ? "-binary" : ""}`;
    return {
      id,
      label: `${pageSize ? `${pageSize}-run pages` : "Whole-document columns"}; ${idEncoding} IDs${binary ? "; int32 binary numeric columns" : ""}`,
      readiness: "Storage encoding only; decoded to runs then unchanged IdList.load",
      pageSize,
      idEncoding,
      binary,
      encode(saved) {
        if (!pageSize) return encodePage(saved, idEncoding, binary);
        const pages = [];
        for (let i = 0; i < saved.length; i += pageSize)
          pages.push(
            encodePage(saved.slice(i, i + pageSize), idEncoding, binary)
          );
        return { pages };
      },
      decode(state) {
        const pages = pageSize ? state.pages : [state];
        const saved = [];
        for (const page of pages) saved.push(...decodePage(page, idEncoding));
        return saved;
      }
    };
  }
  var storageSweepFormats = [
    {
      id: "F01",
      label: "Original saved objects",
      readiness: "Unchanged IdList.load",
      pageSize: 0,
      idEncoding: "array",
      binary: false,
      encode: (saved) => saved,
      decode: (state) => state
    },
    ...[0, 32, 64, 128, 256, 512].flatMap(
      (size) => ["array", "joined", "dictionary"].map(
        (ids) => format(size, ids)
      )
    ),
    ...["array", "joined", "dictionary"].map(
      (ids) => format(128, ids, true)
    )
  ];

  // src/browser/flat-f64-formats.ts
  var nativeLittleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  function packFloat64(values) {
    const bytes = new Uint8Array(values.length * 8);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < values.length; i++) {
      shims_default(
        Number.isSafeInteger(values[i]),
        "Numeric fields must be safe integers"
      );
      view.setFloat64(i * 8, values[i], true);
    }
    return new Binary(bytes);
  }
  function readFloat64(value, littleEndian = nativeLittleEndian) {
    shims_default(value instanceof Binary && value.sub_type === Binary.SUBTYPE_DEFAULT);
    const bytes = value.value();
    shims_default.equal(bytes.byteLength % 8, 0);
    if (littleEndian) {
      const aligned = bytes.byteOffset % 8 === 0 ? bytes : new Uint8Array(bytes);
      return new Float64Array(
        aligned.buffer,
        aligned.byteOffset,
        aligned.byteLength / 8
      );
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const result = new Float64Array(bytes.byteLength / 8);
    for (let i = 0; i < result.length; i++)
      result[i] = view.getFloat64(i * 8, true);
    return result;
  }
  function decodeFlatColumns(state) {
    const { bunchIds, startCounterIndexes, startCounters, counts } = state;
    shims_default.equal(typeof bunchIds, "string");
    shims_default.equal(bunchIds.length, counts.length * 8);
    shims_default.equal(startCounterIndexes.length, startCounters.length);
    let position = 0;
    for (let i = 0; i < startCounterIndexes.length; i++) {
      const delta = startCounterIndexes[i];
      shims_default(Number.isSafeInteger(delta) && (i === 0 ? delta >= 0 : delta > 0));
      position += delta;
      shims_default(position < counts.length);
      shims_default(Number.isSafeInteger(startCounters[i]) && startCounters[i] >= 0);
    }
    const nextCounters = /* @__PURE__ */ new Map();
    const saved = new Array(counts.length);
    let k = 0;
    let nextIncluded = startCounterIndexes.length ? startCounterIndexes[0] : -1;
    for (let i = 0; i < counts.length; i++) {
      const bunchId = bunchIds.slice(i * 8, i * 8 + 8);
      const signed = counts[i];
      shims_default(Number.isSafeInteger(signed));
      const count = Math.abs(signed);
      let startCounter;
      if (i === nextIncluded) {
        startCounter = startCounters[k++];
        nextIncluded = k < startCounterIndexes.length ? nextIncluded + startCounterIndexes[k] : -1;
      } else startCounter = nextCounters.get(bunchId) ?? 0;
      saved[i] = { bunchId, startCounter, count, isDeleted: signed < 0 };
      nextCounters.set(bunchId, startCounter + count);
    }
    return saved;
  }
  var joined = storageSweepFormats.find(
    (format2) => format2.id === "Sflat-joined"
  );
  var flatFloat64Format = {
    id: "Flat-F64",
    label: "Flat concatenated IDs; fixed Float64 binary numeric columns",
    readiness: "No pages; schema-fixed little-endian Float64; unchanged IdList.load",
    pageSize: 0,
    idEncoding: "joined",
    binary: true,
    encode(saved) {
      const json = joined.encode(saved);
      return {
        bunchIds: json.bunchIds,
        startCounterIndexes: packFloat64(json.startCounterIndexes),
        startCounters: packFloat64(json.startCounters),
        counts: packFloat64(json.counts)
      };
    },
    decode(state) {
      const binary = state;
      return decodeFlatColumns({
        bunchIds: binary.bunchIds,
        startCounterIndexes: readFloat64(binary.startCounterIndexes),
        startCounters: readFloat64(binary.startCounters),
        counts: readFloat64(binary.counts)
      });
    }
  };
  var flatFloat64Formats = [
    ...storageSweepFormats.filter(
      (format2) => ["F01", "F05", "Sflat-joined"].includes(format2.id)
    ),
    flatFloat64Format
  ];

  // src/browser/storage-sweep-candidates.ts
  var encoder = new TextEncoder();
  var decoder = new TextDecoder();
  var storageSweepCandidates = storageSweepFormats.map(
    (format2) => ({
      id: format2.id,
      shape: format2.id,
      encoding: format2.binary ? "BSON binary fields" : "JSON",
      path: "objects",
      internalFormat: "Unchanged existing IdList; identical ordered runs passed to IdList.load",
      encode: (saved) => format2.binary ? serialize({ state: format2.encode(saved) }) : encoder.encode(JSON.stringify(format2.encode(saved))),
      decode: (bytes) => format2.binary ? deserialize(bytes).state : JSON.parse(decoder.decode(bytes)),
      hydrate: (state) => IdList.load(format2.decode(state)),
      logical: (state) => format2.decode(state)
    })
  );

  // src/browser/flat-f64-candidates.ts
  var oldJSON = storageSweepCandidates.find((c) => c.id === "Sflat-joined");
  var flatFloat64Candidates = [
    ...storageSweepCandidates.filter(
      (c) => ["F01", "F05", "Sflat-joined"].includes(c.id)
    ),
    {
      ...oldJSON,
      id: "Flat-JSON-direct",
      internalFormat: "Existing IdList; flat JSON read directly into ordered runs without intermediate columns",
      hydrate: (state) => IdList.load(decodeFlatColumns(state))
    },
    {
      id: "Flat-F64",
      shape: "Sflat-joined",
      encoding: "BSON fixed Float64 binary fields",
      path: "objects",
      internalFormat: "Existing IdList; same direct reader as Flat-JSON-direct, using Float64Array views/alignment copies",
      encode: (saved) => serialize({ state: flatFloat64Format.encode(saved) }),
      decode: (bytes) => deserialize(bytes).state,
      hydrate: (state) => IdList.load(flatFloat64Format.decode(state)),
      logical: (state) => flatFloat64Format.decode(state)
    }
  ];
  function flatFloat64Candidate(id) {
    const candidate = flatFloat64Candidates.find((c) => c.id === id);
    if (!candidate) throw new Error(`Unknown Float64 candidate ${id}`);
    return candidate;
  }

  // ../node_modules/.pnpm/orderedmap@2.1.1/node_modules/orderedmap/dist/index.js
  function OrderedMap(content) {
    this.content = content;
  }
  OrderedMap.prototype = {
    constructor: OrderedMap,
    find: function(key) {
      for (var i = 0; i < this.content.length; i += 2)
        if (this.content[i] === key) return i;
      return -1;
    },
    // :: (string) → ?any
    // Retrieve the value stored under `key`, or return undefined when
    // no such key exists.
    get: function(key) {
      var found2 = this.find(key);
      return found2 == -1 ? void 0 : this.content[found2 + 1];
    },
    // :: (string, any, ?string) → OrderedMap
    // Create a new map by replacing the value of `key` with a new
    // value, or adding a binding to the end of the map. If `newKey` is
    // given, the key of the binding will be replaced with that key.
    update: function(key, value, newKey) {
      var self2 = newKey && newKey != key ? this.remove(newKey) : this;
      var found2 = self2.find(key), content = self2.content.slice();
      if (found2 == -1) {
        content.push(newKey || key, value);
      } else {
        content[found2 + 1] = value;
        if (newKey) content[found2] = newKey;
      }
      return new OrderedMap(content);
    },
    // :: (string) → OrderedMap
    // Return a map with the given key removed, if it existed.
    remove: function(key) {
      var found2 = this.find(key);
      if (found2 == -1) return this;
      var content = this.content.slice();
      content.splice(found2, 2);
      return new OrderedMap(content);
    },
    // :: (string, any) → OrderedMap
    // Add a new key to the start of the map.
    addToStart: function(key, value) {
      return new OrderedMap([key, value].concat(this.remove(key).content));
    },
    // :: (string, any) → OrderedMap
    // Add a new key to the end of the map.
    addToEnd: function(key, value) {
      var content = this.remove(key).content.slice();
      content.push(key, value);
      return new OrderedMap(content);
    },
    // :: (string, string, any) → OrderedMap
    // Add a key after the given key. If `place` is not found, the new
    // key is added to the end.
    addBefore: function(place, key, value) {
      var without = this.remove(key), content = without.content.slice();
      var found2 = without.find(place);
      content.splice(found2 == -1 ? content.length : found2, 0, key, value);
      return new OrderedMap(content);
    },
    // :: ((key: string, value: any))
    // Call the given function for each key/value pair in the map, in
    // order.
    forEach: function(f) {
      for (var i = 0; i < this.content.length; i += 2)
        f(this.content[i], this.content[i + 1]);
    },
    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a new map by prepending the keys in this map that don't
    // appear in `map` before the keys in `map`.
    prepend: function(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this;
      return new OrderedMap(map.content.concat(this.subtract(map).content));
    },
    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a new map by appending the keys in this map that don't
    // appear in `map` after the keys in `map`.
    append: function(map) {
      map = OrderedMap.from(map);
      if (!map.size) return this;
      return new OrderedMap(this.subtract(map).content.concat(map.content));
    },
    // :: (union<Object, OrderedMap>) → OrderedMap
    // Create a map containing all the keys in this map that don't
    // appear in `map`.
    subtract: function(map) {
      var result = this;
      map = OrderedMap.from(map);
      for (var i = 0; i < map.content.length; i += 2)
        result = result.remove(map.content[i]);
      return result;
    },
    // :: () → Object
    // Turn ordered map into a plain object.
    toObject: function() {
      var result = {};
      this.forEach(function(key, value) {
        result[key] = value;
      });
      return result;
    },
    // :: number
    // The amount of keys in this map.
    get size() {
      return this.content.length >> 1;
    }
  };
  OrderedMap.from = function(value) {
    if (value instanceof OrderedMap) return value;
    var content = [];
    if (value) for (var prop in value) content.push(prop, value[prop]);
    return new OrderedMap(content);
  };
  var dist_default = OrderedMap;

  // ../node_modules/.pnpm/prosemirror-model@1.25.11/node_modules/prosemirror-model/dist/index.js
  function findDiffStart(a, b, pos) {
    for (let i = 0; ; i++) {
      if (i == a.childCount || i == b.childCount)
        return a.childCount == b.childCount ? null : pos;
      let childA = a.child(i), childB = b.child(i);
      if (childA == childB) {
        pos += childA.nodeSize;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return pos;
      if (childA.isText && childA.text != childB.text) {
        let tA = childA.text, tB = childB.text, j = 0;
        for (; tA[j] == tB[j]; j++)
          pos++;
        if (j && j < tA.length && j < tB.length && surrogateHigh(tA.charCodeAt(j - 1)) && surrogateLow(tA.charCodeAt(j)))
          pos--;
        return pos;
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffStart(childA.content, childB.content, pos + 1);
        if (inner != null)
          return inner;
      }
      pos += childA.nodeSize;
    }
  }
  function findDiffEnd(a, b, posA, posB) {
    for (let iA = a.childCount, iB = b.childCount; ; ) {
      if (iA == 0 || iB == 0)
        return iA == iB ? null : { a: posA, b: posB };
      let childA = a.child(--iA), childB = b.child(--iB), size = childA.nodeSize;
      if (childA == childB) {
        posA -= size;
        posB -= size;
        continue;
      }
      if (!childA.sameMarkup(childB))
        return { a: posA, b: posB };
      if (childA.isText && childA.text != childB.text) {
        let tA = childA.text, tB = childB.text, iA2 = tA.length, iB2 = tB.length;
        while (iA2 > 0 && iB2 > 0 && tA[iA2 - 1] == tB[iB2 - 1]) {
          iA2--;
          iB2--;
          posA--;
          posB--;
        }
        if (iA2 && iB2 && iA2 < tA.length && surrogateHigh(tA.charCodeAt(iA2 - 1)) && surrogateLow(tA.charCodeAt(iA2))) {
          posA++;
          posB++;
        }
        return { a: posA, b: posB };
      }
      if (childA.content.size || childB.content.size) {
        let inner = findDiffEnd(childA.content, childB.content, posA - 1, posB - 1);
        if (inner)
          return inner;
      }
      posA -= size;
      posB -= size;
    }
  }
  function surrogateLow(ch) {
    return ch >= 56320 && ch < 57344;
  }
  function surrogateHigh(ch) {
    return ch >= 55296 && ch < 56320;
  }
  var Fragment = class _Fragment {
    /**
    @internal
    */
    constructor(content, size) {
      this.content = content;
      this.size = size || 0;
      if (size == null)
        for (let i = 0; i < content.length; i++)
          this.size += content[i].nodeSize;
    }
    /**
    Invoke a callback for all descendant nodes between the given two
    positions (relative to start of this fragment). Doesn't descend
    into a node when the callback returns `false`.
    */
    nodesBetween(from, to, f, nodeStart = 0, parent) {
      for (let i = 0, pos = 0; pos < to; i++) {
        let child = this.content[i], end = pos + child.nodeSize;
        if (end > from && f(child, nodeStart + pos, parent || null, i) !== false && child.content.size) {
          let start = pos + 1;
          child.nodesBetween(Math.max(0, from - start), Math.min(child.content.size, to - start), f, nodeStart + start);
        }
        pos = end;
      }
    }
    /**
    Call the given callback for every descendant node. `pos` will be
    relative to the start of the fragment. The callback may return
    `false` to prevent traversal of a given node's children.
    */
    descendants(f) {
      this.nodesBetween(0, this.size, f);
    }
    /**
    Extract the text between `from` and `to`. See the same method on
    [`Node`](https://prosemirror.net/docs/ref/#model.Node.textBetween).
    */
    textBetween(from, to, blockSeparator, leafText) {
      let text = "", first = true;
      this.nodesBetween(from, to, (node, pos) => {
        let nodeText = node.isText ? node.text.slice(Math.max(from, pos) - pos, to - pos) : !node.isLeaf ? "" : leafText ? typeof leafText === "function" ? leafText(node) : leafText : node.type.spec.leafText ? node.type.spec.leafText(node) : "";
        if (node.isBlock && (node.isLeaf && nodeText || node.isTextblock) && blockSeparator) {
          if (first)
            first = false;
          else
            text += blockSeparator;
        }
        text += nodeText;
      }, 0);
      return text;
    }
    /**
    Create a new fragment containing the combined content of this
    fragment and the other.
    */
    append(other) {
      if (!other.size)
        return this;
      if (!this.size)
        return other;
      let last = this.lastChild, first = other.firstChild, content = this.content.slice(), i = 0;
      if (last.isText && last.sameMarkup(first)) {
        content[content.length - 1] = last.withText(last.text + first.text);
        i = 1;
      }
      for (; i < other.content.length; i++)
        content.push(other.content[i]);
      return new _Fragment(content, this.size + other.size);
    }
    /**
    Cut out the sub-fragment between the two given positions.
    */
    cut(from, to = this.size) {
      if (from == 0 && to == this.size)
        return this;
      let result = [], size = 0;
      if (to > from)
        for (let i = 0, pos = 0; pos < to; i++) {
          let child = this.content[i], end = pos + child.nodeSize;
          if (end > from) {
            if (pos < from || end > to) {
              if (child.isText)
                child = child.cut(Math.max(0, from - pos), Math.min(child.text.length, to - pos));
              else
                child = child.cut(Math.max(0, from - pos - 1), Math.min(child.content.size, to - pos - 1));
            }
            result.push(child);
            size += child.nodeSize;
          }
          pos = end;
        }
      return new _Fragment(result, size);
    }
    /**
    @internal
    */
    cutByIndex(from, to) {
      if (from == to)
        return _Fragment.empty;
      if (from == 0 && to == this.content.length)
        return this;
      return new _Fragment(this.content.slice(from, to));
    }
    /**
    Create a new fragment in which the node at the given index is
    replaced by the given node.
    */
    replaceChild(index, node) {
      let current = this.content[index];
      if (current == node)
        return this;
      let copy2 = this.content.slice();
      let size = this.size + node.nodeSize - current.nodeSize;
      copy2[index] = node;
      return new _Fragment(copy2, size);
    }
    /**
    Create a new fragment by prepending the given node to this
    fragment.
    */
    addToStart(node) {
      return new _Fragment([node].concat(this.content), this.size + node.nodeSize);
    }
    /**
    Create a new fragment by appending the given node to this
    fragment.
    */
    addToEnd(node) {
      return new _Fragment(this.content.concat(node), this.size + node.nodeSize);
    }
    /**
    Compare this fragment to another one.
    */
    eq(other) {
      if (this.content.length != other.content.length)
        return false;
      for (let i = 0; i < this.content.length; i++)
        if (!this.content[i].eq(other.content[i]))
          return false;
      return true;
    }
    /**
    The first child of the fragment, or `null` if it is empty.
    */
    get firstChild() {
      return this.content.length ? this.content[0] : null;
    }
    /**
    The last child of the fragment, or `null` if it is empty.
    */
    get lastChild() {
      return this.content.length ? this.content[this.content.length - 1] : null;
    }
    /**
    The number of child nodes in this fragment.
    */
    get childCount() {
      return this.content.length;
    }
    /**
    Get the child node at the given index. Raise an error when the
    index is out of range.
    */
    child(index) {
      let found2 = this.content[index];
      if (!found2)
        throw new RangeError("Index " + index + " out of range for " + this);
      return found2;
    }
    /**
    Get the child node at the given index, if it exists.
    */
    maybeChild(index) {
      return this.content[index] || null;
    }
    /**
    Call `f` for every child node, passing the node, its offset
    into this parent node, and its index.
    */
    forEach(f) {
      for (let i = 0, p = 0; i < this.content.length; i++) {
        let child = this.content[i];
        f(child, p, i);
        p += child.nodeSize;
      }
    }
    /**
    Find the first position at which this fragment and another
    fragment differ, or `null` if they are the same.
    */
    findDiffStart(other, pos = 0) {
      return findDiffStart(this, other, pos);
    }
    /**
    Find the first position, searching from the end, at which this
    fragment and the given fragment differ, or `null` if they are
    the same. Since this position will not be the same in both
    nodes, an object with two separate positions is returned.
    */
    findDiffEnd(other, pos = this.size, otherPos = other.size) {
      return findDiffEnd(this, other, pos, otherPos);
    }
    /**
    Find the index and inner offset corresponding to a given relative
    position in this fragment. The result object will be reused
    (overwritten) the next time the function is called. @internal
    */
    findIndex(pos) {
      if (pos == 0)
        return retIndex(0, pos);
      if (pos == this.size)
        return retIndex(this.content.length, pos);
      if (pos > this.size || pos < 0)
        throw new RangeError(`Position ${pos} outside of fragment (${this})`);
      for (let i = 0, curPos = 0; ; i++) {
        let cur = this.child(i), end = curPos + cur.nodeSize;
        if (end >= pos) {
          if (end == pos)
            return retIndex(i + 1, end);
          return retIndex(i, curPos);
        }
        curPos = end;
      }
    }
    /**
    Return a debugging string that describes this fragment.
    */
    toString() {
      return "<" + this.toStringInner() + ">";
    }
    /**
    @internal
    */
    toStringInner() {
      return this.content.join(", ");
    }
    /**
    Create a JSON-serializeable representation of this fragment.
    */
    toJSON() {
      return this.content.length ? this.content.map((n) => n.toJSON()) : null;
    }
    /**
    Deserialize a fragment from its JSON representation.
    */
    static fromJSON(schema2, value) {
      if (!value)
        return _Fragment.empty;
      if (!Array.isArray(value))
        throw new RangeError("Invalid input for Fragment.fromJSON");
      return _Fragment.fromArray(value.map(schema2.nodeFromJSON));
    }
    /**
    Build a fragment from an array of nodes. Ensures that adjacent
    text nodes with the same marks are joined together.
    */
    static fromArray(array) {
      if (!array.length)
        return _Fragment.empty;
      let joined2, size = 0;
      for (let i = 0; i < array.length; i++) {
        let node = array[i];
        size += node.nodeSize;
        if (i && node.isText && array[i - 1].sameMarkup(node)) {
          if (!joined2)
            joined2 = array.slice(0, i);
          joined2[joined2.length - 1] = node.withText(joined2[joined2.length - 1].text + node.text);
        } else if (joined2) {
          joined2.push(node);
        }
      }
      return new _Fragment(joined2 || array, size);
    }
    /**
    Create a fragment from something that can be interpreted as a
    set of nodes. For `null`, it returns the empty fragment. For a
    fragment, the fragment itself. For a node or array of nodes, a
    fragment containing those nodes.
    */
    static from(nodes) {
      if (!nodes)
        return _Fragment.empty;
      if (nodes instanceof _Fragment)
        return nodes;
      if (Array.isArray(nodes))
        return this.fromArray(nodes);
      if (nodes.attrs)
        return new _Fragment([nodes], nodes.nodeSize);
      throw new RangeError("Can not convert " + nodes + " to a Fragment" + (nodes.nodesBetween ? " (looks like multiple versions of prosemirror-model were loaded)" : ""));
    }
  };
  Fragment.empty = new Fragment([], 0);
  var found = { index: 0, offset: 0 };
  function retIndex(index, offset) {
    found.index = index;
    found.offset = offset;
    return found;
  }
  function compareDeep(a, b) {
    if (a === b)
      return true;
    if (!(a && typeof a == "object") || !(b && typeof b == "object"))
      return false;
    let array = Array.isArray(a);
    if (Array.isArray(b) != array)
      return false;
    if (array) {
      if (a.length != b.length)
        return false;
      for (let i = 0; i < a.length; i++)
        if (!compareDeep(a[i], b[i]))
          return false;
    } else {
      for (let p in a)
        if (!(p in b) || !compareDeep(a[p], b[p]))
          return false;
      for (let p in b)
        if (!(p in a))
          return false;
    }
    return true;
  }
  var Mark = class _Mark {
    /**
    @internal
    */
    constructor(type3, attrs) {
      this.type = type3;
      this.attrs = attrs;
    }
    /**
    Given a set of marks, create a new set which contains this one as
    well, in the right position. If this mark is already in the set,
    the set itself is returned. If any marks that are set to be
    [exclusive](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) with this mark are present,
    those are replaced by this one.
    */
    addToSet(set2) {
      let copy2, placed = false;
      for (let i = 0; i < set2.length; i++) {
        let other = set2[i];
        if (this.eq(other))
          return set2;
        if (this.type.excludes(other.type)) {
          if (!copy2)
            copy2 = set2.slice(0, i);
        } else if (other.type.excludes(this.type)) {
          return set2;
        } else {
          if (!placed && other.type.rank > this.type.rank) {
            if (!copy2)
              copy2 = set2.slice(0, i);
            copy2.push(this);
            placed = true;
          }
          if (copy2)
            copy2.push(other);
        }
      }
      if (!copy2)
        copy2 = set2.slice();
      if (!placed)
        copy2.push(this);
      return copy2;
    }
    /**
    Remove this mark from the given set, returning a new set. If this
    mark is not in the set, the set itself is returned.
    */
    removeFromSet(set2) {
      for (let i = 0; i < set2.length; i++)
        if (this.eq(set2[i]))
          return set2.slice(0, i).concat(set2.slice(i + 1));
      return set2;
    }
    /**
    Test whether this mark is in the given set of marks.
    */
    isInSet(set2) {
      for (let i = 0; i < set2.length; i++)
        if (this.eq(set2[i]))
          return true;
      return false;
    }
    /**
    Test whether this mark has the same type and attributes as
    another mark.
    */
    eq(other) {
      return this == other || this.type == other.type && compareDeep(this.attrs, other.attrs);
    }
    /**
    Convert this mark to a JSON-serializeable representation.
    */
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      return obj;
    }
    /**
    Deserialize a mark from JSON.
    */
    static fromJSON(schema2, json) {
      if (!json)
        throw new RangeError("Invalid input for Mark.fromJSON");
      let type3 = schema2.marks[json.type];
      if (!type3)
        throw new RangeError(`There is no mark type ${json.type} in this schema`);
      let mark = type3.create(json.attrs);
      type3.checkAttrs(mark.attrs);
      return mark;
    }
    /**
    Test whether two sets of marks are identical.
    */
    static sameSet(a, b) {
      if (a == b)
        return true;
      if (a.length != b.length)
        return false;
      for (let i = 0; i < a.length; i++)
        if (!a[i].eq(b[i]))
          return false;
      return true;
    }
    /**
    Create a properly sorted mark set from null, a single mark, or an
    unsorted array of marks.
    */
    static setFrom(marks) {
      if (!marks || Array.isArray(marks) && marks.length == 0)
        return _Mark.none;
      if (marks instanceof _Mark)
        return [marks];
      let copy2 = marks.slice();
      copy2.sort((a, b) => a.type.rank - b.type.rank);
      return copy2;
    }
  };
  Mark.none = [];
  var ReplaceError = class extends Error {
  };
  var Slice = class _Slice {
    /**
    Create a slice. When specifying a non-zero open depth, you must
    make sure that there are nodes of at least that depth at the
    appropriate side of the fragment—i.e. if the fragment is an
    empty paragraph node, `openStart` and `openEnd` can't be greater
    than 1.
    
    It is not necessary for the content of open nodes to conform to
    the schema's content constraints, though it should be a valid
    start/end/middle for such a node, depending on which sides are
    open.
    */
    constructor(content, openStart, openEnd) {
      this.content = content;
      this.openStart = openStart;
      this.openEnd = openEnd;
    }
    /**
    The size this slice would add when inserted into a document.
    */
    get size() {
      return this.content.size - this.openStart - this.openEnd;
    }
    /**
    @internal
    */
    insertAt(pos, fragment) {
      let content = insertInto(this.content, pos + this.openStart, fragment, this.openStart + 1, this.openEnd + 1);
      return content && new _Slice(content, this.openStart, this.openEnd);
    }
    /**
    @internal
    */
    removeBetween(from, to) {
      return new _Slice(removeRange(this.content, from + this.openStart, to + this.openStart), this.openStart, this.openEnd);
    }
    /**
    Tests whether this slice is equal to another slice.
    */
    eq(other) {
      return this.content.eq(other.content) && this.openStart == other.openStart && this.openEnd == other.openEnd;
    }
    /**
    @internal
    */
    toString() {
      return this.content + "(" + this.openStart + "," + this.openEnd + ")";
    }
    /**
    Convert a slice to a JSON-serializable representation.
    */
    toJSON() {
      if (!this.content.size)
        return null;
      let json = { content: this.content.toJSON() };
      if (this.openStart > 0)
        json.openStart = this.openStart;
      if (this.openEnd > 0)
        json.openEnd = this.openEnd;
      return json;
    }
    /**
    Deserialize a slice from its JSON representation.
    */
    static fromJSON(schema2, json) {
      if (!json)
        return _Slice.empty;
      let openStart = json.openStart || 0, openEnd = json.openEnd || 0;
      if (typeof openStart != "number" || typeof openEnd != "number")
        throw new RangeError("Invalid input for Slice.fromJSON");
      return new _Slice(Fragment.fromJSON(schema2, json.content), openStart, openEnd);
    }
    /**
    Create a slice from a fragment by taking the maximum possible
    open value on both side of the fragment.
    */
    static maxOpen(fragment, openIsolating = true) {
      let openStart = 0, openEnd = 0;
      for (let n = fragment.firstChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.firstChild)
        openStart++;
      for (let n = fragment.lastChild; n && !n.isLeaf && (openIsolating || !n.type.spec.isolating); n = n.lastChild)
        openEnd++;
      return new _Slice(fragment, openStart, openEnd);
    }
  };
  Slice.empty = new Slice(Fragment.empty, 0, 0);
  function removeRange(content, from, to) {
    let { index, offset } = content.findIndex(from), child = content.maybeChild(index);
    let { index: indexTo, offset: offsetTo } = content.findIndex(to);
    if (offset == from || child.isText) {
      if (offsetTo != to && !content.child(indexTo).isText)
        throw new RangeError("Removing non-flat range");
      return content.cut(0, from).append(content.cut(to));
    }
    if (index != indexTo)
      throw new RangeError("Removing non-flat range");
    return content.replaceChild(index, child.copy(removeRange(child.content, from - offset - 1, to - offset - 1)));
  }
  function insertInto(content, dist, insert, openStart, openEnd, parent) {
    let { index, offset } = content.findIndex(dist), child = content.maybeChild(index);
    if (offset == dist || child.isText) {
      if (parent && openStart <= 0 && openEnd <= 0 && !parent.canReplace(index, index, insert))
        return null;
      return content.cut(0, dist).append(insert).append(content.cut(dist));
    }
    let inner = insertInto(child.content, dist - offset - 1, insert, index == 0 ? openStart - 1 : 0, index == content.childCount - 1 ? openEnd - 1 : 0, child);
    return inner && content.replaceChild(index, child.copy(inner));
  }
  function replace($from, $to, slice) {
    if (slice.openStart > $from.depth)
      throw new ReplaceError("Inserted content deeper than insertion position");
    if ($from.depth - slice.openStart != $to.depth - slice.openEnd)
      throw new ReplaceError("Inconsistent open depths");
    return replaceOuter($from, $to, slice, 0);
  }
  function replaceOuter($from, $to, slice, depth) {
    let index = $from.index(depth), node = $from.node(depth);
    if (index == $to.index(depth) && depth < $from.depth - slice.openStart) {
      let inner = replaceOuter($from, $to, slice, depth + 1);
      return node.copy(node.content.replaceChild(index, inner));
    } else if (!slice.content.size) {
      return close(node, replaceTwoWay($from, $to, depth));
    } else if (!slice.openStart && !slice.openEnd && $from.depth == depth && $to.depth == depth) {
      let parent = $from.parent, content = parent.content;
      return close(parent, content.cut(0, $from.parentOffset).append(slice.content).append(content.cut($to.parentOffset)));
    } else {
      let { start, end } = prepareSliceForReplace(slice, $from);
      return close(node, replaceThreeWay($from, start, end, $to, depth));
    }
  }
  function checkJoin(main, sub) {
    if (!sub.type.compatibleContent(main.type))
      throw new ReplaceError("Cannot join " + sub.type.name + " onto " + main.type.name);
  }
  function joinable($before, $after, depth) {
    let node = $before.node(depth);
    checkJoin(node, $after.node(depth));
    return node;
  }
  function addNode(child, target) {
    let last = target.length - 1;
    if (last >= 0 && child.isText && child.sameMarkup(target[last]))
      target[last] = child.withText(target[last].text + child.text);
    else
      target.push(child);
  }
  function addRange($start, $end, depth, target) {
    let node = ($end || $start).node(depth);
    let startIndex = 0, endIndex = $end ? $end.index(depth) : node.childCount;
    if ($start) {
      startIndex = $start.index(depth);
      if ($start.depth > depth) {
        startIndex++;
      } else if ($start.textOffset) {
        addNode($start.nodeAfter, target);
        startIndex++;
      }
    }
    for (let i = startIndex; i < endIndex; i++)
      addNode(node.child(i), target);
    if ($end && $end.depth == depth && $end.textOffset)
      addNode($end.nodeBefore, target);
  }
  function close(node, content) {
    if (!node.type.validContent(content))
      throw new ReplaceError("Invalid content for node " + node.type.name);
    return node.copy(content);
  }
  function replaceThreeWay($from, $start, $end, $to, depth) {
    let openStart = $from.depth > depth && joinable($from, $start, depth + 1);
    let openEnd = $to.depth > depth && joinable($end, $to, depth + 1);
    let content = [];
    addRange(null, $from, depth, content);
    if (openStart && openEnd && $start.index(depth) == $end.index(depth)) {
      checkJoin(openStart, openEnd);
      addNode(close(openStart, replaceThreeWay($from, $start, $end, $to, depth + 1)), content);
    } else {
      if (openStart)
        addNode(close(openStart, replaceTwoWay($from, $start, depth + 1)), content);
      addRange($start, $end, depth, content);
      if (openEnd)
        addNode(close(openEnd, replaceTwoWay($end, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function replaceTwoWay($from, $to, depth) {
    let content = [];
    addRange(null, $from, depth, content);
    if ($from.depth > depth) {
      let type3 = joinable($from, $to, depth + 1);
      addNode(close(type3, replaceTwoWay($from, $to, depth + 1)), content);
    }
    addRange($to, null, depth, content);
    return new Fragment(content);
  }
  function prepareSliceForReplace(slice, $along) {
    let extra = $along.depth - slice.openStart, parent = $along.node(extra);
    let node = parent.copy(slice.content);
    for (let i = extra - 1; i >= 0; i--)
      node = $along.node(i).copy(Fragment.from(node));
    return {
      start: node.resolveNoCache(slice.openStart + extra),
      end: node.resolveNoCache(node.content.size - slice.openEnd - extra)
    };
  }
  var ResolvedPos = class _ResolvedPos {
    /**
    @internal
    */
    constructor(pos, path, parentOffset) {
      this.pos = pos;
      this.path = path;
      this.parentOffset = parentOffset;
      this.depth = path.length / 3 - 1;
    }
    /**
    @internal
    */
    resolveDepth(val) {
      if (val == null)
        return this.depth;
      if (val < 0)
        return this.depth + val;
      return val;
    }
    /**
    The parent node that the position points into. Note that even if
    a position points into a text node, that node is not considered
    the parent—text nodes are ‘flat’ in this model, and have no content.
    */
    get parent() {
      return this.node(this.depth);
    }
    /**
    The root node in which the position was resolved.
    */
    get doc() {
      return this.node(0);
    }
    /**
    The ancestor node at the given level. `p.node(p.depth)` is the
    same as `p.parent`.
    */
    node(depth) {
      return this.path[this.resolveDepth(depth) * 3];
    }
    /**
    The index into the ancestor at the given level. If this points
    at the 3rd node in the 2nd paragraph on the top level, for
    example, `p.index(0)` is 1 and `p.index(1)` is 2.
    */
    index(depth) {
      return this.path[this.resolveDepth(depth) * 3 + 1];
    }
    /**
    The index pointing after this position into the ancestor at the
    given level.
    */
    indexAfter(depth) {
      depth = this.resolveDepth(depth);
      return this.index(depth) + (depth == this.depth && !this.textOffset ? 0 : 1);
    }
    /**
    The (absolute) position at the start of the node at the given
    level.
    */
    start(depth) {
      depth = this.resolveDepth(depth);
      return depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
    }
    /**
    The (absolute) position at the end of the node at the given
    level.
    */
    end(depth) {
      depth = this.resolveDepth(depth);
      return this.start(depth) + this.node(depth).content.size;
    }
    /**
    The (absolute) position directly before the wrapping node at the
    given level, or, when `depth` is `this.depth + 1`, the original
    position.
    */
    before(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position before the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1];
    }
    /**
    The (absolute) position directly after the wrapping node at the
    given level, or the original position when `depth` is `this.depth + 1`.
    */
    after(depth) {
      depth = this.resolveDepth(depth);
      if (!depth)
        throw new RangeError("There is no position after the top-level node");
      return depth == this.depth + 1 ? this.pos : this.path[depth * 3 - 1] + this.path[depth * 3].nodeSize;
    }
    /**
    When this position points into a text node, this returns the
    distance between the position and the start of the text node.
    Will be zero for positions that point between nodes.
    */
    get textOffset() {
      return this.pos - this.path[this.path.length - 1];
    }
    /**
    Get the node directly after the position, if any. If the position
    points into a text node, only the part of that node after the
    position is returned.
    */
    get nodeAfter() {
      let parent = this.parent, index = this.index(this.depth);
      if (index == parent.childCount)
        return null;
      let dOff = this.pos - this.path[this.path.length - 1], child = parent.child(index);
      return dOff ? parent.child(index).cut(dOff) : child;
    }
    /**
    Get the node directly before the position, if any. If the
    position points into a text node, only the part of that node
    before the position is returned.
    */
    get nodeBefore() {
      let index = this.index(this.depth);
      let dOff = this.pos - this.path[this.path.length - 1];
      if (dOff)
        return this.parent.child(index).cut(0, dOff);
      return index == 0 ? null : this.parent.child(index - 1);
    }
    /**
    Get the position at the given index in the parent node at the
    given depth (which defaults to `this.depth`).
    */
    posAtIndex(index, depth) {
      depth = this.resolveDepth(depth);
      let node = this.path[depth * 3], pos = depth == 0 ? 0 : this.path[depth * 3 - 1] + 1;
      for (let i = 0; i < index; i++)
        pos += node.child(i).nodeSize;
      return pos;
    }
    /**
    Get the marks at this position, factoring in the surrounding
    marks' [`inclusive`](https://prosemirror.net/docs/ref/#model.MarkSpec.inclusive) property. If the
    position is at the start of a non-empty node, the marks of the
    node after it (if any) are returned.
    */
    marks() {
      let parent = this.parent, index = this.index();
      if (parent.content.size == 0)
        return Mark.none;
      if (this.textOffset)
        return parent.child(index).marks;
      let main = parent.maybeChild(index - 1), other = parent.maybeChild(index);
      if (!main) {
        let tmp = main;
        main = other;
        other = tmp;
      }
      let marks = main.marks;
      for (var i = 0; i < marks.length; i++)
        if (marks[i].type.spec.inclusive === false && (!other || !marks[i].isInSet(other.marks)))
          marks = marks[i--].removeFromSet(marks);
      return marks;
    }
    /**
    Get the marks after the current position, if any, except those
    that are non-inclusive and not present at position `$end`. This
    is mostly useful for getting the set of marks to preserve after a
    deletion. Will return `null` if this position is at the end of
    its parent node or its parent node isn't a textblock (in which
    case no marks should be preserved).
    */
    marksAcross($end) {
      let after = this.parent.maybeChild(this.index());
      if (!after || !after.isInline)
        return null;
      let marks = after.marks, next = $end.parent.maybeChild($end.index());
      for (var i = 0; i < marks.length; i++)
        if (marks[i].type.spec.inclusive === false && (!next || !marks[i].isInSet(next.marks)))
          marks = marks[i--].removeFromSet(marks);
      return marks;
    }
    /**
    The depth up to which this position and the given (non-resolved)
    position share the same parent nodes.
    */
    sharedDepth(pos) {
      for (let depth = this.depth; depth > 0; depth--)
        if (this.start(depth) <= pos && this.end(depth) >= pos)
          return depth;
      return 0;
    }
    /**
    Returns a range based on the place where this position and the
    given position diverge around block content. If both point into
    the same textblock, for example, a range around that textblock
    will be returned. If they point into different blocks, the range
    around those blocks in their shared ancestor is returned. You can
    pass in an optional predicate that will be called with a parent
    node to see if a range into that parent is acceptable.
    */
    blockRange(other = this, pred) {
      if (other.pos < this.pos)
        return other.blockRange(this);
      for (let d = this.depth - (this.parent.inlineContent || this.pos == other.pos ? 1 : 0); d >= 0; d--)
        if (other.pos <= this.end(d) && (!pred || pred(this.node(d))))
          return new NodeRange(this, other, d);
      return null;
    }
    /**
    Query whether the given position shares the same parent node.
    */
    sameParent(other) {
      return this.pos - this.parentOffset == other.pos - other.parentOffset;
    }
    /**
    Return the greater of this and the given position.
    */
    max(other) {
      return other.pos > this.pos ? other : this;
    }
    /**
    Return the smaller of this and the given position.
    */
    min(other) {
      return other.pos < this.pos ? other : this;
    }
    /**
    @internal
    */
    toString() {
      let str = "";
      for (let i = 1; i <= this.depth; i++)
        str += (str ? "/" : "") + this.node(i).type.name + "_" + this.index(i - 1);
      return str + ":" + this.parentOffset;
    }
    /**
    @internal
    */
    static resolve(doc3, pos) {
      if (!(pos >= 0 && pos <= doc3.content.size))
        throw new RangeError("Position " + pos + " out of range");
      let path = [];
      let start = 0, parentOffset = pos;
      for (let node = doc3; ; ) {
        let { index, offset } = node.content.findIndex(parentOffset);
        let rem = parentOffset - offset;
        path.push(node, index, start + offset);
        if (!rem)
          break;
        node = node.child(index);
        if (node.isText)
          break;
        parentOffset = rem - 1;
        start += offset + 1;
      }
      return new _ResolvedPos(pos, path, parentOffset);
    }
    /**
    @internal
    */
    static resolveCached(doc3, pos) {
      let cache = resolveCache.get(doc3);
      if (cache) {
        for (let i = 0; i < cache.elts.length; i++) {
          let elt = cache.elts[i];
          if (elt.pos == pos)
            return elt;
        }
      } else {
        resolveCache.set(doc3, cache = new ResolveCache());
      }
      let result = cache.elts[cache.i] = _ResolvedPos.resolve(doc3, pos);
      cache.i = (cache.i + 1) % resolveCacheSize;
      return result;
    }
  };
  var ResolveCache = class {
    constructor() {
      this.elts = [];
      this.i = 0;
    }
  };
  var resolveCacheSize = 12;
  var resolveCache = /* @__PURE__ */ new WeakMap();
  var NodeRange = class {
    /**
    Construct a node range. `$from` and `$to` should point into the
    same node until at least the given `depth`, since a node range
    denotes an adjacent set of nodes in a single parent node.
    */
    constructor($from, $to, depth) {
      this.$from = $from;
      this.$to = $to;
      this.depth = depth;
    }
    /**
    The position at the start of the range.
    */
    get start() {
      return this.$from.before(this.depth + 1);
    }
    /**
    The position at the end of the range.
    */
    get end() {
      return this.$to.after(this.depth + 1);
    }
    /**
    The parent node that the range points into.
    */
    get parent() {
      return this.$from.node(this.depth);
    }
    /**
    The start index of the range in the parent node.
    */
    get startIndex() {
      return this.$from.index(this.depth);
    }
    /**
    The end index of the range in the parent node.
    */
    get endIndex() {
      return this.$to.indexAfter(this.depth);
    }
  };
  var emptyAttrs = /* @__PURE__ */ Object.create(null);
  var Node = class _Node {
    /**
    @internal
    */
    constructor(type3, attrs, content, marks = Mark.none) {
      this.type = type3;
      this.attrs = attrs;
      this.marks = marks;
      this.content = content || Fragment.empty;
    }
    /**
    The array of this node's child nodes.
    */
    get children() {
      return this.content.content;
    }
    /**
    The size of this node, as defined by the integer-based [indexing
    scheme](https://prosemirror.net/docs/guide/#doc.indexing). For text nodes, this is the
    amount of characters. For other leaf nodes, it is one. For
    non-leaf nodes, it is the size of the content plus two (the
    start and end token).
    */
    get nodeSize() {
      return this.isLeaf ? 1 : 2 + this.content.size;
    }
    /**
    The number of children that the node has.
    */
    get childCount() {
      return this.content.childCount;
    }
    /**
    Get the child node at the given index. Raises an error when the
    index is out of range.
    */
    child(index) {
      return this.content.child(index);
    }
    /**
    Get the child node at the given index, if it exists.
    */
    maybeChild(index) {
      return this.content.maybeChild(index);
    }
    /**
    Call `f` for every child node, passing the node, its offset
    into this parent node, and its index.
    */
    forEach(f) {
      this.content.forEach(f);
    }
    /**
    Invoke a callback for all descendant nodes recursively overlapping
    the given two positions that are relative to start of this
    node's content. This includes all ancestors of the nodes
    containing the two positions. The callback is invoked with the
    node, its position relative to the original node (method receiver),
    its parent node, and its child index. When the callback returns
    false for a given node, that node's children will not be
    recursed over. The last parameter can be used to specify a
    starting position to count from.
    */
    nodesBetween(from, to, f, startPos = 0) {
      this.content.nodesBetween(from, to, f, startPos, this);
    }
    /**
    Call the given callback for every descendant node. Doesn't
    descend into a node when the callback returns `false`.
    */
    descendants(f) {
      this.nodesBetween(0, this.content.size, f);
    }
    /**
    Concatenates all the text nodes found in this fragment and its
    children.
    */
    get textContent() {
      return this.isLeaf && this.type.spec.leafText ? this.type.spec.leafText(this) : this.textBetween(0, this.content.size, "");
    }
    /**
    Get all text between positions `from` and `to`. When
    `blockSeparator` is given, it will be inserted to separate text
    from different block nodes. If `leafText` is given, it'll be
    inserted for every non-text leaf node encountered, otherwise
    [`leafText`](https://prosemirror.net/docs/ref/#model.NodeSpec.leafText) will be used.
    */
    textBetween(from, to, blockSeparator, leafText) {
      return this.content.textBetween(from, to, blockSeparator, leafText);
    }
    /**
    Returns this node's first child, or `null` if there are no
    children.
    */
    get firstChild() {
      return this.content.firstChild;
    }
    /**
    Returns this node's last child, or `null` if there are no
    children.
    */
    get lastChild() {
      return this.content.lastChild;
    }
    /**
    Test whether two nodes represent the same piece of document.
    */
    eq(other) {
      return this == other || this.sameMarkup(other) && this.content.eq(other.content);
    }
    /**
    Compare the markup (type, attributes, and marks) of this node to
    those of another. Returns `true` if both have the same markup.
    */
    sameMarkup(other) {
      return this.hasMarkup(other.type, other.attrs, other.marks);
    }
    /**
    Check whether this node's markup correspond to the given type,
    attributes, and marks.
    */
    hasMarkup(type3, attrs, marks) {
      return this.type == type3 && compareDeep(this.attrs, attrs || type3.defaultAttrs || emptyAttrs) && Mark.sameSet(this.marks, marks || Mark.none);
    }
    /**
    Create a new node with the same markup as this node, containing
    the given content (or empty, if no content is given).
    */
    copy(content = null) {
      if (content == this.content)
        return this;
      return new _Node(this.type, this.attrs, content, this.marks);
    }
    /**
    Create a copy of this node, with the given set of marks instead
    of the node's own marks.
    */
    mark(marks) {
      return marks == this.marks ? this : new _Node(this.type, this.attrs, this.content, marks);
    }
    /**
    Create a copy of this node with only the content between the
    given positions. If `to` is not given, it defaults to the end of
    the node.
    */
    cut(from, to = this.content.size) {
      if (from == 0 && to == this.content.size)
        return this;
      return this.copy(this.content.cut(from, to));
    }
    /**
    Cut out the part of the document between the given positions, and
    return it as a `Slice` object.
    */
    slice(from, to = this.content.size, includeParents = false) {
      if (from == to)
        return Slice.empty;
      let $from = this.resolve(from), $to = this.resolve(to);
      let depth = includeParents ? 0 : $from.sharedDepth(to);
      let start = $from.start(depth), node = $from.node(depth);
      let content = node.content.cut($from.pos - start, $to.pos - start);
      return new Slice(content, $from.depth - depth, $to.depth - depth);
    }
    /**
    Replace the part of the document between the given positions with
    the given slice. The slice must 'fit', meaning its open sides
    must be able to connect to the surrounding content, and its
    content nodes must be valid children for the node they are placed
    into. If any of this is violated, an error of type
    [`ReplaceError`](https://prosemirror.net/docs/ref/#model.ReplaceError) is thrown.
    */
    replace(from, to, slice) {
      return replace(this.resolve(from), this.resolve(to), slice);
    }
    /**
    Find the node directly after the given position.
    */
    nodeAt(pos) {
      for (let node = this; ; ) {
        let { index, offset } = node.content.findIndex(pos);
        node = node.maybeChild(index);
        if (!node)
          return null;
        if (offset == pos || node.isText)
          return node;
        pos -= offset + 1;
      }
    }
    /**
    Find the (direct) child node after the given offset, if any,
    and return it along with its index and offset relative to this
    node.
    */
    childAfter(pos) {
      let { index, offset } = this.content.findIndex(pos);
      return { node: this.content.maybeChild(index), index, offset };
    }
    /**
    Find the (direct) child node before the given offset, if any,
    and return it along with its index and offset relative to this
    node.
    */
    childBefore(pos) {
      if (pos == 0)
        return { node: null, index: 0, offset: 0 };
      let { index, offset } = this.content.findIndex(pos);
      if (offset < pos)
        return { node: this.content.child(index), index, offset };
      let node = this.content.child(index - 1);
      return { node, index: index - 1, offset: offset - node.nodeSize };
    }
    /**
    Resolve the given position in the document, returning an
    [object](https://prosemirror.net/docs/ref/#model.ResolvedPos) with information about its context.
    */
    resolve(pos) {
      return ResolvedPos.resolveCached(this, pos);
    }
    /**
    @internal
    */
    resolveNoCache(pos) {
      return ResolvedPos.resolve(this, pos);
    }
    /**
    Test whether a given mark or mark type occurs in this document
    between the two given positions.
    */
    rangeHasMark(from, to, type3) {
      let found2 = false;
      if (to > from)
        this.nodesBetween(from, to, (node) => {
          if (type3.isInSet(node.marks))
            found2 = true;
          return !found2;
        });
      return found2;
    }
    /**
    True when this is a block (non-inline node)
    */
    get isBlock() {
      return this.type.isBlock;
    }
    /**
    True when this is a textblock node, a block node with inline
    content.
    */
    get isTextblock() {
      return this.type.isTextblock;
    }
    /**
    True when this node allows inline content.
    */
    get inlineContent() {
      return this.type.inlineContent;
    }
    /**
    True when this is an inline node (a text node or a node that can
    appear among text).
    */
    get isInline() {
      return this.type.isInline;
    }
    /**
    True when this is a text node.
    */
    get isText() {
      return this.type.isText;
    }
    /**
    True when this is a leaf node.
    */
    get isLeaf() {
      return this.type.isLeaf;
    }
    /**
    True when this is an atom, i.e. when it does not have directly
    editable content. This is usually the same as `isLeaf`, but can
    be configured with the [`atom` property](https://prosemirror.net/docs/ref/#model.NodeSpec.atom)
    on a node's spec (typically used when the node is displayed as
    an uneditable [node view](https://prosemirror.net/docs/ref/#view.NodeView)).
    */
    get isAtom() {
      return this.type.isAtom;
    }
    /**
    Return a string representation of this node for debugging
    purposes.
    */
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      let name = this.type.name;
      if (this.content.size)
        name += "(" + this.content.toStringInner() + ")";
      return wrapMarks(this.marks, name);
    }
    /**
    Get the content match in this node at the given index.
    */
    contentMatchAt(index) {
      let match = this.type.contentMatch.matchFragment(this.content, 0, index);
      if (!match)
        throw new Error("Called contentMatchAt on a node with invalid content");
      return match;
    }
    /**
    Test whether replacing the range between `from` and `to` (by
    child index) with the given replacement fragment (which defaults
    to the empty fragment) would leave the node's content valid. You
    can optionally pass `start` and `end` indices into the
    replacement fragment.
    */
    canReplace(from, to, replacement = Fragment.empty, start = 0, end = replacement.childCount) {
      let one = this.contentMatchAt(from).matchFragment(replacement, start, end);
      let two = one && one.matchFragment(this.content, to);
      if (!two || !two.validEnd)
        return false;
      for (let i = start; i < end; i++)
        if (!this.type.allowsMarks(replacement.child(i).marks))
          return false;
      return true;
    }
    /**
    Test whether replacing the range `from` to `to` (by index) with
    a node of the given type would leave the node's content valid.
    */
    canReplaceWith(from, to, type3, marks) {
      if (marks && !this.type.allowsMarks(marks))
        return false;
      let start = this.contentMatchAt(from).matchType(type3);
      let end = start && start.matchFragment(this.content, to);
      return end ? end.validEnd : false;
    }
    /**
    Test whether the given node's content could be appended to this
    node. If that node is empty, this will only return true if there
    is at least one node type that can appear in both nodes (to avoid
    merging completely incompatible nodes).
    */
    canAppend(other) {
      if (other.content.size)
        return this.canReplace(this.childCount, this.childCount, other.content);
      else
        return this.type.compatibleContent(other.type);
    }
    /**
    Check whether this node and its descendants conform to the
    schema, and raise an exception when they do not.
    */
    check() {
      this.type.checkContent(this.content);
      this.type.checkAttrs(this.attrs);
      let copy2 = Mark.none;
      for (let i = 0; i < this.marks.length; i++) {
        let mark = this.marks[i];
        mark.type.checkAttrs(mark.attrs);
        copy2 = mark.addToSet(copy2);
      }
      if (!Mark.sameSet(copy2, this.marks))
        throw new RangeError(`Invalid collection of marks for node ${this.type.name}: ${this.marks.map((m) => m.type.name)}`);
      this.content.forEach((node) => node.check());
    }
    /**
    Return a JSON-serializeable representation of this node.
    */
    toJSON() {
      let obj = { type: this.type.name };
      for (let _ in this.attrs) {
        obj.attrs = this.attrs;
        break;
      }
      if (this.content.size)
        obj.content = this.content.toJSON();
      if (this.marks.length)
        obj.marks = this.marks.map((n) => n.toJSON());
      return obj;
    }
    /**
    Deserialize a node from its JSON representation.
    */
    static fromJSON(schema2, json) {
      if (!json)
        throw new RangeError("Invalid input for Node.fromJSON");
      let marks = void 0;
      if (json.marks) {
        if (!Array.isArray(json.marks))
          throw new RangeError("Invalid mark data for Node.fromJSON");
        marks = json.marks.map(schema2.markFromJSON);
      }
      if (json.type == "text") {
        if (typeof json.text != "string")
          throw new RangeError("Invalid text node in JSON");
        return schema2.text(json.text, marks);
      }
      let content = Fragment.fromJSON(schema2, json.content);
      let node = schema2.nodeType(json.type).create(json.attrs, content, marks);
      node.type.checkAttrs(node.attrs);
      return node;
    }
  };
  Node.prototype.text = void 0;
  var TextNode = class _TextNode extends Node {
    /**
    @internal
    */
    constructor(type3, attrs, content, marks) {
      super(type3, attrs, null, marks);
      if (!content)
        throw new RangeError("Empty text nodes are not allowed");
      this.text = content;
    }
    toString() {
      if (this.type.spec.toDebugString)
        return this.type.spec.toDebugString(this);
      return wrapMarks(this.marks, JSON.stringify(this.text));
    }
    get textContent() {
      return this.text;
    }
    textBetween(from, to) {
      return this.text.slice(from, to);
    }
    get nodeSize() {
      return this.text.length;
    }
    mark(marks) {
      return marks == this.marks ? this : new _TextNode(this.type, this.attrs, this.text, marks);
    }
    withText(text) {
      if (text == this.text)
        return this;
      return new _TextNode(this.type, this.attrs, text, this.marks);
    }
    cut(from = 0, to = this.text.length) {
      if (from == 0 && to == this.text.length)
        return this;
      return this.withText(this.text.slice(from, to));
    }
    eq(other) {
      return this.sameMarkup(other) && this.text == other.text;
    }
    toJSON() {
      let base = super.toJSON();
      base.text = this.text;
      return base;
    }
  };
  function wrapMarks(marks, str) {
    for (let i = marks.length - 1; i >= 0; i--)
      str = marks[i].type.name + "(" + str + ")";
    return str;
  }
  var ContentMatch = class _ContentMatch {
    /**
    @internal
    */
    constructor(validEnd) {
      this.validEnd = validEnd;
      this.next = [];
      this.wrapCache = [];
    }
    /**
    @internal
    */
    static parse(string, nodeTypes) {
      let stream = new TokenStream(string, nodeTypes);
      if (stream.next == null)
        return _ContentMatch.empty;
      let expr = parseExpr(stream);
      if (stream.next)
        stream.err("Unexpected trailing text");
      let match = dfa(nfa(expr));
      checkForDeadEnds(match, stream);
      return match;
    }
    /**
    Match a node type, returning a match after that node if
    successful.
    */
    matchType(type3) {
      for (let i = 0; i < this.next.length; i++)
        if (this.next[i].type == type3)
          return this.next[i].next;
      return null;
    }
    /**
    Try to match a fragment. Returns the resulting match when
    successful.
    */
    matchFragment(frag, start = 0, end = frag.childCount) {
      let cur = this;
      for (let i = start; cur && i < end; i++)
        cur = cur.matchType(frag.child(i).type);
      return cur;
    }
    /**
    @internal
    */
    get inlineContent() {
      return this.next.length != 0 && this.next[0].type.isInline;
    }
    /**
    Get the first matching node type at this match position that can
    be generated.
    */
    get defaultType() {
      for (let i = 0; i < this.next.length; i++) {
        let { type: type3 } = this.next[i];
        if (!(type3.isText || type3.hasRequiredAttrs()))
          return type3;
      }
      return null;
    }
    /**
    @internal
    */
    compatible(other) {
      for (let i = 0; i < this.next.length; i++)
        for (let j = 0; j < other.next.length; j++)
          if (this.next[i].type == other.next[j].type)
            return true;
      return false;
    }
    /**
    Try to match the given fragment, and if that fails, see if it can
    be made to match by inserting nodes in front of it. When
    successful, return a fragment of inserted nodes (which may be
    empty if nothing had to be inserted). When `toEnd` is true, only
    return a fragment if the resulting match goes to the end of the
    content expression.
    */
    fillBefore(after, toEnd = false, startIndex = 0) {
      let seen = [this];
      function search(match, types) {
        let finished = match.matchFragment(after, startIndex);
        if (finished && (!toEnd || finished.validEnd))
          return Fragment.from(types.map((tp) => tp.createAndFill()));
        for (let i = 0; i < match.next.length; i++) {
          let { type: type3, next } = match.next[i];
          if (!(type3.isText || type3.hasRequiredAttrs()) && seen.indexOf(next) == -1) {
            seen.push(next);
            let found2 = search(next, types.concat(type3));
            if (found2)
              return found2;
          }
        }
        return null;
      }
      return search(this, []);
    }
    /**
    Find a set of wrapping node types that would allow a node of the
    given type to appear at this position. The result may be empty
    (when it fits directly) and will be null when no such wrapping
    exists.
    */
    findWrapping(target) {
      for (let i = 0; i < this.wrapCache.length; i += 2)
        if (this.wrapCache[i] == target)
          return this.wrapCache[i + 1];
      let computed = this.computeWrapping(target);
      this.wrapCache.push(target, computed);
      return computed;
    }
    /**
    @internal
    */
    computeWrapping(target) {
      let seen = /* @__PURE__ */ Object.create(null), active = [{ match: this, type: null, via: null }];
      while (active.length) {
        let current = active.shift(), match = current.match;
        if (match.matchType(target)) {
          let result = [];
          for (let obj = current; obj.type; obj = obj.via)
            result.push(obj.type);
          return result.reverse();
        }
        for (let i = 0; i < match.next.length; i++) {
          let { type: type3, next } = match.next[i];
          if (!type3.isLeaf && !type3.hasRequiredAttrs() && !(type3.name in seen) && (!current.type || next.validEnd)) {
            active.push({ match: type3.contentMatch, type: type3, via: current });
            seen[type3.name] = true;
          }
        }
      }
      return null;
    }
    /**
    The number of outgoing edges this node has in the finite
    automaton that describes the content expression.
    */
    get edgeCount() {
      return this.next.length;
    }
    /**
    Get the _n_​th outgoing edge from this node in the finite
    automaton that describes the content expression.
    */
    edge(n) {
      if (n >= this.next.length)
        throw new RangeError(`There's no ${n}th edge in this content match`);
      return this.next[n];
    }
    /**
    @internal
    */
    toString() {
      let seen = [];
      function scan(m) {
        seen.push(m);
        for (let i = 0; i < m.next.length; i++)
          if (seen.indexOf(m.next[i].next) == -1)
            scan(m.next[i].next);
      }
      scan(this);
      return seen.map((m, i) => {
        let out = i + (m.validEnd ? "*" : " ") + " ";
        for (let i2 = 0; i2 < m.next.length; i2++)
          out += (i2 ? ", " : "") + m.next[i2].type.name + "->" + seen.indexOf(m.next[i2].next);
        return out;
      }).join("\n");
    }
  };
  ContentMatch.empty = new ContentMatch(true);
  var TokenStream = class {
    constructor(string, nodeTypes) {
      this.string = string;
      this.nodeTypes = nodeTypes;
      this.inline = null;
      this.pos = 0;
      this.tokens = string.split(/\s*(?=\b|\W|$)/);
      if (this.tokens[this.tokens.length - 1] == "")
        this.tokens.pop();
      if (this.tokens[0] == "")
        this.tokens.shift();
    }
    get next() {
      return this.tokens[this.pos];
    }
    eat(tok) {
      return this.next == tok && (this.pos++ || true);
    }
    err(str) {
      throw new SyntaxError(str + " (in content expression '" + this.string + "')");
    }
  };
  function parseExpr(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSeq(stream));
    } while (stream.eat("|"));
    return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
  }
  function parseExprSeq(stream) {
    let exprs = [];
    do {
      exprs.push(parseExprSubscript(stream));
    } while (stream.next && stream.next != ")" && stream.next != "|");
    return exprs.length == 1 ? exprs[0] : { type: "seq", exprs };
  }
  function parseExprSubscript(stream) {
    let expr = parseExprAtom(stream);
    for (; ; ) {
      if (stream.eat("+"))
        expr = { type: "plus", expr };
      else if (stream.eat("*"))
        expr = { type: "star", expr };
      else if (stream.eat("?"))
        expr = { type: "opt", expr };
      else if (stream.eat("{"))
        expr = parseExprRange(stream, expr);
      else
        break;
    }
    return expr;
  }
  function parseNum(stream) {
    if (/\D/.test(stream.next))
      stream.err("Expected number, got '" + stream.next + "'");
    let result = Number(stream.next);
    stream.pos++;
    return result;
  }
  function parseExprRange(stream, expr) {
    let min = parseNum(stream), max = min;
    if (stream.eat(",")) {
      if (stream.next != "}")
        max = parseNum(stream);
      else
        max = -1;
    }
    if (!stream.eat("}"))
      stream.err("Unclosed braced range");
    return { type: "range", min, max, expr };
  }
  function resolveName(stream, name) {
    let types = stream.nodeTypes, type3 = types[name];
    if (type3)
      return [type3];
    let result = [];
    for (let typeName in types) {
      let type4 = types[typeName];
      if (type4.isInGroup(name))
        result.push(type4);
    }
    if (result.length == 0)
      stream.err("No node type or group '" + name + "' found");
    return result;
  }
  function parseExprAtom(stream) {
    if (stream.eat("(")) {
      let expr = parseExpr(stream);
      if (!stream.eat(")"))
        stream.err("Missing closing paren");
      return expr;
    } else if (!/\W/.test(stream.next)) {
      let exprs = resolveName(stream, stream.next).map((type3) => {
        if (stream.inline == null)
          stream.inline = type3.isInline;
        else if (stream.inline != type3.isInline)
          stream.err("Mixing inline and block content");
        return { type: "name", value: type3 };
      });
      stream.pos++;
      return exprs.length == 1 ? exprs[0] : { type: "choice", exprs };
    } else {
      stream.err("Unexpected token '" + stream.next + "'");
    }
  }
  function nfa(expr) {
    let nfa2 = [[]];
    connect(compile(expr, 0), node());
    return nfa2;
    function node() {
      return nfa2.push([]) - 1;
    }
    function edge(from, to, term) {
      let edge2 = { term, to };
      nfa2[from].push(edge2);
      return edge2;
    }
    function connect(edges, to) {
      edges.forEach((edge2) => edge2.to = to);
    }
    function compile(expr2, from) {
      if (expr2.type == "choice") {
        return expr2.exprs.reduce((out, expr3) => out.concat(compile(expr3, from)), []);
      } else if (expr2.type == "seq") {
        for (let i = 0; ; i++) {
          let next = compile(expr2.exprs[i], from);
          if (i == expr2.exprs.length - 1)
            return next;
          connect(next, from = node());
        }
      } else if (expr2.type == "star") {
        let loop = node();
        edge(from, loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "plus") {
        let loop = node();
        connect(compile(expr2.expr, from), loop);
        connect(compile(expr2.expr, loop), loop);
        return [edge(loop)];
      } else if (expr2.type == "opt") {
        return [edge(from)].concat(compile(expr2.expr, from));
      } else if (expr2.type == "range") {
        let cur = from;
        for (let i = 0; i < expr2.min; i++) {
          let next = node();
          connect(compile(expr2.expr, cur), next);
          cur = next;
        }
        if (expr2.max == -1) {
          connect(compile(expr2.expr, cur), cur);
        } else {
          for (let i = expr2.min; i < expr2.max; i++) {
            let next = node();
            edge(cur, next);
            connect(compile(expr2.expr, cur), next);
            cur = next;
          }
        }
        return [edge(cur)];
      } else if (expr2.type == "name") {
        return [edge(from, void 0, expr2.value)];
      } else {
        throw new Error("Unknown expr type");
      }
    }
  }
  function cmp(a, b) {
    return b - a;
  }
  function nullFrom(nfa2, node) {
    let result = [];
    scan(node);
    return result.sort(cmp);
    function scan(node2) {
      let edges = nfa2[node2];
      if (edges.length == 1 && !edges[0].term)
        return scan(edges[0].to);
      result.push(node2);
      for (let i = 0; i < edges.length; i++) {
        let { term, to } = edges[i];
        if (!term && result.indexOf(to) == -1)
          scan(to);
      }
    }
  }
  function dfa(nfa2) {
    let labeled = /* @__PURE__ */ Object.create(null);
    return explore(nullFrom(nfa2, 0));
    function explore(states) {
      let out = [];
      states.forEach((node) => {
        nfa2[node].forEach(({ term, to }) => {
          if (!term)
            return;
          let set2;
          for (let i = 0; i < out.length; i++)
            if (out[i][0] == term)
              set2 = out[i][1];
          nullFrom(nfa2, to).forEach((node2) => {
            if (!set2)
              out.push([term, set2 = []]);
            if (set2.indexOf(node2) == -1)
              set2.push(node2);
          });
        });
      });
      let state = labeled[states.join(",")] = new ContentMatch(states.indexOf(nfa2.length - 1) > -1);
      for (let i = 0; i < out.length; i++) {
        let states2 = out[i][1].sort(cmp);
        state.next.push({ type: out[i][0], next: labeled[states2.join(",")] || explore(states2) });
      }
      return state;
    }
  }
  function checkForDeadEnds(match, stream) {
    for (let i = 0, work = [match]; i < work.length; i++) {
      let state = work[i], dead = !state.validEnd, nodes = [];
      for (let j = 0; j < state.next.length; j++) {
        let { type: type3, next } = state.next[j];
        nodes.push(type3.name);
        if (dead && !(type3.isText || type3.hasRequiredAttrs()))
          dead = false;
        if (work.indexOf(next) == -1)
          work.push(next);
      }
      if (dead)
        stream.err("Only non-generatable nodes (" + nodes.join(", ") + ") in a required position (see https://prosemirror.net/docs/guide/#generatable)");
    }
  }
  function defaultAttrs(attrs) {
    let defaults = /* @__PURE__ */ Object.create(null);
    for (let attrName in attrs) {
      let attr = attrs[attrName];
      if (!attr.hasDefault)
        return null;
      defaults[attrName] = attr.default;
    }
    return defaults;
  }
  function computeAttrs(attrs, value) {
    let built = /* @__PURE__ */ Object.create(null);
    for (let name in attrs) {
      let given = value && value[name];
      if (given === void 0) {
        let attr = attrs[name];
        if (attr.hasDefault)
          given = attr.default;
        else
          throw new RangeError("No value supplied for attribute " + name);
      }
      built[name] = given;
    }
    return built;
  }
  function checkAttrs(attrs, values, type3, name) {
    for (let attr in values)
      if (!(attr in attrs))
        throw new RangeError(`Unsupported attribute ${attr} for ${type3} of type ${name}`);
    for (let attr in attrs) {
      if (attrs[attr].validate)
        attrs[attr].validate(values[attr]);
    }
  }
  function initAttrs(typeName, attrs) {
    let result = /* @__PURE__ */ Object.create(null);
    if (attrs)
      for (let name in attrs)
        result[name] = new Attribute(typeName, name, attrs[name]);
    return result;
  }
  var NodeType = class _NodeType {
    /**
    @internal
    */
    constructor(name, schema2, spec) {
      this.name = name;
      this.schema = schema2;
      this.spec = spec;
      this.markSet = null;
      this.groups = spec.group ? spec.group.split(" ") : [];
      this.attrs = initAttrs(name, spec.attrs);
      this.defaultAttrs = defaultAttrs(this.attrs);
      this.contentMatch = null;
      this.inlineContent = null;
      this.isBlock = !(spec.inline || name == "text");
      this.isText = name == "text";
    }
    /**
    True if this is an inline type.
    */
    get isInline() {
      return !this.isBlock;
    }
    /**
    True if this is a textblock type, a block that contains inline
    content.
    */
    get isTextblock() {
      return this.isBlock && this.inlineContent;
    }
    /**
    True for node types that allow no content.
    */
    get isLeaf() {
      return this.contentMatch == ContentMatch.empty;
    }
    /**
    True when this node is an atom, i.e. when it does not have
    directly editable content.
    */
    get isAtom() {
      return this.isLeaf || !!this.spec.atom;
    }
    /**
    Return true when this node type is part of the given
    [group](https://prosemirror.net/docs/ref/#model.NodeSpec.group).
    */
    isInGroup(group) {
      return this.groups.indexOf(group) > -1;
    }
    /**
    The node type's [whitespace](https://prosemirror.net/docs/ref/#model.NodeSpec.whitespace) option.
    */
    get whitespace() {
      return this.spec.whitespace || (this.spec.code ? "pre" : "normal");
    }
    /**
    Tells you whether this node type has any required attributes.
    */
    hasRequiredAttrs() {
      for (let n in this.attrs)
        if (this.attrs[n].isRequired)
          return true;
      return false;
    }
    /**
    Indicates whether this node allows some of the same content as
    the given node type.
    */
    compatibleContent(other) {
      return this == other || this.contentMatch.compatible(other.contentMatch);
    }
    /**
    @internal
    */
    computeAttrs(attrs) {
      if (!attrs && this.defaultAttrs)
        return this.defaultAttrs;
      else
        return computeAttrs(this.attrs, attrs);
    }
    /**
    Create a `Node` of this type. The given attributes are
    checked and defaulted (you can pass `null` to use the type's
    defaults entirely, if no required attributes exist). `content`
    may be a `Fragment`, a node, an array of nodes, or
    `null`. Similarly `marks` may be `null` to default to the empty
    set of marks.
    */
    create(attrs = null, content, marks) {
      if (this.isText)
        throw new Error("NodeType.create can't construct text nodes");
      return new Node(this, this.computeAttrs(attrs), Fragment.from(content), Mark.setFrom(marks));
    }
    /**
    Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but check the given content
    against the node type's content restrictions, and throw an error
    if it doesn't match.
    */
    createChecked(attrs = null, content, marks) {
      content = Fragment.from(content);
      this.checkContent(content);
      return new Node(this, this.computeAttrs(attrs), content, Mark.setFrom(marks));
    }
    /**
    Like [`create`](https://prosemirror.net/docs/ref/#model.NodeType.create), but see if it is
    necessary to add nodes to the start or end of the given fragment
    to make it fit the node. If no fitting wrapping can be found,
    return null. Note that, due to the fact that required nodes can
    always be created, this will always succeed if you pass null or
    `Fragment.empty` as content.
    */
    createAndFill(attrs = null, content, marks) {
      attrs = this.computeAttrs(attrs);
      content = Fragment.from(content);
      if (content.size) {
        let before = this.contentMatch.fillBefore(content);
        if (!before)
          return null;
        content = before.append(content);
      }
      let matched = this.contentMatch.matchFragment(content);
      let after = matched && matched.fillBefore(Fragment.empty, true);
      if (!after)
        return null;
      return new Node(this, attrs, content.append(after), Mark.setFrom(marks));
    }
    /**
    Returns true if the given fragment is valid content for this node
    type.
    */
    validContent(content) {
      let result = this.contentMatch.matchFragment(content);
      if (!result || !result.validEnd)
        return false;
      for (let i = 0; i < content.childCount; i++)
        if (!this.allowsMarks(content.child(i).marks))
          return false;
      return true;
    }
    /**
    Throws a RangeError if the given fragment is not valid content for this
    node type.
    @internal
    */
    checkContent(content) {
      if (!this.validContent(content))
        throw new RangeError(`Invalid content for node ${this.name}: ${content.toString().slice(0, 50)}`);
    }
    /**
    @internal
    */
    checkAttrs(attrs) {
      checkAttrs(this.attrs, attrs, "node", this.name);
    }
    /**
    Check whether the given mark type is allowed in this node.
    */
    allowsMarkType(markType) {
      return this.markSet == null || this.markSet.indexOf(markType) > -1;
    }
    /**
    Test whether the given set of marks are allowed in this node.
    */
    allowsMarks(marks) {
      if (this.markSet == null)
        return true;
      for (let i = 0; i < marks.length; i++)
        if (!this.allowsMarkType(marks[i].type))
          return false;
      return true;
    }
    /**
    Removes the marks that are not allowed in this node from the given set.
    */
    allowedMarks(marks) {
      if (this.markSet == null)
        return marks;
      let copy2;
      for (let i = 0; i < marks.length; i++) {
        if (!this.allowsMarkType(marks[i].type)) {
          if (!copy2)
            copy2 = marks.slice(0, i);
        } else if (copy2) {
          copy2.push(marks[i]);
        }
      }
      return !copy2 ? marks : copy2.length ? copy2 : Mark.none;
    }
    /**
    @internal
    */
    static compile(nodes, schema2) {
      let result = /* @__PURE__ */ Object.create(null);
      nodes.forEach((name, spec) => result[name] = new _NodeType(name, schema2, spec));
      let topType = schema2.spec.topNode || "doc";
      if (!result[topType])
        throw new RangeError("Schema is missing its top node type ('" + topType + "')");
      if (!result.text)
        throw new RangeError("Every schema needs a 'text' type");
      for (let _ in result.text.attrs)
        throw new RangeError("The text node type should not have attributes");
      return result;
    }
  };
  function validateType(typeName, attrName, type3) {
    let types = type3.split("|");
    return (value) => {
      let name = value === null ? "null" : typeof value;
      if (types.indexOf(name) < 0)
        throw new RangeError(`Expected value of type ${types} for attribute ${attrName} on type ${typeName}, got ${name}`);
    };
  }
  var Attribute = class {
    constructor(typeName, attrName, options) {
      this.hasDefault = Object.prototype.hasOwnProperty.call(options, "default");
      this.default = options.default;
      this.validate = typeof options.validate == "string" ? validateType(typeName, attrName, options.validate) : options.validate;
    }
    get isRequired() {
      return !this.hasDefault;
    }
  };
  var MarkType = class _MarkType {
    /**
    @internal
    */
    constructor(name, rank, schema2, spec) {
      this.name = name;
      this.rank = rank;
      this.schema = schema2;
      this.spec = spec;
      this.attrs = initAttrs(name, spec.attrs);
      this.excluded = null;
      let defaults = defaultAttrs(this.attrs);
      this.instance = defaults ? new Mark(this, defaults) : null;
    }
    /**
    Create a mark of this type. `attrs` may be `null` or an object
    containing only some of the mark's attributes. The others, if
    they have defaults, will be added.
    */
    create(attrs = null) {
      if (!attrs && this.instance)
        return this.instance;
      return new Mark(this, computeAttrs(this.attrs, attrs));
    }
    /**
    @internal
    */
    static compile(marks, schema2) {
      let result = /* @__PURE__ */ Object.create(null), rank = 0;
      marks.forEach((name, spec) => result[name] = new _MarkType(name, rank++, schema2, spec));
      return result;
    }
    /**
    When there is a mark of this type in the given set, a new set
    without it is returned. Otherwise, the input set is returned.
    */
    removeFromSet(set2) {
      for (var i = 0; i < set2.length; i++)
        if (set2[i].type == this) {
          set2 = set2.slice(0, i).concat(set2.slice(i + 1));
          i--;
        }
      return set2;
    }
    /**
    Tests whether there is a mark of this type in the given set.
    */
    isInSet(set2) {
      for (let i = 0; i < set2.length; i++)
        if (set2[i].type == this)
          return set2[i];
    }
    /**
    @internal
    */
    checkAttrs(attrs) {
      checkAttrs(this.attrs, attrs, "mark", this.name);
    }
    /**
    Queries whether a given mark type is
    [excluded](https://prosemirror.net/docs/ref/#model.MarkSpec.excludes) by this one.
    */
    excludes(other) {
      return this.excluded.indexOf(other) > -1;
    }
  };
  var Schema = class {
    /**
    Construct a schema from a schema [specification](https://prosemirror.net/docs/ref/#model.SchemaSpec).
    */
    constructor(spec) {
      this.linebreakReplacement = null;
      this.cached = /* @__PURE__ */ Object.create(null);
      let instanceSpec = this.spec = {};
      for (let prop in spec)
        instanceSpec[prop] = spec[prop];
      instanceSpec.nodes = dist_default.from(spec.nodes), instanceSpec.marks = dist_default.from(spec.marks || {}), this.nodes = NodeType.compile(this.spec.nodes, this);
      this.marks = MarkType.compile(this.spec.marks, this);
      let contentExprCache = /* @__PURE__ */ Object.create(null);
      for (let prop in this.nodes) {
        if (prop in this.marks)
          throw new RangeError(prop + " can not be both a node and a mark");
        let type3 = this.nodes[prop], contentExpr = type3.spec.content || "", markExpr = type3.spec.marks;
        type3.contentMatch = contentExprCache[contentExpr] || (contentExprCache[contentExpr] = ContentMatch.parse(contentExpr, this.nodes));
        type3.inlineContent = type3.contentMatch.inlineContent;
        if (type3.spec.linebreakReplacement) {
          if (this.linebreakReplacement)
            throw new RangeError("Multiple linebreak nodes defined");
          if (!type3.isInline || !type3.isLeaf)
            throw new RangeError("Linebreak replacement nodes must be inline leaf nodes");
          this.linebreakReplacement = type3;
        }
        type3.markSet = markExpr == "_" ? null : markExpr ? gatherMarks(this, markExpr.split(" ")) : markExpr == "" || !type3.inlineContent ? [] : null;
      }
      for (let prop in this.marks) {
        let type3 = this.marks[prop], excl = type3.spec.excludes;
        type3.excluded = excl == null ? [type3] : excl == "" ? [] : gatherMarks(this, excl.split(" "));
      }
      this.nodeFromJSON = (json) => Node.fromJSON(this, json);
      this.markFromJSON = (json) => Mark.fromJSON(this, json);
      this.topNodeType = this.nodes[this.spec.topNode || "doc"];
      this.cached.wrappings = /* @__PURE__ */ Object.create(null);
    }
    /**
    Create a node in this schema. The `type` may be a string or a
    `NodeType` instance. Attributes will be extended with defaults,
    `content` may be a `Fragment`, `null`, a `Node`, or an array of
    nodes.
    */
    node(type3, attrs = null, content, marks) {
      if (typeof type3 == "string")
        type3 = this.nodeType(type3);
      else if (!(type3 instanceof NodeType))
        throw new RangeError("Invalid node type: " + type3);
      else if (type3.schema != this)
        throw new RangeError("Node type from different schema used (" + type3.name + ")");
      return type3.createChecked(attrs, content, marks);
    }
    /**
    Create a text node in the schema. Empty text nodes are not
    allowed.
    */
    text(text, marks) {
      let type3 = this.nodes.text;
      return new TextNode(type3, type3.defaultAttrs, text, Mark.setFrom(marks));
    }
    /**
    Create a mark with the given type and attributes.
    */
    mark(type3, attrs) {
      if (typeof type3 == "string")
        type3 = this.marks[type3];
      return type3.create(attrs);
    }
    /**
    @internal
    */
    nodeType(name) {
      let found2 = this.nodes[name];
      if (!found2)
        throw new RangeError("Unknown node type: " + name);
      return found2;
    }
  };
  function gatherMarks(schema2, marks) {
    let found2 = [];
    for (let i = 0; i < marks.length; i++) {
      let name = marks[i], mark = schema2.marks[name], ok = mark;
      if (mark) {
        found2.push(mark);
      } else {
        for (let prop in schema2.marks) {
          let mark2 = schema2.marks[prop];
          if (name == "_" || mark2.spec.group && mark2.spec.group.split(" ").indexOf(name) > -1)
            found2.push(ok = mark2);
        }
      }
      if (!ok)
        throw new SyntaxError("Unknown mark type: '" + marks[i] + "'");
    }
    return found2;
  }
  function isTagRule(rule) {
    return rule.tag != null;
  }
  function isStyleRule(rule) {
    return rule.style != null;
  }
  var DOMParser = class _DOMParser {
    /**
    Create a parser that targets the given schema, using the given
    parsing rules.
    */
    constructor(schema2, rules) {
      this.schema = schema2;
      this.rules = rules;
      this.tags = [];
      this.styles = [];
      let matchedStyles = this.matchedStyles = [];
      rules.forEach((rule) => {
        if (isTagRule(rule)) {
          this.tags.push(rule);
        } else if (isStyleRule(rule)) {
          let prop = /[^=]*/.exec(rule.style)[0];
          if (matchedStyles.indexOf(prop) < 0)
            matchedStyles.push(prop);
          this.styles.push(rule);
        }
      });
      this.normalizeLists = !this.tags.some((r) => {
        if (!/^(ul|ol)\b/.test(r.tag) || !r.node)
          return false;
        let node = schema2.nodes[r.node];
        return node.contentMatch.matchType(node);
      });
    }
    /**
    Parse a document from the content of a DOM node.
    */
    parse(dom, options = {}) {
      let context = new ParseContext(this, options, false);
      context.addAll(dom, Mark.none, options.from, options.to);
      return context.finish();
    }
    /**
    Parses the content of the given DOM node, like
    [`parse`](https://prosemirror.net/docs/ref/#model.DOMParser.parse), and takes the same set of
    options. But unlike that method, which produces a whole node,
    this one returns a slice that is open at the sides, meaning that
    the schema constraints aren't applied to the start of nodes to
    the left of the input and the end of nodes at the end.
    */
    parseSlice(dom, options = {}) {
      let context = new ParseContext(this, options, true);
      context.addAll(dom, Mark.none, options.from, options.to);
      return Slice.maxOpen(context.finish());
    }
    /**
    @internal
    */
    matchTag(dom, context, after) {
      for (let i = after ? this.tags.indexOf(after) + 1 : 0; i < this.tags.length; i++) {
        let rule = this.tags[i];
        if (matches(dom, rule.tag) && (rule.namespace === void 0 || dom.namespaceURI == rule.namespace) && (!rule.context || context.matchesContext(rule.context))) {
          if (rule.getAttrs) {
            let result = rule.getAttrs(dom);
            if (result === false)
              continue;
            rule.attrs = result || void 0;
          }
          return rule;
        }
      }
    }
    /**
    @internal
    */
    matchStyle(prop, value, context, after) {
      for (let i = after ? this.styles.indexOf(after) + 1 : 0; i < this.styles.length; i++) {
        let rule = this.styles[i], style = rule.style;
        if (style.indexOf(prop) != 0 || rule.context && !context.matchesContext(rule.context) || // Test that the style string either precisely matches the prop,
        // or has an '=' sign after the prop, followed by the given
        // value.
        style.length > prop.length && (style.charCodeAt(prop.length) != 61 || style.slice(prop.length + 1) != value))
          continue;
        if (rule.getAttrs) {
          let result = rule.getAttrs(value);
          if (result === false)
            continue;
          rule.attrs = result || void 0;
        }
        return rule;
      }
    }
    /**
    @internal
    */
    static schemaRules(schema2) {
      let result = [];
      function insert(rule) {
        let priority = rule.priority == null ? 50 : rule.priority, i = 0;
        for (; i < result.length; i++) {
          let next = result[i], nextPriority = next.priority == null ? 50 : next.priority;
          if (nextPriority < priority)
            break;
        }
        result.splice(i, 0, rule);
      }
      for (let name in schema2.marks) {
        let rules = schema2.marks[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            if (!(rule.mark || rule.ignore || rule.clearMark))
              rule.mark = name;
          });
      }
      for (let name in schema2.nodes) {
        let rules = schema2.nodes[name].spec.parseDOM;
        if (rules)
          rules.forEach((rule) => {
            insert(rule = copy(rule));
            if (!(rule.node || rule.ignore || rule.mark))
              rule.node = name;
          });
      }
      return result;
    }
    /**
    Construct a DOM parser using the parsing rules listed in a
    schema's [node specs](https://prosemirror.net/docs/ref/#model.NodeSpec.parseDOM), reordered by
    [priority](https://prosemirror.net/docs/ref/#model.GenericParseRule.priority).
    */
    static fromSchema(schema2) {
      return schema2.cached.domParser || (schema2.cached.domParser = new _DOMParser(schema2, _DOMParser.schemaRules(schema2)));
    }
  };
  var blockTags = {
    address: true,
    article: true,
    aside: true,
    blockquote: true,
    body: true,
    canvas: true,
    dd: true,
    div: true,
    dl: true,
    fieldset: true,
    figcaption: true,
    figure: true,
    footer: true,
    form: true,
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
    header: true,
    hgroup: true,
    hr: true,
    li: true,
    noscript: true,
    ol: true,
    output: true,
    p: true,
    pre: true,
    section: true,
    table: true,
    tfoot: true,
    ul: true
  };
  var ignoreTags = {
    head: true,
    noscript: true,
    object: true,
    script: true,
    style: true,
    title: true
  };
  var listTags = { ol: true, ul: true };
  var OPT_PRESERVE_WS = 1;
  var OPT_PRESERVE_WS_FULL = 2;
  var OPT_OPEN_LEFT = 4;
  function wsOptionsFor(type3, preserveWhitespace, base) {
    if (preserveWhitespace != null)
      return (preserveWhitespace ? OPT_PRESERVE_WS : 0) | (preserveWhitespace === "full" ? OPT_PRESERVE_WS_FULL : 0);
    return type3 && type3.whitespace == "pre" ? OPT_PRESERVE_WS | OPT_PRESERVE_WS_FULL : base & ~OPT_OPEN_LEFT;
  }
  var NodeContext = class {
    constructor(type3, attrs, marks, solid, match, options) {
      this.type = type3;
      this.attrs = attrs;
      this.marks = marks;
      this.solid = solid;
      this.options = options;
      this.content = [];
      this.activeMarks = Mark.none;
      this.match = match || (options & OPT_OPEN_LEFT ? null : type3.contentMatch);
    }
    findWrapping(node) {
      if (!this.match) {
        if (!this.type)
          return [];
        let fill = this.type.contentMatch.fillBefore(Fragment.from(node));
        if (fill) {
          this.match = this.type.contentMatch.matchFragment(fill);
        } else {
          let start = this.type.contentMatch, wrap2;
          if (wrap2 = start.findWrapping(node.type)) {
            this.match = start;
            return wrap2;
          } else {
            return null;
          }
        }
      }
      return this.match.findWrapping(node.type);
    }
    finish(openEnd) {
      if (!(this.options & OPT_PRESERVE_WS)) {
        let last = this.content[this.content.length - 1], m;
        if (last && last.isText && (m = /[ \t\r\n\u000c]+$/.exec(last.text))) {
          let text = last;
          if (last.text.length == m[0].length)
            this.content.pop();
          else
            this.content[this.content.length - 1] = text.withText(text.text.slice(0, text.text.length - m[0].length));
        }
      }
      let content = Fragment.from(this.content);
      if (!openEnd && this.match)
        content = content.append(this.match.fillBefore(Fragment.empty, true));
      return this.type ? this.type.create(this.attrs, content, this.marks) : content;
    }
    inlineContext(node) {
      if (this.type)
        return this.type.inlineContent;
      if (this.content.length)
        return this.content[0].isInline;
      return node.parentNode && !blockTags.hasOwnProperty(node.parentNode.nodeName.toLowerCase());
    }
  };
  var ParseContext = class {
    constructor(parser, options, isOpen) {
      this.parser = parser;
      this.options = options;
      this.isOpen = isOpen;
      this.open = 0;
      this.localPreserveWS = false;
      let topNode = options.topNode, topContext;
      let topOptions = wsOptionsFor(null, options.preserveWhitespace, 0) | (isOpen ? OPT_OPEN_LEFT : 0);
      if (topNode)
        topContext = new NodeContext(topNode.type, topNode.attrs, Mark.none, true, options.topMatch || topNode.type.contentMatch, topOptions);
      else if (isOpen)
        topContext = new NodeContext(null, null, Mark.none, true, null, topOptions);
      else
        topContext = new NodeContext(parser.schema.topNodeType, null, Mark.none, true, null, topOptions);
      this.nodes = [topContext];
      this.find = options.findPositions;
      this.needsBlock = false;
    }
    get top() {
      return this.nodes[this.open];
    }
    // Add a DOM node to the content. Text is inserted as text node,
    // otherwise, the node is passed to `addElement` or, if it has a
    // `style` attribute, `addElementWithStyles`.
    addDOM(dom, marks) {
      if (dom.nodeType == 3)
        this.addTextNode(dom, marks);
      else if (dom.nodeType == 1)
        this.addElement(dom, marks);
    }
    addTextNode(dom, marks) {
      let value = dom.nodeValue;
      let top = this.top, preserveWS = top.options & OPT_PRESERVE_WS_FULL ? "full" : this.localPreserveWS || (top.options & OPT_PRESERVE_WS) > 0;
      let { schema: schema2 } = this.parser;
      if (preserveWS === "full" || top.inlineContext(dom) || /[^ \t\r\n\u000c]/.test(value)) {
        if (!preserveWS) {
          value = value.replace(/[ \t\r\n\u000c]+/g, " ");
          if (/^[ \t\r\n\u000c]/.test(value) && this.open == this.nodes.length - 1) {
            let nodeBefore = top.content[top.content.length - 1];
            let domNodeBefore = dom.previousSibling;
            if (!nodeBefore || domNodeBefore && domNodeBefore.nodeName == "BR" || nodeBefore.isText && /[ \t\r\n\u000c]$/.test(nodeBefore.text))
              value = value.slice(1);
          }
        } else if (preserveWS === "full") {
          value = value.replace(/\r\n?/g, "\n");
        } else if (schema2.linebreakReplacement && /[\r\n]/.test(value) && this.top.findWrapping(schema2.linebreakReplacement.create())) {
          let lines = value.split(/\r?\n|\r/);
          for (let i = 0; i < lines.length; i++) {
            if (i)
              this.insertNode(schema2.linebreakReplacement.create(), marks, true);
            if (lines[i])
              this.insertNode(schema2.text(lines[i]), marks, !/\S/.test(lines[i]));
          }
          value = "";
        } else {
          value = value.replace(/\r?\n|\r/g, " ");
        }
        if (value)
          this.insertNode(schema2.text(value), marks, !/\S/.test(value));
        this.findInText(dom);
      } else {
        this.findInside(dom);
      }
    }
    // Try to find a handler for the given tag and use that to parse. If
    // none is found, the element's content nodes are added directly.
    addElement(dom, marks, matchAfter) {
      let outerWS = this.localPreserveWS, top = this.top;
      if (dom.tagName == "PRE" || /pre/.test(dom.style && dom.style.whiteSpace))
        this.localPreserveWS = true;
      let name = dom.nodeName.toLowerCase(), ruleID;
      if (listTags.hasOwnProperty(name) && this.parser.normalizeLists)
        normalizeList(dom);
      let rule = this.options.ruleFromNode && this.options.ruleFromNode(dom) || (ruleID = this.parser.matchTag(dom, this, matchAfter));
      out: if (rule ? rule.ignore : ignoreTags.hasOwnProperty(name)) {
        this.findInside(dom);
        this.ignoreFallback(dom, marks);
      } else if (!rule || rule.skip || rule.closeParent) {
        if (rule && rule.closeParent)
          this.open = Math.max(0, this.open - 1);
        else if (rule && rule.skip.nodeType)
          dom = rule.skip;
        let sync, oldNeedsBlock = this.needsBlock;
        if (blockTags.hasOwnProperty(name)) {
          if (top.content.length && top.content[0].isInline && this.open) {
            this.open--;
            top = this.top;
          }
          sync = true;
          if (!top.type)
            this.needsBlock = true;
        } else if (!dom.firstChild) {
          this.leafFallback(dom, marks);
          break out;
        }
        let innerMarks = rule && rule.skip ? marks : this.readStyles(dom, marks);
        if (innerMarks)
          this.addAll(dom, innerMarks);
        if (sync)
          this.sync(top);
        this.needsBlock = oldNeedsBlock;
      } else {
        let innerMarks = this.readStyles(dom, marks);
        if (innerMarks)
          this.addElementByRule(dom, rule, innerMarks, rule.consuming === false ? ruleID : void 0);
      }
      this.localPreserveWS = outerWS;
    }
    // Called for leaf DOM nodes that would otherwise be ignored
    leafFallback(dom, marks) {
      if (dom.nodeName == "BR" && this.top.type && this.top.type.inlineContent)
        this.addTextNode(dom.ownerDocument.createTextNode("\n"), marks);
    }
    // Called for ignored nodes
    ignoreFallback(dom, marks) {
      if (dom.nodeName == "BR" && (!this.top.type || !this.top.type.inlineContent))
        this.findPlace(this.parser.schema.text("-"), marks, true);
    }
    // Run any style parser associated with the node's styles. Either
    // return an updated array of marks, or null to indicate some of the
    // styles had a rule with `ignore` set.
    readStyles(dom, marks) {
      let styles2 = dom.style;
      if (styles2 && styles2.length)
        for (let i = 0; i < this.parser.matchedStyles.length; i++) {
          let name = this.parser.matchedStyles[i], value = styles2.getPropertyValue(name);
          if (value)
            for (let after = void 0; ; ) {
              let rule = this.parser.matchStyle(name, value, this, after);
              if (!rule)
                break;
              if (rule.ignore)
                return null;
              if (rule.clearMark)
                marks = marks.filter((m) => !rule.clearMark(m));
              else
                marks = marks.concat(this.parser.schema.marks[rule.mark].create(rule.attrs));
              if (rule.consuming === false)
                after = rule;
              else
                break;
            }
        }
      return marks;
    }
    // Look up a handler for the given node. If none are found, return
    // false. Otherwise, apply it, use its return value to drive the way
    // the node's content is wrapped, and return true.
    addElementByRule(dom, rule, marks, continueAfter) {
      let sync, nodeType;
      if (rule.node) {
        nodeType = this.parser.schema.nodes[rule.node];
        if (!nodeType.isLeaf) {
          let inner = this.enter(nodeType, rule.attrs || null, marks, rule.preserveWhitespace);
          if (inner) {
            sync = true;
            marks = inner;
          }
        } else if (!this.insertNode(nodeType.create(rule.attrs), marks, dom.nodeName == "BR")) {
          this.leafFallback(dom, marks);
        }
      } else {
        let markType = this.parser.schema.marks[rule.mark];
        marks = marks.concat(markType.create(rule.attrs));
      }
      let startIn = this.top;
      if (nodeType && nodeType.isLeaf) {
        this.findInside(dom);
      } else if (continueAfter) {
        this.addElement(dom, marks, continueAfter);
      } else if (rule.getContent) {
        this.findInside(dom);
        rule.getContent(dom, this.parser.schema).forEach((node) => this.insertNode(node, marks, false));
      } else {
        let contentDOM = dom;
        if (typeof rule.contentElement == "string")
          contentDOM = dom.querySelector(rule.contentElement);
        else if (typeof rule.contentElement == "function")
          contentDOM = rule.contentElement(dom);
        else if (rule.contentElement)
          contentDOM = rule.contentElement;
        this.findAround(dom, contentDOM, true);
        this.addAll(contentDOM, marks);
        this.findAround(dom, contentDOM, false);
      }
      if (sync && this.sync(startIn))
        this.open--;
    }
    // Add all child nodes between `startIndex` and `endIndex` (or the
    // whole node, if not given). If `sync` is passed, use it to
    // synchronize after every block element.
    addAll(parent, marks, startIndex, endIndex) {
      let index = startIndex || 0;
      for (let dom = startIndex ? parent.childNodes[startIndex] : parent.firstChild, end = endIndex == null ? null : parent.childNodes[endIndex]; dom != end; dom = dom.nextSibling, ++index) {
        this.findAtPoint(parent, index);
        this.addDOM(dom, marks);
      }
      this.findAtPoint(parent, index);
    }
    // Try to find a way to fit the given node type into the current
    // context. May add intermediate wrappers and/or leave non-solid
    // nodes that we're in.
    findPlace(node, marks, cautious) {
      let route, sync;
      for (let depth = this.open, penalty = 0; depth >= 0; depth--) {
        let cx = this.nodes[depth];
        let found2 = cx.findWrapping(node);
        if (found2 && (!route || route.length > found2.length + penalty)) {
          route = found2;
          sync = cx;
          if (!found2.length)
            break;
        }
        if (cx.solid) {
          if (cautious)
            break;
          penalty += 2;
        }
      }
      if (!route)
        return null;
      this.sync(sync);
      for (let i = 0; i < route.length; i++)
        marks = this.enterInner(route[i], null, marks, false);
      return marks;
    }
    // Try to insert the given node, adjusting the context when needed.
    insertNode(node, marks, cautious) {
      if (node.isInline && this.needsBlock && !this.top.type) {
        let block = this.textblockFromContext();
        if (block)
          marks = this.enterInner(block, null, marks);
      }
      let innerMarks = this.findPlace(node, marks, cautious);
      if (innerMarks) {
        this.closeExtra();
        let top = this.top;
        if (top.match)
          top.match = top.match.matchType(node.type);
        let nodeMarks = Mark.none;
        for (let m of innerMarks.concat(node.marks))
          if (top.type ? top.type.allowsMarkType(m.type) : markMayApply(m.type, node.type))
            nodeMarks = m.addToSet(nodeMarks);
        top.content.push(node.mark(nodeMarks));
        return true;
      }
      return false;
    }
    // Try to start a node of the given type, adjusting the context when
    // necessary.
    enter(type3, attrs, marks, preserveWS) {
      let innerMarks = this.findPlace(type3.create(attrs), marks, false);
      if (innerMarks)
        innerMarks = this.enterInner(type3, attrs, marks, true, preserveWS);
      return innerMarks;
    }
    // Open a node of the given type
    enterInner(type3, attrs, marks, solid = false, preserveWS) {
      this.closeExtra();
      let top = this.top;
      top.match = top.match && top.match.matchType(type3);
      let options = wsOptionsFor(type3, preserveWS, top.options);
      if (top.options & OPT_OPEN_LEFT && top.content.length == 0)
        options |= OPT_OPEN_LEFT;
      let applyMarks = Mark.none;
      marks = marks.filter((m) => {
        if (top.type ? top.type.allowsMarkType(m.type) : markMayApply(m.type, type3)) {
          applyMarks = m.addToSet(applyMarks);
          return false;
        }
        return true;
      });
      this.nodes.push(new NodeContext(type3, attrs, applyMarks, solid, null, options));
      this.open++;
      return marks;
    }
    // Make sure all nodes above this.open are finished and added to
    // their parents
    closeExtra(openEnd = false) {
      let i = this.nodes.length - 1;
      if (i > this.open) {
        for (; i > this.open; i--)
          this.nodes[i - 1].content.push(this.nodes[i].finish(openEnd));
        this.nodes.length = this.open + 1;
      }
    }
    finish() {
      this.open = 0;
      this.closeExtra(this.isOpen);
      return this.nodes[0].finish(!!(this.isOpen || this.options.topOpen));
    }
    sync(to) {
      for (let i = this.open; i >= 0; i--) {
        if (this.nodes[i] == to) {
          this.open = i;
          return true;
        } else if (this.localPreserveWS) {
          this.nodes[i].options |= OPT_PRESERVE_WS;
        }
      }
      return false;
    }
    get currentPos() {
      this.closeExtra();
      let pos = 0;
      for (let i = this.open; i >= 0; i--) {
        let content = this.nodes[i].content;
        for (let j = content.length - 1; j >= 0; j--)
          pos += content[j].nodeSize;
        if (i)
          pos++;
      }
      return pos;
    }
    findAtPoint(parent, offset) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].node == parent && this.find[i].offset == offset)
            this.find[i].pos = this.currentPos;
        }
    }
    findInside(parent) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node))
            this.find[i].pos = this.currentPos;
        }
    }
    findAround(parent, content, before) {
      if (parent != content && this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].pos == null && parent.nodeType == 1 && parent.contains(this.find[i].node)) {
            let pos = content.compareDocumentPosition(this.find[i].node);
            if (pos & (before ? 2 : 4))
              this.find[i].pos = this.currentPos;
          }
        }
    }
    findInText(textNode) {
      if (this.find)
        for (let i = 0; i < this.find.length; i++) {
          if (this.find[i].node == textNode)
            this.find[i].pos = this.currentPos - (textNode.nodeValue.length - this.find[i].offset);
        }
    }
    // Determines whether the given context string matches this context.
    matchesContext(context) {
      if (context.indexOf("|") > -1)
        return context.split(/\s*\|\s*/).some(this.matchesContext, this);
      let parts = context.split("/");
      let option = this.options.context;
      let useRoot = !this.isOpen && (!option || option.parent.type == this.nodes[0].type);
      let minDepth = -(option ? option.depth + 1 : 0) + (useRoot ? 0 : 1);
      let match = (i, depth) => {
        for (; i >= 0; i--) {
          let part = parts[i];
          if (part == "") {
            if (i == parts.length - 1 || i == 0)
              continue;
            for (; depth >= minDepth; depth--)
              if (match(i - 1, depth))
                return true;
            return false;
          } else {
            let next = depth > 0 || depth == 0 && useRoot ? this.nodes[depth].type : option && depth >= minDepth ? option.node(depth - minDepth).type : null;
            if (!next || next.name != part && !next.isInGroup(part))
              return false;
            depth--;
          }
        }
        return true;
      };
      return match(parts.length - 1, this.open);
    }
    textblockFromContext() {
      let $context = this.options.context;
      if ($context)
        for (let d = $context.depth; d >= 0; d--) {
          let deflt = $context.node(d).contentMatchAt($context.indexAfter(d)).defaultType;
          if (deflt && deflt.isTextblock && deflt.defaultAttrs)
            return deflt;
        }
      for (let name in this.parser.schema.nodes) {
        let type3 = this.parser.schema.nodes[name];
        if (type3.isTextblock && type3.defaultAttrs)
          return type3;
      }
    }
  };
  function normalizeList(dom) {
    for (let child = dom.firstChild, prevItem = null; child; child = child.nextSibling) {
      let name = child.nodeType == 1 ? child.nodeName.toLowerCase() : null;
      if (name && listTags.hasOwnProperty(name) && prevItem) {
        prevItem.appendChild(child);
        child = prevItem;
      } else if (name == "li") {
        prevItem = child;
      } else if (name) {
        prevItem = null;
      }
    }
  }
  function matches(dom, selector) {
    return (dom.matches || dom.msMatchesSelector || dom.webkitMatchesSelector || dom.mozMatchesSelector).call(dom, selector);
  }
  function copy(obj) {
    let copy2 = {};
    for (let prop in obj)
      copy2[prop] = obj[prop];
    return copy2;
  }
  function markMayApply(markType, nodeType) {
    let nodes = nodeType.schema.nodes;
    for (let name in nodes) {
      let parent = nodes[name];
      if (!parent.allowsMarkType(markType))
        continue;
      let seen = [], scan = (match) => {
        seen.push(match);
        for (let i = 0; i < match.edgeCount; i++) {
          let { type: type3, next } = match.edge(i);
          if (type3 == nodeType)
            return true;
          if (seen.indexOf(next) < 0 && scan(next))
            return true;
        }
      };
      if (scan(parent.contentMatch))
        return true;
    }
  }
  var DOMSerializer = class _DOMSerializer {
    /**
    Create a serializer. `nodes` should map node names to functions
    that take a node and return a description of the corresponding
    DOM. `marks` does the same for mark names, but also gets an
    argument that tells it whether the mark's content is block or
    inline content (for typical use, it'll always be inline). A mark
    serializer may be `null` to indicate that marks of that type
    should not be serialized.
    */
    constructor(nodes, marks) {
      this.nodes = nodes;
      this.marks = marks;
    }
    /**
    Serialize the content of this fragment to a DOM fragment. When
    not in the browser, the `document` option, containing a DOM
    document, should be passed so that the serializer can create
    nodes.
    */
    serializeFragment(fragment, options = {}, target) {
      if (!target)
        target = doc(options).createDocumentFragment();
      let top = target, active = [];
      fragment.forEach((node) => {
        if (active.length || node.marks.length) {
          let keep = 0, rendered = 0;
          while (keep < active.length && rendered < node.marks.length) {
            let next = node.marks[rendered];
            if (!this.marks[next.type.name]) {
              rendered++;
              continue;
            }
            if (!next.eq(active[keep][0]) || next.type.spec.spanning === false)
              break;
            keep++;
            rendered++;
          }
          while (keep < active.length)
            top = active.pop()[1];
          while (rendered < node.marks.length) {
            let add = node.marks[rendered++];
            let markDOM = this.serializeMark(add, node.isInline, options);
            if (markDOM) {
              active.push([add, top]);
              top.appendChild(markDOM.dom);
              top = markDOM.contentDOM || markDOM.dom;
            }
          }
        }
        top.appendChild(this.serializeNodeInner(node, options));
      });
      return target;
    }
    /**
    @internal
    */
    serializeNodeInner(node, options) {
      if (node.isText)
        return doc(options).createTextNode(node.text);
      let { dom, contentDOM } = renderSpec(doc(options), this.nodes[node.type.name](node), null, node.attrs);
      if (contentDOM) {
        if (node.isLeaf)
          throw new RangeError("Content hole not allowed in a leaf node spec");
        this.serializeFragment(node.content, options, contentDOM);
      }
      return dom;
    }
    /**
    Serialize this node to a DOM node. This can be useful when you
    need to serialize a part of a document, as opposed to the whole
    document. To serialize a whole document, use
    [`serializeFragment`](https://prosemirror.net/docs/ref/#model.DOMSerializer.serializeFragment) on
    its [content](https://prosemirror.net/docs/ref/#model.Node.content).
    */
    serializeNode(node, options = {}) {
      let dom = this.serializeNodeInner(node, options);
      for (let i = node.marks.length - 1; i >= 0; i--) {
        let wrap2 = this.serializeMark(node.marks[i], node.isInline, options);
        if (wrap2) {
          (wrap2.contentDOM || wrap2.dom).appendChild(dom);
          dom = wrap2.dom;
        }
      }
      return dom;
    }
    /**
    @internal
    */
    serializeMark(mark, inline, options = {}) {
      let toDOM = this.marks[mark.type.name];
      return toDOM && renderSpec(doc(options), toDOM(mark, inline), null, mark.attrs);
    }
    static renderSpec(doc3, structure, xmlNS = null, blockArraysIn) {
      if (typeof structure == "string")
        return { dom: doc3.createTextNode(structure) };
      return renderSpec(doc3, structure, xmlNS, blockArraysIn);
    }
    /**
    Build a serializer using the [`toDOM`](https://prosemirror.net/docs/ref/#model.NodeSpec.toDOM)
    properties in a schema's node and mark specs.
    */
    static fromSchema(schema2) {
      return schema2.cached.domSerializer || (schema2.cached.domSerializer = new _DOMSerializer(this.nodesFromSchema(schema2), this.marksFromSchema(schema2)));
    }
    /**
    Gather the serializers in a schema's node specs into an object.
    This can be useful as a base to build a custom serializer from.
    */
    static nodesFromSchema(schema2) {
      let result = gatherToDOM(schema2.nodes);
      if (!result.text)
        result.text = (node) => node.text;
      return result;
    }
    /**
    Gather the serializers in a schema's mark specs into an object.
    */
    static marksFromSchema(schema2) {
      return gatherToDOM(schema2.marks);
    }
  };
  function gatherToDOM(obj) {
    let result = {};
    for (let name in obj) {
      let toDOM = obj[name].spec.toDOM;
      if (toDOM)
        result[name] = toDOM;
    }
    return result;
  }
  function doc(options) {
    return options.document || window.document;
  }
  var suspiciousAttributeCache = /* @__PURE__ */ new WeakMap();
  function suspiciousAttributes(attrs) {
    let value = suspiciousAttributeCache.get(attrs);
    if (value === void 0)
      suspiciousAttributeCache.set(attrs, value = suspiciousAttributesInner(attrs));
    return value;
  }
  function suspiciousAttributesInner(attrs) {
    let result = null;
    function scan(value) {
      if (value && typeof value == "object") {
        if (Array.isArray(value)) {
          if (typeof value[0] == "string") {
            if (!result)
              result = [];
            result.push(value);
          } else {
            for (let i = 0; i < value.length; i++)
              scan(value[i]);
          }
        } else {
          for (let prop in value)
            scan(value[prop]);
        }
      }
    }
    scan(attrs);
    return result;
  }
  function renderSpec(doc3, structure, xmlNS, blockArraysIn) {
    if (structure.nodeType == 1)
      return { dom: structure };
    if (structure.dom && structure.dom.nodeType == 1)
      return structure;
    let tagName = structure[0], suspicious;
    if (typeof tagName != "string")
      throw new RangeError("Invalid array passed to renderSpec");
    if (blockArraysIn && (suspicious = suspiciousAttributes(blockArraysIn)) && suspicious.indexOf(structure) > -1)
      throw new RangeError("Using an array from an attribute object as a DOM spec. This may be an attempted cross site scripting attack.");
    let space = tagName.indexOf(" ");
    if (space > 0) {
      xmlNS = tagName.slice(0, space);
      tagName = tagName.slice(space + 1);
    }
    let contentDOM;
    let dom = xmlNS ? doc3.createElementNS(xmlNS, tagName) : doc3.createElement(tagName);
    let attrs = structure[1], start = 1;
    if (attrs && typeof attrs == "object" && attrs.nodeType == null && !Array.isArray(attrs)) {
      start = 2;
      for (let name in attrs)
        if (attrs[name] != null) {
          let space2 = name.indexOf(" ");
          if (space2 > 0)
            dom.setAttributeNS(name.slice(0, space2), name.slice(space2 + 1), attrs[name]);
          else if (name == "style" && dom.style)
            dom.style.cssText = attrs[name];
          else
            dom.setAttribute(name, attrs[name]);
        }
    }
    for (let i = start; i < structure.length; i++) {
      let child = structure[i];
      if (child === 0) {
        if (i < structure.length - 1 || i > start)
          throw new RangeError("Content hole must be the only child of its parent node");
        return { dom, contentDOM: dom };
      } else if (typeof child == "string") {
        dom.appendChild(doc3.createTextNode(child));
      } else {
        let { dom: inner, contentDOM: innerContent } = renderSpec(doc3, child, xmlNS, blockArraysIn);
        dom.appendChild(inner);
        if (innerContent) {
          if (contentDOM)
            throw new RangeError("Multiple content holes");
          contentDOM = innerContent;
        }
      }
    }
    return { dom, contentDOM };
  }

  // ../node_modules/.pnpm/prosemirror-transform@1.12.1/node_modules/prosemirror-transform/dist/index.js
  var lower16 = 65535;
  var factor16 = Math.pow(2, 16);
  function makeRecover(index, offset) {
    return index + offset * factor16;
  }
  function recoverIndex(value) {
    return value & lower16;
  }
  function recoverOffset(value) {
    return (value - (value & lower16)) / factor16;
  }
  var DEL_BEFORE = 1;
  var DEL_AFTER = 2;
  var DEL_ACROSS = 4;
  var DEL_SIDE = 8;
  var MapResult = class {
    /**
    @internal
    */
    constructor(pos, delInfo, recover) {
      this.pos = pos;
      this.delInfo = delInfo;
      this.recover = recover;
    }
    /**
    Tells you whether the position was deleted, that is, whether the
    step removed the token on the side queried (via the `assoc`)
    argument from the document.
    */
    get deleted() {
      return (this.delInfo & DEL_SIDE) > 0;
    }
    /**
    Tells you whether the token before the mapped position was deleted.
    */
    get deletedBefore() {
      return (this.delInfo & (DEL_BEFORE | DEL_ACROSS)) > 0;
    }
    /**
    True when the token after the mapped position was deleted.
    */
    get deletedAfter() {
      return (this.delInfo & (DEL_AFTER | DEL_ACROSS)) > 0;
    }
    /**
    Tells whether any of the steps mapped through deletes across the
    position (including both the token before and after the
    position).
    */
    get deletedAcross() {
      return (this.delInfo & DEL_ACROSS) > 0;
    }
  };
  var StepMap = class _StepMap {
    /**
    Create a position map. The modifications to the document are
    represented as an array of numbers, in which each group of three
    represents a modified chunk as `[start, oldSize, newSize]`.
    */
    constructor(ranges, inverted = false) {
      this.ranges = ranges;
      this.inverted = inverted;
      if (!ranges.length && _StepMap.empty)
        return _StepMap.empty;
    }
    /**
    @internal
    */
    recover(value) {
      let diff = 0, index = recoverIndex(value);
      if (!this.inverted)
        for (let i = 0; i < index; i++)
          diff += this.ranges[i * 3 + 2] - this.ranges[i * 3 + 1];
      return this.ranges[index * 3] + diff + recoverOffset(value);
    }
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    map(pos, assoc = 1) {
      return this._map(pos, assoc, true);
    }
    /**
    @internal
    */
    _map(pos, assoc, simple) {
      let diff = 0, oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex], end = start + oldSize;
        if (pos <= end) {
          let side = !oldSize ? assoc : pos == start ? -1 : pos == end ? 1 : assoc;
          let result = start + diff + (side < 0 ? 0 : newSize);
          if (simple)
            return result;
          let recover = pos == (assoc < 0 ? start : end) ? null : makeRecover(i / 3, pos - start);
          let del = pos == start ? DEL_AFTER : pos == end ? DEL_BEFORE : DEL_ACROSS;
          if (assoc < 0 ? pos != start : pos != end)
            del |= DEL_SIDE;
          return new MapResult(result, del, recover);
        }
        diff += newSize - oldSize;
      }
      return simple ? pos + diff : new MapResult(pos + diff, 0, null);
    }
    /**
    @internal
    */
    touches(pos, recover) {
      let diff = 0, index = recoverIndex(recover);
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i] - (this.inverted ? diff : 0);
        if (start > pos)
          break;
        let oldSize = this.ranges[i + oldIndex], end = start + oldSize;
        if (pos <= end && i == index * 3)
          return true;
        diff += this.ranges[i + newIndex] - oldSize;
      }
      return false;
    }
    /**
    Calls the given function on each of the changed ranges included in
    this map.
    */
    forEach(f) {
      let oldIndex = this.inverted ? 2 : 1, newIndex = this.inverted ? 1 : 2;
      for (let i = 0, diff = 0; i < this.ranges.length; i += 3) {
        let start = this.ranges[i], oldStart = start - (this.inverted ? diff : 0), newStart = start + (this.inverted ? 0 : diff);
        let oldSize = this.ranges[i + oldIndex], newSize = this.ranges[i + newIndex];
        f(oldStart, oldStart + oldSize, newStart, newStart + newSize);
        diff += newSize - oldSize;
      }
    }
    /**
    Create an inverted version of this map. The result can be used to
    map positions in the post-step document to the pre-step document.
    */
    invert() {
      return new _StepMap(this.ranges, !this.inverted);
    }
    /**
    @internal
    */
    toString() {
      return (this.inverted ? "-" : "") + JSON.stringify(this.ranges);
    }
    /**
    Create a map that moves all positions by offset `n` (which may be
    negative). This can be useful when applying steps meant for a
    sub-document to a larger document, or vice-versa.
    */
    static offset(n) {
      return n == 0 ? _StepMap.empty : new _StepMap(n < 0 ? [0, -n, 0] : [0, 0, n]);
    }
  };
  StepMap.empty = new StepMap([]);
  var Mapping = class _Mapping {
    /**
    Create a new mapping with the given position maps.
    */
    constructor(maps, mirror, from = 0, to = maps ? maps.length : 0) {
      this.mirror = mirror;
      this.from = from;
      this.to = to;
      this._maps = maps || [];
      this.ownData = !(maps || mirror);
    }
    /**
    The step maps in this mapping.
    */
    get maps() {
      return this._maps;
    }
    /**
    Create a mapping that maps only through a part of this one.
    */
    slice(from = 0, to = this.maps.length) {
      return new _Mapping(this._maps, this.mirror, from, to);
    }
    /**
    Add a step map to the end of this mapping. If `mirrors` is
    given, it should be the index of the step map that is the mirror
    image of this one.
    */
    appendMap(map, mirrors) {
      if (!this.ownData) {
        this._maps = this._maps.slice();
        this.mirror = this.mirror && this.mirror.slice();
        this.ownData = true;
      }
      this.to = this._maps.push(map);
      if (mirrors != null)
        this.setMirror(this._maps.length - 1, mirrors);
    }
    /**
    Add all the step maps in a given mapping to this one (preserving
    mirroring information).
    */
    appendMapping(mapping) {
      for (let i = 0, startSize = this._maps.length; i < mapping._maps.length; i++) {
        let mirr = mapping.getMirror(i);
        this.appendMap(mapping._maps[i], mirr != null && mirr < i ? startSize + mirr : void 0);
      }
    }
    /**
    Finds the offset of the step map that mirrors the map at the
    given offset, in this mapping (as per the second argument to
    `appendMap`).
    */
    getMirror(n) {
      if (this.mirror) {
        for (let i = 0; i < this.mirror.length; i++)
          if (this.mirror[i] == n)
            return this.mirror[i + (i % 2 ? -1 : 1)];
      }
    }
    /**
    @internal
    */
    setMirror(n, m) {
      if (!this.mirror)
        this.mirror = [];
      this.mirror.push(n, m);
    }
    /**
    Append the inverse of the given mapping to this one.
    */
    appendMappingInverted(mapping) {
      for (let i = mapping.maps.length - 1, totalSize = this._maps.length + mapping._maps.length; i >= 0; i--) {
        let mirr = mapping.getMirror(i);
        this.appendMap(mapping._maps[i].invert(), mirr != null && mirr > i ? totalSize - mirr - 1 : void 0);
      }
    }
    /**
    Create an inverted version of this mapping.
    */
    invert() {
      let inverse = new _Mapping();
      inverse.appendMappingInverted(this);
      return inverse;
    }
    /**
    Map a position through this mapping.
    */
    map(pos, assoc = 1) {
      if (this.mirror)
        return this._map(pos, assoc, true);
      for (let i = this.from; i < this.to; i++)
        pos = this._maps[i].map(pos, assoc);
      return pos;
    }
    /**
    Map a position through this mapping, returning a mapping
    result.
    */
    mapResult(pos, assoc = 1) {
      return this._map(pos, assoc, false);
    }
    /**
    @internal
    */
    _map(pos, assoc, simple) {
      let delInfo = 0;
      for (let i = this.from; i < this.to; i++) {
        let map = this._maps[i], result = map.mapResult(pos, assoc);
        if (result.recover != null) {
          let corr = this.getMirror(i);
          if (corr != null && corr > i && corr < this.to) {
            i = corr;
            pos = this._maps[corr].recover(result.recover);
            continue;
          }
        }
        delInfo |= result.delInfo;
        pos = result.pos;
      }
      return simple ? pos : new MapResult(pos, delInfo, null);
    }
  };
  var stepsByID = /* @__PURE__ */ Object.create(null);
  var Step = class {
    /**
    Get the step map that represents the changes made by this step,
    and which can be used to transform between positions in the old
    and the new document.
    */
    getMap() {
      return StepMap.empty;
    }
    /**
    Try to merge this step with another one, to be applied directly
    after it. Returns the merged step when possible, null if the
    steps can't be merged.
    */
    merge(other) {
      return null;
    }
    /**
    Deserialize a step from its JSON representation. Will call
    through to the step class' own implementation of this method.
    */
    static fromJSON(schema2, json) {
      if (!json || !json.stepType)
        throw new RangeError("Invalid input for Step.fromJSON");
      let type3 = stepsByID[json.stepType];
      if (!type3)
        throw new RangeError(`No step type ${json.stepType} defined`);
      return type3.fromJSON(schema2, json);
    }
    /**
    To be able to serialize steps to JSON, each step needs a string
    ID to attach to its JSON representation. Use this method to
    register an ID for your step classes. Try to pick something
    that's unlikely to clash with steps from other modules.
    */
    static jsonID(id, stepClass) {
      if (id in stepsByID)
        throw new RangeError("Duplicate use of step JSON ID " + id);
      stepsByID[id] = stepClass;
      stepClass.prototype.jsonID = id;
      return stepClass;
    }
  };
  var StepResult = class _StepResult {
    /**
    @internal
    */
    constructor(doc3, failed) {
      this.doc = doc3;
      this.failed = failed;
    }
    /**
    Create a successful step result.
    */
    static ok(doc3) {
      return new _StepResult(doc3, null);
    }
    /**
    Create a failed step result.
    */
    static fail(message) {
      return new _StepResult(null, message);
    }
    /**
    Call [`Node.replace`](https://prosemirror.net/docs/ref/#model.Node.replace) with the given
    arguments. Create a successful result if it succeeds, and a
    failed one if it throws a `ReplaceError`.
    */
    static fromReplace(doc3, from, to, slice) {
      try {
        return _StepResult.ok(doc3.replace(from, to, slice));
      } catch (e) {
        if (e instanceof ReplaceError)
          return _StepResult.fail(e.message);
        throw e;
      }
    }
  };
  function mapFragment(fragment, f, parent) {
    let mapped = [];
    for (let i = 0; i < fragment.childCount; i++) {
      let child = fragment.child(i);
      if (child.content.size)
        child = child.copy(mapFragment(child.content, f, child));
      if (child.isInline)
        child = f(child, parent, i);
      mapped.push(child);
    }
    return Fragment.fromArray(mapped);
  }
  var AddMarkStep = class _AddMarkStep extends Step {
    /**
    Create a mark step.
    */
    constructor(from, to, mark) {
      super();
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    apply(doc3) {
      let oldSlice = doc3.slice(this.from, this.to), $from = doc3.resolve(this.from);
      let parent = $from.node($from.sharedDepth(this.to));
      let slice = new Slice(mapFragment(oldSlice.content, (node, parent2) => {
        if (!node.isAtom || !parent2.type.allowsMarkType(this.mark.type))
          return node;
        return node.mark(this.mark.addToSet(node.marks));
      }, parent), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc3, this.from, this.to, slice);
    }
    invert() {
      return new RemoveMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos)
        return null;
      return new _AddMarkStep(from.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof _AddMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new _AddMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "addMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    /**
    @internal
    */
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for AddMarkStep.fromJSON");
      return new _AddMarkStep(json.from, json.to, schema2.markFromJSON(json.mark));
    }
  };
  Step.jsonID("addMark", AddMarkStep);
  var RemoveMarkStep = class _RemoveMarkStep extends Step {
    /**
    Create a mark-removing step.
    */
    constructor(from, to, mark) {
      super();
      this.from = from;
      this.to = to;
      this.mark = mark;
    }
    apply(doc3) {
      let oldSlice = doc3.slice(this.from, this.to);
      let slice = new Slice(mapFragment(oldSlice.content, (node) => {
        return node.mark(this.mark.removeFromSet(node.marks));
      }, doc3), oldSlice.openStart, oldSlice.openEnd);
      return StepResult.fromReplace(doc3, this.from, this.to, slice);
    }
    invert() {
      return new AddMarkStep(this.from, this.to, this.mark);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      if (from.deleted && to.deleted || from.pos >= to.pos)
        return null;
      return new _RemoveMarkStep(from.pos, to.pos, this.mark);
    }
    merge(other) {
      if (other instanceof _RemoveMarkStep && other.mark.eq(this.mark) && this.from <= other.to && this.to >= other.from)
        return new _RemoveMarkStep(Math.min(this.from, other.from), Math.max(this.to, other.to), this.mark);
      return null;
    }
    toJSON() {
      return {
        stepType: "removeMark",
        mark: this.mark.toJSON(),
        from: this.from,
        to: this.to
      };
    }
    /**
    @internal
    */
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for RemoveMarkStep.fromJSON");
      return new _RemoveMarkStep(json.from, json.to, schema2.markFromJSON(json.mark));
    }
  };
  Step.jsonID("removeMark", RemoveMarkStep);
  var AddNodeMarkStep = class _AddNodeMarkStep extends Step {
    /**
    Create a node mark step.
    */
    constructor(pos, mark) {
      super();
      this.pos = pos;
      this.mark = mark;
    }
    apply(doc3) {
      let node = doc3.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at mark step's position");
      let updated = node.type.create(node.attrs, null, this.mark.addToSet(node.marks));
      return StepResult.fromReplace(doc3, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    invert(doc3) {
      let node = doc3.nodeAt(this.pos);
      if (node) {
        let newSet = this.mark.addToSet(node.marks);
        if (newSet.length == node.marks.length) {
          for (let i = 0; i < node.marks.length; i++)
            if (!node.marks[i].isInSet(newSet))
              return new _AddNodeMarkStep(this.pos, node.marks[i]);
          return new _AddNodeMarkStep(this.pos, this.mark);
        }
      }
      return new RemoveNodeMarkStep(this.pos, this.mark);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new _AddNodeMarkStep(pos.pos, this.mark);
    }
    toJSON() {
      return { stepType: "addNodeMark", pos: this.pos, mark: this.mark.toJSON() };
    }
    /**
    @internal
    */
    static fromJSON(schema2, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for AddNodeMarkStep.fromJSON");
      return new _AddNodeMarkStep(json.pos, schema2.markFromJSON(json.mark));
    }
  };
  Step.jsonID("addNodeMark", AddNodeMarkStep);
  var RemoveNodeMarkStep = class _RemoveNodeMarkStep extends Step {
    /**
    Create a mark-removing step.
    */
    constructor(pos, mark) {
      super();
      this.pos = pos;
      this.mark = mark;
    }
    apply(doc3) {
      let node = doc3.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at mark step's position");
      let updated = node.type.create(node.attrs, null, this.mark.removeFromSet(node.marks));
      return StepResult.fromReplace(doc3, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    invert(doc3) {
      let node = doc3.nodeAt(this.pos);
      if (!node || !this.mark.isInSet(node.marks))
        return this;
      return new AddNodeMarkStep(this.pos, this.mark);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new _RemoveNodeMarkStep(pos.pos, this.mark);
    }
    toJSON() {
      return { stepType: "removeNodeMark", pos: this.pos, mark: this.mark.toJSON() };
    }
    /**
    @internal
    */
    static fromJSON(schema2, json) {
      if (typeof json.pos != "number")
        throw new RangeError("Invalid input for RemoveNodeMarkStep.fromJSON");
      return new _RemoveNodeMarkStep(json.pos, schema2.markFromJSON(json.mark));
    }
  };
  Step.jsonID("removeNodeMark", RemoveNodeMarkStep);
  var ReplaceStep = class _ReplaceStep extends Step {
    /**
    The given `slice` should fit the 'gap' between `from` and
    `to`—the depths must line up, and the surrounding nodes must be
    able to be joined with the open sides of the slice. When
    `structure` is true, the step will fail if the content between
    from and to is not just a sequence of closing and then opening
    tokens (this is to guard against rebased replace steps
    overwriting something they weren't supposed to).
    */
    constructor(from, to, slice, structure = false) {
      super();
      this.from = from;
      this.to = to;
      this.slice = slice;
      this.structure = structure;
    }
    apply(doc3) {
      if (this.structure && contentBetween(doc3, this.from, this.to))
        return StepResult.fail("Structure replace would overwrite content");
      return StepResult.fromReplace(doc3, this.from, this.to, this.slice);
    }
    getMap() {
      return new StepMap([this.from, this.to - this.from, this.slice.size]);
    }
    invert(doc3) {
      return new _ReplaceStep(this.from, this.from + this.slice.size, doc3.slice(this.from, this.to));
    }
    map(mapping) {
      let to = mapping.mapResult(this.to, -1);
      let from = this.from == this.to && _ReplaceStep.MAP_BIAS < 0 ? to : mapping.mapResult(this.from, 1);
      if (from.deletedAcross && to.deletedAcross)
        return null;
      return new _ReplaceStep(from.pos, Math.max(from.pos, to.pos), this.slice, this.structure);
    }
    merge(other) {
      if (!(other instanceof _ReplaceStep) || other.structure || this.structure)
        return null;
      if (this.from + this.slice.size == other.from && !this.slice.openEnd && !other.slice.openStart) {
        let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(this.slice.content.append(other.slice.content), this.slice.openStart, other.slice.openEnd);
        return new _ReplaceStep(this.from, this.to + (other.to - other.from), slice, this.structure);
      } else if (other.to == this.from && !this.slice.openStart && !other.slice.openEnd) {
        let slice = this.slice.size + other.slice.size == 0 ? Slice.empty : new Slice(other.slice.content.append(this.slice.content), other.slice.openStart, this.slice.openEnd);
        return new _ReplaceStep(other.from, this.to, slice, this.structure);
      } else {
        return null;
      }
    }
    toJSON() {
      let json = { stepType: "replace", from: this.from, to: this.to };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    /**
    @internal
    */
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number")
        throw new RangeError("Invalid input for ReplaceStep.fromJSON");
      return new _ReplaceStep(json.from, json.to, Slice.fromJSON(schema2, json.slice), !!json.structure);
    }
  };
  ReplaceStep.MAP_BIAS = 1;
  Step.jsonID("replace", ReplaceStep);
  var ReplaceAroundStep = class _ReplaceAroundStep extends Step {
    /**
    Create a replace-around step with the given range and gap.
    `insert` should be the point in the slice into which the content
    of the gap should be moved. `structure` has the same meaning as
    it has in the [`ReplaceStep`](https://prosemirror.net/docs/ref/#transform.ReplaceStep) class.
    */
    constructor(from, to, gapFrom, gapTo, slice, insert, structure = false) {
      super();
      this.from = from;
      this.to = to;
      this.gapFrom = gapFrom;
      this.gapTo = gapTo;
      this.slice = slice;
      this.insert = insert;
      this.structure = structure;
    }
    apply(doc3) {
      if (this.structure && (contentBetween(doc3, this.from, this.gapFrom) || contentBetween(doc3, this.gapTo, this.to)))
        return StepResult.fail("Structure gap-replace would overwrite content");
      let gap = doc3.slice(this.gapFrom, this.gapTo);
      if (gap.openStart || gap.openEnd)
        return StepResult.fail("Gap is not a flat range");
      let inserted = this.slice.insertAt(this.insert, gap.content);
      if (!inserted)
        return StepResult.fail("Content does not fit in gap");
      return StepResult.fromReplace(doc3, this.from, this.to, inserted);
    }
    getMap() {
      return new StepMap([
        this.from,
        this.gapFrom - this.from,
        this.insert,
        this.gapTo,
        this.to - this.gapTo,
        this.slice.size - this.insert
      ]);
    }
    invert(doc3) {
      let gap = this.gapTo - this.gapFrom;
      return new _ReplaceAroundStep(this.from, this.from + this.slice.size + gap, this.from + this.insert, this.from + this.insert + gap, doc3.slice(this.from, this.to).removeBetween(this.gapFrom - this.from, this.gapTo - this.from), this.gapFrom - this.from, this.structure);
    }
    map(mapping) {
      let from = mapping.mapResult(this.from, 1), to = mapping.mapResult(this.to, -1);
      let gapFrom = this.from == this.gapFrom ? from.pos : mapping.map(this.gapFrom, -1);
      let gapTo = this.to == this.gapTo ? to.pos : mapping.map(this.gapTo, 1);
      if (from.deletedAcross && to.deletedAcross || gapFrom < from.pos || gapTo > to.pos)
        return null;
      return new _ReplaceAroundStep(from.pos, to.pos, gapFrom, gapTo, this.slice, this.insert, this.structure);
    }
    toJSON() {
      let json = {
        stepType: "replaceAround",
        from: this.from,
        to: this.to,
        gapFrom: this.gapFrom,
        gapTo: this.gapTo,
        insert: this.insert
      };
      if (this.slice.size)
        json.slice = this.slice.toJSON();
      if (this.structure)
        json.structure = true;
      return json;
    }
    /**
    @internal
    */
    static fromJSON(schema2, json) {
      if (typeof json.from != "number" || typeof json.to != "number" || typeof json.gapFrom != "number" || typeof json.gapTo != "number" || typeof json.insert != "number")
        throw new RangeError("Invalid input for ReplaceAroundStep.fromJSON");
      return new _ReplaceAroundStep(json.from, json.to, json.gapFrom, json.gapTo, Slice.fromJSON(schema2, json.slice), json.insert, !!json.structure);
    }
  };
  Step.jsonID("replaceAround", ReplaceAroundStep);
  function contentBetween(doc3, from, to) {
    let $from = doc3.resolve(from), dist = to - from, depth = $from.depth;
    while (dist > 0 && depth > 0 && $from.indexAfter(depth) == $from.node(depth).childCount) {
      depth--;
      dist--;
    }
    if (dist > 0) {
      let next = $from.node(depth).maybeChild($from.indexAfter(depth));
      while (dist > 0) {
        if (!next || next.isLeaf)
          return true;
        next = next.firstChild;
        dist--;
      }
    }
    return false;
  }
  function addMark(tr, from, to, mark) {
    let removed = [], added = [];
    let removing, adding;
    tr.doc.nodesBetween(from, to, (node, pos, parent) => {
      if (!node.isInline)
        return;
      let marks = node.marks;
      if (!mark.isInSet(marks) && parent.type.allowsMarkType(mark.type)) {
        let start = Math.max(pos, from), end = Math.min(pos + node.nodeSize, to);
        let newSet = mark.addToSet(marks);
        for (let i = 0; i < marks.length; i++) {
          if (!marks[i].isInSet(newSet)) {
            if (removing && removing.to == start && removing.mark.eq(marks[i]))
              removing.to = end;
            else
              removed.push(removing = new RemoveMarkStep(start, end, marks[i]));
          }
        }
        if (adding && adding.to == start)
          adding.to = end;
        else
          added.push(adding = new AddMarkStep(start, end, mark));
      }
    });
    removed.forEach((s) => tr.step(s));
    added.forEach((s) => tr.step(s));
  }
  function removeMark(tr, from, to, mark) {
    let matched = [], step = 0;
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (!node.isInline)
        return;
      step++;
      let toRemove = null;
      if (mark instanceof MarkType) {
        let set2 = node.marks, found2;
        while (found2 = mark.isInSet(set2)) {
          (toRemove || (toRemove = [])).push(found2);
          set2 = found2.removeFromSet(set2);
        }
      } else if (mark) {
        if (mark.isInSet(node.marks))
          toRemove = [mark];
      } else {
        toRemove = node.marks;
      }
      if (toRemove && toRemove.length) {
        let end = Math.min(pos + node.nodeSize, to);
        for (let i = 0; i < toRemove.length; i++) {
          let style = toRemove[i], found2;
          for (let j = 0; j < matched.length; j++) {
            let m = matched[j];
            if (m.step == step - 1 && style.eq(matched[j].style))
              found2 = m;
          }
          if (found2) {
            found2.to = end;
            found2.step = step;
          } else {
            matched.push({ style, from: Math.max(pos, from), to: end, step });
          }
        }
      }
    });
    matched.forEach((m) => tr.step(new RemoveMarkStep(m.from, m.to, m.style)));
  }
  function clearIncompatible(tr, pos, parentType, match = parentType.contentMatch, clearNewlines = true) {
    let node = tr.doc.nodeAt(pos);
    let replSteps = [], cur = pos + 1;
    for (let i = 0; i < node.childCount; i++) {
      let child = node.child(i), end = cur + child.nodeSize;
      let allowed = match.matchType(child.type);
      if (!allowed) {
        replSteps.push(new ReplaceStep(cur, end, Slice.empty));
      } else {
        match = allowed;
        for (let j = 0; j < child.marks.length; j++)
          if (!parentType.allowsMarkType(child.marks[j].type))
            tr.step(new RemoveMarkStep(cur, end, child.marks[j]));
        if (clearNewlines && child.isText && parentType.whitespace != "pre") {
          let m, newline = /\r?\n|\r/g, slice;
          while (m = newline.exec(child.text)) {
            if (!slice)
              slice = new Slice(Fragment.from(parentType.schema.text(" ", parentType.allowedMarks(child.marks))), 0, 0);
            replSteps.push(new ReplaceStep(cur + m.index, cur + m.index + m[0].length, slice));
          }
        }
      }
      cur = end;
    }
    if (!match.validEnd) {
      let fill = match.fillBefore(Fragment.empty, true);
      tr.replace(cur, cur, new Slice(fill, 0, 0));
    }
    for (let i = replSteps.length - 1; i >= 0; i--)
      tr.step(replSteps[i]);
  }
  function lift(tr, range, target) {
    let { $from, $to, depth } = range;
    let gapStart = $from.before(depth + 1), gapEnd = $to.after(depth + 1);
    let start = gapStart, end = gapEnd;
    let before = Fragment.empty, openStart = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $from.index(d) > 0) {
        splitting = true;
        before = Fragment.from($from.node(d).copy(before));
        openStart++;
      } else {
        start--;
      }
    let after = Fragment.empty, openEnd = 0;
    for (let d = depth, splitting = false; d > target; d--)
      if (splitting || $to.after(d + 1) < $to.end(d)) {
        splitting = true;
        after = Fragment.from($to.node(d).copy(after));
        openEnd++;
      } else {
        end++;
      }
    tr.step(new ReplaceAroundStep(start, end, gapStart, gapEnd, new Slice(before.append(after), openStart, openEnd), before.size - openStart, true));
  }
  function wrap(tr, range, wrappers) {
    let content = Fragment.empty;
    for (let i = wrappers.length - 1; i >= 0; i--) {
      if (content.size) {
        let match = wrappers[i].type.contentMatch.matchFragment(content);
        if (!match || !match.validEnd)
          throw new RangeError("Wrapper type given to Transform.wrap does not form valid content of its parent wrapper");
      }
      content = Fragment.from(wrappers[i].type.create(wrappers[i].attrs, content));
    }
    let start = range.start, end = range.end;
    tr.step(new ReplaceAroundStep(start, end, start, end, new Slice(content, 0, 0), wrappers.length, true));
  }
  function setBlockType(tr, from, to, type3, attrs) {
    if (!type3.isTextblock)
      throw new RangeError("Type given to setBlockType should be a textblock");
    let mapFrom = tr.steps.length;
    tr.doc.nodesBetween(from, to, (node, pos) => {
      let attrsHere = typeof attrs == "function" ? attrs(node) : attrs;
      if (node.isTextblock && !node.hasMarkup(type3, attrsHere) && canChangeType(tr.doc, tr.mapping.slice(mapFrom).map(pos), type3)) {
        let convertNewlines = null;
        if (type3.schema.linebreakReplacement) {
          let pre = type3.whitespace == "pre", supportLinebreak = !!type3.contentMatch.matchType(type3.schema.linebreakReplacement);
          if (pre && !supportLinebreak)
            convertNewlines = false;
          else if (!pre && supportLinebreak)
            convertNewlines = true;
        }
        if (convertNewlines === false)
          replaceLinebreaks(tr, node, pos, mapFrom);
        clearIncompatible(tr, tr.mapping.slice(mapFrom).map(pos, 1), type3, void 0, convertNewlines === null);
        let mapping = tr.mapping.slice(mapFrom);
        let startM = mapping.map(pos, 1), endM = mapping.map(pos + node.nodeSize, 1);
        tr.step(new ReplaceAroundStep(startM, endM, startM + 1, endM - 1, new Slice(Fragment.from(type3.create(attrsHere, null, node.marks)), 0, 0), 1, true));
        if (convertNewlines === true)
          replaceNewlines(tr, node, pos, mapFrom);
        return false;
      }
    });
  }
  function replaceNewlines(tr, node, pos, mapFrom) {
    node.forEach((child, offset) => {
      if (child.isText) {
        let m, newline = /\r?\n|\r/g;
        while (m = newline.exec(child.text)) {
          let start = tr.mapping.slice(mapFrom).map(pos + 1 + offset + m.index);
          tr.replaceWith(start, start + 1, node.type.schema.linebreakReplacement.create());
        }
      }
    });
  }
  function replaceLinebreaks(tr, node, pos, mapFrom) {
    node.forEach((child, offset) => {
      if (child.type == child.type.schema.linebreakReplacement) {
        let start = tr.mapping.slice(mapFrom).map(pos + 1 + offset);
        tr.replaceWith(start, start + 1, node.type.schema.text("\n"));
      }
    });
  }
  function canChangeType(doc3, pos, type3) {
    let $pos = doc3.resolve(pos), index = $pos.index();
    return $pos.parent.canReplaceWith(index, index + 1, type3);
  }
  function setNodeMarkup(tr, pos, type3, attrs, marks) {
    let node = tr.doc.nodeAt(pos);
    if (!node)
      throw new RangeError("No node at given position");
    if (!type3)
      type3 = node.type;
    let newNode = type3.create(attrs, null, marks || node.marks);
    if (node.isLeaf)
      return tr.replaceWith(pos, pos + node.nodeSize, newNode);
    if (!type3.validContent(node.content))
      throw new RangeError("Invalid content for node type " + type3.name);
    tr.step(new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1, pos + node.nodeSize - 1, new Slice(Fragment.from(newNode), 0, 0), 1, true));
  }
  function split2(tr, pos, depth = 1, typesAfter) {
    let $pos = tr.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty;
    for (let d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      before = Fragment.from($pos.node(d).copy(before));
      let typeAfter = typesAfter && typesAfter[i];
      after = Fragment.from(typeAfter ? typeAfter.type.create(typeAfter.attrs, after) : $pos.node(d).copy(after));
    }
    tr.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth), true));
  }
  function join(tr, pos, depth) {
    let convertNewlines = null;
    let { linebreakReplacement } = tr.doc.type.schema;
    let $before = tr.doc.resolve(pos - depth), beforeType = $before.node().type;
    if (linebreakReplacement && beforeType.inlineContent) {
      let pre = beforeType.whitespace == "pre";
      let supportLinebreak = !!beforeType.contentMatch.matchType(linebreakReplacement);
      if (pre && !supportLinebreak)
        convertNewlines = false;
      else if (!pre && supportLinebreak)
        convertNewlines = true;
    }
    let mapFrom = tr.steps.length;
    if (convertNewlines === false) {
      let $after = tr.doc.resolve(pos + depth);
      replaceLinebreaks(tr, $after.node(), $after.before(), mapFrom);
    }
    if (beforeType.inlineContent)
      clearIncompatible(tr, pos + depth - 1, beforeType, $before.node().contentMatchAt($before.index()), convertNewlines == null);
    let mapping = tr.mapping.slice(mapFrom), start = mapping.map(pos - depth);
    tr.step(new ReplaceStep(start, mapping.map(pos + depth, -1), Slice.empty, true));
    if (convertNewlines === true) {
      let $full = tr.doc.resolve(start);
      replaceNewlines(tr, $full.node(), $full.before(), tr.steps.length);
    }
    return tr;
  }
  function insertPoint(doc3, pos, nodeType) {
    let $pos = doc3.resolve(pos);
    if ($pos.parent.canReplaceWith($pos.index(), $pos.index(), nodeType))
      return pos;
    if ($pos.parentOffset == 0)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.index(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.before(d + 1);
        if (index > 0)
          return null;
      }
    if ($pos.parentOffset == $pos.parent.content.size)
      for (let d = $pos.depth - 1; d >= 0; d--) {
        let index = $pos.indexAfter(d);
        if ($pos.node(d).canReplaceWith(index, index, nodeType))
          return $pos.after(d + 1);
        if (index < $pos.node(d).childCount)
          return null;
      }
    return null;
  }
  function dropPoint(doc3, pos, slice) {
    let $pos = doc3.resolve(pos);
    if (!slice.content.size)
      return pos;
    let content = slice.content;
    for (let i = 0; i < slice.openStart; i++)
      content = content.firstChild.content;
    for (let pass = 1; pass <= (slice.openStart == 0 && slice.size ? 2 : 1); pass++) {
      for (let d = $pos.depth; d >= 0; d--) {
        let bias = d == $pos.depth ? 0 : $pos.pos <= ($pos.start(d + 1) + $pos.end(d + 1)) / 2 ? -1 : 1;
        let insertPos = $pos.index(d) + (bias > 0 ? 1 : 0);
        let parent = $pos.node(d), fits = false;
        if (pass == 1) {
          fits = parent.canReplace(insertPos, insertPos, content);
        } else {
          let wrapping = parent.contentMatchAt(insertPos).findWrapping(content.firstChild.type);
          fits = wrapping && parent.canReplaceWith(insertPos, insertPos, wrapping[0]);
        }
        if (fits)
          return bias == 0 ? $pos.pos : bias < 0 ? $pos.before(d + 1) : $pos.after(d + 1);
      }
    }
    return null;
  }
  function replaceStep(doc3, from, to = from, slice = Slice.empty) {
    if (from == to && !slice.size)
      return null;
    let $from = doc3.resolve(from), $to = doc3.resolve(to);
    if (fitsTrivially($from, $to, slice))
      return new ReplaceStep(from, to, slice);
    return new Fitter($from, $to, slice).fit();
  }
  function fitsTrivially($from, $to, slice) {
    return !slice.openStart && !slice.openEnd && $from.start() == $to.start() && $from.parent.canReplace($from.index(), $to.index(), slice.content);
  }
  var Fitter = class {
    constructor($from, $to, unplaced) {
      this.$from = $from;
      this.$to = $to;
      this.unplaced = unplaced;
      this.frontier = [];
      this.placed = Fragment.empty;
      for (let i = 0; i <= $from.depth; i++) {
        let node = $from.node(i);
        this.frontier.push({
          type: node.type,
          match: node.contentMatchAt($from.indexAfter(i))
        });
      }
      for (let i = $from.depth; i > 0; i--)
        this.placed = Fragment.from($from.node(i).copy(this.placed));
    }
    get depth() {
      return this.frontier.length - 1;
    }
    fit() {
      while (this.unplaced.size) {
        let fit = this.findFittable();
        if (fit)
          this.placeNodes(fit);
        else
          this.openMore() || this.dropNode();
      }
      let moveInline = this.mustMoveInline(), placedSize = this.placed.size - this.depth - this.$from.depth;
      let $from = this.$from, $to = this.close(moveInline < 0 ? this.$to : $from.doc.resolve(moveInline));
      if (!$to)
        return null;
      let content = this.placed, openStart = $from.depth, openEnd = $to.depth;
      while (openStart && openEnd && content.childCount == 1) {
        content = content.firstChild.content;
        openStart--;
        openEnd--;
      }
      let slice = new Slice(content, openStart, openEnd);
      if (moveInline > -1)
        return new ReplaceAroundStep($from.pos, moveInline, this.$to.pos, this.$to.end(), slice, placedSize);
      if (slice.size || $from.pos != this.$to.pos)
        return new ReplaceStep($from.pos, $to.pos, slice);
      return null;
    }
    // Find a position on the start spine of `this.unplaced` that has
    // content that can be moved somewhere on the frontier. Returns two
    // depths, one for the slice and one for the frontier.
    findFittable() {
      let startDepth = this.unplaced.openStart;
      for (let cur = this.unplaced.content, d = 0, openEnd = this.unplaced.openEnd; d < startDepth; d++) {
        let node = cur.firstChild;
        if (cur.childCount > 1)
          openEnd = 0;
        if (node.type.spec.isolating && openEnd <= d) {
          startDepth = d;
          break;
        }
        cur = node.content;
      }
      for (let pass = 1; pass <= 2; pass++) {
        for (let sliceDepth = pass == 1 ? startDepth : this.unplaced.openStart; sliceDepth >= 0; sliceDepth--) {
          let fragment, parent = null;
          if (sliceDepth) {
            parent = contentAt(this.unplaced.content, sliceDepth - 1).firstChild;
            fragment = parent.content;
          } else {
            fragment = this.unplaced.content;
          }
          let first = fragment.firstChild;
          for (let frontierDepth = this.depth; frontierDepth >= 0; frontierDepth--) {
            let { type: type3, match } = this.frontier[frontierDepth], wrap2, inject = null;
            if (pass == 1 && (first ? match.matchType(first.type) || (inject = match.fillBefore(Fragment.from(first), false)) : parent && type3.compatibleContent(parent.type)))
              return { sliceDepth, frontierDepth, parent, inject };
            else if (pass == 2 && first && (wrap2 = match.findWrapping(first.type)))
              return { sliceDepth, frontierDepth, parent, wrap: wrap2 };
            if (parent && match.matchType(parent.type))
              break;
          }
        }
      }
    }
    openMore() {
      let { content, openStart, openEnd } = this.unplaced;
      if (maxOpen(content, -1) <= openStart)
        return false;
      if (this.unplaced.size > 1 && maxOpen(content, 1) > openEnd)
        openEnd++;
      this.unplaced = new Slice(content, openStart + 1, openEnd);
      return true;
    }
    dropNode() {
      let { content, openStart, openEnd } = this.unplaced;
      let inner = contentAt(content, openStart);
      if (inner.childCount <= 1 && openStart > 0) {
        let openAtEnd = content.size - openStart <= openStart + inner.size;
        this.unplaced = new Slice(dropFromFragment(content, openStart - 1, 1), openStart - 1, openAtEnd ? openStart - 1 : openEnd);
      } else {
        this.unplaced = new Slice(dropFromFragment(content, openStart, 1), openStart, openEnd);
      }
    }
    // Move content from the unplaced slice at `sliceDepth` to the
    // frontier node at `frontierDepth`. Close that frontier node when
    // applicable.
    placeNodes({ sliceDepth, frontierDepth, parent, inject, wrap: wrap2 }) {
      while (this.depth > frontierDepth)
        this.closeFrontierNode();
      if (wrap2)
        for (let i = 0; i < wrap2.length; i++)
          this.openFrontierNode(wrap2[i]);
      let slice = this.unplaced, fragment = parent ? parent.content : slice.content;
      let openStart = slice.openStart - sliceDepth;
      let taken = 0, add = [];
      let { match, type: type3 } = this.frontier[frontierDepth];
      if (inject) {
        for (let i = 0; i < inject.childCount; i++)
          add.push(inject.child(i));
        match = match.matchFragment(inject);
      }
      let openEndCount = fragment.size + sliceDepth - (slice.content.size - slice.openEnd);
      while (taken < fragment.childCount) {
        let next = fragment.child(taken), matches2 = match.matchType(next.type);
        if (!matches2)
          break;
        taken++;
        if (taken > 1 || openStart == 0 || next.content.size) {
          match = matches2;
          add.push(closeNodeStart(next.mark(type3.allowedMarks(next.marks)), taken == 1 ? openStart : 0, taken == fragment.childCount ? openEndCount : -1));
        }
      }
      let toEnd = taken == fragment.childCount;
      if (!toEnd)
        openEndCount = -1;
      this.placed = addToFragment(this.placed, frontierDepth, Fragment.from(add));
      this.frontier[frontierDepth].match = match;
      if (toEnd && openEndCount < 0 && parent && parent.type == this.frontier[this.depth].type && this.frontier.length > 1)
        this.closeFrontierNode();
      for (let i = 0, cur = fragment; i < openEndCount; i++) {
        let node = cur.lastChild;
        this.frontier.push({ type: node.type, match: node.contentMatchAt(node.childCount) });
        cur = node.content;
      }
      this.unplaced = !toEnd ? new Slice(dropFromFragment(slice.content, sliceDepth, taken), slice.openStart, slice.openEnd) : sliceDepth == 0 ? Slice.empty : new Slice(dropFromFragment(slice.content, sliceDepth - 1, 1), sliceDepth - 1, openEndCount < 0 ? slice.openEnd : sliceDepth - 1);
    }
    mustMoveInline() {
      if (!this.$to.parent.isTextblock)
        return -1;
      let top = this.frontier[this.depth], level;
      if (!top.type.isTextblock || !contentAfterFits(this.$to, this.$to.depth, top.type, top.match, false) || this.$to.depth == this.depth && (level = this.findCloseLevel(this.$to)) && level.depth == this.depth)
        return -1;
      let { depth } = this.$to, after = this.$to.after(depth);
      while (depth > 1 && after == this.$to.end(--depth))
        ++after;
      return after;
    }
    findCloseLevel($to) {
      scan: for (let i = Math.min(this.depth, $to.depth); i >= 0; i--) {
        let { match, type: type3 } = this.frontier[i];
        let dropInner = i < $to.depth && $to.end(i + 1) == $to.pos + ($to.depth - (i + 1));
        let fit = contentAfterFits($to, i, type3, match, dropInner);
        if (!fit)
          continue;
        for (let d = i - 1; d >= 0; d--) {
          let { match: match2, type: type4 } = this.frontier[d];
          let matches2 = contentAfterFits($to, d, type4, match2, true);
          if (!matches2 || matches2.childCount)
            continue scan;
        }
        return { depth: i, fit, move: dropInner ? $to.doc.resolve($to.after(i + 1)) : $to };
      }
    }
    close($to) {
      let close2 = this.findCloseLevel($to);
      if (!close2)
        return null;
      while (this.depth > close2.depth)
        this.closeFrontierNode();
      if (close2.fit.childCount)
        this.placed = addToFragment(this.placed, close2.depth, close2.fit);
      $to = close2.move;
      for (let d = close2.depth + 1; d <= $to.depth; d++) {
        let node = $to.node(d), add = node.type.contentMatch.fillBefore(node.content, true, $to.index(d));
        this.openFrontierNode(node.type, node.attrs, add);
      }
      return $to;
    }
    openFrontierNode(type3, attrs = null, content) {
      let top = this.frontier[this.depth];
      top.match = top.match.matchType(type3);
      this.placed = addToFragment(this.placed, this.depth, Fragment.from(type3.create(attrs, content)));
      this.frontier.push({ type: type3, match: type3.contentMatch });
    }
    closeFrontierNode() {
      let open = this.frontier.pop();
      let add = open.match.fillBefore(Fragment.empty, true);
      if (add.childCount)
        this.placed = addToFragment(this.placed, this.frontier.length, add);
    }
  };
  function dropFromFragment(fragment, depth, count) {
    if (depth == 0)
      return fragment.cutByIndex(count, fragment.childCount);
    return fragment.replaceChild(0, fragment.firstChild.copy(dropFromFragment(fragment.firstChild.content, depth - 1, count)));
  }
  function addToFragment(fragment, depth, content) {
    if (depth == 0)
      return fragment.append(content);
    return fragment.replaceChild(fragment.childCount - 1, fragment.lastChild.copy(addToFragment(fragment.lastChild.content, depth - 1, content)));
  }
  function contentAt(fragment, depth) {
    for (let i = 0; i < depth; i++)
      fragment = fragment.firstChild.content;
    return fragment;
  }
  function closeNodeStart(node, openStart, openEnd) {
    if (openStart <= 0)
      return node;
    let frag = node.content;
    if (openStart > 1)
      frag = frag.replaceChild(0, closeNodeStart(frag.firstChild, openStart - 1, frag.childCount == 1 ? openEnd - 1 : 0));
    if (openStart > 0) {
      frag = node.type.contentMatch.fillBefore(frag).append(frag);
      if (openEnd <= 0)
        frag = frag.append(node.type.contentMatch.matchFragment(frag).fillBefore(Fragment.empty, true));
    }
    return node.copy(frag);
  }
  function contentAfterFits($to, depth, type3, match, open) {
    let node = $to.node(depth), index = open ? $to.indexAfter(depth) : $to.index(depth);
    if (index == node.childCount && !type3.compatibleContent(node.type))
      return null;
    let fit = match.fillBefore(node.content, true, index);
    return fit && !invalidMarks(type3, node.content, index) ? fit : null;
  }
  function invalidMarks(type3, fragment, start) {
    for (let i = start; i < fragment.childCount; i++)
      if (!type3.allowsMarks(fragment.child(i).marks))
        return true;
    return false;
  }
  function definesContent(type3) {
    return type3.spec.defining || type3.spec.definingForContent;
  }
  function maxOpen(frag, side) {
    for (let count = 0; ; count++) {
      let ch = side < 0 ? frag.firstChild : frag.lastChild;
      if (!ch || ch.isAtom)
        return count;
      frag = ch.content;
    }
  }
  function replaceRange(tr, from, to, slice) {
    if (!slice.size)
      return tr.deleteRange(from, to);
    let $from = tr.doc.resolve(from), $to = tr.doc.resolve(to);
    if (fitsTrivially($from, $to, slice))
      return tr.step(new ReplaceStep(from, to, slice));
    let targetDepths = coveredDepths($from, $to);
    if (targetDepths[targetDepths.length - 1] == 0)
      targetDepths.pop();
    let preferredTarget = -($from.depth + 1);
    targetDepths.unshift(preferredTarget);
    for (let d = $from.depth, pos = $from.pos - 1; d > 0; d--, pos--) {
      let spec = $from.node(d).type.spec;
      if (spec.defining || spec.definingAsContext || spec.isolating)
        break;
      if (targetDepths.indexOf(d) > -1)
        preferredTarget = d;
      else if ($from.before(d) == pos)
        targetDepths.splice(1, 0, -d);
    }
    let preferredTargetIndex = targetDepths.indexOf(preferredTarget);
    let leftNodes = [], preferredDepth = slice.openStart;
    for (let content = slice.content, i = 0; ; i++) {
      let node = content.firstChild;
      leftNodes.push(node);
      if (i == slice.openStart)
        break;
      content = node.content;
    }
    for (let d = preferredDepth - 1; d >= 0; d--) {
      let leftNode = leftNodes[d], def = definesContent(leftNode.type);
      if (def && !leftNode.sameMarkup($from.node(Math.abs(preferredTarget) - 1)))
        preferredDepth = d;
      else if (def || !leftNode.type.isTextblock)
        break;
    }
    for (let j = slice.openStart; j >= 0; j--) {
      let openDepth = (j + preferredDepth + 1) % (slice.openStart + 1);
      let insert = leftNodes[openDepth];
      if (!insert)
        continue;
      for (let i = 0; i < targetDepths.length; i++) {
        let targetDepth = targetDepths[(i + preferredTargetIndex) % targetDepths.length], expand = true;
        if (targetDepth < 0) {
          expand = false;
          targetDepth = -targetDepth;
        }
        let parent = $from.node(targetDepth - 1), index = $from.index(targetDepth - 1);
        if (parent.canReplaceWith(index, index, insert.type, insert.marks))
          return tr.replace($from.before(targetDepth), expand ? $to.after(targetDepth) : to, new Slice(closeFragment(slice.content, 0, slice.openStart, openDepth), openDepth, slice.openEnd));
      }
    }
    let startSteps = tr.steps.length;
    for (let i = targetDepths.length - 1; i >= 0; i--) {
      tr.replace(from, to, slice);
      if (tr.steps.length > startSteps)
        break;
      let depth = targetDepths[i];
      if (depth < 0)
        continue;
      from = $from.before(depth);
      to = $to.after(depth);
    }
  }
  function closeFragment(fragment, depth, oldOpen, newOpen, parent) {
    if (depth < oldOpen) {
      let first = fragment.firstChild;
      fragment = fragment.replaceChild(0, first.copy(closeFragment(first.content, depth + 1, oldOpen, newOpen, first)));
    }
    if (depth > newOpen) {
      let match = parent.contentMatchAt(0);
      let start = match.fillBefore(fragment).append(fragment);
      fragment = start.append(match.matchFragment(start).fillBefore(Fragment.empty, true));
    }
    return fragment;
  }
  function replaceRangeWith(tr, from, to, node) {
    if (!node.isInline && from == to && tr.doc.resolve(from).parent.content.size) {
      let point = insertPoint(tr.doc, from, node.type);
      if (point != null)
        from = to = point;
    }
    tr.replaceRange(from, to, new Slice(Fragment.from(node), 0, 0));
  }
  function deleteRange(tr, from, to) {
    let $from = tr.doc.resolve(from), $to = tr.doc.resolve(to);
    if ($from.parent.isTextblock && $to.parent.isTextblock && $from.start() != $to.start() && $from.parentOffset == 0 && $to.parentOffset == 0) {
      let shared = $from.sharedDepth(to), isolated = false;
      for (let d = $from.depth; d > shared; d--)
        if ($from.node(d).type.spec.isolating)
          isolated = true;
      for (let d = $to.depth; d > shared; d--)
        if ($to.node(d).type.spec.isolating)
          isolated = true;
      if (!isolated) {
        for (let d = $from.depth; d > 0 && from == $from.start(d); d--)
          from = $from.before(d);
        for (let d = $to.depth; d > 0 && to == $to.start(d); d--)
          to = $to.before(d);
        $from = tr.doc.resolve(from);
        $to = tr.doc.resolve(to);
      }
    }
    let covered = coveredDepths($from, $to);
    for (let i = 0; i < covered.length; i++) {
      let depth = covered[i], last = i == covered.length - 1;
      if (last && depth == 0 || $from.node(depth).type.contentMatch.validEnd)
        return tr.delete($from.start(depth), $to.end(depth));
      if (depth > 0 && (last || $from.node(depth - 1).canReplace($from.index(depth - 1), $to.indexAfter(depth - 1))))
        return tr.delete($from.before(depth), $to.after(depth));
    }
    for (let d = 1; d <= $from.depth && d <= $to.depth; d++) {
      if (from - $from.start(d) == $from.depth - d && to > $from.end(d) && $to.end(d) - to != $to.depth - d && $from.start(d - 1) == $to.start(d - 1) && $from.node(d - 1).canReplace($from.index(d - 1), $to.index(d - 1)))
        return tr.delete($from.before(d), to);
    }
    tr.delete(from, to);
  }
  function coveredDepths($from, $to) {
    let result = [], minDepth = Math.min($from.depth, $to.depth);
    for (let d = minDepth; d >= 0; d--) {
      let start = $from.start(d);
      if (start < $from.pos - ($from.depth - d) || $to.end(d) > $to.pos + ($to.depth - d) || $from.node(d).type.spec.isolating || $to.node(d).type.spec.isolating)
        break;
      if (start == $to.start(d) || d == $from.depth && d == $to.depth && $from.parent.inlineContent && $to.parent.inlineContent && d && $to.start(d - 1) == start - 1)
        result.push(d);
    }
    return result;
  }
  var AttrStep = class _AttrStep extends Step {
    /**
    Construct an attribute step.
    */
    constructor(pos, attr, value) {
      super();
      this.pos = pos;
      this.attr = attr;
      this.value = value;
    }
    apply(doc3) {
      let node = doc3.nodeAt(this.pos);
      if (!node)
        return StepResult.fail("No node at attribute step's position");
      let attrs = /* @__PURE__ */ Object.create(null);
      for (let name in node.attrs)
        attrs[name] = node.attrs[name];
      attrs[this.attr] = this.value;
      let updated = node.type.create(attrs, null, node.marks);
      return StepResult.fromReplace(doc3, this.pos, this.pos + 1, new Slice(Fragment.from(updated), 0, node.isLeaf ? 0 : 1));
    }
    getMap() {
      return StepMap.empty;
    }
    invert(doc3) {
      return new _AttrStep(this.pos, this.attr, doc3.nodeAt(this.pos).attrs[this.attr]);
    }
    map(mapping) {
      let pos = mapping.mapResult(this.pos, 1);
      return pos.deletedAfter ? null : new _AttrStep(pos.pos, this.attr, this.value);
    }
    toJSON() {
      return { stepType: "attr", pos: this.pos, attr: this.attr, value: this.value };
    }
    static fromJSON(schema2, json) {
      if (typeof json.pos != "number" || typeof json.attr != "string")
        throw new RangeError("Invalid input for AttrStep.fromJSON");
      return new _AttrStep(json.pos, json.attr, json.value);
    }
  };
  Step.jsonID("attr", AttrStep);
  var DocAttrStep = class _DocAttrStep extends Step {
    /**
    Construct an attribute step.
    */
    constructor(attr, value) {
      super();
      this.attr = attr;
      this.value = value;
    }
    apply(doc3) {
      let attrs = /* @__PURE__ */ Object.create(null);
      for (let name in doc3.attrs)
        attrs[name] = doc3.attrs[name];
      attrs[this.attr] = this.value;
      let updated = doc3.type.create(attrs, doc3.content, doc3.marks);
      return StepResult.ok(updated);
    }
    getMap() {
      return StepMap.empty;
    }
    invert(doc3) {
      return new _DocAttrStep(this.attr, doc3.attrs[this.attr]);
    }
    map(mapping) {
      return this;
    }
    toJSON() {
      return { stepType: "docAttr", attr: this.attr, value: this.value };
    }
    static fromJSON(schema2, json) {
      if (typeof json.attr != "string")
        throw new RangeError("Invalid input for DocAttrStep.fromJSON");
      return new _DocAttrStep(json.attr, json.value);
    }
  };
  Step.jsonID("docAttr", DocAttrStep);
  var TransformError = class extends Error {
  };
  TransformError = function TransformError2(message) {
    let err = Error.call(this, message);
    err.__proto__ = TransformError2.prototype;
    return err;
  };
  TransformError.prototype = Object.create(Error.prototype);
  TransformError.prototype.constructor = TransformError;
  TransformError.prototype.name = "TransformError";
  var Transform = class {
    /**
    Create a transform that starts with the given document.
    */
    constructor(doc3) {
      this.doc = doc3;
      this.steps = [];
      this.docs = [];
      this.mapping = new Mapping();
    }
    /**
    The starting document.
    */
    get before() {
      return this.docs.length ? this.docs[0] : this.doc;
    }
    /**
    Apply a new step in this transform, saving the result. Throws an
    error when the step fails.
    */
    step(step) {
      let result = this.maybeStep(step);
      if (result.failed)
        throw new TransformError(result.failed);
      return this;
    }
    /**
    Try to apply a step in this transformation, ignoring it if it
    fails. Returns the step result.
    */
    maybeStep(step) {
      let result = step.apply(this.doc);
      if (!result.failed)
        this.addStep(step, result.doc);
      return result;
    }
    /**
    True when the document has been changed (when there are any
    steps).
    */
    get docChanged() {
      return this.steps.length > 0;
    }
    /**
    Return a single range, in post-transform document positions,
    that covers all content changed by this transform. Returns null
    if no replacements are made. Note that this will ignore changes
    that add/remove marks without replacing the underlying content.
    */
    changedRange() {
      let from = 1e9, to = -1e9;
      for (let i = 0; i < this.mapping.maps.length; i++) {
        let map = this.mapping.maps[i];
        if (i) {
          from = map.map(from, 1);
          to = map.map(to, -1);
        }
        map.forEach((_f, _t, fromB, toB) => {
          from = Math.min(from, fromB);
          to = Math.max(to, toB);
        });
      }
      return from == 1e9 ? null : { from, to };
    }
    /**
    @internal
    */
    addStep(step, doc3) {
      this.docs.push(this.doc);
      this.steps.push(step);
      this.mapping.appendMap(step.getMap());
      this.doc = doc3;
    }
    /**
    Replace the part of the document between `from` and `to` with the
    given `slice`.
    */
    replace(from, to = from, slice = Slice.empty) {
      let step = replaceStep(this.doc, from, to, slice);
      if (step)
        this.step(step);
      return this;
    }
    /**
    Replace the given range with the given content, which may be a
    fragment, node, or array of nodes.
    */
    replaceWith(from, to, content) {
      return this.replace(from, to, new Slice(Fragment.from(content), 0, 0));
    }
    /**
    Delete the content between the given positions.
    */
    delete(from, to) {
      return this.replace(from, to, Slice.empty);
    }
    /**
    Insert the given content at the given position.
    */
    insert(pos, content) {
      return this.replaceWith(pos, pos, content);
    }
    /**
    Replace a range of the document with a given slice, using
    `from`, `to`, and the slice's
    [`openStart`](https://prosemirror.net/docs/ref/#model.Slice.openStart) property as hints, rather
    than fixed start and end points. This method may grow the
    replaced area or close open nodes in the slice in order to get a
    fit that is more in line with WYSIWYG expectations, by dropping
    fully covered parent nodes of the replaced region when they are
    marked [non-defining as
    context](https://prosemirror.net/docs/ref/#model.NodeSpec.definingAsContext), or including an
    open parent node from the slice that _is_ marked as [defining
    its content](https://prosemirror.net/docs/ref/#model.NodeSpec.definingForContent).
    
    This is the method, for example, to handle paste. The similar
    [`replace`](https://prosemirror.net/docs/ref/#transform.Transform.replace) method is a more
    primitive tool which will _not_ move the start and end of its given
    range, and is useful in situations where you need more precise
    control over what happens.
    */
    replaceRange(from, to, slice) {
      replaceRange(this, from, to, slice);
      return this;
    }
    /**
    Replace the given range with a node, but use `from` and `to` as
    hints, rather than precise positions. When from and to are the same
    and are at the start or end of a parent node in which the given
    node doesn't fit, this method may _move_ them out towards a parent
    that does allow the given node to be placed. When the given range
    completely covers a parent node, this method may completely replace
    that parent node.
    */
    replaceRangeWith(from, to, node) {
      replaceRangeWith(this, from, to, node);
      return this;
    }
    /**
    Delete the given range, expanding it to cover fully covered
    parent nodes until a valid replace is found.
    */
    deleteRange(from, to) {
      deleteRange(this, from, to);
      return this;
    }
    /**
    Split the content in the given range off from its parent, if there
    is sibling content before or after it, and move it up the tree to
    the depth specified by `target`. You'll probably want to use
    [`liftTarget`](https://prosemirror.net/docs/ref/#transform.liftTarget) to compute `target`, to make
    sure the lift is valid.
    */
    lift(range, target) {
      lift(this, range, target);
      return this;
    }
    /**
    Join the blocks around the given position. If depth is 2, their
    last and first siblings are also joined, and so on.
    */
    join(pos, depth = 1) {
      join(this, pos, depth);
      return this;
    }
    /**
    Wrap the given [range](https://prosemirror.net/docs/ref/#model.NodeRange) in the given set of wrappers.
    The wrappers are assumed to be valid in this position, and should
    probably be computed with [`findWrapping`](https://prosemirror.net/docs/ref/#transform.findWrapping).
    */
    wrap(range, wrappers) {
      wrap(this, range, wrappers);
      return this;
    }
    /**
    Set the type of all textblocks (partly) between `from` and `to` to
    the given node type with the given attributes.
    */
    setBlockType(from, to = from, type3, attrs = null) {
      setBlockType(this, from, to, type3, attrs);
      return this;
    }
    /**
    Change the type, attributes, and/or marks of the node at `pos`.
    When `type` isn't given, the existing node type is preserved,
    */
    setNodeMarkup(pos, type3, attrs = null, marks) {
      setNodeMarkup(this, pos, type3, attrs, marks);
      return this;
    }
    /**
    Set a single attribute on a given node to a new value.
    The `pos` addresses the document content. Use `setDocAttribute`
    to set attributes on the document itself.
    */
    setNodeAttribute(pos, attr, value) {
      this.step(new AttrStep(pos, attr, value));
      return this;
    }
    /**
    Set a single attribute on the document to a new value.
    */
    setDocAttribute(attr, value) {
      this.step(new DocAttrStep(attr, value));
      return this;
    }
    /**
    Add a mark to the node at position `pos`.
    */
    addNodeMark(pos, mark) {
      this.step(new AddNodeMarkStep(pos, mark));
      return this;
    }
    /**
    Remove a mark (or all marks of the given type) from the node at
    position `pos`.
    */
    removeNodeMark(pos, mark) {
      let node = this.doc.nodeAt(pos);
      if (!node)
        throw new RangeError("No node at position " + pos);
      if (mark instanceof Mark) {
        if (mark.isInSet(node.marks))
          this.step(new RemoveNodeMarkStep(pos, mark));
      } else {
        let set2 = node.marks, found2, steps = [];
        while (found2 = mark.isInSet(set2)) {
          steps.push(new RemoveNodeMarkStep(pos, found2));
          set2 = found2.removeFromSet(set2);
        }
        for (let i = steps.length - 1; i >= 0; i--)
          this.step(steps[i]);
      }
      return this;
    }
    /**
    Split the node at the given position, and optionally, if `depth` is
    greater than one, any number of nodes above that. By default, the
    parts split off will inherit the node type of the original node.
    This can be changed by passing an array of types and attributes to
    use after the split (with the outermost nodes coming first).
    */
    split(pos, depth = 1, typesAfter) {
      split2(this, pos, depth, typesAfter);
      return this;
    }
    /**
    Add the given mark to the inline content between `from` and `to`.
    */
    addMark(from, to, mark) {
      addMark(this, from, to, mark);
      return this;
    }
    /**
    Remove marks from inline nodes between `from` and `to`. When
    `mark` is a single mark, remove precisely that mark. When it is
    a mark type, remove all marks of that type. When it is null,
    remove all marks of any type.
    */
    removeMark(from, to, mark) {
      removeMark(this, from, to, mark);
      return this;
    }
    /**
    Removes all marks and nodes from the content of the node at
    `pos` that don't match the given new parent node type. Accepts
    an optional starting [content match](https://prosemirror.net/docs/ref/#model.ContentMatch) as
    third argument.
    */
    clearIncompatible(pos, parentType, match) {
      clearIncompatible(this, pos, parentType, match);
      return this;
    }
  };

  // ../node_modules/.pnpm/prosemirror-state@1.4.4/node_modules/prosemirror-state/dist/index.js
  var classesById = /* @__PURE__ */ Object.create(null);
  var Selection = class {
    /**
    Initialize a selection with the head and anchor and ranges. If no
    ranges are given, constructs a single range across `$anchor` and
    `$head`.
    */
    constructor($anchor, $head, ranges) {
      this.$anchor = $anchor;
      this.$head = $head;
      this.ranges = ranges || [new SelectionRange($anchor.min($head), $anchor.max($head))];
    }
    /**
    The selection's anchor, as an unresolved position.
    */
    get anchor() {
      return this.$anchor.pos;
    }
    /**
    The selection's head.
    */
    get head() {
      return this.$head.pos;
    }
    /**
    The lower bound of the selection's main range.
    */
    get from() {
      return this.$from.pos;
    }
    /**
    The upper bound of the selection's main range.
    */
    get to() {
      return this.$to.pos;
    }
    /**
    The resolved lower  bound of the selection's main range.
    */
    get $from() {
      return this.ranges[0].$from;
    }
    /**
    The resolved upper bound of the selection's main range.
    */
    get $to() {
      return this.ranges[0].$to;
    }
    /**
    Indicates whether the selection contains any content.
    */
    get empty() {
      let ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++)
        if (ranges[i].$from.pos != ranges[i].$to.pos)
          return false;
      return true;
    }
    /**
    Get the content of this selection as a slice.
    */
    content() {
      return this.$from.doc.slice(this.from, this.to, true);
    }
    /**
    Replace the selection with a slice or, if no slice is given,
    delete the selection. Will append to the given transaction.
    */
    replace(tr, content = Slice.empty) {
      let lastNode = content.content.lastChild, lastParent = null;
      for (let i = 0; i < content.openEnd; i++) {
        lastParent = lastNode;
        lastNode = lastNode.lastChild;
      }
      let mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
        tr.replaceRange(mapping.map($from.pos), mapping.map($to.pos), i ? Slice.empty : content);
        if (i == 0)
          selectionToInsertionEnd(tr, mapFrom, (lastNode ? lastNode.isInline : lastParent && lastParent.isTextblock) ? -1 : 1);
      }
    }
    /**
    Replace the selection with the given node, appending the changes
    to the given transaction.
    */
    replaceWith(tr, node) {
      let mapFrom = tr.steps.length, ranges = this.ranges;
      for (let i = 0; i < ranges.length; i++) {
        let { $from, $to } = ranges[i], mapping = tr.mapping.slice(mapFrom);
        let from = mapping.map($from.pos), to = mapping.map($to.pos);
        if (i) {
          tr.deleteRange(from, to);
        } else {
          tr.replaceRangeWith(from, to, node);
          selectionToInsertionEnd(tr, mapFrom, node.isInline ? -1 : 1);
        }
      }
    }
    /**
    Find a valid cursor or leaf node selection starting at the given
    position and searching back if `dir` is negative, and forward if
    positive. When `textOnly` is true, only consider cursor
    selections. Will return null when no valid selection position is
    found.
    */
    static findFrom($pos, dir, textOnly = false) {
      let inner = $pos.parent.inlineContent ? new TextSelection($pos) : findSelectionIn($pos.node(0), $pos.parent, $pos.pos, $pos.index(), dir, textOnly);
      if (inner)
        return inner;
      for (let depth = $pos.depth - 1; depth >= 0; depth--) {
        let found2 = dir < 0 ? findSelectionIn($pos.node(0), $pos.node(depth), $pos.before(depth + 1), $pos.index(depth), dir, textOnly) : findSelectionIn($pos.node(0), $pos.node(depth), $pos.after(depth + 1), $pos.index(depth) + 1, dir, textOnly);
        if (found2)
          return found2;
      }
      return null;
    }
    /**
    Find a valid cursor or leaf node selection near the given
    position. Searches forward first by default, but if `bias` is
    negative, it will search backwards first.
    */
    static near($pos, bias = 1) {
      return this.findFrom($pos, bias) || this.findFrom($pos, -bias) || new AllSelection($pos.node(0));
    }
    /**
    Find the cursor or leaf node selection closest to the start of
    the given document. Will return an
    [`AllSelection`](https://prosemirror.net/docs/ref/#state.AllSelection) if no valid position
    exists.
    */
    static atStart(doc3) {
      return findSelectionIn(doc3, doc3, 0, 0, 1) || new AllSelection(doc3);
    }
    /**
    Find the cursor or leaf node selection closest to the end of the
    given document.
    */
    static atEnd(doc3) {
      return findSelectionIn(doc3, doc3, doc3.content.size, doc3.childCount, -1) || new AllSelection(doc3);
    }
    /**
    Deserialize the JSON representation of a selection. Must be
    implemented for custom classes (as a static class method).
    */
    static fromJSON(doc3, json) {
      if (!json || !json.type)
        throw new RangeError("Invalid input for Selection.fromJSON");
      let cls = classesById[json.type];
      if (!cls)
        throw new RangeError(`No selection type ${json.type} defined`);
      return cls.fromJSON(doc3, json);
    }
    /**
    To be able to deserialize selections from JSON, custom selection
    classes must register themselves with an ID string, so that they
    can be disambiguated. Try to pick something that's unlikely to
    clash with classes from other modules.
    */
    static jsonID(id, selectionClass) {
      if (id in classesById)
        throw new RangeError("Duplicate use of selection JSON ID " + id);
      classesById[id] = selectionClass;
      selectionClass.prototype.jsonID = id;
      return selectionClass;
    }
    /**
    Get a [bookmark](https://prosemirror.net/docs/ref/#state.SelectionBookmark) for this selection,
    which is a value that can be mapped without having access to a
    current document, and later resolved to a real selection for a
    given document again. (This is used mostly by the history to
    track and restore old selections.) The default implementation of
    this method just converts the selection to a text selection and
    returns the bookmark for that.
    */
    getBookmark() {
      return TextSelection.between(this.$anchor, this.$head).getBookmark();
    }
  };
  Selection.prototype.visible = true;
  var SelectionRange = class {
    /**
    Create a range.
    */
    constructor($from, $to) {
      this.$from = $from;
      this.$to = $to;
    }
  };
  var warnedAboutTextSelection = false;
  function checkTextSelection($pos) {
    if (!warnedAboutTextSelection && !$pos.parent.inlineContent) {
      warnedAboutTextSelection = true;
      console["warn"]("TextSelection endpoint not pointing into a node with inline content (" + $pos.parent.type.name + ")");
    }
  }
  var TextSelection = class _TextSelection extends Selection {
    /**
    Construct a text selection between the given points.
    */
    constructor($anchor, $head = $anchor) {
      checkTextSelection($anchor);
      checkTextSelection($head);
      super($anchor, $head);
    }
    /**
    Returns a resolved position if this is a cursor selection (an
    empty text selection), and null otherwise.
    */
    get $cursor() {
      return this.$anchor.pos == this.$head.pos ? this.$head : null;
    }
    map(doc3, mapping) {
      let $head = doc3.resolve(mapping.map(this.head));
      if (!$head.parent.inlineContent)
        return Selection.near($head);
      let $anchor = doc3.resolve(mapping.map(this.anchor));
      return new _TextSelection($anchor.parent.inlineContent ? $anchor : $head, $head);
    }
    replace(tr, content = Slice.empty) {
      super.replace(tr, content);
      if (content == Slice.empty) {
        let marks = this.$from.marksAcross(this.$to);
        if (marks)
          tr.ensureMarks(marks);
      }
    }
    eq(other) {
      return other instanceof _TextSelection && other.anchor == this.anchor && other.head == this.head;
    }
    getBookmark() {
      return new TextBookmark(this.anchor, this.head);
    }
    toJSON() {
      return { type: "text", anchor: this.anchor, head: this.head };
    }
    /**
    @internal
    */
    static fromJSON(doc3, json) {
      if (typeof json.anchor != "number" || typeof json.head != "number")
        throw new RangeError("Invalid input for TextSelection.fromJSON");
      return new _TextSelection(doc3.resolve(json.anchor), doc3.resolve(json.head));
    }
    /**
    Create a text selection from non-resolved positions.
    */
    static create(doc3, anchor, head = anchor) {
      let $anchor = doc3.resolve(anchor);
      return new this($anchor, head == anchor ? $anchor : doc3.resolve(head));
    }
    /**
    Return a text selection that spans the given positions or, if
    they aren't text positions, find a text selection near them.
    `bias` determines whether the method searches forward (default)
    or backwards (negative number) first. Will fall back to calling
    [`Selection.near`](https://prosemirror.net/docs/ref/#state.Selection^near) when the document
    doesn't contain a valid text position.
    */
    static between($anchor, $head, bias) {
      let dPos = $anchor.pos - $head.pos;
      if (!bias || dPos)
        bias = dPos >= 0 ? 1 : -1;
      if (!$head.parent.inlineContent) {
        let found2 = Selection.findFrom($head, bias, true) || Selection.findFrom($head, -bias, true);
        if (found2)
          $head = found2.$head;
        else
          return Selection.near($head, bias);
      }
      if (!$anchor.parent.inlineContent) {
        if (dPos == 0) {
          $anchor = $head;
        } else {
          $anchor = (Selection.findFrom($anchor, -bias, true) || Selection.findFrom($anchor, bias, true)).$anchor;
          if ($anchor.pos < $head.pos != dPos < 0)
            $anchor = $head;
        }
      }
      return new _TextSelection($anchor, $head);
    }
  };
  Selection.jsonID("text", TextSelection);
  var TextBookmark = class _TextBookmark {
    constructor(anchor, head) {
      this.anchor = anchor;
      this.head = head;
    }
    map(mapping) {
      return new _TextBookmark(mapping.map(this.anchor), mapping.map(this.head));
    }
    resolve(doc3) {
      return TextSelection.between(doc3.resolve(this.anchor), doc3.resolve(this.head));
    }
  };
  var NodeSelection = class _NodeSelection extends Selection {
    /**
    Create a node selection. Does not verify the validity of its
    argument.
    */
    constructor($pos) {
      let node = $pos.nodeAfter;
      let $end = $pos.node(0).resolve($pos.pos + node.nodeSize);
      super($pos, $end);
      this.node = node;
    }
    map(doc3, mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      let $pos = doc3.resolve(pos);
      if (deleted)
        return Selection.near($pos);
      return new _NodeSelection($pos);
    }
    content() {
      return new Slice(Fragment.from(this.node), 0, 0);
    }
    eq(other) {
      return other instanceof _NodeSelection && other.anchor == this.anchor;
    }
    toJSON() {
      return { type: "node", anchor: this.anchor };
    }
    getBookmark() {
      return new NodeBookmark(this.anchor);
    }
    /**
    @internal
    */
    static fromJSON(doc3, json) {
      if (typeof json.anchor != "number")
        throw new RangeError("Invalid input for NodeSelection.fromJSON");
      return new _NodeSelection(doc3.resolve(json.anchor));
    }
    /**
    Create a node selection from non-resolved positions.
    */
    static create(doc3, from) {
      return new _NodeSelection(doc3.resolve(from));
    }
    /**
    Determines whether the given node may be selected as a node
    selection.
    */
    static isSelectable(node) {
      return !node.isText && node.type.spec.selectable !== false;
    }
  };
  NodeSelection.prototype.visible = false;
  Selection.jsonID("node", NodeSelection);
  var NodeBookmark = class _NodeBookmark {
    constructor(anchor) {
      this.anchor = anchor;
    }
    map(mapping) {
      let { deleted, pos } = mapping.mapResult(this.anchor);
      return deleted ? new TextBookmark(pos, pos) : new _NodeBookmark(pos);
    }
    resolve(doc3) {
      let $pos = doc3.resolve(this.anchor), node = $pos.nodeAfter;
      if (node && NodeSelection.isSelectable(node))
        return new NodeSelection($pos);
      return Selection.near($pos);
    }
  };
  var AllSelection = class _AllSelection extends Selection {
    /**
    Create an all-selection over the given document.
    */
    constructor(doc3) {
      super(doc3.resolve(0), doc3.resolve(doc3.content.size));
    }
    replace(tr, content = Slice.empty) {
      if (content == Slice.empty) {
        tr.delete(0, tr.doc.content.size);
        let sel = Selection.atStart(tr.doc);
        if (!sel.eq(tr.selection))
          tr.setSelection(sel);
      } else {
        super.replace(tr, content);
      }
    }
    toJSON() {
      return { type: "all" };
    }
    /**
    @internal
    */
    static fromJSON(doc3) {
      return new _AllSelection(doc3);
    }
    map(doc3) {
      return new _AllSelection(doc3);
    }
    eq(other) {
      return other instanceof _AllSelection;
    }
    getBookmark() {
      return AllBookmark;
    }
  };
  Selection.jsonID("all", AllSelection);
  var AllBookmark = {
    map() {
      return this;
    },
    resolve(doc3) {
      return new AllSelection(doc3);
    }
  };
  function findSelectionIn(doc3, node, pos, index, dir, text = false) {
    if (node.inlineContent)
      return TextSelection.create(doc3, pos);
    for (let i = index - (dir > 0 ? 0 : 1); dir > 0 ? i < node.childCount : i >= 0; i += dir) {
      let child = node.child(i);
      if (!child.isAtom) {
        let inner = findSelectionIn(doc3, child, pos + dir, dir < 0 ? child.childCount : 0, dir, text);
        if (inner)
          return inner;
      } else if (!text && NodeSelection.isSelectable(child)) {
        return NodeSelection.create(doc3, pos - (dir < 0 ? child.nodeSize : 0));
      }
      pos += child.nodeSize * dir;
    }
    return null;
  }
  function selectionToInsertionEnd(tr, startLen, bias) {
    let last = tr.steps.length - 1;
    if (last < startLen)
      return;
    let step = tr.steps[last];
    if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep))
      return;
    let map = tr.mapping.maps[last], end;
    map.forEach((_from, _to, _newFrom, newTo) => {
      if (end == null)
        end = newTo;
    });
    tr.setSelection(Selection.near(tr.doc.resolve(end), bias));
  }
  var UPDATED_SEL = 1;
  var UPDATED_MARKS = 2;
  var UPDATED_SCROLL = 4;
  var Transaction = class extends Transform {
    /**
    @internal
    */
    constructor(state) {
      super(state.doc);
      this.curSelectionFor = 0;
      this.updated = 0;
      this.meta = /* @__PURE__ */ Object.create(null);
      this.time = Date.now();
      this.curSelection = state.selection;
      this.storedMarks = state.storedMarks;
    }
    /**
    The transaction's current selection. This defaults to the editor
    selection [mapped](https://prosemirror.net/docs/ref/#state.Selection.map) through the steps in the
    transaction, but can be overwritten with
    [`setSelection`](https://prosemirror.net/docs/ref/#state.Transaction.setSelection).
    */
    get selection() {
      if (this.curSelectionFor < this.steps.length) {
        this.curSelection = this.curSelection.map(this.doc, this.mapping.slice(this.curSelectionFor));
        this.curSelectionFor = this.steps.length;
      }
      return this.curSelection;
    }
    /**
    Update the transaction's current selection. Will determine the
    selection that the editor gets when the transaction is applied.
    */
    setSelection(selection) {
      if (selection.$from.doc != this.doc)
        throw new RangeError("Selection passed to setSelection must point at the current document");
      this.curSelection = selection;
      this.curSelectionFor = this.steps.length;
      this.updated = (this.updated | UPDATED_SEL) & ~UPDATED_MARKS;
      this.storedMarks = null;
      return this;
    }
    /**
    Whether the selection was explicitly updated by this transaction.
    */
    get selectionSet() {
      return (this.updated & UPDATED_SEL) > 0;
    }
    /**
    Set the current stored marks.
    */
    setStoredMarks(marks) {
      this.storedMarks = marks;
      this.updated |= UPDATED_MARKS;
      return this;
    }
    /**
    Make sure the current stored marks or, if that is null, the marks
    at the selection, match the given set of marks. Does nothing if
    this is already the case.
    */
    ensureMarks(marks) {
      if (!Mark.sameSet(this.storedMarks || this.selection.$from.marks(), marks))
        this.setStoredMarks(marks);
      return this;
    }
    /**
    Add a mark to the set of stored marks.
    */
    addStoredMark(mark) {
      return this.ensureMarks(mark.addToSet(this.storedMarks || this.selection.$head.marks()));
    }
    /**
    Remove a mark or mark type from the set of stored marks.
    */
    removeStoredMark(mark) {
      return this.ensureMarks(mark.removeFromSet(this.storedMarks || this.selection.$head.marks()));
    }
    /**
    Whether the stored marks were explicitly set for this transaction.
    */
    get storedMarksSet() {
      return (this.updated & UPDATED_MARKS) > 0;
    }
    /**
    @internal
    */
    addStep(step, doc3) {
      super.addStep(step, doc3);
      this.updated = this.updated & ~UPDATED_MARKS;
      this.storedMarks = null;
    }
    /**
    Update the timestamp for the transaction.
    */
    setTime(time) {
      this.time = time;
      return this;
    }
    /**
    Replace the current selection with the given slice.
    */
    replaceSelection(slice) {
      this.selection.replace(this, slice);
      return this;
    }
    /**
    Replace the selection with the given node. When `inheritMarks` is
    true and the content is inline, it inherits the marks from the
    place where it is inserted.
    */
    replaceSelectionWith(node, inheritMarks = true) {
      let selection = this.selection;
      if (inheritMarks)
        node = node.mark(this.storedMarks || (selection.empty ? selection.$from.marks() : selection.$from.marksAcross(selection.$to) || Mark.none));
      selection.replaceWith(this, node);
      return this;
    }
    /**
    Delete the selection.
    */
    deleteSelection() {
      this.selection.replace(this);
      return this;
    }
    /**
    Replace the given range, or the selection if no range is given,
    with a text node containing the given string.
    */
    insertText(text, from, to) {
      let schema2 = this.doc.type.schema;
      if (from == null) {
        if (!text)
          return this.deleteSelection();
        return this.replaceSelectionWith(schema2.text(text), true);
      } else {
        if (to == null)
          to = from;
        if (!text)
          return this.deleteRange(from, to);
        let marks = this.storedMarks;
        if (!marks) {
          let $from = this.doc.resolve(from);
          marks = to == from ? $from.marks() : $from.marksAcross(this.doc.resolve(to));
        }
        this.replaceRangeWith(from, to, schema2.text(text, marks));
        if (!this.selection.empty && this.selection.to == from + text.length)
          this.setSelection(Selection.near(this.selection.$to));
        return this;
      }
    }
    /**
    Store a metadata property in this transaction, keyed either by
    name or by plugin.
    */
    setMeta(key, value) {
      this.meta[typeof key == "string" ? key : key.key] = value;
      return this;
    }
    /**
    Retrieve a metadata property for a given name or plugin.
    */
    getMeta(key) {
      return this.meta[typeof key == "string" ? key : key.key];
    }
    /**
    Returns true if this transaction doesn't contain any metadata,
    and can thus safely be extended.
    */
    get isGeneric() {
      for (let _ in this.meta)
        return false;
      return true;
    }
    /**
    Indicate that the editor should scroll the selection into view
    when updated to the state produced by this transaction.
    */
    scrollIntoView() {
      this.updated |= UPDATED_SCROLL;
      return this;
    }
    /**
    True when this transaction has had `scrollIntoView` called on it.
    */
    get scrolledIntoView() {
      return (this.updated & UPDATED_SCROLL) > 0;
    }
  };
  function bind(f, self2) {
    return !self2 || !f ? f : f.bind(self2);
  }
  var FieldDesc = class {
    constructor(name, desc, self2) {
      this.name = name;
      this.init = bind(desc.init, self2);
      this.apply = bind(desc.apply, self2);
    }
  };
  var baseFields = [
    new FieldDesc("doc", {
      init(config2) {
        return config2.doc || config2.schema.topNodeType.createAndFill();
      },
      apply(tr) {
        return tr.doc;
      }
    }),
    new FieldDesc("selection", {
      init(config2, instance) {
        return config2.selection || Selection.atStart(instance.doc);
      },
      apply(tr) {
        return tr.selection;
      }
    }),
    new FieldDesc("storedMarks", {
      init(config2) {
        return config2.storedMarks || null;
      },
      apply(tr, _marks, _old, state) {
        return state.selection.$cursor ? tr.storedMarks : null;
      }
    }),
    new FieldDesc("scrollToSelection", {
      init() {
        return 0;
      },
      apply(tr, prev) {
        return tr.scrolledIntoView ? prev + 1 : prev;
      }
    })
  ];
  var Configuration = class {
    constructor(schema2, plugins) {
      this.schema = schema2;
      this.plugins = [];
      this.pluginsByKey = /* @__PURE__ */ Object.create(null);
      this.fields = baseFields.slice();
      if (plugins)
        plugins.forEach((plugin) => {
          if (this.pluginsByKey[plugin.key])
            throw new RangeError("Adding different instances of a keyed plugin (" + plugin.key + ")");
          this.plugins.push(plugin);
          this.pluginsByKey[plugin.key] = plugin;
          if (plugin.spec.state)
            this.fields.push(new FieldDesc(plugin.key, plugin.spec.state, plugin));
        });
    }
  };
  var EditorState = class _EditorState {
    /**
    @internal
    */
    constructor(config2) {
      this.config = config2;
    }
    /**
    The schema of the state's document.
    */
    get schema() {
      return this.config.schema;
    }
    /**
    The plugins that are active in this state.
    */
    get plugins() {
      return this.config.plugins;
    }
    /**
    Apply the given transaction to produce a new state.
    */
    apply(tr) {
      return this.applyTransaction(tr).state;
    }
    /**
    @internal
    */
    filterTransaction(tr, ignore = -1) {
      for (let i = 0; i < this.config.plugins.length; i++)
        if (i != ignore) {
          let plugin = this.config.plugins[i];
          if (plugin.spec.filterTransaction && !plugin.spec.filterTransaction.call(plugin, tr, this))
            return false;
        }
      return true;
    }
    /**
    Verbose variant of [`apply`](https://prosemirror.net/docs/ref/#state.EditorState.apply) that
    returns the precise transactions that were applied (which might
    be influenced by the [transaction
    hooks](https://prosemirror.net/docs/ref/#state.PluginSpec.filterTransaction) of
    plugins) along with the new state.
    */
    applyTransaction(rootTr) {
      if (!this.filterTransaction(rootTr))
        return { state: this, transactions: [] };
      let trs = [rootTr], newState = this.applyInner(rootTr), seen = null;
      for (; ; ) {
        let haveNew = false;
        for (let i = 0; i < this.config.plugins.length; i++) {
          let plugin = this.config.plugins[i];
          if (plugin.spec.appendTransaction) {
            let n = seen ? seen[i].n : 0, oldState = seen ? seen[i].state : this;
            let tr = n < trs.length && plugin.spec.appendTransaction.call(plugin, n ? trs.slice(n) : trs, oldState, newState);
            if (tr && newState.filterTransaction(tr, i)) {
              tr.setMeta("appendedTransaction", rootTr);
              if (!seen) {
                seen = [];
                for (let j = 0; j < this.config.plugins.length; j++)
                  seen.push(j < i ? { state: newState, n: trs.length } : { state: this, n: 0 });
              }
              trs.push(tr);
              newState = newState.applyInner(tr);
              haveNew = true;
            }
            if (seen)
              seen[i] = { state: newState, n: trs.length };
          }
        }
        if (!haveNew)
          return { state: newState, transactions: trs };
      }
    }
    /**
    @internal
    */
    applyInner(tr) {
      if (!tr.before.eq(this.doc))
        throw new RangeError("Applying a mismatched transaction");
      let newInstance = new _EditorState(this.config), fields = this.config.fields;
      for (let i = 0; i < fields.length; i++) {
        let field = fields[i];
        newInstance[field.name] = field.apply(tr, this[field.name], this, newInstance);
      }
      return newInstance;
    }
    /**
    Accessor that constructs and returns a new [transaction](https://prosemirror.net/docs/ref/#state.Transaction) from this state.
    */
    get tr() {
      return new Transaction(this);
    }
    /**
    Create a new state.
    */
    static create(config2) {
      let $config = new Configuration(config2.doc ? config2.doc.type.schema : config2.schema, config2.plugins);
      let instance = new _EditorState($config);
      for (let i = 0; i < $config.fields.length; i++)
        instance[$config.fields[i].name] = $config.fields[i].init(config2, instance);
      return instance;
    }
    /**
    Create a new state based on this one, but with an adjusted set
    of active plugins. State fields that exist in both sets of
    plugins are kept unchanged. Those that no longer exist are
    dropped, and those that are new are initialized using their
    [`init`](https://prosemirror.net/docs/ref/#state.StateField.init) method, passing in the new
    configuration object..
    */
    reconfigure(config2) {
      let $config = new Configuration(this.schema, config2.plugins);
      let fields = $config.fields, instance = new _EditorState($config);
      for (let i = 0; i < fields.length; i++) {
        let name = fields[i].name;
        instance[name] = this.hasOwnProperty(name) ? this[name] : fields[i].init(config2, instance);
      }
      return instance;
    }
    /**
    Serialize this state to JSON. If you want to serialize the state
    of plugins, pass an object mapping property names to use in the
    resulting JSON object to plugin objects. The argument may also be
    a string or number, in which case it is ignored, to support the
    way `JSON.stringify` calls `toString` methods.
    */
    toJSON(pluginFields) {
      let result = { doc: this.doc.toJSON(), selection: this.selection.toJSON() };
      if (this.storedMarks)
        result.storedMarks = this.storedMarks.map((m) => m.toJSON());
      if (pluginFields && typeof pluginFields == "object")
        for (let prop in pluginFields) {
          if (prop == "doc" || prop == "selection")
            throw new RangeError("The JSON fields `doc` and `selection` are reserved");
          let plugin = pluginFields[prop], state = plugin.spec.state;
          if (state && state.toJSON)
            result[prop] = state.toJSON.call(plugin, this[plugin.key]);
        }
      return result;
    }
    /**
    Deserialize a JSON representation of a state. `config` should
    have at least a `schema` field, and should contain array of
    plugins to initialize the state with. `pluginFields` can be used
    to deserialize the state of plugins, by associating plugin
    instances with the property names they use in the JSON object.
    */
    static fromJSON(config2, json, pluginFields) {
      if (!json)
        throw new RangeError("Invalid input for EditorState.fromJSON");
      if (!config2.schema)
        throw new RangeError("Required config field 'schema' missing");
      let $config = new Configuration(config2.schema, config2.plugins);
      let instance = new _EditorState($config);
      $config.fields.forEach((field) => {
        if (field.name == "doc") {
          instance.doc = Node.fromJSON(config2.schema, json.doc);
        } else if (field.name == "selection") {
          instance.selection = Selection.fromJSON(instance.doc, json.selection);
        } else if (field.name == "storedMarks") {
          if (json.storedMarks)
            instance.storedMarks = json.storedMarks.map(config2.schema.markFromJSON);
        } else {
          if (pluginFields)
            for (let prop in pluginFields) {
              let plugin = pluginFields[prop], state = plugin.spec.state;
              if (plugin.key == field.name && state && state.fromJSON && Object.prototype.hasOwnProperty.call(json, prop)) {
                instance[field.name] = state.fromJSON.call(plugin, config2, json[prop], instance);
                return;
              }
            }
          instance[field.name] = field.init(config2, instance);
        }
      });
      return instance;
    }
  };

  // ../node_modules/.pnpm/prosemirror-view@1.41.6/node_modules/prosemirror-view/dist/index.js
  var domIndex = function(node) {
    for (var index = 0; ; index++) {
      node = node.previousSibling;
      if (!node)
        return index;
    }
  };
  var parentNode = function(node) {
    let parent = node.assignedSlot || node.parentNode;
    return parent && parent.nodeType == 11 ? parent.host : parent;
  };
  var reusedRange = null;
  var textRange = function(node, from, to) {
    let range = reusedRange || (reusedRange = document.createRange());
    range.setEnd(node, to == null ? node.nodeValue.length : to);
    range.setStart(node, from || 0);
    return range;
  };
  var clearReusedRange = function() {
    reusedRange = null;
  };
  var isEquivalentPosition = function(node, off, targetNode, targetOff) {
    return targetNode && (scanFor(node, off, targetNode, targetOff, -1) || scanFor(node, off, targetNode, targetOff, 1));
  };
  var atomElements = /^(img|br|input|textarea|hr)$/i;
  function scanFor(node, off, targetNode, targetOff, dir) {
    var _a;
    for (; ; ) {
      if (node == targetNode && off == targetOff)
        return true;
      if (off == (dir < 0 ? 0 : nodeSize(node))) {
        let parent = node.parentNode;
        if (!parent || parent.nodeType != 1 || hasBlockDesc(node) || atomElements.test(node.nodeName) || node.contentEditable == "false")
          return false;
        off = domIndex(node) + (dir < 0 ? 0 : 1);
        node = parent;
      } else if (node.nodeType == 1) {
        let child = node.childNodes[off + (dir < 0 ? -1 : 0)];
        if (child.nodeType == 1 && child.contentEditable == "false") {
          if ((_a = child.pmViewDesc) === null || _a === void 0 ? void 0 : _a.ignoreForSelection)
            off += dir;
          else
            return false;
        } else {
          node = child;
          off = dir < 0 ? nodeSize(node) : 0;
        }
      } else {
        return false;
      }
    }
  }
  function nodeSize(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
  }
  function textNodeBefore$1(node, offset) {
    for (; ; ) {
      if (node.nodeType == 3 && offset)
        return node;
      if (node.nodeType == 1 && offset > 0) {
        if (node.contentEditable == "false")
          return null;
        node = node.childNodes[offset - 1];
        offset = nodeSize(node);
      } else if (node.parentNode && !hasBlockDesc(node)) {
        offset = domIndex(node);
        node = node.parentNode;
      } else {
        return null;
      }
    }
  }
  function textNodeAfter$1(node, offset) {
    for (; ; ) {
      if (node.nodeType == 3 && offset < node.nodeValue.length)
        return node;
      if (node.nodeType == 1 && offset < node.childNodes.length) {
        if (node.contentEditable == "false")
          return null;
        node = node.childNodes[offset];
        offset = 0;
      } else if (node.parentNode && !hasBlockDesc(node)) {
        offset = domIndex(node) + 1;
        node = node.parentNode;
      } else {
        return null;
      }
    }
  }
  function isOnEdge(node, offset, parent) {
    for (let atStart = offset == 0, atEnd = offset == nodeSize(node); atStart || atEnd; ) {
      if (node == parent)
        return true;
      let index = domIndex(node);
      node = node.parentNode;
      if (!node)
        return false;
      atStart = atStart && index == 0;
      atEnd = atEnd && index == nodeSize(node);
    }
  }
  function hasBlockDesc(dom) {
    let desc;
    for (let cur = dom; cur; cur = cur.parentNode)
      if (desc = cur.pmViewDesc)
        break;
    return desc && desc.node && desc.node.isBlock && (desc.dom == dom || desc.contentDOM == dom);
  }
  var selectionCollapsed = function(domSel) {
    return domSel.focusNode && isEquivalentPosition(domSel.focusNode, domSel.focusOffset, domSel.anchorNode, domSel.anchorOffset);
  };
  function keyEvent(keyCode, key) {
    let event = document.createEvent("Event");
    event.initEvent("keydown", true, true);
    event.keyCode = keyCode;
    event.key = event.code = key;
    return event;
  }
  function deepActiveElement(doc3) {
    let elt = doc3.activeElement;
    while (elt && elt.shadowRoot)
      elt = elt.shadowRoot.activeElement;
    return elt;
  }
  function caretFromPoint(doc3, x, y) {
    if (doc3.caretPositionFromPoint) {
      try {
        let pos = doc3.caretPositionFromPoint(x, y);
        if (pos)
          return { node: pos.offsetNode, offset: Math.min(nodeSize(pos.offsetNode), pos.offset) };
      } catch (_) {
      }
    }
    if (doc3.caretRangeFromPoint) {
      let range = doc3.caretRangeFromPoint(x, y);
      if (range)
        return { node: range.startContainer, offset: Math.min(nodeSize(range.startContainer), range.startOffset) };
    }
  }
  var nav = typeof navigator != "undefined" ? navigator : null;
  var doc2 = typeof document != "undefined" ? document : null;
  var agent = nav && nav.userAgent || "";
  var ie_edge = /Edge\/(\d+)/.exec(agent);
  var ie_upto10 = /MSIE \d/.exec(agent);
  var ie_11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(agent);
  var ie = !!(ie_upto10 || ie_11up || ie_edge);
  var ie_version = ie_upto10 ? document.documentMode : ie_11up ? +ie_11up[1] : ie_edge ? +ie_edge[1] : 0;
  var gecko = !ie && /gecko\/(\d+)/i.test(agent);
  gecko && +(/Firefox\/(\d+)/.exec(agent) || [0, 0])[1];
  var _chrome = !ie && /Chrome\/(\d+)/.exec(agent);
  var chrome = !!_chrome;
  var chrome_version = _chrome ? +_chrome[1] : 0;
  var safari = !ie && !!nav && /Apple Computer/.test(nav.vendor);
  var ios = safari && (/Mobile\/\w+/.test(agent) || !!nav && nav.maxTouchPoints > 2);
  var mac = ios || (nav ? /Mac/.test(nav.platform) : false);
  var windows = nav ? /Win/.test(nav.platform) : false;
  var android = /Android \d/.test(agent);
  var webkit = !!doc2 && "webkitFontSmoothing" in doc2.documentElement.style;
  var webkit_version = webkit ? +(/\bAppleWebKit\/(\d+)/.exec(navigator.userAgent) || [0, 0])[1] : 0;
  function windowRect(doc3) {
    let vp = doc3.defaultView && doc3.defaultView.visualViewport;
    if (vp)
      return {
        left: 0,
        right: vp.width,
        top: 0,
        bottom: vp.height
      };
    return {
      left: 0,
      right: doc3.documentElement.clientWidth,
      top: 0,
      bottom: doc3.documentElement.clientHeight
    };
  }
  function getSide(value, side) {
    return typeof value == "number" ? value : value[side];
  }
  function clientRect(node) {
    let rect = node.getBoundingClientRect();
    let scaleX = rect.width / node.offsetWidth || 1;
    let scaleY = rect.height / node.offsetHeight || 1;
    return {
      left: rect.left,
      right: rect.left + node.clientWidth * scaleX,
      top: rect.top,
      bottom: rect.top + node.clientHeight * scaleY
    };
  }
  function scrollRectIntoView(view, rect, startDOM) {
    let scrollThreshold = view.someProp("scrollThreshold") || 0, scrollMargin = view.someProp("scrollMargin") || 5;
    let doc3 = view.dom.ownerDocument;
    for (let parent = startDOM || view.dom; ; ) {
      if (!parent)
        break;
      if (parent.nodeType != 1) {
        parent = parentNode(parent);
        continue;
      }
      let elt = parent;
      let atTop = elt == doc3.body;
      let bounding = atTop ? windowRect(doc3) : clientRect(elt);
      let moveX = 0, moveY = 0;
      if (rect.top < bounding.top + getSide(scrollThreshold, "top"))
        moveY = -(bounding.top - rect.top + getSide(scrollMargin, "top"));
      else if (rect.bottom > bounding.bottom - getSide(scrollThreshold, "bottom"))
        moveY = rect.bottom - rect.top > bounding.bottom - bounding.top ? rect.top + getSide(scrollMargin, "top") - bounding.top : rect.bottom - bounding.bottom + getSide(scrollMargin, "bottom");
      if (rect.left < bounding.left + getSide(scrollThreshold, "left"))
        moveX = -(bounding.left - rect.left + getSide(scrollMargin, "left"));
      else if (rect.right > bounding.right - getSide(scrollThreshold, "right"))
        moveX = rect.right - bounding.right + getSide(scrollMargin, "right");
      if (moveX || moveY) {
        if (atTop) {
          doc3.defaultView.scrollBy(moveX, moveY);
        } else {
          let startX = elt.scrollLeft, startY = elt.scrollTop;
          if (moveY)
            elt.scrollTop += moveY;
          if (moveX)
            elt.scrollLeft += moveX;
          let dX = elt.scrollLeft - startX, dY = elt.scrollTop - startY;
          rect = { left: rect.left - dX, top: rect.top - dY, right: rect.right - dX, bottom: rect.bottom - dY };
        }
      }
      let pos = atTop ? "fixed" : getComputedStyle(parent).position;
      if (/^(fixed|sticky)$/.test(pos))
        break;
      parent = pos == "absolute" ? parent.offsetParent : parentNode(parent);
    }
  }
  function storeScrollPos(view) {
    let rect = view.dom.getBoundingClientRect(), startY = Math.max(0, rect.top);
    let refDOM, refTop;
    for (let x = (rect.left + rect.right) / 2, y = startY + 1; y < Math.min(innerHeight, rect.bottom); y += 5) {
      let dom = view.root.elementFromPoint(x, y);
      if (!dom || dom == view.dom || !view.dom.contains(dom))
        continue;
      let localRect = dom.getBoundingClientRect();
      if (localRect.top >= startY - 20) {
        refDOM = dom;
        refTop = localRect.top;
        break;
      }
    }
    return { refDOM, refTop, stack: scrollStack(view.dom) };
  }
  function scrollStack(dom) {
    let stack = [], doc3 = dom.ownerDocument;
    for (let cur = dom; cur; cur = parentNode(cur)) {
      stack.push({ dom: cur, top: cur.scrollTop, left: cur.scrollLeft });
      if (dom == doc3)
        break;
    }
    return stack;
  }
  function resetScrollPos({ refDOM, refTop, stack }) {
    let newRefTop = refDOM ? refDOM.getBoundingClientRect().top : 0;
    restoreScrollStack(stack, newRefTop == 0 ? 0 : newRefTop - refTop);
  }
  function restoreScrollStack(stack, dTop) {
    for (let i = 0; i < stack.length; i++) {
      let { dom, top, left } = stack[i];
      if (dom.scrollTop != top + dTop)
        dom.scrollTop = top + dTop;
      if (dom.scrollLeft != left)
        dom.scrollLeft = left;
    }
  }
  var preventScrollSupported = null;
  function focusPreventScroll(dom) {
    if (dom.setActive)
      return dom.setActive();
    if (preventScrollSupported)
      return dom.focus(preventScrollSupported);
    let stored = scrollStack(dom);
    dom.focus(preventScrollSupported == null ? {
      get preventScroll() {
        preventScrollSupported = { preventScroll: true };
        return true;
      }
    } : void 0);
    if (!preventScrollSupported) {
      preventScrollSupported = false;
      restoreScrollStack(stored, 0);
    }
  }
  function findOffsetInNode(node, coords) {
    let closest, dxClosest = 2e8, coordsClosest, offset = 0;
    let rowBot = coords.top, rowTop = coords.top;
    let firstBelow, coordsBelow;
    for (let child = node.firstChild, childIndex = 0; child; child = child.nextSibling, childIndex++) {
      let rects;
      if (child.nodeType == 1)
        rects = child.getClientRects();
      else if (child.nodeType == 3)
        rects = textRange(child).getClientRects();
      else
        continue;
      for (let i = 0; i < rects.length; i++) {
        let rect = rects[i];
        if (rect.top <= rowBot && rect.bottom >= rowTop) {
          rowBot = Math.max(rect.bottom, rowBot);
          rowTop = Math.min(rect.top, rowTop);
          let dx = rect.left > coords.left ? rect.left - coords.left : rect.right < coords.left ? coords.left - rect.right : 0;
          if (dx < dxClosest) {
            closest = child;
            dxClosest = dx;
            coordsClosest = dx && closest.nodeType == 3 ? {
              left: rect.right < coords.left ? rect.right : rect.left,
              top: coords.top
            } : coords;
            if (child.nodeType == 1 && dx)
              offset = childIndex + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0);
            continue;
          }
        } else if (rect.top > coords.top && !firstBelow && rect.left <= coords.left && rect.right >= coords.left) {
          firstBelow = child;
          coordsBelow = { left: Math.max(rect.left, Math.min(rect.right, coords.left)), top: rect.top };
        }
        if (!closest && (coords.left >= rect.right && coords.top >= rect.top || coords.left >= rect.left && coords.top >= rect.bottom))
          offset = childIndex + 1;
      }
    }
    if (!closest && firstBelow) {
      closest = firstBelow;
      coordsClosest = coordsBelow;
      dxClosest = 0;
    }
    if (closest && closest.nodeType == 3)
      return findOffsetInText(closest, coordsClosest);
    if (!closest || dxClosest && closest.nodeType == 1)
      return { node, offset };
    return findOffsetInNode(closest, coordsClosest);
  }
  function findOffsetInText(node, coords) {
    let len = node.nodeValue.length;
    let range = document.createRange(), result;
    for (let i = 0; i < len; i++) {
      range.setEnd(node, i + 1);
      range.setStart(node, i);
      let rect = singleRect(range, 1);
      if (rect.top == rect.bottom)
        continue;
      if (inRect(coords, rect)) {
        result = { node, offset: i + (coords.left >= (rect.left + rect.right) / 2 ? 1 : 0) };
        break;
      }
    }
    range.detach();
    return result || { node, offset: 0 };
  }
  function inRect(coords, rect) {
    return coords.left >= rect.left - 1 && coords.left <= rect.right + 1 && coords.top >= rect.top - 1 && coords.top <= rect.bottom + 1;
  }
  function targetKludge(dom, coords) {
    let parent = dom.parentNode;
    if (parent && /^li$/i.test(parent.nodeName) && coords.left < dom.getBoundingClientRect().left)
      return parent;
    return dom;
  }
  function posFromElement(view, elt, coords) {
    let { node, offset } = findOffsetInNode(elt, coords), bias = -1;
    if (node.nodeType == 1 && !node.firstChild) {
      let rect = node.getBoundingClientRect();
      bias = rect.left != rect.right && coords.left > (rect.left + rect.right) / 2 ? 1 : -1;
    }
    return view.docView.posFromDOM(node, offset, bias);
  }
  function posFromCaret(view, node, offset, coords) {
    let outsideBlock = -1;
    for (let cur = node, sawBlock = false; ; ) {
      if (cur == view.dom)
        break;
      let desc = view.docView.nearestDesc(cur, true), rect;
      if (!desc)
        return null;
      if (desc.dom.nodeType == 1 && (desc.node.isBlock && desc.parent || !desc.contentDOM) && // Ignore elements with zero-size bounding rectangles
      ((rect = desc.dom.getBoundingClientRect()).width || rect.height)) {
        if (desc.node.isBlock && desc.parent && !/^T(R|BODY|HEAD|FOOT)$/.test(desc.dom.nodeName)) {
          if (!sawBlock && rect.left > coords.left || rect.top > coords.top)
            outsideBlock = desc.posBefore;
          else if (!sawBlock && rect.right < coords.left || rect.bottom < coords.top)
            outsideBlock = desc.posAfter;
          sawBlock = true;
        }
        if (!desc.contentDOM && outsideBlock < 0 && !desc.node.isText) {
          let before = desc.node.isBlock ? coords.top < (rect.top + rect.bottom) / 2 : coords.left < (rect.left + rect.right) / 2;
          return before ? desc.posBefore : desc.posAfter;
        }
      }
      cur = desc.dom.parentNode;
    }
    return outsideBlock > -1 ? outsideBlock : view.docView.posFromDOM(node, offset, -1);
  }
  function elementFromPoint(element, coords, box) {
    let len = element.childNodes.length;
    if (len && box.top < box.bottom) {
      for (let startI = Math.max(0, Math.min(len - 1, Math.floor(len * (coords.top - box.top) / (box.bottom - box.top)) - 2)), i = startI; ; ) {
        let child = element.childNodes[i];
        if (child.nodeType == 1) {
          let rects = child.getClientRects();
          for (let j = 0; j < rects.length; j++) {
            let rect = rects[j];
            if (inRect(coords, rect))
              return elementFromPoint(child, coords, rect);
          }
        }
        if ((i = (i + 1) % len) == startI)
          break;
      }
    }
    return element;
  }
  function posAtCoords(view, coords) {
    let doc3 = view.dom.ownerDocument, node, offset = 0;
    let caret = caretFromPoint(doc3, coords.left, coords.top);
    if (caret)
      ({ node, offset } = caret);
    let elt = (view.root.elementFromPoint ? view.root : doc3).elementFromPoint(coords.left, coords.top);
    let pos;
    if (!elt || !view.dom.contains(elt.nodeType != 1 ? elt.parentNode : elt)) {
      let box = view.dom.getBoundingClientRect();
      if (!inRect(coords, box))
        return null;
      elt = elementFromPoint(view.dom, coords, box);
      if (!elt)
        return null;
    }
    if (safari) {
      for (let p = elt; node && p; p = parentNode(p))
        if (p.draggable)
          node = void 0;
    }
    elt = targetKludge(elt, coords);
    if (node) {
      if (gecko && node.nodeType == 1) {
        offset = Math.min(offset, node.childNodes.length);
        if (offset < node.childNodes.length) {
          let next = node.childNodes[offset], box;
          if (next.nodeName == "IMG" && (box = next.getBoundingClientRect()).right <= coords.left && box.bottom > coords.top)
            offset++;
        }
      }
      let prev;
      if (webkit && offset && node.nodeType == 1 && (prev = node.childNodes[offset - 1]).nodeType == 1 && prev.contentEditable == "false" && prev.getBoundingClientRect().top >= coords.top)
        offset--;
      if (node == view.dom && offset == node.childNodes.length - 1 && node.lastChild.nodeType == 1 && coords.top > node.lastChild.getBoundingClientRect().bottom)
        pos = view.state.doc.content.size;
      else if (offset == 0 || node.nodeType != 1 || node.childNodes[offset - 1].nodeName != "BR")
        pos = posFromCaret(view, node, offset, coords);
    }
    if (pos == null)
      pos = posFromElement(view, elt, coords);
    let desc = view.docView.nearestDesc(elt, true);
    return { pos, inside: desc ? desc.posAtStart - desc.border : -1 };
  }
  function nonZero(rect) {
    return rect.top < rect.bottom || rect.left < rect.right;
  }
  function singleRect(target, bias) {
    let rects = target.getClientRects();
    if (rects.length) {
      let first = rects[bias < 0 ? 0 : rects.length - 1];
      if (nonZero(first))
        return first;
    }
    return Array.prototype.find.call(rects, nonZero) || target.getBoundingClientRect();
  }
  var BIDI = /[\u0590-\u05f4\u0600-\u06ff\u0700-\u08ac]/;
  function coordsAtPos(view, pos, side) {
    let { node, offset, atom } = view.docView.domFromPos(pos, side < 0 ? -1 : 1);
    let supportEmptyRange = webkit || gecko;
    if (node.nodeType == 3) {
      if (supportEmptyRange && (BIDI.test(node.nodeValue) || (side < 0 ? !offset : offset == node.nodeValue.length))) {
        let rect = singleRect(textRange(node, offset, offset), side);
        if (gecko && offset && /\s/.test(node.nodeValue[offset - 1]) && offset < node.nodeValue.length) {
          let rectBefore = singleRect(textRange(node, offset - 1, offset - 1), -1);
          if (rectBefore.top == rect.top) {
            let rectAfter = singleRect(textRange(node, offset, offset + 1), -1);
            if (rectAfter.top != rect.top)
              return flattenV(rectAfter, rectAfter.left < rectBefore.left);
          }
        }
        return rect;
      } else {
        let from = offset, to = offset, takeSide = side < 0 ? 1 : -1;
        if (side < 0 && !offset) {
          to++;
          takeSide = -1;
        } else if (side >= 0 && offset == node.nodeValue.length) {
          from--;
          takeSide = 1;
        } else if (side < 0) {
          from--;
        } else {
          to++;
        }
        return flattenV(singleRect(textRange(node, from, to), takeSide), takeSide < 0);
      }
    }
    let $dom = view.state.doc.resolve(pos - (atom || 0));
    if (!$dom.parent.inlineContent) {
      if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
        let before = node.childNodes[offset - 1];
        if (before.nodeType == 1)
          return flattenH(before.getBoundingClientRect(), false);
      }
      if (atom == null && offset < nodeSize(node)) {
        let after = node.childNodes[offset];
        if (after.nodeType == 1)
          return flattenH(after.getBoundingClientRect(), true);
      }
      return flattenH(node.getBoundingClientRect(), side >= 0);
    }
    if (atom == null && offset && (side < 0 || offset == nodeSize(node))) {
      let before = node.childNodes[offset - 1];
      let target = before.nodeType == 3 ? textRange(before, nodeSize(before) - (supportEmptyRange ? 0 : 1)) : before.nodeType == 1 && (before.nodeName != "BR" || !before.nextSibling) ? before : null;
      if (target)
        return flattenV(singleRect(target, 1), false);
    }
    if (atom == null && offset < nodeSize(node)) {
      let after = node.childNodes[offset];
      while (after.pmViewDesc && after.pmViewDesc.ignoreForCoords)
        after = after.nextSibling;
      let target = !after ? null : after.nodeType == 3 ? textRange(after, 0, supportEmptyRange ? 0 : 1) : after.nodeType == 1 ? after : null;
      if (target)
        return flattenV(singleRect(target, -1), true);
    }
    return flattenV(singleRect(node.nodeType == 3 ? textRange(node) : node, -side), side >= 0);
  }
  function flattenV(rect, left) {
    if (rect.width == 0)
      return rect;
    let x = left ? rect.left : rect.right;
    return { top: rect.top, bottom: rect.bottom, left: x, right: x };
  }
  function flattenH(rect, top) {
    if (rect.height == 0)
      return rect;
    let y = top ? rect.top : rect.bottom;
    return { top: y, bottom: y, left: rect.left, right: rect.right };
  }
  function withFlushedState(view, state, f) {
    let viewState = view.state, active = view.root.activeElement;
    if (viewState != state)
      view.updateState(state);
    if (active != view.dom)
      view.focus();
    try {
      return f();
    } finally {
      if (viewState != state)
        view.updateState(viewState);
      if (active != view.dom && active)
        active.focus();
    }
  }
  function endOfTextblockVertical(view, state, dir) {
    let sel = state.selection;
    let $pos = dir == "up" ? sel.$from : sel.$to;
    return withFlushedState(view, state, () => {
      let { node: dom } = view.docView.domFromPos($pos.pos, dir == "up" ? -1 : 1);
      for (; ; ) {
        let nearest = view.docView.nearestDesc(dom, true);
        if (!nearest)
          break;
        if (nearest.node.isBlock) {
          dom = nearest.contentDOM || nearest.dom;
          break;
        }
        dom = nearest.dom.parentNode;
      }
      let coords = coordsAtPos(view, $pos.pos, 1);
      for (let child = dom.firstChild; child; child = child.nextSibling) {
        let boxes;
        if (child.nodeType == 1)
          boxes = child.getClientRects();
        else if (child.nodeType == 3)
          boxes = textRange(child, 0, child.nodeValue.length).getClientRects();
        else
          continue;
        for (let i = 0; i < boxes.length; i++) {
          let box = boxes[i];
          if (box.bottom > box.top + 1 && (dir == "up" ? coords.top - box.top > (box.bottom - coords.top) * 2 : box.bottom - coords.bottom > (coords.bottom - box.top) * 2))
            return false;
        }
      }
      return true;
    });
  }
  var maybeRTL = /[\u0590-\u08ac]/;
  function endOfTextblockHorizontal(view, state, dir) {
    let { $head } = state.selection;
    if (!$head.parent.isTextblock)
      return false;
    let offset = $head.parentOffset, atStart = !offset, atEnd = offset == $head.parent.content.size;
    let sel = view.domSelection();
    if (!sel)
      return $head.pos == $head.start() || $head.pos == $head.end();
    if (!maybeRTL.test($head.parent.textContent) || !sel.modify)
      return dir == "left" || dir == "backward" ? atStart : atEnd;
    return withFlushedState(view, state, () => {
      let { focusNode: oldNode, focusOffset: oldOff, anchorNode, anchorOffset } = view.domSelectionRange();
      let oldBidiLevel = sel.caretBidiLevel;
      sel.modify("move", dir, "character");
      let parentDOM = $head.depth ? view.docView.domAfterPos($head.before()) : view.dom;
      let { focusNode: newNode, focusOffset: newOff } = view.domSelectionRange();
      let result = newNode && !parentDOM.contains(newNode.nodeType == 1 ? newNode : newNode.parentNode) || oldNode == newNode && oldOff == newOff;
      try {
        sel.collapse(anchorNode, anchorOffset);
        if (oldNode && (oldNode != anchorNode || oldOff != anchorOffset) && sel.extend)
          sel.extend(oldNode, oldOff);
      } catch (_) {
      }
      if (oldBidiLevel != null)
        sel.caretBidiLevel = oldBidiLevel;
      return result;
    });
  }
  var cachedState = null;
  var cachedDir = null;
  var cachedResult = false;
  function endOfTextblock(view, state, dir) {
    if (cachedState == state && cachedDir == dir)
      return cachedResult;
    cachedState = state;
    cachedDir = dir;
    return cachedResult = dir == "up" || dir == "down" ? endOfTextblockVertical(view, state, dir) : endOfTextblockHorizontal(view, state, dir);
  }
  var NOT_DIRTY = 0;
  var CHILD_DIRTY = 1;
  var CONTENT_DIRTY = 2;
  var NODE_DIRTY = 3;
  var ViewDesc = class {
    constructor(parent, children, dom, contentDOM) {
      this.parent = parent;
      this.children = children;
      this.dom = dom;
      this.contentDOM = contentDOM;
      this.dirty = NOT_DIRTY;
      dom.pmViewDesc = this;
    }
    // Used to check whether a given description corresponds to a
    // widget/mark/node.
    matchesWidget(widget) {
      return false;
    }
    matchesMark(mark) {
      return false;
    }
    matchesNode(node, outerDeco, innerDeco) {
      return false;
    }
    matchesHack(nodeName) {
      return false;
    }
    // When parsing in-editor content (in domchange.js), we allow
    // descriptions to determine the parse rules that should be used to
    // parse them.
    parseRule() {
      return null;
    }
    // Used by the editor's event handler to ignore events that come
    // from certain descs.
    stopEvent(event) {
      return false;
    }
    // The size of the content represented by this desc.
    get size() {
      let size = 0;
      for (let i = 0; i < this.children.length; i++)
        size += this.children[i].size;
      return size;
    }
    // For block nodes, this represents the space taken up by their
    // start/end tokens.
    get border() {
      return 0;
    }
    destroy() {
      this.parent = void 0;
      if (this.dom.pmViewDesc == this)
        this.dom.pmViewDesc = void 0;
      for (let i = 0; i < this.children.length; i++)
        this.children[i].destroy();
    }
    posBeforeChild(child) {
      for (let i = 0, pos = this.posAtStart; ; i++) {
        let cur = this.children[i];
        if (cur == child)
          return pos;
        pos += cur.size;
      }
    }
    get posBefore() {
      return this.parent.posBeforeChild(this);
    }
    get posAtStart() {
      return this.parent ? this.parent.posBeforeChild(this) + this.border : 0;
    }
    get posAfter() {
      return this.posBefore + this.size;
    }
    get posAtEnd() {
      return this.posAtStart + this.size - 2 * this.border;
    }
    localPosFromDOM(dom, offset, bias) {
      if (this.contentDOM && this.contentDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode)) {
        if (bias < 0) {
          let domBefore, desc;
          if (dom == this.contentDOM) {
            domBefore = dom.childNodes[offset - 1];
          } else {
            while (dom.parentNode != this.contentDOM)
              dom = dom.parentNode;
            domBefore = dom.previousSibling;
          }
          while (domBefore && !((desc = domBefore.pmViewDesc) && desc.parent == this))
            domBefore = domBefore.previousSibling;
          return domBefore ? this.posBeforeChild(desc) + desc.size : this.posAtStart;
        } else {
          let domAfter, desc;
          if (dom == this.contentDOM) {
            domAfter = dom.childNodes[offset];
          } else {
            while (dom.parentNode != this.contentDOM)
              dom = dom.parentNode;
            domAfter = dom.nextSibling;
          }
          while (domAfter && !((desc = domAfter.pmViewDesc) && desc.parent == this))
            domAfter = domAfter.nextSibling;
          return domAfter ? this.posBeforeChild(desc) : this.posAtEnd;
        }
      }
      let atEnd;
      if (dom == this.dom && this.contentDOM) {
        atEnd = offset > domIndex(this.contentDOM);
      } else if (this.contentDOM && this.contentDOM != this.dom && this.dom.contains(this.contentDOM)) {
        atEnd = dom.compareDocumentPosition(this.contentDOM) & 2;
      } else if (this.dom.firstChild) {
        if (offset == 0)
          for (let search = dom; ; search = search.parentNode) {
            if (search == this.dom) {
              atEnd = false;
              break;
            }
            if (search.previousSibling)
              break;
          }
        if (atEnd == null && offset == dom.childNodes.length)
          for (let search = dom; ; search = search.parentNode) {
            if (search == this.dom) {
              atEnd = true;
              break;
            }
            if (search.nextSibling)
              break;
          }
      }
      return (atEnd == null ? bias > 0 : atEnd) ? this.posAtEnd : this.posAtStart;
    }
    nearestDesc(dom, onlyNodes = false) {
      for (let first = true, cur = dom; cur; cur = cur.parentNode) {
        let desc = this.getDesc(cur), nodeDOM;
        if (desc && (!onlyNodes || desc.node)) {
          if (first && (nodeDOM = desc.nodeDOM) && !(nodeDOM.nodeType == 1 ? nodeDOM.contains(dom.nodeType == 1 ? dom : dom.parentNode) : nodeDOM == dom))
            first = false;
          else
            return desc;
        }
      }
    }
    getDesc(dom) {
      let desc = dom.pmViewDesc;
      for (let cur = desc; cur; cur = cur.parent)
        if (cur == this)
          return desc;
    }
    posFromDOM(dom, offset, bias) {
      for (let scan = dom; scan; scan = scan.parentNode) {
        let desc = this.getDesc(scan);
        if (desc)
          return desc.localPosFromDOM(dom, offset, bias);
      }
      return -1;
    }
    // Find the desc for the node after the given pos, if any. (When a
    // parent node overrode rendering, there might not be one.)
    descAt(pos) {
      for (let i = 0, offset = 0; i < this.children.length; i++) {
        let child = this.children[i], end = offset + child.size;
        if (offset == pos && end != offset) {
          while (!child.border && child.children.length) {
            for (let i2 = 0; i2 < child.children.length; i2++) {
              let inner = child.children[i2];
              if (inner.size) {
                child = inner;
                break;
              }
            }
          }
          return child;
        }
        if (pos < end)
          return child.descAt(pos - offset - child.border);
        offset = end;
      }
    }
    domFromPos(pos, side) {
      if (!this.contentDOM)
        return { node: this.dom, offset: 0, atom: pos + 1 };
      let i = 0, offset = 0;
      for (let curPos = 0; i < this.children.length; i++) {
        let child = this.children[i], end = curPos + child.size;
        if (end > pos || child instanceof TrailingHackViewDesc) {
          offset = pos - curPos;
          break;
        }
        curPos = end;
      }
      if (offset)
        return this.children[i].domFromPos(offset - this.children[i].border, side);
      for (let prev; i && !(prev = this.children[i - 1]).size && prev instanceof WidgetViewDesc && prev.side >= 0; i--) {
      }
      if (side <= 0) {
        let prev, enter = true;
        for (; ; i--, enter = false) {
          prev = i ? this.children[i - 1] : null;
          if (!prev || prev.dom.parentNode == this.contentDOM)
            break;
        }
        if (prev && side && enter && !prev.border && !prev.domAtom)
          return prev.domFromPos(prev.size, side);
        return { node: this.contentDOM, offset: prev ? domIndex(prev.dom) + 1 : 0 };
      } else {
        let next, enter = true;
        for (; ; i++, enter = false) {
          next = i < this.children.length ? this.children[i] : null;
          if (!next || next.dom.parentNode == this.contentDOM)
            break;
        }
        if (next && enter && !next.border && !next.domAtom)
          return next.domFromPos(0, side);
        return { node: this.contentDOM, offset: next ? domIndex(next.dom) : this.contentDOM.childNodes.length };
      }
    }
    // Used to find a DOM range in a single parent for a given changed
    // range.
    parseRange(from, to, base = 0) {
      if (this.children.length == 0)
        return { node: this.contentDOM, from, to, fromOffset: 0, toOffset: this.contentDOM.childNodes.length };
      let fromOffset = -1, toOffset = -1;
      for (let offset = base, i = 0; ; i++) {
        let child = this.children[i], end = offset + child.size;
        if (fromOffset == -1 && from <= end) {
          let childBase = offset + child.border;
          if (from >= childBase && to <= end - child.border && child.node && child.contentDOM && this.contentDOM.contains(child.contentDOM))
            return child.parseRange(from, to, childBase);
          from = offset;
          for (let j = i; j > 0; j--) {
            let prev = this.children[j - 1];
            if (prev.size && prev.dom.parentNode == this.contentDOM && !prev.emptyChildAt(1)) {
              fromOffset = domIndex(prev.dom) + 1;
              break;
            }
            from -= prev.size;
          }
          if (fromOffset == -1)
            fromOffset = 0;
        }
        if (fromOffset > -1 && (end > to || i == this.children.length - 1)) {
          to = end;
          for (let j = i + 1; j < this.children.length; j++) {
            let next = this.children[j];
            if (next.size && next.dom.parentNode == this.contentDOM && !next.emptyChildAt(-1)) {
              toOffset = domIndex(next.dom);
              break;
            }
            to += next.size;
          }
          if (toOffset == -1)
            toOffset = this.contentDOM.childNodes.length;
          break;
        }
        offset = end;
      }
      return { node: this.contentDOM, from, to, fromOffset, toOffset };
    }
    emptyChildAt(side) {
      if (this.border || !this.contentDOM || !this.children.length)
        return false;
      let child = this.children[side < 0 ? 0 : this.children.length - 1];
      return child.size == 0 || child.emptyChildAt(side);
    }
    domAfterPos(pos) {
      let { node, offset } = this.domFromPos(pos, 0);
      if (node.nodeType != 1 || offset == node.childNodes.length)
        throw new RangeError("No node after pos " + pos);
      return node.childNodes[offset];
    }
    // View descs are responsible for setting any selection that falls
    // entirely inside of them, so that custom implementations can do
    // custom things with the selection. Note that this falls apart when
    // a selection starts in such a node and ends in another, in which
    // case we just use whatever domFromPos produces as a best effort.
    setSelection(anchor, head, view, force = false) {
      let from = Math.min(anchor, head), to = Math.max(anchor, head);
      for (let i = 0, offset = 0; i < this.children.length; i++) {
        let child = this.children[i], end = offset + child.size;
        if (from > offset && to < end)
          return child.setSelection(anchor - offset - child.border, head - offset - child.border, view, force);
        offset = end;
      }
      let anchorDOM = this.domFromPos(anchor, anchor ? -1 : 1);
      let headDOM = head == anchor ? anchorDOM : this.domFromPos(head, head ? -1 : 1);
      let domSel = view.root.getSelection();
      let selRange = view.domSelectionRange();
      let brKludge = false;
      if ((gecko || safari) && anchor == head) {
        let { node, offset } = anchorDOM;
        if (node.nodeType == 3) {
          brKludge = !!(offset && node.nodeValue[offset - 1] == "\n");
          if (brKludge && offset == node.nodeValue.length) {
            for (let scan = node, after; scan; scan = scan.parentNode) {
              if (after = scan.nextSibling) {
                if (after.nodeName == "BR")
                  anchorDOM = headDOM = { node: after.parentNode, offset: domIndex(after) + 1 };
                break;
              }
              let desc = scan.pmViewDesc;
              if (desc && desc.node && desc.node.isBlock)
                break;
            }
          }
        } else {
          let prev = node.childNodes[offset - 1];
          brKludge = prev && (prev.nodeName == "BR" || prev.contentEditable == "false");
        }
      }
      if (gecko && selRange.focusNode && selRange.focusNode != headDOM.node && selRange.focusNode.nodeType == 1) {
        let after = selRange.focusNode.childNodes[selRange.focusOffset];
        if (after && after.contentEditable == "false")
          force = true;
      }
      if (!(force || brKludge && safari) && isEquivalentPosition(anchorDOM.node, anchorDOM.offset, selRange.anchorNode, selRange.anchorOffset) && isEquivalentPosition(headDOM.node, headDOM.offset, selRange.focusNode, selRange.focusOffset))
        return;
      let domSelExtended = false;
      if ((domSel.extend || anchor == head) && !(brKludge && gecko)) {
        domSel.collapse(anchorDOM.node, anchorDOM.offset);
        try {
          if (anchor != head)
            domSel.extend(headDOM.node, headDOM.offset);
          domSelExtended = true;
        } catch (_) {
        }
      }
      if (!domSelExtended) {
        if (anchor > head) {
          let tmp = anchorDOM;
          anchorDOM = headDOM;
          headDOM = tmp;
        }
        let range = document.createRange();
        range.setEnd(headDOM.node, headDOM.offset);
        range.setStart(anchorDOM.node, anchorDOM.offset);
        domSel.removeAllRanges();
        domSel.addRange(range);
      }
    }
    ignoreMutation(mutation) {
      return !this.contentDOM && mutation.type != "selection";
    }
    get contentLost() {
      return this.contentDOM && this.contentDOM != this.dom && !this.dom.contains(this.contentDOM);
    }
    // Remove a subtree of the element tree that has been touched
    // by a DOM change, so that the next update will redraw it.
    markDirty(from, to) {
      for (let offset = 0, i = 0; i < this.children.length; i++) {
        let child = this.children[i], end = offset + child.size;
        if (offset == end ? from <= end && to >= offset : from < end && to > offset) {
          let startInside = offset + child.border, endInside = end - child.border;
          if (from >= startInside && to <= endInside) {
            this.dirty = from == offset || to == end ? CONTENT_DIRTY : CHILD_DIRTY;
            if (from == startInside && to == endInside && (child.contentLost || child.dom.parentNode != this.contentDOM))
              child.dirty = NODE_DIRTY;
            else
              child.markDirty(from - startInside, to - startInside);
            return;
          } else {
            child.dirty = child.dom == child.contentDOM && child.dom.parentNode == this.contentDOM && !child.children.length ? CONTENT_DIRTY : NODE_DIRTY;
          }
        }
        offset = end;
      }
      this.dirty = CONTENT_DIRTY;
    }
    markParentsDirty() {
      let level = 1;
      for (let node = this.parent; node; node = node.parent, level++) {
        let dirty = level == 1 ? CONTENT_DIRTY : CHILD_DIRTY;
        if (node.dirty < dirty)
          node.dirty = dirty;
      }
    }
    get domAtom() {
      return false;
    }
    get ignoreForCoords() {
      return false;
    }
    get ignoreForSelection() {
      return false;
    }
    isText(text) {
      return false;
    }
  };
  var WidgetViewDesc = class extends ViewDesc {
    constructor(parent, widget, view, pos) {
      let self2, dom = widget.type.toDOM;
      if (typeof dom == "function")
        dom = dom(view, () => {
          if (!self2)
            return pos;
          if (self2.parent)
            return self2.parent.posBeforeChild(self2);
        });
      if (!widget.type.spec.raw) {
        if (dom.nodeType != 1) {
          let wrap2 = document.createElement("span");
          wrap2.appendChild(dom);
          dom = wrap2;
        }
        dom.contentEditable = "false";
        dom.classList.add("ProseMirror-widget");
      }
      super(parent, [], dom, null);
      this.widget = widget;
      this.widget = widget;
      self2 = this;
    }
    matchesWidget(widget) {
      return this.dirty == NOT_DIRTY && widget.type.eq(this.widget.type);
    }
    parseRule() {
      return { ignore: true };
    }
    stopEvent(event) {
      let stop = this.widget.spec.stopEvent;
      return stop ? stop(event) : false;
    }
    ignoreMutation(mutation) {
      return mutation.type != "selection" || this.widget.spec.ignoreSelection;
    }
    destroy() {
      this.widget.type.destroy(this.dom);
      super.destroy();
    }
    get domAtom() {
      return true;
    }
    get ignoreForSelection() {
      return !!this.widget.type.spec.relaxedSide;
    }
    get side() {
      return this.widget.type.side;
    }
  };
  var CompositionViewDesc = class extends ViewDesc {
    constructor(parent, dom, textDOM, text) {
      super(parent, [], dom, null);
      this.textDOM = textDOM;
      this.text = text;
    }
    get size() {
      return this.text.length;
    }
    localPosFromDOM(dom, offset) {
      if (dom != this.textDOM)
        return this.posAtStart + (offset ? this.size : 0);
      return this.posAtStart + offset;
    }
    domFromPos(pos) {
      return { node: this.textDOM, offset: pos };
    }
    ignoreMutation(mut) {
      return mut.type === "characterData" && mut.target.nodeValue == mut.oldValue;
    }
  };
  var MarkViewDesc = class _MarkViewDesc extends ViewDesc {
    constructor(parent, mark, dom, contentDOM, spec) {
      super(parent, [], dom, contentDOM);
      this.mark = mark;
      this.spec = spec;
    }
    static create(parent, mark, inline, view) {
      let custom = view.nodeViews[mark.type.name];
      let spec = custom && custom(mark, view, inline);
      if (!spec || !spec.dom)
        spec = DOMSerializer.renderSpec(document, mark.type.spec.toDOM(mark, inline), null, mark.attrs);
      return new _MarkViewDesc(parent, mark, spec.dom, spec.contentDOM || spec.dom, spec);
    }
    parseRule() {
      if (this.dirty & NODE_DIRTY || this.mark.type.spec.reparseInView)
        return null;
      return { mark: this.mark.type.name, attrs: this.mark.attrs, contentElement: this.contentDOM };
    }
    matchesMark(mark) {
      return this.dirty != NODE_DIRTY && this.mark.eq(mark);
    }
    markDirty(from, to) {
      super.markDirty(from, to);
      if (this.dirty != NOT_DIRTY) {
        let parent = this.parent;
        while (!parent.node)
          parent = parent.parent;
        if (parent.dirty < this.dirty)
          parent.dirty = this.dirty;
        this.dirty = NOT_DIRTY;
      }
    }
    slice(from, to, view) {
      let copy2 = _MarkViewDesc.create(this.parent, this.mark, true, view);
      let nodes = this.children, size = this.size;
      if (to < size)
        nodes = replaceNodes(nodes, to, size, view);
      if (from > 0)
        nodes = replaceNodes(nodes, 0, from, view);
      for (let i = 0; i < nodes.length; i++)
        nodes[i].parent = copy2;
      copy2.children = nodes;
      return copy2;
    }
    ignoreMutation(mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : super.ignoreMutation(mutation);
    }
    destroy() {
      if (this.spec.destroy)
        this.spec.destroy();
      super.destroy();
    }
  };
  var NodeViewDesc = class _NodeViewDesc extends ViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos) {
      super(parent, [], dom, contentDOM);
      this.node = node;
      this.outerDeco = outerDeco;
      this.innerDeco = innerDeco;
      this.nodeDOM = nodeDOM;
    }
    // By default, a node is rendered using the `toDOM` method from the
    // node type spec. But client code can use the `nodeViews` spec to
    // supply a custom node view, which can influence various aspects of
    // the way the node works.
    //
    // (Using subclassing for this was intentionally decided against,
    // since it'd require exposing a whole slew of finicky
    // implementation details to the user code that they probably will
    // never need.)
    static create(parent, node, outerDeco, innerDeco, view, pos) {
      let custom = view.nodeViews[node.type.name], descObj;
      let spec = custom && custom(node, view, () => {
        if (!descObj)
          return pos;
        if (descObj.parent)
          return descObj.parent.posBeforeChild(descObj);
      }, outerDeco, innerDeco);
      let dom = spec && spec.dom, contentDOM = spec && spec.contentDOM;
      if (node.isText) {
        if (!dom)
          dom = document.createTextNode(node.text);
        else if (dom.nodeType != 3)
          throw new RangeError("Text must be rendered as a DOM text node");
      } else if (!dom) {
        let spec2 = DOMSerializer.renderSpec(document, node.type.spec.toDOM(node), null, node.attrs);
        ({ dom, contentDOM } = spec2);
      }
      if (!contentDOM && !node.isText && dom.nodeName != "BR") {
        if (!dom.hasAttribute("contenteditable"))
          dom.contentEditable = "false";
        if (node.type.spec.draggable)
          dom.draggable = true;
      }
      let nodeDOM = dom;
      dom = applyOuterDeco(dom, outerDeco, node);
      if (spec)
        return descObj = new CustomNodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, spec, view, pos + 1);
      else if (node.isText)
        return new TextViewDesc(parent, node, outerDeco, innerDeco, dom, nodeDOM, view);
      else
        return new _NodeViewDesc(parent, node, outerDeco, innerDeco, dom, contentDOM || null, nodeDOM, view, pos + 1);
    }
    parseRule() {
      if (this.node.type.spec.reparseInView)
        return null;
      let rule = { node: this.node.type.name, attrs: this.node.attrs };
      if (this.node.type.whitespace == "pre")
        rule.preserveWhitespace = "full";
      if (!this.contentDOM) {
        rule.getContent = () => this.node.content;
      } else if (!this.contentLost) {
        rule.contentElement = this.contentDOM;
      } else {
        for (let i = this.children.length - 1; i >= 0; i--) {
          let child = this.children[i];
          if (this.dom.contains(child.dom.parentNode)) {
            rule.contentElement = child.dom.parentNode;
            break;
          }
        }
        if (!rule.contentElement)
          rule.getContent = () => Fragment.empty;
      }
      return rule;
    }
    matchesNode(node, outerDeco, innerDeco) {
      return this.dirty == NOT_DIRTY && node.eq(this.node) && sameOuterDeco(outerDeco, this.outerDeco) && innerDeco.eq(this.innerDeco);
    }
    get size() {
      return this.node.nodeSize;
    }
    get border() {
      return this.node.isLeaf ? 0 : 1;
    }
    // Syncs `this.children` to match `this.node.content` and the local
    // decorations, possibly introducing nesting for marks. Then, in a
    // separate step, syncs the DOM inside `this.contentDOM` to
    // `this.children`.
    updateChildren(view, pos) {
      let inline = this.node.inlineContent, off = pos;
      let composition = view.composing ? this.localCompositionInfo(view, pos) : null;
      let localComposition = composition && composition.pos > -1 ? composition : null;
      let compositionInChild = composition && composition.pos < 0;
      let updater = new ViewTreeUpdater(this, localComposition && localComposition.node, view);
      iterDeco(this.node, this.innerDeco, (widget, i, insideNode) => {
        if (widget.spec.marks)
          updater.syncToMarks(widget.spec.marks, inline, view, i);
        else if (widget.type.side >= 0 && !insideNode)
          updater.syncToMarks(i == this.node.childCount ? Mark.none : this.node.child(i).marks, inline, view, i);
        updater.placeWidget(widget, view, off);
      }, (child, outerDeco, innerDeco, i) => {
        updater.syncToMarks(child.marks, inline, view, i);
        let compIndex;
        if (updater.findNodeMatch(child, outerDeco, innerDeco, i)) ;
        else if (compositionInChild && view.state.selection.from > off && view.state.selection.to < off + child.nodeSize && (compIndex = updater.findIndexWithChild(composition.node)) > -1 && updater.updateNodeAt(child, outerDeco, innerDeco, compIndex, view)) ;
        else if (updater.updateNextNode(child, outerDeco, innerDeco, view, i, off)) ;
        else {
          updater.addNode(child, outerDeco, innerDeco, view, off);
        }
        off += child.nodeSize;
      });
      updater.syncToMarks([], inline, view, 0);
      if (this.node.isTextblock)
        updater.addTextblockHacks();
      updater.destroyRest();
      if (updater.changed || this.dirty == CONTENT_DIRTY) {
        if (localComposition)
          this.protectLocalComposition(view, localComposition);
        renderDescs(this.contentDOM, this.children, view);
        if (ios)
          iosHacks(this.dom);
      }
    }
    localCompositionInfo(view, pos) {
      let { from, to } = view.state.selection;
      if (!(view.state.selection instanceof TextSelection) || from < pos || to > pos + this.node.content.size)
        return null;
      let textNode = view.input.compositionNode;
      if (!textNode || !this.dom.contains(textNode.parentNode))
        return null;
      if (this.node.inlineContent) {
        let text = textNode.nodeValue;
        let textPos = findTextInFragment(this.node.content, text, from - pos, to - pos);
        return textPos < 0 ? null : { node: textNode, pos: textPos, text };
      } else {
        return { node: textNode, pos: -1, text: "" };
      }
    }
    protectLocalComposition(view, { node, pos, text }) {
      if (this.getDesc(node))
        return;
      let topNode = node;
      for (; ; topNode = topNode.parentNode) {
        if (topNode.parentNode == this.contentDOM)
          break;
        while (topNode.previousSibling)
          topNode.parentNode.removeChild(topNode.previousSibling);
        while (topNode.nextSibling)
          topNode.parentNode.removeChild(topNode.nextSibling);
        if (topNode.pmViewDesc)
          topNode.pmViewDesc = void 0;
      }
      let desc = new CompositionViewDesc(this, topNode, node, text);
      view.input.compositionNodes.push(desc);
      this.children = replaceNodes(this.children, pos, pos + text.length, view, desc);
    }
    // If this desc must be updated to match the given node decoration,
    // do so and return true.
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || !node.sameMarkup(this.node))
        return false;
      this.updateInner(node, outerDeco, innerDeco, view);
      return true;
    }
    updateInner(node, outerDeco, innerDeco, view) {
      this.updateOuterDeco(outerDeco);
      this.node = node;
      this.innerDeco = innerDeco;
      if (this.contentDOM)
        this.updateChildren(view, this.posAtStart);
      this.dirty = NOT_DIRTY;
    }
    updateOuterDeco(outerDeco) {
      if (sameOuterDeco(outerDeco, this.outerDeco))
        return;
      let needsWrap = this.nodeDOM.nodeType != 1;
      let oldDOM = this.dom;
      this.dom = patchOuterDeco(this.dom, this.nodeDOM, computeOuterDeco(this.outerDeco, this.node, needsWrap), computeOuterDeco(outerDeco, this.node, needsWrap));
      if (this.dom != oldDOM) {
        oldDOM.pmViewDesc = void 0;
        this.dom.pmViewDesc = this;
      }
      this.outerDeco = outerDeco;
    }
    // Mark this node as being the selected node.
    selectNode() {
      if (this.nodeDOM.nodeType == 1) {
        this.nodeDOM.classList.add("ProseMirror-selectednode");
        if (this.contentDOM || !this.node.type.spec.draggable)
          this.nodeDOM.draggable = true;
      }
    }
    // Remove selected node marking from this node.
    deselectNode() {
      if (this.nodeDOM.nodeType == 1) {
        this.nodeDOM.classList.remove("ProseMirror-selectednode");
        if (this.contentDOM || !this.node.type.spec.draggable)
          this.nodeDOM.removeAttribute("draggable");
      }
    }
    get domAtom() {
      return this.node.isAtom;
    }
  };
  function docViewDesc(doc3, outerDeco, innerDeco, dom, view) {
    applyOuterDeco(dom, outerDeco, doc3);
    let docView = new NodeViewDesc(void 0, doc3, outerDeco, innerDeco, dom, dom, dom, view, 0);
    if (docView.contentDOM)
      docView.updateChildren(view, 0);
    return docView;
  }
  var TextViewDesc = class _TextViewDesc extends NodeViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, nodeDOM, view) {
      super(parent, node, outerDeco, innerDeco, dom, null, nodeDOM, view, 0);
    }
    parseRule() {
      let skip = this.nodeDOM.parentNode;
      while (skip && skip != this.dom && !skip.pmIsDeco)
        skip = skip.parentNode;
      return { skip: skip || true };
    }
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY || this.dirty != NOT_DIRTY && !this.inParent() || !node.sameMarkup(this.node))
        return false;
      this.updateOuterDeco(outerDeco);
      if ((this.dirty != NOT_DIRTY || node.text != this.node.text) && node.text != this.nodeDOM.nodeValue) {
        this.nodeDOM.nodeValue = node.text;
        if (view.trackWrites == this.nodeDOM)
          view.trackWrites = null;
      }
      this.node = node;
      this.dirty = NOT_DIRTY;
      return true;
    }
    inParent() {
      let parentDOM = this.parent.contentDOM;
      for (let n = this.nodeDOM; n; n = n.parentNode)
        if (n == parentDOM)
          return true;
      return false;
    }
    domFromPos(pos) {
      return { node: this.nodeDOM, offset: pos };
    }
    localPosFromDOM(dom, offset, bias) {
      if (dom == this.nodeDOM)
        return this.posAtStart + Math.min(offset, this.node.text.length);
      return super.localPosFromDOM(dom, offset, bias);
    }
    ignoreMutation(mutation) {
      return mutation.type != "characterData" && mutation.type != "selection";
    }
    slice(from, to, view) {
      let node = this.node.cut(from, to), dom = document.createTextNode(node.text);
      return new _TextViewDesc(this.parent, node, this.outerDeco, this.innerDeco, dom, dom, view);
    }
    markDirty(from, to) {
      super.markDirty(from, to);
      if (this.dom != this.nodeDOM && (from == 0 || to == this.nodeDOM.nodeValue.length))
        this.dirty = NODE_DIRTY;
    }
    get domAtom() {
      return false;
    }
    isText(text) {
      return this.node.text == text;
    }
  };
  var TrailingHackViewDesc = class extends ViewDesc {
    parseRule() {
      return { ignore: true };
    }
    matchesHack(nodeName) {
      return this.dirty == NOT_DIRTY && this.dom.nodeName == nodeName;
    }
    get domAtom() {
      return true;
    }
    get ignoreForCoords() {
      return this.dom.nodeName == "IMG";
    }
  };
  var CustomNodeViewDesc = class extends NodeViewDesc {
    constructor(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, spec, view, pos) {
      super(parent, node, outerDeco, innerDeco, dom, contentDOM, nodeDOM, view, pos);
      this.spec = spec;
    }
    // A custom `update` method gets to decide whether the update goes
    // through. If it does, and there's a `contentDOM` node, our logic
    // updates the children.
    update(node, outerDeco, innerDeco, view) {
      if (this.dirty == NODE_DIRTY)
        return false;
      if (this.spec.update && (this.node.type == node.type || this.spec.multiType)) {
        let result = this.spec.update(node, outerDeco, innerDeco);
        if (result)
          this.updateInner(node, outerDeco, innerDeco, view);
        return result;
      } else if (!this.contentDOM && !node.isLeaf) {
        return false;
      } else {
        return super.update(node, outerDeco, innerDeco, view);
      }
    }
    selectNode() {
      this.spec.selectNode ? this.spec.selectNode() : super.selectNode();
    }
    deselectNode() {
      this.spec.deselectNode ? this.spec.deselectNode() : super.deselectNode();
    }
    setSelection(anchor, head, view, force) {
      this.spec.setSelection ? this.spec.setSelection(anchor, head, view.root) : super.setSelection(anchor, head, view, force);
    }
    destroy() {
      if (this.spec.destroy)
        this.spec.destroy();
      super.destroy();
    }
    stopEvent(event) {
      return this.spec.stopEvent ? this.spec.stopEvent(event) : false;
    }
    ignoreMutation(mutation) {
      return this.spec.ignoreMutation ? this.spec.ignoreMutation(mutation) : super.ignoreMutation(mutation);
    }
  };
  function renderDescs(parentDOM, descs, view) {
    let dom = parentDOM.firstChild, written = false;
    for (let i = 0; i < descs.length; i++) {
      let desc = descs[i], childDOM = desc.dom;
      if (childDOM.parentNode == parentDOM) {
        while (childDOM != dom) {
          dom = rm(dom);
          written = true;
        }
        dom = dom.nextSibling;
      } else {
        written = true;
        parentDOM.insertBefore(childDOM, dom);
      }
      if (desc instanceof MarkViewDesc) {
        let pos = dom ? dom.previousSibling : parentDOM.lastChild;
        renderDescs(desc.contentDOM, desc.children, view);
        dom = pos ? pos.nextSibling : parentDOM.firstChild;
      }
    }
    while (dom) {
      dom = rm(dom);
      written = true;
    }
    if (written && view.trackWrites == parentDOM)
      view.trackWrites = null;
  }
  var OuterDecoLevel = function(nodeName) {
    if (nodeName)
      this.nodeName = nodeName;
  };
  OuterDecoLevel.prototype = /* @__PURE__ */ Object.create(null);
  var noDeco = [new OuterDecoLevel()];
  function computeOuterDeco(outerDeco, node, needsWrap) {
    if (outerDeco.length == 0)
      return noDeco;
    let top = needsWrap ? noDeco[0] : new OuterDecoLevel(), result = [top];
    for (let i = 0; i < outerDeco.length; i++) {
      let attrs = outerDeco[i].type.attrs;
      if (!attrs)
        continue;
      if (attrs.nodeName)
        result.push(top = new OuterDecoLevel(attrs.nodeName));
      for (let name in attrs) {
        let val = attrs[name];
        if (val == null)
          continue;
        if (needsWrap && result.length == 1)
          result.push(top = new OuterDecoLevel(node.isInline ? "span" : "div"));
        if (name == "class")
          top.class = (top.class ? top.class + " " : "") + val;
        else if (name == "style")
          top.style = (top.style ? top.style + ";" : "") + val;
        else if (name != "nodeName")
          top[name] = val;
      }
    }
    return result;
  }
  function patchOuterDeco(outerDOM, nodeDOM, prevComputed, curComputed) {
    if (prevComputed == noDeco && curComputed == noDeco)
      return nodeDOM;
    let curDOM = nodeDOM;
    for (let i = 0; i < curComputed.length; i++) {
      let deco = curComputed[i], prev = prevComputed[i];
      if (i) {
        let parent;
        if (prev && prev.nodeName == deco.nodeName && curDOM != outerDOM && (parent = curDOM.parentNode) && parent.nodeName.toLowerCase() == deco.nodeName) {
          curDOM = parent;
        } else {
          parent = document.createElement(deco.nodeName);
          parent.pmIsDeco = true;
          parent.appendChild(curDOM);
          prev = noDeco[0];
          curDOM = parent;
        }
      }
      patchAttributes(curDOM, prev || noDeco[0], deco);
    }
    return curDOM;
  }
  function patchAttributes(dom, prev, cur) {
    for (let name in prev)
      if (name != "class" && name != "style" && name != "nodeName" && !(name in cur))
        dom.removeAttribute(name);
    for (let name in cur)
      if (name != "class" && name != "style" && name != "nodeName" && cur[name] != prev[name])
        dom.setAttribute(name, cur[name]);
    if (prev.class != cur.class) {
      let prevList = prev.class ? prev.class.split(" ").filter(Boolean) : [];
      let curList = cur.class ? cur.class.split(" ").filter(Boolean) : [];
      for (let i = 0; i < prevList.length; i++)
        if (curList.indexOf(prevList[i]) == -1)
          dom.classList.remove(prevList[i]);
      for (let i = 0; i < curList.length; i++)
        if (prevList.indexOf(curList[i]) == -1)
          dom.classList.add(curList[i]);
      if (dom.classList.length == 0)
        dom.removeAttribute("class");
    }
    if (prev.style != cur.style) {
      if (prev.style) {
        let prop = /\s*([\w\-\xa1-\uffff]+)\s*:(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\(.*?\)|[^;])*/g, m;
        while (m = prop.exec(prev.style))
          dom.style.removeProperty(m[1]);
      }
      if (cur.style)
        dom.style.cssText += cur.style;
    }
  }
  function applyOuterDeco(dom, deco, node) {
    return patchOuterDeco(dom, dom, noDeco, computeOuterDeco(deco, node, dom.nodeType != 1));
  }
  function sameOuterDeco(a, b) {
    if (a.length != b.length)
      return false;
    for (let i = 0; i < a.length; i++)
      if (!a[i].type.eq(b[i].type))
        return false;
    return true;
  }
  function rm(dom) {
    let next = dom.nextSibling;
    dom.parentNode.removeChild(dom);
    return next;
  }
  var ViewTreeUpdater = class {
    constructor(top, lock, view) {
      this.lock = lock;
      this.view = view;
      this.index = 0;
      this.stack = [];
      this.changed = false;
      this.top = top;
      this.preMatch = preMatch(top.node.content, top);
    }
    // Destroy and remove the children between the given indices in
    // `this.top`.
    destroyBetween(start, end) {
      if (start == end)
        return;
      for (let i = start; i < end; i++)
        this.top.children[i].destroy();
      this.top.children.splice(start, end - start);
      this.changed = true;
    }
    // Destroy all remaining children in `this.top`.
    destroyRest() {
      this.destroyBetween(this.index, this.top.children.length);
    }
    // Sync the current stack of mark descs with the given array of
    // marks, reusing existing mark descs when possible.
    syncToMarks(marks, inline, view, parentIndex) {
      let keep = 0, depth = this.stack.length >> 1;
      let maxKeep = Math.min(depth, marks.length);
      while (keep < maxKeep && (keep == depth - 1 ? this.top : this.stack[keep + 1 << 1]).matchesMark(marks[keep]) && marks[keep].type.spec.spanning !== false)
        keep++;
      while (keep < depth) {
        this.destroyRest();
        this.top.dirty = NOT_DIRTY;
        this.index = this.stack.pop();
        this.top = this.stack.pop();
        depth--;
      }
      while (depth < marks.length) {
        this.stack.push(this.top, this.index + 1);
        let found2 = -1, scanTo = this.top.children.length;
        if (parentIndex < this.preMatch.index)
          scanTo = Math.min(this.index + 3, scanTo);
        for (let i = this.index; i < scanTo; i++) {
          let next = this.top.children[i];
          if (next.matchesMark(marks[depth]) && !this.isLocked(next.dom)) {
            found2 = i;
            break;
          }
        }
        if (found2 > -1) {
          if (found2 > this.index) {
            this.changed = true;
            this.destroyBetween(this.index, found2);
          }
          this.top = this.top.children[this.index];
        } else {
          let markDesc = MarkViewDesc.create(this.top, marks[depth], inline, view);
          this.top.children.splice(this.index, 0, markDesc);
          this.top = markDesc;
          this.changed = true;
        }
        this.index = 0;
        depth++;
      }
    }
    // Try to find a node desc matching the given data. Skip over it and
    // return true when successful.
    findNodeMatch(node, outerDeco, innerDeco, index) {
      let found2 = -1, targetDesc;
      if (index >= this.preMatch.index && (targetDesc = this.preMatch.matches[index - this.preMatch.index]).parent == this.top && targetDesc.matchesNode(node, outerDeco, innerDeco)) {
        found2 = this.top.children.indexOf(targetDesc, this.index);
      } else {
        for (let i = this.index, e = Math.min(this.top.children.length, i + 5); i < e; i++) {
          let child = this.top.children[i];
          if (child.matchesNode(node, outerDeco, innerDeco) && !this.preMatch.matched.has(child)) {
            found2 = i;
            break;
          }
        }
      }
      if (found2 < 0)
        return false;
      this.destroyBetween(this.index, found2);
      this.index++;
      return true;
    }
    updateNodeAt(node, outerDeco, innerDeco, index, view) {
      let child = this.top.children[index];
      if (child.dirty == NODE_DIRTY && child.dom == child.contentDOM)
        child.dirty = CONTENT_DIRTY;
      if (!child.update(node, outerDeco, innerDeco, view))
        return false;
      this.destroyBetween(this.index, index);
      this.index++;
      return true;
    }
    findIndexWithChild(domNode) {
      for (; ; ) {
        let parent = domNode.parentNode;
        if (!parent)
          return -1;
        if (parent == this.top.contentDOM) {
          let desc = domNode.pmViewDesc;
          if (desc)
            for (let i = this.index; i < this.top.children.length; i++) {
              if (this.top.children[i] == desc)
                return i;
            }
          return -1;
        }
        domNode = parent;
      }
    }
    // Try to update the next node, if any, to the given data. Checks
    // pre-matches to avoid overwriting nodes that could still be used.
    updateNextNode(node, outerDeco, innerDeco, view, index, pos) {
      for (let i = this.index; i < this.top.children.length; i++) {
        let next = this.top.children[i];
        if (next instanceof NodeViewDesc) {
          let preMatch2 = this.preMatch.matched.get(next);
          if (preMatch2 != null && preMatch2 != index)
            return false;
          let nextDOM = next.dom, updated;
          let locked = this.isLocked(nextDOM) && !(node.isText && next.node && next.node.isText && next.nodeDOM.nodeValue == node.text && next.dirty != NODE_DIRTY && sameOuterDeco(outerDeco, next.outerDeco));
          if (!locked && next.update(node, outerDeco, innerDeco, view)) {
            this.destroyBetween(this.index, i);
            if (next.dom != nextDOM)
              this.changed = true;
            this.index++;
            return true;
          } else if (!locked && (updated = this.recreateWrapper(next, node, outerDeco, innerDeco, view, pos))) {
            this.destroyBetween(this.index, i);
            this.top.children[this.index] = updated;
            if (updated.contentDOM) {
              updated.dirty = CONTENT_DIRTY;
              updated.updateChildren(view, pos + 1);
              updated.dirty = NOT_DIRTY;
            }
            this.changed = true;
            this.index++;
            return true;
          }
          break;
        }
      }
      return false;
    }
    // When a node with content is replaced by a different node with
    // identical content, move over its children.
    recreateWrapper(next, node, outerDeco, innerDeco, view, pos) {
      if (next.dirty || node.isAtom || !next.children.length || !next.node.content.eq(node.content) || !sameOuterDeco(outerDeco, next.outerDeco) || !innerDeco.eq(next.innerDeco))
        return null;
      let wrapper = NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos);
      if (wrapper.contentDOM) {
        wrapper.children = next.children;
        next.children = [];
        for (let ch of wrapper.children)
          ch.parent = wrapper;
      }
      next.destroy();
      return wrapper;
    }
    // Insert the node as a newly created node desc.
    addNode(node, outerDeco, innerDeco, view, pos) {
      let desc = NodeViewDesc.create(this.top, node, outerDeco, innerDeco, view, pos);
      if (desc.contentDOM)
        desc.updateChildren(view, pos + 1);
      this.top.children.splice(this.index++, 0, desc);
      this.changed = true;
    }
    placeWidget(widget, view, pos) {
      let next = this.index < this.top.children.length ? this.top.children[this.index] : null;
      if (next && next.matchesWidget(widget) && (widget == next.widget || !next.widget.type.toDOM.parentNode)) {
        this.index++;
      } else {
        let desc = new WidgetViewDesc(this.top, widget, view, pos);
        this.top.children.splice(this.index++, 0, desc);
        this.changed = true;
      }
    }
    // Make sure a textblock looks and behaves correctly in
    // contentEditable.
    addTextblockHacks() {
      let lastChild = this.top.children[this.index - 1], parent = this.top;
      while (lastChild instanceof MarkViewDesc) {
        parent = lastChild;
        lastChild = parent.children[parent.children.length - 1];
      }
      if (!lastChild || // Empty textblock
      !(lastChild instanceof TextViewDesc) || /\n$/.test(lastChild.node.text) || this.view.requiresGeckoHackNode && /\s$/.test(lastChild.node.text)) {
        if ((safari || chrome) && lastChild && lastChild.dom.contentEditable == "false")
          this.addHackNode("IMG", parent);
        this.addHackNode("BR", this.top);
      }
    }
    addHackNode(nodeName, parent) {
      if (parent == this.top && this.index < parent.children.length && parent.children[this.index].matchesHack(nodeName)) {
        this.index++;
      } else {
        let dom = document.createElement(nodeName);
        if (nodeName == "IMG") {
          dom.className = "ProseMirror-separator";
          dom.alt = "";
        }
        if (nodeName == "BR")
          dom.className = "ProseMirror-trailingBreak";
        let hack = new TrailingHackViewDesc(this.top, [], dom, null);
        if (parent != this.top)
          parent.children.push(hack);
        else
          parent.children.splice(this.index++, 0, hack);
        this.changed = true;
      }
    }
    isLocked(node) {
      return this.lock && (node == this.lock || node.nodeType == 1 && node.contains(this.lock.parentNode));
    }
  };
  function preMatch(frag, parentDesc) {
    let curDesc = parentDesc, descI = curDesc.children.length;
    let fI = frag.childCount, matched = /* @__PURE__ */ new Map(), matches2 = [];
    outer: while (fI > 0) {
      let desc;
      for (; ; ) {
        if (descI) {
          let next = curDesc.children[descI - 1];
          if (next instanceof MarkViewDesc) {
            curDesc = next;
            descI = next.children.length;
          } else {
            desc = next;
            descI--;
            break;
          }
        } else if (curDesc == parentDesc) {
          break outer;
        } else {
          descI = curDesc.parent.children.indexOf(curDesc);
          curDesc = curDesc.parent;
        }
      }
      let node = desc.node;
      if (!node)
        continue;
      if (node != frag.child(fI - 1))
        break;
      --fI;
      matched.set(desc, fI);
      matches2.push(desc);
    }
    return { index: fI, matched, matches: matches2.reverse() };
  }
  function compareSide(a, b) {
    return a.type.side - b.type.side;
  }
  function iterDeco(parent, deco, onWidget, onNode) {
    let locals = deco.locals(parent), offset = 0;
    if (locals.length == 0) {
      for (let i = 0; i < parent.childCount; i++) {
        let child = parent.child(i);
        onNode(child, locals, deco.forChild(offset, child), i);
        offset += child.nodeSize;
      }
      return;
    }
    let decoIndex = 0, active = [], restNode = null;
    for (let parentIndex = 0; ; ) {
      let widget, widgets;
      while (decoIndex < locals.length && locals[decoIndex].to == offset) {
        let next = locals[decoIndex++];
        if (next.widget) {
          if (!widget)
            widget = next;
          else
            (widgets || (widgets = [widget])).push(next);
        }
      }
      if (widget) {
        if (widgets) {
          widgets.sort(compareSide);
          for (let i = 0; i < widgets.length; i++)
            onWidget(widgets[i], parentIndex, !!restNode);
        } else {
          onWidget(widget, parentIndex, !!restNode);
        }
      }
      let child, index;
      if (restNode) {
        index = -1;
        child = restNode;
        restNode = null;
      } else if (parentIndex < parent.childCount) {
        index = parentIndex;
        child = parent.child(parentIndex++);
      } else {
        break;
      }
      for (let i = 0; i < active.length; i++)
        if (active[i].to <= offset)
          active.splice(i--, 1);
      while (decoIndex < locals.length && locals[decoIndex].from <= offset && locals[decoIndex].to > offset)
        active.push(locals[decoIndex++]);
      let end = offset + child.nodeSize;
      if (child.isText) {
        let cutAt = end;
        if (decoIndex < locals.length && locals[decoIndex].from < cutAt)
          cutAt = locals[decoIndex].from;
        for (let i = 0; i < active.length; i++)
          if (active[i].to < cutAt)
            cutAt = active[i].to;
        if (cutAt < end) {
          restNode = child.cut(cutAt - offset);
          child = child.cut(0, cutAt - offset);
          end = cutAt;
          index = -1;
        }
      } else {
        while (decoIndex < locals.length && locals[decoIndex].to < end)
          decoIndex++;
      }
      let outerDeco = child.isInline && !child.isLeaf ? active.filter((d) => !d.inline) : active.slice();
      onNode(child, outerDeco, deco.forChild(offset, child), index);
      offset = end;
    }
  }
  function iosHacks(dom) {
    if (dom.nodeName == "UL" || dom.nodeName == "OL") {
      let oldCSS = dom.style.cssText;
      dom.style.cssText = oldCSS + "; list-style: square !important";
      window.getComputedStyle(dom).listStyle;
      dom.style.cssText = oldCSS;
    }
  }
  function findTextInFragment(frag, text, from, to) {
    for (let i = 0, pos = 0; i < frag.childCount && pos <= to; ) {
      let child = frag.child(i++), childStart = pos;
      pos += child.nodeSize;
      if (!child.isText)
        continue;
      let str = child.text;
      while (i < frag.childCount) {
        let next = frag.child(i++);
        pos += next.nodeSize;
        if (!next.isText)
          break;
        str += next.text;
      }
      if (pos >= from) {
        if (pos >= to && str.slice(to - text.length - childStart, to - childStart) == text)
          return to - text.length;
        let found2 = childStart < to ? str.lastIndexOf(text, to - childStart - 1) : -1;
        if (found2 >= 0 && found2 + text.length + childStart >= from)
          return childStart + found2;
        if (from == to && str.length >= to + text.length - childStart && str.slice(to - childStart, to - childStart + text.length) == text)
          return to;
      }
    }
    return -1;
  }
  function replaceNodes(nodes, from, to, view, replacement) {
    let result = [];
    for (let i = 0, off = 0; i < nodes.length; i++) {
      let child = nodes[i], start = off, end = off += child.size;
      if (start >= to || end <= from) {
        result.push(child);
      } else {
        if (start < from)
          result.push(child.slice(0, from - start, view));
        if (replacement) {
          result.push(replacement);
          replacement = void 0;
        }
        if (end > to)
          result.push(child.slice(to - start, child.size, view));
      }
    }
    return result;
  }
  function selectionFromDOM(view, origin = null) {
    let domSel = view.domSelectionRange(), doc3 = view.state.doc;
    if (!domSel.focusNode)
      return null;
    let nearestDesc = view.docView.nearestDesc(domSel.focusNode), inWidget = nearestDesc && nearestDesc.size == 0;
    let head = view.docView.posFromDOM(domSel.focusNode, domSel.focusOffset, 1);
    if (head < 0)
      return null;
    let $head = doc3.resolve(head), anchor, selection;
    if (selectionCollapsed(domSel)) {
      anchor = head;
      while (nearestDesc && !nearestDesc.node)
        nearestDesc = nearestDesc.parent;
      let nearestDescNode = nearestDesc.node;
      if (nearestDesc && nearestDescNode.isAtom && NodeSelection.isSelectable(nearestDescNode) && nearestDesc.parent && !(nearestDescNode.isInline && isOnEdge(domSel.focusNode, domSel.focusOffset, nearestDesc.dom))) {
        let pos = nearestDesc.posBefore;
        selection = new NodeSelection(head == pos ? $head : doc3.resolve(pos));
      }
    } else {
      if (domSel instanceof view.dom.ownerDocument.defaultView.Selection && domSel.rangeCount > 1) {
        let min = head, max = head;
        for (let i = 0; i < domSel.rangeCount; i++) {
          let range = domSel.getRangeAt(i);
          min = Math.min(min, view.docView.posFromDOM(range.startContainer, range.startOffset, 1));
          max = Math.max(max, view.docView.posFromDOM(range.endContainer, range.endOffset, -1));
        }
        if (min < 0)
          return null;
        [anchor, head] = max == view.state.selection.anchor ? [max, min] : [min, max];
        $head = doc3.resolve(head);
      } else {
        anchor = view.docView.posFromDOM(domSel.anchorNode, domSel.anchorOffset, 1);
      }
      if (anchor < 0)
        return null;
    }
    let $anchor = doc3.resolve(anchor);
    if (!selection) {
      let bias = origin == "pointer" || view.state.selection.head < $head.pos && !inWidget ? 1 : -1;
      selection = selectionBetween(view, $anchor, $head, bias);
    }
    return selection;
  }
  function editorOwnsSelection(view) {
    return view.editable ? view.hasFocus() : hasSelection(view) && document.activeElement && document.activeElement.contains(view.dom);
  }
  function selectionToDOM(view, force = false) {
    let sel = view.state.selection;
    syncNodeSelection(view, sel);
    if (!editorOwnsSelection(view))
      return;
    if (!force && view.input.mouseDown && view.input.mouseDown.allowDefault && chrome) {
      let domSel = view.domSelectionRange(), curSel = view.domObserver.currentSelection;
      if (domSel.anchorNode && curSel.anchorNode && isEquivalentPosition(domSel.anchorNode, domSel.anchorOffset, curSel.anchorNode, curSel.anchorOffset)) {
        view.input.mouseDown.delayedSelectionSync = true;
        view.domObserver.setCurSelection();
        return;
      }
    }
    view.domObserver.disconnectSelection();
    if (view.cursorWrapper) {
      selectCursorWrapper(view);
    } else {
      let { anchor, head } = sel, resetEditableFrom, resetEditableTo;
      if (brokenSelectBetweenUneditable && !(sel instanceof TextSelection)) {
        if (!sel.$from.parent.inlineContent)
          resetEditableFrom = temporarilyEditableNear(view, sel.from);
        if (!sel.empty && !sel.$from.parent.inlineContent)
          resetEditableTo = temporarilyEditableNear(view, sel.to);
      }
      view.docView.setSelection(anchor, head, view, force);
      if (brokenSelectBetweenUneditable) {
        if (resetEditableFrom)
          resetEditable(resetEditableFrom);
        if (resetEditableTo)
          resetEditable(resetEditableTo);
      }
      if (sel.visible) {
        view.dom.classList.remove("ProseMirror-hideselection");
      } else {
        view.dom.classList.add("ProseMirror-hideselection");
        if ("onselectionchange" in document)
          removeClassOnSelectionChange(view);
      }
    }
    view.domObserver.setCurSelection();
    view.domObserver.connectSelection();
  }
  var brokenSelectBetweenUneditable = safari || chrome && chrome_version < 63;
  function temporarilyEditableNear(view, pos) {
    let { node, offset } = view.docView.domFromPos(pos, 0);
    let after = offset < node.childNodes.length ? node.childNodes[offset] : null;
    let before = offset ? node.childNodes[offset - 1] : null;
    if (safari && after && after.contentEditable == "false")
      return setEditable(after);
    if ((!after || after.contentEditable == "false") && (!before || before.contentEditable == "false")) {
      if (after)
        return setEditable(after);
      else if (before)
        return setEditable(before);
    }
  }
  function setEditable(element) {
    element.contentEditable = "true";
    if (safari && element.draggable) {
      element.draggable = false;
      element.wasDraggable = true;
    }
    return element;
  }
  function resetEditable(element) {
    element.contentEditable = "false";
    if (element.wasDraggable) {
      element.draggable = true;
      element.wasDraggable = null;
    }
  }
  function removeClassOnSelectionChange(view) {
    let doc3 = view.dom.ownerDocument;
    doc3.removeEventListener("selectionchange", view.input.hideSelectionGuard);
    let domSel = view.domSelectionRange();
    let node = domSel.anchorNode, offset = domSel.anchorOffset;
    doc3.addEventListener("selectionchange", view.input.hideSelectionGuard = () => {
      if (domSel.anchorNode != node || domSel.anchorOffset != offset) {
        doc3.removeEventListener("selectionchange", view.input.hideSelectionGuard);
        setTimeout(() => {
          if (!editorOwnsSelection(view) || view.state.selection.visible)
            view.dom.classList.remove("ProseMirror-hideselection");
        }, 20);
      }
    });
  }
  function selectCursorWrapper(view) {
    let domSel = view.domSelection();
    if (!domSel)
      return;
    let node = view.cursorWrapper.dom, img = node.nodeName == "IMG";
    if (img)
      domSel.collapse(node.parentNode, domIndex(node) + 1);
    else
      domSel.collapse(node, 0);
    if (!img && !view.state.selection.visible && ie && ie_version <= 11) {
      node.disabled = true;
      node.disabled = false;
    }
  }
  function syncNodeSelection(view, sel) {
    if (sel instanceof NodeSelection) {
      let desc = view.docView.descAt(sel.from);
      if (desc != view.lastSelectedViewDesc) {
        clearNodeSelection(view);
        if (desc)
          desc.selectNode();
        view.lastSelectedViewDesc = desc;
      }
    } else {
      clearNodeSelection(view);
    }
  }
  function clearNodeSelection(view) {
    if (view.lastSelectedViewDesc) {
      if (view.lastSelectedViewDesc.parent)
        view.lastSelectedViewDesc.deselectNode();
      view.lastSelectedViewDesc = void 0;
    }
  }
  function selectionBetween(view, $anchor, $head, bias) {
    return view.someProp("createSelectionBetween", (f) => f(view, $anchor, $head)) || TextSelection.between($anchor, $head, bias);
  }
  function hasFocusAndSelection(view) {
    if (view.editable && !view.hasFocus())
      return false;
    return hasSelection(view);
  }
  function hasSelection(view) {
    let sel = view.domSelectionRange();
    if (!sel.anchorNode)
      return false;
    try {
      return view.dom.contains(sel.anchorNode.nodeType == 3 ? sel.anchorNode.parentNode : sel.anchorNode) && (view.editable || view.dom.contains(sel.focusNode.nodeType == 3 ? sel.focusNode.parentNode : sel.focusNode));
    } catch (_) {
      return false;
    }
  }
  function anchorInRightPlace(view) {
    let anchorDOM = view.docView.domFromPos(view.state.selection.anchor, 0);
    let domSel = view.domSelectionRange();
    return isEquivalentPosition(anchorDOM.node, anchorDOM.offset, domSel.anchorNode, domSel.anchorOffset);
  }
  function moveSelectionBlock(state, dir) {
    let { $anchor, $head } = state.selection;
    let $side = dir > 0 ? $anchor.max($head) : $anchor.min($head);
    let $start = !$side.parent.inlineContent ? $side : $side.depth ? state.doc.resolve(dir > 0 ? $side.after() : $side.before()) : null;
    return $start && Selection.findFrom($start, dir);
  }
  function apply2(view, sel) {
    view.dispatch(view.state.tr.setSelection(sel).scrollIntoView());
    return true;
  }
  function selectHorizontally(view, dir, mods) {
    let sel = view.state.selection;
    if (sel instanceof TextSelection) {
      if (mods.indexOf("s") > -1) {
        let { $head } = sel, node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter;
        if (!node || node.isText || !node.isLeaf)
          return false;
        let $newHead = view.state.doc.resolve($head.pos + node.nodeSize * (dir < 0 ? -1 : 1));
        return apply2(view, new TextSelection(sel.$anchor, $newHead));
      } else if (!sel.empty) {
        return false;
      } else if (view.endOfTextblock(dir > 0 ? "forward" : "backward")) {
        let next = moveSelectionBlock(view.state, dir);
        if (next && next instanceof NodeSelection)
          return apply2(view, next);
        return false;
      } else if (!(mac && mods.indexOf("m") > -1)) {
        let $head = sel.$head, node = $head.textOffset ? null : dir < 0 ? $head.nodeBefore : $head.nodeAfter, desc;
        if (!node || node.isText)
          return false;
        let nodePos = dir < 0 ? $head.pos - node.nodeSize : $head.pos;
        if (!(node.isAtom || (desc = view.docView.descAt(nodePos)) && !desc.contentDOM))
          return false;
        if (NodeSelection.isSelectable(node)) {
          return apply2(view, new NodeSelection(dir < 0 ? view.state.doc.resolve($head.pos - node.nodeSize) : $head));
        } else if (webkit) {
          return apply2(view, new TextSelection(view.state.doc.resolve(dir < 0 ? nodePos : nodePos + node.nodeSize)));
        } else {
          return false;
        }
      }
    } else if (sel instanceof NodeSelection && sel.node.isInline) {
      return apply2(view, new TextSelection(dir > 0 ? sel.$to : sel.$from));
    } else {
      let next = moveSelectionBlock(view.state, dir);
      if (next)
        return apply2(view, next);
      return false;
    }
  }
  function nodeLen(node) {
    return node.nodeType == 3 ? node.nodeValue.length : node.childNodes.length;
  }
  function isIgnorable(dom, dir) {
    let desc = dom.pmViewDesc;
    return desc && desc.size == 0 && (dir < 0 || dom.nextSibling || dom.nodeName != "BR");
  }
  function skipIgnoredNodes(view, dir) {
    return dir < 0 ? skipIgnoredNodesBefore(view) : skipIgnoredNodesAfter(view);
  }
  function skipIgnoredNodesBefore(view) {
    let sel = view.domSelectionRange();
    let node = sel.focusNode, offset = sel.focusOffset;
    if (!node)
      return;
    let moveNode, moveOffset, force = false;
    if (gecko && node.nodeType == 1 && offset < nodeLen(node) && isIgnorable(node.childNodes[offset], -1))
      force = true;
    for (; ; ) {
      if (offset > 0) {
        if (node.nodeType != 1) {
          break;
        } else {
          let before = node.childNodes[offset - 1];
          if (isIgnorable(before, -1)) {
            moveNode = node;
            moveOffset = --offset;
          } else if (before.nodeType == 3) {
            node = before;
            offset = node.nodeValue.length;
          } else
            break;
        }
      } else if (isBlockNode(node)) {
        break;
      } else {
        let prev = node.previousSibling;
        while (prev && isIgnorable(prev, -1)) {
          moveNode = node.parentNode;
          moveOffset = domIndex(prev);
          prev = prev.previousSibling;
        }
        if (!prev) {
          node = node.parentNode;
          if (node == view.dom)
            break;
          offset = 0;
        } else {
          node = prev;
          offset = nodeLen(node);
        }
      }
    }
    if (force)
      setSelFocus(view, node, offset);
    else if (moveNode)
      setSelFocus(view, moveNode, moveOffset);
  }
  function skipIgnoredNodesAfter(view) {
    let sel = view.domSelectionRange();
    let node = sel.focusNode, offset = sel.focusOffset;
    if (!node)
      return;
    let len = nodeLen(node);
    let moveNode, moveOffset;
    for (; ; ) {
      if (offset < len) {
        if (node.nodeType != 1)
          break;
        let after = node.childNodes[offset];
        if (isIgnorable(after, 1)) {
          moveNode = node;
          moveOffset = ++offset;
        } else
          break;
      } else if (isBlockNode(node)) {
        break;
      } else {
        let next = node.nextSibling;
        while (next && isIgnorable(next, 1)) {
          moveNode = next.parentNode;
          moveOffset = domIndex(next) + 1;
          next = next.nextSibling;
        }
        if (!next) {
          node = node.parentNode;
          if (node == view.dom)
            break;
          offset = len = 0;
        } else {
          node = next;
          offset = 0;
          len = nodeLen(node);
        }
      }
    }
    if (moveNode)
      setSelFocus(view, moveNode, moveOffset);
  }
  function isBlockNode(dom) {
    let desc = dom.pmViewDesc;
    return desc && desc.node && desc.node.isBlock;
  }
  function textNodeAfter(node, offset) {
    while (node && offset == node.childNodes.length && !hasBlockDesc(node)) {
      offset = domIndex(node) + 1;
      node = node.parentNode;
    }
    while (node && offset < node.childNodes.length) {
      let next = node.childNodes[offset];
      if (next.nodeType == 3)
        return next;
      if (next.nodeType == 1 && next.contentEditable == "false")
        break;
      node = next;
      offset = 0;
    }
  }
  function textNodeBefore(node, offset) {
    while (node && !offset && !hasBlockDesc(node)) {
      offset = domIndex(node);
      node = node.parentNode;
    }
    while (node && offset) {
      let next = node.childNodes[offset - 1];
      if (next.nodeType == 3)
        return next;
      if (next.nodeType == 1 && next.contentEditable == "false")
        break;
      node = next;
      offset = node.childNodes.length;
    }
  }
  function setSelFocus(view, node, offset) {
    if (node.nodeType != 3) {
      let before, after;
      if (after = textNodeAfter(node, offset)) {
        node = after;
        offset = 0;
      } else if (before = textNodeBefore(node, offset)) {
        node = before;
        offset = before.nodeValue.length;
      }
    }
    let sel = view.domSelection();
    if (!sel)
      return;
    if (selectionCollapsed(sel)) {
      let range = document.createRange();
      range.setEnd(node, offset);
      range.setStart(node, offset);
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (sel.extend) {
      sel.extend(node, offset);
    }
    view.domObserver.setCurSelection();
    let { state } = view;
    setTimeout(() => {
      if (view.state == state)
        selectionToDOM(view);
    }, 50);
  }
  function findDirection(view, pos) {
    let $pos = view.state.doc.resolve(pos);
    if (!(chrome || windows) && $pos.parent.inlineContent) {
      let coords = view.coordsAtPos(pos);
      if (pos > $pos.start()) {
        let before = view.coordsAtPos(pos - 1);
        let mid = (before.top + before.bottom) / 2;
        if (mid > coords.top && mid < coords.bottom && Math.abs(before.left - coords.left) > 1)
          return before.left < coords.left ? "ltr" : "rtl";
      }
      if (pos < $pos.end()) {
        let after = view.coordsAtPos(pos + 1);
        let mid = (after.top + after.bottom) / 2;
        if (mid > coords.top && mid < coords.bottom && Math.abs(after.left - coords.left) > 1)
          return after.left > coords.left ? "ltr" : "rtl";
      }
    }
    let computed = getComputedStyle(view.dom).direction;
    return computed == "rtl" ? "rtl" : "ltr";
  }
  function selectVertically(view, dir, mods) {
    let sel = view.state.selection;
    if (sel instanceof TextSelection && !sel.empty || mods.indexOf("s") > -1)
      return false;
    if (mac && mods.indexOf("m") > -1)
      return false;
    let { $from, $to } = sel;
    if (!$from.parent.inlineContent || view.endOfTextblock(dir < 0 ? "up" : "down")) {
      let next = moveSelectionBlock(view.state, dir);
      if (next && next instanceof NodeSelection)
        return apply2(view, next);
    }
    if (!$from.parent.inlineContent) {
      let side = dir < 0 ? $from : $to;
      let beyond = sel instanceof AllSelection ? Selection.near(side, dir) : Selection.findFrom(side, dir);
      return beyond ? apply2(view, beyond) : false;
    }
    return false;
  }
  function stopNativeHorizontalDelete(view, dir) {
    if (!(view.state.selection instanceof TextSelection))
      return true;
    let { $head, $anchor, empty: empty2 } = view.state.selection;
    if (!$head.sameParent($anchor))
      return true;
    if (!empty2)
      return false;
    if (view.endOfTextblock(dir > 0 ? "forward" : "backward"))
      return true;
    let nextNode = !$head.textOffset && (dir < 0 ? $head.nodeBefore : $head.nodeAfter);
    if (nextNode && !nextNode.isText) {
      let tr = view.state.tr;
      if (dir < 0)
        tr.delete($head.pos - nextNode.nodeSize, $head.pos);
      else
        tr.delete($head.pos, $head.pos + nextNode.nodeSize);
      view.dispatch(tr);
      return true;
    }
    return false;
  }
  function switchEditable(view, node, state) {
    view.domObserver.stop();
    node.contentEditable = state;
    view.domObserver.start();
  }
  function safariDownArrowBug(view) {
    if (!safari || view.state.selection.$head.parentOffset > 0)
      return false;
    let { focusNode, focusOffset } = view.domSelectionRange();
    if (focusNode && focusNode.nodeType == 1 && focusOffset == 0 && focusNode.firstChild && focusNode.firstChild.contentEditable == "false") {
      let child = focusNode.firstChild;
      switchEditable(view, child, "true");
      setTimeout(() => switchEditable(view, child, "false"), 20);
    }
    return false;
  }
  function getMods(event) {
    let result = "";
    if (event.ctrlKey)
      result += "c";
    if (event.metaKey)
      result += "m";
    if (event.altKey)
      result += "a";
    if (event.shiftKey)
      result += "s";
    return result;
  }
  function captureKeyDown(view, event) {
    let code = event.keyCode, mods = getMods(event);
    if (code == 8 || mac && code == 72 && mods == "c") {
      return stopNativeHorizontalDelete(view, -1) || skipIgnoredNodes(view, -1);
    } else if (code == 46 && !event.shiftKey || mac && code == 68 && mods == "c") {
      return stopNativeHorizontalDelete(view, 1) || skipIgnoredNodes(view, 1);
    } else if (code == 13 || code == 27) {
      return true;
    } else if (code == 37 || mac && code == 66 && mods == "c") {
      let dir = code == 37 ? findDirection(view, view.state.selection.from) == "ltr" ? -1 : 1 : -1;
      return selectHorizontally(view, dir, mods) || skipIgnoredNodes(view, dir);
    } else if (code == 39 || mac && code == 70 && mods == "c") {
      let dir = code == 39 ? findDirection(view, view.state.selection.from) == "ltr" ? 1 : -1 : 1;
      return selectHorizontally(view, dir, mods) || skipIgnoredNodes(view, dir);
    } else if (code == 38 || mac && code == 80 && mods == "c") {
      return selectVertically(view, -1, mods) || skipIgnoredNodes(view, -1);
    } else if (code == 40 || mac && code == 78 && mods == "c") {
      return safariDownArrowBug(view) || selectVertically(view, 1, mods) || skipIgnoredNodes(view, 1);
    } else if (mods == (mac ? "m" : "c") && (code == 66 || code == 73 || code == 89 || code == 90)) {
      return true;
    }
    return false;
  }
  function serializeForClipboard(view, slice) {
    view.someProp("transformCopied", (f) => {
      slice = f(slice, view);
    });
    let context = [], { content, openStart, openEnd } = slice;
    while (openStart > 1 && openEnd > 1 && content.childCount == 1 && content.firstChild.childCount == 1) {
      openStart--;
      openEnd--;
      let node = content.firstChild;
      context.push(node.type.name, node.attrs != node.type.defaultAttrs ? node.attrs : null);
      content = node.content;
    }
    let serializer = view.someProp("clipboardSerializer") || DOMSerializer.fromSchema(view.state.schema);
    let doc3 = detachedDoc(), wrap2 = doc3.createElement("div");
    wrap2.appendChild(serializer.serializeFragment(content, { document: doc3 }));
    let firstChild = wrap2.firstChild, needsWrap, wrappers = 0;
    while (firstChild && firstChild.nodeType == 1 && (needsWrap = wrapMap[firstChild.nodeName.toLowerCase()])) {
      for (let i = needsWrap.length - 1; i >= 0; i--) {
        let wrapper = doc3.createElement(needsWrap[i]);
        while (wrap2.firstChild)
          wrapper.appendChild(wrap2.firstChild);
        wrap2.appendChild(wrapper);
        wrappers++;
      }
      firstChild = wrap2.firstChild;
    }
    if (firstChild && firstChild.nodeType == 1)
      firstChild.setAttribute("data-pm-slice", `${openStart} ${openEnd}${wrappers ? ` -${wrappers}` : ""} ${JSON.stringify(context)}`);
    let text = view.someProp("clipboardTextSerializer", (f) => f(slice, view)) || slice.content.textBetween(0, slice.content.size, "\n\n");
    return { dom: wrap2, text, slice };
  }
  function parseFromClipboard(view, text, html, plainText, $context) {
    let inCode = $context.parent.type.spec.code;
    let dom, slice;
    if (!html && !text)
      return null;
    let asText = !!text && (plainText || inCode || !html);
    if (asText) {
      view.someProp("transformPastedText", (f) => {
        text = f(text, inCode || plainText, view);
      });
      if (inCode) {
        slice = new Slice(Fragment.from(view.state.schema.text(text.replace(/\r\n?/g, "\n"))), 0, 0);
        view.someProp("transformPasted", (f) => {
          slice = f(slice, view, true);
        });
        return slice;
      }
      let parsed = view.someProp("clipboardTextParser", (f) => f(text, $context, plainText, view));
      if (parsed) {
        slice = parsed;
      } else {
        let marks = $context.marks();
        let { schema: schema2 } = view.state, serializer = DOMSerializer.fromSchema(schema2);
        dom = document.createElement("div");
        text.split(/(?:\r\n?|\n)+/).forEach((block) => {
          let p = dom.appendChild(document.createElement("p"));
          if (block)
            p.appendChild(serializer.serializeNode(schema2.text(block, marks)));
        });
      }
    } else {
      view.someProp("transformPastedHTML", (f) => {
        html = f(html, view);
      });
      dom = readHTML(html);
      if (webkit)
        restoreReplacedSpaces(dom);
    }
    let contextNode = dom && dom.querySelector("[data-pm-slice]");
    let sliceData = contextNode && /^(\d+) (\d+)(?: -(\d+))? (.*)/.exec(contextNode.getAttribute("data-pm-slice") || "");
    if (sliceData && sliceData[3])
      for (let i = +sliceData[3]; i > 0; i--) {
        let child = dom.firstChild;
        while (child && child.nodeType != 1)
          child = child.nextSibling;
        if (!child)
          break;
        dom = child;
      }
    if (!slice) {
      let parser = view.someProp("clipboardParser") || view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
      slice = parser.parseSlice(dom, {
        preserveWhitespace: !!(asText || sliceData),
        context: $context,
        ruleFromNode(dom2) {
          if (dom2.nodeName == "BR" && !dom2.nextSibling && dom2.parentNode && !inlineParents.test(dom2.parentNode.nodeName))
            return { ignore: true };
          return null;
        }
      });
    }
    if (sliceData) {
      slice = addContext(closeSlice(slice, +sliceData[1], +sliceData[2]), sliceData[4]);
    } else {
      slice = Slice.maxOpen(normalizeSiblings(slice.content, $context), true);
      if (slice.openStart || slice.openEnd) {
        let openStart = 0, openEnd = 0;
        for (let node = slice.content.firstChild; openStart < slice.openStart && !node.type.spec.isolating; openStart++, node = node.firstChild) {
        }
        for (let node = slice.content.lastChild; openEnd < slice.openEnd && !node.type.spec.isolating; openEnd++, node = node.lastChild) {
        }
        slice = closeSlice(slice, openStart, openEnd);
      }
    }
    view.someProp("transformPasted", (f) => {
      slice = f(slice, view, asText);
    });
    return slice;
  }
  var inlineParents = /^(a|abbr|acronym|b|cite|code|del|em|i|ins|kbd|label|output|q|ruby|s|samp|span|strong|sub|sup|time|u|tt|var)$/i;
  function normalizeSiblings(fragment, $context) {
    if (fragment.childCount < 2)
      return fragment;
    for (let d = $context.depth; d >= 0; d--) {
      let parent = $context.node(d);
      let match = parent.contentMatchAt($context.index(d));
      let lastWrap, result = [];
      fragment.forEach((node) => {
        if (!result)
          return;
        let wrap2 = match.findWrapping(node.type), inLast;
        if (!wrap2)
          return result = null;
        if (inLast = result.length && lastWrap.length && addToSibling(wrap2, lastWrap, node, result[result.length - 1], 0)) {
          result[result.length - 1] = inLast;
        } else {
          if (result.length)
            result[result.length - 1] = closeRight(result[result.length - 1], lastWrap.length);
          let wrapped = withWrappers(node, wrap2);
          result.push(wrapped);
          match = match.matchType(wrapped.type);
          lastWrap = wrap2;
        }
      });
      if (result)
        return Fragment.from(result);
    }
    return fragment;
  }
  function withWrappers(node, wrap2, from = 0) {
    for (let i = wrap2.length - 1; i >= from; i--)
      node = wrap2[i].create(null, Fragment.from(node));
    return node;
  }
  function addToSibling(wrap2, lastWrap, node, sibling, depth) {
    if (depth < wrap2.length && depth < lastWrap.length && wrap2[depth] == lastWrap[depth]) {
      let inner = addToSibling(wrap2, lastWrap, node, sibling.lastChild, depth + 1);
      if (inner)
        return sibling.copy(sibling.content.replaceChild(sibling.childCount - 1, inner));
      let match = sibling.contentMatchAt(sibling.childCount);
      if (match.matchType(depth == wrap2.length - 1 ? node.type : wrap2[depth + 1]))
        return sibling.copy(sibling.content.append(Fragment.from(withWrappers(node, wrap2, depth + 1))));
    }
  }
  function closeRight(node, depth) {
    if (depth == 0)
      return node;
    let fragment = node.content.replaceChild(node.childCount - 1, closeRight(node.lastChild, depth - 1));
    let fill = node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true);
    return node.copy(fragment.append(fill));
  }
  function closeRange(fragment, side, from, to, depth, openEnd) {
    let node = side < 0 ? fragment.firstChild : fragment.lastChild, inner = node.content;
    if (fragment.childCount > 1)
      openEnd = 0;
    if (depth < to - 1)
      inner = closeRange(inner, side, from, to, depth + 1, openEnd);
    if (depth >= from)
      inner = side < 0 ? node.contentMatchAt(0).fillBefore(inner, openEnd <= depth).append(inner) : inner.append(node.contentMatchAt(node.childCount).fillBefore(Fragment.empty, true));
    return fragment.replaceChild(side < 0 ? 0 : fragment.childCount - 1, node.copy(inner));
  }
  function closeSlice(slice, openStart, openEnd) {
    if (openStart < slice.openStart)
      slice = new Slice(closeRange(slice.content, -1, openStart, slice.openStart, 0, slice.openEnd), openStart, slice.openEnd);
    if (openEnd < slice.openEnd)
      slice = new Slice(closeRange(slice.content, 1, openEnd, slice.openEnd, 0, 0), slice.openStart, openEnd);
    return slice;
  }
  var wrapMap = {
    thead: ["table"],
    tbody: ["table"],
    tfoot: ["table"],
    caption: ["table"],
    colgroup: ["table"],
    col: ["table", "colgroup"],
    tr: ["table", "tbody"],
    td: ["table", "tbody", "tr"],
    th: ["table", "tbody", "tr"]
  };
  var _detachedDoc = null;
  function detachedDoc() {
    return _detachedDoc || (_detachedDoc = document.implementation.createHTMLDocument("title"));
  }
  var _policy = null;
  function maybeWrapTrusted(html) {
    let trustedTypes = window.trustedTypes;
    if (!trustedTypes)
      return html;
    if (!_policy)
      _policy = trustedTypes.defaultPolicy || trustedTypes.createPolicy("ProseMirrorClipboard", { createHTML: (s) => s });
    return _policy.createHTML(html);
  }
  function readHTML(html) {
    let metas = /^(\s*<meta [^>]*>)*/.exec(html);
    if (metas)
      html = html.slice(metas[0].length);
    let elt = detachedDoc().createElement("div");
    let firstTag = /<([a-z][^>\s]+)/i.exec(html), wrap2;
    if (wrap2 = firstTag && wrapMap[firstTag[1].toLowerCase()])
      html = wrap2.map((n) => "<" + n + ">").join("") + html + wrap2.map((n) => "</" + n + ">").reverse().join("");
    elt.innerHTML = maybeWrapTrusted(html);
    if (wrap2)
      for (let i = 0; i < wrap2.length; i++)
        elt = elt.querySelector(wrap2[i]) || elt;
    return elt;
  }
  function restoreReplacedSpaces(dom) {
    let nodes = dom.querySelectorAll(chrome ? "span:not([class]):not([style])" : "span.Apple-converted-space");
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (node.childNodes.length == 1 && node.textContent == "\xA0" && node.parentNode)
        node.parentNode.replaceChild(dom.ownerDocument.createTextNode(" "), node);
    }
  }
  function addContext(slice, context) {
    if (!slice.size)
      return slice;
    let schema2 = slice.content.firstChild.type.schema, array;
    try {
      array = JSON.parse(context);
    } catch (e) {
      return slice;
    }
    let { content, openStart, openEnd } = slice;
    for (let i = array.length - 2; i >= 0; i -= 2) {
      let type3 = schema2.nodes[array[i]];
      if (!type3 || type3.hasRequiredAttrs())
        break;
      content = Fragment.from(type3.create(array[i + 1], content));
      openStart++;
      openEnd++;
    }
    return new Slice(content, openStart, openEnd);
  }
  var handlers = {};
  var editHandlers = {};
  var passiveHandlers = { touchstart: true, touchmove: true };
  var InputState = class {
    constructor() {
      this.shiftKey = false;
      this.mouseDown = null;
      this.lastKeyCode = null;
      this.lastKeyCodeTime = 0;
      this.lastClick = { time: 0, x: 0, y: 0, type: "", button: 0 };
      this.lastSelectionOrigin = null;
      this.lastSelectionTime = 0;
      this.lastIOSEnter = 0;
      this.lastIOSEnterFallbackTimeout = -1;
      this.lastFocus = 0;
      this.lastTouch = 0;
      this.lastChromeDelete = 0;
      this.composing = false;
      this.compositionNode = null;
      this.composingTimeout = -1;
      this.compositionNodes = [];
      this.compositionEndedAt = -2e8;
      this.compositionID = 1;
      this.badSafariComposition = false;
      this.compositionPendingChanges = 0;
      this.domChangeCount = 0;
      this.eventHandlers = /* @__PURE__ */ Object.create(null);
      this.hideSelectionGuard = null;
    }
  };
  function initInput(view) {
    for (let event in handlers) {
      let handler = handlers[event];
      view.dom.addEventListener(event, view.input.eventHandlers[event] = (event2) => {
        if (eventBelongsToView(view, event2) && !runCustomHandler(view, event2) && (view.editable || !(event2.type in editHandlers)))
          handler(view, event2);
      }, passiveHandlers[event] ? { passive: true } : void 0);
    }
    if (safari)
      view.dom.addEventListener("input", () => null);
    ensureListeners(view);
  }
  function setSelectionOrigin(view, origin) {
    view.input.lastSelectionOrigin = origin;
    view.input.lastSelectionTime = Date.now();
  }
  function destroyInput(view) {
    view.domObserver.stop();
    for (let type3 in view.input.eventHandlers)
      view.dom.removeEventListener(type3, view.input.eventHandlers[type3]);
    clearTimeout(view.input.composingTimeout);
    clearTimeout(view.input.lastIOSEnterFallbackTimeout);
  }
  function ensureListeners(view) {
    view.someProp("handleDOMEvents", (currentHandlers) => {
      for (let type3 in currentHandlers)
        if (!view.input.eventHandlers[type3])
          view.dom.addEventListener(type3, view.input.eventHandlers[type3] = (event) => runCustomHandler(view, event));
    });
  }
  function runCustomHandler(view, event) {
    return view.someProp("handleDOMEvents", (handlers2) => {
      let handler = handlers2[event.type];
      return handler ? handler(view, event) || event.defaultPrevented : false;
    });
  }
  function eventBelongsToView(view, event) {
    if (!event.bubbles)
      return true;
    if (event.defaultPrevented)
      return false;
    for (let node = event.target; node != view.dom; node = node.parentNode)
      if (!node || node.nodeType == 11 || node.pmViewDesc && node.pmViewDesc.stopEvent(event))
        return false;
    return true;
  }
  function dispatchEvent(view, event) {
    if (!runCustomHandler(view, event) && handlers[event.type] && (view.editable || !(event.type in editHandlers)))
      handlers[event.type](view, event);
  }
  editHandlers.keydown = (view, _event) => {
    let event = _event;
    view.input.shiftKey = event.keyCode == 16 || event.shiftKey;
    if (inOrNearComposition(view, event))
      return;
    view.input.lastKeyCode = event.keyCode;
    view.input.lastKeyCodeTime = Date.now();
    if (android && chrome && event.keyCode == 13)
      return;
    if (event.keyCode != 229)
      view.domObserver.forceFlush();
    if (ios && event.keyCode == 13 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      let now = Date.now();
      view.input.lastIOSEnter = now;
      view.input.lastIOSEnterFallbackTimeout = setTimeout(() => {
        if (view.input.lastIOSEnter == now) {
          view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")));
          view.input.lastIOSEnter = 0;
        }
      }, 200);
    } else if (view.someProp("handleKeyDown", (f) => f(view, event)) || captureKeyDown(view, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "key");
    }
  };
  editHandlers.keyup = (view, event) => {
    if (event.keyCode == 16)
      view.input.shiftKey = false;
  };
  editHandlers.keypress = (view, _event) => {
    let event = _event;
    if (inOrNearComposition(view, event) || !event.charCode || event.ctrlKey && !event.altKey || mac && event.metaKey)
      return;
    if (view.someProp("handleKeyPress", (f) => f(view, event))) {
      event.preventDefault();
      return;
    }
    let sel = view.state.selection;
    if (!(sel instanceof TextSelection) || !sel.$from.sameParent(sel.$to)) {
      let text = String.fromCharCode(event.charCode);
      let deflt = () => view.state.tr.insertText(text).scrollIntoView();
      if (!/[\r\n]/.test(text) && !view.someProp("handleTextInput", (f) => f(view, sel.$from.pos, sel.$to.pos, text, deflt)))
        view.dispatch(deflt());
      event.preventDefault();
    }
  };
  function eventCoords(event) {
    return { left: event.clientX, top: event.clientY };
  }
  function isNear(event, click) {
    let dx = click.x - event.clientX, dy = click.y - event.clientY;
    return dx * dx + dy * dy < 100;
  }
  function runHandlerOnContext(view, propName, pos, inside, event) {
    if (inside == -1)
      return false;
    let $pos = view.state.doc.resolve(inside);
    for (let i = $pos.depth + 1; i > 0; i--) {
      if (view.someProp(propName, (f) => i > $pos.depth ? f(view, pos, $pos.nodeAfter, $pos.before(i), event, true) : f(view, pos, $pos.node(i), $pos.before(i), event, false)))
        return true;
    }
    return false;
  }
  function updateSelection(view, selection, origin) {
    if (!view.focused)
      view.focus();
    if (view.state.selection.eq(selection))
      return;
    let tr = view.state.tr.setSelection(selection);
    if (origin == "pointer")
      tr.setMeta("pointer", true);
    view.dispatch(tr);
  }
  function selectClickedLeaf(view, inside) {
    if (inside == -1)
      return false;
    let $pos = view.state.doc.resolve(inside), node = $pos.nodeAfter;
    if (node && node.isAtom && NodeSelection.isSelectable(node)) {
      updateSelection(view, new NodeSelection($pos), "pointer");
      return true;
    }
    return false;
  }
  function selectClickedNode(view, inside) {
    if (inside == -1)
      return false;
    let sel = view.state.selection, selectedNode, selectAt;
    if (sel instanceof NodeSelection)
      selectedNode = sel.node;
    let $pos = view.state.doc.resolve(inside);
    for (let i = $pos.depth + 1; i > 0; i--) {
      let node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      if (NodeSelection.isSelectable(node)) {
        if (selectedNode && sel.$from.depth > 0 && i >= sel.$from.depth && $pos.before(sel.$from.depth + 1) == sel.$from.pos)
          selectAt = $pos.before(sel.$from.depth);
        else
          selectAt = $pos.before(i);
        break;
      }
    }
    if (selectAt != null) {
      updateSelection(view, NodeSelection.create(view.state.doc, selectAt), "pointer");
      return true;
    } else {
      return false;
    }
  }
  function handleSingleClick(view, pos, inside, event, selectNode) {
    return runHandlerOnContext(view, "handleClickOn", pos, inside, event) || view.someProp("handleClick", (f) => f(view, pos, event)) || (selectNode ? selectClickedNode(view, inside) : selectClickedLeaf(view, inside));
  }
  function handleDoubleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleDoubleClickOn", pos, inside, event) || view.someProp("handleDoubleClick", (f) => f(view, pos, event));
  }
  function handleTripleClick(view, pos, inside, event) {
    return runHandlerOnContext(view, "handleTripleClickOn", pos, inside, event) || view.someProp("handleTripleClick", (f) => f(view, pos, event)) || defaultTripleClick(view, inside, event);
  }
  function defaultTripleClick(view, inside, event) {
    if (event.button != 0)
      return false;
    let doc3 = view.state.doc;
    if (inside == -1) {
      if (doc3.inlineContent) {
        updateSelection(view, TextSelection.create(doc3, 0, doc3.content.size), "pointer");
        return true;
      }
      return false;
    }
    let $pos = doc3.resolve(inside);
    for (let i = $pos.depth + 1; i > 0; i--) {
      let node = i > $pos.depth ? $pos.nodeAfter : $pos.node(i);
      let nodePos = $pos.before(i);
      if (node.inlineContent)
        updateSelection(view, TextSelection.create(doc3, nodePos + 1, nodePos + 1 + node.content.size), "pointer");
      else if (NodeSelection.isSelectable(node))
        updateSelection(view, NodeSelection.create(doc3, nodePos), "pointer");
      else
        continue;
      return true;
    }
  }
  function forceDOMFlush(view) {
    return endComposition(view);
  }
  var selectNodeModifier = mac ? "metaKey" : "ctrlKey";
  handlers.mousedown = (view, _event) => {
    let event = _event;
    view.input.shiftKey = event.shiftKey;
    let flushed = forceDOMFlush(view);
    let now = Date.now(), type3 = "singleClick";
    if (now - view.input.lastClick.time < 500 && isNear(event, view.input.lastClick) && !event[selectNodeModifier] && view.input.lastClick.button == event.button) {
      if (view.input.lastClick.type == "singleClick")
        type3 = "doubleClick";
      else if (view.input.lastClick.type == "doubleClick")
        type3 = "tripleClick";
    }
    view.input.lastClick = { time: now, x: event.clientX, y: event.clientY, type: type3, button: event.button };
    let pos = view.posAtCoords(eventCoords(event));
    if (!pos)
      return;
    if (type3 == "singleClick") {
      if (view.input.mouseDown)
        view.input.mouseDown.done();
      view.input.mouseDown = new MouseDown(view, pos, event, !!flushed);
    } else if ((type3 == "doubleClick" ? handleDoubleClick : handleTripleClick)(view, pos.pos, pos.inside, event)) {
      event.preventDefault();
    } else {
      setSelectionOrigin(view, "pointer");
    }
  };
  var MouseDown = class {
    constructor(view, pos, event, flushed) {
      this.view = view;
      this.pos = pos;
      this.event = event;
      this.flushed = flushed;
      this.delayedSelectionSync = false;
      this.mightDrag = null;
      this.startDoc = view.state.doc;
      this.selectNode = !!event[selectNodeModifier];
      this.allowDefault = event.shiftKey;
      let targetNode, targetPos;
      if (pos.inside > -1) {
        targetNode = view.state.doc.nodeAt(pos.inside);
        targetPos = pos.inside;
      } else {
        let $pos = view.state.doc.resolve(pos.pos);
        targetNode = $pos.parent;
        targetPos = $pos.depth ? $pos.before() : 0;
      }
      const target = flushed ? null : event.target;
      const targetDesc = target ? view.docView.nearestDesc(target, true) : null;
      this.target = targetDesc && targetDesc.nodeDOM.nodeType == 1 ? targetDesc.nodeDOM : null;
      let { selection } = view.state;
      if (event.button == 0 && targetNode.type.spec.draggable && targetNode.type.spec.selectable !== false || selection instanceof NodeSelection && selection.from <= targetPos && selection.to > targetPos)
        this.mightDrag = {
          node: targetNode,
          pos: targetPos,
          addAttr: !!(this.target && !this.target.draggable),
          setUneditable: !!(this.target && gecko && !this.target.hasAttribute("contentEditable"))
        };
      if (this.target && this.mightDrag && (this.mightDrag.addAttr || this.mightDrag.setUneditable)) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr)
          this.target.draggable = true;
        if (this.mightDrag.setUneditable)
          setTimeout(() => {
            if (this.view.input.mouseDown == this)
              this.target.setAttribute("contentEditable", "false");
          }, 20);
        this.view.domObserver.start();
      }
      view.root.addEventListener("mouseup", this.up = this.up.bind(this));
      view.root.addEventListener("mousemove", this.move = this.move.bind(this));
      setSelectionOrigin(view, "pointer");
    }
    done() {
      this.view.root.removeEventListener("mouseup", this.up);
      this.view.root.removeEventListener("mousemove", this.move);
      if (this.mightDrag && this.target) {
        this.view.domObserver.stop();
        if (this.mightDrag.addAttr)
          this.target.removeAttribute("draggable");
        if (this.mightDrag.setUneditable)
          this.target.removeAttribute("contentEditable");
        this.view.domObserver.start();
      }
      if (this.delayedSelectionSync)
        setTimeout(() => selectionToDOM(this.view));
      this.view.input.mouseDown = null;
    }
    up(event) {
      this.done();
      if (!this.view.dom.contains(event.target))
        return;
      let pos = this.pos;
      if (this.view.state.doc != this.startDoc)
        pos = this.view.posAtCoords(eventCoords(event));
      this.updateAllowDefault(event);
      if (this.allowDefault || !pos) {
        setSelectionOrigin(this.view, "pointer");
      } else if (handleSingleClick(this.view, pos.pos, pos.inside, event, this.selectNode)) {
        event.preventDefault();
      } else if (event.button == 0 && (this.flushed || // Safari ignores clicks on draggable elements
      safari && this.mightDrag && !this.mightDrag.node.isAtom || // Chrome will sometimes treat a node selection as a
      // cursor, but still report that the node is selected
      // when asked through getSelection. You'll then get a
      // situation where clicking at the point where that
      // (hidden) cursor is doesn't change the selection, and
      // thus doesn't get a reaction from ProseMirror. This
      // works around that.
      chrome && !this.view.state.selection.visible && Math.min(Math.abs(pos.pos - this.view.state.selection.from), Math.abs(pos.pos - this.view.state.selection.to)) <= 2)) {
        updateSelection(this.view, Selection.near(this.view.state.doc.resolve(pos.pos)), "pointer");
        event.preventDefault();
      } else {
        setSelectionOrigin(this.view, "pointer");
      }
    }
    move(event) {
      this.updateAllowDefault(event);
      setSelectionOrigin(this.view, "pointer");
      if (event.buttons == 0)
        this.done();
    }
    updateAllowDefault(event) {
      if (!this.allowDefault && (Math.abs(this.event.x - event.clientX) > 4 || Math.abs(this.event.y - event.clientY) > 4))
        this.allowDefault = true;
    }
  };
  handlers.touchstart = (view) => {
    view.input.lastTouch = Date.now();
    forceDOMFlush(view);
    setSelectionOrigin(view, "pointer");
  };
  handlers.touchmove = (view) => {
    view.input.lastTouch = Date.now();
    setSelectionOrigin(view, "pointer");
  };
  handlers.contextmenu = (view) => forceDOMFlush(view);
  function inOrNearComposition(view, event) {
    if (view.composing)
      return true;
    if (safari && Math.abs(event.timeStamp - view.input.compositionEndedAt) < 500) {
      view.input.compositionEndedAt = -2e8;
      return true;
    }
    return false;
  }
  var timeoutComposition = android ? 5e3 : -1;
  editHandlers.compositionstart = editHandlers.compositionupdate = (view) => {
    if (!view.composing) {
      view.domObserver.flush();
      let { state } = view, $pos = state.selection.$to;
      if (state.selection instanceof TextSelection && (state.storedMarks || !$pos.textOffset && $pos.parentOffset && $pos.nodeBefore.marks.some((m) => m.type.spec.inclusive === false) || chrome && windows && selectionBeforeUneditable(view))) {
        view.markCursor = view.state.storedMarks || $pos.marks();
        endComposition(view, true);
        view.markCursor = null;
      } else {
        endComposition(view, !state.selection.empty);
        if (gecko && state.selection.empty && $pos.parentOffset && !$pos.textOffset && $pos.nodeBefore.marks.length) {
          let sel = view.domSelectionRange();
          for (let node = sel.focusNode, offset = sel.focusOffset; node && node.nodeType == 1 && offset != 0; ) {
            let before = offset < 0 ? node.lastChild : node.childNodes[offset - 1];
            if (!before)
              break;
            if (before.nodeType == 3) {
              let sel2 = view.domSelection();
              if (sel2)
                sel2.collapse(before, before.nodeValue.length);
              break;
            } else {
              node = before;
              offset = -1;
            }
          }
        }
      }
      view.input.composing = true;
    }
    scheduleComposeEnd(view, timeoutComposition);
  };
  function selectionBeforeUneditable(view) {
    let { focusNode, focusOffset } = view.domSelectionRange();
    if (!focusNode || focusNode.nodeType != 1 || focusOffset >= focusNode.childNodes.length)
      return false;
    let next = focusNode.childNodes[focusOffset];
    return next.nodeType == 1 && next.contentEditable == "false";
  }
  editHandlers.compositionend = (view, event) => {
    if (view.composing) {
      view.input.composing = false;
      view.input.compositionEndedAt = event.timeStamp;
      view.input.compositionPendingChanges = view.domObserver.pendingRecords().length ? view.input.compositionID : 0;
      view.input.compositionNode = null;
      if (view.input.badSafariComposition)
        view.domObserver.forceFlush();
      else if (view.input.compositionPendingChanges)
        Promise.resolve().then(() => view.domObserver.flush());
      view.input.compositionID++;
      scheduleComposeEnd(view, 20);
    }
  };
  function scheduleComposeEnd(view, delay) {
    clearTimeout(view.input.composingTimeout);
    if (delay > -1)
      view.input.composingTimeout = setTimeout(() => endComposition(view), delay);
  }
  function clearComposition(view) {
    if (view.composing) {
      view.input.composing = false;
      view.input.compositionEndedAt = timestampFromCustomEvent();
    }
    while (view.input.compositionNodes.length > 0)
      view.input.compositionNodes.pop().markParentsDirty();
  }
  function findCompositionNode(view) {
    let sel = view.domSelectionRange();
    if (!sel.focusNode)
      return null;
    let textBefore = textNodeBefore$1(sel.focusNode, sel.focusOffset);
    let textAfter = textNodeAfter$1(sel.focusNode, sel.focusOffset);
    if (textBefore && textAfter && textBefore != textAfter) {
      let descAfter = textAfter.pmViewDesc, lastChanged = view.domObserver.lastChangedTextNode;
      if (textBefore == lastChanged || textAfter == lastChanged)
        return lastChanged;
      if (!descAfter || !descAfter.isText(textAfter.nodeValue)) {
        return textAfter;
      } else if (view.input.compositionNode == textAfter) {
        let descBefore = textBefore.pmViewDesc;
        if (!(!descBefore || !descBefore.isText(textBefore.nodeValue)))
          return textAfter;
      }
    }
    return textBefore || textAfter;
  }
  function timestampFromCustomEvent() {
    let event = document.createEvent("Event");
    event.initEvent("event", true, true);
    return event.timeStamp;
  }
  function endComposition(view, restarting = false) {
    if (android && view.domObserver.flushingSoon >= 0)
      return;
    view.domObserver.forceFlush();
    clearComposition(view);
    if (restarting || view.docView && view.docView.dirty) {
      let sel = selectionFromDOM(view), cur = view.state.selection;
      if (sel && !sel.eq(cur))
        view.dispatch(view.state.tr.setSelection(sel));
      else if ((view.markCursor || restarting) && !cur.$from.node(cur.$from.sharedDepth(cur.to)).inlineContent)
        view.dispatch(view.state.tr.deleteSelection());
      else
        view.updateState(view.state);
      return true;
    }
    return false;
  }
  function captureCopy(view, dom) {
    if (!view.dom.parentNode)
      return;
    let wrap2 = view.dom.parentNode.appendChild(document.createElement("div"));
    wrap2.appendChild(dom);
    wrap2.style.cssText = "position: fixed; left: -10000px; top: 10px";
    let sel = getSelection(), range = document.createRange();
    range.selectNodeContents(dom);
    view.dom.blur();
    sel.removeAllRanges();
    sel.addRange(range);
    setTimeout(() => {
      if (wrap2.parentNode)
        wrap2.parentNode.removeChild(wrap2);
      view.focus();
    }, 50);
  }
  var brokenClipboardAPI = ie && ie_version < 15 || ios && webkit_version < 604;
  handlers.copy = editHandlers.cut = (view, _event) => {
    let event = _event;
    let sel = view.state.selection, cut = event.type == "cut";
    if (sel.empty)
      return;
    let data = brokenClipboardAPI ? null : event.clipboardData;
    let slice = sel.content(), { dom, text } = serializeForClipboard(view, slice);
    if (data) {
      event.preventDefault();
      data.clearData();
      data.setData("text/html", dom.innerHTML);
      data.setData("text/plain", text);
    } else {
      captureCopy(view, dom);
    }
    if (cut)
      view.dispatch(view.state.tr.deleteSelection().scrollIntoView().setMeta("uiEvent", "cut"));
  };
  function sliceSingleNode(slice) {
    return slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1 ? slice.content.firstChild : null;
  }
  function capturePaste(view, event) {
    if (!view.dom.parentNode)
      return;
    let plainText = view.input.shiftKey || view.state.selection.$from.parent.type.spec.code;
    let target = view.dom.parentNode.appendChild(document.createElement(plainText ? "textarea" : "div"));
    if (!plainText)
      target.contentEditable = "true";
    target.style.cssText = "position: fixed; left: -10000px; top: 10px";
    target.focus();
    let plain = view.input.shiftKey && view.input.lastKeyCode != 45;
    setTimeout(() => {
      view.focus();
      if (target.parentNode)
        target.parentNode.removeChild(target);
      if (plainText)
        doPaste(view, target.value, null, plain, event);
      else
        doPaste(view, target.textContent, target.innerHTML, plain, event);
    }, 50);
  }
  function doPaste(view, text, html, preferPlain, event) {
    let slice = parseFromClipboard(view, text, html, preferPlain, view.state.selection.$from);
    if (view.someProp("handlePaste", (f) => f(view, event, slice || Slice.empty)))
      return true;
    if (!slice)
      return false;
    let singleNode = sliceSingleNode(slice);
    let tr = singleNode ? view.state.tr.replaceSelectionWith(singleNode, preferPlain) : view.state.tr.replaceSelection(slice);
    view.dispatch(tr.scrollIntoView().setMeta("paste", true).setMeta("uiEvent", "paste"));
    return true;
  }
  function getText(clipboardData) {
    let text = clipboardData.getData("text/plain") || clipboardData.getData("Text");
    if (text)
      return text;
    let uris = clipboardData.getData("text/uri-list");
    return uris ? uris.replace(/\r?\n/g, " ") : "";
  }
  editHandlers.paste = (view, _event) => {
    let event = _event;
    if (view.composing && !android)
      return;
    let data = brokenClipboardAPI ? null : event.clipboardData;
    let plain = view.input.shiftKey && view.input.lastKeyCode != 45;
    if (data && doPaste(view, getText(data), data.getData("text/html"), plain, event))
      event.preventDefault();
    else
      capturePaste(view, event);
  };
  var Dragging = class {
    constructor(slice, move, node) {
      this.slice = slice;
      this.move = move;
      this.node = node;
    }
  };
  var dragCopyModifier = mac ? "altKey" : "ctrlKey";
  function dragMoves(view, event) {
    let moves = view.someProp("dragCopies", (test2) => !test2(event));
    return moves != null ? moves : !event[dragCopyModifier];
  }
  handlers.dragstart = (view, _event) => {
    let event = _event;
    let mouseDown = view.input.mouseDown;
    if (mouseDown)
      mouseDown.done();
    if (!event.dataTransfer)
      return;
    let sel = view.state.selection;
    let pos = sel.empty ? null : view.posAtCoords(eventCoords(event));
    let node;
    if (pos && pos.pos >= sel.from && pos.pos <= (sel instanceof NodeSelection ? sel.to - 1 : sel.to)) ;
    else if (mouseDown && mouseDown.mightDrag) {
      node = NodeSelection.create(view.state.doc, mouseDown.mightDrag.pos);
    } else if (event.target && event.target.nodeType == 1) {
      let desc = view.docView.nearestDesc(event.target, true);
      if (desc && desc.node.type.spec.draggable && desc != view.docView)
        node = NodeSelection.create(view.state.doc, desc.posBefore);
    }
    let draggedSlice = (node || view.state.selection).content();
    let { dom, text, slice } = serializeForClipboard(view, draggedSlice);
    if (!event.dataTransfer.files.length || !chrome || chrome_version > 120)
      event.dataTransfer.clearData();
    event.dataTransfer.setData(brokenClipboardAPI ? "Text" : "text/html", dom.innerHTML);
    event.dataTransfer.effectAllowed = "copyMove";
    if (!brokenClipboardAPI)
      event.dataTransfer.setData("text/plain", text);
    view.dragging = new Dragging(slice, dragMoves(view, event), node);
  };
  handlers.dragend = (view) => {
    let dragging = view.dragging;
    window.setTimeout(() => {
      if (view.dragging == dragging)
        view.dragging = null;
    }, 50);
  };
  editHandlers.dragover = editHandlers.dragenter = (_, e) => e.preventDefault();
  editHandlers.drop = (view, event) => {
    try {
      handleDrop(view, event, view.dragging);
    } finally {
      view.dragging = null;
    }
  };
  function handleDrop(view, event, dragging) {
    if (!event.dataTransfer)
      return;
    let eventPos = view.posAtCoords(eventCoords(event));
    if (!eventPos)
      return;
    let $mouse = view.state.doc.resolve(eventPos.pos);
    let slice = dragging && dragging.slice;
    if (slice) {
      view.someProp("transformPasted", (f) => {
        slice = f(slice, view, false);
      });
    } else {
      slice = parseFromClipboard(view, getText(event.dataTransfer), brokenClipboardAPI ? null : event.dataTransfer.getData("text/html"), false, $mouse);
    }
    let move = !!(dragging && dragMoves(view, event));
    if (view.someProp("handleDrop", (f) => f(view, event, slice || Slice.empty, move))) {
      event.preventDefault();
      return;
    }
    if (!slice)
      return;
    event.preventDefault();
    let insertPos = slice ? dropPoint(view.state.doc, $mouse.pos, slice) : $mouse.pos;
    if (insertPos == null)
      insertPos = $mouse.pos;
    let tr = view.state.tr;
    if (move) {
      let { node } = dragging;
      if (node)
        node.replace(tr);
      else
        tr.deleteSelection();
    }
    let pos = tr.mapping.map(insertPos);
    let isNode = slice.openStart == 0 && slice.openEnd == 0 && slice.content.childCount == 1;
    let beforeInsert = tr.doc;
    if (isNode)
      tr.replaceRangeWith(pos, pos, slice.content.firstChild);
    else
      tr.replaceRange(pos, pos, slice);
    if (tr.doc.eq(beforeInsert))
      return;
    let $pos = tr.doc.resolve(pos);
    if (isNode && NodeSelection.isSelectable(slice.content.firstChild) && $pos.nodeAfter && $pos.nodeAfter.sameMarkup(slice.content.firstChild)) {
      tr.setSelection(new NodeSelection($pos));
    } else {
      let end = tr.mapping.map(insertPos);
      tr.mapping.maps[tr.mapping.maps.length - 1].forEach((_from, _to, _newFrom, newTo) => end = newTo);
      tr.setSelection(selectionBetween(view, $pos, tr.doc.resolve(end)));
    }
    view.focus();
    view.dispatch(tr.setMeta("uiEvent", "drop"));
  }
  handlers.focus = (view) => {
    view.input.lastFocus = Date.now();
    if (!view.focused) {
      view.domObserver.stop();
      view.dom.classList.add("ProseMirror-focused");
      view.domObserver.start();
      view.focused = true;
      setTimeout(() => {
        if (view.docView && view.hasFocus() && !view.domObserver.currentSelection.eq(view.domSelectionRange()))
          selectionToDOM(view);
      }, 20);
    }
  };
  handlers.blur = (view, _event) => {
    let event = _event;
    if (view.focused) {
      view.domObserver.stop();
      view.dom.classList.remove("ProseMirror-focused");
      view.domObserver.start();
      if (event.relatedTarget && view.dom.contains(event.relatedTarget))
        view.domObserver.currentSelection.clear();
      view.focused = false;
    }
  };
  handlers.beforeinput = (view, _event) => {
    let event = _event;
    if (chrome && android && event.inputType == "deleteContentBackward") {
      view.domObserver.flushSoon();
      let { domChangeCount } = view.input;
      setTimeout(() => {
        if (view.input.domChangeCount != domChangeCount)
          return;
        view.dom.blur();
        view.focus();
        if (view.someProp("handleKeyDown", (f) => f(view, keyEvent(8, "Backspace"))))
          return;
        let { $cursor } = view.state.selection;
        if ($cursor && $cursor.pos > 0)
          view.dispatch(view.state.tr.delete($cursor.pos - 1, $cursor.pos).scrollIntoView());
      }, 50);
    }
  };
  for (let prop in editHandlers)
    handlers[prop] = editHandlers[prop];
  function compareObjs(a, b) {
    if (a == b)
      return true;
    for (let p in a)
      if (a[p] !== b[p])
        return false;
    for (let p in b)
      if (!(p in a))
        return false;
    return true;
  }
  var WidgetType = class _WidgetType {
    constructor(toDOM, spec) {
      this.toDOM = toDOM;
      this.spec = spec || noSpec;
      this.side = this.spec.side || 0;
    }
    map(mapping, span, offset, oldOffset) {
      let { pos, deleted } = mapping.mapResult(span.from + oldOffset, this.side < 0 ? -1 : 1);
      return deleted ? null : new Decoration(pos - offset, pos - offset, this);
    }
    valid() {
      return true;
    }
    eq(other) {
      return this == other || other instanceof _WidgetType && (this.spec.key && this.spec.key == other.spec.key || this.toDOM == other.toDOM && compareObjs(this.spec, other.spec));
    }
    destroy(node) {
      if (this.spec.destroy)
        this.spec.destroy(node);
    }
  };
  var InlineType = class _InlineType {
    constructor(attrs, spec) {
      this.attrs = attrs;
      this.spec = spec || noSpec;
    }
    map(mapping, span, offset, oldOffset) {
      let from = mapping.map(span.from + oldOffset, this.spec.inclusiveStart ? -1 : 1) - offset;
      let to = mapping.map(span.to + oldOffset, this.spec.inclusiveEnd ? 1 : -1) - offset;
      return from >= to ? null : new Decoration(from, to, this);
    }
    valid(_, span) {
      return span.from < span.to;
    }
    eq(other) {
      return this == other || other instanceof _InlineType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
    static is(span) {
      return span.type instanceof _InlineType;
    }
    destroy() {
    }
  };
  var NodeType2 = class _NodeType {
    constructor(attrs, spec) {
      this.attrs = attrs;
      this.spec = spec || noSpec;
    }
    map(mapping, span, offset, oldOffset) {
      let from = mapping.mapResult(span.from + oldOffset, 1);
      if (from.deleted)
        return null;
      let to = mapping.mapResult(span.to + oldOffset, -1);
      if (to.deleted || to.pos <= from.pos)
        return null;
      return new Decoration(from.pos - offset, to.pos - offset, this);
    }
    valid(node, span) {
      let { index, offset } = node.content.findIndex(span.from), child;
      return offset == span.from && !(child = node.child(index)).isText && offset + child.nodeSize == span.to;
    }
    eq(other) {
      return this == other || other instanceof _NodeType && compareObjs(this.attrs, other.attrs) && compareObjs(this.spec, other.spec);
    }
    destroy() {
    }
  };
  var Decoration = class _Decoration {
    /**
    @internal
    */
    constructor(from, to, type3) {
      this.from = from;
      this.to = to;
      this.type = type3;
    }
    /**
    @internal
    */
    copy(from, to) {
      return new _Decoration(from, to, this.type);
    }
    /**
    @internal
    */
    eq(other, offset = 0) {
      return this.type.eq(other.type) && this.from + offset == other.from && this.to + offset == other.to;
    }
    /**
    @internal
    */
    map(mapping, offset, oldOffset) {
      return this.type.map(mapping, this, offset, oldOffset);
    }
    /**
    Creates a widget decoration, which is a DOM node that's shown in
    the document at the given position. It is recommended that you
    delay rendering the widget by passing a function that will be
    called when the widget is actually drawn in a view, but you can
    also directly pass a DOM node. `getPos` can be used to find the
    widget's current document position.
    */
    static widget(pos, toDOM, spec) {
      return new _Decoration(pos, pos, new WidgetType(toDOM, spec));
    }
    /**
    Creates an inline decoration, which adds the given attributes to
    each inline node between `from` and `to`.
    */
    static inline(from, to, attrs, spec) {
      return new _Decoration(from, to, new InlineType(attrs, spec));
    }
    /**
    Creates a node decoration. `from` and `to` should point precisely
    before and after a node in the document. That node, and only that
    node, will receive the given attributes.
    */
    static node(from, to, attrs, spec) {
      return new _Decoration(from, to, new NodeType2(attrs, spec));
    }
    /**
    The spec provided when creating this decoration. Can be useful
    if you've stored extra information in that object.
    */
    get spec() {
      return this.type.spec;
    }
    /**
    @internal
    */
    get inline() {
      return this.type instanceof InlineType;
    }
    /**
    @internal
    */
    get widget() {
      return this.type instanceof WidgetType;
    }
  };
  var none = [];
  var noSpec = {};
  var DecorationSet = class _DecorationSet {
    /**
    @internal
    */
    constructor(local, children) {
      this.local = local.length ? local : none;
      this.children = children.length ? children : none;
    }
    /**
    Create a set of decorations, using the structure of the given
    document. This will consume (modify) the `decorations` array, so
    you must make a copy if you want need to preserve that.
    */
    static create(doc3, decorations) {
      return decorations.length ? buildTree2(decorations, doc3, 0, noSpec) : empty;
    }
    /**
    Find all decorations in this set which touch the given range
    (including decorations that start or end directly at the
    boundaries) and match the given predicate on their spec. When
    `start` and `end` are omitted, all decorations in the set are
    considered. When `predicate` isn't given, all decorations are
    assumed to match.
    */
    find(start, end, predicate) {
      let result = [];
      this.findInner(start == null ? 0 : start, end == null ? 1e9 : end, result, 0, predicate);
      return result;
    }
    findInner(start, end, result, offset, predicate) {
      for (let i = 0; i < this.local.length; i++) {
        let span = this.local[i];
        if (span.from <= end && span.to >= start && (!predicate || predicate(span.spec)))
          result.push(span.copy(span.from + offset, span.to + offset));
      }
      for (let i = 0; i < this.children.length; i += 3) {
        if (this.children[i] < end && this.children[i + 1] > start) {
          let childOff = this.children[i] + 1;
          this.children[i + 2].findInner(start - childOff, end - childOff, result, offset + childOff, predicate);
        }
      }
    }
    /**
    Map the set of decorations in response to a change in the
    document.
    */
    map(mapping, doc3, options) {
      if (this == empty || mapping.maps.length == 0)
        return this;
      return this.mapInner(mapping, doc3, 0, 0, options || noSpec);
    }
    /**
    @internal
    */
    mapInner(mapping, node, offset, oldOffset, options) {
      let newLocal;
      for (let i = 0; i < this.local.length; i++) {
        let mapped = this.local[i].map(mapping, offset, oldOffset);
        if (mapped && mapped.type.valid(node, mapped))
          (newLocal || (newLocal = [])).push(mapped);
        else if (options.onRemove)
          options.onRemove(this.local[i].spec);
      }
      if (this.children.length)
        return mapChildren(this.children, newLocal || [], mapping, node, offset, oldOffset, options);
      else
        return newLocal ? new _DecorationSet(newLocal.sort(byPos), none) : empty;
    }
    /**
    Add the given array of decorations to the ones in the set,
    producing a new set. Consumes the `decorations` array. Needs
    access to the current document to create the appropriate tree
    structure.
    */
    add(doc3, decorations) {
      if (!decorations.length)
        return this;
      if (this == empty)
        return _DecorationSet.create(doc3, decorations);
      return this.addInner(doc3, decorations, 0);
    }
    addInner(doc3, decorations, offset) {
      let children, childIndex = 0;
      doc3.forEach((childNode, childOffset) => {
        let baseOffset = childOffset + offset, found2;
        if (!(found2 = takeSpansForNode(decorations, childNode, baseOffset)))
          return;
        if (!children)
          children = this.children.slice();
        while (childIndex < children.length && children[childIndex] < childOffset)
          childIndex += 3;
        if (children[childIndex] == childOffset)
          children[childIndex + 2] = children[childIndex + 2].addInner(childNode, found2, baseOffset + 1);
        else
          children.splice(childIndex, 0, childOffset, childOffset + childNode.nodeSize, buildTree2(found2, childNode, baseOffset + 1, noSpec));
        childIndex += 3;
      });
      let local = moveSpans(childIndex ? withoutNulls(decorations) : decorations, -offset);
      for (let i = 0; i < local.length; i++)
        if (!local[i].type.valid(doc3, local[i]))
          local.splice(i--, 1);
      return new _DecorationSet(local.length ? this.local.concat(local).sort(byPos) : this.local, children || this.children);
    }
    /**
    Create a new set that contains the decorations in this set, minus
    the ones in the given array.
    */
    remove(decorations) {
      if (decorations.length == 0 || this == empty)
        return this;
      return this.removeInner(decorations, 0);
    }
    removeInner(decorations, offset) {
      let children = this.children, local = this.local;
      for (let i = 0; i < children.length; i += 3) {
        let found2;
        let from = children[i] + offset, to = children[i + 1] + offset;
        for (let j = 0, span; j < decorations.length; j++)
          if (span = decorations[j]) {
            if (span.from > from && span.to < to) {
              decorations[j] = null;
              (found2 || (found2 = [])).push(span);
            }
          }
        if (!found2)
          continue;
        if (children == this.children)
          children = this.children.slice();
        let removed = children[i + 2].removeInner(found2, from + 1);
        if (removed != empty) {
          children[i + 2] = removed;
        } else {
          children.splice(i, 3);
          i -= 3;
        }
      }
      if (local.length) {
        for (let i = 0, span; i < decorations.length; i++)
          if (span = decorations[i]) {
            for (let j = 0; j < local.length; j++)
              if (local[j].eq(span, offset)) {
                if (local == this.local)
                  local = this.local.slice();
                local.splice(j--, 1);
              }
          }
      }
      if (children == this.children && local == this.local)
        return this;
      return local.length || children.length ? new _DecorationSet(local, children) : empty;
    }
    forChild(offset, node) {
      if (this == empty)
        return this;
      if (node.isLeaf)
        return _DecorationSet.empty;
      let child, local;
      for (let i = 0; i < this.children.length; i += 3)
        if (this.children[i] >= offset) {
          if (this.children[i] == offset)
            child = this.children[i + 2];
          break;
        }
      let start = offset + 1, end = start + node.content.size;
      for (let i = 0; i < this.local.length; i++) {
        let dec = this.local[i];
        if (dec.from < end && dec.to > start && dec.type instanceof InlineType) {
          let from = Math.max(start, dec.from) - start, to = Math.min(end, dec.to) - start;
          if (from < to)
            (local || (local = [])).push(dec.copy(from, to));
        }
      }
      if (local) {
        let localSet = new _DecorationSet(local.sort(byPos), none);
        return child ? new DecorationGroup([localSet, child]) : localSet;
      }
      return child || empty;
    }
    /**
    @internal
    */
    eq(other) {
      if (this == other)
        return true;
      if (!(other instanceof _DecorationSet) || this.local.length != other.local.length || this.children.length != other.children.length)
        return false;
      for (let i = 0; i < this.local.length; i++)
        if (!this.local[i].eq(other.local[i]))
          return false;
      for (let i = 0; i < this.children.length; i += 3)
        if (this.children[i] != other.children[i] || this.children[i + 1] != other.children[i + 1] || !this.children[i + 2].eq(other.children[i + 2]))
          return false;
      return true;
    }
    /**
    @internal
    */
    locals(node) {
      return removeOverlap(this.localsInner(node));
    }
    /**
    @internal
    */
    localsInner(node) {
      if (this == empty)
        return none;
      if (node.inlineContent || !this.local.some(InlineType.is))
        return this.local;
      let result = [];
      for (let i = 0; i < this.local.length; i++) {
        if (!(this.local[i].type instanceof InlineType))
          result.push(this.local[i]);
      }
      return result;
    }
    forEachSet(f) {
      f(this);
    }
  };
  DecorationSet.empty = new DecorationSet([], []);
  DecorationSet.removeOverlap = removeOverlap;
  var empty = DecorationSet.empty;
  var DecorationGroup = class _DecorationGroup {
    constructor(members) {
      this.members = members;
    }
    map(mapping, doc3) {
      const mappedDecos = this.members.map((member) => member.map(mapping, doc3, noSpec));
      return _DecorationGroup.from(mappedDecos);
    }
    forChild(offset, child) {
      if (child.isLeaf)
        return DecorationSet.empty;
      let found2 = [];
      for (let i = 0; i < this.members.length; i++) {
        let result = this.members[i].forChild(offset, child);
        if (result == empty)
          continue;
        if (result instanceof _DecorationGroup)
          found2 = found2.concat(result.members);
        else
          found2.push(result);
      }
      return _DecorationGroup.from(found2);
    }
    eq(other) {
      if (!(other instanceof _DecorationGroup) || other.members.length != this.members.length)
        return false;
      for (let i = 0; i < this.members.length; i++)
        if (!this.members[i].eq(other.members[i]))
          return false;
      return true;
    }
    locals(node) {
      let result, sorted = true;
      for (let i = 0; i < this.members.length; i++) {
        let locals = this.members[i].localsInner(node);
        if (!locals.length)
          continue;
        if (!result) {
          result = locals;
        } else {
          if (sorted) {
            result = result.slice();
            sorted = false;
          }
          for (let j = 0; j < locals.length; j++)
            result.push(locals[j]);
        }
      }
      return result ? removeOverlap(sorted ? result : result.sort(byPos)) : none;
    }
    // Create a group for the given array of decoration sets, or return
    // a single set when possible.
    static from(members) {
      switch (members.length) {
        case 0:
          return empty;
        case 1:
          return members[0];
        default:
          return new _DecorationGroup(members.every((m) => m instanceof DecorationSet) ? members : members.reduce((r, m) => r.concat(m instanceof DecorationSet ? m : m.members), []));
      }
    }
    forEachSet(f) {
      for (let i = 0; i < this.members.length; i++)
        this.members[i].forEachSet(f);
    }
  };
  function mapChildren(oldChildren, newLocal, mapping, node, offset, oldOffset, options) {
    let children = oldChildren.slice();
    for (let i = 0, baseOffset = oldOffset; i < mapping.maps.length; i++) {
      let moved = 0;
      mapping.maps[i].forEach((oldStart, oldEnd, newStart, newEnd) => {
        let dSize = newEnd - newStart - (oldEnd - oldStart);
        for (let i2 = 0; i2 < children.length; i2 += 3) {
          let end = children[i2 + 1];
          if (end < 0 || oldStart > end + baseOffset - moved)
            continue;
          let start = children[i2] + baseOffset - moved;
          if (oldEnd >= start) {
            children[i2 + 1] = oldStart <= start ? -2 : -1;
          } else if (oldStart >= baseOffset && dSize) {
            children[i2] += dSize;
            children[i2 + 1] += dSize;
          }
        }
        moved += dSize;
      });
      baseOffset = mapping.maps[i].map(baseOffset, -1);
    }
    let mustRebuild = false;
    for (let i = 0; i < children.length; i += 3)
      if (children[i + 1] < 0) {
        if (children[i + 1] == -2) {
          mustRebuild = true;
          children[i + 1] = -1;
          continue;
        }
        let from = mapping.map(oldChildren[i] + oldOffset), fromLocal = from - offset;
        if (fromLocal < 0 || fromLocal >= node.content.size) {
          mustRebuild = true;
          continue;
        }
        let to = mapping.map(oldChildren[i + 1] + oldOffset, -1), toLocal = to - offset;
        let { index, offset: childOffset } = node.content.findIndex(fromLocal);
        let childNode = node.maybeChild(index);
        if (childNode && childOffset == fromLocal && childOffset + childNode.nodeSize == toLocal) {
          let mapped = children[i + 2].mapInner(mapping, childNode, from + 1, oldChildren[i] + oldOffset + 1, options);
          if (mapped != empty) {
            children[i] = fromLocal;
            children[i + 1] = toLocal;
            children[i + 2] = mapped;
          } else {
            children[i + 1] = -2;
            mustRebuild = true;
          }
        } else {
          mustRebuild = true;
        }
      }
    if (mustRebuild) {
      let decorations = mapAndGatherRemainingDecorations(children, oldChildren, newLocal, mapping, offset, oldOffset, options);
      let built = buildTree2(decorations, node, 0, options);
      newLocal = built.local;
      for (let i = 0; i < children.length; i += 3)
        if (children[i + 1] < 0) {
          children.splice(i, 3);
          i -= 3;
        }
      for (let i = 0, j = 0; i < built.children.length; i += 3) {
        let from = built.children[i];
        while (j < children.length && children[j] < from)
          j += 3;
        children.splice(j, 0, built.children[i], built.children[i + 1], built.children[i + 2]);
      }
    }
    return new DecorationSet(newLocal.sort(byPos), children);
  }
  function moveSpans(spans, offset) {
    if (!offset || !spans.length)
      return spans;
    let result = [];
    for (let i = 0; i < spans.length; i++) {
      let span = spans[i];
      result.push(new Decoration(span.from + offset, span.to + offset, span.type));
    }
    return result;
  }
  function mapAndGatherRemainingDecorations(children, oldChildren, decorations, mapping, offset, oldOffset, options) {
    function gather(set2, oldOffset2) {
      for (let i = 0; i < set2.local.length; i++) {
        let mapped = set2.local[i].map(mapping, offset, oldOffset2);
        if (mapped)
          decorations.push(mapped);
        else if (options.onRemove)
          options.onRemove(set2.local[i].spec);
      }
      for (let i = 0; i < set2.children.length; i += 3)
        gather(set2.children[i + 2], set2.children[i] + oldOffset2 + 1);
    }
    for (let i = 0; i < children.length; i += 3)
      if (children[i + 1] == -1)
        gather(children[i + 2], oldChildren[i] + oldOffset + 1);
    return decorations;
  }
  function takeSpansForNode(spans, node, offset) {
    if (node.isLeaf)
      return null;
    let end = offset + node.nodeSize, found2 = null;
    for (let i = 0, span; i < spans.length; i++) {
      if ((span = spans[i]) && span.from > offset && span.to < end) {
        (found2 || (found2 = [])).push(span);
        spans[i] = null;
      }
    }
    return found2;
  }
  function withoutNulls(array) {
    let result = [];
    for (let i = 0; i < array.length; i++)
      if (array[i] != null)
        result.push(array[i]);
    return result;
  }
  function buildTree2(spans, node, offset, options) {
    let children = [], hasNulls = false;
    node.forEach((childNode, localStart) => {
      let found2 = takeSpansForNode(spans, childNode, localStart + offset);
      if (found2) {
        hasNulls = true;
        let subtree = buildTree2(found2, childNode, offset + localStart + 1, options);
        if (subtree != empty)
          children.push(localStart, localStart + childNode.nodeSize, subtree);
      }
    });
    let locals = moveSpans(hasNulls ? withoutNulls(spans) : spans, -offset).sort(byPos);
    for (let i = 0; i < locals.length; i++)
      if (!locals[i].type.valid(node, locals[i])) {
        if (options.onRemove)
          options.onRemove(locals[i].spec);
        locals.splice(i--, 1);
      }
    return locals.length || children.length ? new DecorationSet(locals, children) : empty;
  }
  function byPos(a, b) {
    return a.from - b.from || a.to - b.to;
  }
  function removeOverlap(spans) {
    let working = spans;
    for (let i = 0; i < working.length - 1; i++) {
      let span = working[i];
      if (span.from != span.to)
        for (let j = i + 1; j < working.length; j++) {
          let next = working[j];
          if (next.from == span.from) {
            if (next.to != span.to) {
              if (working == spans)
                working = spans.slice();
              working[j] = next.copy(next.from, span.to);
              insertAhead(working, j + 1, next.copy(span.to, next.to));
            }
            continue;
          } else {
            if (next.from < span.to) {
              if (working == spans)
                working = spans.slice();
              working[i] = span.copy(span.from, next.from);
              insertAhead(working, j, span.copy(next.from, span.to));
            }
            break;
          }
        }
    }
    return working;
  }
  function insertAhead(array, i, deco) {
    while (i < array.length && byPos(deco, array[i]) > 0)
      i++;
    array.splice(i, 0, deco);
  }
  function viewDecorations(view) {
    let found2 = [];
    view.someProp("decorations", (f) => {
      let result = f(view.state);
      if (result && result != empty)
        found2.push(result);
    });
    if (view.cursorWrapper)
      found2.push(DecorationSet.create(view.state.doc, [view.cursorWrapper.deco]));
    return DecorationGroup.from(found2);
  }
  var observeOptions = {
    childList: true,
    characterData: true,
    characterDataOldValue: true,
    attributes: true,
    attributeOldValue: true,
    subtree: true
  };
  var useCharData = ie && ie_version <= 11;
  var SelectionState = class {
    constructor() {
      this.anchorNode = null;
      this.anchorOffset = 0;
      this.focusNode = null;
      this.focusOffset = 0;
    }
    set(sel) {
      this.anchorNode = sel.anchorNode;
      this.anchorOffset = sel.anchorOffset;
      this.focusNode = sel.focusNode;
      this.focusOffset = sel.focusOffset;
    }
    clear() {
      this.anchorNode = this.focusNode = null;
    }
    eq(sel) {
      return sel.anchorNode == this.anchorNode && sel.anchorOffset == this.anchorOffset && sel.focusNode == this.focusNode && sel.focusOffset == this.focusOffset;
    }
  };
  var DOMObserver = class {
    constructor(view, handleDOMChange) {
      this.view = view;
      this.handleDOMChange = handleDOMChange;
      this.queue = [];
      this.flushingSoon = -1;
      this.observer = null;
      this.currentSelection = new SelectionState();
      this.onCharData = null;
      this.suppressingSelectionUpdates = false;
      this.lastChangedTextNode = null;
      this.observer = window.MutationObserver && new window.MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++)
          this.queue.push(mutations[i]);
        if (ie && ie_version <= 11 && mutations.some((m) => m.type == "childList" && m.removedNodes.length || m.type == "characterData" && m.oldValue.length > m.target.nodeValue.length)) {
          this.flushSoon();
        } else if (safari && view.composing && mutations.some((m) => m.type == "childList" && m.target.nodeName == "TR")) {
          view.input.badSafariComposition = true;
          this.flushSoon();
        } else {
          this.flush();
        }
      });
      if (useCharData) {
        this.onCharData = (e) => {
          this.queue.push({ target: e.target, type: "characterData", oldValue: e.prevValue });
          this.flushSoon();
        };
      }
      this.onSelectionChange = this.onSelectionChange.bind(this);
    }
    flushSoon() {
      if (this.flushingSoon < 0)
        this.flushingSoon = window.setTimeout(() => {
          this.flushingSoon = -1;
          this.flush();
        }, 20);
    }
    forceFlush() {
      if (this.flushingSoon > -1) {
        window.clearTimeout(this.flushingSoon);
        this.flushingSoon = -1;
        this.flush();
      }
    }
    start() {
      if (this.observer) {
        this.observer.takeRecords();
        this.observer.observe(this.view.dom, observeOptions);
      }
      if (this.onCharData)
        this.view.dom.addEventListener("DOMCharacterDataModified", this.onCharData);
      this.connectSelection();
    }
    stop() {
      if (this.observer) {
        let take = this.observer.takeRecords();
        if (take.length) {
          for (let i = 0; i < take.length; i++)
            this.queue.push(take[i]);
          window.setTimeout(() => this.flush(), 20);
        }
        this.observer.disconnect();
      }
      if (this.onCharData)
        this.view.dom.removeEventListener("DOMCharacterDataModified", this.onCharData);
      this.disconnectSelection();
    }
    connectSelection() {
      this.view.dom.ownerDocument.addEventListener("selectionchange", this.onSelectionChange);
    }
    disconnectSelection() {
      this.view.dom.ownerDocument.removeEventListener("selectionchange", this.onSelectionChange);
    }
    suppressSelectionUpdates() {
      this.suppressingSelectionUpdates = true;
      setTimeout(() => this.suppressingSelectionUpdates = false, 50);
    }
    onSelectionChange() {
      if (!hasFocusAndSelection(this.view))
        return;
      if (this.suppressingSelectionUpdates)
        return selectionToDOM(this.view);
      if (ie && ie_version <= 11 && !this.view.state.selection.empty) {
        let sel = this.view.domSelectionRange();
        if (sel.focusNode && isEquivalentPosition(sel.focusNode, sel.focusOffset, sel.anchorNode, sel.anchorOffset))
          return this.flushSoon();
      }
      this.flush();
    }
    setCurSelection() {
      this.currentSelection.set(this.view.domSelectionRange());
    }
    ignoreSelectionChange(sel) {
      if (!sel.focusNode)
        return true;
      let ancestors = /* @__PURE__ */ new Set(), container;
      for (let scan = sel.focusNode; scan; scan = parentNode(scan))
        ancestors.add(scan);
      for (let scan = sel.anchorNode; scan; scan = parentNode(scan))
        if (ancestors.has(scan)) {
          container = scan;
          break;
        }
      let desc = container && this.view.docView.nearestDesc(container);
      if (desc && desc.ignoreMutation({
        type: "selection",
        target: container.nodeType == 3 ? container.parentNode : container
      })) {
        this.setCurSelection();
        return true;
      }
    }
    pendingRecords() {
      if (this.observer)
        for (let mut of this.observer.takeRecords())
          this.queue.push(mut);
      return this.queue;
    }
    flush() {
      let { view } = this;
      if (!view.docView || this.flushingSoon > -1)
        return;
      let mutations = this.pendingRecords();
      if (mutations.length)
        this.queue = [];
      let sel = view.domSelectionRange();
      let newSel = !this.suppressingSelectionUpdates && !this.currentSelection.eq(sel) && hasFocusAndSelection(view) && !this.ignoreSelectionChange(sel);
      let from = -1, to = -1, typeOver = false, added = [];
      if (view.editable) {
        for (let i = 0; i < mutations.length; i++) {
          let result = this.registerMutation(mutations[i], added);
          if (result) {
            from = from < 0 ? result.from : Math.min(result.from, from);
            to = to < 0 ? result.to : Math.max(result.to, to);
            if (result.typeOver)
              typeOver = true;
          }
        }
      }
      if (added.some((n) => n.nodeName == "BR") && (view.input.lastKeyCode == 8 || view.input.lastKeyCode == 46)) {
        for (let node of added)
          if (node.nodeName == "BR" && node.parentNode) {
            let after = node.nextSibling;
            if (after && after.nodeType == 1 && after.contentEditable == "false")
              node.parentNode.removeChild(node);
          }
      } else if (gecko && added.length) {
        let brs = added.filter((n) => n.nodeName == "BR");
        if (brs.length == 2) {
          let [a, b] = brs;
          if (a.parentNode && a.parentNode.parentNode == b.parentNode)
            b.remove();
          else
            a.remove();
        } else {
          let { focusNode } = this.currentSelection;
          for (let br of brs) {
            let parent = br.parentNode;
            if (parent && parent.nodeName == "LI" && (!focusNode || blockParent(view, focusNode) != parent))
              br.remove();
          }
        }
      }
      let readSel = null;
      if (from < 0 && newSel && view.input.lastFocus > Date.now() - 200 && Math.max(view.input.lastTouch, view.input.lastClick.time) < Date.now() - 300 && selectionCollapsed(sel) && (readSel = selectionFromDOM(view)) && readSel.eq(Selection.near(view.state.doc.resolve(0), 1))) {
        view.input.lastFocus = 0;
        selectionToDOM(view);
        this.currentSelection.set(sel);
        view.scrollToSelection();
      } else if (from > -1 || newSel) {
        if (from > -1) {
          view.docView.markDirty(from, to);
          checkCSS(view);
        }
        if (view.input.badSafariComposition) {
          view.input.badSafariComposition = false;
          fixUpBadSafariComposition(view, added);
        }
        this.handleDOMChange(from, to, typeOver, added);
        if (view.docView && view.docView.dirty)
          view.updateState(view.state);
        else if (!this.currentSelection.eq(sel))
          selectionToDOM(view);
        this.currentSelection.set(sel);
      }
    }
    registerMutation(mut, added) {
      if (added.indexOf(mut.target) > -1)
        return null;
      let desc = this.view.docView.nearestDesc(mut.target);
      if (mut.type == "attributes" && (desc == this.view.docView || mut.attributeName == "contenteditable" || // Firefox sometimes fires spurious events for null/empty styles
      mut.attributeName == "style" && !mut.oldValue && !mut.target.getAttribute("style")))
        return null;
      if (!desc || desc.ignoreMutation(mut))
        return null;
      if (mut.type == "childList") {
        for (let i = 0; i < mut.addedNodes.length; i++) {
          let node = mut.addedNodes[i];
          added.push(node);
          if (node.nodeType == 3)
            this.lastChangedTextNode = node;
        }
        if (desc.contentDOM && desc.contentDOM != desc.dom && !desc.contentDOM.contains(mut.target))
          return { from: desc.posBefore, to: desc.posAfter };
        let prev = mut.previousSibling, next = mut.nextSibling;
        if (ie && ie_version <= 11 && mut.addedNodes.length) {
          for (let i = 0; i < mut.addedNodes.length; i++) {
            let { previousSibling, nextSibling } = mut.addedNodes[i];
            if (!previousSibling || Array.prototype.indexOf.call(mut.addedNodes, previousSibling) < 0)
              prev = previousSibling;
            if (!nextSibling || Array.prototype.indexOf.call(mut.addedNodes, nextSibling) < 0)
              next = nextSibling;
          }
        }
        let fromOffset = prev && prev.parentNode == mut.target ? domIndex(prev) + 1 : 0;
        let from = desc.localPosFromDOM(mut.target, fromOffset, -1);
        let toOffset = next && next.parentNode == mut.target ? domIndex(next) : mut.target.childNodes.length;
        let to = desc.localPosFromDOM(mut.target, toOffset, 1);
        return { from, to };
      } else if (mut.type == "attributes") {
        return { from: desc.posAtStart - desc.border, to: desc.posAtEnd + desc.border };
      } else {
        this.lastChangedTextNode = mut.target;
        return {
          from: desc.posAtStart,
          to: desc.posAtEnd,
          // An event was generated for a text change that didn't change
          // any text. Mark the dom change to fall back to assuming the
          // selection was typed over with an identical value if it can't
          // find another change.
          typeOver: mut.target.nodeValue == mut.oldValue
        };
      }
    }
  };
  var cssChecked = /* @__PURE__ */ new WeakMap();
  var cssCheckWarned = false;
  function checkCSS(view) {
    if (cssChecked.has(view))
      return;
    cssChecked.set(view, null);
    if (["normal", "nowrap", "pre-line"].indexOf(getComputedStyle(view.dom).whiteSpace) !== -1) {
      view.requiresGeckoHackNode = gecko;
      if (cssCheckWarned)
        return;
      console["warn"]("ProseMirror expects the CSS white-space property to be set, preferably to 'pre-wrap'. It is recommended to load style/prosemirror.css from the prosemirror-view package.");
      cssCheckWarned = true;
    }
  }
  function rangeToSelectionRange(view, range) {
    let anchorNode = range.startContainer, anchorOffset = range.startOffset;
    let focusNode = range.endContainer, focusOffset = range.endOffset;
    let currentAnchor = view.domAtPos(view.state.selection.anchor);
    if (isEquivalentPosition(currentAnchor.node, currentAnchor.offset, focusNode, focusOffset))
      [anchorNode, anchorOffset, focusNode, focusOffset] = [focusNode, focusOffset, anchorNode, anchorOffset];
    return { anchorNode, anchorOffset, focusNode, focusOffset };
  }
  function safariShadowSelectionRange(view, selection) {
    if (selection.getComposedRanges) {
      let range = selection.getComposedRanges(view.root)[0];
      if (range)
        return rangeToSelectionRange(view, range);
    }
    let found2;
    function read(event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      found2 = event.getTargetRanges()[0];
    }
    view.dom.addEventListener("beforeinput", read, true);
    document.execCommand("indent");
    view.dom.removeEventListener("beforeinput", read, true);
    return found2 ? rangeToSelectionRange(view, found2) : null;
  }
  function blockParent(view, node) {
    for (let p = node.parentNode; p && p != view.dom; p = p.parentNode) {
      let desc = view.docView.nearestDesc(p, true);
      if (desc && desc.node.isBlock)
        return p;
    }
    return null;
  }
  function fixUpBadSafariComposition(view, addedNodes) {
    var _a;
    let { focusNode, focusOffset } = view.domSelectionRange();
    for (let node of addedNodes) {
      if (((_a = node.parentNode) === null || _a === void 0 ? void 0 : _a.nodeName) == "TR") {
        let nextCell = node.nextSibling;
        while (nextCell && (nextCell.nodeName != "TD" && nextCell.nodeName != "TH"))
          nextCell = nextCell.nextSibling;
        if (nextCell) {
          let parent = nextCell;
          for (; ; ) {
            let first = parent.firstChild;
            if (!first || first.nodeType != 1 || first.contentEditable == "false" || /^(BR|IMG)$/.test(first.nodeName))
              break;
            parent = first;
          }
          parent.insertBefore(node, parent.firstChild);
          if (focusNode == node)
            view.domSelection().collapse(node, focusOffset);
        } else {
          node.parentNode.removeChild(node);
        }
      }
    }
  }
  function parseBetween(view, from_, to_) {
    let { node: parent, fromOffset, toOffset, from, to } = view.docView.parseRange(from_, to_);
    let domSel = view.domSelectionRange();
    let find;
    let anchor = domSel.anchorNode;
    if (anchor && view.dom.contains(anchor.nodeType == 1 ? anchor : anchor.parentNode)) {
      find = [{ node: anchor, offset: domSel.anchorOffset }];
      if (!selectionCollapsed(domSel))
        find.push({ node: domSel.focusNode, offset: domSel.focusOffset });
    }
    if (chrome && view.input.lastKeyCode === 8) {
      for (let off = toOffset; off > fromOffset; off--) {
        let node = parent.childNodes[off - 1], desc = node.pmViewDesc;
        if (node.nodeName == "BR" && !desc) {
          toOffset = off;
          break;
        }
        if (!desc || desc.size)
          break;
      }
    }
    let startDoc = view.state.doc;
    let parser = view.someProp("domParser") || DOMParser.fromSchema(view.state.schema);
    let $from = startDoc.resolve(from);
    let sel = null, doc3 = parser.parse(parent, {
      topNode: $from.parent,
      topMatch: $from.parent.contentMatchAt($from.index()),
      topOpen: true,
      from: fromOffset,
      to: toOffset,
      preserveWhitespace: $from.parent.type.whitespace == "pre" ? "full" : true,
      findPositions: find,
      ruleFromNode,
      context: $from
    });
    if (find && find[0].pos != null) {
      let anchor2 = find[0].pos, head = find[1] && find[1].pos;
      if (head == null)
        head = anchor2;
      sel = { anchor: anchor2 + from, head: head + from };
    }
    return { doc: doc3, sel, from, to };
  }
  function ruleFromNode(dom) {
    let desc = dom.pmViewDesc;
    if (desc) {
      return desc.parseRule();
    } else if (dom.nodeName == "BR" && dom.parentNode) {
      if (safari && /^(ul|ol)$/i.test(dom.parentNode.nodeName)) {
        let skip = document.createElement("div");
        skip.appendChild(document.createElement("li"));
        return { skip };
      } else if (dom.parentNode.lastChild == dom || safari && /^(tr|table)$/i.test(dom.parentNode.nodeName)) {
        return { ignore: true };
      }
    } else if (dom.nodeName == "IMG" && dom.getAttribute("mark-placeholder")) {
      return { ignore: true };
    }
    return null;
  }
  var isInline = /^(a|abbr|acronym|b|bd[io]|big|br|button|cite|code|data(list)?|del|dfn|em|i|img|ins|kbd|label|map|mark|meter|output|q|ruby|s|samp|small|span|strong|su[bp]|time|u|tt|var)$/i;
  function readDOMChange(view, from, to, typeOver, addedNodes) {
    let compositionID = view.input.compositionPendingChanges || (view.composing ? view.input.compositionID : 0);
    view.input.compositionPendingChanges = 0;
    if (from < 0) {
      let origin = view.input.lastSelectionTime > Date.now() - 50 ? view.input.lastSelectionOrigin : null;
      let newSel = selectionFromDOM(view, origin);
      if (newSel && !view.state.selection.eq(newSel)) {
        if (chrome && android && view.input.lastKeyCode === 13 && Date.now() - 100 < view.input.lastKeyCodeTime && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter"))))
          return;
        let tr = view.state.tr.setSelection(newSel);
        if (origin == "pointer")
          tr.setMeta("pointer", true);
        else if (origin == "key")
          tr.scrollIntoView();
        if (compositionID)
          tr.setMeta("composition", compositionID);
        view.dispatch(tr);
      }
      return;
    }
    let $before = view.state.doc.resolve(from);
    let shared = $before.sharedDepth(to);
    from = $before.before(shared + 1);
    to = view.state.doc.resolve(to).after(shared + 1);
    let sel = view.state.selection;
    let parse2 = parseBetween(view, from, to);
    let doc3 = view.state.doc, compare = doc3.slice(parse2.from, parse2.to);
    let preferredPos, preferredSide;
    if (view.input.lastKeyCode === 8 && Date.now() - 100 < view.input.lastKeyCodeTime) {
      preferredPos = view.state.selection.to;
      preferredSide = "end";
    } else {
      preferredPos = view.state.selection.from;
      preferredSide = "start";
    }
    view.input.lastKeyCode = null;
    let change = findDiff(compare.content, parse2.doc.content, parse2.from, preferredPos, preferredSide);
    if (change)
      view.input.domChangeCount++;
    if ((ios && view.input.lastIOSEnter > Date.now() - 225 || android) && addedNodes.some((n) => n.nodeType == 1 && !isInline.test(n.nodeName)) && (!change || change.endA >= change.endB) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")))) {
      view.input.lastIOSEnter = 0;
      return;
    }
    if (!change) {
      if (typeOver && sel instanceof TextSelection && !sel.empty && sel.$head.sameParent(sel.$anchor) && !view.composing && !(parse2.sel && parse2.sel.anchor != parse2.sel.head)) {
        change = { start: sel.from, endA: sel.to, endB: sel.to };
      } else {
        if (parse2.sel) {
          let sel2 = resolveSelection(view, view.state.doc, parse2.sel);
          if (sel2 && !sel2.eq(view.state.selection)) {
            let tr = view.state.tr.setSelection(sel2);
            if (compositionID)
              tr.setMeta("composition", compositionID);
            view.dispatch(tr);
          }
        }
        return;
      }
    }
    if (view.state.selection.from < view.state.selection.to && change.start == change.endB && view.state.selection instanceof TextSelection) {
      if (change.start > view.state.selection.from && change.start <= view.state.selection.from + 2 && view.state.selection.from >= parse2.from) {
        change.start = view.state.selection.from;
      } else if (change.endA < view.state.selection.to && change.endA >= view.state.selection.to - 2 && view.state.selection.to <= parse2.to) {
        change.endB += view.state.selection.to - change.endA;
        change.endA = view.state.selection.to;
      }
    }
    if (ie && ie_version <= 11 && change.endB == change.start + 1 && change.endA == change.start && change.start > parse2.from && parse2.doc.textBetween(change.start - parse2.from - 1, change.start - parse2.from + 1) == " \xA0") {
      change.start--;
      change.endA--;
      change.endB--;
    }
    let $from = parse2.doc.resolveNoCache(change.start - parse2.from);
    let $to = parse2.doc.resolveNoCache(change.endB - parse2.from);
    let $fromA = doc3.resolve(change.start);
    let inlineChange = $from.sameParent($to) && $from.parent.inlineContent && $fromA.end() >= change.endA;
    if ((ios && view.input.lastIOSEnter > Date.now() - 225 && (!inlineChange || addedNodes.some((n) => n.nodeName == "DIV" || n.nodeName == "P")) || !inlineChange && $from.pos < parse2.doc.content.size && (!$from.sameParent($to) || !$from.parent.inlineContent) && $from.pos < $to.pos && !/\S/.test(parse2.doc.textBetween($from.pos, $to.pos, "", ""))) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(13, "Enter")))) {
      view.input.lastIOSEnter = 0;
      return;
    }
    if (view.state.selection.anchor > change.start && looksLikeBackspace(doc3, change.start, change.endA, $from, $to) && view.someProp("handleKeyDown", (f) => f(view, keyEvent(8, "Backspace")))) {
      if (android && chrome)
        view.domObserver.suppressSelectionUpdates();
      return;
    }
    if (chrome && change.endB == change.start)
      view.input.lastChromeDelete = Date.now();
    if (android && !inlineChange && $from.start() != $to.start() && $to.parentOffset == 0 && $from.depth == $to.depth && parse2.sel && parse2.sel.anchor == parse2.sel.head && parse2.sel.head == change.endA) {
      change.endB -= 2;
      $to = parse2.doc.resolveNoCache(change.endB - parse2.from);
      setTimeout(() => {
        view.someProp("handleKeyDown", function(f) {
          return f(view, keyEvent(13, "Enter"));
        });
      }, 20);
    }
    let chFrom = change.start, chTo = change.endA;
    let mkTr = (base) => {
      let tr = base || view.state.tr.replace(chFrom, chTo, parse2.doc.slice(change.start - parse2.from, change.endB - parse2.from));
      if (parse2.sel) {
        let sel2 = resolveSelection(view, tr.doc, parse2.sel);
        if (sel2 && !(chrome && view.composing && sel2.empty && (change.start != change.endB || view.input.lastChromeDelete < Date.now() - 100) && (sel2.head == chFrom || sel2.head == tr.mapping.map(chTo) - 1) || ie && sel2.empty && sel2.head == chFrom))
          tr.setSelection(sel2);
      }
      if (compositionID)
        tr.setMeta("composition", compositionID);
      return tr.scrollIntoView();
    };
    let markChange;
    if (inlineChange) {
      if ($from.pos == $to.pos) {
        if (ie && ie_version <= 11 && $from.parentOffset == 0) {
          view.domObserver.suppressSelectionUpdates();
          setTimeout(() => selectionToDOM(view), 20);
        }
        let tr = mkTr(view.state.tr.delete(chFrom, chTo));
        let marks = doc3.resolve(change.start).marksAcross(doc3.resolve(change.endA));
        if (marks)
          tr.ensureMarks(marks);
        view.dispatch(tr);
      } else if (
        // Adding or removing a mark
        change.endA == change.endB && (markChange = isMarkChange($from.parent.content.cut($from.parentOffset, $to.parentOffset), $fromA.parent.content.cut($fromA.parentOffset, change.endA - $fromA.start())))
      ) {
        let tr = mkTr(view.state.tr);
        if (markChange.type == "add")
          tr.addMark(chFrom, chTo, markChange.mark);
        else
          tr.removeMark(chFrom, chTo, markChange.mark);
        view.dispatch(tr);
      } else if ($from.parent.child($from.index()).isText && $from.index() == $to.index() - ($to.textOffset ? 0 : 1)) {
        let text = $from.parent.textBetween($from.parentOffset, $to.parentOffset);
        let deflt = () => mkTr(view.state.tr.insertText(text, chFrom, chTo));
        if (!view.someProp("handleTextInput", (f) => f(view, chFrom, chTo, text, deflt)))
          view.dispatch(deflt());
      } else {
        view.dispatch(mkTr());
      }
    } else {
      view.dispatch(mkTr());
    }
  }
  function resolveSelection(view, doc3, parsedSel) {
    if (Math.max(parsedSel.anchor, parsedSel.head) > doc3.content.size)
      return null;
    return selectionBetween(view, doc3.resolve(parsedSel.anchor), doc3.resolve(parsedSel.head));
  }
  function isMarkChange(cur, prev) {
    let curMarks = cur.firstChild.marks, prevMarks = prev.firstChild.marks;
    let added = curMarks, removed = prevMarks, type3, mark, update;
    for (let i = 0; i < prevMarks.length; i++)
      added = prevMarks[i].removeFromSet(added);
    for (let i = 0; i < curMarks.length; i++)
      removed = curMarks[i].removeFromSet(removed);
    if (added.length == 1 && removed.length == 0) {
      mark = added[0];
      type3 = "add";
      update = (node) => node.mark(mark.addToSet(node.marks));
    } else if (added.length == 0 && removed.length == 1) {
      mark = removed[0];
      type3 = "remove";
      update = (node) => node.mark(mark.removeFromSet(node.marks));
    } else {
      return null;
    }
    let updated = [];
    for (let i = 0; i < prev.childCount; i++)
      updated.push(update(prev.child(i)));
    if (Fragment.from(updated).eq(cur))
      return { mark, type: type3 };
  }
  function looksLikeBackspace(old, start, end, $newStart, $newEnd) {
    if (
      // The content must have shrunk
      end - start <= $newEnd.pos - $newStart.pos || // newEnd must point directly at or after the end of the block that newStart points into
      skipClosingAndOpening($newStart, true, false) < $newEnd.pos
    )
      return false;
    let $start = old.resolve(start);
    if (!$newStart.parent.isTextblock) {
      let after = $start.nodeAfter;
      return after != null && end == start + after.nodeSize;
    }
    if ($start.parentOffset < $start.parent.content.size || !$start.parent.isTextblock)
      return false;
    let $next = old.resolve(skipClosingAndOpening($start, true, true));
    if (!$next.parent.isTextblock || $next.pos > end || skipClosingAndOpening($next, true, false) < end)
      return false;
    return $newStart.parent.content.cut($newStart.parentOffset).eq($next.parent.content);
  }
  function skipClosingAndOpening($pos, fromEnd, mayOpen) {
    let depth = $pos.depth, end = fromEnd ? $pos.end() : $pos.pos;
    while (depth > 0 && (fromEnd || $pos.indexAfter(depth) == $pos.node(depth).childCount)) {
      depth--;
      end++;
      fromEnd = false;
    }
    if (mayOpen) {
      let next = $pos.node(depth).maybeChild($pos.indexAfter(depth));
      while (next && !next.isLeaf) {
        next = next.firstChild;
        end++;
      }
    }
    return end;
  }
  function findDiff(a, b, pos, preferredPos, preferredSide) {
    let start = a.findDiffStart(b, pos);
    if (start == null)
      return null;
    let { a: endA, b: endB } = a.findDiffEnd(b, pos + a.size, pos + b.size);
    if (preferredSide == "end") {
      let adjust = Math.max(0, start - Math.min(endA, endB));
      preferredPos -= endA + adjust - start;
    }
    if (endA < start && a.size < b.size) {
      let move = preferredPos <= start && preferredPos >= endA ? start - preferredPos : 0;
      start -= move;
      if (start && start < b.size && isSurrogatePair(b.textBetween(start - 1, start + 1)))
        start += move ? 1 : -1;
      endB = start + (endB - endA);
      endA = start;
    } else if (endB < start) {
      let move = preferredPos <= start && preferredPos >= endB ? start - preferredPos : 0;
      start -= move;
      if (start && start < a.size && isSurrogatePair(a.textBetween(start - 1, start + 1)))
        start += move ? 1 : -1;
      endA = start + (endA - endB);
      endB = start;
    }
    return { start, endA, endB };
  }
  function isSurrogatePair(str) {
    if (str.length != 2)
      return false;
    let a = str.charCodeAt(0), b = str.charCodeAt(1);
    return a >= 56320 && a <= 57343 && b >= 55296 && b <= 56319;
  }
  var EditorView = class {
    /**
    Create a view. `place` may be a DOM node that the editor should
    be appended to, a function that will place it into the document,
    or an object whose `mount` property holds the node to use as the
    document container. If it is `null`, the editor will not be
    added to the document.
    */
    constructor(place, props) {
      this._root = null;
      this.focused = false;
      this.trackWrites = null;
      this.mounted = false;
      this.markCursor = null;
      this.cursorWrapper = null;
      this.lastSelectedViewDesc = void 0;
      this.input = new InputState();
      this.prevDirectPlugins = [];
      this.pluginViews = [];
      this.requiresGeckoHackNode = false;
      this.dragging = null;
      this._props = props;
      this.state = props.state;
      this.directPlugins = props.plugins || [];
      this.directPlugins.forEach(checkStateComponent);
      this.dispatch = this.dispatch.bind(this);
      this.dom = place && place.mount || document.createElement("div");
      if (place) {
        if (place.appendChild)
          place.appendChild(this.dom);
        else if (typeof place == "function")
          place(this.dom);
        else if (place.mount)
          this.mounted = true;
      }
      this.editable = getEditable(this);
      updateCursorWrapper(this);
      this.nodeViews = buildNodeViews(this);
      this.docView = docViewDesc(this.state.doc, computeDocDeco(this), viewDecorations(this), this.dom, this);
      this.domObserver = new DOMObserver(this, (from, to, typeOver, added) => readDOMChange(this, from, to, typeOver, added));
      this.domObserver.start();
      initInput(this);
      this.updatePluginViews();
    }
    /**
    Holds `true` when a
    [composition](https://w3c.github.io/uievents/#events-compositionevents)
    is active.
    */
    get composing() {
      return this.input.composing;
    }
    /**
    The view's current [props](https://prosemirror.net/docs/ref/#view.EditorProps).
    */
    get props() {
      if (this._props.state != this.state) {
        let prev = this._props;
        this._props = {};
        for (let name in prev)
          this._props[name] = prev[name];
        this._props.state = this.state;
      }
      return this._props;
    }
    /**
    Update the view's props. Will immediately cause an update to
    the DOM.
    */
    update(props) {
      if (props.handleDOMEvents != this._props.handleDOMEvents)
        ensureListeners(this);
      let prevProps = this._props;
      this._props = props;
      if (props.plugins) {
        props.plugins.forEach(checkStateComponent);
        this.directPlugins = props.plugins;
      }
      this.updateStateInner(props.state, prevProps);
    }
    /**
    Update the view by updating existing props object with the object
    given as argument. Equivalent to `view.update(Object.assign({},
    view.props, props))`.
    */
    setProps(props) {
      let updated = {};
      for (let name in this._props)
        updated[name] = this._props[name];
      updated.state = this.state;
      for (let name in props)
        updated[name] = props[name];
      this.update(updated);
    }
    /**
    Update the editor's `state` prop, without touching any of the
    other props.
    */
    updateState(state) {
      this.updateStateInner(state, this._props);
    }
    updateStateInner(state, prevProps) {
      var _a;
      let prev = this.state, redraw = false, updateSel = false;
      if (state.storedMarks && this.composing) {
        clearComposition(this);
        updateSel = true;
      }
      this.state = state;
      let pluginsChanged = prev.plugins != state.plugins || this._props.plugins != prevProps.plugins;
      if (pluginsChanged || this._props.plugins != prevProps.plugins || this._props.nodeViews != prevProps.nodeViews) {
        let nodeViews = buildNodeViews(this);
        if (changedNodeViews(nodeViews, this.nodeViews)) {
          this.nodeViews = nodeViews;
          redraw = true;
        }
      }
      if (pluginsChanged || prevProps.handleDOMEvents != this._props.handleDOMEvents) {
        ensureListeners(this);
      }
      this.editable = getEditable(this);
      updateCursorWrapper(this);
      let innerDeco = viewDecorations(this), outerDeco = computeDocDeco(this);
      let scroll = prev.plugins != state.plugins && !prev.doc.eq(state.doc) ? "reset" : state.scrollToSelection > prev.scrollToSelection ? "to selection" : "preserve";
      let updateDoc = redraw || !this.docView.matchesNode(state.doc, outerDeco, innerDeco);
      if (updateDoc || !state.selection.eq(prev.selection))
        updateSel = true;
      let oldScrollPos = scroll == "preserve" && updateSel && this.dom.style.overflowAnchor == null && storeScrollPos(this);
      if (updateSel) {
        this.domObserver.stop();
        let forceSelUpdate = updateDoc && (ie || chrome) && !this.composing && !prev.selection.empty && !state.selection.empty && selectionContextChanged(prev.selection, state.selection);
        if (updateDoc) {
          let chromeKludge = chrome ? this.trackWrites = this.domSelectionRange().focusNode : null;
          if (this.composing)
            this.input.compositionNode = findCompositionNode(this);
          if (redraw || !this.docView.update(state.doc, outerDeco, innerDeco, this)) {
            this.docView.updateOuterDeco(outerDeco);
            this.docView.destroy();
            this.docView = docViewDesc(state.doc, outerDeco, innerDeco, this.dom, this);
          }
          if (chromeKludge && (!this.trackWrites || !this.dom.contains(this.trackWrites)))
            forceSelUpdate = true;
        }
        if (forceSelUpdate || !(this.input.mouseDown && this.domObserver.currentSelection.eq(this.domSelectionRange()) && anchorInRightPlace(this))) {
          selectionToDOM(this, forceSelUpdate);
        } else {
          syncNodeSelection(this, state.selection);
          this.domObserver.setCurSelection();
        }
        this.domObserver.start();
      }
      this.updatePluginViews(prev);
      if (((_a = this.dragging) === null || _a === void 0 ? void 0 : _a.node) && !prev.doc.eq(state.doc))
        this.updateDraggedNode(this.dragging, prev);
      if (scroll == "reset") {
        this.dom.scrollTop = 0;
      } else if (scroll == "to selection") {
        this.scrollToSelection();
      } else if (oldScrollPos) {
        resetScrollPos(oldScrollPos);
      }
    }
    /**
    @internal
    */
    scrollToSelection() {
      let startDOM = this.domSelectionRange().focusNode;
      if (!startDOM || !this.dom.contains(startDOM.nodeType == 1 ? startDOM : startDOM.parentNode)) ;
      else if (this.someProp("handleScrollToSelection", (f) => f(this))) ;
      else if (this.state.selection instanceof NodeSelection) {
        let target = this.docView.domAfterPos(this.state.selection.from);
        if (target.nodeType == 1)
          scrollRectIntoView(this, target.getBoundingClientRect(), startDOM);
      } else {
        scrollRectIntoView(this, this.coordsAtPos(this.state.selection.head, 1), startDOM);
      }
    }
    destroyPluginViews() {
      let view;
      while (view = this.pluginViews.pop())
        if (view.destroy)
          view.destroy();
    }
    updatePluginViews(prevState) {
      if (!prevState || prevState.plugins != this.state.plugins || this.directPlugins != this.prevDirectPlugins) {
        this.prevDirectPlugins = this.directPlugins;
        this.destroyPluginViews();
        for (let i = 0; i < this.directPlugins.length; i++) {
          let plugin = this.directPlugins[i];
          if (plugin.spec.view)
            this.pluginViews.push(plugin.spec.view(this));
        }
        for (let i = 0; i < this.state.plugins.length; i++) {
          let plugin = this.state.plugins[i];
          if (plugin.spec.view)
            this.pluginViews.push(plugin.spec.view(this));
        }
      } else {
        for (let i = 0; i < this.pluginViews.length; i++) {
          let pluginView = this.pluginViews[i];
          if (pluginView.update)
            pluginView.update(this, prevState);
        }
      }
    }
    updateDraggedNode(dragging, prev) {
      let sel = dragging.node, found2 = -1;
      if (this.state.doc.nodeAt(sel.from) == sel.node) {
        found2 = sel.from;
      } else {
        let movedPos = sel.from + (this.state.doc.content.size - prev.doc.content.size);
        let moved = movedPos > 0 && this.state.doc.nodeAt(movedPos);
        if (moved == sel.node)
          found2 = movedPos;
      }
      this.dragging = new Dragging(dragging.slice, dragging.move, found2 < 0 ? void 0 : NodeSelection.create(this.state.doc, found2));
    }
    someProp(propName, f) {
      let prop = this._props && this._props[propName], value;
      if (prop != null && (value = f ? f(prop) : prop))
        return value;
      for (let i = 0; i < this.directPlugins.length; i++) {
        let prop2 = this.directPlugins[i].props[propName];
        if (prop2 != null && (value = f ? f(prop2) : prop2))
          return value;
      }
      let plugins = this.state.plugins;
      if (plugins)
        for (let i = 0; i < plugins.length; i++) {
          let prop2 = plugins[i].props[propName];
          if (prop2 != null && (value = f ? f(prop2) : prop2))
            return value;
        }
    }
    /**
    Query whether the view has focus.
    */
    hasFocus() {
      if (ie) {
        let node = this.root.activeElement;
        if (node == this.dom)
          return true;
        if (!node || !this.dom.contains(node))
          return false;
        while (node && this.dom != node && this.dom.contains(node)) {
          if (node.contentEditable == "false")
            return false;
          node = node.parentElement;
        }
        return true;
      }
      return this.root.activeElement == this.dom;
    }
    /**
    Focus the editor.
    */
    focus() {
      this.domObserver.stop();
      if (this.editable)
        focusPreventScroll(this.dom);
      selectionToDOM(this);
      this.domObserver.start();
    }
    /**
    Get the document root in which the editor exists. This will
    usually be the top-level `document`, but might be a [shadow
    DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Shadow_DOM)
    root if the editor is inside one.
    */
    get root() {
      let cached = this._root;
      if (cached == null)
        for (let search = this.dom.parentNode; search; search = search.parentNode) {
          if (search.nodeType == 9 || search.nodeType == 11 && search.host) {
            if (!search.getSelection)
              Object.getPrototypeOf(search).getSelection = () => search.ownerDocument.getSelection();
            return this._root = search;
          }
        }
      return cached || document;
    }
    /**
    When an existing editor view is moved to a new document or
    shadow tree, call this to make it recompute its root.
    */
    updateRoot() {
      this._root = null;
    }
    /**
    Given a pair of viewport coordinates, return the document
    position that corresponds to them. May return null if the given
    coordinates aren't inside of the editor. When an object is
    returned, its `pos` property is the position nearest to the
    coordinates, and its `inside` property holds the position of the
    inner node that the position falls inside of, or -1 if it is at
    the top level, not in any node.
    */
    posAtCoords(coords) {
      return posAtCoords(this, coords);
    }
    /**
    Returns the viewport rectangle at a given document position.
    `left` and `right` will be the same number, as this returns a
    flat cursor-ish rectangle. If the position is between two things
    that aren't directly adjacent, `side` determines which element
    is used. When < 0, the element before the position is used,
    otherwise the element after.
    */
    coordsAtPos(pos, side = 1) {
      return coordsAtPos(this, pos, side);
    }
    /**
    Find the DOM position that corresponds to the given document
    position. When `side` is negative, find the position as close as
    possible to the content before the position. When positive,
    prefer positions close to the content after the position. When
    zero, prefer as shallow a position as possible.
    
    Note that you should **not** mutate the editor's internal DOM,
    only inspect it (and even that is usually not necessary).
    */
    domAtPos(pos, side = 0) {
      return this.docView.domFromPos(pos, side);
    }
    /**
    Find the DOM node that represents the document node after the
    given position. May return `null` when the position doesn't point
    in front of a node or if the node is inside an opaque node view.
    
    This is intended to be able to call things like
    `getBoundingClientRect` on that DOM node. Do **not** mutate the
    editor DOM directly, or add styling this way, since that will be
    immediately overriden by the editor as it redraws the node.
    */
    nodeDOM(pos) {
      let desc = this.docView.descAt(pos);
      return desc ? desc.nodeDOM : null;
    }
    /**
    Find the document position that corresponds to a given DOM
    position. (Whenever possible, it is preferable to inspect the
    document structure directly, rather than poking around in the
    DOM, but sometimes—for example when interpreting an event
    target—you don't have a choice.)
    
    The `bias` parameter can be used to influence which side of a DOM
    node to use when the position is inside a leaf node.
    */
    posAtDOM(node, offset, bias = -1) {
      let pos = this.docView.posFromDOM(node, offset, bias);
      if (pos == null)
        throw new RangeError("DOM position not inside the editor");
      return pos;
    }
    /**
    Find out whether the selection is at the end of a textblock when
    moving in a given direction. When, for example, given `"left"`,
    it will return true if moving left from the current cursor
    position would leave that position's parent textblock. Will apply
    to the view's current state by default, but it is possible to
    pass a different state.
    */
    endOfTextblock(dir, state) {
      return endOfTextblock(this, state || this.state, dir);
    }
    /**
    Run the editor's paste logic with the given HTML string. The
    `event`, if given, will be passed to the
    [`handlePaste`](https://prosemirror.net/docs/ref/#view.EditorProps.handlePaste) hook.
    */
    pasteHTML(html, event) {
      return doPaste(this, "", html, false, event || new ClipboardEvent("paste"));
    }
    /**
    Run the editor's paste logic with the given plain-text input.
    */
    pasteText(text, event) {
      return doPaste(this, text, null, true, event || new ClipboardEvent("paste"));
    }
    /**
    Serialize the given slice as it would be if it was copied from
    this editor. Returns a DOM element that contains a
    representation of the slice as its children, a textual
    representation, and the transformed slice (which can be
    different from the given input due to hooks like
    [`transformCopied`](https://prosemirror.net/docs/ref/#view.EditorProps.transformCopied)).
    */
    serializeForClipboard(slice) {
      return serializeForClipboard(this, slice);
    }
    /**
    Removes the editor from the DOM and destroys all [node
    views](https://prosemirror.net/docs/ref/#view.NodeView).
    */
    destroy() {
      if (!this.docView)
        return;
      destroyInput(this);
      this.destroyPluginViews();
      if (this.mounted) {
        this.docView.update(this.state.doc, [], viewDecorations(this), this);
        this.dom.textContent = "";
      } else if (this.dom.parentNode) {
        this.dom.parentNode.removeChild(this.dom);
      }
      this.docView.destroy();
      this.docView = null;
      clearReusedRange();
    }
    /**
    This is true when the view has been
    [destroyed](https://prosemirror.net/docs/ref/#view.EditorView.destroy) (and thus should not be
    used anymore).
    */
    get isDestroyed() {
      return this.docView == null;
    }
    /**
    Used for testing.
    */
    dispatchEvent(event) {
      return dispatchEvent(this, event);
    }
    /**
    @internal
    */
    domSelectionRange() {
      let sel = this.domSelection();
      if (!sel)
        return { focusNode: null, focusOffset: 0, anchorNode: null, anchorOffset: 0 };
      return safari && this.root.nodeType === 11 && deepActiveElement(this.dom.ownerDocument) == this.dom && safariShadowSelectionRange(this, sel) || sel;
    }
    /**
    @internal
    */
    domSelection() {
      return this.root.getSelection();
    }
  };
  EditorView.prototype.dispatch = function(tr) {
    let dispatchTransaction = this._props.dispatchTransaction;
    if (dispatchTransaction)
      dispatchTransaction.call(this, tr);
    else
      this.updateState(this.state.apply(tr));
  };
  function computeDocDeco(view) {
    let attrs = /* @__PURE__ */ Object.create(null);
    attrs.class = "ProseMirror";
    attrs.contenteditable = String(view.editable);
    view.someProp("attributes", (value) => {
      if (typeof value == "function")
        value = value(view.state);
      if (value)
        for (let attr in value) {
          if (attr == "class")
            attrs.class += " " + value[attr];
          else if (attr == "style")
            attrs.style = (attrs.style ? attrs.style + ";" : "") + value[attr];
          else if (!attrs[attr] && attr != "contenteditable" && attr != "nodeName")
            attrs[attr] = String(value[attr]);
        }
    });
    if (!attrs.translate)
      attrs.translate = "no";
    return [Decoration.node(0, view.state.doc.content.size, attrs)];
  }
  function updateCursorWrapper(view) {
    if (view.markCursor) {
      let dom = document.createElement("img");
      dom.className = "ProseMirror-separator";
      dom.setAttribute("mark-placeholder", "true");
      dom.setAttribute("alt", "");
      view.cursorWrapper = { dom, deco: Decoration.widget(view.state.selection.from, dom, { raw: true, marks: view.markCursor }) };
    } else {
      view.cursorWrapper = null;
    }
  }
  function getEditable(view) {
    return !view.someProp("editable", (value) => value(view.state) === false);
  }
  function selectionContextChanged(sel1, sel2) {
    let depth = Math.min(sel1.$anchor.sharedDepth(sel1.head), sel2.$anchor.sharedDepth(sel2.head));
    return sel1.$anchor.start(depth) != sel2.$anchor.start(depth);
  }
  function buildNodeViews(view) {
    let result = /* @__PURE__ */ Object.create(null);
    function add(obj) {
      for (let prop in obj)
        if (!Object.prototype.hasOwnProperty.call(result, prop))
          result[prop] = obj[prop];
    }
    view.someProp("nodeViews", add);
    view.someProp("markViews", add);
    return result;
  }
  function changedNodeViews(a, b) {
    let nA = 0, nB = 0;
    for (let prop in a) {
      if (a[prop] != b[prop])
        return true;
      nA++;
    }
    for (let _ in b)
      nB++;
    return nA != nB;
  }
  function checkStateComponent(plugin) {
    if (plugin.spec.state || plugin.spec.filterTransaction || plugin.spec.appendTransaction)
      throw new RangeError("Plugins passed directly to the view must not have a state component");
  }

  // src/browser/page-runtime.ts
  var schema = new Schema({
    nodes: {
      doc: { content: "paragraph+" },
      paragraph: { content: "text*", toDOM: () => ["p", 0] },
      text: {}
    }
  });
  var prepared = null;
  var editors = [];
  var history = [];
  var root = document.getElementById("editors");
  var frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
  function clear() {
    for (const { view } of editors) view.destroy();
    editors = [];
    history = [];
    prepared = null;
    root.replaceChildren();
  }
  function installBenchmark(candidate, firstEditBunchId = "browser-first-edit") {
    window.benchmark = {
      dropHistory() {
        history = [];
      },
      checkSession(saved, text) {
        if (JSON.stringify(editors[0].list.save()) !== JSON.stringify(saved))
          throw new Error("Session ID mismatch");
        if (editors[0].view.state.doc.textBetween(
          0,
          editors[0].view.state.doc.content.size,
          "\n"
        ) !== text)
          throw new Error("Session document mismatch");
        if (root.children.length !== editors.length || editors.some(({ view }) => !view.dom.isConnected))
          throw new Error("Session editor mount mismatch");
        const rendered = [...editors[0].view.dom.querySelectorAll("p")].map((p) => p.textContent ?? "").join("\n");
        if (rendered !== text) throw new Error("Session rendered text mismatch");
      },
      async session(edits, historyLimit) {
        const editor = editors[0];
        let listMs = 0;
        const start = performance.now();
        for (const edit of edits) {
          if (historyLimit) {
            history.push(editor.list);
            if (history.length > historyLimit) history.shift();
          }
          const t = performance.now();
          const actual = edit.type === "insert" ? edit.index ? editor.list.at(edit.index - 1) : null : editor.list.at(edit.index);
          editor.list = edit.type === "insert" ? editor.list.insertAfter(actual, edit.id) : editor.list.delete(actual);
          listMs += performance.now() - t;
          const expected = edit.type === "insert" ? edit.before ?? null : edit.id;
          if (actual?.bunchId !== expected?.bunchId || actual?.counter !== expected?.counter)
            throw new Error("Session index-to-ID mismatch");
          let position = 1, remaining = edit.index;
          for (let i = 0; i < editor.view.state.doc.childCount; i++) {
            const paragraph = editor.view.state.doc.child(i);
            if (remaining <= paragraph.content.size) {
              position += remaining;
              break;
            }
            remaining -= paragraph.content.size + 1;
            position += paragraph.nodeSize;
          }
          const transaction = editor.view.state.tr;
          if (edit.type === "insert") transaction.insertText("x", position);
          else transaction.delete(position, position + 1);
          editor.view.dispatch(transaction);
        }
        void root.getBoundingClientRect();
        await frame();
        await frame();
        return {
          listMs,
          totalMs: performance.now() - start,
          retainedVersions: history.length
        };
      },
      async prepare(id) {
        const [bytes, documentJSON] = await Promise.all([
          fetch(`/payload/${id}`).then((r) => r.arrayBuffer()),
          fetch("/document").then((r) => r.text())
        ]);
        prepared = { id, bytes: new Uint8Array(bytes), documentJSON };
      },
      async run(count, memory = false) {
        if (!prepared) throw new Error("Call prepare first");
        const input = prepared;
        prepared = null;
        const c = candidate(input.id);
        await frame();
        performance.mark("bench-start");
        const start = performance.now();
        clear();
        const result = {
          decode: 0,
          hydrate: 0,
          editor: 0,
          layout: 0,
          frameWait: 0,
          total: 0,
          edit: 0
        };
        const probe = async (phase) => {
          if (memory) await window.memoryProbe(phase);
        };
        for (let i = 0; i < count; i++) {
          let t2 = performance.now();
          let state = c.decode(input.bytes);
          result.decode += performance.now() - t2;
          await probe("decoded");
          t2 = performance.now();
          const list = c.hydrate(state);
          result.hydrate += performance.now() - t2;
          state = null;
          await probe("hydrated");
          t2 = performance.now();
          const host = document.createElement("section");
          root.append(host);
          const doc3 = Node.fromJSON(schema, JSON.parse(input.documentJSON));
          const view = new EditorView(host, {
            state: EditorState.create({ schema, doc: doc3 })
          });
          editors.push({ list, view, candidate: c });
          result.editor += performance.now() - t2;
          await probe("editor");
        }
        const t = performance.now();
        for (const { view } of editors)
          void view.dom.getBoundingClientRect().height;
        result.layout = performance.now() - t;
        await probe("layout");
        const syncEnd = performance.now();
        await frame();
        await frame();
        const ready = performance.now();
        result.total = ready - start;
        performance.mark("bench-end");
        result.frameWait = ready - syncEnd;
        result.editor = result.total - result.decode - result.hydrate - result.layout - result.frameWait;
        const editStart = performance.now();
        const first = editors[0];
        first.list = first.list.insertAfter(null, {
          bunchId: firstEditBunchId,
          counter: 0
        });
        first.view.dispatch(first.view.state.tr.insertText("x", 1));
        first.view.focus();
        await frame();
        await frame();
        result.edit = performance.now() - editStart;
        performance.mark("bench-edit-end");
        return result;
      },
      async exercise(workload) {
        const entry = editors[0];
        let list = entry.list;
        await frame();
        performance.mark("bench-start");
        const started = performance.now();
        let checksum = 0;
        for (const query of workload.lookups) {
          const id = list.at(query.index);
          if (id.bunchId !== query.id.bunchId || id.counter !== query.id.counter)
            throw new Error("Lookup mismatch");
          checksum += list.indexOf(query.id);
        }
        const lookupMs = performance.now() - started;
        const editStart = performance.now();
        for (const edit of workload.edits)
          list = edit.type === "insert" ? list.insertAfter(edit.before, edit.id) : list.delete(edit.id);
        const editMs = performance.now() - editStart;
        entry.list = list;
        const doc3 = Node.fromJSON(schema, {
          type: "doc",
          content: workload.expectedText.split("\n").map((text2) => ({
            type: "paragraph",
            ...text2 ? { content: [{ type: "text", text: text2 }] } : {}
          }))
        });
        entry.view.dispatch(
          entry.view.state.tr.replaceWith(
            0,
            entry.view.state.doc.content.size,
            doc3.content
          )
        );
        void entry.view.dom.getBoundingClientRect().height;
        await frame();
        await frame();
        const totalMs = performance.now() - started;
        performance.mark("bench-end");
        const snapshotStart = performance.now();
        const snapshot = entry.candidate.snapshot(list);
        const snapshotMs = performance.now() - snapshotStart;
        const stringifyStart = performance.now();
        const serialized = JSON.stringify(snapshot);
        const stringifyMs = performance.now() - stringifyStart;
        if (JSON.stringify(
          entry.candidate.hydrate(JSON.parse(serialized)).save()
        ) !== JSON.stringify(workload.expected))
          throw new Error("Exported snapshot mismatch");
        if (checksum !== workload.lookups.reduce((sum, q) => sum + q.index, 0))
          throw new Error("Index mismatch");
        if (JSON.stringify(list.save()) !== JSON.stringify(workload.expected))
          throw new Error("Edited IDs mismatch");
        const text = Array.from(
          entry.view.dom.querySelectorAll("p"),
          (p) => p.textContent
        ).join("\n");
        if (text !== workload.expectedText)
          throw new Error("Edited DOM mismatch");
        return { lookupMs, editMs, totalMs, snapshotMs, stringifyMs };
      },
      clear,
      check(saved, text, edited = true) {
        const expected = IdList.load(saved);
        for (let i = 0; i < editors.length; i++) {
          const e = editors[i];
          const expectedList = i === 0 && edited ? expected.insertAfter(null, {
            bunchId: firstEditBunchId,
            counter: 0
          }) : expected;
          if (JSON.stringify(e.list.save()) !== JSON.stringify(expectedList.save()))
            throw new Error("ID state mismatch");
          const actual = e.view.state.doc.textBetween(
            0,
            e.view.state.doc.content.size,
            "\n"
          );
          const dom = Array.from(
            e.view.dom.querySelectorAll("p"),
            (p) => p.textContent
          ).join("\n");
          const expectedText = (i === 0 && edited ? "x" : "") + text;
          if (actual !== expectedText || dom !== expectedText)
            throw new Error("Rendered document mismatch");
          if (e.list.length !== actual.length)
            throw new Error("ID/text lengths disagree");
        }
      }
    };
  }

  // src/browser/flat-f64-page.ts
  installBenchmark(flatFloat64Candidate, nativeFirstEdit);
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
