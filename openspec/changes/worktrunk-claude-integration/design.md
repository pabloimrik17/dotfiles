## Context

Today, two separate forces converge in `.config/wt.toml` (project-level, in this dotfiles repo):

1. `[pre-start].save-base` writes `{{ base_worktree_path }}` to `.claude/.worktree-base`.
2. `[pre-remove].sync-claude` reads that file and uses `jq` to deep-merge `.claude/settings.local.json` from the worktree back into the base worktree's copy, so Claude Code permission approvals survive `wt remove`.

This pattern is original work — the worktrunk tips page does not mention any "copy out" / sync-on-remove inverse of `wt step copy-ignored`, and the docs explicitly state none exists. Today the protection applies only inside this single repo. Any other repo (`monolab` foremost) where the user runs Claude in a worktree will silently lose `settings.local.json` accumulations on `wt remove`.

Separately, worktrunk exposes `wt config state marker set <emoji>` for branch-scoped status markers that surface in `wt list` and the switch picker. The user runs Claude Code heavily across multiple worktrees in parallel, so a `🤖` (working) / `💬` (waiting for input) marker driven by Claude Code's lifecycle hooks would give a one-glance overview without needing to check each tmux pane or terminal tab.

A third minor friction: the user occasionally hands off a long-running agent task to a fresh worktree by typing out a tmux command followed by `wt switch --create … -x claude -- …`. This is a candidate for a one-line shell function.

## Goals / Non-Goals

**Goals:**

- Make `.claude/settings.local.json` survive `wt remove` in every repo that uses Claude Code, not just this dotfiles repo.
- Show agent state per branch in `wt list` via emoji markers driven by Claude Code hooks.
- Provide a single-command path for detached agent handoff (tmux + worktrunk + claude).
- Keep the project-level `.config/wt.toml` of this repo from drifting back toward duplicating global config — explicitly remove it once redundant.

**Non-Goals:**

- Sync of `.codex/` and `.opencode/` settings on remove. Captured as a future improvement; requires investigating which files in those directories carry per-worktree state worth merging back, and whether jq deep-merge is appropriate (those directories may use formats other than JSON).
- Changes to the `worktrunk-claude-plugin` enablement spec — the plugin itself is unchanged.
- Status-marker semantics beyond `🤖` / `💬`. No multi-state machine, no per-tool granularity, no log-file integration.
- Replacing the `wt step copy-ignored` pre-start hook (already on global, untouched here).

## Decisions

### Decision: lift `save-base` + `sync-claude` to global, with `.claude/` existence guards

**Rationale.** The two hooks are pure bash, reference only `.claude/`-relative paths, and the sync-claude body already short-circuits cleanly: `[ -n "$BASE_WT" ] && [ -f .claude/settings.local.json ] && [ -d "$BASE_WT" ]`. The only hook that needs hardening is `save-base`, which today writes unconditionally — `[ -d .claude ] && echo … > .claude/.worktree-base || true`. With those two adjustments, both hooks become safe to run in every repo: they no-op outside Claude projects and sync correctly inside them.

**Alternatives considered.**

- _Keep project-level only._ Forces every Claude-using repo to copy the same TOML stanza into its own `.config/wt.toml`. Drift inevitable. Rejected.
- _Move only `sync-claude`, keep `save-base` project-level._ The two hooks are coupled by the `.claude/.worktree-base` file. Splitting them across config layers is fragile.

### Decision: empty / remove `.config/wt.toml` from this repo after lift

**Rationale.** The current project config holds _only_ the two hooks being lifted. After lift, the file is redundant. Leaving it in place creates the illusion that something repo-specific is still happening and risks future contributors adding to the wrong layer. Removing the file is safer than leaving an empty placeholder.

**Alternative.** Replace the file content with a single comment such as `# Project-specific worktrunk overrides. None at this time.`. Either is acceptable; recommendation is removal because the lookup convention is "no file ⇒ inherit global", which is the correct mental model.

### Decision: emit markers from `dot_claude/settings.json.tmpl` hooks, not from worktrunk hooks

**Rationale.** The marker is a Claude-state signal, not a worktree-state signal. It must update on Claude lifecycle (`SessionStart`, `Stop`, `Notification`), which only Claude Code emits. Coupling the markers to Claude Code's hook system keeps the responsibility correctly split: worktrunk owns worktree lifecycle, Claude Code owns agent lifecycle, and they meet via the `wt config state marker set` API.

**Hook mapping:**

| Claude event   | Marker | Reasoning                                             |
| -------------- | ------ | ----------------------------------------------------- |
| `SessionStart` | `🤖`   | Agent is now active in this branch                    |
| `Stop`         | `💬`   | Turn complete; user input is the next step            |
| `Notification` | `💬`   | Claude is asking for input or hit a permission prompt |

The existing `SessionStart` hook block already runs `bd prime`. The marker command is added as a sibling in the same hook array. New `Stop` and `Notification` arrays are introduced.

**Guarding.** Each marker command must:

1. Skip silently if `wt` is not on PATH (`command -v wt >/dev/null 2>&1`).
2. Skip silently if the current directory is not inside a git repo (`git rev-parse --git-dir >/dev/null 2>&1`).
3. Never block the hook (`|| true`) — a marker failure must not break Claude.

### Decision: `wsh` is a zsh function, not a wt alias

**Rationale.** The handoff body needs to spawn `tmux new-session -d -s <branch> "<command>"`, where `<command>` is itself a worktrunk invocation. Doing this through worktrunk's own `[aliases]` would require nested template rendering with `tmux` semantics worktrunk does not provide. A small zsh function — same pattern as the other functions already living in `dot_zshrc.tmpl` — is the right tool.

**Signature.**

```zsh
wsh() {
  local branch="$1"; shift
  local prompt="${*:-}"
  if [ -z "$branch" ]; then echo "usage: wsh <branch> [initial prompt]" >&2; return 2; fi
  if [ -n "$prompt" ]; then
    tmux new-session -d -s "$branch" "wt switch --create '$branch' -x claude -- '$prompt'"
  else
    tmux new-session -d -s "$branch" "wt switch --create '$branch' -x claude"
  fi
  echo "✓ Handoff to '$branch' — attach with: tmux attach -t '$branch'"
}
```

**Alternatives considered.**

- _Zellij instead of tmux._ The user's stack is Ghostty + tmux (per `tmux-config` and `tmux-catppuccin` specs), not Zellij. Tmux is the correct primitive.
- _Foreground spawn (no `-d`)._ Would block the calling shell — exactly what `wsc` already does. The handoff use case is "I want this to run elsewhere; give me my prompt back."

### Decision: defer `.codex/` and `.opencode/` sync as a future improvement

**Rationale.** The user runs three agent harnesses (Claude Code, Codex, OpenCode), and all three create per-worktree directories. However, jq deep-merge is only correct for JSON-structured settings, and we have not yet inspected what file formats `.codex/` and `.opencode/` accumulate, nor whether the same "approvals" semantic exists. Investigating that would expand the change beyond the marker + lift scope. Captured here as a follow-up: confirm shapes, then either extend the same hook with a per-agent loop or add sibling hooks per harness.

## Risks / Trade-offs

- **Risk**: lifted `[pre-start].save-base` writes `.claude/.worktree-base` in every Claude-using repo. If `.claude/` is committed by mistake (unusual but possible), the file lands in git status. → **Mitigation**: `.gitignore_global` (managed via the `git-config` capability) already covers `.claude/` patterns; the project's own `.gitignore` typically does too. The file is a single line and easy to add explicitly if a project doesn't gitignore it.
- **Risk**: marker commands run on every Claude session start, every turn end, and every notification. On a slow filesystem or with `wt` invocations queued behind heavy git operations, the hook latency adds up. → **Mitigation**: `wt config state marker set` is a small JSON-file write — sub-50 ms on local disk. Each command is suffixed with `|| true` so failures never block. If contention surfaces, extend the guard to include a `& disown` background fork.
- **Risk**: `wsh` with a prompt containing single quotes will break the inner shell tokenization of `tmux new-session -d -s <name> "<command>"`. → **Mitigation**: document the single-quote limitation in the function or escape via printf. Initial scope: keep the simple form; document; iterate if it bites.
- **Trade-off**: `Notification` marker overlaps with `Stop` marker (both set `💬`). Could be argued they should differ (`Stop` = "turn ended", `Notification` = "permission prompt blocking"). → Accepted as identical for v1; the distinction does not justify a third emoji that the user has to learn. The visible behavior is "any time Claude is not actively working, the marker is `💬`".
- **Trade-off**: removing `.config/wt.toml` from this dotfiles repo is a destructive cleanup. → Accepted because the file's only contents are being lifted to global; removal is the natural conclusion of the lift, not a separate destructive act. Reversible via git.

## Migration Plan

1. Add `[pre-start].save-base` and `[pre-remove].sync-claude` to `dot_config/worktrunk/config.toml`, with the `.claude/`-existence guard on save-base.
2. Update `dot_claude/settings.json.tmpl`:
    - Append a marker command to the existing `SessionStart` hook block.
    - Add new `Stop` and `Notification` hook blocks with their marker commands.
3. Add the `wsh` function to `dot_zshrc.tmpl` next to `wsc`.
4. Run `chezmoi apply`. Inspect the diffs for `~/.config/worktrunk/config.toml`, `~/.claude/settings.json`, and `~/.zshrc`.
5. Smoke-test the lifted hook: in a Claude-using repo (e.g. monolab) create a worktree with `wsc`, accept a permission prompt to mutate `.claude/settings.local.json`, then `wt remove` and verify the base worktree's `settings.local.json` reflects the merged change.
6. Smoke-test markers: open Claude in a worktree, observe `🤖` in `wt list`; let the turn finish, observe `💬`.
7. Smoke-test handoff: `wsh test-handoff "list the largest files in this repo"`, attach via `tmux attach -t test-handoff`, observe Claude running.
8. Remove `.config/wt.toml` from the dotfiles repo root (`git rm`).

**Rollback.** Revert all four files via git, run `chezmoi apply`. The lifted hooks become inactive once the global config no longer contains them; the marker hooks disappear; the function is removed from `~/.zshrc` on next sourcing.

## Open Questions

- Does worktrunk's `wt config state marker set` have a per-branch variant when invoked from inside a worktree without a `--branch` flag, or does it always target the current branch? Confirm at implementation; if global it would mean every Claude session contaminates the most-recently-checked-out branch's marker. Quick smoke test resolves this.
- Should the `Notification` hook also include a non-marker action (e.g. desktop notification)? Out of this change's scope but flagged for a future iteration.
- How does the lifted `sync-claude` interact when the user runs `wt remove` from outside the worktree (e.g. `wt remove <name>` from the base)? The current implementation reads `.claude/.worktree-base` _from the worktree being removed_ — verify worktrunk runs `pre-remove` with that as cwd, not from where the user invoked the command.
