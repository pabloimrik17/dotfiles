## 1. Assets Setup

- [x] 1.1 Create `assets/` directory at repo root
- [x] 1.2 Add `assets/` to `.chezmoiignore.tmpl`

## 2. README Structure

- [x] 2.1 Create `README.md` with shield-wall badges (chezmoi, macOS, Linux, zsh, Catppuccin Mocha, Starship, Ghostty) using `for-the-badge` style
- [x] 2.2 Add centered hero screenshot reference (`assets/terminal-overview.png`, width 800)
- [x] 2.3 Write 2-3 sentence introduction
- [x] 2.4 Add "What's Included" table grouped by category (Terminal, Shell, CLI Tools, Git, AI Tooling)

## 3. Setup Guide

- [x] 3.1 Write setup section: install chezmoi → `chezmoi init pabloimrik17/dotfiles` → `chezmoi apply`, note interactive install script

## 4. Daily Workflows

- [x] 4.1 Write "Pulling Latest Changes" section: quick (`chezmoi update`) + preview-first (`chezmoi git pull -- --autostash --rebase` → `chezmoi diff` → `chezmoi apply`)
- [x] 4.2 Write "Making & Pushing Changes" section: `chezmoi edit` / `chezmoi re-add` (non-templates) / `chezmoi add` (templates) → `chezmoi git add .` → `chezmoi git -- commit -m "msg"` → `chezmoi git push`

## 5. Screenshots (MANUAL)

- [x] 5.1 Open Ghostty, resize window to ~120 cols x 35 rows
- [x] 5.2 `cd` into a git repo (this dotfiles repo works)
- [x] 5.3 Run `lt` (eza tree view with icons)
- [x] 5.4 Take screenshot → save as `assets/terminal-overview.png`
- [x] 5.5 (Optional) Optimize: `pngquant assets/*.png --ext .png --force`
