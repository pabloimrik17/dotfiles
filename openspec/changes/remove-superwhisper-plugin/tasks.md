# Tasks

Load `experiments:writing-comments` before writing or editing any code comment (AGENTS.md).

## 1. Stop provisioning the Claude Code plugin

- [x] 1.1 In `dot_claude/modify_settings.json.tmpl`, remove the arm64-guarded `superwhisper@superwhisper` line from `enabledPlugins` and the arm64-guarded `superwhisper` block from `extraKnownMarketplaces`. Verify: render with `chezmoi execute-template` for `darwin/arm64` and for `darwin/amd64`, run each render with `{}` on stdin, and check that both outputs parse with `jq` and neither contains `superwhisper`.
- [x] 1.2 In the same file, drop the guarded superwhisper pair from `REMOVE`, leaving only `("hooks", "PreCompact")`. Rewrite the comment, which still calls the remaining entries host-conditional. Verify: feed a live file holding both superwhisper keys to the `darwin/amd64` render and check that the output keeps them as foreign keys (the CLI cleanup removes them now). `bun test tests/claude-settings-hooks.test.ts tests/knowledge-base-settings.test.ts` passes.
- [x] 1.3 In `run_onchange_install-packages.sh.tmpl`, delete Group 8.25, the SuperWhisper Claude Code plugin step, together with its `{{ if … arm64 }}` guard. Verify: the `darwin/arm64` render passes `bash -n` and has no `superwhisper.com`. The `"superwhisper|superwhisper|AI|…"` cask line is still there. `bun test tests/install-script.test.ts tests/codex-plugins.test.ts` passes.

## 2. One-shot cleanup script

- [x] 2.1 Write `tests/agent-plugin-retirement.test.ts`, following `tests/codex-plugins.test.ts`. It renders the script for `darwin` and runs it with fake `claude`, `codex` and `opencode` on `PATH`. The fakes keep state in a temp dir and log calls. Cover every `agent-plugin-retirement` scenario:
  - plugin and marketplace present, per agent
  - Claude marketplace only
  - nothing present
  - no CLI on `PATH`, which must exit 0
  - stdin `/dev/null` with no prompt
  - a failing removal while the other agents still run, exiting non-zero and naming the agent
  - an unreadable Codex listing
  - a plugin still listed after removal
  - a Linux render that is empty

  Verify: the suite fails because the script does not exist yet.
- [x] 2.2 Create `run_once_after_remove-superwhisper-agent-plugins.sh.tmpl` per design decisions 2 and 4–6:
  - the whole script inside `{{ if eq .chezmoi.os "darwin" }}`
  - a block per agent that checks plugin and marketplace separately
  - a re-check after each removal
  - no `confirm`
  - a combined exit status that names the agents that failed

  Verify: `bun test tests/agent-plugin-retirement.test.ts` passes, and the `darwin` render passes `bash -n` and `shellcheck` if it is installed.
- [x] 2.3 Verify order and once-only behaviour from the worktree source. `chezmoi --source . managed --include scripts` lists the new script. Its target name `remove-superwhisper-agent-plugins.sh` sorts after `claude-swap-setup.sh`. `chezmoi --source . execute-template --override-data '{"chezmoi":{"os":"linux"}}'` renders it empty.
- [x] 2.4 Run the `darwin` render once against the real CLIs on this Intel Mac, where nothing is installed. Verify: it exits 0, runs no `uninstall`, `remove` or `marketplace remove`, and so confirms the real `--json` shapes match the parsing. Then confirm `~/.claude/settings.json`, `~/.codex/config.toml` and `~/.config/opencode/opencode.jsonc` are byte-identical to before (`shasum` before and after).

## 3. Docs and integration

- [x] 3.1 Run the `update-manual` and `update-readme` checks for this change. Verify: neither `docs/manual.html` nor `README.md` describes the SuperWhisper plugin. Apply any update the checks propose, otherwise record "no doc change" in the PR description.
- [x] 3.2 Run `grep -rIil superwhisper . --exclude-dir=.git --exclude-dir=node_modules`, excluding `openspec/changes/archive/` and `openspec/explorations/`. Verify: it matches only the cask line in `run_onchange_install-packages.sh.tmpl`, `openspec/specs/gui-app-install/spec.md`, `openspec/specs/claude-code-plugins/spec.md` (until archive), the new script, its test, and this change.
- [x] 3.3 Run `bun test`, `bun run lint:oxfmt` and `openspec validate remove-superwhisper-plugin --strict`. Verify: all three exit 0.

## Workflow follow-up

- After merge, run `chezmoi update` on the Apple Silicon Mac. Check that `claude plugin list --json`, `claude plugin marketplace list --json`, `codex plugin list --json`, `codex plugin marketplace list --json` and `~/.config/opencode/opencode.json*` show no superwhisper. Restart open agent sessions.
- Archive the change. Archive moves the agent-plugin-retirement spec into `openspec/specs/` and removes the three requirements from `claude-code-plugins`.
- Later, once every Mac has run the cleanup, a separate change can delete the `run_once_` script and its test.
