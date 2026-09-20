## 1. Machine Classification and Managed Policy

- [ ] 1.1 Add a no-default `promptChoiceOnce` for `machineType` (`personal`/`work`) to `.chezmoi.toml.tmpl`, retain existing name/email values, and verify both choices plus re-init reuse with isolated `chezmoi execute-template --init` cases.
- [ ] 1.2 Add the missing-role migration guard so an existing config cannot assume a role or enroll accounts, and verify a role-less rendered apply path exits non-zero with the exact `chezmoi init` recovery instruction.
- [ ] 1.3 Add the private chezmoi source for the minimal schema-v1 `~/.claude-swap-backup/settings.json` policy (85/60/300/10/`best`/no API keys/3 ticks/no model), and verify rendered JSON, owner-only modes, `chezmoi diff` convergence, and acceptance by pinned `cswap config` parsing.

## 2. Pinned Installation and Service Lifecycle

- [ ] 2.1 Add a macOS installer group that converges on `claude-swap[menubar]==0.26.0` through `uv tool install --managed-python`, skips an exact existing version, and verifies `cswap --version`; cover absent `uv`, failed install, and mismatched post-install version with fake-command Bun tests and visible error accounting.
- [ ] 2.2 Make non-macOS execution explicitly skip claude-swap and update the platform summaries accordingly; verify a rendered Linux installer contains no install command and names the integration as macOS-only.
- [ ] 2.3 Refresh an existing upstream menubar service after a successful pin change without tracking its plist, and verify fake `--service-status`/`--install-service` call sequences for installed and absent services.
- [ ] 2.4 Keep claude-swap out of `BREW_PACKAGES` and `update-extra`, document its repo-pinned update path in the installer output, and verify searches/tests show no Homebrew entry, `cswap upgrade`, or extra-update step.

## 3. Re-runnable Account Bootstrap

- [ ] 3.1 Add a rendered executable `~/.local/bin/claude-swap-setup` with macOS/role/pin/`jq`/Claude/cswap preflight and public JSON state inspection; verify fake personal, work, missing-prerequisite, and malformed-JSON paths return observable results.
- [ ] 3.2 Implement resumable enrollment of native `personal`/`work` aliases, the `/logout` warning, and the required final active account; verify a fake personal run fills only missing accounts and finishes personal, while a fake work run finishes with work only.
- [ ] 3.3 Detect unexpected non-work accounts on a work machine, emit explicit manual-removal guidance, and return non-zero without calling remove/disable; verify the fake command log contains no destructive account command.
- [ ] 3.4 Add personal dry-run followed by upstream menubar service install/status verification and role-specific toggle instructions; verify dry-run precedes the personal enable instruction and work output leaves auto-switch off.
- [ ] 3.5 Add the TTY-aware `run_onchange_after_` offer keyed to role, pin, and setup-command revision; verify complete setups do not prompt, incomplete TTY setups offer the wizard, and non-TTY setups print the re-runnable command without blocking.

## 4. Shell Integration and Regression Safety

- [ ] 4.1 Add `cs-list`, `cs-current`, and `cs-global` to the Claude-related zsh configuration, and verify an interactive zsh resolves the exact expansions without collisions or a `cswap run` wrapper.
- [ ] 4.2 Add focused Bun coverage for machine-role rendering, managed settings, install classification, alias definitions, and bootstrap fake-command flows; verify `bun test tests/claude-swap.test.ts` passes on supported test hosts.
- [ ] 4.3 Leave `dot_local/bin/shims/executable_claude` and all existing launchers unchanged, and verify `bun test tests/claude-node-launch.test.ts tests/ghd-aoe.test.ts` still passes.

## 5. Documentation

- [ ] 5.1 Read `.agents/skills/update-readme/references/readme-conventions.md`, add the claude-swap AI Tooling row and concise machine-type/bootstrap setup note to `README.md`, and verify the overview links upstream, preserves the three-step setup, and sends operational detail to the manual without adding a screenshot.
- [ ] 5.2 Read `.agents/skills/update-manual/references/html-conventions.md`, add the complete claude-swap subsection to Section 11 of `docs/manual.html`, and verify search/sidebar behavior, all three shipped aliases, personal/work workflows, menu pause, pin-based update, security ownership, and recovery guidance while retaining exactly 15 sections.

## 6. Validation and macOS Acceptance

- [ ] 6.1 Run `bun run lint:oxfmt`, the targeted Bun suites, and `openspec validate install-claude-swap --type change --strict --no-interactive`; fix every formatting, test, and specification failure.
- [ ] 6.2 On a personal Mac, preview with `chezmoi diff`, apply, enroll both aliases, confirm personal is initially active, run the side-effect-free dry-run, install/check the service, enable the menu toggle, and record evidence that a login restart preserves the healthy active account.
- [ ] 6.3 On a work-role fixture or Mac, verify only work can satisfy setup, an unexpected account fails non-destructively, the menu service starts, and auto-switch remains disabled.
- [ ] 6.4 Exercise or simulate threshold, hysteresis, cooldown, all-exhausted blocking, recovered-inactive stability, three unhealthy ticks, unreadable candidates, authentication quarantine, and the stale-429 limitation; verify outcomes match the delta specs and document any upstream-only case that requires manual validation.
- [ ] 6.5 Audit the final source and rendered targets for credentials, exports, `menubar_settings.json`, `autoswitch_state.json`, caches, and plist copies; verify Git contains only public policy/configuration and the rollback path disables service/switching without deleting Keychain data.
