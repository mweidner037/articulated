export function checkCount(count: number) {
  if (!(Number.isSafeInteger(count) && count >= 0)) {
    throw new Error(`Invalid count: ${count}`);
  }
}
