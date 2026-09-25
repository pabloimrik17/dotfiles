## Why

The `daily-agentic-task-force` marketplace now publishes a second plugin, `autonomous` (1.0.0): the entry point of the autonomous loop, whose `/autonomous:run` command runs a Claude quota gate backed by OpenUsage. The dotfiles register the marketplace but install only `datf-lab`, so `autonomous` is missing on every machine until it is installed by hand.

## What Changes

- Add `autonomous@daily-agentic-task-force` to `CC_PLUGINS` and to the non-macOS manual-install guidance. The marketplace is already registered; no new marketplace entry.
- Enable `autonomous@daily-agentic-task-force` in the managed Claude Code settings.
- Rely on the existing `daily-agentic-task-force` marketplace entry (`autoUpdate: true`) for updates. No version pin, no `update-extra` step.
- Extend the parity row: Claude Code gets the plugin; Codex, OpenCode, and Junie stay `none` because upstream publishes only a Claude plugin.
- Document `/autonomous:run`, its flags and exit codes, and its runtime requirements (`bun`, and the `openusage` CLI installed manually) in the manual's Claude Code section.
- Out of scope: installing OpenUsage (cask, CLI symlink, or `PATH` entry). Without it, the gate reports `not-evaluable`; it never passes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-code-plugins`: add provisioning, enablement, update, and channel-scope requirements for `autonomous@daily-agentic-task-force`.

## Impact

- `run_onchange_install-packages.sh.tmpl`: one `CC_PLUGINS` entry and one non-macOS guidance line.
- `dot_claude/modify_settings.json.tmpl`: one `enabledPlugins` entry.
- `.agents/skills/sync-agent-config/parity.md`: the Daily Agentic Task Force row lists both plugins.
- `docs/manual.html`: the Daily Agentic Task Force subsection of Section 11 covers `autonomous`.
- No README change, new dependency, cask, or shell change.
