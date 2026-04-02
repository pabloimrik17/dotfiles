## Why

The dotfiles setup includes `gh` CLI but lacks a visual dashboard for managing PRs, issues, and notifications across repositories. Currently, PR/issue management requires switching to the browser or running individual `gh` commands. `gh-dash` provides a rich TUI dashboard that integrates with the existing terminal workflow (lazygit, delta, worktrunk, tmux) and brings GitHub activity into the terminal where the rest of the dev workflow already lives.

## What Changes

- Install `gh-dash` as a `gh` CLI extension via the chezmoi install script
- Add a Catppuccin Mocha-themed configuration at `~/.config/gh-dash/config.yml`
- Configure PR sections (My PRs, Needs Review, Involved), Issue sections (My Issues, Assigned, Involved), and Notification sections (All, Review Requested, Participating, Mentions)
- Add custom keybindings integrating with existing tools: `g` for lazygit, `C` for Claude Code PR review via tmux
- Use `delta` as the diff pager (already configured globally)
- Map repo paths to `~/WebstormProjects/` for checkout operations
- Add `ghd` shell alias for `gh dash`

## Capabilities

### New Capabilities

- `gh-dash-config`: gh-dash configuration file with sections, theme, keybindings, layout, pager, and repo paths
- `gh-dash-install`: Installation of gh-dash extension and shell alias via chezmoi

### Modified Capabilities

_None — this is a new tool addition with no changes to existing specs._

## Impact

- **Files added**: `dot_config/gh-dash/config.yml` (chezmoi-managed)
- **Files modified**: `run_onchange_install-packages.sh.tmpl` (add gh extensions section), `dot_zshrc.tmpl` (add `gd` alias)
- **Dependencies**: `gh` CLI (already installed), Nerd Font (already installed)
- **No breaking changes** to existing configuration
