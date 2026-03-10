## Context

Dotfiles repo managed by chezmoi. All terminal productivity config (aliases, tools, plugins) was added in bulk. No unified reference exists. Need a single HTML file that serves as both browsable manual (screen) and printable cheatsheet (print). File lives in `docs/manual.html`, not managed by chezmoi.

## Goals / Non-Goals

**Goals:**

- Single `docs/manual.html` — zero external dependencies (no build, no CDN, no framework)
- Screen: Catppuccin Mocha dark, sidebar nav, collapsible sections, Ctrl+K live filter, narrative flows
- Print: `@media print` auto-transforms to dense A4 cheatsheet — light theme, multi-column, no interactive chrome
- Cover all 12 areas: terminal, nav, files, git, worktrees, pkg managers, shell productivity, brew, docker, macOS, Claude Code, OpenCode

**Non-Goals:**

- No static site generator (VitePress, Docusaurus) — overkill for single file
- No separate data source (YAML/JSON) — content lives directly in HTML
- No chezmoi templating — file is repo-only reference
- No responsive mobile layout — desktop browser + A4 print only

## Decisions

### Single HTML file with embedded CSS/JS

All styles and JS inline in one file. No external assets to break, no build step, opens instantly from filesystem via `file://` or any local server.
Alternative: separate CSS/JS files — rejected, adds complexity for zero benefit on a single-page doc.

### Catppuccin Mocha for screen, light inversion for print

Screen uses Mocha palette (dark bg `#1e1e2e`, text `#cdd6f4`). Print uses CSS `@media print` to flip to white bg + dark text — saves ink, better readability on paper.
Alternative: dark print — rejected, wastes toner and poor contrast on paper.

### CSS-only collapsible sections via `<details>`/`<summary>`

No JS needed for collapse/expand. Native HTML5, accessible, works without JS.
Print CSS forces all `<details>` open so nothing is hidden on paper.

### Vanilla JS for Ctrl+K search

Lightweight filter — hides non-matching sections/rows. No fuzzy matching, just case-insensitive substring on visible text.
Alternative: lunr.js or fuse.js — rejected, overkill for ~200 entries and adds dependency.

### Sidebar nav via CSS `position: sticky`

Fixed sidebar on screen, hidden on print. Uses anchor links to sections. No JS needed for basic nav.

### Print layout: CSS multi-column + page-break control

`column-count: 2` or `3` for dense cheatsheet. `break-inside: avoid` on sections. Narrative flows hidden in print (tagged with `.flow-only` class).
Target: 2-4 A4 pages depending on font size tuning.

### Content structure: tables for shortcuts, prose for flows

Each section has a `<table>` of shortcuts (alias → description) for quick reference, plus optional `.flow-only` blocks with step-by-step narrative guides. Print shows only tables.

## Risks / Trade-offs

- **Large single file (~30-50KB)** → acceptable for local file, no network concern
- **Manual maintenance** → low frequency (aliases rarely change), mitigated by clear section structure
- **Print page count** → may need font/column tuning after first render, not predictable upfront
- **No dark mode toggle** → always dark on screen. Could add later with CSS custom properties if needed, but YAGNI for personal use
