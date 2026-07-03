# gh-skill-install Delta

## ADDED Requirements

### Requirement: gh agent skill install

The chezmoi install script SHALL install the official `gh` agent skill for Claude Code inside the existing gh CLI extensions confirmable group, using `gh skill install cli/cli gh --agent claude-code --scope user` (available since gh 2.94). Detection SHALL be structured — `gh skill list --agent claude-code --json skillName --jq '.[].skillName'` matched exactly against `gh` — not grepping human-readable output.

#### Scenario: Fresh install of the gh skill

- **WHEN** chezmoi apply runs, the user confirms the gh extensions group, and the skill is not yet installed
- **THEN** the script runs `gh skill install cli/cli gh --agent claude-code --scope user`

#### Scenario: gh skill already installed

- **WHEN** chezmoi apply runs and `gh skill list --agent claude-code --json skillName` already contains `gh`
- **THEN** the script skips installation and reports it as already installed

#### Scenario: Install failure is non-fatal

- **WHEN** `gh skill install` fails (offline, auth expired)
- **THEN** the script records the error via the standard `error` helper and continues with the remaining groups
