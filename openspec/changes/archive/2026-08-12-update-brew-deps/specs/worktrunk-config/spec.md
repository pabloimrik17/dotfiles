# worktrunk-config Delta

## MODIFIED Requirements

### Requirement: LLM branch summaries enabled in list view

The user config SHALL pin the `wt list` layout with `[list].columns = ["branch", "working-diff", "branch-diff", "ci", "summary"]` so plain `wt list` and the `wt switch` picker display the branch, HEAD± working diffstat, main…± branch diffstat, CI status, and the LLM-generated summary (generated via the configured `[commit.generation].command`) on every invocation. Since worktrunk 0.63 an explicit `columns` list overrides the `full`/`summary` presets, so the config SHALL NOT also set `[list].full` or `[list].summary` (redundant). Column identifiers are names, not display headers (`working-diff` renders "HEAD±", `branch-diff` renders "main…±").

#### Scenario: list shows branch summaries

- **GIVEN** the user has configured `[commit.generation].command`
- **WHEN** the user runs `wt list`
- **THEN** each branch row SHALL include an LLM-generated summary line

#### Scenario: list shows CI and diffstat columns

- **WHEN** the user runs `wt list`
- **THEN** each row SHALL include the working diffstat (HEAD±), the branch diffstat (main…±), and CI status columns

#### Scenario: switch picker shows summaries

- **WHEN** the user runs `wt switch` (interactive picker)
- **THEN** each candidate branch SHALL include the same LLM-generated summary alongside the branch name

#### Scenario: Config applied on fresh machine

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain `columns = ["branch", "working-diff", "branch-diff", "ci", "summary"]` under a `[list]` table and no `full` or `summary` keys

### Requirement: User-defined wt aliases for daily operations

The user config SHALL define a `[aliases]` table with four entries: `wtlog` (tail the log file of a named hook by resolving its path through `wt config state logs --format=json | jq` filtering on `<source>:<hook_type>:<name>`), `wtci` (wrapper for `wt list --full --branches`), `wtpr` (wrapper for `wt switch --prs`, the worktrunk 0.63 picker mode listing open PRs with live CI/review state), and `mc` (wrapper for `wt merge` that overrides `WORKTRUNK_COMMIT__GENERATION__COMMAND` so the squash message is composed in `$EDITOR` instead of via the configured Claude haiku command).

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

#### Scenario: wtpr opens the PR picker

- **WHEN** the user runs `wt wtpr`
- **THEN** the alias SHALL execute `wt switch --prs`, opening the picker with open pull requests and their live CI/review state

#### Scenario: mc opens editor for squash message

- **WHEN** the user runs `wt mc`
- **THEN** the alias SHALL execute `wt merge` with the environment variable `WORKTRUNK_COMMIT__GENERATION__COMMAND` set to a command that opens `$EDITOR` (falling back to `vi`) for the user to author the commit message
- **AND** the override SHALL apply only to that single invocation, leaving the global `[commit.generation].command` untouched

#### Scenario: Aliases present after chezmoi apply

- **WHEN** the user runs `chezmoi apply`
- **THEN** `~/.config/worktrunk/config.toml` SHALL contain a `[aliases]` table with keys `wtlog`, `wtci`, `wtpr`, and `mc`
