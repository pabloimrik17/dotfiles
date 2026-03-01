## Why

OpenCode user preferences (model, autoupdate, theme) are not managed as dotfiles. Without a global user config, these settings must be manually reconfigured on each new machine or profile. Other tools (Ghostty, Starship, Claude Code) already have their configs managed via chezmoi in this repo.

## What Changes

- Add `~/.config/opencode/opencode.jsonc` as a chezmoi-managed dotfile with user-level settings (default model)
- Add `~/.config/opencode/tui.json` as a chezmoi-managed dotfile with TUI preferences (theme)
- Add both files to the chezmoi source tree under `dot_config/opencode/`

## Capabilities

### New Capabilities

- `opencode-user-config`: Manages OpenCode global user configuration files (`opencode.jsonc` and `tui.json`) via chezmoi, ensuring consistent preferences across machines

### Modified Capabilities

_None — no existing specs are affected._

## Impact

- **New files**: `dot_config/opencode/opencode.jsonc`, `dot_config/opencode/tui.json` in chezmoi source
- **Target**: `~/.config/opencode/opencode.jsonc`, `~/.config/opencode/tui.json` on managed machines
- **Coexistence**: OpenCode's config merge means project-level `opencode.json` files continue to override global settings as needed
