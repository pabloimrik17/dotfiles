# Add PostHog MCP (DOT-53)

## Why

[PostHog](https://posthog.com/) ships a hosted, free MCP endpoint at `https://mcp.posthog.com/mcp` that exposes the whole product surface to an agent: analytics/insights, feature flags, experiments, error tracking, session data and raw HogQL queries. Today none of that is reachable from the terminal — checking "which errors spiked this week" or "is this flag rolled out" means leaving the agent and opening the browser. Both agents used on this machine (Claude Code and OpenCode) can consume the endpoint; wiring it once at the machine level makes it available in every project without per-repo config.

Authentication is browser OAuth on first use, so there is no API key to store and nothing new for the age/chezmoi secret flow.

## What Changes

**Claude Code — via the official plugin only:**

- Add `posthog@claude-plugins-official` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl`. `CC_MARKETPLACES` is unchanged: `anthropics/claude-plugins-official` is already registered.
- Add `"posthog@claude-plugins-official": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl` (alphabetical position, between `plugin-dev@…` and `skill-creator@…`). `extraKnownMarketplaces` is unchanged for the same reason.
- The plugin bundles its own http MCP server (`https://mcp.posthog.com/mcp`, header `x-posthog-mcp-consumer: plugin`), surfacing as `plugin:posthog:posthog`. Its other surface, verified at the marketplace-pinned sha (`13dd2e2`): ~140 PostHog product skills, an `error-analyzer` agent, three `/posthog:llma-cc-*` commands, and two hooks — a SessionEnd LLMA uploader (no-op unless `POSTHOG_LLMA_CC_ENABLED` and `POSTHOG_API_KEY` are set) and a PreToolUse gate that re-prompts on sensitive `exec` write calls.

**Explicitly not added to `MCP_HTTP_SERVERS`.** Registering `posthog` user-scope *on top of* the plugin would connect the same server twice in every Claude Code session — the MCP exposes a single `exec` dispatcher tool, so the duplicate is `mcp__posthog__exec` **and** `mcp__plugin_posthog_posthog__exec` — and require two separate OAuth logins against the same account, for zero extra capability. The exclusion is written as a `SHALL NOT` requirement so a later change does not "fix" it back in.

**OpenCode — via a remote MCP entry:**

- Add a `posthog` entry to the `mcp` block of `dot_config/opencode/opencode.jsonc` with `type: remote`, `url: https://mcp.posthog.com/mcp`, `enabled: true` (OpenCode does not consume Claude Code plugins, so it needs its own registration).

**Manual steps and docs:**

- Add a PostHog line to the install script's "Manual Installation Required" section: OAuth via `/mcp` → `plugin:posthog:posthog` in Claude Code, `opencode mcp auth` in OpenCode.
- Update `README.md` and `docs/manual.html` via the `update-readme` / `update-manual` skills, marking the PostHog row as *plugin-provided* so the "N MCP servers registered by the install script" count stays accurate.

## Capabilities

### Modified Capabilities

- `claude-code-plugins`: new plugin entry in the install script's `CC_PLUGINS` array and in `enabledPlugins` — same shape as the existing `code-simplifier@claude-plugins-official` requirement, since the marketplace is already registered.
- `mcp-global-config`: owns "which MCP servers exist and where" — the new OpenCode remote entry, the explicit exclusion from the install-script registry, and the manual OAuth instruction. It already owns the OpenCode `mcp` block by delegation from `opencode-user-config`.

## Impact

- **Files** (touched by the implementation, not by this change): `run_onchange_install-packages.sh.tmpl`, `dot_claude/settings.json.tmpl`, `dot_config/opencode/opencode.jsonc`, `README.md`, `docs/manual.html`.
- **Dependencies**: none. No new npm package, no global binary — the endpoint is hosted and the plugin is fetched by the Claude CLI.
- **Renovate / update-extra**: nothing to add. There is no `pkg@version` to pin, and the plugin version is governed by the `claude-plugins-official` marketplace, already set to `autoUpdate: true`.
- **Permissions**: no `mcp__posthog__*` entry in `permissions.allow`. The PostHog MCP also writes (create/update feature flags and insights, resolve issues), and `claude-user-preferences` already requires write-capable MCP tools to stay on `ask` — which also mitigates the prompt-injection risk PostHog documents for analytics data entering agent context.
- **Non-goals**: PostHog LLM Analytics for Claude Code sessions (`POSTHOG_LLMA_CC_ENABLED` + a `phc_…` project key), the PostHog CLI, the VS Code extension, `@posthog/wizard`, and the separate `PostHog/skills` marketplace.
- **Known trade-off**: the Claude Code and OpenCode registrations are asymmetric (plugin vs. remote entry) instead of the usual "one array, both clients" pattern. Accepted — it is the only way to get the plugin's skills without a duplicate server registration.
- **Known trade-off**: enabling the plugin puts its ~140 skills in every session's skill listing — a per-session context cost. Accepted for now; the fallback is disabling the plugin and going MCP-entry-only (design D1's rejected alternative) if the noise outweighs the value.
