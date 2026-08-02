## ADDED Requirements

### Requirement: Extension group prompt and fallback summary list every extension

The gh CLI extensions group presents a confirm prompt naming what it installs, and the non-macOS branch of the install script prints a manual-instructions summary covering the same ground. Both SHALL name every extension the group installs. Adding an extension to the group SHALL update both, so neither can drift into under-reporting what will be installed.

#### Scenario: User reads the confirm prompt

- **WHEN** chezmoi apply reaches the gh CLI extensions group and prompts for confirmation
- **THEN** the prompt names every extension the group installs, so the user can see what confirming will install

#### Scenario: User reads the fallback summary on an unsupported platform

- **WHEN** the install script runs on a platform where the group cannot install extensions automatically and prints the manual-instructions summary
- **THEN** the summary lists the install command for every extension the group installs, not a subset

### Requirement: Extension presence checks match the whole repository token

`gh extension list` emits tab-separated `COMMAND`, `OWNER/REPO`, `VERSION` columns and offers no `--json` output. Each extension's idempotency guard SHALL match the complete `OWNER/REPO` token rather than a substring, so an unrelated extension whose name merely extends another's cannot be mistaken for it and cause a required install to be skipped.

#### Scenario: An extension with a longer name is installed

- **WHEN** the group checks whether `github/gh-stack` is installed and only a differently-named extension such as `github/gh-stack-extra` is present
- **THEN** the guard does not treat `github/gh-stack` as installed, and the install proceeds
