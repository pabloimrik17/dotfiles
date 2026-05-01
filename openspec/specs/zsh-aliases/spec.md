## Purpose

Define shell aliases and utility functions for the zsh environment, including navigation shortcuts, package manager aliases (bun, pnpm), eza listing variants, jq helpers, and fzf-powered interactive tools.

## Requirements

### Requirement: Navigation aliases

The zshrc SHALL define aliases `..`, `...`, and `....` that navigate up 1, 2, and 3 directory levels respectively.

#### Scenario: Navigate up one level

- **WHEN** user types `..`
- **THEN** the working directory changes to the parent directory

#### Scenario: Navigate up three levels

- **WHEN** user types `....`
- **THEN** the working directory changes to three levels above the current directory

### Requirement: eza developer views

The zshrc SHALL define four additional eza aliases beyond the existing set (`ls`, `ll`, `la`, `lt`, `lta`): `lla`, `ldev`, `lcode`, and `lsize`. All SHALL include `--icons --group-directories-first`.

#### Scenario: lla shows full detail with hidden files

- **WHEN** user types `lla`
- **THEN** eza lists all files including hidden, in long format with human-readable sizes

#### Scenario: ldev shows git-aware listing hiding gitignored files

- **WHEN** user types `ldev` inside a git repository
- **THEN** eza lists files in long format with git status column, excluding gitignored files

#### Scenario: lcode shows clean project tree

- **WHEN** user types `lcode` inside a project directory
- **THEN** eza displays a 2-level tree excluding `node_modules`, `.git`, `dist`, and `build` directories, hiding gitignored files

#### Scenario: lsize sorts by file size descending

- **WHEN** user types `lsize`
- **THEN** eza lists files in long format sorted by size from largest to smallest

### Requirement: pnpm aliases

The zshrc SHALL define 7 pnpm aliases using the `p` prefix: `pi` (install), `pdv` (dev), `pb` (build), `pt` (test), `pa` (add), `pr` (run), `px` (exec). The `pdv` alias replaces the former `pd` alias for symmetry with the bun `bdv` alias.

#### Scenario: pi runs pnpm install

- **WHEN** user types `pi`
- **THEN** `pnpm install` is executed

#### Scenario: pdv runs pnpm dev

- **WHEN** user types `pdv`
- **THEN** `pnpm dev` is executed

#### Scenario: px runs pnpm exec

- **WHEN** user types `px`
- **THEN** `pnpm exec` is executed

### Requirement: bun aliases

The zshrc SHALL define 7 bun aliases using the `b` prefix: `bi` (install), `bdv` (dev), `bb` (build), `bt` (test), `ba` (add), `br` (run), `bx` (bunx). The `bdv` alias replaces the former `bd` alias to avoid collision with the beads CLI binary at `/opt/homebrew/bin/bd`.

#### Scenario: bi runs bun install

- **WHEN** user types `bi`
- **THEN** `bun install` is executed

#### Scenario: bdv runs bun dev

- **WHEN** user types `bdv`
- **THEN** `bun dev` is executed

#### Scenario: bx runs bunx

- **WHEN** user types `bx`
- **THEN** `bunx` is executed

#### Scenario: bd resolves to beads CLI

- **WHEN** user types `bd` with no alias defined for it
- **THEN** the shell resolves `bd` to `/opt/homebrew/bin/bd` (the beads CLI)

### Requirement: jq aliases

The zshrc SHALL define 3 jq aliases: `jqless` (colorized jq piped to less), `pretty-json` (pretty-print JSON), `check-json` (validate JSON syntax).

#### Scenario: pretty-json formats JSON

- **WHEN** user pipes JSON to `pretty-json`
- **THEN** jq formats and pretty-prints the JSON to stdout

#### Scenario: check-json validates syntax

- **WHEN** user pipes invalid JSON to `check-json`
- **THEN** jq reports a parse error with exit code 1

### Requirement: BAT_THEME environment variable

The zshrc SHALL export `BAT_THEME="Catppuccin Mocha"` so that bat and delta use the catppuccin-mocha syntax theme consistently.

#### Scenario: bat uses catppuccin theme

- **WHEN** user runs `bat` on any file
- **THEN** syntax highlighting uses the Catppuccin Mocha color scheme

### Requirement: direnv hook with guard

The zshrc SHALL initialize direnv via `eval "$(direnv hook zsh)"`, guarded by `command -v direnv` so it is a no-op when direnv is not installed.

#### Scenario: direnv installed

- **WHEN** direnv is available on PATH
- **THEN** the direnv hook is initialized and `.envrc` files auto-load on directory change

#### Scenario: direnv not installed

- **WHEN** direnv is not available on PATH
- **THEN** the guard skips initialization silently with no error output

### Requirement: fd as explicit brew dependency

The install script SHALL include `fd` in the `BREW_PACKAGES` array so it is installed explicitly rather than assumed present.

#### Scenario: Fresh machine install

- **WHEN** user runs the install script and confirms the brew packages group
- **THEN** `fd` is installed alongside the other CLI tools

### Requirement: direnv as brew dependency

The install script SHALL include `direnv` in the `BREW_PACKAGES` array.

#### Scenario: Fresh machine install

- **WHEN** user runs the install script and confirms the brew packages group
- **THEN** `direnv` is installed alongside the other CLI tools

### Requirement: wsc shortcut for worktree-with-claude

The zshrc SHALL define an alias `wsc` that resolves to `wt switch --create --execute=claude`, allowing a one-step worktree creation that immediately launches Claude Code in the new worktree.

#### Scenario: wsc creates a worktree and runs claude

- **WHEN** the user types `wsc <branch>`
- **THEN** worktrunk SHALL create a new worktree for `<branch>`, run all configured pre-start and post-start hooks, and then start `claude` inside that worktree

#### Scenario: wsc forwards extra args to claude

- **WHEN** the user types `wsc <branch> -- 'Fix GH #322'`
- **THEN** worktrunk SHALL forward `'Fix GH #322'` as the initial prompt to `claude` in the new worktree

#### Scenario: wsc available after chezmoi apply

- **WHEN** the user runs `chezmoi apply` and starts a new shell
- **THEN** `alias wsc` SHALL be defined and resolve to `wt switch --create --execute=claude`
