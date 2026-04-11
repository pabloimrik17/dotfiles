# Capability: mcp-global-config

## Purpose

Global MCP server configuration managed by chezmoi — defines which MCP servers are available in every Claude Code session across all machines.

## Requirements

### Requirement: Global MCP servers are registered via Claude CLI in install script

`run_onchange_install-packages.sh.tmpl` SHALL register the following 10 MCP servers via `claude mcp add --scope user`, which writes to `~/.claude.json`:

| Name            | Type  | Command/URL                                         |
| --------------- | ----- | --------------------------------------------------- |
| eslint          | stdio | `npx -y @eslint/mcp@latest`                         |
| context7        | stdio | `npx -y @upstash/context7-mcp@latest`               |
| knip            | stdio | `npx -y @knip/mcp@latest`                           |
| memory          | stdio | `npx -y @modelcontextprotocol/server-memory@latest` |
| playwright      | stdio | `npx -y @playwright/mcp@latest`                     |
| chrome-devtools | stdio | `npx -y chrome-devtools-mcp@latest`                 |
| expect          | stdio | `npx -y expect-cli@latest mcp`                      |
| gh_grep         | http  | `https://mcp.grep.app`                              |
| atlassian       | http  | `https://mcp.atlassian.com/v1/mcp`                  |
| figma           | http  | `https://mcp.figma.com/mcp`                         |

`dot_claude/settings.json.tmpl` SHALL NOT contain an `mcpServers` key.

#### Scenario: All 10 servers registered after install script runs

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL list all 10 servers above

#### Scenario: Servers registered to correct file

- **WHEN** a stdio MCP server is registered via the install script
- **THEN** `~/.claude.json` SHALL contain the server under the `mcpServers` key
- **AND** `~/.claude/settings.json` SHALL NOT contain an `mcpServers` key

#### Scenario: Settings template has no mcpServers block

- **WHEN** reading `dot_claude/settings.json.tmpl`
- **THEN** the file SHALL NOT contain an `mcpServers` key at any level

#### Scenario: Stdio servers use pinned versions managed by Renovate

- **WHEN** inspecting registered stdio servers via `claude mcp get <name>`
- **THEN** all 7 stdio servers SHALL reference pinned versions (not `@latest`)
- **AND** `renovate.json` SHALL contain a custom regex manager for the install script template

### Requirement: MCP registration is idempotent and follows install script patterns

The MCP server registration group SHALL use the existing `run_claude_step` helper, `confirm` prompt pattern, and pre-scan idiom consistent with other install groups.

#### Scenario: Pre-scan shows installed vs pending count

- **WHEN** the install script reaches the MCP servers group
- **THEN** it SHALL display the count of already-registered vs pending servers (e.g., "MCP servers: 7/10 registered")

#### Scenario: Already-registered servers are skipped

- **WHEN** a server is already registered in `~/.claude.json`
- **THEN** the install script SHALL skip it with an "already registered, skipping" message

#### Scenario: Registration continues on individual failure

- **WHEN** `claude mcp add` fails for one server
- **THEN** the script SHALL log an error and continue registering remaining servers (non-fatal)

#### Scenario: Claude CLI not available

- **WHEN** `claude` is not in PATH during `chezmoi apply`
- **THEN** the MCP registration group SHALL be skipped with a warning (same guard as CC plugins group)

### Requirement: Atlassian and Figma included as HTTP servers with auth note

The install script SHALL register `atlassian` and `figma` as HTTP MCP servers. The manual instructions section SHALL note that these servers require interactive OAuth authentication after registration.

#### Scenario: HTTP servers registered with correct transport

- **WHEN** the install script registers `atlassian` and `figma`
- **THEN** it SHALL use `claude mcp add --scope user --transport http <name> <url>`

#### Scenario: Manual auth instructions printed

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line noting that `atlassian` and `figma` MCP servers require authentication via `claude mcp get <name>` or first use

### Requirement: Template uses no machine-specific conditionals for MCP

The MCP server list in `run_onchange_install-packages.sh.tmpl` SHALL be plain bash arrays without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 10 servers are registered identically on every machine.

#### Scenario: No conditional logic in MCP server arrays

- **WHEN** reading `run_onchange_install-packages.sh.tmpl`
- **THEN** the MCP server arrays SHALL contain no chezmoi template directives

### Requirement: Expect MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain an `mcp` key with an `expect` server entry using the OpenCode local MCP format.

#### Scenario: Expect MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp` object with an `expect` entry of type `"local"`, command `["npx", "-y", "expect-cli@latest", "mcp"]`, and `enabled: true`

#### Scenario: OpenCode MCP section does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged
