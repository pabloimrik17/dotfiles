# Capability: zsh-config

## Purpose

TBD - Zsh shell configuration management.

## Requirements

### Requirement: Autosuggestions plugin is tuned for performance and visual coherence

The `zsh-autosuggestions` plugin SHALL be configured with a highlight style, buffer size limit, and async mode. The highlight style SHALL use colors from the catppuccin-mocha palette. Commented alternative color presets SHALL be included above the active setting for quick switching.

#### Scenario: Suggestion text uses Mauve on Surface 2 highlight

- **WHEN** a user types a partial command that matches history
- **THEN** the suggested completion text renders with foreground `#cba6f7` (Mauve) and background `#585b70` (Surface 2)

#### Scenario: Suggestions skip lookup for long commands

- **WHEN** the current command buffer exceeds 20 characters
- **THEN** autosuggestions does not perform a history lookup (no suggestion displayed)

#### Scenario: Suggestions are fetched asynchronously

- **WHEN** a user types and a suggestion lookup is triggered
- **THEN** the lookup runs in the background without blocking keyboard input

#### Scenario: Alternative color presets are available as comments

- **WHEN** a user opens `dot_zshrc.tmpl`
- **THEN** commented lines above the active `ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE` show at least two alternative color values with labels

### Requirement: User-local binaries PATH

The `.zshrc` SHALL add `$HOME/.local/bin` to PATH for user-local binaries (Claude Code, plannotator, etc.) that install to this directory. This ensures these tools are available on fresh machines where no other mechanism adds this path.

#### Scenario: Claude Code available after chezmoi apply

- **WHEN** Claude Code is installed to `~/.local/bin/claude` and the user opens a new shell
- **THEN** `claude` is found in PATH

### Requirement: Zsh external plugin sources use OS-conditional paths

Source paths for zsh-autosuggestions and zsh-syntax-highlighting SHALL use template conditionals for platform differences (e.g., `/usr/local/share/` on Intel macOS vs `/opt/homebrew/share/` on Apple Silicon vs `/usr/share/` on Linux). On macOS, fzf binary PATH SHALL use OS/arch-conditional template paths (`/opt/homebrew/opt/fzf/bin` on ARM, `/usr/local/opt/fzf/bin` on Intel). fzf initialization SHALL be inline via `source <(fzf --zsh)` instead of sourcing an external `~/.fzf.zsh` file.

#### Scenario: Correct fzf PATH on Apple Silicon macOS

- **WHEN** chezmoi apply runs on an Apple Silicon Mac
- **THEN** `.zshrc` adds `/opt/homebrew/opt/fzf/bin` to PATH if not already present

#### Scenario: Correct fzf PATH on Intel macOS

- **WHEN** chezmoi apply runs on an Intel Mac
- **THEN** `.zshrc` adds `/usr/local/opt/fzf/bin` to PATH if not already present

#### Scenario: fzf keybindings and completions loaded inline

- **WHEN** chezmoi apply completes and user opens a new shell
- **THEN** fzf keybindings (Ctrl+T, Ctrl+R, Alt+C) and completions are available without any external file dependency

#### Scenario: No reference to external fzf file

- **WHEN** chezmoi apply completes
- **THEN** `.zshrc` does NOT contain `source ~/.fzf.zsh` or any reference to the `~/.fzf.zsh` file

#### Scenario: Correct plugin path on Apple Silicon macOS

- **WHEN** chezmoi apply runs on an Apple Silicon Mac
- **THEN** `.zshrc` sources plugins from `/opt/homebrew/share/`

#### Scenario: Correct plugin path on Intel macOS

- **WHEN** chezmoi apply runs on an Intel Mac
- **THEN** `.zshrc` sources plugins from `/usr/local/share/`
