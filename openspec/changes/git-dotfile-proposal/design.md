## Context

The dotfiles repo manages shell configuration via chezmoi but git configuration (`~/.gitconfig`, `~/.gitignore_global`) remains unmanaged. The current gitconfig was hand-edited over time, accumulating Sourcetree entries (app no longer installed), a stale commit template reference, and hardcoded absolute paths. The system git is Apple's bundled 2.33.0, which lacks modern features like `push.autoSetupRemote` and `merge.conflictstyle = zdiff3`.

## Goals / Non-Goals

**Goals:**
- Manage `~/.gitconfig` and `~/.gitignore_global` via chezmoi so they travel across machines
- Remove legacy cruft and add modern git defaults
- Ensure brew-installed git (2.47+) is available so all modern config options work
- Curate git aliases that complement (not duplicate) OMZ shell aliases

**Non-Goals:**
- Delta Catppuccin theming — delta 0.18.2 can't use bat's built-in themes; deferred to zshrc `BAT_THEME`
- Per-project git config overrides — out of scope, handled by `.git/config` in each repo
- GPG signing setup — separate concern, can be layered later
- `core.fsmonitor` — requires git 2.37+ and has edge cases; left as a commented hint

## Decisions

### D1: Reuse existing chezmoi data for user identity

**Decision:** Use `{{ .name }}` and `{{ .email }}` from `.chezmoi.toml.tmpl` rather than adding new `git_name`/`git_email` fields.

**Rationale:** The existing prompts already collect name and email. Adding separate git-specific fields doubles the prompts on first setup with no practical benefit — the values are identical. If they ever diverge (e.g., work machine with different git email), a future change can add a conditional.

**Alternative considered:** Separate `git_name`/`git_email` with `promptStringOnce`. Rejected because YAGNI — no current need for divergent values.

### D2: Add `git` to BREW_PACKAGES

**Decision:** Add `git` to the brew packages list in `run_once_install-packages.sh.tmpl`.

**Rationale:** Apple bundles git 2.33.0 via Xcode CLT, which is 4+ years behind. Homebrew git (2.47+) unlocks `push.autoSetupRemote`, `merge.conflictstyle = zdiff3`, `diff.algorithm = histogram`. The `pkg_bin` function already maps package names to binaries, and git's binary name matches the package name — no mapping needed. Homebrew's `/usr/local/bin` (or `/opt/homebrew/bin` on Apple Silicon) takes PATH precedence over `/usr/bin`.

**Alternative considered:** Template version-conditional config sections. Rejected — fragile, hard to test, and the real fix is just upgrading git.

### D3: Static gitignore_global (no template)

**Decision:** `dot_gitignore_global` is a plain file, not a `.tmpl`.

**Rationale:** Nothing in the gitignore varies per machine. No template syntax needed. Chezmoi manages plain files just as well as templates.

### D4: Git aliases = semantic operations only

**Decision:** Only include aliases for operations that don't exist natively in git (`lg`, `last`, `unstage`, `undo`, `amend`, `branches`, `remotes`). Exclude shorthand aliases (`st`, `co`, `ci`, `cm`).

**Rationale:** OMZ's `git` plugin provides 150+ shell aliases for shorthand (`gs` = `git status`, `gco` = `git checkout`, etc.). Duplicating those in gitconfig creates confusion about which layer provides what. Git aliases should add semantic value — commands that read naturally as git subcommands.

### D5: Selective .vscode/ ignoring in gitignore_global

**Decision:** Ignore `.vscode/settings.json` and `.vscode/extensions.json` but NOT the entire `.vscode/` directory.

**Rationale:** `settings.json` and `extensions.json` contain personal preferences. But `launch.json` (debug configs) and `tasks.json` (build tasks) are often project-specific and intentionally committed. Full-directory ignore is too aggressive.

### D6: Explicit credential helper

**Decision:** Include `[credential] helper = osxkeychain` in the gitconfig.

**Rationale:** This is already the macOS default, but making it explicit means the config is self-documenting. On a future Linux machine, this section can be templated to use `store` or `cache`.

## Risks / Trade-offs

**[First `chezmoi apply` overwrites existing gitconfig]** → All useful settings from the current config are captured in the template. The Sourcetree entries and stale commit template are intentionally dropped. No data loss.

**[Brew git shadows system git]** → Homebrew git at `/usr/local/bin/git` takes PATH precedence over `/usr/bin/git`. This is standard practice and Homebrew's intended behavior. Xcode CLT git remains available at its absolute path if needed.

**[`autoSetupRemote` changes push behavior]** → With `push.autoSetupRemote = true`, `git push` on a new branch auto-creates the remote tracking branch. This is the desired behavior — eliminates `--set-upstream` boilerplate. If a user wants explicit control for a specific repo, they can override with `git config --local push.autoSetupRemote false`.

**[Global gitignore as safety net may mask missing project-level ignores]** → If `node_modules/` or `.env` are globally ignored, a project might forget to add them to its own `.gitignore`. This is acceptable — the safety net prevents accidental commits, and `git add -f` bypasses it when needed.
