## Context

`install_skill` runs `npx -y skills add mattpocock/skills --skill <name>` for each managed skill that the global registry lacks. `resolving-merge-conflicts` no longer exists upstream, so it is never registered and the add fails on every run of the `run_onchange_` script. The failure is non-fatal, but it is noise on every `chezmoi update`.

## Goals / Non-Goals

**Goals:** stop requesting a skill upstream no longer ships.

**Non-Goals:** replacing it (upstream ships none), or removing stale copies from machines that installed it before 2026-09-24. Such a copy stays in `~/.agents/skills` and `skills update` keeps it as is; `npx skills remove resolving-merge-conflicts -g` clears it.

## Decisions

**D1. Remove, don't pin.** Pinning `mattpocock/skills` to a pre-removal ref would keep an unmaintained skill and break the existing `skills update` path for the other 23. Rejected.

## Risks / Trade-offs

None beyond losing the skill, which upstream already retired.
