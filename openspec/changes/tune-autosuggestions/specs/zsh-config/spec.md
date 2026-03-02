## ADDED Requirements

### Requirement: Autosuggestions plugin is tuned for performance and visual coherence

The `zsh-autosuggestions` plugin SHALL be configured with a highlight style, buffer size limit, and async mode. The highlight style SHALL use colors from the catppuccin-mocha palette. Commented alternative color presets SHALL be included above the active setting for quick switching.

#### Scenario: Suggestion text uses Mauve on Surface 2 highlight

- **WHEN** a user types a partial command that matches history
- **THEN** the suggested completion text renders with foreground `#cba6f7` (Mauve) and background `#585b70` (Surface 2)

#### Scenario: Suggestions skip lookup for long commands

- **WHEN** the current command buffer exceeds 20 characters
- **THEN** autosuggestions does not perform a history lookup (no suggestion displayed)

#### Scenario: Suggestions are fetched asynchronously

- **WHEN** a user types and a suggestion lookup is triggered
- **THEN** the lookup runs in the background without blocking keyboard input

#### Scenario: Alternative color presets are available as comments

- **WHEN** a user opens `dot_zshrc.tmpl`
- **THEN** commented lines above the active `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE` show at least two alternative color values with labels
