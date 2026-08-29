## Purpose

Manage Matt Pocock's standalone skills for OpenCode and Junie while preserving deterministic agent scope and avoiding global flat-name conflicts.

## ADDED Requirements

### Requirement: Selected Matt Pocock skills are installed globally

The installation configuration SHALL manage these skills from `mattpocock/skills`: `ask-matt`, `diagnosing-bugs`, `grill-with-docs`, `triage`, `improve-codebase-architecture`, `setup-matt-pocock-skills`, `tdd`, `to-spec`, `to-tickets`, `wayfinder`, `implement`, `prototype`, `research`, `domain-modeling`, `codebase-design`, `resolving-merge-conflicts`, `wizard`, `grill-me`, `grilling`, `handoff`, `teach`, `to-questionnaire`, `wait-what`, and `writing-for-agents`.

#### Scenario: Selected skill is not yet installed
- **WHEN** the package installer runs with `npx` available and a selected skill name absent from the global skills registry
- **THEN** it installs that skill globally from `mattpocock/skills`

#### Scenario: Selected skill is already installed
- **WHEN** the package installer runs and a selected skill name is already present in the global skills registry
- **THEN** it does not reinstall or overwrite that skill

#### Scenario: One selected skill fails to install
- **WHEN** a selected Matt Pocock skill installation fails
- **THEN** the installer reports the failure and continues processing the remaining selected skills

### Requirement: Standalone skills target only OpenCode and Junie

Every managed `mattpocock/skills` standalone installation SHALL explicitly target the skills.sh agents `opencode` and `junie` and SHALL NOT target `claude-code`.

#### Scenario: Fresh standalone installation
- **WHEN** a selected Matt Pocock standalone skill is installed by the managed package installer
- **THEN** its global registry record exposes it to OpenCode and Junie
- **AND** the managed operation does not expose it as a Claude Code standalone skill

#### Scenario: Existing unmanaged Claude Code exposure
- **WHEN** verification finds a selected Matt Pocock standalone skill already exposed to Claude Code outside the managed configuration
- **THEN** verification reports the stale exposure without deleting it automatically
- **AND** remediation excludes the global `code-review` skill

### Requirement: Flat code-review ownership is preserved

The standalone Matt Pocock selection SHALL exclude `code-review` so that the existing CodeRabbit skill remains the sole owner of the flat global `code-review` name.

#### Scenario: Managed skill selection is inspected
- **WHEN** the rendered package installer and fallback instructions are inspected
- **THEN** no skills.sh add operation selects `code-review` from `mattpocock/skills`

#### Scenario: Global code-review is inspected after installation
- **WHEN** the global skills registry is inspected after applying the configuration
- **THEN** flat `code-review` is sourced from `coderabbitai/skills`
- **AND** no Matt Pocock installation overwrites it

### Requirement: Standalone skills use the existing global update path

The managed Matt Pocock standalone skills SHALL remain registered with skills.sh so the existing global `skills update` operation can refresh them without a Matt-specific update step.

#### Scenario: Global skills update runs
- **WHEN** the existing `update-extra` skills.sh globals step runs
- **THEN** the selected Matt Pocock standalone skills are eligible for refresh through their skills.sh registry records

#### Scenario: Update configuration is inspected
- **WHEN** this capability is implemented
- **THEN** no additional Matt-specific `update-extra` step or Renovate version pin is added

### Requirement: Manual fallback preserves selection and scope

The non-macOS fallback SHALL print a non-interactive skills.sh command that selects all 24 managed Matt Pocock skills, targets only OpenCode and Junie, and excludes `code-review`.

#### Scenario: Automatic installation is unavailable
- **WHEN** the package installer renders its non-macOS manual instructions
- **THEN** the output contains a reproducible skills.sh command for the 24 selected skills with explicit `opencode` and `junie` targets
- **AND** the output does not select all upstream skills or target Claude Code
