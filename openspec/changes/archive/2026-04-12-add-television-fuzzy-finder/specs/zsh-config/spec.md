## MODIFIED Requirements

### Requirement: Zsh external plugin sources use OS-conditional paths

Source paths for zsh-autosuggestions and zsh-syntax-highlighting SHALL use template conditionals for platform differences (e.g., `/usr/local/share/` on Intel macOS vs `/opt/homebrew/share/` on Apple Silicon vs `/usr/share/` on Linux). On macOS, fzf binary PATH SHALL use OS/arch-conditional template paths (`/opt/homebrew/opt/fzf/bin` on ARM, `/usr/local/opt/fzf/bin` on Intel). fzf initialization SHALL be inline via `source <(fzf --zsh)` instead of sourcing an external `~/.fzf.zsh` file. Television initialization SHALL be inline via `eval "$(tv init zsh)"` positioned after fzf init and before atuin init.

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

#### Scenario: Correct plugin path on Apple Silicon macOS

- **WHEN** chezmoi apply runs on an Apple Silicon Mac
- **THEN** `.zshrc` sources plugins from `/opt/homebrew/share/`

#### Scenario: Correct plugin path on Intel macOS

- **WHEN** chezmoi apply runs on an Intel Mac
- **THEN** `.zshrc` sources plugins from `/usr/local/share/`

#### Scenario: Television init is positioned between fzf and atuin

- **WHEN** chezmoi apply completes and user opens a new shell
- **THEN** `eval "$(tv init zsh)"` appears after `source <(fzf --zsh)` and before `eval "$(atuin init zsh --disable-up-arrow)"`

#### Scenario: Ctrl+T is owned by television

- **WHEN** the user presses Ctrl+T in a new shell
- **THEN** television smart autocomplete launches (not fzf file search)

## REMOVED Requirements

### Requirement: fzf power functions (fkill, frg)

**Reason**: Replaced by television built-in channels. `fkill()` is replaced by `tv procs` which offers SIGKILL, SIGTERM, SIGSTOP, and SIGCONT actions. `frg()` is replaced by the custom `tv rg-edit` channel.

**Migration**: Use `tv procs` instead of `fkill`. Use `tv rg-edit` instead of `frg`.

### Requirement: Git + fzf integration functions (fglog, fgco)

**Reason**: Replaced by television built-in channels. `fglog()` is replaced by `tv git-log`. `fgco()` is replaced by `tv git-branch` which includes checkout, delete, merge, and rebase actions.

**Migration**: Use `tv git-log` instead of `fglog`. Use `tv git-branch` instead of `fgco` (Enter to checkout).
