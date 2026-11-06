## Context

See `proposal.md` for motivation. This is a retrospective record of the completed `WebstormProjects-bts` implementation. The installed binary reports `version dev` and module `v4.26.2`; upstream key tables at that tag, not older task notes, establish the available keys. The main capability specs have already been updated in the same worktree, so the deltas preserve their current requirement names and full scenario blocks.

## Goals / Non-Goals

**Goals:** Preserve command payloads and the lowercase/direct, uppercase/tmux convention while restoring built-in actions in every applicable view.

**Non-Goals:** Changing command execution, installing tools, applying dotfiles to the host, or claiming that static validation exercises terminal interactions.

## Decisions

- Use `i`/`I` for CI and universal `J` for lazygit. They are free in the relevant v4.26.2 universal, PR, issue, branch, and notification tables. The retired Claude shortcuts make `i`/`I` available. Keeping `T` while moving only `t` would break the paired-key convention; intentional shadowing would violate the no-collision requirement.
- Reserve `n` and `x` as section-mode second strokes. In v4.26.2 `ui.go`, custom commands dispatch before section mode, so a key absent from the immediate PR bindings is not necessarily safe.
- Preserve all seven custom names and command strings exactly. Validate YAML, duplicate keys, contextual built-in collisions, rendered shell syntax, and nested tmux payload syntax without launching their commands.
- Keep the manual and both capability specs aligned. Remove the stale assertion that `z`/`Z` is the only available lowercase/uppercase pair.

## Risks / Trade-offs

- Changed muscle memory → Document `J`, `i`, and `I` beside the restored built-in `t` and `L` actions.
- Future gh-dash versions may assign these keys → Retain version-pinned evidence in the keybinding spec and recheck on upgrades.
- Static checks cannot establish actual TUI suspension/resumption → Explicitly report interactive checks as pending.
- Beads data publication timed out after five minutes → Preserve local task data and distinguish repository publication from tracker publication.

## Migration Plan

The user can load the worktree config with `gh dash --config "$PWD/dot_config/gh-dash/config.yml"` without applying other dotfiles. Interactive verification remains pending: inspect `?`, exercise `J`/`i`/`I`, return to the dashboard, and check built-in `t`/`L` and `Ctrl+s n/x`. Rollback consists of reverting the configuration and matching docs, with the understanding that this restores the old collisions. No host deployment has been performed.
