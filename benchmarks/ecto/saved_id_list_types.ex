defmodule Varint do
  @moduledoc """
  Protobuf varints (uint64 and sint64/zigzag) limited to the JavaScript
  safe-integer range, so every value round-trips through the browser.
  """
  import Bitwise

  @max_safe_integer 9_007_199_254_740_991

  def safe_integer?(n), do: is_integer(n) and abs(n) <= @max_safe_integer

  def encode_uint(values), do: for(v <- values, into: <<>>, do: put(v))
  def encode_sint(values), do: for(v <- values, into: <<>>, do: put(zigzag(v)))

  def decode_uint(bytes), do: take_all(bytes, & &1, [])
  def decode_sint(bytes), do: take_all(bytes, &unzigzag/1, [])

  # Exposed for the protobuf message type below.
  def put(v) when v < 128, do: <<v>>
  def put(v), do: <<(v &&& 127) ||| 128, put(v >>> 7)::binary>>

  def take(bytes), do: take(bytes, 0, 0)

  defp take(<<1::1, b::7, rest::binary>>, shift, acc) when shift < 56,
    do: take(rest, shift + 7, acc + (b <<< shift))

  defp take(<<0::1, b::7, rest::binary>>, shift, acc), do: {:ok, acc + (b <<< shift), rest}
  defp take(_, _, _), do: :error

  defp zigzag(n) when n >= 0, do: n * 2
  defp zigzag(n), do: -n * 2 - 1
  defp unzigzag(z) when (z &&& 1) == 0, do: z >>> 1
  defp unzigzag(z), do: -(z >>> 1) - 1

  defp take_all(<<>>, _f, acc), do: {:ok, Enum.reverse(acc)}

  defp take_all(bytes, f, acc) do
    with {:ok, raw, rest} <- take(bytes),
         value = f.(raw),
         true <- safe_integer?(value) do
      take_all(rest, f, [value | acc])
    else
      _ -> :error
    end
  end
end

defmodule UintVarintArray do
  @moduledoc "List of non-negative safe integers, stored as packed uint64 varints."
  use Ecto.Type

  @impl true
  def type, do: :binary

  @impl true
  def cast(values) when is_list(values) do
    if Enum.all?(values, &(Varint.safe_integer?(&1) and &1 >= 0)),
      do: {:ok, values},
      else: :error
  end

  def cast(_), do: :error

  @impl true
  def dump(values) do
    with {:ok, values} <- cast(values), do: {:ok, Varint.encode_uint(values)}
  end

  @impl true
  def load(bytes) when is_binary(bytes), do: Varint.decode_uint(bytes)
  def load(_), do: :error
end

defmodule SintVarintArray do
  @moduledoc "List of signed safe integers, stored as packed sint64 (zigzag) varints."
  use Ecto.Type

  @impl true
  def type, do: :binary

  @impl true
  def cast(values) when is_list(values) do
    if Enum.all?(values, &Varint.safe_integer?/1), do: {:ok, values}, else: :error
  end

  def cast(_), do: :error

  @impl true
  def dump(values) do
    with {:ok, values} <- cast(values), do: {:ok, Varint.encode_sint(values)}
  end

  @impl true
  def load(bytes) when is_binary(bytes), do: Varint.decode_sint(bytes)
  def load(_), do: :error
end

defmodule SavedIdListProto do
  @moduledoc """
  The whole saved state as one FlatSavedIdListMessage (id_list_saved_state.proto),
  stored as a single binary. The app sees the same map it would get from JSON.
  """
  use Ecto.Type

  @fields [:bunch_ids, :start_counter_indexes, :start_counters, :counts]

  @impl true
  def type, do: :binary

  @impl true
  def cast(%{} = state) do
    state = Map.new(@fields, &{&1, Map.get(state, &1, [])})

    with true <- Enum.all?(state.bunch_ids, &is_binary/1),
         {:ok, _} <- UintVarintArray.cast(state.start_counter_indexes),
         {:ok, _} <- UintVarintArray.cast(state.start_counters),
         {:ok, _} <- SintVarintArray.cast(state.counts),
         true <- length(state.bunch_ids) == length(state.counts),
         true <- length(state.start_counter_indexes) == length(state.start_counters) do
      {:ok, state}
    else
      _ -> :error
    end
  end

  def cast(_), do: :error

  @impl true
  def dump(state) do
    with {:ok, s} <- cast(state) do
      {:ok,
       IO.iodata_to_binary([
         # repeated string bunchIds = 1: one length-prefixed entry per ID.
         Enum.map(s.bunch_ids, &[10, Varint.put(byte_size(&1)), &1]),
         packed(18, Varint.encode_uint(s.start_counter_indexes)),
         packed(26, Varint.encode_uint(s.start_counters)),
         packed(34, Varint.encode_sint(s.counts))
       ])}
    end
  end

  defp packed(_tag, <<>>), do: []
  defp packed(tag, bytes), do: [tag, Varint.put(byte_size(bytes)), bytes]

  @impl true
  def load(bytes) when is_binary(bytes) do
    with {:ok, s} <-
           fields(bytes, %{
             bunch_ids: [],
             start_counter_indexes: [],
             start_counters: [],
             counts: []
           }),
         {:ok, s} <- cast(%{s | bunch_ids: Enum.reverse(s.bunch_ids)}) do
      {:ok, s}
    end
  end

  def load(_), do: :error

  defp fields(<<>>, s), do: {:ok, s}

  defp fields(bytes, s) do
    with {:ok, tag, rest} <- Varint.take(bytes),
         2 <- Bitwise.band(tag, 7),
         {:ok, len, rest} <- Varint.take(rest),
         <<value::binary-size(len), rest::binary>> <- rest,
         {:ok, s} <- field(Bitwise.bsr(tag, 3), value, s) do
      fields(rest, s)
    else
      _ -> :error
    end
  end

  defp field(1, id, s) do
    if String.valid?(id), do: {:ok, %{s | bunch_ids: [id | s.bunch_ids]}}, else: :error
  end

  defp field(2, v, s), do: append(s, :start_counter_indexes, Varint.decode_uint(v))
  defp field(3, v, s), do: append(s, :start_counters, Varint.decode_uint(v))
  defp field(4, v, s), do: append(s, :counts, Varint.decode_sint(v))
  # Unknown length-delimited field: skip it, as protobuf does.
  defp field(_, _, s), do: {:ok, s}

  defp append(s, key, {:ok, values}), do: {:ok, Map.update!(s, key, &(&1 ++ values))}
  defp append(_, _, :error), do: :error
end

defmodule SavedIdListCompactProto do
  @moduledoc """
  Like SavedIdListProto, but bunch IDs of the form "<clientId>_<base36 counter>"
  are stored as numbers (CompactIdSavedIdListMessage in id_list_saved_state.proto).
  Each client ID is stored once; each run stores a client index and how far its
  counter moved since that client's previous run. Any other ID is kept as text,
  so existing documents with random IDs still load.

  The app reads and writes exactly the same map as SavedIdListProto.
  """
  use Ecto.Type

  @id_pattern ~r/\A(.+)_(0|[1-9a-z][0-9a-z]*)\z/s

  @impl true
  def type, do: :binary

  @impl true
  defdelegate cast(state), to: SavedIdListProto

  @impl true
  def dump(state) do
    with {:ok, s} <- cast(state) do
      {clients, indexes, changes, raw} = split_ids(s.bunch_ids)

      {:ok,
       IO.iodata_to_binary([
         Enum.map(clients, &[10, Varint.put(byte_size(&1)), &1]),
         packed(18, Varint.encode_uint(indexes)),
         packed(26, Varint.encode_sint(changes)),
         Enum.map(raw, &[34, Varint.put(byte_size(&1)), &1]),
         packed(42, Varint.encode_uint(s.start_counter_indexes)),
         packed(50, Varint.encode_uint(s.start_counters)),
         packed(58, Varint.encode_sint(s.counts))
       ])}
    end
  end

  @doc "Returns {client_ids, client_indexes, counter_changes, raw_ids}."
  def split_ids(bunch_ids) do
    # acc: client -> index, clients (reversed), index -> last counter, runs (reversed), raw (reversed)
    {_, clients, _, runs, raw} =
      Enum.reduce(bunch_ids, {%{}, [], %{}, [], []}, fn id,
                                                        {index_of, clients, last, runs, raw} ->
        case parse(id) do
          {client, counter} ->
            {index_of, clients, k} =
              case index_of do
                %{^client => k} ->
                  {index_of, clients, k}

                _ ->
                  {Map.put(index_of, client, map_size(index_of)), [client | clients],
                   map_size(index_of)}
              end

            change = counter - Map.get(last, k, 0)
            {index_of, clients, Map.put(last, k, counter), [{k + 1, change} | runs], raw}

          nil ->
            {index_of, clients, last, [{0, 0} | runs], [id | raw]}
        end
      end)

    {indexes, changes} = runs |> Enum.reverse() |> Enum.unzip()
    {Enum.reverse(clients), indexes, changes, Enum.reverse(raw)}
  end

  defp parse(id) do
    with [_, client, text] <- Regex.run(@id_pattern, id),
         counter = String.to_integer(text, 36),
         true <- Varint.safe_integer?(counter) do
      {client, counter}
    else
      _ -> nil
    end
  end

  defp packed(_tag, <<>>), do: []
  defp packed(tag, bytes), do: [tag, Varint.put(byte_size(bytes)), bytes]

  @impl true
  def load(bytes) when is_binary(bytes) do
    empty = %{
      clients: [],
      indexes: [],
      changes: [],
      raw: [],
      start_counter_indexes: [],
      start_counters: [],
      counts: []
    }

    with {:ok, m} <- fields(bytes, empty),
         {:ok, ids} <-
           join_ids(Enum.reverse(m.clients), m.indexes, m.changes, Enum.reverse(m.raw)) do
      cast(%{
        bunch_ids: ids,
        start_counter_indexes: m.start_counter_indexes,
        start_counters: m.start_counters,
        counts: m.counts
      })
    end
  end

  def load(_), do: :error

  @doc "Inverse of split_ids/1: {:ok, bunch_ids} or :error."
  def join_ids(clients, indexes, changes, raw) when length(indexes) == length(changes) do
    clients = List.to_tuple(clients)

    Enum.zip(indexes, changes)
    |> Enum.reduce_while({:ok, [], %{}, raw}, fn
      {0, _}, {:ok, ids, last, [id | raw]} ->
        {:cont, {:ok, [id | ids], last, raw}}

      {k, change}, {:ok, ids, last, raw} when k >= 1 and k <= tuple_size(clients) ->
        counter = Map.get(last, k, 0) + change

        if counter >= 0 and Varint.safe_integer?(counter) do
          id = elem(clients, k - 1) <> "_" <> String.downcase(Integer.to_string(counter, 36))
          {:cont, {:ok, [id | ids], Map.put(last, k, counter), raw}}
        else
          {:halt, :error}
        end

      _, _ ->
        {:halt, :error}
    end)
    |> case do
      {:ok, ids, _, []} -> {:ok, Enum.reverse(ids)}
      _ -> :error
    end
  end

  def join_ids(_, _, _, _), do: :error

  defp fields(<<>>, m), do: {:ok, m}

  defp fields(bytes, m) do
    with {:ok, tag, rest} <- Varint.take(bytes),
         2 <- Bitwise.band(tag, 7),
         {:ok, len, rest} <- Varint.take(rest),
         <<value::binary-size(len), rest::binary>> <- rest,
         {:ok, m} <- field(Bitwise.bsr(tag, 3), value, m) do
      fields(rest, m)
    else
      _ -> :error
    end
  end

  defp field(1, s, m), do: string(m, :clients, s)
  defp field(2, v, m), do: append(m, :indexes, Varint.decode_uint(v))
  defp field(3, v, m), do: append(m, :changes, Varint.decode_sint(v))
  defp field(4, s, m), do: string(m, :raw, s)
  defp field(5, v, m), do: append(m, :start_counter_indexes, Varint.decode_uint(v))
  defp field(6, v, m), do: append(m, :start_counters, Varint.decode_uint(v))
  defp field(7, v, m), do: append(m, :counts, Varint.decode_sint(v))
  defp field(_, _, m), do: {:ok, m}

  defp string(m, key, s),
    do: if(String.valid?(s), do: {:ok, Map.update!(m, key, &[s | &1])}, else: :error)

  defp append(m, key, {:ok, values}), do: {:ok, Map.update!(m, key, &(&1 ++ values))}
  defp append(_, _, :error), do: :error
end
