## Why

SuperWhisper is already installed via `brew install --cask superwhisper`, but its Claude Code plugin (`superwhisper@superwhisper`) is not declared in chezmoi. Fresh machines provisioned via `chezmoi apply` therefore lack the voice-notification + voice-reply integration between SuperWhisper and Claude Code, so users have to discover and register the marketplace manually after every install. This change closes that gap (Linear DOT-20).

## What Changes

- Add `"superwhisper@superwhisper": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`.
- Add a `superwhisper` entry to `extraKnownMarketplaces` pointing at GitHub repo `superultrainc/superwhisper-claude-code` with `autoUpdate: true`.
- Append `superultrainc/superwhisper-claude-code` to the `CC_MARKETPLACES` array in `run_onchange_install-packages.sh.tmpl`.
- Append `superwhisper@superwhisper` to the `CC_PLUGINS` array in the same file so it is registered/installed inside the existing Claude Code plugin dependencies group.

No breaking changes — all edits are additive and rely on the same patterns established by the beads/code-simplifier plugins.

## Capabilities

### New Capabilities

_(none — this change extends an existing capability)_

### Modified Capabilities

- `claude-code-plugins`: adds the SuperWhisper plugin and its marketplace to the chezmoi-managed Claude Code configuration and install script.

## Impact

- **Files**:
    - `dot_claude/settings.json.tmpl` — add one entry to `enabledPlugins`, one entry to `extraKnownMarketplaces`.
    - `run_onchange_install-packages.sh.tmpl` — add one entry to `CC_MARKETPLACES`, one entry to `CC_PLUGINS`.
- **Dependencies**: SuperWhisper macOS app (already covered by the `superwhisper` cask in `gui-app-install`) and the `claude` CLI (existing prerequisite of the plugin dependencies group).
- **Runtime behavior**: If the SuperWhisper app is not installed, the plugin's `superwhisper://` deeplink simply does nothing — Claude Code keeps working normally, matching the inert-on-missing pattern already used by other plugins in this repo.
- **No breaking changes**.
