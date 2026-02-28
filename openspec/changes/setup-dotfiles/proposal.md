## Why

Config drift across 3 machines (2 macOS, 1 future Windows). Ghostty, Zsh, and Claude Code configs are maintained manually on each — when a keybind, alias, or setting is discovered/tweaked, there's no way to propagate it. Need a single source of truth with easy sync.

## What Changes

- New dedicated `dotfiles` repo managed by chezmoi
- Ghostty config + catppuccin themes as chezmoi source state
- Zsh ecosystem: `.zshrc` (templated for machine-specific paths), `starship.toml`, aliases, oh-my-zsh plugin declarations
- Claude Code `settings.json` (global only — `settings.local.json` excluded as machine-local override by design)
- chezmoi templates (`.tmpl`) for files containing machine-specific paths (`$HOME` vs hardcoded `/Users/<user>/`)
- `run_once` install scripts with interactive confirmation for dependency groups (brew packages, fonts, oh-my-zsh + plugins)
- `.chezmoiignore` with OS-conditional rules for future cross-platform support
- chezmoi init template (`.chezmoi.toml.tmpl`) for per-machine config prompts

## Capabilities

### New Capabilities

- `chezmoi-config`: chezmoi setup — `.chezmoi.toml.tmpl` for machine-specific variables, `.chezmoiignore` for OS-conditional exclusions, repo structure conventions
- `ghostty-config`: Ghostty terminal config + catppuccin themes as chezmoi-managed source state
- `zsh-config`: Zsh ecosystem — templated `.zshrc` (oh-my-zsh, plugins, aliases, tool integrations), `starship.toml` prompt config
- `claude-code-config`: Claude Code `settings.json` sync (global settings only, local overrides excluded)
- `dependency-bootstrap`: `run_once` scripts that install tool dependencies (brew packages, Hack Nerd Font, oh-my-zsh, zsh plugins) with interactive confirmation per group

### Modified Capabilities

None — all new, dedicated repo.

## Impact

- **New repo**: `dotfiles` on GitHub (separate from monolab)
- **External deps**: chezmoi (single binary, installed via brew or curl)
- **Managed configs**: `~/.config/ghostty/`, `~/.zshrc`, `~/.config/starship.toml`, `~/.claude/settings.json`
- **Bootstrap installs**: starship, eza, bat, zoxide, atuin, fzf, ripgrep, lazygit, Hack Nerd Font, oh-my-zsh, zsh-autosuggestions, zsh-syntax-highlighting, you-should-use plugin
- **Not managed**: `~/.claude/settings.local.json`, oh-my-zsh plugin source code, brew itself (prerequisite)
- **Windows**: deferred — `.chezmoiignore` + OS conditionals prepared for when needed
- **Zero impact** on monolab or any existing projects
