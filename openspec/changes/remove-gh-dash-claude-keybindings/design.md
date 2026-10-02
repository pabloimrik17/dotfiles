# Design

## Context

See `proposal.md` for motivation and `specs/gh-dash-keybindings/spec.md` for the behavior change. The four shortcuts live together under `keybindings.prs` in `dot_config/gh-dash/config.yml`. The main `gh-dash-keybindings` spec requires them, including the overlapping lowercase/uppercase scenario from the already archived `2026-09-30-add-tuicr` change. The sibling `gh-dash-config` spec also has a stale requirement for a custom `C` shortcut launching Claude review, although no such binding exists in the configuration. The manual has one row per shortcut.

## Goals / Non-Goals

**Goals:** Keep the gh-dash config, user-facing shortcut table, and overlapping OpenSpec text consistent when the four entries disappear.

**Non-Goals:** Change `f`/`F` AoE integration, `z`/`Z` tuicr review, `t`/`T` CI checks, or the external Worktrunk and Claude tools.

## Decisions

- Delete the four complete `prs` keybinding entries and the comment explaining their `wt -x` syntax. Leaving disabled entries would still surface confusing shortcuts in the config and help menu.
- Remove exactly the four matching manual table rows. The other gh-dash shortcut descriptions remain valid.
- Express the behavior change as a `gh-dash-keybindings` delta: prohibit the four keys from launching Claude or switching to a PR worktree, remove their six now-obsolete requirements, and update the remaining direct/tmux pattern. The scenario uses the same scope as the requirement, allowing unrelated future uses of those keys. The delta updates the overlapping main-spec scenario when synced or archived; the archived `2026-09-30-add-tuicr` artifacts remain historical context.
- Remove the stale `Claude Code review keybinding` requirement through a `gh-dash-config` delta so neither capability requires a custom shortcut that directly launches Claude.

## Risks / Trade-offs

- [The four shortcuts disappear from gh-dash help] → Confirm the remaining shortcuts still appear with their labels and that no removed entry remains in `keybindings.prs`.
- [The main specs still require retired Claude shortcuts until sync/archive] → Include removal deltas for both affected capabilities and validate the removal change; preserve the archived `add-tuicr` artifacts as history.

## Migration Plan

Apply the config, manual, and removal-delta edits together. Sync or archive this change to update both main specs. Validate the new OpenSpec change and compare the configured keys with the manual table. Chezmoi can then deploy the updated gh-dash config as usual. Rollback is a revert of this change's config and documentation edits.
