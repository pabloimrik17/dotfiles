# Proposal

## Why

The gh-dash PR view still offers four direct Claude launch shortcuts that the user wants removed. Their entries in the manual and OpenSpec requirements would become misleading if only the configuration changed.

## What Changes

- **BREAKING** Remove the custom PR keybindings `i`, `I`, `b`, and `B` from gh-dash. They will no longer launch Claude or create a PR worktree from those keys.
- Remove the four corresponding rows from the gh-dash keybindings table in `docs/manual.html`.
- Update the `gh-dash-keybindings` contract so it no longer requires those shortcuts or their now-unused Worktrunk payload rules. Reconcile the overlapping `add-tuicr` delta before that change is archived.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `gh-dash-keybindings`: remove the four Claude shortcuts and requirements that apply only to their commands; describe the remaining direct/tmux pairs without them.

## Impact

- `dot_config/gh-dash/config.yml`: four entries under `keybindings.prs` and the explanatory comment for their `wt -x` commands.
- `docs/manual.html`: four rows in the gh-dash keybindings table.
- `openspec/specs/gh-dash-keybindings/spec.md` on sync/archive, plus the active `openspec/changes/add-tuicr/specs/gh-dash-keybindings/spec.md` that still names the removed pairs.
