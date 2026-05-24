## Why

This dotfiles repo already ships `appcleaner` (GUI app-uninstaller cask) for one-off Mac housekeeping, but no terminal-native equivalent exists for clearing system caches, logs, app remnants, and — most relevant for a Node/Bun heavy workflow — accumulated `node_modules`, build artifacts, and installer leftovers. [tw93/mole](https://github.com/tw93/mole) is a single Homebrew-core formula that delivers that scope as an interactive CLI with no configuration to manage, so adopting it is a low-cost, zero-maintenance addition to the brew packages group.

## What Changes

- Add `mole` to the `BREW_PACKAGES` array in `run_onchange_install-packages.sh.tmpl` (26th entry, after `age`).
- Append `mole` to the install script's closing summary `info` line (CLI tools list) under the macOS branch.
- Do **not** mention `mole` in the non-macOS branch's manual-install instructions — the formula declares `Required: macOS` and chezmoi already gates the entire brew-install block behind `{{ if eq .chezmoi.os "darwin" }}`, so the macOS-only nature is filtered natively.
- No `pkg_bin()` arm needed — the binary name is `mole`, identity mapping applies.
- No chezmoi-managed config file — mole has no rcfile; it is a menu-driven CLI invoked on demand.
- No Homebrew tap — `mole` lives in `homebrew-core`.
- Update `README.md` ("What's Included") and `docs/manual.html` via the `update-readme` and `update-manual` skills so the tool surfaces in user-facing documentation.

## Capabilities

### New Capabilities

- `mole-install`: brew installation of the `mole` binary from `homebrew-core` (no tap), integrated into the install script's brew packages group with the existing idempotency check (`command -v mole`), and gated to macOS by chezmoi's existing OS template guard.

### Modified Capabilities

- `cli-tool-expansion`: extend the `BREW_PACKAGES` contract from 25 → 26 entries to include `mole`. No change to `BREW_TAPS` (mole is in homebrew-core), no change to `pkg_bin()` (identity mapping), and the closing summary line's CLI-tools enumeration grows by one.

## Impact

- Files modified: `run_onchange_install-packages.sh.tmpl` (BREW_PACKAGES array, closing summary line), `README.md` (via `update-readme` skill), `docs/manual.html` (via `update-manual` skill).
- Files created: none.
- New external dependencies: the `mole` formula from `homebrew-core` (~MIT-licensed, requires macOS). No new tap, no new runtime dependency, no new shell hook.
- No changes to keybindings, shell init, aliases, hooks, or other CLI tools — `mole` is invoked bare and presents its own menu.
- Non-macOS hosts: unaffected. The brew packages block is already wrapped in `{{ if eq .chezmoi.os "darwin" }}`, so Linux/other branches neither install nor mention `mole`.
- Risk: `mole` is a cleanup tool that can delete files; however, installation alone is inert — destructive actions require explicit user navigation through its TUI menu. No automation in this repo invokes `mole`.
