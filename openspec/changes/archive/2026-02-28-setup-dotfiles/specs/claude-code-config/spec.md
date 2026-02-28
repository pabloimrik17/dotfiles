## ADDED Requirements

### Requirement: Claude Code global settings are managed

The repo SHALL include `dot_claude/settings.json` containing Claude Code global settings (env vars, status line, enabled plugins).

#### Scenario: Apply sets Claude Code settings

- **WHEN** chezmoi apply runs on a machine without `~/.claude/settings.json`
- **THEN** `~/.claude/settings.json` is created with the managed configuration

#### Scenario: Settings sync across machines

- **WHEN** user enables a new plugin on machine A, re-adds it to chezmoi, pushes, and runs `chezmoi update` on machine B
- **THEN** machine B's `~/.claude/settings.json` includes the new plugin

### Requirement: Settings.json uses template for machine-specific paths

The `settings.json` SHALL be managed as `dot_claude/settings.json.tmpl` since it contains paths with the home directory (e.g., the HUD statusLine command). Template variables SHALL replace hardcoded paths.

#### Scenario: Status line path resolves correctly

- **WHEN** chezmoi apply runs on a machine with home dir `/Users/alice`
- **THEN** the statusLine command in `settings.json` uses `/Users/alice/.bun/bin/bun` and `/Users/alice/.claude/plugins/...`, not a hardcoded username

### Requirement: Local settings are excluded

`~/.claude/settings.local.json` SHALL NOT be in the chezmoi source state. It is a machine-local override file.

#### Scenario: Local settings not overwritten

- **WHEN** chezmoi apply runs on a machine with custom `settings.local.json` permissions
- **THEN** `settings.local.json` is unchanged

### Requirement: Non-config Claude Code directories are not managed

Directories like `~/.claude/cache/`, `~/.claude/debug/`, `~/.claude/history.jsonl`, `~/.claude/projects/` are runtime data and SHALL NOT be in the source state.

#### Scenario: Runtime directories untouched

- **WHEN** chezmoi apply runs
- **THEN** only `~/.claude/settings.json` is managed; all other files/dirs under `~/.claude/` are untouched
