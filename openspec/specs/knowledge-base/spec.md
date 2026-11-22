# knowledge-base Specification

## Purpose

Makes the knowledge base (the Obsidian vault of notes a person reads about tools and projects) available on every machine: its checkout, the Obsidian CLI that agents drive, where run knowledge is written, and how agents find it.

## Requirements

### Requirement: The knowledge base is cloned when absent

On macOS, on both machine types, the package installer SHALL clone the private `pabloimrik17/knowledge` repository to `~/WebstormProjects/knowledge` with `gh` when that path does not exist and the user confirms. When `gh` is missing or not authenticated, it SHALL warn and skip the clone. A failed clone SHALL warn and SHALL NOT be reported as success. Skipping or failing SHALL NOT stop later groups.

#### Scenario: Absent path with an authenticated gh

- **WHEN** the installer runs on macOS, `~/WebstormProjects/knowledge` does not exist, `gh auth status` succeeds and the user confirms
- **THEN** `~/WebstormProjects/knowledge` becomes a git checkout of `pabloimrik17/knowledge`

#### Scenario: Either machine type

- **WHEN** the installer is rendered for a `personal` machine and for a `work` machine
- **THEN** both renders contain the knowledge-base clone step

#### Scenario: gh is not authenticated

- **WHEN** the path does not exist and `gh` is missing or `gh auth status` fails
- **THEN** the installer warns that the knowledge base was not cloned and names the manual clone command, and the run continues

#### Scenario: The clone fails

- **WHEN** the path does not exist, the user confirms and `gh repo clone` exits non-zero (for example, because the authenticated account cannot read the repository)
- **THEN** the installer warns that the clone failed, leaves no partial checkout reported as present, and continues with later groups

#### Scenario: The user declines

- **WHEN** the path does not exist and the user declines the prompt
- **THEN** no clone runs and the installer reports the skip

### Requirement: An existing knowledge-base path is never modified

When `~/WebstormProjects/knowledge` already exists, the installer SHALL NOT clone, pull, fetch, reset or write inside it. It SHALL report a git checkout as present. It SHALL warn about a path that is not a git checkout, such as a directory created by an update run before the clone.

#### Scenario: Existing checkout

- **WHEN** the installer runs and `~/WebstormProjects/knowledge/.git` exists
- **THEN** it reports the knowledge base as present and runs no git command that changes the checkout or its remote-tracking refs

#### Scenario: Existing directory without git

- **WHEN** the installer runs and `~/WebstormProjects/knowledge` exists without `.git`
- **THEN** it warns that the path is not a knowledge-base checkout and leaves its contents untouched

#### Scenario: Path appears while the clone prompt waits

- **WHEN** the path is absent at the check, appears before the clone finishes, and the clone then succeeds or fails
- **THEN** the installer clones into a staging directory beside the path, warns, leaves the path's contents untouched, and removes only the staging directory

### Requirement: The Obsidian CLI registration is checked

On macOS, when `/Applications/Obsidian.app` exists, the installer SHALL warn when `/usr/local/bin/obsidian` does not resolve to the app's bundled CLI, or when Obsidian's `obsidian.json` lacks `"cli": true`. The warning SHALL say how to turn the CLI on: Settings → General → Command line interface. The installer SHALL NOT create the symlink or change Obsidian's settings.

#### Scenario: CLI registered

- **WHEN** Obsidian is installed, `/usr/local/bin/obsidian` resolves to `/Applications/Obsidian.app/Contents/MacOS/obsidian-cli` and `obsidian.json` has `"cli": true`
- **THEN** the installer emits no CLI warning

#### Scenario: CLI linked but turned off

- **WHEN** the symlink resolves to the bundled CLI and `obsidian.json` has no `cli` key, or `cli` is not `true`
- **THEN** the installer warns with the steps to turn on the CLI and leaves `obsidian.json` unchanged

#### Scenario: CLI not registered

- **WHEN** Obsidian is installed and `/usr/local/bin/obsidian` is missing
- **THEN** the installer warns with the steps to turn on the CLI and does not create the symlink

#### Scenario: Obsidian not installed

- **WHEN** `/Applications/Obsidian.app` does not exist
- **THEN** the installer emits no CLI warning

### Requirement: Run knowledge is written inside the knowledge base

The managed Claude Code settings SHALL set `pluginConfigs."experiments@monolab".options.knowledge_root` to `~/WebstormProjects/knowledge/updates`. The merge SHALL descend through `pluginConfigs`, the plugin entry and `options`, so other plugin entries and other options survive. Repeating the merge SHALL converge.

#### Scenario: Fresh settings

- **WHEN** `~/.claude/settings.json` has no `experiments@monolab` entry under `pluginConfigs` and chezmoi applies the managed settings
- **THEN** `pluginConfigs."experiments@monolab".options.knowledge_root` is `~/WebstormProjects/knowledge/updates`

#### Scenario: Unrelated plugin configuration survives

- **WHEN** the live file holds other `pluginConfigs` entries, or other options under `experiments@monolab`
- **THEN** they keep their values after the merge

#### Scenario: A different live value is replaced

- **WHEN** the live `knowledge_root` is empty or names another path
- **THEN** the merge sets it to `~/WebstormProjects/knowledge/updates`

#### Scenario: Repeated merge converges

- **WHEN** the merged output is processed again
- **THEN** the second output is byte-identical to the first

### Requirement: Agents find the knowledge base from any directory

chezmoi SHALL deploy a managed user rule to `~/.claude/rules/knowledge-base.md`. It SHALL state that the knowledge base is at `~/WebstormProjects/knowledge`, that agents write to it only when asked, that the vault's `AGENTS.md` holds its conventions, and that its `updates/` folder is script-owned run knowledge that agents never edit.

#### Scenario: Rule deployed

- **WHEN** `chezmoi apply` runs on either machine type
- **THEN** `~/.claude/rules/knowledge-base.md` exists with the managed content

#### Scenario: Rule content

- **WHEN** the deployed rule is read
- **THEN** it names `~/WebstormProjects/knowledge`, the write-only-when-asked policy, the vault `AGENTS.md` and the script-owned `updates/` folder

#### Scenario: Unmanaged rules survive

- **WHEN** `~/.claude/rules/` holds files that chezmoi does not manage, such as `plannotator-inbox.md`
- **THEN** `chezmoi apply` leaves them unchanged
