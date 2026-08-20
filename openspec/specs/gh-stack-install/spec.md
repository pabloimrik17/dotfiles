# gh-stack-install Specification

## Purpose
Makes GitHub's stacked pull requests usable from the terminal on every repository on this machine, by installing the `gh-stack` extension, its Claude Code agent skill, and a short shell alias for the command.
## Requirements
### Requirement: gh-stack extension install

The chezmoi install script SHALL install `gh-stack` in the existing gh CLI extensions confirmable group using `gh extension install github/gh-stack`. The extension SHALL be installed unpinned, matching the other extensions in the group, because the extras updater upgrades all gh extensions and would undo a pin.

#### Scenario: Fresh install of gh-stack

- **WHEN** chezmoi apply runs and the user confirms the gh extensions group
- **THEN** `gh-stack` is installed via `gh extension install github/gh-stack`

#### Scenario: gh-stack already installed

- **WHEN** chezmoi apply runs and gh-stack is already listed in `gh extension list`
- **THEN** the script skips installation and reports it as already installed

#### Scenario: gh CLI not available

- **WHEN** chezmoi apply runs but `gh` is not found in PATH
- **THEN** the script warns that gh is required and skips the extensions group, including gh-stack

#### Scenario: Extension is kept up to date

- **WHEN** the user runs the extras update step
- **THEN** `gh extension upgrade --all` upgrades gh-stack alongside the other extensions, with no gh-stack-specific update step

### Requirement: gh-stack agent skill for Claude Code

The chezmoi install script SHALL install the gh-stack agent skill at user scope for the `claude-code` agent, so Claude Code knows the `gh stack` command surface in every repository. Detection of an existing install SHALL use structured JSON output rather than matching human-readable text, and SHALL be restricted to user scope: `gh skill list` defaults to both project and user scope, so an unscoped check would let a project-scoped skill mask a missing user-scoped one. The list check SHALL NOT be filtered by `--agent`: gh reports skills installed into `~/.claude/skills` under the agent hosts `cline, universal, warp` unless the SKILL.md carries a Claude-specific key such as `allowed-tools`, so an `--agent`-filtered check never matches and the script reinstalls on every run — blocking on `gh skill install`'s overwrite prompt, which chezmoi's stdio cannot answer. `--agent claude-code` stays on the install side, where it selects the destination. The install SHALL also pass `--force`, so a missed detection overwrites silently instead of blocking on that prompt.

#### Scenario: Fresh install of the skill

- **WHEN** chezmoi apply runs, the user confirms the gh extensions group, and the gh-stack skill is not installed
- **THEN** the skill is installed via `gh skill install github/gh-stack gh-stack --agent claude-code --scope user --force`

#### Scenario: Skill already installed

- **WHEN** `gh skill list --scope user --json skillName` already reports `gh-stack`
- **THEN** the script skips installation and reports it as already installed

#### Scenario: Skill is available outside this repository

- **WHEN** the user opens Claude Code in any repository on the machine
- **THEN** the gh-stack skill is available, because it is installed at user scope rather than project scope

### Requirement: gs shell alias

The zshrc SHALL define `gs` as an alias for `gh stack`, placed in the GitHub aliases section alongside `ghpr`, `ghpv`, `ghpl`, `ghd`, and `ghe`. The zshrc SHALL NOT define `gs` as a shorthand for `git status`: the OMZ git plugin already provides `gst`, `gss`, and `gsb`, and duplicating plugin aliases is disallowed for the same reason the gitconfig omits `st`, `co`, and `br`.

The alias SHALL be a shell alias only. No executable named `gs` SHALL be installed on PATH, because `~/.local/bin` is prepended to PATH and a `gs` executable there would shadow the Ghostscript binary of the same name in every context, including non-interactive scripts.

#### Scenario: User drives a stack via the alias

- **WHEN** the user types `gs view` in an interactive shell
- **THEN** `gh stack view` is executed

#### Scenario: User checks git status

- **WHEN** the user types `gs` expecting the old `git status` behavior
- **THEN** `gh stack` runs instead, and `git status` remains available as `gst` from the OMZ git plugin

#### Scenario: Non-interactive shell resolves gs

- **WHEN** a non-interactive shell that does not load zshrc runs `gs` — a lazygit custom command, a television preview, or a worktrunk hook
- **THEN** `gs` does not resolve to `gh stack`, and callers in those contexts invoke `gh stack` in full

### Requirement: rerere already enabled globally

The dotfiles SHALL keep `rerere.enabled = true` in the global gitconfig, so that `gh stack init`'s automatic per-repository rerere enablement is a no-op and conflict resolutions are remembered across cascading rebases in every repository.

#### Scenario: gh stack init in a fresh repository

- **WHEN** the user runs `gh stack init` in a repository with no local rerere setting
- **THEN** rerere is already enabled globally, so the stack inherits it without gh-stack changing repository-local config in a way that diverges from the dotfiles

