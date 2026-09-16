## MODIFIED Requirements

### Requirement: AI features enabled

The config SHALL enable AI features via `ai.enabled = true` under the `[ai]` section. The `ai.send_cwd` key SHALL remain at its default (`false`) — only OS and shell info are transmitted.

`ai.enabled = true` matches the compiled default and would otherwise fall foul of this file's "only non-default values" convention. It is retained deliberately as a stated exception: with the separate AI init line removed, this key is the only thing keeping the `?` widget alive, so pinning it guards against an upstream default flip silently removing the binding.

The config SHALL additionally set `ai.tips = false`. The key was introduced with a compiled default of
`true`, and the tips it surfaces prompt the user to run `atuin config set`, which writes
`~/.config/atuin/config.toml` directly — a chezmoi-managed target. Accepting that prompt produces an
unmanaged edit that the next `chezmoi apply` reverts, so the value is pinned to suppress the
invitation rather than to change a preference.

#### Scenario: AI command generation available

- **WHEN** the user runs `atuin ai "find large files modified this week"`
- **THEN** atuin SHALL return a suggested command based on the user's shell history and system context

#### Scenario: No working directory sent to AI

- **WHEN** the user invokes atuin AI
- **THEN** the current working directory SHALL NOT be included in the data sent to the AI endpoint

#### Scenario: Explicit value survives an upstream default change

- **WHEN** a future atuin release changes the compiled default for `ai.enabled`
- **THEN** the managed config SHALL continue to enable AI features, and the `?` widget SHALL remain bound

#### Scenario: Tips do not invite unmanaged edits

- **WHEN** atuin runs with the managed config
- **THEN** `ai.tips` is `false`, so atuin does not prompt the user toward `atuin config set` against a
  chezmoi-managed file
