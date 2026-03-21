## Why

The chezmoi template `dot_claude/settings.json.tmpl` is out of sync with plugins, marketplaces, and hooks installed locally. Fresh machines provisioned via chezmoi will be missing the beads issue tracker, the code-simplifier plugin, and the `bd prime` session hooks. Closes #72, #73, #77.

## What Changes

- Add `beads@beads-marketplace` to `enabledPlugins`
- Add `code-simplifier@claude-plugins-official` to `enabledPlugins`
- Add `beads-marketplace` entry (steveyegge/beads) to `extraKnownMarketplaces`
- Add new top-level `hooks` key with `PreCompact` and `SessionStart` entries that run `bd prime`
- Add `bd` to brew packages in `run_once_install-packages.sh.tmpl`
- Add beads plugin/marketplace registration to Claude Code plugin dependencies group in `run_once_install-packages.sh.tmpl`

## Capabilities

### New Capabilities

- `claude-hooks`: Claude Code hook configuration managed by chezmoi — hook definitions in settings template for session lifecycle events (SessionStart, PreCompact)

### Modified Capabilities

- `claude-code-plugins`: Adding beads and code-simplifier plugins to enabled plugins, and beads-marketplace to known marketplaces

## Impact

- **Files**: `dot_claude/settings.json.tmpl` and `run_once_install-packages.sh.tmpl` (additive changes only)
- **Dependencies**: `bd` CLI is installed via brew in the run_once script; required on PATH for hooks to function. `bd prime` no-ops gracefully if `.beads/` doesn't exist in the current directory.
- **No breaking changes**: all additions are additive to existing config
