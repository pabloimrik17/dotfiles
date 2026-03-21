## Context

The chezmoi-managed `dot_claude/settings.json.tmpl` currently defines `enabledPlugins` (24 plugins), `extraKnownMarketplaces` (9 marketplaces), and other settings — but no `hooks` key. Three locally-installed configurations are missing from the template: the beads plugin/marketplace, the code-simplifier plugin, and the `bd prime` lifecycle hooks.

The template is static JSON with chezmoi Go template expressions only for `statusLine`. All additions in this change are plain JSON — no template logic needed.

## Goals / Non-Goals

**Goals:**

- Ensure fresh machines get beads and code-simplifier plugins configured
- Ensure fresh machines get the beads marketplace registered
- Ensure fresh machines get `bd prime` hooks for PreCompact and SessionStart
- Keep the template valid JSON after all additions

**Non-Goals:**

- Installing beads or code-simplifier plugin code (marketplace auto-update handles this)
- Adding conditional logic (e.g., platform-specific hooks)
- Modifying any existing settings entries

## Decisions

### 1. Single-file, additive-only edits

All three issues modify `dot_claude/settings.json.tmpl`. Changes are insertions only — no existing lines are modified or removed. This minimizes merge risk and keeps the diff reviewable.

**Alternative**: Separate PRs per issue. Rejected because the changes are small, non-conflicting, and logically cohesive (all "sync template with local state").

### 2. Global matcher for hooks

The `bd prime` hooks use an empty matcher (`""`) which means they run on every session/compaction regardless of project. This is intentional — `bd prime` detects `.beads/` presence and no-ops otherwise, making it safe to run globally with negligible overhead.

**Alternative**: Scoped matcher (e.g., only projects with `.beads/`). Rejected because `bd prime` already handles this detection internally, and a matcher would require maintaining a list of beads-enabled repos.

### 3. Plugin entries at the end of their respective objects

New entries are appended to the end of `enabledPlugins` and `extraKnownMarketplaces` to produce a clean diff. The `hooks` key is added after `effortLevel` as a new top-level key.

## Risks / Trade-offs

- **`bd` not installed** → Hooks will error on machines without the beads CLI. Mitigation: `bd` is added to the brew packages list in `run_once_install-packages.sh.tmpl` so it's installed alongside other CLI tools.
- **JSON validity** → Adding entries requires correct comma placement in the template. Mitigation: verification step confirms valid JSON output after `chezmoi apply`.
