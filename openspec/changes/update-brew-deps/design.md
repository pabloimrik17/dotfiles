## Context

18 brew packages are outdated. The changelog audit (release notes for every version in each range, each finding verified against upstream source and this repo) surfaced the follow-ups in the proposal. Most edits are one-liners; the only sequencing-sensitive piece is the aoe XDG relocation, which mixes a git mv in the source tree, a live-state move on disk, and ignore-file path updates. This repo uses the dual-dir chezmoi layout (dev clone ≠ `~/.local/share/chezmoi`), so applying requires the source to be synced.

## Goals / Non-Goals

- **Goals**: upgrade all 18 packages; adopt every approved improvement; keep `chezmoi diff` clean/idempotent afterwards; keep the install script bash-3.2-compatible and idempotent.
- **Non-Goals**: pinning brew versions; migrating the pinned catppuccin/tmux plugin (v2.3.0 is latest); adopting rejected items (`gh discussion` allowlist, worktrunk `--safe-mode` flags, zsh `_as_if`); README/manual edits (post-implementation docs skills).

## Decisions

- **D1 — aoe XDG relocation order**: move live state (`mv ~/.agent-of-empires ~/.config/agent-of-empires`) BEFORE the renamed chezmoi source is applied. AoE prefers an existing XDG dir over the legacy dir; applying first would create the XDG dir and strand live state (sessions DB) in the legacy path. aoe must be quit first (sqlite WAL: `cockpit_events.db-wal`/`-shm`, `tui.active`). Alternative (symlink legacy→XDG) rejected: leaves the wart the change is meant to remove.
- **D2 — brew upgrade before apply**: aoe ≥1.10.1 is required for XDG support and ≥1.11.2/1.12.0 for the new theme/config keys; upgrade first, then relocate/apply. tmux 3.7b lands with the running 3.6b server still alive — restart the server (`tmux kill-server`) in the same window aoe is closed (aoe sessions live in tmux).
- **D3 — tmux fill via run-shell chain, not a plain `set`**: the fill attribute must land AFTER catppuccin.tmux runs (the plugin sets `message-style` itself). Extending the existing guarded `run -b` line keeps graceful degradation when the plugin is absent. `##{…}` escaping prevents run-shell from expanding the format before the plugin defines `@thm_overlay_0`; `-agF` appends and expands formats at set time.
- **D4 — worktrunk `[list]` columns replace full/summary**: since 0.63 explicit `columns` override the presets, making `full`/`summary` redundant for rendering. Column NAMES (not display headers) are required: `working-diff` (renders "HEAD±"), `branch-diff` (renders "main…±"). The summary column still depends on `[commit.generation]`, which stays. `wtci` alias (`wt list --full --branches`) remains valid and untouched.
- **D5 — gh skill idempotency via `--json`**: detection uses `gh skill list --agent claude-code --json skillName --jq '.[].skillName' | grep -qx "gh"` rather than parsing human output; the group lives inside the existing gh-extensions confirm gate, consistent with gh-dash/gh-enhance stanzas.
- **D6 — edit chezmoi source, never `wt config update`**: the migrator rewrites the live `~/.config/worktrunk/config.toml`, which would drift from the source. After the source edit, `wt config update` finding nothing to migrate is the verification.
- **D7 — no spec deltas for zshrc `gl` and squash-template**: neither is covered by an existing requirement; they are implementation details of this change (spec deltas would over-specify).

## Risks / Trade-offs

- [aoe state relocation while a session exists] → hard prerequisite: quit aoe + `tmux kill-server` first; verify no `tui.active` before moving.
- [oxfmt corrupting the moved modify_ script] → `.oxfmtignore` path updated in the same commit as the git mv (memory: oxfmt mangles chezmoi scripts).
- [`chezmoi apply` re-runs the full onchange script interactively] → expected; groups are confirmable and idempotent, only the gh-skill step is new work.
- [worktrunk columns render unexpectedly] → verified names against 0.65 docs; fallback is restoring `full`/`summary` (one-line revert).
- [auto-resume respawns Claude unattended] → opt-in was user-approved; only applies to ACP sessions and existing status_hooks still notify.

## Migration Plan

1. Repo edits (all files) → 2. `brew upgrade` (18) → 3. quit aoe, `tmux kill-server`, `mv` legacy state → 4. sync source + `chezmoi diff` + `chezmoi apply` → 5. restart tmux/aoe, verify → 6. docs skills → 7. commit + PR.
Rollback: config edits revert via git; aoe path reverts by moving the dir back (AoE falls back to legacy when no XDG dir exists); brew rollback not planned (no breaking changes found).

## Open Questions

None — all judgment calls resolved by the user (all 8 features approved).
