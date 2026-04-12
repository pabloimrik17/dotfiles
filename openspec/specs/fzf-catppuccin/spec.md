# fzf-catppuccin Specification

## Purpose

Configure fzf fuzzy finder to use the official Catppuccin Mocha color scheme via `--color` flags in `FZF_DEFAULT_OPTS`.

## Requirements

### Requirement: fzf renders with Catppuccin Mocha colors

The fzf fuzzy finder SHALL display UI elements using the official Catppuccin Mocha color scheme via `--color` flags in `FZF_DEFAULT_OPTS`. The color block SHALL use the exact values from the official `catppuccin/fzf` port:

- `bg+:#313244` (Surface0 — selected line)
- `bg:#1E1E2E` (Base — background)
- `spinner:#F5E0DC` (Rosewater)
- `hl:#F38BA8` (Red — match highlight)
- `fg:#CDD6F4` (Text)
- `header:#F38BA8` (Red)
- `info:#CBA6F7` (Mauve)
- `pointer:#F5E0DC` (Rosewater)
- `marker:#B4BEFE` (Lavender)
- `fg+:#CDD6F4` (Text — selected line text)
- `prompt:#CBA6F7` (Mauve)
- `hl+:#F38BA8` (Red — selected match highlight)
- `selected-bg:#45475A` (Surface1)
- `border:#6C7086` (Overlay0)
- `label:#CDD6F4` (Text)

#### Scenario: fzf launched in terminal

- **WHEN** user invokes fzf (Ctrl+T, Ctrl+R via atuin excluded, or direct `fzf` command)
- **THEN** the fzf UI renders with Catppuccin Mocha colors for all elements (background, text, highlights, borders, pointer, spinner)

#### Scenario: color block coexists with existing layout options

- **WHEN** `FZF_DEFAULT_OPTS` is evaluated
- **THEN** the `--color` flags SHALL be appended after the existing layout flags (`--height`, `--layout`, `--border`, `--preview`, `--preview-window`, `--bind`) without replacing them
