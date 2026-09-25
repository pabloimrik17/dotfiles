## 1. Provision the Claude Code plugin

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl`, add `autonomous@daily-agentic-task-force` to `CC_PLUGINS` after `datf-lab@daily-agentic-task-force`. Add `claude plugin marketplace add pabloimrik17/daily-agentic-task-force && claude plugin install autonomous@daily-agentic-task-force` to the non-macOS "Claude Code plugins" guidance after the `datf-lab` line. Leave `CC_MARKETPLACES` unchanged. Verify: the rendered script (`chezmoi execute-template`) passes `bash -n`, the plugin ID appears exactly twice (array and guidance), and `pabloimrik17/daily-agentic-task-force` still appears exactly once in `CC_MARKETPLACES`.
- [x] 1.2 In `dot_claude/modify_settings.json.tmpl`, add `"autonomous@daily-agentic-task-force": true` to `enabledPlugins` in alphabetical order, and leave `extraKnownMarketplaces` unchanged. Verify: render the modifier. Run it on `{}` and check the output is valid JSON with the entry `true`. Run it on a file with an unrelated key and check that key survives.

## 2. Record scope and user guidance

- [x] 2.1 In `.agents/skills/sync-agent-config/parity.md`, add `autonomous@daily-agentic-task-force` to the Claude Code cell of the Daily Agentic Task Force row. Keep Codex, OpenCode, and Junie as `none`, and make the notes cover both plugins. Verify: all six cells are populated, and `rg -i autonomous` finds no match in `dot_config/opencode`, `dot_junie`, or the install script's `CODEX_*` groups.
- [x] 2.2 Read `.agents/skills/update-manual/references/html-conventions.md`. Then turn Section 11's "Daily Agentic Task Force lab" subsection of `docs/manual.html` into a DATF subsection. It keeps the `datf-lab` rows and adds: `/autonomous:run [--account <provider-key>] [--force] [--json]`, exit codes (0 advance, 2 wait, 3 not evaluable, 1 usage/runner error), requirements (`bun`; the `openusage` CLI on `PATH`, installed manually; without it the gate reports `not-evaluable`), the provisional-contract note, a link to the upstream README, and one marketplace auto-update row for both plugins. Verify: the subsection renders in Section 11, `/autonomous:run` is not duplicated in the generic plugin slash-command table, `bun run lint:oxfmt` passes, and `README.md` is unchanged.

## 3. Validate the integrated change

- [x] 3.1 Inspect the final diff. Verify with targeted `rg` checks and `git diff --check`: no new marketplace entry, no version pin, no `update-extra` step, no `openusage` cask or `PATH` entry, no README change, and no Codex, OpenCode, or Junie config.
- [x] 3.2 Run `openspec validate add-autonomous-plugin --strict`, the CI pin `bunx @fission-ai/openspec@1.2.0 validate --changes`, `bun run lint:oxfmt`, and `bun run lint:fallow`. Fix any failures.
