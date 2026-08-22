---
name: update-readme
description: Use when adding, removing, or significantly changing tools in the dotfiles setup — new brew packages, new casks, new gh extensions, tool removals, setup process changes, or significant visual changes (theme, prompt, terminal). Analyzes README.md and proposes updates to the What's Included table, badges, setup instructions, daily workflows, and screenshots. Does NOT trigger on alias-level or keybinding-level changes (those go to the manual only).
---

# Update README

Analyze tool-level changes and propose updates to `README.md`.

## When This Activates

This skill activates when **tool-level** changes happen in the dotfiles setup. It determines whether the README needs updating and proposes text changes plus screenshot descriptions.

**Triggers on:**

- New tool installed (brew package, cask, gh extension)
- Tool removed from setup
- Setup process changed (install script, prerequisites)
- Significant visual change (theme, prompt, terminal config)
- New workflow pattern added

**Does NOT trigger on:**

- New alias for existing tool (manual-level, not README-level)
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
- Accept `$ARGUMENTS` as explicit context about what changed

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

#### assets/gh-dash-overview.png

- **Show**: gh-dash running with open PRs, Catppuccin Mocha theme visible
- **Simulate**: Run `gh dash` in a repo with open PRs. Resize terminal to ~120x35.
- **Size**: 120x35 terminal, 800px width
- **Placement**: Could be added as a second screenshot below the terminal overview, or inline in What's Included

#### assets/terminal-overview.png (UPDATE)

- **Show**: Updated terminal with new prompt/theme changes visible
- **Simulate**: Open Ghostty, run `ls` in a colorful directory, show starship prompt
- **Size**: matches the existing featured screenshot, 800px width
- **Placement**: Replace existing featured screenshot

### No changes needed

- Setup section, Daily Workflows — still accurate
```

If no changes are needed, report: **"README is up to date — no changes needed."**

**Wait for user confirmation before editing any files.**

### Step 5: Apply (After Confirmation)

Apply only the approved text changes. Before writing, read `references/readme-conventions.md`
for the exact table-row, badge, and screenshot-block patterns. Screenshot descriptions stay
instructions — the user captures the images.

## Guardrails

- **Never edit README.md without user confirmation**
- Only propose What's Included entries for **major tools**, not every utility
- Screenshot descriptions are instructions, not automation — the user captures them
- Keep the README concise — it's an overview, not a manual
- Preserve the existing section order
- Link tool names to their official homepage or GitHub repo
