## Why

The JetBrains MCP entry in Claude Code and Junie points at `http://localhost:64342/sse`. That is IntelliJ IDEA's default port, not WebStorm's, so it has never connected — every session reports `jetbrains: SSE error: Unable to connect`. WebStorm's bundled MCP Server serves `64542`, and two of the four managed agents have no entry at all.

Nothing about the entry is managed today: both existing entries were hand-added and drift freely.

## What Changes

- Repoint the JetBrains MCP entry from `http://localhost:64342/sse` to `http://localhost:64542/stream` in Claude Code and Junie.
- Add the same entry to Codex and OpenCode, which have none.
- Bring all four entries under chezmoi/installer management, reusing the existing Streamable HTTP machinery — `MCP_HTTP_SERVERS`, `CODEX_HTTP_MCP_SERVERS`, `opencode.jsonc`, `modify_mcp.json.tmpl` — so no new transport code is added.
- Record the port's derivation (`64342 + per-product offset`, WebStorm `+200`) so the value is auditable rather than magic.
- Add a `JetBrains MCP` row to `.agents/skills/sync-agent-config/parity.md`.

Not breaking: the two live entries are already non-functional.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `mcp-global-config`: adds a JetBrains IDE MCP server as a managed user-scope entry across Claude Code, Codex, OpenCode, and Junie, and documents that it is a local IDE-lifetime service rather than a remote one.

## Impact

- `run_onchange_install-packages.sh.tmpl` — one entry in `MCP_HTTP_SERVERS`, one in `CODEX_HTTP_MCP_SERVERS`, plus a manual-instructions line.
- `dot_config/opencode/opencode.jsonc` — new `mcp.jetbrains` remote entry.
- `dot_junie/mcp/modify_mcp.json.tmpl` — the merge script gains a third managed key and must overwrite the drifted hand-added `sse` entry.
- `.agents/skills/sync-agent-config/parity.md` — new capability row.
- `openspec/specs/mcp-global-config/spec.md` — server count and new requirements.
- Out of scope: WebStorm's own settings. The IDE is not managed by chezmoi; enabling Settings → Tools → MCP Server is a manual, already-completed step, documented only as a prerequisite.
