## MODIFIED Requirements

### Requirement: Comprehensive ignore patterns

The gitignore_global SHALL include safety-net patterns for:

- macOS artifacts (`.DS_Store`, `.AppleDouble`, `.LSOverride`, `._*`)
- Editor/IDE files (selective `.vscode/` files, `.idea/`, `*.swp`, `*.swo`, `*~`, Sublime files)
- Environment/secrets (`.env*`, with `!.env.example` and `!.env.template` re-included)
- Node.js (`node_modules/`, debug logs for npm/yarn/pnpm)
- Logs (`logs/`, `*.log`)
- Build outputs (`dist/`, `build/`, `*.map`)
- Testing (`coverage/`, `.nyc_output/`)
- Temporary (`tmp/`, `temp/`)
- Agent-local state (`**/.claude/settings.local.json`, `.claude/.worktree-base`)

The gitignore_global is the **only** global ignore file in effect. Because the gitconfig sets `core.excludesFile`, the XDG default location is replaced rather than stacked, so any patterns living there are dead. Patterns must be consolidated here.

`.claude/.worktree-base` is manufactured by this repo's own worktrunk `save-base` hook in every worktree that contains a `.claude/` directory, so it appears in unrelated repositories as an untracked file.

#### Scenario: .vscode selective ignore

- **WHEN** a project contains `.vscode/settings.json` and `.vscode/launch.json`
- **THEN** `settings.json` is globally ignored but `launch.json` is NOT globally ignored

#### Scenario: Env files ignored globally

- **WHEN** a project without its own `.gitignore` contains a `.env` file
- **THEN** the `.env` file is excluded from `git status` and `git add`

#### Scenario: Agent-generated files are ignored globally

- **WHEN** a worktree created by worktrunk contains `.claude/.worktree-base` and `.claude/settings.local.json`
- **THEN** neither appears in `git status`, without needing a per-repository `.gitignore` entry

#### Scenario: No second global ignore file is relied upon

- **WHEN** patterns are needed globally
- **THEN** they SHALL be added to the gitignore_global, because a file at the XDG default location has no effect while `core.excludesFile` is set
