# Cross-checks the Ecto types against bytes written by the JS codec.
#
#   FLAT_VARINT_FIXTURE=$PWD/results/storage-sweep-browser/canonical-input.json \
#     TSX_TSCONFIG_PATH=tsconfig.dev.json \
#     node --import tsx src/browser/flat-varint-elixir-fixtures.ts /tmp/varint-fixtures
#   elixir ecto/check.exs /tmp/varint-fixtures
#
# Uses a stand-in Ecto.Type (ecto_type_stub.ex) so it runs without Hex; in an
# app, drop the stub and use the real Ecto.
Code.require_file("ecto_type_stub.ex", __DIR__)
Code.require_file("saved_id_list_types.ex", __DIR__)

[dir] = System.argv()
read = &File.read!(Path.join(dir, &1))

for name <- ["example", "canonical", "edge"] do
  {expected, _} = Code.eval_string(read.("#{name}.exs"))
  proto = read.("#{name}.proto.bin")

  # Option B: whole message.
  {:ok, ^expected} = SavedIdListProto.load(proto)
  {:ok, ^proto} = SavedIdListProto.dump(expected)

  # Option A: one varint binary per column.
  for {field, type} <- [
        start_counter_indexes: UintVarintArray,
        start_counters: UintVarintArray,
        counts: SintVarintArray
      ] do
    bytes = read.("#{name}.#{field}.bin")
    value = Map.fetch!(expected, field)
    {:ok, ^value} = type.load(bytes)
    {:ok, ^bytes} = type.dump(value)
  end

  IO.puts("#{name}: ok (#{length(expected.counts)} runs)")
end

max = 9_007_199_254_740_991
{:ok, bytes} = SintVarintArray.dump([max, -max])
{:ok, [^max, min]} = SintVarintArray.load(bytes)
true = min == -max
:error = SintVarintArray.cast([max + 1])
:error = UintVarintArray.cast([-1])
:error = SintVarintArray.load(<<128>>)
:error = SavedIdListProto.load(<<10, 5, "ab">>)
IO.puts("edge cases: ok")
