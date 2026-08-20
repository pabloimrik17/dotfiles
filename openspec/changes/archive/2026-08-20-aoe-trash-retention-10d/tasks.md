## 1. Safeguard before applying

- [x] 1.1 Open AoE's Trash section and restore any session older than 10 days worth keeping — applying makes the next sweep purge them irreversibly (design.md, Risks) — overtaken by events, never performed: the value has been live since the ~12 Aug apply of PR #170 (`e6528ab`; `config.toml` mtime 12 Aug 15:19, `trash_retention_days = 10` at line 76, resolved by AoE as `user value`), so the safeguard window closed ~8 days before this verification. Whether any sweep actually purged a session is unverified — the config only made it permissible; AoE's trash state was deliberately not inspected

## 2. Implementation

- [x] 2.1 Add `(("session", "trash_retention_days"), 10, False),` to the `MANAGED` list in `dot_config/private_agent-of-empires/modify_private_config.toml`, alongside the other `[session]` keys (`default_tool`, `agent_status_hooks`, `confirm_delete`)
- [x] 2.2 Comment the entry in one line: retention is pinned by the dotfiles, AoE's schema default is 30

## 3. Verification (pre-merge, against the development clone)

- [x] 3.1 `chezmoi diff --source . ~/.config/agent-of-empires/config.toml` → confirm the only change is `trash_retention_days = 30` → `10`, with no drift in AoE's writeback tables (`[app_state]`, `[web]`, `[cockpit]`, `[logging]`) — passed (diff empty), but two of the four named tables were already gone: `[cockpit]` became `[acp]` in AoE 1.11.0 and `[app_state]` moved out to a sibling `state.toml` in 1.13.0, so in practice the drift check covered `[web]`, `[logging]` and `[acp]`
- [x] 3.2 Confirm the file is still ignored by oxfmt: `dot_config/private_agent-of-empires/modify_private_config.toml` is already in `.oxfmtignore` — verify a lint-staged commit does not reformat it

## 4. Apply and verify on the machine

- [x] 4.1 After merging, sync the real source **without applying**: `chezmoi update --apply=false` (or `chezmoi git pull -- --autostash --rebase`) — `chezmoi apply` reads from `~/.local/share/chezmoi`, not from this clone. A bare `chezmoi update` applies by default and would purge the trash before the 1.1 review — the real source (HEAD `9d0bfc3`, 8 Aug) carries the MANAGED entry at `dot_config/private_agent-of-empires/modify_private_config.toml:48`; it lags main by 3 commits for unrelated changes but is already past `e6528ab`, so it is synced for this change's content. No sync or apply was run to close it: applying from a main-based worktree reverts 5 files on this machine
- [x] 4.2 `chezmoi apply` and check `~/.config/agent-of-empires/config.toml` keeps `0600` permissions — `ls -l` → `-rw-------`, mtime 12 Aug 15:19 (materialized by the ~12 Aug apply of #170; no apply was run during this verification)
- [x] 4.3 `aoe settings explain session.trash_retention_days` → must return `10` with `source: user value`. If it still says `schema default`, design.md's D3/D4 conclusion about the path is false: stop and reopen the investigation before closing the change — passes: `= 10`, `source: user value` (candidates: user value 10, schema default 30). Re-verified on aoe 1.14.0, two minors past the 1.12.0 D3/D4 were written against, and they hold: legacy `~/.agent-of-empires/` absent, XDG path present at `0600`, and a key differing from the schema default reports `source: user value`. D3/D4 confirmed, no reopening needed
- [x] 4.4 Re-run `chezmoi diff` → must come out empty (check-then-set makes the re-apply idempotent) — empty from both the real source and `--source .`, which proves the merge script's check-then-set idempotence end to end (chezmoi executed it, `uv`+`tomlkit` resolved, output byte-identical)

## 5. Documentation

- [x] 5.1 Add a `Trash retention` row to the AoE configuration table in `docs/manual.html`, alongside `Delete guard` (`confirm_delete`)
- [x] 5.2 Update DOT-38 in Linear: it asked for 15 days, the implemented value is 10
