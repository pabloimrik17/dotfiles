## Context

3 machines (2 macOS, 1 future Windows) with Ghostty, Zsh, and Claude Code configured independently. No current dotfiles management — configs are edited locally and drift between machines. The `dotfiles` repo is a new standalone GitHub repo; chezmoi is the management tool.

Current config locations:

- `~/.config/ghostty/config` + `themes/` (4 catppuccin variants)
- `~/.zshrc` (oh-my-zsh, starship, aliases, tool integrations) + `~/.config/starship.toml`
- `~/.claude/settings.json` (global) + `settings.local.json` (machine-local, excluded)

Key challenge: `.zshrc` and `settings.json` contain hardcoded paths (`/Users/etherless/`) that differ per machine. Zsh plugin source paths differ between Intel macOS (`/usr/local/share/`) and Apple Silicon (`/opt/homebrew/share/`).

## Goals / Non-Goals

**Goals:**

- Single source of truth for all 3 tool configs
- 2-command bootstrap on a new macOS machine (`brew install chezmoi && chezmoi init --apply`)
- Machine-specific path resolution via templates
- Interactive dependency installation (no silent side effects)
- Future-ready for Windows (ignore rules, OS conditionals)

**Non-Goals:**

- Windows support now (deferred — only macOS targets at launch)
- Managing oh-my-zsh plugin source code (installed via git clone, not vendored)
- Managing runtime data (`~/.claude/cache/`, `~/.claude/history.jsonl`, etc.)
- Managing brew itself (prerequisite, not bootstrapped)
- Managing git config (`.gitconfig`) — could be added later but out of scope

## Decisions

### D1: chezmoi over alternatives

**Choice**: chezmoi

**Alternatives considered**:

- **GNU Stow**: Symlink-only, no templating, no OS detection. Would require separate scripts for path differences and dependency installation.
- **yadm**: Git-based, supports templates, but less mature and smaller community than chezmoi.
- **Nix home-manager**: Fully declarative and reproducible, but steep learning curve and heavyweight for this scope.
- **Custom scripts**: Full control but reinvents templating, diffing, OS detection, and state tracking.

**Rationale**: chezmoi is a single binary with built-in templating (Go templates), OS/arch detection, `run_once` scripts, diff before apply, and native git integration. Sweet spot between power and simplicity.

### D2: Standalone repo, not monorepo subdirectory

**Choice**: Dedicated `dotfiles` repo on GitHub

**Alternatives considered**:

- **Subdirectory of monolab with `.chezmoiroot`**: Works technically but couples dotfiles distribution to the full monorepo clone. Adds weight and creates a chicken-and-egg problem (need Node/pnpm to use Nx, but dotfiles install Node).

**Rationale**: Dotfiles have zero code dependency on monolab. Decoupled repo keeps bootstrap instant and follows the universal `<user>/dotfiles` convention.

### D3: Repo root IS the chezmoi source state

**Choice**: No `.chezmoiroot` indirection — repo root contains `dot_config/`, `dot_zshrc.tmpl`, etc.

**Rationale**: Since this is a dedicated repo (not a monorepo subdirectory), there's no need for `.chezmoiroot`. Direct mapping is simpler and matches chezmoi's default expectation.

### D4: Template only what needs templating

**Choice**: Only files with machine-specific content get `.tmpl` suffix. Static configs (Ghostty, Starship) stay as plain files.

**Rationale**: Fewer templates = easier to edit and diff. Ghostty config has no paths or OS-specific values. Starship config is symbol definitions — universal. Only `.zshrc` (home paths, brew paths) and `settings.json` (home paths in statusLine) need templating.

Files as templates:

- `dot_zshrc.tmpl` — `{{ .chezmoi.homeDir }}`, brew prefix conditionals
- `dot_claude/settings.json.tmpl` — `{{ .chezmoi.homeDir }}` in statusLine paths

Files as static:

- `dot_config/ghostty/config`
- `dot_config/ghostty/themes/*`
- `dot_config/starship.toml`

### D5: Brew prefix detection via chezmoi arch

**Choice**: Use `{{ if eq .chezmoi.arch "arm64" }}` to determine brew prefix.

```
{{ if eq .chezmoi.os "darwin" }}
  {{ if eq .chezmoi.arch "arm64" }}
    /opt/homebrew/share/
  {{ else }}
    /usr/local/share/
  {{ end }}
{{ end }}
```

**Rationale**: Apple Silicon uses `/opt/homebrew/`, Intel uses `/usr/local/`. chezmoi exposes `.chezmoi.arch` natively. This is more reliable than checking if the path exists at template render time.

### D6: Install script with grouped interactive prompts

**Choice**: Single `run_once_install-packages.sh.tmpl` with `read -p` prompts per group.

Groups:

1. Brew packages (starship, eza, bat, zoxide, atuin, fzf, ripgrep, lazygit)
2. Fonts (font-hack-nerd-font via brew cask)
3. Oh-my-zsh + custom plugins (you-should-use via git clone; zsh-autosuggestions and zsh-syntax-highlighting via brew)

**Rationale**: Grouping avoids prompt fatigue (not one prompt per package) while keeping the user in control. `run_once` ensures it only runs on first apply — subsequent `chezmoi apply` won't re-trigger it.

### D7: Non-macOS shows manual instructions

**Choice**: On non-darwin OS, the install script prints a list of required packages instead of attempting installation.

**Rationale**: Windows/Linux package managers vary widely (apt, dnf, pacman, winget, scoop, chocolatey). Attempting to support all is out of scope. A clear list of what's needed is more useful than a broken script.

## Risks / Trade-offs

**[Risk] Monorepo clone weight on `chezmoi init`** → Mitigated by D2: standalone repo keeps clone to KB-level.

**[Risk] `run_once` script re-runs if modified** → chezmoi tracks `run_once` by file content hash. If the script is edited (e.g., adding a new package), it re-runs entirely. Mitigation: idempotent checks inside the script (`command -v <tool> || brew install <tool>`).

**[Risk] Template syntax errors break apply** → `chezmoi diff` before `chezmoi apply` catches rendering issues. Also `chezmoi doctor` validates the source state.

**[Risk] Claude Code settings.json format changes** → Claude Code is rapidly evolving. Settings schema may change. Mitigation: keep `settings.json` minimal (only sync what's intentional — plugins, env, statusLine). Review on each update.

**[Risk] oh-my-zsh custom plugin repos become unavailable** → `you-should-use` is a community plugin. If repo disappears, git clone fails. Mitigation: graceful failure in install script (continues with remaining groups).

**[Trade-off] Brew as hard prerequisite** → Not bootstrapped by the dotfiles. User must install brew manually first (or use the official one-liner). Acceptable because brew's install is well-documented and stable.

**[Trade-off] No automatic sync** → User must explicitly run `chezmoi update` on each machine. Could add a cron/launchd job later, but explicit is safer for now.

## Open Questions

- Should Ghostty config eventually be templated for `font-size` differences across monitors/machines? (Currently static — same size everywhere)
- Should we add a `run_onchange_` script that re-sources `.zshrc` after apply? (Currently user must `source ~/.zshrc` or open new shell manually)
