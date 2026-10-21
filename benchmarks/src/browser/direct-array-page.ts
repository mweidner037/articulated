import {
  NumericPages,
  toggleRows,
  type ProbeF05,
  type ProbeOptions,
} from "./direct-array-model";

function install() {
  let current: NumericPages | undefined;
  let history: { version: number; value: NumericPages }[] = [];
  let operations = 0;
  return {
    async load(options: ProbeOptions) {
      if (current) throw new Error("Use a fresh page for every trial");
      const response = await fetch("/fixture");
      const json = await response.text();
      const start = performance.now();
      const parsed = JSON.parse(json) as ProbeF05;
      const parsedAt = performance.now();
      current = NumericPages.load(parsed, options);
      const done = performance.now();
      return {
        parseMs: parsedAt - start,
        convertMs: done - parsedAt,
        totalMs: done - start,
        checksum: current.checksum(),
        stats: current.stats(),
      };
    },
    edit(historyLimit: number) {
      if (
        !current ||
        operations ||
        (historyLimit !== 0 && historyLimit !== 100)
      )
        throw new Error("Invalid edit setup");
      const rows = toggleRows(current.rows);
      const start = performance.now();
      for (const row of rows) {
        if (historyLimit) {
          history.push({ version: operations, value: current });
          if (history.length > historyLimit) history.shift();
        }
        current = current.toggle(row);
        operations++;
      }
      const elapsedMs = performance.now() - start;
      return {
        elapsedMs,
        operations,
        retainedVersions: history.length,
        checksum: current.checksum(),
      };
    },
    async check() {
      if (!current) throw new Error("No container");
      // Reference input and scratch arrays exist only during this untimed call.
      const input = (await (await fetch("/fixture")).json()) as ProbeF05;
      const rows = toggleRows(current.rows, operations);
      current.verify(input, rows);
      const samples = [
        ...new Set([0, Math.floor(history.length / 2), history.length - 1]),
      ].filter((i) => i >= 0 && i < history.length);
      for (const index of samples)
        history[index].value.verify(
          input,
          rows.slice(0, history[index].version),
        );
      return {
        currentValidated: true,
        oldVersionsValidated: samples.length,
        checksum: current.checksum(),
      };
    },
    releaseHistory() {
      history = [];
    },
  };
}
declare global {
  interface Window {
    directArrayProbe: ReturnType<typeof install>;
  }
}
window.directArrayProbe = install();
