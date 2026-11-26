# Spec Delta

## ADDED Requirements

### Requirement: Corepack shims are retired once the standalone pnpm is installed

On every run, whatever the NVM group did, the script SHALL remove the `pnpm`, `pnpx`, `yarn` and `yarnpkg` links that corepack created in each nvm Node version's `bin` directory, once the standalone pnpm (`~/Library/pnpm/bin/pnpm`) is installed. It SHALL remove only links that point into corepack, log each one it removes, and leave the `corepack` executable in place. An active Node version's shim would otherwise outrank the standalone pnpm on `PATH`.

#### Scenario: Shims removed once the standalone pnpm is installed

- **WHEN** `~/Library/pnpm/bin/pnpm` is executable
- **AND** a Node version under `$NVM_DIR/versions/node` has `pnpm`, `pnpx`, `yarn` and `yarnpkg` links pointing into corepack
- **THEN** those four links are removed and each removal is logged
- **AND** that version's `corepack`, `node`, `npm` and `npx` are left in place

#### Scenario: Shims kept while the standalone pnpm is missing

- **WHEN** `~/Library/pnpm/bin/pnpm` does not exist (declined or failed)
- **THEN** no corepack shim is removed

#### Scenario: A pnpm not created by corepack is left alone

- **WHEN** a Node version's `bin/pnpm` exists but does not point into corepack
- **THEN** it is not removed

#### Scenario: Retirement runs when the NVM group is skipped

- **WHEN** the NVM group reports `2/2 installed` or the user declines it
- **AND** the standalone pnpm is installed and a corepack shim exists
- **THEN** the shim is still removed

#### Scenario: Nothing to retire

- **WHEN** no Node version has a corepack shim, or `$NVM_DIR/versions/node` does not exist
- **THEN** the step removes nothing, logs nothing and does not fail

## MODIFIED Requirements

### Requirement: NVM is sourced before pre-scan for idempotency

The script SHALL source `$NVM_DIR/nvm.sh` before the pre-scan that checks whether `node` is available. NVM-managed binaries are not in PATH until nvm.sh is sourced, so without this step the pre-scan would always report them as missing, causing redundant re-installation on every `chezmoi apply`.

#### Scenario: NVM already installed, node present

- **WHEN** NVM is installed and Node was previously installed via nvm
- **THEN** the pre-scan detects `node` as present after sourcing nvm.sh
- **AND** the group reports "2/2 installed" without prompting

### Requirement: NVM/Node group has its own confirmation prompt

The entire NVM + Node sequence SHALL be gated by a single `confirm()` prompt.

#### Scenario: User confirms Node setup

- **WHEN** the user confirms the NVM/Node group
- **THEN** NVM and Node LTS are set up

#### Scenario: User declines Node setup

- **WHEN** the user declines the NVM/Node confirmation
- **THEN** NVM and Node are skipped

### Requirement: NVM/Node group handles failure gracefully

If the NVM curl installer fails, the script SHALL log an error and skip the Node step (it depends on NVM). If Node installation fails, the script SHALL log an error and continue; the corepack shim retirement still runs.

#### Scenario: NVM install fails

- **WHEN** the NVM curl installer returns a non-zero exit code
- **THEN** an error is logged, and the Node step is skipped

#### Scenario: Node install fails but Node was already present

- **WHEN** `nvm install --lts` fails but `command -v node` succeeds
- **THEN** an error is logged and the corepack shim retirement still runs

## REMOVED Requirements

### Requirement: Corepack is enabled for pnpm and yarn

**Reason**: Node.js 25 and later no longer ship corepack, so `corepack enable` fails with the `lts/*` default (Node 26).

**Migration**: pnpm comes from its official standalone installer (`pnpm-install`); each project's `packageManager` still selects its pnpm version. yarn is no longer provided. Existing corepack shims are retired by "Corepack shims are retired once the standalone pnpm is installed".
