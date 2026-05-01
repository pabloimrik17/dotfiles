## 1. Security upgrades

- [x] 1.1 `brew upgrade openssl@3` — verify with `openssl version` matches `3.6.2`
- [x] 1.2 `brew upgrade uv` — verify with `uv --version` matches `0.11.8`

## 2. Safe patches and low-risk minors

- [x] 2.1 `brew upgrade chezmoi git-delta dolt git fzf gh` — verify each binary still launches
- [x] 2.2 `brew upgrade television` — confirm `tv` opens; channels still load
- [x] 2.3 `brew upgrade --cask coderabbit` — confirm `coderabbit --version`

## 3. Atuin upgrade and verification

- [x] 3.1 `brew upgrade atuin` — verify with `atuin --version`
- [x] 3.2 Re-source `~/.zshrc` (`exec zsh`) and confirm Ctrl+R still opens atuin search
- [x] 3.3 Confirm Ctrl+T still opens television's smart autocomplete (init order fzf → tv → atuin preserved)
- [ ] 3.4 Run `atuin ai "test"` and accept client-tool execution permissions restrictively (deny `edit_file`, deny `write_file`)
- [x] 3.5 Document the `strip_trailing_whitespace` default-on behavior change in commit message for future reference

## 4. Lazygit upgrade and sort-default decision

- [x] 4.1 `brew upgrade lazygit` — verify with `lazygit --version`
- [x] 4.2 Open lazygit in any repo and inspect the new "mix files and folders" file sort
- [x] 4.3 Decide: pin previous behavior in `dot_config/lazygit/config.yml` OR accept new default; record decision in commit message
- [x] 4.4 If pinning: edit `dot_config/lazygit/config.yml` with the explicit sort keys and run `chezmoi apply`
- [ ] 4.5 Test PR icon integration: open lazygit in a repo with an open PR and confirm icon renders; test `shift-G` opens the PR in browser

## 5. Worktrunk upgrade and config migration

- [x] 5.1 `brew upgrade worktrunk` — verify with `wt --version`
- [x] 5.2 Audit `[commit.generation].command` in `dot_config/worktrunk/config.toml` for any `--no-verify` or `--var KEY=VALUE` flags; rename to `--no-hooks` / `--KEY=VALUE` if present
- [x] 5.3 Run `wt config update` against the deployed `~/.config/worktrunk/config.toml`
- [x] 5.4 Diff the rewritten file against `dot_config/worktrunk/config.toml` and port meaningful key renames (e.g., `merge.no-ff` → `merge.ff`, `switch.no-cd` → `switch.cd`) back to the chezmoi source
- [x] 5.5 Optional: migrate single-table `[pre-start]` / `[post-start]` to pipeline form `[[pre-start]]` / `[[post-start]]` in `dot_config/worktrunk/config.toml`
- [x] 5.6 Run `wt config show` and confirm no deprecation warnings remain

## 6. Starship upgrade and config adoption

- [x] 6.1 `brew upgrade starship` — verify with `starship --version`
- [x] 6.2 Edit `dot_config/starship.toml`: add `[[directory.substitutions]]` entries with `regex = true` for `^~/WebstormProjects/` (collapse to short prefix) and `dotfiles\.feature-(.+)$` (collapse to `df:$1`)
- [x] 6.3 Edit `dot_config/starship.toml`: replace `[git_status].format` to use split `($index_added$index_modified$index_deleted)($worktree_added$worktree_modified$worktree_deleted)($untracked)` with green styling for index variables and red styling for worktree variables; remove `$all_status`
- [x] 6.4 Run `chezmoi apply` and re-source the shell
- [x] 6.5 Verify the `[directory]` substitutions render: `cd ~/WebstormProjects/dotfiles.feature-bump-brew-deps` and confirm prompt shows the collapsed form
- [x] 6.6 Verify the `[git_status]` split renders: stage one file, modify another, run `git status` mentally and confirm prompt shows green index group and red worktree group

## 7. Atuin TERMINAL.md adoption

- [x] 7.1 Create `dot_config/atuin/TERMINAL.md` documenting: shell (zsh), package manager (bun), host package manager (Homebrew), config manager (chezmoi), owned keybindings (atuin Ctrl+R, tv Ctrl+T, zoxide bound to `cd`), and named workflows (`wt switch`, `wt step commit`, `bd ready`)
- [x] 7.2 Run `chezmoi apply` and confirm `~/.config/atuin/TERMINAL.md` exists
- [ ] 7.3 Run `atuin ai "install package react in this project"` and verify the suggestion uses `bun add` (not `npm install`), confirming the TERMINAL.md context is loaded

## 8. Opencode shell field adoption

- [x] 8.1 Edit `dot_config/opencode/opencode.jsonc`: add `"shell": "zsh"` at the top level
- [x] 8.2 Run `chezmoi apply`
- [ ] 8.3 Open an opencode session and ask the agent to run a zsh-only command (e.g., `echo $ZSH_VERSION`) to confirm zsh is in use

## 9. Final validation and commit

- [x] 9.1 Run `brew outdated` and confirm only `beads` (and any newly-released packages since proposal start) remain in the list
- [x] 9.2 Run `openspec validate bump-brew-deps --strict` and resolve any failures
- [x] 9.3 Stage all repo changes and commit per Conventional Commits (use `wt step commit` to leverage the now-upgraded haiku flow)
