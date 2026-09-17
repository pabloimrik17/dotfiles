# Capability: mcp-global-config

## ADDED Requirements

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
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an enabled remote `mcp.jetbrains` entry with URL `http://localhost:64542/stream`
- **AND** the existing `model`, `tui`, `plugin`, `formatter`, `permission`, and other MCP entries SHALL remain unchanged

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

### Requirement: JetBrains MCP availability is bound to a running IDE

The `jetbrains` server SHALL be documented as a local service whose lifetime is the IDE process, not a remote always-on endpoint. A connection failure while WebStorm is closed SHALL be expected behavior rather than a misconfiguration, and SHALL NOT affect other MCP server connections.

Enabling the IDE-side server SHALL remain outside chezmoi's scope: the JetBrains IDE configuration is not managed by this repository. Documentation SHALL state the one-time manual prerequisite and SHALL NOT imply that `chezmoi apply` performs it.

#### Scenario: WebStorm is not running

- **WHEN** WebStorm is closed and an agent lists its MCP servers
- **THEN** `jetbrains` SHALL report a connection failure
- **AND** no error SHALL affect other MCP server connections

#### Scenario: Manual prerequisite is printed

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `jetbrains` MCP requires Settings → Tools → MCP Server enabled in the JetBrains IDE
- **AND** it SHALL note that the IDE must be running for the server to answer

#### Scenario: IDE settings are not managed

- **WHEN** the chezmoi source state is inspected
- **THEN** it SHALL contain no JetBrains IDE settings, `.vmoptions`, or MCP-server enablement file
- **AND** the port SHALL be consumed as the plugin's WebStorm default rather than forced by a managed IDE option

### Requirement: JetBrains MCP has no local update lifecycle

The `jetbrains` server SHALL be classified as an IDE-provided local service. The setup SHALL NOT install a local package, store a credential, add a Renovate pin, or add an `update-extra` step for it. Its version SHALL be owned by the JetBrains IDE release that bundles the plugin.

#### Scenario: Update mechanisms are inspected

- **WHEN** the install script, Renovate configuration, and `update-extra` workflow are inspected
- **THEN** `jetbrains` SHALL appear only as MCP configuration and documentation
- **AND** no local JetBrains MCP update action SHALL exist

## MODIFIED Requirements

### Requirement: Global MCP servers are registered via Claude CLI in install script

`run_onchange_install-packages.sh.tmpl` SHALL register the following 16 MCP servers via `claude mcp add --scope user`, which writes to `~/.claude.json`:

| Name            | Type  | Command/URL                                            |
| --------------- | ----- | ------------------------------------------------------ |
| eslint          | stdio | `npx -y @eslint/mcp@0.3.0`                             |
| context7        | stdio | `npx -y @upstash/context7-mcp@2.1.2`                   |
| knip            | stdio | `npx -y @knip/mcp@0.0.19`                              |
| memory          | stdio | `npx -y @modelcontextprotocol/server-memory@2026.1.26` |
| playwright      | stdio | `npx -y @playwright/mcp@0.0.68`                        |
| chrome-devtools | stdio | `npx -y chrome-devtools-mcp@0.18.1`                    |
| expect          | stdio | `npx -y expect-cli@0.1.3 mcp`                          |
| fallow          | stdio | `fallow-mcp` (PATH binary from the global npm install) |
| gh_grep         | http  | `https://mcp.grep.app`                                 |
| deepwiki        | http  | `https://mcp.deepwiki.com/mcp`                         |
| atlassian       | http  | `https://mcp.atlassian.com/v1/mcp`                     |
| figma           | http  | `https://mcp.figma.com/mcp`                            |
| linear          | http  | `https://mcp.linear.app/mcp`                           |
| notion          | http  | `https://mcp.notion.com/mcp`                           |
| storybook       | http  | `http://localhost:6006/mcp`                            |
| jetbrains       | http  | `http://localhost:64542/stream`                        |

`dot_claude/modify_settings.json.tmpl` SHALL NOT contain an `mcpServers` key.

#### Scenario: All 14 servers registered after install script runs

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL still list the servers in the table above other than `deepwiki` and `jetbrains`

#### Scenario: DeepWiki is registered as the fifteenth server

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL also list `deepwiki` at `https://mcp.deepwiki.com/mcp`

#### Scenario: JetBrains is registered as the sixteenth server

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL also list `jetbrains` at `http://localhost:64542/stream`

#### Scenario: Servers registered to correct file

- **WHEN** a stdio MCP server is registered via the install script
- **THEN** `~/.claude.json` SHALL contain the server under the `mcpServers` key
- **AND** `~/.claude/settings.json` SHALL NOT contain an `mcpServers` key

#### Scenario: Settings template has no mcpServers block

- **WHEN** reading `dot_claude/modify_settings.json.tmpl`
- **THEN** the file SHALL NOT contain an `mcpServers` key at any level

#### Scenario: Stdio servers use pinned versions managed by Renovate

- **WHEN** inspecting registered stdio servers via `claude mcp get <name>`
- **THEN** the 7 npx-launched stdio servers SHALL reference pinned versions (not `@latest`)
- **AND** `renovate.json` SHALL contain a custom regex manager for the install script template

#### Scenario: Fallow server runs the global binary without a pin

- **WHEN** inspecting the `fallow` server via `claude mcp get fallow`
- **THEN** its command SHALL be the bare `fallow-mcp` binary (no npx, no version pin)
- **AND** its version SHALL be owned by the global npm install (updated via `update-extra`), so the MCP server and the `fallow` CLI it shells out to can never skew from each other

#### Scenario: Fallow entry is presence-checked only

- **WHEN** the install script pre-scans MCP servers for outdated pins
- **THEN** the `fallow` entry SHALL participate in presence detection only, not in the `pkg@version` outdated-check

### Requirement: Template uses no machine-specific conditionals for MCP

The MCP server list in `run_onchange_install-packages.sh.tmpl` SHALL be plain bash arrays without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 16 Claude Code servers are registered identically on every machine, including the two that resolve to `localhost` and answer only while their local process is running.

#### Scenario: No conditional logic in MCP server arrays

- **WHEN** reading `run_onchange_install-packages.sh.tmpl`
- **THEN** the MCP server arrays SHALL contain no chezmoi template directives
