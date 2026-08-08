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
- `dot_config/opencode/opencode.jsonc` (OpenCode config)
- `dot_tmux.conf` (tmux settings)
- `.mcp.json` (Claude Code MCP servers)
- `dot_claude/settings.json.tmpl` (Claude Code settings)
- `run_onchange_install-packages.sh.tmpl` (brew packages, gh extensions, plugins)

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

Edit `docs/manual.html` using the exact HTML patterns described below. Only apply changes the user approved.

## HTML Convention Reference

When proposing or editing the manual, use these exact patterns:

### Table row (alias/command)

```html
<tr>
    <td><code>alias_name</code></td>
    <td><code>actual_command</code> &mdash; description</td>
</tr>
```

### Table row (keyboard shortcut)

```html
<tr>
    <td><kbd>⌘</kbd>+<kbd>T</kbd></td>
    <td>Action description</td>
</tr>
```

### Table row (config setting)

```html
<tr>
    <td>Setting Name</td>
    <td>value or description</td>
</tr>
```

### New h3 subsection with table

```html
<h3>Tool Name</h3>
<table>
    <thead>
        <tr>
            <th>Alias</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <!-- rows here -->
    </tbody>
</table>
```

### Flow block (workflow)

```html
<div class="flow-only">
    <strong>Flow: Workflow name</strong><br />
    <code>step1</code> &rarr; <code>step2</code> &rarr; result
</div>
```

### New section (rare — new tool category)

```html
<details
    id="section-id"
    open
>
    <summary>N. Section Name</summary>
    <div class="section-content">
        <!-- h3 subsections and tables -->
    </div>
</details>
```

Also requires: sidebar `<a href="#section-id">` link and renumbering subsequent sections.

### Styling rules

- `<code>` for aliases, commands, config values, file paths
- `<kbd>` for physical keys: `⌘`, `⌥`, `Ctrl`, `⇧`, `Esc`, `Tab`, letter/number keys
- `&mdash;` for em-dash separators in descriptions
- `&rarr;` for flow arrows
- `&harr;` for bidirectional arrows

## Guardrails

- **Never edit docs/manual.html without user confirmation**
- Keep proposals specific and actionable (exact HTML, not vague suggestions)
- When unsure if something merits documentation, include it in the proposal but flag it as optional
- Preserve the existing section order and numbering
- Match the indentation style of surrounding HTML (4 spaces)
