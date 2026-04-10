## Purpose

Manage the assets directory structure for README images and screenshots.

## Requirements

### Requirement: Assets directory structure

Repo SHALL have an `assets/` directory at root for storing README images. The directory SHALL contain a `.gitkeep` file to ensure Git tracks it before any screenshots are added.

#### Scenario: Directory exists

- **WHEN** implementation is complete
- **THEN** `assets/` directory exists at repo root with a `.gitkeep` placeholder

### Requirement: Chezmoi ignores assets

`.chezmoiignore.tmpl` SHALL include `assets/` so chezmoi does not attempt to apply screenshot files to the home directory.

#### Scenario: chezmoi apply with assets present

- **WHEN** user runs `chezmoi apply` and `assets/` contains PNG files
- **THEN** chezmoi ignores the `assets/` directory entirely

### Requirement: Screenshot naming convention

Screenshots SHALL be named `terminal-overview.png` (hero image). Optional secondary: `terminal-tree.png`.

#### Scenario: User takes screenshots following convention

- **WHEN** user follows the documented manual steps
- **THEN** they save files as `assets/terminal-overview.png`

### Requirement: Manual screenshot steps documented in tasks

Tasks SHALL include a MANUAL task with exact steps: open Ghostty at ~120x35, cd to a git repo, run `lt`, screenshot as `assets/terminal-overview.png`, optional pngquant optimization.

#### Scenario: User reads manual task

- **WHEN** user reaches the manual screenshot task
- **THEN** they have clear step-by-step instructions to capture the hero image
