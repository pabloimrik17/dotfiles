---
description: Analyze config changes and propose updates to docs/manual.html
argument-hint: "[context about what changed]"
---

# Update Manual

Analyze configuration changes and propose updates to `docs/manual.html`.

## When This Activates

This command is invoked via `/docs:manual` to check whether the interactive manual/cheatsheet needs updating after configuration changes.

**Relevant config files:**

- `dot_zshrc.tmpl` (aliases, plugins, keybindings, environment)
- `dot_gitconfig.tmpl` (git aliases, settings)
- `dot_config/ghostty/config` (terminal keybindings, settings)
- `dot_config/starship.toml` (prompt configuration)
- `dot_config/atuin/config.toml` (history settings)
- `dot_config/worktrunk/` (worktree manager config)
- `dot_config/gh-dash/config.yml` (GitHub dashboard)
- `dot_codex/**` (future Codex user configuration)
- `dot_config/opencode/opencode.jsonc` (OpenCode config)
- `dot_junie/**` (Junie user configuration)
- `dot_tmux.conf` (tmux settings)
- `.mcp.json` (Claude Code MCP servers)
- `dot_claude/modify_settings.json.tmpl` (Claude Code settings)
- `run_onchange_install-packages.sh.tmpl` (brew packages, gh extensions, plugins, Codex installer)

**Does NOT trigger on:**

- OpenSpec artifacts, CI workflows, package.json, renovate config
- Changes to the manual itself or README

## Workflow

### Step 1: Detect What Changed

Identify which configuration files were modified:

- Check `git diff` (staged + unstaged) if changes are in progress
- Use conversation context if changes are being planned
- Accept `$ARGUMENTS` as explicit context about what changed (e.g., `/docs:manual added gh-dash aliases`)

### Step 2: Map Changes to Manual Sections

Use this mapping to identify which sections of `docs/manual.html` to analyze:

| Config Source                                                    | Manual Section         |
| ---------------------------------------------------------------- | ---------------------- |
| `dot_config/ghostty/config`                                      | 1. Terminal (Ghostty)  |
| `dot_zshrc.tmpl` — zoxide, fzf, atuin, ripgrep, custom functions | 2. Navigation & Search |
| `dot_zshrc.tmpl` — eza, bat aliases                              | 3. Files & Viewing     |
| `dot_gitconfig.tmpl` + `dot_zshrc.tmpl` — git aliases, gh CLI    | 4. Git                 |
| `dot_config/worktrunk/` + `dot_config/gh-dash/`                  | 5. Worktrees           |
| `dot_zshrc.tmpl` — bun, pnpm, npm, jq aliases                    | 6. Package Managers    |
| `dot_zshrc.tmpl` — misc aliases, plugins, keybindings            | 7. Shell Productivity  |
| `dot_zshrc.tmpl` — brew aliases                                  | 8. Brew                |
| `dot_zshrc.tmpl` — docker aliases                                | 9. Docker              |
| `dot_zshrc.tmpl` — macos aliases                                 | 10. macOS Integration  |
| `.mcp.json` + `dot_claude/` + Claude Code plugins                | 11. Claude Code        |
| `dot_config/opencode/`                                           | 12. OpenCode           |
| `run_onchange_install-packages.sh.tmpl` — Codex installer + `dot_codex/**` | 13. Codex      |
| `dot_junie/**`                                                   | 14. Junie             |

### Step 3: Read and Compare

1. Read the relevant section(s) of `docs/manual.html`
2. Read the actual configuration file(s) that changed
3. Compare: what's in the config vs what's documented

Detect three types of gaps:

- **Missing**: Config entry exists but no matching manual row
- **Stale**: Manual row exists but config entry was removed or changed
- **Outdated**: Manual row exists but values don't match current config

### Step 4: Propose Changes

Present proposals in a structured format:

```markdown
## Proposed Manual Updates

### ✚ ADD (Section X: Name)

- New table row for `alias_name` — description

### ✎ MODIFY (Section Y: Name)

- Update `alias_name`: "old description" → "new description"

### ✖ REMOVE (Section Z: Name)

- Remove row for `alias_name` — no longer in config

### 📋 NEW SUBSECTION (Section W: Name)

- New h3: "Tool Name" with table of N entries

### No changes needed

- Section A, Section B — already in sync
```

If no changes are needed, report: **"Manual is up to date — no changes needed."**

**Wait for user confirmation before editing any files.**

### Step 5: Apply (After Confirmation)

Apply only the approved changes. Before writing, read
`.agents/skills/update-manual/references/html-conventions.md` for the exact row, subsection,
flow-block, and styling patterns — the manual is hand-maintained, so matching its existing
markup matters more than producing valid HTML.

## Guardrails

- **Never edit docs/manual.html without user confirmation**
- Keep proposals specific and actionable (exact HTML, not vague suggestions)
- When unsure if something merits documentation, include it in the proposal but flag it as optional
- Preserve the existing section order and numbering
- Match the indentation style of surrounding HTML (4 spaces)
