# Implementation evidence

## Instruction inventory (2026-10-14)

- Tracked instruction sources: root `AGENTS.md` and `CLAUDE.md` only; their bodies were byte-identical before migration. `AGENTS.md` retains the full Bun policy and command table; `CLAUDE.md` now imports it.
- `chezmoi managed --source-path .` contains no user `CLAUDE.md` or `AGENTS.md`. Both root files remain excluded by `.chezmoiignore.tmpl`. User-scope migration is a no-op.
- No live `~/.claude/CLAUDE.md` exists. Existing unmanaged Codex and Claude Inbox notes were left untouched. Both SHA-256 hashes before implementation: `6a60f36271f5336efb9638ba83b19eae2dd17e96e5d3c95c37c25ef1c50c01e4`.
- Installed Plannotator `0.28.19` prints the required Inbox guide marker.

## Focused checks

- Installer/update behavior and macOS/Linux render checks passed (18 tests). Codex reconciliation cases passed; Junie/OpenCode merge cases passed after correcting the test uv stub's argument count.
- A fresh Claude print session with tools disabled confirmed the Bun policy, `bun install`, and the exact `@AGENTS.md` import from loaded context. Print mode does not verify the native Inbox tool. This Codex session received the root Bun policy at startup. OpenCode's fresh-session verification passed as recorded below; Junie instruction and interactive Claude/Junie tool discovery checks remain pending.
- Official instruction-discovery documentation checked: [Claude](https://code.claude.com/docs/en/memory#agentsmd), [Codex](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [OpenCode](https://opencode.ai/docs/rules/), [Junie](https://junie.jetbrains.com/docs/guidelines-and-memory.html). Installer flags checked against the downloaded official installer and installed Inbox guide.

- Targeted chezmoi diff revealed that a plain `modify_config.json` source would change the existing Plannotator config mode from 0600 to 0644. The implementation uses chezmoi's `modify_private_config.json` source name instead, targeting the same file and preserving its private mode.
- Junie's launcher applied an already staged update (3196.5) despite `--skip-update-check`; its noninteractive `--agent-mode=chat` check then failed because that mode requires Nightly. No instruction-loading success is claimed for Junie; interactive verification remains pending.

## Live scoped apply and reply

- Inspected and applied only `~/.junie/mcp/mcp.json`, `~/.plannotator/config.json`, and `~/.zshrc` with scripts excluded. A repeat apply produced no diff. Junie now has the absolute-binary stdio Inbox entry; OpenCode's existing true preference and Plannotator config mode 0600 were preserved.
- Ran the extracted production Group 7 and Codex Inbox reconciliation only. Existing Plannotator was reused; two Codex reconciliation passes both reported already registered, without registration changes.
- Started Inbox with `--background` and opened it with the scoped auto-connect suppression. Codex's real MCP tools were available and delivered the first question.
- First thread `msg_01M4XX2KVXC0FNE7D5M6HBXJKQ`, reply `msg_01M4XX37VMZRHNQS8MHH7MWAHF`: **No, the setup is enough for now**. The reply was quoted in chat, then the thread was resolved. No follow-up attachments/messages were sent.
- No notes were installed: the supported Codex and Claude targets already contained notes; OpenCode had no supported target and Junie has no installer ID. Gemini/Pi are outside the selected scope. Existing note hashes still match the inventory.

## OpenCode v2 extension

- User explicitly approved migrating OpenCode configuration. The CLI is v2.0.28. Initial `plugin list` returned no plugins during initialization; later discovery showed DCP 3.2.0, WakaTime 1.4.0, Superpowers bb92a77 and Plannotator 0.28.20. Legacy fields were already normalized in memory; the native rewrite is not claimed as a fix for legacy parsing.
- Sources: [v2 migration](https://opencode.ai/v2/docs/migrate-v1), [plugin lifecycle](https://opencode.ai/v2/docs/plugins), [CLI settings](https://opencode.ai/v2/docs/cli/config). Version 1 configuration fixtures come only from the previous tracked source, never from live client data.

## Final validation and remaining acceptance

- `bun test tests/plannotator-inbox.test.ts tests/install-script.test.ts`: **51 passed**, covering macOS/Linux installer renders, installation/update branches, Codex reconciliation, JSON preservation/failures, private chezmoi apply, v2 migration and CLI merge behavior.
- `bun test tests/ibkr-mcp.test.ts`: **11 passed, 1 skipped** (the existing opt-in live test). Existing IBKR isolation/denies remain intact; Sentry/PostHog endpoints and manual content are preserved.
- Focused oxfmt checks, `git diff --check`, and strict OpenSpec validation pass. Targeted repeated chezmoi diffs are empty across all five deployed files, including OpenCode's two files. The shell config is also converged.
- Applied native OpenCode global/project configuration and private CLI merge. Compared `opencode debug config` before/after (normalizing equivalent plugin string/object references): **equivalent**, including all permission effects/order and MCP endpoints. CLI remains mode 0600, retains its unrelated existing preferences, and has the declared theme/scroll values. All four existing plugins are loaded.
- **Task 6.3 passed:** the initial fresh OpenCode session and a retry after the user reported authentication failed with `OAuth access token is invalid.` The user then requested OpenAI. A fresh `opencode run --model openai/gpt-6.1-sol` session titled `Inbox migration acceptance with OpenAI` completed successfully and confirmed the loaded Bun policy, `bun install`, availability of `plannotator_inbox`, and its `read_thread` and `wait_for_reply` actions. The acceptance prompt prohibited tool calls, file changes, commands and Inbox messages; the response contained only the three requested confirmations. A concurrent plugin catalogue check confirmed all four existing plugins and the versions recorded above. The model override applied only to this verification session; the managed default model was preserved. No credentials were inspected, exported, or changed by this workflow.
- Fresh interactive Claude native-tool discovery and Junie instruction/tool discovery remain pending. Claude's separate fresh print-mode instruction import was verified; Codex's real MCP reply was verified. No unavailable-host check is recorded as passed.
- Final ownership audit: changes contain managed sources, source-only regression fixtures, documentation and task evidence. No Inbox data directory, credentials, full live client config, or unmanaged user instruction bodies entered Git. No uninstall, explicit process termination, Inbox deletion or note rewrite occurred. Junie's launcher-owned staged update is recorded above.

## PR review revision

The checks above describe the earlier implementation. At user request, DCP, the Plannotator preference merge, the entire dedicated Inbox test suite and both v1 fixtures have now been removed. OpenCode Inbox activation is a one-time action in Inbox Settings; existing live preferences are preserved. Both installer paths assume Git is available and use only `--non-interactive`.

The current machine already has the v2 theme and scroll settings in `cli.json`; targeted `chezmoi diff --exclude scripts` is empty. The retained installer suite passes all 4 tests (including macOS/Linux rendering and shell syntax). Strict OpenSpec validation passes. No new live installation or Inbox activation was performed during this revision.

## Review follow-up validation

- Fixed the README documentation test for the four-step setup, repaired the parity table and removed the obsolete formatter ignore.
- Added full MODIFIED deltas for OpenCode main/CLI settings and existing DeepWiki, Expect and JetBrains MCP requirements. The migration explicitly retains force-push deny precedence and removes DCP. Updated the proposal and skill trigger wording to match.
- Full `bun test`: **140 passed, 1 skipped, 0 failed** across 10 files. The skip remains the opt-in live IBKR test.
- Formatting, Fallow audit, `git diff --check` and strict validation of this change passed. All three changes pass with the CI-pinned OpenSpec 1.2.0 validator. The newer local validator reports pre-existing omitted scenarios in the separate Sentry and PostHog changes; those artifacts were not modified.
- No new live setup or host-discovery checks were performed. The earlier Claude/Junie verification limitations still apply.

The subsequent Pullfrog review confirmed the earlier fixes and identified the remaining Linear v1 reference. Added its full MODIFIED delta and, after searching main specs, aligned the installation spec's auto-update reference through a second delta. These follow-ups change specifications only.
