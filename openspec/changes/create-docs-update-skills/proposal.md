## Why

The dotfiles documentation (README.md and docs/manual.html) drifts out of sync with actual configurations every time a tool is added, an alias changes, or a config is updated. There's no systematic way to detect or fix this — it relies entirely on memory. Recent audit found gh-dash, gh-enhance, CodeRabbit CLI, bun/pnpm aliases, and several eza aliases all missing from documentation.

Two Claude Code skills (with matching commands) will catch documentation gaps at the point where changes happen, either auto-triggered by the model or manually invoked.

## What Changes

- Add `update-manual` skill + `/docs:manual` command that analyzes config changes against docs/manual.html and proposes HTML additions, modifications, or removals
- Add `update-readme` skill + `/docs:readme` command that analyzes config changes against README.md and proposes table/section updates plus screenshot descriptions when visual documentation would help
- Both follow the duplicated skill+command pattern used by OpenSpec in this repo
- Skills auto-trigger when Claude detects config file changes; commands provide explicit `/docs:manual` and `/docs:readme` invocation
- Neither skill edits files without user confirmation (propose-then-apply)

## Capabilities

### New Capabilities

- `update-manual-skill`: Skill + command that maps config changes to manual.html sections, detects gaps (new/changed/removed aliases, keybindings, tools, settings), and proposes HTML edits following the manual's existing patterns (details/summary, tables, h3 subsections, flow blocks, kbd/code styling)
- `update-readme-skill`: Skill + command that determines if README.md needs updating (What's Included table, badges, setup, workflows, screenshots), proposes markdown edits, and generates actionable screenshot descriptions (what to show, how to simulate, suggested filename)

### Modified Capabilities

<!-- No existing specs are being modified -->

## Impact

- New files in `.claude/skills/update-manual/`, `.claude/skills/update-readme/`, `.claude/commands/docs/`
- No chezmoi-managed files affected (skills are local to the repo, excluded from dotfiles sync)
- No dependencies or packages added
- Existing OpenSpec workflow unaffected
