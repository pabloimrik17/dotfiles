# Exploration: Git Configuration as Managed Dotfile

## Context

The user has a manually-configured `~/.gitconfig` that is **NOT managed by chezmoi**. This means:
- It doesn't travel across machines
- It accumulates cruft (Sourcetree leftovers, stale commit templates)
- New machines start with bare git defaults

The existing config (from `git config --global --list`):
```
user.name=Pablo F. Guerra
user.email=pabloimrik17@gmail.com
core.excludesfile=/Users/etherless/.gitignore_global
core.autocrlf=input
core.pager=delta
difftool.sourcetree.cmd=opendiff "$LOCAL" "$REMOTE"     # ← Legacy Sourcetree
difftool.sourcetree.path=                                 # ← Legacy Sourcetree
mergetool.sourcetree.cmd=...                              # ← Legacy Sourcetree
mergetool.sourcetree.trustexitcode=true                   # ← Legacy Sourcetree
commit.template=/Users/etherless/.stCommitMsg             # ← Sourcetree template
interactive.difffilter=delta --color-only
delta.navigate=true
delta.light=false
delta.side-by-side=true
merge.conflictstyle=diff3
diff.colormoved=default
```

The existing `~/.gitignore_global` is also minimal:
```
*~
.DS_Store
```

## What to Manage

Two files as chezmoi templates:
1. `dot_gitconfig.tmpl` → `~/.gitconfig`
2. `dot_gitignore_global` → `~/.gitignore_global`

## Proposed gitconfig — Section by Section

### [user] — Keep personal, template it

```toml
[user]
    name = {{ .git_name | quote }}
    email = {{ .git_email | quote }}
```

Uses chezmoi data from `.chezmoi.toml.tmpl`. This is the standard pattern — user-specific values come from chezmoi config, not hardcoded.

**Requires:** Adding `git_name` and `git_email` to `.chezmoi.toml.tmpl` data prompts.

### [core] — Clean up, modernize

```toml
[core]
    editor = code --wait
    autocrlf = input
    excludesfile = ~/.gitignore_global
    pager = delta
    # fsmonitor = true         # Uncomment for large repos (git 2.37+)
```

**Changes from current:**
- Adds `editor = code --wait` (explicit, currently implicit)
- Removes Sourcetree cruft
- `fsmonitor` commented as opt-in — significantly speeds up `git status` in large repos but requires git 2.37+. Current git version is 2.33.0 so leaving commented.

### [init] — Missing entirely

```toml
[init]
    defaultBranch = main
```

**Currently missing.** Without this, `git init` creates `master` branches. Every new repo needs manual intervention. This is a no-brainer.

### [push] — Modern defaults

```toml
[push]
    default = current
    autoSetupRemote = true
```

**Currently missing.** These eliminate two of the most common git annoyances:
- `default = current` — `git push` pushes the current branch (no need for `-u origin branch-name` the first time)
- `autoSetupRemote = true` — Automatically sets up tracking when pushing a new branch. No more `git push --set-upstream origin feature/foo`

**Note:** `autoSetupRemote` requires git 2.37+. Current installed version is 2.33.0. This should be combined with a git upgrade in the install script, or guarded.

### [pull] — Explicit merge strategy

```toml
[pull]
    rebase = false
```

**Explicit preference.** The gist uses `rebase = false` (merge strategy). This is debatable:
- `rebase = false` → merge commits, preserves branch history
- `rebase = true` → linear history, cleaner log

**Recommendation:** `rebase = false` as default is safer. Users who want rebase can set it per-project.

### [fetch] — Auto-prune

```toml
[fetch]
    prune = true
```

**Currently missing.** Auto-removes remote-tracking branches that no longer exist on the remote. Without this, `git branch -a` accumulates ghost branches forever.

### [rerere] — Reuse recorded resolution

```toml
[rerere]
    enabled = true
```

**Currently missing.** The gist doesn't mention this but it's a hidden gem. When you resolve a merge conflict, git remembers the resolution. If the same conflict appears again (e.g., during rebase), git auto-resolves it. Zero downside.

### [diff] — Color moved lines

```toml
[diff]
    colorMoved = default
    algorithm = histogram
```

**`colorMoved = default`** is already configured. Highlights moved code blocks in a different color during diffs — helps distinguish "moved" from "changed".

**`algorithm = histogram`** is new. The default diff algorithm (`myers`) often produces confusing diffs for code. `histogram` (or `patience`) produces more human-readable diffs. Especially good for:
- Function reordering
- Moving code blocks
- Adding methods to classes

### [merge] — Conflict style

```toml
[merge]
    conflictstyle = zdiff3
```

**Currently set to `diff3`.** Upgrade to `zdiff3` (git 2.35+) which is like diff3 but removes redundant common-ancestor lines, making conflict markers shorter and more readable.

**Note:** Requires git 2.35+. Current version 2.33.0 doesn't support it. Use `diff3` as fallback.

### [delta] — Enhanced config

```toml
[interactive]
    diffFilter = delta --color-only

[delta]
    navigate = true
    light = false
    side-by-side = true
    line-numbers = true
    syntax-theme = "Catppuccin Mocha"
    file-style = "bold yellow"
    hunk-header-style = "bold syntax"
```

**Changes from current:**
- Adds `line-numbers = true` — Shows line numbers in diffs. Currently missing.
- Adds `syntax-theme = "Catppuccin Mocha"` — bat has catppuccin built-in, delta uses bat's engine. Currently delta uses whatever bat's default is (not catppuccin). This aligns delta diffs with our terminal theme.
- Adds `file-style` and `hunk-header-style` for cleaner visual hierarchy.

### [alias] — Git-level aliases

```toml
[alias]
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    last = log -1 HEAD --stat
    unstage = reset HEAD --
    undo = reset --soft HEAD~1
    branches = branch -a
    remotes = remote -v
```

**Philosophy:** Git-level aliases belong in `.gitconfig`, NOT in `.zshrc`. Shell aliases (`gs`, `gp`) are for shorthand. Git aliases (`git lg`, `git unstage`) are for commands that don't exist natively.

**What to include:**
| Alias | What | Why |
|-------|------|-----|
| `lg` | Pretty graph log | The single most useful git alias. Shows branch topology visually |
| `last` | Last commit with file stats | Quick "what did I just commit?" |
| `unstage` | Reset HEAD | `git unstage file.ts` reads naturally |
| `undo` | Soft reset last commit | Safe undo — keeps changes in working tree |
| `branches` | All branches | Saves typing `branch -a` |
| `remotes` | All remotes with URLs | Quick check of remote configuration |

**What NOT to include:**
| Alias | Why Not |
|-------|---------|
| `st`, `s`, `br`, `co`, `ci`, `cm`, `ca` | OMZ `git` plugin already provides shell aliases for ALL of these |
| `stl`, `stp` | Same — OMZ covers stash operations |
| `df`, `dc` | Same — OMZ provides `gd`, `gdc` |
| `changed` | Niche — `git show --stat` is clearer |

The line is: **gitconfig aliases = semantic operations** (`unstage`, `undo`, `lg`). **Shell aliases = keystroke shortcuts** (`gs`, `gp`, `gcm`). Don't mix the two.

## Proposed gitignore_global

The current one only has `*~` and `.DS_Store`. The gist has a comprehensive version. Here's what makes sense:

```gitignore
# ===== macOS =====
.DS_Store
.AppleDouble
.LSOverride
._*

# ===== Editors & IDEs =====
.vscode/settings.json
.vscode/extensions.json
.idea/
*.swp
*.swo
*~
*.sublime-project
*.sublime-workspace

# ===== Environment & Secrets =====
.env
.env.local
.env.*.local

# ===== Node.js =====
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# ===== Logs =====
logs/
*.log

# ===== Build outputs =====
dist/
build/
*.map

# ===== Testing =====
coverage/
.nyc_output/

# ===== Temporary =====
tmp/
temp/
```

**Discussion points:**
- `.vscode/` — The gist ignores the whole directory. Better to be selective: ignore `settings.json` and `extensions.json` (personal), keep `launch.json` and `tasks.json` (project-specific)
- `.idea/` — Full ignore is correct. JetBrains IDE config is always personal
- `node_modules/` — Should this be global? Most projects already have this in their own `.gitignore`. Having it global is a safety net
- `.env*` — Critical safety net. Prevents accidentally committing secrets even in projects without a `.gitignore`
- `dist/`, `build/` — Same as node_modules: safety net. Some projects legitimately track build output

**Recommendation:** Include everything above. Global gitignore is a safety net — it's better to have redundant entries than to miss one. If a project needs to track something globally ignored, they can use `git add -f`.

## Chezmoi Integration

### Template considerations

```
dot_gitconfig.tmpl    →  ~/.gitconfig
dot_gitignore_global  →  ~/.gitignore_global  (no template needed, static content)
```

The gitconfig needs template syntax for:
- `[user]` name/email from chezmoi data
- Possibly `[core] editor` if it varies per machine
- Git version-dependent features (`zdiff3`, `autoSetupRemote`, `fsmonitor`)

### Data additions to .chezmoi.toml.tmpl

```toml
[data]
    git_name = "Pablo F. Guerra"
    git_email = "pabloimrik17@gmail.com"
```

Or use chezmoi's `promptString` for interactive setup on first apply.

### Migration concern

The user already HAS a `~/.gitconfig`. When chezmoi applies, it will **overwrite** the existing file. The proposal should:
1. Capture all useful existing settings
2. Drop Sourcetree cruft
3. Add missing modern defaults
4. Note that first `chezmoi apply` replaces the unmanaged gitconfig

## Relationship to Other Changes

```
┌────────────────────────────────────┐
│  git-config-dotfile (THIS)         │
│  ──────────────────────────        │
│  dot_gitconfig.tmpl                │
│  dot_gitignore_global              │
│                                    │
│  INTERACTS WITH:                   │
│  ┌──────────────────────────────┐  │
│  │ starship-enhancement         │  │
│  │ → Both touch catppuccin      │  │
│  │   theming (delta syntax-     │  │
│  │   theme + starship palette)  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ main zshrc proposal          │  │
│  │ → BAT_THEME variable lives   │  │
│  │   in zshrc, affects delta    │  │
│  │ → Shell git aliases (gs, gp) │  │
│  │   complement gitconfig       │  │
│  │   aliases (lg, unstage)      │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ .chezmoi.toml.tmpl           │  │
│  │ → Needs git_name/git_email   │  │
│  │   data fields added          │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

## Git Version Consideration

Current installed version: **git 2.33.0**

Features that require newer versions:
| Feature | Requires | Status |
|---------|----------|--------|
| `push.autoSetupRemote` | 2.37+ | Needs git upgrade |
| `merge.conflictstyle = zdiff3` | 2.35+ | Needs git upgrade |
| `core.fsmonitor` | 2.37+ | Optional, needs git upgrade |
| `diff.algorithm = histogram` | 2.34+ | Needs git upgrade |

**Recommendation:** Add `git` to `BREW_PACKAGES` in `run_once_install-packages.sh.tmpl`. Homebrew git is typically latest stable (currently 2.47+). The system git on macOS is outdated (Apple ships 2.33 with Xcode CLT).

## Open Questions

1. **chezmoi data strategy** — Use hardcoded values or `promptString` for git name/email?
2. **Git version** — Add `git` to brew install packages? (enables all modern features)
3. **delta catppuccin** — `syntax-theme = "Catppuccin Mocha"` works because bat bundles it. Verify delta picks it up correctly.
4. **.vscode/ granularity** — Ignore entire dir or selective files?
5. **Sourcetree cleanup** — The managed gitconfig simply won't include Sourcetree entries. But if the user still uses Sourcetree, it may re-add them. Is Sourcetree still in use?
