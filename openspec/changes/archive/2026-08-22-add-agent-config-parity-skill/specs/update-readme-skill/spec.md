## MODIFIED Requirements

### Requirement: Skill auto-triggers on tool-level changes

The system SHALL provide a skill named `update-readme` whose body lives at `.agents/skills/update-readme/SKILL.md` and is exposed to each agent per the `repo-skill-canonical-layout` capability, whose description triggers auto-invocation when Claude detects tool-level changes: new tool installed, tool removed, setup process changed, significant visual changes (theme, prompt), or a new workflow pattern added. The skill SHALL NOT trigger on alias-level or keybinding-level changes.

#### Scenario: New tool added to install script

- **WHEN** a new brew package or cask is added to the install script
- **THEN** the skill activates and analyzes whether README.md's "What's Included" table needs a new row

#### Scenario: New alias added (no trigger)

- **WHEN** only a new alias is added for an existing tool
- **THEN** the skill does NOT activate (this is manual-level, not README-level)

#### Scenario: Tool removed from setup

- **WHEN** a tool is removed from the install script or its config is deleted
- **THEN** the skill activates and proposes removing the corresponding README table row

#### Scenario: New workflow pattern added

- **WHEN** a new workflow pattern is added to the dotfiles
- **THEN** the skill activates and analyzes whether README.md's "Daily Workflows" section needs updating
