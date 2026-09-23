## Purpose

Installs the TypeSafe agent skill (`typesafe-ai/skills`) in every agent we maintain: Claude Code gets the upstream plugin, and OpenCode, Junie, and Codex get the skills.sh skill. Each agent gets exactly one copy.

## ADDED Requirements

### Requirement: TypeSafe marketplace and plugin are installed for Claude Code

The install script SHALL include `typesafe-ai/skills` in `CC_MARKETPLACES` and `typesafe@typesafe-ai` in `CC_PLUGINS`. Both go through the existing marketplace and plugin loops, with the same pre-scan skip-if-present behavior as the other entries.

#### Scenario: Fresh machine

- **WHEN** the Claude Code plugin dependencies group runs, the user confirms, and neither the marketplace nor the plugin is present
- **THEN** `claude plugin marketplace add typesafe-ai/skills` and `claude plugin install typesafe@typesafe-ai` run

#### Scenario: Already present

- **WHEN** `claude plugin marketplace list --json` already lists `typesafe-ai/skills` and `claude plugin list --json` already lists `typesafe@typesafe-ai`
- **THEN** both steps are skipped with "already registered/installed" messages

### Requirement: TypeSafe plugin is enabled and its marketplace auto-updates

The managed key set of `dot_claude/modify_settings.json.tmpl` SHALL include `"typesafe@typesafe-ai": true` in `enabledPlugins`, and a `typesafe-ai` entry in `extraKnownMarketplaces` with source `github`, repo `typesafe-ai/skills`, and `autoUpdate: true`.

#### Scenario: Settings rendered

- **WHEN** `chezmoi apply` renders `~/.claude/settings.json`
- **THEN** `enabledPlugins` contains `typesafe@typesafe-ai` and `extraKnownMarketplaces.typesafe-ai` points to `typesafe-ai/skills` with `autoUpdate: true`

#### Scenario: Plugin not installed yet

- **WHEN** the plugin has not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code starts without errors

### Requirement: TypeSafe skill is installed for OpenCode, Junie, and Codex via skills.sh

The agent-skills group SHALL install `typesafe-ai` from `typesafe-ai/skills` with `-g -y`, explicitly targeting the agents `opencode`, `junie`, and `codex`. It SHALL NOT target `claude-code`, so Claude Code does not end up with a second copy next to the plugin. The step uses the group's shared confirmation, skills-list cache, and error handling.

#### Scenario: Fresh machine

- **WHEN** the agent-skills group runs, `npx` is available, and the user confirms
- **THEN** `npx -y skills add typesafe-ai/skills --skill typesafe-ai -g -y --agent opencode junie codex` runs

#### Scenario: Already installed with full coverage

- **WHEN** the cached `skills list -g --json` output lists `typesafe-ai` with OpenCode, Junie, and Codex all covered
- **THEN** the `skills add` command is not run and an "already installed" message is printed

#### Scenario: Partial agent coverage

- **WHEN** `typesafe-ai` is listed but one of the three agents is missing from its `agents`
- **THEN** the `skills add` command runs to restore the missing coverage

#### Scenario: Claude Code is not a skills.sh target

- **WHEN** the install completes
- **THEN** no skills.sh-managed `typesafe-ai` link exists under `~/.claude/skills/`

### Requirement: Non-macOS fallback lists TypeSafe install commands

The non-macOS fallback SHALL print the Claude Code plugin commands (`claude plugin marketplace add typesafe-ai/skills`, `claude plugin install typesafe@typesafe-ai`) and the skills.sh command that targets `opencode junie codex`.

#### Scenario: Non-macOS host

- **WHEN** the install script runs on a non-macOS platform
- **THEN** the manual instructions include all three commands
