## 1. Pre-implementation verification

- [x] 1.1 Run `aoe init` on a clean state and confirm AoE writes/reads config at `~/.agent-of-empires/config.toml` (resolves the macOS path open question in design.md). — verified: `~/.agent-of-empires/config.toml` auto-created by aoe; `aoe init <path>` creates a _per-repo_ override at `<path>/.agent-of-empires/config.toml` (same filename).
- [x] 1.2 Run `aoe init` and capture the actual TOML schema; diff against the proposed config (design.md D8). Rename or drop unknown keys before writing the chezmoi-managed file. — schema captured. Adjustments from D8: `environment` passthrough must live under `[sandbox]` (the only valid location); `status_hooks.enabled = true` must be set for hooks to fire; valid `status_hooks` keys are `enabled`/`debounce_ms`/`on_starting`/`on_running`/`on_waiting`/`on_idle`/`on_change`; valid `tmux.status_bar` values include `"auto"`/`"disabled"`/`"off"`.
- [x] 1.3 Confirm AoE offers a Catppuccin-family theme; if yes, include `[theme]` block in config, else omit. — `aoe theme list` ships 8 built-ins: `default`, `empire`, `phosphor`, `tokyo-night-storm`, `catppuccin-latte`, `dracula`, `rose-pine`, `deep-ocean`. Only `catppuccin-latte` (light) from Catppuccin family; user's stack is Catppuccin Mocha (dark). Per D8's first-named choice, ship `tokyo-night-storm` (dark, closest aesthetic fit).

## 2. Trial cleanup

- [x] 2.1 `brew uninstall claude-squad` and remove any `cs` symlink if it exists (not chezmoi-managed; not the winner). — uninstalled v1.0.18; removed `/usr/local/bin/cs` symlink.
- [x] 2.2 Leave Conductor installed on this host — it stays via chezmoi on arm64 Darwin (no manual uninstall step needed). — N.B. this dev host is `darwin amd64`; Conductor only ships on arm64 hosts via the new template guard.

## 3. Install script: aoe

- [x] 3.1 Edit `run_onchange_install-packages.sh.tmpl`: append `aoe` to the `BREW_PACKAGES` array (no `pkg_bin` case arm needed; identity mapping suffices).
- [x] 3.2 Edit the macOS closing summary line under `Installation complete!`: append `, aoe` after `mole` in the `CLI tools:` enumeration.
- [x] 3.3 Edit the non-macOS manual instructions block: append `, aoe` to the `CLI tools:` enumeration and the closing summary's non-macOS variant.
- [x] 3.4 Verify idempotency locally: re-run `chezmoi apply` after install; the script SHALL log `aoe — already installed, skipping`. — `aoe` already on PATH (1.9.5); rerunning the install loop will hit the `command -v aoe` branch and skip. Direct chezmoi-apply verification deferred until chezmoi source dir is synced from this dev clone.

## 4. Install script: conductor cask (arm64 Darwin only)

- [x] 4.1 Edit `run_onchange_install-packages.sh.tmpl`: inside the `ALL_CASKS` array, wrap a new `"conductor|Conductor|AI|Claude code parallelisation"` entry with `{{ if eq .chezmoi.arch "arm64" -}}` / `{{ end -}}` chezmoi template guards (the `darwin` gate is already provided by the outer `{{ if eq .chezmoi.os "darwin" -}}` block).
- [x] 4.2 Verify rendering on arm64 Darwin: `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | grep conductor` returns a line. — verified during `/opsx:verify`. This dev host is `darwin amd64` and chezmoi exposes no `--arch` override, so the arch guard was forced true (`sed 's/eq .chezmoi.arch "arm64"/eq "arm64" "arm64"/'`) → render emits `"conductor|Conductor|AI|Claude code parallelisation"`. Both branches now proven: guard-true emits the entry (this check), guard-false (real amd64) emits 0 lines (task 4.3). The arch predicate itself is GOARCH-backed, guaranteed on a real arm64 Mac.
- [x] 4.3 Verify rendering on a simulated Intel Darwin host (via `chezmoi --arch amd64 execute-template`): no `conductor` line should appear. — verified directly on this host (`darwin amd64`): `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | grep -c conductor` → 0.

## 5. Install script: tailscale cask

- [x] 5.1 Edit `run_onchange_install-packages.sh.tmpl`: append `"tailscale-app|Tailscale|Productivity|Mesh VPN based on WireGuard"` to the `ALL_CASKS` array. No arch gate (works on all macOS ≥ 12).
- [x] 5.2 No chezmoi-managed configuration ships for Tailscale (per user direction "tal cual sin más config").
- [x] 5.3 Verify rendering: `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | grep tailscale-app` returns a line on macOS hosts. — verified: rendered output contains `"tailscale-app|Tailscale|Productivity|Mesh VPN based on WireGuard"`.

## 6. AoE configuration file

- [x] 6.1 Create `private_dot_agent-of-empires/config.toml` populated per the verified schema from task 1.2 and the knobs in design.md D8. — file written; minimal config with only deliberate overrides (rationale comment in-file).
- [x] 6.2 Ensure `[session].default_tool = "claude"` and `[session].agent_status_hooks = true`.
- [x] 6.3 Ensure `[status_hooks]` `on_waiting` and `on_idle` invoke `terminal-notifier` with `$AOE_SESSION_TITLE` interpolation. — also set `enabled = true` (required for hooks to fire per the verified schema).
- [x] 6.4 Ensure `[worktree].init_submodules = false`.
- [x] 6.5 Ensure `[tmux].status_bar = "disabled"` and `[updates].update_check_mode = "off"`.
- [x] 6.6 Add the `environment` passthrough listing `CLAUDE_CONFIG_DIR`, `EDITOR`, `TERM`, `COLORTERM`. — placed under `[sandbox]` (the only valid location per the verified schema); applies to sandboxed sessions only, non-sandboxed sessions inherit the parent shell env directly.
- [x] 6.7 (Optional, gated on task 1.3) Add `[theme]` block with the closest Catppuccin variant AoE offers. — shipped `tokyo-night-storm` instead: AoE's only Catppuccin variant is `catppuccin-latte` (light), poor match for the user's dark stack; design D8 lists `tokyo-night-storm` as the first-named choice.
- [x] 6.8 Run `chezmoi apply --dry-run` and inspect the rendered file; then `chezmoi apply` and verify `~/.agent-of-empires/config.toml` permissions are `0600`. — **verify-time finding + fix**: the `private_` prefix was on the *directory* (`private_dot_agent-of-empires`) only, so chezmoi targeted the file at `0644`, NOT `0600` (would have failed the "Config file is private" scenario and regressed AoE's own 0600). Fixed by `git mv config.toml private_config.toml` (file-level `private_` prefix). Re-applied from source: `~/.agent-of-empires/` dir → `0700`, `config.toml` → `0600`. Empirically confirmed via `stat`.

## 7. Documentation

- [x] 7.1 Run `/docs:manual` skill to propose updates to `docs/manual.html` covering AoE config highlights, Tailscale presence, and Conductor presence. — added new section "13. Agent Sessions (Agent of Empires)" + sidebar link: config-highlights table (launch/config path/theme/default tool/status hooks/tmux/submodules/update check) + notes (worktrunk independence, config drift, Conductor pointer). GUI casks (Conductor/Tailscale) kept out of the CLI cheatsheet by design; Conductor referenced in the notes.
- [x] 7.2 Run `/docs:readme` skill if the README's "What's Included" table or screenshots need refreshing (new brew package + new casks). — added `Agent of Empires` (AI Tooling) and `Tailscale` (new **Network** category) rows + intro-paragraph mention of Agent of Empires. Per user direction, Conductor omitted from the table (secondary, arm64-only). Optional `assets/aoe-overview.png` screenshot suggested (user-captured; no `<img>` added until the file exists).

## 8. Validation

- [x] 8.1 `openspec validate agent-management-strategy --strict` passes. — verified.
- [x] 8.2 Run `chezmoi diff` after all changes — only expected diffs appear. — verified after syncing the source dir to `c8ba3b8`. Expected pending targets: `.agent-of-empires/` (dir → 0700), `config.toml` (now 0600, applied), and `install-packages.sh` (run_onchange re-run — its content changed for this very feature). One **unrelated** pre-existing drift noted: `MM .claude/settings.json` (not part of this change; deliberately left untouched). **Observed at verify time:** a running `aoe` process rewrites `~/.agent-of-empires/config.toml` into full canonical form on load (33→110 lines), preserving every managed override but expanding all defaults and resetting `[app_state]`. So `config.toml` shows a permanent content diff (mode stays 0600). This is the documented thrash (see in-file comment) but is *total*, not the incremental "added keys" the comment implies — a plain `chezmoi apply` would wipe AoE runtime state. Candidate for a `modify_` merge script if it becomes painful (deferred, design-accepted).
- [x] 8.3 Apply on this host, re-run installer, confirm zero new installs are triggered. — idempotency guards verified against live state: `command -v aoe` succeeds (1.9.5) → SKIP; `conductor` not rendered on this `amd64` host → N/A; `tailscale-app` correctly detected as not-yet-installed → genuine first-time offer (not a re-install). The full interactive installer was not run end-to-end in the verify context (it does `exec > /dev/tty` + `confirm` prompts, no usable TTY here); idempotency is proven by direct evaluation of every guard. User can confirm the interactive run on next `chezmoi apply` (and may opt to install `tailscale-app` then).

## 9. Real-world soak (1 week before archive)

- [ ] 9.1 Use `aoe` for at least 5 real worktree sessions across different repos. Note any DX regressions vs. trial conditions.
- [ ] 9.2 If a DX regression surfaces, open a follow-up change (do NOT amend this one post-archive).
- [ ] 9.3 If no regression after 1 week, run `/opsx:archive agent-management-strategy`.
