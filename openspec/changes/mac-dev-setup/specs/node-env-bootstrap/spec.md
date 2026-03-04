## ADDED Requirements

### Requirement: NVM is installed via official curl script

The script SHALL install NVM using the official curl installer from `https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh`. The script SHALL NOT use `brew install nvm`. The installer SHALL run with `PROFILE=/dev/null` to prevent it from modifying shell config files (chezmoi manages `.zshrc`).

#### Scenario: NVM installed on fresh Mac
- **WHEN** `$HOME/.nvm` does not exist
- **THEN** the NVM curl installer is executed and NVM is installed to `$HOME/.nvm`

#### Scenario: NVM already installed
- **WHEN** `$HOME/.nvm` directory already exists
- **THEN** NVM installation is skipped with informational message

### Requirement: Node LTS is installed and set as default

After NVM is installed, the script SHALL source `$NVM_DIR/nvm.sh` to make `nvm` available, then run `nvm install --lts` and `nvm alias default lts/*`.

#### Scenario: Node LTS installed on fresh setup
- **WHEN** NVM is available and no Node versions are installed
- **THEN** the latest LTS Node version is installed and set as the default

#### Scenario: Node already installed
- **WHEN** `command -v node` succeeds (Node is already available via nvm or other method)
- **THEN** Node installation is skipped with informational message showing the current version
- **AND** `nvm alias default lts/*` is still executed if nvm is available (to ensure default is set)

### Requirement: Corepack is enabled for pnpm and yarn

After Node is installed, the script SHALL run `corepack enable` to make `pnpm` and `yarn` available globally without separate installation.

#### Scenario: Corepack enabled after Node install
- **WHEN** Node LTS has been installed or was already present
- **THEN** `corepack enable` is executed

#### Scenario: Corepack already enabled
- **WHEN** `corepack enable` is run on a system where it was previously enabled
- **THEN** the command succeeds idempotently (no error)

### Requirement: NVM/Node group has its own confirmation prompt

The entire NVM + Node + corepack sequence SHALL be gated by a single `confirm()` prompt.

#### Scenario: User confirms Node setup
- **WHEN** the user confirms the NVM/Node group
- **THEN** NVM, Node LTS, and corepack are all set up

#### Scenario: User declines Node setup
- **WHEN** the user declines the NVM/Node confirmation
- **THEN** NVM, Node, and corepack are all skipped

### Requirement: NVM/Node group handles failure gracefully

If the NVM curl installer fails, the script SHALL log an error and skip the Node and corepack steps (they depend on NVM). If Node installation fails, corepack SHALL still be attempted if Node was previously available.

#### Scenario: NVM install fails
- **WHEN** the NVM curl installer returns a non-zero exit code
- **THEN** an error is logged, and Node/corepack steps are skipped

#### Scenario: Node install fails but Node was already present
- **WHEN** `nvm install --lts` fails but `command -v node` succeeds
- **THEN** corepack enable is still attempted
