# Design: add-posthog-mcp

## Context

PostHog exposes a hosted MCP endpoint at `https://mcp.posthog.com/mcp` — free, no self-hosting, browser OAuth on first use, covering insights/HogQL, feature flags, experiments, error tracking and session data. There are two ways to reach it from this machine, and the repo already has both patterns in place: the `MCP_HTTP_SERVERS` array in `run_onchange_install-packages.sh.tmpl` (which registers the http servers user-scope via `claude mcp add`), and the `CC_MARKETPLACES` / `CC_PLUGINS` arrays plus `enabledPlugins` in `dot_claude/settings.json.tmpl` for Claude Code plugins.

The finding that shapes this design: **the official PostHog plugin is already published in the `claude-plugins-official` marketplace** — plugin name `posthog`, source `url` → `https://github.com/PostHog/ai-plugin.git`, pinned by commit sha — and that marketplace is already registered both in `CC_MARKETPLACES` (`anthropics/claude-plugins-official`) and in `extraKnownMarketplaces` with `autoUpdate: true`. The plugin ships its own MCP definition:

```json
{
  "mcpServers": {
    "posthog": {
      "type": "http",
      "url": "https://mcp.posthog.com/mcp",
      "headers": { "x-posthog-mcp-consumer": "plugin" }
    }
  }
}
```

So installing the plugin already delivers the MCP server, surfaced as `plugin:posthog:posthog`. The rest of the plugin surface at that sha: ~140 PostHog product skills, an `error-analyzer` agent, three `/posthog:llma-cc-*` commands (LLM Analytics setup/status/ingest), and two hooks — a SessionEnd LLMA uploader that is a no-op unless `POSTHOG_LLMA_CC_ENABLED` and `POSTHOG_API_KEY` are set, and a PreToolUse gate (matcher `__exec$`) that re-prompts on sensitive write `call`s. The two integration paths are not complementary — they are the same server reached twice.

OpenCode is the other consumer. It does not read Claude Code plugins, and `dot_config/opencode/opencode.jsonc` currently declares only `expect` in its `mcp` block. Per `opencode-user-config`, that `mcp` block is owned by the `mcp-global-config` capability.

## Goals / Non-Goals

**Goals:**

- PostHog reachable from both agents on any machine after `chezmoi apply`, with no per-project configuration.
- Exactly one instance of the PostHog tool set per client — no duplicated tools, no duplicated OAuth.
- The "why not `MCP_HTTP_SERVERS`" reasoning captured as a normative requirement, so it survives future edits.
- No new credential surface: OAuth only, nothing added to the age/chezmoi secret flow.

**Non-Goals:**

- PostHog LLM Analytics for Claude Code sessions (`POSTHOG_LLMA_CC_ENABLED`, `POSTHOG_LLMA_PRIVACY_MODE`, `POSTHOG_API_KEY`): would require a `phc_…` project key in the encrypted secret flow. Decided out of scope; can be revisited as its own change.
- PostHog CLI, the VS Code extension, and `@posthog/wizard` (project instrumentation): editor is WebStorm and instrumentation is per-project work, not machine setup.
- The separate `PostHog/skills` marketplace: overlaps with the plugin's slash commands and would add a marketplace entry for marginal gain.
- Pre-approving PostHog tools in `permissions.allow` (see D4).

## Decisions

### D1: In Claude Code, PostHog arrives via the plugin only — never via `MCP_HTTP_SERVERS`

The plugin is the superset: it delivers the same http MCP server *and* the product skills, which are its real ergonomic win. Adding a user-scope `posthog` entry on top would connect the same server twice — the MCP surfaces a single `exec` dispatcher tool, so the duplicate is `mcp__posthog__exec` alongside `mcp__plugin_posthog_posthog__exec` — and require two separate OAuth logins against the same PostHog account, with no capability gained.

Alternatives rejected:

- **Both registrations** — keeps the "every global MCP lives in `MCP_HTTP_SERVERS`" convention intact, but pays the duplication in context and auth. Convention is not worth that.
- **MCP entry only, no plugin** — symmetric with OpenCode, the smallest diff, and avoids putting the plugin's ~140 skills in every session. Forfeits those skills and the write-gating hook; kept as the fallback if the skill noise outweighs their value (see Risks).

The exclusion is expressed as a `SHALL NOT` requirement with its own scenarios, so `openspec show mcp-global-config` makes it visible to whoever next edits the MCP arrays.

### D2: In OpenCode, a `type: remote` entry in the global `mcp` block

OpenCode ignores Claude Code plugins, so it needs its own registration. The entry follows the `remote` shape already used by `gh_grep` in the project-level `opencode.json`, with `enabled: true` to match `expect`. OpenCode handles OAuth for remote MCP servers and exposes `opencode mcp auth` to trigger the flow explicitly. Asymmetry with the Claude Code path (plugin vs. config entry) is accepted — it is the consequence of D1, not an oversight.

### D3: No Renovate pin and no `update-extra` step

Renovate's custom manager for the install script matches `pkg@version` strings; a hosted URL has nothing to pin. The plugin version is governed by the `claude-plugins-official` marketplace entry, which already has `autoUpdate: true`, so Claude Code refreshes it on its own cycle. Nothing to add to `renovate.json` or to the `update-extra` function in `dot_zshrc.tmpl`.

### D4: No PostHog tools in `permissions.allow`

The allow-list in `dot_claude/settings.json.tmpl` enumerates read-only MCP tools one by one (`mcp__context7__query-docs`, `mcp__memory__read_graph`, `mcp__gh_grep__searchGitHub`), never by wildcard. The PostHog MCP is write-capable — it can create and update feature flags and insights and resolve issues — and `claude-user-preferences` already states that MCP write tools SHALL NOT be in the allow list. So no PostHog entry is added there.

Note what that does and does not buy. `permissions.defaultMode` is `auto`, so a tool matching no allow, ask, or deny rule is reviewed by the safety classifier, not confirmed by the user. Staying off the allow list means "classifier-reviewed", not "user-confirmed".

`claude-user-preferences` said otherwise — that such tools "remain at the default ask level", with a scenario asserting `mcp__memory__create_entities` "SHALL prompt the user for confirmation". That predates auto mode and was false for every write-capable MCP in the repo, so the delta in this change corrects it. The correction is descriptive only: it changes no rule and gates nothing, it stops the spec promising a prompt the configuration does not give.

One asymmetry is worth recording: PostHog is the only write-capable MCP here that arrives with its own ask-gate. At the pinned sha the plugin registers a `PreToolUse` hook (matcher `__exec$`, which this repo's `mcp__plugin_posthog_posthog__exec` matches) that returns `permissionDecision: "ask"` for a curated write set — feature-flag writes, any delete/destroy, `experiment-launch`/`-ship-variant`/`-reset`, `survey-launch`, `workflows-enable`. `PreToolUse` runs before permission-rule evaluation, so that is a real user prompt regardless of `defaultMode: auto`. Routine create/update stays silent, the hook is fail-open (`trap 'exit 0' EXIT`, it never blocks) and tunable via `POSTHOG_MCP_EXEC_GATE_{DISABLE,DENY,ALLOW}`.

The accepted residual exposure is that uncovered remainder, which matches how `mcp__memory__create_entities`, playwright and chrome-devtools already behave. Tightening the class is a broader change than this one.

Also worth recording, because it is the first thing anyone will reach for: **no permission rule can gate PostHog writes selectively.** The MCP runs in CLI mode, reaching all ~844 of its tools through a single `exec` tool whose operation travels inside the `command` argument, and Claude Code rules match tool names, never arguments (`mcp__server__tool(pattern)` is invalid syntax). Putting `exec` in `permissions.ask` would therefore prompt on every read too, and since rules resolve deny → ask → allow with specificity ignored, no allow rule could carve the reads back out. Gating writes specifically takes a `PreToolUse` hook parsing the argument, which is exactly what the plugin already ships. This repo authors no gating hook of its own — deliberately out of scope.

### D5: Capability split — plugin lifecycle vs. MCP surface

`claude-code-plugins` owns "install and enable the plugin" (the `CC_PLUGINS` entry and the `enabledPlugins` key), matching the existing `code-simplifier@claude-plugins-official` requirement. `mcp-global-config` owns "which MCP servers exist and where" — the OpenCode remote entry, the install-script exclusion, and the manual OAuth note. This is consistent with `opencode-user-config`, which already delegates ownership of the OpenCode `mcp` block to `mcp-global-config`.

The `mcp-global-config` delta uses `## ADDED Requirements` exclusively and does not touch the "N MCP servers" table requirement, which the in-flight `add-fallow` change is already modifying (13 → 14). Both changes can therefore be archived in either order.

### D6: Docs as implementation tasks, not spec deltas

`readme-content` and `manual-web` specify the *structure* of `README.md` and `docs/manual.html`, not their inventory of MCP servers. `add-fallow` set the precedent of handling README/manual updates as tasks driven by the `update-readme` / `update-manual` skills. The one nuance: PostHog is not registered by the install script, so its row must be marked *plugin-provided* to keep the "registers N global MCP servers" statement true.

## Risks / Trade-offs

- **Someone re-adds `posthog` to `MCP_HTTP_SERVERS`** — the most likely regression, since every other global server lives there. Mitigated by the explicit `SHALL NOT` requirement plus a scenario asserting the arrays contain no `posthog` entry.
- **The plugin changes its URL or headers in an update** — the marketplace pins the plugin by commit sha and refreshes via `autoUpdate: true`, so a change lands silently. Mitigated by a verification task that exercises a real tool call after installing.
- **OpenCode remote OAuth may not work first try** — `opencode mcp auth` is documented, but this change does not verify it. Fallback: ship the OpenCode entry with `enabled: false` until the flow is confirmed; the Claude Code layer is independent and not blocked by it.
- **Asymmetric registration** — Claude Code gets the plugin, OpenCode gets a config entry, so "where is PostHog configured?" has two answers. Accepted, and documented in both the spec delta and the docs row.
- **README/manual server count** — PostHog must not be counted among the install-script-registered servers, or the documented count drifts from reality.
- **Prompt injection via analytics data** — PostHog documents this risk for its MCP, and it is sharper here than for the repo's other write-capable MCPs: PostHog is the one that puts third-party content (event names, error messages, user-supplied properties) into context *and* can write production config. Partially mitigated by D4 — nothing is pre-approved, so uncovered calls reach the safety classifier, not a user prompt — and by the plugin's own `PreToolUse` gate, which does prompt on feature-flag writes, deletes/destroys, experiment launch/ship-variant/reset, `survey-launch` and `workflows-enable`. The accepted residual is the rest: routine create/update, silent by default — and, in OpenCode, the whole write surface, since the plugin's gate is a Claude Code hook.
- **Skill surface** — enabling the plugin adds ~140 skills to every session's skill listing, a per-session context cost the server-duplication argument does not capture. Accepted; the fallback is D1's rejected alternative (MCP entry only, plugin off).
- **Plugin hooks run on every session** — the SessionEnd LLMA hook executes python3 at each session end (verified no-op without `POSTHOG_LLMA_CC_ENABLED` + `POSTHOG_API_KEY`), and the PreToolUse gate fires on tools matching `__exec$`, which includes this repo's `mcp__plugin_posthog_posthog__exec` — so it is not inert, it prompts on the sensitive write subset (see D4). Accepted at the pinned sha: fail-open, never blocking, and the SessionEnd hook is a no-op without its env vars.
- **Spec describes a state that does not exist yet** — this change writes documentation only; nothing is implemented. Mitigated by citing exact paths, array names and keys verified against the repo as it stands today, so the implementation is mechanical.

## Migration Plan

Purely additive; no migration needed. Rollout order:

1. Install-script and settings-template entries land together, so `chezmoi apply` installs and enables the plugin in one pass.
2. OpenCode entry lands in the same change; it is inert until the user runs `opencode mcp auth`.
3. Each user completes OAuth once per client, on first use.

Rollback: remove the `CC_PLUGINS` and `enabledPlugins` entries, run `claude plugin uninstall posthog@claude-plugins-official`, and delete the `posthog` entry from the OpenCode `mcp` block. No other config is affected and no data migration is involved.

## Open Questions

- Does `opencode mcp auth` complete the PostHog OAuth flow cleanly on this OpenCode version? To be answered by the verification tasks; the fallback is D2's `enabled: false`.
- Should PostHog LLM Analytics for Claude Code sessions be revisited later as its own change? The plugin already ships the LLMA hook and the `/posthog:llma-cc-*` commands, inert until `POSTHOG_LLMA_CC_ENABLED` and `POSTHOG_API_KEY` are set — the only blocker is the `phc_…` key handling.
