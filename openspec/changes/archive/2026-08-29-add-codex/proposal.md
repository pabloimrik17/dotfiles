## Why

The dotfiles setup does not install or document OpenAI Codex, and its agent-configuration parity workflow currently covers only Claude Code, OpenCode, and Junie. Adding Codex through the existing shared installation and skill conventions makes it available without introducing a parallel configuration system.

## What Changes

- Install Codex with OpenAI's standalone installer, including idempotent detection, safe migration from package-manager installations, and non-fatal failure handling.
- Treat Codex as self-updating and document its installation, authentication, update, completion, instruction, and skill-discovery workflows.
- Extend the agent-configuration synchronization skill and parity table from three tools to Claude Code, Codex, OpenCode, and Junie.
- Declare `.agents/skills` as Codex's canonical repository skill source and `~/.agents/skills` as its canonical user skill source, without creating Codex-specific skill copies.
- Reconcile the web and print manual section counts while adding Codex and retaining Agent Sessions as the final section.
- Update the README to list Codex among the installed and self-updating AI tools.
- Leave Codex MCP registrations and managed `~/.codex` preferences out of scope until concrete cross-tool mappings are selected.

## Capabilities

### New Capabilities

- `codex-install`: Install, migrate, verify, and document the standalone Codex CLI while preserving its runtime state and self-update behavior.

### Modified Capabilities

- `sync-agent-config-skill`: Include Codex in user-scope configuration parity analysis, proposals, gap reporting, and the four-tool parity table.
- `repo-skill-canonical-layout`: Define direct Codex discovery of canonical repository skills under `.agents/skills` without Codex-specific duplicates.
- `slidev-skill-install`: Make the canonical global Slidev skill directly available to Codex as well as through Claude Code's compatibility link.
- `update-manual-skill`: Detect Codex installation and configuration changes and map them to the Codex manual section.
- `manual-web`: Add Codex as Section 13, move Agent Sessions to Section 14, and reconcile navigation and section-count requirements.
- `manual-print`: Require the print layout to include all 14 manual sections.

## Impact

- Installation changes affect `run_onchange_install-packages.sh.tmpl` and its manual fallback output; the existing `~/.local/bin` PATH handling is reused.
- Agent parity changes affect `.agents/skills/sync-agent-config/`, its evals, and related command-facing copies where applicable.
- Documentation changes affect `README.md`, `docs/manual.html`, and the update-manual skill/command surfaces.
- Existing Codex runtime data under `~/.codex` remains unmanaged, and generator-owned project output under `.codex/skills` remains untouched.
