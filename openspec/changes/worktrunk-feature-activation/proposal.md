## Why

The worktrunk user config already pulls its weight on cold-start avoidance and Conventional-Commits message generation, but it leaves several built-in features unactivated even though their dependencies are already installed (delta for diff paging, Claude haiku for branch summaries). At the same time, the inline `[post-start].deps` hook is hard to read in logs because all package-manager phases share one anonymous output stream, and there are no shortcuts for the daily worktrunk operations the user runs by hand (`wt list --full --branches`, `wt switch --create -x claude`, tailing hook logs). Activating these features and wiring up a few aliases removes friction across every repo without per-project work.

## What Changes

- Enable `[list].summary = true` so `wt list` and the switch picker show LLM-generated branch summaries (uses the existing `[commit.generation]` Claude haiku setup).
- Set `[switch.picker].pager = "delta --paging=never"` to align the worktrunk picker with the user's existing delta-catppuccin diff styling.
- Add `.stryker-tmp/` to `[step.copy-ignored].exclude` (mutation-test artifacts observed in the monolab repo).
- Rename `[post-start].deps` → `[post-start].install-deps` and add `echo` phase markers inside the bash to make `wt config state logs get` output greppable. Keep single-hook + non-blocking semantics.
- Define global wt aliases:
    - `wtlog` — tail the log of a named hook (`wt config state logs get --hook=…`).
    - `wtci` — wrap `wt list --full --branches` for a quick CI-and-branches snapshot.
    - `mc` — wrap `wt merge` with a one-shot `WORKTRUNK_COMMIT__GENERATION__COMMAND` override that opens `$EDITOR` instead of calling Claude haiku, for when the user wants to handwrite the squash message.
- Add the shell alias `wsc` to `dot_zshrc.tmpl` → `wt switch --create -x claude`, the most-used pattern when starting a Claude session inside a fresh worktree.

## Capabilities

### New Capabilities

None. All scope refines existing specs.

### Modified Capabilities

- `worktrunk-config`: requirements gain `[list].summary`, `[switch.picker].pager`, the renamed `install-deps` hook with phased logging, the extended exclude list, and the three new wt aliases (`wtlog`, `wtci`, `mc`).
- `zsh-aliases`: requirements gain the `wsc` shell alias.

## Impact

- **Files**: `dot_config/worktrunk/config.toml` (rename hook, add three top-level keys, extend exclude, add `[aliases]` table), `dot_zshrc.tmpl` (one alias line in the worktrunk section).
- **Behavior**: existing worktrees keep working — the renamed hook is functionally equivalent to `deps`, only the log identifier and stdout markers change. New behavior surfaces only on next `wt switch --create` (summary, picker pager) and on demand (aliases).
- **Dependencies**: no new tooling — all consumers (`delta`, Claude haiku, jq) are already installed by other specs (`delta-catppuccin`, the existing `[commit.generation]`, etc.).
- **Out of scope**: lifting `[pre-remove].sync-claude` to global, agent status markers, and `.codex/` / `.opencode/` sync — covered by the separate `worktrunk-claude-integration` change. `.worktreeinclude` cleanup in this repo and project-level `wt.toml` for monolab are tracked separately.
