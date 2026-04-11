## Context

The dotfiles repo has two documentation files:

- **docs/manual.html** — 2230-line interactive cheatsheet with 12 collapsible sections, tables of aliases/keybindings/settings, flow blocks, sidebar nav, and live search. Uses specific HTML patterns (details/summary, h3 subsections, code/kbd elements, .flow-only blocks).
- **README.md** — 100-line overview with badges, "What's Included" table (Category | Tool | Description), setup instructions, and daily workflows. One screenshot (terminal-overview.png).

Both drift from reality. An audit found gh-dash, gh-enhance, CodeRabbit CLI, bun/pnpm aliases, advanced eza aliases, and bat aliases all missing from documentation.

The repo already has the OpenSpec skill+command pattern: skills in `.claude/skills/<name>/SKILL.md` for auto-trigger, commands in `.claude/commands/<namespace>/<name>.md` for `/slash` invocation. Content is duplicated between both (with minor differences like slash command references). This is the established pattern in the codebase.

## Goals / Non-Goals

**Goals:**

- Auto-detect when config changes warrant documentation updates
- Propose specific, actionable changes to manual.html and README.md
- Encode knowledge of the manual's HTML structure and conventions so edits are consistent
- Encode knowledge of the README's structure and scope (high-level tool table, not alias-level detail)
- Provide screenshot descriptions (what to show, how to simulate) for README visual documentation
- Follow the propose-then-apply pattern (no edits without user confirmation)

**Non-Goals:**

- Taking or generating screenshots automatically
- Generating new manual sections from scratch without config context
- Updating documentation outside this repo (external wikis, blog posts)
- Auto-committing documentation changes

## Decisions

### 1. Two separate skills, not one unified skill

**Decision**: Separate `update-manual` and `update-readme` skills.

**Rationale**: The files have fundamentally different structures (complex HTML vs concise Markdown), different thresholds for triggering (a new alias triggers manual update but not README), and different output types (HTML table rows vs Markdown table rows + screenshot descriptions). A unified skill would need branching logic that obscures both paths.

**Alternative considered**: Single `update-docs` skill. Rejected because it mixes concerns and makes the description less specific for auto-triggering.

### 2. Duplicate content between skill and command (OpenSpec pattern)

**Decision**: Duplicate the skill prompt in the matching command file, with minor adjustments (slash command references in the command version).

**Rationale**: This is the established pattern in the codebase (all 10 OpenSpec skills do this). Using `@` file references in commands to point to SKILL.md would be cleaner but is unproven in this repo. Consistency with existing patterns reduces cognitive overhead.

**Alternative considered**: Command as thin wrapper with `@.claude/skills/update-manual/SKILL.md`. Could work but deviates from codebase conventions.

### 3. Config-to-section mapping embedded in skill content

**Decision**: The skill contains a static mapping of config files to manual.html sections (e.g., `dot_config/ghostty/config` → Section 1: Terminal).

**Rationale**: The manual has a stable 12-section structure that changes rarely. Embedding the mapping in the skill content means Claude can immediately identify which sections to check without scanning the entire HTML file every time. The mapping is small (~15 entries) and easy to maintain.

**Alternative considered**: Dynamic section discovery by parsing the HTML. Rejected as over-engineered — the section structure is stable and rarely changes.

### 4. Different activation thresholds for manual vs README

**Decision**: The manual skill triggers on any config file change (aliases, keybindings, settings). The README skill triggers only on tool-level changes (new tool added/removed, setup process changed, significant visual changes).

**Rationale**: The manual is comprehensive (every alias gets a row). The README is high-level (only major tools get a table entry). A new bun alias belongs in the manual but not in the README.

### 5. Propose-then-apply workflow

**Decision**: Both skills present proposed changes in a structured format and wait for user confirmation before editing any files.

**Rationale**: Documentation edits are visible and sometimes opinionated (e.g., whether a tool deserves a README entry). The user should review before changes land. This matches how the user confirmed they want it during exploration.

## Risks / Trade-offs

- **[Duplication maintenance]** Skill and command content will diverge over time as one gets updated but not the other → Mitigation: keep them identical except for slash command references; when editing one, always update both.
- **[Stale config mapping]** If manual sections are reorganized, the embedded mapping becomes wrong → Mitigation: the mapping is small and explicit; easy to spot and update. Manual restructuring is rare.
- **[Description specificity]** If the skill description is too broad, it triggers on irrelevant changes → Mitigation: description lists specific config file patterns and tool names as trigger keywords.
- **[HTML editing complexity]** Proposing HTML edits requires understanding the manual's specific patterns → Mitigation: the skill encodes the exact HTML patterns (table structure, code/kbd usage, flow blocks) as reference for Claude.
