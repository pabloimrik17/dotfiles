## ADDED Requirements

### Requirement: Default permission mode is auto

The chezmoi template SHALL include `"defaultMode": "auto"` inside the `permissions` object in `dot_claude/settings.json.tmpl`. Because Claude Code (v2.1.142+) ignores `permissions.defaultMode: "auto"` set in project or local settings, this rule MUST live in the user-scope template, which renders to `~/.claude/settings.json`.

In auto mode, `permissions.deny` and `permissions.allow` rules are still evaluated first and take precedence; only actions not resolved by a rule are routed to Claude Code's safety classifier, which runs without prompting the user.

#### Scenario: Template sets auto as the default permission mode

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** the `permissions` object in `~/.claude/settings.json` SHALL contain `"defaultMode": "auto"`

#### Scenario: New session starts in auto mode

- **WHEN** a Claude Code session starts on a supported model and API with no explicit `--permission-mode` override
- **THEN** the session SHALL begin in auto mode, executing rule-unmatched actions via the classifier without per-action prompts

## REMOVED Requirements

### Requirement: Allow rules permit read-only filesystem commands

**Reason**: Redundant. Claude Code auto-allows these commands via built-in read-only detection (`READONLY_COMMANDS` / `COMMAND_ALLOWLIST`), so the explicit allow rules never affect behavior.

**Migration**: None. `ls`, `cat`, `head`, `tail`, `wc`, `pwd`, `echo`, `which`, `file`, `find`, `rg`, `du`, `tree`, and `stat` continue to run without prompting.

### Requirement: Allow rules permit read-only git commands

**Reason**: Redundant. Claude Code auto-allows read-only git subcommands via built-in detection (`GIT_READ_ONLY_COMMANDS`).

**Migration**: None. `git status/diff/log/show/branch/remote/stash list/rev-parse/config --get` continue to run without prompting. `git ls-tree` is verified during apply and `Bash(git ls-tree *)` re-added only if it prompts.

## MODIFIED Requirements

### Requirement: Allow rules permit build and test commands

The chezmoi template SHALL include the following `Bash` allow rules for local build/test operations:

`bun run typecheck`, `bun run lint`, `bun run build`, `bun run test`, `bun test *`, `bun install --frozen-lockfile`, `pnpm run typecheck`, `pnpm run lint`, `pnpm run build`, `pnpm run test`, `pnpm test *`, `pnpm install --frozen-lockfile`

The template SHALL NOT include the wildcard rules `Bash(bun run *)` or `Bash(pnpm run *)`, which grant arbitrary code execution.

#### Scenario: Named build script runs without prompt

- **WHEN** Claude Code attempts to run `bun run typecheck`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Unlisted script is not blanket-allowed

- **WHEN** Claude Code attempts to run `bun run dev`
- **THEN** no `bun run` allow rule SHALL match it — in default mode the call prompts, and in auto mode it is routed to the classifier

### Requirement: Allow rules permit version check commands

The chezmoi template SHALL include `Bash(bun --version)` and `Bash(npm --version)` in `permissions.allow`. `node --version` is omitted because Claude Code auto-allows it as a built-in read-only exact form.

#### Scenario: Version check runs without prompt

- **WHEN** Claude Code attempts to run `bun --version`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit chezmoi read-only commands

The chezmoi template SHALL include the following `Bash` allow rules for chezmoi read operations:

`chezmoi cat *`, `chezmoi diff *`, `chezmoi managed *`, `chezmoi source-path *`, `chezmoi status *`, `chezmoi data *`, `chezmoi execute-template *`

#### Scenario: chezmoi status runs without prompt

- **WHEN** Claude Code attempts to run `chezmoi status`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: chezmoi execute-template runs without prompt

- **WHEN** Claude Code attempts to run `chezmoi execute-template '{{ .chezmoi.os }}'`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit OpenSpec read commands

The chezmoi template SHALL include `Bash(openspec list *)`, `Bash(openspec status *)`, `Bash(openspec instructions *)`, `Bash(openspec validate *)`, `Bash(openspec verify *)`, and `Bash(bunx openspec *)` in `permissions.allow`.

#### Scenario: openspec list runs without prompt

- **WHEN** Claude Code attempts to run `openspec list --json`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: openspec validate runs without prompt

- **WHEN** Claude Code attempts to run `openspec validate my-change --strict`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit worktrunk read commands

The chezmoi template SHALL include `Bash(wt list *)`, `Bash(wt config *)`, and `Bash(wt --help)` in `permissions.allow`. The `wt --help` rule SHALL match the bare `wt --help` invocation; it SHALL NOT carry a trailing wildcard, which would require an argument after `--help` and never match.

#### Scenario: wt list runs without prompt

- **WHEN** Claude Code attempts to run `wt list`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: bare wt --help runs without prompt

- **WHEN** Claude Code attempts to run `wt --help`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit GitHub CLI commands

The chezmoi template SHALL include `Bash(gh issue *)`, `Bash(gh pr *)`, `Bash(gh repo *)`, and `Bash(gh search *)` in `permissions.allow`. The template SHALL NOT include `Bash(gh api *)`: read-only `gh api` GET calls are auto-allowed by Claude Code's built-in detection, whereas a broad rule would also permit silent `gh api -X POST|DELETE` mutations.

#### Scenario: gh pr list runs without prompt

- **WHEN** Claude Code attempts to run `gh pr list`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: gh search runs without prompt

- **WHEN** Claude Code attempts to run `gh search code "needle"`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: gh api write is not allowlisted

- **WHEN** Claude Code attempts to run `gh api -X DELETE repos/owner/repo/issues/comments/1`
- **THEN** no allow rule SHALL match and the tool call SHALL fall through to the default ask
