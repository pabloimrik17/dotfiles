# Spec Delta: gh-dash-keybindings

## ADDED Requirements

### Requirement: Retired Claude PR shortcuts

The custom PR keybindings SHALL NOT assign `b`, `B`, `i`, or `I` to launch Claude or switch to a PR worktree.

#### Scenario: Removed keys are absent from custom PR bindings

- **WHEN** the configured gh-dash PR keybindings are inspected
- **THEN** no custom entry has key `b`, `B`, `i`, or `I`

## MODIFIED Requirements

### Requirement: Lowercase/uppercase pattern for direct/tmux variants

All custom PR keybindings that have both a direct and tmux variant SHALL use lowercase for direct execution and uppercase for the tmux variant of the same action. AoE keybindings SHALL remain exempt: their queue and background lifecycle operations do not take over the terminal and have no tmux variant. Instead, `f` queues or reuses a normal session and `F` starts or resumes a review-team session.

#### Scenario: Pattern is consistent across interactive custom PR keybindings

- **WHEN** inspecting the keybindings config
- **THEN** `t`/`T` (CI checks) and `z`/`Z` (tuicr review) follow lowercase=direct and uppercase=tmux

#### Scenario: AoE queue keybindings use the session/review convention

- **WHEN** inspecting the `f` and `F` keybindings
- **THEN** `f` queues or reuses a normal AoE session and `F` starts or resumes an AoE review-team session
- **AND** neither has a tmux variant

## REMOVED Requirements

### Requirement: PR code review keybinding (direct)

**Reason**: The custom `b` shortcut is being removed.
**Migration**: Start Claude review outside gh-dash or use the existing `F` AoE review-team shortcut.

#### Scenario: Former direct review binding

- **WHEN** the retired `b` binding is considered
- **THEN** gh-dash no longer provides its custom Claude review command

### Requirement: PR worktree + Claude keybinding (direct)

**Reason**: The custom `i` shortcut is being removed.
**Migration**: Open the PR worktree and Claude from the shell, or use the existing `f` AoE session shortcut.

#### Scenario: Former direct worktree binding

- **WHEN** the retired `i` binding is considered
- **THEN** gh-dash no longer provides its custom Worktrunk and Claude command

### Requirement: PR code review keybinding (tmux)

**Reason**: The custom `B` shortcut is being removed.
**Migration**: Start Claude review in tmux manually or use the existing `F` AoE review-team shortcut.

#### Scenario: Former tmux review binding

- **WHEN** the retired `B` binding is considered
- **THEN** gh-dash no longer provides its custom Claude review tmux command

### Requirement: PR worktree + Claude keybinding (tmux)

**Reason**: The custom `I` shortcut is being removed.
**Migration**: Open the PR worktree and Claude in tmux manually, or use the existing `f` AoE session shortcut.

#### Scenario: Former tmux worktree binding

- **WHEN** the retired `I` binding is considered
- **THEN** gh-dash no longer provides its custom Worktrunk and Claude tmux command

### Requirement: RepoPath passed to worktrunk via -C flag

**Reason**: The only custom keybindings that directly invoked `wt -C` were the four removed shortcuts.
**Migration**: No replacement config command is needed; the existing AoE helper retains its own worktree handoff.

#### Scenario: No direct Worktrunk shortcut remains

- **WHEN** the remaining custom PR keybindings are inspected
- **THEN** none directly invokes `wt -C` to launch Claude

### Requirement: Keybinding payloads are verified by invocation, not by inspection

**Reason**: The only custom keybindings that passed Claude arguments through `wt -x` were the four removed shortcuts.
**Migration**: Continue to verify any future `wt -x` binding by invocation if one is introduced.

#### Scenario: No Worktrunk argv payload remains

- **WHEN** the remaining custom PR keybindings are inspected
- **THEN** none passes a program and arguments through `wt -x`
