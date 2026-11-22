# Spec Delta

## ADDED Requirements

### Requirement: Foreign hook groups survive the merge

For each managed `hooks.<Event>` array, the merge SHALL drop live matcher groups that are AoE-owned (every command is one AoE v1.14.0's `is_aoe_hook_command` claims: it ends in `0 # aoe-hooks` once trailing quotes and whitespace are stripped, or it contains `aoe-hooks/$AOE_INSTANCE_ID`) or equal to a managed group, keep the other live groups in live order, and append the managed groups. It SHALL NOT remove any other group, such as the `SessionStart` group Rex adds.

#### Scenario: Rex group survives an apply

- **WHEN** the live `hooks.SessionStart` holds a Rex group and the AoE group
- **AND** `chezmoi apply` runs
- **THEN** `hooks.SessionStart` holds the Rex group, unchanged, followed by the managed AoE group

#### Scenario: A stale AoE group is replaced

- **WHEN** a live group in a managed event is AoE-owned and differs from every managed group
- **AND** `chezmoi apply` runs
- **THEN** that group is gone and the managed groups are present

#### Scenario: A foreign group in another managed event survives

- **WHEN** a live group without the sentinel sits in a managed event other than `SessionStart` (for example `Stop`)
- **AND** `chezmoi apply` runs
- **THEN** that group survives, ahead of the managed groups

#### Scenario: A foreign command that mentions the sentinel is kept

- **WHEN** a live group's only command contains `# aoe-hooks` but does not end in `0 # aoe-hooks`
- **AND** `chezmoi apply` runs
- **THEN** that group survives, ahead of the managed groups

#### Scenario: A legacy AoE group is replaced

- **WHEN** a live group's only command contains `aoe-hooks/$AOE_INSTANCE_ID` and no trailer
- **AND** `chezmoi apply` runs
- **THEN** that group is gone and the managed groups are present

#### Scenario: A group mixing AoE and foreign commands is kept as foreign

- **WHEN** a live group holds one command with the sentinel and one without
- **AND** `chezmoi apply` runs
- **THEN** that group survives unchanged, and the managed groups are appended after it

#### Scenario: A fresh file gets only the managed groups

- **WHEN** no live file exists, or it has no `hooks`
- **AND** `chezmoi apply` runs
- **THEN** each managed `hooks.<Event>` holds exactly the managed groups

#### Scenario: Repeat merge is byte-identical

- **WHEN** the merge output is fed back as the live file
- **THEN** the second merge produces the same bytes
