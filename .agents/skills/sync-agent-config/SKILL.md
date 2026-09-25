---
name: sync-agent-config
description: Use when user-scope agentic-tool config changes in this repo — a setting, permission rule, plugin, marketplace, hook, statusline or command under `dot_claude/`; an MCP server, plugin marketplace, or plugin registered in `run_onchange_install-packages.sh.tmpl` (`MCP_HTTP_SERVERS`, `MCP_STDIO_SERVERS`, `CC_MARKETPLACES`, `CC_PLUGINS`); anything under future `dot_codex/`, `dot_config/opencode/`, or `dot_junie/` user-scope surfaces — added, modified, or removed. Not for project-level agent config in this repository.
---

# Sync Agent Config

Keep user-scope config comparable across Claude Code, Codex, OpenCode, and Junie. When one tool gains, changes, or loses a capability, the same question is owed to the other three — answered either by an equivalent edit or by a recorded gap.

## When This Activates

- A file under `dot_claude/` is added, modified, or removed — the `MANAGED` keys in `modify_settings.json.tmpl` (`permissions`, `enabledPlugins`, `extraKnownMarketplaces`, `hooks`, `env`, `statusLine`, `effortLevel`, …), `dot_claude/commands/`, `dot_claude/plugins/*/config.json`
- An agent-config entry in `run_onchange_install-packages.sh.tmpl` changes — `MCP_HTTP_SERVERS`, `MCP_STDIO_SERVERS` (Claude Code's user-scope MCP servers, registered by `claude mcp add` into `~/.claude.json`), `CC_MARKETPLACES`, `CC_PLUGINS`
- A file under future `dot_codex/` is added, modified, or removed. The repo manages none today, so verify whether Codex provides an official runtime-owned surface before proposing a new file
- A file under `dot_config/opencode/` is added, modified, or removed — `opencode.jsonc` (`model`, `plugin`, `mcp`, `permission`, `formatter`), `tui.json`
- A Junie user-scope surface changes, or is created for the first time. The repo manages none today, so verify support before proposing either a new file or a gap

## When This Does NOT Activate

Project-level agent config in this repository is out of scope. Never activate on `.claude/`, `.codex/`, `.opencode/`, `.junie/`, `.agents/`, `.mcp.json`, `opencode.json`, `AGENTS.md`, or `CLAUDE.md`.

The test: in scope means chezmoi source state that configures the user's own environment — a `dot_*` file, or a
`run_onchange_*` script that registers user-scope agent config. Repo-root dot-directories are repo tooling and chezmoi
never applies them. A change to the install script that is not agent config (a brew package, a gh extension, or the
Codex installer stanza) belongs to `classify-tool-updates`, not here.

## Workflow

### Step 1: Read the parity table

Read `.agents/skills/sync-agent-config/parity.md` first. If the changed capability already has a row, reuse the mapping unless current documentation or runtime evidence shows that it is stale; in that case, propose correcting the row.

### Step 2: Classify the change kind

Classify each changed entry independently — one diff can add one entry and remove another. All three kinds are handled symmetrically:

| Source change  | Proposal for each other tool    |
| -------------- | ------------------------------- |
| entry added    | add the equivalent entry        |
| entry modified | modify the counterpart to match |
| entry removed  | remove the counterpart          |

Apply the table action only when the target is not already in the desired post-change state. Otherwise report `already satisfied` with action `none` instead of proposing a duplicate edit or runtime command.

A removal is not a no-op. An orphaned counterpart is exactly the drift this skill exists to catch.

### Step 3: Locate the counterpart surface per tool

For each of the other three tools, name the concrete target surface, verified against that tool's own docs — never guess a key, path, or command. A target surface is one of:

- a chezmoi source file and key
- an official runtime-owned command or UI when the capability exists but has no stable managed file
- `none` when the tool has no equivalent capability

Runtime ownership is not a capability gap. Do not invent a chezmoi file when the supported counterpart is installed or configured through the tool itself.

One tool's capability can live in more than one file, so locating "the surface" means naming every file that carries it. Claude Code is the case that bites: its settings live in `dot_claude/modify_settings.json.tmpl`, but its user-scope MCP servers are registered by the install script into `~/.claude.json` — a file the `mcp-global-config` capability forbids the settings template from carrying at all. An MCP server can also arrive a second way, bundled in a plugin via `enabledPlugins` plus `extraKnownMarketplaces`; that is a different mechanism, not the same entry written elsewhere, and it lands under a different tool-permission namespace (`mcp__plugin_<plugin>_<server>__*`).

The grammars differ, so an equivalence is a judgment call, not a rename:

- Claude Code `permissions.allow/ask/deny` ↔ OpenCode `permission.bash.<glob>: allow|ask|deny`
- Claude Code MCP server via plugin (`enabledPlugins` + `extraKnownMarketplaces`) ↔ OpenCode `mcp.<name>` with `type: remote|local`

### Step 4: Propose — one block per tool, all tools every time

Each block names:

1. **target tool**
2. **parity status** — proposed change, already satisfied, or capability gap
3. **target surface** — chezmoi source path and key, official runtime command or UI, or `none`
4. **concrete action** — exact lines or command to add, change, or delete; `none` only when already satisfied or a gap

**Wait for user confirmation before editing any file or running any runtime mutation command.** A chezmoi edit reaches the live machine on the next apply, and a runtime command changes tool-owned state immediately.

Never drop a tool from the proposal. Supported runtime state and real gaps are different blocks:

Every proposal names Claude Code, Codex, OpenCode, and Junie. Each tool gets either a concrete counterpart or an explicit, reasoned gap:

> **Codex** — supported runtime counterpart. Surface: `codex plugin add superpowers@openai-curated`; no chezmoi file. Action: run after confirmation.
>
> **Junie** — capability gap. Surface: `none`. Action: none; record the reason in `parity.md`.

### Step 5: Propose the parity row

Every new mapping and every confirmed gap gets a row in `.agents/skills/sync-agent-config/parity.md`: capability | Claude Code | Codex | OpenCode | Junie | notes. Record a runtime-owned counterpart by its stable plugin, command, or feature identifier; use `none` only for a true capability gap, and explain ownership or gaps in notes.

Never leave a cell blank. A gap is `none` in the tool's cell plus the reason in notes — a blank cell is indistinguishable from "not investigated yet", which is the ambiguity the table exists to remove.

### Step 6: Docs follow-up — delegate

Never edit `README.md` or `docs/manual.html` here. After a confirmed config change, run the `update-manual` skill (and `update-readme` if the change is tool-level) for documentation follow-up.

## Guardrails

- **Never write any tool's config or mutate runtime-owned state without user confirmation**
- All four tools appear in every proposal — replicated, gapped, or already recorded in parity, never omitted
- Never leave a `parity.md` cell blank
- Never edit `README.md` or `docs/manual.html`
- Never touch project-level agent config (see When This Does NOT Activate)
- When an equivalence is unclear, ask instead of inventing a key
- This skill is repo tooling: `.agents/` is never applied by chezmoi

## Red Flags — STOP

- "This tool has no counterpart, I'll leave it out" → gap block, not silence
- "There is no chezmoi file, so the capability is missing" → record the official runtime-owned counterpart
- "The parity row already exists, so it must still be current" → refresh it when current evidence disproves it
- "Obviously the same setting" without reading the target tool's docs → verify, or ask
- "I'll apply it and show the diff" → confirmation comes first, always
- "It's only a removal" → removals propagate like additions
- "I'll fill the notes cell in later" → no blank cells
