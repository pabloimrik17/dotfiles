## Why

GitHub moved Stacked Pull Requests into public preview on 2026-07-30. The dotfiles already cover the terminal-first GitHub workflow — `gh-dash` for PRs and issues, `gh-enhance` for CI runs — but there is no way to author, navigate, or land a stack of dependent PRs. `gh-stack` is the official `gh` extension for it, and it ships an agent skill so Claude Code knows the command surface.

This is a general-purpose tool, not a dotfiles-repo tool: it will be used across every project on the machine, which is what makes it belong in the install script rather than in a single repo's config.

GitHub issue: pabloimrik17/dotfiles#168

## What Changes

- Install `gh-stack` via `gh extension install github/gh-stack` in the existing gh CLI extensions confirmable group, following the `gh-dash`/`gh-enhance` idempotency pattern
- Install the agent skill via `gh skill install github/gh-stack gh-stack --agent claude-code --scope user`, alongside the existing `cli/cli` skill install, with structured detection via `gh skill list --json`
- Update the group's `confirm` prompt, which today enumerates the extensions by hand
- Update the non-macOS fallback summary, which lists only `gh-dash`
- **BREAKING**: repoint the `gs` shell alias from `git status` to `gh stack`. The OMZ `git` plugin already provides `gst`, `gss`, and `gsb` for status, so the current `gs` duplicates a plugin alias — the same reason `git-config` already forbids `st`/`co`/`br` shorthands in the gitconfig
- Document the tool in the README "What's Included" table and the `gh` alias table in `docs/manual.html`

Deliberately not changing: no version pin (the extras updater runs `gh extension upgrade --all`, so a pin would be undone on the next update), and no `gh stack alias` wrapper in `~/.local/bin/` (rationale in design).

## Capabilities

### New Capabilities

- `gh-stack-install`: installation of the `gh-stack` extension and its Claude Code agent skill via the chezmoi install script, plus the `gs` shell alias

### Modified Capabilities

- `gh-dash-install`: owns the gh CLI extensions group. Gains a requirement that the group's confirm prompt and the non-macOS fallback summary name every extension the group installs — both under-report today, which is the drift this change has to fix anyway

The `gs` alias is not covered by any existing requirement, and the README and manual requirements describe their tables generically ("all managed tools") rather than enumerating entries, so adding rows implements them rather than changing them.

## Impact

- **Files modified**:
    - `run_onchange_install-packages.sh.tmpl` — extension install, skill install, `confirm` text, fallback summary
    - `dot_zshrc.tmpl` — remove `alias gs="git status"`, add `alias gs="gh stack"` in the GitHub aliases section
    - `README.md` — one row in "What's Included" under Git
    - `docs/manual.html` — one row in the `gh` alias table
- **Dependencies**: `gh` CLI ≥ 2.0 for the extension, ≥ 2.90 for the `gh skill` path (installed: 2.96.0). No Homebrew formula exists; `gh extension install` is the only channel. The extension ships precompiled binaries, so no Go toolchain is needed. The script does not gate on the version: `error` logs and increments a counter rather than aborting, so on an older `gh` the skill install reports a failure and the run continues — and this same script installs `gh` via Homebrew, so the stale-version window is narrow
- **Already satisfied, no change needed**: `[rerere] enabled = true` in `dot_gitconfig.tmpl` makes `gh stack init`'s automatic rerere enablement a no-op; `_update_extra_step "gh extensions" gh extension upgrade --all` in `dot_zshrc.tmpl` keeps the extension current for free
- **Preview risk**: the feature is in public preview and the extension is pre-1.0 (v0.1.0, 2026-07-29). Server-side rollout and merge queue support land progressively, so the CLI may work before a given repo's web UI does
- **Out of scope**: how stacks compose with worktrunk worktrees, any `wt` hook or alias changes, `gh-dash`/lazygit keybindings, and whether `gh stack submit` replaces the current `commit-push-pr` flow. `gh-stack` stores its state in the per-worktree git dir, which makes this a real design question rather than a detail — it is recorded in design.md and deferred to a later change
