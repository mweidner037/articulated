export interface TraceEvent {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  pid: number;
  tid: number;
  args?: Record<string, unknown>;
}
export function unionDuration(intervals: [number, number][]) {
  const sorted = intervals.sort((a, b) => a[0] - b[0]);
  let total = 0,
    end = -Infinity;
  for (const [a, b] of sorted) {
    total += Math.max(0, b - Math.max(a, end));
    end = Math.max(end, b);
  }
  return total;
}
export function analyzeTrace(events: TraceEvent[]) {
  const starts = events.filter((e) => e.name === "bench-start");
  const ends = events.filter((e) => e.name === "bench-end");
  if (!starts.length || starts.length !== ends.length)
    throw new Error("Missing timing trace markers");
  const gc = events.filter(
    (e) =>
      /^(MinorGC|MajorGC)$/.test(e.name) && e.ph === "X" && e.dur !== undefined,
  );
  return starts.map((start, i) => {
    const end = ends[i];
    if (end.ts < start.ts || end.tid !== start.tid || end.pid !== start.pid)
      throw new Error("Invalid trace interval");
    const pauses = gc
      .filter(
        (g) =>
          g.tid === start.tid &&
          g.pid === start.pid &&
          g.ts < end.ts &&
          g.ts + g.dur! > start.ts,
      )
      .map((g): [number, number] => [
        Math.max(start.ts, g.ts),
        Math.min(end.ts, g.ts + g.dur!),
      ]);
    return {
      paintEvents: events.filter(
        (e) =>
          e.name === "Paint" &&
          e.pid === start.pid &&
          e.tid === start.tid &&
          e.ts >= start.ts &&
          e.ts < end.ts,
      ).length,
      gcMs: unionDuration(pauses) / 1000,
      gcEvents: pauses.length,
      longestGC: Math.max(0, ...pauses.map(([a, b]) => (b - a) / 1000)),
    };
  });
}
