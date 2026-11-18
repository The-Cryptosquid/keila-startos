# Applies the admin password stored by StartOS to Keila's root account.
#
# Run by the `apply-admin-password` oneshot before Keila starts:
#   bin/keila eval 'Code.eval_file("/opt/startos/admin.exs")'
#
# The root account is the first user Keila created (from KEILA_USER/KEILA_PASSWORD on
# first start). On a database Keila has not initialized yet there is nothing to do: the
# first start seeds the account with KEILA_PASSWORD itself. When the stored password
# already signs in, nothing is written, so other sessions are left alone.
import Ecto.Query

password = System.fetch_env!("KEILA_PASSWORD")

{:ok, _, _} =
  Ecto.Migrator.with_repo(Keila.Repo, fn repo ->
    %{rows: [[users_table]]} = Ecto.Adapters.SQL.query!(repo, "SELECT to_regclass('users')::text")

    root =
      users_table &&
        repo.one(
          from(u in Keila.Auth.User, order_by: [asc: u.inserted_at, asc: u.id], limit: 1)
        )

    cond do
      is_nil(root) ->
        IO.puts("STARTOS: no Keila account yet; the first start creates it with the stored password")

      match?(
        {:ok, _},
        Keila.Auth.find_user_by_credentials(%{"email" => root.email, "password" => password})
      ) ->
        IO.puts("STARTOS: admin password for #{root.email} is current")

      true ->
        {:ok, _} = Keila.Auth.update_user_password(root.id, %{password: password})
        IO.puts("STARTOS: applied the stored admin password to #{root.email}")
    end
  end)
