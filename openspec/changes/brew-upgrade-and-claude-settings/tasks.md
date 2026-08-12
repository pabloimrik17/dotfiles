## 1. Prerequisites

- [x] 1.1 Re-run `brew outdated --formula --verbose` and `brew outdated --cask --greedy` and reconcile against the target list in `proposal.md`; several findings are version-anchored and targets moved four times during the audit
- [x] 1.2 Archive `update-brew-deps` (27/27, merged in `fc545c3`) — its deltas still pin the AoE 1.12 hook set and the stale `[cockpit]` text, and archiving it after this change would re-introduce both
- [x] 1.3 Sync the chezmoi source directory (`chezmoi update`) — `~/.local/share/chezmoi` predates this worktree, so `chezmoi diff` shows nothing until it is current
- [x] 1.4 `brew upgrade chezmoi` on its own, then `chezmoi diff` — confirms the age decrypt and the AoE `modify_` round-trip still hold under 2.72.0 before anything else moves

## 2. Claude Code settings — the merge conversion

Lands as one edit: the hook-set update and the `modify_` conversion touch the same file (design D1-D4).

- [x] 2.1 Convert `dot_claude/settings.json.tmpl` into a `modify_` script driven by `uv run` + a stdlib-only Python program, with the managed key set declared as an explicit literal list
- [x] 2.2 Implement the fail-closed path: capture stdin to a temp file, and echo it unchanged if `uv` is absent, the merge exits non-zero, or its output does not parse as JSON. Keep exactly one `--quiet` — `-qq` would suppress the only diagnostic
- [x] 2.3 Emit host-conditional keys as explicit removals on hosts where the condition is false, not merely omit them
- [x] 2.4 Add `enableWorkflows: true` and `workflowSizeGuideline: "large"` to the managed set
- [x] 2.5 Update the AoE hook set to 1.14.0: widen `Notification` matchers to `permission_prompt|elicitation_dialog|agent_needs_input` and `idle_prompt|agent_completed`, and add `PostToolUse` / `AskUserQuestion`
- [x] 2.6 Remove the two hand-written `bd prime` hooks (`SessionStart`, `PreCompact`) — the beads plugin declares identical ones
- [x] 2.7 Repoint the beads marketplace to `gastownhall/beads` in `dot_claude/settings.json.tmpl` and `run_onchange_install-packages.sh.tmpl`
- [x] 2.8 Verify the rendered script is valid shell (`chezmoi execute-template` + `bash -n`) and that a dry run against a copy of the live settings produces valid JSON containing every managed key

## 3. Repo edits — fixes

- [x] 3.1 Delete the `__zoxide_doctor` override at `dot_zshrc.tmpl:397-410`, keeping 394-396. Verify with `zsh -n` on the rendered file — deleting 399-407 orphans the trailing `printf` arguments and a bare `}`
- [x] 3.2 Delete `eval "$(atuin ai init zsh)"` (`dot_zshrc.tmpl:175`); leave `[ai] enabled = true` in place, as it becomes the sole guard on the `?` widget
- [x] 3.3 Pin `json-schema = 2` under `[list]` in `dot_config/worktrunk/config.toml`
- [x] 3.4 Add a top-level `worktree-path` to `dot_config/worktrunk/config.toml` matching AoE's layout
- [x] 3.5 Add `--no-project` to the `uv run` invocation in `modify_private_config.toml` (~line 106); keep one `--quiet`
- [x] 3.6 Correct the runtime-writeback comment in `modify_private_config.toml`: `[cockpit]` → `[acp]`, and note `[app_state]` moved to `state.toml` in AoE 1.13.0
- [x] 3.7 Delete the dead `showIcons: true` from `dot_config/lazygit/config.yml` and fix the "Both flags required" comment at `:5-7`

## 4. Repo edits — from the uncapped sweep

- [x] 4.1 Add a `.chezmoiremove` at repo root removing the shadowing `~/Library` config files for lazygit and glow; do not touch `state.yml`
- [x] 4.2 Add a chezmoi-managed standalone delta config for lazygit, and wire it via `git.diffRenderers` in `dot_config/lazygit/config.yml` — new key name only, never `git.pagers`
- [x] 4.3 Add `gui.shrinkSidePanelsToContent: true` as a direct child of `gui:` in `dot_config/lazygit/config.yml` (not nested under `theme:` — lazygit unmarshals without `KnownFields`, so misplacement is a silent no-op)
- [x] 4.4 Bring `~/.config/atuin/permissions.ai.toml` under chezmoi as `dot_config/atuin/private_permissions.ai.toml`
- [x] 4.5 Fold the two rules stranded in the dead `~/.config/git/ignore` into `dot_gitignore_global`, add `.claude/.worktree-base`, then remove the dead file
- [x] 4.6 Install Hack Nerd Font as a Homebrew cask: remove the manual `~/Library/Fonts/HackNerdFont*.ttf` copies, then `brew install --cask font-hack-nerd-font`
- [x] 4.7 Make the font pre-scan in `run_onchange_install-packages.sh.tmpl` (~:392, ~:403-406) report a manual installation as needing attention instead of counting it as installed

## 5. Brew upgrade

- [x] 5.1 `brew upgrade` the remaining formulae; confirm `brew outdated` is clean afterwards. Do **not** run `gh auth status` beforehand (CVE-2026-64652)
- [x] 5.2 `brew upgrade --cask font-jetbrains-mono-nerd-font`
- [x] 5.3 Upgrade AoE, start one session, let it write its hooks into the live settings, then fold its own bytes back into the managed set — do not hand-transcribe the escaped `case` pattern
- [ ] 5.4 `chezmoi apply`; confirm the install script's interactive `confirm()` prompts still reach the terminal under chezmoi 2.72.0

## 6. Docs

- [x] 6.1 `docs/manual.html`: correct the two claims that `mole analyze` is read-only (`:2268`, `:2296`), and add a `mole status` row
- [x] 6.2 `docs/manual.html`: document that `mole clean` empties `~/.Trash` by default and recommend `mole clean --whitelist` (design D6)
- [x] 6.3 `docs/manual.html`: replace the four removed shell helpers (`frg`, `fkill`, `fglog`, `fgco`) with their television channel equivalents
- [x] 6.4 `docs/manual.html:1316-1319`: fix the lazygit PR-badge claim — `showIcons` is inert, and since 0.64.0 open PRs render checks state as plain Unicode
- [x] 6.5 `docs/manual.html`: add an `eza --code` note (modes need the `=` form; extension-based detection makes `.tmpl` files invisible) and the fzf `alt-left`/`alt-right` bindings
- [x] 6.6 Add `zsh` to the non-macOS manual install list — the oh-my-zsh installer aborts without it
- [x] 6.7 Fix the false comment at `run_onchange_install-packages.sh.tmpl:9` about chezmoi capturing script stdout
- [x] 6.8 Run `/docs:readme` in case the font-cask and lazygit-delta changes count as tool-level — verdict: no README change needed (no row claims a manual font install; the delta/lazygit coupling is config-level and went to the manual instead)

## 7. Verification

- [x] 7.1 `openspec validate brew-upgrade-and-claude-settings` passes
- [x] 7.2 Run the `modify_` script with `uv` off `PATH` and confirm the live `~/.claude/settings.json` survives byte-identical; run it again with no target file and confirm a valid non-empty baseline
- [x] 7.3 `chezmoi apply` twice in a row; the second `chezmoi diff` must be clean, including after Claude Code and AoE have each written to the settings file
- [x] 7.4 `cd` in a fresh Claude Code Bash call and in an interactive shell — both must produce clean stderr (zoxide override deleted)
- [ ] 7.5 Confirm the `?` widget still binds after removing the atuin AI init line, and that Ctrl+T on an empty prompt still falls back to fzf's file widget
- [ ] 7.6 Launch lazygit 0.64.0 once, then `chezmoi status` — `~/.config/lazygit/config.yml` must be unmodified; confirm diffs render through delta with Catppuccin
- [x] 7.7 `env -u XDG_CONFIG_HOME lazygit --print-config-dir` must print `~/.config/lazygit`; same check for glow — lazygit passes. glow does not and cannot: its default path stays under `~/Library` regardless, and it re-writes its own default config there, which made `chezmoi apply` fail outright. The glow entry was dropped from `.chezmoiremove` and the spec amended; glow reads the managed config via the `XDG_CONFIG_HOME` export instead
- [ ] 7.8 `mdview` on a Markdown file containing an image, once in bare Ghostty and once in tmux — the only exercise of the rebuilt pango/fontconfig/harfbuzz/libtiff/jpeg-xl/openjph/dav1d/openexr/chafa stack
- [x] 7.9 Smoke-test glow 3.0.0: all five keys in `glow.yml` still honoured, and the non-interactive `glow -s dark` fzf previews still render
- [x] 7.10 `wt config update` reports nothing to migrate; `wt list` renders; `git diff` and the `wt switch` picker still work after libgit2 1.9.6
- [ ] 7.11 `fc-list ':charset=2801' family | grep -i hack` lists Hack, then eyeball a `tickrs` chart
- [x] 7.12 `bd prime` runs exactly once per session start (plugin only), and `brew info dolt` reports ≥ 2.2.3 before applying

## 8. Follow-up

- [x] 8.1 Update the `feedback_zoxide_cmd_cd.md` memory — deleting the override invalidates its instruction to reapply the patch
- [x] 8.2 Record the residual gaps from `-sweep.md` (`harfbuzz`, `llhttp`, `openjph` and five transitive formulae never had their contents read; `catppuccin-mocha.toml`'s 37 AoE theme tokens were never checked against 1.13/1.14)
