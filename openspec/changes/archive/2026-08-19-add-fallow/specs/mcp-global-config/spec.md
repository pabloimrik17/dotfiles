# Delta: mcp-global-config

## MODIFIED Requirements

### Requirement: Global MCP servers are registered via Claude CLI in install script

`run_onchange_install-packages.sh.tmpl` SHALL register the following 14 MCP servers via `claude mcp add --scope user`, which writes to `~/.claude.json`:

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
| atlassian       | http  | `https://mcp.atlassian.com/v1/mcp`                     |
| figma           | http  | `https://mcp.figma.com/mcp`                            |
| linear          | http  | `https://mcp.linear.app/mcp`                           |
| notion          | http  | `https://mcp.notion.com/mcp`                           |
| storybook       | http  | `http://localhost:6006/mcp`                            |

`dot_claude/modify_settings.json.tmpl` SHALL NOT contain an `mcpServers` key.

#### Scenario: All 14 servers registered after install script runs

- **WHEN** `chezmoi apply` runs the install script on a machine with `claude` CLI available
- **AND** the user confirms the MCP servers install group
- **THEN** `claude mcp list --scope user` SHALL list all 14 servers above

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

The MCP server list in `run_onchange_install-packages.sh.tmpl` SHALL be plain bash arrays without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 14 servers are registered identically on every machine.

#### Scenario: No conditional logic in MCP server arrays

- **WHEN** reading `run_onchange_install-packages.sh.tmpl`
- **THEN** the MCP server arrays SHALL contain no chezmoi template directives
