## ADDED Requirements

### Requirement: Claude Code fullscreen preference and controls are documented

Section 11 of `docs/manual.html` SHALL describe `"tui": "fullscreen"` as the chezmoi-managed user preference and distinguish terminal fullscreen rendering from maximizing the terminal window. It SHALL document the built-in renderer controls separately from plugin-provided commands.

#### Scenario: Reader finds the managed default

- **WHEN** a reader consults the Claude Code section
- **THEN** the manual SHALL identify `~/.claude/settings.json` and `"tui": "fullscreen"` as the applied user preference
- **AND** it SHALL explain that fullscreen uses the terminal's alternate screen

#### Scenario: Reader inspects or switches renderers

- **WHEN** a reader consults the renderer controls
- **THEN** the manual SHALL list `/tui` for inspecting the active renderer, `/tui fullscreen` for enabling fullscreen, and `/tui default` for returning to the classic renderer
- **AND** it SHALL explain that a subsequent successful `chezmoi apply` restores the managed fullscreen preference

#### Scenario: Reader needs a temporary or persistent opt-out

- **WHEN** a reader wants the classic renderer for a directly launched interactive session
- **THEN** the manual SHALL document `CLAUDE_CODE_DISABLE_ALTERNATE_SCREEN=1 claude` as a launch-specific override
- **AND** it SHALL explain that a persistent managed opt-out requires changing the source `tui` value to `"default"` and applying it

#### Scenario: Reader navigates a fullscreen conversation

- **WHEN** a reader consults the fullscreen navigation instructions
- **THEN** the manual SHALL document `Ctrl+o` followed by `/` for transcript search and `PgUp` / `PgDn` for scrolling
- **AND** it SHALL explain that native terminal scrollback search does not search the fullscreen transcript

#### Scenario: Reader checks terminal compatibility

- **WHEN** a reader consults the fullscreen subsection
- **THEN** it SHALL link to the official fullscreen guide and identify the feature as a research preview
- **AND** it SHALL note that ordinary tmux sessions need mouse mode for wheel scrolling and that fullscreen is incompatible with `tmux -CC`
