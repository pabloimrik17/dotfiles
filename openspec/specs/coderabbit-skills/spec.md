## Purpose

Global installation of CodeRabbit agent skills (`code-review`, `autofix`) via `skills.sh` for use by AI coding agents.

## Requirements

### Requirement: code-review skill installed globally

The install script SHALL install the `code-review` skill from `coderabbitai/skills` globally via `skills.sh` in Group 9.

#### Scenario: Skill not yet installed

- **WHEN** the user confirms agent skills installation and `code-review` is not in the installed skills list
- **THEN** the installer SHALL run `npx -y skills add coderabbitai/skills --skill code-review -g -y`

#### Scenario: Skill already installed

- **WHEN** the user confirms agent skills installation and `code-review` is already in the installed skills list
- **THEN** the installer SHALL skip installation and report it as already installed

### Requirement: autofix skill installed globally

The install script SHALL install the `autofix` skill from `coderabbitai/skills` globally via `skills.sh` in Group 9.

#### Scenario: Skill not yet installed

- **WHEN** the user confirms agent skills installation and `autofix` is not in the installed skills list
- **THEN** the installer SHALL run `npx -y skills add coderabbitai/skills --skill autofix -g -y`

#### Scenario: Skill already installed

- **WHEN** the user confirms agent skills installation and `autofix` is already in the installed skills list
- **THEN** the installer SHALL skip installation and report it as already installed
