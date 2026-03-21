# Capability: claude-hooks

## Purpose

Claude Code hook configuration managed by chezmoi — hook definitions in the settings template for session lifecycle events.

## ADDED Requirements

### Requirement: bd prime runs on SessionStart

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `hooks.SessionStart` entry that runs `bd prime` with an empty matcher (global scope).

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with a `hooks.SessionStart` array containing a command hook that runs `bd prime`

#### Scenario: Session starts in a beads-enabled project

- **WHEN** a Claude Code session starts in a directory containing `.beads/`
- **THEN** the `bd prime` hook executes and initializes beads context

#### Scenario: Session starts in a non-beads project

- **WHEN** a Claude Code session starts in a directory without `.beads/`
- **THEN** the `bd prime` hook executes and exits as a no-op without errors

### Requirement: bd prime runs on PreCompact

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `hooks.PreCompact` entry that runs `bd prime` with an empty matcher (global scope).

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with a `hooks.PreCompact` array containing a command hook that runs `bd prime`

#### Scenario: Context compaction in a beads-enabled project

- **WHEN** Claude Code triggers context compaction in a directory containing `.beads/`
- **THEN** the `bd prime` hook executes and re-primes beads context before compaction

#### Scenario: Context compaction in a non-beads project

- **WHEN** Claude Code triggers context compaction in a directory without `.beads/`
- **THEN** the `bd prime` hook executes and exits as a no-op without errors
