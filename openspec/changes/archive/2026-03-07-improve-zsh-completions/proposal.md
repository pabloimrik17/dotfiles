## Why

The current ZSH setup lacks `zsh-completions`, a package that provides ~300+ additional completion definitions for commands not covered by Oh-My-Zsh's built-in `compinit`. Tools already installed in the dotfiles (like `fd`, `rg`, `brew`) have no tab-completion beyond what their individual `eval` or `source` lines provide. Adding `zsh-completions` closes this gap with minimal config changes.

## What Changes

- Install `zsh-completions` via Homebrew (macOS) or document manual install (Linux)
- Add `zsh-completions` directory to `FPATH` before Oh-My-Zsh sources `compinit`, using the existing chezmoi OS/arch templating pattern
- Mention `zsh-completions` in the non-macOS manual install instructions

## Capabilities

### New Capabilities

- `zsh-completions`: Installation and FPATH integration of the zsh-completions package across macOS (Homebrew, arm64/x86) and Linux, loaded before Oh-My-Zsh's `compinit`

### Modified Capabilities

_(none — no existing spec-level requirements change)_

## Impact

- **Files modified**: `dot_zshrc.tmpl`, `run_once_install-packages.sh.tmpl`
- **Dependencies**: New Homebrew package `zsh-completions`
- **Risk**: Minimal. FPATH addition is guarded by the same chezmoi OS/arch conditionals already in use. If the package is missing, completions silently fall back to OMZ defaults.
