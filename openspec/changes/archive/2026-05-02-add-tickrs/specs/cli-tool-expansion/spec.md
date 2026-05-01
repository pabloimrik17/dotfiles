## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 23 packages (22 existing + 1 new):

Existing: `git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`, `lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`, `uv`, `mas`, `wget`, `opencode`, `television`

New addition: `tickrs`

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 23 entries

#### Scenario: tickrs listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `tickrs`

#### Scenario: tickrs maps to its own binary name

- **WHEN** `pkg_bin "tickrs"` is called
- **THEN** the function returns `tickrs` (via the default identity mapping)

## ADDED Requirements

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
