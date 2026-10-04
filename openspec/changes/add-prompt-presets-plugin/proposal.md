# Add prompt-presets plugin

## Why

MonoLab now ships `prompt-presets`, a Claude Code plugin that packages curated third-party prompts verbatim as slash commands (today: `/prompt-presets:matt-retro`). Like the other `@monolab` plugins, it should be declared in the dotfiles so every machine gets it after `chezmoi apply`.

The preset needs Matt Pocock's `retro` skill. The official marketplace pins `mattpocock-skills` at a commit that predates `retro`, so Claude Code moves to Matt's own marketplace, which ships it.

## What Changes

- Add `prompt-presets@monolab` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl`. `pabloimrik17/monolab` is already in `CC_MARKETPLACES`.
- Add `"prompt-presets@monolab": true` to `enabledPlugins` in `dot_claude/modify_settings.json.tmpl`. `extraKnownMarketplaces.monolab` (`autoUpdate: true`) is unchanged and is the plugin's only update path.
- Add the matching `claude plugin install` line to the install script's non-macOS guidance.
- Replace `mattpocock-skills@claude-plugins-official` with `mattpocock-skills@mattpocock`: register `mattpocock/skills` in `CC_MARKETPLACES` and `extraKnownMarketplaces`, swap the ID in `CC_PLUGINS`, `enabledPlugins` and the non-macOS guidance, and remove the old `enabledPlugins` key (design D4).
- Record a Claude-only row in the `sync-agent-config` parity table (`none` for Codex, OpenCode, Junie) and update the Matt Pocock row.
- Document `/prompt-presets:matt-retro` and its `retro` skill prerequisite in `docs/manual.html`, and update the Matt Pocock skills section.

`prompt-presets` is on monolab `develop` only, not yet on `main`. That is enough: `develop` is the repo's default branch, so the `monolab` marketplace already serves the plugin (design D1).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-code-plugins`: adds provisioning, enablement, update path and channel scope for `prompt-presets@monolab`, following the DATF `autonomous` requirements; moves the Matt Pocock plugin requirements from `claude-plugins-official` to the `mattpocock` marketplace.

## Impact

- **Files** (implementation): `run_onchange_install-packages.sh.tmpl`, `dot_claude/modify_settings.json.tmpl`, `.agents/skills/sync-agent-config/parity.md`, `docs/manual.html`.
- **Dependencies**: new marketplace `mattpocock/skills`. Claude Code's Matt Pocock collection follows Matt's `main`: it gains `retro`, `pr` and `implement-spec` and loses `resolving-merge-conflicts`.
- **Out of scope**: `prompt-presets` `0.1.0` cannot load `retro`, a user-only skill; the fix belongs to monolab (design D6).
- **Install script**: content change re-triggers the `run_onchange_` script on next `chezmoi apply`.
- **README**: no change (no per-plugin list).
