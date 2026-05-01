## Context

The dotfiles repo manages a macOS development environment via chezmoi. Brew packages are installed by `run_onchange_install-packages.sh.tmpl` against an unpinned list (`BREW_PACKAGES`); version bumps therefore happen at the user's machine via `brew upgrade`, not via repo edits. However, four bumps in this batch (starship, atuin, lazygit, worktrunk) introduce configurable features that are worth adopting alongside the binary upgrade — those adoptions are the only reason this proposal touches repo files at all.

The user runs the same dotfiles across multiple machines synced through chezmoi. Beads is upgraded separately because its 0.62→1.0 release migrates the Dolt schema to v11 (one-way) and moves the upstream repo from `steveyegge/beads` to `gastownhall/beads`; bundling that with the rest would block this proposal's archive on a higher-risk migration.

## Goals / Non-Goals

**Goals:**

- Apply security upgrades (`openssl@3` 8 CVEs, `uv` GHSA-pjjw-68hj-v9mw) without delay.
- Bump 13 other formulae and 1 cask to current upstream versions.
- Adopt three configurable features that fit current usage:
    - Starship `[git_status]` split (index vs. worktree) with green-for-staged / red-for-unstaged.
    - Atuin `TERMINAL.md` global context file for `atuin ai`.
    - Opencode `shell: "zsh"` so the agent shell tool inherits aliases.
- Run `wt config update` to clear deprecation warnings introduced between worktrunk 0.33 and 0.46.

**Non-Goals:**

- Beads 1.0 schema migration (separate proposal).
- Adopting `gh skill`, `starship statusline`, atuin `edit_file`/`write_file`, worktrunk per-branch vars, bd `story`/`milestone`, chezmoi new template variables.
- Updating README.md or docs/manual.html (handled by `/docs:readme` and `/docs:manual` after implementation, on a separate proposal cycle).
- Pinning brew package versions (still unpinned by design — the install script's job is presence, not version).

## Decisions

### Decision: Bundle "upgrade" and "adopt features" in one proposal

The brew upgrade and the three configuration adoptions are conceptually one unit of work because the adoptions are _only possible_ after the corresponding binary upgrade. Splitting them would force the user to apply repo changes that depend on a separate operational step, creating a brittle ordering dependency between proposals.

**Alternatives considered:**

- Two proposals (`bump-brew-deps-binaries` + `bump-brew-deps-adopt-features`). Rejected: the second proposal would be unarchivable until the user has run `brew upgrade` on every machine, with no way for OpenSpec to verify it. Couples worse than bundling.
- Three proposals tiered by risk (security / patches+minors / config adoptions). Rejected: same dependency problem on the third tier, plus higher OpenSpec overhead for low-value separation.

### Decision: Beads stays in a separate proposal

Beads 0.62→1.0 is the only upgrade in the outdated list with a one-way schema migration (Dolt schema v11), an upstream repo move (`steveyegge`→`gastownhall`), and an auto-push default change. Folding it into this proposal would block archive on a successful schema migration that may need rollback time across multiple machines.

**Alternatives considered:**

- Include beads here, accept the archive risk. Rejected: schema migrations are exactly what proposal isolation is for.
- Skip beads upgrade entirely. Rejected: `bd batch`, `bd config apply`, and `bd ready --exclude-label` are useful and only land in 1.0+.

### Decision: Keep `claude-hud` as the Claude Code statusline

Starship 1.25 introduces `starship statusline claude-code` with three modules (`claude_model`, `claude_context`, `claude_cost`). The user has `claude-hud` already configured via the `claude-hud:configure` skill, with richer display elements than the starship subcommand provides.

**Alternatives considered:**

- Switch to `starship statusline` for fewer moving parts. Rejected: feature regression in display elements; no pain point in current claude-hud usage.

### Decision: Split `[git_status]` from `$all_status` to `index_*` + `worktree_*`

The existing config uses `$all_status` which lumps staged and unstaged changes into one symbol cluster (`●●` for "two modified files" without distinguishing). Splitting them into `(index_added/modified/deleted)(worktree_added/modified/deleted)` with green for staged and red for unstaged makes the prompt answer "what would `git commit` actually capture right now?" at a glance.

**Alternatives considered:**

- Keep `$all_status`. Rejected after user confirmation: workflow includes selective stage operations (lazygit by hunks, `git add -p`) where the visual distinction provides signal.

### Decision: `TERMINAL.md` lives at user scope, not project scope

The user's stack (zsh, bun, brew, chezmoi-managed dotfiles, owned-tool keybindings for atuin/tv/fzf) is identical across every project they touch. A single global `~/.config/atuin/TERMINAL.md` covers all use cases without per-project drift.

**Alternatives considered:**

- Per-project `.atuin/TERMINAL.md` checked into each repo. Rejected: this dotfiles user does not have project-specific atuin contexts; a global file is sufficient and avoids duplication.

### Decision: `bd config apply` is in-scope as a habit, but bd 1.0 itself is not

The `bd config apply` routine after `bd dolt pull` only becomes available _after_ the separate `bump-beads-1.0` proposal lands. This proposal documents the intent in the "habits" section so it isn't lost, but does not enforce it (no spec, no task) since the underlying CLI does not yet exist on the user's machines.

## Risks / Trade-offs

- **Risk: Atuin 18.14+ auto-injects new hooks on `atuin ai init zsh`** → Mitigation: re-source `~/.zshrc` after upgrade and verify init order (fzf → tv → atuin); keybindings for Ctrl+T (tv) and Ctrl+R (atuin) must still resolve as documented.
- **Risk: Lazygit 0.61 default file-sort change is cosmetic but jarring** → Mitigation: open lazygit once after upgrade; if the new "mix files and folders" sort feels wrong, pin previous behavior in `dot_config/lazygit/config.yml` as part of this change.
- **Risk: `wt config update` may rewrite `dot_config/worktrunk/config.toml` in unexpected ways** → Mitigation: run it on the deployed `~/.config/worktrunk/config.toml`, diff against the chezmoi source, and copy meaningful changes back manually rather than letting chezmoi clobber the rewrite.
- **Risk: Starship `[git_status]` split can produce a visually busier prompt than `$all_status`** → Mitigation: this is what the user asked for; if the format proves too noisy in practice, reverting is a one-line edit.
- **Risk: First `atuin ai` invocation prompts for client-tool permissions** → Mitigation: accept restrictively (deny `edit_file`/`write_file`); document this in the verification step.
- **Risk: Multi-machine sync** — atuin/worktrunk/lazygit upgrades happen per-machine, but repo-side adoptions land on every machine via `chezmoi apply`. If one machine is on old binaries and pulls the new starship config, the new `index_*` variables silently render as empty rather than fail → Mitigation: document the order in tasks (upgrade machine first, then `chezmoi apply`).

## Migration Plan

1. **Security first**: `brew upgrade openssl@3 uv`. Verify with `openssl version` and `uv --version`.
2. **Patches + low-risk minors**: one `brew upgrade` for the rest of the formulae (`chezmoi`, `git-delta`, `television`, `dolt`, `git`, `fzf`, `gh`) and the cask (`coderabbit`). No verification beyond "command still works".
3. **Atuin**: `brew upgrade atuin` → re-source zshrc → first `atuin ai` invocation handles permission prompts → confirm Ctrl+R / Ctrl+T still bind as expected.
4. **Lazygit**: `brew upgrade lazygit` → open it once → decide on file-sort default → if pinning, edit `dot_config/lazygit/config.yml` accordingly.
5. **Worktrunk**: `brew upgrade worktrunk` → run `wt config update` against the deployed config → diff vs chezmoi source → manually port relevant changes back to `dot_config/worktrunk/config.toml`.
6. **Starship**: `brew upgrade starship` → edit `dot_config/starship.toml` for `[directory]` regex subs and `[git_status]` split → `chezmoi apply` → verify prompt renders.
7. **Atuin TERMINAL.md**: create `dot_config/atuin/TERMINAL.md` → `chezmoi apply` → test with `atuin ai "..."` to confirm context is loaded.
8. **Opencode shell field**: edit `dot_config/opencode/opencode.jsonc` to add `"shell": "zsh"` → `chezmoi apply` → verify with an opencode session that bash → zsh switch is reflected in agent shell tool output.

**Rollback**: repo-side changes are small and contained — most are 1–few hunks per file and revertable via `git revert`. A couple are multi-hunk: starship's `[git_status]` restructuring rewrites a ~10-line block, and any worktrunk hook pipeline migration (`[pre-start]` → `[[pre-start]]`) updates the relevant table-header lines. Brew downgrades are possible via `brew install <pkg>@<version>` for any package that ships versioned formulae, otherwise via `brew extract` from a prior tap commit.

## Open Questions

- Lazygit file-sort default: pin to previous "directories first" behavior or accept the new mix? Decision deferred until after upgrade so the user can see the new default in their actual workflow.
