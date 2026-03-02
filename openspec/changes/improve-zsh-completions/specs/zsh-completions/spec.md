## ADDED Requirements

### Requirement: zsh-completions package is installed via Homebrew
The install script SHALL install `zsh-completions` via Homebrew on macOS, using the same idempotent `brew list` check pattern as existing zsh plugins.

#### Scenario: Fresh install on macOS
- **WHEN** the user runs `chezmoi apply` for the first time on macOS
- **THEN** the install script SHALL offer to install `zsh-completions` as part of the oh-my-zsh/plugins group
- **AND** `brew list zsh-completions` SHALL succeed after installation

#### Scenario: Package already installed
- **WHEN** `zsh-completions` is already installed via Homebrew
- **THEN** the install script SHALL skip it and log "already installed, skipping"

#### Scenario: Non-macOS system
- **WHEN** the install script runs on a non-macOS system
- **THEN** the manual install instructions SHALL list `zsh-completions` as a required package

### Requirement: zsh-completions FPATH is configured before compinit
The `.zshrc` SHALL add the `zsh-completions` directory to `FPATH` before Oh-My-Zsh's `source $ZSH/oh-my-zsh.sh` line so that `compinit` discovers the additional completion definitions.

#### Scenario: macOS arm64 (Apple Silicon)
- **WHEN** the shell starts on macOS arm64
- **THEN** `FPATH` SHALL include `/opt/homebrew/share/zsh-completions`
- **AND** the FPATH entry SHALL appear after existing FPATH entries (appended, not prepended)

#### Scenario: macOS x86_64 (Intel)
- **WHEN** the shell starts on macOS x86_64
- **THEN** `FPATH` SHALL include `/usr/local/share/zsh-completions`

#### Scenario: Linux
- **WHEN** the shell starts on Linux
- **THEN** `FPATH` SHALL include `/usr/share/zsh-completions`

#### Scenario: Package not installed (graceful degradation)
- **WHEN** `zsh-completions` is not installed and the FPATH directory does not exist
- **THEN** the shell SHALL start without errors and completions SHALL fall back to OMZ defaults

### Requirement: FPATH uses chezmoi OS/arch templating
The FPATH configuration SHALL use the same `{{ .chezmoi.os }}` and `{{ .chezmoi.arch }}` conditional pattern established by `zsh-autosuggestions` and `zsh-syntax-highlighting` in `dot_zshrc.tmpl`.

#### Scenario: Template renders correctly per platform
- **WHEN** `chezmoi apply` renders `dot_zshrc.tmpl`
- **THEN** the resulting `.zshrc` SHALL contain exactly one zsh-completions FPATH configuration line with the platform-appropriate path
