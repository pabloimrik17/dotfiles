# Delta: claude-user-preferences

## MODIFIED Requirements

### Requirement: MCP read-only tools are allowed

The chezmoi template SHALL include the following MCP tool allow rules in `permissions.allow`:

- `mcp__context7__resolve-library-id`
- `mcp__context7__query-docs`
- `mcp__plugin_episodic-memory_episodic-memory__search`
- `mcp__plugin_episodic-memory_episodic-memory__read`
- `mcp__knip__knip-run`
- `mcp__knip__knip-docs`
- `mcp__eslint__lint-files`
- `mcp__memory__read_graph`
- `mcp__memory__search_nodes`
- `mcp__memory__open_nodes`
- `mcp__gh_grep__searchGitHub`
- `mcp__plugin_slack_slack__slack_search_public`
- `mcp__plugin_slack_slack__slack_search_channels`
- `mcp__plugin_slack_slack__slack_search_users`
- `mcp__plugin_slack_slack__slack_read_channel`
- `mcp__plugin_slack_slack__slack_read_thread`
- `mcp__plugin_slack_slack__slack_read_canvas`
- `mcp__plugin_slack_slack__slack_read_user_profile`

MCP write tools (memory create/delete, playwright, chrome-devtools) SHALL NOT be in the allow list and SHALL remain at the default ask level.

The Slack rules follow the plugin-provided naming scheme `mcp__plugin_<plugin>_<server>__<tool>`, already used for episodic-memory; for the `slack` plugin both the plugin and its MCP server are named `slack`. Slack write tools (`slack_send_message`, `slack_send_message_draft`, `slack_schedule_message`, `slack_create_canvas`, `slack_update_canvas`) SHALL NOT be allowlisted. `mcp__plugin_slack_slack__slack_search_public_and_private` SHALL also stay out of the allow list: the tool reaches private conversations and its own contract asks for explicit user consent per call.

#### Scenario: context7 doc lookup runs without prompt

- **WHEN** Claude Code attempts to call `mcp__context7__query-docs`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: memory write prompts

- **WHEN** Claude Code attempts to call `mcp__memory__create_entities`
- **THEN** the tool call SHALL prompt the user for confirmation

#### Scenario: Slack public search runs without prompt

- **WHEN** Claude Code attempts to call `mcp__plugin_slack_slack__slack_search_public`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Slack channel and thread reads run without prompt

- **WHEN** Claude Code attempts to call `mcp__plugin_slack_slack__slack_read_channel` or `mcp__plugin_slack_slack__slack_read_thread`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Slack private search prompts

- **WHEN** Claude Code attempts to call `mcp__plugin_slack_slack__slack_search_public_and_private`
- **THEN** no allow rule SHALL match and the tool call SHALL prompt the user for confirmation

#### Scenario: Slack message send prompts

- **WHEN** Claude Code attempts to call `mcp__plugin_slack_slack__slack_send_message`
- **THEN** the tool call SHALL prompt the user for confirmation

#### Scenario: Slack canvas write prompts

- **WHEN** Claude Code attempts to call `mcp__plugin_slack_slack__slack_create_canvas` or `mcp__plugin_slack_slack__slack_update_canvas`
- **THEN** the tool call SHALL prompt the user for confirmation
