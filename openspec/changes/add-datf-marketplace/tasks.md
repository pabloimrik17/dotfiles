## 1. Provision the Claude Code plugin

- [x] 1.1 Add `pabloimrik17/daily-agentic-task-force` to `CC_MARKETPLACES`, add `datf-lab@daily-agentic-task-force` to `CC_PLUGINS`, and add the paired command to the non-macOS manual guidance in `run_onchange_install-packages.sh.tmpl`; verify the rendered macOS script passes `bash -n` and static checks find each exact identifier once in its intended install surface.
- [x] 1.2 Add `"datf-lab@daily-agentic-task-force": true` and the `daily-agentic-task-force` GitHub marketplace source with `autoUpdate: true` to the managed document in `dot_claude/modify_settings.json.tmpl`; verify a rendered modifier produces valid JSON containing both values from empty input and preserves an unrelated key from representative existing input.

## 2. Record scope and user guidance

- [x] 2.1 Add a fully populated Daily Agentic Task Force row to `.agents/skills/sync-agent-config/parity.md` with the concrete Claude Code plugin ID and explicit `none` gaps for Codex, OpenCode, and Junie; verify all six table cells are populated and repository searches show no DATF counterpart added to those agents' managed configuration.
- [x] 2.2 Read `.agents/skills/update-manual/references/html-conventions.md`, then update Section 11 of `docs/manual.html` to identify `datf-lab` as a provisional staging plugin, document `/datf-lab:hello`, the `promoting-from-lab` skill, and marketplace auto-update; verify the entries render in the Claude Code section and `bun run lint:oxfmt` passes without changing `README.md`.

## 3. Validate the integrated change

- [x] 3.1 Inspect the final diff to confirm no plugin version pin, `update-extra` step, README change, or Codex/OpenCode/Junie installation was introduced; verify with targeted `rg` checks and `git diff --check`.
- [x] 3.2 Run `openspec validate add-datf-marketplace --strict` and the repository's relevant Bun checks (`bun run lint:oxfmt` and `bun run lint:fallow`), resolving any failures before marking the implementation complete.
