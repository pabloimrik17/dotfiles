## Why

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) manages plugins but is missing Plannotator — a visual plan review tool that lets you annotate, approve, or request changes on agent plans before implementation. Adding it ensures every managed machine has plan review capabilities out of the box.

## What Changes

- Add `plannotator@plannotator` to `enabledPlugins` in `dot_claude/settings.json.tmpl`

## Capabilities

### New Capabilities

_None — this is a configuration addition to an existing dotfile, not a new managed capability._

### Modified Capabilities

_None — no existing specs are affected. The Claude Code settings file is not covered by a spec yet._

## Impact

- **Modified file**: `dot_claude/settings.json.tmpl` — one new entry in `enabledPlugins`
- **Target**: `~/.claude/settings.json` on managed machines (via chezmoi)
- **Dependency**: Plannotator CLI must be installed separately (`curl -fsSL https://plannotator.ai/install.sh | bash`) and the plugin added via `/plugin marketplace add backnotprop/plannotator` + `/plugin install plannotator@plannotator` before the setting takes effect
- **Risk**: Minimal — adding a plugin entry for an uninstalled plugin is harmless; Claude Code ignores unknown plugin references gracefully
