## Why

Claude Code user settings (`dot_claude/settings.json.tmpl`) have zero permission rules — every new project starts from scratch, forcing repeated manual approvals. OpenCode's config (`dot_config/opencode/opencode.jsonc`) has a basic permission set but is missing deny rules for dangerous operations, build/test allows, and parity with common usage patterns. Both tools need a curated, unified permission baseline at the user level so safe operations flow uninterrupted, dangerous ones are blocked, and everything else asks.

## What Changes

- Add a `permissions` section to `dot_claude/settings.json.tmpl` with deny, allow, and ask rules
- Expand the `permission` section in `dot_config/opencode/opencode.jsonc` with deny rules, additional allows, and parity with Claude Code where the model supports it
- Both tools get the same logical permission set (deny dangerous ops, allow read-only + build/test + CLI tooling, ask for everything else)
- WebFetch domain allowlist added at user level for Claude Code (universal dev domains)
- MCP tool read-only allowlist added at user level for Claude Code

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `claude-user-preferences`: Adding a `permissions` block with deny/allow/ask rules, WebFetch domain allowlist, and MCP tool allowlist
- `opencode-user-config`: Expanding the `permission.bash` section with deny rules, additional allow commands (build/test, chezmoi, brew, pnpm), and ensuring parity with Claude Code's logical rule set

## Impact

- **Files modified**: `dot_claude/settings.json.tmpl`, `dot_config/opencode/opencode.jsonc`
- **User experience**: Fewer permission prompts for safe operations, hard blocks on dangerous commands, consistent behavior across both AI coding tools
- **No breaking changes**: Existing project-level overrides (`.claude/settings.local.json`, per-project `opencode.json`) continue to work — user-level is the lowest precedence layer
