## Why

The dotfiles currently treat Claude Code as one global login and have no machine-level distinction between personal and work policy, leaving account rotation, quota checks, and login-service setup manual. A pinned `claude-swap` integration can make the two-account workflow reproducible on macOS while keeping credentials client-owned and preserving the existing Claude launch shim.

## What Changes

- Add an immutable, machine-local `personal`/`work` choice to the chezmoi initialization data, required with no default.
- Install the macOS menubar extra of `claude-swap` at an exact version with a uv-managed Python; classify it as repo-pinned, updated by pin bump plus `chezmoi apply`, and keep it out of `update-extra`.
- Add a re-runnable guided bootstrap that can be offered after first install, enrolls only the accounts allowed by the machine type, assigns the native `personal`/`work` aliases, validates dry-run behavior, and delegates LaunchAgent ownership to `cswap menubar --install-service`.
- Manage the public `claude-swap` autoswitch policy declaratively: 85% threshold, 5-hour/7-day binding windows, `best` strategy, 60-second checks, 300-second cooldown, 10-point hysteresis, three unhealthy ticks, and no model-specific or API-key fallback.
- Keep credentials, exports, cache, autoswitch state, and the menu's private settings outside chezmoi; require the user to enable the menu's auto-switch toggle once on personal machines and keep it disabled on work machines.
- Preserve the active account across restarts and use upstream's global switching, blocked-state, failover, notification, and manual-control behavior, including the accepted best-effort limitation under stale HTTP 429 usage data.
- Keep the existing `claude` Node/AoE shim unchanged and add explicit shell aliases for listing accounts, inspecting the active account, and performing a global switch.
- Document the selected tool, setup, security boundaries, operating workflows, pause/update/recovery paths, and known limitations in README and the existing Claude Code manual section.

## Capabilities

### New Capabilities

- `machine-type-config`: Require and persist the immutable local `personal`/`work` machine classification used by role-dependent dotfiles behavior.
- `claude-swap-install`: Install and update the pinned macOS tool, expose a safe re-runnable bootstrap, and delegate the menu LaunchAgent to upstream.
- `claude-swap-account-policy`: Define role-specific account enrollment, declarative autoswitch settings, credential ownership, runtime switching behavior, validation, recovery, and accepted limitations.

### Modified Capabilities

- `zsh-aliases`: Add `cs-list`, `cs-current`, and `cs-global` aliases with explicit global-switch semantics.
- `readme-content`: Include `claude-swap` in the managed-tool overview and describe the machine-type prompt and post-install account bootstrap.
- `manual-web`: Extend the existing Claude Code section with `claude-swap` setup, aliases, menu controls, update, validation, security, and recovery guidance without changing the 15-section structure.

## Impact

- **Chezmoi data**: `.chezmoi.toml.tmpl` gains the required per-machine classification; no global environment variable is added.
- **Installation/bootstrap**: `run_onchange_install-packages.sh.tmpl` installs the exact uv-tool requirement on macOS and integrates a new managed setup command; non-macOS hosts explicitly skip it.
- **Managed config**: only the public `~/.claude-swap-backup/settings.json` policy enters source state. Keychain items and other `~/.claude-swap-backup/` contents remain runtime-owned and untracked.
- **Shell/runtime**: `dot_zshrc.tmpl` gains three aliases. `dot_local/bin/shims/executable_claude`, its PATH contract, and all current launchers remain unchanged.
- **Services**: upstream owns `~/Library/LaunchAgents/com.cswap.menubar.plist`; the bootstrap installs, verifies, and refreshes it after a pin change.
- **Update classification**: repo-pinned; no `update-extra` step and no Homebrew formula/cask entry.
- **Documentation/tests**: README, Section 11 of `docs/manual.html`, installer/config/bootstrap tests, alias tests, and regression coverage for the existing Claude shim.
