## 1. Install Script

- [x] 1.1 Add `git` to `BREW_PACKAGES` array in `run_once_install-packages.sh.tmpl`

## 2. Gitconfig Template

- [x] 2.1 Create `dot_gitconfig.tmpl` with `[user]` section using `{{ .name }}` and `{{ .email }}` chezmoi data
- [x] 2.2 Add `[core]` section: editor, autocrlf, excludesfile, pager (no Sourcetree entries)
- [x] 2.3 Add modern defaults: `[init]`, `[push]`, `[pull]`, `[fetch]`, `[rerere]`, `[credential]`
- [x] 2.4 Add `[diff]` section with `colorMoved` and `algorithm = histogram`
- [x] 2.5 Add `[merge]` section with `conflictstyle = zdiff3`
- [x] 2.6 Add `[interactive]` and `[delta]` sections (no syntax-theme)
- [x] 2.7 Add `[alias]` section: `lg`, `last`, `unstage`, `undo`, `amend`, `branches`, `remotes`

## 3. Gitignore Global

- [x] 3.1 Create `dot_gitignore_global` with macOS, IDE (selective .vscode/), env/secrets, Node.js, logs, build, testing, and temp patterns

## 4. Verification

- [x] 4.1 Run `chezmoi diff` to confirm rendered gitconfig matches expected output
- [x] 4.2 Verify no Sourcetree or legacy entries in rendered output
- [x] 4.3 Verify `dot_gitignore_global` includes selective `.vscode/` entries (settings.json + extensions.json only)
