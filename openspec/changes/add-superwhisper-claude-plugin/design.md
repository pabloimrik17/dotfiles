## Context

The chezmoi-managed `dot_claude/settings.json.tmpl` declares 25 enabled Claude Code plugins and 10 known marketplaces, and `run_onchange_install-packages.sh.tmpl` (Group 8) registers those marketplaces and installs those plugins via the `claude` CLI. Two locally-used integrations are missing from this template: the SuperWhisper marketplace (`superultrainc/superwhisper-claude-code`) and the `superwhisper@superwhisper` plugin, which together let SuperWhisper notify the user with voice when an agent finishes and reply via dictation.

The SuperWhisper macOS app is already provisioned by the `gui-app-install` capability (the `superwhisper` cask is in `CASK_PACKAGES`), so this change is purely about wiring the Claude Code plugin and marketplace into chezmoi.

## Goals / Non-Goals

**Goals:**

- Fresh machines provisioned via `chezmoi apply` get the SuperWhisper marketplace registered, the plugin installed, and the plugin enabled in Claude Code settings.
- Reuse the existing pre-scan / skip-if-installed pattern in Group 8 so re-runs are idempotent.
- Keep all edits additive so the diff stays small and reviewable.

**Non-Goals:**

- Installing or configuring the SuperWhisper macOS app itself (already handled by `gui-app-install`).
- Authoring custom voice deeplinks, hooks, or wrappers — the upstream plugin ships its own hooks and `superwhisper://` deeplinks; we just install it.
- Cross-platform support — SuperWhisper is macOS-only; on non-macOS the existing platform guard in the install script keeps the plugin group inert.
- Changes to the cask install pipeline (no edits to `gui-app-install`).

## Decisions

### 1. Use the upstream marketplace verbatim

Register the marketplace as `superwhisper` with source `github` / repo `superultrainc/superwhisper-claude-code`, and install plugin id `superwhisper@superwhisper`. These ids come straight from the upstream `marketplace.json`, matching the pattern used for every other plugin in this repo (`<plugin>@<marketplace>`).

**Alternative considered:** Run the upstream one-liner `curl -fsSL https://superwhisper.com/install-claude-code.sh | bash`. Rejected — this repo's `permissions.deny` blocks `curl … | bash`, and the install script never uses pipe-to-shell installers. Going through `claude plugin marketplace add` + `claude plugin install` keeps SuperWhisper consistent with every other plugin and makes uninstall/update work the same way.

### 2. Append, don't reorder

New entries are appended to the end of `enabledPlugins`, `extraKnownMarketplaces`, `CC_MARKETPLACES`, and `CC_PLUGINS`. No existing entries move. This keeps the diff to four single-line additions and avoids merge churn.

### 3. Auto-update enabled to match every other marketplace

The `superwhisper` entry in `extraKnownMarketplaces` SHALL set `autoUpdate: true`, matching every other marketplace already declared in `dot_claude/settings.json.tmpl` (`claude-plugins-official`, `superpowers-marketplace`, `beads-marketplace`, `worktrunk`, `plannotator`, etc.). This ensures the plugin tracks upstream changes (deeplink schema, hook payloads) without requiring manual `claude plugin marketplace update` runs.

**Alternative considered:** Pin to a specific commit by setting `autoUpdate: false`. Rejected — no other marketplace in this repo is pinned, and SuperWhisper's plugin schema (`superwhisper://agent-update?…` deeplinks) is small enough that drift risk is low.

### 4. No platform guard, no hooks edits

SuperWhisper is macOS-only, but Group 8 already runs only `if command -v claude &>/dev/null` and the install script's broader macOS guards apply. We do not need a SuperWhisper-specific platform check. The plugin's own session/notification hooks ship inside the plugin package — we do not edit the top-level `hooks` block.

**Alternative considered:** Add an `if [[ "$OSTYPE" == "darwin"* ]]` guard around the SuperWhisper marketplace/plugin entries. Rejected — none of the other plugins use per-plugin guards, and the cask itself (which is the only macOS-specific runtime dependency) is gated by the existing install pipeline.

### 5. No new capability — extend `claude-code-plugins`

This change adds requirements that fit the existing `claude-code-plugins` capability (plugin enabled by default, marketplace registered, install script wires it up). No new capability spec is justified.

## Risks / Trade-offs

- **Plugin missing on re-run** → If `superultrainc/superwhisper-claude-code` is renamed or unpublished, `claude plugin install` will fail. Mitigation: the install script accumulates errors and does not abort, matching how every other plugin failure is handled today.
- **App not installed on macOS host** → If a user declines the `superwhisper` cask, the plugin is enabled but its `superwhisper://` deeplinks no-op. Mitigation: this is the same inert-on-missing pattern used for `beads`, `plannotator`, etc.; no extra handling needed.
- **Settings-template JSON validity** → Two new JSON entries in `settings.json.tmpl` need correct comma placement. Mitigation: the verification step renders the template via `chezmoi cat` and validates with `jq`.

## Migration Plan

1. Land the four additive edits.
2. Run `chezmoi apply` on the maintainer's primary machine — both the marketplace pre-scan and plugin pre-scan should report "already registered/installed" since SuperWhisper is already wired locally.
3. Run on a clean machine (or worktree-style fresh `~/.claude/`) to confirm the plugin gets installed end-to-end.

Rollback is a single revert — no data migration, no irreversible state.

## Open Questions

_None._
