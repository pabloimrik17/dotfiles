# Proposal

## Why

Greptile's official agent skills (`greploop`, `check-pr`, `cli-review`) exist on this machine only because they were installed by hand. A fresh machine gets none of them, and the install script gives Claude Code, OpenCode, Junie, and Codex no shared way to run Greptile PR-review loops.

## What Changes

- Install `greploop`, `check-pr`, and `cli-review` from `greptileai/skills` via the existing `install_skill` helper in the confirmation-gated agent-skills group, targeting `claude-code opencode junie codex`.
- Add the three matching `npx -y skills add …` lines to the non-macOS manual block, in the same order.
- Add the three skills to the skills table in `docs/manual.html`.

Not needed: the Greptile MCP server. Greptile's docs page still lists it as a prerequisite, but the upstream README and `SKILL.md` files only require `git` + `gh` (and the `greptile` CLI for `cli-review`, which installs and authenticates it itself).

Out of scope: pinning the skills to a ref (same as `tuicr`; upstream is unpinned), installing the `greptile` CLI via brew, GitLab/Perforce tooling.

## Capabilities

### New Capabilities

- `greptile-skills-install`: the three `greptileai/skills` agent skills provisioned globally through the agent-skills group (precedent: `tuicr-skill-install`, `gluestack-ui-v5-skill-install`).

### Modified Capabilities

<!-- None: skills-global-install owns the original ten skills; per-vendor capabilities own the rest. -->

## Impact

- `run_onchange_install-packages.sh.tmpl`: three `install_skill` calls and three manual-block lines.
- `docs/manual.html`: three rows in the skills table.
- No config files, no brew packages, no README change (skills are not listed in What's Included). No breaking changes.
