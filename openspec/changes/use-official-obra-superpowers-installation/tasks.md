## 1. Official OpenCode Plugin Registration

- [x] 1.1 Add `superpowers@git+https://github.com/obra/superpowers.git` to `dot_config/opencode/opencode.jsonc` immediately before the final websearch-cited plugin, then run `OPENCODE_CONFIG="$PWD/dot_config/opencode/opencode.jsonc" opencode debug config --pure` and verify the config resolves with the exact package spec and ordering.
- [x] 1.2 Update Group 7 in `run_onchange_install-packages.sh.tmpl` to describe only Plannotator and remove the Superpowers clone and symlink block; verify Plannotator's official installer remains and searches for the legacy repository URL and three Superpowers target paths return no installer matches.

## 2. Deterministic Legacy Cleanup

- [x] 2.1 Add `.config/opencode/plugins/superpowers.js`, `.config/opencode/skills/superpowers`, and `.config/opencode/superpowers` to `.chezmoiremove`, then run `chezmoi apply --dry-run --verbose` and verify those exact targets are scheduled for removal without unrelated OpenCode plugin, skill, or runtime-state deletions.

## 3. Agent Parity and Documentation

- [x] 3.1 Add a complete Superpowers capability row to `.agents/skills/sync-agent-config/parity.md` mapping Claude Code's existing marketplace plugin to OpenCode's git-backed package and recording Junie as `none`; verify no table cell is blank and `git diff -- dot_claude/` is empty.
- [x] 3.2 Add Superpowers and its official git-backed installation behavior to the OpenCode Plugins table in `docs/manual.html`, following the manual's existing row conventions; verify the rendered row names the native skill discovery behavior and `git diff -- README.md` remains empty.
- [x] 3.3 Extend `.agents/skills/sync-agent-config/SKILL.md` and its evals so every parity proposal covers Claude Code, OpenCode, Junie, and Codex, allowing Codex-owned runtime surfaces where no chezmoi file exists; populate the Superpowers marketplace mapping in the six-column `parity.md` table and verify every tool cell is nonblank.
- [x] 3.4 Document Codex's official Superpowers marketplace installation, Codex-owned local state, restart, and fresh-session skill-discovery checks in `docs/manual.html`; verify the rendered content does not claim chezmoi manages Codex plugin state and `git diff -- README.md` remains empty.

## 4. Validation and Runtime Migration

- [x] 4.1 Run `bun run lint:oxfmt` and `git diff --check`, resolving all formatting or whitespace findings.
- [x] 4.2 Run `openspec validate use-official-obra-superpowers-installation --strict` and verify `openspec show use-official-obra-superpowers-installation --json --deltas-only` reports the modified `opencode-user-config` capability with the official plugin and legacy-cleanup requirements.
- [x] 4.3 After approving the dry-run, run `chezmoi apply`, fully quit and restart OpenCode, verify startup output contains no Superpowers plugin-load errors, confirm the restarted runtime's native `/skill` endpoint lists the Superpowers skills, and verify the three legacy target paths no longer exist.
- [x] 4.4 Run `bun run lint:oxfmt`, `git diff --check`, and strict OpenSpec validation; verify the delta output includes the new `codex-plugins` capability and the modified `sync-agent-config-skill` four-tool parity requirements.

## 5. Official Codex Plugin Activation

- [x] 5.1 With Codex installed and authenticated, run `codex plugin add superpowers@openai-curated`; fully quit and restart Codex, confirm `codex plugin list --json` reports it installed and enabled, and verify a fresh session discovers and can invoke the bundled `using-superpowers` skill without any chezmoi-managed Codex plugin file or cache edit.
