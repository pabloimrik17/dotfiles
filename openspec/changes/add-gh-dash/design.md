## Context

The dotfiles repo uses chezmoi to manage config files under `dot_config/` (mapped to `~/.config/`). Tools are installed via `run_onchange_install-packages.sh.tmpl` with interactive confirmation groups. The shell config is in `dot_zshrc.tmpl` with aliases grouped by tool. The global theme is Catppuccin Mocha, applied to ghostty, bat, delta, starship, and fzf.

`gh-dash` is a `gh` CLI extension (not a brew package) that reads its config from `~/.config/gh-dash/config.yml`. The `gh` CLI is already installed via brew.

## Goals / Non-Goals

**Goals:**

- Add gh-dash with a Catppuccin Mocha-themed config managed by chezmoi
- Integrate with existing tools via keybindings (lazygit, delta, Claude Code)
- Install gh-dash idempotently as part of the dotfiles bootstrap
- Provide useful default sections for PRs, issues, and notifications

**Non-Goals:**

- Per-repo `.gh-dash.yml` overrides (can add later if needed)
- Customizing gh-dash's Go template functions or advanced scripting
- Adding other gh extensions beyond gh-dash in this change

## Decisions

### 1. Install as a gh extension section in the install script

gh-dash is a `gh` CLI extension, not a brew package. Add a new "Group: gh extensions" section in `run_onchange_install-packages.sh.tmpl` after the brew packages group. This follows the existing pattern of confirmable groups and keeps extension management separate from brew. The section will use `gh extension list` to check if already installed and `gh extension install` to add it.

**Alternative considered:** Adding `gh-dash` to the BREW_PACKAGES array — rejected because gh-dash is installed via `gh extension install`, not `brew install`.

### 2. Config file at dot_config/gh-dash/config.yml (plain, no chezmoi template)

The config has no user-specific values that need templating (GitHub username is handled by `@me` in search filters). A plain YAML file in `dot_config/gh-dash/` is sufficient.

**Alternative considered:** Using `.tmpl` extension for chezmoi templating — unnecessary since `@me` resolves dynamically via gh CLI auth.

### 3. Catppuccin Mocha theme mapping

Map Catppuccin Mocha palette directly to gh-dash theme colors:

| gh-dash key         | Catppuccin token | Hex     |
| ------------------- | ---------------- | ------- |
| text.primary        | Text             | #cdd6f4 |
| text.secondary      | Teal             | #94e2d5 |
| text.inverted       | Base             | #1e1e2e |
| text.faint          | Overlay0         | #6c7086 |
| text.warning        | Red              | #f38ba8 |
| text.success        | Green            | #a6e3a1 |
| background.selected | Surface0         | #313244 |
| border.primary      | Blue             | #89b4fa |
| border.secondary    | Green            | #a6e3a1 |
| border.faint        | Surface1         | #45475a |

### 4. Claude Code keybinding for PR review

The `C` keybinding in PR view opens a tmux window and launches Claude Code with the code-review skill:

```yaml
- key: C
  name: code review
  command: >
      tmux new-window -n "PR-{{.PrNumber}}" -c {{.RepoPath}}
      'claude "/code-review:code-review {{.RepoName}}#{{.PrNumber}}"'
```

This requires tmux to be running. If the user is not in a tmux session, the command will fail gracefully (tmux error).

**Alternative considered:** Using `opencode` like omerxx — rejected because user prefers Claude Code.

### 5. Delta as diff pager

Set `pager.diff: delta` in config. gh-dash auto-appends `--paging always` when the pager is `delta`.

### 6. Repo paths with wildcard

```yaml
repoPaths:
    "*/*": ~/WebstormProjects/*
```

This maps any `owner/repo` to `~/WebstormProjects/repo` for checkout operations.

### 7. Shell alias placement

Add `alias gd="gh dash"` in the GitHub section of `dot_zshrc.tmpl`, alongside existing `ghpr`, `ghpv`, `ghpl` aliases.

## Risks / Trade-offs

- **[tmux dependency for C keybinding]** → If not in a tmux session, the code review keybinding fails. Mitigation: this is a power-user feature; the user already has tmux installed and configured.
- **[compact mode undecided]** → User wants to try both compact and non-compact. Mitigation: start with `compact: false` (default); easy to toggle later by changing one line.
- **[gh extension not auto-updated]** → Unlike brew packages, gh extensions need `gh extension upgrade` manually. Mitigation: acceptable for now; can add to a maintenance script later.
