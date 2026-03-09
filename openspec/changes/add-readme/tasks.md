## 1. Assets Setup

- [ ] 1.1 Create `assets/` directory at repo root
- [ ] 1.2 Add `assets/` to `.chezmoiignore.tmpl`

## 2. README Structure

- [ ] 2.1 Create `README.md` with shield-wall badges (chezmoi, macOS, Linux, zsh, Catppuccin Mocha, Starship, Ghostty) using `for-the-badge` style
- [ ] 2.2 Add centered hero screenshot reference (`assets/terminal-overview.png`, width 800)
- [ ] 2.3 Write 2-3 sentence introduction
- [ ] 2.4 Add "What's Included" table grouped by category (Terminal, Shell, CLI Tools, Git, AI Tooling)

## 3. Setup Guide

- [ ] 3.1 Write setup section: install chezmoi → `chezmoi init pabloimrik17/dotfiles` → `chezmoi apply`, note interactive install script

## 4. Daily Workflows

- [ ] 4.1 Write "Pulling Latest Changes" section: quick (`chezmoi update`) + preview-first (`chezmoi git pull -- --autostash --rebase` → `chezmoi diff` → `chezmoi apply`)
- [ ] 4.2 Write "Making & Pushing Changes" section: `chezmoi edit` / `chezmoi re-add` (non-templates) / `chezmoi add` (templates) → `chezmoi git add .` → `chezmoi git -- commit -m "msg"` → `chezmoi git push`

## 5. Screenshots (MANUAL)

- [ ] 5.1 Open Ghostty, resize window to ~120 cols x 35 rows
- [ ] 5.2 `cd` into a git repo (this dotfiles repo works)
- [ ] 5.3 Run `lt` (eza tree view with icons)
- [ ] 5.4 Take screenshot → save as `assets/terminal-overview.png`
- [ ] 5.5 (Optional) Optimize: `pngquant assets/*.png --ext .png --force`
