## ADDED Requirements

### Requirement: Fullscreen terminal rendering is the managed preference

The chezmoi-managed Claude Code user settings SHALL contain the top-level string setting `"tui": "fullscreen"`. A successful settings merge SHALL introduce this value when absent and enforce it over a different live value, under the existing `claude-settings-merge` contract.

On a supported interactive Claude Code session with these user settings loaded, no higher-precedence renderer override, and no upstream compatibility or startup-recovery fallback, the selected renderer SHALL be fullscreen.

#### Scenario: Fresh settings select fullscreen

- **WHEN** chezmoi creates Claude Code's user settings with the merge engine available
- **THEN** `~/.claude/settings.json` SHALL contain `"tui": "fullscreen"`

#### Scenario: An existing renderer preference converges

- **WHEN** the live user settings omit `tui` or set it to `"default"`
- **AND** chezmoi successfully merges the managed settings
- **THEN** the resulting top-level `tui` value SHALL be `"fullscreen"`

#### Scenario: Runtime opt-out is overwritten on apply

- **WHEN** Claude Code has saved `"tui": "default"` following a successful `/tui default` command
- **AND** chezmoi successfully applies the managed settings again
- **THEN** the saved preference SHALL return to `"fullscreen"`

#### Scenario: Unrelated runtime settings survive

- **WHEN** the live user settings contain an unmanaged preference such as `theme`
- **AND** chezmoi successfully applies the fullscreen preference
- **THEN** `tui` SHALL equal `"fullscreen"`
- **AND** the unmanaged preference SHALL retain its original value

#### Scenario: Repeated merge converges

- **WHEN** the successfully merged settings are processed again without changes
- **THEN** the second output SHALL be byte-identical to the first

#### Scenario: Supported interactive launch uses fullscreen

- **WHEN** a supported interactive Claude Code session starts with the applied user settings
- **AND** no higher-precedence renderer override or upstream fallback applies
- **THEN** `/tui` SHALL report the fullscreen renderer

## MODIFIED Requirements

### Requirement: User-preference keys are present with managed values

The chezmoi-managed settings SHALL declare the following user-preference top-level keys:

1. `alwaysThinkingEnabled`
2. `skipDangerousModePermissionPrompt`
3. `skipAutoPermissionPrompt`
4. `voiceEnabled`
5. `effortLevel`
6. `tui`

Key **order in the emitted file is no longer governed by this capability**. Under the merge contract defined by `claude-settings-merge`, the on-disk ordering is whatever the live file already uses, because Claude Code and Agent of Empires both rewrite this file and neither preserves a chezmoi-chosen order. Pinning a source order was attempted and does not survive: it produced an apply/rewrite loop rather than convergence.

What this capability now requires is presence and value, not position.

#### Scenario: All five user-preference keys are present

- **WHEN** `chezmoi apply` has run
- **THEN** `~/.claude/settings.json` SHALL contain the five existing keys (`alwaysThinkingEnabled`, `skipDangerousModePermissionPrompt`, `skipAutoPermissionPrompt`, `voiceEnabled`, and `effortLevel`), each holding its managed value

#### Scenario: All six user-preference keys are present

- **WHEN** `chezmoi apply` has run successfully with the merge engine available
- **THEN** `~/.claude/settings.json` SHALL contain all six keys above, each holding its managed value

#### Scenario: Ordering is not asserted

- **WHEN** another writer reorders the top-level keys of `~/.claude/settings.json`
- **AND** `chezmoi diff` runs
- **THEN** no difference SHALL be reported on the basis of key order alone
