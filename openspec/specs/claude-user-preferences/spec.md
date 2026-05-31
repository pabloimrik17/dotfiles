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

### Requirement: Auto permission prompt is skipped

The chezmoi template SHALL include `"skipAutoPermissionPrompt": true` as a top-level key in `dot_claude/settings.json.tmpl`.

#### Scenario: Template includes skipAutoPermissionPrompt

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"skipAutoPermissionPrompt": true`

### Requirement: Effort level is set to xhigh

The chezmoi template SHALL include `"effortLevel": "xhigh"` as a top-level key in `dot_claude/settings.json.tmpl`. The value MUST be the lowercase string `"xhigh"`; other casings (e.g., `"xHigh"`, `"XHIGH"`) are not accepted by the Claude Code settings schema and are normalized to `"high"`.

#### Scenario: Template includes lowercase xhigh effortLevel

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"effortLevel": "xhigh"`

#### Scenario: Mixed-case value is not used

- **WHEN** the chezmoi template is read
- **THEN** the `effortLevel` value SHALL match the literal lowercase string `"xhigh"` and SHALL NOT be `"xHigh"` or any other casing

### Requirement: User-preference keys appear in canonical order

The chezmoi template SHALL emit the following user-preference top-level keys in this exact order:

1. `alwaysThinkingEnabled`
2. `skipDangerousModePermissionPrompt`
3. `skipAutoPermissionPrompt`
4. `voiceEnabled`
5. `effortLevel`

This ordering applies only to the keys listed above (the user-preference block). Other top-level keys (`env`, `statusLine`, `enabledPlugins`, `extraKnownMarketplaces`, `hooks`, `permissions`, etc.) are governed by their own requirements and may appear before or after this block.

#### Scenario: User-preference block is in canonical order

- **WHEN** the output of `chezmoi cat dot_claude/settings.json.tmpl` is parsed and the five user-preference keys above are extracted in source order
- **THEN** they SHALL appear in the order: `alwaysThinkingEnabled`, `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`, `voiceEnabled`, `effortLevel`

### Requirement: Default permission mode is auto

The chezmoi template SHALL include `"defaultMode": "auto"` inside the `permissions` object in `dot_claude/settings.json.tmpl`. Because Claude Code (v2.1.142+) ignores `permissions.defaultMode: "auto"` set in project or local settings, this rule MUST live in the user-scope template, which renders to `~/.claude/settings.json`.

In auto mode, `permissions.deny` and `permissions.allow` rules are still evaluated first and take precedence; only actions not resolved by a rule are routed to Claude Code's safety classifier, which runs without prompting the user.

#### Scenario: Template sets auto as the default permission mode

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** the `permissions` object in `~/.claude/settings.json` SHALL contain `"defaultMode": "auto"`

#### Scenario: New session starts in auto mode

- **WHEN** a Claude Code session starts on a supported model and API with no explicit `--permission-mode` override
- **THEN** the session SHALL begin in auto mode, executing rule-unmatched actions via the classifier without per-action prompts

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

### Requirement: Allow rules permit package manager info commands

The chezmoi template SHALL include `Bash(brew info *)`, `Bash(brew list *)`, `Bash(brew outdated *)`, and `Bash(npm info *)` in `permissions.allow`.

#### Scenario: brew info runs without prompt

- **WHEN** Claude Code attempts to run `brew info git`
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
