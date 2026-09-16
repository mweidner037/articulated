/** Raw, little-endian numeric arrays; no headers or embedded metadata. */
type NumericColumn = Uint32Array | Float64Array;
const littleEndian = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

function reverseElements(bytes: Uint8Array, width: number) {
  for (let offset = 0; offset < bytes.length; offset += width) {
    for (let i = 0; i < width / 2; i++) {
      const j = offset + width - 1 - i;
      [bytes[offset + i], bytes[j]] = [bytes[j], bytes[offset + i]];
    }
  }
}

/** Always returns an owned copy, not a view into the snapshot's private data. */
export function encodeColumn(column: NumericColumn): Uint8Array {
  const bytes = new Uint8Array(column.byteLength);
  bytes.set(
    new Uint8Array(column.buffer, column.byteOffset, column.byteLength)
  );
  if (!littleEndian && column.BYTES_PER_ELEMENT > 1)
    reverseElements(bytes, column.BYTES_PER_ELEMENT);
  return bytes;
}

/** Copies slices (including unaligned Node Buffers) into an owned aligned buffer. */
export function decodeColumn<T extends NumericColumn>(
  bytes: Uint8Array,
  Constructor: {
    new (buffer: ArrayBuffer): T;
    readonly BYTES_PER_ELEMENT: number;
  }
): T {
  if (!(bytes instanceof Uint8Array))
    throw new Error("Invalid binary column bytes");
  if (bytes.byteLength % Constructor.BYTES_PER_ELEMENT !== 0)
    throw new Error("Invalid binary column byte length");
  const owned = new Uint8Array(bytes.byteLength);
  owned.set(bytes);
  if (!littleEndian && Constructor.BYTES_PER_ELEMENT > 1)
    reverseElements(owned, Constructor.BYTES_PER_ELEMENT);
  return new Constructor(owned.buffer);
}
