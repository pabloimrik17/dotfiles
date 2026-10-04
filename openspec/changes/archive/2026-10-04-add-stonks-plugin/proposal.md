## Why

The `daily-agentic-task-force` marketplace is about to publish a third plugin, `stonks`: its `/stonks:sync` command merges two former Claude Cowork tasks (sync the tracking sheets from IBKR and SWS, then clean the watchlist) into one run. The dotfiles register the marketplace but install only `datf-lab` and `autonomous`, so `stonks` would be missing on every machine until installed by hand.

## What Changes

- Add `stonks@daily-agentic-task-force` to `CC_PLUGINS` and to the non-macOS manual-install guidance. The marketplace is already registered; no new marketplace entry.
- Enable `stonks@daily-agentic-task-force` in the managed Claude Code settings.
- Rely on the existing `daily-agentic-task-force` marketplace entry (`autoUpdate: true`) for updates. No version pin, no `update-extra` step.
- Extend the parity row: Claude Code gets the plugin; Codex, OpenCode, and Junie stay `none` because upstream publishes only a Claude plugin.
- Document `/stonks:sync` and its `--only sources|watchlist` flag in the manual's Claude Code section, and name what the command needs at runtime and which dotfiles changes provide it.
- Ordering constraint: this change MUST merge only after the `stonks` plugin is published in the marketplace (the upstream plugin PR merged and its first release cut). Before that, `claude plugin install stonks@daily-agentic-task-force` fails on `chezmoi apply`.
- Out of scope, owned by sibling changes: the encrypted `~/.config/stonks/config.json` (`add-plugin-configs`), and `googleworkspace-cli` (`gws`), the `ibkr` MCP server, and its permission deny (`add-stonks-tooling`). The plugin installs without them; the command needs them to be useful.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-code-plugins`: add provisioning, enablement, update, and channel-scope requirements for `stonks@daily-agentic-task-force`.

## Impact

- `run_onchange_install-packages.sh.tmpl`: one `CC_PLUGINS` entry and one non-macOS guidance line.
- `dot_claude/modify_settings.json.tmpl`: one `enabledPlugins` entry.
- `.agents/skills/sync-agent-config/parity.md`: the Daily Agentic Task Force row lists all three plugins.
- `docs/manual.html`: the Daily Agentic Task Force subsection of Section 11 covers `stonks`.
- No README change, new dependency, cask, or shell change.
- Cross-repo: upstream change `add-stonks-plugin` in `daily-agentic-task-force` (must be released first); dotfiles siblings `add-plugin-configs` and `add-stonks-tooling` (any order relative to this one; the upstream plugin PR merges after both).
