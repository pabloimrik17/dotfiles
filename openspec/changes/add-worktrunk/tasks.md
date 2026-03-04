## 1. Install script

- [ ] 1.1 Add `worktrunk` to the `BREW_PACKAGES` array in `run_once_install-packages.sh.tmpl`
- [ ] 1.2 Add `worktrunk` → `wt` mapping to the `pkg_bin()` function
- [ ] 1.3 Add worktrunk to the non-macOS manual instructions section (brew and cargo options)

## 2. Shell integration

- [ ] 2.1 Add worktrunk eval line to the "Modern CLI Tools" section of `dot_zshrc.tmpl` after gh completions: `if command -v wt >/dev/null 2>&1; then eval "$(command wt config shell init zsh)"; fi`

## 3. User configuration

- [ ] 3.1 Create `dot_config/worktrunk/config.toml` with post-create hook that detects package manager by lockfile (bun.lock → bun install, pnpm-lock.yaml → pnpm install, package-lock.json → npm install)

## 4. Claude Code plugin

- [ ] 4.1 Add `"worktrunk@worktrunk": true` to `enabledPlugins` in `dot_claude/settings.json.tmpl`
