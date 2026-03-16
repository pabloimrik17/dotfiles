# Capability: ghostty-transparency

## Purpose

Configure Ghostty's background transparency and blur settings to allow the desktop wallpaper to subtly tint through the terminal, with documented alternative presets for quick adjustment.

## Requirements

### Requirement: Background opacity is configured

The Ghostty config SHALL include `background-opacity = 0.96` to allow the desktop wallpaper to subtly tint through the terminal background.

#### Scenario: Opacity is set

- **WHEN** a user opens a Ghostty terminal window
- **THEN** the config contains `background-opacity = 0.96` and the terminal background is slightly translucent

### Requirement: Background blur is configured

The Ghostty config SHALL include `background-blur = 12` to diffuse any content visible through the translucent background (desktop icons, folders, wallpaper details).

#### Scenario: Blur is set

- **WHEN** a user opens a Ghostty terminal window with background-opacity < 1
- **THEN** the config contains `background-blur = 12` and content behind the terminal appears diffused

### Requirement: Transparency section is placed after Theme

The transparency settings SHALL appear in a `# Transparency` section placed immediately after the `# Theme` section and before `# Font`.

#### Scenario: Section ordering

- **WHEN** a user reads the Ghostty config
- **THEN** the `# Transparency` section appears between `# Theme` and `# Font`

### Requirement: Alternative presets are documented as comments

The config SHALL include commented-out alternative presets with brief descriptions so the user can swap values without re-exploring.

#### Scenario: Presets are present as comments

- **WHEN** a user reads the `# Transparency` section
- **THEN** at least three alternative presets are listed as comments with opacity, blur, and a short description for each
