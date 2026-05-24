# mole-install Specification

## Purpose

Install and integrate the mole macOS cleanup CLI via the dotfiles' brew packages group, ensuring the binary is available on PATH on macOS hosts without any automated invocation or chezmoi-managed configuration.

## Requirements

### Requirement: mole binary is installed via the brew packages group

The install script `run_onchange_install-packages.sh.tmpl` SHALL include `mole` in the `BREW_PACKAGES` array under the `{{ if eq .chezmoi.os "darwin" }}` branch. `mole` SHALL be installed from `homebrew-core` (no `BREW_TAPS` entry required) using the same idempotency check applied to every other CLI in the array (`command -v mole` → skip).

#### Scenario: mole listed in BREW_PACKAGES

- **WHEN** the install script is loaded on a macOS host
- **THEN** the `BREW_PACKAGES` array contains `mole`

#### Scenario: mole maps to its own binary name

- **WHEN** `pkg_bin "mole"` is called
- **THEN** the function returns `mole` (via the default identity mapping; no dedicated `case` arm exists)

#### Scenario: Fresh install on macOS

- **WHEN** the brew packages group runs on a host where `command -v mole` fails AND the user confirms the group prompt
- **THEN** `brew install mole` is executed and `mole` becomes available on PATH

#### Scenario: Idempotent re-run

- **WHEN** the brew packages group runs on a host where `command -v mole` already succeeds
- **THEN** the script logs `mole — already installed, skipping` and does NOT invoke `brew install mole`

#### Scenario: Installation failure is non-fatal

- **WHEN** `brew install mole` fails (e.g., formula unavailable, network error)
- **THEN** the script increments the error counter, logs `Failed to install mole`, and continues with the remaining packages in `BREW_PACKAGES`

### Requirement: mole is not referenced in the non-macOS branch

The `{{ else -}}` (non-macOS) branch of the install script SHALL NOT mention `mole` in its manual-installation instructions. The macOS-only nature of the upstream formula is filtered natively by the existing `{{ if eq .chezmoi.os "darwin" }}` template guard.

#### Scenario: Linux instructions omit mole

- **WHEN** the install script runs on a non-macOS system
- **THEN** the printed manual instructions list the portable CLI tools (e.g., `git`, `ripgrep`, `ticker`) but do NOT mention `mole` and do NOT print a "macOS-only" notice for it

### Requirement: Closing summary line lists mole

The install script's final `info` line that enumerates installed CLI tools (printed under the macOS branch) SHALL include `mole` after `age` in the comma-separated CLI tools list.

#### Scenario: Summary mentions mole

- **WHEN** the macOS branch of the install script completes successfully
- **THEN** the closing `info "Installation complete!"` block's `CLI tools:` line includes the token `mole`

### Requirement: No chezmoi-managed configuration is shipped for mole

The dotfiles source tree SHALL NOT contain a chezmoi-managed `mole` configuration file (no `dot_config/mole/`, no `dot_molerc`, no encrypted variant). `mole` is invoked bare and uses its own interactive TUI for all user input.

#### Scenario: Source tree has no mole config

- **WHEN** the dotfiles repository is inspected after this change is applied
- **THEN** no file path under the chezmoi source tree contains the literal substring `mole` as a managed config target (only the install script and documentation reference `mole`)

### Requirement: mole is invoked only on demand, never automatically

The dotfiles SHALL NOT invoke `mole` from any script, hook, alias, chezmoi `run_*` script, git hook, or shell startup file. Because `mole` performs destructive cleanup actions, every invocation MUST be initiated explicitly by the user typing `mole`.

#### Scenario: No automated mole invocation

- **WHEN** any file in the dotfiles source tree is searched for `mole` as a command invocation (not as a string in `BREW_PACKAGES`, an `info` line, or documentation)
- **THEN** zero matches are found — `mole` appears only in install-script package lists, the closing summary, and user-facing docs
