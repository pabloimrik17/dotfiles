# Spec Delta

## Purpose

Removes plugins the dotfiles no longer want from every agent CLI on machines that already have them, once per machine, through each agent's own plugin CLI.

## ADDED Requirements

### Requirement: SuperWhisper agent plugins are not provisioned

The dotfiles SHALL NOT enable, register or install a SuperWhisper agent plugin or marketplace on any host. This covers `superwhisper@superwhisper` for Claude Code and Codex, and `@superwhisper/opencode` for OpenCode. The SuperWhisper macOS app SHALL stay in the cask list.

#### Scenario: Rendered Claude settings on Apple Silicon

- **WHEN** `dot_claude/modify_settings.json.tmpl` is rendered for `darwin/arm64`
- **THEN** its managed overlay has no `superwhisper@superwhisper` key in `enabledPlugins` and no `superwhisper` key in `extraKnownMarketplaces`

#### Scenario: Rendered install script on Apple Silicon

- **WHEN** `run_onchange_install-packages.sh.tmpl` is rendered for `darwin/arm64`
- **THEN** it contains no SuperWhisper plugin step and no reference to `superwhisper.com/install-claude-code.sh`

#### Scenario: Fresh Apple Silicon machine

- **WHEN** `chezmoi apply` completes on a `darwin/arm64` host where the SuperWhisper app is installed and no agent plugin is
- **THEN** `claude plugin list --json` lists no `superwhisper@superwhisper` entry

#### Scenario: The app stays available

- **WHEN** the core cask list is rendered on any macOS host
- **THEN** it still offers the `superwhisper` cask

### Requirement: Retirement cleanup runs once per macOS machine

`chezmoi apply` SHALL run the retirement cleanup on macOS hosts only. It SHALL run after the install script and after every managed file is written. A successful run SHALL NOT run again on that machine unless the cleanup's rendered content changes.

#### Scenario: First apply on macOS

- **WHEN** `chezmoi apply` runs on a macOS host that has never run the cleanup
- **THEN** the cleanup runs after the package install script

#### Scenario: Later apply after a successful run

- **WHEN** `chezmoi apply` runs again on a host where the cleanup already succeeded
- **THEN** the cleanup does not run

#### Scenario: Linux host

- **WHEN** `chezmoi apply` runs on a Linux host
- **THEN** the cleanup renders empty and does not run

### Requirement: Retirement cleanup does not prompt

The cleanup SHALL remove retired plugins without asking for confirmation, so a run without a TTY still removes them.

#### Scenario: Apply without a TTY

- **WHEN** the cleanup runs with no TTY and Claude Code has `superwhisper@superwhisper` installed
- **THEN** the plugin is uninstalled without any prompt

### Requirement: Retirement cleanup removes the Claude Code plugin and marketplace

When Claude Code has `superwhisper@superwhisper` installed, the cleanup SHALL uninstall it with `claude plugin uninstall`. When the `superwhisper` marketplace is registered, the cleanup SHALL remove it with `claude plugin marketplace remove`. The marketplace SHALL be removed even when the plugin was not installed.

#### Scenario: Plugin and marketplace present

- **WHEN** the cleanup runs, Claude Code lists `superwhisper@superwhisper` as installed and `superwhisper` as a marketplace
- **THEN** afterwards `claude plugin list --json` lists no `superwhisper@superwhisper` and `claude plugin marketplace list --json` lists no `superwhisper`
- **AND** `~/.claude/settings.json` has neither `enabledPlugins["superwhisper@superwhisper"]` nor `extraKnownMarketplaces.superwhisper`

#### Scenario: Only the marketplace present

- **WHEN** the cleanup runs, the `superwhisper` marketplace is registered and the plugin is not installed
- **THEN** it runs `claude plugin marketplace remove superwhisper` and does not run `claude plugin uninstall`

### Requirement: Retirement cleanup removes the Codex plugin and marketplace

When Codex reports `superwhisper@superwhisper` installed, the cleanup SHALL remove it with `codex plugin remove`. When Codex lists a `superwhisper` marketplace, the cleanup SHALL remove it with `codex plugin marketplace remove`, even when the plugin was not installed.

#### Scenario: Plugin and marketplace present

- **WHEN** the cleanup runs, `codex plugin list --json` reports `superwhisper@superwhisper` in `installed` and `codex plugin marketplace list --json` lists `superwhisper`
- **THEN** afterwards neither listing contains them

#### Scenario: Neither present

- **WHEN** the cleanup runs and Codex lists neither the plugin nor the marketplace
- **THEN** it runs no `codex plugin remove` and no `codex plugin marketplace remove`

### Requirement: Retirement cleanup removes the OpenCode plugin

When OpenCode's global configuration lists `@superwhisper/opencode`, the cleanup SHALL remove it with `opencode plugin remove @superwhisper/opencode`.

#### Scenario: Plugin configured

- **WHEN** the cleanup runs and `~/.config/opencode/opencode.json` lists `@superwhisper/opencode`
- **THEN** afterwards no OpenCode global configuration file lists `@superwhisper/opencode`

#### Scenario: Plugin not configured

- **WHEN** the cleanup runs and no OpenCode global configuration file lists `@superwhisper/opencode`
- **THEN** it runs no `opencode plugin remove`

### Requirement: Retirement cleanup skips agents that are not installed

When an agent's CLI is not on PATH, the cleanup SHALL skip that agent with an informational message and SHALL NOT count it as a failure.

#### Scenario: No agent CLI installed

- **WHEN** the cleanup runs with none of `claude`, `codex` or `opencode` on PATH
- **THEN** it runs no removal commands and exits 0

### Requirement: Retirement cleanup fails loudly until removal lands

The cleanup SHALL exit non-zero, naming each agent, when a removal command fails, when an agent's plugin or marketplace listing cannot be read, or when a re-check after removal still finds the plugin. An unreadable listing SHALL NOT be treated as empty. One agent's failure SHALL NOT stop the cleanup of the others. A non-zero exit leaves the run unrecorded, so the next `chezmoi apply` retries it.

#### Scenario: A removal command fails

- **WHEN** `claude plugin uninstall superwhisper@superwhisper` exits non-zero and Codex has the plugin installed
- **THEN** the cleanup still removes the Codex plugin, exits non-zero, and names the Claude Code removal as failed

#### Scenario: A listing cannot be read

- **WHEN** `codex plugin list --json` exits non-zero or returns output without an `installed` array
- **THEN** the cleanup names Codex as failed and exits non-zero rather than reporting nothing to remove

#### Scenario: Retry after a failed run

- **WHEN** the previous cleanup run exited non-zero and `chezmoi apply` runs again
- **THEN** the cleanup runs again
