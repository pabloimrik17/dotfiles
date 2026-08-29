## REMOVED Requirements

### Requirement: Slidev install is scoped to Claude Code only in this change

**Reason**: Codex discovers the existing canonical global skill directory directly, so the assertion that the installation is available only to Claude Code is no longer true once Codex is installed.

**Migration**: Keep the canonical skill at `~/.agents/skills/slidev` and the Claude Code compatibility symlink, and rely on Codex's native discovery without adding a Codex-specific entry.

## ADDED Requirements

### Requirement: Slidev skill is available to Claude Code and Codex

The Slidev skill SHALL remain installed canonically at `~/.agents/skills/slidev`. Claude Code SHALL access it through the existing `~/.claude/skills/slidev` compatibility symlink, while Codex SHALL discover the canonical directory directly. The setup SHALL NOT create `~/.codex/skills/slidev`, `~/.config/opencode/skills/slidev`, or `~/.opencode/skills/slidev` entries.

#### Scenario: Claude Code and Codex discover Slidev

- **WHEN** the install step succeeds on a machine with Claude Code and Codex configured
- **THEN** Claude Code discovers Slidev through `~/.claude/skills/slidev`
- **AND** Codex discovers Slidev directly from `~/.agents/skills/slidev`

#### Scenario: No Codex-specific skill entry is created

- **WHEN** the Slidev installation is inspected
- **THEN** no `~/.codex/skills/slidev` entry exists
- **AND** the Codex-visible skill body remains `~/.agents/skills/slidev/SKILL.md`
