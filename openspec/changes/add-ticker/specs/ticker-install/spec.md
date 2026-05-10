## ADDED Requirements

### Requirement: ticker is installed via the achannarasappa/tap Homebrew tap

The install script SHALL install the `ticker` binary on macOS by tapping `achannarasappa/tap` and then running `brew install ticker`. The tap step SHALL run unconditionally on every script invocation, relying on `brew tap`'s native idempotency — re-runs SHALL exit 0 without re-fetching the tap. The install step SHALL participate in the existing brew packages group's confirm prompt and idempotency logic — re-runs on a host with `ticker` already in PATH SHALL skip the install with an informational `already installed, skipping` message.

#### Scenario: Fresh macOS install adds the tap and installs ticker

- **WHEN** the install script runs on a macOS host where `ticker` is not in PATH and `achannarasappa/tap` is not yet tapped, and the user accepts the brew packages group prompt
- **THEN** the script runs `brew tap achannarasappa/tap` followed by `brew install ticker`, and the `ticker` binary becomes available in PATH

#### Scenario: ticker already installed is skipped

- **WHEN** the install script runs and `command -v ticker` returns success
- **THEN** the script logs `ticker — already installed, skipping` and does not run `brew install ticker` again

#### Scenario: Tap is idempotent across runs

- **WHEN** the install script runs and `achannarasappa/tap` is already tapped
- **THEN** `brew tap achannarasappa/tap` exits 0 without re-fetching the tap and the script continues without warning

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
