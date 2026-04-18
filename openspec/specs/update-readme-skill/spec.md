# Capability: update-readme-skill

## Purpose

Skill and matching `/docs:readme` command that detect tool-level drift between the dotfiles setup and `README.md` (What's Included table, badges, setup steps, workflows, screenshots), then propose markdown edits plus actionable screenshot descriptions — auto-triggered on tool additions/removals or significant visual changes, never on alias- or keybinding-level edits.

## Requirements

### Requirement: Skill auto-triggers on tool-level changes

The system SHALL provide a skill (`.claude/skills/update-readme/SKILL.md`) whose description triggers auto-invocation when Claude detects tool-level changes: new tool installed, tool removed, setup process changed, or significant visual changes (theme, prompt). The skill SHALL NOT trigger on alias-level or keybinding-level changes.

#### Scenario: New tool added to install script

- **WHEN** a new brew package or cask is added to the install script
- **THEN** the skill activates and analyzes whether README.md's "What's Included" table needs a new row

#### Scenario: New alias added (no trigger)

- **WHEN** only a new alias is added for an existing tool
- **THEN** the skill does NOT activate (this is manual-level, not README-level)

#### Scenario: Tool removed from setup

- **WHEN** a tool is removed from the install script or its config is deleted
- **THEN** the skill activates and proposes removing the corresponding README table row

### Requirement: Command provides manual invocation

The system SHALL provide a command (`.claude/commands/docs/readme.md`) that enables invocation via `/docs:readme` with identical behavior to the skill.

#### Scenario: User invokes command

- **WHEN** user types `/docs:readme`
- **THEN** the command executes the same analysis and proposal workflow as the skill

#### Scenario: User invokes command with arguments

- **WHEN** user types `/docs:readme added gh-dash`
- **THEN** the command uses the arguments as context, narrowing its analysis

### Requirement: What's Included table analysis

The skill SHALL compare the actual set of installed/configured tools against the README's "What's Included" table to detect missing, outdated, or stale entries.

#### Scenario: Tool configured but not in table

- **WHEN** a tool has config files and is in the install script but has no row in the table
- **THEN** the skill proposes adding a row with Category, Tool (linked), and Description

#### Scenario: Tool in table but no longer configured

- **WHEN** a table row references a tool that is no longer in the install script or has no config
- **THEN** the skill proposes removing the row

#### Scenario: Tool description outdated

- **WHEN** a tool's role has changed (e.g., new major feature added)
- **THEN** the skill proposes updating the Description column

### Requirement: Section analysis

The skill SHALL analyze whether non-table sections of README.md need updating: badges, setup instructions, and daily workflows.

#### Scenario: Setup process changed

- **WHEN** the install script changes significantly (new prerequisites, different steps)
- **THEN** the skill proposes updating the Setup section

#### Scenario: Badge relevance

- **WHEN** a major tool or theme is added/removed that would warrant a badge
- **THEN** the skill proposes adding or removing a badge

### Requirement: Screenshot descriptions

The skill SHALL generate actionable screenshot descriptions when visual documentation would help, including: suggested filename, what to show in the capture, how to set up the scenario, and where to place the image in README.md. The skill SHALL NOT take screenshots itself.

#### Scenario: New visual tool added

- **WHEN** a tool with a visual TUI interface is added (e.g., gh-dash, lazygit)
- **THEN** the skill proposes a screenshot with filename, content description, simulation steps, and placement

#### Scenario: Theme or prompt change

- **WHEN** the terminal theme or prompt configuration changes significantly
- **THEN** the skill proposes updating the featured terminal-overview.png screenshot with new simulation steps

#### Scenario: No visual change

- **WHEN** a non-visual tool is added (e.g., a CLI utility with no TUI)
- **THEN** no screenshot is proposed

### Requirement: Propose-then-apply workflow

The skill SHALL present all proposed changes and screenshot descriptions to the user and SHALL NOT edit README.md until explicit confirmation.

#### Scenario: User confirms proposals

- **WHEN** the user confirms proposed changes
- **THEN** the skill applies approved text changes to README.md

#### Scenario: Screenshot descriptions accepted

- **WHEN** the user acknowledges screenshot descriptions
- **THEN** the descriptions remain as actionable instructions for the user to capture manually

#### Scenario: No changes needed

- **WHEN** analysis determines README.md is already in sync
- **THEN** the skill reports "README is up to date" and makes no proposals

### Requirement: Skill and command content duplication

The skill SKILL.md and command readme.md SHALL contain the same prompt content, following the OpenSpec pattern. The command version SHALL reference `/docs:readme` in examples where the skill version uses generic text.

#### Scenario: Content parity

- **WHEN** both files are compared (excluding frontmatter and slash command references)
- **THEN** the instructional content is functionally identical
