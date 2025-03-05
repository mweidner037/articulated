export interface ElementId {
  readonly bunchId: string;
  readonly counter: number;
}

export function equalsId(a: ElementId, b: ElementId) {
  return a.counter === b.counter && a.bunchId === b.bunchId;
}

export function expandIds(startId: ElementId, count: number): ElementId[] {
  const ans: ElementId[] = [];
  for (let i = 0; i < count; i++) {
    ans.push({ bunchId: startId.bunchId, counter: startId.counter + i });
  }
  return ans;
}
