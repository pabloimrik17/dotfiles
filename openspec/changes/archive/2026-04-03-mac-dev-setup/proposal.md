## Why

Setting up a new Mac requires dozens of manual steps: configuring system preferences, installing CLI tools, GUI apps, Node.js, and App Store apps. The current `run_once_install-packages.sh.tmpl` only covers 8 brew formulae, a font, Oh My Zsh, and plugin dependencies. GUI apps (30), macOS defaults (20+ settings), Node.js environment, and App Store apps are completely unautomated -- meaning a fresh Mac setup takes hours of manual work instead of a single `chezmoi apply`.

## What Changes

- **New script** `run_once_configure-macos-defaults.sh.tmpl` that configures Finder, Dock, trackpad, keyboard, and other macOS system settings idempotently via `defaults write`
- **Expand `BREW_PACKAGES`** in existing install script to include 9 missing CLI tools already in use (`fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, `mas`, `wget`, `opencode`) that would be lost on a fresh Mac
- **New install group** for 19 core + 11 optional GUI apps via `brew install --cask`, with per-app `/Applications/*.app` existence checks to avoid conflicts with manual installs
- **New install group** for Mac App Store apps (`Perplexity`, `Mela`) via `mas` CLI
- **New install group** for NVM (via official curl installer, not brew -- upstream explicitly unsupported), Node LTS, and `corepack enable` for pnpm/yarn
- **Manual install instructions** printed at the end for apps requiring licenses or special installers (Last.fm, CleanMyMac, Adobe CC, 1Password Safari extension)

## Capabilities

### New Capabilities

- `macos-defaults`: Chezmoi `run_once` script (`run_once_configure-macos-defaults.sh.tmpl`) that applies macOS system settings (Finder, Dock, trackpad, keyboard, hot corners, Siri) idempotently. macOS-only via chezmoi template guard.
- `gui-app-install`: Brew cask installation group with core apps (single confirmation) and optional apps (individual confirmation). Includes cask-to-app-name mapping and `/Applications/*.app` existence check to skip already-installed apps.
- `cli-tool-expansion`: Addition of 9 brew formulae (`fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, `mas`, `wget`, `opencode`) to the existing `BREW_PACKAGES` array, with updated `pkg_bin()` mappings. Special handling for `git` (always install brew version even if system git exists).
- `node-env-bootstrap`: NVM installation via official curl script (not brew), Node LTS install, default alias, and `corepack enable` for pnpm/yarn support. Idempotent (skips if already present).
- `appstore-install`: Mac App Store app installation via `mas` CLI. Requires user to be signed into App Store. Initial apps: Perplexity (6714467650), Mela (1568924476).

### Modified Capabilities

_(none -- existing specs are unaffected)_

## Impact

- **Files created**: `run_once_configure-macos-defaults.sh.tmpl`
- **Files modified**: `run_once_install-packages.sh.tmpl` (new groups added, BREW_PACKAGES expanded, group numbering shifted)
- **Dependencies**: `mas` (brew formula, installed in Group 1) required for App Store group; `nvm` (installed via curl in Group 6) required for Node/corepack steps
- **Ordering**: macOS defaults script runs independently (chezmoi `run_once_` ordering is alphabetical by filename). Install script groups have internal ordering: brew formulae first (installs `mas`), then casks, then MAS apps, then NVM/Node.
- **Cross-references**: `git` formula overlaps with existing `git-dotfile-proposal` change (referenced, not duplicated). The `fd` formula fixes a broken `FZF_DEFAULT_COMMAND` in the current `.zshrc`.
- **Non-macOS**: Install script already has a non-macOS branch that prints manual instructions. New groups need equivalent fallback messages.
