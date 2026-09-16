## MODIFIED Requirements

### Requirement: bd CLI is installed via brew

The brew packages list in `run_onchange_install-packages.sh.tmpl` SHALL include `beads` (the Homebrew formula that provides the `bd` CLI) so that the beads CLI is available on PATH for hooks to function. The `pkg_bin` mapping SHALL resolve `beads` to `bd` for the already-installed check.

While `beads` is declared in `BREW_HOLDS` and not installed, the brew packages group SHALL NOT install it and SHALL print its hold warning instead (`brew-version-pins`). Once the declaration is removed, `bd` is installed via `brew install beads` as before.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` runs the install script and the user confirms the brew packages group
- **THEN** while `beads` is declared in `BREW_HOLDS`, it is not installed and its hold warning is printed
- **AND** once the declaration is removed, `bd` is installed via `brew install beads`

#### Scenario: Already installed

- **WHEN** the `bd` command is already available on the machine
- **THEN** the brew packages group skips `beads` installation and reports it as already installed
