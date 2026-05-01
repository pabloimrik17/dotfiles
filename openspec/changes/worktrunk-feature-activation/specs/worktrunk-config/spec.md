## ADDED Requirements

### Requirement: LLM branch summaries enabled in list view

The user config SHALL set `[list].summary = true` so that `wt list` and the `wt switch` picker display LLM-generated summaries for each branch, generated via the configured `[commit.generation].command`.

#### Scenario: list shows branch summaries

- **GIVEN** the user has configured `[commit.generation].command`
- **WHEN** the user runs `wt list`
- **THEN** each branch row SHALL include an LLM-generated summary line

#### Scenario: switch picker shows summaries

- **WHEN** the user runs `wt switch` (interactive picker)
- **THEN** each candidate branch SHALL include the same LLM-generated summary alongside the branch name

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain `summary = true` under a `[list]` table

### Requirement: Switch picker uses delta as pager

The user config SHALL set `[switch.picker].pager = "delta --paging=never"` so the `wt switch` picker renders diffs through delta with the catppuccin theme already configured by the `delta-catppuccin` capability, instead of git's default pager.

#### Scenario: Picker renders diffs via delta

- **WHEN** the user opens the `wt switch` picker on a branch with uncommitted changes
- **THEN** diffs in the picker preview SHALL be rendered by delta (syntax highlighting, side-by-side or unified per delta config)

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain `pager = "delta --paging=never"` under a `[switch.picker]` table

### Requirement: Install-deps hook emits phased log markers

The post-start install-deps hook SHALL emit `echo` markers at three phases — detection start, package-manager-selected install start, and completion — each prefixed with `[install-deps]` so that `wt config state logs get --hook=user:post-start:install-deps` is greppable for the active phase.

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

The user config SHALL define a `[aliases]` table with three entries: `wtlog` (tail the log file of a named hook via `wt config state logs get --hook=…`), `wtci` (wrapper for `wt list --full --branches`), and `mc` (wrapper for `wt merge` that overrides `WORKTRUNK_COMMIT__GENERATION__COMMAND` so the squash message is composed in `$EDITOR` instead of via the configured Claude haiku command).

#### Scenario: wtlog tails a named hook log

- **GIVEN** the user passes a hook identifier such as `user:post-start:install-deps`
- **WHEN** the user runs `wt wtlog <hook-id>`
- **THEN** the alias SHALL execute `tail -f` on the path returned by `wt config state logs get --hook=<hook-id>`

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

## MODIFIED Requirements

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
- **THEN** the new worktree SHALL NOT contain a `node_modules/` directory copied from the primary worktree before `[post-start].deps` runs
- **AND** the `[post-start].deps` hook SHALL still install dependencies successfully

#### Scenario: Framework build caches not copied into new worktree

- **GIVEN** a Node project with `.next/` and `.nx/` populated in the primary worktree
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain `.next/` or `.nx/` copied from the primary worktree

#### Scenario: Mutation testing artifacts not copied into new worktree

- **GIVEN** a project with `.stryker-tmp/` populated in the primary worktree (e.g. monolab after a `nx run-many --target=mutation:test`)
- **WHEN** the user runs `wt switch --create <branch>`
- **THEN** the new worktree SHALL NOT contain `.stryker-tmp/` copied from the primary worktree
