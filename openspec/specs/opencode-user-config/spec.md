# Capability: opencode-user-config

## Purpose

User-level OpenCode configuration managed by chezmoi -- global editor settings, TUI theming, and plugin curation deployed to `~/.config/opencode/`.

## Requirements

### Requirement: chezmoi manages OpenCode main config

The system SHALL include a `dot_config/opencode/opencode.jsonc` file in the chezmoi source tree that deploys to `~/.config/opencode/opencode.jsonc`.

The file SHALL contain:

- A `$schema` reference to `https://opencode.ai/config.json`
- `model` set to `anthropic/claude-opus-4-6`
- `tui.scroll_acceleration.enabled` set to `true`
- A `plugin` array with curated OpenCode plugins (DCP, Plannotator, WakaTime, websearch-cited)
- A `formatter` section registering `oxfmt` as a custom formatter
- A `permission` section with:
    - `edit` set to `"ask"`
    - `webfetch` set to `"ask"`
    - `doom_loop` set to `"deny"`
    - `bash` with `"*": "ask"` as the default, and granular overrides:
        - **Deny rules** for: `sudo *`, `curl * | bash`, `curl * | sh`, `wget * | bash`, `wget * | sh`, `git push --force *`, `git push * --force`, `git push -f *`, `git push * -f`, `npm publish *`, `bun publish *`, `chmod -R 777 *`
        - **Allow rules** for read-only filesystem: `ls`, `ls *`, `cat *`, `head *`, `tail *`, `wc *`, `pwd`, `echo *`, `which *`, `file *`, `find *`, `rg *`, `du *`, `tree *`, `stat *`
        - **Allow rules** for read-only git: `git status`, `git status *`, `git diff`, `git diff *`, `git log`, `git log *`, `git show *`, `git branch`, `git branch *`, `git remote *`, `git stash list *`, `git ls-tree *`, `git rev-parse *`, `git config --get *`
        - **Allow rules** for git write: `git add *`, `git fetch *`, `git push *`
        - **Allow rules** for build/test: `bun run *`, `bun test *`, `bun install --frozen-lockfile`, `pnpm run *`, `pnpm test *`, `pnpm install --frozen-lockfile`
        - **Allow rules** for version checks: `node --version`, `bun --version`, `npm --version`
        - **Allow rules** for chezmoi read: `chezmoi cat *`, `chezmoi diff *`, `chezmoi managed *`, `chezmoi source-path *`, `chezmoi status *`, `chezmoi data *`
        - **Allow rules** for brew info: `brew info *`, `brew list *`, `brew outdated *`
        - **Allow rules** for OpenSpec: `openspec list *`, `openspec status *`, `openspec instructions *`, `bunx openspec *`
        - **Allow rules** for worktrunk: `wt list *`, `wt config *`, `wt --help *`
        - **Allow rules** for GitHub CLI: `gh api *`, `gh issue *`, `gh pr *`, `gh repo *`
        - **Allow rules** for Claude Code CLI: `claude mcp *`, `claude plugin *`, `claude skill *`, `claude skills *`
        - **Allow rules** for npm info: `npm info *`

The file SHALL NOT contain MCP server configuration (these stay per-project) or settings where OpenCode's default is sufficient (e.g., `autoupdate`).

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode config
- **THEN** `~/.config/opencode/opencode.jsonc` is created with the full permission set including deny, allow, and ask rules

#### Scenario: Dangerous command is denied

- **WHEN** OpenCode attempts to run `sudo rm -rf /`
- **THEN** the command SHALL be denied without prompting the user

#### Scenario: Read-only command is allowed

- **WHEN** OpenCode attempts to run `ls -la`
- **THEN** the command SHALL execute without prompting the user

#### Scenario: Build command is allowed

- **WHEN** OpenCode attempts to run `bun test`
- **THEN** the command SHALL execute without prompting the user

#### Scenario: pnpm command is allowed

- **WHEN** OpenCode attempts to run `pnpm run dev`
- **THEN** the command SHALL execute without prompting the user

#### Scenario: Unknown command prompts

- **WHEN** OpenCode attempts to run `docker build .`
- **THEN** the command SHALL prompt the user for confirmation

#### Scenario: Project config overrides global

- **WHEN** a project has its own `opencode.json` with a different `model` value
- **THEN** the project-level model takes precedence over the global config

### Requirement: chezmoi manages OpenCode TUI config

The system SHALL include a `dot_config/opencode/tui.json` file in the chezmoi source tree that deploys to `~/.config/opencode/tui.json`.

The file SHALL contain:

- A `$schema` reference to `https://opencode.ai/tui.json`
- `theme` set to `catppuccin-macchiato`

#### Scenario: Theme applied on setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode TUI config
- **THEN** `~/.config/opencode/tui.json` is created and OpenCode uses the `catppuccin-macchiato` theme

### Requirement: Existing OpenCode state is not affected

chezmoi SHALL NOT manage any files in `~/.local/state/opencode/`, `~/.local/share/opencode/`, or `~/.config/opencode/package.json`.

#### Scenario: Runtime state preserved

- **WHEN** `chezmoi apply` is run on a machine with existing OpenCode runtime state
- **THEN** `kv.json`, `model.json`, `auth.json`, and `package.json` are untouched

### Requirement: Explicit shell field set to zsh

The `dot_config/opencode/opencode.jsonc` file SHALL contain a top-level `"shell": "zsh"` field. This ensures opencode's agent shell tool resolves to zsh on every machine regardless of OpenCode's per-platform default, so the agent inherits aliases, PATH, and shell functions sourced from `~/.zshrc`.

#### Scenario: Shell field present after fresh setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode config
- **THEN** the deployed `~/.config/opencode/opencode.jsonc` contains the `"shell": "zsh"` field at the top level

#### Scenario: Agent shell tool uses zsh

- **WHEN** opencode's agent invokes a shell command via the shell tool
- **THEN** the command runs under zsh and resolves user-defined aliases (e.g., `lg`, `gco`) without needing fully-qualified paths

#### Scenario: zshrc-sourced functions available

- **WHEN** the agent shell tool runs a function that is defined in the user's zshrc (e.g., `_tv_ctrl_t_wrapper`)
- **THEN** the function resolves and executes without "command not found" errors
