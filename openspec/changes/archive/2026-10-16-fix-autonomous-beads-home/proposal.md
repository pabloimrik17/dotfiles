# Proposal

## Why

The autonomous plugin's encrypted configuration preserves an absolute Beads path from its original machine, so applying it under a different home directory silently points at the wrong location ([issue #229](https://github.com/pabloimrik17/dotfiles/issues/229)). Resolve the home directory when chezmoi renders the configuration while retaining encrypted storage and private deployment.

## What Changes

- Convert the autonomous configuration to an age-encrypted chezmoi template, deriving `sources.beads.directory` from `.chezmoi.homeDir` and retaining the `WebstormProjects/agentic-task` suffix requested in the issue.
- Preserve all other configuration values, the plugin's default target path, mode 600, and the existing failure behavior without an age identity. Keep stonks as a non-template encrypted file.
- Update source-name expectations and add regression coverage for rendering under different home directories.
- Clarify the plugin-configs contract: encrypted templates are permitted, rendering precedes deployment, and plugin schema validation remains the plugin's responsibility.
- Correct the manual's edit flow to identify each encrypted source and explain the autonomous template and per-machine verification.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `plugin-configs`: Support the autonomous encrypted template, resolve the Beads directory against the applying machine's home, and document editing and verification without weakening encryption or deployment guarantees.

## Impact

- Rename `dot_config/autonomous/encrypted_private_config.json.age` to `dot_config/autonomous/encrypted_private_config.json.tmpl.age` and update its encrypted contents during implementation.
- Update `tests/plugin-configs.test.ts` and the encrypted plugin configuration subsection of `docs/manual.html`.
- No new dependency or plugin loader change. README's generic `.age` instructions remain applicable; no tool installation or agent-client configuration changes are required.
- Acceptance requires checking the actual directory and clean post-apply diff on each machine. This change does not provision or clone the Beads repository, and remote-machine acceptance cannot be inferred from local tests.
