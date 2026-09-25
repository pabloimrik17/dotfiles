## ADDED Requirements

### Requirement: DeepWiki read-only tools are allowed

The chezmoi-managed Claude Code settings SHALL include exact `permissions.allow` rules for the three public DeepWiki tools:

- `mcp__deepwiki__read_wiki_structure`
- `mcp__deepwiki__read_wiki_contents`
- `mcp__deepwiki__ask_question`

The settings SHALL NOT use an `mcp__deepwiki__*` wildcard.

#### Scenario: DeepWiki wiki structure lookup runs without prompt

- **WHEN** Claude Code calls `mcp__deepwiki__read_wiki_structure`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: DeepWiki documentation read runs without prompt

- **WHEN** Claude Code calls `mcp__deepwiki__read_wiki_contents`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: DeepWiki question runs without prompt

- **WHEN** Claude Code calls `mcp__deepwiki__ask_question`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Permission scope is exact

- **WHEN** the managed Claude Code allowlist is inspected
- **THEN** it SHALL contain the three exact rules above
- **AND** it SHALL NOT contain an `mcp__deepwiki__*` wildcard
