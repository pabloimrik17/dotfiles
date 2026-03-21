## ADDED Requirements

### Requirement: Expo consolidated plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"expo@expo-plugins": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `expo@expo-plugins` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `expo@expo-plugins` entry alongside all other existing plugins

## REMOVED Requirements

### Requirement: Individual Expo skill plugins are enabled by default

The following three individual plugin entries SHALL be removed from `enabledPlugins` in `dot_claude/settings.json.tmpl`:

- `expo-app-design@expo-plugins`
- `upgrading-expo@expo-plugins`
- `expo-deployment@expo-plugins`

**Reason**: The upstream `expo/skills` repo consolidated these three plugins into a single `expo` plugin. The old plugin names no longer exist in the repo and resolve only from stale local cache. All three contain identical skill sets (11 skills each), so their removal causes no loss of functionality.

**Migration**: The `expo@expo-plugins` plugin (added in this change) provides the same 11 skills. No user action required — `chezmoi apply` handles the transition automatically.
