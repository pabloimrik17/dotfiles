# Delta: mcp-global-config

## ADDED Requirements

### Requirement: Sentry MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain a `sentry` entry inside its `mcp` object, using the OpenCode remote MCP format: `type: "remote"`, `url: "https://mcp.sentry.dev/mcp"`, and `enabled: true`. No headers and no `oauth` key SHALL be set — OpenCode performs OAuth discovery with PKCE and Dynamic Client Registration automatically for remote servers.

#### Scenario: Sentry MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp` object with a `sentry` entry of type `"remote"`, url `"https://mcp.sentry.dev/mcp"`, and `enabled: true`

#### Scenario: Existing expect server is preserved

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `expect` entry SHALL remain in the `mcp` object unchanged

#### Scenario: OpenCode MCP section does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged

#### Scenario: OAuth sign-in for the remote server

- **WHEN** the user runs `opencode mcp auth sentry`
- **THEN** OpenCode SHALL start the OAuth flow against `https://mcp.sentry.dev/mcp` and store the credentials outside the dotfiles repo
- **AND** no token SHALL be committed to the repository or added to the age-encrypted file

#### Scenario: Server can be turned off without removing the entry

- **WHEN** the user sets `enabled: false` on the `sentry` entry
- **THEN** OpenCode SHALL NOT connect to the server and its tools SHALL NOT be loaded into context

### Requirement: Sentry MCP is provided by the Claude Code plugin, not the install script

For Claude Code, the Sentry MCP server SHALL be provided exclusively by the `sentry-mcp@sentry-mcp` plugin, which ships its own `.mcp.json`. Therefore `run_onchange_install-packages.sh.tmpl` SHALL NOT contain any `sentry` entry in `MCP_STDIO_SERVERS` or `MCP_HTTP_SERVERS`, and the server counts of that group SHALL be unchanged by this capability. Registering the same endpoint through `claude mcp add --scope user` would open a second connection to `https://mcp.sentry.dev/mcp` and load a duplicate copy of the Sentry toolset into context.

#### Scenario: Install script arrays contain no Sentry entry

- **WHEN** reading `run_onchange_install-packages.sh.tmpl`
- **THEN** neither `MCP_STDIO_SERVERS` nor `MCP_HTTP_SERVERS` SHALL contain an entry whose name is `sentry`
- **AND** the group's `TOTAL_MCP` count SHALL be unchanged

#### Scenario: No user-scope Sentry server in Claude config

- **WHEN** the install script has run to completion on a machine with `claude` and `jq` available
- **THEN** `jq '.mcpServers.sentry' ~/.claude.json` SHALL yield `null`
- **AND** `claude mcp list --scope user` SHALL NOT list a `sentry` server

#### Scenario: Exactly one Sentry server visible in a session

- **WHEN** the user runs `/mcp` inside a Claude Code session with the plugin installed and enabled
- **THEN** exactly one Sentry server SHALL be listed, namely `plugin:sentry-mcp:sentry`
