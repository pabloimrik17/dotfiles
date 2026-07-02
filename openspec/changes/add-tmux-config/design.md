## Context

Current tmux: 3 lines in `dot_tmux.conf` (mouse, 256 colors, focus events). No plugins, no persistence, no session management. Reference: omerxx/dotfiles has a full setup with TPM and 8+ plugins.

## Goals / Non-Goals

**Goals:**
- Add TPM (Tmux Plugin Manager) as the plugin manager
- Automatic session persistence with resurrect + continuum
- Session management with sessionx (fzf + zoxide integration)
- Floating panes with floax
- Fast text selection with thumbs
- URL opening with fzf-url
- Catppuccin Mocha theme consistent with the rest of the setup
- Prefix Ctrl+A (more ergonomic than the default Ctrl+B)
- Vi copy mode for consistency with vim keybindings

**Non-Goals:**
- Replace Ghostty tabs/splits (tmux is complementary)
- Configure tmux for remote SSH (can come later)
- Predefined per-project session scripts (can come later)
- Integration with SketchyBar or external status bars

## Decisions

### TPM as plugin manager
TPM (tmux-plugin-manager) is installed via git clone into `~/.tmux/plugins/tpm`. Plugins are declared in `dot_tmux.conf` with `set -g @plugin`. TPM handles install/update.
- **Alternative:** install plugins manually → rejected for maintenance reasons.
- **Alternative:** Nix/Home Manager → rejected because we use Chezmoi, not Nix.

### Plugin selection (from omerxx, adapted)
| Plugin | Purpose | From omerxx? |
|--------|---------|--------------|
| tmux-resurrect | Persist sessions across restarts | Yes |
| tmux-continuum | Auto-save every 15 min | Yes |
| tmux-sessionx | Session picker with fzf/zoxide | Yes (own plugin) |
| tmux-floax | Floating panes | Yes (own plugin) |
| tmux-thumbs | Fast text selection | Yes |
| tmux-fzf-url | Open visible URLs | Yes |
| catppuccin/tmux | Theme | Yes (own fork, we use the official one) |
| tmux-sensible | Sensible defaults | Yes |
| tmux-yank | Copy to system clipboard | Yes |

### Prefix: Ctrl+A
Ctrl+A is more accessible than Ctrl+B (especially with Karabiner's Caps→Ctrl). Potential collision with readline "start of line" → mitigated with `bind C-a send-prefix` to send a literal Ctrl+A.

### Status bar on top
Consistent with Ghostty's tab position. Minimal information: session on the left, directory on the right.

## Risks / Trade-offs

- **[Ctrl+A collision with readline]** → Mitigation: `send-prefix` allows sending a literal Ctrl+A by double-tapping.
- **[TPM requires a manual git clone]** → Mitigation: add it to the install script as an automated step.
- **[Plugins may break across tmux upgrades]** → Mitigation: every selected plugin is actively maintained.
- **[Duplication with Ghostty tabs]** → Not a real risk, they are complementary. Tmux adds persistence and detach.
