# Capability: television-rg-edit-channel

## Purpose

Custom television cable channel for ripgrep-powered search-and-edit, replacing the former `frg()` shell function.

## Requirements

### Requirement: Custom rg-edit cable channel is managed by chezmoi

A chezmoi-managed `dot_config/television/cable/rg-edit.toml` SHALL be deployed to `~/.config/television/cable/rg-edit.toml`. This channel replicates the `frg()` shell function behavior: search file contents with ripgrep, preview with bat highlighting the matched line, and open the selected file in the editor at the exact line.

#### Scenario: rg-edit channel available after chezmoi apply

- **WHEN** `chezmoi apply` runs and the user runs `tv list-channels`
- **THEN** `rg-edit` appears in the channel list

### Requirement: rg-edit source uses ripgrep with line numbers

The channel's `[source]` command SHALL use `rg --line-number --no-heading --color=never` to produce output in `file:line:content` format. Requirements: `rg` and `bat`.

#### Scenario: Source output format

- **WHEN** tv launches the rg-edit channel
- **THEN** each entry displays as `filepath:linenumber:matched content`

### Requirement: rg-edit preview shows bat with line highlight

The channel's `[preview]` command SHALL use `bat --color=always --highlight-line` with the line number extracted from the source output to show the file with the matched line highlighted.

#### Scenario: Preview highlights matched line

- **WHEN** the user selects an entry showing `src/main.rs:42:let x = 5`
- **THEN** the preview panel shows `src/main.rs` with line 42 highlighted

### Requirement: Enter opens file in editor at matched line

The channel SHALL define an action triggered by Enter that opens the selected file in `$EDITOR` at the matched line number using the `-g file:line` flag (VS Code goto syntax). The action mode SHALL be `execute` (replaces tv with the editor). The `$EDITOR` variable is set to `code --wait` in the zshrc; if the editor changes to one with different line-navigation syntax, the channel TOML needs a manual update.

#### Scenario: Enter opens editor at line

- **WHEN** the user presses Enter on an entry showing `src/main.rs:42:let x = 5`
- **THEN** tv exits and `$EDITOR -g src/main.rs:42` runs, opening the file at line 42
