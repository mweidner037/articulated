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
