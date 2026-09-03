## Context

See proposal.md — Why. The existing MCP surfaces are deliberately asymmetric:

- Claude Code user MCPs are declared in `MCP_STDIO_SERVERS` / `MCP_HTTP_SERVERS` and registered by `run_onchange_install-packages.sh.tmpl` through `claude mcp add --scope user` into `~/.claude.json`.
- Codex is installed by the same script, but its `~/.codex` state is runtime-owned. The installed CLI exposes JSON-capable `codex mcp list/get` commands and `codex mcp add <name> --url <url>`; official OpenAI documentation confirms that Streamable HTTP entries live in `~/.codex/config.toml` and are shared by the Codex CLI, IDE extension, and ChatGPT desktop app on that host.
- OpenCode's user config is already fully managed at `dot_config/opencode/opencode.jsonc` and currently uses the v1 `mcp.<name>` shape.
- Junie supports a native user-scope `~/.junie/mcp/mcp.json` with remote entries under `mcpServers.<name>.url`; this repository merge-manages the Linear entry on that surface while preserving unrelated state.

The public DeepWiki endpoint is stateless Streamable HTTP and needs no credentials. An initialize/list-tools probe on 2026-08-31 reported server version `2.14.3` and exactly three public tools. A call for indexed `aleclarson/vite-tsconfig-paths` succeeded; a call for unindexed `etherless/dotfiles` returned `Repository not found` and directed the caller to visit its DeepWiki page. The service does not expose branch, tag, or commit parameters.

## Goals / Non-Goals

**Goals:**

- Keep one canonical server name and endpoint across four clients while respecting each client's ownership model.
- Make repeat applies idempotent and avoid replacing unrelated runtime configuration.
- Give agents clear routing rules for Context7, DeepWiki, and direct-source tools.
- Capture comparable evidence about persistent context cost and per-answer cost.

**Non-Goals:**

- Unify all existing MCP servers across all four clients in this change.
- Make DeepWiki authoritative for exact or historical source behavior.
- Automate DeepWiki indexing or configure the authenticated Devin MCP.
- Introduce a general TOML/JSON merge framework for agent configuration.

## Decisions

### Keep DeepWiki permanently enabled, with a narrow routing contract

DeepWiki remains enabled in all four clients. Its fixed surface is only three read-only tools, requires no authentication, and the direct trial produced useful implementation-level context that Context7's published-doc focus does not provide. The routing contract limits use to architecture and internal-flow exploration for an already-indexed public repository without treating its contents as default-branch or revision-specific evidence:

1. Use Context7 for documented APIs, configuration, and migration guides.
2. Use DeepWiki for structure, architecture, and cross-file implementation questions.
3. Verify exact paths, line-level claims, and version-sensitive conclusions with `gh_grep` or direct WebFetch.

The trial also showed that `ask_question` can name relevant functions without satisfying a request for exact file citations. That makes it a discovery aid, not the last evidentiary step.

Alternatives: load only on demand (rejected because enable/disable persistence differs across the clients and creates guaranteed parity drift); discard as redundant with Context7 (rejected because it loses repository-internals Q&A); configure it only in Claude Code (rejected by the four-client parity requirement).

### Use the same public endpoint and name everywhere

Every client uses the name `deepwiki` and `https://mcp.deepwiki.com/mcp`. No headers, environment variables, OAuth block, bearer token, or API key are added. The deprecated `/sse` endpoint is not retained as a fallback: transport failure should remain visible rather than silently selecting a retiring protocol.

The authenticated `https://mcp.devin.ai/mcp` service is a different product and cannot make this public entry useful for Nazaries repositories without adding an account and secret lifecycle, so it remains out of scope.

### Respect client-specific ownership instead of inventing a shared file

The parity proposal is:

- **Claude Code — proposed change.** Surface: `run_onchange_install-packages.sh.tmpl`, `MCP_HTTP_SERVERS`. Action: add `deepwiki:https://mcp.deepwiki.com/mcp`; the existing pre-scan, URL-drift replacement, confirmation, and non-fatal error handling apply.
- **Codex — proposed runtime-owned counterpart.** Surface: the official `codex mcp` CLI, driven by a new install-script group. Action: inspect JSON from `codex mcp get/list`, add with `codex mcp add deepwiki --url https://mcp.deepwiki.com/mcp`, and remove/re-add only on URL drift. Restore the previous HTTP entry if registration fails, and leave non-HTTP entries unchanged because the CLI provides no lossless replacement operation. Do not create `dot_codex/config.toml`.
- **OpenCode — proposed change.** Surface: `dot_config/opencode/opencode.jsonc`, `mcp.deepwiki`. Action: add `{ "type": "remote", "url": "https://mcp.deepwiki.com/mcp", "enabled": true }` alongside existing entries.
- **Junie — proposed change.** Surface: `dot_junie/mcp/modify_mcp.json.tmpl`, merge-managing `~/.junie/mcp/mcp.json`. Action: add `mcpServers.deepwiki.url` alongside the managed Linear entry while preserving unrelated servers and unknown top-level values.

The accompanying parity row records all four mappings and notes the public/indexed/revision limitations. The user's request to add DeepWiki to all four clients is the confirmation for this proposal; implementation still changes only repository source state, with live runtime mutation deferred until the next confirmed `chezmoi apply`.

Alternatives: manage `dot_codex/config.toml` directly (rejected because it would take ownership of unrelated model, policy, plugin, and session-adjacent settings); write the Codex entry indirectly through Junie's or Claude's config (unsupported); use project-local `.mcp.json` files (wrong scope).

### Keep permissions exact and read-only

Claude Code gets three exact allow rules rather than `mcp__deepwiki__*`. All current public tools are read-only. Exact names ensure a future upstream tool addition does not silently inherit permission. The other clients retain their existing tool-approval behavior; adding a broader permission model solely for DeepWiki would expand this change beyond parity of availability.

Alternatives: leave calls to Claude Code's default mode (rejected because these known read-only lookups would prompt or depend on the safety classifier); wildcard allow (rejected because the server instructions already mention many private-mode tools that are not exposed today and the public surface could grow).

### Benchmark model-visible content, not duplicated wire envelopes

Implementation writes `openspec/explorations/deepwiki-mcp-evaluation.md` with a reproducible comparison. It uses this same question against `aleclarson/vite-tsconfig-paths` in DeepWiki and Context7:

> How does the plugin determine which tsconfig applies to an imported file, and what changes between lazy and eager projectDiscovery? Cite the relevant source files.

Then it answers/verifies the same claims with `gh_grep` and direct source retrieval. For each path, record wall-clock latency, response bytes/words, a token estimate produced by the same method, claims supported, exact source references, and inaccuracies/omissions. Separately record the initialize instructions and tool-schema size, since that is the persistent context cost paid even when no tool is called. Count only the content delivered to the model; do not double-count the protocol's mirrored `content` and `structuredContent` fields unless a client demonstrably injects both.

The benchmark is confirmatory evidence for the chosen permanent configuration. If it uncovers a material privacy issue or systematic factual failure, implementation stops and the artifacts are revised rather than silently switching to an on-demand or discarded outcome.

### Treat the remote service as provider-managed for updates

Within the `classify-tool-updates` lifecycle taxonomy, DeepWiki follows the `self-updating` outcome: Cognition deploys the unversioned remote service and there is no local artifact to upgrade. More precisely it is provider-managed, so there is no `update-extra` step, Renovate pin, or package entry. Endpoint changes require an explicit future dotfiles change.

### Document the workflow in overview and per-client sections

The README MCP table gains a DeepWiki row and updates the global-server count. The manual gains the server in Claude Code, OpenCode, Codex, and a new Junie user-scope MCP subsection/section as appropriate to its existing structure. All locations share the same short routing guidance and link to the official DeepWiki documentation; detailed benchmark evidence stays in the exploration document.

## Risks / Trade-offs

- [Persistent context overhead from server instructions and three schemas] → measure it once in the evaluation report, keep the server's role narrow, and reconsider only through a follow-up change if real sessions show material pressure.
- [Generated answers can omit citations or mix indexed code with model knowledge] → treat DeepWiki as discovery and require direct-source verification for exact/version-sensitive claims.
- [Indexed content can lag the repository and cannot target revisions] → document the indexed-content freshness and no-revision-selection limitations, and route revision-sensitive questions to GitHub source tools.
- [An unindexed repository fails instead of indexing on demand] → surface the returned DeepWiki URL workflow; do not automate a browser visit or claim transparent indexing.
- [A private repository name sent to the public service leaks its existence even though content is inaccessible] → documentation says not to invoke DeepWiki for private/Nazaries repositories; no private endpoint or token is configured.
- [Remote service outage adds a failed connection at startup] → do not mark the Codex entry `required`; each client's failure remains isolated from other MCP servers.
- [Codex CLI output changes] → consume its documented JSON output with `jq`, fail the registration group non-fatally, and preserve existing runtime state when parsing fails.
- [Junie users edit the MCP JSON through its UI] → use the merge-preserving modifier established by the Linear change so `chezmoi apply` restores only the declared DeepWiki and Linear entries and preserves unrelated state.
- [OpenCode v2 uses a different MCP schema] → implement against the repository's installed/current v1 configuration and migrate all OpenCode entries together in a dedicated upgrade change.

## Migration Plan

1. Capture the comparison and protocol-size evidence in the exploration report; stop for artifact revision only if it contradicts the security or correctness assumptions above.
2. Add the Claude Code and Codex install-script registrations, including pre-scan, exact URL matching, confirmation, skip, and non-fatal failure paths.
3. Add the OpenCode entry, merge DeepWiki into Junie's managed MCP fragments, and add the exact Claude Code permission rules.
4. Add the complete DeepWiki mapping to `sync-agent-config/parity.md`.
5. Update README/manual using their repository skills and validate generated JSON/TOML/shell behavior without mutating live user state.
6. On the next interactive `chezmoi apply`, confirm the Claude Code and Codex MCP groups. Verify all four clients list `deepwiki` and expose exactly the three public tools.

Rollback: remove the Claude array entry, Codex group entry, OpenCode/Junie entries, permission rules, parity row, and documentation. On a machine already applied, run `claude mcp remove deepwiki -s user` and `codex mcp remove deepwiki`; OpenCode and Junie lose the entry on the next `chezmoi apply`. No credentials or local packages require cleanup.
