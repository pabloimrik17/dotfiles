# Tasks

## 1. Convert and cover the autonomous encrypted template

- [x] 1.1 Privately inspect the existing decrypted autonomous configuration with the available age identity, identify the Beads value and any literal template delimiters, and retain comparison data outside the repository; verify that no plaintext or identity appears in tracked files or command output.
- [x] 1.2 Convert the autonomous source to an encrypted private template using chezmoi with this worktree explicitly selected, derive the Beads directory from `.chezmoi.homeDir`, and preserve all other values; verify `managed --path-style all --format json` maps only `encrypted_private_config.json.tmpl.age` to `.config/autonomous/config.json` and leaves stonks unchanged.
- [x] 1.3 Replace the shared filename expectations in `tests/plugin-configs.test.ts` with per-plugin source names, accounting for both sides of the Git rename; verify ciphertext-only inventory, target mappings, and existing missing-identity protection with `bun test tests/plugin-configs.test.ts`.
- [x] 1.4 Add isolated encrypted-template integration coverage using temporary keys and synthetic JSON generated at runtime; verify two distinct home values (including spaces), preserved unrelated strings, valid JSON, mode 600 including tightening existing permissions, rendering-error failure, and empty target diff after apply without using the real identity or home.
- [x] 1.5 Verify the actual new encrypted source privately under two controlled home values in isolated destinations; compare parsed output with the original configuration, allowing only the intended Beads-path change, and report assertions without plaintext dumps. Remove temporary plaintext and identities after verification.
- [x] 1.6 Update the manual's autonomous row and plugin edit flow with the explicit encrypted source names and template-preservation guidance described in `design.md`; add the per-machine path/directory/apply/diff check and inspect the rendered subsection for readable commands and consistent existing formatting.

## 2. Integration and machine acceptance

- [x] 2.1 Run the full `bun test` suite, `bun run lint:oxfmt`, and `openspec validate fix-autonomous-beads-home --strict`; verify success and review the final changed-file list for unintended config changes or plaintext artifacts.
- [x] 2.2 On this machine, render the actual Beads value with this worktree selected, assert the expected home-relative path and `test -d` success, apply only the autonomous target with scripts excluded, and verify valid JSON, mode 600, and an empty target diff. Inspect the full chezmoi diff and record any unrelated pre-existing drift separately.
- [ ] 2.3 Repeat the path, directory-existence, apply, permission, and diff acceptance checks on every other target machine, recording results without private configuration contents; leave this task pending for unavailable machines or missing checkouts rather than treating local or synthetic tests as fleet acceptance.

## Verification record (2026-10-16)

- Integration checks: `bun run lint:oxfmt`, `git diff --check`, staged whitespace checks, and `openspec validate fix-autonomous-beads-home --strict` passed. The full `bun test` run (Bun 1.4.2, macOS) completed in 483.96 seconds with 118 passed, 1 skipped, 25 failed, and 25 associated errors. Eleven unchanged `ghd-aoe` integration cases exceeded 15 seconds; fourteen unchanged `claude-swap` installer/setup cases exceeded 5 seconds, with resulting assertion/fixture-cleanup errors. All eight plugin-config cases passed within the full run. A user-requested rerun of the unchanged full suite passed in 90.92 seconds: 143 passed, 1 skipped, 0 failed, and 809 assertions. None of the prior timeouts reproduced. Task 2.1 is complete; neither unrelated implementation nor test timeouts were changed.
- Actual ciphertext: privately rendered and applied under two controlled temporary homes, including spaces. Parsed values matched the original except for the intended Beads directory. Both targets had mode 600 and empty diffs. Temporary plaintext and verification destinations were removed; the real identity was never copied.
- Synthetic regression coverage: eight plugin-config tests passed, including JSON escaping, unrelated literal delimiters, permission tightening, rendering failure, plugin-owned JSON validation, and idempotence, using temporary identities and isolated destinations.
- Manual: inspected in headless Chrome. New flow and acceptance commands render readably. The existing table's long key-generation command and nowrap styling clip its description column; no unrelated layout change was made.
- Local macOS machine: the actual rendered Beads path matched the local home plus `/WebstormProjects/agentic-task`; `test -d` passed. Applied only the autonomous target with scripts excluded. Valid JSON, mode 600, and an empty target diff passed.
- Full chezmoi diff: entries for `.config/opencode/opencode.jsonc`, `.zshrc`, `install-packages.sh`, and five deployed test files (`brew-freeze`, `claude-swap`, `gws-client-secret`, `install-script`, and `plugin-configs`) remained unchanged across the target-only apply. These entries were already present immediately before that apply; the `plugin-configs` test source includes this change's regression coverage. No unrelated targets were applied.
- Other machines: pending for manual rollout, as explicitly requested by the user. Local and synthetic results do not establish fleet acceptance.

## Archive record (2026-10-16)

- Archived at the user’s explicit request after the review fix. Task 2.3 remains unchecked for manual acceptance on other machines; archiving does not claim fleet verification.
- Synced four modified requirements and one added requirement into `openspec/specs/plugin-configs/spec.md`, preserving unrelated requirements and the existing Purpose. `openspec validate --specs` passed all 116 specifications with warnings about long requirement text and existing placeholder purposes.
- Pullfrog’s rendering-error assertion was tightened to `missing value for if`; all eight plugin-config tests passed and the review thread was resolved.
