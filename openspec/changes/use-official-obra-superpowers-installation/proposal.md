## Why

Superpowers installation is harness-specific: OpenCode still uses a hand-built clone-and-symlink flow that predates Obra's official package, while Codex has the official curated plugin available but not activated. Aligning each harness with its supported upstream mechanism avoids unmanaged copies and makes skill discovery explicit.

## What Changes

- Register `superpowers@git+https://github.com/obra/superpowers.git` in the chezmoi-managed global OpenCode plugin array, as prescribed by Obra's official OpenCode installation guide.
- Remove the Superpowers clone and symlink setup from the interactive install script while retaining the unrelated Plannotator dependency installation.
- Remove the old plugin symlink, skills symlink, and cloned repository from existing machines during `chezmoi apply` so only the official plugin-manager installation remains.
- Install and enable Superpowers for Codex through OpenAI's built-in `openai-curated` marketplace with `codex plugin add superpowers@openai-curated`; the Codex App Plugins UI and interactive `/plugins` browser remain supported alternatives.
- Treat Codex's per-environment plugin installation and cache as Codex-owned local runtime state rather than chezmoi-managed configuration.
- Keep Claude Code's marketplace-based Superpowers installation separate, extend the cross-agent parity record to Codex's official marketplace plugin, and retain Junie as a documented gap.
- Document and verify both official installations, including fresh OpenCode and Codex runtime checks.

## Capabilities

### New Capabilities

- `codex-plugins`: Codex users install Superpowers from the built-in curated marketplace and verify that a fresh runtime discovers its bundled skills without chezmoi managing Codex's plugin state.

### Modified Capabilities

- `opencode-user-config`: The managed plugin set gains the official git-backed Superpowers package, and applying the dotfiles removes the obsolete symlink-based installation.
- `sync-agent-config-skill`: The parity workflow and table gain Codex as a first-class target alongside Claude Code, OpenCode, and Junie, including explicit mappings or gaps for every capability.

## Impact

- OpenCode user config: `dot_config/opencode/opencode.jsonc`
- Interactive bootstrap and migration cleanup: `run_onchange_install-packages.sh.tmpl` and `.chezmoiremove`
- Codex's per-environment plugin installation state; no files under `~/.codex` or its plugin cache become chezmoi-managed
- Cross-agent configuration parity: `.agents/skills/sync-agent-config/SKILL.md`, `parity.md`, and `evals/evals.json`; Claude Code configuration remains unchanged and Codex plugin state remains runtime-owned
- User documentation: OpenCode plugin inventory and Codex marketplace workflow in `docs/manual.html`; no README change is expected because the bootstrap command and major tool inventory remain unchanged
- Runtime behavior: OpenCode installs Superpowers through its plugin manager after restart, while a fresh Codex session discovers the marketplace plugin's bundled skills
