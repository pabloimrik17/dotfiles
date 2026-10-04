# Tasks

## 1. Provision the Claude Code plugin

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl`, add `prompt-presets@monolab` to `CC_PLUGINS` after `experiments@monolab`. Add `claude plugin marketplace add pabloimrik17/monolab && claude plugin install prompt-presets@monolab` to the non-macOS "Claude Code plugins" guidance. Leave `CC_MARKETPLACES` unchanged. Verify: the rendered script (`chezmoi execute-template`) passes `bash -n`; the plugin ID appears exactly twice (array and guidance); `pabloimrik17/monolab` appears exactly once in `CC_MARKETPLACES`.
- [x] 1.2 In `dot_claude/modify_settings.json.tmpl`, add `"prompt-presets@monolab": true` to `enabledPlugins` between `posthog@claude-plugins-official` and `sentry-mcp@sentry-mcp`. Leave `extraKnownMarketplaces` unchanged. Verify: render the modifier, run it on `{}`, and check the output is valid JSON with the entry `true`. Run it on a file with an unrelated key and check that key survives. Check `extraKnownMarketplaces.monolab.source` has no `ref`.

## 2. Record scope and user guidance

- [x] 2.1 In `.agents/skills/sync-agent-config/parity.md`, add a `Prompt presets` row: `prompt-presets@monolab` under Claude Code; `none` for Codex, OpenCode and Junie; notes: monolab publishes it only through the Claude marketplace (design D5). Verify: all six cells are populated, and `rg prompt-presets` finds no match in `dot_config/opencode`, `dot_junie`, or the install script's `CODEX_*` groups.
- [x] 2.2 Read `.agents/skills/update-manual/references/html-conventions.md`, then add a `/prompt-presets:matt-retro` row to the "Slash commands (from plugins)" table in `docs/manual.html`: Matt Pocock's retro prompt, run verbatim; needs his `retro` skill (from `mattpocock-skills`). Verify: the row renders, `bun run lint:oxfmt` passes, and `README.md` is unchanged.

## 3. Validate the integrated change

- [x] 3.1 Inspect the final diff with targeted `rg` checks and `git diff --check`. Confirm none of these were added: a marketplace entry or `ref`, a version pin, an `update-extra` step, a skills.sh `retro` install for `claude-code`, a README change, or any Codex, OpenCode or Junie config.
- [x] 3.2 Run `openspec validate add-prompt-presets-plugin --strict`, the CI pin `bunx @fission-ai/openspec@1.2.0 validate --changes --no-interactive`, `bun run lint:oxfmt`, and `bun run lint:fallow`. Fix any failures.
- [x] 3.3 On this machine, run `claude plugin install prompt-presets@monolab` (or apply the install script), then confirm `claude plugin list --json` lists `prompt-presets@monolab` and a new session offers `/prompt-presets:matt-retro`.
