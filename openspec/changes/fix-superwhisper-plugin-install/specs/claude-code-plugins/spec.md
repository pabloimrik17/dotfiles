## MODIFIED Requirements

### Requirement: SuperWhisper plugin is enabled by default on Apple Silicon

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"superwhisper@superwhisper": true` in the `enabledPlugins` object only when chezmoi renders the template on `darwin/arm64`. The entry SHALL be wrapped in a `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}` block. On any other architecture or OS the entry SHALL be absent from the rendered settings file. The rationale for the gate is that the plugin's hook binary at `/Applications/superwhisper.app/Contents/Resources/claude-hook` is `arm64`-only, so enabling the plugin on Intel causes "Bad CPU type in executable" errors on every stop hook.

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

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `superwhisper` entry in `extraKnownMarketplaces` with source `github` and repo `superultrainc/superwhisper-claude-code`, with `autoUpdate` set to `true`, only when chezmoi renders the template on `darwin/arm64`. The entry SHALL be wrapped in the same `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}` guard as the plugin entry, and SHALL include the leading comma inside the conditional block so the surrounding JSON stays valid on Intel.

#### Scenario: Fresh machine setup on Apple Silicon

- **WHEN** `chezmoi apply` is run on a `darwin/arm64` machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `superwhisper` in `extraKnownMarketplaces` pointing to `superultrainc/superwhisper-claude-code`

#### Scenario: Fresh machine setup on Intel Mac

- **WHEN** `chezmoi apply` is run on a `darwin/amd64` machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created without the `superwhisper` marketplace block, and the surrounding `extraKnownMarketplaces` JSON remains valid

#### Scenario: Marketplace auto-updates on Apple Silicon

- **WHEN** Claude Code checks for plugin updates on a `darwin/arm64` machine
- **THEN** the SuperWhisper marketplace is included in the auto-update cycle because `autoUpdate` is `true`

### Requirement: SuperWhisper plugin is installed via the upstream installer on Apple Silicon

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL NOT include `superultrainc/superwhisper-claude-code` in the `CC_MARKETPLACES` array, and SHALL NOT include `superwhisper@superwhisper` in the `CC_PLUGINS` array. Instead, the script SHALL contain a dedicated step, gated by `{{ if and (eq .chezmoi.os "darwin") (eq .chezmoi.arch "arm64") }} ... {{ end }}`, that:

1. Checks for `/Applications/superwhisper.app` and skips with a warning if absent.
2. Checks `claude plugin list 2>/dev/null` for `superwhisper@superwhisper` and skips with an "already installed" message if present.
3. Otherwise prompts the user with `confirm` and, on `Y`, runs `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash`.

The step SHALL warn (and skip) if the `claude` CLI is not available. Failures from the installer SHALL be reported via the existing `error` helper and SHALL NOT abort the script.

#### Scenario: First run on Apple Silicon with app installed

- **WHEN** `chezmoi apply` runs the install script on a `darwin/arm64` host where `/Applications/superwhisper.app` exists and `claude plugin list` does not yet include `superwhisper@superwhisper`, and the user confirms the SuperWhisper prompt
- **THEN** the script runs `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash` once

#### Scenario: Re-run on Apple Silicon after install

- **WHEN** `chezmoi apply` runs the install script on a `darwin/arm64` host where `claude plugin list` already contains `superwhisper@superwhisper`
- **THEN** the SuperWhisper step prints an "already installed" message and skips the installer

#### Scenario: SuperWhisper app missing on Apple Silicon

- **WHEN** `chezmoi apply` runs the install script on a `darwin/arm64` host where `/Applications/superwhisper.app` does not exist
- **THEN** the SuperWhisper step prints a warning ("SuperWhisper.app not installed — skipping plugin install") and the rest of the script continues

#### Scenario: Intel Mac

- **WHEN** `chezmoi apply` runs the install script on a `darwin/amd64` host
- **THEN** the SuperWhisper step is absent from the rendered script entirely (the chezmoi template guard evaluates to false)

#### Scenario: Claude CLI not available

- **WHEN** the host is `darwin/arm64` but the `claude` CLI is not installed
- **THEN** the SuperWhisper step prints a warning and skips, without invoking the installer

#### Scenario: User declines the prompt

- **WHEN** the host is `darwin/arm64`, the app exists, the plugin is not yet installed, and the user answers `n` at the SuperWhisper prompt
- **THEN** the installer is not invoked, the script prints "Skipping SuperWhisper plugin", and continues to the next group
