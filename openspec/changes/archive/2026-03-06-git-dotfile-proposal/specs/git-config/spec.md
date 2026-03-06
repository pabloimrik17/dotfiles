## ADDED Requirements

### Requirement: Chezmoi-managed gitconfig template

The system SHALL provide a `dot_gitconfig.tmpl` file that chezmoi renders to `~/.gitconfig`. The template SHALL use `{{ .name }}` and `{{ .email }}` from chezmoi data for the `[user]` section.

#### Scenario: Fresh machine apply

- **WHEN** `chezmoi apply` runs on a machine with no `~/.gitconfig`
- **THEN** `~/.gitconfig` is created with the user's name and email from chezmoi data, and all configured sections are present

#### Scenario: Existing unmanaged gitconfig

- **WHEN** `chezmoi apply` runs on a machine with an existing unmanaged `~/.gitconfig`
- **THEN** the file is replaced with the managed version containing all modern defaults

### Requirement: No legacy Sourcetree entries

The gitconfig SHALL NOT contain any `[difftool "sourcetree"]`, `[mergetool "sourcetree"]`, or `[commit] template` entries referencing Sourcetree.

#### Scenario: Clean config output

- **WHEN** the rendered gitconfig is inspected
- **THEN** no lines reference `sourcetree`, `opendiff`, or `.stCommitMsg`

### Requirement: Modern git defaults

The gitconfig SHALL include the following sections with the specified values:

- `[init] defaultBranch = main`
- `[push] default = current` and `autoSetupRemote = true`
- `[pull] rebase = false`
- `[fetch] prune = true`
- `[rerere] enabled = true`
- `[diff] colorMoved = default` and `algorithm = histogram`
- `[merge] conflictstyle = zdiff3`
- `[credential] helper = osxkeychain` (macOS) or `helper = cache` (Linux), selected via chezmoi OS conditional

#### Scenario: New repository init

- **WHEN** `git init` is run in a new directory
- **THEN** the default branch is named `main`

#### Scenario: Push new branch

- **WHEN** `git push` is run on a branch with no upstream
- **THEN** the remote tracking branch is automatically created without requiring `--set-upstream`

#### Scenario: Fetch prunes stale remotes

- **WHEN** `git fetch` is run
- **THEN** remote-tracking branches that no longer exist on the remote are automatically removed

#### Scenario: Rerere records conflict resolution

- **WHEN** a merge conflict is resolved and the same conflict appears again
- **THEN** git automatically applies the previously recorded resolution

### Requirement: Core settings

The gitconfig SHALL set `[core]` with:

- `editor = code --wait`
- `autocrlf = input`
- `excludesfile = ~/.gitignore_global`
- `pager = delta`

#### Scenario: Git commit without -m flag

- **WHEN** `git commit` is run without a message flag
- **THEN** VS Code opens as the commit message editor and git waits for it to close

### Requirement: Delta pager configuration

The gitconfig SHALL configure delta with:

- `[interactive] diffFilter = delta --color-only`
- `[delta] navigate = true`, `light = false`, `side-by-side = true`, `line-numbers = true`

#### Scenario: Git diff output

- **WHEN** `git diff` is run
- **THEN** output is rendered through delta with side-by-side view and line numbers

### Requirement: Delta does not set syntax-theme

The gitconfig SHALL NOT include a `syntax-theme` setting in the `[delta]` section. Delta 0.18.2 does not inherit bat's built-in themes; theming is handled via `BAT_THEME` environment variable in zshrc.

#### Scenario: No theme warning

- **WHEN** `git diff` is run
- **THEN** no `[bat warning]: Unknown theme` message appears

### Requirement: Curated git aliases

The gitconfig SHALL define exactly these aliases:

- `lg` = graph log with color formatting and abbreviated commits
- `last` = `log -1 HEAD --stat`
- `unstage` = `reset HEAD --`
- `undo` = `reset --soft HEAD~1`
- `amend` = `commit --amend --no-edit`
- `branches` = `branch -a`
- `remotes` = `remote -v`

The gitconfig SHALL NOT include shorthand aliases (`st`, `co`, `ci`, `cm`, `ca`, `br`, `df`, `dc`) as these are provided by the OMZ git plugin.

#### Scenario: Git lg shows graph

- **WHEN** `git lg` is run in a repository with commits
- **THEN** a colored graph log with abbreviated hashes, branch names, relative dates, and author names is displayed

#### Scenario: Git unstage removes from index

- **WHEN** `git unstage <file>` is run
- **THEN** the file is removed from the staging area but remains in the working tree

#### Scenario: Git amend adds to last commit

- **WHEN** staged changes exist and `git amend` is run
- **THEN** the staged changes are added to the previous commit without changing its message

### Requirement: Chezmoi-managed gitignore_global

The system SHALL provide a `dot_gitignore_global` file (not a template) that chezmoi places at `~/.gitignore_global`.

#### Scenario: Static file management

- **WHEN** `chezmoi apply` runs
- **THEN** `~/.gitignore_global` is created as a plain file (no template rendering)

### Requirement: Comprehensive ignore patterns

The gitignore_global SHALL include safety-net patterns for:

- macOS artifacts (`.DS_Store`, `.AppleDouble`, `.LSOverride`, `._*`)
- Editor/IDE files (selective `.vscode/` files, `.idea/`, `*.swp`, `*.swo`, `*~`, Sublime files)
- Environment/secrets (`.env`, `.env.local`, `.env.*.local`)
- Node.js (`node_modules/`, debug logs for npm/yarn/pnpm)
- Logs (`logs/`, `*.log`)
- Build outputs (`dist/`, `build/`, `*.map`)
- Testing (`coverage/`, `.nyc_output/`)
- Temporary (`tmp/`, `temp/`)

#### Scenario: .vscode selective ignore

- **WHEN** a project contains `.vscode/settings.json` and `.vscode/launch.json`
- **THEN** `settings.json` is globally ignored but `launch.json` is NOT globally ignored

#### Scenario: Env files ignored globally

- **WHEN** a project without its own `.gitignore` contains a `.env` file
- **THEN** the `.env` file is excluded from `git status` and `git add`

### Requirement: Brew-installed git

The install script SHALL include `git` in `BREW_PACKAGES` so that Homebrew installs a modern version (2.37+) that supports all configured features.

#### Scenario: Git added to brew packages

- **WHEN** `run_once_install-packages.sh.tmpl` is rendered
- **THEN** `git` appears in the `BREW_PACKAGES` array

#### Scenario: Modern git available after install

- **WHEN** brew packages are installed and shell is restarted
- **THEN** `git --version` reports 2.37 or higher
