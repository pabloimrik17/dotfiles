## Context

See proposal.md — Why. What shapes the approach here:

- `run_onchange_install-packages.sh.tmpl:325-363` already has a confirmable gh CLI extensions group with an established pattern: `gh extension list | grep -q` guard, `info`/`error` reporting, and a structured `gh skill list --json` check for the `cli/cli` skill.
- `dot_zshrc.tmpl:373` prepends `$HOME/.local/bin` to PATH. Anything dropped there wins over Homebrew binaries in every context, interactive or not.
- `dot_zshrc.tmpl:358` runs `_update_extra_step "gh extensions" gh extension upgrade --all`, so extensions self-update.
- `dot_gitconfig.tmpl:26-27` sets `rerere.enabled = true` globally.
- The daily workflow is worktree-per-branch via worktrunk (`wt`), with parallel Claude Code sessions per worktree. `gh-stack` assumes a single checkout with in-place branch switching. These two models do not compose for free — see the worktree decision below.

`gh-stack` is v0.1.0 (2026-07-29), MIT, Go, distributed as precompiled binaries through `gh extension install`. There is no Homebrew formula.

## Goals / Non-Goals

**Goals:**

- Install the extension and its agent skill through the existing group, with no new install machinery
- One short, memorable command name that matches upstream documentation
- Leave the worktree workflow untouched, and record what we learned so the question can be answered later with evidence rather than re-derived

**Non-Goals:**

- Choosing between the worktrunk model and the gh-stack model, or changing any `wt` hook or alias
- Wiring stacks into `gh-dash`, lazygit, or television
- Replacing `commit-push-pr` as the default path to a PR
- Pinning or vendoring the extension

## Decisions

### Alias name: `gs`, not `ghs`

`gs` breaks the naming pattern of the GitHub alias block (`ghpr`, `ghpv`, `ghpl`, `ghd`, `ghe`), which was the argument for `ghs`. It still wins:

- **Upstream default.** `gh stack alias` installs `gs` by default (`cmd/alias.go:17`, `defaultAliasName = "gs"`). Upstream docs, examples, and the agent skill all speak in `gs`. Matching that removes a translation step every time we read gh-stack material.
- **Usage profile differs from `ghd`/`ghe`.** Those launch a TUI once per session, so a four-character name costs nothing. `gs` is a navigation verb — `gs up`, `gs down`, `gs view`, `gs sync`, `gs push` — typed dozens of times a day, and it behaves like `git`, not like `gh`.
- **The slot is free.** Ghostscript is not installed, and `gs` was only ever a hand-rolled duplicate.

Alternatives: `ghs` (namespace consistency, rejected above); defining both (two names for one command, rejected as clutter).

### Drop `alias gs="git status"` rather than remap it to `gst`

`gst` is not ours to create — the OMZ `git` plugin already defines it, along with `gss` and `gsb` (`~/.oh-my-zsh/plugins/git/git.plugin.zsh:233,239,240`), and the `git` plugin is loaded at `dot_zshrc.tmpl:24`. So `dot_zshrc.tmpl:233` is a duplicate of a plugin alias, deleted rather than moved.

This is the rule `git-config` already states for the gitconfig: *"SHALL NOT include shorthand aliases (`st`, `co`, `ci`, `cm`, `ca`, `br`, `df`, `dc`) as these are provided by the OMZ git plugin."* Same principle, different file.

### Shell alias, not a PATH executable

`gh stack alias` writes a wrapper to `~/.local/bin/gs`:

```sh
#!/bin/sh
# installed by github/gh-stack
exec gh stack "$@"
```

We do not use it, and do not version an equivalent under `dot_local/bin/`. Because `~/.local/bin` is prepended to PATH, that file would shadow Ghostscript's `gs` **everywhere** — scripts, hooks, `sh -c`, agents — not just where we type. Ghostscript is absent today but arrives easily as a transitive dependency (imagemagick, a LaTeX toolchain), and the failure would be silent and confusing.

A zsh alias is scoped to interactive shells, which is exactly where the typing happens. The cost is that `gs` does not exist in non-interactive contexts; callers there spell out `gh stack`, where brevity is irrelevant.

### No version pin

Every other extension in the group installs unpinned. More decisive than consistency: `gh extension upgrade --all` runs in the extras update step, so a pin would be silently undone on the next update. Pinning would mean carving gh-stack out of that step too — machinery this change does not justify at v0.1.0. Accepted trade-off: a breaking change upstream arrives without warning. Recovery is `gh extension remove` plus a spec revision.

### Two-argument `gh skill install`

The README abbreviates the skill install to `gh skill install github/gh-stack`. That form prompts interactively and cannot carry flags — `gh skill preview github/gh-stack` fails with *"must specify a skill name when not running interactively"*. Naming the skill explicitly (`github/gh-stack gh-stack`) is what allows `--agent claude-code --scope user`, matching how the `cli/cli` skill is installed at `:348-357`. User scope is deliberate: the tool is used across all repositories, not just this one.

### Defer the worktree strategy, and record why

**Finding: `gh-stack` state is per-worktree, and dies with the worktree.**

Traced: the tracking file resolves through `GitDir()` (`internal/git/gitops.go:110`) → `cligit.Client.GitDir` (`internal/git/git.go:16`, `github.com/cli/cli/v2/git`) → `revParse("--git-dir")` (`cli/cli` `git/client.go:675-681`). In a linked worktree `--git-dir` returns `.git/worktrees/<name>`, not the common git dir. The same `GitDir()` is used to locate `rebase-merge` and `CHERRY_PICK_HEAD`, which confirms the per-worktree reading. Corroborating: `worktree` appears exactly once in the whole repository, in a test file; `--git-common-dir` appears zero times. There is no worktree handling.

```
  worktrunk model                          gh-stack model
  ──────────────                           ──────────────
  ~/repo-worktrees/A  [branch A]           ~/repo   [single checkout]
  ~/repo-worktrees/B  [branch B, base A]     gh stack up / down / checkout
  ~/repo-worktrees/C  [branch C, base B]     switches branches IN PLACE

  N dirs, N parallel Claude sessions       1 dir, 1 branch at a time

  .git/worktrees/A/gh-stack   isolated
  .git/worktrees/B/gh-stack   isolated     .git/gh-stack   single, shared
  .git/worktrees/C/gh-stack   isolated
        ↑ removed by `wt remove`
```

So a stack built in worktree A is invisible from worktree B, and is destroyed when A is removed.

We install the tool and stop there. No `wt` hook, alias, or convention is added, because picking a model now would either give up parallel per-worktree agent sessions or encode a workaround before we know which friction actually bites.

The escape hatch is documented upstream and worth recording: `gh stack link` exists for *"users who manage branches with other tools locally (e.g., jj, Sapling, git-town)"* and **stores no local tracking state**. That makes a worktrunk-owned variant viable — `wt` keeps creating and stacking branches as today, `gh stack link` tells GitHub the PRs form a stack, and we gain the stack map, per-layer diffs, and cascading merge without any `.git/gh-stack` file. What it would not give us is `gh stack sync`'s automatic cascading rebase. That is the trade to evaluate in a follow-up change, with real usage behind it.

## Risks / Trade-offs

- **Stacks do not survive `wt remove`, and are invisible across worktrees** → Accepted and unmitigated for now. Do stack work within a single worktree until the follow-up change decides a model. `gh stack link` is the known compatible path.
- **`gs` muscle memory is 100% mistrained** → Every reflexive `gs` now runs `gh stack` (which prints help or a stack view — harmless, not destructive). Retraining target is `gst`. This is the single user-visible break in the change.
- **Ghostscript arrives later as a transitive dependency** → The alias shadows it only in interactive shells; `command gs`, `\gs`, and every script keep resolving to the real binary. This is precisely why no PATH executable is installed.
- **Pre-1.0 extension, unpinned, auto-upgraded** → A breaking release lands without warning via `gh extension upgrade --all`. Blast radius is one alias and a manual workflow; nothing in the dotfiles depends on gh-stack's output.
- **Server-side rollout is progressive** → The extension may be installed and working before a given repository's web UI shows stacks, and merge queue support arrives later still. Install is still correct; only the experience lags.

## Migration Plan

1. `chezmoi apply` → extension and skill install through the confirmable group; the `gs` alias is rewritten.
2. Open a new shell (or `source ~/.zshrc`) for the alias change to take effect.
3. Verify: `gh extension list` shows `github/gh-stack`; `gh stack --help` runs; `gh skill list --agent claude-code --scope user --json skillName --jq '.[].skillName'` includes `gh-stack`; `alias gs` reports `gh stack`; `gst` still reports `git status`.

Rollback: restore `alias gs="git status"` in `dot_zshrc.tmpl`, run `gh extension remove github/gh-stack`, and delete the user-scoped skill directory. `gh skill` has no remove command (install, list, preview, publish, search, update), so locate it with `gh skill list --agent claude-code --scope user --json skillName,path` and remove the `gh-stack` entry (`~/.claude/skills/gh-stack`), then confirm the list no longer reports it. Only the *stack tracking state* lives inside `.git/` — the extension and the skill are both installed outside it.

## Open Questions

Deferrable — none of these change the specs, the approach, or the tasks:

- Does merge queue support, once it ships, change how a stack should land relative to the current `wt merge` flow?
- Does worktrunk grow native stack awareness? If so, the `gh stack link` path becomes cheaper than any convention we would write ourselves.
- Is `gh stack submit` a better default than `commit-push-pr` for multi-layer work, or do they coexist?
