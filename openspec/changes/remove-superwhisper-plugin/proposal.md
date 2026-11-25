# Proposal

## Why

The SuperWhisper agent plugins are no longer wanted. The dictation app stays; its Claude Code, Codex and OpenCode plugins go. The dotfiles provision the Claude Code plugin on Apple Silicon. Superwhisper's own installers, or its in-app agent setup, can add the other two by hand. Dropping provisioning alone would leave every installed copy in place.

## What Changes

- Stop provisioning the Claude Code plugin. Drop the `superwhisper@superwhisper` entry from `enabledPlugins` and the `superwhisper` marketplace from `extraKnownMarketplaces` in `dot_claude/modify_settings.json.tmpl`. Drop the arm64-gated upstream-installer step (Group 8.25) from `run_onchange_install-packages.sh.tmpl`.
- Drop the two superwhisper entries from the settings merge's `REMOVE` list. The CLI cleanup below deletes both keys (verified on Claude Code 2.1.332), so nothing needs to keep stripping them.
- Add `run_once_after_remove-superwhisper-agent-plugins.sh.tmpl`, a darwin-only script that chezmoi runs once per machine. If an agent has the plugin, the script removes it with that agent's CLI:
  - Claude Code: `claude plugin uninstall superwhisper@superwhisper`, `claude plugin marketplace remove superwhisper`
  - Codex: `codex plugin remove superwhisper@superwhisper`, `codex plugin marketplace remove superwhisper`
  - OpenCode: `opencode plugin remove @superwhisper/opencode`
- Keep the `superwhisper` cask in `ALL_CASKS`. The app is untouched.
- **BREAKING** for Apple Silicon Macs: the Claude Code plugin is uninstalled and is not reinstalled.

## Capabilities

### New Capabilities

- `agent-plugin-retirement`: removing a retired plugin, once, from every agent CLI on machines that already have it. Covers detection, the uninstall commands, idempotency and how failures surface.

### Modified Capabilities

- `claude-code-plugins`: removes the three SuperWhisper requirements: enabled on Apple Silicon, marketplace registered on Apple Silicon, installed via the upstream installer.

## Impact

- **Files**: `dot_claude/modify_settings.json.tmpl`, `run_onchange_install-packages.sh.tmpl`, a new `run_once_after_remove-superwhisper-agent-plugins.sh.tmpl`, a new test under `tests/`.
- **Unchanged**: the `superwhisper` cask and the `gui-app-install` spec. `opencode.jsonc` is unchanged too: OpenCode 2 writes added plugins into it, and chezmoi already owns that file whole.
- **Dependencies**: no more calls to `https://superwhisper.com/install-claude-code.sh`. The cleanup needs `jq`, which the install script already provides.
- **Out of scope**: Pi, whose upstream installer returns 404. Also a plugin the user reinstalls later from the Superwhisper app. That is their choice, and the one-shot script does not fight it.
