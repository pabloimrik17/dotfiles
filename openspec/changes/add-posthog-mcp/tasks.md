# Tasks: add-posthog-mcp

## 1. Global layer

- [x] 1.1 Add `posthog@claude-plugins-official` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl` (Group 8); leave `CC_MARKETPLACES` untouched — `anthropics/claude-plugins-official` is already registered
- [x] 1.2 Add `"posthog@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`, in alphabetical position between `plugin-dev@claude-plugins-official` and `skill-creator@claude-plugins-official`
- [x] 1.3 Add a `posthog` entry to the `mcp` block of `dot_config/opencode/opencode.jsonc`: `type: "remote"`, `url: "https://mcp.posthog.com/mcp"`, `enabled: true` — same shape as `gh_grep` in the project-level `opencode.json`
- [x] 1.4 Add a PostHog line to the "Manual Installation Required" section of the install script, matching the existing OAuth lines: `/mcp` → `plugin:posthog:posthog` in Claude Code, `opencode mcp auth` in OpenCode
- [x] 1.5 Confirm no `posthog` entry is added to `MCP_HTTP_SERVERS` or `MCP_STDIO_SERVERS`, and no `mcp__posthog__*` rule is added to `permissions.allow` (design D1 and D4)

## 2. Docs

- [x] 2.1 Update `README.md` via the `update-readme` skill — add a PostHog row to the MCP servers section marked *plugin-provided*, so the "N MCP servers registered by the install script" count stays accurate
- [x] 2.2 Update `docs/manual.html` via the `update-manual` skill — PostHog in both MCP tables (Claude Code as plugin-provided, OpenCode as a remote server), plus the OAuth note

## 3. Verification

- [ ] 3.1 Run `chezmoi apply` twice and confirm the second run is a no-op for the plugin install (pre-scan reports "already installed") and for the OpenCode config
- [ ] 3.2 Confirm `claude plugin list --json` contains `posthog@claude-plugins-official`, the `/posthog:llma-cc-setup`, `/posthog:llma-cc-status` and `/posthog:llma-cc-ingest` commands are registered, and the plugin's skills appear in the session skill listing
- [ ] 3.3 Complete the OAuth flow from Claude Code via `/mcp` on `plugin:posthog:posthog` and run one real read-only tool call (e.g. list feature flags)
- [ ] 3.4 Confirm `claude mcp list` shows no user-scoped `posthog` duplicate — PostHog must appear only under the plugin scope
- [ ] 3.5 Run `opencode mcp auth` for `posthog`, then make one real tool call from OpenCode; if the OAuth flow fails, fall back to `enabled: false` per design D2 and record it here
- [x] 3.6 Re-read `run_onchange_install-packages.sh.tmpl` and confirm the MCP arrays still contain no `posthog` entry and the registered-server count is unchanged
