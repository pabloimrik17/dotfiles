## Why

The `expo/skills` repo consolidated three separate plugins (`expo-app-design`, `upgrading-expo`, `expo-deployment`) into a single `expo` plugin (expo/skills@3cd151c, 2026-03-13). The chezmoi settings template still references the three old names — which are no longer in the repo — and is missing the new consolidated `expo@expo-plugins` entry. This causes 33 duplicate skill registrations (3 x 11 identical skills) and will break when the stale cache entries are cleared.

## What Changes

- Add `"expo@expo-plugins": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`
- Remove `"expo-app-design@expo-plugins": true` from `enabledPlugins`
- Remove `"upgrading-expo@expo-plugins": true` from `enabledPlugins`
- Remove `"expo-deployment@expo-plugins": true` from `enabledPlugins`

## Capabilities

### New Capabilities

_(none — this modifies an existing capability)_

### Modified Capabilities

- `claude-code-plugins`: Adding a new plugin enablement requirement (`expo@expo-plugins`) and removing three stale plugin entries that no longer exist in the upstream `expo/skills` repo.

## Impact

- **File**: `dot_claude/settings.json.tmpl` — 1 line added, 3 lines removed (net -2 lines)
- **Dependencies**: No new marketplace entries needed; `expo-plugins` marketplace is already configured
- **Risk**: Minimal — the new plugin contains the exact same 11 skills as the three being removed
