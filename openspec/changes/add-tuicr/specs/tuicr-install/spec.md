# Capability: tuicr-install

## Purpose

tuicr (code review TUI) brew installation during the install script, plus the manual install hint for non-macOS hosts.

## ADDED Requirements

### Requirement: tuicr is installed via brew

The `BREW_PACKAGES` array SHALL include `tuicr` so the binary is installed during the brew packages group (homebrew-core formula; `libgit2` arrives as its dependency). The entry SHALL participate in the group's existing confirm prompt and idempotency logic.

#### Scenario: tuicr included in brew packages

- **WHEN** the install script runs the brew packages group on a host without tuicr
- **THEN** `tuicr` is listed in `BREW_PACKAGES` and installed via `brew install tuicr`

#### Scenario: tuicr already installed is skipped

- **WHEN** the install script runs and `tuicr` is already installed via brew
- **THEN** the script logs `tuicr — already installed, skipping` and does not reinstall

### Requirement: Non-macOS instructions mention tuicr

The non-macOS manual-install block SHALL list `tuicr` among the CLI tools and include the hint `cargo install tuicr` (or the official installer `curl -fsSL tuicr.dev/install.sh | sh`).

#### Scenario: Linux instructions include tuicr

- **WHEN** the script is executed on a non-darwin host
- **THEN** the printed CLI tools list includes `tuicr` with a cargo/curl install hint
