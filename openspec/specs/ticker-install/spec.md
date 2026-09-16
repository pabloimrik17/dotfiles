# Capability: ticker-install

## Purpose

ticker brew installation via the `achannarasappa/tap` tap during the install script, plus the manual install path documented for non-macOS hosts.

## Requirements

### Requirement: ticker is installed via the achannarasappa/tap Homebrew tap

The install script SHALL install the `ticker` binary on macOS by granting `achannarasappa/tap` trust, tapping it, and then running `brew install achannarasappa/tap/ticker`. The tap step SHALL run unconditionally on every script invocation, relying on `brew tap`'s native idempotency — re-runs SHALL exit 0 without re-fetching the tap. The install step SHALL participate in the existing brew packages group's confirm prompt and idempotency logic — re-runs on a host with `ticker` already in PATH SHALL skip the install with an informational message.

The formula SHALL be addressed by its fully-qualified name. Homebrew 6 refuses to load a formula from an untrusted tap addressed by bare name (`brew install ticker` fails with `Refusing to load formula...`), and it omits untrusted taps from `brew outdated` entirely — which is how `ticker` reached three months of undetected drift.

#### Scenario: Fresh macOS install adds the tap and installs ticker

- **WHEN** the install script runs on a macOS host where `ticker` is not in PATH and `achannarasappa/tap` is not yet tapped, and the user accepts the brew packages group prompt
- **THEN** the script trusts `achannarasappa/tap`, taps it, runs `brew install achannarasappa/tap/ticker`, and the `ticker` binary becomes available in PATH

#### Scenario: ticker already installed is skipped

- **WHEN** the brew packages group's install loop runs on a host where `command -v ticker` already succeeds
- **THEN** the script logs `achannarasappa/tap/ticker — already installed, skipping` and does not run the install again
- **AND** on a host where every entry is already present the pre-scan short-circuits before the loop, reporting `Brew packages: 29/29 installed` instead

#### Scenario: Tap is idempotent across runs

- **WHEN** the install script runs and `achannarasappa/tap` is already tapped
- **THEN** `brew tap achannarasappa/tap` exits 0 without re-fetching the tap and the script continues without warning

#### Scenario: Bare formula name is not used

- **WHEN** the install script's `BREW_PACKAGES` array is read
- **THEN** it lists the formula as `achannarasappa/tap/ticker`, not as `ticker`, so the install loop runs `brew install achannarasappa/tap/ticker`

#### Scenario: ticker drift is reported

- **WHEN** a newer `ticker` release exists and the tap is trusted
- **THEN** `brew outdated` lists it, so the package cannot silently fall behind

### Requirement: Non-macOS branch documents the manual install path for ticker

When the install script runs on a non-macOS platform, the printed manual installation instructions SHALL include `ticker` alongside the other CLI tools, with an install hint pointing at the upstream-recommended path (downloading a pre-compiled binary from the GitHub releases page or using a distribution-native package). The non-macOS branch SHALL NOT attempt to fetch or install `ticker` automatically.

#### Scenario: Linux instructions mention ticker

- **WHEN** the script is executed on a non-darwin host
- **THEN** the printed instructions list `ticker` among the CLI tools with a manual install hint

### Requirement: Closing summary lists ticker

The closing `info` line of the install script that enumerates installed CLI tools SHALL include `ticker` in the comma-separated list, so the user sees confirmation that the tool is part of the standard toolchain.

#### Scenario: Summary line includes ticker

- **WHEN** the install script reaches the closing summary `info` line
- **THEN** the printed comma-separated CLI tools list includes `ticker`
