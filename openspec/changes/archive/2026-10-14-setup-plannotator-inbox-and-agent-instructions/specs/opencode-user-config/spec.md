# Spec Delta

## MODIFIED Requirements

### Requirement: chezmoi manages OpenCode main config

The system SHALL include a `dot_config/opencode/opencode.jsonc` file in the chezmoi source tree that deploys to `~/.config/opencode/opencode.jsonc`.

The file SHALL contain:

- A `$schema` reference to `https://opencode.ai/config.json`
- `model` set to `anthropic/claude-opus-4-6`
- `update` set to `"auto"`
- A `plugins` array of package objects with curated OpenCode plugins (Plannotator, WakaTime, and `superpowers@git+https://github.com/obra/superpowers.git`)
- A `formatter` section registering `oxfmt` as a custom formatter
- An ordered `permissions` array of action/resource/effect rules with:
    - `edit` set to `"ask"`
    - `webfetch` set to `"ask"`
    - `doom_loop` set to `"deny"`
    - `shell` with resource `"*"` and effect `"ask"` as the default, and granular overrides:
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

The file SHALL NOT omit `update` in favor of OpenCode's implicit default. Explicit `"auto"` keeps auto-update intent versioned alongside the rest of the config and matches the official-script install path (see `opencode-install`).

The file's `mcp.servers` block is owned by `mcp-global-config`, which requires the global `expect` entry. This requirement SHALL NOT forbid MCP server configuration in the file.

#### Scenario: Fresh machine setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode config
- **THEN** `~/.config/opencode/opencode.jsonc` is created with the full permission set including deny, allow, and ask rules, with `"update": "auto"` at the top level, and with the official Superpowers package in the plugin array

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
- **THEN** the deployed `~/.config/opencode/opencode.jsonc` contains `"update": "auto"` at the top level

#### Scenario: Official Superpowers plugin is registered

- **WHEN** `chezmoi apply` deploys OpenCode config
- **THEN** the deployed plugin array contains `superpowers@git+https://github.com/obra/superpowers.git` as its final entry and no websearch-cited entry

#### Scenario: Force-push exceptions take precedence

- **WHEN** a command matches both a shell allow rule and one of the four force-push deny rules
- **THEN** the force-push deny rules SHALL follow all shell allow rules so the last matching rule denies the command

#### Scenario: DCP is removed

- **WHEN** chezmoi deploys the native v2 configuration
- **THEN** the `plugins` array SHALL omit DCP and retain Plannotator, WakaTime and Superpowers

### Requirement: chezmoi manages OpenCode TUI config

The system SHALL use `dot_config/opencode/modify_private_cli.json` to merge theme and scrolling preferences into private `~/.config/opencode/cli.json`. The legacy `dot_config/opencode/tui.json` source SHALL no longer be managed.

#### Scenario: Theme applied on setup

- **WHEN** `chezmoi apply` is run on a machine without OpenCode CLI config and uv is available
- **THEN** private `~/.config/opencode/cli.json` SHALL be created with `theme.name` set to `catppuccin-macchiato`, `scroll.acceleration` set to `true`, and the v2 CLI schema

#### Scenario: Existing preferences survive

- **WHEN** valid CLI preferences already exist
- **THEN** the merge SHALL preserve unrelated top-level and nested preferences, including an existing schema

#### Scenario: Invalid preferences are preserved

- **WHEN** the input is malformed, its theme or scroll values are not objects, or the merge fails
- **THEN** application SHALL fail without replacing the live file

#### Scenario: uv is unavailable

- **WHEN** uv is unavailable
- **THEN** the merge SHALL report the missing prerequisite and preserve existing input, or return an empty object when no input exists
