## Why

Sentry is the source of truth for production errors and performance on the projects this machine works on, but the agents have no access to it: today the loop is leave the editor, open `sentry.io`, copy a stack trace, paste it back. Sentry ships an official remote MCP server at `https://mcp.sentry.dev/mcp` that exposes issues, events, traces, spans and Seer root-cause analysis over HTTP with OAuth, plus an official Claude Code plugin (`sentry-mcp@sentry-mcp`) that bundles that server together with a `sentry-mcp` subagent, so the Sentry toolset stays out of the main thread's context.

Both Claude Code and OpenCode are installed and configured by these dotfiles, so a machine provisioned with `chezmoi apply` should get Sentry access in both clients with no manual step beyond the first OAuth sign-in.

## What Changes

- Register the `getsentry/sentry-mcp` marketplace in `CC_MARKETPLACES` and install `sentry-mcp@sentry-mcp` via `CC_PLUGINS`, inside the existing Claude Code plugin group of `run_onchange_install-packages.sh.tmpl` — reusing the group's pre-scan, the `marketplace_installed` / `plugin_installed` guards and `run_claude_step`
- Enable the plugin by default in `dot_claude/settings.json.tmpl`: `"sentry-mcp@sentry-mcp": true` in `enabledPlugins` and a `sentry-mcp` entry in `extraKnownMarketplaces` with `autoUpdate: true`
- Add a `sentry` MCP server of `type: "remote"` pointing at `https://mcp.sentry.dev/mcp` to the OpenCode user config (`dot_config/opencode/opencode.jsonc`), which currently declares only `expect`
- Allow Sentry's six read-only tools in `permissions.allow` under the plugin-namespaced prefix `mcp__plugin_sentry-mcp_sentry__…`, and put the two write-capable / quota-consuming tools in `permissions.ask` so they prompt. Omission is not enough: `defaultMode` is `auto`, so an unmatched tool goes to the safety classifier rather than to a prompt
- Document the server in the README "MCP Servers" table and in both MCP tables of `docs/manual.html` (Claude Code and OpenCode), plus the OAuth notes in the install script's "Manual Installation Required" block and the non-macOS fallback

Deliberately not changing: `sentry` is **not** added to `MCP_STDIO_SERVERS` or `MCP_HTTP_SERVERS`. The plugin already ships its own `.mcp.json` with the same endpoint, so registering it again through `claude mcp add --scope user` would open two connections to `https://mcp.sentry.dev/mcp` and load the toolset twice into context (rationale in design.md). Also out: the bleeding-edge `sentry-mcp-experimental@sentry-mcp` plugin, the `stdio` transport (only needed for self-hosted Sentry), and any entry in this repo's own `opencode.json` / `.mcp.json`.

## Capabilities

### New Capabilities

None. Everything this change introduces lands inside capabilities that already exist.

### Modified Capabilities

- `claude-code-plugins`: gains requirements for the Sentry marketplace registration (`CC_MARKETPLACES` + `extraKnownMarketplaces`), for the plugin install and default-enable (`CC_PLUGINS` + `enabledPlugins`), and for the non-macOS fallback naming the two manual commands
- `mcp-global-config`: gains a requirement for the `sentry` remote server in the OpenCode user config, and a second requirement pinning the negative constraint that Sentry is provided by the Claude Code plugin and must **not** appear in the install script's MCP arrays
- `claude-user-preferences`: the "MCP read-only tools are allowed" requirement grows the six Sentry read-only rules, plus explicit `permissions.ask` rules for `analyze_issue_with_seer` and `execute_sentry_tool`. This introduces the first `ask` array in the template — until now the object held only `allow`, `defaultMode` and `deny`. The "Default permission mode is auto" requirement also gains the deny → ask → allow evaluation order and the rule that a matching `ask` forces a prompt even when a broader `allow` matches

The README and manual requirements describe their tables generically ("all managed tools" / "all registered servers") rather than enumerating entries, so adding rows implements them rather than changing them — same criterion applied in `add-gh-stack`.

## Impact

- **Files modified**:
    - `run_onchange_install-packages.sh.tmpl` — `CC_MARKETPLACES` (`:838-850`), `CC_PLUGINS` (`:852-879`), the OAuth line in "Manual Installation Required" (`:1168-1184`), and the "Claude Code plugins" section of the non-macOS fallback (`:1223-1226`)
    - `dot_claude/settings.json.tmpl` — `enabledPlugins` (`:8-39`), `extraKnownMarketplaces` (`:43-123`), `permissions.allow` (`:231-298`) and a new `permissions.ask` array
    - `dot_config/opencode/opencode.jsonc` — the `mcp` block (`:18-24`)
    - `README.md` — one row in the "MCP Servers" table
    - `docs/manual.html` — one row in the Claude Code "MCP servers" table and one in a new OpenCode "MCP servers (OpenCode only)" table (not the shared table: the two clients hold separate configurations)
- **Dependencies**: a Sentry **cloud** account (`sentry.io`); Claude Code with plugin support for bundled `.mcp.json` servers; OpenCode 1.18.11, which performs OAuth discovery with PKCE and Dynamic Client Registration automatically for `remote` servers
- **Auth**: OAuth on first use — `/mcp` inside Claude Code, `opencode mcp auth sentry` in OpenCode. No token is stored in the repo and nothing is added to the age-encrypted file
- **No install-script counters change**: the group's `TOTAL_MCP` (8 stdio + 6 http) is untouched; `TOTAL_MP` goes 11 → 12 and `TOTAL_PL` goes 26 → 27
- **Ordering vs. open changes**: `add-fallow` already carries a `MODIFIED` delta on the *"Global MCP servers are registered via Claude CLI in install script"* requirement of `mcp-global-config`. This change only `ADDED`s to that capability, so the two can be archived in either order
- **Known limitation**: `mcp.sentry.dev` serves `sentry.io` only. Self-hosted Sentry would need the upstream `stdio` transport and is out of scope
- **Out of scope**: instrumenting any project with the Sentry SDK, and the `sentry-mcp-experimental` plugin variant
