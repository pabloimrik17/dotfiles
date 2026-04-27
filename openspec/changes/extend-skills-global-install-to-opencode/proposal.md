## Why

OpenCode does not see any of the global skills already installed for Claude Code via `skills.sh`, so working with Slidev (or other existing skills) from OpenCode means having no contextual guidance. Task DOT-3 asks to add the official Slidev skills to OpenCode, but the real problem is structural: there is no bridge between `~/.claude/skills/` and `~/.config/opencode/skills/`.

## What Changes

- Add `slidevjs/slidev --skill slidev` to the list of global skills installed by group 9 of `run_onchange_install-packages.sh.tmpl`.
- After every successful `skills add`, create a symlink `~/.config/opencode/skills/<name>/` → `~/.claude/skills/<name>/` so OpenCode loads the same skill.
- Retrofit already-installed skills: the script must be idempotent and create symlinks for skills that already exist in `~/.claude/skills/` from previous runs as well.
- Update the manual (non-macOS) instructions in the same script to reflect the new symlink step.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `skills-global-install`: `slidev` is added to the installed list, and a new requirement is added that mandates symlinking every global skill under `~/.config/opencode/skills/` as well.

## Impact

- **Affected code**: `run_onchange_install-packages.sh.tmpl` (group 9 "Agent skills" + manual instructions section at the end).
- **Systems**: `~/.config/opencode/skills/` now holds symlinks managed by the install script; OpenCode discovers them as user-local skills.
- **Dependencies**: no new ones — only `ln -sf` (coreutils) and `npx`, both already required.
- **Docs**: README.md and `docs/manual.html` may need a brief mention of the new behavior (evaluated in tasks).
- **Risks**: if a user has a real `~/.config/opencode/skills/<name>/` directory with the same name, `ln -sf` would replace it. Mitigation: detect the case and warn instead of overwriting.
