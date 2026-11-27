## ADDED Requirements

### Requirement: Code Mode is enabled on personal machines only

The managed `env` object in `dot_claude/modify_settings.json.tmpl` SHALL contain `"CLAUDE_CODE_EXPERIMENTAL_CODE_MODE": "1"` when chezmoi's `machineType` is `personal`, and SHALL NOT contain it for any other value, including an unset one. On those other machines the merge SHALL remove the key from the live file (see `claude-settings-merge`). The key SHALL live in user settings, because Claude Code ignores it in project settings.

#### Scenario: Personal machine gets Code Mode

- **WHEN** the template renders with `machineType = "personal"` and the merge runs on an empty live file
- **THEN** `env.CLAUDE_CODE_EXPERIMENTAL_CODE_MODE` is `"1"`
- **AND** `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is still `"1"`

#### Scenario: Work machine renders no Code Mode key

- **WHEN** the template renders with `machineType = "work"` and the merge runs on an empty live file
- **THEN** `env` has no `CLAUDE_CODE_EXPERIMENTAL_CODE_MODE` key
- **AND** `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` is `"1"`

#### Scenario: Hand-added key on a work machine is removed

- **WHEN** the live file on a `work` machine holds `env.CLAUDE_CODE_EXPERIMENTAL_CODE_MODE`
- **AND** `chezmoi apply` runs
- **THEN** the key is absent from the result, and every other `env` key survives

#### Scenario: Other env keys survive on a personal machine

- **WHEN** the live file on a `personal` machine holds an unmanaged `env` key
- **AND** `chezmoi apply` runs
- **THEN** that key keeps its value next to the two managed keys

#### Scenario: Both renders are valid and stable

- **WHEN** the merge output for either machine type is fed back as the live file
- **THEN** the second merge produces the same bytes
