## Context

The chezmoi-managed Claude Code settings template (`dot_claude/settings.json.tmpl`) enables plugins from the `expo/skills` marketplace. The upstream repo consolidated three individual plugins into one `expo` plugin. The template still references the defunct names, causing triple-loaded skills.

## Goals / Non-Goals

**Goals:**

- Enable the consolidated `expo@expo-plugins` plugin
- Remove the three stale plugin entries that no longer exist upstream

**Non-Goals:**

- Changing any other plugin entries
- Modifying the `expo-plugins` marketplace configuration
- Addressing overlap between `expo@expo-plugins` and `expo-developer@monolab`

## Decisions

### Replace three entries with one consolidated entry

**Decision**: Remove `expo-app-design`, `upgrading-expo`, and `expo-deployment` entries and add `expo` in a single edit.

**Rationale**: The upstream `expo/skills` repo now only ships the `expo` plugin. The three old names resolve from local cache only — they contain the same 11 skills each, causing 33 duplicate skill registrations. Replacing all three with one is a strict improvement: same skills, no duplicates, aligned with upstream.

**Alternative considered**: Add `expo` alongside the existing three (as the issue suggests). Rejected because it would add a fourth copy of the same 11 skills (44 total registrations) with no benefit.

## Risks / Trade-offs

- **[Stale cache]** → If the local cache still has old plugin entries, they will be ignored since the settings file no longer references them. No action needed — cache clears naturally.
- **[Skill name mismatch]** → If the consolidated `expo` plugin changed any skill names, existing references could break. Verified: the 11 skill directories are identical across all four plugin names (confirmed via local cache inspection). Individual SKILL.md frontmatter (descriptions, references) may differ at the plugin level, but the actual skill identifiers and content are the same. No functional risk.
