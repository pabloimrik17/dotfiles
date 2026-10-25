## Context

See proposal.md for the motivation. Review explicitly selected repository `AGENTS.md` after rejecting a global Claude instruction source and a parity entry. The existing agent-instructions specification still describes preservation of the standalone Bun sentence removed in review.

## Goals / Non-Goals

**Goals:** Keep the trigger in the canonical repository body and reconcile the delta specification with the reviewed content.

**Non-Goals:** Install skills in other agents, change package-manager configuration, or deploy user-scope instructions.

## Decisions

- Use root `AGENTS.md` directly. A global `dot_claude/CLAUDE.md` or compatibility forwarding file would violate the requested repository scope.
- Keep one exact sentence naming the skill. Copying its policy would create a second maintenance location.
- Remove only the reviewed Bun sentence; retain the existing command table. Removing the table or changing package scripts would exceed the review.
- Record the completed implementation retrospectively, with checked tasks supported by local validation.

## Risks / Trade-offs

- [Other agents may lack the namespaced skill] → Keep availability installation outside this change; Claude has the installed and enabled experiments plugin.
- [Repository scope does not affect other projects] → This is the explicitly reviewed scope; no host application is required.

## Migration Plan

Merge the repository instruction edit through the PR. No chezmoi apply is needed. Revert the commit to restore the previous repository body.
