/** Human-readable interchange names. These are not internal editing formats. */
export const formats = {
  objects: {
    name: "Object records: deletion flag",
    explanation:
      "One object per run, with separate count and isDeleted fields.",
  },
  signed: {
    name: "Object records: negative count means deleted",
    explanation:
      "One object per run. Replace the separate deletion flag with a negative count for deleted IDs: count: -2 means two deleted IDs.",
  },
  tuples: {
    name: "Tuple records: negative count means deleted",
    explanation:
      "One three-element array per run: [bunchId, startCounter, count]. Negative count means deleted. This measured variant is a triple, not a four-tuple.",
  },
  columns: {
    name: "Columnar store: all counters",
    explanation:
      "Separate arrays for bunchIds, startCounters, and counts. Each position describes one run. Negative counts mean deleted; IDs repeat in the bunchIds column.",
  },
  omit: {
    name: "Columnar store: reconstruct counters",
    explanation:
      "The same columns, but infer each start counter from the previous run for that ID (or zero for its first run). Store only exceptions and their delta-encoded run indexes. No data is discarded.",
  },
  split: {
    name: "Columnar store: split IDs + reconstruct counters",
    explanation:
      "Reconstruct counters as above; additionally split each structured clientId_sequence ID into clientIds and seqNums columns. Client strings still repeat. This is not valid for arbitrary opaque nanoids.",
  },
  dictionary: {
    name: "Columnar store: deduplicate IDs + reconstruct counters",
    explanation:
      "Reconstruct counters and store each distinct whole ID once in bunchIds. A bunchIndices column refers to that list; this does not split or change the IDs.",
  },
  client: {
    name: "Columnar store: deduplicate clients + reconstruct counters",
    explanation:
      "Split structured clientId_sequence IDs, store each distinct client string once, and use clientIndices plus seqNums for each run. Reconstruct counters. Requires structured IDs, not arbitrary opaque nanoids.",
  },
  full: {
    name: "Columnar store: deduplicate IDs + all counters",
    explanation:
      "Store each distinct whole ID once in bunchIds, use bunchIndices per run, and store every start counter. IDs remain intact. Counts are negative for deleted runs.",
  },
} as const;

export const internalFormat = "Existing IdList tree";
export const loaderName = (path: string) =>
  path === "direct" ? "Direct to tree" : "Via run objects";
