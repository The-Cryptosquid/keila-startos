# Updating the upstream version

Keila is built from source via the `keila/` git submodule (see `.gitmodules`) — upstream's
`pentacent/keila` image is amd64-only, so there is no `dockerTag` for it in the manifest. The
submodule commit is the version pin. PostgreSQL is a separate image, pinned by tag at
`images.postgres.source.dockerTag` in `startos/manifest/index.ts`.

## Determining the upstream version

- **Keila** (`pentacent/keila`, https://github.com/pentacent/keila)
  ```bash
  gh release view -R pentacent/keila --json tagName -q .tagName
  ```
  Compare against the tag checked out in the submodule:
  ```bash
  git -C keila describe --tags --exact-match HEAD
  ```
  Upstream tags each release twice (`v0.40.2` and `0.40.2`) on the same commit.
- **PostgreSQL** — stay on the major in the manifest (a new major needs a dump-and-restore
  migration, not a tag edit). Latest minor of that major:
  ```bash
  curl -s "https://hub.docker.com/v2/repositories/library/postgres/tags?page_size=100&name=17." \
    | jq -r '.results[].name' | grep -E '^17\.[0-9]+-alpine$' | sort -V | tail -1
  ```

## Applying the bump

- **Keila** — advance the submodule to the new tag and stage the gitlink:
  ```bash
  git -C keila fetch --tags
  git -C keila checkout v<new version>
  git add keila
  ```
  Then:
  - Compare upstream's `ops/Dockerfile` at the new tag with ours (`git -C keila diff v<old>..v<new> -- ops/Dockerfile`)
    and carry over base-image or build-step changes. Ours differs only in build context
    (`./keila/…`), the patch step, and pre-creating `/opt/app/uploads`.
  - Re-validate everything in `patches/` against the new tag. Check each patch's **Retire when**
    condition in [patches/README.md](patches/README.md); a patch upstream has absorbed is deleted
    along with its README section. The Dockerfile applies what remains with
    `patch -p1 --fuzz=0`, so a patch whose context changed fails the build — re-derive it, never
    loosen `--fuzz`.
  - Read the release notes for new required environment variables (`config/runtime.exs` in the
    submodule is the authority) and for changes to the functions `assets/admin.exs` and
    `assets/contacts.exs` call (`Keila.Auth.find_user_by_credentials`, `update_user_password`,
    `Keila.Contacts.import_csv`, `stream_project_contacts`).
- **PostgreSQL** — edit `images.postgres.source.dockerTag` in `startos/manifest/index.ts`.
