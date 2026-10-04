# Add prompt-presets plugin

## Why

MonoLab now ships `prompt-presets`, a Claude Code plugin that packages curated third-party prompts verbatim as slash commands (today: `/prompt-presets:matt-retro`). Like the other `@monolab` plugins, it should be declared in the dotfiles so every machine gets it after `chezmoi apply`.

## What Changes

- Add `prompt-presets@monolab` to `CC_PLUGINS` in `run_onchange_install-packages.sh.tmpl`. `CC_MARKETPLACES` is unchanged: `pabloimrik17/monolab` is already registered.
- Add `"prompt-presets@monolab": true` to `enabledPlugins` in `dot_claude/modify_settings.json.tmpl`. `extraKnownMarketplaces.monolab` (`autoUpdate: true`) is unchanged and is the plugin's only update path.
- Add the matching `claude plugin install` line to the install script's non-macOS guidance.
- Record a Claude-only row in the `sync-agent-config` parity table (`none` for Codex, OpenCode, Junie).
- Document `/prompt-presets:matt-retro` and its `retro` skill prerequisite in `docs/manual.html`.

`prompt-presets` is on monolab `develop` only, not yet on `main`. That is enough: `develop` is the repo's default branch, so the `monolab` marketplace already serves the plugin (design D1).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-code-plugins`: adds provisioning, enablement, update path and channel scope for `prompt-presets@monolab`, following the DATF `autonomous` requirements.

## Impact

- **Files** (implementation): `run_onchange_install-packages.sh.tmpl`, `dot_claude/modify_settings.json.tmpl`, `.agents/skills/sync-agent-config/parity.md`, `docs/manual.html`.
- **Dependencies**: none new. The preset's `retro` skill comes from `mattpocock-skills@claude-plugins-official`, already enabled; its marketplace pin predates `retro` (design D4).
- **Install script**: content change re-triggers the `run_onchange_` script on next `chezmoi apply`.
- **README**: no change (no per-plugin list).
