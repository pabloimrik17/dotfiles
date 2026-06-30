## ADDED Requirements

### Requirement: Claude attribution is disabled in commits and pull requests

The chezmoi template SHALL include a top-level `attribution` object in `dot_claude/settings.json.tmpl` with both `commit` and `pr` set to the empty string:

```json
"attribution": {
  "commit": "",
  "pr": ""
}
```

An empty `commit` string suppresses the entire commit attribution block, eliminating the `Co-Authored-By: Claude …` trailer and the `🤖 Generated with [Claude Code]…` line. An empty `pr` string removes the attribution line from pull request descriptions.

The template SHALL NOT use the deprecated boolean key `includeCoAuthoredBy`; `attribution` is the current, supported mechanism and supersedes it.

#### Scenario: Template includes empty attribution object

- **WHEN** chezmoi applies `dot_claude/settings.json.tmpl`
- **THEN** `~/.claude/settings.json` SHALL contain an `attribution` object equal to `{"commit": "", "pr": ""}`

#### Scenario: Deprecated includeCoAuthoredBy key is absent

- **WHEN** the rendered output of `chezmoi cat dot_claude/settings.json.tmpl` is parsed
- **THEN** the JSON SHALL NOT contain a top-level `includeCoAuthoredBy` key

#### Scenario: Commit authored by Claude Code carries no attribution

- **WHEN** a Claude Code session running under the applied settings creates a git commit
- **THEN** the commit message SHALL NOT contain a `Co-Authored-By: Claude` trailer
- **AND** the commit message SHALL NOT contain a `🤖 Generated with [Claude Code]` line

#### Scenario: Pull request body carries no attribution

- **WHEN** a Claude Code session running under the applied settings opens a pull request
- **THEN** the pull request body SHALL NOT contain a `🤖 Generated with [Claude Code]` line
