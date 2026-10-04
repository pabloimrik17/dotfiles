# Tasks

## 1. Provision the Claude Code plugin

- [x] 1.1 In `run_onchange_install-packages.sh.tmpl`, add `prompt-presets@monolab` to `CC_PLUGINS` after `experiments@monolab`. Add `claude plugin marketplace add pabloimrik17/monolab && claude plugin install prompt-presets@monolab` to the non-macOS "Claude Code plugins" guidance. Leave `CC_MARKETPLACES` unchanged. Verify: the rendered script (`chezmoi execute-template`) passes `bash -n`; the plugin ID appears exactly twice (array and guidance); `pabloimrik17/monolab` appears exactly once in `CC_MARKETPLACES`.
- [x] 1.2 In `dot_claude/modify_settings.json.tmpl`, add `"prompt-presets@monolab": true` to `enabledPlugins` between `posthog@claude-plugins-official` and `sentry-mcp@sentry-mcp`. Leave `extraKnownMarketplaces` unchanged. Verify: render the modifier, run it on `{}`, and check the output is valid JSON with the entry `true`. Run it on a file with an unrelated key and check that key survives. Check `extraKnownMarketplaces.monolab.source` has no `ref`.

## 2. Record scope and user guidance

- [x] 2.1 In `.agents/skills/sync-agent-config/parity.md`, add a `Prompt presets` row: `prompt-presets@monolab` under Claude Code; `none` for Codex, OpenCode and Junie; notes: monolab publishes it only through the Claude marketplace (design D5). Verify: all six cells are populated, and `rg prompt-presets` finds no match in `dot_config/opencode`, `dot_junie`, or the install script's `CODEX_*` groups.
- [x] 2.2 Read `.agents/skills/update-manual/references/html-conventions.md`, then add a `/prompt-presets:matt-retro` row to the "Slash commands (from plugins)" table in `docs/manual.html`: Matt Pocock's retro prompt, run verbatim; needs his `retro` skill (from `mattpocock-skills`). Verify: the row renders, `bun run lint:oxfmt` passes, and `README.md` is unchanged.

## 3. Validate the integrated change

- [x] 3.1 Inspect the final diff with targeted `rg` checks and `git diff --check`. Confirm none of these were added: a monolab marketplace entry or `ref`, a version pin, an `update-extra` step, a skills.sh `retro` install for `claude-code`, a README change, or any Codex, OpenCode or Junie config.
- [x] 3.2 Run `openspec validate add-prompt-presets-plugin --strict`, the CI pin `bunx @fission-ai/openspec@1.2.0 validate --changes --no-interactive`, `bun run lint:oxfmt`, and `bun run lint:fallow`. Fix any failures.
- [x] 3.3 On this machine, run `claude plugin install prompt-presets@monolab` (or apply the install script), then confirm `claude plugin list --json` lists `prompt-presets@monolab` and a new session offers `/prompt-presets:matt-retro`.

## 4. Move Matt Pocock's plugin to his marketplace

- [x] 4.1 In `run_onchange_install-packages.sh.tmpl`, add `mattpocock/skills` to `CC_MARKETPLACES`, replace `mattpocock-skills@claude-plugins-official` with `mattpocock-skills@mattpocock` in `CC_PLUGINS`, and change its non-macOS guidance line to `claude plugin marketplace add mattpocock/skills && claude plugin install mattpocock-skills@mattpocock`. Verify: darwin and linux renders pass `bash -n`; `mattpocock/skills` appears once in `CC_MARKETPLACES`; the old ID no longer appears.
- [x] 4.2 In `dot_claude/modify_settings.json.tmpl`, swap the `enabledPlugins` key to `"mattpocock-skills@mattpocock": true`, add `extraKnownMarketplaces.mattpocock` (`github` source `mattpocock/skills`, `autoUpdate: true`, no `ref`), and add `("enabledPlugins", "mattpocock-skills@claude-plugins-official")` to `REMOVE`. Verify: run the rendered modifier on `{}` and on a file holding the old key `true` plus an unrelated key; the output enables the new ID, drops the old key and keeps the unrelated key.
- [x] 4.3 Update the `Matt Pocock skills` row in `.agents/skills/sync-agent-config/parity.md` and the Claude Code row of the manual's Matt Pocock skills table: `mattpocock-skills@mattpocock`, 27 skills (11 model-invocable, 16 command-only), updated by the `mattpocock` marketplace. Verify: `bun run lint:oxfmt` passes.
- [x] 4.4 Run `openspec validate add-prompt-presets-plugin --strict`, the CI pin `bunx @fission-ai/openspec@1.2.0 validate --changes --no-interactive`, `bun run lint:oxfmt` and `bun run lint:fallow`; `rg mattpocock-skills@claude-plugins-official` matches only the `REMOVE` entry and OpenSpec files.
- [x] 4.5 On this machine, install `mattpocock-skills@mattpocock` (uninstall the official copy first if the install conflicts), disable the official copy, and confirm a new session lists `mattpocock-skills:retro` once.
