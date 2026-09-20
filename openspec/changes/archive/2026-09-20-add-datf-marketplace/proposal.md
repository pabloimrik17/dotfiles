## Why

The dotfiles do not yet provision the personal `daily-agentic-task-force` marketplace, so its provisional `datf-lab` workflows are unavailable in Claude Code on a fresh or existing machine. Registering the marketplace and its sole current plugin through the existing managed plugin path makes that lab consistently available and keeps it current as upstream releases new versions.

## What Changes

- Register `pabloimrik17/daily-agentic-task-force` in the managed Claude Code marketplace list and install `datf-lab@daily-agentic-task-force` through the existing idempotent installer loop.
- Enable `datf-lab@daily-agentic-task-force` in the chezmoi-managed Claude Code settings.
- Add the `daily-agentic-task-force` marketplace to `extraKnownMarketplaces` with `autoUpdate: true`, so Claude Code refreshes the marketplace and updates the installed plugin in the background.
- Record agent-config parity: Claude Code receives the published plugin; Codex, OpenCode, and Junie receive no counterpart because this upstream currently publishes only a Claude marketplace/plugin package, not a compatible package or managed standalone distribution for those tools.
- Document the installed lab plugin and its update path in the Claude Code section of the manual. No README change is needed for a Claude Code plugin addition.
- Classify the plugin as self-updating through Claude Code's marketplace mechanism; do not add an `update-extra` step or pin the current upstream plugin version in this repository.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-code-plugins`: Add managed installation, enablement, marketplace registration, and background-update requirements for `datf-lab@daily-agentic-task-force`.

## Impact

- `run_onchange_install-packages.sh.tmpl`: one marketplace and one plugin join the existing Claude Code dependency arrays and non-macOS manual-install summary.
- `dot_claude/modify_settings.json.tmpl`: the managed settings gain the enabled plugin and auto-updating marketplace entries while retaining merge semantics for unrelated live settings.
- `.agents/skills/sync-agent-config/parity.md`: a complete Claude Code/Codex/OpenCode/Junie mapping records the Claude-only upstream distribution and the confirmed gaps.
- `docs/manual.html`: Section 11 gains the `datf-lab` plugin's purpose, smoke-test command, provisional promotion skill, and marketplace-driven update path.
- No package dependency, README entry, `dot_zshrc.tmpl` update step, or runtime mutation outside the existing confirmed install flow is introduced.
