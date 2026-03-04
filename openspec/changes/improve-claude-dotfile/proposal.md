## Why

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) manages plugins but is missing Plannotator — a visual plan review tool that lets you annotate, approve, or request changes on agent plans before implementation. Adding it ensures every managed machine has plan review capabilities out of the box.

## What Changes

- Add `plannotator@plannotator` to `enabledPlugins` in `dot_claude/settings.json.tmpl`
- Add Plannotator CLI installation to `run_once_install-packages.sh.tmpl` as a new group (Group 5)

## Capabilities

### New Capabilities

_None — this is a configuration addition to an existing dotfile, not a new managed capability._

### Modified Capabilities

_None — no existing specs are modified; this change introduces a new spec for Claude Code plugin defaults._

## Impact

- **Modified files**: `dot_claude/settings.json.tmpl` (new plugin entry), `run_once_install-packages.sh.tmpl` (new install group)
- **Target**: `~/.claude/settings.json` on managed machines (via chezmoi); Plannotator CLI installed on first `chezmoi apply`
- **Prerequisite**: User must still run `/plugin marketplace add backnotprop/plannotator` + `/plugin install plannotator@plannotator` in Claude Code once
- **Risk**: Minimal — the install script prompts for confirmation; the plugin entry is inert if the marketplace plugin hasn't been added
