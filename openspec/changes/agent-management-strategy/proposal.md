## Why

Currently using `claude agents` (Claude Code v2.1.150) ad-hoc to manage parallel agent sessions. A growing ecosystem (Conductor, Claude Squad, Agent of Empires) offers different DX bets. Need to (a) pick one as default based on measured DX against synthetic probes — not marketing — and (b) integrate the winner into chezmoi so it's versioned and reinstalled on new machines.

## What Changes

- Trial run against 4 candidates (`claude agents` built-in, Conductor, Claude Squad, Agent of Empires) on scratch tasks. JetBrains AIR excluded upfront: preview built on discontinued Fleet, no BYOK for Anthropic, macOS-only.
- **Trial outcome** (recorded for traceability):
    - **Primary winner: Agent of Empires** — tmux-native persistence, multi-provider auto-detect (Claude + OpenCode), status visibility, fits the existing tmux+worktree+ghostty stack.
    - **Conductor kept as secondary** for parallel-agent compare on Apple-Silicon hardware. Adopted into chezmoi alongside AoE, gated to arm64 Darwin.
    - **Claude Squad: discarded.**
    - **`claude agents` built-in: kept implicitly** (already part of Claude Code). No chezmoi work needed beyond ensuring Claude Code itself is installed.
- Integrate via chezmoi:
    - `aoe` → `BREW_PACKAGES` with `command -v` idempotency. No tap (homebrew-core).
    - `conductor` cask → added to the existing `ALL_CASKS` list, gated to `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }}`.
    - AoE config → `private_dot_agent-of-empires/config.toml` with deliberately chosen knobs (theme alignment, default tool, status hooks via `terminal-notifier`, tmux integration disabled, update check off).
- **Worktrunk integration (mandatory, not optional):**
    - AoE has no native worktree-delegation hook (verified — `agent-override` only swaps the agent command, not worktree creation).
    - Ship `dot_local/bin/executable_wt-aoe`: wrapper that pre-creates the worktree via `wt switch --create` (firing every `worktrunk` hook: `pre-start.save-base`, `post-start.install-deps`, etc.) and then `aoe add <path>` in attach-mode so AoE reuses the worktrunk-owned worktree without duplicating it.
    - Discipline note: bypassing `wt-aoe` and using bare `aoe add -b` falls back to AoE's native worktree path. Documented as a known limitation.
- Cleanup of trial leftovers: uninstall `claude-squad` from the current machine (not chezmoi-managed). Conductor stays on this machine (arm64 macOS → chezmoi reinstalls it anyway).
- Re-evaluation triggers (D7 in design.md): new mainstream competitor, AoE going low-maintenance, provider-stack shift, worktrunk API changes, recurring real-use pain.

## Capabilities

### New Capabilities

- `agent-manager`: chezmoi-managed install and configuration of parallel-agent session managers. Covers: `aoe` install via `BREW_PACKAGES` with idempotency; `conductor` cask install gated to arm64 Darwin; AoE TOML config under `private_dot_agent-of-empires/`; `wt-aoe` wrapper script under `dot_local/bin/` that delegates worktree lifecycle to `worktrunk`; closing-summary mention; guarantee that no automated AoE invocations exist (interactive-only TUI).

### Modified Capabilities

None directly. If the winner needs a new tap, the entry lives inside `agent-manager` (mirroring `mole-install`'s self-contained pattern), not as a delta on `cli-tool-expansion`.

## Impact

- **Code touched**:
    - `run_onchange_install-packages.sh.tmpl`: `aoe` added to `BREW_PACKAGES`; closing-summary line updated; `conductor` entry added to `ALL_CASKS` with arm64 Darwin guard.
    - `private_dot_agent-of-empires/config.toml`: new chezmoi-managed file (note: AoE breaks the `dot_config/<tool>/` convention — it reads from `~/.agent-of-empires/`, not `~/.config/agent-of-empires/`, on macOS).
    - `dot_local/bin/executable_wt-aoe`: new wrapper script delegating to `worktrunk`.
- **New external deps**: `aoe` (homebrew-core, MIT), `conductor` (cask). Both fully transitively depend on `tmux` (already present) and `openssl@3` (already a system dep).
- **Integrations**: `worktrunk` integration is part of the spec (wrapper script). No native delegation exists in AoE.
- **No breaking changes**: AoE/Conductor coexist with `claude agents` built-in; `wt-aoe` is opt-in (bare `aoe` still works, just without worktrunk hooks).
- **Platform notes**: `conductor` gated to `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }}`. Non-arm64 macOS and non-macOS branches SHALL NOT mention it. `aoe` cross-platform (Linux supported by upstream but install path differs — handled by existing `{{ if eq .chezmoi.os "darwin" -}}` ... `{{ else -}}` pattern in the install script).
