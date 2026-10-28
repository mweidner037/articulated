# Protobuf Saved States

The built-in saved state formats - `SavedIdList` and `CompactSavedIdList` - incorporate basic (resp., advanced) compression, but they are still JSON. GZIP brings them down to a reasonable size, but it comes with a different cost: the time to save and load the state.

In our [benchmarks](https://github.com/mweidner037/articulated/blob/master/benchmarks/results.md#refresh-every-1000-ops), saving a large IdList is dominated by the time to GZIP its `SavedIdList` or `CompactSavedIdList`. That can lead to dropped frames or drained batteries when your code saves frequently.

Protobuf encoding provides an alternative to GZIP that yields similar state sizes with faster loading and much faster saving. Intuitively, you decide on a compression scheme at compile time (the Protobuf format) instead of making GZIP find one on the fly.

Articulated does not come with a Protobuf encoding to avoid extra dependencies, but it's easy enough to set one up yourself. Here is a format that worked well in our [analysis](https://github.com/mweidner037/articulated/pull/30). Build it from the output of `IdList.saveCompact()` like in the benchmarks' [IdListProtobuf](https://github.com/mweidner037/articulated/blob/master/benchmarks/src/algorithms/id_list_protobuf.ts), or directly from `IdList.save()` for maximum efficiency.

**Assumption:** Your bunchIds typically have the form `${clientId}.${seqNum}`, as suggested in the [README](https://github.com/mweidner037/articulated#elementid).

```proto
syntax = "proto3";

message SavedIdListMessage {
  // All clientIds that appear in the SavedIdList, deduplicated.
  repeated string clientIds = 1;
  // For each object in the SavedIdList array, its bunchId's clientId,
  // referenced via its index in the clientIds array.
  // Except, those indexes are then delta-encoded.
  repeated sint32 clientIndexDeltas = 2;
  // For each entry in the SavedIdList array, its bunchId's seqNum **plus 1**.
  // 0 indicates a bunchId not of the form `${clientId}.${seqNum}`,
  // which is stored as-is in the clientId column.
  repeated uint32 seqNumIncs = 3;
  // The remaining arrays are as in CompactSavedIdList.
  repeated sint32 signedCounts = 4;
  repeated uint32 startCounterIndexes = 5;
  repeated uint32 startCounters = 6;
}
```
