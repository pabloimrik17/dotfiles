## 1. HTML scaffold & base styles

- [x] 1.1 Create `docs/manual.html` with HTML5 boilerplate, embedded `<style>` and `<script>` blocks
- [x] 1.2 Implement Catppuccin Mocha CSS custom properties (base, text, surface, accent colors)
- [x] 1.3 Build two-panel layout: sticky sidebar (left) + scrollable content (right)
- [x] 1.4 Style `<kbd>` elements, `<table>` shortcut tables, `<details>`/`<summary>` sections
- [x] 1.5 Add sidebar nav with anchor links to all 12 sections

## 2. Search & interactivity

- [x] 2.1 Add search input box at top of sidebar
- [x] 2.2 Implement Ctrl+K focus shortcut and Escape to clear
- [x] 2.3 Implement live filter JS — hide non-matching table rows and sections on keyup

## 3. Content sections 1-6

- [x] 3.1 Section 1: Terminal (Ghostty) — keybindings table + quick terminal flow
- [x] 3.2 Section 2: Navigation & Search — zoxide, fzf, atuin, ripgrep tables + frg/fkill flows
- [x] 3.3 Section 3: Files & Viewing — eza, bat tables + explore project flow
- [x] 3.4 Section 4: Git — custom aliases, OMZ git plugin (~20 key aliases), gh CLI, gitignore, delta, lazygit, fglog/fgco tables + feature cycle flow
- [x] 3.5 Section 5: Worktrees — worktrunk commands + isolated feature flow
- [x] 3.6 Section 6: Package Managers — pnpm, bun, npm OMZ, jq tables

## 4. Content sections 7-12

- [x] 4.1 Section 7: Shell Productivity — keybindings (Ctrl+Z, Esc Esc, Ctrl+O), clipboard, encoding, archives, web search, JSON, history, passive plugins tables
- [x] 4.2 Section 8: Brew — bubu/bubo/brewsp table
- [x] 4.3 Section 9: Docker — docker-compose aliases table
- [x] 4.4 Section 10: macOS Integration — Finder commands, visibility, utilities tables
- [x] 4.5 Section 11: Claude Code — slash commands, skills, MCP servers, OpenSpec workflow tables
- [x] 4.6 Section 12: OpenCode — plugins, MCP servers tables

## 5. Print stylesheet

- [x] 5.1 Add `@media print` CSS block — light bg, dark text, hide sidebar/search
- [x] 5.2 Set multi-column layout (2-3 columns), condensed font size
- [x] 5.3 Hide `.flow-only` blocks in print
- [x] 5.4 Force all `<details>` open via CSS
- [x] 5.5 Add `break-inside: avoid` on tables/sections, `break-after: avoid` on headers
- [x] 5.6 Test print preview — verify 2-4 A4 pages, adjust font/columns as needed

## 6. Source validation

- [x] 6.1 Cross-check every documented alias, keybinding, and function against actual dotfiles configs (dot_zshrc.tmpl, dot_gitconfig.tmpl, ghostty/config)
- [x] 6.2 Cross-check OMZ plugin shortcuts against upstream plugin source files
- [x] 6.3 Remove or flag any entry that cannot be verified from a source file
