## Why

Managing parallel AI agent workflows requires isolating git worktrees, but native git worktree commands are verbose and error-prone. Worktrunk simplifies this to single commands (`wt switch`, `wt merge`, `wt remove`) and integrates directly with Claude Code. Adding it to dotfiles ensures consistent setup across machines with shell integration, default hooks, and the Claude Code plugin pre-configured.

## What Changes

- Add `worktrunk` to brew packages in the install script with idempotent checks
- Add worktrunk shell integration line to `.zshrc` template (replaces running `wt config shell install`)
- Add chezmoi-managed user config at `~/.config/worktrunk/config.toml` with a generic post-create hook that detects the project's package manager by lockfile and runs install
- Enable the `worktrunk@worktrunk` Claude Code plugin in `settings.json.tmpl`
- Add worktrunk to the non-macOS manual instructions section

## Capabilities

### New Capabilities
- `worktrunk-install`: Brew installation of worktrunk with idempotent checks and shell integration baked into the zshrc template
- `worktrunk-config`: Chezmoi-managed static user config with a universal post-create hook that detects bun/pnpm/npm by lockfile presence
- `worktrunk-claude-plugin`: Enable the worktrunk Claude Code plugin for configuration skills and worktree activity tracking

### Modified Capabilities

_(No existing spec-level behavior changes — `zsh-shell-config` and `claude-code-settings` are not specced capabilities)_

## Impact

- **Install script** (`run_once_install-packages.sh.tmpl`): worktrunk added to Group 1 brew packages
- **Zsh config** (`dot_zshrc.tmpl`): New eval line for worktrunk shell integration
- **New file** (`dot_config/worktrunk/config.toml`): User-level worktrunk configuration with post-create hook
- **Claude settings** (`dot_claude/settings.json.tmpl`): New plugin entry `worktrunk@worktrunk`
- **Dependencies**: Requires brew (macOS), git; optional runtime deps: bun, pnpm, or npm for post-create hook
