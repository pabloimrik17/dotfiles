## Context

See proposal.md — Why. The facts below were established by inspecting the bundled plugin and probing the live server; they are what the decisions rest on.

**Port derivation.** `com.intellij.mcpServer` v262.9437.214 (bundled with WebStorm 2026.2.1) computes `DEFAULT_MCP_PORT = 64342 + portOffset()`, where the offset switches on the product code:

| Product | offset | port | | Product | offset | port |
| --- | ---: | --- | --- | --- | ---: | --- |
| idea | 0 | 64342 | | PyCharm | 120 | 64462 |
| CLion | 20 | 64362 | | Rider | 140 | 64482 |
| DataGrip | 60 | 64402 | | RubyMine | 160 | 64502 |
| GoLand | 80 | 64422 | | RustRover | 180 | 64522 |
| PhpStorm | 100 | 64442 | | **WebStorm** | **200** | **64542** |

The stale `64342` is IDEA's default — the value published in most JetBrains MCP walkthroughs, which is likely how it was copied in. Verified live: WebStorm listens on `64542`, and `initialize` there returns `{"serverInfo":{"name":"WebStorm MCP Server","version":"2026.2.1"}}` at protocol `2025-06-18`.

**Transports.** The plugin serves both `/sse` (legacy) and `/stream` (Streamable HTTP); both return 200 and `/stream` completes a real handshake, returning an `mcp-session-id`.

**Existing machinery.** All four agents already have a Streamable HTTP path: `MCP_HTTP_SERVERS` → `claude mcp add --transport http`; `CODEX_HTTP_MCP_SERVERS` → `reconcile_codex_http_mcp`; `opencode.jsonc` `type: "remote"`; and `modify_mcp.json.tmpl`, whose managed entries are bare `{"url": …}` objects. None of them has an SSE path.

## Goals / Non-Goals

**Goals:**

- One URL, one transport, four agents — no per-agent special case.
- Add zero new registration machinery; the entry rides the existing Streamable HTTP paths.
- Leave the port auditable: a reader should be able to re-derive `64542` without decompiling anything.

**Non-Goals:**

- Managing the JetBrains IDE. Its settings, `.vmoptions`, and MCP enablement stay outside chezmoi.
- Multi-IDE support. The offset table is recorded for provenance, not to make the entry portable across JetBrains products.
- Suppressing the connection error when WebStorm is closed. That is correct behavior for a local service.

## Decisions

**Use `/stream`, not `/sse`.** SSE is the deprecated MCP transport, and every managed agent's existing path is Streamable HTTP — Codex's reconciler in fact asserts `transport.type == "streamable_http"` and refuses to touch anything else. Choosing `/stream` means the entry is four array/config lines with no new code. Choosing `/sse` would mean a new `MCP_SSE_SERVERS` array plus a `--transport sse` branch for Claude Code, a second entry shape in Junie, and an entry Codex's reconciler would decline to manage. *Alternative considered:* preserve the current `sse` shape to minimize the diff. Rejected — the current shape has never worked, so there is no working behavior to preserve.

**Hardcode `64542` rather than forcing a port.** The plugin honors `-Didea.mcp.server.force.port`, which would let one value serve every JetBrains IDE. That requires a managed `.vmoptions` file — precisely the IDE-side state this repo does not own — and introduces a port clash when two IDEs run at once. The per-product default has neither problem. *Trade-off:* the value is WebStorm-specific. Accepted: the offset table above makes the derivation explicit, so adapting it later is a lookup, not a re-investigation.

**Dotfiles own the agent entries; the IDE owns nothing.** The plugin ships `McpClient.autoConfigure` with clients for Claude Code, Codex, and Junie — it can write these files itself. Letting it do so would split ownership three ways, leave the entries as unmanaged runtime state, and still not cover OpenCode, for which the plugin has no client. Managing all four keeps parity with how `deepwiki` and `linear` are already handled.

**Junie's entry drops the `type` key.** The hand-added entry is `{"type": "sse", "url": …}`; the managed `deepwiki` and `linear` entries are bare `{"url": …}`. The merge script must replace the whole object, not just the URL, or a stale `"type": "sse"` will survive next to a `/stream` URL.

## Risks / Trade-offs

- **IDE auto-configure overwrites a managed entry** → The plugin's settings screen offers per-client "configure" actions for Claude Code, Codex, and Junie. Nothing runs them unattended, so the realistic failure is the user clicking one and reintroducing an `/sse` entry. The next `chezmoi apply` reconciles it back; the spec's drift scenario covers the outcome.
- **A second JetBrains IDE would bind a different port** → Out of scope by decision above. Symptom is a connection failure, not silent misrouting, since no other product's default collides with `64542`.
- **Port is occupied by an unrelated process** → The plugin falls back rather than binding, so requests still reach the squatter: the agent gets an unexpected protocol response from an unintended local service, not a connection failure. Diagnosis: `lsof -iTCP:64542 -sTCP:LISTEN`.
- **`storybook` precedent** → A second `localhost` entry that fails when its process is down. Already-accepted behavior; the spec states it explicitly so it is not re-diagnosed later.
- **Junie merge regression** → `modify_mcp.json.tmpl` gains a third key. Its existing failure mode is deliberate and loud (non-zero exit, target untouched), so a malformed merge cannot land silently.

## Migration Plan

1. Edit the four config surfaces and the parity row.
2. `chezmoi apply` — reconciles Claude Code, Codex, and Junie; deploys OpenCode.
3. Verify each agent resolves the entry with WebStorm running.
4. Rollback: revert the commit and re-apply. No state outside the four config files is touched, and the pre-change state was non-functional, so rollback cannot lose working behavior.

## Open Questions

None. Port, transport, ownership, and scope were each settled against the running server rather than deferred.
