## 1. Configuration File

- [x] 1.1 Create `dot_config/gh-dash/config.yml` with PR sections (My Pull Requests, Needs My Review, Involved)
- [x] 1.2 Add issue sections (My Issues, Assigned, Involved)
- [x] 1.3 Add notification sections (All, Review Requested, Participating, Mentions)
- [x] 1.4 Add Catppuccin Mocha theme colors and UI settings (sectionsShowCount, showSeparator)
- [x] 1.5 Add default settings (view, limits, preview, refetch interval, confirmQuit, showAuthorIcons, smartFilteringAtLaunch)
- [x] 1.6 Add keybindings: `g` for lazygit (universal), `C` for Claude Code review (prs)
- [x] 1.7 Set pager.diff to delta
- [x] 1.8 Add repoPaths wildcard mapping `*/*` to `~/WebstormProjects/*`

## 2. Installation

- [x] 2.1 Add gh extensions group to `run_onchange_install-packages.sh.tmpl` after brew packages, with `gh extension install dlvhdr/gh-dash` and idempotency check via `gh extension list`
- [x] 2.2 Add `alias ghd="gh dash"` to `dot_zshrc.tmpl` in the GitHub aliases section

## 3. Verification

- [x] 3.1 Run `chezmoi diff` to confirm the new files are detected by chezmoi
- [x] 3.2 Verify `gh dash` launches with the correct theme and sections (deferred to post-merge)
