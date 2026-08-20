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

MCP write tools (memory create/delete, playwright, chrome-devtools, and PostHog via `plugin:posthog:posthog`) SHALL NOT be in the allow list.

Omitting them does not produce a confirmation prompt. `permissions.defaultMode` is `auto`, so a tool matching no allow, ask, or deny rule is reviewed by Claude Code's safety classifier rather than confirmed by the user — there is no "default ask" to fall back to. Keeping write tools out of the pre-approved set is therefore the guarantee this requirement makes, and the only one: it withholds pre-approval, it does not add a prompt. That is the accepted posture for every write-capable MCP in this configuration. Forcing a prompt would take an explicit `permissions.ask` rule, or a `PreToolUse` hook where the server multiplexes reads and writes through one tool name. The PostHog plugin ships such a hook itself: it prompts on a curated write subset (feature-flag writes, deletes/destroys, experiment launch/ship-variant/reset, `survey-launch`, `workflows-enable`) and stays silent on routine create/update.

#### Scenario: context7 doc lookup runs without prompt

- **WHEN** Claude Code attempts to call `mcp__context7__query-docs`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: memory write is not pre-approved

- **WHEN** Claude Code attempts to call `mcp__memory__create_entities`
- **THEN** no allow rule SHALL match
- **AND** the tool call SHALL be routed to the safety classifier rather than executed under a pre-approval

#### Scenario: PostHog tools are not pre-approved

- **WHEN** Claude Code attempts a PostHog MCP call through `plugin:posthog:posthog` that the plugin's own `PreToolUse` gate does not prompt on
- **THEN** no allow rule SHALL match
- **AND** the tool call SHALL be routed to the safety classifier rather than executed under a pre-approval
