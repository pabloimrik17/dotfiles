## 1. Install script updates

- [ ] 1.1 Add `television` to `BREW_PACKAGES` array in `run_onchange_install-packages.sh.tmpl`
- [ ] 1.2 Add `jq` to `BREW_PACKAGES` array if not already present
- [ ] 1.3 Add a step to run `tv update-channels` after television install to populate community channels

## 2. Create television config

- [ ] 2.1 Create `dot_config/television/config.toml` with catppuccin theme
- [ ] 2.2 Configure shell integration section: disable Ctrl+R (keep atuin), enable Ctrl+T
- [ ] 2.3 Define channel triggers: git (checkout/branch/merge/rebase → git-branch), git (add/restore/stash → git-diff), git (show/revert/cherry-pick → git-log), gh (pr → gh-prs, issue → gh-issues), docker (exec/stop/logs → docker-containers), bun (run → bun-scripts), brew (info/upgrade/uninstall → brew-packages)

## 3. Create custom bun-scripts channel

- [ ] 3.1 Create `dot_config/television/cable/bun-scripts.toml` with jq-based source reading package.json scripts
- [ ] 3.2 Configure preview to show the script command
- [ ] 3.3 Configure enter action to execute `bun run <script>`

## 4. Update zshrc

- [ ] 4.1 Add `eval "$(tv init zsh)"` to `dot_zshrc.tmpl` after fzf init block and before atuin init
- [ ] 4.2 Add comments to fzf custom functions (frg, fgco, fglog, fkill) noting they may be replaced by television channels in a future change

## 5. Verify

- [ ] 5.1 Verify television loads without errors in a new shell
- [ ] 5.2 Test Ctrl+T contextual autocomplete works (e.g., `git checkout [Ctrl+T]` shows branches)
- [ ] 5.3 Verify Ctrl+R still uses atuin
- [ ] 5.4 Verify bun-scripts channel works in a project with package.json
