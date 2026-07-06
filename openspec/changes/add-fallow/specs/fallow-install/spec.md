# Delta: fallow-install

## ADDED Requirements

### Requirement: Global fallow installation via npm in install script

`run_onchange_install-packages.sh.tmpl` SHALL install fallow globally via `npm install -g fallow` in a dedicated group placed after the NVM/Node group, following the existing pre-scan + `confirm` prompt pattern. The group SHALL skip with an informational message when `fallow` is already on PATH, and skip with a warning when `node`/`npm` are unavailable.

#### Scenario: Fresh machine install

- **WHEN** the install script runs on a machine with node available and fallow absent
- **AND** the user confirms the fallow install group
- **THEN** `npm install -g fallow` executes and `fallow`, `fallow-lsp`, and `fallow-mcp` become available on PATH

#### Scenario: Already installed

- **WHEN** `fallow` is already on PATH
- **THEN** the group reports it as installed and performs no install

#### Scenario: Node unavailable

- **WHEN** `node` or `npm` is not on PATH (NVM group skipped or failed)
- **THEN** the fallow group SHALL skip with a warning instead of failing the script

### Requirement: Free static tier only

The dotfiles SHALL NOT configure any paid Fallow Runtime surface: no `FALLOW_LICENSE`/`FALLOW_LICENSE_PATH`/`FALLOW_API_KEY`/`FALLOW_API_URL` environment variables, no `fallow license` or `fallow coverage` invocations, in any template, script, or config.

#### Scenario: No license configuration deployed

- **WHEN** `chezmoi apply` runs
- **THEN** no deployed file contains Fallow Runtime license or cloud configuration
