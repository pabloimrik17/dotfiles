### Requirement: Plugin array declares all enabled oh-my-zsh plugins

The `plugins=()` array in `dot_zshrc.tmpl` SHALL declare exactly 27 plugins, organized by category with inline comments as separators.

#### Scenario: Plugin array contains all expected plugins

- **WHEN** the `plugins=()` array is evaluated
- **THEN** it SHALL contain exactly these plugins: `git`, `gitignore`, `brew`, `docker`, `docker-compose`, `npm`, `macos`, `gh`, `aliases`, `colored-man-pages`, `command-not-found`, `copybuffer`, `copyfile`, `copypath`, `encode64`, `extract`, `fancy-ctrl-z`, `history`, `jsontools`, `safe-paste`, `sudo`, `bgnotify`, `urltools`, `web-search`, `you-should-use`, `nvm`, `bun`

#### Scenario: Plugins are grouped by category

- **WHEN** inspecting the `plugins=()` array
- **THEN** plugins SHALL be grouped under comment headers: "Version control", "Tool completions & aliases", "Productivity utilities", "Runtime managers"

### Requirement: nvm plugin uses lazy loading

The nvm plugin SHALL be configured with lazy mode to defer loading `nvm.sh` until first use of a Node.js-related command.

#### Scenario: zstyle configuration is set before oh-my-zsh source

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the following lines SHALL appear before `source $ZSH/oh-my-zsh.sh`: `zstyle ':omz:plugins:nvm' lazy yes`, `zstyle ':omz:plugins:nvm' autoload yes`, `zstyle ':omz:plugins:nvm' silent-autoload yes`

#### Scenario: NVM_DIR is exported before oh-my-zsh source

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** `export NVM_DIR="$HOME/.nvm"` SHALL appear before `source $ZSH/oh-my-zsh.sh`

#### Scenario: nvm loads on first node command

- **WHEN** the user runs `node`, `npm`, `npx`, `pnpm`, `pnpx`, `yarn`, or `corepack` for the first time in a session
- **THEN** nvm SHALL be fully loaded and the command SHALL execute normally

#### Scenario: Automatic .nvmrc detection

- **WHEN** the user enters a directory containing a `.nvmrc` file (after nvm has been lazy-loaded)
- **THEN** nvm SHALL automatically switch to the version specified in `.nvmrc` without printing output

### Requirement: Manual nvm initialization lines are removed

The manual nvm `source` and `bash_completion` lines SHALL be removed since the nvm plugin handles initialization.

#### Scenario: No duplicate nvm loading

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the lines `[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"` and `[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"` SHALL NOT exist in the file

### Requirement: Manual gh completion line is removed

The synchronous `eval "$(gh completion -s zsh)"` line SHALL be removed since the `gh` plugin generates completions asynchronously.

#### Scenario: No duplicate gh completion loading

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the line `eval "$(gh completion -s zsh)"` and its preceding comment SHALL NOT exist in the file

#### Scenario: gh completions remain functional

- **WHEN** the user types `gh ` and presses Tab
- **THEN** gh subcommand completions SHALL appear (provided by the `gh` plugin via cached background generation)

### Requirement: Manual bun completion source is removed

The manual `source ~/.bun/_bun` line SHALL be removed since the `bun` plugin generates completions asynchronously.

#### Scenario: No duplicate bun completion loading

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the line `[ -s "{{ .chezmoi.homeDir }}/.bun/_bun" ] && source "{{ .chezmoi.homeDir }}/.bun/_bun"` and its preceding comment SHALL NOT exist in the file

#### Scenario: Bun PATH and install dir are retained

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the lines `export BUN_INSTALL="$HOME/.bun"` and `export PATH="$BUN_INSTALL/bin:$PATH"` SHALL still exist in the file

### Requirement: Conflicting plugins are not included

The plugin array SHALL NOT contain plugins that conflict with existing manual configuration.

#### Scenario: eza plugin excluded

- **WHEN** inspecting the `plugins=()` array
- **THEN** the `eza` plugin SHALL NOT be present (manual aliases with `--icons --group-directories-first` are preferred)

#### Scenario: fzf plugin excluded

- **WHEN** inspecting the `plugins=()` array
- **THEN** the `fzf` plugin SHALL NOT be present (inline fzf config with fd backend and bat preview is preferred)

#### Scenario: zoxide and z plugins excluded

- **WHEN** inspecting the `plugins=()` array
- **THEN** neither the `zoxide` nor `z` plugins SHALL be present (manual zoxide init with custom aliases is preferred)

#### Scenario: starship plugin excluded

- **WHEN** inspecting the `plugins=()` array
- **THEN** the `starship` plugin SHALL NOT be present (manual `eval "$(starship init zsh)"` is equivalent)

### Requirement: Existing manual configuration is preserved

All manual configuration not superseded by plugins SHALL remain unchanged.

#### Scenario: Custom aliases unchanged

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** all alias blocks (eza, bat, zoxide, git, GitHub CLI, ripgrep, utility) SHALL remain exactly as they were before this change

#### Scenario: Tool initializations unchanged

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** the `starship init`, `zoxide init`, `atuin init`, fzf configuration, and zsh-autosuggestions/syntax-highlighting source blocks SHALL remain unchanged

#### Scenario: PATH and environment exports unchanged

- **WHEN** `dot_zshrc.tmpl` is processed
- **THEN** `PNPM_HOME`, `BUN_INSTALL`, and their PATH additions SHALL remain unchanged
