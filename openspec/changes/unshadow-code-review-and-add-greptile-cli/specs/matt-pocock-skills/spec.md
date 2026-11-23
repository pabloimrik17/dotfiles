# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Flat code-review ownership is preserved`
- TO: `### Requirement: Flat code-review stays out of Claude Code`

## MODIFIED Requirements

### Requirement: Selected Matt Pocock skills are installed globally

The installation configuration SHALL manage these skills from `mattpocock/skills`: `ask-matt`, `code-review`, `diagnosing-bugs`, `grill-with-docs`, `triage`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `tdd`, `to-spec`, `to-tickets`, `wayfinder`, `implement`, `prototype`, `research`, `domain-modeling`, `codebase-design`, `wizard`, `grill-me`, `grilling`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, and `writing-for-agents`.

#### Scenario: Selected skill is not yet installed

- **WHEN** the package installer runs with `npx` available and a selected skill name absent from the global skills registry
- **THEN** it installs that skill globally from `mattpocock/skills`

#### Scenario: Selected skill is already installed

- **WHEN** the package installer runs and a selected skill name is already present in the global skills registry with both OpenCode and Junie coverage
- **THEN** it does not reinstall or overwrite that skill

#### Scenario: Selected skill is present without the required agent coverage

- **WHEN** the package installer runs and a selected skill name is present in the global skills registry but is not exposed to both OpenCode and Junie
- **THEN** it reinstalls that skill so the missing agent coverage is reconciled

#### Scenario: One selected skill fails to install

- **WHEN** a selected Matt Pocock skill installation fails
- **THEN** the installer reports the failure and continues processing the remaining selected skills

#### Scenario: Retired upstream skill is not requested

- **WHEN** the rendered package installer and fallback instructions are inspected
- **THEN** no skills.sh add operation selects `resolving-merge-conflicts`

### Requirement: Standalone skills target only OpenCode and Junie

Every managed `mattpocock/skills` standalone installation SHALL explicitly target the skills.sh agents `opencode` and `junie` and SHALL NOT target `claude-code`.

#### Scenario: Fresh standalone installation

- **WHEN** a selected Matt Pocock standalone skill is installed by the managed package installer
- **THEN** its global registry record exposes it to OpenCode and Junie
- **AND** the managed operation does not expose it as a Claude Code standalone skill

#### Scenario: Existing unmanaged Claude Code exposure

- **WHEN** verification finds a selected Matt Pocock standalone skill already exposed to Claude Code outside the managed configuration
- **THEN** verification reports the stale exposure without deleting it automatically

### Requirement: Flat code-review stays out of Claude Code

Matt Pocock's `code-review` SHALL be installed only for OpenCode and Junie, after the old CodeRabbit `code-review` is removed, and only when no `code-review` from another source remains. When the agent-skills group ends, the installer SHALL warn if `~/.claude/skills/code-review` exists, because any skill there shadows Claude Code's built-in `/code-review`.

#### Scenario: Managed skill selection is inspected

- **WHEN** the rendered package installer and fallback instructions are inspected
- **THEN** every skills.sh add operation that selects `code-review` from `mattpocock/skills` targets only `opencode` and `junie`

#### Scenario: Global code-review is inspected after installation

- **WHEN** the global skills registry is inspected after applying the configuration
- **THEN** flat `code-review` is sourced from `mattpocock/skills` and exposed to OpenCode and Junie
- **AND** `~/.claude/skills/code-review` does not exist

#### Scenario: Old CodeRabbit copy still present

- **WHEN** the skills list still holds `code-review` from `coderabbitai/skills` after the CodeRabbit step
- **THEN** Matt Pocock's `code-review` is not installed in this run and the installer says why

#### Scenario: Old copy removed in the same run

- **WHEN** the CodeRabbit step removed the old `code-review` earlier in this run
- **THEN** Matt Pocock's `code-review` is checked against the skills list read after that removal and installed in the same run

#### Scenario: Claude Code link found when the group ends

- **WHEN** `~/.claude/skills/code-review` exists when the agent-skills group ends
- **THEN** the installer prints a warning naming that path and the built-in it shadows

### Requirement: Manual fallback preserves selection and scope

The non-macOS fallback SHALL print a non-interactive skills.sh command that selects all 24 managed Matt Pocock skills and targets only OpenCode and Junie.

#### Scenario: Automatic installation is unavailable

- **WHEN** the package installer renders its non-macOS manual instructions
- **THEN** the output contains a reproducible skills.sh command for the 24 selected skills with explicit `opencode` and `junie` targets
- **AND** the output does not select all upstream skills or target Claude Code
