## ADDED Requirements

### Requirement: Commander plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"commander@monolab": true` in the `enabledPlugins` object. Auto-update is inherited from the existing `monolab` entry in `extraKnownMarketplaces` (`autoUpdate: true`); no per-plugin auto-update field is added.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `commander@monolab` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `commander@monolab` entry alongside all other existing plugins

#### Scenario: Plugin not installed

- **WHEN** the Commander plugin has not been installed from the `pabloimrik17/monolab` marketplace on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

#### Scenario: Auto-update inherits from marketplace

- **WHEN** Claude Code refreshes plugins
- **THEN** `commander@monolab` is updated via the `monolab` marketplace entry's `autoUpdate: true` without a separate per-plugin auto-update field in `enabledPlugins`
