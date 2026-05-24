# Capability: claude-code-plugins

## Purpose

Claude Code plugin configuration and installation managed by chezmoi -- plugin enablement in settings and CLI tool installation via setup scripts.

## Requirements

### Requirement: Plannotator plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"plannotator@plannotator": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `plannotator@plannotator` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include the `plannotator@plannotator` entry alongside all other existing plugins

#### Scenario: Plugin not installed

- **WHEN** the Plannotator CLI and marketplace plugin have not been installed on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Plannotator CLI is installed via chezmoi run_once script

The install script (`run_once_install-packages.sh.tmpl`) SHALL include a dedicated group that installs the Plannotator CLI using `curl -fsSL https://plannotator.ai/install.sh | bash`. The group MUST prompt for confirmation before installing and MUST skip installation if the `plannotator` command is already available. The group SHALL be named "Claude Code plugin dependencies" and SHALL be separate from the agent skills group.

#### Scenario: First run on clean machine

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the Plannotator CLI is installed via the official install script

#### Scenario: Already installed

- **WHEN** the `plannotator` command is already available on the machine
- **THEN** the install group skips installation and reports it as already installed

#### Scenario: User declines

- **WHEN** the user declines the confirmation prompt for Claude Code plugin dependencies
- **THEN** the Plannotator CLI is not installed and the script continues to the next group

#### Scenario: Non-macOS platform

- **WHEN** the install script runs on a non-macOS platform
- **THEN** manual installation instructions for plannotator are displayed, including the `curl -fsSL https://plannotator.ai/install.sh | bash` command

### Requirement: Expo consolidated plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"expo@expo-plugins": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `expo@expo-plugins` listed in `enabledPlugins`

#### Scenario: Existing settings updated

- **WHEN** `chezmoi apply` is run on a machine with an older version of the managed settings file
- **THEN** the file is updated to include `expo@expo-plugins` in `enabledPlugins`, and the deprecated entries `expo-app-design@expo-plugins`, `upgrading-expo@expo-plugins`, and `expo-deployment@expo-plugins` are no longer present

### Requirement: Beads plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"beads@beads-marketplace": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `beads@beads-marketplace` listed in `enabledPlugins`

#### Scenario: Plugin not installed

- **WHEN** the beads marketplace plugin has not been fetched yet on the machine
- **THEN** the `enabledPlugins` entry is inert and Claude Code operates normally without errors

### Requirement: Beads marketplace is registered

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include a `beads-marketplace` entry in `extraKnownMarketplaces` with source `github` and repo `steveyegge/beads`, with `autoUpdate` set to `true`.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `beads-marketplace` in `extraKnownMarketplaces` pointing to `steveyegge/beads`

#### Scenario: Marketplace auto-updates

- **WHEN** Claude Code checks for plugin updates
- **THEN** the beads marketplace is included in the auto-update cycle because `autoUpdate` is `true`

### Requirement: Claude CLI commands use PTY wrapper on macOS

The `run_claude_step()` helper SHALL wrap Claude CLI commands with `script -q` on macOS to provide a pseudo-TTY. This works around a Bun runtime crash (oven-sh/bun#24158) where `tty.WriteStream` fails with `EINVAL kqueue` when given a non-TTY file descriptor. On non-macOS platforms, commands run directly. The wrapper SHALL capture output and display it only on failure, filtering Bun runtime noise. The wrapper SHALL always return 0 to avoid halting the install script.

#### Scenario: Claude plugin install on macOS

- **WHEN** `run_claude_step` executes a `claude plugin` command on macOS
- **THEN** the command runs inside a `script -q` pseudo-TTY wrapper

#### Scenario: Command fails with useful error

- **WHEN** a wrapped Claude CLI command fails
- **THEN** the error output is shown (unless it is Bun runtime noise like kqueue/isTTY errors)
- **AND** the script continues to the next step

#### Scenario: Pre-scan commands run without wrapper

- **WHEN** `claude plugin marketplace list --json` or `claude plugin list --json` run for pre-scan
- **THEN** they execute directly (without `script`) since read-only commands do not trigger the Bun crash

### Requirement: Beads plugin and marketplace are registered in install script

The install script (`run_onchange_install-packages.sh.tmpl`) SHALL register the `beads-marketplace` marketplace (`steveyegge/beads`) and install the `beads@beads-marketplace` plugin in the Claude Code plugin dependencies group. Before registering a marketplace, the script SHALL check `claude plugin marketplace list --json` and skip if the marketplace repo is already registered. Before installing a plugin, the script SHALL check `claude plugin list --json` and skip if the plugin ID is already installed.

#### Scenario: First run with Claude Code installed

- **WHEN** `chezmoi apply` runs the install script and the user confirms the Claude Code plugin dependencies group
- **THEN** the beads marketplace is registered via `claude plugin marketplace add steveyegge/beads` and the beads plugin is installed via `claude plugin install beads@beads-marketplace`

#### Scenario: Claude Code not installed

- **WHEN** `claude` is not available on the machine
- **THEN** the Claude Code plugin dependencies group is skipped with a warning

#### Scenario: Marketplace already registered

- **WHEN** `claude plugin marketplace list --json` output contains the marketplace repo
- **THEN** the marketplace registration is skipped with an "already registered" message

#### Scenario: Plugin already installed

- **WHEN** `claude plugin list --json` output contains the plugin ID
- **THEN** the plugin installation is skipped with an "already installed" message

#### Scenario: All marketplaces and plugins already present

- **WHEN** every marketplace and every plugin in the group are already registered/installed
- **THEN** the script prints a summary ("CC marketplaces: N/N registered", "CC plugins: N/N installed") and skips the group without prompting

### Requirement: Code-simplifier plugin is enabled by default

The Claude Code settings dotfile (`dot_claude/settings.json.tmpl`) SHALL include `"code-simplifier@claude-plugins-official": true` in the `enabledPlugins` object.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without Claude Code settings
- **THEN** `~/.claude/settings.json` is created with `code-simplifier@claude-plugins-official` listed in `enabledPlugins`

#### Scenario: Marketplace already configured

- **WHEN** the `claude-plugins-official` marketplace is already present in `extraKnownMarketplaces`
- **THEN** no additional marketplace entry is needed for code-simplifier

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
