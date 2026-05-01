## Why

The dotfiles repo's project-level `.config/wt.toml` already solves a real problem worktrunk does not address natively: when a worktree is removed, the per-worktree `.claude/settings.local.json` (where Claude Code accumulates command-approval state during the session) gets dropped on the floor unless explicitly merged back to the base worktree. The custom `[pre-start].save-base` + `[pre-remove].sync-claude` pair handles this with a jq deep-merge. However, today this protection only applies inside this single repo. Every other repo where the user runs Claude Code — `monolab`, future projects, anything cloned tomorrow — silently loses approvals on `wt remove`. Lifting the pattern to the global user config closes that gap once and forever.

The user also does manual one-off agent handoffs by typing out tmux + worktrunk commands — a small shell function makes that a single command.

> **Markers (out of scope):** `wt list` agent-state markers (🤖/💬) are already provided by the official `worktrunk@worktrunk` Claude Code plugin (UserPromptSubmit/Notification/SessionEnd hooks shipped with the plugin). Adding parallel hooks in this dotfiles config would duplicate or conflict with the plugin, so this change does **not** wire them itself.

## What Changes

- **Lift to global**: move `[pre-start].save-base` and `[pre-remove].sync-claude` from `.config/wt.toml` (project-level) to `dot_config/worktrunk/config.toml` (global, chezmoi-managed). Harden them so they are no-ops in any repo without `.claude/`, leaving non-Claude repos untouched.
- **Empty / remove project config**: after lift, `.config/wt.toml` in this dotfiles repo becomes redundant. Remove it (or shrink to a comment placeholder) so the project-level layer stays free for genuinely repo-specific hooks in the future.
- **Handoff helper**: add a `wsh` zsh function that wraps `tmux new-session -d -s <branch> "wt switch --create <branch> --execute=claude -- '<prompt>'"` for one-shot agent handoffs into detached tmux sessions.
- **Documented as future improvement** (not in this change): extend the sync pattern to `.codex/` and `.opencode/`. Requires investigating which files in those directories accumulate per-worktree state worth merging back. Captured in `design.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `worktrunk-config`: gains a `[pre-start].save-base` and `[pre-remove].sync-claude` requirement at the global user-config level, with `.claude/`-existence guards.
- `zsh-aliases`: gains a `wsh` shell function for detached worktree+claude handoff via tmux.

## Impact

- **Files**: `dot_config/worktrunk/config.toml` (add `[pre-start].save-base` and `[pre-remove].sync-claude`), `dot_zshrc.tmpl` (add `wsh` function next to the `wsc` alias from change A), and removal of `.config/wt.toml` from the dotfiles repo root.
- **Behavior**: any repo that has `.claude/` will now save its base worktree path on `pre-start` and sync `settings.local.json` back on `pre-remove`. Repos without `.claude/` are unaffected.
- **Dependencies**: `jq` (already in the brew packages list per existing claude-hooks setup) and `tmux` (already managed by `tmux-config`/`tmux-catppuccin` specs).
- **Out of scope**: `.codex/` and `.opencode/` sync (future improvement, design-only); `wt list` markers (delegated to the `worktrunk@worktrunk` plugin); `worktrunk-claude-plugin` spec changes (the plugin enablement requirement is unchanged).
- **Coordination with change A** (`worktrunk-feature-activation`): the `wsh` handoff function is the detached counterpart to the `wsc` foreground alias added in A. The two changes are independent (either may apply first), but `wsh` is most useful once `wsc` is also available.
