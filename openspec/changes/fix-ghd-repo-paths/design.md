## Context

gh-dash is configured at `dot_config/gh-dash/config.yml`. The current `repoPaths` uses `"*/*"` which is not a supported pattern — gh-dash only supports exact match (`owner/repo`), owner wildcard (`owner/*`), or template (`:owner/:repo`). This causes `{{.RepoPath}}` to resolve empty, triggering `missingkey=error` in Go templates.

Keybindings currently use `tmux new-window` which fails silently outside tmux sessions. All repos live under `~/WebstormProjects/<repo>`.

## Goals / Non-Goals

**Goals:**

- Fix `repoPaths` so `{{.RepoPath}}` resolves correctly for all repos
- Fix existing tmux keybindings (currently broken due to empty RepoPath)
- Add direct execution (non-tmux) variants as alternatives
- Maintain both tmux and direct variants so user can evaluate which workflow they prefer
- Add `name` to all keybindings for readable help menu

**Non-Goals:**

- Conditional tmux detection (auto-switching between modes)
- Supporting repos outside `~/WebstormProjects/`

## Decisions

### Use `:owner/:repo` template pattern for repoPaths

The `:owner/:repo` template pattern maps to `~/WebstormProjects/:repo`. This drops the owner from the local path since repos are cloned flat under `~/WebstormProjects/`. Alternatives considered:

- Owner wildcard (`pabloimrik17/*`) — only works for one owner, breaks for org repos
- Exact match per repo — doesn't scale

### Dual keybinding approach: direct + tmux

Both execution modes have trade-offs worth evaluating:

- **Direct execution** (`C`/`W`): gh-dash suspends TUI, runs command, resumes on exit. Always works, simpler. Blocks the TUI while command runs.
- **Tmux** (`R`/`E`): Opens command in a side-by-side tmux pane (`split-window -h`). Non-blocking — gh-dash stays visible alongside the command. Requires active tmux session.

Keeping both lets the user compare workflows and remove the variant they don't prefer later.

### Use `wt -C {{.RepoPath}}` for worktree commands

Since gh-dash doesn't cd into the repo before executing commands, pass `-C {{.RepoPath}}` to worktrunk so it operates in the correct repo context.

## Risks / Trade-offs

- [Direct execution blocks TUI] → Acceptable for interactive tools (lazygit, claude). User returns to gh-dash when done.
- [Tmux variants fail outside tmux] → Expected. User uses direct variants when not in tmux.
- [4 PR keybindings instead of 2] → Temporary duplication while evaluating. User will prune later.
- [`:repo` without `:owner` in path] → If two repos from different owners have the same name, path collision. Unlikely given current usage.
