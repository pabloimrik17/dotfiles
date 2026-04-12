## ADDED Requirements

### Requirement: eza renders with Catppuccin Mocha blue theme

A chezmoi-managed theme file SHALL exist at `dot_config/eza/theme.yml` deploying to `~/.config/eza/theme.yml`. The file SHALL contain the official Catppuccin Mocha blue theme with colors for:

- File kinds: directories blue (`#89b4fa`), executables green (`#a6e3a1`), symlinks blue, pipes subtext0, devices maroon
- Permissions: read red, write yellow, execute green (bold for user, normal for group/other)
- File sizes: color scale from green (small) to red (large)
- Git status: new green, modified yellow, deleted red, renamed blue

#### Scenario: listing files with eza

- **WHEN** user runs `eza` or any alias using eza (e.g., `ll`, `la`)
- **THEN** file types, permissions, sizes, and git status render with Catppuccin Mocha colors

#### Scenario: config deployed by chezmoi

- **WHEN** `chezmoi apply` is run
- **THEN** `~/.config/eza/theme.yml` is created/updated with the official theme
