## Why

AoE does not delete discarded sessions: it moves them to the Trash, keeping transcript and worktree until retention expires. That retention is 30 days today and comes from AoE's *schema default* — the dotfiles do not pin it, so garbage from dead sessions occupies disk for a whole month and the value can change under our feet on any release. We want 10 days, pinned deliberately.

## What Changes

- Add `session.trash_retention_days = 10` to the `MANAGED` list in `dot_config/private_agent-of-empires/modify_private_config.toml`, alongside the other `[session]` keys.
- Fix the `agent-manager` spec's **Purpose** line, which still names `~/.agent-of-empires/config.toml` (legacy) when the real path — and what chezmoi manages — is `~/.config/agent-of-empires/config.toml`. The location *requirement* was already repointed to the XDG path in `711fb2a` (#176); `openspec archive` only rewrites the `## Requirements` section, so Purpose kept the legacy path and no delta section can reach it. AoE ≥ 1.10.1 reads the XDG path in preference to the legacy one (verified through 1.14.0, the installed version; see `design.md`); the legacy path does not even exist on the machine.
- Document the retention in the AoE table of `docs/manual.html`, next to `confirm_delete`.

Not a 30 → 10 on something already managed: the `trash_retention_days = 30` that appears in the file today is default expansion written by AoE's writeback. This **adds** a key to `MANAGED`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-manager`: trash retention becomes a managed knob pinned to 10 days. The config-location requirement also gains a scenario recording how `aoe settings explain` resolves managed keys — a value equal to the schema default still reports `source: schema default` without implying the file is unread — and the one-shot bootstrap requirement that verified the path at first install is removed as satisfied. Not a rename: the baseline already carries the XDG requirement name.

## Impact

- `dot_config/private_agent-of-empires/modify_private_config.toml` — one new entry in `MANAGED`.
- `docs/manual.html` — one row in the AoE configuration table.
- `openspec/specs/agent-manager/spec.md` — via delta, plus a direct edit to the Purpose line (out of reach of every delta section).
- Runtime effect: trashed sessions older than 10 days are purged on AoE's next sweep. This already took effect — the change has been live since #170 (`e6528ab`), so the pre-apply Trash review window (`tasks.md`) is closed and whatever had expired is gone.
- No new dependencies: the merge still runs on `uv run --with tomlkit`.
