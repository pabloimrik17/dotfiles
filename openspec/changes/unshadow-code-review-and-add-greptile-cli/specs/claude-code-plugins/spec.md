# Spec Delta

## ADDED Requirements

### Requirement: Plugins removed without a replacement

The install script SHALL keep a list of plugins removed without a replacement, separate from `CC_PLUGINS` and from the replaced-plugin pairs. In the confirmed plugin group it SHALL uninstall each listed plugin that is installed, counting them with the plugins to retire. Managed settings SHALL delete each listed plugin's `enabledPlugins` key. `code-review@claude-plugins-official` is listed.

#### Scenario: Listed plugin is installed

- **WHEN** the confirmed plugin group runs with `code-review@claude-plugins-official` installed
- **THEN** it runs `claude plugin uninstall code-review@claude-plugins-official`
- **AND** `claude plugin list` no longer shows it

#### Scenario: Listed plugin is absent

- **WHEN** no listed plugin is installed and nothing else is pending
- **THEN** the plugin group reports everything installed and asks no confirmation

#### Scenario: Plugin group declined

- **WHEN** the plugin group is declined with `code-review@claude-plugins-official` installed
- **THEN** the plugin stays installed

#### Scenario: Managed settings applied

- **WHEN** managed settings are applied to a live file holding `"code-review@claude-plugins-official": true` in `enabledPlugins`
- **THEN** the key is deleted and every other `enabledPlugins` key remains

#### Scenario: Plugin arrays are inspected

- **WHEN** the install script and the managed settings template are rendered
- **THEN** neither `CC_PLUGINS` nor the managed `enabledPlugins` object names `code-review@claude-plugins-official`
