## Why

The OpenCode Superpowers setup still uses a hand-built clone-and-symlink flow that predates Obra's official OpenCode installation method. Moving to the upstream git-backed plugin registration lets OpenCode own installation and skill discovery while eliminating unmanaged legacy paths that can load a duplicate or stale copy.

## What Changes

- Register `superpowers@git+https://github.com/obra/superpowers.git` in the chezmoi-managed global OpenCode plugin array, as prescribed by Obra's official OpenCode installation guide.
- Remove the Superpowers clone and symlink setup from the interactive install script while retaining the unrelated Plannotator dependency installation.
- Remove the old plugin symlink, skills symlink, and cloned repository from existing machines during `chezmoi apply` so only the official plugin-manager installation remains.
- Keep Claude Code's marketplace-based Superpowers installation separate and record the harness-specific OpenCode mapping and Junie gap in the agent-config parity table.
- Document and verify the new installation, including the required OpenCode restart and native skill discovery check.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opencode-user-config`: The managed plugin set gains the official git-backed Superpowers package, and applying the dotfiles removes the obsolete symlink-based installation.

## Impact

- OpenCode user config: `dot_config/opencode/opencode.jsonc`
- Interactive bootstrap and migration cleanup: `run_onchange_install-packages.sh.tmpl` and `.chezmoiremove`
- Cross-agent configuration parity: `.agents/skills/sync-agent-config/parity.md`; Claude Code configuration remains unchanged
- User documentation: OpenCode plugin inventory in `docs/manual.html`; no README change is expected because the bootstrap command and major tool inventory remain unchanged
- Runtime behavior: OpenCode installs Superpowers through its plugin manager after restart and exposes its skills through the native `skill` tool
