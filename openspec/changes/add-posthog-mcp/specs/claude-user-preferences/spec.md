# Delta: claude-user-preferences

## ADDED Requirements

### Requirement: PostHog MCP writes are gated by a PreToolUse hook

`permissions.defaultMode` is `auto`, so a tool that matches no allow, ask, or deny rule is reviewed by the safety classifier rather than confirmed by the user. Neither `permissions.allow` nor `permissions.ask` can separate PostHog reads from PostHog writes: the MCP runs in CLI mode, exposing all of its tools through a single `exec` tool whose operation travels in the `command` argument, and Claude Code permission rules match tool names only — `mcp__server__tool(pattern)` is not valid syntax. A `PreToolUse` hook is therefore the only mechanism that can distinguish the two.

`dot_local/bin/executable_posthog-mcp-gate` SHALL deploy to `~/.local/bin/posthog-mcp-gate`, and `dot_claude/settings.json.tmpl` SHALL register it as a `PreToolUse` hook with matcher `^mcp__.*posthog.*__exec$`.

The gate SHALL be fail-closed. It SHALL return `permissionDecision: "prompt"` for every call except:

- the metadata verbs `tools`, `search`, `info`, `schema` and `learn`, which describe tools without running them; and
- `call` naming a tool that matches the read-only patterns `list-*`, `get-*`, `search-*`, `query-*`, `*-get`, `*-get-all`, `*-list`, `*-search`, `*-retrieve`, `*-count`, `*-definition`.

Unparseable input, an absent `jq`, an unrecognised verb, and any tool name outside those patterns SHALL prompt. Passing the gate is not an approval: those calls continue through the normal permission flow and are still seen by the classifier.

#### Scenario: Write call prompts the user

- **WHEN** Claude Code calls the PostHog `exec` tool with `command` set to `call create-feature-flag {...}`
- **THEN** the hook SHALL emit `permissionDecision: "prompt"`
- **AND** the user SHALL be asked to confirm before the flag is created

#### Scenario: Read call is not forced to prompt

- **WHEN** Claude Code calls the PostHog `exec` tool with `command` set to `call feature-flag-get-all {}`
- **THEN** the hook SHALL exit 0 without emitting a permission decision
- **AND** the call SHALL proceed through the normal permission flow

#### Scenario: Unknown tool name errs toward prompting

- **WHEN** the `command` names a tool that matches none of the read-only patterns, including a tool added to the PostHog MCP after this change
- **THEN** the hook SHALL emit `permissionDecision: "prompt"`

#### Scenario: Gate cannot be bypassed by a malformed command

- **WHEN** the hook receives input it cannot parse, a `call` with no tool name, or a verb it does not recognise
- **THEN** the hook SHALL emit `permissionDecision: "prompt"`

#### Scenario: No PostHog entry is added to the allow list

- **WHEN** reading `permissions.allow` in `dot_claude/settings.json.tmpl`
- **THEN** it SHALL contain no `mcp__plugin_posthog_posthog__*` entry
- **AND** the write gate SHALL rest on the hook rather than on a permission rule
