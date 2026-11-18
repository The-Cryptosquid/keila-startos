# Imports or exports a Keila project's contacts as CSV for the StartOS actions.
#
#   STARTOS_MODE=import|export STARTOS_PROJECT=<name or id, may be empty>
#   STARTOS_FILE=<absolute path>  STARTOS_ON_CONFLICT=replace|ignore (import only)
#   bin/keila eval 'Code.eval_file("/opt/startos/contacts.exs")'
#
# Prints exactly one line starting with `STARTOS_RESULT ` followed by JSON:
#   {"ok": true, "project": "<name>", "count": <n>}   or   {"ok": false, "error": "<message>"}
import Ecto.Query

result = fn map -> IO.puts("STARTOS_RESULT " <> Jason.encode!(map)) end

mode = System.fetch_env!("STARTOS_MODE")
wanted = System.get_env("STARTOS_PROJECT", "") |> String.trim()
file = System.fetch_env!("STARTOS_FILE")

{:ok, _, _} =
  Ecto.Migrator.with_repo(Keila.Repo, fn repo ->
    projects = repo.all(from(p in Keila.Projects.Project, order_by: [asc: p.name]))
    names = Enum.map_join(projects, ", ", & &1.name)

    project =
      cond do
        projects == [] ->
          {:error, "Keila has no projects yet. Create one in the Keila web interface first."}

        wanted == "" and length(projects) == 1 ->
          {:ok, hd(projects)}

        wanted == "" ->
          {:error, "Keila has several projects. Enter the name of one: #{names}"}

        true ->
          case Enum.filter(
                 projects,
                 &(&1.id == wanted or String.downcase(&1.name) == String.downcase(wanted))
               ) do
            [p] -> {:ok, p}
            [] -> {:error, "No project named \"#{wanted}\". Projects: #{names}"}
            _ -> {:error, "Several projects are named \"#{wanted}\". Use the project ID instead."}
          end
      end

    case {project, mode} do
      {{:error, message}, _} ->
        result.(%{ok: false, error: message})

      {{:ok, p}, "import"} ->
        on_conflict =
          if System.get_env("STARTOS_ON_CONFLICT") == "ignore", do: :ignore, else: :replace

        before = repo.aggregate(from(c in Keila.Contacts.Contact, where: c.project_id == ^p.id), :count)
        # Progress messages go to a throwaway process; only the outcome matters here.
        sink = spawn(fn -> :ok end)

        case Keila.Contacts.import_csv(p.id, file, notify: sink, on_conflict: on_conflict) do
          :ok ->
            total =
              repo.aggregate(from(c in Keila.Contacts.Contact, where: c.project_id == ^p.id), :count)

            result.(%{ok: true, project: p.name, count: total - before, total: total})

          {:error, reason} ->
            result.(%{ok: false, error: to_string(reason)})
        end

      {{:ok, p}, "export"} ->
        # Same columns, in the same order, as the export in Keila's web interface,
        # so the file imports back unchanged.
        header = ["Email", "First name", "Last name", "Data", "Status", "External ID"]

        {:ok, rows} =
          repo.transaction(fn ->
            Keila.Contacts.stream_project_contacts(p.id, [])
            |> Enum.map(fn c ->
              [
                c.email,
                c.first_name,
                c.last_name,
                if(is_nil(c.data), do: nil, else: Jason.encode!(c.data)),
                c.status,
                c.external_id
              ]
            end)
          end)

        File.write!(file, NimbleCSV.RFC4180.dump_to_iodata([header | rows]))
        result.(%{ok: true, project: p.name, count: length(rows)})
    end
  end)
