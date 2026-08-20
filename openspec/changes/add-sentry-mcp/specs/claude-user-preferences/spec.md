# Delta: claude-user-preferences

## MODIFIED Requirements

### Requirement: Default permission mode is auto

The managed key set SHALL include `"defaultMode": "auto"` inside the `permissions` object in `dot_claude/modify_settings.json.tmpl`. Because Claude Code (v2.1.142+) ignores `permissions.defaultMode: "auto"` set in project or local settings, this rule MUST live in the user-scope source, which materializes `~/.claude/settings.json`.

In auto mode, rules are still evaluated first, in the order deny → ask → allow. A matching `ask` rule forces a prompt even in auto mode, and even when a broader `allow` rule would otherwise match. Only actions that match no rule are routed to Claude Code's safety classifier, which runs without prompting the user.

#### Scenario: Template sets auto as the default permission mode

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** the `permissions` object in `~/.claude/settings.json` SHALL contain `"defaultMode": "auto"`

#### Scenario: New session starts in auto mode

- **WHEN** a Claude Code session starts on a supported model and API with no explicit `--permission-mode` override
- **THEN** the session SHALL begin in auto mode, executing rule-unmatched actions via the classifier without per-action prompts

#### Scenario: Ask rule forces a prompt in auto mode

- **WHEN** a session in auto mode attempts a tool call matched by a `permissions.ask` rule
- **THEN** the tool call SHALL prompt the user for confirmation instead of reaching the classifier
- **AND** the prompt SHALL occur even if a broader `permissions.allow` rule also matches

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

MCP write tools (memory create/delete, playwright, chrome-devtools) SHALL NOT be in the allow list. They are not in `permissions.ask` either, so under `defaultMode: "auto"` they match no rule and are routed to the safety classifier, which runs without prompting. Bringing that class under explicit `ask` rules is a separate change.

The Sentry tools that write or consume quota — `analyze_issue_with_seer` (starts a Seer run) and `execute_sentry_tool` (a generic dispatcher that can assign, resolve, or otherwise mutate Sentry state) — SHALL NOT be allowlisted, and SHALL additionally be listed in `permissions.ask`:

- `mcp__plugin_sentry-mcp_sentry__analyze_issue_with_seer`
- `mcp__plugin_sentry-mcp_sentry__execute_sentry_tool`

Explicit `ask` rules are required rather than sufficient by omission: `permissions.defaultMode` is `auto`, so a tool matched by no rule is routed to the safety classifier, which runs without prompting. Rules are evaluated deny → ask → allow, and a matching `ask` rule forces a prompt even in auto mode. These two rules therefore complete the coverage of the eight functional tools the plugin exposes — six allowed, two prompted. The OAuth pair the server surfaces while unauthenticated — `mcp__plugin_sentry-mcp_sentry__authenticate` and `mcp__plugin_sentry-mcp_sentry__complete_authentication` — matches no rule and does not need one.

#### Scenario: context7 doc lookup runs without prompt

- **WHEN** Claude Code attempts to call `mcp__context7__query-docs`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: memory write is routed to the classifier

- **WHEN** Claude Code attempts to call `mcp__memory__create_entities`
- **THEN** no deny, ask, or allow rule SHALL match
- **AND** in auto mode the tool call SHALL be routed to the safety classifier, which runs without prompting

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
