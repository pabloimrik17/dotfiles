## RENAMED Requirements

- FROM: `### Requirement: User-preference keys appear in canonical order`
- TO: `### Requirement: User-preference keys are present with managed values`

## MODIFIED Requirements

### Requirement: User-preference keys are present with managed values

The chezmoi-managed settings SHALL declare the following user-preference top-level keys:

1. `alwaysThinkingEnabled`
2. `skipDangerousModePermissionPrompt`
3. `skipAutoPermissionPrompt`
4. `voiceEnabled`
5. `effortLevel`

Key **order in the emitted file is no longer governed by this capability**. Under the merge contract defined by `claude-settings-merge`, the on-disk ordering is whatever the live file already uses, because Claude Code and Agent of Empires both rewrite this file and neither preserves a chezmoi-chosen order. Pinning a source order was attempted and does not survive: it produced an apply/rewrite loop rather than convergence.

What this capability now requires is presence and value, not position.

#### Scenario: All five user-preference keys are present

- **WHEN** `chezmoi apply` has run
- **THEN** `~/.claude/settings.json` SHALL contain all five keys above, each holding its managed value

#### Scenario: Ordering is not asserted

- **WHEN** another writer reorders the top-level keys of `~/.claude/settings.json`
- **AND** `chezmoi diff` runs
- **THEN** no difference SHALL be reported on the basis of key order alone

## ADDED Requirements

### Requirement: Workflow orchestration keys are managed

The chezmoi-managed settings SHALL set `enableWorkflows` to `true` and `workflowSizeGuideline` to `"large"`.

Both keys resolve from the merged settings chain, which takes precedence over the value stored in `~/.claude.json`. Managing them here makes them reproducible on a fresh machine, which the `~/.claude.json` store cannot be: that file also holds machine-local state (install identifiers, caches, per-project history) and is not chezmoi-manageable.

#### Scenario: Workflows are enabled on a fresh machine

- **WHEN** `chezmoi apply` runs on a machine with no prior Claude Code settings
- **THEN** `~/.claude/settings.json` SHALL contain `"enableWorkflows": true`

#### Scenario: Size guideline is pinned

- **WHEN** `chezmoi apply` has run
- **THEN** `~/.claude/settings.json` SHALL contain `"workflowSizeGuideline": "large"`

#### Scenario: The guideline becomes read-only in the settings UI

- **WHEN** `workflowSizeGuideline` is present in the settings chain
- **THEN** the corresponding `/config` row SHALL be non-editable, and changing the value SHALL require editing the dotfile

#### Scenario: Neither key is lost to an apply

- **WHEN** Claude Code has written either key into the live file
- **AND** `chezmoi apply` runs
- **THEN** the key SHALL still be present afterwards
