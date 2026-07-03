## 1. Repo edits — fixes

- [x] 1.1 `dot_config/worktrunk/config.toml`: replace `{{ commits }}` with `{{ commit_details }}` in squash-template (deprecated in 0.59.0)
- [x] 1.2 `dot_config/television/cable/markdown.toml`: change `[actions.open]` command from `mdview '{}'` to `mdview {}` (preview command unchanged)
- [x] 1.3 `dot_tmux.conf` line 24: extend the catppuccin `run -b` chain with `tmux set -agF message-style ',fill=##{@thm_overlay_0}'` and the same for `message-command-style`

## 2. Repo edits — features

- [x] 2.1 `private_dot_agent-of-empires/themes/catppuccin-mocha.toml`: add `unread = "#94e2d5" # teal` after the `idle` line
- [x] 2.2 `private_dot_agent-of-empires/modify_private_config.toml`: add MANAGED entries `(("acp", "rate_limit_auto_resume"), True, False),` and `(("session", "confirm_delete"), True, False),`
- [x] 2.3 `dot_config/worktrunk/config.toml`: replace `[list]` `full = true` / `summary = true` with `columns = ["branch", "working-diff", "branch-diff", "ci", "summary"]` and update the stale comment (diffstat default since 0.62; columns override presets since 0.63)
- [x] 2.4 `dot_config/worktrunk/config.toml`: add `wtpr = "wt switch --prs"` to `[aliases]`
- [x] 2.5 `dot_zshrc.tmpl`: add `--graph-lane-limit=8` after `--graph` in the `gl` alias
- [x] 2.6 `dot_gitconfig.tmpl`: add `--graph-lane-limit=8` after `--graph` in the `lg` alias
- [x] 2.7 `run_onchange_install-packages.sh.tmpl`: add the idempotent gh agent skill stanza (structured `--json` detection, `gh skill install cli/cli gh --agent claude-code --scope user`) after the gh-enhance stanza inside the gh extensions group

## 3. aoe XDG relocation (source side)

- [x] 3.1 `git mv private_dot_agent-of-empires dot_config/private_agent-of-empires`
- [x] 3.2 `.oxfmtignore`: update the modify-script path to `dot_config/private_agent-of-empires/modify_private_config.toml`
- [x] 3.3 `.chezmoiignore`: update `.agent-of-empires/sounds` patterns to `.config/agent-of-empires/sounds`
- [x] 3.4 Validate the install script template still renders (`chezmoi execute-template` + `bash -n`)

## 4. Upgrade + live migration (operational)

- [x] 4.1 `brew upgrade` the 18 outdated packages; confirm `brew outdated` is clean
- [ ] 4.2 Quit aoe (no `tui.active`), `tmux kill-server`
- [ ] 4.3 `mv ~/.agent-of-empires ~/.config/agent-of-empires` (BEFORE any apply of the renamed source)
- [ ] 4.4 Sync chezmoi source (dual-dir) and run `chezmoi diff`, then `chezmoi apply` (onchange script re-runs; confirm gh extensions group to install the gh skill)

## 5. Verification

- [ ] 5.1 aoe launches reading `~/.config/agent-of-empires/config.toml`; no legacy dir; theme loads with unread teal; `[acp]`/`confirm_delete` keys present in live config; re-run `chezmoi diff` is clean
- [x] 5.2 `wt config update` finds nothing to migrate; `wt list` shows the 5 pinned columns; `wt wtpr` opens the PR picker
- [x] 5.3 `tv` markdown channel opens a file with spaces in its name via mdview
- [ ] 5.4 New tmux server on 3.7b: `prefix :` prompt fills the whole status bar with overlay background; mdfried passthrough still works
- [x] 5.5 `git lg` and zshrc `gl` run with `--graph-lane-limit=8`; `gh skill list --agent claude-code` includes `gh`; re-running the install script skips it
- [x] 5.6 `openspec validate update-brew-deps` passes

## 6. Docs sync

- [x] 6.1 Run `/docs:manual` to sync docs/manual.html (git aliases, wtpr, wt list columns, gh skill, tmux fill)
- [x] 6.2 Run `/docs:readme` in case the gh agent skill counts as tool-level for README.md
