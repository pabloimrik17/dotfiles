## 1. Claude Code

- [x] 1.1 Add `"jetbrains:http://localhost:64542/stream"` to `MCP_HTTP_SERVERS` in `run_onchange_install-packages.sh.tmpl`; verify `name`/`url` split correctly by confirming the pre-scan reports `jetbrains` as outdated (not new) while the stale `64342` entry is still registered
- [x] 1.2 Run `chezmoi apply` and confirm the group; verify `claude mcp get jetbrains` reports transport `http` at `http://localhost:64542/stream` and that only one `jetbrains` key exists under `.mcpServers` in `~/.claude.json`

## 2. Codex

- [x] 2.1 Add `"jetbrains:http://localhost:64542/stream"` to `CODEX_HTTP_MCP_SERVERS`; verify no change is needed in `reconcile_codex_http_mcp`, since it already asserts `transport.type == "streamable_http"`
- [x] 2.2 Run `chezmoi apply` and confirm the group; verify `codex mcp get jetbrains --json` reports a `streamable_http` transport at the managed URL

## 3. OpenCode

- [x] 3.1 Add an `mcp.jetbrains` entry to `dot_config/opencode/opencode.jsonc` with `"type": "remote"`, the managed URL, and `"enabled": true`, matching the formatting of the neighbouring `deepwiki`/`linear` entries
- [x] 3.2 Run `chezmoi apply`; verify `~/.config/opencode/opencode.jsonc` parses and that `model`, `tui`, `plugin`, `formatter`, `permission`, and the four pre-existing `mcp` entries are byte-identical to before

## 4. Junie

- [x] 4.1 Add a `JETBRAINS` constant and its merge branch to the Python block in `dot_junie/mcp/modify_mcp.json.tmpl`, following the existing `DEEPWIKI`/`LINEAR` shape — a bare `{"url": …}` object with no `type` key
- [x] 4.2 Verify the merge replaces the whole object rather than just the URL: pipe a live file containing `{"jetbrains": {"type": "sse", "url": "http://localhost:64342/sse"}}` through the script and confirm the output entry has no `type` key
- [x] 4.3 Verify the merge preserves unrelated state: pipe a live file carrying an unknown top-level key and an unmanaged server through the script and confirm both survive unchanged
- [x] 4.4 Run `chezmoi apply`; verify `~/.junie/mcp/mcp.json` has `mcpServers.jetbrains.url` at the managed URL and that `deepwiki` and `linear` are unchanged

## 5. Documentation

- [x] 5.1 Add a manual-instructions line next to the Storybook one (`run_onchange_install-packages.sh.tmpl:1844`) noting that `jetbrains` MCP requires Settings → Tools → MCP Server enabled and the IDE running; verify it prints during apply
- [x] 5.2 Add a `JetBrains MCP` row to `.agents/skills/sync-agent-config/parity.md` covering all four agents, recording the `64342 + per-product offset` derivation and that IDE-side enablement is unmanaged
- [x] 5.3 Check whether `docs/manual.html` documents the MCP server roster; if it does, update it via the `docs:manual` skill, otherwise record that no update was needed

## 6. Verification

- [x] 6.1 Run `openspec validate update-jetbrains-mcp-port --strict` and confirm it passes
- [x] 6.2 With WebStorm running, verify all four agents resolve the server: `initialize` against `http://localhost:64542/stream` returns `serverInfo.name == "WebStorm MCP Server"`, and each agent lists `jetbrains` as connected
- [x] 6.3 With WebStorm closed, verify each agent reports `jetbrains` as failed to connect and that every other MCP server still connects
- [x] 6.4 Verify no managed surface references the old endpoint: `grep -rn "64342\|/sse" run_onchange_install-packages.sh.tmpl dot_config/opencode/opencode.jsonc dot_junie/mcp/modify_mcp.json.tmpl` returns no `jetbrains`-related hit
- [x] 6.5 Verify the commit passes lint-staged without oxfmt corrupting `dot_junie/mcp/modify_mcp.json.tmpl`; if it is rewritten, add it to `.oxfmtignore` alongside the existing chezmoi script entries
