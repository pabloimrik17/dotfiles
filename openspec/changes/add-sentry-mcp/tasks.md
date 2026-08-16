## 1. Claude Code plugin

- [x] 1.1 Add `"getsentry/sentry-mcp"` to the `CC_MARKETPLACES` array in `run_onchange_install-packages.sh.tmpl` (array at `:838-850`, after `"fallow-rs/fallow-skills"`). Do not touch the loop or the guards — the existing `marketplace_installed` pre-scan and `run_claude_step "marketplace $repo" claude plugin marketplace add "$repo"` already cover the new entry.
- [x] 1.2 Add `"sentry-mcp@sentry-mcp"` to the `CC_PLUGINS` array in the same file (array at `:852-879`, after `"fallow@fallow-skills"`). Same reasoning: the `plugin_installed` guard and `run_claude_step "plugin $plugin" claude plugin install "$plugin"` loop are unchanged.
- [x] 1.3 Confirm no counter or prompt text needs editing: the group's `TOTAL_MP` / `TOTAL_PL` are computed from `${#CC_MARKETPLACES[@]}` / `${#CC_PLUGINS[@]}` and the `confirm` prompt interpolates the pending counts, so both follow automatically (11 → 12 marketplaces, 26 → 27 plugins).
- [x] 1.4 Add `"sentry-mcp@sentry-mcp": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl` (object at `:8-39`), in alphabetical position between `"plugin-dev@claude-plugins-official"` and `"skill-creator@claude-plugins-official"`.
- [x] 1.5 Add the `sentry-mcp` block to `extraKnownMarketplaces` in the same file (object at `:43-123`), in alphabetical position between `plannotator` and `superpowers-marketplace`, with `"autoUpdate": true` and `"source": { "repo": "getsentry/sentry-mcp", "source": "github" }` — matching the shape of the neighbouring entries.
- [x] 1.6 Verify the negative constraint: `MCP_STDIO_SERVERS` (`:992-1003`) and `MCP_HTTP_SERVERS` (`:1005-1012`) stay untouched, and no `sentry` entry is added to either. See design.md — "The plugin is the only source of the Sentry server in Claude Code".

## 2. OpenCode

- [x] 2.1 Add a `sentry` entry to the `mcp` object in `dot_config/opencode/opencode.jsonc` (block at `:18-24`, next to `expect`), with `"type": "remote"`, `"url": "https://mcp.sentry.dev/mcp"` and `"enabled": true`. Keep the file's 4-space indentation and trailing commas.
- [x] 2.2 Do not add `headers` or `oauth` keys — OpenCode performs OAuth discovery with PKCE and DCR automatically for remote servers (design.md — "OpenCode gets a plain `remote` entry").
- [x] 2.3 Leave the repo-level `opencode.json` and `.mcp.json` unchanged; this is a user-scope tool, not a dotfiles-repo tool.

## 3. Permissions

- [x] 3.1 Append the six read-only Sentry rules to `permissions.allow` in `dot_claude/settings.json.tmpl` (array at `:231-298`, MCP rules grouped at `:287-297`): `mcp__plugin_sentry-mcp_sentry__find_organizations`, `…__find_projects`, `…__get_sentry_resource`, `…__search_events`, `…__search_issues`, `…__search_sentry_tools`.
- [x] 3.2 Confirm `analyze_issue_with_seer` and `execute_sentry_tool` are **not** allowlisted, and add both to a `permissions.ask` array in the same object (new key, alphabetically between `allow` and `defaultMode`). Absence from `allow` is not enough: `defaultMode` is `auto`, so an unmatched tool goes to the safety classifier without prompting (design.md — "Allowlist covers reads only").
- [x] 3.3 Confirm the rules use the plugin-namespaced prefix (`mcp__plugin_sentry-mcp_sentry__`) and not the bare `mcp__sentry__` form, which would never match since the server is plugin-provided.

## 4. Documentation

- [x] 4.1 `README.md` "MCP Servers" section (`:61-80`): add a `sentry` row to the table with transport `http`, a description covering issues/traces/Seer, and an auth cell noting OAuth on first use.
- [x] 4.2 In the same section, amend the intro sentence — it currently reads "The install script registers 14 global MCP servers to `~/.claude.json`" and the table holds exactly those 14. Sentry is **not** one of them, so the sentence must state that Sentry is provided by the `sentry-mcp@sentry-mcp` Claude Code plugin (and by OpenCode's own `remote` entry) rather than by `claude mcp add`, leaving the count of install-script servers untouched.
- [x] 4.3 `docs/manual.html` Claude Code section, "MCP servers" table (`<h3>` at `:2447`): add a `sentry` row with the same plugin-provided note.
- [x] 4.4 `docs/manual.html` OpenCode section: add a `sentry` row under a new "MCP servers (OpenCode only)" table placed after the existing "MCP servers (shared with Claude Code)" one, noting it is configured as a `remote` server in the user config and authenticated with `opencode mcp auth sentry`. It does not belong in the shared table — Claude Code gets Sentry from the plugin, so the two clients hold separate configurations.
- [x] 4.5 `run_onchange_install-packages.sh.tmpl` "Manual Installation Required" block (`:1168-1184`): add a Sentry line next to the existing Atlassian/Figma/Linear/Notion OAuth lines, pointing at `/mcp` inside Claude Code rather than `claude mcp get` (there is no user-scope entry to get).
- [x] 4.6 `run_onchange_install-packages.sh.tmpl` non-macOS fallback, "Claude Code plugins" section (`:1223-1226`): add `claude plugin marketplace add getsentry/sentry-mcp && claude plugin install sentry-mcp@sentry-mcp`.
- [x] 4.7 Run the `docs:readme` and `docs:manual` skills so both documents keep their generated structure and styling instead of being hand-patched.

## 5. Verification

- [x] 5.1 `chezmoi diff --source <worktree>` shows only the intended edits in `dot_claude/settings.json.tmpl` and `dot_config/opencode/opencode.jsonc`.
- [x] 5.2 Render the install script template and syntax-check it: `chezmoi execute-template < run_onchange_install-packages.sh.tmpl > /tmp/install.sh && bash -n /tmp/install.sh`.
- [x] 5.3 Validate the rendered settings JSON parses: `chezmoi cat ~/.claude/settings.json | jq empty`, and confirm the alphabetical ordering of the two new keys.
- [ ] 5.4 Run `chezmoi apply`, answer yes to the Claude Code plugin dependencies group, then confirm `claude plugin marketplace list` shows `sentry-mcp` and `claude plugin list` shows `sentry-mcp@sentry-mcp`.
- [x] 5.5 `claude mcp list --scope user` — Sentry MUST NOT appear; also check `jq '.mcpServers.sentry' ~/.claude.json` yields `null`.
- [ ] 5.6 Inside a Claude Code session, `/mcp` lists exactly one Sentry server, `plugin:sentry-mcp:sentry`; complete the OAuth sign-in from there and confirm the `sentry-mcp` subagent is available.
- [ ] 5.7 Spot-check permissions: a `search_issues` call runs without a prompt, and an `execute_sentry_tool` call prompts.
- [ ] 5.8 `opencode mcp auth sentry` completes the OAuth flow, and the Sentry tools appear in an OpenCode session.
- [ ] 5.9 Re-run the install script and confirm idempotency: the marketplace and plugin report "already registered/installed, skipping".
- [x] 5.10 `openspec validate add-sentry-mcp --strict` passes, and `openspec show add-sentry-mcp --json --deltas-only` lists `claude-code-plugins` (ADDED), `mcp-global-config` (ADDED) and `claude-user-preferences` (MODIFIED).
