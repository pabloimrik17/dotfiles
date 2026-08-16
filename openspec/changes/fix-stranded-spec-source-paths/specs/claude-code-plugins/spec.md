## MODIFIED Requirements

### Requirement: Plannotator plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include `"plannotator@plannotator": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `plannotator@plannotator` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `plannotator@plannotator` entry alongside all other existing plugins

#### Scenario: Plugin not installed

- **WHEN** the Plannotator CLI and marketplace plugin have not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Expo consolidated plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include `"expo@expo-plugins": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `expo@expo-plugins` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include `expo@expo-plugins` in `enabledPlugins`, and the deprecated entries `expo-app-design@expo-plugins`, `upgrading-expo@expo-plugins`, and `expo-deployment@expo-plugins` are no longer present

### Requirement: Beads plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include `"beads@beads-marketplace": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `beads@beads-marketplace` listed in `enabledPlugins`

#### Scenario: Plugin not installed

- **WHEN** the beads marketplace plugin has not been fetched yet on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Code-simplifier plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include `"code-simplifier@claude-plugins-official": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `code-simplifier@claude-plugins-official` listed in `enabledPlugins`

#### Scenario: Marketplace already configured

- **WHEN** the `claude-plugins-official` marketplace is already present in `extraKnownMarketplaces`
- **THEN** no additional marketplace entry is needed for code-simplifier

### Requirement: SuperWhisper plugin is enabled by default on Apple Silicon

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include `"superwhisper@superwhisper": true` in the `enabledPlugins` object only when chezmoi renders the template on `darwin/arm64`. The entry SHALL be wrapped in a `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}` block. On any other architecture or OS the entry SHALL be absent from the materialized settings file. The rationale for the gate is that the plugin's hook binary at `/Applications/superwhisper.app/Contents/Resources/claude-hook` is `arm64`-only, so enabling the plugin on Intel causes "Bad CPU type in executable" errors on every stop hook.

#### Scenario: Fresh machine setup on Apple Silicon

- **WHEN** `chezmoi apply` is run on a `darwin/arm64` machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `superwhisper@superwhisper` listed in `enabledPlugins`

#### Scenario: Fresh machine setup on Intel Mac

- **WHEN** `chezmoi apply` is run on a `darwin/amd64` machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created without the `superwhisper@superwhisper` entry

#### Scenario: Existing settings updated on Apple Silicon

- **WHEN** `chezmoi apply` is run on a `darwin/arm64` machine with an older version of the managed settings file
- **THEN** the file is updated to include the `superwhisper@superwhisper` entry alongside all other existing plugins

#### Scenario: Existing settings updated on Intel Mac

- **WHEN** `chezmoi apply` is run on a `darwin/amd64` machine with an older version of the managed settings file that previously contained `superwhisper@superwhisper`
- **THEN** the file is rewritten without the `superwhisper@superwhisper` entry

#### Scenario: SuperWhisper app not installed

- **WHEN** the host is `darwin/arm64` but the SuperWhisper macOS app is not present
- **THEN** the `enabledPlugins` entry is still emitted (it is inert without the app) and Claude Code operates normally without errors

### Requirement: SuperWhisper marketplace is registered on Apple Silicon

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include a `superwhisper` entry in `extraKnownMarketplaces` with source `github` and repo `superultrainc/superwhisper-claude-code`, with `autoUpdate` set to `true`, only when chezmoi renders the template on `darwin/arm64`. The entry SHALL be wrapped in the same `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}` guard as the plugin entry, and SHALL include the leading comma inside the conditional block so the surrounding JSON stays valid on Intel.

#### Scenario: Fresh machine setup on Apple Silicon

- **WHEN** `chezmoi apply` is run on a `darwin/arm64` machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `superwhisper` in `extraKnownMarketplaces` pointing to `superultrainc/superwhisper-claude-code`

#### Scenario: Fresh machine setup on Intel Mac

- **WHEN** `chezmoi apply` is run on a `darwin/amd64` machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created without the `superwhisper` marketplace block, and the surrounding `extraKnownMarketplaces` JSON remains valid

#### Scenario: Marketplace auto-updates on Apple Silicon

- **WHEN** Claude Code checks for plugin updates on a `darwin/arm64` machine
- **THEN** the SuperWhisper marketplace is included in the auto-update cycle because `autoUpdate` is `true`

### Requirement: Commander plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/modify_settings.json.tmpl`) SHALL include `"commander@monolab": true` in the `enabledPlugins` object. Auto-update is inherited from the existing `monolab` entry in `extraKnownMarketplaces` (`autoUpdate: true`); no per-plugin auto-update field is added.

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
