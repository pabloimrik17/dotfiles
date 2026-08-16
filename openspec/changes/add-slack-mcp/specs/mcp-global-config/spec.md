# Delta: mcp-global-config

## ADDED Requirements

### Requirement: Slack is deliberately excluded from the Claude CLI MCP registration arrays

`run_onchange_install-packages.sh.tmpl` SHALL NOT contain a `slack` entry in `MCP_STDIO_SERVERS` or `MCP_HTTP_SERVERS`, and the server table registered via `claude mcp add --scope user` SHALL NOT include Slack. Claude Code receives the Slack MCP server exclusively from the `slack@claude-plugins-official` plugin.

The reason is technical, not stylistic: `https://mcp.slack.com/.well-known/oauth-authorization-server` advertises no `registration_endpoint`, so Slack does not support Dynamic Client Registration — the only OAuth path available to a server registered with `claude mcp add --transport http`. Such a registration would report success and then fail to authenticate on every use. The plugin is what supplies the pre-registered `clientId` that lets the flow complete.

#### Scenario: Install script contains no Slack MCP entry

- **WHEN** `run_onchange_install-packages.sh.tmpl` is inspected
- **THEN** neither `MCP_STDIO_SERVERS` nor `MCP_HTTP_SERVERS` SHALL contain a `slack` element
- **AND** the count reported by the MCP pre-scan SHALL be unchanged by this change

#### Scenario: No user-scope Slack server after apply

- **WHEN** `claude mcp list --scope user` is run after `chezmoi apply`
- **THEN** no `slack` server SHALL be listed at user scope
- **AND** `/mcp` inside Claude Code SHALL still show `slack`, provided by the plugin

#### Scenario: Rationale is recorded next to the arrays

- **WHEN** a future audit compares the MCP server list against the set of configured integrations
- **THEN** the install script SHALL carry a comment stating that Slack is intentionally absent because Slack does not support Dynamic Client Registration and is provided by the plugin instead

### Requirement: Slack MCP server is registered as a remote server in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain a `slack` entry inside its `mcp` object with type `"remote"`, url `"https://mcp.slack.com/mcp"`, `enabled: true`, `oauth: false`, and an `Authorization` header of `"Bearer {env:SLACK_MCP_TOKEN}"`.

OAuth SHALL be disabled explicitly: OpenCode's automatic flow depends on Dynamic Client Registration, which Slack does not offer, and Slack's token endpoint advertises only `client_secret_post`, which rules out a public PKCE client as well. The bearer token is therefore the only workable authentication path on the OpenCode side.

#### Scenario: Slack entry present after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp.slack` object of type `"remote"` pointing at `https://mcp.slack.com/mcp`, with `enabled: true`, `oauth: false`, and the `Authorization` header set to `Bearer {env:SLACK_MCP_TOKEN}`

#### Scenario: Token resolved from the environment

- **WHEN** OpenCode starts from a shell where `SLACK_MCP_TOKEN` is exported
- **THEN** the `{env:SLACK_MCP_TOKEN}` placeholder SHALL be substituted with the token value
- **AND** the `slack` server SHALL connect and expose its tools

#### Scenario: Token missing

- **WHEN** OpenCode starts with `SLACK_MCP_TOKEN` unset
- **THEN** the `slack` server SHALL report as failed to connect — the behaviour already accepted for `storybook` in Claude Code
- **AND** the `expect` server and all other OpenCode functionality SHALL be unaffected

#### Scenario: Existing OpenCode config keys are untouched

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged
- **AND** the existing `mcp.expect` entry SHALL remain unchanged

#### Scenario: Config remains valid JSONC

- **WHEN** the rendered `~/.config/opencode/opencode.jsonc` is parsed
- **THEN** it SHALL parse without error against the OpenCode schema declared in `$schema`

### Requirement: Slack setup steps are printed in the manual instructions section

The manual instructions section of `run_onchange_install-packages.sh.tmpl` SHALL include a Slack line covering the three things the script cannot do itself: the Claude Code OAuth flow on first use, the workspace administrator's approval of the Slack MCP connector, and the `SLACK_MCP_TOKEN` needed by OpenCode.

#### Scenario: Slack note printed on macOS

- **WHEN** the install script reaches the "Manual Installation Required" section on macOS
- **THEN** it SHALL print a Slack MCP line mentioning OAuth on first use, the required workspace admin approval, and `SLACK_MCP_TOKEN` for OpenCode

#### Scenario: Admin approval is not verified by the script

- **WHEN** the install script runs
- **THEN** it SHALL NOT attempt to verify or request Slack workspace approval, and its exit status SHALL NOT depend on the Slack connector being approved
