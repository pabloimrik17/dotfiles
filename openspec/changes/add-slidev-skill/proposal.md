## Why

Slidev publishes an official agent skill (`slidevjs/slidev` via skills.sh) that teaches coding agents its slide syntax, magic-move code highlighting, layouts, transitions, diagrams, and export workflow. Without it, Claude Code must re-derive Slidev's markdown conventions from scratch every session when the user works on decks. This repo already provisions ten global agent skills through `skills.sh`, so the incremental cost of adding Slidev is trivial and aligns with how the rest of the setup treats external skill packages.

Linear: [DOT-2](https://linear.app/monolab/issue/DOT-2/anadir-skills-de-slidev-para-ai-coding-agents).

## What Changes

- Install the `slidev` skill from `slidevjs/slidev` globally for the `claude-code` agent via `skills.sh` during machine setup.
- Add the install step to the existing global-agent-skills group in `run_onchange_install-packages.sh.tmpl`, with idempotent skip when the skill is already present.
- Extend the non-macOS manual-instructions branch with the Slidev install command for parity.
- Do not modify any chezmoi-managed file (the skill symlinks live outside chezmoi's scope).
- Out of scope: OpenCode support. DOT-3 tracks that separately because `skills add -g` on this machine does not currently symlink into OpenCode's skill directories, so OpenCode needs its own decision (agent filter or `.opencode/skills/` vendor).

## Capabilities

### New Capabilities

- `slidev-skill-install`: Provisioning of the Slidev agent skill for Claude Code via `skills.sh` during chezmoi setup, including idempotency, failure handling, and non-macOS manual parity.

### Modified Capabilities

None. The existing `skills-global-install` capability is intentionally untouched — Slidev lives in its own capability so its requirements (e.g., explicit `--agent claude-code` scope, OpenCode-deferred note) do not contaminate the generic ten-skill list.

## Impact

- **Code**: `run_onchange_install-packages.sh.tmpl` — new install invocation inside the existing agent-skills group, plus a line in the non-macOS instructions block.
- **Docs**: `README.md` (evaluated by the `update-readme` skill — tool-level addition to setup) and `docs/manual.html` (evaluated by the `update-manual` skill — CLI config change). Both are proposals to the user, not forced edits.
- **Dependencies**: No new brew/bun packages; relies on the already-required `npx` runner used by `skills.sh`.
- **Machine state**: One new symlink at `~/.claude/skills/slidev → ~/.agents/skills/slidev` on first apply.
