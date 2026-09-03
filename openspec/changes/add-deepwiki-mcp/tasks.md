## 1. Evaluation Evidence

- [x] 1.1 Create `openspec/explorations/deepwiki-mcp-evaluation.md` with links to the official DeepWiki, Codex, OpenCode, and Junie MCP documentation plus the 2026-08-31 initialize/tools-list and indexed/unindexed probe observations; verify the report distinguishes documented guarantees from runtime observations and names only the `/mcp` endpoint.
- [x] 1.2 Run the exact `vite-tsconfig-paths` question from design.md through DeepWiki and Context7, record wall-clock latency, model-visible bytes/words, a consistently calculated token estimate, supported claims, citations, and omissions for both responses, and verify the report also measures DeepWiki's initialize instructions and three tool schemas as persistent context cost.
- [x] 1.3 Verify the comparison's claims against `gh_grep` and direct GitHub source retrieval, record exact supporting files plus any inaccuracies, and finish the report with the permanent/context7/deepwiki/direct-source routing decision; if a material privacy issue or systematic factual failure appears, stop and revise the OpenSpec artifacts before changing configuration.

## 2. Claude Code and Codex Registration

- [x] 2.1 Add `deepwiki:https://mcp.deepwiki.com/mcp` to `MCP_HTTP_SERVERS` in `run_onchange_install-packages.sh.tmpl`, preserving the existing pre-scan, URL-drift replacement, confirmation, and non-fatal registration flow; verify the rendered server total is 15 and no `/sse` or `mcp.devin.ai` DeepWiki entry exists.
- [x] 2.2 Add DeepWiki to a shared, idempotent `CODEX_HTTP_MCP_SERVERS` registration module in `run_onchange_install-packages.sh.tmpl` that uses JSON from the official `codex mcp` CLI, prompts before adding/replacing any declared HTTP entry, skips exact URL matches, and warns non-fatally when Codex, jq, parsing, removal, or addition fails; verify it never invokes `codex mcp login` or writes or introduces `dot_codex/config.toml`.
- [x] 2.3 Exercise the shared Codex module's no-Codex, no-jq, failed-query, malformed/duplicate data, missing-entry, matching-entry, non-HTTP entry, stale-URL, declined, removal-failure, persisted-after-failed-add, add-failure, and rollback paths with controlled stubs or an equivalent isolated harness; verify only missing/stale confirmed entries invoke `codex mcp add <name> --url <url>` and both DeepWiki and Linear use the same interface.

## 3. Managed Client Configuration and Permissions

- [x] 3.1 Add an enabled remote `deepwiki` entry with URL `https://mcp.deepwiki.com/mcp` to `dot_config/opencode/opencode.jsonc`; verify all existing top-level keys and MCP entries remain present and `bun run lint:oxfmt` accepts the file.
- [x] 3.2 Extend `dot_junie/mcp/modify_mcp.json.tmpl` to merge the user-scope `mcpServers.deepwiki.url` mapping alongside Linear, preserve unrelated valid state, add no headers or credentials, and verify the modifier is valid and idempotent.
- [x] 3.3 Add the three exact `mcp__deepwiki__read_wiki_structure`, `mcp__deepwiki__read_wiki_contents`, and `mcp__deepwiki__ask_question` rules to `permissions.allow` in `dot_claude/modify_settings.json.tmpl`; render the template and verify with `jq` that all three exist and no `mcp__deepwiki__*` wildcard exists.

## 4. Parity and Documentation

- [x] 4.1 Add a complete `DeepWiki MCP` row to `.agents/skills/sync-agent-config/parity.md` naming the Claude Code install-script registration, Codex runtime-owned CLI registration, OpenCode managed remote entry, and Junie managed JSON entry; verify all six cells are populated and the notes record public-only, pre-indexed, non-revision-specific behavior.
- [x] 4.2 Apply the `update-readme` skill's approved proposal: update the Claude Code global MCP count to 15, add the DeepWiki table row/link, and summarize four-client availability and routing limits; verify README does not claim private-repository, on-demand MCP indexing, authentication, or revision selection.
- [x] 4.3 Apply the `update-manual` skill's approved proposal across the Claude Code, OpenCode, Codex, and new Junie user-scope MCP documentation surfaces; verify each client names its real ownership/config path and all sections share the Context7 → DeepWiki → direct-source routing guidance.

## 5. Validation

- [x] 5.1 Render `run_onchange_install-packages.sh.tmpl` with `chezmoi execute-template`, run `bash -n` on the rendered output, and verify the Claude and Codex DeepWiki commands, exact endpoint, prompt/skip paths, and fallback instructions survive rendering.
- [x] 5.2 Run `bun run lint:oxfmt`, `git diff --check`, and source-level JSON checks for the rendered Claude settings and Junie config; verify `chezmoi diff --source .` targets `~/.claude.json` indirectly, `~/.config/opencode/opencode.jsonc`, and `~/.junie/mcp/mcp.json` without proposing a managed `~/.codex/config.toml`.
- [x] 5.3 Run `openspec validate add-deepwiki-mcp --strict` and inspect the final diff for secrets, `/sse`, `mcp.devin.ai`, local DeepWiki packages, Renovate pins, or `update-extra` steps; verify validation passes and each forbidden item is absent.
- [x] 5.4 Without mutating live user configuration, verify the installed client CLIs/config parsers accept the planned shapes (`claude mcp add --transport http`, `codex mcp add --url`, OpenCode remote v1 entry, Junie remote JSON), and record any live post-`chezmoi apply` smoke checks as handoff notes rather than marking them complete speculatively.

### Live handoff (intentionally not run during repository validation)

- After the next interactive `chezmoi apply`, confirm the Claude Code and Codex DeepWiki registration prompts.
- Run `claude mcp get deepwiki`, `codex mcp get deepwiki --json`, and `opencode mcp list`; in Junie, use `/mcp`. Confirm all four clients report `https://mcp.deepwiki.com/mcp` and expose the three public read-only tools.
- Exercise an indexed public repository and an unindexed public repository once. Confirm the indexed lookup succeeds and the missing lookup directs the user to `https://deepwiki.com/<owner>/<repo>` without indexing on demand.
