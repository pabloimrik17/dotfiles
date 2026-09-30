# Capability: tuicr-install

## Purpose

tuicr (code review TUI) brew installation during the install script, plus the manual install hint for non-macOS hosts.

## ADDED Requirements

### Requirement: tuicr is installed via brew

The `BREW_PACKAGES` array SHALL include `tuicr` so the binary is installed during the brew packages group (homebrew-core formula; `libgit2` arrives as its dependency; ships no x86_64 macOS bottle, so an Intel host source-builds it with `rust` on every install/upgrade, per the script's Platform-constraint block). The entry SHALL participate in the group's existing confirm prompt and idempotency logic.

#### Scenario: tuicr included in brew packages

- **WHEN** the install script runs the brew packages group on a host without tuicr
- **THEN** `tuicr` is listed in `BREW_PACKAGES` and installed via `brew install tuicr`

#### Scenario: tuicr already installed is skipped

- **WHEN** the brew packages group's install loop runs on a host where `command -v tuicr` already succeeds (some other package is pending and the user confirms the install prompt)
- **THEN** the script logs `tuicr — already installed, skipping` and does NOT invoke `brew install`
- **AND** on a host where every `BREW_PACKAGES` entry is already installed, the pre-scan short-circuits before the loop, reporting `Brew packages: N/N installed` instead

### Requirement: Non-macOS instructions mention tuicr

The non-macOS manual-install block SHALL list `tuicr` among the CLI tools and include the hint `cargo install tuicr` (or the official installer `curl -fsSL tuicr.dev/install.sh | sh`).

#### Scenario: Linux instructions include tuicr

- **WHEN** the script is executed on a non-darwin host
- **THEN** the printed CLI tools list includes `tuicr` with a cargo/curl install hint

### Requirement: Closing summary line lists tuicr

The install script's final `info "Installation complete!"` block's `CLI tools:` line SHALL include `tuicr` after `llmfit` in the comma-separated CLI tools list, on both the macOS branch and the non-macOS branch.

#### Scenario: macOS summary mentions tuicr

- **WHEN** the macOS branch of the install script completes successfully
- **THEN** the closing `info "Installation complete!"` block's `CLI tools:` line includes the token `tuicr`

#### Scenario: Non-macOS summary mentions tuicr

- **WHEN** the non-macOS branch of the install script completes successfully
- **THEN** the closing `info "Installation complete!"` block's `CLI tools:` line includes the token `tuicr`
