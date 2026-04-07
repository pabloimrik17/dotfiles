## 1. Fix repoPaths

- [x] 1.1 Replace `"*/*": ~/WebstormProjects/*` with `":owner/:repo": ~/WebstormProjects/:repo` in `dot_config/gh-dash/config.yml`

## 2. Fix and add keybindings

- [x] 2.1 Add `name: Lazygit` to universal `g` keybinding
- [x] 2.2 Add direct `C` keybinding: code review with Claude (`wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x "claude /code-review:code-review {{.RepoName}}#{{.PrNumber}}"`) with `name: Code review with Claude`
- [x] 2.3 Add direct `W` keybinding: worktree + Claude (`wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude`) with `name: Worktree + Claude`
- [x] 2.4 Add tmux `R` keybinding: code review in tmux window (`tmux new-window -n "PR-{{.PrNumber}}" 'wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x "claude /code-review:code-review {{.RepoName}}#{{.PrNumber}}"'`) with `name: Code review (tmux)`
- [x] 2.5 Add tmux `E` keybinding: worktree + Claude in tmux window (`tmux new-window -n "PR-{{.PrNumber}}" 'wt -C {{.RepoPath}} switch pr:{{.PrNumber}} -x claude'`) with `name: Worktree + Claude (tmux)`

## 3. Verify

- [x] 3.1 Validate YAML syntax of updated config file
