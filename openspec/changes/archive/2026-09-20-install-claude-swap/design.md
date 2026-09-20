## Context

See `proposal.md` for motivation and the delta specs for the behavioral contract. The current repo stores only `name` and `email` in `.chezmoi.toml.tmpl`, installs macOS tools through a content-triggered interactive shell script, and already installs `uv` through Homebrew. It has no managed LaunchAgent precedent. Claude Code is reached through `~/.local/bin/shims/claude`, which must continue absolute-delegating to `~/.local/bin/claude` for Node and AoE behavior.

Upstream `claude-swap` v0.26.0 exposes two different configuration contracts. `settings.json` is documented, schema-versioned, validated, and safe for declarative ownership; `menubar_settings.json` is menu persistence without a public setter or cross-version editing contract. Credentials normally live in Keychain, while account metadata and fallback files live under `~/.claude-swap-backup/`. The generated LaunchAgent is already managed by `cswap menubar --install-service`.

Existing machines present a migration constraint: changing `.chezmoi.toml.tmpl` does not automatically regenerate their local chezmoi configuration. Role-dependent templates therefore cannot assume `.machineType` exists on the first apply after this change is pulled.

## Goals / Non-Goals

**Goals:**

- Make the installed version, public policy, shell surface, and setup flow reproducible.
- Keep interactive authentication resumable and keep every destructive credential action explicit.
- Give personal and work Macs different account policies from one immutable local value.
- Make incomplete installation, enrollment, service setup, and migration observable.
- Preserve all existing Claude launch paths and keep upstream responsible for switching internals.

**Non-Goals:**

- Managing non-Anthropic providers, Linux account switching, paid API fallback, or model-specific quotas.
- Wrapping the `claude` command with cswap, mapping accounts by project, or using isolated `cswap run` profiles.
- Tracking credentials, plaintext exports, menu state, caches, quarantine/autoswitch state, or the generated plist.
- Fixing upstream issue #208, Remote Control/Artifact affinity, or Keychain behavior with a fork or parallel watcher.

## Decisions

### 1. Store `machineType` with chezmoi init data

`.chezmoi.toml.tmpl` will use `promptChoiceOnce` with the choices `personal` and `work`, with no default, and write `.machineType` beside `.name` and `.email`. Role-aware templates will consume that data directly; zsh will not export it.

Templates and scripts will use a missing-value guard rather than silently defaulting. On an existing machine without the key, apply will stop the role-dependent setup with a diagnostic instructing the operator to run `chezmoi init`, choose once, and re-apply. This keeps the migration recoverable without letting a partial apply enroll a work identity under an assumed personal role.

Alternatives considered:

- Infer from email or hostname: mutable and can silently assign the wrong policy.
- Default to personal: reduces prompting but makes an accidental Enter security-relevant.
- Export an environment variable: creates a global public surface without a runtime consumer.

### 2. Treat claude-swap as a repo-pinned uv tool

The macOS installer group will converge on:

```sh
uv tool install --managed-python --force 'claude-swap[menubar]==0.26.0'
```

It will skip when `cswap --version` already reports the pin and `rumps` loads from the uv-tool interpreter referenced by the `cswap` shebang. This distinguishes the declared menubar extra from a base-only installation at the same version. After installation it verifies both the executable/version and menubar runtime; a missing `uv` or failed verification feeds the install script's existing error counter. A future upgrade changes the single installer pin and re-applies the dotfiles; `cswap upgrade` is intentionally not added to `update-extra`.

Using a uv-managed Python avoids the known macOS menu-icon failure associated with some framework Python builds. The install group is absent on non-macOS; the Linux summary explains that this integration is intentionally unsupported rather than suggesting a weaker installation.

Alternatives considered:

- Floating latest stable: simpler upgrades but violates cross-machine reproducibility.
- Homebrew: no selected formula path and would change the update owner.
- Built-in updater: conflicts with the exact repository pin.

### 3. Manage only a minimal public settings file

Chezmoi will own `~/.claude-swap-backup/settings.json` through a private source directory/file such as `private_dot_claude-swap-backup/private_settings.json`, giving the directory and file owner-only modes. The JSON will contain `schemaVersion: 1` and the explicit autoswitch keys from the spec. It will omit unrelated UI preferences so upstream defaults fill them.

This is a regular managed file, not a managed backup directory. If a menu/CLI action changes a managed policy value, `chezmoi diff` shows it and the next apply restores the declared value. All sibling credential/state files remain invisible to source state.

Ownership boundary:

| Surface | Owner |
| -- | -- |
| Machine type, version pin, `settings.json`, setup command, zsh aliases, docs | Dotfiles/chezmoi |
| Active credential and account backups | Claude Code / claude-swap Keychain backend |
| Credential fallback, sequence, cache, quarantine and `autoswitch_state.json` | claude-swap runtime |
| `menubar_settings.json` and its enable toggle | Menubar UI |
| `com.cswap.menubar.plist` | `cswap menubar --install-service` |

Alternatives considered:

- Repeated `cswap config set` calls: supported and merge-friendly, but makes the desired policy less directly reviewable than the upstream-supported config file the user chose to manage.
- Manage the whole backup root: risks committing secrets and conflates policy with runtime state.
- Manage `menubar_settings.json`: its format lacks a public editing contract, atomic merge, and hot reload.

### 4. Split reproducible mechanics from interactive enrollment

A rendered executable such as `~/.local/bin/claude-swap-setup` will embed the immutable role and remain safe to re-run. It will use public JSON/status commands (`cswap list --json`, `cswap status --json`) to determine missing aliases and validate results. The wizard will:

1. Check macOS, the machine role, pinned `cswap`, `jq`, Claude Code, and Keychain-relevant prerequisites.
2. Explain the target account set and warn never to `/logout` before capture.
3. Pause for the user to authenticate each missing subscription, then run `cswap add --alias personal|work` and re-check identity/alias state.
4. Refuse automatic deletion when a work Mac contains any non-work account and print explicit cleanup instructions.
5. Select the required final account (`personal` on personal, `work` on work).
6. On personal, run `cswap auto --dry-run`; on both roles, install and verify the upstream menu service.
7. Direct the user to enable the menu toggle only on personal and leave it off on work.

A `run_onchange_after_...` offer script will run after target files and ordinary install scripts. Its rendered content will depend on the role, pin, and setup-command revision. With a TTY it offers the wizard only when setup is incomplete; without a TTY it prints the command and succeeds without blocking. The permanent command covers interrupted setup and later reauthentication even after the one-time offer hash is recorded.

Alternatives considered:

- Put the entire enrollment inside the package installer: difficult to resume and couples browser login state to all package installation.
- Pure `run_once_` enrollment: interrupted or expired credentials would have no natural repair entry point.
- Fully manual documentation: loses observable convergence and first-run guidance.

### 5. Let upstream own the persistent process

The wizard calls `cswap menubar --install-service` and verifies with `--service-status`; no plist enters chezmoi. When the install group changes the pinned executable and detects an existing service, it re-runs the upstream installer/restart path so launchd does not keep the old process image.

The menu toggle remains a deliberate one-time UI action because v0.26.0 provides no public CLI setter. The wizard sequences dry-run before that action. Pausing later uses the same toggle, ensuring only one autoswitch loop exists.

Alternatives considered:

- Dotfiles-owned LaunchAgent running `cswap auto`: automates enablement but duplicates upstream lifecycle and menu behavior.
- Tracked upstream plist copy: creates two owners and hard-codes generated executable details.
- Preseed the private menu JSON: works in v0.26.0 but relies on an undocumented persistence format.

### 6. Preserve the current Claude launch seam

Account rotation works by changing the global credential; it does not need a wrapper around each invocation. The existing `claude` shim, PATH ordering, `wsc`/`wsh`, gh-dash, and AoE configuration remain unchanged. New zsh aliases call `cswap` directly and say `global` in the mutating alias name to distinguish it from `cswap run`.

Regression verification will run the existing `tests/claude-node-launch.test.ts` unchanged and add focused Bun tests for rendered config, alias definitions, installer classification/pin, role branching, non-destructive work-account handling, non-interactive setup, and fake-cswap wizard outcomes.

### 7. Keep overview and operational documentation at different depths

README receives one AI Tooling row and a concise setup-boundary note. The existing Section 11 of `docs/manual.html` receives the complete operational subsection; no sixteenth manual section or new screenshot is needed. The manual will distinguish repo-managed policy from runtime-owned secrets/state and will document the known 429, Keychain, and identity-affinity recovery cases.

## Risks / Trade-offs

- **[Risk] HTTP 429 can leave stale usage below the threshold and delay a switch** → Label autoswitch best effort, preserve visible status/manual aliases, validate the failure in acceptance, and track upstream #208 without a local fork.
- **[Risk] A launchd process can be denied Keychain access** → Verify status and account reads from the installed service; document upstream terminal/menu refresh and reauthentication.
- **[Risk] Keychain failure permits upstream's base64 `0600` fallback** → Keep the entire runtime directory outside Git, rely on host disk encryption, and document the boundary without calling it encrypted.
- **[Risk] The menu toggle is not declaratively enabled** → Make it an explicit final wizard checkpoint and document how to verify/pause it; revisit automation only if upstream exposes a public setter.
- **[Risk] A pinned release misses fixes** → Use a reviewed pin-bump workflow; each bump re-runs tests, checks upstream issues/changelog, and refreshes the service.
- **[Risk] An existing machine lacks `.machineType` during its first update** → Fail the role-dependent step with the exact `chezmoi init` migration, then re-apply; never guess.
- **[Risk] Managing `settings.json` overwrites ad-hoc policy edits** → Treat that as intended convergence and surface it in `chezmoi diff`; keep unrelated UI keys omitted.
- **[Trade-off] Global switching can route personal prompts through work and can disturb Remote Control/Artifacts** → This is explicitly accepted; the menu pause and manual switch are the escape hatches.

## Migration Plan

1. Add the machine-type prompt and guards. On every existing machine, run `chezmoi init`, select its purpose, and re-run apply.
2. Apply the pinned installer, managed public settings, setup command, offer hook, and aliases. Verify no credential/runtime files appear in source state.
3. Run the guided setup: enroll role-appropriate accounts, confirm aliases/final identity, execute dry-run, and install/check the menu service.
4. On personal, enable auto-switch in the menu; on work, verify it remains disabled. Log out/in or restart and confirm service and active-account preservation.
5. Exercise simulated/fake states in Bun tests and perform the real-Mac acceptance matrix for switching, blocking, telemetry/auth failures, Keychain recovery, and restart.
6. Update README and Section 11 of the manual, then run formatting, targeted Bun tests, the existing Claude shim suite, and strict OpenSpec validation.

Rollback is ordered to preserve credentials: disable auto-switch in the menu, use `cswap menubar --uninstall-service`, manually select the desired Claude account, revert the dotfiles change, and apply. Uninstalling the uv tool or deleting stored accounts is a separate explicit operator action; rollback SHALL NOT erase Keychain credentials automatically.
