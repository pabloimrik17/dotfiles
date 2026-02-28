# Capability: oxfmt-formatting

## Purpose

oxfmt-based code formatting — configuration, ignore rules, and multi-format file support.

## Requirements

### Requirement: oxfmt configuration file

The repo SHALL have an oxfmt configuration file defining formatting preferences compatible with monolab conventions.

#### Scenario: Formatting preferences are set

- **WHEN** oxfmt runs
- **THEN** it uses `tabWidth: 4`, `useTabs: false`, and `singleAttributePerLine: true`

#### Scenario: Import sorting is enabled

- **WHEN** oxfmt formats a JS/TS file with imports
- **THEN** imports are sorted automatically (built-in oxfmt feature, no plugin needed)

#### Scenario: package.json sorting is enabled

- **WHEN** oxfmt formats a `package.json` file
- **THEN** fields are sorted in conventional order (built-in oxfmt default)

### Requirement: oxfmt ignore rules

The repo SHALL have an `.oxfmtignore` file excluding directories that should not be auto-formatted.

#### Scenario: OpenSpec artifacts are excluded

- **WHEN** oxfmt runs
- **THEN** files under `openspec/` are not formatted

#### Scenario: Agent config directories are excluded

- **WHEN** oxfmt runs
- **THEN** files under `.claude/`, `.codex/`, `.opencode/` are not formatted

#### Scenario: Husky internals are excluded

- **WHEN** oxfmt runs
- **THEN** files under `.husky/_/` are not formatted

### Requirement: oxfmt formats all supported file types

oxfmt SHALL format all supported files in the repo: JSON, JSONC, TOML, YAML, Markdown, and any JS/TS files if present.

#### Scenario: Multi-format support

- **WHEN** `bun run lint:oxfmt:fix` is executed
- **THEN** JSON, TOML, YAML, and Markdown files are formatted according to the oxfmt config
