## MODIFIED Requirements

### Requirement: chezmoi manages OpenCode main config

The system SHALL include a `dot_config/opencode/opencode.jsonc` file in the chezmoi source tree that deploys to `~/.config/opencode/opencode.jsonc`.

The file SHALL contain:

- A `$schema` reference to `https://opencode.ai/config.json`
- `model` set to `anthropic/claude-opus-4-6`
- `autoupdate` set to `true`
- `tui.scroll_acceleration.enabled` set to `true`
- A `plugin` array with curated OpenCode plugins (DCP, Plannotator, WakaTime, `superpowers@git+https://github.com/obra/superpowers.git`, and websearch-cited), with websearch-cited remaining the final entry
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

The file SHALL NOT omit `autoupdate` in favor of OpenCode's implicit default. Explicit `true` keeps auto-update intent versioned alongside the rest of the config and matches the official-script install path (see `opencode-install`).

The file's `mcp` block is owned by `mcp-global-config`, which requires the global `expect` entry. This requirement SHALL NOT forbid MCP server configuration in the file.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode config
- **THEN** `~/.config/opencode/opencode.jsonc` is created with the full permission set including deny, allow, and ask rules, with `"autoupdate": true` at the top level, and with the official Superpowers package in the plugin array

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

#### Scenario: Autoupdate is explicit after apply

- **WHEN** `chezmoi apply` deploys OpenCode config
- **THEN** the deployed `~/.config/opencode/opencode.jsonc` contains `"autoupdate": true` at the top level

#### Scenario: Official Superpowers plugin is registered

- **WHEN** `chezmoi apply` deploys OpenCode config
- **THEN** the deployed plugin array contains `superpowers@git+https://github.com/obra/superpowers.git` and keeps websearch-cited as its final entry

## ADDED Requirements

### Requirement: Legacy OpenCode Superpowers installation is removed

Applying the dotfiles SHALL remove the obsolete `~/.config/opencode/plugins/superpowers.js` plugin symlink, `~/.config/opencode/skills/superpowers` skills symlink, and `~/.config/opencode/superpowers` repository clone. The interactive bootstrap SHALL NOT recreate those legacy paths.

#### Scenario: Existing legacy installation is cleaned up

- **WHEN** `chezmoi apply` runs on a machine with any of the three obsolete Superpowers paths
- **THEN** those paths are removed while other OpenCode plugins, skills, and runtime state remain untouched

#### Scenario: Bootstrap does not recreate the legacy installation

- **WHEN** the user accepts the OpenCode plugin dependency installation group
- **THEN** Plannotator dependencies are installed without cloning or symlinking Superpowers into `~/.config/opencode/`
