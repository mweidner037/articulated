# Minimal stand-in so the Ecto.Type modules compile without hex access.
defmodule Ecto.Type do
  @callback type() :: atom
  defmacro __using__(_) do
    quote do
      @behaviour Ecto.Type
    end
  end
end
