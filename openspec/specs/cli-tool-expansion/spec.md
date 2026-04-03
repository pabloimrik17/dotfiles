# cli-tool-expansion Specification

## Purpose

TBD - created by archiving change mac-dev-setup. Update Purpose after archive.

## Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 17 packages (8 existing + 9 new):

Existing: `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`, `lazygit`

New additions: `fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, `mas`, `wget`, `opencode`

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 17 entries

### Requirement: pkg_bin function maps all packages to their binary names

The `pkg_bin()` function SHALL map package names to their command-line binary names for idempotency checks. The following mappings SHALL exist:

| Package     | Binary  |
| ----------- | ------- |
| `ripgrep`   | `rg`    |
| `git-delta` | `delta` |

All other packages SHALL map to their own name (identity mapping via the default `*` case).

#### Scenario: git-delta maps to delta

- **WHEN** `pkg_bin "git-delta"` is called
- **THEN** the function returns `delta`

#### Scenario: Standard package maps to itself

- **WHEN** `pkg_bin "fd"` is called
- **THEN** the function returns `fd`

### Requirement: git formula uses brew-specific installation check

For the `git` package specifically, the script SHALL NOT use `command -v git` for the skip check (because system git at `/usr/bin/git` would always match). Instead, it SHALL check whether brew's git is installed via `brew list git`.

#### Scenario: Only system git present

- **WHEN** `/usr/bin/git` exists but `brew list git` fails
- **THEN** `brew install git` is executed

#### Scenario: Brew git already installed

- **WHEN** `brew list git` succeeds
- **THEN** git installation is skipped with informational message

### Requirement: Non-macOS fallback includes all new packages

The non-macOS branch of the install script SHALL list all 17 brew packages in its manual installation instructions, including the 9 newly added ones.

#### Scenario: Non-macOS instructions are complete

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed instructions include `fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, `wget`, and `opencode` alongside the original 8 packages (excluding `mas`, which is macOS-only)
