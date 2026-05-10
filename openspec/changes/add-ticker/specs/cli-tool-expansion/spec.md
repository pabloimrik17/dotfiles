## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 25 packages (23 existing + 2 new):

Existing: `git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`, `lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`, `uv`, `mas`, `wget`, `opencode`, `television`, `tickrs`

New additions: `ticker`, `age`

#### Scenario: All packages listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains exactly 25 entries

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

#### Scenario: ticker listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `ticker`

#### Scenario: ticker maps to its own binary name

- **WHEN** `pkg_bin "ticker"` is called
- **THEN** the function returns `ticker` (via the default identity mapping)

#### Scenario: age listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `age`

#### Scenario: age maps to its own binary name

- **WHEN** `pkg_bin "age"` is called
- **THEN** the function returns `age` (via the default identity mapping)

### Requirement: BREW_TAPS array registers third-party Homebrew taps before installs

The install script SHALL declare a `BREW_TAPS` array immediately above `BREW_PACKAGES` listing every third-party tap required by any package in `BREW_PACKAGES`. Before the BREW_PACKAGES pre-scan runs, the script SHALL iterate `BREW_TAPS` and run `brew tap "$tap"` for each entry. `brew tap` SHALL be considered idempotent — re-running on a host where the tap is already registered SHALL succeed without re-fetching.

The value of `BREW_TAPS` SHALL be `(tarkah/tickrs achannarasappa/tap)` — the taps currently required (for the `tickrs` and `ticker` formulas respectively).

#### Scenario: Tap loop runs before package install loop

- **WHEN** the install script reaches the brew packages group
- **THEN** every entry in `BREW_TAPS` is tapped via `brew tap "$tap"` before any `brew install` invocation

#### Scenario: tarkah/tickrs is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `tarkah/tickrs`

#### Scenario: achannarasappa/tap is registered

- **WHEN** the install script is loaded
- **THEN** `BREW_TAPS` contains `achannarasappa/tap`

#### Scenario: Re-running on a tapped host is a no-op

- **WHEN** the install script runs on a host where every entry in `BREW_TAPS` is already tapped
- **THEN** each `brew tap "$tap"` exits successfully without printing a warning and the script continues
