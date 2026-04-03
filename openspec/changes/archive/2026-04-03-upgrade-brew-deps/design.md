## Context

Brew packages managed by these dotfiles have accumulated pending upgrades. Most are backward-compatible, but worktrunk 0.32 renamed `post-create` hooks to `pre-start` (breaking), and the new `post-*` hooks run in background. The dotfiles have two config files affected: user config (`dot_config/worktrunk/config.toml`) with deps install, and project config (`.config/wt.toml`) with copy-ignored + save-base + settings sync. Three specs reference `post-create` by name. The manual documents the old hook name.

Atuin 18.13 adds daemon-based in-memory search indexing (no longer experimental) and AI command generation. Currently no atuin config file is managed by chezmoi — atuin uses defaults.

## Goals / Non-Goals

**Goals:**

- Migrate worktrunk hook names so configs work on 0.32+
- Move deps install to background (post-start) since failure is recoverable
- Keep copy-ignored + save-base blocking (pre-start) since worktree needs these before use
- Enable atuin daemon and AI via chezmoi-managed config
- Document new tool features in manual.html

**Non-Goals:**

- Fix `mas account` in mac-dev-setup spec (separate change, flagged in proposal)
- Add new worktrunk step aliases or other 0.32 features (future change if wanted)
- Modify existing atuin init flags in .zshrc (current `--disable-up-arrow` stays)
- Upgrade packages not in dotfiles config (ca-certificates, libiconv — system deps)

## Decisions

### D1: Deps install moves to `[post-start]` (background, non-blocking)

The worktrunk 0.32 rename of `post-create` → `pre-start` changes the semantics: `pre-start` now aborts on failure (FailFast). Deps install (`bun install`, `pnpm install`, `npm install`) can fail for recoverable reasons (no lockfile, network down, missing package manager). Aborting worktree creation for a failed `bun install` is too aggressive.

**Decision**: Move deps to `[post-start]` which runs in background and never blocks creation. The user can manually run `bun install` if the background install fails.

**Alternative considered**: Keep in `[pre-start]` with `|| true` to suppress errors. Rejected because it masks real failures silently and the deps install doesn't need to complete before the worktree is usable.

### D2: Copy-ignored + save-base stay blocking in `[pre-start]`

`wt step copy-ignored` copies `.claude/settings.local.json` and `save-base` writes `{{ base_worktree_path }}` for later use by `pre-remove`. Both must complete before the worktree is usable — without them, the worktree starts without Claude settings and the writeback mechanism has no base path.

**Decision**: Rename `[post-create]` to `[pre-start]` in `.config/wt.toml`. FailFast is actually desired here: if copy-ignored fails, something is wrong and the user should know.

**Alternative considered**: Split to `[post-start]` (background). Rejected because Claude Code would start without settings, forcing re-approval of all commands.

### D3: New atuin config file managed by chezmoi

Atuin reads `~/.config/atuin/config.toml`. Currently not managed by chezmoi (atuin uses compiled defaults). To enable daemon and AI, we need to create `dot_config/atuin/config.toml`.

**Decision**: Create a minimal config that only sets non-default values: `daemon.enabled = true` for fast in-memory search, and the AI feature flag. Don't replicate atuin defaults — only configure what we're changing.

The AI feature also requires a shell integration line: `eval "$(atuin ai init zsh)"` added to `dot_zshrc.tmpl` after the existing `atuin init` line. This registers the `?` prefix handler that activates natural language command generation. Unlike daemon mode (config-only), AI mode needs both the config flag and the shell hook.

**Alternative considered**: Modify `.zshrc` init to pass `--daemon` flag. Rejected because atuin's config file is the canonical way to configure features. However, `atuin ai init zsh` is required as a separate shell integration — the AI hook cannot be enabled via config alone.

### D4: Manual updates are additive only

New features in delta (subcommands), lazygit (file filtering, worktree visibility), atuin (AI, daemon), worktrunk (step aliases, merge --no-ff), and fd (--ignore-contain) are worth documenting. The manual hook reference changes from "post-create" to "pre-start".

**Decision**: Add new rows to existing tables and update hook names. Don't reorganize or restructure existing sections.

### D5: Specs updated via delta specs (not main spec edits)

Three main specs reference `post-create`: `worktrunk-config`, `worktree-file-sync`, `claude-settings-writeback`. Per OpenSpec convention, this change creates delta specs that describe the modifications.

**Decision**: Delta specs update requirement text and examples from `post-create` → `pre-start`/`post-start` as appropriate. Main specs are updated when this change is synced/archived.

## Risks / Trade-offs

- **[Background deps may fail silently]** → Acceptable. The user will notice when `node_modules` is missing or `bun.lock` isn't resolved. They can run `bun install` manually. Worktrunk logs background hook output.
- **[Atuin daemon uses memory]** → Daemon memory consumption was "substantially decreased" in 18.13. The daemon has autostart/PID management. It can be disabled by removing the config line.
- **[Atuin AI sends data]** → Only transmits OS and shell info (confirmed in 18.13.4 release notes). No command history or file contents are sent.
- **[pre-start FailFast on copy-ignored]** → If `wt step copy-ignored` fails, worktree creation aborts. This is the desired behavior — a copy failure likely indicates a real problem (permissions, disk space). The user sees a clear error and can fix it.
- **[brew upgrade timing]** → Config files must be updated BEFORE running `brew upgrade worktrunk`. If upgraded first, worktrunk emits deprecation warnings but still works (deprecated names supported during transition period). Safe to upgrade first, but cleaner to migrate configs first.

## Migration Plan

1. Update config templates (`dot_config/worktrunk/config.toml`, `.config/wt.toml`)
2. Create `dot_config/atuin/config.toml`
3. Add `eval "$(atuin ai init zsh)"` to `dot_zshrc.tmpl` (shell hook for AI mode)
4. Update `docs/manual.html`
5. Run `chezmoi apply` to deploy configs and shell template
6. Run `brew upgrade` for all outdated packages
7. Verify: `wt list` works, `atuin` daemon starts, `?` prefix works, manual renders correctly
