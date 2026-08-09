# Delta: mcp-global-config

## ADDED Requirements

### Requirement: PostHog MCP is provided by the Claude Code plugin, not the install-script registry

For Claude Code, the PostHog MCP server SHALL reach the machine exclusively through the `posthog@claude-plugins-official` plugin, which ships its own http MCP definition (`https://mcp.posthog.com/mcp`, header `x-posthog-mcp-consumer: plugin`) and exposes it under the plugin scope as `plugin:posthog:posthog`.

The `MCP_HTTP_SERVERS` array in `run_onchange_install-packages.sh.tmpl` SHALL NOT contain a `posthog` entry, and the install script SHALL NOT run `claude mcp add --scope user` for PostHog. Registering it in both places would load the same PostHog tool set twice in every session (`mcp__posthog__*` alongside `mcp__plugin_posthog_posthog__*`), consuming context for no extra capability and requiring two independent OAuth logins against the same account.

#### Scenario: Install script template has no posthog MCP entry

- **WHEN** reading the `MCP_STDIO_SERVERS` and `MCP_HTTP_SERVERS` arrays in `run_onchange_install-packages.sh.tmpl`
- **THEN** neither array SHALL contain an entry named `posthog`

#### Scenario: PostHog appears only under the plugin scope

- **WHEN** the plugin is installed and enabled and the user runs `claude mcp list`
- **THEN** PostHog SHALL appear once, as the plugin-scoped server `plugin:posthog:posthog`
- **AND** no user-scoped `posthog` server SHALL be present in `~/.claude.json`

#### Scenario: Registered server count is unchanged

- **WHEN** the install script completes the MCP servers group after this change
- **THEN** the number of servers it registers via `claude mcp add --scope user` SHALL be identical to before the change
- **AND** the pre-scan summary count SHALL NOT include PostHog

### Requirement: PostHog MCP server is registered globally in OpenCode config

`dot_config/opencode/opencode.jsonc` SHALL contain a `posthog` entry in its `mcp` object using the OpenCode remote MCP format: `type: "remote"`, `url: "https://mcp.posthog.com/mcp"`, `enabled: true`. OpenCode does not consume Claude Code plugins, so this entry is the only way PostHog reaches OpenCode; it follows the same `remote` shape already used for `gh_grep` in the project-level OpenCode config.

#### Scenario: PostHog MCP server present in OpenCode config after chezmoi apply

- **WHEN** `chezmoi apply` is run on a new machine
- **THEN** `~/.config/opencode/opencode.jsonc` SHALL contain an `mcp` object with a `posthog` entry of type `"remote"`, url `"https://mcp.posthog.com/mcp"`, and `enabled: true`

#### Scenario: OpenCode PostHog entry does not affect existing config keys

- **WHEN** `chezmoi apply` deploys the updated OpenCode config
- **THEN** the `model`, `tui`, `plugin`, `formatter`, and `permission` keys SHALL remain unchanged
- **AND** the existing `expect` entry inside `mcp` SHALL remain unchanged

#### Scenario: No credentials stored in the config

- **WHEN** reading the `posthog` entry in `dot_config/opencode/opencode.jsonc`
- **THEN** it SHALL contain no API key, personal access token, or `headers` block carrying a secret
- **AND** access SHALL be obtained through the OAuth flow at first use instead

### Requirement: Manual instructions cover PostHog authentication

The "Manual Installation Required" section of `run_onchange_install-packages.sh.tmpl` SHALL note that the PostHog MCP requires OAuth authentication, naming the entry point for each client: `/mcp` → `plugin:posthog:posthog` in Claude Code, and `opencode mcp auth` in OpenCode.

#### Scenario: Manual auth instructions printed for PostHog

- **WHEN** the install script reaches the manual instructions section
- **THEN** it SHALL include a line stating that the PostHog MCP requires OAuth authentication
- **AND** the line SHALL name both `/mcp` (Claude Code, under `plugin:posthog:posthog`) and `opencode mcp auth` (OpenCode)

#### Scenario: PostHog tools are unavailable until authenticated

- **WHEN** the plugin is installed and the OpenCode entry deployed, but the OAuth flow has not been completed
- **THEN** PostHog tool calls SHALL fail with an authentication error
- **AND** no other MCP server connection SHALL be affected
