## ADDED Requirements

### Requirement: Television config.toml is managed by chezmoi

A chezmoi-managed `dot_config/television/config.toml` SHALL be deployed to `~/.config/television/config.toml`. This file SHALL contain theme selection, shell integration settings, UI preferences, and keybinding overrides.

#### Scenario: Config deployed on chezmoi apply

- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/television/config.toml` exists with the managed configuration

### Requirement: Theme is catppuccin-mocha-mauve

The config SHALL set `theme = "catppuccin-mocha-mauve"` under `[ui]`. A corresponding theme file SHALL be managed by chezmoi at `dot_config/television/themes/catppuccin-mocha-mauve.toml`, sourced from the [catppuccin/television](https://github.com/catppuccin/television) repository.

#### Scenario: Television uses catppuccin-mocha-mauve theme

- **WHEN** `tv` launches
- **THEN** the UI renders with catppuccin-mocha colors with mauve accent

#### Scenario: Theme file exists alongside config

- **WHEN** `chezmoi apply` runs
- **THEN** `~/.config/television/themes/catppuccin-mocha-mauve.toml` exists

### Requirement: Shell integration disables Ctrl+R and keeps Ctrl+T

The config SHALL set `[shell_integration.keybindings]` with `smart_autocomplete = "ctrl-t"` and `command_history = ""` (empty string to disable). This ensures tv does not compete with atuin for Ctrl+R.

#### Scenario: Ctrl+R is not bound by tv config

- **WHEN** tv reads its config.toml
- **THEN** tv does not bind any shell keybinding for command history

#### Scenario: Ctrl+T triggers smart autocomplete

- **WHEN** tv reads its config.toml
- **THEN** Ctrl+T is bound to tv smart autocomplete in the shell

### Requirement: Channel triggers map commands to appropriate channels

The config SHALL define `[shell_integration.channel_triggers]` mapping at least the following command-to-channel relationships:

| Channel           | Trigger commands                                               |
| ----------------- | -------------------------------------------------------------- |
| git-branch        | git checkout, git switch, git merge, git rebase                |
| git-log           | git show, git revert, git cherry-pick                          |
| git-diff          | git add, git restore                                           |
| git-stash         | git stash apply, git stash pop, git stash drop                 |
| docker-images     | docker run, docker rmi                                         |
| docker-containers | docker stop, docker start, docker rm, docker logs, docker exec |
| ssh-hosts         | ssh, scp                                                       |
| tmux-sessions     | tmux attach, tmux switch                                       |
| dirs              | cd, ls, rmdir                                                  |
| npm-scripts       | bun run                                                        |
| brew-packages     | brew uninstall, brew info                                      |
| zoxide            | z                                                              |

#### Scenario: git checkout triggers git-branch channel

- **WHEN** the user types `git checkout ` and presses Ctrl+T
- **THEN** tv launches with the `git-branch` channel

#### Scenario: bun run triggers npm-scripts channel

- **WHEN** the user types `bun run ` and presses Ctrl+T
- **THEN** tv launches with the `npm-scripts` channel

#### Scenario: Unknown command falls back to files

- **WHEN** the user types an unrecognized command and presses Ctrl+T
- **THEN** tv launches with the default `files` channel

### Requirement: Help panel is visible by default

The config SHALL set `[ui.help_panel]` with `hidden = false` so that keybinding help is visible when tv launches, aiding discoverability.

#### Scenario: Help panel shows on launch

- **WHEN** tv launches with default config
- **THEN** the help panel is visible showing available keybindings

### Requirement: Preview panel size is 55%

The config SHALL set `[ui.preview_panel]` with `size = 55` for a slightly more generous preview than the default 50%.

#### Scenario: Preview panel takes 55% of screen

- **WHEN** tv launches in landscape mode
- **THEN** the preview panel occupies 55% of the horizontal space
