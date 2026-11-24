## MODIFIED Requirements

### Requirement: Selected Matt Pocock skills are installed globally

The installation configuration SHALL manage these skills from `mattpocock/skills`: `ask-matt`, `diagnosing-bugs`, `grill-with-docs`, `triage`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `tdd`, `to-spec`, `to-tickets`, `wayfinder`, `implement`, `prototype`, `research`, `domain-modeling`, `codebase-design`, `wizard`, `grill-me`, `grilling`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, and `writing-for-agents`. It SHALL NOT select `resolving-merge-conflicts`, which upstream removed in v1.3.0.

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

### Requirement: Manual fallback preserves selection and scope

The non-macOS fallback SHALL print a non-interactive skills.sh command that selects all 23 managed Matt Pocock skills, targets only OpenCode and Junie, and excludes `code-review`.

#### Scenario: Automatic installation is unavailable

- **WHEN** the package installer renders its non-macOS manual instructions
- **THEN** the output contains a reproducible skills.sh command for the 23 selected skills with explicit `opencode` and `junie` targets
- **AND** the output does not select all upstream skills or target Claude Code
