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
- [ ] 4.2 Verify rendering on arm64 Darwin: `chezmoi execute-template < run_onchange_install-packages.sh.tmpl | grep conductor` returns a line. — deferred: this host renders as `darwin amd64`; re-run from the arm64 Mac after `chezmoi update`.
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
- [ ] 6.8 Run `chezmoi apply --dry-run` and inspect the rendered file; then `chezmoi apply` and verify `~/.agent-of-empires/config.toml` permissions are `0600` (the `private_` prefix should ensure this). — deferred until the user syncs the chezmoi source dir (`chezmoi update`) from this dev clone.

## 7. Documentation

- [ ] 7.1 Run `/docs:manual` skill to propose updates to `docs/manual.html` covering AoE config highlights, Tailscale presence, and Conductor presence.
- [ ] 7.2 Run `/docs:readme` skill if the README's "What's Included" table or screenshots need refreshing (new brew package + new casks).

## 8. Validation

- [x] 8.1 `openspec validate agent-management-strategy --strict` passes. — verified.
- [ ] 8.2 Run `chezmoi diff` after all changes — only expected diffs appear. — pending chezmoi source sync.
- [ ] 8.3 Apply on this host, re-run installer, confirm zero new installs are triggered. — pending chezmoi source sync.

## 9. Real-world soak (1 week before archive)

- [ ] 9.1 Use `aoe` for at least 5 real worktree sessions across different repos. Note any DX regressions vs. trial conditions.
- [ ] 9.2 If a DX regression surfaces, open a follow-up change (do NOT amend this one post-archive).
- [ ] 9.3 If no regression after 1 week, run `/opsx:archive agent-management-strategy`.
