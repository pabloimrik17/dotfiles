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
- `mcp__plugin_sentry-mcp_sentry__find_organizations`
- `mcp__plugin_sentry-mcp_sentry__find_projects`
- `mcp__plugin_sentry-mcp_sentry__get_sentry_resource`
- `mcp__plugin_sentry-mcp_sentry__search_events`
- `mcp__plugin_sentry-mcp_sentry__search_issues`
- `mcp__plugin_sentry-mcp_sentry__search_sentry_tools`

The Sentry rules use the plugin-namespaced prefix `mcp__plugin_sentry-mcp_sentry__` because the server is provided by the `sentry-mcp@sentry-mcp` plugin rather than registered at user scope.

MCP write tools (memory create/delete, playwright, chrome-devtools) SHALL NOT be in the allow list and SHALL remain at the default ask level.

The Sentry tools that write or consume quota — `analyze_issue_with_seer` (starts a Seer run) and `execute_sentry_tool` (a generic dispatcher that can assign, resolve, or otherwise mutate Sentry state) — SHALL NOT be allowlisted, and SHALL additionally be listed in `permissions.ask`:

- `mcp__plugin_sentry-mcp_sentry__analyze_issue_with_seer`
- `mcp__plugin_sentry-mcp_sentry__execute_sentry_tool`

Explicit `ask` rules are required rather than sufficient by omission: `permissions.defaultMode` is `auto`, so a tool matched by no rule is routed to the safety classifier, which runs without prompting. Rules are evaluated deny → ask → allow, and a matching `ask` rule forces a prompt even in auto mode. These two rules therefore complete the coverage of the eight tools the plugin exposes — six allowed, two prompted — leaving no Sentry tool to the classifier.

#### Scenario: context7 doc lookup runs without prompt

- **WHEN** Claude Code attempts to call `mcp__context7__query-docs`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: memory write prompts

- **WHEN** Claude Code attempts to call `mcp__memory__create_entities`
- **THEN** the tool call SHALL prompt the user for confirmation

#### Scenario: Sentry issue search runs without prompt

- **WHEN** Claude Code attempts to call `mcp__plugin_sentry-mcp_sentry__search_issues`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Sentry generic dispatcher prompts

- **WHEN** Claude Code attempts to call `mcp__plugin_sentry-mcp_sentry__execute_sentry_tool`
- **THEN** the `permissions.ask` rule SHALL match and the tool call SHALL prompt the user for confirmation
- **AND** the prompt SHALL occur even though the session is in auto mode

#### Scenario: Seer analysis prompts

- **WHEN** Claude Code attempts to call `mcp__plugin_sentry-mcp_sentry__analyze_issue_with_seer`
- **THEN** the `permissions.ask` rule SHALL match and the tool call SHALL prompt the user for confirmation
- **AND** no Seer run SHALL start, and no account quota SHALL be consumed, without that confirmation

#### Scenario: Renamed plugin server degrades to the classifier

- **WHEN** an upstream release renames the plugin's internal server so the tool identifiers no longer start with `mcp__plugin_sentry-mcp_sentry__`
- **THEN** both the Sentry allow rules and the Sentry ask rules SHALL stop matching
- **AND** every Sentry tool call SHALL be routed to the auto-mode safety classifier instead
- **AND** the two mutation tools SHALL therefore lose their guaranteed prompt — the accepted failure mode of pinning rules to a plugin-namespaced prefix, which a rename makes visible in `/mcp` as a changed server name
