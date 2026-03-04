# Capability: opencode-user-config

## Purpose

User-level OpenCode configuration managed by chezmoi -- global editor settings, TUI theming, and plugin curation deployed to `~/.config/opencode/`.

## Requirements

### Requirement: chezmoi manages OpenCode main config

The system SHALL include a `dot_config/opencode/opencode.jsonc` file in the chezmoi source tree that deploys to `~/.config/opencode/opencode.jsonc`.

The file SHALL contain:

- A `$schema` reference to `https://opencode.ai/config.json`
- `model` set to `anthropic/claude-opus-4-6`
- `tui.scroll_acceleration.enabled` set to `true`
- A `plugin` array with curated OpenCode plugins (DCP, Plannotator, WakaTime, websearch-cited)
- A `formatter` section registering `oxfmt` as a custom formatter
- A `permissions` section with granular bash allowlists for read-only filesystem/git commands, `ask` for edits and web fetches, and `deny` for doom loops

The file SHALL NOT contain MCP server configuration (these stay per-project) or settings where OpenCode's default is sufficient (e.g., `autoupdate`).

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode config
- **THEN** `~/.config/opencode/opencode.jsonc` is created with the default model setting

#### Scenario: Project config overrides global

- **WHEN** a project has its own `opencode.json` with a different `model` value
- **THEN** the project-level model takes precedence over the global config

### Requirement: chezmoi manages OpenCode TUI config

The system SHALL include a `dot_config/opencode/tui.json` file in the chezmoi source tree that deploys to `~/.config/opencode/tui.json`.

The file SHALL contain:

- A `$schema` reference to `https://opencode.ai/tui.json`
- `theme` set to `catppuccin-macchiato`

#### Scenario: Theme applied on setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode TUI config
- **THEN** `~/.config/opencode/tui.json` is created and OpenCode uses the `catppuccin-macchiato` theme

### Requirement: Existing OpenCode state is not affected

chezmoi SHALL NOT manage any files in `~/.local/state/opencode/`, `~/.local/share/opencode/`, or `~/.config/opencode/package.json`.

#### Scenario: Runtime state preserved

- **WHEN** `chezmoi apply` is run on a machine with existing OpenCode runtime state
- **THEN** `kv.json`, `model.json`, `auth.json`, and `package.json` are untouched
