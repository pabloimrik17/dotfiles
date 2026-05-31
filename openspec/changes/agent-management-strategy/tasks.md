## 1. Pre-implementation verification

- [ ] 1.1 Run `aoe init` on a clean state and confirm AoE writes/reads config at `~/.agent-of-empires/config.toml` (resolves the macOS path open question in design.md).
- [ ] 1.2 Confirm `wt list --json` flag is available on the installed worktrunk version; if not, switch `wt-aoe` to parse `wt list` text output.
- [ ] 1.3 Run `aoe init` and capture the actual TOML schema; diff against the proposed config (design.md D8). Rename or drop unknown keys before writing the chezmoi-managed file.
- [ ] 1.4 Confirm AoE offers a Catppuccin-family theme; if yes, include `[theme]` block in config, else omit.

## 2. Trial cleanup

- [ ] 2.1 `brew uninstall claude-squad` and remove any `cs` symlink if it exists (not chezmoi-managed; not the winner).
- [ ] 2.2 Leave Conductor installed on this host — it stays via chezmoi on arm64 Darwin (no manual uninstall step needed).

## 3. Install script: aoe

- [ ] 3.1 Edit `run_onchange_install-packages.sh.tmpl`: append `aoe` to the `BREW_PACKAGES` array (no `pkg_bin` case arm needed; identity mapping suffices).
- [ ] 3.2 Edit the macOS closing summary line under `Installation complete!`: append `, aoe` after `mole` in the `CLI tools:` enumeration.
- [ ] 3.3 Edit the non-macOS manual instructions block: append `, aoe` to the `CLI tools:` enumeration and the closing summary's non-macOS variant.
- [ ] 3.4 Verify idempotency locally: re-run `chezmoi apply` after install; the script SHALL log `aoe — already installed, skipping`.

## 4. Install script: conductor cask (arm64 Darwin only)

- [ ] 4.1 Edit `run_onchange_install-packages.sh.tmpl`: inside the `ALL_CASKS` array, wrap a new `"conductor|Conductor|AI|Claude code parallelisation"` entry with `{{ if eq .chezmoi.arch "arm64" -}}` / `{{ end -}}` chezmoi template guards (the `darwin` gate is already provided by the outer `{{ if eq .chezmoi.os "darwin" -}}` block).
- [ ] 4.2 Verify rendering on arm64 Darwin: `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | grep conductor` returns a line.
- [ ] 4.3 Verify rendering on a simulated Intel Darwin host (via `chezmoi --arch amd64 execute-template`): no `conductor` line should appear.

## 5. AoE configuration file

- [ ] 5.1 Create `private_dot_agent-of-empires/config.toml` populated per the verified schema from task 1.3 and the knobs in design.md D8.
- [ ] 5.2 Ensure `[session].default_tool = "claude"` and `[session].agent_status_hooks = true`.
- [ ] 5.3 Ensure `[status_hooks]` `on_waiting` and `on_idle` invoke `terminal-notifier` with `$AOE_SESSION_TITLE` interpolation.
- [ ] 5.4 Ensure `[worktree].init_submodules = false` and `[worktree].path_template` matches the value resolved by `wt config show` for `[paths] worktree`.
- [ ] 5.5 Ensure `[tmux].status_bar = "disabled"` and `[updates].update_check_mode = "off"`.
- [ ] 5.6 Add the `environment` passthrough listing `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, `COLORTERM`.
- [ ] 5.7 (Optional, gated on task 1.4) Add `[theme]` block with the closest Catppuccin variant AoE offers.
- [ ] 5.8 Run `chezmoi apply --dry-run` and inspect the rendered file; then `chezmoi apply` and verify `~/.agent-of-empires/config.toml` permissions are `0600` (the `private_` prefix should ensure this).

## 6. Worktrunk wrapper script

- [ ] 6.1 Create `dot_local/bin/executable_wt-aoe` containing the wrapper from design.md D5 (`set -euo pipefail`, `wt switch --create $branch`, resolve path via `wt list --json | jq`, `exec aoe add <path> -w <branch> "$@"`).
- [ ] 6.2 Verify chezmoi materializes it with mode `0755` (the `executable_` prefix handles this).
- [ ] 6.3 Smoke test in a scratch repo: create branch `wt-aoe-smoke`, verify worktrunk hooks (`pre-start.save-base`, `post-start.install-deps`) fire BEFORE AoE launches, and that AoE attaches without creating a duplicate worktree.
- [ ] 6.4 Confirm `aoe remove --delete-worktree` is a no-op for these sessions (because `managed_by_aoe: false`) and that `wt remove` is the correct cleanup path.

## 7. Documentation

- [ ] 7.1 Run `/docs:manual` skill to propose updates to `docs/manual.html` covering the new `wt-aoe` workflow and the AoE config highlights.
- [ ] 7.2 Run `/docs:readme` skill if the README's "What's Included" table or screenshots need refreshing (new brew package + new cask + new wrapper command).

## 8. Validation

- [ ] 8.1 `openspec validate agent-management-strategy --strict` passes.
- [ ] 8.2 `shellcheck dot_local/bin/executable_wt-aoe` passes with no warnings.
- [ ] 8.3 Run `chezmoi diff` after all changes — only expected diffs appear.
- [ ] 8.4 Apply on this host, re-run installer, confirm zero new installs are triggered.

## 9. Real-world soak (1 week before archive)

- [ ] 9.1 Use `wt-aoe` for at least 5 real worktree sessions across different repos. Note any DX regressions vs. trial conditions.
- [ ] 9.2 If a DX regression surfaces, open a follow-up change (do NOT amend this one post-archive).
- [ ] 9.3 If no regression after 1 week, run `/opsx:archive agent-management-strategy`.
