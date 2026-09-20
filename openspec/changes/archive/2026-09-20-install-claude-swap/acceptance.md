# Acceptance Evidence

## 6.2 Personal Mac

Validated on macOS on 2026-09-20.

- Persisted `machineType = "personal"` with `chezmoi init` while retaining the normal source directory.
- Previewed and applied the managed `settings.json` and `claude-swap-setup` targets; the post-apply diff for those targets was empty. The runtime directory was `0700`, the policy file `0600`, and the setup command executable.
- Confirmed `cswap 0.26.0`, native `personal` and `work` aliases, and `personal` as the initial active identity.
- Ran `cswap auto --once --dry-run`; an HTTP 429 produced the documented first unhealthy tick without changing `personal`.
- Repaired an acceptance-discovered base-only installation by converging on `claude-swap[menubar]==0.26.0`; verified `rumps` from the uv-tool interpreter.
- Installed the upstream LaunchAgent and verified it remained running. Enabled **Settings → Auto-switch accounts** through the menu; the application-owned setting persisted as enabled.
- Switched globally to healthy `work` at 68% binding usage and confirmed a dry run returned `below-threshold` without switching.
- Restarted macOS at `2026-09-20 16:57:47 +0200`. The LaunchAgent resumed with PID `2874` instead of the pre-restart PID `18659`, with no prior exit. `work` remained active, the menu refreshed its 68% usage after login, the UI toggle remained enabled, and a post-restart dry run again returned `below-threshold` without changing the account.

## 6.3 Work-role Fixture

Validated with focused fake-command Bun fixtures on 2026-09-20.

- A blank work-role fixture enrolled exactly one native `work` alias, selected it globally, installed the upstream service, and verified service status.
- The work path did not invoke `cswap auto --once --dry-run` and instructed the operator to leave **Auto-switch accounts** disabled.
- A fixture containing `work` plus an unexpected `personal` account returned non-zero, printed explicit manual-removal guidance, and issued neither `remove` nor `disable`.
- Command: `bun test tests/claude-swap.test.ts --test-name-pattern 'work machine|work-machine|work guidance'` (`3 pass`, `0 fail`).

## 6.4 Upstream Autoswitch Engine Matrix

Validated with the installed `claude-swap 0.26.0` engine and isolated fake accounts on 2026-09-20. The fixture replaces only usage/OAuth inputs and uses a temporary state path; ranking, outcomes, event generation, cooldown reads, and quarantine writes run through upstream code.

| Case | Observed outcome |
| --- | --- |
| Active reaches 85%; peer has 35% headroom | `SWITCHED` (`proactive`, dry run) |
| Both accounts exceed 85%; peer has 14% versus 4% headroom | `SWITCHED` (`proactive`, dry run) |
| Peer improves headroom by only 9 points | `BLOCKED` (`no-qualifying-candidate`) |
| Proactive move inside the 300-second cooldown | `NO_ACTION` (`cooldown`) |
| Both accounts have zero headroom | `BLOCKED` (`all-exhausted`) |
| Inactive recovers while active remains at 80% | `NO_ACTION` (`below-threshold`) |
| Active usage is unknown for three ticks | `NO_ACTION`, `NO_ACTION`, then dry-run `SWITCHED` (`failover`) |
| Candidate usage is unreadable | `BLOCKED` (`no-comparison`) |
| Candidate refresh returns `invalid_grant` | `BLOCKED`; slot 2 is quarantined in temporary upstream state and never activated |
| HTTP 429 leaves last-good active usage at 80% | `NO_ACTION` (`below-threshold`), demonstrating the accepted delayed-switch limitation |

No remaining case requires manual upstream validation. Authentication quarantine uses a synthetic `invalid_grant` response so acceptance does not deliberately invalidate a real Keychain credential; the upstream quarantine event and persisted-state paths themselves are exercised. The stale-429 limitation is both simulated here and corroborated by the real first unhealthy tick recorded in 6.2.

- Command: `bun test tests/claude-swap.test.ts --test-name-pattern 'personal-machine decision and failure matrix'` (`1 pass`, `0 fail`).

## 6.5 Security and Rollback Audit

Audited the complete worktree and the candidate chezmoi target graph on 2026-09-20.

- A filename scan (excluding dependencies and `.git`) found no credential, export, cache, quarantine, `menubar_settings.json`, `autoswitch_state.json`, or `com.cswap.menubar.plist` artifact in source state.
- A content scan found no Anthropic API-key signature, serialized access/refresh/session/API-key value, private-key block, or real acceptance-account domain. The autoswitch fixture uses only explicit non-secret placeholders.
- Candidate `chezmoi managed` output contains exactly `~/.claude-swap-backup/settings.json` below the runtime backup root. It contains none of the forbidden runtime/menu/service paths; the setup command is managed separately at `~/.local/bin/claude-swap-setup`.
- Candidate `chezmoi diff` for the public policy and setup command is empty. The live runtime directory is `0700`, `settings.json` is `0600`, and the setup command is executable.
- The only repository references to `menubar_settings.json`, `autoswitch_state.json`, exports, Keychain, and the generated plist are documentation, specifications, acceptance assertions, or isolated-test paths. Implementation contains no credential export/deletion command; its only `cswap remove` text is non-destructive operator guidance.
- The documented rollback order is: disable **Auto-switch accounts**, run `cswap menubar --uninstall-service`, select the desired global account, then revert/apply the dotfiles change. It explicitly forbids deleting Keychain accounts as part of rollback.
