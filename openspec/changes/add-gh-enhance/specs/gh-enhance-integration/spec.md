## gh-enhance-integration

### gh-dash keybindings

- `T` keybinding in prs section opens ENHANCE in a new tmux window
    - Window named `CI-{{.PrNumber}}` with working directory `{{.RepoPath}}`
    - Sets `ENHANCE_THEME=catppuccin_mocha` inline
    - Passes `-R {{.RepoName}} {{.PrNumber}}` to target the selected PR
    - Non-blocking: user can switch back to gh-dash while CI runs
- `t` keybinding in prs section opens ENHANCE inline (replaces gh-dash)
    - Same theme and PR targeting as `T`
    - Blocking: returns to gh-dash when ENHANCE is exited
    - Does not require tmux

### Theme consistency

- Both keybindings and the `ghe` alias use `ENHANCE_THEME=catppuccin_mocha`
- This matches the global Catppuccin Mocha theme used across all dotfiles tools
- bubbletint theme ID `catppuccin_mocha` is the canonical identifier
