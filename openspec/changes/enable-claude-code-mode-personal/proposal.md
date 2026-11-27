# Proposal

## Why

Code Mode (Claude Code v2.1.323+) lets Claude run several tool calls in one JavaScript step. It is off by default and is read only from user settings, managed settings or the shell. The user wants it on the personal machine and never on the work machine. On 2026-11-19 it was enabled by hand on the work machine and removed again the same day. The personal machine carries it by hand today, outside chezmoi.

Tracked as beads:agentic-task-llan.

## What Changes

- `dot_claude/modify_settings.json.tmpl` declares `"CLAUDE_CODE_EXPERIMENTAL_CODE_MODE": "1"` in the MANAGED `env` block only when chezmoi's `machineType` is `personal`.
- On every other machine type the merge removes `env.CLAUDE_CODE_EXPERIMENTAL_CODE_MODE` through `REMOVE`, so a key added by hand does not survive an apply.
- A new test renders the template for `personal` and `work` and checks both outputs, on a fresh file and on a live file.
- The manual gets a short Code Mode entry next to "Fullscreen TUI": personal machines only, what it turns off, how to opt out.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-user-preferences`: adds the Code Mode env key, gated on machine type.
- `claude-settings-merge`: the host-conditional removal rule covers machine type as well as OS and architecture.

## Impact

- **Files**: `dot_claude/modify_settings.json.tmpl`, a new `tests/claude-code-mode.test.ts`, `docs/manual.html`.
- **Work machine**: no rendered key. Its live file has no Code Mode key since 2026-11-19, so `chezmoi diff` shows no change there.
- **Personal machine**: the key already sits in the live file by hand, so the first apply leaves it in place and the source now owns it.
- **Lost there**: Claude in Chrome, computer use and Remote Control. Browser work goes through Playwright MCP or chrome-devtools MCP.
- **Blockers**: none of the documented blockers apply to the managed config. The audit is in design.md, D5.
