# Capability: mcp-global-config

## Purpose

Global MCP server configuration managed by chezmoi — defines which MCP servers are available in every Claude Code session across all machines.

## Requirements

### Requirement: Global MCP servers are defined in chezmoi settings template

`dot_claude/settings.json.tmpl` SHALL contain an `mcpServers` key with the following 10 servers:

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

#### Scenario: All 10 servers present after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.claude/settings.json` SHALL contain an `mcpServers` object with exactly the 10 servers listed above

#### Scenario: Expect server uses npx with @latest tag

- **WHEN** inspecting the deployed `~/.claude/settings.json`
- **THEN** the `expect` MCP server entry SHALL have command `npx` and args `["-y", "expect-cli@latest", "mcp"]`

#### Scenario: Stdio servers use @latest versions

- **WHEN** inspecting the deployed `~/.claude/settings.json`
- **THEN** all 7 stdio servers SHALL reference `@latest` (not pinned versions)

#### Scenario: Existing settings keys are preserved

- **WHEN** `chezmoi apply` deploys the updated template
- **THEN** the `env`, `statusLine`, `enabledPlugins`, `extraKnownMarketplaces`, and `effortLevel` keys SHALL remain unchanged

### Requirement: Atlassian and Figma included as local HTTP servers

The `mcpServers` key in `dot_claude/settings.json.tmpl` SHALL include `atlassian` and `figma` as HTTP remote servers. These are included locally for availability regardless of organization cloud configuration. They coexist with any cloud-managed instances.

#### Scenario: Atlassian and Figma present in global config

- **WHEN** inspecting the deployed `~/.claude/settings.json`
- **THEN** the `mcpServers` object SHALL contain keys `atlassian` (url: `https://mcp.atlassian.com/v1/mcp`) and `figma` (url: `https://mcp.figma.com/mcp`)

### Requirement: Template uses no machine-specific conditionals for MCP

The `mcpServers` block SHALL be plain JSON without chezmoi template conditionals (`{{ if }}`, `{{ else }}`). All 10 servers are deployed identically to every machine.

#### Scenario: No conditional logic in mcpServers block

- **WHEN** reading `dot_claude/settings.json.tmpl`
- **THEN** the `mcpServers` section SHALL contain no chezmoi template directives (`{{ ... }}` tokens of any kind)

### Requirement: Expect MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain an `mcp` key with an `expect` server entry using the OpenCode local MCP format.

#### Scenario: Expect MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp` object with an `expect` entry of type `"local"`, command `["npx", "-y", "expect-cli@latest", "mcp"]`, and `enabled: true`

#### Scenario: OpenCode MCP section does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged
