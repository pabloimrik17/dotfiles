## Purpose

Configure the Starship prompt with Catppuccin Mocha theming and custom module settings.

## Requirements

### Requirement: Catppuccin mocha palette definition

The `dot_config/starship.toml` SHALL define a `[palettes.catppuccin_mocha]` section containing all 26 catppuccin-mocha named colors (rosewater through crust) with their hex values. The top-level `palette` key SHALL be set to `'catppuccin_mocha'`.

#### Scenario: Palette is active

- **WHEN** starship loads the config
- **THEN** module styles can reference catppuccin color names (e.g., `mauve`, `sapphire`) instead of ANSI names or hex codes

#### Scenario: All 26 colors defined

- **WHEN** inspecting the `[palettes.catppuccin_mocha]` section
- **THEN** it contains exactly: rosewater, flamingo, pink, mauve, red, maroon, peach, yellow, green, teal, sky, sapphire, blue, lavender, text, subtext1, subtext0, overlay2, overlay1, overlay0, surface2, surface1, surface0, base, mantle, crust

### Requirement: Selective module style overrides

Only `directory`, `git_branch`, and `git_status` modules SHALL have their `style` overridden to use palette color names. All other modules SHALL retain their default ANSI-based styles.

#### Scenario: Directory uses sapphire

- **WHEN** the directory module renders
- **THEN** its style is `bold sapphire`

#### Scenario: Git branch uses mauve

- **WHEN** the git_branch module renders
- **THEN** its style is `bold mauve`

#### Scenario: Unmodified modules keep defaults

- **WHEN** a module not listed above renders (e.g., nodejs, python)
- **THEN** it uses Starship's built-in default style (resolved through Ghostty's ANSI mapping)

### Requirement: Directory truncation with repo awareness

The `[directory]` section SHALL set `truncate_to_repo = true`, `truncation_symbol = "…/"`, and `truncation_length = 3` explicitly. The preset's `read_only` symbol SHALL be preserved.

#### Scenario: Inside a git repo

- **WHEN** the current directory is inside a git repository
- **THEN** the directory path is shown relative to the repository root

#### Scenario: Truncation indicator

- **WHEN** the directory path exceeds the truncation length
- **THEN** the truncated portion is replaced with `…/`

#### Scenario: Preset symbol preserved

- **WHEN** the directory is read-only
- **THEN** the Nerd Font preset read-only symbol (` 󰌾`) is shown

### Requirement: Git status with split index/worktree counts and stash indicator

The `[git_status]` section SHALL display commit counts for ahead (`⇡${count}`) and behind (`⇣${count}`), full divergence info (`⇕⇡${ahead_count}⇣${behind_count}`), and a stash indicator (`≡`).

The status SHALL render index changes (staged) and worktree changes (unstaged) as separate visual groups via the `index_added`, `index_modified`, `index_deleted`, `worktree_added`, `worktree_modified`, and `worktree_deleted` variables. Index variables SHALL render with green styling and worktree variables SHALL render with red styling. Untracked files SHALL render via the `untracked` variable. The legacy single-symbol `$all_status` form SHALL NOT be used.

#### Scenario: Ahead by N commits

- **WHEN** the local branch is ahead of remote by 3 commits
- **THEN** the git status shows `⇡3`

#### Scenario: Behind by N commits

- **WHEN** the local branch is behind remote by 5 commits
- **THEN** the git status shows `⇣5`

#### Scenario: Diverged branches

- **WHEN** the local branch has diverged (2 ahead, 4 behind)
- **THEN** the git status shows `⇕⇡2⇣4`

#### Scenario: Stash exists

- **WHEN** the git stash has entries
- **THEN** the git status shows `≡`

#### Scenario: Only staged changes

- **WHEN** one file is added to the index and no files are modified in the worktree
- **THEN** the git status renders the index group in green (e.g., `+1`) and renders no worktree group

#### Scenario: Only unstaged changes

- **WHEN** one file is modified in the worktree and the index is empty
- **THEN** the git status renders the worktree group in red (e.g., `~1`) and renders no index group

#### Scenario: Both staged and unstaged changes

- **WHEN** one file is staged and another is modified in the worktree
- **THEN** the git status renders both groups distinctly: an index group in green and a worktree group in red, visually separable

#### Scenario: Untracked files

- **WHEN** there are untracked files in the worktree
- **THEN** the git status renders the `untracked` variable distinct from the index/worktree groups

### Requirement: Explicit character module

The `[character]` section SHALL define `success_symbol = '[❯](bold green)'`, `error_symbol = '[❯](bold red)'`, and `vimcmd_symbol = '[❮](bold green)'`.

#### Scenario: Last command succeeded

- **WHEN** the previous command exited with code 0
- **THEN** the prompt character is `❯` in bold green

#### Scenario: Last command failed

- **WHEN** the previous command exited with a non-zero code
- **THEN** the prompt character is `❯` in bold red

#### Scenario: Vi normal mode

- **WHEN** the shell is in vi command mode
- **THEN** the prompt character is `❮` in bold green

### Requirement: Explicit command duration config

The `[cmd_duration]` section SHALL set `min_time = 2_000`, `style = 'yellow'`, and `show_milliseconds = false`.

#### Scenario: Long command

- **WHEN** a command takes longer than 2 seconds
- **THEN** the duration is shown in yellow without milliseconds

#### Scenario: Short command

- **WHEN** a command completes in under 2 seconds
- **THEN** no duration is shown

### Requirement: Disable unused modules

The following modules SHALL be set to `disabled = true`: `hg_branch`, `fossil_branch`, `pijul_channel`, `conda`, `guix_shell`, `nix_shell`. All programming language modules (python, rust, golang, java, ruby, etc.) SHALL remain enabled with auto-detection.

#### Scenario: Entering a Mercurial repo

- **WHEN** the user enters a directory containing a `.hg` folder
- **THEN** no Mercurial branch information is shown in the prompt

#### Scenario: Entering a Rust project

- **WHEN** the user enters a directory containing `Cargo.toml`
- **THEN** the Rust version is shown (auto-detect remains active)

### Requirement: Preserve Nerd Font Symbols preset

All existing symbol overrides from the Nerd Font Symbols Preset SHALL be preserved. New configuration sections SHALL add to or merge with preset entries, never remove them.

#### Scenario: Existing symbol override with new config

- **WHEN** a module has both a preset symbol (e.g., `[directory]` `read_only`) and new config (e.g., `truncate_to_repo`)
- **THEN** both the preset symbol and the new config are present in the section
