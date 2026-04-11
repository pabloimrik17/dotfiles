## Context

MCP servers were added to `dot_claude/settings.json.tmpl` in PR #85 assuming Claude Code reads `mcpServers` from `~/.claude/settings.json`. It doesn't — user-level MCP config lives in `~/.claude.json`, managed exclusively via `claude mcp add --scope user`. The servers were never loaded.

The install script (`run_onchange_install-packages.sh.tmpl`) already has a Group 8 that registers Claude Code plugins via `claude plugin marketplace add` and `claude plugin install`, using the `run_claude_step` wrapper to handle Bun's pseudo-TTY requirement. MCP registration follows the same pattern.

## Goals / Non-Goals

**Goals:**

- All 10 MCP servers are registered in `~/.claude.json` via the install script
- Registration is idempotent (safe to re-run)
- Follows the existing script patterns (pre-scan, confirm, `run_claude_step`)
- Dead config removed from `settings.json.tmpl`
- `mcp-global-config` spec updated to reflect reality

**Non-Goals:**

- Managing `~/.claude.json` via chezmoi (contains runtime state — counters, cache, companion version)
- Automating OAuth for atlassian/figma (requires interactive browser flow)
- Changing the OpenCode MCP config (separate concern, already working)

## Decisions

### Decision 1: Register MCPs via `claude mcp add` in the install script, not via chezmoi template

**Rationale**: `~/.claude.json` mixes MCP config with runtime state (numStartups, statsEvents, lastCompanionVersionSeen). Managing it with chezmoi would require partial JSON merging that's fragile and fights the tool. The CLI is the official interface and handles the file format.

**Alternative considered**: chezmoi `modify_` script with `jq` to merge only the `mcpServers` key. Rejected because it's brittle — if Claude Code changes the JSON structure, the merge breaks silently.

### Decision 2: Place MCP group between CC plugins (Group 8) and Agent skills (Group 9)

**Rationale**: MCP servers are part of the Claude Code ecosystem. They share the same `claude` CLI dependency as Group 8. Agent skills (Group 9) are a separate concern (skills.sh/npx). The ordering also means `claude` is already confirmed available from Group 8's guard.

### Decision 3: Use `claude mcp list --json` for pre-scan

**Rationale**: Consistent with Group 8's pattern of pre-scanning with `claude plugin list --json` and `claude plugin marketplace list --json`. Allows showing "X/Y installed" status and skipping already-registered servers.

### Decision 4: Separate stdio and http servers into two arrays

**Rationale**: stdio servers use `claude mcp add --scope user NAME -- COMMAND ARGS...` while http servers use `claude mcp add --scope user --transport http NAME URL`. Two arrays with different iteration logic is cleaner than encoding the type distinction into a single array format.

## Risks / Trade-offs

**[Risk] `claude` CLI not in PATH during first `chezmoi apply`** → The script already guards with `if command -v claude &>/dev/null` (Group 8 pattern). MCP registration is skipped with a warning, same as plugins. User installs Claude Code, re-runs `chezmoi apply`, and MCPs get registered.

**[Risk] `claude mcp add` fails silently for http servers** → Use `run_claude_step` which captures output and reports failures. Non-fatal — script continues.

**[Risk] atlassian/figma OAuth not completed** → Servers are registered but non-functional until user runs auth. Documented in manual instructions section at the end of the script.

**[Trade-off] MCPs not in version control** → `~/.claude.json` is not tracked by chezmoi. The server list is version-controlled in the install script itself (the source of truth), even though the deployed state isn't. This is the same pattern as brew packages — the install list is tracked, not `/usr/local/Cellar`.
