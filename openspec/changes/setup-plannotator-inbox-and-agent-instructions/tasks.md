# Tasks

## 1. Canonical agent instructions

- [ ] 1.1 Recheck the tracked and chezmoi-managed instruction inventory, then consolidate the root instruction body in `AGENTS.md` and replace root `CLAUDE.md` with `@AGENTS.md`; verify all previous content, including the Bun policy, survives and both paths remain excluded from home deployment.
- [ ] 1.2 Record the user-scope migration result: currently no managed user `CLAUDE.md` exists. If the inventory changed, migrate only actual managed bodies with preserved scope, reconciled destination content and verified host adapters; verify unmanaged Codex/Claude Inbox notes remain unchanged.
- [ ] 1.3 Document canonical instructions and discovery/precedence in manual sections 11–14 and the parity table; verify the instructions in fresh supported agent sessions, including Claude's imported AGENTS content, and record any host verification still pending.

## 2. Plannotator installation and updates

- [ ] 2.1 Update installer Group 7 to resolve PATH/fallback binaries, distinguish compatible/old/error states, install only when needed using the official non-interactive flags and verify the result; add isolated Bun tests for current, missing, old, fallback-path, missing-git and failure branches.
- [ ] 2.2 Update the existing `_update_extra_plannotator` helper to pass `--non-interactive` and conditional `--skip-skills`; verify with stubbed download/installer commands that arguments are correct, failure propagates and only one Plannotator update step remains.
- [ ] 2.3 Add the Plannotator README entry and installation/update guidance, plus the manual's corresponding update-extra wording; verify command spelling against the current installer/CLI and preserve the existing manual update classification.

## 3. Agent connections and native activation

- [ ] 3.1 Add Codex stdio Inbox reconciliation alongside the existing HTTP module using `codex mcp` JSON inspection and post-add verification; add Bun cases for absent/matching/disabled/conflicting entries, malformed JSON, missing prerequisites and add failure, proving unrelated configuration is untouched.
- [ ] 3.2 Extend `dot_junie/mcp/modify_mcp.json.tmpl` to add only an absent Inbox stdio entry using a resolved absolute binary; test matching entries with extra options, conflicts, unrelated JSON preservation, invalid JSON, missing binary/uv and second-pass convergence after installation.
- [ ] 3.3 Add `dot_plannotator/modify_config.json` to default an absent OpenCode Inbox preference while preserving booleans, explicit per-host choices and unrelated keys; test fresh/partial configs, explicit false, malformed shapes, merge failures and repeated application in an isolated home.
- [ ] 3.4 Confirm the existing Claude/OpenCode plugins remain the only managed Inbox transports for those hosts; verify diffs introduce no redundant MCP entry, broad permission grant, OpenCode version migration, hardcoded personal home or port pin.
- [ ] 3.5 Add concrete Inbox parity and manual rows for all four hosts, including native prerequisites, restart behavior, polling and the Junie note-installer gap; verify every documented surface matches the implementation and existing Sentry/PostHog content remains intact.

## 4. Onboarding workflow

- [ ] 4.1 Document the manual/agent-led onboarding procedure in the manual and link it from README/setup output: guide inspection, host identification, `--background`, scoped auto-connect suppression, browser fallback URL and session restart; verify automatic apply never opens the UI, writes notes or sends/waits for messages.
- [ ] 4.2 Document note selection using the installed guide's exact IDs/paths and explicit chat consent, with existing notes preserved; verify no unsupported Junie ID or empty OpenCode global AGENTS file is introduced.
- [ ] 4.3 Document the first-question exchange using a native tool or one-line JSON-RPC file, stable shell session identity, idempotency key, thread/cursor handling, 45-second waits and the five-minute pending outcome; verify the runbook includes quoting the real reply, resolving only afterward, and conditional relevant attachments.

## 5. Integration verification and live acceptance

- [ ] 5.1 Run the focused Bun suites added above, existing installer render checks for macOS/Linux, applicable formatting checks and `openspec validate setup-plannotator-inbox-and-agent-instructions --strict`; record results and inspect the full diff for unrelated changes.
- [ ] 5.2 Inspect targeted chezmoi diffs and apply the selected configuration during the authorized apply workflow; verify Codex/Junie registration and OpenCode preference, run a targeted second Junie apply if installation ordering required it, and verify a repeat makes no additional registrations.
- [ ] 5.3 Start/open Inbox through the documented workflow, inspect tools in fresh available host sessions, and offer only missing supported instruction notes; record actual host/paths/consent and preserve explicit opt-outs. Record unavailable-host checks as pending rather than passed.
- [ ] 5.4 Complete or reuse the real Codex first-message/reply exchange: receive and quote the person's answer, resolve the initial thread and follow their yes/no choice on sending project work. Verify using returned thread/reply evidence; leave this task open while the human reply is pending.
- [ ] 5.5 Verify final runtime ownership: no Inbox data, credentials, full client config or unmanaged user instruction bodies entered Git; record that no uninstall, process termination or Inbox deletion occurred.
