# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: code-review skill installed globally`
- TO: `### Requirement: CodeRabbit review skill installed as coderabbit-review`

## MODIFIED Requirements

### Requirement: CodeRabbit review skill installed as coderabbit-review

The install script SHALL install the `code-review` skill from `coderabbitai/skills` globally via `skills.sh` in Group 9 under the name `coderabbit-review`, using `--rename`, so that no CodeRabbit skill takes the flat name `code-review` and Claude Code's built-in `/code-review` stays reachable.

#### Scenario: Skill not yet installed

- **WHEN** the user confirms agent skills installation and `coderabbit-review` is not in the installed skills list
- **THEN** the installer SHALL run `npx -y skills add coderabbitai/skills --skill code-review --rename coderabbit-review -g -y`

#### Scenario: Skill already installed

- **WHEN** the user confirms agent skills installation and `coderabbit-review` is already in the installed skills list
- **THEN** the installer SHALL skip installation and report it as already installed

#### Scenario: Non-macOS instructions

- **WHEN** the install script renders its non-macOS manual instructions
- **THEN** the agent-skills list contains `npx -y skills add coderabbitai/skills --skill code-review --rename coderabbit-review -g -y`
- **AND** no line installs `coderabbitai/skills` `code-review` without `--rename`

## ADDED Requirements

### Requirement: Old code-review skill removed from existing machines

After `coderabbit-review` is installed, the installer SHALL run `npx -y skills remove code-review -g -y` when the installed skills list holds a `code-review` entry whose source is `coderabbitai/skills` and that is not renamed. It SHALL leave a `code-review` from any other source alone, and SHALL keep the old copy when `coderabbit-review` failed to install.

#### Scenario: Old copy after a successful rename

- **WHEN** `coderabbit-review` is installed and the skills list holds `code-review` from `coderabbitai/skills` with no `renamedFrom`
- **THEN** the installer removes `code-review` from every agent
- **AND** `~/.claude/skills/code-review` no longer exists

#### Scenario: Rename install failed

- **WHEN** installing `coderabbit-review` fails and the old `code-review` from `coderabbitai/skills` is installed
- **THEN** the old `code-review` stays installed

#### Scenario: code-review from another source

- **WHEN** the skills list holds `code-review` whose source is not `coderabbitai/skills`
- **THEN** the installer does not remove it

#### Scenario: Nothing to remove

- **WHEN** the skills list holds no `code-review` from `coderabbitai/skills`
- **THEN** no `skills remove` command runs
