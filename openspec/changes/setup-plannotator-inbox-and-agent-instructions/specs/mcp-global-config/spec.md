# Spec Delta

## ADDED Requirements

### Requirement: Inbox transport matches each agent's supported integration

The setup SHALL provide Inbox through existing Plannotator plugins for Claude Code and OpenCode, and through a user-scope stdio server named `plannotator-inbox` for Codex and Junie. Stdio registrations SHALL use an absolute Plannotator binary path with arguments `inbox`, `mcp`. The native integrations SHALL NOT gain a redundant stdio connection from this setup.

#### Scenario: Native plugin hosts

- **WHEN** Claude Code or OpenCode is configured for Inbox
- **THEN** setup SHALL reuse `plannotator@plannotator` or `@plannotator/opencode@latest`, respectively
- **AND** documentation SHALL name the installed guide's host/version prerequisites and the OpenCode activation preference

#### Scenario: Codex connection is absent

- **WHEN** Codex and an Inbox-capable Plannotator binary are available, no Inbox server exists and the registration group is accepted
- **THEN** setup SHALL run `codex mcp add plannotator-inbox -- <absolute-binary> inbox mcp`
- **AND** it SHALL verify the result through Codex's JSON output without managing `~/.codex/config.toml` as a whole

#### Scenario: Junie connection is absent

- **WHEN** chezmoi applies Junie's configuration and the supported Plannotator binary is available
- **THEN** `~/.junie/mcp/mcp.json` SHALL receive `mcpServers.plannotator-inbox` with `command` set to the absolute binary and `args` set to `["inbox", "mcp"]`
- **AND** unrelated server entries and top-level values SHALL remain intact

### Requirement: Inbox registration preserves existing choices

Inbox reconciliation SHALL skip matching connections, preserve disabled or conflicting entries and warn about conflicts instead of replacing them. Missing prerequisites or invalid discovery output SHALL leave existing state untouched and report incomplete setup. Repeating a successful setup SHALL make no additional registrations.

#### Scenario: Matching entry already exists

- **WHEN** Codex or Junie already runs the resolved binary with `inbox mcp`
- **THEN** setup SHALL report it as already configured and preserve its other client options

#### Scenario: Conflict or explicit opt-out

- **WHEN** `plannotator-inbox` is disabled or points to another command or transport
- **THEN** setup SHALL preserve it and report the action that requires user review
- **AND** it SHALL NOT remove, re-add or re-enable the entry automatically

#### Scenario: Client discovery fails

- **WHEN** Codex returns unreadable JSON or Junie's configuration is malformed
- **THEN** setup SHALL report the failure without overwriting client configuration

#### Scenario: Prerequisite missing

- **WHEN** Plannotator is unavailable or incompatible, or the applicable registration CLI is unavailable
- **THEN** setup SHALL skip that registration with an actionable warning
- **AND** it SHALL continue unrelated setup groups

### Requirement: Inbox ownership and parity are explicit

The parity documentation SHALL record transport, activation, configuration ownership and reply delivery for Claude Code, Codex, OpenCode and Junie. Agent instructions and MCP support SHALL be evaluated separately so an unsupported note-installation path does not become a false MCP capability gap.

#### Scenario: Parity is reviewed

- **WHEN** the Inbox parity row is read
- **THEN** all four agents SHALL have concrete integration surfaces and delivery behavior
- **AND** Junie's supported stdio transport SHALL be distinguished from the absence of a Junie ID in Plannotator's note installer
