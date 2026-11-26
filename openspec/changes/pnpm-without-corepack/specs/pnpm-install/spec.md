# Spec Delta

## Purpose

Provide pnpm on every Mac from its official standalone installer, independent of the active Node.js version, while each project keeps the pnpm version it pins.

## ADDED Requirements

### Requirement: pnpm uses the official standalone installer

On macOS the setup SHALL install pnpm with the official installer from `https://get.pnpm.io/install.sh`, at the version the install script declares, into `~/Library/pnpm`, with `PNPM_NO_MODIFY_PATH=1` so it does not edit the chezmoi-managed shell config. The installer SHALL be downloaded to a file before it runs. pnpm SHALL NOT come from Homebrew, npm or corepack.

#### Scenario: Clean machine

- **WHEN** pnpm is absent, the user confirms the pnpm group, and the installer succeeds
- **THEN** the installer runs with `PNPM_VERSION` set to the declared version, `PNPM_HOME` set to `~/Library/pnpm` and `PNPM_NO_MODIFY_PATH=1`
- **AND** `~/Library/pnpm/bin/pnpm` is executable
- **AND** no shell config file is modified

#### Scenario: User declines installation

- **WHEN** pnpm is absent and the user declines the pnpm group
- **THEN** the installer is not downloaded or run

#### Scenario: Installer download fails

- **WHEN** the installer cannot be downloaded or exits non-zero
- **THEN** an error is logged, the downloaded file is removed, and the script continues

### Requirement: pnpm installation is idempotent

The setup SHALL detect the standalone pnpm directly at `~/Library/pnpm/bin/pnpm`, not with `command -v pnpm`, because a corepack shim on `PATH` would match. When that executable exists, the setup SHALL neither prompt for pnpm nor rerun the installer.

#### Scenario: Standalone pnpm already installed

- **WHEN** `~/Library/pnpm/bin/pnpm` is executable
- **THEN** the pnpm group reports it as installed, with its version, without prompting

#### Scenario: Only a corepack shim present

- **WHEN** a corepack `pnpm` shim is on `PATH` but `~/Library/pnpm/bin/pnpm` does not exist
- **THEN** the pnpm group counts pnpm as pending and prompts to install it

### Requirement: The shell puts the standalone pnpm on PATH

The zsh config SHALL export `PNPM_HOME` as `~/Library/pnpm` and add both `$PNPM_HOME/bin` and `$PNPM_HOME` to `PATH`, each only once, with `$PNPM_HOME/bin` first. pnpm 12 links itself and its global packages into `$PNPM_HOME/bin`; earlier global packages live in `$PNPM_HOME`.

#### Scenario: pnpm resolves to the standalone install

- **WHEN** an interactive shell starts and the active Node version's `bin` holds no `pnpm` of its own (a corepack shim or an npm global install)
- **THEN** `command -v pnpm` resolves to `~/Library/pnpm/bin/pnpm`

#### Scenario: Nested shells do not duplicate PATH entries

- **WHEN** a shell is started from another shell that already loaded the zsh config
- **THEN** `$PNPM_HOME/bin` and `$PNPM_HOME` each appear once in `PATH`

### Requirement: Project-pinned pnpm versions are honoured

The setup SHALL NOT override pnpm's `pmOnFail` setting, so pnpm keeps its default `download`: in a project whose `packageManager` names another pnpm version, pnpm downloads and runs that version under the project's active Node.js.

#### Scenario: Project pins an older pnpm and Node

- **WHEN** a project declares `"packageManager": "pnpm@9.0.6"` and its `.nvmrc` selects Node 20
- **THEN** `pnpm install` in that project runs pnpm 9.0.6 with Node 20

### Requirement: Non-macOS guidance names the pnpm installer

The non-macOS branch of the install script SHALL list pnpm under the official-installer instructions with `curl -fsSL https://get.pnpm.io/install.sh | sh -`.

#### Scenario: pnpm listed in non-macOS instructions

- **WHEN** the script runs on a non-macOS system
- **THEN** the printed instructions include pnpm with its official installer command
