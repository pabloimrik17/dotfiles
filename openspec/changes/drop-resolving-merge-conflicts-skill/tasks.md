## 1. Drop the skill

- [x] 1.1 Remove `resolving-merge-conflicts` from the `install_skill` list and the non-macOS fallback in `run_onchange_install-packages.sh.tmpl`; verify `grep resolving-merge-conflicts` finds nothing there and the fallback lists 23 `--skill` flags.
- [x] 1.2 Update the standalone counts from 24 to 23 in `docs/manual.html` and `.agents/skills/sync-agent-config/parity.md`; verify no other 24-skill reference to the standalone set remains outside `openspec/changes/archive`.

## 2. Validate

- [x] 2.1 Run `openspec validate drop-resolving-merge-conflicts-skill --strict`, `bun test` and `git diff --check`; verify all pass.

## Workflow follow-up

- Archive this change after merge so `openspec/specs/matt-pocock-skills/spec.md` picks up the delta.
