## Why

`brew outdated` reports **31 formulae + 1 cask** (re-checked 12 Aug; the count and several targets moved during the audit). A changelog × config audit — every release note in each installed→target range, then an uncapped adversarial sweep over every finding — produced one obsolete workaround, two config-drift hazards, one security patch, and a long tail of pre-existing bugs it surfaced by accident. Feature adoption is genuinely thin: this cycle is patches and hardening.

Separately, `/config` turned on `enableWorkflows` and `workflowSizeGuideline`. Neither is captured by chezmoi and `apply` would delete the first. That exposed the real problem: `dot_claude/settings.json.tmpl` is a whole-file template competing with **two other writers** — Claude Code and AoE — for the same file. Both efforts land on it, so they ship together.

Artifacts, in reading order: `openspec/explorations/brew-update-2026-08.md` (narrative), `-dossier.md` (main audit), `-gaps.md`, `-claims.md`, `-adoption.md`, **`-sweep.md` (the uncapped pass — it corrects the four before it)**, `-critic.md`.

## What Changes

### Claude Code settings

- **BREAKING (mechanism)**: `dot_claude/settings.json.tmpl` becomes a `modify_` script overlaying only managed keys onto the live file. Template and live file are the *same object* under `sort_keys` — zero value conflicts, zero arrays reordered. All churn is object-key order plus keys the template does not know (`enableWorkflows`, `theme`, `skipWorkflowUsageWarning`), and that set changes on its own as `/config` is used.
  - **The cheap alternative was already tried on this file and failed.** Commit `85992e0` deliberately alphabetized these keys to match AoE's serialization, `cmp`-verified byte-identical. It still drifts, because there are three writers, not two. Adding the unknown keys to the template would not converge either.
  - **Engine is undecided — `jq` is not safe as assumed.** `jq` is *not* in `BREW_PACKAGES`; the binary in use is Apple's `/usr/bin/jq` (macOS 15+ only, absent on the Linux the README supports). In the `sync-claude` hook jq is soft (warn-and-skip). In a `modify_` script chezmoi writes stdout verbatim, so **jq missing or erroring truncates `~/.claude/settings.json` to empty.** Design must resolve: (a) engine choice and its hard dependency, (b) a guaranteed non-empty fallback that echoes stdin on any failure, mirroring `modify_private_config.toml:28-31`, (c) how chezmoi's darwin/arm64 conditionals express key *removal*, not just addition, and (d) behaviour on a fresh machine where stdin is empty.
- Add `enableWorkflows: true` and `workflowSizeGuideline: "large"` as managed keys. Both resolve from the merged settings chain, which outranks the `~/.claude.json` fallback (`Rft()` reads `Ek()?.settings.workflowSizeGuideline` first, verified in the 2.1.220 binary). Accepted consequence: pinning the guideline makes its `/config` row read-only.

### Brew upgrades

- **Security**: `gh` 2.96.0 → 2.97.0 patches four GHSAs (CVE-2026-64652/64653/64654/64655; upstream severities medium/low). `libgit2` 1.9.4 → 1.9.6 crosses the 1.9.5 security release (5 CVEs) — reachable via `bat`, `eza` **and `git-delta`**, which is the git pager and the `wt switch` picker pager. Soname unchanged, so no rebuild.
- **Data integrity**: worktrunk 0.69.0 fixes a `wt merge` bug that could sweep in upstream commits and corrupt the default branch; driven here by the `mc` alias.
- **`uv` target is 0.12.3.** No cache buckets move beyond the 0.11.30 Simple/FlatIndex change, and #20963 restored the bidirectional msgpack cache compatibility that 0.12.0/0.12.1 broke.
- Six formulae had zero coverage until the final sweep: `pango`, `fontconfig` 2.18.3, `openjph` 0.31.0, `llhttp`, `uv`, and the cask.

### Targets that moved after the audit (re-checked 12 Aug)

- **`glow` 2.1.2 → 3.0.0** — new to the list and nominally a major, but a quiet one: it bumps the Bubble Tea / Lip Gloss / Bubbles v2 ecosystem with, upstream's words, "no UX changes". The major reflects the Go module path (`charm.land/glow/v3`). No documented change to config keys, CLI flags or non-interactive invocation. `dot_config/glow/glow.yml` manages five keys and glow is called non-interactively from the fzf previews (`dot_zshrc.tmpl:144,:152`) and via the `mdview` dispatcher, so this needs a smoke test rather than an edit.
- **`beads` target is 1.2.1**, not 1.1.2. This retires the "target 1.1.2, never 1.1.0" advice — Homebrew installs 1.2.1 in one hop, past the v53 aux re-key hazard entirely. `bd prime` is explicitly unchanged, so the hook removal above is unaffected, and no mandatory `bd migrate` is documented. The six breaking changes between 1.0.5 and 1.2.1 are all CLI or Go-API surfaces this repo does not use.
- **`worktrunk` 0.71.0 → 0.72.0** — the `json-schema = 2` pin still holds: 0.72.0's schema-2 change converts four bare strings to enumerated vocabularies while "the emitted JSON is unchanged". Its one breaking change that could have bitten — `wt merge` and `wt step push` no longer run `git push` on fast-forward paths, affecting pre-push hooks — is inert here: `.husky/` contains only `commit-msg` and `pre-commit`.
- `mole` 1.50.0, `mdfried` 0.22.5, `openexr` 3.4.14 (now a real version bump, no longer revision-only).

### Fixes

- Delete the `__zoxide_doctor` override at **`dot_zshrc.tmpl:397-410`**, keeping 394-396. zoxide 0.10.0 adds `[[ $- == *i* ]] || return 0` upstream, strictly more general than the `CLAUDECODE` guard. **The range matters**: deleting 399-407 orphans the trailing `printf` arguments and a bare `}`, and the earlier 396-405 would remove the `eval "$(zoxide init …)"` line itself. Either mistake is a parse error on every shell start.
- Pin `[list] json-schema = 2` in `dot_config/worktrunk/config.toml`. Any explicit value closes the migration loop (`adopt_json_schema_doc` bails on a present key); `2` is a deliberate opt-in. No consumer of `wt list --format=json` exists here, so blast radius is zero.
- Add `--no-project` to the `uv run` invocation (`modify_private_config.toml:106`, fallback `:110`). **Pre-existing, not caused by 0.12.x** — reproduced on the installed 0.11.26: from a project with an unresolvable dep the merge is silently skipped and chezmoi still exits 0; from a healthy project uv writes `.venv` and `uv.lock` into that unrelated repo. Keep exactly one `--quiet`.
- Sync the aoe hook set to 1.14.0: widen both `Notification` matchers, add `PostToolUse`/`AskUserQuestion`. Fold aoe's own bytes back after letting it write, rather than hand-transcribing the escaped `case`.
- Correct `[cockpit]` → `[acp]` (renamed in aoe 1.11.0) and account for `[app_state]` moving to `state.toml` in 1.13.0 — wrong in the script comment and two spec files.
- `docs/manual.html:2268,:2296` calls `mole analyze` read-only. False on the *installed* 1.44.1. Correct both; add a `mole status` row.
- Delete `eval "$(atuin ai init zsh)"` (`dot_zshrc.tmpl:175`) — byte-identical duplicate of what `atuin init zsh` already emits. Scope out removing `[ai] enabled = true`: post-deletion it becomes the only guard on the `?` widget, so `atuin-config`'s "only non-defaults" invariant needs a stated exception.
- Repoint the beads marketplace to `gastownhall/beads`. The registry keys off the marketplace *name* from the manifest, so this is an in-place overwrite, not an orphan. One-time: `claude plugin marketplace remove beads-marketplace`, or accept a no-op re-add.

### Actions the uncapped sweep uncovered

Full detail in `-sweep.md`; these are the ones with a concrete edit.

- **`showIcons: true` (`lazygit/config.yml:8`) is dead config** — its only consumer is unreachable when `nerdFontsVersion` is set, and it is declared `// Deprecated`. Delete it, fix the false comment at `:5-7`, and fix `docs/manual.html:1316-1319` which teaches the same wrong thing.
- **A 0-byte `~/Library/Application Support/lazygit/config.yml` shadows the managed config** whenever `XDG_CONFIG_HOME` is unset — lazygit then runs stock, with no Catppuccin and no `g`→`mdview`. Same shadow for glow. Add a `.chezmoiremove` at repo root for both. Do not touch `state.yml`.
- **`mole clean` empties `~/.Trash` by default**, against this machine's deliberate 30-day window (`macos-defaults/spec.md:30`) — and mole's own "safe" deletes land there. Export `MOLE_SKIP_TRASH_CLEANUP=1`, or document the hazard and recommend `mole clean --whitelist`.
- **`~/.config/atuin/permissions.ai.toml` is unmanaged and grants unscoped `Shell`** to the `?` agent. Bring it under chezmoi as `private_permissions.ai.toml`.
- **Hack Nerd Font is not brew-managed.** It is a manual install frozen at 3.4.0, and the pre-scan at `run_onchange_install-packages.sh.tmpl:392` accepts it, so the script reports "Fonts: 2/2" forever — contradicting `ghostty-visual-polish/spec.md:62`. It draws every eza icon and every `nerdFontsVersion: "3"` glyph. 3.5.0 adds all 256 Braille codepoints, which `tickrs` charts currently borrow from Apple Symbols.
- **`dot_gitignore_global` is missing two rules.** `~/.config/git/ignore` is permanently dead because `core.excludesFile` replaces the XDG default rather than stacking. Fold it in, add `.claude/.worktree-base` (manufactured by this repo's own `save-base` hook), then remove the dead file.
- **`worktrunk` has no `worktree-path`**, so wt and AoE write worktrees to different layouts — both coexist on disk now. Pin it.
- **Doc rot**: `manual.html` documents four shell functions that no longer exist (`frg`, `fkill`, `fglog`, `fgco`), and `television-shell-integration/spec.md:13-16` asserts the opposite of the shipped wrapper — an implementer running verify would "fix" the wrapper and reintroduce the Tab-completion bug its comment exists to prevent.

### Feature adoption

- **Adopt `gui.shrinkSidePanelsToContent: true`** (`lazygit/config.yml`, direct child of `gui:` after line 9). Misplacing it under `theme:` is a silent no-op, not an error.
- **Adopt delta in lazygit via `git.diffRenderers`** — reversed from a rejection. The blocker was believed to be that only `--no-gitconfig` isolates lazygit, discarding the theme; in fact `delta --config <PATH>` exists in 0.19.2 and was verified end-to-end rendering full Mocha under a `TERM=dumb` pty with the terminal `git diff` untouched. Cost is one new managed delta config plus a 3-line YAML block. Single entry means no cycle keybinding. Only the new key name — writing `git.pagers` triggers the migration that rewrites the managed file.
- Remove the duplicate `bd prime` hooks (`settings.json.tmpl:159`, `:180`); the beads plugin declares identical ones. This makes `beads@beads-marketplace` load-bearing — capture that coupling as a requirement, not a comment.

### Audited and rejected

- **atuin `pty-proxy`** — reversed from *deferred* to **rejected**, decidable now without measurement. `exec atuin pty-proxy` permanently discards Ghostty's shell integration: Ghostty injects via `ZDOTDIR` and its own source states that `exec zsh` produces a shell where it will not run. Lost: OSC 7 cwd reporting (so `super+t` and splits stop inheriting the directory), plus `cursor`, `sudo` and `title` — all enabled at `ghostty/config:54`. The previously proposed gate would have passed anyway, because it only checked the two features atuin re-emits itself.
- **atuin syntax highlighting** — reversed from *breaking* to informational. `Theme::from_map` seeds from `DEFAULT_THEME` before applying the TOML, so all six `Syntax*` meanings are defined as ANSI palette indices, which `ghostty/config:6`'s `catppuccin-mocha` already maps. A derived theme would hardcode RGB and be strictly less adaptive.
- **eza `--hyperlink=auto`** — verdict unchanged, rationale replaced. The old "value-eating" reason was self-refuting. The real blockers: the installed 0.23.4 exits 3 on the flag and the install script never upgrades a package already on PATH, so a lagging machine loses `ls`/`ll`/`la`; and `xterm-ghostty` lacks the `Hls` cap while tmux 3.7b drops the OSC 8.
- **lazygit `gui.sidePanels`**, **`editConfig` hardening**, **eza `--loc`/`--code` aliases**, **`wt remove --reap`** and `wt config approvals`, **declaring `zsh` or `dolt` in `BREW_PACKAGES`**, **`RIPGREP_CONFIG_PATH`**, **aoe `tmux.socket_name`**, **`git.pagers`**.

## Capabilities

### New Capabilities

- `claude-settings-merge`: `~/.claude/settings.json` is produced by a `modify_` script overlaying managed keys onto the live file, with a guaranteed non-empty fallback.
- `xdg-config-shadowing`: a `.chezmoiremove` removes stale `~/Library` config files that outrank the managed XDG copies when `XDG_CONFIG_HOME` is unset.

### Modified Capabilities

- `claude-user-preferences`: ordering is expressed by the merge contract rather than template source order; `enableWorkflows` and `workflowSizeGuideline` join the managed set.
- `claude-hooks`: AoE hook set moves to 1.14.0; duplicate `bd prime` requirements retire, with the resulting dependency on the beads plugin stated.
- `agent-manager`: `[cockpit]` → `[acp]`, `state.toml` accounted for, `uv run` gains `--no-project`.
- `worktrunk-config`: `[list]` pins `json-schema = 2`; a new requirement pins `worktree-path`.
- `atuin-config`: the separate `atuin ai init zsh` line is no longer mandated; `permissions.ai.toml` becomes managed; the "only non-defaults" invariant gains a stated exception for `[ai] enabled`.
- `claude-code-plugins`: beads marketplace repo becomes `gastownhall/beads`.
- `delta-catppuccin`: a standalone delta config is added for lazygit's `diffRenderers` to `--config`.
- `ghostty-visual-polish`: the Hack Nerd Font requirement is satisfied by the cask, not a manual install.
- `git-config`: `dot_gitignore_global` absorbs the two rules stranded in the dead `~/.config/git/ignore`.
- `mole-install`: the Trash-cleanup hazard is addressed.
- `television-shell-integration`: the Ctrl+T scenario is restated to match the shipped wrapper's two branches.
- `manual-web`: mole destructiveness, `mole status`, the dead shell functions, the lazygit PR-badge claim, `eza --code`, and the fzf `alt-left`/`alt-right` bindings.

## Impact

- **Systems**: Homebrew, 31 formulae + 1 cask. First `chezmoi apply` after the uv upgrade needs network (0.11.30's cache-bucket bump).
- **Ordering**: `brew upgrade chezmoi` alone first. Do not run `gh auth status` before upgrading gh. The beads migration runbook is **conditional** — no `.beads` directory exists on this machine, so no pre-upgrade ritual is required; if that changes, the command is `bd migrate schema` (bare `bd migrate` only refreshes metadata) and `bd export --all` is explicitly not a backup — use `bd backup init|sync`.
- **Version drift during the audit**: targets moved on 3, 5, 6 and 12 August. Re-run `brew outdated` immediately before implementing and reconcile against the list above; several findings are version-anchored.
- **Prerequisite**: `update-brew-deps` is 27/27 and merged in `fc545c3` but unarchived. Its deltas still pin the aoe 1.12 hook set and the stale `[cockpit]` text; archiving it *after* this change re-introduces both.
- **Memory debt**: deleting the `__zoxide_doctor` override invalidates `feedback_zoxide_cmd_cd.md`.
- **Verification**: 84 agents, zero errors, every prior finding adversarially re-checked. The sweep overturned three verdicts, corrected eight proposal statements and found 13 missed actions. Residual gaps are listed in `-sweep.md`; the largest is that `harfbuzz`, `llhttp`, `openjph` and five other transitive formulae have never had their contents read, and `catppuccin-mocha.toml`'s 37 theme tokens were never checked against aoe 1.13/1.14 — the same failure mode as the atuin theme finding, applied to a different file.
- **Post-upgrade smoke tests** (not gaps — they need the targets installed): nine are enumerated in `-sweep.md`. The load-bearing ones: `mdview` on a Markdown file with an image (the only exercise of the whole rebuilt image stack), lazygit 0.64.0 followed by `chezmoi status`, and — if the `modify_` script ships — running it with `jq` off PATH to confirm the live settings file survives.
