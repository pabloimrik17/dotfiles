# Design

## Context

See `proposal.md` for motivation and `specs/gh-dash-keybindings/spec.md` for the behavior change. The four shortcuts live together under `keybindings.prs` in `dot_config/gh-dash/config.yml`. The main `gh-dash-keybindings` spec requires them, and the in-progress `add-tuicr` delta names them in its lowercase/uppercase scenario. The manual has one row per shortcut.

## Goals / Non-Goals

**Goals:** Keep the gh-dash config, user-facing shortcut table, and overlapping OpenSpec text consistent when the four entries disappear.

**Non-Goals:** Change `f`/`F` AoE integration, `z`/`Z` tuicr review, `t`/`T` CI checks, or the external Worktrunk and Claude tools.

## Decisions

- Delete the four complete `prs` keybinding entries and the comment explaining their `wt -x` syntax. Leaving disabled entries would still surface confusing shortcuts in the config and help menu.
- Remove exactly the four matching manual table rows. The other gh-dash shortcut descriptions remain valid.
- Express the behavior change as a `gh-dash-keybindings` delta: explicitly prohibit the four custom keys, remove their six now-obsolete requirements, and update the remaining direct/tmux pattern. The active `add-tuicr` delta must also drop `b`/`B` and `i`/`I` from its pattern scenario before it is archived; otherwise it could restore a conflicting contract. Its historical proposal and design can remain historical context.

## Risks / Trade-offs

- [The four shortcuts disappear from gh-dash help] → Confirm the remaining shortcuts still appear with their labels and that no removed entry remains in `keybindings.prs`.
- [The active `add-tuicr` change could reintroduce outdated spec text] → Update its overlapping scenario during implementation and validate both changes.

## Migration Plan

Apply the config, manual, and active-delta edits together. Validate the new OpenSpec change and compare the configured keys with the manual table. Chezmoi can then deploy the updated gh-dash config as usual. Rollback is a revert of this change's config and documentation edits.
