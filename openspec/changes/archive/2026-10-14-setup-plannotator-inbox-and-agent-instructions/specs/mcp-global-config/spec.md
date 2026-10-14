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

### Requirement: OpenCode v2 migration preserves managed behavior

The setup SHALL use native OpenCode v2 configuration for the existing managed server and project settings, preserving model selection, shell, formatter, permission rules (force-push denies follow allows), retained plugin sources and every MCP endpoint. It SHALL merge only the declared theme and scrolling settings into private CLI configuration while preserving unrelated runtime preferences.

#### Scenario: Server and project configuration are converted

- **WHEN** legacy OpenCode config is converted to native v2 fields
- **THEN** normalized configuration SHALL retain the same permission rules and MCP server definitions, with force-push denies after shell allows and DCP removed from the retained plugins
- **AND** no redundant Inbox MCP entry or new permission grant SHALL appear

#### Scenario: Existing CLI preferences are present

- **WHEN** chezmoi applies the v2 CLI settings
- **THEN** it SHALL set `theme.name` to `catppuccin-macchiato` and `scroll.acceleration` to true while preserving unrelated settings and nested options
- **AND** malformed input or a failed merge SHALL leave the live file unchanged, with missing uv reported as a prerequisite skip

#### Scenario: Native plugin verification

- **WHEN** OpenCode reloads the migrated configuration
- **THEN** the existing Plannotator plugin and native Inbox tool SHALL be discoverable
- **AND** runtime credentials and session state SHALL remain outside Git

## MODIFIED Requirements

### Requirement: DeepWiki is available in every managed coding agent

The chezmoi setup SHALL provide one enabled user-scope MCP server named `deepwiki`, using Streamable HTTP at `https://mcp.deepwiki.com/mcp` without authentication, to Claude Code, Codex, OpenCode, and Junie. It SHALL NOT configure the deprecated `https://mcp.deepwiki.com/sse` endpoint or the authenticated Devin endpoint.

#### Scenario: Claude Code has DeepWiki

- **WHEN** the user confirms the Claude Code MCP registration group during `chezmoi apply`
- **THEN** `claude mcp get deepwiki` SHALL report an HTTP server at `https://mcp.deepwiki.com/mcp`

#### Scenario: Codex has DeepWiki

- **WHEN** the user confirms the Codex MCP registration group during `chezmoi apply`
- **THEN** `codex mcp get deepwiki --json` SHALL report a Streamable HTTP server at `https://mcp.deepwiki.com/mcp`

#### Scenario: OpenCode has DeepWiki

- **WHEN** `chezmoi apply` deploys the OpenCode user configuration
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain a remote `mcp.servers.deepwiki` entry with `disabled: false` and URL `https://mcp.deepwiki.com/mcp`
- **AND** the existing `model`, `shell`, `plugins`, `formatter`, `update`, `permissions`, and other MCP entries SHALL remain unchanged

#### Scenario: Junie has DeepWiki

- **WHEN** `chezmoi apply` deploys the Junie user configuration
- **THEN** `~/.junie/mcp/mcp.json` SHALL contain `mcpServers.deepwiki.url` equal to `https://mcp.deepwiki.com/mcp`
- **AND** the entry SHALL require no headers, environment variables, or credentials

#### Scenario: Existing Junie configuration survives apply

- **WHEN** `~/.junie/mcp/mcp.json` contains valid unrelated servers or unknown top-level values and `chezmoi apply` runs
- **THEN** those values SHALL remain unchanged while `mcpServers.deepwiki` converges to the managed endpoint
- **AND** the separately managed `mcpServers.linear` entry SHALL remain present

### Requirement: Expect MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain an `mcp.servers.expect` entry using the OpenCode local MCP format.

#### Scenario: Expect MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp.servers` object with an `expect` entry of type `"local"`, command `["npx", "-y", "expect-cli@latest", "mcp"]`, and `disabled: false`

#### Scenario: OpenCode MCP section does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `shell`, `plugins`, `formatter`, `update`, and `permissions` keys SHALL remain unchanged

### Requirement: JetBrains IDE MCP is available in every managed coding agent

The chezmoi setup SHALL provide one enabled user-scope MCP server named `jetbrains`, using Streamable HTTP at `http://localhost:64542/stream` without authentication, to Claude Code, Codex, OpenCode, and Junie.

The port SHALL be `64542`. It is not arbitrary: the bundled `com.intellij.mcpServer` plugin computes its default listening port as a fixed base of `64342` plus a per-product offset, and WebStorm's offset is `+200`. `64342` is IntelliJ IDEA's default (offset `0`) and SHALL NOT be used.

The endpoint SHALL be `/stream`, the plugin's Streamable HTTP transport. The plugin also serves the deprecated SSE transport at `/sse`; managed entries SHALL NOT use it, so that all four agents reuse the existing Streamable HTTP registration paths and no agent carries a second transport shape.

#### Scenario: Claude Code has JetBrains

- **WHEN** the user confirms the Claude Code MCP registration group during `chezmoi apply`
- **THEN** `claude mcp get jetbrains` SHALL report an HTTP server at `http://localhost:64542/stream`

#### Scenario: Codex has JetBrains

- **WHEN** the user confirms the Codex MCP registration group during `chezmoi apply`
- **THEN** `codex mcp get jetbrains --json` SHALL report a Streamable HTTP server at `http://localhost:64542/stream`

#### Scenario: OpenCode has JetBrains

- **WHEN** `chezmoi apply` deploys the OpenCode user configuration
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain a remote `mcp.servers.jetbrains` entry with `disabled: false` and URL `http://localhost:64542/stream`
- **AND** the existing `model`, `shell`, `plugins`, `formatter`, `update`, `permissions`, and other MCP entries SHALL remain unchanged

#### Scenario: Junie has JetBrains

- **WHEN** `chezmoi apply` deploys the Junie user configuration
- **THEN** `~/.junie/mcp/mcp.json` SHALL contain `mcpServers.jetbrains.url` equal to `http://localhost:64542/stream`
- **AND** the entry SHALL require no headers, environment variables, or credentials

#### Scenario: Drifted hand-added entry is corrected

- **WHEN** an agent's configuration already contains a `jetbrains` entry pointing at `http://localhost:64342/sse`
- **AND** the user confirms the relevant MCP registration group
- **THEN** the setup SHALL replace that entry with the managed Streamable HTTP endpoint
- **AND** it SHALL NOT leave both the stale and the managed entry registered

#### Scenario: Managed entry carries no SSE transport

- **WHEN** the install script, OpenCode configuration, and Junie merge template are inspected
- **THEN** no managed `jetbrains` entry SHALL declare an `sse` transport or a `/sse` URL
