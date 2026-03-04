## Context

`dot_zshrc.tmpl` has two major sections: tool initialization (lines 1–97) and aliases (lines 99–146). This change only appends new content — it does not modify existing lines. Four other in-flight changes (`expand-omz-plugins`, `improve-zsh-completions`, `inline-fzf-init`, `tune-autosuggestions`) modify the tool initialization section; this change operates entirely in the aliases section and below, so there are no merge conflicts.

The install script (`run_once_install-packages.sh.tmpl`) manages brew packages in a `BREW_PACKAGES` array (line 46). Two packages need to be added there.

## Goals / Non-Goals

**Goals:**
- Add productivity aliases and functions that compound across daily terminal use
- Maintain symmetric naming conventions (`p*` for pnpm, `b*` for bun, `l*` for eza, `f*` for fzf)
- Keep all additions safe-by-default: no destructive commands, guarded hooks for optional tools
- Make `fd` an explicit dependency (currently implicit via fzf config)

**Non-Goals:**
- Modifying existing aliases or tool initialization blocks
- Adding git aliases (OMZ `git` plugin covers this — `you-should-use` plugin reminds users)
- Theme system, LS_COLORS, or visual customization (Ghostty handles terminal colors)
- Starship config changes (separate proposal)
- Git config / gitignore_global (separate proposal)

## Decisions

### 1. Section placement in dot_zshrc.tmpl

New content goes into clearly delimited subsections appended after the existing aliases block (after line 139, before bun completions at line 141). The file's structure becomes:

```
  existing OMZ + tool init          (lines 1–97, untouched)
  existing ALIASES section          (lines 99–139, untouched)
  ── NEW: Navigation aliases ──     ..  ...  ....
  ── NEW: eza developer views ──    lla  ldev  lcode  lsize
  ── NEW: Package manager aliases ─ pi/pd/pb/pt/pa/pr/px  bi/bd/bb/bt/ba/br/bx
  ── NEW: jq aliases ──             jqless  pretty-json  check-json
  ── NEW: fzf power functions ──    fkill  frg
  ── NEW: git+fzf functions ──      fglog  fgco
  ── NEW: Tool environment ──       BAT_THEME, direnv hook
  existing bun completions + PATH   (lines 141–146, untouched)
```

**Rationale:** Simple aliases first (one-liners), then functions (multi-line), then environment config. This mirrors the existing file's pattern of "exports at top, aliases in middle, completions/PATH at bottom."

**Alternative considered:** Interleaving new aliases next to their related existing ones (e.g., new eza aliases right after existing eza block). Rejected because it makes merge conflicts with other in-flight changes more likely and makes this change harder to identify/revert as a unit.

### 2. Alias naming conventions

| Prefix | Tool | Pattern | Examples |
|--------|------|---------|----------|
| `..` | navigation | literal | `..`, `...`, `....` |
| `l*` | eza | `l` + descriptor | `lla`, `ldev`, `lcode`, `lsize` |
| `p*` | pnpm | `p` + action initial | `pi`, `pd`, `pb`, `pt`, `pa`, `pr`, `px` |
| `b*` | bun | `b` + action initial | `bi`, `bd`, `bb`, `bt`, `ba`, `br`, `bx` |
| `jq*` | jq | `jq` + descriptor | `jqless` |
| `f*` | fzf functions | `f` + tool/action | `fkill`, `frg`, `fglog`, `fgco` |

All prefixes verified collision-free on macOS via `which` and `type` checks. The `b*`/`p*` symmetry is intentional — when migrating from pnpm to bun, only the first letter changes in muscle memory.

**Alternative considered:** `bu*` prefix for bun (e.g., `bui`, `bud`, `bub`, `but`). Rejected: `but` is an English word (accidental execution risk), `bub` sounds absurd, and the 3-char length breaks symmetry with the 2-char `p*` pattern.

### 3. direnv hook — guarded by command -v

```zsh
command -v direnv &>/dev/null && eval "$(direnv hook zsh)"
```

**Rationale:** direnv is newly added to `BREW_PACKAGES` but the guard makes the zshrc resilient — if direnv isn't installed (e.g., user skipped that install group, or non-macOS), the line is a no-op. This follows the same defensive pattern used for iterm2 integration (line 35) and fzf sourcing (line 60).

**Alternative considered:** Hard requirement without guard. Rejected because the install script uses interactive confirmation groups — the user can decline individual package groups.

### 4. BAT_THEME placement

```zsh
export BAT_THEME="Catppuccin Mocha"
```

Placed in the new "Tool environment" subsection at the end of the additions, near the direnv hook. Both are environment configuration rather than aliases or functions.

**Why in zshrc, not bat config:** `BAT_THEME` is an environment variable that affects both `bat` directly and `delta` (which uses bat's syntax engine). Setting it in zshrc ensures it applies to all contexts — interactive shell, scripts, git operations. A `bat` config file would only affect direct `bat` invocations.

### 5. fd and direnv in BREW_PACKAGES

Add both to the existing `BREW_PACKAGES` array in `run_once_install-packages.sh.tmpl`:

```bash
BREW_PACKAGES=(starship eza bat zoxide atuin fzf ripgrep lazygit fd direnv)
```

The `pkg_bin` function (line 49–54) maps package names to binary names for idempotency checks. `fd` and `direnv` binaries match their package names, so no new mapping is needed (the `*) echo "$1"` default case handles them).

### 6. frg editor integration

The `frg` function opens results in `$EDITOR` with `+line_number` syntax:

```zsh
${EDITOR:-code} $(echo "$result" | cut -d: -f1) +$(echo "$result" | cut -d: -f2)
```

This works with VS Code (`code file +42`), vim (`vim file +42`), and most editors. Falls back to `code` if `$EDITOR` is unset. The zshrc already exports `EDITOR="code --wait"` (line 27), so the fallback is consistent.

## Risks / Trade-offs

**[pnpm/bun alias overlap with OMZ plugins]** → The `expand-omz-plugins` change adds `npm` and `bun` OMZ plugins. The `bun` plugin provides completions only (no aliases). The `npm` plugin provides aliases with different naming (`npmI`, `npmS`) that don't conflict with our `p*`/`b*` pattern. No collision, but if OMZ ever adds `bi`/`pi` aliases, `you-should-use` would flag the conflict.

**[frg depends on ripgrep + fzf + bat]** → All three are already in `BREW_PACKAGES`. If any is missing, `frg` fails with a clear "command not found" error. No silent degradation.

**[fgco remote branch stripping]** → The `sed 's#remotes/[^/]*/##'` in `fgco` strips the remote prefix when checking out a remote branch. This creates a local tracking branch automatically. If the local branch already exists with different content, git will error clearly — no data loss risk.

**[direnv security model]** → direnv requires explicit `direnv allow` per `.envrc` file. New/modified `.envrc` files are blocked until manually allowed. This is direnv's built-in safety — no risk of auto-executing untrusted env files.
