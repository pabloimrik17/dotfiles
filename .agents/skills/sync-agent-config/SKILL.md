---
name: sync-agent-config
description: Use when user-scope agentic-tool config changes in this repo — a setting, permission rule, plugin, marketplace, hook, statusline or command under `dot_claude/`; an MCP server registered in `run_onchange_install-packages.sh.tmpl`; anything under `dot_config/opencode/`; or a Junie user-scope surface (`dot_junie/`, not yet created) — added, modified, or removed. Not for project-level agent config in this repository.
---

# Sync Agent Config

Keep user-scope config comparable across Claude Code, OpenCode, and Junie. When one tool gains, changes, or loses a capability, the same question is owed to the other two — answered either by an equivalent edit or by a recorded gap.

## When This Activates

- A file under `dot_claude/` is added, modified, or removed — the `MANAGED` keys in `modify_settings.json.tmpl` (`permissions`, `enabledPlugins`, `extraKnownMarketplaces`, `hooks`, `env`, `statusLine`, `effortLevel`, …), `dot_claude/commands/`, `dot_claude/plugins/*/config.json`
- An agent-config entry in `run_onchange_install-packages.sh.tmpl` changes — `MCP_HTTP_SERVERS`, `MCP_STDIO_SERVERS` (Claude Code's user-scope MCP servers, registered by `claude mcp add` into `~/.claude.json`), `CC_MARKETPLACES`, `CC_PLUGINS`
- A file under `dot_config/opencode/` is added, modified, or removed — `opencode.jsonc` (`model`, `plugin`, `mcp`, `permission`, `formatter`), `tui.json`
- A Junie user-scope surface changes, or is created for the first time. The repo manages none today, so the first Junie proposal is always "create this file"

## When This Does NOT Activate

Project-level agent config in this repository is out of scope. Never activate on `.claude/`, `.opencode/`, `.junie/`, `.agents/`, `.mcp.json`, `opencode.json`, `AGENTS.md`, or `CLAUDE.md`.

The test: in scope means chezmoi source state that configures the user's own environment — a `dot_*` file, or a
`run_onchange_*` script that registers user-scope agent config. Repo-root dot-directories are repo tooling and chezmoi
never applies them. A change to the install script that is not agent config (a brew package, a gh extension) belongs to
`classify-tool-updates`, not here.

## Workflow

### Step 1: Read the parity table

Read `.agents/skills/sync-agent-config/parity.md` first. If the changed capability already has a row, reuse the mapping recorded there instead of re-deriving it.

### Step 2: Classify the change kind

Classify each changed entry independently — one diff can add one entry and remove another. All three kinds are handled symmetrically:

| Source change    | Proposal for each other tool     |
| ---------------- | -------------------------------- |
| entry added      | add the equivalent entry         |
| entry modified   | modify the counterpart to match  |
| entry removed    | remove the counterpart           |

A removal is not a no-op. An orphaned counterpart is exactly the drift this skill exists to catch.

### Step 3: Locate the counterpart surface per tool

For each of the other two tools, name the concrete file and key, verified against that tool's own docs — never guess a key or a path.

One tool's capability can live in more than one file, so locating "the surface" means naming every file that carries it. Claude Code is the case that bites: its settings live in `dot_claude/modify_settings.json.tmpl`, but its user-scope MCP servers are registered by the install script into `~/.claude.json` — a file the `mcp-global-config` capability forbids the settings template from carrying at all. An MCP server can also arrive a second way, bundled in a plugin via `enabledPlugins` plus `extraKnownMarketplaces`; that is a different mechanism, not the same entry written elsewhere, and it lands under a different tool-permission namespace (`mcp__plugin_<plugin>_<server>__*`).

The grammars differ, so an equivalence is a judgment call, not a rename:

- Claude Code `permissions.allow/ask/deny` ↔ OpenCode `permission.bash.<glob>: allow|ask|deny`
- Claude Code MCP server via plugin (`enabledPlugins` + `extraKnownMarketplaces`) ↔ OpenCode `mcp.<name>` with `type: remote|local`

### Step 4: Propose — one block per tool, all tools every time

Each block names:

1. **target tool**
2. **target file** — the chezmoi source path
3. **the concrete edit** — the exact lines to add, change, or delete

**Wait for user confirmation before editing any file.** This config is deployed to `$HOME` by `chezmoi apply`; an unattended edit reaches the live machine on the next apply.

Never drop a tool from the proposal. A tool with no counterpart gets a gap block, not silence:

> **Junie** — no equivalent: <reason>. Recorded in `parity.md`.

### Step 5: Propose the parity row

Every new mapping and every confirmed gap gets a row in `.agents/skills/sync-agent-config/parity.md`: capability | Claude Code | OpenCode | Junie | notes.

Never leave a cell blank. A gap is `none` in the tool's cell plus the reason in notes — a blank cell is indistinguishable from "not investigated yet", which is the ambiguity the table exists to remove.

### Step 6: Docs follow-up — delegate

Never edit `README.md` or `docs/manual.html` here. After a confirmed config change, run the `update-manual` skill (and `update-readme` if the change is tool-level) for documentation follow-up.

## Guardrails

- **Never write any tool's config without user confirmation**
- All three tools appear in every proposal — replicated, gapped, or already recorded in parity, never omitted
- Never leave a `parity.md` cell blank
- Never edit `README.md` or `docs/manual.html`
- Never touch project-level agent config (see When This Does NOT Activate)
- When an equivalence is unclear, ask instead of inventing a key
- This skill is repo tooling: `.agents/` is never applied by chezmoi

## Red Flags — STOP

- "This tool has no counterpart, I'll leave it out" → gap block, not silence
- "Obviously the same setting" without reading the target tool's docs → verify, or ask
- "I'll apply it and show the diff" → confirmation comes first, always
- "It's only a removal" → removals propagate like additions
- "I'll fill the notes cell in later" → no blank cells
