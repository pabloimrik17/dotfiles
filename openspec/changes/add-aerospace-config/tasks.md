## 1. Install script updates

- [ ] 1.1 Add `aerospace` to the brew casks group in `run_onchange_install-packages.sh.tmpl`
- [ ] 1.2 Add a comment noting AeroSpace replaces Rectangle

## 2. Create AeroSpace config

- [ ] 2.1 Create `dot_config/aerospace/aerospace.toml` with base settings (start-at-login, after-login-command, gaps)
- [ ] 2.2 Set inner and outer gaps to 8px
- [ ] 2.3 Add keybindings: alt+h/j/k/l for window focus navigation
- [ ] 2.4 Add keybindings: alt+shift+h/j/k/l for window movement
- [ ] 2.5 Add keybindings: alt+1 through alt+7 for workspace switching
- [ ] 2.6 Add keybindings: alt+shift+1 through alt+shift+7 for moving windows to workspaces
- [ ] 2.7 Add keybindings: alt+m for fullscreen toggle, alt+f for floating toggle

## 3. App rules and monitor assignments

- [ ] 3.1 Add `on-window-detected` rules for app-to-workspace assignments (Slack, Chrome, WebStorm/VS Code, Ghostty, Docker, DBeaver) with bundle IDs
- [ ] 3.2 Add floating exceptions: Finder, Calculator, System Settings, 1Password, Archive Utility
- [ ] 3.3 Add `workspace-to-monitor-force-assignment` with placeholder monitor names (user must customize)

## 4. Chezmoi integration

- [ ] 4.1 Verify Chezmoi manages `dot_config/aerospace/aerospace.toml` correctly
- [ ] 4.2 Add aerospace directory to `.chezmoiignore.tmpl` for Linux (AeroSpace is macOS-only)

## 5. Verify

- [ ] 5.1 Validate TOML syntax of aerospace.toml
- [ ] 5.2 Verify AeroSpace loads the config without errors
- [ ] 5.3 Test workspace switching with alt+number
- [ ] 5.4 Test window navigation with alt+hjkl
