# Proposal

## Why

Claude Code 2.1.277+ reads `AGENTS.md` natively, but under the default instruction mode (`claude-md-or-agents-md`) a single `CLAUDE.md` or `CLAUDE.local.md` in the working directory or any parent makes it skip every `AGENTS.md` silently. The workspace is retiring `CLAUDE.md` in favour of `AGENTS.md`, yet `bd init`, `bd setup claude` and Claude Code `/init` keep recreating it, and older worktrees still carry one. Claude Code honours the controlling key only in user settings, `--settings` or managed settings, so it belongs in the chezmoi-managed `~/.claude/settings.json`.

Related: Beads agentic-task-5vg, agentic-task-wmqd.4 and agentic-task-wmqd.14; dotfiles PR #236 (removes root `CLAUDE.md`, does not touch the settings template).

## What Changes

- Manage `pluginConfigs."cc-plugin-agents-md@builtin".options.instructionFiles = "claude-md-and-agents-md"` in `dot_claude/modify_settings.json.tmpl`.
- Merge `pluginConfigs` down to `options`, so other plugin entries and other options of this plugin survive an apply.
- Add a short manual note.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-user-preferences`: adds the instruction-files requirement.

## Impact

- `dot_claude/modify_settings.json.tmpl`, `tests/claude-agents-md.test.ts`, `docs/manual.html`.
- No dependency change. Not applied by this change; the user merges and runs `chezmoi apply`.
