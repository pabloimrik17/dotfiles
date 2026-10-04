## 0. Merge gate

- [ ] 0.1 Before merging, confirm the `stonks` plugin is published: the upstream `add-stonks-plugin` PR in `daily-agentic-task-force` is merged, its first release is cut, and `stonks` is listed in the marketplace. Do not merge this change earlier: the plugin install fails. The siblings `add-plugin-configs` and `add-stonks-tooling` are not required for this change to install, only for `/stonks:sync` to be useful.

## 1. Provision the Claude Code plugin

- [ ] 1.1 In `run_onchange_install-packages.sh.tmpl`, add `stonks@daily-agentic-task-force` to `CC_PLUGINS` after `autonomous@daily-agentic-task-force`. Add `claude plugin marketplace add pabloimrik17/daily-agentic-task-force && claude plugin install stonks@daily-agentic-task-force` to the non-macOS "Claude Code plugins" guidance after the `autonomous` line. Leave `CC_MARKETPLACES` unchanged. Verify: the rendered script (`chezmoi execute-template`) passes `bash -n`, the plugin ID appears exactly twice (array and guidance), and `pabloimrik17/daily-agentic-task-force` still appears exactly once in `CC_MARKETPLACES`.
- [ ] 1.2 In `dot_claude/modify_settings.json.tmpl`, add `"stonks@daily-agentic-task-force": true` to `enabledPlugins` in alphabetical order, and leave `extraKnownMarketplaces` unchanged. Verify: render the modifier. Run it on `{}` and check the output is valid JSON with the entry `true`. Run it on a file with an unrelated key and check that key survives.

## 2. Record scope and user guidance

- [ ] 2.1 In `.agents/skills/sync-agent-config/parity.md`, add `stonks@daily-agentic-task-force` to the Claude Code cell of the Daily Agentic Task Force row. Keep Codex, OpenCode, and Junie as `none`, and make the notes cover all three plugins. Verify: all six cells are populated, and `rg -i stonks` finds no match in `dot_config/opencode`, `dot_junie`, or the install script's `CODEX_*` groups.
- [ ] 2.2 Read `.agents/skills/update-manual/references/html-conventions.md`. Then extend Section 11's Daily Agentic Task Force subsection of `docs/manual.html` with `/stonks:sync [--only sources|watchlist]`, its runtime requirements (the `ibkr` MCP server and `gws`, from the `add-stonks-tooling` change; `~/.config/stonks/config.json`, from `add-plugin-configs`), and a link to the upstream README. The existing marketplace auto-update row covers the plugin. Verify: the subsection renders in Section 11, `/stonks:sync` is not duplicated in the generic plugin slash-command table, `bun run lint:oxfmt` passes, and `README.md` is unchanged.

## 3. Validate the integrated change

- [ ] 3.1 Inspect the final diff. Verify with targeted `rg` checks and `git diff --check`: no new marketplace entry, no version pin, no `update-extra` step, no `gws`, `ibkr`, or `config.json` provisioning, no README change, and no Codex, OpenCode, or Junie config.
- [ ] 3.2 Run `openspec validate add-stonks-plugin --strict`, the CI pin `bunx @fission-ai/openspec@1.2.0 validate --changes`, `bun run lint:oxfmt`, and `bun run lint:fallow`. Fix any failures.
