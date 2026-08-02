## Why

`dot_config/opencode/opencode.jsonc` omits `autoupdate`, so OpenCode relies on an implicit default. The install path deliberately uses the official script (not Homebrew) so built-in auto-update works; declaring `"autoupdate": true` makes that intent explicit and version-controlled.

## What Changes

- Add top-level `"autoupdate": true` to `dot_config/opencode/opencode.jsonc`
- Update the `opencode-user-config` requirement that currently says settings where OpenCode's default is sufficient (e.g. `autoupdate`) SHALL NOT be present — reverse that for `autoupdate` and require the explicit `true` value
- Drop the stale "SHALL NOT contain MCP server configuration" clause from that same requirement: `mcp-global-config` has required a global `expect` entry in this file since `add-expect-cli` (2026-04-10) and the deployed config has carried it since, so the prohibition was dead text contradicting it

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `opencode-user-config`: Require explicit `"autoupdate": true` in the managed OpenCode main config; remove the exclusion that treated `autoupdate` as an omit-because-default setting, and hand `mcp` ownership to `mcp-global-config` instead of forbidding it

## Impact

- **Config**: `dot_config/opencode/opencode.jsonc` (chezmoi → `~/.config/opencode/opencode.jsonc`)
- **Spec**: `openspec/specs/opencode-user-config/spec.md`
- **Runtime**: OpenCode continues auto-updating when installed via official script to `~/.opencode/bin` (unchanged install path; config now matches that decision)
- **Apply**: `chezmoi apply` deploys the key; OpenCode must start without schema warnings
