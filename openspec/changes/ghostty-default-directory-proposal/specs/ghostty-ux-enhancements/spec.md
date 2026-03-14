## ADDED Requirements

### Requirement: Explicit working directory defaults to home

The Ghostty config SHALL include `working-directory = home` to ensure that the default working directory is always `$HOME`, regardless of how Ghostty is launched (Dock, Spotlight, CLI, or launchd).

#### Scenario: Ghostty launched from Dock

- **WHEN** the user launches Ghostty from the macOS Dock
- **THEN** the initial terminal surface opens at `$HOME`

#### Scenario: Ghostty launched from CLI

- **WHEN** the user launches Ghostty from an existing terminal session in `/some/deep/path`
- **THEN** the initial terminal surface opens at `$HOME` (not `/some/deep/path`)

## MODIFIED Requirements

### Requirement: New tabs and splits inherit working directory

The Ghostty config SHALL include differentiated working directory inheritance:

- `tab-inherit-working-directory = false` — new tabs start at the default working directory (`$HOME`)
- `split-inherit-working-directory = true` — new splits inherit the current surface's working directory
- `window-inherit-working-directory = false` — new windows start at the default working directory (`$HOME`)

This replaces the previous "all inherit = true" policy with a split-only inheritance model. Tabs and windows default to `$HOME` for fresh context; splits inherit for contextual side-by-side work.

#### Scenario: New tab starts at home

- **WHEN** the user is in `~/projects/myapp` and opens a new tab with Cmd+T
- **THEN** the new tab starts at `$HOME`

#### Scenario: New split inherits directory

- **WHEN** the user is in `~/projects/myapp` and creates a split
- **THEN** the new split starts in `~/projects/myapp`

#### Scenario: New window starts at home

- **WHEN** the user is in `~/projects/myapp` and opens a new window with Cmd+N
- **THEN** the new window starts at `$HOME`

#### Scenario: First window uses home

- **WHEN** Ghostty launches with no previous terminal surface
- **THEN** the working directory is `$HOME`
