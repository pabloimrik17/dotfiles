## MODIFIED Requirements

### Requirement: Manual setup guidance covers Codex lifecycle

The setup's manual fallback and user documentation SHALL include the standalone install command, first-run interactive authentication, update guidance, shell completion generation, `AGENTS.md` instructions, skill discovery from `.agents/skills`, and the runtime-owned Linear MCP registration, OAuth login, status, and verification workflow. The documentation SHALL distinguish the narrowly reconciled Linear entry from the rest of Codex's unmanaged preferences and runtime state.

#### Scenario: Automated setup is unavailable

- **WHEN** the setup displays manual installation guidance
- **THEN** it includes the Codex standalone install command and directs the user to run `codex` to authenticate
- **AND** it includes `codex mcp add linear --url https://mcp.linear.app/mcp`, notes that this command may initiate OAuth immediately, and presents `codex mcp login linear` as the explicit authentication and recovery command

#### Scenario: User consults Codex documentation

- **WHEN** the user opens the Codex section of the manual
- **THEN** it documents installation, authentication, updates, completion generation, `AGENTS.md`, `.agents/skills`, and Linear MCP registration and verification
- **AND** it states that only the Linear MCP entry is reconciled by setup while other `~/.codex` preferences and runtime state remain Codex-owned
