## 1. Official OpenCode Plugin Registration

- [x] 1.1 Add `superpowers@git+https://github.com/obra/superpowers.git` to `dot_config/opencode/opencode.jsonc` as the final plugin entry, then run `chezmoi cat -S . ~/.config/opencode/opencode.jsonc` and verify the resolved plugin array carries the exact package spec and ordering. `opencode debug config --pure` is not a source-level check: it merges the deployed config and auto-discovers `~/.config/opencode/plugins/`, so it reports entries that are in no source file.
- [x] 1.2 Update Group 7 in `run_onchange_install-packages.sh.tmpl` to describe only Plannotator and remove the Superpowers clone and symlink block; verify Plannotator's official installer remains and searches for the legacy repository URL and three Superpowers target paths return no installer matches.
- [x] 1.3 Remove `opencode-websearch-cited@1.2.0` and its ordering comment from `dot_config/opencode/opencode.jsonc` and its row from the OpenCode Plugins table in `docs/manual.html` (PR review: it interferes with other plugins' auth), leaving the Superpowers git spec as the final plugin entry.
- [x] 1.4 Make Group 7 the single owner of the agent-agnostic Plannotator CLI (OpenCode, Claude Code, Codex): drop the opencode gate and remove Group 8's duplicate CLI install and PLANNOTATOR_PENDING tally.

## 2. Deterministic Legacy Cleanup

- [x] 2.1 Add `.config/opencode/plugins/superpowers.js`, `.config/opencode/skills/superpowers`, and `.config/opencode/superpowers` to `.chezmoiremove`, then run `chezmoi apply --dry-run --verbose --force` (without `--force` it stops at the first removal prompt) and verify those exact targets are scheduled for removal without unrelated OpenCode plugin, skill, or runtime-state deletions.

## 3. Agent Parity and Documentation

- [x] 3.1 Add a complete Superpowers capability row to `.agents/skills/sync-agent-config/parity.md` mapping Claude Code's existing marketplace plugin to OpenCode's git-backed package and recording Junie as `none`; verify no table cell is blank and `git diff -- dot_claude/` is empty.
- [x] 3.2 Add Superpowers and its official git-backed installation behavior to the OpenCode Plugins table in `docs/manual.html`, following the manual's existing row conventions; verify the rendered row names the native skill discovery behavior and `git diff -- README.md` remains empty.
- [x] 3.3 Extend `.agents/skills/sync-agent-config/SKILL.md` and its evals so every parity proposal covers Claude Code, OpenCode, Junie, and Codex, allowing Codex-owned runtime surfaces where no chezmoi file exists; populate the Superpowers marketplace mapping in the six-column `parity.md` table and verify every tool cell is nonblank.
- [x] 3.4 Document Codex's official Superpowers marketplace installation, Codex-owned local state, restart, and fresh-session skill-discovery checks in `docs/manual.html`; verify the rendered content does not claim chezmoi manages Codex plugin state and `git diff -- README.md` remains empty.

## 4. Validation and Runtime Migration

- [x] 4.1 Run `bun run lint:oxfmt` and `git diff --check`, resolving all formatting or whitespace findings.
- [x] 4.2 Run `openspec validate use-official-obra-superpowers-installation --strict` and verify `openspec show use-official-obra-superpowers-installation --json --deltas-only` reports the modified `opencode-user-config` capability with the official plugin and legacy-cleanup requirements.
- [x] 4.3 After this branch merges and `chezmoi update` syncs `~/.local/share/chezmoi` (the source tree apply reads, not this worktree), approve the dry-run and run `chezmoi apply` from an interactive terminal so the three removal prompts can be answered, or pass `--force`; then fully quit and restart OpenCode, verify startup output contains no Superpowers plugin-load errors, confirm the restarted runtime's native `/skill` endpoint lists the Superpowers skills, and verify the three legacy target paths no longer exist.
- [x] 4.4 Run `bun run lint:oxfmt`, `git diff --check`, and strict OpenSpec validation; verify the delta output includes the new `codex-plugins` capability and the modified `sync-agent-config-skill` four-tool parity requirements.

## 5. Official Codex Plugin Activation

- [x] 5.1 With Codex installed, authenticated, and the plugin available to your workspace role, run `codex plugin add superpowers@openai-curated`; fully quit and restart Codex, confirm `codex plugin list --json` reports it installed and enabled, and verify a fresh session discovers and can invoke the bundled `using-superpowers` skill without any chezmoi-managed Codex plugin file or cache edit.

## 6. Automated Codex Plugin Provisioning

- [x] 6.1 Add a `CODEX_PLUGINS` group to `run_onchange_install-packages.sh.tmpl` that installs each entry with `codex plugin add`, detects installed entries from the `installed` array of `codex plugin list --json`, and warns and skips when `codex` or `jq` is missing; verify the rendered template passes `bash -n` and that the already-installed, pending, declined, refused-install, failed-query, disabled-plugin, no-codex, and no-jq paths each behave as specified.
