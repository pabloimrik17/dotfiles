---
description: Analyze tool-level changes and propose updates to README.md
argument-hint: "[context about what changed]"
---

# Update README

Analyze tool-level changes and propose updates to `README.md`.

## When This Activates

This command is invoked via `/docs:readme` to check whether the README needs updating after tool-level changes in the dotfiles setup.

**Relevant changes:**

- New tool installed (brew package, cask, gh extension)
- Tool removed from setup
- Setup process changed (install script, prerequisites)
- Significant visual change (theme, prompt, terminal config)
- New workflow pattern added

**Not relevant (use `/docs:manual` instead):**

- New alias for existing tool
- Keybinding changes
- Config value tweaks
- MCP server version updates
- Claude Code plugin additions

## Workflow

### Step 1: Detect What Changed

Identify what tool-level changes occurred:

- Check `git diff` on `run_onchange_install-packages.sh.tmpl` for new/removed packages
- Check for new/removed config directories under `dot_config/`
- Use conversation context if changes are being planned
- Accept `$ARGUMENTS` as explicit context about what changed (e.g., `/docs:readme added gh-dash`)

### Step 2: Read Current README

Read `README.md` and parse its structure:

- **Badges** (line 1-7): Status badges for key tools/themes
- **Screenshot** (line 9-11): Featured terminal screenshot
- **Intro paragraph** (line 13): One-line summary of what's included
- **What's Included table** (line 15-38): Category | Tool (linked) | Description
- **Setup section** (line 39-55): Prerequisites and install steps
- **Daily Workflows section** (line 57-100): Pull, edit, push patterns

### Step 3: Analyze Gaps

Compare actual installed/configured tools against README content:

**What's Included table:**

- Is every major tool in the install script represented in the table?
- Are there table entries for tools that were removed?
- Are descriptions still accurate?
- Is the category assignment correct?

**Other sections:**

- Do badges reflect current key tools/themes?
- Has the setup process changed (new prerequisites, different steps)?
- Have daily workflows changed?
- Is the intro paragraph still accurate?

### Step 4: Propose Changes

Present proposals in a structured format:

```markdown
## Proposed README Updates

### ✚ ADD to What's Included

| Category | Tool                              | Description                                |
| -------- | --------------------------------- | ------------------------------------------ |
| **Git**  | [gh-dash](https://github.com/...) | GitHub dashboard TUI with Catppuccin theme |

### ✎ MODIFY

- Update description for Tool X: "old" → "new"
- Update intro paragraph to mention new tool category

### ✖ REMOVE from What's Included

- Remove row for Tool Y — no longer installed

### 📸 SCREENSHOT SUGGESTIONS

#### gh-dash-overview.png

- **Show**: gh-dash running with open PRs, Catppuccin Mocha theme visible
- **Simulate**: Run `gh dash` in a repo with open PRs. Resize terminal to ~120x35.
- **Placement**: Could be added as a second screenshot below the terminal overview, or inline in What's Included

#### terminal-overview.png (UPDATE)

- **Show**: Updated terminal with new prompt/theme changes visible
- **Simulate**: Open Ghostty, run `ls` in a colorful directory, show starship prompt
- **Placement**: Replace existing featured screenshot

### No changes needed

- Setup section, Daily Workflows — still accurate
```

If no changes are needed, report: **"README is up to date — no changes needed."**

**Wait for user confirmation before editing any files.**

### Step 5: Apply (After Confirmation)

Edit `README.md` applying only the approved text changes. Screenshot descriptions remain as instructions for the user to capture manually.

## README Convention Reference

### What's Included table row

```markdown
| **Category** | [Tool Name](https://tool-url/) | Brief description of what it does |
```

Categories in use: Terminal, Shell, CLI Tools, Git, AI Tooling

### Badge

```markdown
[![Label](https://img.shields.io/badge/Label-text-color?style=for-the-badge&logo=logo-name&logoColor=white)](https://url/)
```

### Screenshot

```markdown
<p align="center">
  <img src="assets/filename.png" alt="Description" width="800">
</p>
```

### Intro paragraph style

One sentence summarizing the stack: tools, theme, shell, terminal. Keep it concise.

## Screenshot Description Format

When proposing screenshots, always include:

1. **Suggested filename**: `assets/descriptive-name.png`
2. **What to show**: Specific content visible in the capture
3. **How to simulate**: Step-by-step to reproduce the scenario
4. **Suggested size**: Terminal dimensions or image width
5. **Placement**: Where in README.md the image should go

## Guardrails

- **Never edit README.md without user confirmation**
- Only propose What's Included entries for **major tools**, not every utility
- Screenshot descriptions are instructions, not automation — the user captures them
- Keep the README concise — it's an overview, not a manual
- Preserve the existing section order
- Link tool names to their official homepage or GitHub repo
