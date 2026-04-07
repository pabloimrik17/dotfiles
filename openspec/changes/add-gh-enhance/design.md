## Context

The dotfiles repo uses chezmoi. Tools are installed via `run_onchange_install-packages.sh.tmpl` with interactive confirmation groups. Shell config is in `dot_zshrc.tmpl` with aliases grouped by tool. gh-dash config lives at `dot_config/gh-dash/config.yml`. The global theme is Catppuccin Mocha.

`gh-enhance` is a separate `gh` CLI extension (`dlvhdr/gh-enhance`) — a TUI for GitHub Actions. Unlike gh-dash, it has no config file; theming is via `ENHANCE_THEME` env var using bubbletint theme IDs, and keybindings are built-in (not customizable).

## Goals / Non-Goals

**Goals:**

- Install gh-enhance idempotently as part of the dotfiles bootstrap
- Apply Catppuccin Mocha theme consistently via the `ghe` alias
- Integrate with gh-dash via keybindings (both tmux and inline modes)
- Keep the change minimal — only touch what's needed for gh-enhance

**Non-Goals:**

- Modifying existing gh-dash config beyond adding keybindings
- Creating a config file for ENHANCE (it doesn't support one)
- Adding other gh extensions in this change
- Customizing ENHANCE's built-in keybindings (not supported)

## Decisions

### 1. Add to existing gh extensions group in install script

The install script already has a "Group: gh CLI extensions" section with gh-dash. Add gh-enhance to the same group with the same idempotency pattern:

```bash
gh extension list | grep -q "dlvhdr/gh-enhance" || gh extension install dlvhdr/gh-enhance
```

**Alternative considered:** Creating a separate confirmable group for gh-enhance — rejected because it's the same category (gh extensions) and the existing group handles multiple items cleanly.

### 2. Theme via alias, not global env var

ENHANCE reads `ENHANCE_THEME` env var. Two options were considered:

| Option                                                  | Pros              | Contras             |
| ------------------------------------------------------- | ----------------- | ------------------- |
| `export ENHANCE_THEME=catppuccin_mocha` in zshrc        | Always consistent | Pollutes global env |
| `alias ghe='ENHANCE_THEME=catppuccin_mocha gh enhance'` | Clean, scoped     | Must use alias      |

**Decision:** Alias approach. Consistent with existing alias pattern (`ghd`, `ghpr`, `ghpv`, `ghpl`). The env var only matters when running gh-enhance, so scoping it to the alias is cleaner. The gh-dash keybindings also set the env var inline.

### 3. Two keybindings: T (tmux) and t (inline)

Both launch ENHANCE from gh-dash's PR view with the Catppuccin Mocha theme:

```yaml
keybindings:
    prs:
        - key: T
          name: CI checks (tmux)
          command: tmux split-window -h 'ENHANCE_THEME=catppuccin_mocha gh enhance -R {{.RepoName}} {{.PrNumber}}'
        - key: t
          name: CI checks (inline)
          command: ENHANCE_THEME=catppuccin_mocha gh enhance -R {{.RepoName}} {{.PrNumber}}
```

- `T` (tmux): Opens a horizontal split pane — non-blocking, gh-dash visible in the other pane
- `t` (inline): Replaces gh-dash in the current terminal — simpler, returns to gh-dash on quit

The user wants both during a trial period to decide which flow they prefer.

**Template variables used:** `{{.RepoName}}` (owner/repo), `{{.RepoPath}}` (local clone path), `{{.PrNumber}}`.

### 4. Alias naming: ghe

`ghe` for `gh enhance`, following the established pattern:

| Alias  | Command                                           |
| ------ | ------------------------------------------------- |
| `ghd`  | `gh dash`                                         |
| `ghpr` | `gh pr create`                                    |
| `ghpv` | `gh pr view`                                      |
| `ghpl` | `gh pr list`                                      |
| `ghe`  | `ENHANCE_THEME=catppuccin_mocha gh enhance` (NEW) |

### 5. bubbletint theme ID: catppuccin_mocha

ENHANCE uses bubbletint's theme registry (500+ themes). The exact ID for Catppuccin Mocha is `catppuccin_mocha`. This matches the global dotfiles theme and requires no manual color mapping (unlike gh-dash which needed per-color hex values).

## Risks / Trade-offs

- **[tmux dependency for T keybinding]** — Same trade-off as the existing `C` keybinding. If not in tmux, `T` fails but `t` (inline) still works. Acceptable since the user always runs in tmux.
- **[No config file]** — ENHANCE doesn't support a config.yml. All customization is via env var + CLI flags. This means less to manage but also less to customize. If ENHANCE adds config file support later, we can add it then.
- **[Extension not auto-updated]** — Same as gh-dash: `gh extension upgrade gh-enhance` must be run manually. Could add to a maintenance script later.
- **[Dual keybindings are temporary]** — The user wants to trial both `T` and `t`. One may be removed later once a preference emerges.
