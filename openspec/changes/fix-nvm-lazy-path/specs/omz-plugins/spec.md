## ADDED Requirements

### Requirement: nvm lazy loading pre-seeds PATH with default node binary directory

After oh-my-zsh is sourced with the nvm plugin in lazy mode, the `.zshrc` SHALL pre-seed `$PATH` with the `bin/` directory of the most recent nvm-installed node version. This ensures subprocesses that inherit `$PATH` (but not shell functions) can resolve `node`, `npm`, and `npx` as real binaries.

The block SHALL:

1. Check that `$NVM_DIR/versions/node` directory exists
2. Find the highest-versioned node directory using version-aware sorting
3. Prepend its `bin/` subdirectory to `$PATH`
4. Clean up any temporary variables used

#### Scenario: Subprocess can find node via PATH

- **WHEN** a subprocess (e.g., Gradle, Xcode, or `/usr/bin/env node`) looks up `node` via `$PATH`
- **THEN** the binary SHALL be found at `$NVM_DIR/versions/node/<version>/bin/node`

#### Scenario: No nvm versions installed

- **WHEN** `$NVM_DIR/versions/node` does not exist or contains no version directories
- **THEN** the block SHALL be a no-op and SHALL NOT modify `$PATH` or produce errors

#### Scenario: Multiple node versions installed

- **WHEN** multiple node versions are installed under `$NVM_DIR/versions/node/`
- **THEN** the highest version (by semver) SHALL be selected for PATH pre-seeding

#### Scenario: Lazy loading is preserved

- **WHEN** a new shell session starts
- **THEN** the nvm plugin SHALL still use lazy function wrappers for `node`/`npm`/`npx`
- **AND** the PATH pre-seed SHALL NOT trigger a full nvm initialization

#### Scenario: Temporary variables are cleaned up

- **WHEN** the PATH pre-seed block completes
- **THEN** no temporary variables (e.g., `_nvm_default_node_dir`) SHALL remain in the shell environment
