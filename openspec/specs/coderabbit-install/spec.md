## Purpose

Installation of the CodeRabbit CLI (`coderabbit` / `cr`) via its official install script (enabling built-in self-update), with a manual auth instruction and a setup-verification hint.

## Requirements

### Requirement: CodeRabbit CLI installed via official install script

The install script SHALL install the CodeRabbit CLI via its official installer
(`curl -fsSL https://cli.coderabbit.ai/install.sh | sh`) into `~/.local/bin` (binary
`coderabbit`, plus the `cr` symlink), instead of the Homebrew cask, so the CLI's
built-in self-update (`coderabbit update`) works (it writes in place to the
user-owned `~/.local/bin`). `coderabbit` SHALL NOT appear in the `ALL_CASKS` array. The
installer SHALL be run non-interactively (e.g. `CI=1`) so it does not block on browser
login during an unattended run. `~/.local/bin` is already on PATH via `dot_zshrc.tmpl`.

#### Scenario: Fresh install on clean machine

- **WHEN** the install script runs and coderabbit is not installed
- **THEN** coderabbit is installed via the official script to `~/.local/bin/coderabbit`

#### Scenario: Migration from the Homebrew cask

- **WHEN** `brew list --cask coderabbit` succeeds
- **THEN** the script runs `brew uninstall --cask coderabbit` (without `--zap`, preserving `~/.coderabbit`) and then installs via the official script

#### Scenario: Already installed via script

- **WHEN** `command -v coderabbit` resolves under `~/.local/bin`
- **THEN** the script does not migrate from a cask and keeps the existing install current (e.g. via `coderabbit update`)

### Requirement: Manual auth instruction displayed

The install script SHALL print a CodeRabbit authentication instruction in the manual
instructions block. The instruction SHALL convey that authentication is triggered on
first use of any command that requires it (deferred/integrated login as of CodeRabbit
CLI 0.5.0, where a single browser sign-in also handles organization selection), and
SHALL still surface `coderabbit auth login` as the explicit sign-in command. The
instruction MAY note `coderabbit auth org` for switching between organizations.

#### Scenario: Install script completes

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL display a line indicating that CodeRabbit authenticates on first
  use, with `coderabbit auth login` available as the explicit sign-in command

### Requirement: CodeRabbit setup-verification hint displayed

The install script SHALL print a hint to run `coderabbit doctor` in the manual
instructions block as a setup-verification step. `coderabbit doctor` (available as of
CodeRabbit CLI 0.5.0) inspects auth, network access, git state, and configuration and
reports clearer next steps when local setup blocks a review.

#### Scenario: Install script completes

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL display a line suggesting `coderabbit doctor` to verify CodeRabbit setup
