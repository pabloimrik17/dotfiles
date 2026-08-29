## MODIFIED Requirements

### Requirement: Skill auto-triggers on config file changes

The system SHALL provide a skill named `update-manual` whose body lives at `.agents/skills/update-manual/SKILL.md` and is exposed to each agent per the `repo-skill-canonical-layout` capability, whose description triggers auto-invocation when an agent detects changes to dotfiles configuration files including zshrc, gitconfig, ghostty config, starship.toml, atuin config, fzf config, tmux.conf, .mcp.json, Claude Code settings, Codex installation or user configuration, OpenCode config, brew install script, or gh extension configs.

#### Scenario: Alias added to zshrc

- **WHEN** a new alias is added to `dot_zshrc.tmpl`
- **THEN** the skill activates and analyzes whether docs/manual.html needs a corresponding table row

#### Scenario: New tool config added

- **WHEN** a new config directory is added under `dot_config/`
- **THEN** the skill activates and analyzes whether a new section or subsection is needed in the manual

#### Scenario: Codex installation or config changes

- **WHEN** the Codex installer stanza changes or a future source under `dot_codex/` is added, modified, or removed
- **THEN** the skill activates and analyzes the Codex manual section

#### Scenario: Project Codex output is ignored

- **WHEN** changes are made only under project `.codex/**`
- **THEN** the skill does NOT activate

#### Scenario: Unrelated file changed

- **WHEN** changes are made only to files unrelated to configuration (e.g., openspec artifacts, CI workflows, package.json)
- **THEN** the skill does NOT activate

### Requirement: Config-to-section mapping

The skill SHALL contain a mapping of configuration source files to manual.html sections, enabling targeted analysis without scanning the entire HTML file. The mapping SHALL associate the Codex installer stanza in `run_onchange_install-packages.sh.tmpl` and any future `dot_codex/**` source with Section 13 (Codex).

#### Scenario: zshrc eza aliases changed

- **WHEN** eza-related aliases in zshrc are modified
- **THEN** the skill identifies Section 3 (Files & Viewing) as the target section

#### Scenario: Multiple config files changed

- **WHEN** changes span both gitconfig and ghostty config
- **THEN** the skill identifies both Section 1 (Terminal) and Section 4 (Git) as targets

#### Scenario: Codex source changes

- **WHEN** the Codex installer or a future `dot_codex/**` source changes
- **THEN** the skill identifies Section 13 (Codex) as the target section
