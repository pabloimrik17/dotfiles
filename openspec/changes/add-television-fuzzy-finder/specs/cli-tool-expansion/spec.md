## MODIFIED Requirements

### Requirement: BREW_PACKAGES array includes all actively used CLI tools

The `BREW_PACKAGES` array SHALL contain the following 18 packages (17 existing + 1 new):

Existing: `git`, `git-delta`, `starship`, `eza`, `bat`, `zoxide`, `atuin`, `fzf`, `ripgrep`, `lazygit`, `worktrunk`, `terminal-notifier`, `fd`, `direnv`, `beads`, `gh`, `tmux`, `uv`, `mas`, `wget`, `opencode`

New addition: `television`

#### Scenario: television listed in array

- **WHEN** the install script is loaded
- **THEN** the `BREW_PACKAGES` array contains `television`

#### Scenario: television maps to tv binary

- **WHEN** `pkg_bin "television"` is called
- **THEN** the function returns `tv`

### Requirement: tv update-channels runs after brew packages group

After the brew packages group completes, if `tv` is available in PATH, the install script SHALL run `tv update-channels` to download community cable channels. This step SHALL be guarded by a `command -v tv` check and SHALL NOT fail the script if the download fails.

#### Scenario: Cable channels downloaded on fresh install

- **WHEN** television is newly installed via brew and the brew packages group completes
- **THEN** `tv update-channels` runs successfully

#### Scenario: tv not installed skips channel update

- **WHEN** the user skipped the brew packages group and `tv` is not in PATH
- **THEN** the `tv update-channels` step is skipped entirely
