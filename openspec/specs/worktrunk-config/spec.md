# Capability: worktrunk-config

## Purpose

Manage worktrunk user configuration via chezmoi, including post-create hooks for automatic package manager detection and dependency installation in new worktrees.

## Requirements

### Requirement: Chezmoi-managed user config

A worktrunk user configuration file SHALL be managed by chezmoi at `dot_config/worktrunk/config.toml`, targeting `~/.config/worktrunk/config.toml`.

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL exist with the default configuration

### Requirement: Install-deps post-start hook with package manager detection

The user config SHALL define a `[post-start].install-deps` hook (`user:post-start:install-deps`) that detects the project's package manager by lockfile presence and runs the appropriate install command.

#### Scenario: Bun project

- **WHEN** a new worktree is created in a directory containing `bun.lock`
- **THEN** the `[post-start].install-deps` hook SHALL run `bun install`

#### Scenario: pnpm project

- **WHEN** a new worktree is created in a directory containing `pnpm-lock.yaml`
- **THEN** the `[post-start].install-deps` hook SHALL run `pnpm install`

#### Scenario: npm project

- **WHEN** a new worktree is created in a directory containing `package-lock.json`
- **THEN** the `[post-start].install-deps` hook SHALL run `npm install`

#### Scenario: Multiple lockfiles (precedence bun > pnpm > npm)

- **WHEN** a new worktree is created in a directory containing both `bun.lock` and `pnpm-lock.yaml`
- **THEN** the `[post-start].install-deps` hook SHALL run `bun install` and SHALL NOT run `pnpm install` or `npm install`

#### Scenario: No JS project

- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the `[post-start].install-deps` hook SHALL exit silently without error

### Requirement: Pre-start hook copies gitignored files

The user config SHALL define a `[pre-start]` hook that runs `wt step copy-ignored` to copy whitelisted gitignored files from the primary worktree to the new worktree before any post-start hooks execute.

#### Scenario: Gitignored files copied before dependency installation

- **WHEN** a new worktree is created via worktrunk
- **THEN** `wt step copy-ignored` SHALL run before `[post-start].install-deps`, ensuring lockfiles and config files are available for dependency installation

#### Scenario: Pre-start hook defined in global config

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-start]` section with `copy = "wt step copy-ignored"`

#### Scenario: No .worktreeinclude in project

- **WHEN** a new worktree is created in a project without a `.worktreeinclude` file
- **THEN** `wt step copy-ignored` SHALL exit cleanly without error

### Requirement: Copy-ignored exclude list for regenerable directories

The user config SHALL define a `[step.copy-ignored]` section with an `exclude` list that prevents `wt step copy-ignored` from copying regenerable or path-sensitive directories into new worktrees. The list SHALL cover Node package directories, framework build outputs and caches, bundler and transpiler caches, generic build outputs, test and coverage artifacts, Python tool caches and virtual environments, and mutation testing artifacts. Entries SHALL use worktrunk's documented directory syntax (trailing `/`).

#### Scenario: Exclude block present after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[step.copy-ignored]` section with a non-empty `exclude` array

#### Scenario: Exclude list covers Node package directories

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `node_modules/`

#### Scenario: Exclude list covers framework build caches

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `.next/`, `.nx/`, `.turbo/`, and `.expo/`

#### Scenario: Exclude list covers bundler and transpiler caches

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `.cache/`, `.parcel-cache/`, `.vite/`, and `.swc/`

#### Scenario: Exclude list covers generic build outputs

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `dist/`, `build/`, `out/`, and `storybook-static/`

#### Scenario: Exclude list covers test and coverage artifacts

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `coverage/`, `.nyc_output/`, `htmlcov/`, `playwright-report/`, and `test-results/`

#### Scenario: Exclude list covers Python tool caches and venvs

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/`, `.venv/`, and `venv/`

#### Scenario: Exclude list covers mutation testing artifacts

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL include `.stryker-tmp/`

#### Scenario: JetBrains project state is not excluded

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL NOT include `.idea/`

#### Scenario: CocoaPods directory is not excluded

- **WHEN** `wt config show` is executed
- **THEN** the reported `[step.copy-ignored].exclude` list SHALL NOT include `ios/Pods/`

#### Scenario: node_modules not copied into new worktree

- **GIVEN** a Node project with `node_modules/` populated in the primary worktree
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain a `node_modules/` directory copied from the primary worktree before `[post-start].install-deps` runs
- **AND** the `[post-start].install-deps` hook SHALL still install dependencies successfully

#### Scenario: Framework build caches not copied into new worktree

- **GIVEN** a Node project with `.next/` and `.nx/` populated in the primary worktree
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain `.next/` or `.nx/` copied from the primary worktree

#### Scenario: Mutation testing artifacts not copied into new worktree

- **GIVEN** a project with `.stryker-tmp/` populated in the primary worktree (e.g. monolab after a `nx run-many --target=mutation:test`)
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain `.stryker-tmp/` copied from the primary worktree

### Requirement: LLM branch summaries enabled in list view

The user config SHALL set `[list].summary = true` AND `[list].full = true` so that plain `wt list` and the `wt switch` picker display LLM-generated summaries for each branch, generated via the configured `[commit.generation].command`. Worktrunk renders the `Summary` column only when `full` mode is active (either via the `--full` flag or `[list].full = true`); enabling both keys together honors the user's intent to see summaries on every list invocation without typing `--full`.

#### Scenario: list shows branch summaries

- **GIVEN** the user has configured `[commit.generation].command`
- **WHEN** the user runs `wt list`
- **THEN** each branch row SHALL include an LLM-generated summary line

#### Scenario: switch picker shows summaries

- **WHEN** the user runs `wt switch` (interactive picker)
- **THEN** each candidate branch SHALL include the same LLM-generated summary alongside the branch name

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain `summary = true` AND `full = true` under a `[list]` table

### Requirement: Switch picker uses delta as pager

The user config SHALL set `[switch.picker].pager = "delta --paging=never"` so the `wt switch` picker renders diffs through delta with the catppuccin theme already configured by the `delta-catppuccin` capability, instead of git's default pager.

#### Scenario: Picker renders diffs via delta

- **WHEN** the user opens the `wt switch` picker on a branch with uncommitted changes
- **THEN** diffs in the picker preview SHALL be rendered by delta (syntax highlighting, side-by-side or unified per delta config)

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain `pager = "delta --paging=never"` under a `[switch.picker]` table

### Requirement: Install-deps hook emits phased log markers

The post-start install-deps hook SHALL emit `echo` markers at three phases — detection start, package-manager-selected install start, and completion — each prefixed with `[install-deps]` so that hook output retrieved via `wt config state logs --format=json | jq` (filtered on `<source>:<hook_type>:<name>` = `user:post-start:install-deps`) is greppable for the active phase.

#### Scenario: Detection phase logged

- **WHEN** a new worktree is created
- **THEN** the install-deps hook log SHALL contain a line beginning with `[install-deps]` indicating the detection phase started

#### Scenario: Selected package manager logged

- **WHEN** the install-deps hook detects a lockfile (`bun.lock`, `pnpm-lock.yaml`, or `package-lock.json`)
- **THEN** the log SHALL contain a `[install-deps]` line naming the detected package manager before `<pm> install` runs

#### Scenario: Completion logged

- **WHEN** the install-deps hook finishes successfully
- **THEN** the log SHALL contain a `[install-deps]` line indicating completion

#### Scenario: No-op project still emits markers

- **WHEN** a new worktree is created in a directory with no recognized lockfile
- **THEN** the log SHALL contain `[install-deps]` markers covering the detection phase and a no-op completion line, exiting with code 0

### Requirement: User-defined wt aliases for daily operations

The user config SHALL define a `[aliases]` table with three entries: `wtlog` (tail the log file of a named hook by resolving its path through `wt config state logs --format=json | jq` filtering on `<source>:<hook_type>:<name>`), `wtci` (wrapper for `wt list --full --branches`), and `mc` (wrapper for `wt merge` that overrides `WORKTRUNK_COMMIT__GENERATION__COMMAND` so the squash message is composed in `$EDITOR` instead of via the configured Claude haiku command).

#### Scenario: wtlog tails a named hook log

- **GIVEN** the user passes a hook identifier such as `user:post-start:install-deps`
- **WHEN** the user runs `wt wtlog <hook-id>`
- **THEN** the alias SHALL execute `tail -f` on the path obtained by querying `wt config state logs --format=json` and filtering the `hook_output[]` array for the entry whose composite `<source>:<hook_type>:<name>` equals the supplied id

#### Scenario: wtlog reports a clear error when the hook id is missing

- **WHEN** the user runs `wt wtlog` with no argument
- **THEN** the alias SHALL print `usage: wt wtlog <source:hook_type:name>` to stderr AND exit with a non-zero status without invoking `tail`

#### Scenario: wtlog reports a clear error when the hook id is unknown

- **GIVEN** the user passes a hook identifier that does not match any entry in `wt config state logs --format=json`
- **WHEN** the user runs `wt wtlog <hook-id>`
- **THEN** the alias SHALL print `hook log not found: <hook-id>` to stderr AND exit with a non-zero status without invoking `tail`

#### Scenario: wtci shows full branch + CI snapshot

- **WHEN** the user runs `wt wtci`
- **THEN** the alias SHALL execute `wt list --full --branches`

#### Scenario: mc opens editor for squash message

- **WHEN** the user runs `wt mc`
- **THEN** the alias SHALL execute `wt merge` with the environment variable `WORKTRUNK_COMMIT__GENERATION__COMMAND` set to a command that opens `$EDITOR` (falling back to `vi`) for the user to author the commit message
- **AND** the override SHALL apply only to that single invocation, leaving the global `[commit.generation].command` untouched

#### Scenario: Aliases present after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[aliases]` table with keys `wtlog`, `wtci`, and `mc`

### Requirement: Global pre-start save-base hook for Claude worktrees

The user config SHALL define a `[pre-start].save-base` hook that records the base worktree path to `.claude/.worktree-base` in the new worktree, but ONLY when a `.claude/` directory already exists in the new worktree. The hook SHALL be a no-op (exit 0) for any repository that does not use Claude Code.

#### Scenario: Claude-enabled project records base path

- **GIVEN** a repository that contains a `.claude/` directory
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the file `.claude/.worktree-base` SHALL exist in the new worktree, containing the absolute path of the base worktree (the value of `{{ base_worktree_path }}` rendered by worktrunk)

#### Scenario: Non-Claude project unaffected

- **GIVEN** a repository that does not contain a `.claude/` directory
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the `[pre-start].save-base` hook SHALL exit cleanly without creating any file and without printing an error
- **AND** no other pre-start hook SHALL be affected

#### Scenario: Hook present in global config after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-start]` section that includes a `save-base` key whose value writes `.claude/.worktree-base` and is guarded by an `[ -d .claude ]` test

### Requirement: Global pre-remove sync-claude hook merges Claude permissions back to base worktree

The user config SHALL define a `[pre-remove].sync-claude` hook that, when the worktree being removed contains a `.claude/settings.local.json` and a `.claude/.worktree-base` file pointing to a still-existing base worktree, deep-merges the worktree's `settings.local.json` back into the base worktree's copy. The merge SHALL union the `permissions.allow` and `permissions.deny` arrays (worktree values taking precedence on conflicts) and SHALL be written atomically (`.tmp` + `mv`). The hook SHALL never block worktree removal: any failure is logged to stderr and exits 0.

#### Scenario: Approvals merged on remove

- **GIVEN** a worktree where Claude has appended new entries to `permissions.allow` in `.claude/settings.local.json`
- **AND** the base worktree has its own `.claude/settings.local.json`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the base worktree's `.claude/settings.local.json` SHALL contain the union of both files' `permissions.allow` arrays, deduplicated, with no entries lost from either side

#### Scenario: First-time copy when base has no settings

- **GIVEN** a worktree with `.claude/settings.local.json` populated
- **AND** the base worktree has no `.claude/settings.local.json`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the worktree's `.claude/settings.local.json` SHALL be copied to the base worktree's `.claude/settings.local.json`, creating `.claude/` in the base if it does not exist

#### Scenario: Missing base path is silently skipped

- **GIVEN** a worktree without `.claude/.worktree-base`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the `sync-claude` hook SHALL exit 0 without writing anything to the base worktree
- **AND** worktree removal SHALL proceed normally

#### Scenario: Missing settings file is silently skipped

- **GIVEN** a worktree with `.claude/.worktree-base` present but no `.claude/settings.local.json`
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the `sync-claude` hook SHALL exit 0 without writing anything to the base worktree

#### Scenario: Disappeared base worktree is silently skipped

- **GIVEN** a worktree whose `.claude/.worktree-base` references a directory that no longer exists
- **WHEN** the user runs `wt remove <branch>`
- **THEN** the `sync-claude` hook SHALL exit 0 without error
- **AND** worktree removal SHALL proceed normally

#### Scenario: Merge failure does not block remove

- **WHEN** the merge command fails for any reason (e.g., jq missing, malformed JSON, disk full)
- **THEN** the `sync-claude` hook SHALL print a warning to stderr and exit 0 so worktree removal proceeds

#### Scenario: Hook present in global config after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[pre-remove]` section that includes a `sync-claude` key whose body performs the guarded jq deep-merge described above
