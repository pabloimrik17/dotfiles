# cli-tool-expansion Specification

## Purpose

TBD - created by archiving change mac-dev-setup. Update Purpose after archive.

## Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 23 packages (22 existing + 1 new):

Existing: `git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`, `lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`, `uv`, `mas`, `wget`, `opencode`, `television`

New addition: `tickrs`

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 23 entries

#### Scenario: television listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `television`

#### Scenario: television maps to tv binary

- **WHEN** `pkg_bin "television"` is called
- **THEN** the function returns `tv`

#### Scenario: tickrs listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `tickrs`

#### Scenario: tickrs maps to its own binary name

- **WHEN** `pkg_bin "tickrs"` is called
- **THEN** the function returns `tickrs` (via the default identity mapping)

### Requirement: pkg_bin function maps all packages to their binary names

The `pkg_bin()` function SHALL map package names to their command-line binary names for idempotency checks. The following mappings SHALL exist:

| Package      | Binary  |
| ------------ | ------- |
| `ripgrep`    | `rg`    |
| `git-delta`  | `delta` |
| `television` | `tv`    |

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

### Requirement: Atuin history imported on fresh machines

After brew packages are installed, the script SHALL check if atuin has zero history entries. If so, `atuin import auto` SHALL be run to import existing shell history (from `~/.zsh_history` or similar). This ensures autosuggestions work immediately on fresh machines.

#### Scenario: Fresh machine with existing zsh history

- **WHEN** atuin is installed and has no history entries
- **THEN** `atuin import auto` is executed

#### Scenario: History already present

- **WHEN** atuin already has history entries
- **THEN** the import step is skipped

### Requirement: Non-macOS fallback includes all new packages

The non-macOS branch of the install script SHALL list all 17 brew packages in its manual installation instructions, including the 9 newly added ones.

#### Scenario: Non-macOS instructions are complete

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed instructions include `fd`, `gh`, `git-delta`, `git`, `tmux`, `uv`, `wget`, and `opencode` alongside the original 8 packages (excluding `mas`, which is macOS-only)

### Requirement: tv update-channels runs after brew packages group

After the brew packages group completes, if `tv` is available in PATH, the install script SHALL run `tv update-channels` to download community cable channels. This step SHALL be guarded by a `command -v tv` check and SHALL NOT fail the script if the download fails.

#### Scenario: Cable channels downloaded on fresh install

- **WHEN** television is newly installed via brew and the brew packages group completes
- **THEN** `tv update-channels` runs successfully

#### Scenario: tv not installed skips channel update

- **WHEN** the user skipped the brew packages group and `tv` is not in PATH
- **THEN** the `tv update-channels` step is skipped entirely

### Requirement: BREW_TAPS array registers third-party Homebrew taps before installs

The install script SHALL declare a `BREW_TAPS` array immediately above `BREW_PACKAGES` listing every third-party tap required by any package in `BREW_PACKAGES`. Before the BREW_PACKAGES pre-scan runs, the script SHALL iterate `BREW_TAPS` and run `brew tap "$tap"` for each entry. `brew tap` SHALL be considered idempotent — re-running on a host where the tap is already registered SHALL succeed without re-fetching.

The initial value of `BREW_TAPS` SHALL be `(tarkah/tickrs)` — the only tap currently required (for the `tickrs` formula).

#### Scenario: Tap loop runs before package install loop

- **WHEN** the install script reaches the brew packages group
- **THEN** every entry in `BREW_TAPS` is tapped via `brew tap "$tap"` before any `brew install` invocation

#### Scenario: tarkah/tickrs is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `tarkah/tickrs`

#### Scenario: Re-running on a tapped host is a no-op

- **WHEN** the install script runs on a host where `tarkah/tickrs` is already tapped
- **THEN** `brew tap tarkah/tickrs` exits successfully without printing a warning and the script continues
