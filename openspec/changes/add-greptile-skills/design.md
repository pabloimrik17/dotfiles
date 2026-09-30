# Design

## Context

See proposal.md — Why. `install_skill` (agent-skills group, Group 9) already takes `<repo> <name> <agents>`, skips on a cached `skills list -g --json` hit with full agent coverage, and routes failures through `run_claude_step`. Upstream `greptileai/skills` has three skills: `greploop`, `check-pr`, `cli-review` (verified against the repo, not the docs page). Locally all three are already installed for Claude Code, Codex, Junie, and OpenCode (plus other agents), so the skip path applies on this machine.

## Goals / Non-Goals

**Goals**: reproducible install of the three skills on every host, same agent set and idempotency as `tuicr`.

**Non-Goals**: pinning to a ref; Greptile MCP; installing the `greptile` CLI (`cli-review` does it on first use); GitLab/Perforce tooling.

## Decisions

### 1. Three `install_skill` calls, not one multi-skill `skills add`

The helper checks and installs per skill, so a partial install reconciles cleanly. The mattpocock line in the manual block is multi-`--skill`, but its `install_skill` calls are still per-skill; the manual block follows that shape only for long lists. Three short lines stay copy-pasteable.

### 2. Explicit agents `claude-code opencode junie codex`

Matches `tuicr` and `gluestack-ui-v5`. Greptile reviews GitHub PRs, which are worked on from every agent here.

### 3. No MCP server

Greptile's docs page lists the MCP server as a prerequisite; the upstream README and `SKILL.md` files (`compatibility: git, gh, Greptile installed on the repo`) do not use it. Adding an MCP would add a global tool surface the skills never call.

### 4. Placement after `tuicr`

Both are review tooling; keeps the vendor-with-agent-list entries together before the mattpocock block.

## Risks / Trade-offs

- [Upstream is unpinned and could change or drop a skill] → Same accepted baseline as every other skill in the group; `skills-update-check` covers drift.
- [`greploop` pushes commits and re-triggers reviews (up to 5 iterations)] → It is user-invoked by name; the install grants no automation.
- [Docs page and repo disagree (2 skills + MCP vs 3 skills, no MCP)] → Repo is the source of truth; recorded in proposal.
