# Exploration: Definitive zshrc Additions

## Context

Analysis of [hx-natthawat's zsh-setup-guide](https://gist.github.com/hx-natthawat/9bf9355469853ee4726ee2ca98831e13) against our existing `dot_zshrc.tmpl` and 4 pending zsh changes (`expand-omz-plugins`, `improve-zsh-completions`, `inline-fzf-init`, `tune-autosuggestions`).

This document captures what's **missing and worth adding** on top of the existing config + pending changes. Everything listed here was evaluated against the gist's 120+ shortcuts and passed the filter of: "does this add real value that no existing tool/plugin already covers?"

## Decisions Made

### 1. Navigation Aliases

```zsh
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
```

**Rationale:** Trivial but used constantly. No conflict with any command or plugin. Every experienced shell user reaches for these.

### 2. eza Extended Views

Current aliases: `ls`, `ll`, `la`, `lt`, `lta`. Missing useful developer-specific views:

```zsh
alias lla='eza --icons --group-directories-first -lha'
alias ldev='eza --icons --group-directories-first -lh --git --git-ignore'
alias lcode='eza --icons --group-directories-first -T -L 2 --git-ignore -I "node_modules|.git|dist|build"'
alias lsize='eza --icons --group-directories-first -lh --sort=size --reverse'
```

| Alias | Purpose | When you'd use it |
|-------|---------|-------------------|
| `lla` | Full detailed list with hidden files | Inspecting a directory completely |
| `ldev` | List with git status, hiding gitignored | "What files have I changed?" |
| `lcode` | Clean tree without noise dirs | Quick project structure overview |
| `lsize` | Sorted by size descending | "What's eating disk space?" |

**Note:** The gist proposes `lg='eza -lh --git'` but we already use `lg` for `lazygit`. No conflict with `ldev` which is more descriptive anyway.

### 3. fzf Power Functions

Two functions from the gist that fill genuine gaps (atuin covers history, zoxide covers cd):

```zsh
# fkill - Kill process with fzf
fkill() {
  local pid
  pid=$(ps -ef | sed 1d | fzf -m | awk '{print $2}')
  if [ "x$pid" != "x" ]; then
    echo $pid | xargs kill -${1:-9}
  fi
}

# frg - Search in files with ripgrep + fzf + bat preview
frg() {
  local result
  result=$(rg --color=always --line-number --no-heading --smart-case "${*:-}" |
    fzf --ansi \
        --color "hl:-1:underline,hl+:-1:underline:reverse" \
        --delimiter : \
        --preview 'bat --color=always {1} --highlight-line {2}' \
        --preview-window 'up,60%,border-bottom,+{2}+3/3,~3')
  [ -n "$result" ] && ${EDITOR:-code} $(echo "$result" | cut -d: -f1) +$(echo "$result" | cut -d: -f2)
}
```

| Function | What | Why it's not redundant |
|----------|------|------------------------|
| `fkill` | Interactive process killer | Nothing else provides this. `kill` requires knowing the PID. |
| `frg` | ripgrep → fzf → bat preview → open in editor | Combines 3 tools into a code search workflow. Nothing else does this. |

**Not including** from the gist: `fh` (atuin is better), `fcd` (zoxide is better).

### 4. Git + fzf Integration Functions

```zsh
# fglog - Browse git log with fzf preview
fglog() {
  git log --oneline --color=always |
    fzf --ansi --preview 'git show --color=always {1}' --preview-window=right:60%
}

# fgco - Checkout branch with fzf preview
fgco() {
  local branch
  branch=$(git branch -a | grep -v HEAD |
    fzf --preview 'git log --oneline --graph --date=short --pretty="format:%C(auto)%cd %h%d %s" {1} | head -20' |
    sed 's/.* //' | sed 's#remotes/[^/]*/##')
  if [[ -n "$branch" ]]; then
    git checkout "$branch"
  fi
}
```

| Function | What | Why it's genuinely useful |
|----------|------|--------------------------|
| `fglog` | Interactive commit browser with full diff preview | Faster than `git log` for finding "that commit from last week" |
| `fgco` | Branch picker with commit history preview | 50+ branches? This saves minutes vs. `git branch | grep` |

**Not including** from the gist: `gdiff` (delta handles diffs), `gdft`/`gdfts`/`gshowdft` (difftastic not installed, delta is sufficient).

### 5. Package Manager Aliases — pnpm (p*) + bun (b*)

Both installed: pnpm 10.19.0, bun 1.3.10. Repo uses `bun.lock`. Current primary: pnpm. Expected transition to bun within ~1 year.

**Decision: Symmetric `b*` prefix for bun, matching `p*` for pnpm.**

Verified zero binary collisions on macOS for all aliases. `bu*` prefix rejected because `but`/`bub` are problematic and the asymmetric length (2 vs 3 chars) creates friction during migration.

```zsh
# pnpm shortcuts
alias pi='pnpm install'
alias pd='pnpm dev'
alias pb='pnpm build'
alias pt='pnpm test'
alias pa='pnpm add'
alias pr='pnpm run'
alias px='pnpm exec'

# bun shortcuts
alias bi='bun install'
alias bd='bun dev'
alias bb='bun build'
alias bt='bun test'
alias ba='bun add'
alias br='bun run'
alias bx='bunx'
```

**Migration path:** When bun becomes primary, either swap the bodies of `p*` aliases to bun equivalents, or simply remove `p*` aliases entirely. The `b*` muscle memory will already be trained.

### 6. jq Aliases

jq is already installed (system jq 1.7.1). No aliases exist for it:

```zsh
alias jqless='jq -C . | less -R'
alias pretty-json='jq .'
alias check-json='jq empty'
```

**Not including:** `yq` aliases (YAML processor not installed, not needed for JS/TS-focused workflow).

### 7. direnv Hook

direnv auto-loads `.envrc` files per directory — essential for multi-project work with different env vars.

```zsh
eval "$(direnv hook zsh)"
```

**Note:** direnv is NOT currently installed. Requires adding to `BREW_PACKAGES` in `run_once_install-packages.sh.tmpl`, or making the hook conditional:

```zsh
command -v direnv &>/dev/null && eval "$(direnv hook zsh)"
```

**Decision needed at proposal time:** Add direnv as dependency, or guard with `command -v`?

### 8. fd as Explicit Brew Package

`fd` is used as fzf's backend (`FZF_DEFAULT_COMMAND='fd --type f ...'`) but is NOT listed in `BREW_PACKAGES`. If fd isn't installed, fzf silently falls back to the slower default `find`. This is a gap.

**Action:** Add `fd` to `BREW_PACKAGES` array in `run_once_install-packages.sh.tmpl`.

### 9. BAT_THEME

bat has Catppuccin Mocha built-in. Currently no `BAT_THEME` is set, so bat uses its default. Since delta uses bat's syntax engine, this also affects `git diff` rendering.

```zsh
export BAT_THEME="Catppuccin Mocha"
```

**Note:** This interacts with the Starship Enhancement proposal (both touch catppuccin theming) and the Git Config proposal (delta's `syntax-theme` setting). Placing it in zshrc is correct because it's an environment variable, not a tool-specific config.

## Explicitly Rejected from the Gist

| Feature | Reason |
|---------|--------|
| Dual theme system (cyberpunk/pastel) | Ghostty handles terminal colors via catppuccin-mocha |
| Starship custom themes | Separate proposal (see `starship-enhancement.md`) |
| Git aliases in zshrc (`gs`, `gcm`, etc.) | OMZ `git` plugin provides 150+ aliases. Duplicating causes namespace conflicts |
| `gacp` (add-all, commit, push) | Anti-pattern: `git add .` without review is dangerous |
| `gnb` (new branch from develop) | Workflow-specific, assumes develop-based branching |
| GitHub Copilot CLI aliases | We use Claude Code / OpenCode as AI assistants |
| .gitconfig / .gitignore_global | Separate proposal (see `git-config-dotfile.md`) |
| thefuck | Adds shell startup latency. `command-not-found` + `you-should-use` cover the use case |
| tmux | Ghostty has native tabs/splits |
| httpie, k9s, lazydocker | Too niche for a general dotfile. Install ad-hoc when needed |
| procs, bottom | Niche system monitoring. Activity Monitor / htop ad-hoc |
| entr, hyperfine | Niche dev tools. Frameworks have built-in watch modes |
| yq | Only needed for heavy YAML work (K8s). Not our primary stack |
| .gitmessage template | commitlint via Husky enforces format at project level |
| Extra Nerd Fonts | Hack Nerd Font already installed and configured in Ghostty |
| History settings override | OMZ already sets HISTSIZE=50000, SAVEHIST=10000, SHARE_HISTORY, etc. atuin replaces history search. No need to override |
| LS_COLORS / EZA_COLORS theming | Ghostty's catppuccin handles ANSI colors. Low value, high maintenance |

## Impact Summary

```
dot_zshrc.tmpl additions:
  + 3 navigation aliases (.., ..., ....)
  + 4 eza aliases (lla, ldev, lcode, lsize)
  + 2 fzf functions (fkill, frg)
  + 2 git+fzf functions (fglog, fgco)
  + 7 pnpm aliases (pi, pd, pb, pt, pa, pr, px)
  + 7 bun aliases (bi, bd, bb, bt, ba, br, bx)
  + 3 jq aliases (jqless, pretty-json, check-json)
  + 1 direnv hook (conditional on install)
  + 1 BAT_THEME export

run_once_install-packages.sh.tmpl additions:
  + fd added to BREW_PACKAGES
  + direnv added to BREW_PACKAGES (if including as dependency)

Total: ~30 new lines in zshrc, 1-2 packages in install script
```

## Relationship to Other Proposals

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPOSAL DEPENDENCY MAP                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  THIS PROPOSAL (zshrc-definitive)                               │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Navigation, eza, fzf, git+fzf, pnpm, bun,           │       │
│  │ jq, direnv, fd, BAT_THEME                            │       │
│  └──────────────────────────────────────────────────────┘       │
│        │                                                         │
│        │  NO dependency on pending changes.                      │
│        │  Can be implemented independently.                      │
│        │  All additions are in NEW sections of dot_zshrc.tmpl    │
│        │  (no overlap with lines modified by other changes).     │
│        │                                                         │
│        ├──→ starship-enhancement (separate proposal)            │
│        │    Both touch catppuccin (BAT_THEME here,              │
│        │    palette there). No file conflict.                    │
│        │                                                         │
│        └──→ git-config-dotfile (separate proposal)              │
│             delta syntax-theme = "Catppuccin Mocha"             │
│             complements BAT_THEME set here.                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
