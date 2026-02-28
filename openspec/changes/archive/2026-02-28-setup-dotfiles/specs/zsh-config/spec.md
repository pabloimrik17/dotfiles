## ADDED Requirements

### Requirement: Zshrc is managed as a template

The repo SHALL include `dot_zshrc.tmpl` that generates `~/.zshrc`. Template variables SHALL replace hardcoded paths (e.g., `/Users/etherless/` becomes `{{ .chezmoi.homeDir }}/`).

#### Scenario: Apply generates .zshrc with correct home path

- **WHEN** chezmoi apply runs on a machine with username `alice`
- **THEN** `~/.zshrc` contains paths using `/Users/alice/` (macOS) or `/home/alice/` (Linux), not hardcoded usernames

#### Scenario: Zshrc template resolves all variables

- **WHEN** chezmoi apply completes
- **THEN** `~/.zshrc` contains no unresolved template directives (`{{ }}`)

### Requirement: Oh-my-zsh plugin list is declared in zshrc

The `.zshrc` SHALL declare oh-my-zsh plugins in the `plugins=(...)` array. Current plugins: git, you-should-use, docker, npm, command-not-found.

#### Scenario: Plugins array matches source state

- **WHEN** chezmoi apply completes
- **THEN** the `plugins=(...)` line in `~/.zshrc` contains exactly the plugins declared in the template

### Requirement: Aliases are part of the zshrc

All shell aliases (eza, bat, zoxide, git shortcuts, ripgrep, etc.) SHALL be included in `dot_zshrc.tmpl` as part of the managed zshrc.

#### Scenario: Aliases available after apply

- **WHEN** user opens a new shell after chezmoi apply
- **THEN** aliases like `ls` (eza), `cat` (bat), `cd` (zoxide), `lg` (lazygit) are available

### Requirement: Starship config is managed as source state

The repo SHALL include `dot_config/starship.toml` containing the Starship prompt configuration.

#### Scenario: Starship config applied

- **WHEN** chezmoi apply runs
- **THEN** `~/.config/starship.toml` matches the source state

### Requirement: Zsh external plugin sources use OS-conditional paths

Source paths for zsh-autosuggestions and zsh-syntax-highlighting SHALL use template conditionals for platform differences (e.g., `/usr/local/share/` on Intel macOS vs `/opt/homebrew/share/` on Apple Silicon vs `/usr/share/` on Linux).

#### Scenario: Correct plugin path on Apple Silicon macOS

- **WHEN** chezmoi apply runs on an Apple Silicon Mac
- **THEN** `.zshrc` sources plugins from `/opt/homebrew/share/`

#### Scenario: Correct plugin path on Intel macOS

- **WHEN** chezmoi apply runs on an Intel Mac
- **THEN** `.zshrc` sources plugins from `/usr/local/share/`
