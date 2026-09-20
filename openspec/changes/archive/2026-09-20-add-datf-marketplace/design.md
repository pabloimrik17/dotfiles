## Context

See `proposal.md` for motivation. Claude Code plugin state currently spans two managed surfaces: `run_onchange_install-packages.sh.tmpl` registers marketplaces and installs plugins through CLI loops, while `dot_claude/modify_settings.json.tmpl` merge-manages `enabledPlugins` and `extraKnownMarketplaces` in `~/.claude/settings.json`.

The upstream repository's `.claude-plugin/marketplace.json` identifies the marketplace as `daily-agentic-task-force` and currently lists one plugin, `datf-lab`. The plugin is deliberately provisional: it currently provides the read-only `datf-lab:hello` smoke-test command and the `promoting-from-lab` lifecycle skill. The marketplace entry and plugin manifest carry upstream versions, so this repository does not need its own version pin.

Claude Code supports `autoUpdate` on an `extraKnownMarketplaces` entry and uses it to refresh the marketplace and installed plugins after startup. The other agent tools have their own plugin or skill surfaces, but the upstream repository does not publish a portable/Codex plugin manifest, an OpenCode package, a Junie extension, or a standalone user-scope distribution of `datf-lab`.

## Goals / Non-Goals

**Goals:**

- Make a confirmed dotfiles apply install and enable the upstream plugin using the same idempotent flow as other ordinary Claude Code marketplace plugins.
- Keep the installed plugin current through Claude Code's native marketplace updater.
- Keep managed settings deterministic without disturbing unrelated live Claude Code keys.
- Record the currently intentional Claude-only distribution across all four agent tools and document how users can recognize and smoke-test the lab plugin.

**Non-Goals:**

- Vendor, fork, or pin `datf-lab` content or its current upstream version.
- Republish provisional DATF material through a locally invented Codex, OpenCode, or Junie package.
- Add a second updater, an `update-extra` step, or a README-level tool entry.
- Change the upstream marketplace or its plugin lifecycle.

## Decisions

### Reuse the existing marketplace and plugin arrays

Add the repository to `CC_MARKETPLACES` and the fully qualified plugin ID to `CC_PLUGINS`. This preserves the existing JSON pre-scan, pending counts, confirmation boundary, PTY-safe Claude command wrapper, and skip-if-installed behavior.

A dedicated install group was rejected because the upstream plugin needs no platform gate, external binary, authentication bootstrap, or custom installer. Duplicating the normal loop would create a second detection and error-handling path for an ordinary marketplace plugin.

### Manage registration, enablement, and installation as complementary state

Add `datf-lab@daily-agentic-task-force` to `enabledPlugins` and the exact upstream marketplace name to `extraKnownMarketplaces`, alongside the CLI arrays. The settings make the intended steady state deterministic and enable background refresh; the installer performs the initial network fetch and installation after the user's existing confirmation prompt.

Using only `enabledPlugins` was rejected because an external plugin still has to be installed for the entry to become usable. Using only the installer arrays was rejected because chezmoi would not enforce enablement or the marketplace's automatic-update policy.

### Delegate updates to Claude Code at marketplace scope

Set `autoUpdate: true` beside the GitHub marketplace source. The plugin inherits that behavior; no per-plugin update field exists in the managed shape, and the local configuration must not copy the upstream `0.x` version.

An `update-extra` command was rejected because the marketplace already ships a native updater and a second updater would overlap with background refresh. A local version pin was rejected because upstream already coordinates the marketplace entry and plugin manifest versions and the requested behavior is to follow those releases.

### Treat non-Claude distributions as confirmed source gaps

Add one parity-table row covering Claude Code, Codex, OpenCode, and Junie. Claude Code gets the concrete plugin ID. The other cells use `none` with a note that the upstream repository does not publish compatible user-installable artifacts for those tools.

Codex now supports personal Git marketplaces, but its catalogs and packages require an Agent Plugins or Codex-compatible manifest that this upstream does not provide. OpenCode and Junie can discover standalone skills, but copying only `promoting-from-lab` out of a Claude plugin would detach it from the plugin namespace, command, release, and lifecycle it describes. Inventing those distributions in this dotfiles repository was therefore rejected.

### Keep documentation at manual scope

Update Section 11 of `docs/manual.html` with the plugin's staging purpose, the `datf-lab:hello` smoke test, the `promoting-from-lab` skill, and marketplace-driven update behavior. A README edit is excluded because the repository's README policy treats Claude Code plugin additions as manual-level detail rather than a new top-level tool.

## Risks / Trade-offs

- **Provisional upstream content can change or disappear** → Label `datf-lab` as a staging area in the manual and follow only upstream releases through the marketplace rather than vendoring its contents.
- **Background refresh can deliver behavior changes without a dotfiles commit** → This is the requested auto-update trade-off; the upstream marketplace uses explicit plugin versions and release automation, while users retain Claude Code's native plugin controls.
- **The marketplace name must match the upstream manifest, not the repository shorthand** → Use `daily-agentic-task-force` for settings keys and plugin qualification, and `pabloimrik17/daily-agentic-task-force` only for the GitHub source.
- **A future upstream cross-agent package could make the recorded gaps stale** → State the packaging reason in the parity row so a later config change can refresh the mapping from current upstream artifacts.

## Migration Plan

1. Add the marketplace/plugin entries to the existing installer and managed settings surfaces, plus the non-macOS manual instruction.
2. Apply the dotfiles; on macOS, accept the existing Claude Code plugin dependencies confirmation so the installer registers and installs the new entries. On non-macOS, run the documented Claude CLI commands manually.
3. Start or reload Claude Code, verify `datf-lab@daily-agentic-task-force` is enabled, and run `/datf-lab:hello` as the read-only smoke test.
4. Roll back by removing the managed entries and reapplying; if the user also wants cached/runtime-owned state removed, use Claude Code's marketplace/plugin removal commands explicitly rather than adding destructive cleanup to chezmoi.
