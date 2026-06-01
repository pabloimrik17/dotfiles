# tailscale-install Specification

## Purpose

Install the Tailscale macOS app via the dotfiles' brew casks group on macOS hosts, relying on Tailscale's own UI/CLI for account login and routing config, without shipping any chezmoi-managed configuration and without referencing Tailscale in the non-macOS branch.

## Requirements

### Requirement: Tailscale is installed via the brew casks group

The install script `run_onchange_install-packages.sh.tmpl` SHALL include `tailscale-app` in the `ALL_CASKS` array under the `{{ if eq .chezmoi.os "darwin" }}` branch. `tailscale-app` SHALL be installed via the existing cask pre-scan / picker flow used by every other cask in the array, relying on the same `is_cask_installed` idempotency check. No `BREW_TAPS` entry is required (cask is in `homebrew/cask`). No chezmoi-managed configuration files SHALL be added for Tailscale; the user signs in via Tailscale's own UI on first launch.

#### Scenario: tailscale-app listed in ALL_CASKS

- **WHEN** the install script is rendered on a macOS host
- **THEN** the `ALL_CASKS` array contains an entry whose first `|`-separated field is `tailscale-app`

#### Scenario: Fresh install on macOS

- **WHEN** the cask group runs on a macOS host where `/Applications/Tailscale.app` does NOT exist AND `brew list --cask tailscale-app` fails AND the user selects `tailscale-app` in the cask picker (or accepts the per-cask prompt when ≤3 are pending)
- **THEN** `brew install --cask tailscale-app` is executed

#### Scenario: Idempotent re-run

- **WHEN** the cask group runs on a host where `/Applications/Tailscale.app` exists OR `brew list --cask tailscale-app` succeeds
- **THEN** the entry is detected as installed by `is_cask_installed` and is excluded from the `PENDING_CASKS` list

#### Scenario: Installation failure is non-fatal

- **WHEN** `brew install --cask tailscale-app` fails (e.g., kernel-extension approval pending, network error)
- **THEN** the script increments the error counter, logs `Failed to install cask tailscale-app`, and continues with the remaining casks

### Requirement: No chezmoi-managed configuration is shipped for Tailscale

The dotfiles source tree SHALL NOT contain a chezmoi-managed Tailscale configuration file (no `dot_config/tailscale/`, no `private_dot_tailscale*`, no encrypted variant, no preferences plist). Tailscale account login and routing config are handled by Tailscale's own UI/CLI and persisted in `/Library/Application Support/Tailscale/` (system-level, not user-level), which is outside the chezmoi-managed surface.

#### Scenario: Source tree has no tailscale config

- **WHEN** the dotfiles repository is inspected after this change is applied
- **THEN** no file path under the chezmoi source tree contains the literal substring `tailscale` as a managed config target (only the install script and documentation reference `tailscale-app`)

### Requirement: Tailscale is not referenced in the non-macOS branch

The `{{ else -}}` (non-macOS) branch of the install script SHALL NOT mention `tailscale-app` in its manual-installation instructions. The macOS-only nature of the cask is filtered natively by the existing `{{ if eq .chezmoi.os "darwin" }}` template guard. Linux users install Tailscale via their distro's package manager (out of scope for these dotfiles).

#### Scenario: Linux instructions omit tailscale

- **WHEN** the install script runs on a non-macOS system
- **THEN** the printed manual instructions do NOT mention `tailscale-app` and do NOT print a "macOS-only" notice for it
