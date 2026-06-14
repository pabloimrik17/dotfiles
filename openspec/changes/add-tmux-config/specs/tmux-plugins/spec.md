## ADDED Requirements

### Requirement: TPM plugin manager
`dot_tmux.conf` SHALL include TPM (Tmux Plugin Manager) bootstrap at the end of the file. TPM SHALL be cloned to `~/.tmux/plugins/tpm` and initialized with `run '~/.tmux/plugins/tpm/tpm'` as the last line.

#### Scenario: TPM bootstrap present
- **WHEN** `dot_tmux.conf` is applied via chezmoi
- **THEN** the file ends with `run '~/.tmux/plugins/tpm/tpm'`

#### Scenario: TPM install in install script
- **WHEN** user runs the install script and confirms the tmux plugins group
- **THEN** TPM is git cloned to `~/.tmux/plugins/tpm` if not already present

### Requirement: Session persistence with resurrect and continuum
`dot_tmux.conf` SHALL declare `tmux-plugins/tmux-resurrect` and `tmux-plugins/tmux-continuum` as TPM plugins. Continuum SHALL be configured for automatic restore on tmux start and automatic save.

#### Scenario: Session survives tmux server restart
- **WHEN** user kills tmux server and starts a new one
- **THEN** continuum auto-restores the last saved session (windows, panes, working directories)

#### Scenario: Auto-save is enabled
- **WHEN** tmux is running
- **THEN** continuum saves session state automatically at the default interval (15 minutes)

### Requirement: Session manager with sessionx
`dot_tmux.conf` SHALL declare `omerxx/tmux-sessionx` as a TPM plugin with zoxide integration enabled.

#### Scenario: Session picker available
- **WHEN** user presses the sessionx keybinding
- **THEN** a fzf-powered session picker appears listing all tmux sessions with zoxide-suggested directories

### Requirement: Floating panes with floax
`dot_tmux.conf` SHALL declare `omerxx/tmux-floax` as a TPM plugin configured with 80% width and height.

#### Scenario: Floating pane opens
- **WHEN** user presses the floax keybinding
- **THEN** a floating pane appears centered at 80% of the terminal dimensions

### Requirement: Quick text selection with thumbs
`dot_tmux.conf` SHALL declare `fcsonline/tmux-thumbs` as a TPM plugin.

#### Scenario: Text selection mode activates
- **WHEN** user presses the thumbs keybinding
- **THEN** tmux highlights all selectable text objects (URLs, paths, hashes, IPs) with letter hints for quick copy

### Requirement: URL opening with fzf-url
`dot_tmux.conf` SHALL declare `wfxr/tmux-fzf-url` as a TPM plugin.

#### Scenario: URL picker opens
- **WHEN** user presses the fzf-url keybinding
- **THEN** fzf lists all visible URLs in the current pane and selecting one opens it in the default browser

### Requirement: Catppuccin theme
`dot_tmux.conf` SHALL declare `catppuccin/tmux` as a TPM plugin with the mocha flavor. Status bar SHALL show session name on the left and current directory on the right.

#### Scenario: Theme applied
- **WHEN** tmux starts with the config applied
- **THEN** the status bar and pane borders use Catppuccin Mocha colors

### Requirement: Sensible defaults and yank
`dot_tmux.conf` SHALL declare `tmux-plugins/tmux-sensible` and `tmux-plugins/tmux-yank` as TPM plugins.

#### Scenario: System clipboard integration
- **WHEN** user copies text in tmux copy mode
- **THEN** the text is also available in the macOS system clipboard
