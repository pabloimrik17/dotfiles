## ADDED Requirements

### Requirement: Skill auto-triggers on config file changes

The system SHALL provide a skill (`.claude/skills/update-manual/SKILL.md`) whose description triggers auto-invocation when Claude detects changes to dotfiles configuration files including zshrc, gitconfig, ghostty config, starship.toml, atuin config, fzf config, tmux.conf, .mcp.json, Claude Code settings, OpenCode config, brew install script, or gh extension configs.

#### Scenario: Alias added to zshrc

- **WHEN** a new alias is added to `dot_zshrc.tmpl`
- **THEN** the skill activates and analyzes whether docs/manual.html needs a corresponding table row

#### Scenario: New tool config added

- **WHEN** a new config directory is added under `dot_config/`
- **THEN** the skill activates and analyzes whether a new section or subsection is needed in the manual

#### Scenario: Unrelated file changed

- **WHEN** changes are made only to files unrelated to configuration (e.g., openspec artifacts, CI workflows, package.json)
- **THEN** the skill does NOT activate

### Requirement: Command provides manual invocation

The system SHALL provide a command (`.claude/commands/docs/manual.md`) that enables invocation via `/docs:manual` with identical behavior to the skill.

#### Scenario: User invokes command

- **WHEN** user types `/docs:manual`
- **THEN** the command executes the same analysis and proposal workflow as the skill

#### Scenario: User invokes command with arguments

- **WHEN** user types `/docs:manual ghostty keybindings changed`
- **THEN** the command uses the arguments as context for what changed, narrowing its analysis

### Requirement: Config-to-section mapping

The skill SHALL contain a mapping of configuration source files to manual.html sections, enabling targeted analysis without scanning the entire HTML file.

#### Scenario: zshrc eza aliases changed

- **WHEN** eza-related aliases in zshrc are modified
- **THEN** the skill identifies Section 3 (Files & Viewing) as the target section

#### Scenario: Multiple config files changed

- **WHEN** changes span both gitconfig and ghostty config
- **THEN** the skill identifies both Section 1 (Terminal) and Section 4 (Git) as targets

### Requirement: Gap detection

The skill SHALL compare the actual state of configuration files against the current content of docs/manual.html to detect discrepancies: missing entries, outdated entries, and entries for removed features.

#### Scenario: New alias exists but not documented

- **WHEN** an alias exists in zshrc but has no corresponding row in the manual's table
- **THEN** the skill identifies it as a missing entry and proposes adding a table row

#### Scenario: Documented alias no longer exists

- **WHEN** a table row in the manual references an alias that no longer exists in the config
- **THEN** the skill identifies it as stale and proposes removal

#### Scenario: Alias value changed

- **WHEN** an alias in zshrc maps to a different command than what the manual documents
- **THEN** the skill proposes updating the table row

### Requirement: Propose changes with HTML conventions

The skill SHALL propose changes using the exact HTML patterns of the existing manual: `<details>`/`<summary>` for sections, `<h3>` for subsections, `<table>` with thead/tbody for data, `<code>` for aliases/commands/values, `<kbd>` for physical keys, and `.flow-only` divs for workflows.

#### Scenario: Propose new table row

- **WHEN** a new alias needs documenting
- **THEN** the proposal includes a complete `<tr><td>` block with proper `<code>` wrapping

#### Scenario: Propose new subsection

- **WHEN** a new tool category is added to an existing section
- **THEN** the proposal includes an `<h3>` heading followed by a complete table structure

#### Scenario: Propose new section

- **WHEN** an entirely new tool category is added that doesn't fit existing sections
- **THEN** the proposal includes a complete `<details>` block with summary, sidebar link update, and section numbering adjustment

### Requirement: Propose-then-apply workflow

The skill SHALL present all proposed changes to the user in a structured format and SHALL NOT edit docs/manual.html until the user explicitly confirms.

#### Scenario: User confirms proposals

- **WHEN** the skill presents proposals and the user confirms
- **THEN** the skill applies the approved changes to docs/manual.html

#### Scenario: User rejects some proposals

- **WHEN** the user rejects specific proposals but approves others
- **THEN** the skill applies only the approved changes

#### Scenario: No changes needed

- **WHEN** analysis determines the manual is already in sync with configs
- **THEN** the skill reports "manual is up to date" and makes no proposals

### Requirement: Skill and command content duplication

The skill SKILL.md and command manual.md SHALL contain the same prompt content, following the OpenSpec pattern in this repo. The command version SHALL reference `/docs:manual` in examples where the skill version uses generic text.

#### Scenario: Content parity

- **WHEN** both files are compared (excluding frontmatter and slash command references)
- **THEN** the instructional content is functionally identical
