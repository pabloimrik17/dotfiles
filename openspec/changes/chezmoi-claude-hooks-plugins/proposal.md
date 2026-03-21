## Why

The chezmoi template `dot_claude/settings.json.tmpl` is out of sync with plugins, marketplaces, and hooks installed locally. Fresh machines provisioned via chezmoi will be missing the beads issue tracker, the code-simplifier plugin, and the `bd prime` session hooks. Closes #72, #73, #77.

## What Changes

- Add `beads@beads-marketplace` to `enabledPlugins`
- Add `code-simplifier@claude-plugins-official` to `enabledPlugins`
- Add `beads-marketplace` entry (steveyegge/beads) to `extraKnownMarketplaces`
- Add new top-level `hooks` key with `PreCompact` and `SessionStart` entries that run `bd prime`

## Capabilities

### New Capabilities

- `claude-hooks`: Claude Code hook configuration managed by chezmoi — hook definitions in settings template for session lifecycle events (SessionStart, PreCompact)

### Modified Capabilities

- `claude-code-plugins`: Adding beads and code-simplifier plugins to enabled plugins, and beads-marketplace to known marketplaces

## Impact

- **File**: `dot_claude/settings.json.tmpl` (single file, additive changes only)
- **Dependencies**: `bd` CLI must be available on PATH for hooks to function (no-ops gracefully if absent or if `.beads/` doesn't exist)
- **No breaking changes**: all additions are additive to existing config
