# Capability: extra-updates-command

## Purpose

Provide a single `update-extra` zsh entry point that updates the tools which are neither brew-managed, self-updating, nor repo-pinned — running each step in sequence, tolerating individual failures, and reporting per-step progress.
## Requirements
### Requirement: Single update entry point

The system SHALL provide a zsh function `update-extra`, defined in `dot_zshrc.tmpl`, available in interactive shells, that orchestrates the update commands for tools that are neither brew-managed nor self-updating nor repo-pinned. The definition SHALL be preceded by an `unalias update-extra 2>/dev/null` guard so an alias with the same name cannot break the function definition.

#### Scenario: User runs update-extra

- **WHEN** the user runs `update-extra` in an interactive zsh session
- **THEN** every configured update step executes in sequence

#### Scenario: Alias name collision

- **WHEN** a plugin defines an alias named `update-extra` before the function definition loads
- **THEN** the function definition still succeeds because the alias is removed first

### Requirement: Update step coverage

`update-extra` SHALL run every step in its registered step list. The step list SHALL be exactly:

1. gh extensions: `gh extension upgrade --all`
2. you-should-use omz plugin: `git -C "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/you-should-use" pull --ff-only`
3. skills.sh global skills: `npx -y skills update -g -y`
4. plannotator CLI: re-run the official installer `https://plannotator.ai/install.sh`
5. Catppuccin theme assets: re-download the bat, delta, zsh-syntax-highlighting, and atuin theme files from the same URLs used by `run_onchange_install-packages.sh.tmpl`, followed by `bat cache --build`
6. television channels: `tv update-channels`
7. fallow CLI (global): `npm install -g fallow@latest`

#### Scenario: gh extensions updated

- **WHEN** `update-extra` runs
- **THEN** `gh extension upgrade --all` executes

#### Scenario: you-should-use updated

- **WHEN** `update-extra` runs
- **THEN** the you-should-use clone under `$ZSH_CUSTOM/plugins` is fast-forwarded to upstream

#### Scenario: skills.sh globals updated

- **WHEN** `update-extra` runs
- **THEN** `npx -y skills update -g -y` executes against the global skill set

#### Scenario: plannotator updated

- **WHEN** `update-extra` runs
- **THEN** the official plannotator installer re-runs, replacing the binary with the latest release

#### Scenario: Catppuccin themes refreshed

- **WHEN** `update-extra` runs
- **THEN** the four theme assets are re-downloaded and the bat cache is rebuilt

#### Scenario: television channels updated

- **WHEN** `update-extra` runs
- **THEN** `tv update-channels` executes

#### Scenario: fallow updated

- **WHEN** `update-extra` runs
- **THEN** `npm install -g fallow@latest` executes, updating the global CLI and its bundled `fallow-lsp`/`fallow-mcp` binaries in one step

### Requirement: Failure resilience

A failing step SHALL NOT abort the remaining steps. `update-extra` SHALL report each failure as it happens, print a final summary with succeeded/failed counts, and return non-zero if any step failed.

#### Scenario: One step fails mid-run

- **WHEN** a step in the middle of the sequence fails
- **THEN** all subsequent steps still execute, the summary lists the failed step, and the function returns non-zero

#### Scenario: All steps succeed

- **WHEN** every step succeeds
- **THEN** the summary reports all steps ok and the function returns 0

### Requirement: Per-step progress output

`update-extra` SHALL print each step's name before running it and a `✓` (success) or `✗` (failure) result after it, so the user can tell which tool produced which output.

#### Scenario: Step output labelled

- **WHEN** a step runs
- **THEN** its label is printed before its output and its ✓/✗ status after

### Requirement: Scope exclusions

`update-extra` SHALL NOT invoke `brew`, any tool's self-updater, or any update path for repo-pinned tools (Renovate-managed MCP pins, pinned installers such as nvm or tmux Catppuccin).

#### Scenario: No overlap with existing update mechanisms

- **WHEN** `update-extra` runs
- **THEN** no `brew` command executes and no repo-managed pin changes

### Requirement: Plannotator updates use the non-interactive installer

The existing Plannotator step in `update-extra` SHALL invoke the official installer with `--non-interactive` with Git available as a setup prerequisite. Plannotator SHALL remain in the manual update class with one update step. The helper SHALL propagate download and installer failures to the existing aggregate result.

#### Scenario: Normal update

- **WHEN** the Plannotator update step executes with git available
- **THEN** the downloaded official installer SHALL run with `--non-interactive`
- **AND** no second Plannotator update step SHALL run

#### Scenario: Installer fails

- **WHEN** downloading or running the Plannotator installer fails
- **THEN** the step SHALL report failure and the remaining update steps SHALL continue
- **AND** the aggregate command SHALL return nonzero as required by the existing failure-resilience contract
