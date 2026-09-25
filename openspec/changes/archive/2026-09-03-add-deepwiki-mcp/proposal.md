## Why

Context7 is effective for published library APIs, but it does not answer many questions about the internal architecture of an unfamiliar open-source repository. DeepWiki's free, unauthenticated remote MCP adds repository-level wiki navigation and grounded Q&A without cloning the repository; a direct trial against `aleclarson/vite-tsconfig-paths` showed useful internal-flow detail, while also exposing constraints that must be documented and tested before treating it as authoritative.

## What Changes

- Add the DeepWiki Streamable HTTP endpoint (`https://mcp.deepwiki.com/mcp`) as a permanent user-scope MCP server in Claude Code, Codex, OpenCode, and Junie. Do not use the deprecated `/sse` endpoint.
- Register Claude Code through the existing `MCP_HTTP_SERVERS` install-script flow; register Codex idempotently through its official `codex mcp` CLI so chezmoi does not overwrite runtime-owned `~/.codex/config.toml`; add native remote entries to the managed OpenCode and Junie user configs.
- Allow DeepWiki's three public, read-only Claude Code tools (`read_wiki_structure`, `read_wiki_contents`, and `ask_question`) without prompting.
- Add a four-client parity-table row and update the README/manual so the ownership and configuration surface for each client are explicit.
- Record a repeatable comparison using the same `vite-tsconfig-paths` internals question in DeepWiki and Context7, followed by direct-source verification with `gh_grep`/WebFetch. Capture response size, latency, source traceability, factual coverage, and correctness; use the result to document routing guidance rather than silently treating the services as interchangeable.
- Document the operating boundaries: public GitHub repositories only; a repository must already be indexed (an MCP miss directs the user to visit its DeepWiki URL to start indexing); queries use provider-indexed content whose freshness and source revision are not guaranteed, and cannot select a tag, branch, or commit; exact or version-sensitive claims still require direct-source verification.
- Classify DeepWiki as a provider-managed remote service: there is no local package, version pin, Renovate entry, secret, or `update-extra` step.

Out of scope: the authenticated Devin MCP at `https://mcp.devin.ai/mcp`, private Nazaries repositories, project-local MCP files, and any automatic cloning or indexing workflow.

## Capabilities

### New Capabilities

None. The change extends existing global MCP and Claude Code permission behavior.

### Modified Capabilities

- `mcp-global-config`: adds DeepWiki to Claude Code and establishes equivalent user-scope registrations for Codex, OpenCode, and Junie, with idempotent setup and documented public/indexed-repository constraints.
- `claude-user-preferences`: adds the three read-only `mcp__deepwiki__...` tools to the managed Claude Code allowlist.

## Impact

- **Configuration**: `run_onchange_install-packages.sh.tmpl`, `dot_config/opencode/opencode.jsonc`, and `dot_junie/mcp/modify_mcp.json.tmpl`; Codex remains CLI-managed rather than gaining a chezmoi-owned `dot_codex/config.toml`.
- **Permissions**: `dot_claude/modify_settings.json.tmpl` gains three exact read-only tool rules; no wildcard and no write-capable tool are introduced.
- **Repo tooling and docs**: `.agents/skills/sync-agent-config/parity.md`, `README.md`, and `docs/manual.html` gain the four-client mapping, usage guidance, and limitations.
- **Install/runtime**: the Claude and Codex registration loops gain one remote endpoint each. OpenCode and Junie load the equivalent managed entries. No authentication, package installation, or secret storage is required.
- **Context/token cost**: every client gains three tool schemas plus server instructions. The implementation records a benchmark and positions DeepWiki for indexed public-repository architecture questions, Context7 for published API docs, and `gh_grep`/WebFetch for exact source and revision-sensitive verification.
- **Known service behavior verified on 2026-08-31**: `aleclarson/vite-tsconfig-paths` returned a populated wiki and a detailed architecture answer; `etherless/dotfiles` returned `Repository not found` and instructed the caller to visit `https://deepwiki.com/etherless/dotfiles` to index it. The server reported version `2.14.3` and exposed only the documented three tools in public mode.
