## Context

Today, two separate forces converge in `.config/wt.toml` (project-level, in this dotfiles repo):

1. `[pre-start].save-base` writes `{{ base_worktree_path }}` to `.claude/.worktree-base`.
2. `[pre-remove].sync-claude` reads that file and uses `jq` to deep-merge `.claude/settings.local.json` from the worktree back into the base worktree's copy, so Claude Code permission approvals survive `wt remove`.

This pattern is original work — the worktrunk tips page does not mention any "copy out" / sync-on-remove inverse of `wt step copy-ignored`, and the docs explicitly state none exists. Today the protection applies only inside this single repo. Any other repo (`monolab` foremost) where the user runs Claude in a worktree will silently lose `settings.local.json` accumulations on `wt remove`.

Separately: the user occasionally hands off a long-running agent task to a fresh worktree by typing out a tmux command followed by `wt switch --create … --execute=claude -- …`. This is a candidate for a one-line shell function.

> **Markers — already covered by the worktrunk plugin.** An earlier draft of this change wired `wt config state marker set "🤖"/"💬"` from `dot_claude/settings.json.tmpl` lifecycle hooks. Inspection of the installed `worktrunk@worktrunk` Claude Code plugin (`~/.claude/plugins/cache/worktrunk/.../hooks.json`) revealed it already ships `UserPromptSubmit`→🤖, `Notification`→💬, and `SessionEnd`→clear hooks. Adding parallel hooks in our config would duplicate `Notification` and use a less precise trigger (`SessionStart`-once vs the plugin's per-prompt 🤖). Decision: delegate marker behaviour entirely to the plugin and drop the marker work from this change.

## Goals / Non-Goals

**Goals:**

- Make `.claude/settings.local.json` survive `wt remove` in every repo that uses Claude Code, not just this dotfiles repo.
- Provide a single-command path for detached agent handoff (tmux + worktrunk + claude).
- Keep the project-level `.config/wt.toml` of this repo from drifting back toward duplicating global config — explicitly remove it once redundant.

**Non-Goals:**

- Sync of `.codex/` and `.opencode/` settings on remove. Captured as a future improvement; requires investigating which files in those directories carry per-worktree state worth merging back, and whether jq deep-merge is appropriate (those directories may use formats other than JSON).
- Changes to the `worktrunk-claude-plugin` enablement spec — the plugin itself is unchanged.
- `wt list` agent-state markers (🤖/💬). Already implemented by the `worktrunk@worktrunk` plugin's `UserPromptSubmit`/`Notification`/`SessionEnd` hooks; no work needed in this change.
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

### Decision: delegate `wt list` agent markers to the worktrunk plugin

**Rationale.** The installed `worktrunk@worktrunk` Claude Code plugin already wires markers from agent lifecycle: `UserPromptSubmit`→🤖, `Notification`→💬, `SessionEnd`→clear. Adding our own `SessionStart`/`Stop`/`Notification` hooks in `dot_claude/settings.json.tmpl` would (a) duplicate `Notification`, (b) use a strictly worse 🤖 trigger (`SessionStart` fires once at startup; the plugin's `UserPromptSubmit` fires on every user message, which more accurately tracks "Claude is currently working"), and (c) split ownership of the same signal across two places.

The plugin lacks a `Stop`-fires-💬 hook, which means after Claude finishes a turn the marker stays on 🤖 until the next `Notification` or `SessionEnd`. This is a cosmetic gap, not a correctness gap: the user's primary "is Claude waiting on me?" signal is `Notification` (permission prompt) which the plugin already covers. Acceptable trade-off for keeping marker logic in one place.

**Alternatives considered.**

- _Add only `Stop`-fires-💬 and skip the rest._ Tighter overlap, but still puts marker logic in two configs. Rejected to keep ownership clean. If the gap becomes annoying, raise it upstream in the worktrunk plugin instead of patching around it locally.
- _Wire all three hooks ourselves and ignore the plugin._ Would require disabling the plugin's hooks (no clean mechanism) or accepting duplicate `Notification` calls. Rejected.

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
- **Risk**: `wsh` with a prompt containing single quotes will break the inner shell tokenization of `tmux new-session -d -s <name> "<command>"`. → **Mitigation**: document the single-quote limitation in the function or escape via printf. Initial scope: keep the simple form; document; iterate if it bites.
- **Trade-off**: removing `.config/wt.toml` from this dotfiles repo is a destructive cleanup. → Accepted because the file's only contents are being lifted to global; removal is the natural conclusion of the lift, not a separate destructive act. Reversible via git.
- **Trade-off**: relying on the worktrunk plugin for markers means we have no `Stop`-fires-💬 hook — after a turn ends the marker stays on 🤖 until the next notification or session end. → Accepted as cosmetic; if it becomes annoying, file upstream against the worktrunk plugin.

## Migration Plan

1. Add `[pre-start].save-base` and `[pre-remove].sync-claude` to `dot_config/worktrunk/config.toml`, with the `.claude/`-existence guard on save-base.
2. Add the `wsh` function to `dot_zshrc.tmpl` next to `wsc`.
3. Run `chezmoi apply`. Inspect the diffs for `~/.config/worktrunk/config.toml` and `~/.zshrc`.
4. Smoke-test the lifted hook: in a Claude-using repo (e.g. monolab) create a worktree with `wsc`, accept a permission prompt to mutate `.claude/settings.local.json`, then `wt remove` and verify the base worktree's `settings.local.json` reflects the merged change.
5. Smoke-test handoff: `wsh test-handoff "list the largest files in this repo"`, attach via `tmux attach -t test-handoff`, observe Claude running.
6. Remove `.config/wt.toml` from the dotfiles repo root (`git rm`).

**Rollback.** Revert the modified files via git, run `chezmoi apply`. The lifted hooks become inactive once the global config no longer contains them; the function is removed from `~/.zshrc` on next sourcing.

## Open Questions

- How does the lifted `sync-claude` interact when the user runs `wt remove` from outside the worktree (e.g. `wt remove <name>` from the base)? The current implementation reads `.claude/.worktree-base` _from the worktree being removed_ — verify worktrunk runs `pre-remove` with that as cwd, not from where the user invoked the command.
