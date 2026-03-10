## Why

All shortcuts, aliases, flows, and tool configs across the dotfiles setup were added in bulk. No single reference exists to consult or internalize them. Without a manual, most productivity gains are invisible — you forget what's available and fall back to verbose commands.

## What Changes

- **New file** `docs/manual.html` — single-file reference manual (zero dependencies, vanilla HTML/CSS/JS)
- **Screen mode**: Catppuccin Mocha dark theme, sidebar nav, collapsible sections, live search (Ctrl+K), `<kbd>` keyboard hints, narrative workflow guides
- **Print mode**: `@media print` transforms to dense A4 cheatsheet — light theme, multi-column, no nav chrome, shortcuts-only (no narrative flows). Target 2-4 pages A4
- **Not managed by chezmoi** — lives in repo only as dev reference

## Capabilities

### New Capabilities

- `manual-web`: Browsable HTML manual with all shortcuts, aliases, keybindings, and step-by-step flows organized by area. Catppuccin Mocha theme. Sidebar nav + Ctrl+K live filter. Sections collapse/expand.
- `manual-print`: Same HTML file, print-optimized via CSS `@media print`. Light theme, multi-column dense layout, no interactive elements. A4-targeted cheatsheet.

### Modified Capabilities

_(none)_

## Content Sections

### 1. Terminal (Ghostty)

Keybindings:

- `⌘T` new tab, `⌘W` close, `⌘⇧←/→` switch tabs, `⌘1-5` goto tab
- `⌘⇧T` toggle quick terminal (global, drops from top)
- `⌘⇧,` reload config

Flow: "quick command without losing context" → ⌘⇧T → type → ⌘⇧T to dismiss

### 2. Navigation & Search

zoxide:

- `cd` → `z` (frecency-based), `cdi` → `zi` (interactive fzf)

fzf:

- `Ctrl+T` insert file path, `Alt+C` cd into dir, `Ctrl+/` toggle preview
- Preview: bat for files, eza tree for dirs
- Backend: fd (fast, respects .gitignore)

atuin:

- `Ctrl+R` full-text history search (replaces fzf's Ctrl+R)

ripgrep:

- `rgi` case-insensitive, `rgf` search filenames, `rgl` files-with-matches

Custom fzf functions:

- `frg <pattern>` — rg + fzf + bat preview → opens in editor at line
- `fkill [signal]` — ps + fzf multi-select → kill processes

Flow: "find text in code and open" → `frg pattern` → select match → opens in $EDITOR at line

### 3. Files & Viewing

eza (ls replacement):

- `ls` icons+dirs-first, `ll` long, `la` long+hidden, `lt` tree L2, `lta` tree+hidden
- `lla` long+hidden+git, `ldev` long+git-ignore, `lcode` tree ignoring node_modules/dist
- `lsize` sorted by size descending

bat (cat replacement):

- `cat` → bat with auto style, `catp` plain (no decorations)

Flow: "explore unfamiliar project" → `lt` for structure → `lcode` for source tree → `cat README.md`

### 4. Git

Custom aliases: `gs` status, `ga` add, `gc` commit, `gp` push, `gl` log graph, `gd` diff, `lg` lazygit

OMZ git plugin (key ones):

- Staging: `gaa` add all, `gapa` add patch
- Commit: `gcmsg "msg"`, `gc!` amend, `gcam "msg"` add+commit
- Branch: `gco` checkout, `gcb` new branch, `gcm` checkout main
- Diff: `gds` diff staged, `gdca` diff cached
- Fetch/pull: `gf` fetch, `gfa` fetch all+prune, `gup` pull rebase, `gupa` pull rebase+autostash
- Push: `gpf` force-with-lease, `gpsup` push set-upstream
- Stash: `gsta` save, `gstp` pop, `gstl` list, `gsts` show
- Rebase: `grbi` interactive, `grbc` continue, `grba` abort
- Log: `glog` oneline graph, `gloga` all branches
- WIP: `gwip` commit WIP, `gunwip` undo WIP
- Navigate: `grt` cd to repo root
- Reset: `grh` reset, `grhh` reset hard

GitHub CLI: `ghpr` create PR, `ghpv` view PR, `ghpl` list PRs (+ gh completions)

gitignore plugin: `gi node,macos` → generate .gitignore from templates

delta: side-by-side diffs, line numbers, navigate mode, color-moved

lazygit: `lg` → full TUI git interface

fzf+git:

- `fglog` browse commits with preview
- `fgco` switch branch with log preview

Flow: "full feature cycle" → `gcb feat/x` → code → `gaa` → `gcmsg "feat: x"` → `gpsup` → `ghpr`
Flow: "interactive commit review" → `fglog` → browse → select

### 5. Worktrees (Worktrunk)

- `wt` — git worktree manager with cd integration
- AI-powered commit message generation (claude haiku)
- Auto deps install on worktree create (detects bun/pnpm/npm)

Flow: "isolated feature work" → `wt create feat-x` → auto deps → code → `wt commit` (AI msg) → merge

### 6. Package Managers

pnpm: `pi` install, `pd` dev, `pb` build, `pt` test, `pa` add, `pr` run, `px` exec
bun: `bi` install, `bd` dev, `bb` build, `bt` test, `ba` add, `br` run, `bx` bunx
npm OMZ: `npmg` global install, `npmS`/`npmD` save/dev, `npmO` outdated, `npmL0` list top-level

jq helpers: `jqless` pretty+paged, `pretty-json` format, `check-json` validate

### 7. Shell Productivity (OMZ plugins)

Keybindings:

- `Ctrl+Z` toggle fg/bg (fancy-ctrl-z) — no need to type `fg`
- `Esc Esc` prepend sudo (sudo plugin)
- `Ctrl+O` copy command line to clipboard (copybuffer)

Clipboard:

- `copyfile <file>` copy file contents
- `copypath [path]` copy absolute path (default: cwd)

Encoding:

- `e64`/`d64` base64 encode/decode
- `urlencode`/`urldecode` URL encode/decode

Archives:

- `extract <file>` or `x <file>` — universal unarchive (tar/zip/rar/7z/gz/bz2/xz/deb...)
- `-r` flag removes archive after extraction

Web search:

- `google "query"`, `ddg "query"`, `github "query"`, `youtube "query"`, `wiki "query"`

JSON (pipe):

- `| pp_json` pretty-print, `| is_json` validate

History:

- `h` history, `hs <term>` grep history, `hsi <term>` case-insensitive

Passive/transparent:

- `you-should-use` — reminds when you type a command that has an alias
- `bgnotify` — desktop notification when long command finishes (>5s)
- `safe-paste` — prevents pasted code from auto-executing
- `colored-man-pages` — colorized man pages automatically
- `command-not-found` — suggests brew package when command missing

### 8. Brew

- `bubu` full update cycle (update + outdated + upgrade + cleanup)
- `bubo` check outdated only
- `brewsp` list pinned packages

### 9. Docker

docker-compose aliases:

- `dcup`/`dcupd` up/up -d, `dcdn` down, `dclf` logs follow
- `dcps` ps, `dcr` run, `dce` exec, `dcrestart` restart

docker completions (transparent)

### 10. macOS Integration

Finder ↔ Terminal:

- `ofd` open current dir in Finder
- `cdf` cd to Finder's current dir
- `pfd` print Finder dir, `pfs` print Finder selection

Visibility: `showfiles`/`hidefiles` toggle hidden files in Finder

Utilities:

- `quick-look <file>` Quick Look preview
- `man-preview <cmd>` man page in Preview.app
- `rmdsstore` remove .DS_Store recursively
- `tab` / `split_tab` / `vsplit_tab` new terminal panes

### 11. AI Coding — Claude Code

Slash commands (from plugins):

- `/commit` create git commit, `/commit-push-pr` commit + push + open PR
- `/clean_gone` clean local branches deleted on remote
- `/revise-claude-md` update CLAUDE.md with session learnings
- `/claude-md-improver` audit and improve CLAUDE.md quality
- `/create-plugin` guided plugin creation workflow
- `/code-review` review a pull request
- `/plannotator-review` interactive code review UI
- `/plannotator-annotate` interactive annotation UI for markdown

Skills (auto-triggered by context):

- `brainstorming` — explores requirements before implementation
- `systematic-debugging` — structured debugging before proposing fixes
- `test-driven-development` — TDD workflow
- `writing-plans` / `executing-plans` — plan then execute multi-step tasks
- `dispatching-parallel-agents` — parallel independent tasks
- `verification-before-completion` — verify before claiming done
- `using-git-worktrees` — isolated feature work via worktrees
- `finishing-a-development-branch` — merge/PR/cleanup guidance
- `requesting-code-review` / `receiving-code-review` — review workflows
- `frontend-design` — production-grade UI generation
- `browsing` — Chrome DevTools Protocol browser control
- `episodic-memory` — search past conversation history
- `elements-of-style` — Strunk's writing rules for prose

MCP servers (shared with OpenCode):

- `eslint` — lint files on demand
- `context7` — fetch up-to-date library docs
- `knip` — detect unused code/exports
- `memory` — persistent knowledge graph across sessions
- `playwright` — browser automation and testing
- `chrome-devtools` — inspect/control browser sessions
- `gh_grep` — search across GitHub repos

OpenSpec workflow:

- `/opsx:new` start structured change, `/opsx:continue` next artifact
- `/opsx:explore` think through ideas before implementing
- `/opsx:apply` implement tasks, `/opsx:verify` validate implementation
- `/opsx:ff` fast-forward all artifacts at once
- `/opsx:archive` archive completed change

### 12. AI Coding — OpenCode

Plugins:

- `plannotator` — code review and annotation UI
- `wakatime` — coding time tracking
- `websearch-cited` — web search with source citations
- `dcp` — DevTools Protocol browser control

Same MCP servers as Claude Code (eslint, context7, knip, memory, playwright, chrome-devtools, gh_grep)

## Impact

- **Files created**: `docs/manual.html`
- **Files modified**: none
- **Risk**: zero — new file, no chezmoi management, no deps
- **Maintenance**: manual updates when aliases/tools change (low frequency)

## Unresolved

- Exact A4 page count depends on final content density — aim 2-4, adjust font/columns in print CSS
- AI coding sections may be too long for print cheatsheet — consider print-hiding or summarizing to just command list
