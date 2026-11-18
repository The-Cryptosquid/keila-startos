# Carried patches

Deltas applied to the `keila` submodule at build time, in filename order, by the
`patch -p1 --fuzz=0` step in the [Dockerfile](../Dockerfile). `--fuzz=0` is deliberate: after a
submodule bump a patch whose context has changed must fail the build, not apply anyway with the
mismatch ignored.

Each patch here forks the shipped release from the upstream tag the submodule names, and every
Keila bump has to re-validate it. Add one only when the alternative is shipping a known defect,
and record below what retires it.

## 0001 — configurable WebSocket `check_origin`

Keila's endpoint keeps Phoenix's default `check_origin: true`, which accepts a LiveView WebSocket
only when the browser's `Origin` matches `URL_HOST`. StartOS gives the service several addresses
(`.local`, IP, Tor, public domains) while `URL_HOST` can name only one, so on every other address
the admin UI loads but its live pages (campaign editor, contact import, forms) are refused with
HTTP 403. Verified against `pentacent/keila:0.40.2`: an upgrade with `Origin: https://<URL_HOST>`
returns 101, one with `Origin: https://keila.local` returns 403.

The patch adds a `CHECK_ORIGIN` environment variable to `config/runtime.exs`: a comma-separated
list in Phoenix's `check_origin` format (`//host`), applied only when set. The package passes every
hostname of the service's own interface. Unset, behaviour is unchanged.

**Retire when:** upstream exposes `check_origin` (or an equivalent allow-list) through its runtime
configuration and the submodule is bumped past that release.
