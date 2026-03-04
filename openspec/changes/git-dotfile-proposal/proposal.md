## Why

The `~/.gitconfig` and `~/.gitignore_global` are not managed by chezmoi. They don't travel across machines, accumulate cruft (Sourcetree entries for an app no longer installed, stale commit templates), and new machines start with bare git defaults — missing modern conveniences like `push.autoSetupRemote`, `fetch.prune`, and `rerere`.

## What Changes

- Add `dot_gitconfig.tmpl` as a chezmoi-managed template with:
  - Templated `[user]` section using existing `.name`/`.email` chezmoi data (no new prompts)
  - Removal of all Sourcetree/legacy entries
  - Modern defaults: `[init] defaultBranch = main`, `[push] autoSetupRemote = true`, `[fetch] prune = true`, `[rerere] enabled = true`
  - Delta pager configuration (carried over + enhanced with `line-numbers`)
  - Curated git aliases (`lg`, `last`, `unstage`, `undo`, `amend`, `branches`, `remotes`) that complement — not duplicate — OMZ shell aliases
  - Explicit `[credential] helper = osxkeychain`
  - `[diff] algorithm = histogram` and `[merge] conflictstyle = zdiff3` for better diffs/conflicts
- Add `dot_gitignore_global` as a static chezmoi-managed file with comprehensive safety-net patterns (macOS, IDE, env/secrets, node_modules, build outputs)
- Add `git` to `BREW_PACKAGES` in `run_once_install-packages.sh.tmpl` to get modern git (2.47+) instead of Apple's bundled 2.33.0 — unlocks `autoSetupRemote`, `zdiff3`, `histogram`
- **Drop** `delta.syntax-theme = "Catppuccin Mocha"` from the proposal — delta 0.18.2 doesn't inherit bat's built-in themes; handle via `BAT_THEME` env var in zshrc instead

## Capabilities

### New Capabilities
- `git-config`: Chezmoi-managed git configuration (gitconfig template + gitignore_global) with modern defaults, curated aliases, and delta integration

### Modified Capabilities
<!-- None — no existing specs are affected by this change -->

## Impact

- **New files**: `dot_gitconfig.tmpl`, `dot_gitignore_global`
- **Modified files**: `run_once_install-packages.sh.tmpl` (add `git` to `BREW_PACKAGES`)
- **Overwritten on apply**: `~/.gitconfig` (replaces unmanaged file — all useful settings are captured in the template), `~/.gitignore_global`
- **Deleted implicitly**: `~/.stCommitMsg` reference removed (Sourcetree commit template no longer referenced)
- **Cross-change note**: Delta theming deferred to zshrc change (BAT_THEME env var); shell git aliases (gs, gp) remain in OMZ git plugin
