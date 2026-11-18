# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

- Clone with `--recurse-submodules` (or run `git submodule update --init`): the image is built from `keila/`, and an empty submodule fails `make` with a missing `mix.exs`.
- Never edit files inside `keila/`. An upstream change the package needs goes in `patches/` with a README entry saying what retires it; the submodule must stay at a clean upstream tag.
- `assets/*.exs` run through `bin/keila eval`, which loads `config/runtime.exs` and halts without `DB_URL`, `SECRET_KEY_BASE` and a `MAILER_SMTP_*` set. Give any new script `baseEnv(store)` from `startos/utils.ts`, not a hand-built env.
- Never regenerate `secretKeyBase` in `store.json`: Keila signs every unsubscribe and opt-in link already sent with it, and derives project ids from it.
