## Context

See proposal.md — Why. What shapes the approach here:

- `run_onchange_install-packages.sh.tmpl:838-968` (Group 8) owns Claude Code plugins: `CC_MARKETPLACES` (11 entries) and `CC_PLUGINS` (26), a pre-scan over `claude plugin marketplace list --json` / `claude plugin list --json`, the `marketplace_installed` / `plugin_installed` guards, and `run_claude_step` for the actual CLI calls.
- `run_onchange_install-packages.sh.tmpl:992-1115` (Group 8.5) owns global MCP servers: `MCP_STDIO_SERVERS` (8) and `MCP_HTTP_SERVERS` (6), registered with `claude mcp add --scope user` into `~/.claude.json`, pre-scanned with `jq` over `.mcpServers`.
- `dot_config/opencode/opencode.jsonc:18-24` holds OpenCode's user-scope `mcp` block, currently a single `expect` server of type `local`.
- `dot_claude/settings.json.tmpl` carries `enabledPlugins` (`:8-39`), `extraKnownMarketplaces` (`:43-123`) and `permissions.allow` (`:231-298`), where MCP rules live at `:287-297`.
- `renovate.json:45-87` has custom managers that only match `<pkg>@<version>` pins in `opencode.json`, `.mcp.json`, CI workflows, and — via a leading-colon pattern — the install script's MCP arrays.
- The change `add-fallow` is open (14/17 tasks) and already carries a `MODIFIED` delta on `mcp-global-config`'s *"Global MCP servers are registered via Claude CLI in install script"* requirement, moving it from 13 to 14 servers.

Upstream: `getsentry/sentry-mcp` publishes a Claude Code marketplace named `sentry-mcp` containing a `sentry-mcp` plugin (hence `sentry-mcp@sentry-mcp`) and a bleeding-edge `sentry-mcp-experimental` variant. The plugin bundles a `.mcp.json` declaring a single `sentry` server of type `http` at `https://mcp.sentry.dev/mcp`, plus a `sentry-mcp` subagent whose front matter declares `mcpServers: [sentry]`.

## Goals / Non-Goals

**Goals:**

- Exactly one connection to `https://mcp.sentry.dev/mcp` per client, with the Sentry toolset kept out of the main Claude Code thread
- Reuse the existing install machinery — no new group, no new helper, no new guard
- Land in `mcp-global-config` without colliding with the delta `add-fallow` already holds there

**Non-Goals:**

- Deciding how Sentry data flows into any project's own instrumentation or SDK
- Supporting self-hosted Sentry
- Building an OpenCode equivalent of the subagent-based context isolation

## Decisions

### The plugin is the only source of the Sentry server in Claude Code

The obvious symmetric move would be to add `sentry:https://mcp.sentry.dev/mcp` to `MCP_HTTP_SERVERS` next to `linear`, `notion` and `figma`, and install the plugin on top for the subagent. That is wrong here, because the plugin is not a thin skill wrapper: it ships its own server definition.

Claude Code loads plugin-bundled `.mcp.json` servers namespaced — the server appears as `plugin:sentry-mcp:sentry` and its tools as `mcp__plugin_sentry-mcp_sentry__<tool>`. A user-scope `sentry` registered by the install script is a *different* server object pointing at the *same* endpoint. The result is two live HTTP sessions, two OAuth grants to keep alive, and two complete copies of the Sentry tool schemas in every context window — for identical functionality.

Removing the plugin instead and keeping only the global registration would fix the duplication, but the subagent is the main reason to want this at all: it declares `mcpServers: [sentry]` and resolves that name from the plugin's own bundle, so it cannot be driven by a user-scope server. Dropping the plugin means dropping the context isolation.

So: plugin only. The negative constraint is written into `mcp-global-config` as a requirement with a scenario asserting `.mcpServers.sentry` is absent from `~/.claude.json`, so a future "let's be consistent with the other HTTP servers" edit fails review instead of silently reintroducing the duplicate.

Alternatives: both, accepting the duplicate (rejected — pays double context for zero gain, and the only upside is cosmetic presence in `claude mcp list --scope user`); global registration only, no plugin (rejected — loses the subagent); plugin only but disabled by default (rejected — the whole point is zero manual steps after `chezmoi apply`).

### `mcp-global-config` gets `ADDED` requirements only

`add-fallow` is open and already rewrites *"Global MCP servers are registered via Claude CLI in install script"* — the requirement that enumerates the server table and its count. If this change also emitted a `MODIFIED` on it, the two deltas would race: whichever archives second would overwrite the other's version of the table, silently dropping either fallow's 14th server or Sentry's constraint text.

Both of this change's additions to that capability are genuinely new concerns rather than edits to existing behavior — the OpenCode entry mirrors the existing `expect` requirement rather than changing it, and "Sentry is not registered by the install script" is a new constraint — so `ADDED` is also the honest operation, not just the convenient one. The two changes can now archive in either order.

### OpenCode gets a plain `remote` entry, no auth configuration

OpenCode 1.18.11 uses the v1 config format (`mcp.<name>`). For `type: "remote"` it performs OAuth authorization-server discovery with PKCE and Dynamic Client Registration automatically, so `url` is the only other required field; `opencode mcp auth sentry` forces the flow on demand rather than waiting for first use.

Explicitly not set: `headers` (that path is for servers authenticated with a personal access token, which Sentry's hosted MCP does not need) and `oauth: false` (which would *disable* the flow we want). `enabled: true` is stated rather than left to the default so the entry matches the shape of the neighbouring `expect` server and so turning it off is a one-word edit.

OpenCode has no subagent equivalent, so its Sentry toolset does sit in the main context. That is the accepted trade-off for a second client; `enabled: false` is the escape hatch.

### Allowlist covers reads only

Allowed: `find_organizations`, `find_projects`, `get_sentry_resource`, `search_events`, `search_issues`, `search_sentry_tools`. All six are pure queries against the Sentry API.

Left on the default `ask`:

- `analyze_issue_with_seer` — starts a Seer run. It is a write in the sense that matters: it consumes account quota and can take minutes.
- `execute_sentry_tool` — a generic dispatcher. Its permission surface is whatever tool it is asked to dispatch, including assigning and resolving issues, so allowlisting it would allowlist everything by proxy.

This is the same read/write line the existing requirement already draws for `memory` (read/search/open allowed, create/delete not).

### No version pin, no Renovate entry

The plugin has no version coordinate we control: `extraKnownMarketplaces` carries `autoUpdate: true`, and the remote endpoint is unversioned. The custom managers in `renovate.json` match `<pkg>@<version>` npm pins — including one keyed on a leading colon for the install script's MCP arrays — and `"sentry-mcp@sentry-mcp"` is a marketplace-qualified plugin id, not an npm spec, so none of them apply. Nothing to add.

## Risks / Trade-offs

- Someone later adds `sentry` to `MCP_HTTP_SERVERS` "for consistency" → the `mcp-global-config` requirement states the prohibition with a scenario that checks `.mcpServers.sentry` is absent from `~/.claude.json`, so the regression is reviewable rather than invisible.
- Upstream renames the plugin's internal server, breaking the `mcp__plugin_sentry-mcp_sentry__…` rules → the rules fail safe: they stop matching, and the tools fall back to the default `ask`. No tool silently gains permission. A spec scenario pins this behavior.
- Sentry self-hosted is unreachable → `mcp.sentry.dev` serves `sentry.io` only. Recorded as a known limitation; the upstream repo's `stdio` transport is the escape route if it ever becomes necessary, and would be its own change.
- Sentry's toolset inflates OpenCode's context, which has no subagent to hide it → single remote server, one edit (`enabled: false`) to switch off.
- Marketplace/plugin drift between clients: Claude Code auto-updates the plugin, OpenCode always talks to whatever the endpoint currently serves → both track upstream automatically; there is no pinned state to drift.
- Inconsistent precedent inherited from elsewhere: `fallow@fallow-skills` sits in `enabledPlugins` while its marketplace is absent from `extraKnownMarketplaces`. This change follows the majority pattern and adds both entries. Fixing fallow's asymmetry belongs to `add-fallow`, not here.

## Migration Plan

Additive; nothing is removed or repointed.

1. `chezmoi apply` runs the install script, which registers the marketplace and installs the plugin through the existing Group 8 loops. Already-present entries are skipped by the pre-scan.
2. `chezmoi apply` writes `dot_claude/settings.json.tmpl` and `dot_config/opencode/opencode.jsonc`. The `enabledPlugins` entry is inert until the plugin is actually downloaded.
3. First use triggers OAuth: `/mcp` in Claude Code, `opencode mcp auth sentry` in OpenCode.

Rollback: remove the two array entries, the two settings entries, the six allow rules and the OpenCode block, then `claude plugin uninstall sentry-mcp@sentry-mcp`. Nothing else in the repo depends on any of them.
