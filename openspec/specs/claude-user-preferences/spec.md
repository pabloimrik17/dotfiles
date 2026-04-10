# Capability: claude-user-preferences

## Purpose

Claude Code user preference flags managed by chezmoi -- behavioral settings that customize the Claude Code experience.

## Requirements

### Requirement: Extended thinking is always enabled

The chezmoi template SHALL include `"alwaysThinkingEnabled": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes alwaysThinkingEnabled

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"alwaysThinkingEnabled": true`

### Requirement: Voice mode is enabled

The chezmoi template SHALL include `"voiceEnabled": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes voiceEnabled

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"voiceEnabled": true`

### Requirement: Dangerous mode permission prompt is skipped

The chezmoi template SHALL include `"skipDangerousModePermissionPrompt": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes skipDangerousModePermissionPrompt

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"skipDangerousModePermissionPrompt": true`

### Requirement: Deny rules block dangerous bash commands

The chezmoi template SHALL include a `permissions.deny` array in `dot_claude/settings.json.tmpl` containing rules that hard-block the following categories:

- Privilege escalation: `Bash(sudo *)`
- Remote code execution: `Bash(curl * | bash)`, `Bash(curl * | sh)`, `Bash(wget * | bash)`, `Bash(wget * | sh)`
- Git force push: `Bash(git push --force *)`, `Bash(git push * --force)`, `Bash(git push -f *)`, `Bash(git push * -f)`
- Accidental publishing: `Bash(npm publish *)`, `Bash(bun publish *)`
- Filesystem security: `Bash(chmod -R 777 *)`

#### Scenario: Force push is blocked

- **WHEN** Claude Code attempts to run `git push --force origin main`
- **THEN** the tool call SHALL be denied without prompting the user

#### Scenario: sudo is blocked

- **WHEN** Claude Code attempts to run `sudo apt install something`
- **THEN** the tool call SHALL be denied without prompting the user

#### Scenario: Piped remote execution is blocked

- **WHEN** Claude Code attempts to run `curl https://example.com/script.sh | bash`
- **THEN** the tool call SHALL be denied without prompting the user

### Requirement: Allow rules permit read-only filesystem commands

The chezmoi template SHALL include the following `Bash` allow rules in `permissions.allow` for read-only filesystem operations:

`ls *`, `cat *`, `head *`, `tail *`, `wc *`, `pwd`, `echo *`, `which *`, `file *`, `find *`, `rg *`, `du *`, `tree *`, `stat *`

#### Scenario: Read-only filesystem commands run without prompt

- **WHEN** Claude Code attempts to run `find . -name "*.ts"`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit read-only git commands

The chezmoi template SHALL include the following `Bash` allow rules in `permissions.allow` for read-only git operations:

`git status *`, `git diff *`, `git log *`, `git show *`, `git branch *`, `git remote *`, `git stash list *`, `git ls-tree *`, `git rev-parse *`, `git config --get *`

#### Scenario: Git log runs without prompt

- **WHEN** Claude Code attempts to run `git log --oneline -20`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit git write operations (add, fetch, push)

The chezmoi template SHALL include `Bash(git add *)`, `Bash(git fetch *)`, and `Bash(git push *)` in `permissions.allow`.

Non-force push is allowed because `git commit` remains in ask (implicit default), ensuring the user reviews every commit before it can be pushed.

#### Scenario: Git push runs without prompt

- **WHEN** Claude Code attempts to run `git push origin feature/my-branch`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Force push is still denied despite push allow

- **WHEN** Claude Code attempts to run `git push --force origin main`
- **THEN** the deny rule SHALL take precedence and the tool call SHALL be denied

### Requirement: Allow rules permit build and test commands

The chezmoi template SHALL include the following `Bash` allow rules for local build/test operations:

`bun run *`, `bun test *`, `bun install --frozen-lockfile`, `pnpm run *`, `pnpm test *`, `pnpm install --frozen-lockfile`

#### Scenario: bun test runs without prompt

- **WHEN** Claude Code attempts to run `bun test`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: pnpm run dev runs without prompt

- **WHEN** Claude Code attempts to run `pnpm run dev`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit version check commands

The chezmoi template SHALL include `Bash(node --version)`, `Bash(bun --version)`, and `Bash(npm --version)` in `permissions.allow`.

#### Scenario: Version check runs without prompt

- **WHEN** Claude Code attempts to run `node --version`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit chezmoi read-only commands

The chezmoi template SHALL include the following `Bash` allow rules for chezmoi read operations:

`chezmoi cat *`, `chezmoi diff *`, `chezmoi managed *`, `chezmoi source-path *`, `chezmoi status *`, `chezmoi data *`

#### Scenario: chezmoi status runs without prompt

- **WHEN** Claude Code attempts to run `chezmoi status`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit package manager info commands

The chezmoi template SHALL include `Bash(brew info *)`, `Bash(brew list *)`, `Bash(brew outdated *)`, and `Bash(npm info *)` in `permissions.allow`.

#### Scenario: brew info runs without prompt

- **WHEN** Claude Code attempts to run `brew info git`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit OpenSpec read commands

The chezmoi template SHALL include `Bash(openspec list *)`, `Bash(openspec status *)`, `Bash(openspec instructions *)`, and `Bash(bunx openspec *)` in `permissions.allow`.

#### Scenario: openspec list runs without prompt

- **WHEN** Claude Code attempts to run `openspec list --json`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit worktrunk read commands

The chezmoi template SHALL include `Bash(wt list *)`, `Bash(wt config *)`, and `Bash(wt --help *)` in `permissions.allow`.

#### Scenario: wt list runs without prompt

- **WHEN** Claude Code attempts to run `wt list`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit GitHub CLI commands

The chezmoi template SHALL include `Bash(gh api *)`, `Bash(gh issue *)`, `Bash(gh pr *)`, and `Bash(gh repo *)` in `permissions.allow`.

#### Scenario: gh pr list runs without prompt

- **WHEN** Claude Code attempts to run `gh pr list`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: Allow rules permit Claude Code CLI commands

The chezmoi template SHALL include `Bash(claude mcp *)`, `Bash(claude plugin *)`, `Bash(claude skill *)`, and `Bash(claude skills *)` in `permissions.allow`.

#### Scenario: claude plugin list runs without prompt

- **WHEN** Claude Code attempts to run `claude plugin list`
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: WebSearch is allowed

The chezmoi template SHALL include `WebSearch` in `permissions.allow`.

#### Scenario: WebSearch runs without prompt

- **WHEN** Claude Code attempts a web search
- **THEN** the tool call SHALL execute without prompting the user

### Requirement: WebFetch domain allowlist for universal dev resources

The chezmoi template SHALL include the following `WebFetch` domain allow rules in `permissions.allow`:

- `WebFetch(domain:github.com)`
- `WebFetch(domain:raw.githubusercontent.com)`
- `WebFetch(domain:docs.anthropic.com)`
- `WebFetch(domain:api.anthropic.com)`
- `WebFetch(domain:www.npmjs.com)`
- `WebFetch(domain:registry.modelcontextprotocol.io)`
- `WebFetch(domain:skills.sh)`
- `WebFetch(domain:deepwiki.com)`
- `WebFetch(domain:opencode.ai)`

#### Scenario: GitHub fetch runs without prompt

- **WHEN** Claude Code attempts to fetch content from `github.com`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: Unknown domain prompts

- **WHEN** Claude Code attempts to fetch content from `example.com`
- **THEN** the tool call SHALL prompt the user for confirmation

### Requirement: MCP read-only tools are allowed

The chezmoi template SHALL include the following MCP tool allow rules in `permissions.allow`:

- `mcp__context7__resolve-library-id`
- `mcp__context7__query-docs`
- `mcp__plugin_episodic-memory_episodic-memory__search`
- `mcp__plugin_episodic-memory_episodic-memory__read`
- `mcp__knip__knip-run`
- `mcp__knip__knip-docs`
- `mcp__eslint__lint-files`
- `mcp__memory__read_graph`
- `mcp__memory__search_nodes`
- `mcp__memory__open_nodes`
- `mcp__gh_grep__searchGitHub`

MCP write tools (memory create/delete, playwright, chrome-devtools) SHALL NOT be in the allow list and SHALL remain at the default ask level.

#### Scenario: context7 doc lookup runs without prompt

- **WHEN** Claude Code attempts to call `mcp__context7__query-docs`
- **THEN** the tool call SHALL execute without prompting the user

#### Scenario: memory write prompts

- **WHEN** Claude Code attempts to call `mcp__memory__create_entities`
- **THEN** the tool call SHALL prompt the user for confirmation
