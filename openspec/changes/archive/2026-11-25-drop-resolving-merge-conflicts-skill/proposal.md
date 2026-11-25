## Why

`chezmoi update` prints `[SKILLS_NO_MATCHING_SKILLS] No matching skills found for: resolving-merge-conflicts`. Upstream `mattpocock/skills` removed that skill on 2026-09-24 (commit `daa01d8`, v1.3.0) and archived it with no replacement, but the installer still asks for it on every run.

## What Changes

- Drop `resolving-merge-conflicts` from the managed `mattpocock/skills` standalone set for OpenCode and Junie (24 → 23 skills).
- Drop it from the non-macOS fallback `skills add` command.
- Update the manual's skill counts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `matt-pocock-skills`: the managed selection and the fallback command list 23 skills, without `resolving-merge-conflicts`.

## Impact

`run_onchange_install-packages.sh.tmpl`, `docs/manual.html` and the `matt-pocock-skills` spec. No dependency or Claude Code plugin change: the `mattpocock-skills@mattpocock` plugin already dropped the skill upstream. Beads: `agentic-task-nu9n`.
