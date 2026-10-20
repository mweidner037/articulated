// Browser equivalents for the two Node APIs used by the existing codec module.
// Validation remains enabled; this is not a no-op assertion shim.
function assert(value: unknown, message?: string): asserts value {
  if (!value) throw new Error(message ?? "Assertion failed");
}
assert.equal = (actual: unknown, expected: unknown) => {
  if (!Object.is(actual, expected)) throw new Error("Values are not equal");
};
export default assert;
export function endianness() {
  return new Uint8Array(new Uint16Array([1]).buffer)[0] === 1 ? "LE" : "BE";
}
