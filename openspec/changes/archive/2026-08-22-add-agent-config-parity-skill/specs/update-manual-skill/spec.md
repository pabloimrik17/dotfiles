## MODIFIED Requirements

### Requirement: Skill auto-triggers on config file changes

The system SHALL provide a skill named `update-manual` whose body lives at `.agents/skills/update-manual/SKILL.md` and is exposed to each agent per the `repo-skill-canonical-layout` capability, whose description triggers auto-invocation when Claude detects changes to dotfiles configuration files including zshrc, gitconfig, ghostty config, starship.toml, atuin config, fzf config, tmux.conf, .mcp.json, Claude Code settings, OpenCode config, brew install script, or gh extension configs.

#### Scenario: Alias added to zshrc

- **WHEN** a new alias is added to `dot_zshrc.tmpl`
- **THEN** the skill activates and analyzes whether docs/manual.html needs a corresponding table row

#### Scenario: New tool config added

- **WHEN** a new config directory is added under `dot_config/`
- **THEN** the skill activates and analyzes whether a new section or subsection is needed in the manual

#### Scenario: Unrelated file changed

- **WHEN** changes are made only to files unrelated to configuration (e.g., openspec artifacts, CI workflows, package.json)
- **THEN** the skill does NOT activate
