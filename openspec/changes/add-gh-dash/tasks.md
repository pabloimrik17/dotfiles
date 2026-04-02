## 1. Configuration File

- [ ] 1.1 Create `dot_config/gh-dash/config.yml` with PR sections (My Pull Requests, Needs My Review, Involved)
- [ ] 1.2 Add issue sections (My Issues, Assigned, Involved)
- [ ] 1.3 Add notification sections (All, Review Requested, Participating, Mentions)
- [ ] 1.4 Add Catppuccin Mocha theme colors and UI settings (sectionsShowCount, showSeparator)
- [ ] 1.5 Add default settings (view, limits, preview, refetch interval, confirmQuit, showAuthorIcons, smartFilteringAtLaunch)
- [ ] 1.6 Add keybindings: `g` for lazygit (universal), `C` for Claude Code review (prs)
- [ ] 1.7 Set pager.diff to delta
- [ ] 1.8 Add repoPaths wildcard mapping `*/*` to `~/WebstormProjects/*`

## 2. Installation

- [ ] 2.1 Add gh extensions group to `run_onchange_install-packages.sh.tmpl` after brew packages, with `gh extension install dlvhdr/gh-dash` and idempotency check via `gh extension list`
- [ ] 2.2 Add `alias ghd="gh dash"` to `dot_zshrc.tmpl` in the GitHub aliases section

## 3. Verification

- [ ] 3.1 Run `chezmoi diff` to confirm the new files are detected by chezmoi
- [ ] 3.2 Verify `gh dash` launches with the correct theme and sections
