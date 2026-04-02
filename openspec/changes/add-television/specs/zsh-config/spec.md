## MODIFIED Requirements

### Requirement: Zsh external plugin sources use OS-conditional paths
Source paths for zsh-autosuggestions and zsh-syntax-highlighting SHALL use template conditionals for platform differences (e.g., `/usr/local/share/` on Intel macOS vs `/opt/homebrew/share/` on Apple Silicon vs `/usr/share/` on Linux). On macOS, fzf binary PATH SHALL use OS/arch-conditional template paths (`/opt/homebrew/opt/fzf/bin` on ARM, `/usr/local/opt/fzf/bin` on Intel). fzf initialization SHALL be inline via `source <(fzf --zsh)` instead of sourcing an external `~/.fzf.zsh` file. Television initialization SHALL appear after fzf initialization via `eval "$(tv init zsh)"`.

#### Scenario: Correct fzf PATH on Apple Silicon macOS
- **WHEN** chezmoi apply runs on an Apple Silicon Mac
- **THEN** `.zshrc` adds `/opt/homebrew/opt/fzf/bin` to PATH if not already present

#### Scenario: Correct fzf PATH on Intel macOS
- **WHEN** chezmoi apply runs on an Intel Mac
- **THEN** `.zshrc` adds `/usr/local/opt/fzf/bin` to PATH if not already present

#### Scenario: fzf keybindings and completions loaded inline
- **WHEN** chezmoi apply completes and user opens a new shell
- **THEN** fzf keybindings (Alt+C) and completions are available without any external file dependency

#### Scenario: No reference to external fzf file
- **WHEN** chezmoi apply completes
- **THEN** `.zshrc` does NOT contain `source ~/.fzf.zsh` or any reference to the `~/.fzf.zsh` file

#### Scenario: Television Ctrl+T overrides fzf Ctrl+T
- **WHEN** chezmoi apply completes and user opens a new shell
- **THEN** Ctrl+T opens television contextual autocomplete (not fzf file search)

#### Scenario: Correct plugin path on Apple Silicon macOS
- **WHEN** chezmoi apply runs on an Apple Silicon Mac
- **THEN** `.zshrc` sources plugins from `/opt/homebrew/share/`

#### Scenario: Correct plugin path on Intel macOS
- **WHEN** chezmoi apply runs on an Intel Mac
- **THEN** `.zshrc` sources plugins from `/usr/local/share/`
