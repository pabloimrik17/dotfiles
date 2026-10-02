# Tasks

## 1. gh-dash shortcuts and manual

- [x] 1.1 Remove the `b`, `B`, `i`, and `I` entries and the obsolete `wt -x` comment from `dot_config/gh-dash/config.yml`; verify none of those four keys appears under `keybindings.prs` and the remaining entries still parse as YAML.
- [x] 1.2 Remove the four matching rows from the `gh-dash keybindings` table in `docs/manual.html`; verify the table still lists `L`, `t`/`T`, `z`/`Z`, and `f`/`F` and no longer lists the removed keys.

## 2. Specification consistency

- [x] 2.1 Update the overlapping lowercase/uppercase scenario in `openspec/changes/add-tuicr/specs/gh-dash-keybindings/spec.md` so it names only the remaining interactive pairs; verify the active delta has no `b`/`B` or `i`/`I` shortcut requirement.
- [x] 2.2 Validate `remove-gh-dash-claude-keybindings` and `add-tuicr` with `openspec validate`, then compare the new delta, gh-dash config, and manual to verify they agree on the available custom PR keys.

## Integration note

Tasks 2.1 and 2.2 were completed and both changes validated before updating the branch from `main`. Upstream has since archived `add-tuicr` as `2026-09-30-add-tuicr`; its archived delta remains historical context. The removal delta now updates the overlapping requirement in the main spec when synced or archived. Only `remove-gh-dash-claude-keybindings` remains available for active-change validation.
