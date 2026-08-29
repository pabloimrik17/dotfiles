## Why

Superpowers installation is harness-specific: OpenCode still uses a hand-built clone-and-symlink flow that predates Obra's official package, while Codex is not yet covered by the official plugin marketplace workflow. Aligning each harness with its supported upstream mechanism avoids unmanaged copies and makes skill discovery explicit.

## What Changes

- Register `superpowers@git+https://github.com/obra/superpowers.git` in the chezmoi-managed global OpenCode plugin array, as prescribed by Obra's official OpenCode installation guide.
- Remove the Superpowers clone and symlink setup from the interactive install script while retaining the unrelated Plannotator dependency installation.
- Remove the old plugin symlink, skills symlink, and cloned repository from existing machines during `chezmoi apply` so only the official plugin-manager installation remains.
- Install and enable Superpowers for Codex through OpenAI's official plugin marketplace, using the Codex App Plugins UI or the interactive `/plugins` command, and verify skill discovery in a fresh Codex session.
- Treat Codex's account-backed plugin state and `~/.codex/plugins/cache` as Codex-owned runtime state rather than chezmoi-managed configuration.
- Keep Claude Code's marketplace-based Superpowers installation separate, preserve the existing OpenCode/Claude/Junie parity record, and document Codex's distinct marketplace workflow.
- Document and verify both official installations, including fresh OpenCode and Codex runtime checks.

## Capabilities

### New Capabilities

- `codex-plugins`: Codex users install Superpowers from the official plugin marketplace and verify that a fresh runtime discovers its bundled skills without chezmoi managing Codex's plugin state.

### Modified Capabilities

- `opencode-user-config`: The managed plugin set gains the official git-backed Superpowers package, and applying the dotfiles removes the obsolete symlink-based installation.

## Impact

- OpenCode user config: `dot_config/opencode/opencode.jsonc`
- Interactive bootstrap and migration cleanup: `run_onchange_install-packages.sh.tmpl` and `.chezmoiremove`
- Codex plugin marketplace and account-backed installation state; no files under `~/.codex` or its plugin cache become chezmoi-managed
- Cross-agent configuration parity: `.agents/skills/sync-agent-config/parity.md`; Claude Code configuration remains unchanged
- User documentation: OpenCode plugin inventory and Codex marketplace workflow in `docs/manual.html`; no README change is expected because the bootstrap command and major tool inventory remain unchanged
- Runtime behavior: OpenCode installs Superpowers through its plugin manager after restart, while a fresh Codex session discovers the marketplace plugin's bundled skills
