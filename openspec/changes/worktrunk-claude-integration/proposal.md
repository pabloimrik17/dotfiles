## Why

The dotfiles repo's project-level `.config/wt.toml` already solves a real problem worktrunk does not address natively: when a worktree is removed, the per-worktree `.claude/settings.local.json` (where Claude Code accumulates command-approval state during the session) gets dropped on the floor unless explicitly merged back to the base worktree. The custom `[pre-start].save-base` + `[pre-remove].sync-claude` pair handles this with a jq deep-merge. However, today this protection only applies inside this single repo. Every other repo where the user runs Claude Code — `monolab`, future projects, anything cloned tomorrow — silently loses approvals on `wt remove`. Lifting the pattern to the global user config closes that gap once and forever.

At the same time, worktrunk exposes a `wt config state marker set` API for emoji status markers that pair naturally with Claude Code's lifecycle hooks (`SessionStart`, `Stop`, `Notification`). Wiring `🤖` while Claude is working and `💬` while it waits gives the user a one-glance view of agent state across all branches via `wt list`. Finally, the user does manual one-off agent handoffs by typing out tmux + worktrunk commands — a small shell function makes that a single command.

## What Changes

- **Lift to global**: move `[pre-start].save-base` and `[pre-remove].sync-claude` from `.config/wt.toml` (project-level) to `dot_config/worktrunk/config.toml` (global, chezmoi-managed). Harden them so they are no-ops in any repo without `.claude/`, leaving non-Claude repos untouched.
- **Empty / remove project config**: after lift, `.config/wt.toml` in this dotfiles repo becomes redundant. Remove it (or shrink to a comment placeholder) so the project-level layer stays free for genuinely repo-specific hooks in the future.
- **Marker hooks**: extend `dot_claude/settings.json.tmpl` so the existing `SessionStart` hook also runs `wt config state marker set "🤖"`, and add `Stop` + `Notification` hooks that run `wt config state marker set "💬"`. All marker calls must guard on `wt` being on PATH and on being inside a git repo.
- **Handoff helper**: add a `wsh` zsh function that wraps `tmux new-session -d -s <branch> "wt switch --create <branch> -x claude -- '<prompt>'"` for one-shot agent handoffs into detached tmux sessions.
- **Documented as future improvement** (not in this change): extend the sync pattern to `.codex/` and `.opencode/`. Requires investigating which files in those directories accumulate per-worktree state worth merging back. Captured in `design.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `worktrunk-config`: gains a `[pre-start].save-base` and `[pre-remove].sync-claude` requirement at the global user-config level, with `.claude/`-existence guards.
- `claude-hooks`: gains `SessionStart` marker (🤖), `Stop` marker (💬), and `Notification` marker (💬) requirements. Existing `bd prime` hooks remain untouched (the new commands are additional entries in the same `hooks` arrays).
- `zsh-aliases`: gains a `wsh` shell function for detached worktree+claude handoff via tmux.

## Impact

- **Files**: `dot_config/worktrunk/config.toml` (add `[pre-start].save-base` and `[pre-remove].sync-claude`), `dot_claude/settings.json.tmpl` (add marker commands to the existing `SessionStart` hook block, add new `Stop` + `Notification` blocks), `dot_zshrc.tmpl` (add `wsh` function next to the `wsc` alias from change A), and removal of `.config/wt.toml` from the dotfiles repo root.
- **Behavior**: any repo that has `.claude/` will now save its base worktree path on `pre-start` and sync `settings.local.json` back on `pre-remove`. Repos without `.claude/` are unaffected. Markers appear in `wt list` and the switch picker for any branch where Claude has run during the lifetime of the marker.
- **Dependencies**: `jq` (already in the brew packages list per existing claude-hooks setup) and `tmux` (already managed by `tmux-config`/`tmux-catppuccin` specs).
- **Out of scope**: `.codex/` and `.opencode/` sync (future improvement, design-only), `worktrunk-claude-plugin` spec changes (the plugin enablement requirement is unchanged).
- **Coordination with change A** (`worktrunk-feature-activation`): the `wsh` handoff function is the detached counterpart to the `wsc` foreground alias added in A. The two changes are independent (either may apply first), but `wsh` is most useful once `wsc` is also available.
