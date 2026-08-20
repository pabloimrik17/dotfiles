## MODIFIED Requirements

### Requirement: Extended thinking is always enabled

The managed key set SHALL include `"alwaysThinkingEnabled": true` as a top-level key in `dot_claude/modify_settings.json.tmpl`.

#### Scenario: Template includes alwaysThinkingEnabled

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"alwaysThinkingEnabled": true`

### Requirement: Voice mode is enabled

The managed key set SHALL include `"voiceEnabled": true` as a top-level key in `dot_claude/modify_settings.json.tmpl`.

#### Scenario: Template includes voiceEnabled

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"voiceEnabled": true`

### Requirement: Dangerous mode permission prompt is skipped

The managed key set SHALL include `"skipDangerousModePermissionPrompt": true` as a top-level key in `dot_claude/modify_settings.json.tmpl`.

#### Scenario: Template includes skipDangerousModePermissionPrompt

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"skipDangerousModePermissionPrompt": true`

### Requirement: Auto permission prompt is skipped

The managed key set SHALL include `"skipAutoPermissionPrompt": true` as a top-level key in `dot_claude/modify_settings.json.tmpl`.

#### Scenario: Template includes skipAutoPermissionPrompt

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"skipAutoPermissionPrompt": true`

### Requirement: Effort level is set to xhigh

The managed key set SHALL include `"effortLevel": "xhigh"` as a top-level key in `dot_claude/modify_settings.json.tmpl`. The value MUST be the lowercase string `"xhigh"`; other casings (e.g., `"xHigh"`, `"XHIGH"`) are not accepted by the Claude Code settings schema and are normalized to `"high"`.

#### Scenario: Template includes lowercase xhigh effortLevel

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain `"effortLevel": "xhigh"`

#### Scenario: Mixed-case value is not used

- **WHEN** the chezmoi template is read
- **THEN** the `effortLevel` value SHALL match the literal lowercase string `"xhigh"` and SHALL NOT be `"xHigh"` or any other casing

### Requirement: Default permission mode is auto

The managed key set SHALL include `"defaultMode": "auto"` inside the `permissions` object in `dot_claude/modify_settings.json.tmpl`. Because Claude Code (v2.1.142+) ignores `permissions.defaultMode: "auto"` set in project or local settings, this rule MUST live in the user-scope source, which materializes `~/.claude/settings.json`.

In auto mode, `permissions.deny` and `permissions.allow` rules are still evaluated first and take precedence; only actions not resolved by a rule are routed to Claude Code's safety classifier, which runs without prompting the user.

#### Scenario: Template sets auto as the default permission mode

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** the `permissions` object in `~/.claude/settings.json` SHALL contain `"defaultMode": "auto"`

#### Scenario: New session starts in auto mode

- **WHEN** a Claude Code session starts on a supported model and API with no explicit `--permission-mode` override
- **THEN** the session SHALL begin in auto mode, executing rule-unmatched actions via the classifier without per-action prompts

### Requirement: Deny rules block dangerous bash commands

The managed key set SHALL include a `permissions.deny` array in `dot_claude/modify_settings.json.tmpl` containing rules that hard-block the following categories:

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

### Requirement: Claude attribution is disabled in commits and pull requests

The managed key set SHALL include a top-level `attribution` object in `dot_claude/modify_settings.json.tmpl` with both `commit` and `pr` set to the empty string:

```json
"attribution": {
  "commit": "",
  "pr": ""
}
```

An empty `commit` string suppresses the entire commit attribution block, eliminating the `Co-Authored-By: Claude …` trailer and the `🤖 Generated with [Claude Code]…` line. An empty `pr` string removes the attribution line from pull request descriptions.

The managed key set SHALL NOT use the deprecated boolean key `includeCoAuthoredBy`; `attribution` is the current, supported mechanism and supersedes it.

#### Scenario: Template includes empty attribution object

- **WHEN** chezmoi applies `dot_claude/modify_settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain an `attribution` object equal to `{"commit": "", "pr": ""}`

#### Scenario: Deprecated includeCoAuthoredBy key is absent

- **WHEN** the materialized output of `chezmoi cat dot_claude/modify_settings.json.tmpl` is parsed
- **THEN** the JSON SHALL NOT contain a top-level `includeCoAuthoredBy` key

#### Scenario: Commit authored by Claude Code carries no attribution

- **WHEN** a Claude Code session running under the applied settings creates a git commit
- **THEN** the commit message SHALL NOT contain a `Co-Authored-By: Claude` trailer
- **AND** the commit message SHALL NOT contain a `🤖 Generated with [Claude Code]` line

#### Scenario: Pull request body carries no attribution

- **WHEN** a Claude Code session running under the applied settings opens a pull request
- **THEN** the pull request body SHALL NOT contain a `🤖 Generated with [Claude Code]` line
