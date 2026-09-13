## Why

Claude Code's terminal renderer is not declared in the dotfiles, so its startup mode depends on each machine's saved state and upstream defaults. Managing the fullscreen preference makes the intended terminal experience reproducible through chezmoi.

## What Changes

- Add the supported top-level setting `"tui": "fullscreen"` to the Claude Code managed preferences in `dot_claude/modify_settings.json.tmpl`.
- Use the existing settings merge to introduce or enforce the preference while preserving unrelated live settings and idempotence.
- Document fullscreen activation, renderer inspection, transcript navigation, and how temporary or persistent opt-outs interact with chezmoi in Section 11 of `docs/manual.html`.
- Record the fullscreen capability's correspondence across Claude Code, Codex, OpenCode, and Junie using the agent-config parity workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `claude-user-preferences`: Add fullscreen rendering to the managed user preferences and their presence contract.
- `manual-web`: Require the Claude Code section to explain the managed renderer and the relevant controls and recovery path.

## Impact

- Configuration: `dot_claude/modify_settings.json.tmpl`, materializing `~/.claude/settings.json`; no new dependency or installer change.
- Documentation: `docs/manual.html` and `.agents/skills/sync-agent-config/parity.md`.
- Existing contracts: `claude-settings-merge` continues to govern preservation, enforcement, fallback, and ordering; its requirements do not change.
- User-visible effect: subsequent supported interactive Claude Code launches select fullscreen unless an upstream override or compatibility fallback applies. The next successful `chezmoi apply` restores `"fullscreen"` after a runtime change to `"default"`.
- This change does not require shell aliases, global renderer environment variables, terminal configuration changes, or changes to other agents' runtime state.

The setting and renderer controls are documented in [Claude Code's fullscreen guide](https://code.claude.com/docs/en/fullscreen). Implementation details, evidence, and the documentation proposal belong in `design.md`.
