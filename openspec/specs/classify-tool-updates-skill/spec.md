# Capability: classify-tool-updates-skill

## Purpose

Provide a repo-tooling skill that, when a new tool is added to the dotfiles, classifies it by update mechanism (brew-managed, self-updating, repo-pinned, or manual) and, for manual-class tools, proposes the matching `update-extra` step plus spec delta while delegating documentation to the existing docs skills.

## Requirements

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

### Requirement: Four-way update classification

The skill SHALL classify each new tool into exactly one of four classes and prescribe the matching action:

1. **brew-managed** → no action (`brew upgrade` covers it)
2. **self-updating** → no action (do not wrap or duplicate the self-updater)
3. **repo-pinned** (Renovate-managed pins, version-pinned installers) → update via pin bump + `chezmoi apply`, never via `update-extra`
4. **manual** (none of the above) → add a step to `update-extra`

#### Scenario: Brew formula added

- **WHEN** the new tool is installed via brew formula or cask
- **THEN** the skill classifies it brew-managed and proposes no `update-extra` change

#### Scenario: Self-updating tool added

- **WHEN** the new tool ships its own updater (e.g. installed via official curl installer that self-updates)
- **THEN** the skill classifies it self-updating and proposes no `update-extra` change

#### Scenario: Pinned tool added

- **WHEN** the new tool is installed at a version pinned in the repo (Renovate-managed or hardcoded tag)
- **THEN** the skill classifies it repo-pinned and points to the pin-bump + `chezmoi apply` path

#### Scenario: Manual tool added

- **WHEN** the new tool is neither brew-managed, self-updating, nor repo-pinned
- **THEN** the skill classifies it manual and proposes its update command as a new `update-extra` step

### Requirement: update-extra maintenance

For a manual-class tool, the skill SHALL propose the exact one-line step addition (label + update command) for the `update-extra` function in `dot_zshrc.tmpl` and SHALL wait for user confirmation before editing. The skill SHALL also propose step removal when a manual-class tool is removed from the dotfiles. Each step add/remove proposal SHALL include the matching spec delta for the `extra-updates-command` capability, so the main spec's step list stays in sync.

#### Scenario: Step proposed and confirmed

- **WHEN** the skill classifies a tool as manual and the user confirms the proposal
- **THEN** the step line is added to the `update-extra` function in `dot_zshrc.tmpl`

#### Scenario: User rejects proposal

- **WHEN** the user rejects the proposed step
- **THEN** `dot_zshrc.tmpl` is not modified

#### Scenario: Manual tool removed

- **WHEN** a tool with an `update-extra` step is removed from the dotfiles
- **THEN** the skill proposes removing its step

### Requirement: Docs delegation

The skill SHALL NOT edit `README.md` or `docs/manual.html` itself; after an `update-extra` change it SHALL point to the existing `update-manual` and `update-readme` skills for documentation follow-up.

#### Scenario: Docs handled by existing skills

- **WHEN** a step is added to `update-extra`
- **THEN** the skill defers documentation updates to `update-manual`/`update-readme` instead of editing docs directly
