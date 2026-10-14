# Proposal

## Why

Plannotator is already installed and the current machine has a partially configured Inbox, but the dotfiles do not reproduce its connections or onboarding on another machine. Repository instructions also exist as identical, independently editable `CLAUDE.md` and `AGENTS.md` files.

## What Changes

- Make the existing Plannotator installer recognize an Inbox-capable release, including the `~/.local/bin` fallback, and use the official non-interactive installation path when installation or an upgrade is needed.
- Reuse the existing Claude Code and OpenCode plugins. Register Inbox through Codex's runtime-owned MCP CLI and Junie's existing merge-managed MCP configuration; enable OpenCode's native Inbox tool through a narrow Plannotator configuration merge.
- Keep browser opening, instruction-note consent, and the first real message/reply exchange as explicit onboarding, outside unattended chezmoi application. Skip already completed steps and preserve existing connections, opt-outs and Inbox data.
- Make repository `AGENTS.md` the sole maintained instruction body. Proposed compatibility default: reduce root `CLAUDE.md` to `@AGENTS.md`, preserving existing Bun guidance. Current Claude Code supports native `AGENTS.md`; the import also supports older or explicitly CLAUDE-only sessions.
- Audit managed user instructions and migrate any actual managed `CLAUDE.md` bodies without losing content or changing their scope. Discovery found no such source files and no `~/.claude/CLAUDE.md` on this host: the present user-scope migration is a documented no-op. Existing Inbox notes remain runtime-owned rather than being adopted wholesale into chezmoi.
- Migrate managed OpenCode server/project configuration to native v2 fields and merge the existing theme/scroll settings into private `cli.json`, preserving permissions, MCP endpoints, plugin choices and unrelated CLI preferences. The user authorized this extension during apply after discovering OpenCode 2.0.28.
- Document opening Inbox, replies, restarts, notifications, local storage, note ownership and agent parity. Keep Plannotator in the existing manual-update class with one `update-extra` step.

## Capabilities

### New Capabilities

- `plannotator-inbox`: Inbox-capable installation, native plugin activation, opt-in onboarding, instruction notes, and verified local message/reply delivery.
- `agent-instructions`: Canonical repository `AGENTS.md` instructions and content-preserving, scope-preserving migration of managed user instructions where they exist.

### Modified Capabilities

- `mcp-global-config`: Add narrowly managed stdio Inbox connections for Codex and Junie while reusing native plugins for Claude Code and OpenCode.
- `extra-updates-command`: Make the existing Plannotator update use the non-interactive installer without adding a second updater.

## Impact

- Implementation targets: `run_onchange_install-packages.sh.tmpl`, `dot_zshrc.tmpl`, `dot_junie/mcp/modify_mcp.json.tmpl`, a new `dot_plannotator/modify_private_config.json` merge script, OpenCode server/project config and `dot_config/opencode/modify_private_cli.json`, root `CLAUDE.md`/`AGENTS.md`, and `.agents/skills/sync-agent-config/parity.md`.
- Documentation: `README.md` and `docs/manual.html` sections 11–14, with relevant `update-extra` wording in section 7. Focused Bun tests cover installer branches and configuration preservation; no live Inbox traffic in automated tests.
- Runtime state stays local: `~/.plannotator/inbox/`, Codex configuration, user instruction notes, and plugin state are not copied into the repository. No new package, service manager, cloud endpoint, credential, or port pin is needed.
- Existing `add-sentry-mcp` and `add-posthog-mcp` changes overlap agent documentation and configuration areas; this change must preserve their entries and permission policies.

This proposal creates planning artifacts only. Live setup and the message/reply check belong to the subsequent apply workflow.
