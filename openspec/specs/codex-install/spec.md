# Capability: codex-install

## Purpose

Provide a reliable, repeatable Codex CLI installation that uses OpenAI's standalone distribution while preserving existing Codex state and remaining safe to rerun.

## Requirements

### Requirement: Codex uses the official standalone installer

The setup SHALL install Codex on macOS with OpenAI's standalone installer in non-interactive mode. Non-macOS systems SHALL receive manual installation guidance. A successful installation SHALL provide an executable at `~/.local/bin/codex` and SHALL NOT require a Homebrew, npm, or Bun package installation.

#### Scenario: Clean supported machine

- **WHEN** Codex is absent, the user confirms the official-installer group, and the standalone installer succeeds
- **THEN** the setup invokes `curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh`
- **AND** `~/.local/bin/codex` is executable

#### Scenario: User declines installation

- **WHEN** Codex is absent and the user declines the official-installer group
- **THEN** the setup does not invoke the Codex installer

### Requirement: Codex installation is idempotent

The setup SHALL detect the standalone Codex executable directly at `~/.local/bin/codex`. When that executable exists and no package-manager migration is pending, the setup SHALL neither prompt for Codex installation nor rerun the installer.

#### Scenario: Standalone Codex is already installed

- **WHEN** `~/.local/bin/codex` is executable and no conflicting package-manager installation is present
- **THEN** the setup reports Codex as already installed and does not invoke its installer

### Requirement: Package-manager installations migrate safely

When a Homebrew cask installation of `codex` or a global npm installation of `@openai/codex` is present, the setup SHALL install and verify the standalone executable before removing the package-manager installation. The migration SHALL NOT delete, reset, or overwrite pre-existing authentication, configuration, or session state under `~/.codex`; the standalone installer MAY add or update its own distribution files there.

#### Scenario: Homebrew cask migration succeeds

- **WHEN** the Codex Homebrew cask is installed and the user confirms migration
- **THEN** the setup installs and verifies `~/.local/bin/codex` before uninstalling the cask
- **AND** pre-existing authentication, configuration, and session state under `~/.codex` remain present

#### Scenario: Global npm migration succeeds

- **WHEN** the global npm package `@openai/codex` is installed and the user confirms migration
- **THEN** the setup installs and verifies `~/.local/bin/codex` before uninstalling the npm package
- **AND** pre-existing authentication, configuration, and session state under `~/.codex` remain present

#### Scenario: Standalone installation fails during migration

- **WHEN** a package-manager Codex installation exists but the standalone installer or verification fails
- **THEN** the existing package-manager installation is not removed
- **AND** the setup records a non-fatal installation failure

### Requirement: Codex failure does not abort setup

A Codex installation or migration failure SHALL be logged and counted by the official-installer group's error accounting without aborting subsequent installation groups.

#### Scenario: Installer exits non-zero

- **WHEN** the Codex standalone installer exits non-zero
- **THEN** the setup logs the Codex failure, increments the group error count, and continues to later tools and groups

### Requirement: Codex is available later in the same setup run

After successful installation, later setup groups SHALL be able to resolve `codex` from the existing `~/.local/bin` PATH entry without starting a new shell.

#### Scenario: Later setup step resolves Codex

- **WHEN** Codex installation succeeds and a later group runs in the same setup process
- **THEN** `command -v codex` resolves to `~/.local/bin/codex`

### Requirement: Codex remains self-updating

Codex SHALL be classified as self-updating. The setup SHALL NOT add Codex to the `update-extra` workflow, and the documentation SHALL direct users to the supported Codex update mechanism.

#### Scenario: Extra updates are listed

- **WHEN** the `update-extra` workflow is inspected or executed
- **THEN** no Codex update step is present

#### Scenario: User updates Codex

- **WHEN** the user follows the documented Codex update workflow
- **THEN** the documentation directs them to `codex update` or to rerun OpenAI's standalone installer

### Requirement: Manual setup guidance covers Codex lifecycle

The setup's manual fallback and user documentation SHALL include the standalone install command, first-run interactive authentication, update guidance, shell completion generation, `AGENTS.md` instructions, and skill discovery from `.agents/skills`.

#### Scenario: Automated setup is unavailable

- **WHEN** the setup displays manual installation guidance
- **THEN** it includes the Codex standalone install command and directs the user to run `codex` to authenticate

#### Scenario: User consults Codex documentation

- **WHEN** the user opens the Codex section of the manual
- **THEN** it documents installation, authentication, updates, completion generation, `AGENTS.md`, and `.agents/skills` without claiming managed Codex preferences or MCP registrations
