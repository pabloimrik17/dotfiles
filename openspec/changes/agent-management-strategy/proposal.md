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
    - `tailscale-app` cask → added to `ALL_CASKS`. Installed as-is, no further config managed by chezmoi (per user direction).
    - AoE config → `private_dot_agent-of-empires/config.toml` with deliberately chosen knobs (theme alignment, default tool, status hooks via `terminal-notifier`, tmux integration disabled, update check off).
- **Worktrunk integration: out of scope.** AoE has no native worktree-delegation hook (verified — `agent-override` only swaps the agent command). A wrapper-script workaround was considered and rejected: requires discipline (must always use the wrapper, easy to bypass) and adds maintenance overhead. AoE creates its own worktrees; worktrunk hooks do NOT fire for AoE-managed sessions. Acceptable for now; reopen if a native delegation hook lands upstream.
- Cleanup of trial leftovers: uninstall `claude-squad` from the current machine (not chezmoi-managed). Conductor stays on this machine (arm64 macOS → chezmoi reinstalls it anyway).
- Re-evaluation triggers (D7 in design.md): new mainstream competitor, AoE going low-maintenance, provider-stack shift, worktrunk API changes, recurring real-use pain.

## Capabilities

### New Capabilities

- `agent-manager`: chezmoi-managed install and configuration of parallel-agent session managers. Covers: `aoe` install via `BREW_PACKAGES` with idempotency; `conductor` cask install gated to arm64 Darwin; AoE TOML config under `private_dot_agent-of-empires/` with deliberate knobs; closing-summary mention; guarantee that no automated AoE invocations exist (interactive-only TUI).
- `tailscale-install`: chezmoi-managed install of the official Tailscale macOS app via cask. No configuration files managed by chezmoi (Tailscale signs the user in via its own UI flow on first launch).

### Modified Capabilities

None directly. If the winner needs a new tap, the entry lives inside `agent-manager` (mirroring `mole-install`'s self-contained pattern), not as a delta on `cli-tool-expansion`.

## Impact

- **Code touched**:
    - `run_onchange_install-packages.sh.tmpl`: `aoe` added to `BREW_PACKAGES`; closing-summary line updated; `conductor` and `tailscale-app` entries added to `ALL_CASKS` (Conductor with arm64 Darwin guard, Tailscale unconditional under the macOS branch).
    - `private_dot_agent-of-empires/config.toml`: new chezmoi-managed file (note: AoE breaks the `dot_config/<tool>/` convention — it reads from `~/.agent-of-empires/`, not `~/.config/agent-of-empires/`, on macOS).
- **New external deps**: `aoe` (homebrew-core, MIT), `conductor` cask, `tailscale-app` cask (requires macOS ≥ 12, kernel extension). `aoe` transitively depends on `tmux` (already present) and `openssl@3` (already a system dep).
- **Integrations**: none beyond the install script. Worktrunk integration explicitly out of scope (see "What Changes").
- **No breaking changes**: AoE/Conductor coexist with `claude agents` built-in. AoE manages its own worktrees independently of worktrunk.
- **Platform notes**: `conductor` gated to `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }}`. Non-arm64 macOS and non-macOS branches SHALL NOT mention it. `aoe` cross-platform (Linux supported by upstream but install path differs — handled by existing `{{ if eq .chezmoi.os "darwin" -}}` ... `{{ else -}}` pattern in the install script).
