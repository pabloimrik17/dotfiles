## Why

Claude Code >= 2.1.277 reads repo-root `AGENTS.md` natively, but only when no `CLAUDE.md` exists in the working directory or any ancestor. The root `CLAUDE.md` (`@AGENTS.md` import) is now redundant, because Claude Code reads `AGENTS.md` directly. Same fleet convention as agentic-task-wmqd.10 (monolab): `AGENTS.md` is the sole instruction source.

## What Changes

- Remove root `CLAUDE.md`.
- Update `.agents/skills/sync-agent-config/parity.md` (instructions row) and `docs/manual.html` (Claude Code section) to say Claude reads `AGENTS.md` natively.
- Keep the `CLAUDE.md` line in `.chezmoiignore.tmpl` as a defensive guard so a recreated file is never deployed to `$HOME`.
- Not touched: `~/.claude/rules`, home deployment, user-scope instructions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-instructions`: "Repository instructions have one maintained body" now requires root `CLAUDE.md` to be absent; "Discovery and application boundaries remain valid" now relies on native discovery.

## Impact

Repo-only files and docs. Claude Code versions older than 2.1.277 no longer receive the Bun policy from this repo. Per the Claude memory docs, native `AGENTS.md` reading is also unavailable with the built-in AGENTS plugin disabled and, in some cases, in the first session after upgrading from 2.1.276 or earlier; those sessions read `CLAUDE.md` only.
