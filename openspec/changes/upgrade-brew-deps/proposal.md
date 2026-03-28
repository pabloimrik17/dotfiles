## Why

Multiple brew-managed packages in the dotfiles have pending upgrades (worktrunk 0.28→0.32, atuin 18.12→18.13, git-delta 0.18→0.19, lazygit 0.59→0.60, fd 10.3→10.4, chezmoi 2.69→2.70, zsh-completions 0.35→0.36). Worktrunk 0.32 introduces a **breaking hook rename** (`post-create` → `pre-start` for blocking project hooks, `post-create` → `post-start` for background user hooks) that directly impacts both the user config and the project config. Atuin 18.13 adds daemon-based search indexing and AI command generation worth enabling. The rest are backward-compatible but add features worth documenting in the manual.

## What Changes

- **BREAKING** Worktrunk user config (`dot_config/worktrunk/config.toml`): rename `[post-create]` → `[post-start]` (background, non-blocking — deps failure is recoverable and should not abort worktree creation)
- **BREAKING** Worktrunk project config (`.config/wt.toml`): rename `[post-create]` → `[pre-start]` (blocking — copy-ignored + save-base must complete before worktree is usable)
- Add chezmoi-managed atuin config (`dot_config/atuin/config.toml`) enabling daemon mode and AI features
- Update `docs/manual.html` with new features: atuin AI/daemon, delta external subcommands, lazygit file filtering + worktree visibility, worktrunk `wt step`/`wt merge --no-ff`/hook rename, fd `--ignore-contain`
- Update all specs referencing `post-create` hook to reflect the new naming

**Note — out of scope but flagged**: The `mac-dev-setup` change's `appstore-install/spec.md` uses `mas account` as a prerequisite check, but `mas account` was removed in mas 5.0.0 (already broken on current mas 5.2.0). That fix belongs in the `mac-dev-setup` change, not here. The mas 5.2→6.0 upgrade itself is transparent for our use case (`mas install <id>` is unchanged).

## Capabilities

### New Capabilities

- `atuin-config`: Chezmoi-managed atuin configuration file enabling daemon mode for fast in-memory search indexing and AI-powered command generation/history querying

### Modified Capabilities

- `worktrunk-config`: Hook rename `[post-create]` → `[post-start]` (non-blocking background execution for deps install, matching worktrunk 0.32 semantics)
- `worktree-file-sync`: Hook rename `[post-create]` → `[pre-start]` in project config (blocking execution preserved for copy-ignored + save-base)
- `claude-settings-writeback`: Update references from `post-create` to `pre-start` in requirement text describing when `{{ base_worktree_path }}` is saved
- `manual-web`: Add documentation for new tool features across atuin, delta, lazygit, worktrunk, and fd

## Impact

- **Config files**: `dot_config/worktrunk/config.toml`, `.config/wt.toml`, new `dot_config/atuin/config.toml`
- **Specs**: `worktrunk-config/spec.md`, `worktree-file-sync/spec.md`, `claude-settings-writeback/spec.md`, `manual-web/spec.md`
- **Docs**: `docs/manual.html` (sections: atuin, delta, lazygit, worktrunk commands, worktrunk hooks)
- **Dependencies**: Requires `brew upgrade` of all outdated packages (safe after config migration)
- **Behavioral change**: Worktrunk deps install no longer blocks worktree creation (moves from blocking pre-start to background post-start)
- **Behavioral change**: Worktrunk pre-start now aborts on failure (previously only warned) — affects copy-ignored + save-base, which is desired behavior
