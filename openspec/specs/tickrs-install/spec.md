# Capability: tickrs-install

## Purpose

tickrs brew installation via the `tarkah/tickrs` tap during the install script, plus the cargo-based fallback documented for non-macOS hosts.

## Requirements

### Requirement: tickrs is installed via the tarkah/tickrs Homebrew tap

The install script SHALL install the `tickrs` binary on macOS by granting `tarkah/tickrs` trust, tapping it, and then running `brew install tarkah/tickrs/tickrs`. The tap step SHALL run unconditionally on every script invocation, relying on `brew tap`'s native idempotency — re-runs SHALL exit 0 without re-fetching the tap. The install step SHALL participate in the existing brew packages group's confirm prompt and idempotency logic — re-runs on a host with `tickrs` already in PATH SHALL skip the install with an informational message.

The formula SHALL be addressed by its fully-qualified name, for the same reason as `ticker`: Homebrew 6 refuses to load a bare-named formula from an untrusted tap, and omits untrusted taps from `brew outdated`.

#### Scenario: Fresh macOS install adds the tap and installs tickrs

- **WHEN** the install script runs on a macOS host where `tickrs` is not in PATH and `tarkah/tickrs` is not yet tapped, and the user accepts the brew packages group prompt
- **THEN** the script trusts `tarkah/tickrs`, taps it, runs `brew install tarkah/tickrs/tickrs`, and the `tickrs` binary becomes available in PATH

#### Scenario: tickrs already installed is skipped

- **WHEN** the brew packages group's install loop runs on a host where `command -v tickrs` already succeeds
- **THEN** the script logs `tarkah/tickrs/tickrs — already installed, skipping` and does not run the install again
- **AND** on a host where every entry is already present the pre-scan short-circuits before the loop, reporting `Brew packages: 29/29 installed` instead

#### Scenario: Tap is idempotent across runs

- **WHEN** the install script runs and `tarkah/tickrs` is already tapped
- **THEN** `brew tap tarkah/tickrs` exits 0 without re-fetching the tap and the script continues without warning

#### Scenario: Bare formula name is not used

- **WHEN** the install script's `BREW_PACKAGES` array is read
- **THEN** it lists the formula as `tarkah/tickrs/tickrs`, not as `tickrs`, so the install loop runs `brew install tarkah/tickrs/tickrs`

### Requirement: Non-macOS branch documents the cargo install path for tickrs

When the install script runs on a non-macOS platform, the printed manual installation instructions SHALL include `tickrs` alongside the other CLI tools, with the install hint `cargo install tickrs` (the upstream-recommended Linux path). The non-macOS branch SHALL NOT attempt to invoke `cargo` automatically.

#### Scenario: Linux instructions mention tickrs and cargo

- **WHEN** the script is executed on a non-darwin host
- **THEN** the printed instructions list `tickrs` among the CLI tools and recommend `cargo install tickrs` as the install command

### Requirement: Closing summary lists tickrs

The closing `info` line of the install script that enumerates installed CLI tools SHALL include `tickrs` in the comma-separated list, so the user sees confirmation that the tool is part of the standard toolchain.

#### Scenario: Summary line includes tickrs

- **WHEN** the install script reaches the closing summary `info` line
- **THEN** the printed comma-separated CLI tools list includes `tickrs`
