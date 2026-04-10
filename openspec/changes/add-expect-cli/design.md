## Context

The dotfiles manage global MCP server configuration for two AI coding agents: Claude Code (`dot_claude/settings.json.tmpl`) and OpenCode (`dot_config/opencode/opencode.jsonc`). Claude Code currently has 9 global MCP servers; OpenCode has none (it uses plugins instead). Both configs are chezmoi-managed templates deployed to `~/.claude/settings.json` and `~/.config/opencode/opencode.jsonc` respectively.

expect-cli is an npm package that provides browser-based testing via MCP tools. Its `init` command sets up per-project skills and preferences, but the MCP server itself can be registered globally so the tools are available in every session.

## Goals / Non-Goals

**Goals:**

- Register the expect MCP server globally for Claude Code and OpenCode so browser testing tools are available in every session without per-project setup
- Follow the established `npx -y <package>@latest` pattern used by all other stdio MCP servers

**Non-Goals:**

- Installing expect-cli as a global npm package (uses npx on-demand instead)
- Automating per-project `expect init` — that installs the SKILL.md and project preferences, which are project-local concerns
- Adding shell aliases for expect-cli
- Modifying the chezmoi install script

## Decisions

### Decision 1: npx on-demand instead of global install

Register the MCP server as `npx -y expect-cli@latest mcp` rather than installing expect-cli globally with `bun add -g`.

**Rationale**: Every other stdio MCP server in the dotfiles uses `npx -y <package>@latest`. This ensures the latest version is always used without manual upgrades. The dotfiles have zero globally-installed npm packages — adding one would break that pattern. The `@latest` tag means no version pinning or maintenance burden.

**Alternative considered**: `bun add -g expect-cli` in the install script, then reference the binary directly. Rejected because it introduces a new installation category, requires manual version updates, and the command name `expect` collides with Tcl Expect (`/usr/bin/expect`).

### Decision 2: OpenCode uses `mcp` config key, not plugins

OpenCode supports MCP servers via a `"mcp"` key in its config, separate from its `"plugin"` array. The expect MCP server will be added as a `"local"` type MCP entry with command array format, matching OpenCode's documented config schema.

**Rationale**: Plugins and MCP servers are different concepts in OpenCode. The MCP entry makes the tools available to the agent directly, which is what we need.

### Decision 3: Global scope only, no per-project config in dotfiles

The MCP server is registered globally. Per-project setup (skill, preferences) is left to `npx -y expect-cli@latest init` run manually by the user.

**Rationale**: The SKILL.md and `.expect/project-preferences.json` are project-local files that don't belong in a global dotfiles repo. The MCP server provides the tools; the skill teaches the agent when to use them. Without the skill, users can still invoke expect explicitly — they just won't get the automatic `/expect` slash command.

## Risks / Trade-offs

**[npx cold start latency]** → First invocation in a session downloads expect-cli via npx, adding a few seconds. Subsequent calls in the same session are cached. This is identical to how eslint, knip, context7, and all other npx-based MCP servers behave — accepted trade-off for always-latest versioning.

**[No automatic /expect command]** → Without running `init` per-project, agents won't have the SKILL.md that enables the `/expect` slash command. Users must explicitly ask the agent to use expect tools, or run `init` themselves. This is intentional — the dotfiles provide the infrastructure, projects opt in to the full experience.

**[OpenCode MCP is a new config section]** → The current `opencode.jsonc` has no `mcp` key. Adding it is the first MCP server for OpenCode in the dotfiles. If OpenCode changes its MCP config format in the future, this entry will need updating.
