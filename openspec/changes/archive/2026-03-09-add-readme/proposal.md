## Why

Repo has no README. New users (or future self on a new machine) have no onboarding guide, no visual overview of what's managed, and no reference for daily chezmoi workflows.

## What Changes

- Add `README.md` with shield-wall badges, hero screenshot, intro, setup guide, and daily workflow sections
- Add `assets/` directory for terminal screenshots
- Update `.chezmoiignore.tmpl` to exclude `assets/`

## Capabilities

### New Capabilities

- `readme-content`: README structure, badges, intro, tool overview, setup guide, and chezmoi workflow documentation
- `readme-assets`: Screenshot conventions, naming, placement, and chezmoiignore integration

### Modified Capabilities

_(none)_

## Impact

- New files: `README.md`, `assets/terminal-overview.png` (manual)
- Modified: `.chezmoiignore.tmpl` (add `assets/`)
- No code changes, no runtime impact
