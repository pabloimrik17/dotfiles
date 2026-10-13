# Spec Delta

## Purpose

Installs the 1Password CLI (`op`) on macOS from the Homebrew `1password-cli` cask, frozen at a
declared version, and tells the user how to connect it to the 1Password desktop app.

## ADDED Requirements

### Requirement: op is a frozen Homebrew cask installed with the brew packages group

The macOS branch SHALL install `op` as the cask `1password-cli` (declared in `BREW_CLI_CASKS`) when the user accepts the brew packages group, counting it in that group's pending tally. It SHALL count as installed only when `brew list --cask 1password-cli` succeeds. `BREW_VERSIONS` SHALL declare `1password-cli|2.41.0`, and the freeze SHALL pin it as a cask.

#### Scenario: Fresh macOS host installs and pins op

- **WHEN** the install script runs on a macOS host without the `1password-cli` cask and the user
  accepts the brew packages group
- **THEN** the script runs `brew install --cask 1password-cli` and pins the cask in the same run
- **AND** `command -v op` resolves under `$(brew --prefix)/bin`

#### Scenario: An installed cask is not reinstalled

- **WHEN** the pre-scan runs on a host where `brew list --cask 1password-cli` succeeds
- **THEN** it counts `1password-cli` as installed and installs nothing for it

#### Scenario: An op outside Homebrew does not count as installed

- **WHEN** `op` is on `PATH` from 1Password's own installer and the `1password-cli` cask is absent
- **THEN** the pre-scan counts `1password-cli` as pending

#### Scenario: The version table declares the cask once

- **WHEN** `BREW_VERSIONS` is read
- **THEN** it holds exactly one row for the cask, `1password-cli|2.41.0`, in alphabetical position

#### Scenario: op is not a hold

- **WHEN** `BREW_HOLDS` is read
- **THEN** it has no `1password-cli` or `op` entry

### Requirement: op uses the frozen brew update path

Only a reviewed bump of the `1password-cli` row SHALL move the declared version. The upgrade path SHALL be `brew-upgrade-pinned 1password-cli` followed by that bump. `update-extra` SHALL NOT update `op`, and the repo SHALL NOT call `op update`, which downloads releases outside Homebrew.

#### Scenario: A reviewed upgrade keeps the cask pinned

- **WHEN** `op` is upgraded with `brew-upgrade-pinned 1password-cli` and its row is bumped to the
  installed version
- **THEN** the cask is pinned again and the next install run prints no drift warning for it

#### Scenario: update-extra does not touch op

- **WHEN** `update-extra` runs
- **THEN** it runs no `op` or `1password-cli` updater

### Requirement: The install script prints op app-integration guidance on both branches

The install script SHALL print `op` guidance in its manual-instructions output on both the macOS and the non-macOS branch. It SHALL tell the user to unlock the 1Password desktop app and turn on Settings → Developer → Integrate with 1Password CLI, so `op` signs in through the app instead of a stored secret.

#### Scenario: macOS guidance names the app setting

- **WHEN** the macOS branch prints its manual instructions
- **THEN** the `op` guidance names Settings → Developer → Integrate with 1Password CLI

#### Scenario: Non-macOS guidance matches

- **WHEN** the non-macOS branch prints its manual instructions
- **THEN** the same `op` guidance is printed

### Requirement: The repo manages no op configuration or credentials

The repository SHALL NOT manage any path under `~/.config/op`, where `op` keeps its account and session state, and SHALL NOT contain a 1Password secret key, account password, session token or service account token in any form.

#### Scenario: No managed path targets the op config directory

- **WHEN** the chezmoi source tree is searched for paths that target `~/.config/op/`
- **THEN** none is found

### Requirement: The install script lists op on both branches

The final `Installation complete!` block's `CLI tools:` line SHALL include `op` after `gws` on both branches. The non-macOS manual `CLI tools:` list SHALL also include `op` after `gws`, followed by an `op` install hint that links 1Password's official install guide.

#### Scenario: macOS summary mentions op

- **WHEN** the macOS branch finishes
- **THEN** the closing `CLI tools:` line includes the token `op`

#### Scenario: Non-macOS lists mention op

- **WHEN** the non-macOS branch prints its manual instructions and finishes
- **THEN** both its `CLI tools:` lines include `op`, and the manual list is followed by the `op`
  install hint
