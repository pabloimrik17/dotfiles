## MODIFIED Requirements

### Requirement: Skill exists as repo tooling

The system SHALL provide a skill named `classify-tool-updates` whose body lives at `.agents/skills/classify-tool-updates/SKILL.md` and is exposed to each agent per the `repo-skill-canonical-layout` capability, whose description triggers auto-invocation when a new tool is added to the dotfiles (install script, zshrc-initialized tool, or new config), or when a tool carrying an `update-extra` step is removed. The skill SHALL live in repo-root dot-directories (repo tooling), which chezmoi never applies to the system.

#### Scenario: New tool added to install script

- **WHEN** a new tool installation is added to `run_onchange_install-packages.sh.tmpl`
- **THEN** the skill activates and classifies the tool by update mechanism

#### Scenario: Tool with an update-extra step removed

- **WHEN** a tool that has an `update-extra` step in `dot_zshrc.tmpl` is removed from the dotfiles
- **THEN** the skill activates and proposes deleting that step, so no stale update step remains

#### Scenario: Not applied by chezmoi

- **WHEN** `chezmoi apply` runs
- **THEN** nothing under repo-root `.agents/`, `.claude/`, or `.junie/` is deployed to `$HOME`
