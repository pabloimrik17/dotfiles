# gh-dash-install Specification

## Purpose

TBD - created by archiving change add-gh-dash. Update Purpose after archive.
## Requirements
### Requirement: gh extension install section

The chezmoi install script SHALL include a new confirmable group for gh CLI extensions, placed after the brew packages group. The section SHALL install `gh-dash` using `gh extension install dlvhdr/gh-dash`.

#### Scenario: Fresh install of gh-dash

- **WHEN** chezmoi apply runs and the user confirms the gh extensions group
- **THEN** `gh-dash` is installed via `gh extension install dlvhdr/gh-dash`

#### Scenario: gh-dash already installed

- **WHEN** chezmoi apply runs and gh-dash is already listed in `gh extension list`
- **THEN** the script skips installation and reports it as already installed

#### Scenario: gh CLI not available

- **WHEN** chezmoi apply runs but `gh` is not found in PATH
- **THEN** the script warns that gh is required and skips the extensions group

### Requirement: Shell alias

The zshrc SHALL define alias `ghd="gh dash"` in the GitHub aliases section alongside `ghpr`, `ghpv`, and `ghpl`.

#### Scenario: User launches gh-dash via alias

- **WHEN** the user types `ghd` in the terminal
- **THEN** `gh dash` is executed, opening the gh-dash TUI

### Requirement: Extension group prompt and fallback summary cover everything the group installs

The gh CLI extensions group presents a confirm prompt naming what it installs, and the non-macOS branch of the install script prints a manual-instructions summary covering the same ground. The group installs `gh` extensions *and* `gh` agent skills, so both SHALL account for both kinds: the prompt names every extension and states that agent skills are installed too, and the summary lists the install command for every extension and every skill. Adding an extension or a skill to the group SHALL update both, so neither can drift into under-reporting what will be installed.

#### Scenario: User reads the confirm prompt

- **WHEN** chezmoi apply reaches the gh CLI extensions group and prompts for confirmation
- **THEN** the prompt names every extension the group installs and states that gh agent skills are installed as well, so the user can see what confirming will install

#### Scenario: User reads the fallback summary on an unsupported platform

- **WHEN** the install script runs on a platform where the group cannot install automatically and prints the manual-instructions summary
- **THEN** the summary lists the install command for every extension and every agent skill the group installs, not a subset
- **AND** each skill command carries the same flags as the automated path (`--agent claude-code --scope user --force`), so following the summary by hand lands the skill in the same place
- **AND** the skill commands are listed under their own heading rather than under the extensions heading, so neither kind is misreported as the other

### Requirement: Extension presence checks match the whole repository token

`gh extension list` emits tab-separated `COMMAND`, `OWNER/REPO`, `VERSION` columns and offers no `--json` output. Each extension's idempotency guard SHALL match the complete `OWNER/REPO` token rather than a substring, so an unrelated extension whose name merely extends another's cannot be mistaken for it and cause a required install to be skipped.

#### Scenario: An extension with a longer name is installed

- **WHEN** the group checks whether `github/gh-stack` is installed and only a differently-named extension such as `github/gh-stack-extra` is present
- **THEN** the guard does not treat `github/gh-stack` as installed, and the install proceeds

